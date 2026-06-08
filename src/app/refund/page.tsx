import CsPageLayout from "@/components/cs/CsPageLayout";

export default function RefundPage() {
  return (
    <CsPageLayout title="환불정책">
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-card p-4 border border-base-border text-center">
          <p className="text-xs text-base-muted">시행일: 2026년 4월 1일</p>
        </div>

        {/* 베타 기간 결제 미연동 안내 */}
        <div
          className="rounded-card-lg p-4"
          style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: "#92400E" }}>
            📢 베타 기간 안내
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#92400E" }}>
            현재 꿈따라는 베타 운영 중이며, 결제 기능은 아직 연결되어 있지 않습니다.
            아래 환불정책은 정식 결제 기능 도입 시 적용될 기준이며,
            실제 결제는 추후 별도 공지 후 적용됩니다.
          </p>
        </div>

        {/* 제1조 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>제1조 (기본 원칙)</h2>
          <p className="text-sm text-base-text leading-relaxed">
            OZ.K Lab은 「전자상거래 등에서의 소비자보호에 관한 법률」을 준수하며
            명확한 기준으로 환불을 처리합니다.
          </p>
        </div>

        {/* 제2조 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>제2조 (베타 기간 운영 기준)</h2>
          <p className="text-sm text-base-text leading-relaxed">
            현재는 베타 운영 단계로 정식 유료 결제 전입니다.
            환불 기준은 결제 기능 오픈 시점에 맞춰 별도 안내됩니다.
          </p>
        </div>

        {/* 제3조 — 환불 기준 테이블 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-4" style={{ color: "#E84B2E" }}>제3조 (환불 기준)</h2>
          <div className="flex flex-col gap-2">
            {[
              {
                condition: "결제 후 7일 이내 + 미이용",
                result:    "전액 환불 안내",
                desc:      "유료 기능의 진단 시작, 리포트 열람, AI 상담 사용, 유료 데이터 조회 등 실제 이용 내역이 없는 경우를 기준으로 합니다.",
              },
              {
                condition: "7일 이내 + 이용 내역 있음",
                result:    "이용 내역 기준 안내",
                desc:      "실제 이용 내역과 제공된 서비스 범위에 따라 환불 기준이 달라질 수 있습니다.",
              },
              {
                condition: "7일 초과 또는 지속형 서비스",
                result:    "상품 유형·잔여 기간 기준 안내",
                desc:      "단건 콘텐츠와 지속형 구독 여부, 이용 내역, 잔여 기간을 기준으로 환불 또는 해지 가능 여부를 안내합니다.",
              },
              {
                condition: "서비스 오류 또는 중복 결제",
                result:    "확인 후 별도 처리",
                desc:      "표시된 내용과 다른 서비스 제공, 중복 결제, 시스템 오류 등은 확인 후 별도로 안내합니다.",
              },
            ].map((row) => (
              <div key={row.condition}
                className="flex flex-col gap-1 p-3 rounded-card border border-base-border">
                <span className="text-xs font-semibold text-base-muted">{row.condition}</span>
                <span className="text-sm font-medium text-base-text">{row.result}</span>
                <span className="text-xs text-base-muted leading-relaxed mt-0.5">{row.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-base-muted mt-3 leading-relaxed">
            ※ 이용 내역 안내: 진단 시작, 리포트 열람, AI 상담 사용, 유료 데이터 조회 등 실제 서비스 이용 내역이 있는 경우에는
            환불 요청 시 이용 내역과 제공된 서비스 범위를 기준으로 안내될 수 있습니다.
          </p>
        </div>

        {/* 제4조 요금제 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-1" style={{ color: "#E84B2E" }}>제4조 (요금제별 안내)</h2>
          <p className="text-xs text-base-muted mb-4 leading-relaxed">
            v2.5 기준 — 정식 결제 기능 오픈 시 적용될 가격입니다.
          </p>

          {/* 구독 요금제 */}
          <p className="text-xs font-semibold text-base-muted mb-2">구독 요금제</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { plan: "Seed 무료",        price: "0원",      sub: "무료" },
              { plan: "Sprout 베이직",    price: "5,900원",  sub: "월간" },
              { plan: "Compass 프리미엄", price: "11,900원", sub: "월간" },
            ].map((p) => (
              <div key={p.plan}
                className="flex flex-col items-center gap-1 p-3 rounded-card border border-base-border text-center">
                <span className="text-xs text-base-muted leading-snug">{p.plan}</span>
                <span className="text-sm font-bold text-base-text">
                  {p.price}
                  <span className="text-xs font-normal">/{p.sub}</span>
                </span>
              </div>
            ))}
          </div>

          {/* 단건 상품 */}
          <p className="text-xs font-semibold text-base-muted mb-2">단건 상품 (구독 불필요)</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { plan: "꿈따라 진로 리포트 PDF", price: "3,900원" },
              { plan: "명따라 진로 성향 리포트", price: "6,900원" },
            ].map((p) => (
              <div key={p.plan}
                className="flex flex-col items-center gap-1 p-3 rounded-card border border-base-border text-center">
                <span className="text-xs text-base-muted leading-snug">{p.plan}</span>
                <span className="text-sm font-bold text-base-text">{p.price}<span className="text-xs font-normal"> / 건</span></span>
              </div>
            ))}
          </div>
          <div
            className="rounded-card p-3"
            style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}
          >
            <p className="text-xs leading-relaxed" style={{ color: "#92400E" }}>
              단건 상품(PDF 리포트, 명따라 리포트)은 결제 즉시 생성되는 디지털 콘텐츠입니다.
              리포트 생성 후에는 환불 또는 청약철회가 제한될 수 있습니다.
              결제 전 상품 구성과 고지사항을 확인해 주세요.
            </p>
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
              <span className="font-medium">꿈따라_자녀 진로 탐색</span>
            </div>
            <div className="flex gap-2">
              <span className="text-base-muted shrink-0">이메일</span>
              <a href="mailto:kkumddara@ozklab.com" className="text-brand-red underline">
                kkumddara@ozklab.com
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
