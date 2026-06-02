# 꿈따라 직업 역량 표현 표준안 및 traits seed 설계 1단계

> 작성일: 2026-06-03 · 기준 commit: `5ebc758` · 성격: **문서 설계 작업** (DB/migration/UI/seed INSERT 없음)

## 1. 설계 목적

- 직업별 역량을 초등학생·학부모 눈높이로 표현하기 위한 기준 정리
- 향후 직업 상세 "이 일을 할 때 자주 쓰는 힘" 섹션의 데이터 기반 마련
- `occupation_parent_questions` 확장의 선행 구조(연결 메모) 마련

## 2. 현재 상태

- `occupation_traits` 테이블은 존재 (015 bootstrap)
- seed INSERT는 **0건** (코드/seed 기준)
- 직업 상세 UI 미구현
- 먼저 문구 표준 + 샘플 seed 설계가 필요

### 2-1. ⚠️ 실제 스키마와 작업지시서 가정의 차이 (중요)

작업지시서는 `trait_name / trait_type / description / sort_order` 컬럼을 가정했으나, **실제 `occupation_traits` 스키마는 다름**:

| 실제 컬럼 | 타입/제약 | 비고 |
|---|---|---|
| `id` | uuid PK | |
| `occupation_id` | **uuid FK → occupation_master.id** | ⚠️ legacy id 아님. seed 시 `(select id from occupation_master where slug='...')` |
| `layer` | `'source' | 'service'` | UI 노출은 **`service`** |
| `trait_type` | service: `keyword / interest_match / aptitude_match / work_style` | 표준 trait_code와 별도 |
| `content` | text (단일) | **노출명/설명을 한 컬럼에만 저장 가능** |
| `display_order` | int | 정렬 |
| `is_current` / `is_latest` | boolean | 버전 관리 |
| `status` | `draft/reviewed/published/archived` | 공개는 `published` |
| `generation_source` | `employment24/dictionary/manual/ai_hybrid/import` | seed는 `manual` |

→ **결론: 스키마에는 `display_name`만 담을 `content` 한 칸뿐이고, `child_description`/`parent_note`를 담을 별도 컬럼이 없다.** 따라서 2단계에서 아래 중 하나를 선택해야 한다(스키마 변경은 별도 승인 필요).
- (A) `content`에 노출명만 저장 + `child_description`/`parent_note`는 **프론트 정적 매핑(trait_code 기준)** — **권장**(스키마 무변경)
- (B) `content`에 JSON 저장(노출명+설명+부모노트)
- (C) `occupation_traits` 스키마 확장(컬럼 추가) — 마이그레이션 필요, 보류

> 본 문서의 trait_code·child_description·parent_note는 **(A) 방식 전제의 설계 데이터**다. seed에는 `content = display_name`, trait_type = `aptitude_match`(역량) 또는 `keyword`로 저장하고, 설명/부모노트는 프론트 trait_code 매핑 테이블로 둔다.

## 3. 용어 기준

- **섹션명(추천):** "이 일을 할 때 자주 쓰는 힘" (대안: "이 직업에서 자라는 힘")
- **금지 표현:** 반드시 필요합니다 / 이 능력이 없으면 어렵습니다 / 이 직업에 맞는 아이입니다 / 이 직업을 해야 합니다 / 성공하려면 꼭 필요합니다 / 타고난 재능 / 사주에 맞는 힘
- **권장 표현:** 자주 쓰이는 힘이에요 / 함께 살펴볼 수 있어요 / 이런 활동과 연결해볼 수 있어요 / 아이가 흥미를 보이는지 가볍게 관찰해보세요 / 작은 활동으로 연습해볼 수 있어요

## 4. 역량 카테고리 표준안 (15개)

