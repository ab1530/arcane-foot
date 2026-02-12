import { createAdminClient } from "../_shared/supabase.ts";
import { basePathForFunctions } from "../_shared/html.ts";

type PassportRow = {
  id: string;
  playerId: string;
  publicToken: string;
  status: string;
  verifiedAt: string | null;
  passportData: any;
  createdAt: string;
};

function extractToken(url: URL, routeName: "passport"): { basePath: string; token: string | null } {
  const basePath = basePathForFunctions(url);
  const path = basePath ? url.pathname.slice(basePath.length) : url.pathname;
  const parts = path.split("/").filter(Boolean);
  // parts: ["passport", "<publicToken>"]
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
    const { token } = extractToken(url, "passport");

    if (!token) {
      return respondJson({ message: "Passport introuvable." }, 404);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("player_passports")
      .select("id,playerId,publicToken,status,verifiedAt,passportData,createdAt")
      .eq("publicToken", token)
      .maybeSingle();

    if (error) {
      return respondJson({ message: error.message }, 500);
    }

    if (!data) {
      return respondJson({ message: "Passport introuvable." }, 404);
    }

    const row = data as PassportRow;
    return respondJson({
      id: row.id,
      playerId: row.playerId,
      status: row.status,
      publicToken: row.publicToken,
      verifiedAt: row.verifiedAt,
      passportData: row.passportData ?? {},
      createdAt: row.createdAt,
    });
  } catch (e) {
    return respondJson({ message: (e as Error)?.message ?? String(e) }, 500);
  }
});
