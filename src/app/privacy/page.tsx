import CsPageLayout from "@/components/cs/CsPageLayout";

const ARTICLES = [
  {
    title: "제1조 (처리하는 개인정보 항목)",
    subsections: [
      {
        label: "1. 회원가입 및 본인 확인",
        items: ["필수: 이름(또는 닉네임), 이메일 주소, 비밀번호", "선택: 휴대전화번호"],
      },
      {
        label: "2. 자녀 프로필 등록",
        items: [
          "필수: 자녀 닉네임, 학년/연령대, 관심 분야",
          "선택: 성향 정보, 활동 기록, 진로 관심 직군",
        ],
      },
      {
        label: "3. 명따라 서비스 이용",
        items: ["필수: 자녀 생년월일, 태어난 시간, 성별, 양력/음력/윤달 구분"],
      },
      {
        label: "4. 결제 및 환불 처리",
        items: ["필수: 결제 승인 정보, 주문번호, 결제 일시"],
      },
      {
        label: "5. 자동 수집 정보",
        items: ["접속 일시, IP 주소, 브라우저 정보, 서비스 이용 기록, 쿠키, 기기정보"],
      },
    ],
  },
  {
    title: "제2조 (개인정보의 처리 목적)",
    items: [
      "회원 식별 및 계정 관리",
      "맞춤형 진로 탐색 결과 제공",
      "자녀 활동 기록, 리포트 및 추천 서비스 제공",
      "명따라 사주 기반 진로 분석 서비스 제공",
      "유료 서비스 결제, 정산, 환불 처리",
      "고객문의 및 민원 처리",
      "서비스 개선, 오류 분석, 부정 이용 방지",
    ],
  },
  {
    title: "제3조 (개인정보의 처리 및 보유기간)",
    items: [
      "회원정보: 회원 탈퇴 시까지",
      "자녀 프로필 및 활동 데이터: 탈퇴 후 30일 이내 파기",
      "명따라 분석 이력: 탈퇴 시 즉시 삭제",
      "고객문의 기록: 3년",
      "결제 기록: 5년",
      "접속 로그: 3개월",
    ],
  },
  {
    title: "제4조 (개인정보의 제3자 제공)",
    content:
      "회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 이용자의 동의가 있거나 법령에 의한 경우에는 예외로 합니다.",
  },
  {
    title: "제5조 (개인정보 처리의 위탁)",
    delegates: [
      { role: "결제 처리",      company: "포트원(아임포트)" },
      { role: "클라우드 인프라", company: "Vercel / Supabase" },
      { role: "간편로그인",      company: "카카오" },
    ],
  },
  {
    title: "제6조 (미성년 자녀 정보 처리 특칙)",
    items: [
      "자녀 정보는 부모 계정에 종속되며 부모의 동의 하에 처리됩니다.",
      "자녀 정보는 진로 탐색, 미션 제공, 부모 리포트 생성 목적으로만 사용됩니다.",
      "자녀 정보는 광고·마케팅 목적으로 활용하거나 제3자에게 제공하지 않습니다.",
    ],
  },
  {
    title: "제7조 (이용자 권리)",
    items: ["열람 요청", "정정·삭제 요청", "처리정지 요청", "동의 철회"],
  },
  {
    title: "제8조 (개인정보의 안전성 확보조치)",
    items: [
      "접근권한 최소화",
      "비밀번호 암호화",
      "접속기록 보관 및 점검",
      "데이터 전송구간 암호화(SSL/TLS)",
    ],
  },
  {
    title: "제9조 (개인정보 보호책임자)",
    manager: { name: "OZ.Kim", title: "대표", email: "johsoappa@gmail.com" },
  },
  {
    title: "제10조 (처리방침 변경)",
    content: "본 방침은 2026년 4월 1일부터 적용됩니다.",
  },
];

export default function PrivacyPage() {
  return (
    <CsPageLayout title="개인정보처리방침">
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-card p-4 border border-base-border text-center">
          <p className="text-xs text-base-muted">시행일: 2026년 4월 1일</p>
        </div>

        {ARTICLES.map((art) => (
          <div key={art.title} className="bg-white rounded-card-lg p-5 shadow-card">
            <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>
              {art.title}
            </h2>

            {/* 일반 본문 */}
            {"content" in art && art.content && (
              <p className="text-sm text-base-text leading-relaxed">{art.content}</p>
            )}

            {/* 번호 목록 */}
            {"items" in art && art.items && (
              <ol className="flex flex-col gap-2">
                {art.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-base-text leading-relaxed">
                    <span className="font-semibold shrink-0" style={{ color: "#E84B2E" }}>{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            )}

            {/* 서브섹션 (제1조) */}
            {"subsections" in art && art.subsections && (
              <div className="flex flex-col gap-3">
                {art.subsections.map((sub) => (
                  <div key={sub.label}>
                    <p className="text-xs font-semibold text-base-text mb-1">{sub.label}</p>
                    <ul className="flex flex-col gap-1 pl-2">
                      {sub.items.map((item, i) => (
                        <li key={i} className="text-sm text-base-text leading-relaxed flex gap-1">
                          <span className="text-base-muted shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* 위탁 목록 (제5조) */}
            {"delegates" in art && art.delegates && (
              <div className="flex flex-col gap-2">
                {art.delegates.map((d) => (
                  <div key={d.role} className="flex justify-between text-sm py-1.5 border-b border-base-border last:border-0">
                    <span className="text-base-muted">{d.role}</span>
                    <span className="font-medium text-base-text">{d.company}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 담당자 (제9조) */}
            {"manager" in art && art.manager && (
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-muted">성명</span>
                  <span className="text-base-text">{art.manager.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-muted">직책</span>
                  <span className="text-base-text">{art.manager.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-muted">이메일</span>
                  <a href={`mailto:${art.manager.email}`}
                    className="text-brand-red underline">{art.manager.email}</a>
                </div>
              </div>
            )}
          </div>
        ))}

      </div>
    </CsPageLayout>
  );
}
