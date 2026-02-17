import { buildApiUrl, resolveApiBase } from "@/lib/api-base";

describe("api-base", () => {
  it("strips /api suffix from configured base URL", () => {
    expect(resolveApiBase("https://appfoot-api-production.up.railway.app/api")).toBe(
      "https://appfoot-api-production.up.railway.app",
    );
  });

  it("keeps root base when /api is not present", () => {
    expect(resolveApiBase("https://appfoot-api-production.up.railway.app")).toBe(
      "https://appfoot-api-production.up.railway.app",
    );
  });

  it("builds URLs with exactly one /api prefix", () => {
    expect(
      buildApiUrl("/auth/login", "https://appfoot-api-production.up.railway.app"),
    ).toBe("https://appfoot-api-production.up.railway.app/api/auth/login");

    expect(
      buildApiUrl("/api/auth/login", "https://appfoot-api-production.up.railway.app"),
    ).toBe("https://appfoot-api-production.up.railway.app/api/auth/login");
  });

  it("does not duplicate /api when base already contains it", () => {
    expect(
      buildApiUrl("/auth/me", "https://appfoot-api-production.up.railway.app/api"),
    ).toBe("https://appfoot-api-production.up.railway.app/api/auth/me");
  });

  it("returns absolute URLs unchanged", () => {
    expect(buildApiUrl("https://example.com/custom-endpoint", "https://ignored.com")).toBe(
      "https://example.com/custom-endpoint",
    );
  });
});

