import { runProviderRequest } from "./providerClient";
import type {
  GenerationErrorPayload,
  GenerationRequest,
  OrchestratorState,
} from "./types";

type Listener = (state: OrchestratorState) => void;

const defaultState: OrchestratorState = {
  status: "idle",
  result: null,
  error: null,
};

export class GenerationOrchestrator {
  private state: OrchestratorState = defaultState;

  private listeners = new Set<Listener>();

  private degradedThresholdMs = 800;

  getState(): OrchestratorState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async generate(request: GenerationRequest): Promise<OrchestratorState> {
    this.updateState({
      status: "processing",
      result: null,
      error: null,
    });

    const start = Date.now();

    try {
      const result = await runProviderRequest(request);
      const elapsed = Date.now() - start;

      this.updateState({
        status: elapsed > this.degradedThresholdMs ? "degraded" : "ready",
        result,
        error: null,
      });
    } catch (error) {
      this.updateState({
        status: "failed",
        result: null,
        error: this.toErrorPayload(error),
      });
    }

    return this.state;
  }

  reset(): void {
    this.updateState(defaultState);
  }

  private toErrorPayload(error: unknown): GenerationErrorPayload {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("timeout")
    ) {
      return {
        code: "TIMEOUT",
        message: error.message,
        recoverable: true,
      };
    }

    return {
      code: "PROVIDER_ERROR",
      message:
        error instanceof Error ? error.message : "Unexpected provider error",
      recoverable: true,
    };
  }

  private updateState(state: OrchestratorState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener(state));
  }
}