| trait_code | display_name | child_description | parent_note | 사용 예시 직업군 |
|---|---|---|---|---|
| observation | 관찰하는 힘 | 작은 차이를 보고 궁금해하는 힘이에요. | 주변을 세심하게 보는 태도와 연결됩니다. | 연구·과학·분석 |
| communication | 쉽게 설명하는 힘 | 내가 아는 것을 쉽게 말해보는 힘이에요. | 표현력·전달력을 함께 볼 수 있습니다. | 교육·상담·기획 |
| listening | 차분히 듣는 힘 | 상대의 말을 끝까지 들어보는 힘이에요. | 경청·공감 태도와 연결됩니다. | 상담·돌봄·교육 |
| analysis | 차분히 분석하는 힘 | 상황을 보고 이유를 생각해보는 힘이에요. | 원인을 찾는 태도와 연결됩니다. | 분석·연구·금융 |
| creativity | 새롭게 상상하는 힘 | 새로운 아이디어를 떠올리는 힘이에요. | 창의적 사고·표현 활동으로 확장됩니다. | 콘텐츠·디자인·기획 |
| empathy | 마음을 이해하는 힘 | 다른 사람의 마음을 생각해보는 힘이에요. | 상담·돌봄·교육 이해에 도움이 됩니다. | 상담·복지·의료 |
| responsibility | 끝까지 책임지는 힘 | 맡은 일을 끝까지 해보려는 힘이에요. | 자기관리·꾸준함을 함께 봅니다. | 전 직업 공통 |
| collaboration | 함께하는 힘 | 친구·팀원과 같이 해내는 힘이에요. | 협업·사회성 발달과 연결됩니다. | 기획·스포츠·교육 |
| planning | 계획하는 힘 | 먼저 할 일과 다음 할 일을 정하는 힘이에요. | 목표 설정·실행 습관으로 이어집니다. | 기획·경영·교육 |
| problem_solving | 문제를 해결하는 힘 | 불편한 점을 더 나은 방법으로 바꾸는 힘이에요. | 기획·개발·연구·창업과 연결됩니다. | IT·기획·연구 |
| safety | 안전하게 판단하는 힘 | 위험을 미리 생각하고 조심하는 힘이에요. | 안전·의료·스포츠·아웃도어와 연결됩니다. | 안전·스포츠·의료 |
| persistence | 꾸준히 해보는 힘 | 한 번에 안 돼도 다시 해보는 힘이에요. | 장기 목표 준비 태도와 연결됩니다. | 연구·스포츠·예술 |
| data_sense | 숫자와 자료를 보는 힘 | 숫자·표를 보고 차이를 찾는 힘이에요. | 분석·금융·과학·데이터와 연결됩니다. | 분석·금융·연구 |
| body_awareness | 몸을 이해하는 힘 | 몸의 움직임과 건강을 살피는 힘이에요. | 스포츠·의료·건강과 연결됩니다. | 스포츠·의료·건강 |
| care | 돌보는 힘 | 누군가에게 필요한 것을 살피고 돕는 힘이에요. | 교육·복지·의료·상담과 연결됩니다. | 교육·복지·의료 |

> design_thinking(모양·공간 상상)은 디자인/건축 확장 시 추가 후보로 보류(현 1단계 15개로 충분).

## 5. 샘플 직업 10개 선정 기준

| id | 직업명 | 선정 이유 |
|---|---|---|
| counselor | 심리상담사 | 명따라 추천 + 최신 상세 + goyo24 보유 |
| nutritionist | 영양사 | 명따라 추천 + 건강 직군 대표 |
| product-manager | 프로덕트 매니저 | 명따라 추천 + 비즈니스 직군 |
| financial-planner | 재무 설계사 | 명따라 추천 + 금융 직군 |
| life-science-researcher | 생명과학 연구원 | 명따라 추천 + 연구 직군 |
| video-director | 영상 감독 | 명따라 추천 + 콘텐츠 직군 |
| physical-therapist | 물리치료사 | 의료·건강 직군 + goyo24 보유 |
| sports-data-analyst | 스포츠 데이터 분석가 | 관심 운동 연결 + 분석 직군 |
| youth-sports-coach | 유소년 스포츠 코치 | 관심 운동 연결 + 지도 직군 |
| after-school-teacher | 방과후 교사 | 관심 운동 연결 + 교육 직군 |

## 6. 샘플 직업별 traits seed 초안 (각 3개)

> seed 매핑(A안): `occupation_id = (select id from occupation_master where slug=<id>)`, `layer='service'`, `trait_type='aptitude_match'`, `content=<display_name>`, `display_order=<sort_order>`, `status='published'`, `is_current=true`, `generation_source='manual'`. child_description/parent_note는 trait_code 기준 프론트 매핑.

