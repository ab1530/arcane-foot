import {
  buildPublicShareRequestCandidates,
  fetchPublicShareResource,
  PublicShareError,
} from "@/lib/public-share-api";

jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("public-share-api", () => {
  const originalEnv = process.env;
  const makeResponse = (status: number, payload: any) =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(payload),
    }) as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_API_URL = "https://appfoot-api-production.up.railway.app";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("adds /api for Nest backend when missing", () => {
    const result = buildPublicShareRequestCandidates(
      "shortlist",
      "short-token",
      "https://appfoot-api-production.up.railway.app",
    );

    expect(result).toEqual({
      primary: "https://appfoot-api-production.up.railway.app/api/passport-shares/short-token",
      fallback: "https://appfoot-api-production.up.railway.app/passport-shares/short-token",
    });
  });

  it("does not duplicate /api when already present", () => {
    const result = buildPublicShareRequestCandidates(
      "passport",
      "pass-token",
      "https://appfoot-api-production.up.railway.app/api",
    );

    expect(result).toEqual({
      primary: "https://appfoot-api-production.up.railway.app/api/passport/token/pass-token",
      fallback: "https://appfoot-api-production.up.railway.app/passport/token/pass-token",
    });
  });

  it("uses supabase functions paths when functions host is configured", () => {
    const shortlist = buildPublicShareRequestCandidates(
      "shortlist",
      "short-token",
      "https://project.functions.supabase.co",
    );
    const passport = buildPublicShareRequestCandidates(
      "passport",
      "pass-token",
      "https://project.functions.supabase.co",
    );

    expect(shortlist).toEqual({
      primary: "https://project.functions.supabase.co/shortlist/short-token",
    });
    expect(passport).toEqual({
      primary: "https://project.functions.supabase.co/passport/pass-token",
    });
  });

  it("retries once with fallback URL on first 404", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(makeResponse(404, { message: "Cannot GET /passport-shares/token" }))
      .mockResolvedValueOnce(makeResponse(200, { token: "ok-token" }));

    const data = await fetchPublicShareResource<{ token: string }>({
      resource: "shortlist",
      token: "token",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    expect(data.token).toBe("ok-token");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps 500 to unavailable and does not fallback", async () => {
    const fetchMock = jest.fn().mockResolvedValue(makeResponse(500, { message: "Internal server error" }));

    await expect(
      fetchPublicShareResource({
        resource: "shortlist",
        token: "token",
        fetchImpl: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({
      reason: "unavailable",
      status: 500,
    } satisfies Partial<PublicShareError>);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once on network error and succeeds on fallback", async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockResolvedValueOnce(makeResponse(200, { id: "passport-id" }));

    const data = await fetchPublicShareResource<{ id: string }>({
      resource: "passport",
      token: "token",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    expect(data.id).toBe("passport-id");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
