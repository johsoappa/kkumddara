# 꿈따라 관심 운동 기반 진로 확장 구조 설계안

> 작성일: 2026-05-26
> 보정일: 2026-05-26 (`src/data/sportsInterestData.ts` 정적 데이터 파일 작성 완료, `/explore` 상세 UI 연결 완료)
> 작성 목적: 대표 직업 100개 확장 완료 이후, 아이가 좋아하는 운동을 출발점으로 다양한 직업군을 연결하는 구조를 문서화한다.
> 상태: 설계 완료 + 정적 데이터 파일 작성 완료 + `/explore` 상세 UI 구현 완료 (DB 변경 없음 / migration 없음)

---

## 1. 작업 목적

꿈따라 대표 직업 100개 확장이 완료된 시점에서, 다음 단계로 "관심 운동 기반 진로 확장 구조"를 설계한다.

이번 설계의 핵심은 **아이가 좋아하는 운동을 출발점으로 삼아**, 운동선수뿐 아니라 그 운동과 연결된 다양한 직업군을 함께 보여주는 구조를 만드는 것이다.

### 설계 배경

- 많은 아이들이 "내 꿈은 ○○선수"라고 이야기하지만, 프로 선수가 되는 것은 극소수의 경로다.
- 하지만 좋아하는 운동과 연결된 직업은 훨씬 다양하다.
- 꿈따라는 이 다양성을 아이의 눈높이에서 자연스럽게 보여주는 것을 목표로 한다.

### 표현 원칙

**사용하지 않는 표현:**
- 선수가 못 되면
- 실패하면
- 프로가 안 되면 어쩔 수 없이
- 운동선수 대신 할 수 있는 일

**권장 표현:**
- 운동을 좋아한다고 해서 꼭 선수만 길은 아니에요.
- 좋아하는 운동과 연결된 직업은 다양해요.
- 경기를 뛰는 사람도 있고, 분석하고, 가르치고, 안전하게 운영하고, 콘텐츠로 전하는 사람도 있어요.
- 좋아하는 운동을 출발점으로 더 넓은 직업 세계를 살펴볼 수 있어요.

---

## 2. 현재 대표 직업 100개 완료 상태

| 항목 | 상태 |
|---|---|
| 052 철도 직업 항공·운송 이동 | 완료 |
| 053 1차 대표 직업 23개 DB 반영 | 완료 |
| 054 1차 대표 직업 23개 미래 참고 지표 연결 | 완료 |
| 1차 23개 quizData 3문항 작성 | 완료 |
| 055 스포츠 진로 생태계 10개 DB 반영 | 완료 |
| 056 스포츠 진로 생태계 10개 미래 참고 지표 연결 | 완료 |
| 스포츠 진로 생태계 10개 quizData 3문항 작성 | 완료 |
| `/explore` 신규 스포츠 진로 생태계 10개 smoke test | 정상 확인 |
| 대표 직업 수 | **100개** |
| 전체 occupation_master | 114개 |
| 세부 직업 수 | 14개 |

> 대표 직업 100개 확장은 1차 운영 완료 상태다.
> 이번 설계는 그 이후 확장 방향을 준비하는 문서다.

---

## 3. 운동 종목과 직업의 구분 원칙

이번 설계에서 반드시 아래 구분 원칙을 지킨다.

| 구분 | 예시 | 처리 기준 |
|---|---|---|
| 관심 운동 | 축구, 야구, 농구, 수영, 태권도, 줄넘기 | 직업이 아니라 **관심 분야 / 진로 출발점** |
| 대표 꿈 | 축구선수, 야구선수, 줄넘기 선수 | **운동선수 계열 직업 후보**로 별도 관리 |
| 연결 직업군 | 스포츠 데이터 분석가, 유소년 스포츠 지도자, 운동처방사 | 실제 `occupation_master` 직업과 연결 |
| 화면 메시지 | 좋아하는 운동으로 찾는 직업 | 사용자 경험 문구로 활용 |

### 중요 원칙

- `축구`, `야구`, `농구`, `줄넘기` 같은 **종목명 자체를 `occupation_master`에 직업으로 넣지 않는다.**
- `축구선수`, `야구선수`, `줄넘기 선수`는 **향후 별도 운동선수 직업군 후보로 검토**한다.
- 이번 작업에서는 실제 선수 직업을 추가하지 않는다.
- 이번 작업은 관심 운동과 기존/신규 직업군의 **연결 구조를 설계**하는 것이다.

