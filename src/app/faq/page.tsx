"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import CsPageLayout from "@/components/cs/CsPageLayout";

const FAQ_ITEMS = [
  {
    q: "꿈따라는 어떤 서비스인가요?",
    a: "꿈따라는 초1부터 고등까지, 아이의 관심이 자라고 진로 방향이 잡히는 과정을 부모와 함께 기록하는 진로 탐색 서비스입니다. 아이의 관심사를 기반으로 직업을 탐색하고, 작은 미션과 활동을 이어가며 진로 대화를 시작할 수 있습니다. 부모님께는 자녀의 관심과 활동 기록을 리포트로 제공합니다.",
  },
  {
    q: "자녀가 직접 회원가입하나요?",
    a: "아닙니다. 꿈따라는 부모님이 회원가입하고, 자녀 프로필을 등록하는 방식입니다. 자녀의 개인정보 보호를 위해 부모 계정에 귀속된 형태로 운영됩니다.",
  },
  {
    q: "어떤 학년의 아이가 사용할 수 있나요?",
    a: "꿈따라는 초1부터 고등까지 사용할 수 있도록 씨앗모드, 새싹모드, 나침반모드로 나누어 설계하고 있습니다.\n🌱 씨앗모드는 초1~초2 아이가 직업 세계를 처음 만나고 흥미의 씨앗을 발견하는 단계입니다.\n🌿 새싹모드는 초3~초4 아이가 반복 활동을 통해 관심과 가능성을 넓혀가는 단계입니다.\n🧭 나침반모드는 초5~고등 아이가 관심 분야와 강점을 바탕으로 진로 방향을 설계해보는 단계입니다.\n각 모드는 진로를 확정해주는 것이 아니라, 부모와 아이가 함께 대화를 시작하는 출발점으로 설계됩니다.",
  },
  {
    q: "씨앗/새싹/나침반 모드는 어떤 의미인가요?",
    a: "씨앗·새싹·나침반은 사용자가 직접 선택하는 모드가 아니라, 아이의 학년에 따라 진로 탐색 흐름을 다르게 안내하기 위한 단계입니다.\n🌱 씨앗모드 (초1~초2): 직업 세계를 처음 만나고, 좋아하는 것의 씨앗을 발견하는 단계\n🌿 새싹모드 (초3~초4): 반복 활동을 통해 관심을 확인하고, 재능과 가능성을 넓혀가는 단계\n🧭 나침반모드 (초5~고등): 관심 분야와 강점을 바탕으로 진로 방향을 설계해보는 단계\n자녀의 학년과 관심사에 따라 꿈따라가 아이에게 맞는 탐색 흐름을 안내합니다.",
  },
  {
    q: "무료 이용이 가능한가요?",
    a: "현재 베타 기간 동안은 무료로 먼저 경험해볼 수 있어요. 정식 유료화 일정과 혜택은 추후 안내됩니다.",
  },
  {
    q: "결제 후 바로 이용할 수 있나요?",
    a: "현재는 베타 기간으로 정식 결제 기능은 준비 중입니다. 지금은 무료로 꿈따라를 경험해볼 수 있어요.",
  },
  {
    q: "AI 상담 20회는 무엇을 기준으로 1회인가요?",
    a: "AI 상담은 \"보낸 메시지 1건 = 1회\" 기준으로 계산됩니다.\n부모님이 AI에게 질문을 보내는 순간 1회가 차감되며, AI의 답변은 별도로 차감하지 않습니다.\n예를 들어 \"아이가 축구를 좋아하는데 어떤 직업을 함께 볼 수 있나요?\"라고 질문하면 1회가 사용됩니다.",
  },
  {
    q: "구매한 단건 리포트는 언제까지 볼 수 있나요?",
    a: "PDF 리포트는 구매 후 다운로드해 보관할 수 있습니다.\n다운로드한 PDF 파일은 사용자 기기에 저장되므로, 직접 보관할 수 있습니다.\n명따라 리포트는 계정이 유지되는 동안 서비스 안에서 다시 볼 수 있도록 운영하는 방향을 제안합니다.\n단, 계정 삭제 또는 서비스 종료 시에는 다시 보기 기능이 제한될 수 있습니다.\n구체적인 보관 기간과 다운로드 가능 기간은 저장 비용과 운영 정책 검토 후 최종 확정됩니다.",
  },
  {
    q: "구독 해지는 어떻게 하나요?",
    a: "현재 꿈따라는 베타 운영 단계로 정식 유료 결제 기능은 아직 제공하지 않습니다. 따라서 지금은 구독 해지 대상 결제가 없습니다. 정식 결제 기능이 오픈되면 설정 > 구독 및 결제 관리에서 구독 해지 방법을 안내하겠습니다.",
  },
  {
    q: "환불은 어떻게 신청하나요?",
    a: "현재는 베타 무료 이용 단계로 실제 결제가 발생하지 않아 환불 대상 결제가 없습니다. 정식 결제 기능 오픈 시 환불 신청 방법과 처리 기준을 환불정책에서 명확히 안내하겠습니다. 그 밖의 문의는 이메일(kkumddara@ozklab.com)로 보내주세요.",
  },
  {
    q: "정식 결제 오픈 후 환불 기준은 어떻게 되나요?",
    a: "정식 결제 기능 오픈 시 적용될 환불 기준(결제 후 경과 시간, 이용 개시 여부 등)은 환불정책 페이지에서 확인할 수 있습니다. 베타 기간에는 실제 결제가 없어 적용되지 않습니다.\n\n단건 상품(꿈따라 진로 리포트 PDF, 명따라 진로 성향 리포트)은 결제 즉시 생성되는 디지털 콘텐츠입니다. 리포트 생성 후에는 환불 또는 청약철회가 제한될 수 있으므로, 결제 전 상품 구성과 고지사항을 꼭 확인해 주세요.",
  },
  {
    q: "유료 결제는 누구 계정으로 해야 하나요?",
    a: "꿈따라의 유료 결제는 보호자(학부모) 계정을 기준으로 이루어집니다.\n자녀 계정에서는 결제 기능을 이용할 수 없습니다.\n만 14세 미만 자녀의 정보는 보호자 계정에 종속되며, 보호자의 동의와 관리 아래 이용됩니다.\n결제·구독 변경·자녀 프로필 수정 권한은 메인 계정(결제자)에만 있으며, 공동 양육자로 초대된 계정은 조회만 가능합니다.",
  },
  {
    q: "자녀 정보를 삭제하고 싶어요.",
    a: "설정 > 자녀 프로필 관리에서 등록된 자녀 정보를 확인하고 삭제할 수 있습니다. 삭제하면 해당 자녀와 진로 탐색 기록·관심 직업·명따라 결과·활동 기록이 화면에서 더 이상 표시되지 않습니다. 관련 데이터는 개인정보 처리방침과 운영 기준에 따라 관리되며, 완전 파기나 회원 탈퇴가 필요한 경우 이메일(kkumddara@ozklab.com)로 요청해 주세요.",
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
    a: "현재 베타 기간에는 공동 양육자 초대 기능이 제공되지 않습니다. 정식 오픈 후 배우자 또는 공동 양육자를 초대해 자녀 리포트·로드맵을 함께 볼 수 있도록 준비 중입니다.",
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
    a: "이메일(kkumddara@ozklab.com)로 문의해 주세요. 1:1 문의 페이지에서 자세한 안내를 확인하실 수 있습니다.",
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
