import { runProviderRequest } from "./providerClient";

describe("providerClient", () => {
  it("returns generated result for live-jam path", async () => {
    const result = await runProviderRequest({
      kind: "live-jam",
      sessionId: "session-live",
      notes: "C G Am F",
      durationSeconds: 8,
    });

    expect(result.mode).toBe("live-jam");
    expect(result.content).toContain("Local simulated MusicGen output");
    expect(result.content).toContain("8s");
    expect(result.audio).toBeUndefined();
  });

  it("returns generated result for chat path", async () => {
    const result = await runProviderRequest({
      kind: "chat-generate",
      sessionId: "session-chat",
      prompt: "Create ambient piano intro",
      durationSeconds: 10,
      bpm: 128,
      instrumentalOnly: true,
      includeDrums: true,
    });

    expect(result.mode).toBe("chat-generate");
    expect(result.content).toContain("Local simulated MusicGen output");
    expect(result.content).toContain("10s");
  });

  it("throws for forced provider failures", async () => {
    await expect(
      runProviderRequest({
        kind: "chat-generate",
        sessionId: "session-chat",
        prompt: "fail",
        forceFailure: true,
      }),
    ).rejects.toThrow("Provider temporary failure");
  });
});
