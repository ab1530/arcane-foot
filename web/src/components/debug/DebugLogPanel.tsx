"use client";

import { useEffect, useMemo, useState } from "react";
import { logger, LogEntry, LogLevel } from "@/lib/logger";
import { cn } from "@/lib/utils";

const LOG_STORAGE_KEY = "arcane_debug_logs";
const NETWORK_LOG_KEY = "arcane_debug_network";
const TRACE_EXACT_KEY = "arcane_debug_trace_exact";
const LEVEL_FILTER_KEY = "arcane_debug_level_filter";
const SCOPE_FILTER_KEY = "arcane_debug_scope_filter";
const MAX_VIEW = 300;

const getDebugFlag = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const queryEnabled = params.get("debug") === "1";
  if (queryEnabled) {
    localStorage.setItem(LOG_STORAGE_KEY, "1");
  }
  const storedEnabled = localStorage.getItem(LOG_STORAGE_KEY) === "1";
  const envEnabled = process.env.NEXT_PUBLIC_DEBUG_LOGS === "true";
  return queryEnabled || storedEnabled || envEnabled;
};

const getNetworkFlag = () => {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(NETWORK_LOG_KEY);
  if (stored === null) return true;
  return stored === "1";
};

const setNetworkFlag = (value: boolean) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(NETWORK_LOG_KEY, value ? "1" : "0");
  }
};

const getTraceExactFlag = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TRACE_EXACT_KEY) === "1";
};

const setTraceExactFlag = (value: boolean) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TRACE_EXACT_KEY, value ? "1" : "0");
  }
};

const getStoredLevelFilter = (): LogLevel | "all" => {
  if (typeof window === "undefined") return "all";
  const stored = localStorage.getItem(LEVEL_FILTER_KEY);
  if (!stored) return "all";
  if (stored === "all") return "all";
  if (stored === "debug" || stored === "info" || stored === "warn" || stored === "error") {
    return stored;
  }
  return "all";
};

const setStoredLevelFilter = (value: LogLevel | "all") => {
  if (typeof window !== "undefined") {
    localStorage.setItem(LEVEL_FILTER_KEY, value);
  }
};

const getStoredScopeFilter = () => {
  if (typeof window === "undefined") return "all";
  return localStorage.getItem(SCOPE_FILTER_KEY) || "all";
};

const setStoredScopeFilter = (value: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(SCOPE_FILTER_KEY, value);
  }
};

const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();