---

## 4. 운동선수 예시 목록

### 4-1. 확정 예시 목록

| 운동선수 직업 | 현재 상태 |
|---|---|
| 축구선수 | 미추가 (향후 별도 검토) |
| 야구선수 | 미추가 (향후 별도 검토) |
| 농구선수 | 미추가 (향후 별도 검토) |
| 배구선수 | 미추가 (향후 별도 검토) |
| 수영선수 | 미추가 (향후 별도 검토) |
| 태권도 선수 | 미추가 (향후 별도 검토) |
| 줄넘기 선수 | 미추가 (향후 별도 검토) |
| 골프선수 | 미추가 (향후 별도 검토) |
| e스포츠 선수 | 미추가 (향후 별도 검토) |

> 위 운동선수 직업군은 현재 `occupation_master`에 존재하지 않는다.
> 향후 운동선수 계열 직업군 확장 설계 시 별도 검토한다.

---

## 5. 육상선수 제외 및 줄넘기 선수 포함 결정

### 5-1. 결정 배경

기존 운동선수 예시 목록 후보에 `육상선수`가 포함되어 있었으나 이번 설계에서 제외한다.

**제외 이유:**
- 육상은 초등학생 일상 스포츠 활동보다 엘리트·경쟁 트랙 이미지가 강하다.
- 방과후·학교 체육과의 연결성이 상대적으로 낮다.
- 꿈따라 핵심 사용자(초등학생)의 일상 경험과 거리가 있다.

**대신 `줄넘기 선수` 포함:**

줄넘기는 아이들이 학교와 일상에서 쉽게 접할 수 있는 운동이다.
단순한 놀이처럼 보일 수 있지만, 체력, 리듬감, 순발력, 꾸준함을 기르는 활동이기도 하다.
줄넘기를 좋아하는 아이는 줄넘기 선수나 음악줄넘기 퍼포머뿐 아니라 유소년 스포츠 지도자, 방과후교사, 운동처방사, 스포츠 콘텐츠 기획자, 스포츠 안전관리자 같은 직업도 함께 탐색해볼 수 있다.

**줄넘기가 연결 가능한 영역:**
- 음악줄넘기 / 리듬줄넘기 퍼포먼스
- 체력 활동 및 건강 관리
- 유소년 스포츠 지도
- 방과후교사 (줄넘기 방과후 수업)
- 스포츠 콘텐츠 기획 (영상, SNS)
- 운동처방 (체력 향상 프로그램)
- 스포츠 안전관리 (학교 체육 환경 안전)

---

## 6. 관심 운동 목록 (1차 기준)

이번 설계에서는 아래 10개 관심 운동을 1차 기준으로 정리한다.

| 우선순위 | 관심 운동 | 대표 꿈 | 설계 이유 |
|---:|---|---|---|
| 1 | 축구 | 축구선수 | 남녀 학생 모두 인지도 높고 스포츠 진로 확장성이 큼 |
| 2 | 야구 | 야구선수 | 기록·분석·구단 운영·콘텐츠 연결성이 큼 |
| 3 | 농구 | 농구선수 | 팀워크·전략·콘텐츠·브랜드 연결성이 좋음 |
| 4 | 배구 | 배구선수 | 팀 스포츠, 협동심, 지도자·콘텐츠 연결 가능 |
| 5 | 수영 | 수영선수 | 수상안전, 해양레저, 건강관리와 연결 가능 |
| 6 | 태권도·무도 | 태권도 선수 | 학교·학원·생활체육·해외 지도 연결성이 강함 |
| 7 | 줄넘기 | 줄넘기 선수 | 초등 접근성, 방과후, 음악줄넘기, 학교 체육 연결성이 높음 |
| 8 | 골프 | 골프선수 | 장비, 코칭, 스포츠 마케팅, 데이터 분석 연결 가능 |
| 9 | e스포츠 | e스포츠 선수 | 게임, 데이터, 콘텐츠, 멘탈 관리, 해설 연결 가능 |
| 10 | 캠핑·등산·아웃도어 | 아웃도어 활동가 | 자연 체험, 안전, 레저 기획, 콘텐츠 연결 가능 |

