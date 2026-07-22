import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewNoteCard } from "../NewNoteCard";
import { ApiError } from "../../services/api/client";

describe("NewNoteCard", () => {
  it("renders an empty textarea with a placeholder and zeroed char count", () => {
    render(
      <NewNoteCard
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText("Write a note...")).toHaveValue("");
    expect(screen.getByText("0 / 500")).toBeInTheDocument();
  });

  it("calls onCancel without calling onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(
      <NewNoteCard
        onSave={onSave}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("rejects a blank note without calling onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <NewNoteCard
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText("Write a note..."), "   ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Note cannot be blank.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("rejects a note over 500 characters without calling onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <NewNoteCard
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Write a note..."), {
      target: { value: "a".repeat(501) },
    });
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Note cannot be greater than 500 characters.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onSave with the typed text", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <NewNoteCard
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText("Write a note..."), "A brand new note");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith("A brand new note");
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled());
  });

  it("shows the backend's message when onSave rejects with an ApiError", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new ApiError(422, "Note cannot be blank."));
    render(
      <NewNoteCard
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText("Write a note..."), "Some text");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Note cannot be blank.")).toBeInTheDocument();
  });

  it("shows a generic message when onSave rejects with a non-ApiError", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error("network down"));
    render(
      <NewNoteCard
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText("Write a note..."), "Some text");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Something went wrong saving this note.")).toBeInTheDocument();
  });

  it("disables both buttons and shows Saving... while the save is in flight", async () => {
    const user = userEvent.setup();
    let resolveSave: () => void = () => {};
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    render(
      <NewNoteCard
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText("Write a note..."), "Some text");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    resolveSave();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled());
  });
});
