// ====================================================
// 학원 원장 대상 B2B Lite 랜딩 (/academy)
//
// [성격]
//   - 좌석 판매 페이지가 아니라 "원생 진로 관리 시스템" 소개 랜딩
//   - 공개 라우트 (미들웨어 matcher 비포함 → 인증/리다이렉트 충돌 없음)
//   - 정적 서버 컴포넌트: 샘플 배열만 사용, 실제 DB 연결 없음
//
// [CTA 연결 — Step 0 조사 결과]
//   - "우리 학원 파일럿 신청하기" → /contact (운영 중 1:1 문의 경로)
//   - "원장 대시보드 미리보기"   → #dashboard-preview 앵커 이동
//
// [샘플 데이터 고지]
//   - 대시보드 미리보기는 실제 원생 데이터가 아닌 정적 샘플
// ====================================================

import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  MessagesSquare,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

// ── 보조 후보 문구(화면 비노출, 보관용 주석) ──────────────────
// 헤어로 보조 후보: "성적 너머, 아이의 다음 방향까지 보여주는 학원"

// ── 대시보드 미리보기 — 정적 샘플 데이터 (실제 원생 데이터 아님) ──
const SAMPLE_NEEDS_COUNSELING = [
  { name: "민서", grade: "중2", reason: "최근 9일 활동 없음" },
  { name: "도윤", grade: "초6", reason: "진행률 저조 (12%)" },
  { name: "하린", grade: "고1", reason: "학부모 상담 추천" },
];

const SAMPLE_STUDENTS = [
  { name: "지우", grade: "중1", progress: 78, lastActive: "오늘", interest: "영상 콘텐츠 제작자", status: "활발" },
  { name: "민서", grade: "중2", progress: 41, lastActive: "9일 전", interest: "간호사", status: "상담 필요" },
  { name: "서준", grade: "초5", progress: 64, lastActive: "2일 전", interest: "로봇공학자", status: "활발" },
  { name: "도윤", grade: "초6", progress: 12, lastActive: "6일 전", interest: "게임 기획자", status: "상담 필요" },
  { name: "하린", grade: "고1", progress: 55, lastActive: "3일 전", interest: "경찰관", status: "보통" },
];

const SAMPLE_TOP_INTERESTS = [
  { label: "영상 콘텐츠 제작자", count: 8 },
  { label: "로봇공학자", count: 6 },
  { label: "간호사", count: 5 },
  { label: "경찰관", count: 4 },
  { label: "게임 기획자", count: 3 },
];

// ── 학원이 얻는 것 카드 ──────────────────────────────────────
const VALUE_CARDS = [
  {
    icon: <LayoutDashboard size={22} strokeWidth={1.8} />,
    title: "한눈에 보는 원생 진로 현황",
    body: "누가 활발하고, 누가 멈췄고, 누구를 상담해야 할지 대시보드 한 화면에서 확인합니다.",
  },
  {
    icon: <MessagesSquare size={22} strokeWidth={1.8} />,
    title: "학부모 상담이 강해집니다",
    body: "“성적은 이렇고, 진로 방향은 이렇습니다.” 꿈따라 리포트가 상담 테이블 위 자료가 됩니다.",
  },
  {
    icon: <Sparkles size={22} strokeWidth={1.8} />,
    title: "다른 학원이 못 하는 차별화",
    body: "진로 관리는 아직 대부분의 학원이 못 합니다. 재등록 상담의 결정적 한 마디가 됩니다.",
  },
];

// ── 도입 흐름 4단계 (학부모 동의가 학생 활성화보다 먼저) ──────
const FLOW_STEPS = [
  "원장님이 원생을 등록합니다.",
  "학부모 동의 후, 원생이 진로 탐색을 시작합니다.",
  "원장님은 대시보드에서 전체 현황을 봅니다.",
  "상담이 필요한 원생을 골라 학부모와 대화합니다.",
];

// ── 신뢰 근거 ────────────────────────────────────────────────
const TRUST_ITEMS = [
  "직업정보제공사업 신고 기반 운영",
  "고용24 등 공공데이터 기반 직업 정보 활용",
  "초1~고등 단계별 진로 탐색 구조",
  "상표 등록 완료 (워드마크 · 가로형 로고)",
];