> 위 목록은 `occupation_master`에 바로 넣는 직업 목록이 아니다.
> 관심 운동 기반 진로 확장 화면 또는 추천 구조를 설계하기 위한 기준 목록이다.

---

## 7. 기존 스포츠 진로 생태계 10개 직업과의 연결

055/056/quizData 작업으로 아래 스포츠 진로 생태계 직업 10개가 이미 `occupation_master`에 반영되어 있다.
이번 설계에서는 이 10개 직업을 **관심 운동별 연결 직업군**으로 재활용한다.

| 직업명 | slug | 관심 운동 연결 역할 |
|---|---|---|
| 스포츠 데이터 분석가 | sports-data-analyst | 축구·야구·농구·골프·e스포츠의 분석 방향 연결 |
| 스포츠 테크 개발자 | sports-tech-developer | 축구·야구·골프·e스포츠의 기술 방향 연결 |
| 운동처방사 | exercise-prescription-specialist | 모든 관심 운동의 건강·체력 관리 방향 연결 |
| 스포츠 콘텐츠 기획자 | sports-content-planner | 모든 관심 운동의 콘텐츠 방향 연결 |
| 스포츠 마케터 | sports-marketer | 축구·야구·농구·배구·골프의 비즈니스 방향 연결 |
| 유소년 스포츠 지도자 | youth-sports-coach | 모든 관심 운동의 지도·교육 방향 연결 |
| 아웃도어 레저 기획자 | outdoor-leisure-planner | 캠핑·등산·아웃도어의 핵심 연결 직업 |
| 해양레저 전문가 | marine-leisure-specialist | 수영·수상 활동의 해양 체험 방향 연결 |
| 스포츠 안전관리자 | sports-safety-manager | 모든 관심 운동의 안전 방향 연결 |
| 수상안전요원 | water-safety-lifeguard | 수영·해양 활동의 안전 방향 연결 |

---

## 8. 관심 운동별 진로 연결 예시

### 8-1. 축구

| 방향 | 연결 직업 | slug |
|---|---|---|
| 직접 경기 | 축구선수 | (미추가, 향후 검토) |
| 지도 | 유소년 스포츠 지도자 | youth-sports-coach |
| 분석 | 스포츠 데이터 분석가 | sports-data-analyst |
| 기술 | 스포츠 테크 개발자 | sports-tech-developer |
| 건강 관리 | 운동처방사 | exercise-prescription-specialist |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 비즈니스 | 스포츠 마케터 | sports-marketer |
| 안전 | 스포츠 안전관리자 | sports-safety-manager |

### 8-2. 야구

| 방향 | 연결 직업 | slug |
|---|---|---|
| 직접 경기 | 야구선수 | (미추가, 향후 검토) |
| 분석 | 스포츠 데이터 분석가 | sports-data-analyst |
| 기술 | 스포츠 테크 개발자 | sports-tech-developer |
| 건강 관리 | 운동처방사 | exercise-prescription-specialist |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 비즈니스 | 스포츠 마케터 | sports-marketer |
| 지도 | 유소년 스포츠 지도자 | youth-sports-coach |

### 8-3. 농구

| 방향 | 연결 직업 | slug |
|---|---|---|
| 직접 경기 | 농구선수 | (미추가, 향후 검토) |
| 지도 | 유소년 스포츠 지도자 | youth-sports-coach |
| 분석 | 스포츠 데이터 분석가 | sports-data-analyst |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 비즈니스 | 스포츠 마케터 | sports-marketer |
| 안전 | 스포츠 안전관리자 | sports-safety-manager |
| 건강 관리 | 운동처방사 | exercise-prescription-specialist |

### 8-4. 배구

| 방향 | 연결 직업 | slug |
|---|---|---|
| 직접 경기 | 배구선수 | (미추가, 향후 검토) |
| 지도 | 유소년 스포츠 지도자 | youth-sports-coach |
| 분석 | 스포츠 데이터 분석가 | sports-data-analyst |
| 건강 관리 | 운동처방사 | exercise-prescription-specialist |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 안전 | 스포츠 안전관리자 | sports-safety-manager |

### 8-5. 수영

| 방향 | 연결 직업 | slug |
|---|---|---|
| 직접 경기 | 수영선수 | (미추가, 향후 검토) |
| 건강 관리 | 운동처방사 | exercise-prescription-specialist |
| 안전 | 수상안전요원 | water-safety-lifeguard |
| 해양 활동 | 해양레저 전문가 | marine-leisure-specialist |
| 지도 | 유소년 스포츠 지도자 | youth-sports-coach |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 안전 관리 | 스포츠 안전관리자 | sports-safety-manager |

