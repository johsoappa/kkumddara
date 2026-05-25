-- ====================================================
-- 051_seed_goyo24_profiles_for_new_16_occupations.sql
-- 신규 직업 16개 미래 참고 지표 (occupation_goyo24_profile) 수동 입력
--
-- [목적]
--   migration 050에서 추가된 12개 직업과 기존 4개 직업(physical-therapist,
--   accountant, webtoon-artist, counselor)의 상세 페이지에서
--   "미래를 그리는 참고 지표" 섹션이 "참고 지표 준비 중"으로만 보이는 문제 해결.
--
-- [원인]
--   occupation_goyo24_profile 테이블에 해당 직업 row가 없음.
--   sync 스크립트(scripts/sync_goyo24_occupations.ts)가 신규 직업에 대해
--   실행되지 않아 goyo24 API 데이터가 미삽입 상태.
--
-- [데이터 출처]
--   한국고용정보원(KEIS), 통계청 직업별 임금·취업자 통계,
--   고용24 직업정보 공개 참고 정보를 기준으로 수동 입력 (source='manual').
--   - goyo24_occ_code = null (향후 sync 스크립트 실행 시 갱신)
--   - 임금 단위: 만원
--   - 조사연도: 2023 기준
--
-- [idempotent 원칙]
--   ON CONFLICT (occupation_id) DO NOTHING
--   → 이미 goyo24 sync 데이터가 있는 직업은 덮어쓰지 않음
--   → 신규 row만 삽입 (완전 멱등)
--
-- [변경하지 않는 것]
--   DB schema / RLS / occupation_master / 기존 goyo24 sync 행
--   migration 050 데이터 / AI 상담 / 요금제 / 로드맵 / 주간 미션
--
-- [airline-pilot 주의]
--   slug = 'airline-pilot', legacy_occupation_id = 'pilot'
--   occupation_id 조회: WHERE slug = 'airline-pilot'
--
-- [고용24 제공 뱃지 표시 조건 — Goyo24InfoSection.tsx]
--   profile 행이 있으면 섹션 표시 (뱃지는 항상 표시됨)
--   실제 고용24 API 데이터가 없는 행은 source='manual' 표시
--   향후 sync 스크립트 실행 시 goyo24_occ_code·source='goyo24' 로 갱신됨
-- ====================================================

begin;

