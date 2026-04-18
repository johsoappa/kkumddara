# P2/P3 + 브랜딩 완료 보고서

> 작성일: 2026-04-18
> 작업 구분: 베타 P2/P3 + 브랜딩 정리 전체 완료
> 이전 커밋: `bb4bd7a` (P1)

---

## 1. 작업 전체 완료 현황

| 과제 | 항목 | 상태 |
|---|---|---|
| P1 | 랜딩 가치 메시지 + 역할 카드 개선 | ✅ |
| P1 | 학생 홈 fitScore% 제거 | ✅ |
| P1 | 학부모 홈 "이번 주 해볼 대화" 섹션 | ✅ |
| P2-A | 추천 직업 "왜 이 직업?" 이유 설명 | ✅ |
| P2-B | 데모 체험 결과 미리보기형 개선 | ✅ |
| P2-C | 학부모 홈 대화 반개인화 (관심사·학년 기반) | ✅ |
| P2-D | GuestLoginPrompt 가치 중심 문구 | ✅ |
| P2-E | 결과 → 행동 연결 (preparations 힌트) | ✅ |
| P2 | 베타 안내 배너 (랜딩 상단) | ✅ |
| P3 | 명따라 결과 "관찰 포인트" 섹션 | ✅ |
| Brand-P1 | 로고 이미지 헤더 적용 (전체) | ✅ |
| Brand-P1 | 컬러 시스템 토큰화 | ✅ |
| Brand-P1 | 랜딩 CTA "우리 아이 진로 탐색 시작하기" | ✅ |
| Brand-P2 | 소형 배지 WCAG 색상 개선 (#C83A20) | ✅ |

---

## 2. 이번 세션 변경 내용

### 베타 안내 배너 (`src/app/page.tsx`)
- 랜딩 역할 선택 화면 로고 하단에 배너 추가
- 스타일: 인디고 계열 (`#EEF2FF` 배경 / `#4F6BD9` 텍스트)
- 문구: `🧪 지금은 베타 운영 중이에요 — 피드백을 기다립니다`
- 인증 Step 2에서는 표시 안 함 (step === "role" 조건)

### 명따라 결과 "관찰 포인트" 섹션

**`src/lib/myeonddara-rules.ts`:**
- `OHAENG_OBSERVATION_POINTS` 상수 추가: 오행별 관찰 질문 3개
- `RuleBasedGuide` 인터페이스에 `observationPoints: string[]` 추가
- `buildRuleBasedGuide` 반환값에 포함

**`src/app/myeonddara/result/page.tsx` (Phase 1):**
- 기질 키워드 ↔ 오행 균형 사이에 "③ 부모 관찰 포인트" 섹션 삽입
- 구성: 헤딩 + "체크해보세요" 배지 + 안내 문구 + 번호별 질문 3개
- 위치: 결과를 읽고 바로 "내 아이를 어떻게 관찰하지?"로 연결

**오행별 관찰 포인트 내용:**
| 오행 | 관찰 질문 요약 |
|---|---|
| 목(木) | 혼자 탐색 집중도 / 새 환경 반응 / 자기 판단 경향 |
| 화(火) | 함께할 때 에너지 변화 / 감정 표현 / 낯선 상황 주도성 |
| 토(土) | 루틴 선호도 / 신중한 결정 / 규칙 준수 경향 |
| 금(金) | 옳고 그름 민감도 / 목표 지속력 / 이유 탐구 성향 |
| 수(水) | 혼자 생각 시간 필요 / '왜?' 질문 빈도 / 이해 전 수용 거부 |

### WCAG 소형 배지 개선
- `myeonddara/result/page.tsx` Phase 1 기질 키워드 배지: `#E84B2E` → `#C83A20`
- Phase 2 타고난 기질 태그: `#E84B2E` → `#C83A20`
- 관찰 포인트 섹션 번호 원형 배지: `#C83A20` 적용
- 대비비 개선: 3.37:1 → **4.55:1** (WCAG AA 소형 텍스트 통과)

---

## 3. 브랜딩 작업 요약

### 로고
- `public/logo.png` (3168×1344px, 흰 배경)
- 공유 헤더: 52×22px / 홈 헤더: 66×28px / 랜딩: 104×44px
- 8개 파일에 적용 (Header.tsx + 4개 페이지)

### 컬러 토큰
```css
--color-primary:       #E84B2E
--color-primary-hover: #C83A20   ← WCAG 소형 텍스트 안전색
--color-primary-soft:  #FFF0EB
--color-primary-text:  #C83A20
```
Tailwind: `bg-primary`, `text-primary-text` 등 신규 클래스 사용 가능

### CTA
- 메인 버튼: "우리 아이 진로 탐색 시작하기" → 학부모 직접 전환
- 서브카피: "먼저 체험해 보고, 필요한 맞춤 기능을 이어서 이용해보세요"
- 역할 카드: 보조 선택지로 하단 유지

---

## 4. 수정 파일 전체 목록

| 파일 | 변경 내용 |
|---|---|
| `src/app/globals.css` | 시맨틱 CSS 변수 8개 |
| `tailwind.config.ts` | primary 컬러 팔레트 |
| `src/components/layout/Header.tsx` | 로고 이미지 |
| `src/app/page.tsx` | 로고·CTA·서브카피·베타배너 |
| `src/app/parent/home/page.tsx` | 로고·대화 반개인화 |
| `src/app/student/home/page.tsx` | 로고·이유설명·행동힌트 |
| `src/app/demo/parent/page.tsx` | 로고·대화 미리보기 섹션 |
| `src/app/demo/student/page.tsx` | 로고·fitScore제거·이유설명 |
| `src/components/ui/GuestLoginPrompt.tsx` | 가치 중심 문구 |
| `src/lib/myeonddara-rules.ts` | observationPoints 추가 |
| `src/app/myeonddara/result/page.tsx` | 관찰 포인트 섹션·WCAG |

**빌드 검증:** `npx tsc --noEmit` → 에러 없음

---

## 5. OZ 대표 테스트 시나리오 7개

1. **베타 배너 확인**: `/` 접속 → 로고 아래 `🧪 지금은 베타 운영 중이에요` 배너 표시 확인

2. **CTA 전환 흐름**: "우리 아이 진로 탐색 시작하기" 클릭 → 학부모 인증 화면 진입 확인

3. **로고 적용 확인**: 헤더(학부모 홈·학생 홈·데모)에서 꿈따라 로고 이미지 표시 확인 (흰 배경에 자연 혼합)

4. **대화 반개인화**: 학부모 홈 → 자녀 관심분야(예: IT+예술)에 따라 "IT 관심사" 관련 질문이 포함되는지 확인

5. **명따라 관찰 포인트**: `/myeonddara` → 사주 입력 → 결과 화면에서 "부모 관찰 포인트" 섹션(질문 3개) 표시 확인

6. **데모 체험 완성도**: `/demo/parent` → "지우와 해볼 대화" 섹션 표시 확인 / `/demo/student` → 직업 카드 이유 설명 + 첫 미션 힌트 확인

7. **추천 직업 이유**: 학생 홈 → 관심 분야와 연결된 추천 직업에 "IT 관심사와 연결되는 직업이에요" 등 이유 텍스트 표시 확인

---

## 6. 남은 리스크 및 미완료 항목

| 항목 | 수준 | 내용 |
|---|---|---|
| 로고 투명 PNG | 중요 | 컬러 배경 섹션 적용 시 필요 — 자산 요청 필요 |
| 전체 배지 WCAG | 낮음 | 관심분야 태그(11px)가 아직 `#E84B2E` — P3 일괄 전환 |
| CTA A/B 검증 | 없음 | 실제 베타 트래픽 후 판단 |
| 커리어넷 API 키 | 외부 | https://www.career.go.kr/cnet/openapi/introduce.do |
| Supabase 마이그레이션 | 외부 | 014_occupations_missions.sql SQL Editor 실행 필요 |
| Anthropic 크레딧 | 외부 | 명따라 Phase 2 활성화 조건 |
