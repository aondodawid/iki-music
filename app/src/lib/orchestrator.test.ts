import { GenerationOrchestrator } from "./orchestrator";
import { buildLiveJamRequest } from "./adapters";

describe("GenerationOrchestrator", () => {
  it("transitions to failed on provider errors", async () => {
    const orchestrator = new GenerationOrchestrator();

    await orchestrator.generate(
      buildLiveJamRequest({
        sessionId: "session-live",
        notes: "C G Am F",
        forceFailure: true,
      }),
    );

    const state = orchestrator.getState();
    expect(state.status).toBe("failed");
    expect(state.error?.recoverable).toBe(true);
  });
});
