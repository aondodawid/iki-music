import { buildLiveJamRequest } from "./adapters";

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
      durationSeconds: 99,
    });

    expect(low.durationSeconds).toBe(2);
    expect(high.durationSeconds).toBe(12);
  });

  it("uses default duration when missing", () => {
    const request = buildLiveJamRequest({
      sessionId: "s-3",
      notes: "C G",
    });

    expect(request.durationSeconds).toBe(6);
  });
});
