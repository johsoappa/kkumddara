// ====================================================
// 커리어넷 직업 목록 → Supabase 동기화 유틸리티
//
// [사용처]
//   관리자 페이지 /admin/sync-careers 에서 수동 트리거
//
// [전제조건]
//   1. NEXT_PUBLIC_CAREER_API_KEY 등록 완료
//   2. Supabase 014_occupations_missions.sql 마이그레이션 실행 완료
//
// [미션 자동 생성 규칙]
//   직업당 3단계(current/next/future) × 각 1개 = 기본 3개
//   카테고리별 세부 문구는 MISSION_TEMPLATE 참조
// ====================================================

import { supabase } from "@/lib/supabase";
import { fetchCareerJobs, type CareerJobNormalized } from "@/lib/careerapi";

// occupations/missions 테이블은 014 마이그레이션으로 추가된 테이블로,
// 아직 supabase 타입 파일(types/supabase.ts)에 반영되지 않았음.
// 마이그레이션 실행 후 `supabase gen types` 를 재실행하면 any 캐스팅 제거 가능.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ── 기본 미션 템플릿 ────────────────────────────────────
// 카테고리 키워드 → 미션 문구 3단계 매핑
// MVP에서는 카테고리 대분류 기준으로 생성

interface MissionTemplate {
  current: { title: string; description: string; mission_type: string };
  next:    { title: string; description: string; mission_type: string };
  future:  { title: string; description: string; mission_type: string };
}

const DEFAULT_TEMPLATE: MissionTemplate = {
  current: {
    title:        "직업 정보 알아보기",
    description:  "이 직업이 어떤 일을 하는지 검색하거나 책에서 찾아보아요.",
    mission_type: "study",
  },
  next: {
    title:        "관련 활동 체험하기",
    description:  "이 직업과 관련된 동아리, 체험 프로그램, 강의에 참여해봐요.",
    mission_type: "experience",
  },
  future: {
    title:        "전문가와 이야기해보기",
    description:  "이 직업의 전문가를 만나거나 인터뷰 영상을 보며 현실적인 이야기를 들어봐요.",
    mission_type: "challenge",
  },
};

const CATEGORY_TEMPLATES: Record<string, MissionTemplate> = {
  "정보통신": {
    current: {
      title:        "코딩 첫걸음 시작하기",
      description:  "스크래치나 엔트리로 간단한 프로그램을 만들어봐요.",
      mission_type: "activity",
    },
    next: {
      title:        "IT 관련 강의 수강하기",
      description:  "YouTube나 무료 플랫폼에서 관련 기술 강의를 완강해봐요.",
      mission_type: "study",
    },
    future: {
      title:        "나만의 프로젝트 만들기",
      description:  "배운 기술로 간단한 앱이나 웹사이트를 직접 제작해봐요.",
      mission_type: "challenge",
    },
  },
  "보건·의료": {
    current: {
      title:        "의료 직업 탐색하기",
      description:  "관심 있는 의료 직업의 하루 일과를 영상으로 찾아봐요.",
      mission_type: "study",
    },
    next: {
      title:        "의료 봉사·체험 참여하기",
      description:  "지역 보건소나 의료 봉사 프로그램에 참여해봐요.",
      mission_type: "experience",
    },
    future: {
      title:        "관련 자격증 정보 수집하기",
      description:  "이 직업에 필요한 자격증과 입시 경로를 구체적으로 정리해봐요.",
      mission_type: "challenge",
    },
  },
  "교육·연구": {
    current: {
      title:        "관심 분야 책 1권 읽기",
      description:  "이 직업과 관련된 분야의 입문 도서를 한 권 골라 읽어봐요.",
      mission_type: "study",
    },
    next: {
      title:        "학교 동아리 활동하기",
      description:  "관심 분야와 관련된 동아리에서 활동해봐요.",
      mission_type: "activity",
    },
    future: {
      title:        "발표·연구 프로젝트 도전하기",
      description:  "관심 주제로 발표 자료나 탐구 보고서를 직접 작성해봐요.",
      mission_type: "challenge",
    },
  },
  "문화·예술·디자인": {
    current: {
      title:        "포트폴리오 첫 작품 만들기",
      description:  "그림, 영상, 디자인 등 관심 분야에서 첫 작품을 만들어봐요.",
      mission_type: "activity",
    },
    next: {
      title:        "공모전 참가하기",
      description:  "학생 대상 예술·디자인 공모전에 도전해봐요.",
      mission_type: "challenge",
    },
    future: {
      title:        "멘토 작가·디자이너 찾아보기",
      description:  "좋아하는 작가나 디자이너의 작업 과정을 깊이 분석해봐요.",
      mission_type: "experience",
    },
  },
};

