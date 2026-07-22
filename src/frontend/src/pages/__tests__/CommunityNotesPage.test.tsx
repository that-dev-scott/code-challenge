import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CommunityNotesPage } from "../CommunityNotesPage";
import { ApiError, createNote, getCommunities, getNotes, updateNote } from "../../services/api/client";
import type { Community, Note } from "../../types";

vi.mock("../../services/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/api/client")>();
  return {
    ...actual,
    getCommunities: vi.fn(),
    getNotes: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
  };
});

const communities: Community[] = [
  { id: 1, name: "Maple Grove", created_by: "seed_script", created_on: "2026-01-01T00:00:00Z" },
  { id: 2, name: "Cedar Heights", created_by: "seed_script", created_on: "2026-01-01T00:00:00Z" },
];

function noteFor(communityId: number, overrides: Partial<Note> = {}): Note {
  return {
    id: 1,
    community_id: communityId,
    note: "Existing note",
    created_by: "seed_script",
    created_on: "2026-01-01T12:00:00Z",
    ...overrides,
  };
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<CommunityNotesPage />} />
        <Route path="/communities/:communityId" element={<CommunityNotesPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCommunities).mockResolvedValue(communities);
  vi.mocked(getNotes).mockResolvedValue([]);
});

describe("CommunityNotesPage", () => {
  it("prompts to select a community when none is selected", async () => {
    renderAt("/");

    await screen.findByRole("option", { name: "Maple Grove" });
    expect(screen.getByText("Select a community to view its notes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Note" })).toBeDisabled();
    expect(getNotes).not.toHaveBeenCalled();
  });

  it("treats a non-numeric communityId in the URL as no selection", async () => {
    renderAt("/communities/abc");

    await screen.findByRole("option", { name: "Maple Grove" });
    expect(screen.getByText("Select a community to view its notes.")).toBeInTheDocument();
    expect(getNotes).not.toHaveBeenCalled();
  });

  it("loads and displays notes for the community in the URL", async () => {
    vi.mocked(getNotes).mockResolvedValue([noteFor(1, { note: "Roof inspection scheduled." })]);

    renderAt("/communities/1");

    expect(await screen.findByText("Roof inspection scheduled.")).toBeInTheDocument();
    expect(getNotes).toHaveBeenCalledWith(1);
  });

  it("shows an error banner when communities fail to load", async () => {
    vi.mocked(getCommunities).mockRejectedValue(new ApiError(500, "Backend is unavailable."));

    renderAt("/");

    expect(await screen.findByText("Backend is unavailable.")).toBeInTheDocument();
  });

  it("shows an error banner when notes fail to load", async () => {
    vi.mocked(getNotes).mockRejectedValue(new ApiError(500, "Could not load notes."));

    renderAt("/communities/1");

    expect(await screen.findByText("Could not load notes.")).toBeInTheDocument();
  });

  it("switching communities clears the previous community's notes and fetches fresh ones", async () => {
    vi.mocked(getNotes).mockImplementation((communityId: number) =>
      Promise.resolve([noteFor(communityId, { id: communityId, note: `Note for community ${communityId}` })]),
    );

    renderAt("/communities/1");
    expect(await screen.findByText("Note for community 1")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole("combobox", { name: "Select community" }), "2");

    expect(await screen.findByText("Note for community 2")).toBeInTheDocument();
    expect(screen.queryByText("Note for community 1")).not.toBeInTheDocument();
  });

  it("adding a note saves it, refetches, and shows a success banner", async () => {
    vi.mocked(getNotes)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([noteFor(1, { note: "Brand new note" })]);
    vi.mocked(createNote).mockResolvedValue(noteFor(1, { note: "Brand new note" }));

    renderAt("/communities/1");
    await screen.findByText("No notes yet for this community.");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add Note" }));
    await user.type(screen.getByPlaceholderText("Write a note..."), "Brand new note");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createNote).toHaveBeenCalledWith(1, "Brand new note");
    expect(await screen.findByText("Brand new note")).toBeInTheDocument();
    expect(screen.getByText("Note added successfully.")).toBeInTheDocument();
  });

  it("editing a note saves it in place and shows a success banner", async () => {
    vi.mocked(getNotes).mockResolvedValue([noteFor(1, { note: "Original text" })]);
    vi.mocked(updateNote).mockResolvedValue(noteFor(1, { note: "Edited text", updated_by: "Community Manager" }));

    renderAt("/communities/1");
    await screen.findByText("Original text");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "" }));
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Edited text");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateNote).toHaveBeenCalledWith(1, 1, "Edited text");
    expect(await screen.findByText("Edited text")).toBeInTheDocument();
    expect(screen.getByText("Note saved successfully.")).toBeInTheDocument();
  });
});
