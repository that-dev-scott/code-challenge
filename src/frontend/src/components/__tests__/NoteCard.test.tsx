import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NoteCard } from "../NoteCard";
import { ApiError } from "../../services/api/client";
import type { Note } from "../../types";

const baseNote: Note = {
  id: 1,
  community_id: 1,
  note: "Original note text.",
  created_by: "seed_script",
  created_on: "2026-01-01T12:00:00Z",
};

describe("NoteCard", () => {
  it("shows the note text and creation attribution when never updated", () => {
    render(
      <NoteCard
        note={baseNote}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Original note text.")).toBeInTheDocument();
    expect(screen.getByText(/^Created by seed_script on/)).toBeInTheDocument();
    expect(screen.queryByText(/Last updated by/)).not.toBeInTheDocument();
  });

  it("includes the last-updated attribution once a note has been edited", () => {
    const updatedNote: Note = {
      ...baseNote,
      updated_by: "Community Manager",
      updated_on: "2026-01-02T12:00:00Z",
    };
    render(
      <NoteCard
        note={updatedNote}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText(/Last updated by Community Manager on/)).toBeInTheDocument();
  });

  it("enters edit mode with the current text when the edit button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <NoteCard
        note={baseNote}
        onSave={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("textbox")).toHaveValue("Original note text.");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("cancel discards changes and exits edit mode without saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <NoteCard
        note={baseNote}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button"));
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Some other text");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Original note text.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("rejects a blank note without calling onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <NoteCard
        note={baseNote}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button"));
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "   ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Note cannot be blank.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("rejects a note over 500 characters without calling onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <NoteCard
        note={baseNote}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button"));
    // fireEvent bypasses the textarea's maxLength (unlike real typing), which
    // is what lets us actually exercise this validation branch.
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "a".repeat(501) } });
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Note cannot be greater than 500 characters.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onSave with the new text and returns to view mode on success", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <NoteCard
        note={baseNote}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button"));
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Updated text");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith(baseNote, "Updated text");
    await waitFor(() => expect(screen.queryByRole("textbox")).not.toBeInTheDocument());
  });

  it("shows the backend's message when onSave rejects with an ApiError", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new ApiError(422, "Note cannot be blank."));
    render(
      <NoteCard
        note={baseNote}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button"));
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Updated text");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Note cannot be blank.")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows a generic message when onSave rejects with a non-ApiError", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error("network down"));
    render(
      <NoteCard
        note={baseNote}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button"));
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Updated text");
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
      <NoteCard
        note={baseNote}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    resolveSave();
    await waitFor(() => expect(screen.queryByRole("textbox")).not.toBeInTheDocument());
  });
});