export default function AcademyLandingPage() {
  return (
    <div className="min-h-screen bg-base-off">
      <div className="mx-auto w-full max-w-3xl bg-white">

        {/* ── 상단 바 ─────────────────────────────────── */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-base-border px-5 sm:px-8 h-14 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="꿈따라"
            width={72}
            height={30}
            priority
            style={{ objectFit: "contain", objectPosition: "left center" }}
          />
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-base-muted border border-base-border">
            학원용
          </span>
        </header>

        {/* ══════════════════════════════════════════════
            4-1. 히어로
        ══════════════════════════════════════════════ */}
        <section className="px-5 sm:px-8 pt-10 pb-8">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: "#EEF2FF", color: "#4F6BD9" }}
          >
            <ShieldCheck size={13} /> 원생 진로 관리 시스템
          </span>

          <h1 className="text-[26px] sm:text-3xl font-bold text-base-text leading-snug">
            우리 학원은 진로까지 관리합니다.
          </h1>

          <p className="mt-5 text-[15px] text-base-text leading-relaxed whitespace-pre-line">
            {"수업은 성적을 만들고,\n꿈따라는 그 아이가 어디로 갈지를 함께 봅니다.\n\n학원이 진로까지 관리하는 순간,\n학부모의 신뢰가 달라집니다."}
          </p>

          <p className="mt-5 text-sm text-base-muted leading-relaxed">
            꿈따라는 원생 한 명 한 명의 진로 탐색을 기록하고,
            원장님이 한눈에 보고, 학부모 상담에 바로 쓸 수 있게 만듭니다.
          </p>

          {/* CTA 2개 */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              href="/contact"
              className="flex-1 py-3.5 rounded-button text-sm font-bold text-white text-center flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity"
              style={{ backgroundColor: "#E84B2E" }}
            >
              우리 학원 파일럿 신청하기
              <ChevronRight size={16} />
            </Link>
            <a
              href="#dashboard-preview"
              className="flex-1 py-3.5 rounded-button text-sm font-bold text-center border-2 border-brand-red text-brand-red active:opacity-80 transition-opacity"
            >
              원장 대시보드 미리보기
            </a>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            4-2. 학원이 얻는 것
        ══════════════════════════════════════════════ */}
        <section className="px-5 sm:px-8 py-9 bg-base-off">
          <h2 className="text-lg font-bold text-base-text leading-snug">
            학원이 얻는 것은 학생 앱이 아니라, 상담에 쓸 수 있는 진로 관리 자료입니다.
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {VALUE_CARDS.map((card) => (
              <div key={card.title} className="bg-white rounded-card-lg shadow-card p-5">
                <div
                  className="w-11 h-11 rounded-card flex items-center justify-center mb-3"
                  style={{ background: "#FFF0EB", color: "#E84B2E" }}
                >
                  {card.icon}
                </div>
                <p className="text-[15px] font-bold text-base-text">{card.title}</p>
                <p className="mt-1.5 text-sm text-base-muted leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            4-3. "무료인데 왜 학원이 도입하나요?"
        ══════════════════════════════════════════════ */}
        <section className="px-5 sm:px-8 py-9">
          <h2 className="text-lg font-bold text-base-text leading-snug">
            꿈따라는 무료인데, 왜 학원이 도입하나요?
          </h2>

          <p className="mt-4 text-sm text-base-text leading-relaxed whitespace-pre-line">
            {"맞습니다. 아이들의 기본 진로 탐색은 무료로 이용할 수 있습니다.\n\n하지만 학원용 꿈따라가 제공하는 것은 다릅니다.\n\n무료 이용자는 직업 탐색, 로드맵, 미션을 직접 사용합니다.\n학원은 원생 전체를 한눈에 관리하고,\n학부모 상담에 쓸 수 있는 운영 시스템을 사용합니다."}
          </p>

          {/* 강조 박스 */}
          <div
            className="mt-5 rounded-card-lg p-5"
            style={{ background: "#FFF0EB", border: "1.5px solid #E84B2E" }}
          >
            <p className="text-[15px] font-bold leading-relaxed" style={{ color: "#C83A20" }}>
              학원이 도입하는 것은 학생용 앱 이용권이 아니라,
              원생 진로를 관리하는 시스템입니다.
            </p>
          </div>

          {/* 하단 bullet */}
          <ul className="mt-5 flex flex-col gap-2.5">
            {[
              "원생 전체를 관리하는 원장 대시보드",
              "학부모 상담에 쓰는 학원 전용 리포트",
              "우리 학원 이름으로 제공되는 진로 관리 경험",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-base-text">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" style={{ color: "#E84B2E" }} />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ══════════════════════════════════════════════
            4-4. 원장 대시보드 미리보기 (id="dashboard-preview")
        ══════════════════════════════════════════════ */}
        <section id="dashboard-preview" className="px-5 sm:px-8 py-9 bg-base-off scroll-mt-16">
          {/* 샘플 데이터 고지 */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "#FFF7E6", color: "#B45309", border: "1px solid #FCD9A0" }}
            >
              샘플 데이터
            </span>
          </div>
          <p className="text-xs text-base-muted mb-4">
            샘플 화면입니다. 실제 원생 데이터가 아닙니다.
          </p>

          <h2 className="text-lg font-bold text-base-text">원장 대시보드 미리보기</h2>
          <p className="mt-2 text-[15px] font-semibold" style={{ color: "#E84B2E" }}>
            오늘 누구에게 연락해야 하나?
          </p>

          {/* 1순위 — 상담 필요 원생 */}
          <div className="mt-5">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={15} style={{ color: "#E84B2E" }} />
              <h3 className="text-sm font-bold text-base-text">1순위 · 상담 필요 원생</h3>
            </div>
            <div className="flex flex-col gap-2">
              {SAMPLE_NEEDS_COUNSELING.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between bg-white rounded-card-lg shadow-card p-3.5"
                  style={{ borderLeft: "3px solid #E84B2E" }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-base-text">{s.name}</span>
                    <span className="text-xs text-base-muted">{s.grade}</span>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-1 rounded-full"
                    style={{ background: "#FFF0EB", color: "#C83A20" }}
                  >
                    {s.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2순위 — 원생별 진행률 + 마지막 활동일 (모바일 가로 스크롤) */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-base-text mb-2">
              2순위 · 원생별 진행률 + 마지막 활동일
            </h3>
            <div className="bg-white rounded-card-lg shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-left text-xs text-base-muted border-b border-base-border">
                      <th className="font-semibold px-3 py-2.5">원생</th>
                      <th className="font-semibold px-3 py-2.5">학년</th>
                      <th className="font-semibold px-3 py-2.5">진행률</th>
                      <th className="font-semibold px-3 py-2.5">마지막 활동일</th>
                      <th className="font-semibold px-3 py-2.5">관심 직업</th>
                      <th className="font-semibold px-3 py-2.5">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_STUDENTS.map((s) => (
                      <tr key={s.name} className="border-b border-base-border last:border-0">
                        <td className="px-3 py-2.5 font-medium text-base-text">{s.name}</td>
                        <td className="px-3 py-2.5 text-base-muted">{s.grade}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 rounded-full bg-base-border overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${s.progress}%`,
                                  background: "linear-gradient(90deg,#E84B2E,#FF7043)",
                                }}
                              />
                            </div>
                            <span className="text-xs text-base-muted">{s.progress}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-base-muted">{s.lastActive}</td>
                        <td className="px-3 py-2.5 text-base-text">{s.interest}</td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3순위 — 관심 직업 TOP */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-base-text mb-2">3순위 · 관심 직업 TOP</h3>
            <div className="bg-white rounded-card-lg shadow-card p-4 flex flex-col gap-2.5">
              {SAMPLE_TOP_INTERESTS.map((it, i) => (
                <div key={it.label} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5 text-base-muted">{i + 1}</span>
                  <span className="text-sm text-base-text flex-1">{it.label}</span>
                  <span className="text-xs font-semibold text-base-muted">{it.count}명</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            4-5. 작동 흐름
        ══════════════════════════════════════════════ */}
        <section className="px-5 sm:px-8 py-9">
          <h2 className="text-lg font-bold text-base-text">도입 흐름은 단순합니다.</h2>
          <ol className="mt-5 flex flex-col gap-3">
            {FLOW_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                  style={{ backgroundColor: "#E84B2E" }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-base-text leading-relaxed pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ══════════════════════════════════════════════
            4-6. 학부모 동의 고지
        ══════════════════════════════════════════════ */}
        <section className="px-5 sm:px-8 py-9 bg-base-off">
          <div className="flex items-start gap-2 mb-3">
            <ShieldCheck size={20} className="shrink-0 mt-0.5" style={{ color: "#4F6BD9" }} />
            <h2 className="text-lg font-bold text-base-text leading-snug">
              미성년 원생 데이터는 학부모 동의 후에만 활성화됩니다.
            </h2>
          </div>

          <p className="text-sm text-base-text leading-relaxed whitespace-pre-line">
            {"원생을 등록하는 것만으로 활동 데이터가 수집되지는 않습니다.\n\n학부모가 동의하기 전까지 원생은 미활성 상태이며,\n진로 탐색 활동 데이터는 수집되지 않습니다.\n\n학부모 동의가 완료된 뒤에만 원생 좌석이 활성화되고,\n그때부터 학원이 원생의 진로 탐색 현황을 확인할 수 있습니다."}
          </p>

          {/* 강조 */}
          <div className="mt-5 rounded-card-lg bg-white shadow-card p-5 flex flex-col gap-2">
            <p className="text-sm font-bold text-base-text">원생 등록 ≠ 데이터 수집</p>
            <p className="text-sm font-bold" style={{ color: "#E84B2E" }}>
              학부모 동의 완료 = 좌석 활성화 + 데이터 수집 시작
            </p>
          </div>

          {/* 철회 고지 */}
          <p className="mt-4 text-xs text-base-muted leading-relaxed">
            학부모는 언제든 동의를 철회할 수 있으며,
            철회 시 학원의 열람은 즉시 중단됩니다.
          </p>
        </section>

        {/* ══════════════════════════════════════════════
            4-7. 파일럿 안내
        ══════════════════════════════════════════════ */}
        <section className="px-5 sm:px-8 py-9">
          <h2 className="text-lg font-bold text-base-text">지금은 파일럿 학원을 찾고 있습니다.</h2>
          <p className="mt-4 text-sm text-base-text leading-relaxed">
            선정된 학원은 도입 비용 없이 먼저 사용해보고,
            실제 원생 관리와 학부모 상담에 도움이 되는지 함께 확인합니다.
          </p>

          <div
            className="mt-5 rounded-card-lg p-4 text-center"
            style={{ background: "#FFF0EB" }}
          >
            <p className="text-[15px] font-bold" style={{ color: "#C83A20" }}>
              파일럿 = 무료 체험 + 함께 만드는 단계
            </p>
          </div>

          <p className="mt-4 text-xs text-base-muted leading-relaxed">
            정식 요금은 파일럿 이후, 실제 사용 결과와 학원 의견을 반영해 결정합니다.
          </p>

          <Link
            href="/contact"
            className="mt-6 w-full py-4 rounded-button text-sm font-bold text-white flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity"
            style={{ backgroundColor: "#E84B2E" }}
          >
            우리 학원 파일럿 신청하기
            <ChevronRight size={16} />
          </Link>
        </section>

        {/* ══════════════════════════════════════════════
            4-8. 신뢰 근거 (footer 위)
        ══════════════════════════════════════════════ */}
        <section className="px-5 sm:px-8 py-8 border-t border-base-border">
          <ul className="flex flex-col gap-2">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-base-muted">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-base-muted" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[11px] text-base-muted leading-relaxed">
            꿈따라는 OZ.K Lab이 운영하는 자녀 진로 탐색 및 진로 설계 서비스입니다.
          </p>
        </section>

      </div>
    </div>
  );
}

// ── 상태 뱃지 ────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const style =
    status === "상담 필요"
      ? { background: "#FFF0EB", color: "#C83A20" }
      : status === "활발"
        ? { background: "#E8F5E9", color: "#2E7D32" }
        : { background: "#F2F2F2", color: "#616161" };
  return (
    <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={style}>
      {status}
    </span>
  );
}
