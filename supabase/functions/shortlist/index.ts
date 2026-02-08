import { createAdminClient } from "../_shared/supabase.ts";
import { basePathForFunctions } from "../_shared/html.ts";

type PassportShareItem = {
  playerId: string;
  publicToken: string;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
  nationality?: string | null;
  clubName?: string | null;
  avatarUrl?: string | null;
};

type PassportShareSetRow = {
  token: string;
  title: string | null;
  clubName: string | null;
  items: PassportShareItem[];
  revokedAt: string | null;
  createdAt: string;
};

function extractToken(url: URL, routeName: "shortlist"): { basePath: string; token: string | null } {
  const basePath = basePathForFunctions(url);
  const path = basePath ? url.pathname.slice(basePath.length) : url.pathname;
  const parts = path.split("/").filter(Boolean);
  // parts: ["shortlist", "<token>"]
  if (parts.length >= 2 && parts[0] === routeName) {
    return { basePath, token: parts[1] ?? null };
  }
  return { basePath, token: null };
}

function respondJson(data: unknown, status = 200): Response {
  const res = new Response(JSON.stringify(data), { status });
  res.headers.set("content-type", "application/json; charset=utf-8");
  res.headers.set("cache-control", "no-store");
  return res;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(req.url);
    const { basePath, token } = extractToken(url, "shortlist");

    void basePath; // kept for compatibility with /functions/v1 routing

    if (!token) {
      return respondJson({ message: "Shortlist introuvable." }, 404);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("passport_share_sets")
      .select("token,title,clubName,items,revokedAt,createdAt")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      return respondJson({ message: error.message }, 500);
    }

    if (!data) {
      return respondJson({ message: "Shortlist introuvable." }, 404);
    }

    const row = data as PassportShareSetRow;
    if (row.revokedAt) {
      return respondJson({ message: "Shortlist introuvable." }, 404);
    }

    return respondJson({
      token: row.token,
      title: row.title,
      clubName: row.clubName,
      items: (row.items ?? []) as PassportShareItem[],
      createdAt: row.createdAt,
    });
  } catch (e) {
    return respondJson({ message: (e as Error)?.message ?? String(e) }, 500);
  }
});
