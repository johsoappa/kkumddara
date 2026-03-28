import CsPageLayout from "@/components/cs/CsPageLayout";

const STEPS = [
  {
    emoji: "🙋",
    title: "회원가입",
    desc: "이메일 또는 카카오 계정으로 간편하게 가입하세요. 최초 가입 시 14일 무료 체험이 자동으로 시작됩니다. 무료 체험은 자동결제로 연결되지 않으니 안심하세요.",
  },
  {
    emoji: "👧",
    title: "자녀 프로필 만들기",
    desc: "자녀의 이름(닉네임), 학년, 관심 분야를 입력하세요. 프로필은 언제든지 수정할 수 있으며, 여러 자녀를 등록할 수도 있습니다.",
  },
  {
    emoji: "🌱",
    title: "모드 선택",
    desc: "씨앗·새싹·나침반 중 자녀의 진로 탐색 단계에 맞는 모드를 선택하세요.\n• 씨앗: 다양한 직업 탐색 단계\n• 새싹: 관심 직업 심화 탐구 단계\n• 나침반: 목표 직업 체계적 준비 단계",
  },
  {
    emoji: "🔍",
    title: "진로 탐색 시작",
    desc: "관심 분야별 직업을 탐색하고, 마음에 드는 직업에 ♥ 좋아요를 눌러보세요. 각 직업의 상세 정보, 관련 학과, 연봉, 미래 유망도를 확인할 수 있습니다.",
  },
  {
    emoji: "✅",
    title: "미션 진행",
    desc: "선택한 직업의 로드맵 미션을 단계별로 수행하세요. 현재(CURRENT) → 다음(NEXT) → 미래(FUTURE) 단계로 진행되며, 각 단계의 모든 미션을 완료하면 다음 단계가 해제됩니다.",
  },
  {
    emoji: "📊",
    title: "부모 리포트 보기",
    desc: "자녀의 활동 현황, 달성률, 강점 분석, 추천 직업 등을 리포트로 확인하세요. 매주 업데이트되는 성장 데이터를 한눈에 볼 수 있습니다.",
  },
  {
    emoji: "✨",
    title: "명따라 사용하기",
    desc: "홈 화면의 명따라 배너를 터치해 자녀의 생년월일시를 입력하세요. 동양 철학(사주명리학) 기반의 기질·적성 분석 결과를 확인할 수 있습니다. 현재 테스트 버전으로 운영 중입니다.",
  },
  {
    emoji: "👨‍👩‍👧",
    title: "공동 양육자 초대",
    desc: "설정 메뉴에서 배우자 또는 공동 양육자를 초대하세요. 초대받은 분은 자녀의 리포트·로드맵을 함께 볼 수 있습니다. 초대 링크는 7일간 유효합니다.",
  },
  {
    emoji: "💳",
    title: "결제 및 이용권 관리",
    desc: "설정 > 구독 관리에서 요금제를 선택하고 결제하세요. 구독은 언제든 해지할 수 있으며, 해지 시에도 기간 만료 전까지 이용 가능합니다.\n\n• 베이직 9,900원 / 프리미엄 14,900원\n• 패밀리 19,900원 / 패밀리플러스 24,900원",
  },
  {
    emoji: "💬",
    title: "문의하기",
    desc: "서비스 이용 중 궁금한 점은 1:1 문의를 이용해 주세요. 카카오채널 '좋소아빠' 또는 이메일(johsoappa@gmail.com)로 문의하시면 평일 오전 10시 ~ 오후 6시 운영 중에 답변드립니다.",
  },
];

export default function GuidePage() {
  return (
    <CsPageLayout title="사용자 가이드">
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-card p-4 border border-base-border text-center">
          <p className="text-xs text-base-muted">꿈따라 시작부터 활용까지 단계별로 안내해 드릴게요 🚀</p>
        </div>

        {STEPS.map((step, i) => (
          <div key={i} className="bg-white rounded-card-lg p-5 shadow-card">
            <div className="flex items-start gap-4">
              {/* 번호 + 이모지 */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: "#E84B2E" }}
                >
                  {i + 1}
                </span>
                <span className="text-xl leading-none">{step.emoji}</span>
              </div>
              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-base-text mb-2">{step.title}</h2>
                <p className="text-sm text-base-text leading-relaxed whitespace-pre-line">
                  {step.desc}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* 하단 CTA */}
        <div
          className="rounded-card-lg p-5 text-center"
          style={{ backgroundColor: "#FFF0EB" }}
        >
          <p className="text-sm font-semibold text-base-text mb-1">아직 시작 전이라면?</p>
          <p className="text-xs text-base-muted mb-3">14일 무료 체험으로 꿈따라를 경험해 보세요!</p>
          <a
            href="/contact"
            className="inline-block px-5 py-2 rounded-button text-sm font-bold text-white"
            style={{ backgroundColor: "#E84B2E" }}
          >
            1:1 문의하기
          </a>
        </div>

      </div>
    </CsPageLayout>
  );
}
