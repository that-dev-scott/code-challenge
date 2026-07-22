// Thin fetch wrapper for talking to the FastAPI backend.
// The backend's CORS config (src/backend/app/main.py) currently only allows
// http://localhost:5173, which is Vite's default dev port.

import type { Community, Note } from "../../types";

const BASE_URL = "http://localhost:8000";

// This is a small wrapper abstration around FastAPI's error body.
// Helps with odd shapes of it's error messages.
export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function extractMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown })?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((entry: { msg?: string }) => entry?.msg)
      .filter(Boolean)
      .join(" ");
  }
  return `Request failed with status ${status}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, extractMessage(body, response.status), body);
  }

  return response.json() as Promise<T>;
}

export function getCommunities() {
  return apiFetch<Community[]>("/communities/");
}

export function getCommunity(communityId: number) {
  return apiFetch<Community>(`/communities/${communityId}`);
}

export function getNotes(communityId: number) {
  return apiFetch<Note[]>(`/communities/${communityId}/notes`);
}

export function getNote(communityId: number, noteId: number) {
  return apiFetch<Note>(`/communities/${communityId}/note/${noteId}`);
}

export function createNote(communityId: number, note: string) {
  return apiFetch<Note>(`/communities/${communityId}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export function updateNote(communityId: number, noteId: number, note: string) {
  return apiFetch<Note>(`/communities/${communityId}/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify({ note }),
  });
}
