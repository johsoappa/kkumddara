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
      // 006: plan_name → free/basic/family/premium 4종
      //      신규 컬럼 추가 (ai_consult, myeonddara, guardians, roadmap)
      subscription_plan: {
        Row: {
          id:                       string;
          parent_id:                string;
          plan_name:                "free" | "basic" | "family" | "premium";
          child_limit:              number;
          ai_consult_monthly_limit: number;
          myeonddara_yearly_limit:  number;
          max_guardians:            number;
          roadmap_full_access:      boolean;
          status:                   "active" | "expired" | "cancelled";
          expires_at:               string | null;
          created_at:               string;
          updated_at:               string;
        };
        Insert: {
          id?:                        string;
          parent_id:                  string;
          plan_name?:                 "free" | "basic" | "family" | "premium";
          child_limit?:               number;
          ai_consult_monthly_limit?:  number;
          myeonddara_yearly_limit?:   number;
          max_guardians?:             number;
          roadmap_full_access?:       boolean;
          status?:                    "active" | "expired" | "cancelled";
          expires_at?:                string | null;
          created_at?:                string;
          updated_at?:                string;
        };
        Update: {
          plan_name?:                 "free" | "basic" | "family" | "premium";
          child_limit?:               number;
          ai_consult_monthly_limit?:  number;
          myeonddara_yearly_limit?:   number;
          max_guardians?:             number;
          roadmap_full_access?:       boolean;
          status?:                    "active" | "expired" | "cancelled";
          expires_at?:                string | null;
          updated_at?:                string;
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

      // ─── ai_consult_sessions ─────────────────────────
      // 007: 유료 플랜 AI 진로 상담 이력
      ai_consult_sessions: {
        Row: {
          id:         string;
          parent_id:  string;
          child_id:   string | null;
          title:      string | null;
          messages:   Array<{ role: "user" | "assistant"; content: string }>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?:        string;
          parent_id:  string;
          child_id?:  string | null;
          title?:     string | null;
          messages?:  Array<{ role: "user" | "assistant"; content: string }>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?:     string | null;
          messages?:  Array<{ role: "user" | "assistant"; content: string }>;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ─── ai_consult_usage ────────────────────────────
      // 007: 월별 AI 상담 사용량 (무료/유료 공통)
      ai_consult_usage: {
        Row: {
          id:         string;
          parent_id:  string;
          used_month: string;   // 'YYYY-MM'
          count:      number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?:        string;
          parent_id:  string;
          used_month: string;
          count?:     number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          count?:     number;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ─── myeonddara_usage ────────────────────────────
      // 008: 연간 명따라 사용량 추적 (used_year INT 기준)
      // 011: child_id 추가 → (child_id, used_year) unique
      myeonddara_usage: {
        Row: {
          id:         string;
          parent_id:  string;
          child_id:   string | null;  // 011: child 기준 관리
          used_year:  number;         // YYYY 정수
          count:      number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?:        string;
          parent_id:  string;
          child_id?:  string | null;
          used_year:  number;
          count?:     number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          count?:     number;
          updated_at?: string;
        };
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

      // ─── occupation_master (015 마이그레이션) ─────────────
      // [TODO] supabase gen types 재실행 시 이 블록을 자동 생성 타입으로 교체
      occupation_master: {
        Row: {
          id:                   string;
          slug:                 string;
          employment24_code:    string | null;
          careerapi_code:       string | null;
          dictionary_code:      string | null;
          name_ko:              string;
          name_aliases:         string[];
          emoji:                string;
          category:             string;
          interest_fields:      string[];
          is_active:            boolean;
          sync_status:          string;
          last_synced_at:       string | null;
          last_error_message:   string | null;
          sync_attempt_count:   number;
          priority:             number;
          legacy_occupation_id: string | null;
          created_at:           string;
          updated_at:           string;
        };
        Insert: {
          id?:                  string;
          slug:                 string;
          name_ko:              string;
          emoji?:               string;
          category:             string;
          interest_fields?:     string[];
          is_active?:           boolean;
          sync_status?:         string;
          priority?:            number;
          legacy_occupation_id?: string | null;
          employment24_code?:   string | null;
        };
        Update: {
          is_active?:           boolean;
          sync_status?:         string;
          priority?:            number;
          last_synced_at?:      string | null;
          last_error_message?:  string | null;
          employment24_code?:   string | null;
          updated_at?:          string;
        };
        Relationships: [];
      };

      // ─── occupation_preparations (015 마이그레이션) ──────────
      // mission_hint / step_action 등 prep_type 분류
      occupation_preparations: {
        Row: {
          id:                   string;
          occupation_id:        string;
          layer:                "source" | "service";
          prep_type:            string;   // 'mission_hint' | 'step_action'
          content:              string;
          grade_group:          string;   // 'all' | 'elem' | 'middle' | 'high'
          stage_number:         number;
          display_order:        number;
          is_current:           boolean;
          is_latest:            boolean;
          status:               "draft" | "reviewed" | "published" | "archived";
          created_by_user_id:   string | null;
          actor_type:           string;
          generation_source:    string;
          reviewed_by_user_id:  string | null;
          published_at:         string | null;
          created_at:           string;
          updated_at:           string;
        };
        Insert: {
          id?:                  string;
          occupation_id:        string;
          layer:                "source" | "service";
          prep_type:            string;
          content:              string;
          grade_group?:         string;
          stage_number?:        number;
          display_order?:       number;
          is_current?:          boolean;
          is_latest?:           boolean;
          status?:              "draft" | "reviewed" | "published" | "archived";
          actor_type?:          string;
          generation_source?:   string;
          published_at?:        string | null;
        };
        Update: {
          content?:             string;
          is_current?:          boolean;
          is_latest?:           boolean;
          status?:              "draft" | "reviewed" | "published" | "archived";
          published_at?:        string | null;
          updated_at?:          string;
        };
        Relationships: [];
      };

      // ─── occupation_summary (015 마이그레이션) ────────────
      occupation_summary: {
        Row: {
          id:                   string;
          occupation_id:        string;
          layer:                "source" | "service";
          content_type:         string;
          content:              string;
          version_no:           number;
          is_current:           boolean;
          is_latest:            boolean;
          status:               "draft" | "reviewed" | "published" | "archived";
          created_by_user_id:   string | null;
          actor_type:           string;
          generation_source:    string;
          reviewed_by_user_id:  string | null;
          published_at:         string | null;
          created_at:           string;
          updated_at:           string;
        };
        Insert: {
          id?:                  string;
          occupation_id:        string;
          layer:                "source" | "service";
          content_type:         string;
          content:              string;
          version_no?:          number;
          is_current?:          boolean;
          is_latest?:           boolean;
          status?:              "draft" | "reviewed" | "published" | "archived";
          actor_type?:          string;
          generation_source?:   string;
          published_at?:        string | null;
        };
        Update: {
          content?:             string;
          is_current?:          boolean;
          is_latest?:           boolean;
          status?:              "draft" | "reviewed" | "published" | "archived";
          published_at?:        string | null;
          updated_at?:          string;
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
