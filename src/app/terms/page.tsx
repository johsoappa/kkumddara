import CsPageLayout from "@/components/cs/CsPageLayout";

const ARTICLES = [
  {
    title: "제1조 (목적)",
    content: `이 약관은 좋소아빠(이하 "회사")가 제공하는 꿈따라 웹사이트 및 앱 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 정함을 목적으로 합니다.`,
  },
  {
    title: "제2조 (정의)",
    items: [
      `"서비스"란 회사가 제공하는 진로 탐색, 활동 미션, 부모 리포트, 결제형 부가서비스 등 일체의 온라인 서비스를 말합니다.`,
      `"회원"이란 본 약관에 동의하고 회사와 이용계약을 체결한 자를 말합니다.`,
      `"유료서비스"란 회사가 유상으로 제공하는 구독형 또는 단건형 서비스를 말합니다.`,
      `"명따라"란 아이의 생년월일시를 기반으로 동양 철학(사주명리학) 관점에서 기질과 적성을 분석해 보는 참고용 부가서비스를 말합니다.`,
      `"콘텐츠"란 텍스트, 이미지, 리포트, 추천 결과, 미션 데이터 등 서비스 내 제공되는 모든 정보를 말합니다.`,
    ],
  },
  {
    title: "제3조 (약관의 게시와 개정)",
    items: [
      "회사는 본 약관을 서비스 초기화면 또는 연결화면에 게시합니다.",
      "회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있습니다.",
      "약관을 개정하는 경우 적용일자와 개정사유를 사전 공지합니다.",
    ],
  },
  {
    title: "제4조 (서비스의 내용)",
    content: "회사는 다음 서비스를 제공할 수 있습니다.",
    items: [
      "자녀 성향·관심 기반 진로 탐색",
      "모드별 활동 미션 제공 (씨앗모드/새싹모드/나침반모드)",
      "부모 리포트 및 추천 결과 제공",
      "명따라 사주 기반 진로 분석 서비스",
      "공동 양육자 초대 서비스",
      "유료 구독 서비스",
      "기타 회사가 정하는 부가서비스",
    ],
  },
  {
    title: "제5조 (명따라 서비스 특약)",
    items: [
      "명따라는 동양 철학(사주명리학) 기반의 참고용 진로 분석 부가서비스입니다.",
      "명따라 분석 결과는 어떠한 입시·취업·진로 결과도 보장하지 않으며, 법적·의학적 근거가 있는 진단이 아닙니다.",
      "명따라 서비스는 현재 테스트 버전으로 운영될 수 있으며, 이 경우 서비스 내 테스트 버전임을 명시합니다.",
      "명따라 분석에 입력된 생년월일·시간·성별 정보는 분석 목적으로만 사용됩니다.",
    ],
  },
  {
    title: "제6조 (공동 양육자 초대 서비스)",
    items: [
      "메인 계정(결제자)은 1인의 공동 양육자를 초대할 수 있습니다.",
      "공동 양육자는 자녀 리포트·로드맵 조회만 가능하며, 결제·구독 변경·자녀 프로필 수정 권한은 메인 계정에만 있습니다.",
      "초대 링크는 발송 후 7일간 유효합니다.",
      "공동 양육자 계정은 메인 계정 해지 시 자동으로 접근 권한이 종료됩니다.",
      "공동 양육자 간 상호 계정 정보는 노출되지 않으며, 자녀 정보만 공유됩니다.",
    ],
  },
  {
    title: "제7조 (유료서비스의 이용)",
    items: [
      "유료서비스의 가격, 기간, 제공 범위는 결제 화면에 표시된 바에 따릅니다.",
      "유료서비스는 결제 완료 시점부터 이용 가능합니다.",
      "구독형 상품은 해지 전까지 동일 조건으로 갱신될 수 있으며, 자동결제 여부와 주기는 결제 화면에 별도 표시합니다.",
    ],
  },
  {
    title: "제8조 (청약철회, 계약해지 및 환불)",
    content: "유료서비스의 청약철회 및 환불은 별도의 환불정책에 따릅니다.",
  },
  {
    title: "제9조 (회사의 의무)",
    items: [
      "회사는 관련 법령과 본 약관을 준수합니다.",
      "회사는 안정적인 서비스 제공을 위해 노력합니다.",
      "회사는 이용자의 개인정보를 관련 법령에 따라 보호합니다.",
    ],
  },
  {
    title: "제10조 (회원의 의무)",
    content: "회원은 다음 행위를 하여서는 안 됩니다.",
    items: [
      "허위 정보 입력",
      "타인 계정 사용",
      "서비스 내 정보의 무단 복제·배포·상업적 이용",
      "회사 또는 제3자의 권리 침해",
      "시스템 장애를 유발하는 행위",
      "청소년에게 유해하거나 불법적인 정보 게시",
    ],
  },
  {
    title: "제11조 (면책)",
    items: [
      "회사는 천재지변, 불가항력, 이용자 귀책사유로 인한 손해에 대하여 책임을 지지 않습니다.",
      "꿈따라가 제공하는 추천·리포트·가이드는 교육적 참고자료이며, 입시·취업·진로 결과를 보장하지 않습니다.",
      "명따라 분석 결과는 동양 철학 기반 참고용 콘텐츠이며 어떠한 결과도 보장하지 않습니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <CsPageLayout title="이용약관">
      <div className="flex flex-col gap-4">

        {/* 시행일 배너 */}
        <div className="bg-white rounded-card p-4 border border-base-border text-center">
          <p className="text-xs text-base-muted">시행일: 2026년 4월 1일</p>
        </div>

        {/* 조항 카드 */}
        {ARTICLES.map((art) => (
          <div key={art.title} className="bg-white rounded-card-lg p-5 shadow-card">
            <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>
              {art.title}
            </h2>
            {art.content && (
              <p className="text-sm text-base-text leading-relaxed mb-2">{art.content}</p>
            )}
            {art.items && (
              <ol className="flex flex-col gap-2">
                {art.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-base-text leading-relaxed">
                    <span className="font-semibold shrink-0" style={{ color: "#E84B2E" }}>
                      {i + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}

        {/* 부칙 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-2" style={{ color: "#E84B2E" }}>부칙</h2>
          <p className="text-sm text-base-text leading-relaxed">
            본 약관은 2026년 4월 1일부터 적용됩니다.
          </p>
        </div>

      </div>
    </CsPageLayout>
  );
}
