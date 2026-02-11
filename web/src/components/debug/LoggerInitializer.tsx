"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logger } from "@/lib/logger";

const NETWORK_LOG_KEY = "arcane_debug_network";
let fetchPatched = false;

const getNetworkFlag = () => {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(NETWORK_LOG_KEY);
  if (stored === null) return true;
  return stored === "1";
};

const isNoiseUrl = (url: string) => {
  if (!url) return true;
  if (url.startsWith("data:") || url.startsWith("chrome-extension:")) return true;
  if (url.includes("/_next/") || url.includes("/favicon")) return true;
  return /\.(png|jpg|jpeg|gif|svg|ico|css|js|map|woff2?|ttf|otf)(\?|$)/i.test(url);
};

const patchFetch = () => {
  if (fetchPatched || typeof window === "undefined" || typeof window.fetch !== "function") {
    return;
  }
  fetchPatched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit & { __arcaneLog?: boolean }) => {
    const requestId = logger.createRequestId();
    const method =
      (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const shouldLogNetwork =
      logger.getEnabled() &&
      logger.getFlag("network", getNetworkFlag()) &&
      init?.__arcaneLog !== false &&
      !isNoiseUrl(url);
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (shouldLogNetwork) {
      logger.debug("Fetch start", {
        scope: "Network",
        method,
        url,
        requestId,
      });
    }

    try {
      const response = await originalFetch(input, init);
      const duration = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start;

      if (shouldLogNetwork) {
        logger.info("Fetch complete", {
          scope: "Network",
          method,
          url,
          status: response.status,
          duration: Math.round(duration),
          requestId,
        });
      }

      return response;
    } catch (error) {
      const duration = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start;
      if (shouldLogNetwork) {
        logger.error("Fetch failed", error as Error, {
          scope: "Network",
          method,
          url,
          duration: Math.round(duration),
          requestId,
        });
      }
      throw error;
    }
  };
};

export function LoggerInitializer() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    logger.installGlobalHandlers();
    logger.setFlag("network", getNetworkFlag());
    patchFetch();
  }, []);

  useEffect(() => {
    if (!pathname) return;

    const search = typeof window !== "undefined" ? window.location.search : "";
    logger.setContext({ route: pathname, search });

    const from = previousPath.current;
    if (from && from !== pathname) {
      logger.info("Route change", {
        scope: "Navigation",
        from,
        to: pathname,
      });
    } else if (!from) {
      logger.info("Route start", {
        scope: "Navigation",
        to: pathname,
      });
    }

    previousPath.current = pathname;
  }, [pathname]);

  return null;
}
