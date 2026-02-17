import { logger } from "@/lib/logger";

export type PublicShareResource = "shortlist" | "passport";
export type PublicShareErrorReason = "not_found" | "unavailable" | "unknown";

const FUNCTIONS_HOST_FRAGMENT = "functions.supabase.co";

type FetchPublicShareResourceOptions = {
  token: string;
  resource: PublicShareResource;
  fetchImpl?: typeof fetch;
};

type CandidateUrls = {
  primary: string;
  fallback?: string;
};

export class PublicShareError extends Error {
  readonly reason: PublicShareErrorReason;
  readonly status?: number;
  readonly attemptedUrls: string[];

  constructor(params: {
    message: string;
    reason: PublicShareErrorReason;
    status?: number;
    attemptedUrls: string[];
  }) {
    super(params.message);
    this.name = "PublicShareError";
    this.reason = params.reason;
    this.status = params.status;
    this.attemptedUrls = params.attemptedUrls;
  }
}

export function resolvePublicShareApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_PUBLIC_SHARE_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  return String(raw).trim().replace(/\/+$/, "");
}

function isFunctionsBase(baseUrl: string): boolean {
  return baseUrl.includes(FUNCTIONS_HOST_FRAGMENT);
}

function hasApiSuffix(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    return url.pathname.replace(/\/+$/, "").endsWith("/api");
  } catch {
    return baseUrl.replace(/\/+$/, "").endsWith("/api");
  }
}

function stripApiSuffix(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    const pathname = url.pathname.replace(/\/+$/, "");
    if (!pathname.endsWith("/api")) {
      return baseUrl.replace(/\/+$/, "");
    }

    const nextPathname = pathname.slice(0, -4) || "/";
    const stripped = `${url.origin}${nextPathname}`;
    return stripped.replace(/\/+$/, "");
  } catch {
    return baseUrl.replace(/\/api\/?$/, "");
  }
}

function getResourcePath(resource: PublicShareResource, token: string): string {
  const encodedToken = encodeURIComponent(token);
  if (resource === "shortlist") {
    return `passport-shares/${encodedToken}`;
  }
  return `passport/token/${encodedToken}`;
}

export function buildPublicShareRequestCandidates(
  resource: PublicShareResource,
  token: string,
  baseUrl: string = resolvePublicShareApiBase(),
): CandidateUrls | null {
  if (!baseUrl || !token) {
    return null;
  }

  const normalizedBase = baseUrl.trim().replace(/\/+$/, "");
  const tokenPath = getResourcePath(resource, token);

  if (isFunctionsBase(normalizedBase)) {
    const functionsPath = resource === "shortlist" ? "shortlist" : "passport";
    return {
      primary: `${normalizedBase}/${functionsPath}/${encodeURIComponent(token)}`,
    };
  }

  const withApiBase = hasApiSuffix(normalizedBase) ? normalizedBase : `${normalizedBase}/api`;
  const withoutApiBase = hasApiSuffix(normalizedBase) ? stripApiSuffix(normalizedBase) : normalizedBase;

  const primary = `${withApiBase.replace(/\/+$/, "")}/${tokenPath}`;
  const fallback = `${withoutApiBase.replace(/\/+$/, "")}/${tokenPath}`;

  return {
    primary,
    fallback: fallback === primary ? undefined : fallback,
  };
}

function buildErrorMessage(status: number, payload: any): string {
  const message =
    (typeof payload?.message === "string" && payload.message) ||
    (typeof payload?.error === "string" && payload.error) ||
    "";

  if (status === 404) {
    return message || "Resource not found";
  }
  if (status >= 500) {
    return message || "Service temporarily unavailable";
  }
  return message || `Request failed with status ${status}`;
}

async function safeParseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchPublicShareResource<T>({
  token,
  resource,
  fetchImpl = fetch,
}: FetchPublicShareResourceOptions): Promise<T> {
  const candidates = buildPublicShareRequestCandidates(resource, token);
  if (!candidates) {
    throw new PublicShareError({
      message: "Missing public share API URL",
      reason: "unavailable",
      attemptedUrls: [],
    });
  }

  const attemptedUrls: string[] = [];
  const urls = [candidates.primary, candidates.fallback].filter(
    (candidate): candidate is string => Boolean(candidate),
  );

  let lastFailure: PublicShareError | null = null;

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    attemptedUrls.push(url);
    logger.debug("Public share request", {
      scope: "PublicShare",
      resource,
      url,
      attempt: index + 1,
      totalAttempts: urls.length,
    });

    try {
      const response = await fetchImpl(url);
      const payload = await safeParseJson(response);

      if (response.ok) {
        return payload as T;
      }

      const message = buildErrorMessage(response.status, payload);
      const reason: PublicShareErrorReason =
        response.status === 404 ? "not_found" : response.status >= 500 ? "unavailable" : "unknown";
      const error = new PublicShareError({
        message,
        reason,
        status: response.status,
        attemptedUrls: [...attemptedUrls],
      });

      const shouldRetry = index === 0 && Boolean(candidates.fallback) && response.status === 404;
      if (shouldRetry) {
        lastFailure = error;
        continue;
      }

      throw error;
    } catch (error) {
      if (error instanceof PublicShareError) {
        throw error;
      }

      const networkFailure = new PublicShareError({
        message: "Service temporarily unavailable",
        reason: "unavailable",
        attemptedUrls: [...attemptedUrls],
      });

      const shouldRetry = index === 0 && Boolean(candidates.fallback);
      if (shouldRetry) {
        lastFailure = networkFailure;
        continue;
      }

      throw networkFailure;
    }
  }

  if (lastFailure) {
    throw lastFailure;
  }

  throw new PublicShareError({
    message: "Service temporarily unavailable",
    reason: "unavailable",
    attemptedUrls,
  });
}
