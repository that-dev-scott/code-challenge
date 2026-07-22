import { useState } from "react";
import { ApiError } from "../services/api/client";
import type { Note } from "../types";
import { formatDate } from "../utils/formatDate";

interface NoteCardProps {
  /** The note to display, or to seed the edit draft with while editing. */
  note: Note;
  /** Called with the original note and the trimmed-valid new text when Save is clicked. Rejecting the promise surfaces the error inline and keeps edit mode open. */
  onSave: (note: Note, newText: string) => Promise<void>;
}

const MAX_NOTE_LENGTH = 500;

/**
 * Displays a single note, with an edit affordance that swaps in a draft
 * textarea. Validates blank/over-length text locally before calling
 * `onSave`, and shows the backend's message if `onSave` rejects with an
 * {@link ApiError}.
 */
export function NoteCard({ note, onSave }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(note.note);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const attribution =
    note.updated_by && note.updated_on
      ? `Created by ${note.created_by} on ${formatDate(note.created_on)} • Last updated by ${note.updated_by} on ${formatDate(note.updated_on)}`
      : `Created by ${note.created_by} on ${formatDate(note.created_on)}`;

  function handleCancelClick() {
    setDraftText(note.note);
    setValidationError(null);
    setSaveError(null);
    setIsEditing(false);
  }

  function handleEditClick() {
    setDraftText(note.note);
    setValidationError(null);
    setSaveError(null);
    setIsEditing(true);
  }

  async function handleSaveClick() {
    if (draftText.trim().length === 0) {
      setValidationError("Note cannot be blank.");
      return;
    }
    if (draftText.length > MAX_NOTE_LENGTH) {
      setValidationError(`Note cannot be greater than ${MAX_NOTE_LENGTH} characters.`);
      return;
    }
    setValidationError(null);
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSave(note, draftText);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Something went wrong saving this note.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="card note-card">
      {!isEditing && (
        <button
          type="button"
          className="note-card-edit"
          onClick={handleEditClick}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true">
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      )}

      {isEditing ? (
        <>
          <textarea
            className="note-card-textarea"
            maxLength={500}
            value={draftText}
            disabled={isSaving}
            onChange={(event) => {
              setDraftText(event.target.value);
              setValidationError(null);
            }}
            rows={4}
          />

          <div className="note-card-footer">
            <span className={draftText.length > MAX_NOTE_LENGTH ? "text-error" : "text-muted"}>
              {draftText.length} / {MAX_NOTE_LENGTH}
            </span>

            {validationError && <span className="status-message error">{validationError}</span>}
            {saveError && <span className="status-message error">{saveError}</span>}
          </div>

          <div className="note-card-actions">
            <button
              type="button"
              className="btn-secondary"
              disabled={isSaving}
              onClick={handleCancelClick}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={isSaving}
              onClick={handleSaveClick}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="note-card-text">{note.note}</p>
          <p className="note-card-attribution text-muted">{attribution}</p>
        </>
      )}
    </div>
  );
}
