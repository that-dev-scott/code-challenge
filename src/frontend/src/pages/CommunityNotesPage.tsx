import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Loading } from "../components/Loading";
import { NewNoteCard } from "../components/NewNoteCard";
import { NoteCard } from "../components/NoteCard";
import { SuccessBanner } from "../components/SuccessBanner";
import { ApiError, createNote, getCommunities, getNotes, updateNote } from "../services/api/client";
import type { Community, Note } from "../types";

/**
 * Page for viewing and managing a single community's notes. The selected
 * community comes from the `:communityId` route param rather than local
 * state, so the current view is bookmarkable and survives a refresh.
 *
 * Owns the data-fetching lifecycle for both communities and notes
 * (loading/error/success state), and composes the presentational
 * components ({@link Header}, {@link NoteCard}, {@link NewNoteCard},
 * {@link SuccessBanner}, {@link Loading}) that render them.
 */
export function CommunityNotesPage() {
  const { communityId } = useParams();
  const navigate = useNavigate();

  const parsedCommunityId = communityId ? Number(communityId) : null;
  const selectedCommunityId = parsedCommunityId !== null && !Number.isNaN(parsedCommunityId) ? parsedCommunityId : null;

  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingCommunities(true);
    getCommunities()
      .then(setCommunities)
      .catch((err) => {
        setCommunitiesError(err instanceof ApiError ? err.message : "Failed to load communities.");
      })
      .finally(() => setIsLoadingCommunities(false));
  }, []);

  useEffect(() => {
    setIsAddingNote(false);
    setNotesError(null);
    setSuccessMessage(null);

    if (selectedCommunityId === null) {
      setNotes([]);
      return;
    }
    setIsLoadingNotes(true);
    getNotes(selectedCommunityId)
      .then(setNotes)
      .catch((err) => {
        setNotesError(err instanceof ApiError ? err.message : "Failed to load notes.");
      })
      .finally(() => setIsLoadingNotes(false));
  }, [selectedCommunityId]);

  return (
    <>
      <Header
        communities={communities}
        selectedCommunityId={selectedCommunityId}
        onSelectCommunity={(id) => navigate(id !== null ? `/communities/${id}` : "/")}
        onAddNote={() => setIsAddingNote(true)}
        addNoteDisabled={selectedCommunityId === null || isAddingNote}
        isLoadingCommunities={isLoadingCommunities}
      />

      {communitiesError && <div className="error-banner">{communitiesError}</div>}

      <main>
        {selectedCommunityId === null && (
          <div
            className="card"
            style={{ padding: 20 }}>
            <p className="text-muted">Select a community to view its notes.</p>
          </div>
        )}

        {selectedCommunityId !== null && isLoadingNotes && <Loading message="Loading notes..." />}

        {selectedCommunityId !== null && !isLoadingNotes && notesError && (
          <div className="error-banner">{notesError}</div>
        )}

        {selectedCommunityId !== null && !isLoadingNotes && !notesError && (
          <>
            {successMessage && (
              <SuccessBanner message={successMessage} onDone={() => setSuccessMessage(null)} />
            )}

            {isAddingNote && (
              <NewNoteCard
                onCancel={() => setIsAddingNote(false)}
                onSave={async (text) => {
                  await createNote(selectedCommunityId, text);
                  const fresh = await getNotes(selectedCommunityId);
                  setNotes(fresh);
                  setIsAddingNote(false);
                  setSuccessMessage("Note added successfully.");
                }}
              />
            )}

            {!isAddingNote && notes.length === 0 && (
              <div
                className="card"
                style={{ padding: 20 }}>
                <p className="text-muted">No notes yet for this community.</p>
              </div>
            )}

            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onSave={async (n, newText) => {
                  const updated = await updateNote(n.community_id, n.id, newText);
                  setNotes((prev) => prev.map((existing) => (existing.id === updated.id ? updated : existing)));
                  setSuccessMessage("Note saved successfully.");
                }}
              />
            ))}
          </>
        )}
      </main>
    </>
  );
}