### 8-6. 태권도·무도

| 방향 | 연결 직업 | slug |
|---|---|---|
| 직접 경기 | 태권도 선수 | (미추가, 향후 검토) |
| 지도 | 유소년 스포츠 지도자 | youth-sports-coach |
| 건강 관리 | 운동처방사 | exercise-prescription-specialist |
| 안전 관리 | 스포츠 안전관리자 | sports-safety-manager |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 비즈니스 | 스포츠 마케터 | sports-marketer |

### 8-7. 줄넘기

| 방향 | 연결 직업 | slug |
|---|---|---|
| 직접 경기 | 줄넘기 선수 | (미추가, 향후 검토) |
| 공연·표현 | 음악줄넘기 퍼포머 | (향후 직업군 검토) |
| 지도 | 유소년 스포츠 지도자 | youth-sports-coach |
| 지도 | 방과후교사 | (기존 occupation_master 확인 필요) |
| 건강·체력 | 운동처방사 | exercise-prescription-specialist |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 안전 | 스포츠 안전관리자 | sports-safety-manager |
| 데이터·기록 | 스포츠 데이터 분석가 | sports-data-analyst |

**줄넘기 화면 설명 문구 예시:**

> 줄넘기는 아이들이 학교와 일상에서 쉽게 접할 수 있는 운동이에요.  
> 단순한 놀이처럼 보일 수 있지만, 체력, 리듬감, 순발력, 꾸준함을 기르는 활동이기도 해요.  
> 줄넘기를 좋아하는 아이는 줄넘기 선수나 음악줄넘기 퍼포머뿐 아니라  
> 유소년 스포츠 지도자, 방과후교사, 운동처방사, 스포츠 콘텐츠 기획자, 스포츠 안전관리자 같은 직업도 함께 탐색해볼 수 있어요.

### 8-8. 골프

| 방향 | 연결 직업 | slug |
|---|---|---|
| 직접 경기 | 골프선수 | (미추가, 향후 검토) |
| 지도 | 유소년 스포츠 지도자 | youth-sports-coach |
| 분석 | 스포츠 데이터 분석가 | sports-data-analyst |
| 기술 | 스포츠 테크 개발자 | sports-tech-developer |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 비즈니스 | 스포츠 마케터 | sports-marketer |
| 건강 관리 | 운동처방사 | exercise-prescription-specialist |

### 8-9. e스포츠

| 방향 | 연결 직업 | slug |
|---|---|---|
| 직접 경기 | e스포츠 선수 | (미추가, 향후 검토) |
| 분석 | 스포츠 데이터 분석가 | sports-data-analyst |
| 기술 | 스포츠 테크 개발자 | sports-tech-developer |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 비즈니스 | 스포츠 마케터 | sports-marketer |
| 건강 관리 | 운동처방사 | exercise-prescription-specialist |
| 안전·생활관리 | 스포츠 안전관리자 | sports-safety-manager |

**e스포츠 표현 원칙:**
- 게임 중독을 부추기는 표현을 피한다.
- 집중력, 전략, 팀워크, 콘텐츠, 기술, 건강 관리 관점으로 표현한다.

### 8-10. 캠핑·등산·아웃도어

| 방향 | 연결 직업 | slug |
|---|---|---|
| 야외 활동 기획 | 아웃도어 레저 기획자 | outdoor-leisure-planner |
| 수상·해양 활동 | 해양레저 전문가 | marine-leisure-specialist |
| 수상 안전 | 수상안전요원 | water-safety-lifeguard |
| 안전 관리 | 스포츠 안전관리자 | sports-safety-manager |
| 콘텐츠 | 스포츠 콘텐츠 기획자 | sports-content-planner |
| 기술 | 스포츠 테크 개발자 | sports-tech-developer |
| 건강 관리 | 운동처방사 | exercise-prescription-specialist |

---

## 9. 추천 화면 UX 구조 (향후 구현 대상)

이번 작업에서는 구현하지 않지만, 향후 화면 구조를 문서화한다.

### 9-1. `/explore` 직업 상세 내부 섹션

후보 섹션명:

