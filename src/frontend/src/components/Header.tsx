import type { Community } from "../types";

interface HeaderProps {
  /** Communities to list in the picker. */
  communities: Community[];
  /** The currently selected community id, or `null` if none is selected. */
  selectedCommunityId: number | null;
  /** Called with the newly chosen community id, or `null` for the empty option. */
  onSelectCommunity: (communityId: number | null) => void;
  /** Called when "Add Note" is clicked. */
  onAddNote: () => void;
  /** Disables the "Add Note" button, e.g. when no community is selected or a note is already being added. */
  addNoteDisabled: boolean;
  /** Shows a loading placeholder in the picker and disables it while true. */
  isLoadingCommunities: boolean;
}

/** App header: title, the community picker, and the "Add Note" action. */
export function Header({ communities, selectedCommunityId, onSelectCommunity, onAddNote, addNoteDisabled, isLoadingCommunities }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-title">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-6h6v6" />
        </svg>
        <span>Community Notes</span>
      </div>

      <div className="community-picker">
        <select
          className="community-select"
          aria-label="Select community"
          value={selectedCommunityId ?? ""}
          disabled={isLoadingCommunities}
          onChange={(event) => onSelectCommunity(event.target.value ? Number(event.target.value) : null)}>
          <option value="">{isLoadingCommunities ? "Loading communities..." : "Select Community"}</option>
          {communities.map((community) => (
            <option
              key={community.id}
              value={community.id}>
              {community.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn-primary"
          disabled={addNoteDisabled}
          onClick={onAddNote}>
          Add Note
        </button>
      </div>

      <div className="app-header-user">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true">
          <circle
            cx="12"
            cy="8"
            r="4"
          />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
        <span>Community Manager</span>
      </div>
    </header>
  );
}
