// ====================================================
// Supabase 데이터베이스 타입 정의
// 테이블 스키마와 1:1 대응 (001_init_schema.sql 기준)
// ====================================================

export interface Database {
  public: {
    Tables: {

      // ─── users ──────────────────────────────────────
      users: {
        Row: {
          id:                       string;
          display_name:             string;
          avatar_url:               string | null;
          subscription_status:      "free" | "premium" | "trial";
          subscription_plan:        "free" | "basic" | "pro";
          subscription_expires_at:  string | null;
          created_at:               string;
        };
        Insert: {
          id:                       string;
          display_name?:            string;
          avatar_url?:              string | null;
          subscription_status?:     "free" | "premium" | "trial";
          subscription_plan?:       "free" | "basic" | "pro";
          subscription_expires_at?: string | null;
          created_at?:              string;
        };
        Update: {
          display_name?:            string;
          avatar_url?:              string | null;
          subscription_status?:     "free" | "premium" | "trial";
          subscription_plan?:       "free" | "basic" | "pro";
          subscription_expires_at?: string | null;
        };
      };

      // ─── families ───────────────────────────────────
      families: {
        Row: {
          id:           string;
          name:         string | null;
          main_user_id: string;
          created_at:   string;
        };
        Insert: {
          id?:          string;
          name?:        string | null;
          main_user_id: string;
          created_at?:  string;
        };
        Update: {
          name?:        string | null;
        };
      };

      // ─── family_members ──────────────────────────────
      family_members: {
        Row: {
          id:          string;
          family_id:   string;
          user_id:     string;
          role:        "main" | "co-parent";
          invited_by:  string | null;
          status:      "pending" | "accepted" | "rejected";
          created_at:  string;
          accepted_at: string | null;
        };
        Insert: {
          id?:         string;
          family_id:   string;
          user_id:     string;
          role:        "main" | "co-parent";
          invited_by?: string | null;
          status?:     "pending" | "accepted" | "rejected";
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          status?:     "pending" | "accepted" | "rejected";
          accepted_at?: string | null;
        };
      };

      // ─── invitations ────────────────────────────────
      invitations: {
        Row: {
          id:             string;
          family_id:      string;
          invited_by:     string;
          invite_code:    string;
          invited_email:  string;
          status:         "pending" | "accepted" | "rejected";
          expires_at:     string;
          created_at:     string;
        };
        Insert: {
          id?:            string;
          family_id:      string;
          invited_by:     string;
          invite_code?:   string;
          invited_email:  string;
          status?:        "pending" | "accepted" | "rejected";
          expires_at?:    string;
          created_at?:    string;
        };
        Update: {
          status?:        "pending" | "accepted" | "rejected";
        };
      };

      // ─── children ────────────────────────────────────
      children: {
        Row: {
          id:           string;
          family_id:    string;
          created_by:   string;
          name:         string;
          grade:        "elementary5" | "elementary6" | "middle1" | "middle2" | "middle3";
          interests:    string[];    // InterestField[]
          avatar_emoji: string;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?:          string;
          family_id:    string;
          created_by:   string;
          name:         string;
          grade:        "elementary5" | "elementary6" | "middle1" | "middle2" | "middle3";
          interests?:   string[];
          avatar_emoji?: string;
          created_at?:  string;
          updated_at?:  string;
        };
        Update: {
          name?:        string;
          grade?:       "elementary5" | "elementary6" | "middle1" | "middle2" | "middle3";
          interests?:   string[];
          avatar_emoji?: string;
          updated_at?:  string;
        };
      };

      // ─── roadmap_progress ────────────────────────────
      roadmap_progress: {
        Row: {
          id:               string;
          child_id:         string;
          occupation_id:    string;
          checked_missions: Record<string, boolean>;
          chosen:           boolean;
          last_visited_at:  string;
          created_at:       string;
          updated_at:       string;
        };
        Insert: {
          id?:              string;
          child_id:         string;
          occupation_id:    string;
          checked_missions?: Record<string, boolean>;
          chosen?:          boolean;
          last_visited_at?: string;
          created_at?:      string;
          updated_at?:      string;
        };
        Update: {
          checked_missions?: Record<string, boolean>;
          chosen?:          boolean;
          last_visited_at?: string;
          updated_at?:      string;
        };
      };

      // ─── liked_occupations ───────────────────────────
      liked_occupations: {
        Row: {
          id:            string;
          child_id:      string;
          occupation_id: string;
          liked_at:      string;
        };
        Insert: {
          id?:           string;
          child_id:      string;
          occupation_id: string;
          liked_at?:     string;
        };
        Update: never;
      };

      // ─── myeonddara_sessions ─────────────────────────
      myeonddara_sessions: {
        Row: {
          id:              string;
          child_id:        string | null;
          user_id:         string;
          child_name:      string;
          birth_date:      string;    // "YYYY-MM-DD"
          birth_time:      string;
          calendar_type:   "양력" | "음력" | "윤달";
          gender:          "male" | "female";
          result_snapshot: Record<string, unknown> | null;
          created_at:      string;
        };
        Insert: {
          id?:             string;
          child_id?:       string | null;
          user_id:         string;
          child_name:      string;
          birth_date:      string;
          birth_time:      string;
          calendar_type?:  "양력" | "음력" | "윤달";
          gender:          "male" | "female";
          result_snapshot?: Record<string, unknown> | null;
          created_at?:     string;
        };
        Update: {
          result_snapshot?: Record<string, unknown> | null;
        };
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