```
이 운동을 좋아한다면 함께 볼 직업
```

**예시 — 축구선수 상세 또는 축구 관심사 페이지:**

| 함께 볼 직업 | 이유 |
|---|---|
| 스포츠 데이터 분석가 | 경기를 기록과 숫자로 분석해요 |
| 유소년 스포츠 지도자 | 아이들에게 축구 기본기와 협동심을 가르쳐요 |
| 운동처방사 | 선수와 일반인의 몸 상태에 맞는 운동을 설계해요 |
| 스포츠 콘텐츠 기획자 | 축구 이야기를 영상과 콘텐츠로 전해요 |
| 스포츠 마케터 | 구단과 팬을 연결하는 일을 해요 |

### 9-2. 관심사 기반 추천 페이지

후보 페이지명:

```
좋아하는 운동으로 찾는 직업
```

**페이지 흐름:**

1. 좋아하는 운동 선택
2. 대표 꿈 확인
3. 연결 직업군 보기
4. 관련 직업 상세로 이동
5. 명따라 / 로드맵 / 퀴즈와 연결

**구현 시 고려 사항:**
- 운동 선택 UI: 아이콘 카드 형태 (초등학생 눈높이)
- 연결 직업군: 기존 `/explore` 직업 카드 재사용
- 화면 메시지: 부정 표현 없이 긍정·탐색 중심 문구 사용

---

## 10. 장기 데이터 구조 설계안

이번 작업에서는 DB를 만들지 않는다. 장기 구조만 문서화한다.

### 10-1. 장기 엔티티 후보

| 엔티티 | 역할 |
|---|---|
| `interest_sports` | 축구, 야구, 줄넘기 같은 관심 운동 목록 |
| `sport_career_links` | 관심 운동과 직업 slug 연결 |
| `sport_athlete_examples` | 축구선수, 줄넘기 선수 같은 대표 꿈 예시 |
| `occupation_master` | 실제 직업 목록 (기존 테이블 활용) |
| `recommended_occupations` | 관심사 기반 추천 결과 |

### 10-2. 예시 스키마 구조

```sql
-- 관심 운동 목록
interest_sports
  id           uuid        PRIMARY KEY
  name_ko      text        NOT NULL  -- 예: 축구, 줄넘기
  slug         text        UNIQUE    -- 예: soccer, jump-rope
  description  text                  -- 화면 설명 문구
  is_active    boolean     DEFAULT true
  display_order integer   DEFAULT 0

-- 관심 운동 × 직업 연결
sport_career_links
  sport_slug        text    REFERENCES interest_sports(slug)
  occupation_slug   text    REFERENCES occupation_master(slug)
  relation_type     text    -- '지도', '분석', '콘텐츠', '안전', '건강관리', '비즈니스', '기술'
  reason            text    -- 화면 표시용 이유 문구
  display_order     integer DEFAULT 0
  PRIMARY KEY (sport_slug, occupation_slug)

-- 운동선수 예시 (대표 꿈)
sport_athlete_examples
  sport_slug       text    REFERENCES interest_sports(slug)
  athlete_name_ko  text    NOT NULL  -- 예: 축구선수
  athlete_slug     text              -- 향후 occupation_master 연결 시 사용
  note             text
```

> **주의:** 이번 작업에서는 이 테이블을 생성하지 않는다. migration 작성 금지. 단지 장기 설계 후보로 문서화한다.

### 10-3. 정적 데이터 파일 — 작성 완료 ✅

`src/data/sportsInterestData.ts` 정적 데이터 파일이 작성되었다. (2026-05-26)

**포함 내용:**
- `SportsInterestItem` / `SportsInterestCareerLink` / `SportCareerRelationType` 타입 정의
- `sportsInterestData` 배열 — 관심 운동 10개 × 연결 직업군
- Helper 함수 3개: `getSportsInterestBySlug`, `getSportsInterestsByOccupationSlug`, `getRelatedOccupationsBySportSlug`

**관심 운동 10개 요약:**

