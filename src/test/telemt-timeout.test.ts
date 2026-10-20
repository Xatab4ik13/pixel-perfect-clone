import { afterEach, describe, expect, it, vi } from "vitest";
import { telemt, TelemtError, TELEMT_TIMEOUT_MS } from "@/server/telemt.server";

afterEach(() => vi.unstubAllGlobals());

describe("telemt control-plane calls", () => {
  it("never wait longer than 8 seconds for telemt", () => {
    expect(TELEMT_TIMEOUT_MS).toBe(8000);
  });

  it("pass an abort signal so a hung node is cut off", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response(JSON.stringify({ username: "u1" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    await telemt.getUser("u1");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("turn a timeout into a TelemtError instead of hanging", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("timed out", "TimeoutError");
    }));
    await expect(telemt.getUser("u1")).rejects.toBeInstanceOf(TelemtError);
    await expect(telemt.getUser("u1")).rejects.toThrow(/timed out/);
  });
});
