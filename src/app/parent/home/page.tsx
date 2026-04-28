"use client";

// ====================================================
// 학부모 홈 (/parent/home)
// Must Have v1:
//   섹션 1 — 자녀 요약 카드 (이름, 학년, 초대코드, 관심분야)
//   섹션 2 — 부모 전용 기능 진입 (리포트, AI 상담, 명따라)
// ====================================================

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GuideModal from "@/components/common/GuideModal";
import {
  FileText,
  MessageSquare,
  Sparkles,
  Users,
  Copy,
  Check,
  LogOut,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";
import { FEATURE_FLAGS } from "@/lib/featureFlags";
import type { Child, SubscriptionPlan } from "@/types/family";
import { GRADE_LABEL, GRADE_LEVEL_LABEL, INTEREST_LABEL, PLAN_LABEL } from "@/types/family";
import type { Grade, GradeLevel, InterestField } from "@/types/family";

// ── 한국어 조사 헬퍼 ──────────────────────────────────────
// 이름 마지막 글자 종성 여부에 따라 "와/과", "은/는" 등 분기
// 예: "러블리한" → 종성 ㄴ → "과"
//     "다나"    → 종성 없음 → "와"
function pickParticle(name: string, vowelForm: string, consonantForm: string): string {
  if (!name) return consonantForm;
  const last = name[name.length - 1];
  const code = last.charCodeAt(0);
  // 한글 완성형 유니코드: 0xAC00 ~ 0xD7A3
  if (code < 0xAC00 || code > 0xD7A3) return vowelForm;
  const hasJongseong = (code - 0xAC00) % 28 !== 0;
  return hasJongseong ? consonantForm : vowelForm;
}

// ── 대화 주제 반개인화 ─────────────────────────────────────
// 규칙 기반 (AI 없음): 관심분야 2개 + 학년단계 1개 조합
const INTEREST_QUESTIONS: Partial<Record<InterestField, string[]>> = {
  it: [
    "요즘 좋아하는 앱이나 게임이 있어? 뭐가 재밌어?",
    "기술이나 컴퓨터 관련 직업 중 궁금한 게 생긴 적 있어?",
    "앱이나 웹사이트를 직접 만들어 보고 싶다는 생각 해본 적 있어?",
  ],
  art: [
    "요즘 만들거나 그리고 싶은 게 있어?",
    "좋아하는 영상이나 그림이 있어? 왜 좋아해?",
    "창작 활동을 할 때 언제 제일 즐거워?",
  ],
  medical: [
    "생물이나 과학 실험에서 재밌었던 경험이 있어?",
    "의사, 간호사, 연구원 중에 궁금한 직업이 있어?",
    "아픈 사람이나 동물을 도와주는 일을 상상해본 적 있어?",
  ],
  business: [
    "나중에 내 사업을 해보고 싶다는 생각을 해본 적 있어?",
    "학교에서 경제나 돈 관련 내용 배울 때 어떤 느낌이야?",
    "친구들이 흥미로워할 것 같은 아이디어가 있어?",
  ],
  education: [
    "친구나 동생에게 뭔가 가르쳐줄 때 어떤 느낌이야?",
    "사회에서 고쳐지면 좋겠다고 생각한 문제가 있어?",
    "학교에서 가장 보람 있었던 활동이 뭐야?",
  ],
};

const GRADE_QUESTIONS: Record<"elementary" | "middle" | "high", string> = {
  elementary: "학교에서 어떤 수업이 제일 재밌어?",
  middle:     "나중에 어떤 일을 하면서 살고 싶은지 생각해봤어?",
  high:       "진로 고민할 때 제일 어렵게 느껴지는 부분이 뭐야?",
};

function getGradeGroup(child: Child): "elementary" | "middle" | "high" {
  const gl = child.grade_level ?? "";
  if (gl.startsWith("elem")) return "elementary";
  if (gl.startsWith("high")) return "high";
  if (gl.startsWith("middle")) return "middle";
  const sg = child.school_grade ?? "";
  if (sg.startsWith("elementary")) return "elementary";
  if (sg.startsWith("high")) return "high";
  return "middle";
}

function getConversationQuestions(child: Child): string[] {
  const interests = child.interests ?? [];
  const used = new Set<string>();
  const questions: string[] = [];

  // 첫 번째·두 번째 관심분야 → 각각 첫 번째 질문
  for (const field of interests.slice(0, 2)) {
    const pool = INTEREST_QUESTIONS[field as InterestField];
    if (pool?.[0] && !used.has(pool[0])) {
      questions.push(pool[0]);
      used.add(pool[0]);
    }
    if (questions.length >= 2) break;
  }

  // 학년 기반 질문 1개
  const gradeQ = GRADE_QUESTIONS[getGradeGroup(child)];
  if (!used.has(gradeQ)) {
    questions.push(gradeQ);
    used.add(gradeQ);
  }

  // 부족하면 fallback
  const fallbacks = [
    "학교에서 어떤 수업이 제일 재밌어?",
    "나중에 어떤 일을 하면서 살고 싶은지 생각해봤어?",
    "좋아하는 앱이나 유튜브 채널 있어? 왜 좋아해?",
  ];
  for (const f of fallbacks) {
    if (questions.length >= 3) break;
    if (!used.has(f)) { questions.push(f); used.add(f); }
  }

  return questions.slice(0, 3);
}

type ParentFeature = {
  id:          string;
  icon:        React.ReactNode;
  label:       string;
  description: string;
  href:        string;
  badge?:      string;
};

const PARENT_FEATURES: ParentFeature[] = [
  {
    id:          "report",
    icon:        <FileText size={20} strokeWidth={1.8} />,
    label:       "주간 리포트",
    description: "아이의 이번 주 진로 탐색 현황을 확인해요.",
    href:        "/report",
    badge:       "베타",   // 실제 데이터 연동 전 미리보기 상태
  },
  {
    id:          "counseling",
    icon:        <MessageSquare size={20} strokeWidth={1.8} />,
    label:       "AI 진로 상담",
    description: FEATURE_FLAGS.AI_CONSULT_ENABLED
      ? "아이의 관심 분야에 맞는 진로를 함께 탐색해요."
      : "자녀 맞춤형 AI 상담 기능을 준비하고 있어요.",
    href:        "/parent/counseling",
    badge:       FEATURE_FLAGS.AI_CONSULT_ENABLED ? undefined : "준비 중",
  },
  {
    id:          "myeonddara",
    icon:        <Sparkles size={20} strokeWidth={1.8} />,
    label:       "명따라",
    description: "사주 기반으로 아이의 성향과 진로를 분석해요.",
    href:        "/myeonddara",
  },
  {
    id:          "family",
    icon:        <Users size={20} strokeWidth={1.8} />,
    label:       "가족 설정",
    description: "보호자를 초대하고 자녀의 진로 탐색을 함께 확인해요.",
    href:        "/parent/family",
  },
];

// ── 학생 연결 정보 (child_id → 연결된 학생 닉네임) ─────────
// child.invite_code로 학생이 연결하면 student.child_id가 설정됨.
// 연결 여부를 부모 홈에서 표시해 초대코드 공유 필요 여부를 명확하게 안내.
type StudentMap = Record<string, string | null>; // child_id → nickname

export default function ParentHomePage() {
  const router = useRouter();

  const [children, setChildren]   = useState<Child[]>([]);
  const [plan, setPlan]           = useState<SubscriptionPlan | null>(null);
  const [studentMap, setStudentMap] = useState<StudentMap>({});
  const [loading, setLoading]     = useState(true);
  const [copiedId, setCopiedId]   = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // 비로그인 → 미들웨어가 /로 redirect하므로 여기선 안전하게 return

        const { data: parentData } = await supabase
          .from("parent")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle(); // single() 대신 — parent 레코드 없을 때 throw 방지

        if (!parentData) return; // 트리거 미실행 등 예외 상황 → 빈 화면으로 fallback

        const [childrenRes, planRes] = await Promise.all([
          supabase
            .from("child")
            .select("*")
            .eq("parent_id", parentData.id)
            .eq("profile_status", "active")
            .order("created_at", { ascending: true }),
          supabase
            .from("subscription_plan")
            .select("*")
            .eq("parent_id", parentData.id)
            .maybeSingle(),
        ]);

        const fetchedChildren = (childrenRes.data ?? []) as Child[];
        setChildren(fetchedChildren);   // 0명도 포함 — 항상 최신 상태 반영
        if (planRes.data) setPlan(planRes.data as SubscriptionPlan);

        // ── 학생 연결 여부 조회 ────────────────────────────────
        // child.id 목록으로 연결된 student를 한 번에 조회 (N+1 방지)
        // student.child_id IS NOT NULL + onboarding_status = 'completed'인 경우만
        if (fetchedChildren.length > 0) {
          const childIds = fetchedChildren.map((c) => c.id);
          const { data: connectedStudents } = await supabase
            .from("student")
            .select("child_id, nickname")
            .in("child_id", childIds);

          // child_id → nickname(없으면 null) 맵 생성
          const map: StudentMap = {};
          for (const s of connectedStudents ?? []) {
            if (s.child_id) map[s.child_id] = s.nickname ?? null;
          }
          setStudentMap(map);
        }
      } catch (err) {
        console.error("[parent/home] loadData 오류:", err);
      } finally {
        setLoading(false); // 성공/실패/예외 모두 로딩 종료 보장
      }
    }

    loadData();
  }, []);

  const copyInviteCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <p className="text-sm text-base-muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      {/* ── 첫 방문 가이드 팝업 ─────────────────────────────────
          localStorage key: "kkumddara_parent_guide_seen"
          최초 진입 시 1회만 노출. 닫으면 이후 미노출. */}
      <GuideModal
        storageKey="kkumddara_parent_guide_seen"
        title="꿈따라를 처음 시작하는 부모님께"
        intro="꿈따라는 아이에게 직업을 정해주는 서비스가 아닙니다. 아이의 관심사와 성향을 바탕으로, 부모가 함께 진로 이야기를 시작할 수 있도록 돕는 진로 탐색 도구입니다."
        stepsIntro="처음에는 아래 3가지만 해보세요."
        steps={[
          {
            num:     1,
            heading: "아이 정보 확인하기",
            body:    "학년, 관심사, 좋아하는 활동을 기준으로 진로 탐색이 시작됩니다.",
          },
          {
            num:     2,
            heading: "관심 직업 살펴보기",
            body:    "아이와 연결될 수 있는 직업을 보고, 마음에 드는 직업을 저장해보세요.",
          },
          {
            num:     3,
            heading: "대화 질문 활용하기",
            body:    "아이의 생각을 끌어내는 질문으로 진로 대화를 시작해보세요.",
          },
        ]}
        ctaLabel="시작해볼게요"
      />

      <div className="w-full max-w-mobile bg-base-off">

        {/* ── 앱 헤더 ──────────────────────────────── */}
        <header className="sticky top-0 z-10 bg-white border-b border-base-border px-5 h-14 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="꿈따라"
            width={66}
            height={28}
            priority
            style={{ objectFit: "contain", objectPosition: "left center" }}
          />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 text-xs text-base-muted active:opacity-60"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </header>

        <div className="px-5 py-6 flex flex-col gap-5">

          {/* ── 인사말 ────────────────────────────── */}
          <div>
            <p className="text-xs text-base-muted">학부모 홈</p>
            <h1 className="mt-0.5 text-xl font-bold text-base-text leading-snug">
              오늘도 함께
              <span style={{ color: "#E84B2E" }}> 꿈을 설계</span>해요
            </h1>
          </div>

          {/* ══════════════════════════════════════════
              섹션 1 — 자녀 요약 카드
          ══════════════════════════════════════════ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-base-text">자녀 현황</h2>
              {plan && (
                <span className="text-xs text-base-muted">
                  플랜:{" "}
                  <span className="font-semibold text-base-text">
                    {PLAN_LABEL[plan.plan_name] ?? plan.plan_name}
                  </span>
                </span>
              )}
            </div>

            {children.length === 0 ? (
              /* 자녀 없을 때 */
              <button
                onClick={() => router.push("/onboarding/parent")}
                className="
                  w-full bg-white border-2 border-dashed border-base-border
                  rounded-card-lg p-5 text-center
                  hover:border-brand-red transition-colors
                "
              >
                <p className="text-sm font-semibold text-base-muted">
                  자녀 프로필이 없어요
                </p>
                <p className="text-xs text-base-muted mt-1">
                  탭하여 자녀 프로필을 추가해요
                </p>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {children.map((child) => (
                  <ChildSummaryCard
                    key={child.id}
                    child={child}
                    studentNickname={studentMap[child.id] ?? null}
                    isStudentConnected={child.id in studentMap}
                    copied={copiedId === child.id}
                    onCopy={() =>
                      child.invite_code && copyInviteCode(child.invite_code, child.id)
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* ══════════════════════════════════════════
              섹션 1.5 — 이번 주 해볼 대화
              자녀가 있을 때만 표시 / 관심분야·학년 기반 반개인화
          ══════════════════════════════════════════ */}
          {children.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-base-text mb-3">
                {children[0].name}
                {pickParticle(children[0].name, "와", "과")} 해볼 대화 💬
              </h2>
              <div className="bg-white rounded-card-lg shadow-card p-4">
                <div className="flex flex-col gap-3">
                  {getConversationQuestions(children[0]).map((q, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm text-base-text leading-relaxed">
                        &ldquo;{q}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-base-muted mt-3 pt-3 border-t border-base-border leading-relaxed">
                  💡 답변에 정답은 없어요. 자녀가 무엇에 관심 있는지 자연스럽게 파악하는 것이 목적이에요.
                </p>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════
              섹션 2 — 부모 전용 기능 진입
          ══════════════════════════════════════════ */}
          <section>
            <h2 className="text-sm font-bold text-base-text mb-3">부모 전용 기능</h2>
            <div className="flex flex-col gap-2.5">
              {PARENT_FEATURES.map((feat) => (
                <ParentFeatureRow
                  key={feat.id}
                  feature={feat}
                  onClick={() => router.push(feat.href)}
                />
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ── 자녀 요약 카드 ──────────────────────────────────────────
function ChildSummaryCard({
  child,
  studentNickname,
  isStudentConnected,
  copied,
  onCopy,
}: {
  child:               Child;
  studentNickname:     string | null; // 연결된 학생 닉네임 (없으면 null)
  isStudentConnected:  boolean;       // student.child_id에 이 child가 연결됐는지
  copied:              boolean;
  onCopy:              () => void;
}) {
  const router = useRouter();

  // grade_level 우선, 없으면 school_grade 폴백
  const gradeLabel =
    child.grade_level
      ? (GRADE_LEVEL_LABEL[child.grade_level as GradeLevel] ?? null)
      : child.school_grade
        ? (GRADE_LABEL[child.school_grade as Grade] ?? null)
        : null;

  const interestLabels = (child.interests ?? [])
    .slice(0, 3)
    .map((f) => INTEREST_LABEL[f as InterestField] ?? f);

  return (
    <div className="bg-white rounded-card-lg shadow-card p-5">
      {/* 이름 + 학년 + 수정 버튼 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{child.avatar_emoji}</span>
          <div>
            <p className="text-base font-bold text-base-text">{child.name}</p>
            {gradeLabel ? (
              <p className="text-xs text-base-muted">{gradeLabel}</p>
            ) : (
              <p className="text-xs text-base-muted">학년 미설정</p>
            )}
          </div>
        </div>
        {/* 관심 분야 뱃지 + 수정 버튼 */}
        <div className="flex flex-col items-end gap-1.5">
          {interestLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end max-w-[130px]">
              {interestLabels.map((label) => (
                <span
                  key={label}
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#FFF0EB", color: "#E84B2E" }}
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push(`/parent/child/${child.id}/edit`)}
            className="
              flex items-center gap-1 text-[11px] font-semibold
              px-2 py-1 rounded-full
              transition-colors
            "
            style={{ background: "#F3F4F6", color: "#6B7280" }}
          >
            <Pencil size={10} />
            수정
          </button>
        </div>
      </div>

      {/* 학생 연결 상태 */}
      <div className="mb-2.5">
        {isStudentConnected ? (
          <div
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-button w-fit"
            style={{ background: "#F0FDF4", color: "#16A34A" }}
          >
            <Check size={11} />
            {studentNickname
              ? `${studentNickname} 연결됨`
              : "학생 계정 연결됨"}
          </div>
        ) : (
          <p className="text-[11px] text-base-muted">
            학생 계정 미연결 — 초대 코드를 공유해 주세요
          </p>
        )}
      </div>

      {/* 초대 코드 — 미연결이거나 항상 표시 (재공유 가능) */}
      {child.invite_code && (
        <div className="flex items-center justify-between bg-base-off rounded-button px-3 py-2.5">
          <div>
            <p className="text-[10px] text-base-muted mb-0.5">학생 초대 코드</p>
            <p className="text-sm font-mono font-bold tracking-widest text-base-text">
              {child.invite_code}
            </p>
          </div>
          <button
            onClick={onCopy}
            className="
              flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-button
              transition-all
            "
            style={
              copied
                ? { background: "#F0FDF4", color: "#16A34A" }
                : { background: "#FFF0EB", color: "#E84B2E" }
            }
          >
            {copied ? (
              <><Check size={12} /> 복사됨</>
            ) : (
              <><Copy size={12} /> 복사</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ── 부모 전용 기능 행 ───────────────────────────────────────
function ParentFeatureRow({
  feature,
  onClick,
}: {
  feature: ParentFeature;
  onClick: () => void;
}) {
  const disabled = feature.badge === "준비 중";

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      className={`
        w-full bg-white rounded-card-lg shadow-card p-4
        flex items-center gap-4 text-left
        transition-all
        ${disabled
          ? "opacity-60 cursor-default"
          : "hover:shadow-card-hover active:scale-[0.99]"}
      `}
    >
      {/* 아이콘 */}
      <div
        className="w-10 h-10 rounded-card flex items-center justify-center shrink-0"
        style={{ background: "#FFF0EB", color: "#E84B2E" }}
      >
        {feature.icon}
      </div>

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-base-text">{feature.label}</p>
          {feature.badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-base-card text-base-muted">
              {feature.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-base-muted mt-0.5 leading-relaxed">
          {feature.description}
        </p>
      </div>

      {!disabled && (
        <ChevronRight size={16} className="text-base-muted shrink-0" />
      )}
    </button>
  );
}
