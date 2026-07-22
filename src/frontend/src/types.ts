export interface Community {
  id: number;
  name: string;
  created_by: string;
  created_on: string;
  updated_by?: string | null;
  updated_on?: string | null;
}

export interface Note {
  id: number;
  community_id: number;
  note: string;
  created_by: string;
  created_on: string;
  updated_by?: string | null;
  updated_on?: string | null;
}
