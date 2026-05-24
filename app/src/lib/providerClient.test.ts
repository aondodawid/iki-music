import { runProviderRequest } from "./providerClient";

describe("providerClient", () => {
  afterEach(() => {
    delete (globalThis as { ai?: unknown }).ai;
  });

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

  it("translates non-english chat prompt when Translation API is available", async () => {
    const translateMock = vi.fn(async (value: string) =>
      value.replace("Stworz", "Create"),
    );

    (globalThis as { ai?: unknown }).ai = {
      languageDetector: {
        create: async () => ({
          detect: async () => [{ detectedLanguage: "pl", confidence: 0.98 }],
        }),
      },
      translator: {
        canTranslate: async () => "readily",
        create: async () => ({
          translate: translateMock,
        }),
      },
    };

    const result = await runProviderRequest({
      kind: "chat-generate",
      sessionId: "session-chat",
      prompt: "Stworz ambient piano intro",
      durationSeconds: 6,
    });

    expect(translateMock).toHaveBeenCalled();
    expect(result.content).toContain("Create ambient piano intro");
  });

  it("does not translate english prompt", async () => {
    const translateMock = vi.fn(async () => "unexpected");

    (globalThis as { ai?: unknown }).ai = {
      languageDetector: {
        create: async () => ({
          detect: async () => [{ detectedLanguage: "en", confidence: 0.99 }],
        }),
      },
      translator: {
        canTranslate: async () => "readily",
        create: async () => ({
          translate: translateMock,
        }),
      },
    };

    const result = await runProviderRequest({
      kind: "chat-generate",
      sessionId: "session-chat",
      prompt: "Create ambient piano intro",
      durationSeconds: 6,
    });

    expect(translateMock).not.toHaveBeenCalled();
    expect(result.content).toContain("Create ambient piano intro");
  });
});
