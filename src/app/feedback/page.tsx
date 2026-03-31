"use client";

// ====================================================
// 의견 보내기 (/feedback)
// Google Form iframe 임베드
// ====================================================

import CsPageLayout from "@/components/cs/CsPageLayout";
import { FEEDBACK_FORM_URL } from "@/constants/forms";

export default function FeedbackPage() {
  return (
    <CsPageLayout title="의견 보내기">
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-card p-4 border border-base-border text-center">
          <p className="text-xs text-base-muted">
            꿈따라 서비스에 대한 의견이나 개선 제안을 자유롭게 남겨주세요.
          </p>
        </div>

        <div className="bg-white rounded-card-lg overflow-hidden shadow-card">
          <iframe
            src={FEEDBACK_FORM_URL}
            width="100%"
            height="780"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            title="꿈따라 의견 보내기"
            className="block"
          >
            로딩 중…
          </iframe>
        </div>

      </div>
    </CsPageLayout>
  );
}
