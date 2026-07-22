import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CommunityNotesPage } from "../pages/CommunityNotesPage";

/**
 * Top-level route table. Both `/` and `/communities/:communityId` render
 * {@link CommunityNotesPage}; the community id (if any) comes from the URL
 * param rather than separate routes/components per state.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CommunityNotesPage />} />
        <Route path="/communities/:communityId" element={<CommunityNotesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
