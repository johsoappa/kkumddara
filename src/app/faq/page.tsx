"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import CsPageLayout from "@/components/cs/CsPageLayout";

const FAQ_ITEMS = [
  {
    q: "꿈따라는 어떤 서비스인가요?",
    a: "꿈따라는 초등 5학년부터 중학교 3학년 자녀를 위한 진로 탐색 플랫폼입니다. 자녀의 성향과 관심사를 기반으로 진로를 탐색하고, 단계별 미션을 수행하며 꿈을 키워나갈 수 있습니다. 부모님께는 자녀의 활동 리포트를 제공합니다.",
  },
  {
    q: "자녀가 직접 회원가입하나요?",
    a: "아닙니다. 꿈따라는 부모님이 회원가입하고, 자녀 프로필을 등록하는 방식입니다. 자녀의 개인정보 보호를 위해 부모 계정에 귀속된 형태로 운영됩니다.",
  },
  {
    q: "씨앗/새싹/나침반 모드의 차이가 뭔가요?",
    a: "• 씨앗 모드: 진로 탐색 초기 단계. 다양한 직업을 탐색하고 관심 분야를 발견합니다.\n• 새싹 모드: 관심 직업을 구체적으로 탐구하고 기초 미션을 수행합니다.\n• 나침반 모드: 목표 직업을 정하고 로드맵에 따라 체계적으로 준비합니다.",
  },
  {
    q: "무료 이용이 가능한가요?",
    a: "최초 가입 시 14일 무료 체험을 제공합니다. 무료 체험은 자동결제로 연결되지 않으며, 유료 전환은 회원이 직접 선택합니다.",
  },
  {
    q: "결제 후 바로 이용할 수 있나요?",
    a: "네, 결제 완료 즉시 유료 서비스를 이용하실 수 있습니다.",
  },
  {
    q: "환불은 어떻게 신청하나요?",
    a: "카카오채널 '좋소아빠' 또는 이메일(johsoappa@gmail.com)로 문의해 주세요. 접수 후 1영업일 이내 처리 기준을 안내드리며, 카드 취소는 3~5영업일 소요됩니다.",
  },
  {
    q: "결제 후 이용을 시작하지 않았어요. 환불 가능한가요?",
    a: "결제 후 24시간 이내라면 이용 이력에 관계없이 전액 환불됩니다. 7일 이내 미이용 시에도 전액 환불이 가능합니다. 자세한 내용은 환불정책을 확인해 주세요.",
  },
  {
    q: "자녀 정보를 삭제하고 싶어요.",
    a: "설정 > 자녀 프로필 관리에서 삭제하실 수 있습니다. 탈퇴 시에는 모든 자녀 정보가 30일 이내 파기됩니다. 삭제된 데이터는 복구되지 않으니 신중하게 결정해 주세요.",
  },
  {
    q: "꿈따라 추천 결과를 믿어도 되나요?",
    a: "꿈따라의 추천 결과는 자녀의 관심사와 성향을 기반으로 한 교육적 참고자료입니다. 입시·취업·진로 결과를 보장하지 않으며, 다양한 경험과 탐색 과정을 통해 자녀만의 진로를 찾아가는 보조 도구로 활용하시길 권장합니다.",
  },
  {
    q: "명따라는 무엇인가요?",
    a: "명따라는 아이의 생년월일시를 기반으로 동양 철학(사주명리학) 관점에서 타고난 기질과 적성을 분석해 보는 참고용 부가서비스입니다. 현재 테스트 버전으로 운영 중이며, 분석 결과는 어떠한 진로 결과도 보장하지 않습니다.",
  },
  {
    q: "배우자(공동 양육자)도 함께 볼 수 있나요?",
    a: "네, 메인 계정(결제자)이 공동 양육자 1인을 초대할 수 있습니다. 공동 양육자는 자녀 리포트·로드맵 조회가 가능하며, 초대 링크는 7일간 유효합니다. 두 분의 계정 정보는 서로에게 노출되지 않습니다.",
  },
  {
    q: "아이 정보가 외부에 유출되지 않나요?",
    a: "자녀 정보는 진로 탐색, 미션 제공, 부모 리포트 생성 목적으로만 사용됩니다. 광고·마케팅 목적으로 활용하거나 제3자에게 제공하지 않으며, SSL/TLS 암호화로 안전하게 보호됩니다.",
  },
  {
    q: "로드맵 미션을 완료하면 어떻게 되나요?",
    a: "미션을 완료하면 다음 단계가 해제되고 부모 리포트에 달성 기록이 반영됩니다. 단계별 미션을 모두 완료하면 해당 직업 로드맵의 진행률이 100%가 되며, 새로운 추천 미션이 제공됩니다.",
  },
  {
    q: "문의는 어디로 하면 되나요?",
    a: "카카오채널 '좋소아빠' 또는 이메일(johsoappa@gmail.com)로 문의해 주세요. 1:1 문의 페이지에서 자세한 안내를 확인하실 수 있습니다.",
  },
  {
    q: "운영시간은 언제인가요?",
    a: "평일 오전 10시 ~ 오후 6시 (주말·공휴일 제외). 운영시간 외 문의는 순차적으로 처리되며, 다음 영업일 오전 중 답변드립니다.",
  },
];

function FaqItem({ item, index }: { item: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-card-lg shadow-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span
            className="text-xs font-bold shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: "#E84B2E" }}
          >
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-base-text leading-snug">{item.q}</span>
        </div>
        <span className="ml-2 shrink-0 text-base-muted">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-base-border">
          <p className="text-sm text-base-text leading-relaxed pt-3 whitespace-pre-line">
            {item.a}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <CsPageLayout title="자주 묻는 질문">
      <div className="flex flex-col gap-3">

        <div className="bg-white rounded-card p-4 border border-base-border text-center">
          <p className="text-xs text-base-muted">
            궁금한 점을 클릭하면 답변을 확인할 수 있어요 🙋
          </p>
        </div>

        {FAQ_ITEMS.map((item, i) => (
          <FaqItem key={i} item={item} index={i} />
        ))}

        {/* 해결 안 됐을 때 */}
        <div
          className="rounded-card-lg p-5 text-center"
          style={{ backgroundColor: "#FFF0EB", borderColor: "#E84B2E" }}
        >
          <p className="text-sm font-semibold text-base-text mb-1">
            원하는 답변을 찾지 못하셨나요?
          </p>
          <p className="text-xs text-base-muted">
            1:1 문의로 직접 질문해 주세요 😊
          </p>
          <a
            href="/contact"
            className="mt-3 inline-block px-5 py-2 rounded-button text-sm font-bold text-white"
            style={{ backgroundColor: "#E84B2E" }}
          >
            1:1 문의하기
          </a>
        </div>

      </div>
    </CsPageLayout>
  );
}
