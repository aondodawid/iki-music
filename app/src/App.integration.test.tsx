import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { resetFeatureFlags, setFeatureFlag } from "./lib/featureFlags";

describe("AI music modes integration", () => {
  beforeEach(() => {
    resetFeatureFlags();
  });

  it("supports live mode success and provider failure", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByLabelText("Preview duration (seconds)"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Enable accompaniment" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Local simulated MusicGen output/),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Degraded");
    });

    await user.click(screen.getByLabelText("Simulate provider failure"));
    await user.click(
      screen.getByRole("button", { name: "Enable accompaniment" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Provider temporary failure",
      );
    });
  });

  it("supports chat mode success, validation, and failure", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Chat Generate" }));

    const prompt = screen.getByLabelText("Prompt");
    await user.clear(prompt);
    await user.type(prompt, "Create upbeat drum and bass intro");
    await user.click(
      screen.getByRole("button", { name: "Generate from chat" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Local simulated MusicGen output/),
      ).toBeInTheDocument();
    });

    await user.clear(prompt);
    await user.click(
      screen.getByRole("button", { name: "Generate from chat" }),
    );
    expect(screen.getByText("Prompt cannot be empty.")).toBeInTheDocument();

    await user.type(prompt, "Create failed attempt");
    await user.click(screen.getByLabelText("Simulate provider failure"));
    await user.click(
      screen.getByRole("button", { name: "Generate from chat" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Provider temporary failure",
      );
    });
  });

  it("provides fallback when feature flags are disabled", () => {
    setFeatureFlag("ai-jam-accompaniment", false);
    setFeatureFlag("chat-prompt-music-generation", false);

    render(<App />);

    expect(screen.getByText(/Fallback mode is active/)).toBeInTheDocument();
  });

  it("keeps keyboard access and live region semantics", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.tab();
    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Live Jam" })).toHaveFocus();

    const status = screen.getByRole("status", { name: "Generation status" });
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