| occupation_id | 직업명 | trait_code | display_name | child_description | parent_note | sort_order |
|---|---|---|---|---|---|---|
| counselor | 심리상담사 | empathy | 마음을 이해하는 힘 | 친구가 어떤 마음일지 생각해보는 힘이에요. | 타인 감정에 관심을 보이는지 살펴볼 수 있어요. | 1 |
| counselor | 심리상담사 | listening | 차분히 듣는 힘 | 상대의 말을 끝까지 들어보는 힘이에요. | 경청 태도와 연결됩니다. | 2 |
| counselor | 심리상담사 | communication | 쉽게 설명하는 힘 | 어려운 이야기를 부드럽게 말해보는 힘이에요. | 생각을 정리해 말하는 연습과 연결됩니다. | 3 |
| nutritionist | 영양사 | body_awareness | 건강을 살피는 힘 | 몸에 좋은 것을 생각해보는 힘이에요. | 건강·생활 습관 관심과 연결됩니다. | 1 |
| nutritionist | 영양사 | analysis | 균형 있게 생각하는 힘 | 무엇이 알맞은지 따져보는 힘이에요. | 균형 잡힌 판단 태도와 연결됩니다. | 2 |
| nutritionist | 영양사 | planning | 계획하는 힘 | 하루 식단처럼 미리 계획해보는 힘이에요. | 계획·실행 습관으로 이어집니다. | 3 |
| product-manager | 프로덕트 매니저 | problem_solving | 문제를 발견하는 힘 | 불편한 점을 찾아보는 힘이에요. | 더 나은 방법을 찾는 태도와 연결됩니다. | 1 |
| product-manager | 프로덕트 매니저 | planning | 의견을 정리하는 힘 | 여러 의견을 모아 정리하는 힘이에요. | 정리·조율 능력과 연결됩니다. | 2 |
| product-manager | 프로덕트 매니저 | collaboration | 함께 만드는 힘 | 팀과 같이 만들어가는 힘이에요. | 협업·사회성과 연결됩니다. | 3 |
| financial-planner | 재무 설계사 | data_sense | 숫자와 자료를 보는 힘 | 숫자를 보고 차이를 찾는 힘이에요. | 분석·금융 관심과 연결됩니다. | 1 |
| financial-planner | 재무 설계사 | planning | 차분히 계획하는 힘 | 미래를 위해 미리 준비하는 힘이에요. | 목표·계획 습관과 연결됩니다. | 2 |
| financial-planner | 재무 설계사 | responsibility | 신뢰를 지키는 힘 | 약속을 지키려는 힘이에요. | 책임감·신뢰 태도와 연결됩니다. | 3 |
| life-science-researcher | 생명과학 연구원 | observation | 관찰하는 힘 | 작은 차이를 보고 궁금해하는 힘이에요. | 세심한 관찰 태도와 연결됩니다. | 1 |
| life-science-researcher | 생명과학 연구원 | problem_solving | 궁금한 것을 실험하는 힘 | 직접 확인해보려는 힘이에요. | 탐구·실험 흥미와 연결됩니다. | 2 |
| life-science-researcher | 생명과학 연구원 | persistence | 기록하는 힘 | 본 것을 꾸준히 적어두는 힘이에요. | 기록·끈기 습관과 연결됩니다. | 3 |
| video-director | 영상 감독 | creativity | 이야기를 상상하는 힘 | 새로운 이야기를 떠올리는 힘이에요. | 창의적 표현과 연결됩니다. | 1 |
| video-director | 영상 감독 | design_thinking | 장면을 구성하는 힘 | 어떻게 보여줄지 그려보는 힘이에요. | 구성·표현 활동과 연결됩니다. | 2 |
| video-director | 영상 감독 | collaboration | 함께 이끄는 힘 | 여러 사람과 같이 만들어가는 힘이에요. | 협업·리더십과 연결됩니다. | 3 |
| physical-therapist | 물리치료사 | body_awareness | 몸을 이해하는 힘 | 몸의 움직임을 살피는 힘이에요. | 건강·의료 관심과 연결됩니다. | 1 |
| physical-therapist | 물리치료사 | care | 회복을 돕는 힘 | 아픈 사람을 돕고 싶은 마음이에요. | 돌봄 태도와 연결됩니다. | 2 |
| physical-therapist | 물리치료사 | communication | 차근차근 설명하는 힘 | 방법을 천천히 알려주는 힘이에요. | 설명·전달력과 연결됩니다. | 3 |
| sports-data-analyst | 스포츠 데이터 분석가 | data_sense | 숫자와 자료를 보는 힘 | 기록을 보고 차이를 찾는 힘이에요. | 데이터·분석 흥미와 연결됩니다. | 1 |
| sports-data-analyst | 스포츠 데이터 분석가 | observation | 경기 흐름을 읽는 힘 | 흐름을 보고 이유를 생각하는 힘이에요. | 관찰·분석 태도와 연결됩니다. | 2 |
| sports-data-analyst | 스포츠 데이터 분석가 | analysis | 차이를 발견하는 힘 | 작은 변화를 찾아보는 힘이에요. | 분석적 사고와 연결됩니다. | 3 |
| youth-sports-coach | 유소년 스포츠 코치 | collaboration | 함께 성장시키는 힘 | 같이 더 나아지게 돕는 힘이에요. | 협력·지도 태도와 연결됩니다. | 1 |
| youth-sports-coach | 유소년 스포츠 코치 | safety | 안전하게 지도하는 힘 | 다치지 않게 살피는 힘이에요. | 안전 판단력과 연결됩니다. | 2 |
| youth-sports-coach | 유소년 스포츠 코치 | empathy | 응원하고 격려하는 힘 | 힘이 나도록 응원하는 힘이에요. | 공감·격려 태도와 연결됩니다. | 3 |
| after-school-teacher | 방과후 교사 | communication | 쉽게 알려주는 힘 | 어려운 것을 쉽게 설명하는 힘이에요. | 전달력·교육 흥미와 연결됩니다. | 1 |
| after-school-teacher | 방과후 교사 | listening | 아이의 속도를 기다리는 힘 | 천천히 기다려주는 힘이에요. | 인내·배려 태도와 연결됩니다. | 2 |
| after-school-teacher | 방과후 교사 | planning | 활동을 준비하는 힘 | 재미있는 활동을 미리 준비하는 힘이에요. | 계획·준비 습관과 연결됩니다. | 3 |