/** 카테고리 키워드로 템플릿 선택 */
function getTemplate(category: string): MissionTemplate {
  for (const [key, template] of Object.entries(CATEGORY_TEMPLATES)) {
    if (category.includes(key.substring(0, 4))) return template;
  }
  return DEFAULT_TEMPLATE;
}

// ── 동기화 결과 타입 ────────────────────────────────────

export interface SyncResult {
  occupationsUpserted: number;
  missionsCreated:     number;
  errors:              string[];
}

// ── 메인 동기화 함수 ────────────────────────────────────

/**
 * 커리어넷 직업 목록을 Supabase occupations 테이블에 upsert,
 * 기존 미션이 없는 직업에 한해 기본 미션 3개를 생성.
 *
 * @returns SyncResult
 */
export async function syncCareerJobs(): Promise<SyncResult> {
  const result: SyncResult = {
    occupationsUpserted: 0,
    missionsCreated:     0,
    errors:              [],
  };

  // 1. 커리어넷 API에서 직업 목록 조회
  let jobs: CareerJobNormalized[];
  try {
    jobs = await fetchCareerJobs();
  } catch (err) {
    result.errors.push(`직업 목록 API 호출 실패: ${String(err)}`);
    return result;
  }

  if (jobs.length === 0) {
    result.errors.push("커리어넷 응답이 비어 있습니다.");
    return result;
  }

  // 2. occupations upsert (career_code 기준 중복 방지)
  const CHUNK_SIZE = 100;  // Supabase upsert 배치 크기
  for (let i = 0; i < jobs.length; i += CHUNK_SIZE) {
    const chunk = jobs.slice(i, i + CHUNK_SIZE);
    const { error } = await db
      .from("occupations")
      .upsert(chunk, { onConflict: "career_code", ignoreDuplicates: false });

    if (error) {
      result.errors.push(`occupations upsert 오류 (batch ${i}): ${error.message}`);
      continue;
    }
    result.occupationsUpserted += chunk.length;
  }

  console.log(`[sync] ✅ occupations upsert: ${result.occupationsUpserted}개`);

  // 3. 미션이 없는 직업에 기본 미션 생성 (중복 방지)
  const { data: existingMissions } = await db
    .from("missions")
    .select("occupation_id")
    .eq("source", "careerapi");

  const existingOccIds = new Set(
    (existingMissions ?? []).map((m: { occupation_id: string }) => m.occupation_id)
  );

  const newMissions = jobs
    .filter((job) => !existingOccIds.has(job.id))
    .flatMap((job) => {
      const tpl = getTemplate(job.category);
      return [
        {
          occupation_id: job.id,
          stage:         "current",
          ...tpl.current,
          difficulty: 1,
          source:     "careerapi" as const,
          sort_order: 1,
        },
        {
          occupation_id: job.id,
          stage:         "next",
          ...tpl.next,
          difficulty: 2,
          source:     "careerapi" as const,
          sort_order: 1,
        },
        {
          occupation_id: job.id,
          stage:         "future",
          ...tpl.future,
          difficulty: 3,
          source:     "careerapi" as const,
          sort_order: 1,
        },
      ];
    });

  if (newMissions.length > 0) {
    for (let i = 0; i < newMissions.length; i += CHUNK_SIZE) {
      const chunk = newMissions.slice(i, i + CHUNK_SIZE);
      const { error } = await db.from("missions").insert(chunk);
      if (error) {
        result.errors.push(`missions insert 오류 (batch ${i}): ${error.message}`);
        continue;
      }
      result.missionsCreated += chunk.length;
    }
    console.log(`[sync] ✅ missions 생성: ${result.missionsCreated}개`);
  }

  return result;
}
