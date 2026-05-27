"use client";

// ====================================================
// 의견 보내기 (/feedback)
// 베타: Google Form 외부 링크 버튼으로 전환
// (iframe → X-Frame-Options 정책 차단 이슈로 변경)
// ====================================================

import { ExternalLink } from "lucide-react";
import CsPageLayout from "@/components/cs/CsPageLayout";
import { FEEDBACK_FORM_URL } from "@/constants/forms";

export default function FeedbackPage() {
  return (
    <CsPageLayout title="의견 보내기">
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-card-lg border border-base-border p-6 flex flex-col items-center text-center gap-5">
          <span className="text-4xl leading-none">💬</span>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-bold text-base-text">
              꿈따라 베타 의견 보내기
            </p>
            <p className="text-xs text-base-muted leading-relaxed">
              베타 사용 중 불편한 점이나 개선 의견을 남겨주세요.
              <br />
              Google Form이 새 창에서 열립니다.
            </p>
          </div>

          {FEEDBACK_FORM_URL ? (
            <a
              href={FEEDBACK_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              <ExternalLink size={15} />
              피드백 작성하러 가기
            </a>
          ) : (
            <p className="text-xs text-base-muted">
              현재 피드백 폼을 준비 중이에요. 잠시 후 다시 확인해 주세요.
            </p>
          )}

          <div className="w-full border-t border-base-border pt-4 text-left">
            <p className="text-xs font-semibold text-base-text mb-1">
              💬 로그인·오류·계정 문의는 별도로
            </p>
            <p className="text-xs text-base-muted leading-relaxed">
              로그인 문제, 이용 오류, 계정 관련 문의는 아래 경로로 남겨주세요.
            </p>
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-xs text-base-muted">
                카카오채널 <span className="font-medium text-base-text">꿈따라_자녀 진로 탐색</span>
              </p>
              <p className="text-xs text-base-muted">
                이메일{" "}
                <a href="mailto:kkumddara@ozklab.com" className="font-medium underline" style={{ color: "#E84B2E" }}>
                  kkumddara@ozklab.com
                </a>
              </p>
            </div>
          </div>
        </div>

      </div>
    </CsPageLayout>
  );
}