## 7. parent_questions 확장 구조 초안 (seed 미작성)

> 이번 작업에서 질문 seed를 확정하지 않음. traits 기반으로 생성 가능함을 구조로만 정리.

| trait_code | parent_question_direction | 예시 질문 |
|---|---|---|
| empathy | 타인 감정 인식 | 친구가 속상해할 때 어떻게 도와주고 싶어? |
| data_sense | 숫자 흥미 | 오늘 본 숫자 중 가장 재미있던 건 뭐야? |
| observation | 관찰 경험 | 오늘 본 것 중 평소와 달랐던 점이 있었어? |
| collaboration | 협업 경험 | 친구와 같이 만들면 혼자 할 때보다 좋은 점은 뭐야? |
| safety | 안전 판단 | 밖에서 활동할 때 가장 먼저 확인할 건 뭐라고 생각해? |
| creativity | 상상 경험 | 오늘 떠올린 새로운 생각이 있었어? |
| listening | 경청 경험 | 오늘 누군가의 이야기를 끝까지 들어준 적 있어? |

## 8. seed migration 전 확인 사항 (2단계 선행)

- ✅ 실제 컬럼명 확인 완료: `occupation_id(uuid)`, `layer`, `trait_type`, `content`, `display_order`, `is_current`, `is_latest`, `status`, `generation_source` — **`trait_name/description/sort_order` 컬럼 없음**
- ✅ `occupation_id`는 **UUID** (occupation_master.id) → seed는 slug 서브쿼리 사용
- ⬜ **display_name 외 child_description/parent_note 저장 방식 결정** — (A) 프론트 정적 매핑 권장 / (B) content JSON / (C) 스키마 확장(보류)
- ⬜ `trait_type` 확정 — service 레이어에서 `aptitude_match`(역량) 사용 권장
- ⬜ RLS 확인: service+published+is_current 공개 조회 정책 존재(015) → 읽기 가능
- ⬜ 적용 대상 직업 확정(샘플 10개) + 문구 검수
- ⬜ 중복/버전 처리: `idx_ot_live`(occupation_id, layer, trait_type, display_order where is_current) 유니크 → 동일 직업에서 trait_type 동일 시 display_order로 구분

## 9. 2단계 권장 작업

1. 샘플 10개 traits seed migration 작성 (A안: content=노출명, trait_type=aptitude_match) + child/parent 문구 프론트 매핑 파일
2. 직업 상세 "이 일을 할 때 자주 쓰는 힘" UI 섹션 추가 (traits 조회 → trait_code 매핑으로 설명 렌더)
3. parent_questions seed 설계 1단계 (traits 기반)

## 10. 변경하지 않은 항목

- DB schema / Supabase migration / `occupation_traits` seed INSERT / UI 컴포넌트 / 직업 상세 화면 / `occupation_parent_questions` seed / 고용24 API / occupation_master DB / 명따라 Phase 2 / AI / 결제·쿠폰·PG — **변경 없음 (문서 설계 작업)**

## 11. 이력

| 날짜 | 내용 |
|---|---|
| 2026-06-03 | traits seed 설계 1단계 — 역량 표준안 15개 + 샘플 10개 직업 × 3 traits 초안 + parent_questions 연결 구조. 실제 스키마(content 단일 컬럼, occupation_id=UUID)와 작업지시서 가정의 차이 문서화. DB/migration/UI/seed 변경 없음. |
| 2026-06-03 | (2단계 구현/A안) 샘플 10개 직업 프론트 정적 traits seed(`src/data/occupationTraitSeed.ts`) + 직업 상세 "이 일을 할 때 자주 쓰는 힘" 섹션(`OccupationTraitSection`, db 모드 Goyo24InfoSection 아래) 추가. occupation_traits DB seed/스키마 변경 없음, parent_questions 미구현 유지. |