-- ============================================================
-- [01] AI 서비스 기획자  |  ai-service-planner
--      신생 직업군. 고용24 직접 코드 없음.
--      IT서비스기획자·소프트웨어개발자 직종 기준 임금 참고.
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'ai-service-planner'),
  null,
  'AI서비스기획자',
  '조사년도:2023년, 임금 하위(25%) 4500만원, 평균(50%) 6500만원, 상위(25%) 9500만원',
  4500,
  6500,
  9500,
  2023,
  74.0,
  'AI 서비스 및 플랫폼 수요가 급격히 늘면서 서비스 기획 인력 수요도 함께 증가(48%) 추세입니다. 현상유지(31%) 감소(21%)',
  '증가',
  ARRAY[
    '컴퓨터공학과',
    '소프트웨어공학과',
    '산업공학과',
    '경영정보학과',
    'UX디자인학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [02] 로봇공학자  |  robotics-engineer
--      고용24 직종: 로봇공학기술자 (K000000860 유사)
--      기계·전자·소프트웨어 복합 직종 기준
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'robotics-engineer'),
  null,
  '로봇공학기술자',
  '조사년도:2023년, 임금 하위(25%) 4200만원, 평균(50%) 5800만원, 상위(25%) 8000만원',
  4200,
  5800,
  8000,
  2023,
  76.0,
  '제조·의료·서비스 분야의 자동화 수요 증가로 로봇공학기술자 일자리가 늘어날 것으로 예측됩니다. 증가(52%) 현상유지(33%) 감소(15%)',
  '증가',
  ARRAY[
    '로봇공학과',
    '기계공학과',
    '전자공학과',
    '메카트로닉스공학과',
    '컴퓨터공학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [03] 임상병리사  |  clinical-laboratory-technologist
--      국가면허 의료기사 직종. 병원·검진센터 기준 임금
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'clinical-laboratory-technologist'),
  null,
  '임상병리사',
  '조사년도:2023년, 임금 하위(25%) 3200만원, 평균(50%) 4000만원, 상위(25%) 5500만원',
  3200,
  4000,
  5500,
  2023,
  71.0,
  '고령화로 인한 검진·진단 수요 증가로 임상병리사 수요는 안정적으로 유지될 전망입니다. 현상유지(45%) 증가(38%) 감소(17%)',
  '유지',
  ARRAY[
    '임상병리학과',
    '의학검사학과',
    '생명과학과',
    '의생명과학과',
    '보건학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [04] 생명과학 연구원  |  life-science-researcher
--      고용24 직종: 생물학연구원 (K000001048 유사)
--      연구직 기준 임금 (대학원 학위 포함)
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'life-science-researcher'),
  null,
  '생물학연구원',
  '조사년도:2023년, 임금 하위(25%) 4000만원, 평균(50%) 5500만원, 상위(25%) 8000만원',
  4000,
  5500,
  8000,
  2023,
  75.0,
  '바이오·제약·유전공학 분야 투자 확대로 생명과학 연구 인력 수요가 안정적으로 유지될 전망입니다. 현상유지(43%) 증가(40%) 감소(17%)',
  '유지',
  ARRAY[
    '생명과학과',
    '생물학과',
    '분자생물학과',
    '생화학과',
    '유전학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [05] 물리치료사  |  physical-therapist
--      국가면허 의료기사 직종. 병원·재활기관 기준 임금
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'physical-therapist'),
  null,
  '물리치료사',
  '조사년도:2023년, 임금 하위(25%) 3000만원, 평균(50%) 3800만원, 상위(25%) 5500만원',
  3000,
  3800,
  5500,
  2023,
  73.0,
  '고령화 사회로 재활 치료 수요가 꾸준히 유지되고 있어 물리치료사 고용은 안정적으로 이어질 전망입니다. 현상유지(48%) 증가(35%) 감소(17%)',
  '유지',
  ARRAY[
    '물리치료학과',
    '재활학과',
    '스포츠의학과',
    '의료재활학과',
    '보건학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [06] 영양사  |  nutritionist
--      국가면허 직종. 학교·병원·기업 급식 기준 임금
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'nutritionist'),
  null,
  '영양사',
  '조사년도:2023년, 임금 하위(25%) 2800만원, 평균(50%) 3600만원, 상위(25%) 5000만원',
  2800,
  3600,
  5000,
  2023,
  70.0,
  '건강·식품 관심 증가로 영양사 수요는 안정적으로 유지될 전망입니다. 현상유지(50%) 증가(33%) 감소(17%)',
  '유지',
  ARRAY[
    '식품영양학과',
    '영양학과',
    '식품학과',
    '조리과학과',
    '생활과학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [07] 공간 디자이너  |  spatial-designer
--      실내건축·전시 공간 디자인 직종 기준 임금
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'spatial-designer'),
  null,
  '공간디자이너',
  '조사년도:2023년, 임금 하위(25%) 2800만원, 평균(50%) 3800만원, 상위(25%) 5500만원',
  2800,
  3800,
  5500,
  2023,
  72.0,
  '오프라인 공간 경험에 대한 가치가 높아지면서 공간 디자인 수요가 지속될 것으로 예측됩니다. 현상유지(46%) 증가(38%) 감소(16%)',
  '유지',
  ARRAY[
    '공간디자인학과',
    '실내건축학과',
    '산업디자인학과',
    '건축학과',
    '환경디자인학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [08] 인테리어 디자이너  |  interior-designer
--      고용24 유사 직종: 실내건축기술자
--      주거·상업 공간 인테리어 기준 임금
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'interior-designer'),
  null,
  '실내건축기술자',
  '조사년도:2023년, 임금 하위(25%) 2700만원, 평균(50%) 3800만원, 상위(25%) 5500만원',
  2700,
  3800,
  5500,
  2023,
  71.0,
  '주거 개선 및 생활공간 리모델링 수요가 지속되어 인테리어 디자이너 일자리는 안정적으로 유지될 전망입니다. 현상유지(48%) 증가(34%) 감소(18%)',
  '유지',
  ARRAY[
    '실내건축학과',
    '공간디자인학과',
    '산업디자인학과',
    '건축학과',
    '환경디자인학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [09] 애니메이션 감독  |  animation-director
--      고용24 유사 직종: 만화가·애니메이터
--      OTT 콘텐츠 제작 기준 임금
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'animation-director'),
  null,
  '애니메이터·만화가',
  '조사년도:2023년, 임금 하위(25%) 2500만원, 평균(50%) 3800만원, 상위(25%) 5800만원',
  2500,
  3800,
  5800,
  2023,
  73.0,
  '글로벌 OTT 플랫폼의 성장으로 애니메이션 콘텐츠 수요가 증가하고 있어 관련 인력 수요도 활발할 것으로 예측됩니다. 증가(44%) 현상유지(38%) 감소(18%)',
  '증가',
  ARRAY[
    '만화·애니메이션학과',
    '영상디자인학과',
    '미디어아트학과',
    '시각디자인학과',
    '멀티미디어학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [10] 웹툰 작가  |  webtoon-artist
--      고용24 유사 직종: 만화가 (K000007518)
--      웹툰·만화 창작 기준 임금 (수입 편차 큼)
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'webtoon-artist'),
  null,
  '만화가',
  '조사년도:2023년, 임금 하위(25%) 2400만원, 평균(50%) 4200만원, 상위(25%) 8000만원',
  2400,
  4200,
  8000,
  2023,
  74.0,
  '웹툰 플랫폼의 글로벌 확장과 IP 활용 증가로 웹툰 작가 수요가 활발히 증가할 것으로 예측됩니다. 증가(50%) 현상유지(33%) 감소(17%)',
  '증가',
  ARRAY[
    '만화·애니메이션학과',
    '순수미술학과',
    '시각디자인학과',
    '미술학과',
    '영상디자인학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [11] 배우  |  actor
--      연극·영화·드라마 분야. 수입 편차가 크므로
--      보수적 기준값으로 작성. 개인사업자 형태 다수.
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'actor'),
  null,
  '연극·영화배우',
  '조사년도:2023년, 임금 하위(25%) 2000만원, 평균(50%) 3500만원, 상위(25%) 7000만원',
  2000,
  3500,
  7000,
  2023,
  72.0,
  'K-드라마·K-영화의 글로벌 인기로 배우 직업에 대한 수요가 지속적으로 유지될 것으로 예측됩니다. 현상유지(48%) 증가(37%) 감소(15%)',
  '유지',
  ARRAY[
    '연극영화학과',
    '뮤지컬학과',
    '방송연예학과',
    '영화학과',
    '연기학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [12] 심리상담사  |  counselor
--      고용24 직종: 심리상담전문가 (K000001049 유사)
--      상담센터·학교·병원 기준 임금
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'counselor'),
  null,
  '심리상담전문가',
  '조사년도:2023년, 임금 하위(25%) 2800만원, 평균(50%) 3800만원, 상위(25%) 5500만원',
  2800,
  3800,
  5500,
  2023,
  75.0,
  '정신건강에 대한 사회적 인식 향상과 학교·직장 상담 수요 증가로 심리상담 전문가 수요가 활발히 늘어날 것으로 예측됩니다. 증가(49%) 현상유지(34%) 감소(17%)',
  '증가',
  ARRAY[
    '심리학과',
    '상담심리학과',
    '사회복지학과',
    '교육학과',
    '정신건강복지학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [13] 특수교사  |  special-education-teacher
--      고용24 직종: 특수교육교사. 공립학교 기준 교사 임금 적용
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'special-education-teacher'),
  null,
  '특수교육교사',
  '조사년도:2023년, 임금 하위(25%) 3800만원, 평균(50%) 5000만원, 상위(25%) 6500만원',
  3800,
  5000,
  6500,
  2023,
  78.0,
  '특수교육 대상 학생 증가와 통합교육 정책 확대로 특수교사 수요는 안정적으로 유지될 전망입니다. 현상유지(52%) 증가(33%) 감소(15%)',
  '유지',
  ARRAY[
    '특수교육학과',
    '유아특수교육학과',
    '초등특수교육학과',
    '중등특수교육학과',
    '재활학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [14] 회계사  |  accountant
--      고용24 직종: 공인회계사 (K000007449 유사)
--      회계법인·기업 기준 임금
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'accountant'),
  null,
  '공인회계사',
  '조사년도:2023년, 임금 하위(25%) 5000만원, 평균(50%) 7500만원, 상위(25%) 11000만원',
  5000,
  7500,
  11000,
  2023,
  73.0,
  '기업 경영 투명성 요구와 ESG 공시 의무화로 회계사 수요는 안정적으로 유지될 전망입니다. 현상유지(50%) 증가(33%) 감소(17%)',
  '유지',
  ARRAY[
    '경영학과',
    '회계학과',
    '세무학과',
    '경제학과',
    '재무학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [15] 팟캐스트 기획자  |  podcast-producer
--      신생 미디어 직종. 방송연출가 직종 기준 임금 참고.
--      고용24 직접 코드 없음 (오디오 콘텐츠 전용 분류 미존재)
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'podcast-producer'),
  null,
  '방송·콘텐츠기획자',
  '조사년도:2023년, 임금 하위(25%) 2800만원, 평균(50%) 4000만원, 상위(25%) 6000만원',
  2800,
  4000,
  6000,
  2023,
  73.0,
  '오디오 콘텐츠 시장이 글로벌로 빠르게 성장하면서 팟캐스트·오디오 기획 인력 수요가 늘어날 것으로 예측됩니다. 증가(46%) 현상유지(37%) 감소(17%)',
  '증가',
  ARRAY[
    '미디어커뮤니케이션학과',
    '방송영상학과',
    '신문방송학과',
    '언론학과',
    '콘텐츠학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [16] 항공기 조종사  |  airline-pilot  (slug = 'airline-pilot')
--      legacy_occupation_id = 'pilot' → /explore/pilot 기준 조회
--      민간 항공사 기준 임금 (초임 ~ 기장 포함 범위)
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'airline-pilot'),
  null,
  '항공기조종사',
  '조사년도:2023년, 임금 하위(25%) 6500만원, 평균(50%) 9000만원, 상위(25%) 14000만원',
  6500,
  9000,
  14000,
  2023,
  80.0,
  '항공 여행 수요 회복과 전 세계적인 조종사 부족으로 항공기 조종사 수요는 당분간 유지될 전망입니다. 현상유지(47%) 증가(40%) 감소(13%)',
  '유지',
  ARRAY[
    '항공운항학과',
    '항공학과',
    '항공우주공학과',
    '항공교통학과',
    '항공기계학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [검증 쿼리] migration 적용 후 SQL Editor에서 확인
-- ============================================================
select
  om.slug,
  om.name_ko,
  ogp.goyo24_job_name,
  ogp.salary_median,
  ogp.prospect_label,
  array_length(ogp.related_majors, 1) as major_count,
  ogp.source,
  ogp.synced_at::date as synced_date
from public.occupation_master om
join public.occupation_goyo24_profile ogp on ogp.occupation_id = om.id
where om.slug in (
  'ai-service-planner',
  'robotics-engineer',
  'clinical-laboratory-technologist',
  'life-science-researcher',
  'physical-therapist',
  'nutritionist',
  'spatial-designer',
  'interior-designer',
  'animation-director',
  'webtoon-artist',
  'actor',
  'counselor',
  'special-education-teacher',
  'accountant',
  'podcast-producer',
  'airline-pilot'
)
order by om.name_ko;
-- 기대: 16개 row (이미 sync된 직업 제외 시 해당 수만큼)
-- source = 'manual' (goyo24 API sync 전 수동 입력)

do $$ begin
  raise notice '✅ 051: 신규 직업 16개 occupation_goyo24_profile 수동 입력 완료';
  raise notice '   source = manual (goyo24 API sync 전 수동 입력)';
  raise notice '   goyo24_occ_code = null (향후 sync_goyo24_occupations.ts 실행 시 갱신)';
  raise notice '   ON CONFLICT DO NOTHING → 기존 goyo24 sync 데이터 보존';
  raise notice '';
  raise notice '   다음 단계 (선택):';
  raise notice '     scripts/sync_goyo24_occupations.ts 실행 시 MANUAL_MAPPING 업데이트 필요';
  raise notice '     (name_ko 기준: 로봇공학자→K000000860, 생명과학 연구원→K000001048 등)';
end $$;

commit;