| slug | nameKo | representativeDream | careerLinks 수 |
|---|---|---|---:|
| soccer | 축구 | 축구선수 | 7 |
| baseball | 야구 | 야구선수 | 7 |
| basketball | 농구 | 농구선수 | 7 |
| volleyball | 배구 | 배구선수 | 6 |
| swimming | 수영 | 수영선수 | 6 |
| taekwondo-martial-arts | 태권도·무도 | 태권도 선수 | 6 |
| jump-rope | 줄넘기 | 줄넘기 선수 | 6 |
| golf | 골프 | 골프선수 | 7 |
| esports | e스포츠 | e스포츠 선수 | 6 |
| outdoor | 캠핑·등산·아웃도어 | 아웃도어 활동가 | 7 |

**향후 UI 구현 시 이 파일을 우선 사용한다.** DB 테이블(`interest_sports`, `sport_career_links`) 전환 시 이 파일 구조를 기반으로 마이그레이션한다.

**연결 직업 slug 사용 목록 (전체 11개):**
`youth-sports-coach`, `sports-data-analyst`, `sports-tech-developer`, `exercise-prescription-specialist`, `sports-content-planner`, `sports-marketer`, `sports-safety-manager`, `water-safety-lifeguard`, `marine-leisure-specialist`, `outdoor-leisure-planner`, `after-school-teacher`

> `after-school-teacher`는 migration 053에서 추가된 확인된 slug다.

---

## 11. 구현 시 주의사항

### 11-1. 직업 데이터 관련

- `관심 운동` 자체는 `occupation_master`에 넣지 않는다.
- `운동선수`(축구선수, 야구선수 등) 직업 추가 시 별도 설계 작업지시서 필요.
- 연결 직업군은 현재 `occupation_master`에 존재하는 slug만 사용한다.

### 11-2. 표현 관련

- 항상 긍정·탐색 중심 문구를 사용한다.
- "선수가 못 되면", "실패하면" 같은 부정적 표현은 쓰지 않는다.
- e스포츠는 게임 중독 연상 표현을 피하고 집중력·전략·팀워크 중심으로 표현한다.

### 11-3. 줄넘기 관련

- `방과후교사` slug가 현재 `occupation_master`에 있는지 별도 확인이 필요하다.
- `음악줄넘기 퍼포머`는 현재 대표 직업 100개에 없으므로 향후 검토 직업으로 분류한다.

### 11-4. 인증/권한 관련

- 이 기능은 학생 홈 또는 `/explore` 내부 섹션으로 설계한다.
- 학부모/학생 역할 분기 정책을 따른다 (기존 auth 구조 준수).

---

## 12. 후속 작업 제안

| 우선순위 | 작업 | 비고 |
|---|---|---|
| 1 | 운동선수 직업군(`축구선수` 등) `occupation_master` 추가 여부 정책 결정 | OZ 결정 필요 |
| 2 | `방과후교사` slug 존재 여부 확인 (`줄넘기` 연결 시 필요) | ✅ migration 053 확인 — `after-school-teacher` 존재 |
| 3 | 정적 데이터 파일 `src/data/sportsInterestData.ts` 작성 | ✅ 완료 (2026-05-26) |
| 4 | `/explore` 직업 상세 내 "이 운동을 좋아한다면 함께 볼 직업" 섹션 UI | ✅ 완료 (2026-05-26) — `SportsInterestCareerSection.tsx` |
| 5 | 관심 운동 선택 화면 UX 설계 및 구현 | 신규 페이지 또는 `/explore` 내 필터 |
| 6 | `interest_sports` / `sport_career_links` 테이블 도입 검토 | 데이터 확장 시 필요 |
| 7 | 명따라 결과(관심사·성향)와 관심 운동 추천 연결 여부 검토 | 추천 로직 확장 시 필요 |
| 8 | roadmaps 직접 작성 여부 판단 (스포츠 생태계 10개 직업) | 현재 weekly mission fallback 사용 중 |

### UI 구현 완료 내용 (2026-05-26)

- `src/components/explore/SportsInterestCareerSection.tsx` 신규 생성
- `/explore/[id]/page.tsx` — DB 모드(⑥) + 정적 폴백 모드(④-A)에 삽입
- 배치 위치: Goyo24InfoSection(미래 참고 지표) 아래, 퀴즈 섹션 위
- `sportsInterestData.ts`가 실제 UI에서 처음 사용됨 (DB 없이 정적 데이터 기반 1차 구현)
- 다음 단계: 관심 운동 선택 화면 또는 운동선수 직업군 정책 결정

---

*이 문서는 설계 및 구현 기록 문서입니다.  
DB 변경 없음 / migration 없음.  
작성일: 2026-05-26*
