/**
 * /explore/interests/sports 페이지
 *
 * 아이가 좋아하는 운동을 선택하고, 연결된 직업군을 탐색하는 화면.
 * 정적 데이터(sportsInterestData.ts) 기반 — DB 없음 / API 없음.
 *
 * 라우팅: /explore/interests/sports
 * → Next.js App Router 정적 세그먼트 우선 처리로 /explore/[id]와 충돌 없음.
 *
 * 작성일: 2026-05-26
 */

import AppShell from "@/components/layout/AppShell";
import SportsInterestSelector from "@/components/explore/SportsInterestSelector";

export default function SportsInterestsPage() {
  return (
    <AppShell headerTitle="운동으로 찾는 직업">
      <SportsInterestSelector />
    </AppShell>
  );
}
