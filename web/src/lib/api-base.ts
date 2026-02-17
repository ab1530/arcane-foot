const DEFAULT_API_BASE = "http://localhost:5001";

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);

const stripApiSuffix = (value: string): string => {
  const normalized = trimTrailingSlashes(value);
  if (/\/api$/i.test(normalized)) {
    return normalized.slice(0, -4) || "/";
  }
  return normalized;
};

export function resolveApiBase(rawUrl?: string): string {
  const configured = (rawUrl ?? "").trim() || DEFAULT_API_BASE;

  try {
    const url = new URL(configured);
    const pathname = stripApiSuffix(url.pathname || "/");
    const normalizedPath = pathname === "/" ? "" : pathname;
    return trimTrailingSlashes(`${url.origin}${normalizedPath}`);
  } catch {
    return stripApiSuffix(configured) || DEFAULT_API_BASE;
  }
}

export function buildApiUrl(path: string, rawBaseUrl?: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = resolveApiBase(rawBaseUrl);
  let normalizedPath = ensureLeadingSlash(path.trim() || "/");

  if (normalizedPath === "/api") {
    normalizedPath = "/";
  } else if (normalizedPath.startsWith("/api/")) {
    normalizedPath = normalizedPath.slice(4);
  }

  const suffix = normalizedPath === "/" ? "" : normalizedPath;
  return `${base}/api${suffix}`;
}

