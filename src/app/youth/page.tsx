import CsPageLayout from "@/components/cs/CsPageLayout";

export default function YouthPage() {
  return (
    <CsPageLayout title="청소년 보호정책">
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-card p-4 border border-base-border text-center">
          <p className="text-xs text-base-muted">시행일: 2026년 4월 1일</p>
        </div>

        {/* 제1조 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>제1조 (목적)</h2>
          <p className="text-sm text-base-text leading-relaxed">
            청소년에게 유해한 정보로부터 청소년을 보호하고
            안전한 이용환경을 조성합니다.
          </p>
        </div>

        {/* 제2조 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>제2조 (유해정보 관리)</h2>
          <ol className="flex flex-col gap-2">
            {[
              "음란, 성착취, 성매매 유도 정보 금지",
              "폭력, 범죄, 자해, 약물 조장 정보 금지",
              "차별, 혐오, 따돌림 조장 정보 금지",
              "사행성 또는 불법 정보 금지",
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-base-text leading-relaxed">
                <span className="font-semibold shrink-0" style={{ color: "#E84B2E" }}>{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* 제3조 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>제3조 (아동·청소년 개인정보 보호)</h2>
          <p className="text-sm text-base-text leading-relaxed">
            만 14세 미만 아동의 개인정보 처리 시
            법정대리인 동의 절차를 준수합니다.
          </p>
        </div>

        {/* 제4조 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>제4조 (멘토링 서비스 청소년 보호)</h2>
          <ol className="flex flex-col gap-3">
            <li className="flex gap-2 text-sm text-base-text leading-relaxed">
              <span className="font-semibold shrink-0" style={{ color: "#E84B2E" }}>1.</span>
              <span>멘토 등록 시 신원 확인, 자격 확인 및 내부 검증 절차를 거칩니다.</span>
            </li>
            <li className="text-sm text-base-text leading-relaxed">
              <div className="flex gap-2 mb-2">
                <span className="font-semibold shrink-0" style={{ color: "#E84B2E" }}>2.</span>
                <span>아래 행위는 즉시 세션 종료 및 계정 정지 사유입니다:</span>
              </div>
              <ul className="flex flex-col gap-1.5 pl-5">
                {[
                  "개인 연락처 교환 요청",
                  "플랫폼 외부 만남 제안",
                  "부적절한 신체 접촉 또는 언어 사용",
                  "보호자 없는 대면 만남 시도",
                ].map((sub, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-base-muted shrink-0">•</span>
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>
            </li>
            <li className="flex gap-2 text-sm text-base-text leading-relaxed">
              <span className="font-semibold shrink-0" style={{ color: "#E84B2E" }}>3.</span>
              <span>신고 접수 후 24시간 이내 검토 및 조치합니다.</span>
            </li>
          </ol>
        </div>

        {/* 제5조 담당자 */}
        <div className="bg-white rounded-card-lg p-5 shadow-card">
          <h2 className="text-sm font-bold mb-3" style={{ color: "#E84B2E" }}>제5조 (청소년 보호담당자)</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-base-muted">성명</span>
              <span className="text-base-text">OZ.Kim</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-muted">직책</span>
              <span className="text-base-text">대표</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-muted">이메일</span>
              <a href="mailto:johsoappa@gmail.com" className="text-brand-red underline">
                johsoappa@gmail.com
              </a>
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
