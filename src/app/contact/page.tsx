import CsPageLayout from "@/components/cs/CsPageLayout";

export default function ContactPage() {
  return (
    <CsPageLayout title="1:1 문의 안내">
      <div className="flex flex-col gap-4">

        {/* 운영시간 카드 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold text-base-text mb-3">🕐 운영시간</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-base-muted">평일</span>
              <span className="font-medium text-base-text">오전 10:00 ~ 오후 6:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-muted">주말·공휴일</span>
              <span className="text-base-muted">휴무</span>
            </div>
            <div className="mt-2 p-3 rounded-card text-xs text-base-muted leading-relaxed"
              style={{ backgroundColor: "#F8F8F8" }}>
              운영시간 외 문의는 순차적으로 처리되며,<br />
              다음 영업일 오전 중 답변드립니다.
            </div>
          </div>
        </div>

        {/* 카카오채널 버튼 */}
        <a
          href="https://pf.kakao.com/_johsoappa"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-card-lg p-5 shadow-card flex items-center gap-4 active:opacity-80 transition-opacity"
          style={{ backgroundColor: "#FEE500" }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#3C1E1E" }}
          >
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path
                fillRule="evenodd" clipRule="evenodd"
                d="M9 0.5C4.029 0.5 0 3.643 0 7.5C0 10.003 1.548 12.205 3.9 13.5L3 17.5L7.2 14.877C7.789 14.959 8.39 15 9 15C13.971 15 18 11.866 18 8C18 4.134 13.971 0.5 9 0.5Z"
                fill="#FEE500"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "#3C1E1E" }}>카카오채널로 문의</p>
            <p className="text-xs mt-0.5" style={{ color: "#5C3D1E" }}>
              좋소아빠 채널 · 가장 빠른 답변
            </p>
          </div>
          <span className="text-lg">→</span>
        </a>

        {/* 이메일 버튼 */}
        <a
          href="mailto:johsoappa@gmail.com"
          className="rounded-card-lg p-5 shadow-card flex items-center gap-4 active:opacity-80 transition-opacity"
          style={{ backgroundColor: "#FFF0EB", border: "1.5px solid #E84B2E" }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white text-lg"
            style={{ backgroundColor: "#E84B2E" }}
          >
            ✉️
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-base-text">이메일 문의</p>
            <p className="text-xs text-base-muted mt-0.5">johsoappa@gmail.com</p>
          </div>
          <span className="text-lg">→</span>
        </a>

        {/* 문의 시 필요한 정보 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold text-base-text mb-3">📋 문의 시 알려주시면 빠릅니다</h2>
          <ul className="flex flex-col gap-2">
            {[
              "가입하신 이메일 주소",
              "문의 유형 (결제 / 환불 / 오류 / 기타)",
              "문제 발생 일시 및 상세 내용",
              "오류 화면 스크린샷 (있는 경우)",
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-base-text">
                <span style={{ color: "#E84B2E" }} className="shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 처리 기준 카드 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold text-base-text mb-3">⏱ 문의 처리 기준</h2>
          <div className="flex flex-col gap-2">
            {[
              { type: "일반 문의",   time: "1영업일 이내" },
              { type: "환불 신청",   time: "1영업일 이내 안내" },
              { type: "카드 취소",   time: "3~5영업일 소요" },
              { type: "오류·버그",   time: "2영업일 이내" },
              { type: "계정 관련",   time: "1영업일 이내" },
            ].map((row) => (
              <div key={row.type}
                className="flex justify-between py-2 border-b border-base-border last:border-0 text-sm">
                <span className="text-base-muted">{row.type}</span>
                <span className="font-medium text-base-text">{row.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ 연결 */}
        <a
          href="/faq"
          className="bg-white rounded-card-lg p-4 shadow-card flex items-center justify-between active:opacity-80 transition-opacity"
        >
          <div>
            <p className="text-sm font-semibold text-base-text">자주 묻는 질문 보기</p>
            <p className="text-xs text-base-muted mt-0.5">문의 전에 FAQ를 확인해 보세요 🙋</p>
          </div>
          <span className="text-base-muted text-lg">›</span>
        </a>

      </div>
    </CsPageLayout>
  );
}
