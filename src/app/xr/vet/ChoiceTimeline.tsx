// ====================================================
// ChoiceTimeline — 결과 화면 수행 타임라인 (G2.2-R3-B, 신규)
//
// "결과 화면은 완료 배지만 추가될 뿐, 상담이 마무리됐다는 장면 변화나
// 수행 기록이 없습니다"라는 지적에 대한 대응. 새 판정 로직을 추가하지
// 않는다 — 이미 XrVetClient.tsx의 state.history(지점 순서 보존)를 그대로
// 나열만 한다. 순수 DOM(HTML), Canvas/3D 텍스트 아님.
// ====================================================

import { pointCategory, choiceLabel } from "./vetStoryboard";
import type { ChoiceRecord, Mode } from "./scenario";

export interface ChoiceTimelineProps {
  mode: Mode;
  history: ChoiceRecord[];
}

export default function ChoiceTimeline({ mode, history }: ChoiceTimelineProps) {
  if (history.length === 0) return null;
  return (
    <ol className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
      {history.map((record) => (
        <li key={record.point} className="flex items-start gap-3 text-sm">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white"
          >
            {record.point}
          </span>
          <span className="flex flex-col">
            <span className="font-semibold text-gray-800">{pointCategory(mode, record.point)}</span>
            <span className="text-gray-600">{choiceLabel(mode, record.point, record.choiceId)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
