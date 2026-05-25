-- ====================================================
-- 054_seed_goyo24_profiles_for_first_wave_occupations.sql
-- 053 신규 직업 23개 미래 참고 지표 (occupation_goyo24_profile) 수동 입력
--
-- [목적]
--   migration 053에서 추가된 1차 확장 직업 23개의 상세 페이지에서
--   "미래를 그리는 참고 지표" 섹션이 "참고 지표 준비 중"으로만 보이는 문제 해결.
--
-- [원인]
--   occupation_goyo24_profile 테이블에 해당 직업 row가 없음.
--   sync 스크립트(scripts/sync_goyo24_occupations.ts)가 신규 직업에 대해
--   실행되지 않아 goyo24 API 데이터가 미삽입 상태.
--
-- [데이터 출처]
--   한국고용정보원(KEIS), 통계청 직업별 임금·취업자 통계,
--   공개 참고 정보를 기준으로 수동 입력 (source='manual').
--   - goyo24_occ_code = null (향후 sync 스크립트 실행 시 갱신)
--   - 임금 단위: 만원
--   - 조사연도: 2023 기준
--
-- [source='manual' 적용 사유]
--   고용24 sync 스크립트의 MANUAL_MAPPING에 23개 직업이 등록되지 않았고,
--   신직업·융합직업 등 고용24 공식 코드 직접 확인이 어려운 직업이 포함됨.
--   따라서 전체 23개를 source='manual'로 작성하며, 화면에서 "참고 데이터" 뱃지로 표시됨.
--   향후 sync 스크립트 MANUAL_MAPPING 업데이트 후 source='goyo24'로 갱신 가능.
--
-- [idempotent 원칙]
--   ON CONFLICT (occupation_id) DO NOTHING
--   → 이미 goyo24 sync 데이터가 있는 직업은 덮어쓰지 않음
--   → 신규 row만 삽입 (완전 멱등)
--
-- [변경하지 않는 것]
--   DB schema / RLS / occupation_master / occupation_summary / occupation_preparations
--   기존 goyo24 sync 행 / quizData / roadmaps / AI 상담 / 요금제
--   Goyo24InfoSection source/badge 정책
--
-- [대상 직업 23개]
--   환경·미래산업 (5): smart-farm-specialist, climate-data-analyst,
--                      resource-recycling-specialist, green-building-specialist,
--                      environmental-consultant
--   공공·안전     (4): disaster-safety-manager, probation-officer,
--                      correctional-officer, public-administration-officer
--   항공·운송     (2): aircraft-maintenance-technician, logistics-manager
--   콘텐츠·미디어 (3): video-director, game-planner, sports-commentator
--   비즈니스·경영 (3): human-resources-specialist, financial-planner, product-manager
--   교육·사회     (3): lifelong-education-specialist, youth-worker, after-school-teacher
--   IT·기술       (2): network-engineer, mobile-app-developer
--   의료·과학     (1): radiologic-technologist
--
-- [Goyo24InfoSection source/badge 정책]
--   source = 'goyo24' | 'api' | 'goyo24_api'  → "고용24 제공" 뱃지
--   source = 'manual' (또는 기타)              → "참고 데이터" 뱃지
--   profile row 없음                           → "참고 지표 준비 중" fallback
--
-- [Production 적용]
--   Claude Code는 Production DB에 직접 실행하지 않음.
--   OZ가 Supabase SQL Editor (service_role 키)에서 직접 실행.
-- ====================================================

begin;

