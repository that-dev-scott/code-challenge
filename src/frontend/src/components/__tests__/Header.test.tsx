import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../Header";
import type { Community } from "../../types";

const communities: Community[] = [
  { id: 1, name: "Durham Farms", created_by: "seed_script", created_on: "2026-01-01T00:00:00Z" },
  { id: 2, name: "Power Ranch", created_by: "seed_script", created_on: "2026-01-01T00:00:00Z" },
];

describe("Header", () => {
  it("shows the placeholder option and lists communities", () => {
    render(
      <Header
        communities={communities}
        selectedCommunityId={null}
        onSelectCommunity={vi.fn()}
        onAddNote={vi.fn()}
        addNoteDisabled
        isLoadingCommunities={false}
      />,
    );

    expect(screen.getByRole("option", { name: "Select Community" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Durham Farms" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Power Ranch" })).toBeInTheDocument();
  });

  it("shows a loading placeholder and disables the select while loading", () => {
    render(
      <Header
        communities={[]}
        selectedCommunityId={null}
        onSelectCommunity={vi.fn()}
        onAddNote={vi.fn()}
        addNoteDisabled
        isLoadingCommunities={true}
      />,
    );

    expect(screen.getByRole("option", { name: "Loading communities..." })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Select community" })).toBeDisabled();
  });

  it("calls onSelectCommunity with the numeric id when a community is chosen", async () => {
    const user = userEvent.setup();
    const onSelectCommunity = vi.fn();

    render(
      <Header
        communities={communities}
        selectedCommunityId={null}
        onSelectCommunity={onSelectCommunity}
        onAddNote={vi.fn()}
        addNoteDisabled
        isLoadingCommunities={false}
      />,
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Select community" }), "2");

    expect(onSelectCommunity).toHaveBeenCalledWith(2);
  });

  it("disables the Add Note button when addNoteDisabled is true", () => {
    render(
      <Header
        communities={communities}
        selectedCommunityId={1}
        onSelectCommunity={vi.fn()}
        onAddNote={vi.fn()}
        addNoteDisabled
        isLoadingCommunities={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Add Note" })).toBeDisabled();
  });

  it("calls onAddNote when the Add Note button is clicked", async () => {
    const user = userEvent.setup();
    const onAddNote = vi.fn();

    render(
      <Header
        communities={communities}
        selectedCommunityId={1}
        onSelectCommunity={vi.fn()}
        onAddNote={onAddNote}
        addNoteDisabled={false}
        isLoadingCommunities={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add Note" }));

    expect(onAddNote).toHaveBeenCalledOnce();
  });
});
