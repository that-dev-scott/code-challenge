import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SuccessBanner } from "../SuccessBanner";

afterEach(() => {
  vi.useRealTimers();
});

describe("SuccessBanner", () => {
  it("renders the message immediately, visible", () => {
    render(
      <SuccessBanner
        message="Note saved successfully."
        onDone={vi.fn()}
      />,
    );

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("Note saved successfully.");
    expect(banner.className).not.toContain("success-banner-hidden");
  });

  it("starts easing out after the hold period", () => {
    vi.useFakeTimers();
    render(
      <SuccessBanner
        message="Note saved successfully."
        onDone={vi.fn()}
      />,
    );
    const banner = screen.getByRole("status");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(banner.className).toContain("success-banner-hidden");
  });

  it("calls onDone once the opacity transition finishes while hidden", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(
      <SuccessBanner
        message="Note saved successfully."
        onDone={onDone}
      />,
    );
    const banner = screen.getByRole("status");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.transitionEnd(banner, { propertyName: "opacity" });

    expect(onDone).toHaveBeenCalledOnce();
  });

  it("ignores a transitionend that fires before the hide starts", () => {
    const onDone = vi.fn();
    render(
      <SuccessBanner
        message="Note saved successfully."
        onDone={onDone}
      />,
    );
    const banner = screen.getByRole("status");

    fireEvent.transitionEnd(banner, { propertyName: "opacity" });

    expect(onDone).not.toHaveBeenCalled();
  });
});
