import CsPageLayout from "@/components/cs/CsPageLayout";

export default function RefundPage() {
  return (
    <CsPageLayout title="환불정책">
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-card p-4 border border-base-border text-center">
          <p className="text-xs text-base-muted">시행일: 2026년 4월 1일</p>
        </div>

        {/* 제1조 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>제1조 (기본 원칙)</h2>
          <p className="text-sm text-base-text leading-relaxed">
            좋소아빠는 「전자상거래 등에서의 소비자보호에 관한 법률」을 준수하며
            명확한 기준으로 환불을 처리합니다.
          </p>
        </div>

        {/* 제2조 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>제2조 (14일 무료 체험 정책)</h2>
          <ol className="flex flex-col gap-2">
            {[
              "최초 가입 시 14일 무료 체험 제공",
              "무료 체험은 자동결제로 연결되지 않음",
              "유료 전환은 회원이 직접 선택",
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-base-text leading-relaxed">
                <span className="font-semibold shrink-0" style={{ color: "#E84B2E" }}>{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* 제3조 — 환불 기준 테이블 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-4" style={{ color: "#E84B2E" }}>제3조 (환불 기준)</h2>
          <div className="flex flex-col gap-2">
            {[
              { condition: "결제 후 24시간 이내", result: "전액 환불 (이용 이력 무관)" },
              { condition: "7일 이내 + 미이용",   result: "전액 환불" },
              { condition: "7일 이내 + 이용 개시", result: "이용 범위·잔여기간 고려 산정" },
              { condition: "7일 초과",             result: "환불 불가 (해지는 언제든 가능)" },
            ].map((row) => (
              <div key={row.condition}
                className="flex flex-col gap-1 p-3 rounded-card border border-base-border">
                <span className="text-xs font-semibold text-base-muted">{row.condition}</span>
                <span className="text-sm font-medium text-base-text">{row.result}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-base-muted mt-3 leading-relaxed">
            결제 후 서비스 이용이 전혀 개시되지 않은 경우에도 이용 조건에 따라 처리됩니다.
          </p>
        </div>

        {/* 제4조 요금제 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-4" style={{ color: "#E84B2E" }}>제4조 (요금제별 안내)</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { plan: "베이직",       price: "9,900원" },
              { plan: "프리미엄",     price: "14,900원" },
              { plan: "패밀리",       price: "19,900원" },
              { plan: "패밀리플러스", price: "24,900원" },
            ].map((p) => (
              <div key={p.plan}
                className="flex flex-col items-center gap-1 p-3 rounded-card border border-base-border text-center">
                <span className="text-xs text-base-muted">{p.plan}</span>
                <span className="text-sm font-bold text-base-text">{p.price}<span className="text-xs font-normal">/월</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* 제5조 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-2" style={{ color: "#E84B2E" }}>제5조 (이용 이력 확인 기준)</h2>
          <p className="text-sm text-base-text leading-relaxed">
            서비스 이용 여부는 로그인 기록, 콘텐츠 열람, 분석 실행, 리포트 제공,
            미션 수행 등 시스템 기록을 종합하여 판단합니다.
          </p>
        </div>

        {/* 제6조 장애 보상 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>제6조 (서비스 장애 시 보상)</h2>
          <div className="flex flex-col gap-2">
            {[
              { duration: "24시간 이내 장애", comp: "해당 일 이용권 연장" },
              { duration: "72시간 이상 장애", comp: "해당 기간 일할 환불" },
              { duration: "7일 이상 장애",    comp: "해당 월 전액 환불" },
            ].map((row) => (
              <div key={row.duration}
                className="flex justify-between items-center py-2 border-b border-base-border last:border-0 text-sm">
                <span className="text-base-muted">{row.duration}</span>
                <span className="font-medium text-base-text">{row.comp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 제7조 신청 방법 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>제7조 (환불 신청)</h2>
          <div className="flex flex-col gap-2 text-sm text-base-text">
            <div className="flex gap-2">
              <span className="text-base-muted shrink-0">카카오채널</span>
              <span className="font-medium">꿈따라</span>
            </div>
            <div className="flex gap-2">
              <span className="text-base-muted shrink-0">이메일</span>
              <a href="mailto:johsoappa@gmail.com" className="text-brand-red underline">
                johsoappa@gmail.com
              </a>
            </div>
            <div className="flex gap-2">
              <span className="text-base-muted shrink-0">처리 기간</span>
              <span>접수 후 1영업일 이내 안내</span>
            </div>
            <div className="flex gap-2">
              <span className="text-base-muted shrink-0">카드 취소</span>
              <span>3~5영업일 소요</span>
            </div>
          </div>
        </div>

        {/* 부칙 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-2" style={{ color: "#E84B2E" }}>부칙</h2>
          <p className="text-sm text-base-text leading-relaxed">
            본 정책은 2026년 4월 1일부터 적용됩니다.
          </p>
        </div>

      </div>
    </CsPageLayout>
  );
}
