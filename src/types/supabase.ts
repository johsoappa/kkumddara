// ====================================================
// Supabase 데이터베이스 타입 정의
// 002_mvp_refactor.sql 기준
// 005_add_grade_level: GradeLevel 추가
// ====================================================

export type Grade =
  | "elementary3" | "elementary4" | "elementary5" | "elementary6"
  | "middle1" | "middle2" | "middle3"
  | "high1" | "high2" | "high3";

export type GradeLevel =
  | "elem_1" | "elem_2" | "elem_3" | "elem_4" | "elem_5" | "elem_6"
  | "middle_1" | "middle_2" | "middle_3"
  | "high_1" | "high_2" | "high_3";

export type InterestField = "it" | "art" | "medical" | "business" | "education";

export type UserRole = "parent" | "student";

export interface Database {
  public: {
    Tables: {

      // ─── parent ─────────────────────────────────────
      parent: {
        Row: {
          id:                string;
          user_id:           string;
          display_name:      string | null;
          phone_number:      string | null;
          onboarding_status: "pending" | "child_creation" | "completed";
          created_at:        string;
          updated_at:        string;
        };
        Insert: {
          id?:               string;
          user_id:           string;
          display_name?:     string | null;
          phone_number?:     string | null;
          onboarding_status?: "pending" | "child_creation" | "completed";
          created_at?:       string;
          updated_at?:       string;
        };
        Update: {
          display_name?:     string | null;
          phone_number?:     string | null;
          onboarding_status?: "pending" | "child_creation" | "completed";
          updated_at?:       string;
        };
        Relationships: [];
      };

      // ─── child ──────────────────────────────────────
      child: {
        Row: {
          id:             string;
          parent_id:      string;
          name:           string;
          birth_year:     number | null;
          school_grade:   Grade | null;
          grade_level:    GradeLevel | null;  // 005 신규
          interests:      InterestField[];
          avatar_emoji:   string;
          profile_status: "active" | "inactive";
          invite_code:    string | null;
          created_at:     string;
          updated_at:     string;
        };
        Insert: {
          id?:            string;
          parent_id:      string;
          name:           string;
          birth_year?:    number | null;
          school_grade?:  Grade | null;
          grade_level?:   GradeLevel | null;  // 005 신규
          interests?:     InterestField[];
          avatar_emoji?:  string;
          profile_status?: "active" | "inactive";
          invite_code?:   string | null;
          created_at?:    string;
          updated_at?:    string;
        };
        Update: {
          name?:          string;
          birth_year?:    number | null;
          school_grade?:  Grade | null;
          grade_level?:   GradeLevel | null;  // 005 신규
          interests?:     InterestField[];
          avatar_emoji?:  string;
          profile_status?: "active" | "inactive";
          updated_at?:    string;
        };
        Relationships: [];
      };

      // ─── student ─────────────────────────────────────
      student: {
        Row: {
          id:                string;
          user_id:           string;
          child_id:          string | null;
          nickname:          string | null;
          onboarding_status: "pending" | "child_linking" | "completed";
          created_at:        string;
          updated_at:        string;
        };
        Insert: {
          id?:               string;
          user_id:           string;
          child_id?:         string | null;
          nickname?:         string | null;
          onboarding_status?: "pending" | "child_linking" | "completed";
          created_at?:       string;
          updated_at?:       string;
        };
        Update: {
          child_id?:         string | null;
          nickname?:         string | null;
          onboarding_status?: "pending" | "child_linking" | "completed";
          updated_at?:       string;
        };
        Relationships: [];
      };

      // ─── subscription_plan ───────────────────────────
      subscription_plan: {
        Row: {
          id:          string;
          parent_id:   string;
          plan_name:   "basic" | "premium" | "family" | "family_plus";
          child_limit: number;
          status:      "active" | "expired" | "cancelled";
          expires_at:  string | null;
          created_at:  string;
          updated_at:  string;
        };
        Insert: {
          id?:         string;
          parent_id:   string;
          plan_name?:  "free" | "basic" | "pro";
          child_limit?: number;
          status?:     "active" | "expired" | "cancelled";
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_name?:  "free" | "basic" | "pro";
          child_limit?: number;
          status?:     "active" | "expired" | "cancelled";
          expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ─── caregiver_invite ────────────────────────────
      caregiver_invite: {
        Row: {
          id:             string;
          parent_id:      string;
          child_id:       string;
          invited_email:  string | null;
          invited_phone:  string | null;
          invite_code:    string | null;
          invite_status:  "pending" | "accepted" | "rejected" | "expired";
          accepted_by:    string | null;
          expires_at:     string | null;
          created_at:     string;
        };
        Insert: {
          id?:            string;
          parent_id:      string;
          child_id:       string;
          invited_email?: string | null;
          invited_phone?: string | null;
          invite_code?:   string | null;
          invite_status?: "pending" | "accepted" | "rejected" | "expired";
          accepted_by?:   string | null;
          expires_at?:    string | null;
          created_at?:    string;
        };
        Update: {
          invite_status?: "pending" | "accepted" | "rejected" | "expired";
          accepted_by?:   string | null;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };

      // ─── myeonddara_sessions ─────────────────────────
      myeonddara_sessions: {
        Row: {
          id:              string;
          parent_id:       string;
          child_id:        string | null;
          child_name:      string;
          birth_date:      string;
          birth_time:      string;
          calendar_type:   "양력" | "음력" | "윤달";
          gender:          "male" | "female";
          result_snapshot: Record<string, unknown> | null;
          created_at:      string;
        };
        Insert: {
          id?:             string;
          parent_id:       string;
          child_id?:       string | null;
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
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: {
      verify_child_invite_code: {
        Args: { p_code: string };
        Returns: Array<{ child_id: string; child_name: string; school_grade: string }>;
      };
    };
    Enums: Record<string, never>;
  };
}