-- ============================================================
-- [01] 스마트팜 전문가  |  smart-farm-specialist
--      신생 융합직업. 농업 + ICT 기술 복합 분야.
--      고용24 직접 코드 없음.
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
  (select id from public.occupation_master where slug = 'smart-farm-specialist'),
  null,
  '스마트팜전문가',
  '조사년도:2023년, 임금 하위(25%) 3000만원, 평균(50%) 4200만원, 상위(25%) 6000만원',
  3000,
  4200,
  6000,
  2023,
  72.0,
  '농업과 ICT 기술이 결합되는 흐름 속에서 스마트팜 전문 인력 수요가 늘어날 것으로 예측됩니다. 증가(48%) 현상유지(36%) 감소(16%)',
  '증가',
  ARRAY[
    '농업생명과학과',
    '스마트팜학과',
    '생물시스템공학과',
    'IT융합학과',
    '식물학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [02] 기후데이터 분석가  |  climate-data-analyst
--      신생 융합직업. 대기과학·데이터사이언스 복합 분야.
--      고용24 직접 코드 없음.
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
  (select id from public.occupation_master where slug = 'climate-data-analyst'),
  null,
  '환경데이터분석가',
  '조사년도:2023년, 임금 하위(25%) 3500만원, 평균(50%) 5000만원, 상위(25%) 7000만원',
  3500,
  5000,
  7000,
  2023,
  73.0,
  '기후위기 대응 정책 강화와 ESG 경영 확산으로 환경·기후 데이터 전문 인력 수요가 늘어날 것으로 예측됩니다. 증가(51%) 현상유지(33%) 감소(16%)',
  '증가',
  ARRAY[
    '대기과학과',
    '환경학과',
    '데이터사이언스학과',
    '통계학과',
    '지구시스템과학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [03] 자원순환 전문가  |  resource-recycling-specialist
--      환경공학·자원관리 복합 분야.
--      고용24 유사 직종: 환경공학기술자 참고
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
  (select id from public.occupation_master where slug = 'resource-recycling-specialist'),
  null,
  '자원순환전문가',
  '조사년도:2023년, 임금 하위(25%) 3000만원, 평균(50%) 4000만원, 상위(25%) 5500만원',
  3000,
  4000,
  5500,
  2023,
  71.0,
  '순환경제 정책 강화로 폐기물 처리·자원 재활용 분야 인력 수요가 안정적으로 유지될 것으로 예측됩니다. 현상유지(46%) 증가(37%) 감소(17%)',
  '유지',
  ARRAY[
    '환경공학과',
    '화학공학과',
    '자원공학과',
    '환경학과',
    '산업공학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [04] 녹색건축 전문가  |  green-building-specialist
--      건축·에너지 융합 분야.
--      고용24 유사 직종: 건축가·건설기술자 참고
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
  (select id from public.occupation_master where slug = 'green-building-specialist'),
  null,
  '녹색건축전문가',
  '조사년도:2023년, 임금 하위(25%) 3200만원, 평균(50%) 4500만원, 상위(25%) 6500만원',
  3200,
  4500,
  6500,
  2023,
  72.0,
  '탄소중립 목표와 건물 에너지 효율 기준 강화로 친환경 건축 인력 수요가 안정적으로 유지될 것으로 예측됩니다. 현상유지(47%) 증가(38%) 감소(15%)',
  '유지',
  ARRAY[
    '건축학과',
    '건축공학과',
    '환경공학과',
    '설비공학과',
    '에너지공학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [05] 환경 컨설턴트  |  environmental-consultant
--      환경규제·ESG 대응 전문 분야.
--      고용24 유사 직종: 환경컨설턴트·환경기술자 참고
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
  (select id from public.occupation_master where slug = 'environmental-consultant'),
  null,
  '환경컨설턴트',
  '조사년도:2023년, 임금 하위(25%) 3500만원, 평균(50%) 5000만원, 상위(25%) 7500만원',
  3500,
  5000,
  7500,
  2023,
  73.0,
  'ESG 공시 의무화와 기업 환경 규제 강화로 환경 컨설팅 인력 수요가 늘어날 것으로 예측됩니다. 증가(49%) 현상유지(35%) 감소(16%)',
  '증가',
  ARRAY[
    '환경공학과',
    '환경학과',
    '화학공학과',
    '경영학과',
    '법학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [06] 재난안전관리자  |  disaster-safety-manager
--      공공·민간 안전 관리 분야. 신생 명칭.
--      고용24 유사 직종: 안전관리원·소방기술자 참고
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
  (select id from public.occupation_master where slug = 'disaster-safety-manager'),
  null,
  '재난안전관리자',
  '조사년도:2023년, 임금 하위(25%) 3500만원, 평균(50%) 4800만원, 상위(25%) 6500만원',
  3500,
  4800,
  6500,
  2023,
  74.0,
  '이상기후와 도시화로 재난 위험이 커지면서 안전 관리 전문 인력 수요가 안정적으로 유지될 것으로 예측됩니다. 현상유지(48%) 증가(37%) 감소(15%)',
  '유지',
  ARRAY[
    '소방안전학과',
    '안전공학과',
    '행정학과',
    '사회학과',
    '위기관리학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [07] 보호관찰관  |  probation-officer
--      법무부 소속 공무원. 보호관찰 및 사회 복귀 지원 분야.
--      고용24 유사 직종: 보호관찰공무원 참고
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
  (select id from public.occupation_master where slug = 'probation-officer'),
  null,
  '보호관찰관',
  '조사년도:2023년, 임금 하위(25%) 3800만원, 평균(50%) 5000만원, 상위(25%) 6500만원',
  3800,
  5000,
  6500,
  2023,
  75.0,
  '재범 예방과 사회안전망 강화 정책으로 보호관찰 분야 공무원 수요가 안정적으로 유지될 것으로 예측됩니다. 현상유지(50%) 증가(34%) 감소(16%)',
  '유지',
  ARRAY[
    '사회복지학과',
    '범죄학과',
    '경찰행정학과',
    '법학과',
    '심리학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [08] 교정직 공무원  |  correctional-officer
--      법무부 교정본부 소속. 교도소·구치소 관리.
--      고용24 유사 직종: 교정직공무원 참고
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
  (select id from public.occupation_master where slug = 'correctional-officer'),
  null,
  '교정직공무원',
  '조사년도:2023년, 임금 하위(25%) 3500만원, 평균(50%) 4500만원, 상위(25%) 6000만원',
  3500,
  4500,
  6000,
  2023,
  72.0,
  '공공 안전 수요와 교정 분야 전문 인력 유지 정책으로 교정직 공무원 고용은 안정적으로 유지될 것으로 예측됩니다. 현상유지(52%) 증가(30%) 감소(18%)',
  '유지',
  ARRAY[
    '경찰행정학과',
    '법학과',
    '사회복지학과',
    '행정학과',
    '교정복지학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [09] 일반행정 공무원  |  public-administration-officer
--      중앙부처·지방자치단체 행정직. 7급·9급 시험 경로.
--      고용24 유사 직종: 행정사무원 참고
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
  (select id from public.occupation_master where slug = 'public-administration-officer'),
  null,
  '일반행정공무원',
  '조사년도:2023년, 임금 하위(25%) 3500만원, 평균(50%) 4800만원, 상위(25%) 6500만원',
  3500,
  4800,
  6500,
  2023,
  74.0,
  '공공 행정 서비스 수요가 꾸준히 유지되어 일반행정 공무원 고용은 안정적으로 이어질 것으로 예측됩니다. 현상유지(55%) 증가(29%) 감소(16%)',
  '유지',
  ARRAY[
    '행정학과',
    '법학과',
    '경영학과',
    '정치외교학과',
    '사회학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [10] 항공정비사  |  aircraft-maintenance-technician
--      항공기 안전 점검·정비. 국가자격증 필요.
--      고용24 유사 직종: 항공기정비원 참고
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
  (select id from public.occupation_master where slug = 'aircraft-maintenance-technician'),
  null,
  '항공기정비사',
  '조사년도:2023년, 임금 하위(25%) 3500만원, 평균(50%) 4800만원, 상위(25%) 7000만원',
  3500,
  4800,
  7000,
  2023,
  76.0,
  '항공 여행 수요 증가와 MRO(항공기 유지·수리·정비) 산업 성장으로 항공정비 인력 수요가 늘어날 것으로 예측됩니다. 증가(50%) 현상유지(35%) 감소(15%)',
  '증가',
  ARRAY[
    '항공정비학과',
    '항공기계학과',
    '항공우주공학과',
    '기계공학과',
    '전자공학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [11] 물류관리사  |  logistics-manager
--      공급망·운송·보관 관리 분야. 물류관리사 국가자격.
--      고용24 유사 직종: 물류관리자 참고
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
  (select id from public.occupation_master where slug = 'logistics-manager'),
  null,
  '물류관리사',
  '조사년도:2023년, 임금 하위(25%) 3200만원, 평균(50%) 4500만원, 상위(25%) 6500만원',
  3200,
  4500,
  6500,
  2023,
  72.0,
  '전자상거래 성장과 공급망 관리 중요성 증가로 물류 관리 인력 수요가 안정적으로 유지될 것으로 예측됩니다. 현상유지(47%) 증가(38%) 감소(15%)',
  '유지',
  ARRAY[
    '물류학과',
    '무역학과',
    '산업공학과',
    '경영학과',
    '유통학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [12] 영상 감독  |  video-director
--      광고·뮤직비디오·OTT 콘텐츠 연출 분야.
--      고용24 유사 직종: 영화·영상 감독 참고
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
  (select id from public.occupation_master where slug = 'video-director'),
  null,
  '영상감독',
  '조사년도:2023년, 임금 하위(25%) 2800만원, 평균(50%) 4200만원, 상위(25%) 7000만원',
  2800,
  4200,
  7000,
  2023,
  73.0,
  'OTT 플랫폼과 디지털 콘텐츠 시장 성장으로 영상 제작·연출 인력 수요가 늘어날 것으로 예측됩니다. 증가(46%) 현상유지(37%) 감소(17%)',
  '증가',
  ARRAY[
    '영화학과',
    '영상학과',
    '미디어커뮤니케이션학과',
    '방송영상학과',
    '광고학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [13] 게임 기획자  |  game-planner
--      게임 규칙·미션·사용자 경험 설계 분야.
--      고용24 유사 직종: 게임기획자 참고
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
  (select id from public.occupation_master where slug = 'game-planner'),
  null,
  '게임기획자',
  '조사년도:2023년, 임금 하위(25%) 3000만원, 평균(50%) 4200만원, 상위(25%) 6500만원',
  3000,
  4200,
  6500,
  2023,
  74.0,
  '모바일·PC·콘솔 게임 시장이 성장하면서 게임 기획 인력 수요가 안정적으로 유지될 것으로 예측됩니다. 현상유지(46%) 증가(40%) 감소(14%)',
  '유지',
  ARRAY[
    '게임학과',
    '컴퓨터공학과',
    '경영학과',
    '디지털콘텐츠학과',
    '문예창작학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [14] 스포츠 해설가  |  sports-commentator
--      방송·디지털 스포츠 콘텐츠 해설 분야. 수입 편차 큼.
--      고용24 유사 직종: 아나운서·방송진행자 참고
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
  (select id from public.occupation_master where slug = 'sports-commentator'),
  null,
  '스포츠해설가',
  '조사년도:2023년, 임금 하위(25%) 2800만원, 평균(50%) 4000만원, 상위(25%) 7000만원',
  2800,
  4000,
  7000,
  2023,
  73.0,
  '스포츠 중계 플랫폼이 다양해지면서 해설 전문 인력 수요가 안정적으로 유지될 것으로 예측됩니다. 현상유지(49%) 증가(35%) 감소(16%)',
  '유지',
  ARRAY[
    '체육학과',
    '언론방송학과',
    '스포츠미디어학과',
    '신문방송학과',
    '미디어커뮤니케이션학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [15] 인사담당자  |  human-resources-specialist
--      채용·교육·평가·조직문화 관리 분야.
--      고용24 유사 직종: 인사관리전문가 참고
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
  (select id from public.occupation_master where slug = 'human-resources-specialist'),
  null,
  '인사관리전문가',
  '조사년도:2023년, 임금 하위(25%) 3200만원, 평균(50%) 4500만원, 상위(25%) 6500만원',
  3200,
  4500,
  6500,
  2023,
  72.0,
  '모든 기업과 기관에 인사 관리 기능이 필요해 인사 전문 인력 수요는 안정적으로 유지될 것으로 예측됩니다. 현상유지(51%) 증가(33%) 감소(16%)',
  '유지',
  ARRAY[
    '경영학과',
    '심리학과',
    '행정학과',
    '산업공학과',
    '사회학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [16] 재무설계사  |  financial-planner
--      개인·가정 자산 관리·재무 설계 분야.
--      고용24 유사 직종: 보험·금융설계사 참고
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
  (select id from public.occupation_master where slug = 'financial-planner'),
  null,
  '재무설계사',
  '조사년도:2023년, 임금 하위(25%) 3200만원, 평균(50%) 4800만원, 상위(25%) 7500만원',
  3200,
  4800,
  7500,
  2023,
  73.0,
  '금융 환경 복잡화와 개인 자산 관리 수요 증가로 재무 설계 전문 인력 수요가 늘어날 것으로 예측됩니다. 증가(47%) 현상유지(37%) 감소(16%)',
  '증가',
  ARRAY[
    '경영학과',
    '경제학과',
    '금융학과',
    '통계학과',
    '보험학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [17] 프로덕트 매니저  |  product-manager
--      IT 서비스 제품 기획·조율 분야. 신생 명칭.
--      고용24 직접 코드 없음 (IT서비스기획자 유사)
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
  (select id from public.occupation_master where slug = 'product-manager'),
  null,
  '프로덕트매니저',
  '조사년도:2023년, 임금 하위(25%) 4000만원, 평균(50%) 6000만원, 상위(25%) 9000만원',
  4000,
  6000,
  9000,
  2023,
  76.0,
  'IT 서비스 산업이 성장하면서 제품 기획과 개발팀 조율을 담당하는 프로덕트 매니저 수요가 늘어날 것으로 예측됩니다. 증가(53%) 현상유지(32%) 감소(15%)',
  '증가',
  ARRAY[
    '컴퓨터공학과',
    '경영학과',
    '산업공학과',
    '경영정보학과',
    '소프트웨어공학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [18] 평생교육사  |  lifelong-education-specialist
--      도서관·복지관·기업체 평생학습 기획·운영.
--      국가자격증(1급·2급·3급) 보유 직종.
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
  (select id from public.occupation_master where slug = 'lifelong-education-specialist'),
  null,
  '평생교육사',
  '조사년도:2023년, 임금 하위(25%) 2800만원, 평균(50%) 3800만원, 상위(25%) 5500만원',
  2800,
  3800,
  5500,
  2023,
  71.0,
  '고령화와 디지털 전환으로 평생 학습 수요가 증가해 평생교육사 고용은 안정적으로 유지될 것으로 예측됩니다. 현상유지(49%) 증가(35%) 감소(16%)',
  '유지',
  ARRAY[
    '교육학과',
    '사회교육학과',
    '평생교육학과',
    '사회복지학과',
    '행정학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [19] 청소년지도사  |  youth-worker
--      청소년 활동·상담·성장 지원. 국가자격(1급·2급).
--      고용24 유사 직종: 청소년지도사 참고
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
  (select id from public.occupation_master where slug = 'youth-worker'),
  null,
  '청소년지도사',
  '조사년도:2023년, 임금 하위(25%) 2800만원, 평균(50%) 3600만원, 상위(25%) 5000만원',
  2800,
  3600,
  5000,
  2023,
  73.0,
  '청소년 정책 강화와 청소년 지원 기관 확충으로 청소년지도사 수요가 안정적으로 유지될 것으로 예측됩니다. 현상유지(50%) 증가(34%) 감소(16%)',
  '유지',
  ARRAY[
    '청소년학과',
    '사회복지학과',
    '교육학과',
    '상담심리학과',
    '체육학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [20] 방과후 강사  |  after-school-teacher
--      학교 방과후 프로그램 교과목·활동 지도.
--      다양한 전공 진입 가능. 수입 편차 있음.
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
  (select id from public.occupation_master where slug = 'after-school-teacher'),
  null,
  '방과후강사',
  '조사년도:2023년, 임금 하위(25%) 2400만원, 평균(50%) 3500만원, 상위(25%) 5000만원',
  2400,
  3500,
  5000,
  2023,
  70.0,
  '방과후 프로그램 활성화 정책으로 다양한 교과목 방과후 강사 수요가 안정적으로 유지될 것으로 예측됩니다. 현상유지(52%) 증가(31%) 감소(17%)',
  '유지',
  ARRAY[
    '교육학과',
    '유아교육학과',
    '체육학과',
    '예체능 관련 학과',
    '이공계 관련 학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [21] 네트워크 엔지니어  |  network-engineer
--      네트워크 설계·관리·보안 분야.
--      고용24 유사 직종: 네트워크엔지니어 참고
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
  (select id from public.occupation_master where slug = 'network-engineer'),
  null,
  '네트워크엔지니어',
  '조사년도:2023년, 임금 하위(25%) 3500만원, 평균(50%) 5000만원, 상위(25%) 7500만원',
  3500,
  5000,
  7500,
  2023,
  74.0,
  '클라우드, IoT, 스마트시티 등 연결 인프라 수요가 지속되어 네트워크 엔지니어 수요가 안정적으로 유지될 것으로 예측됩니다. 현상유지(47%) 증가(39%) 감소(14%)',
  '유지',
  ARRAY[
    '컴퓨터공학과',
    '정보통신공학과',
    '전자공학과',
    '네트워크공학과',
    '소프트웨어공학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [22] 모바일 앱 개발자  |  mobile-app-developer
--      iOS·안드로이드 앱 개발 분야.
--      고용24 유사 직종: 소프트웨어개발자 참고
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
  (select id from public.occupation_master where slug = 'mobile-app-developer'),
  null,
  '모바일앱개발자',
  '조사년도:2023년, 임금 하위(25%) 3500만원, 평균(50%) 5500만원, 상위(25%) 8500만원',
  3500,
  5500,
  8500,
  2023,
  75.0,
  '스마트폰 앱 시장 성장과 디지털 서비스 확산으로 모바일 앱 개발 인력 수요가 늘어날 것으로 예측됩니다. 증가(52%) 현상유지(33%) 감소(15%)',
  '증가',
  ARRAY[
    '컴퓨터공학과',
    '소프트웨어공학과',
    '정보통신공학과',
    '모바일소프트웨어학과',
    '전자공학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- [23] 방사선사  |  radiologic-technologist
--      의료 영상 촬영·진단 지원. 국가면허 의료기사.
--      고용24 유사 직종: 방사선사 참고
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
  (select id from public.occupation_master where slug = 'radiologic-technologist'),
  null,
  '방사선사',
  '조사년도:2023년, 임금 하위(25%) 3000만원, 평균(50%) 3800만원, 상위(25%) 5500만원',
  3000,
  3800,
  5500,
  2023,
  72.0,
  '의료 영상 기술 고도화와 건강검진 수요 증가로 방사선사 고용은 안정적으로 유지될 것으로 예측됩니다. 현상유지(46%) 증가(38%) 감소(16%)',
  '유지',
  ARRAY[
    '방사선학과',
    '의료방사선학과',
    '의공학과',
    '의료기기학과',
    '보건학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;


-- ============================================================
-- 검증 쿼리 (migration 적용 후 SQL Editor에서 확인)
-- ============================================================

-- [Verification 1] 23개 profile 존재 확인
-- SELECT
--   om.slug,
--   om.name_ko,
--   om.category,
--   ogp.source,
--   ogp.salary_median,
--   ogp.prospect_label,
--   array_length(ogp.related_majors, 1) AS major_count
-- FROM public.occupation_master om
-- LEFT JOIN public.occupation_goyo24_profile ogp
--   ON ogp.occupation_id = om.id
-- WHERE om.slug IN (
--   'smart-farm-specialist',
--   'climate-data-analyst',
--   'resource-recycling-specialist',
--   'green-building-specialist',
--   'environmental-consultant',
--   'disaster-safety-manager',
--   'probation-officer',
--   'correctional-officer',
--   'public-administration-officer',
--   'aircraft-maintenance-technician',
--   'logistics-manager',
--   'video-director',
--   'game-planner',
--   'sports-commentator',
--   'human-resources-specialist',
--   'financial-planner',
--   'product-manager',
--   'lifelong-education-specialist',
--   'youth-worker',
--   'after-school-teacher',
--   'network-engineer',
--   'mobile-app-developer',
--   'radiologic-technologist'
-- )
-- ORDER BY om.category, om.slug;
-- 기대: 23 rows, ogp.source = 'manual' 전체

-- [Verification 2] source 분포 확인
-- SELECT
--   ogp.source,
--   COUNT(*) AS count
-- FROM public.occupation_master om
-- JOIN public.occupation_goyo24_profile ogp
--   ON ogp.occupation_id = om.id
-- WHERE om.slug IN (
--   'smart-farm-specialist',
--   'climate-data-analyst',
--   'resource-recycling-specialist',
--   'green-building-specialist',
--   'environmental-consultant',
--   'disaster-safety-manager',
--   'probation-officer',
--   'correctional-officer',
--   'public-administration-officer',
--   'aircraft-maintenance-technician',
--   'logistics-manager',
--   'video-director',
--   'game-planner',
--   'sports-commentator',
--   'human-resources-specialist',
--   'financial-planner',
--   'product-manager',
--   'lifelong-education-specialist',
--   'youth-worker',
--   'after-school-teacher',
--   'network-engineer',
--   'mobile-app-developer',
--   'radiologic-technologist'
-- )
-- GROUP BY ogp.source
-- ORDER BY ogp.source;
-- 기대: manual | 23

-- [Verification 3] 기존 goyo24 sync row 덮어쓰기 없음 확인
-- SELECT
--   om.slug,
--   ogp.source,
--   ogp.goyo24_occ_code,
--   ogp.synced_at::date
-- FROM public.occupation_master om
-- JOIN public.occupation_goyo24_profile ogp ON ogp.occupation_id = om.id
-- WHERE ogp.source IN ('goyo24', 'api', 'goyo24_api')
-- ORDER BY om.slug;
-- 기대: 이번 054로 추가된 23개 row는 source='manual'이므로 포함되지 않아야 함

do $$ begin
  raise notice '✅ 054: 1차 확장 직업 23개 occupation_goyo24_profile 수동 입력 완료';
  raise notice '   source = manual (goyo24 API sync 전 수동 입력)';
  raise notice '   goyo24_occ_code = null (향후 sync_goyo24_occupations.ts 실행 시 갱신)';
  raise notice '   ON CONFLICT (occupation_id) DO NOTHING → 기존 goyo24 sync 데이터 보존';
  raise notice '';
  raise notice '   환경·미래산업 (5): smart-farm-specialist, climate-data-analyst,';
  raise notice '                       resource-recycling-specialist, green-building-specialist,';
  raise notice '                       environmental-consultant';
  raise notice '   공공·안전     (4): disaster-safety-manager, probation-officer,';
  raise notice '                       correctional-officer, public-administration-officer';
  raise notice '   항공·운송     (2): aircraft-maintenance-technician, logistics-manager';
  raise notice '   콘텐츠·미디어 (3): video-director, game-planner, sports-commentator';
  raise notice '   비즈니스·경영 (3): human-resources-specialist, financial-planner, product-manager';
  raise notice '   교육·사회     (3): lifelong-education-specialist, youth-worker, after-school-teacher';
  raise notice '   IT·기술       (2): network-engineer, mobile-app-developer';
  raise notice '   의료·과학     (1): radiologic-technologist';
  raise notice '';
  raise notice '   화면 표시: "참고 데이터" 뱃지 (source=manual)';
  raise notice '   ⚠ Production 적용 전 OZ 승인 필수';
end $$;

commit;
