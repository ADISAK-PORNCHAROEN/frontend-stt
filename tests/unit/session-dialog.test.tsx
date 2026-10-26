import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionDialog } from "@/features/transcription/components/session-dialog";

describe("SessionDialog", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value() { this.setAttribute("open", ""); } });
    Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value() { this.removeAttribute("open"); } });
  });

  afterEach(() => vi.restoreAllMocks());

  it("opens with its cancel control focused and closes cleanly without an HTMLElement return target", () => {
    const activeElementDescriptor = Object.getOwnPropertyDescriptor(document, "activeElement");
    Object.defineProperty(document, "activeElement", { configurable: true, get: () => null });
    const onCancel = vi.fn();
    const view = render(
      <SessionDialog title="Confirm" description="Choose what to do" cancelLabel="Stay" onCancel={onCancel}>
        <button type="button">Confirm</button>
      </SessionDialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Confirm" });
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByRole("button", { name: "Stay" })).toBeInTheDocument();
    view.unmount();
    expect(dialog).not.toHaveAttribute("open");
    if (activeElementDescriptor) Object.defineProperty(document, "activeElement", activeElementDescriptor);
    else Reflect.deleteProperty(document, "activeElement");
  });
});