export function DebugLogPanel() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [levelFilter, setLevelFilterState] = useState<LogLevel | "all">("all");
  const [scopeFilter, setScopeFilterState] = useState<string>("all");
  const [traceFilter, setTraceFilter] = useState<string>("");
  const [traceExact, setTraceExact] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [networkEnabled, setNetworkEnabled] = useState(true);

  useEffect(() => {
    const isEnabled = getDebugFlag();
    setEnabled(isEnabled);
    if (isEnabled) {
      logger.setLevel("debug");
      logger.setEnabled(true);
      const networkFlag = getNetworkFlag();
      logger.setFlag("network", networkFlag);
      setNetworkEnabled(networkFlag);
      setTraceExact(getTraceExactFlag());
      setLevelFilterState(getStoredLevelFilter());
      setScopeFilterState(getStoredScopeFilter());
      setLogs(logger.getLogs());
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = logger.subscribe((entry) => {
      setLogs((prev) => [...prev, entry].slice(-MAX_VIEW));
    });
    return () => {
      // Ignore any return value from the underlying unsubscribe implementation.
      unsubscribe();
    };
  }, [enabled]);

  const scopes = useMemo(() => {
    const items = new Set(logs.map((log) => log.scope));
    return ["all", ...Array.from(items).sort()];
  }, [logs]);

  const traceIds = useMemo(() => {
    const items = new Set(logs.map((log) => log.traceId));
    return Array.from(items).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter !== "all" && log.level !== levelFilter) return false;
      if (scopeFilter !== "all" && log.scope !== scopeFilter) return false;
      if (traceFilter) {
        const normalized = traceFilter.trim();
        if (!normalized) return true;
        if (traceExact && log.traceId !== normalized) return false;
        if (!traceExact && !log.traceId.includes(normalized)) return false;
      }
      return true;
    });
  }, [logs, levelFilter, scopeFilter, traceFilter, traceExact]);

  const handleCopy = async () => {
    const replacer = (_key: string, value: unknown) => {
      if (value instanceof Error) {
        return { message: value.message, stack: value.stack };
      }
      return value;
    };
    const lines = filteredLogs.map((entry) => {
      const route = entry.route ? ` ${entry.route}` : "";
      const ctx = entry.context ? ` ${JSON.stringify(entry.context, replacer)}` : "";
      return `[${entry.level.toUpperCase()}][${entry.scope}][${entry.traceId}]${route} ${entry.message}${ctx}`;
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      // Ignore clipboard errors
    }
  };

  const handleDownload = () => {
    const replacer = (_key: string, value: unknown) => {
      if (value instanceof Error) {
        return { message: value.message, stack: value.stack };
      }
      return value;
    };
    const lines = filteredLogs.map((entry) => {
      const route = entry.route ? ` ${entry.route}` : "";
      const ctx = entry.context ? ` ${JSON.stringify(entry.context, replacer)}` : "";
      return `[${entry.level.toUpperCase()}][${entry.scope}][${entry.traceId}]${route} ${entry.message}${ctx}`;
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `arcane-debug-${new Date().toISOString().replace(/[:.]/g, "-")}.log`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDisable = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOG_STORAGE_KEY);
    }
    setEnabled(false);
    setOpen(false);
  };

  const toggleNetwork = () => {
    const next = !networkEnabled;
    setNetworkEnabled(next);
    setNetworkFlag(next);
    logger.setFlag("network", next);
  };

  if (!enabled) return null;

  return (
    <div className="fixed z-[9999] bottom-4 right-4 text-xs font-mono">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-md border border-arcane-accent/40 bg-arcane-dark/90 px-3 py-2 text-arcane-accent shadow-lg"
      >
        {open ? "Close Logs" : "Debug Logs"}
      </button>

      {open && (
        <div className="mt-2 w-[360px] max-h-[60vh] overflow-hidden rounded-lg border border-arcane-darkBorder bg-arcane-black/95 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-arcane-darkBorder">
            <span className="text-arcane-grey">Log Stream</span>
            <div className="flex items-center gap-2">
              <select
                value={levelFilter}
                onChange={(event) => {
                  const next = event.target.value as LogLevel | "all";
                  setLevelFilterState(next);
                  setStoredLevelFilter(next);
                }}
                className="bg-arcane-dark text-arcane-grey border border-arcane-darkBorder rounded px-2 py-1 text-xs"
              >
                <option value="all">all</option>
                <option value="debug">debug</option>
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="error">error</option>
              </select>
              <select
                value={scopeFilter}
                onChange={(event) => {
                  const next = event.target.value;
                  setScopeFilterState(next);
                  setStoredScopeFilter(next);
                }}
                className="bg-arcane-dark text-arcane-grey border border-arcane-darkBorder rounded px-2 py-1 text-xs"
              >
                {scopes.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input
                  list="trace-id-options"
                  value={traceFilter}
                  onChange={(event) => setTraceFilter(event.target.value)}
                  placeholder="traceId"
                  className="bg-arcane-dark text-arcane-grey border border-arcane-darkBorder rounded px-2 py-1 text-xs w-24"
                />
                <label className="flex items-center gap-1 text-arcane-grey/80 text-[10px] uppercase tracking-wide">
                  <input
                    type="checkbox"
                    checked={traceExact}
                    onChange={(event) => {
                      setTraceExact(event.target.checked);
                      setTraceExactFlag(event.target.checked);
                    }}
                    className="accent-arcane-accent"
                  />
                  Exact
                </label>
                <datalist id="trace-id-options">
                  {traceIds.map((traceId) => (
                    <option key={traceId} value={traceId} />
                  ))}
                </datalist>
              </div>
              <button
                type="button"
                onClick={() => {
                  logger.clearLogs();
                  setLogs([]);
                }}
                className="px-2 py-1 rounded border border-arcane-darkBorder text-arcane-grey"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2 py-1 rounded border border-arcane-darkBorder text-arcane-grey"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-2 py-1 rounded border border-arcane-darkBorder text-arcane-grey"
              >
                Download
              </button>
              <button
                type="button"
                onClick={toggleNetwork}
                className={cn(
                  "px-2 py-1 rounded border",
                  networkEnabled
                    ? "border-arcane-accent/40 text-arcane-accent"
                    : "border-arcane-darkBorder text-arcane-grey"
                )}
              >
                Network
              </button>
              <button
                type="button"
                onClick={handleDisable}
                className="px-2 py-1 rounded border border-red-500/40 text-red-400"
              >
                Disable
              </button>
            </div>
          </div>

          <div className="max-h-[50vh] overflow-auto px-3 py-2 space-y-2">
            {filteredLogs.length === 0 && (
              <div className="text-arcane-grey/70">No logs yet.</div>
            )}
            {filteredLogs.map((entry) => (
              <div key={entry.id} className="space-y-1 border-b border-arcane-darkBorder/60 pb-2">
                {entry.context?.requestId && (
                  <div className="text-arcane-grey/70">
                    requestId: {String(entry.context.requestId)}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "uppercase",
                      entry.level === "error" && "text-red-400",
                      entry.level === "warn" && "text-yellow-400",
                      entry.level === "info" && "text-arcane-accent",
                      entry.level === "debug" && "text-arcane-grey"
                    )}
                  >
                    {entry.level}
                  </span>
                  <span className="text-arcane-grey">{formatTime(entry.ts)}</span>
                  <span className="text-arcane-grey/80">{entry.scope}</span>
                </div>
                <div className="text-arcane-grey">{entry.message}</div>
                {entry.route && <div className="text-arcane-grey/70">route: {entry.route}</div>}
                {entry.context && (
                  <pre className="text-arcane-grey/70 whitespace-pre-wrap">
                    {JSON.stringify(entry.context, null, 2)}
                  </pre>
                )}
                {entry.stack && (
                  <details className="text-arcane-grey/70">
                    <summary className="cursor-pointer">stack</summary>
                    <pre className="whitespace-pre-wrap">{entry.stack}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
