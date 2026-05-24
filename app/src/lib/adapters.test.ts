import { buildChatPromptRequest, buildLiveJamRequest } from "./adapters";

describe("adapters", () => {
  it("clamps live duration to supported bounds", () => {
    const low = buildLiveJamRequest({
      sessionId: "s-1",
      notes: "C G",
      durationSeconds: 1,
    });
    const high = buildLiveJamRequest({
      sessionId: "s-2",
      notes: "C G",
      durationSeconds: 999,
    });

    expect(low.durationSeconds).toBe(2);
    expect(high.durationSeconds).toBe(120);
  });

  it("uses default duration when missing", () => {
    const request = buildLiveJamRequest({
      sessionId: "s-3",
      notes: "C G",
    });

    expect(request.durationSeconds).toBe(6);
  });

  it("applies chat duration and bpm bounds", () => {
    const low = buildChatPromptRequest({
      sessionId: "chat-1",
      prompt: "test",
      durationSeconds: 1,
      bpm: 40,
    });

    const high = buildChatPromptRequest({
      sessionId: "chat-2",
      prompt: "test",
      durationSeconds: 999,
      bpm: 300,
    });

    expect(low.durationSeconds).toBe(2);
    expect(low.bpm).toBe(60);
    expect(high.durationSeconds).toBe(120);
    expect(high.bpm).toBe(200);
  });

  it("trims and validates chat prompt", () => {
    const request = buildChatPromptRequest({
      sessionId: "chat-3",
      prompt: "  mellow synth pad  ",
    });

    expect(request.prompt).toBe("mellow synth pad");
    expect(request.durationSeconds).toBe(6);
  });
});
