import { useState } from "react";
import { ApiError } from "../services/api/client";

interface NewNoteCardProps {
  /** Called with the trimmed-valid draft text when Save is clicked. Rejecting the promise surfaces the error inline. */
  onSave: (text: string) => Promise<void>;
  /** Called when Cancel is clicked; the draft is discarded without validation. */
  onCancel: () => void;
}

const MAX_NOTE_LENGTH = 500;

/**
 * Editable card for composing a brand-new note. Validates blank/over-length
 * text locally before calling `onSave`, and shows the backend's message if
 * `onSave` rejects with an {@link ApiError}.
 */
export function NewNoteCard({ onSave, onCancel }: NewNoteCardProps) {
  const [draftText, setDraftText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      await onSave(draftText);
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Something went wrong saving this note.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="card note-card">
      <textarea
        className="note-card-textarea"
        maxLength={500}
        value={draftText}
        disabled={isSaving}
        autoFocus
        placeholder="Write a note..."
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
        <button type="button" className="btn-secondary" disabled={isSaving} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={isSaving}
          onClick={handleSaveClick}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
