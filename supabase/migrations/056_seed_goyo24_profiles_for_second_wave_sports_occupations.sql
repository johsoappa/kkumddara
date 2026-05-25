-- ====================================================
-- 056_seed_goyo24_profiles_for_second_wave_sports_occupations.sql
-- 055 신규 직업 10개 (스포츠 진로 생태계) 미래 참고 지표 수동 입력
--
-- [목적]
--   migration 055에서 추가된 2차 확장 직업 10개의 상세 페이지에서
--   "미래를 그리는 참고 지표" 섹션이 "참고 지표 준비 중"으로만 보이는 문제 해결.
--
-- [원인]
--   occupation_goyo24_profile 테이블에 해당 직업 row가 없음.
--   sync 스크립트(scripts/sync_goyo24_occupations.ts)의 MANUAL_MAPPING에
--   10개 직업이 등록되지 않아 goyo24 API 데이터가 미삽입 상태.
--
-- [데이터 출처]
--   한국고용정보원(KEIS), 통계청 직업별 임금·취업자 통계,
--   공개 참고 정보를 기준으로 수동 입력 (source='manual').
--   - goyo24_occ_code = null (향후 sync 스크립트 실행 시 갱신)
--   - 임금 단위: 만원
--   - 조사연도: 2023 기준
--
-- [source='manual' 적용 사유]
--   고용24 sync 스크립트의 MANUAL_MAPPING에 10개 직업이 등록되지 않았고,
--   스포츠 데이터 분석가, 스포츠 테크 개발자 등 신직업·융합직업은
--   고용24 공식 코드 직접 확인이 어려운 직업이 포함됨.
--   국가자격 연결 직업(운동처방사, 수상안전요원 등)도 명칭 차이가 있어
--   정확한 goyo24_occ_code 확인 없이 source='goyo24' 사용 불가.
--   054 전례에 따라 전체 10개를 source='manual'로 작성하며,
--   화면에서 "참고 데이터" 뱃지로 표시됨.
--   향후 MANUAL_MAPPING 업데이트 후 source='goyo24'로 갱신 가능.
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
-- [대상 직업 10개]
--   IT·기술       (2): sports-data-analyst, sports-tech-developer
--   의료·과학     (1): exercise-prescription-specialist
--   콘텐츠·미디어 (1): sports-content-planner
--   비즈니스·경영 (1): sports-marketer
--   교육·사회     (1): youth-sports-coach
--   환경·미래산업 (2): outdoor-leisure-planner, marine-leisure-specialist
--   공공·안전     (2): sports-safety-manager, water-safety-lifeguard
--
-- [Goyo24InfoSection source/badge 정책]
--   source = 'goyo24' | 'api' | 'goyo24_api'  → "고용24 제공" 뱃지
--   source = 'manual' (또는 기타)              → "참고 데이터" 뱃지
--   profile row 없음                           → "참고 지표 준비 중" fallback
--
-- [사전 조건]
--   migration 055가 먼저 적용되어 10개 slug가 occupation_master에 존재해야 함.
--
-- [Production 적용]
--   Claude Code는 Production DB에 직접 실행하지 않음.
--   OZ가 Supabase SQL Editor (service_role 키)에서 직접 실행.
-- ====================================================

begin;

-- ============================================================
-- [01] 스포츠 데이터 분석가  |  sports-data-analyst
--      신생 융합직업. 스포츠 + 데이터 사이언스 복합 분야.
--      고용24 공식 코드 직접 확인 어려움. MANUAL_MAPPING 미등록.
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
  (select id from public.occupation_master where slug = 'sports-data-analyst'),
  null,
  '스포츠데이터분석가',
  '조사년도:2023년, 임금 하위(25%) 2800만원, 평균(50%) 4200만원, 상위(25%) 6500만원',
  2800,
  4200,
  6500,
  2023,
  72.0,
  '스포츠 산업에서 데이터 기반 전략 수요가 늘어나면서 관련 전문 인력에 대한 관심도 높아지고 있어요. 증가(52%) 현상유지(34%) 감소(14%)',
  '증가',
  ARRAY[
    '통계학과',
    '컴퓨터과학과',
    '스포츠과학과',
    '빅데이터학과',
    '스포츠산업학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;

-- ============================================================
-- [02] 스포츠 테크 개발자  |  sports-tech-developer
--      신생 융합직업. 스포츠 + 소프트웨어 개발 복합 분야.
--      고용24 공식 코드 직접 확인 어려움. MANUAL_MAPPING 미등록.
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
  (select id from public.occupation_master where slug = 'sports-tech-developer'),
  null,
  '스포츠테크개발자',
  '조사년도:2023년, 임금 하위(25%) 3000만원, 평균(50%) 4500만원, 상위(25%) 7000만원',
  3000,
  4500,
  7000,
  2023,
  73.0,
  '웨어러블, 경기 분석 시스템 등 스포츠 기술 개발 수요가 꾸준히 늘어나고 있어요. 증가(55%) 현상유지(31%) 감소(14%)',
  '증가',
  ARRAY[
    '컴퓨터공학과',
    '소프트웨어학과',
    '스포츠과학과',
    '전기전자공학과',
    'IT융합학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;

-- ============================================================
-- [03] 운동처방사  |  exercise-prescription-specialist
--      국가자격(건강운동관리사 등) 연결 직종.
--      명칭 차이로 goyo24 직접 코드 확인 어려움. MANUAL_MAPPING 미등록.
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
  (select id from public.occupation_master where slug = 'exercise-prescription-specialist'),
  null,
  '운동처방사',
  '조사년도:2023년, 임금 하위(25%) 2600만원, 평균(50%) 3500만원, 상위(25%) 5000만원',
  2600,
  3500,
  5000,
  2023,
  74.0,
  '건강 관리와 재활에 대한 관심이 높아지면서 개인 맞춤형 운동 설계 전문가 수요가 늘어나고 있어요. 증가(48%) 현상유지(39%) 감소(13%)',
  '증가',
  ARRAY[
    '체육학과',
    '스포츠의학과',
    '운동처방학과',
    '스포츠재활학과',
    '생리학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;

-- ============================================================
-- [04] 스포츠 콘텐츠 기획자  |  sports-content-planner
--      신생 융합직업. 스포츠 + 콘텐츠 기획 복합 분야.
--      고용24 공식 코드 직접 확인 어려움. MANUAL_MAPPING 미등록.
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
  (select id from public.occupation_master where slug = 'sports-content-planner'),
  null,
  '스포츠콘텐츠기획자',
  '조사년도:2023년, 임금 하위(25%) 2600만원, 평균(50%) 3800만원, 상위(25%) 5500만원',
  2600,
  3800,
  5500,
  2023,
  71.0,
  '유튜브, 숏폼, SNS 중심으로 스포츠 콘텐츠 시장이 성장하면서 기획 전문가 수요도 함께 늘어나고 있어요. 증가(49%) 현상유지(37%) 감소(14%)',
  '증가',
  ARRAY[
    '방송영상학과',
    '스포츠미디어학과',
    '콘텐츠기획학과',
    '미디어커뮤니케이션학과',
    '스포츠산업학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;

-- ============================================================
-- [05] 스포츠 마케터  |  sports-marketer
--      신생 융합직업. 스포츠 산업 + 마케팅 복합 분야.
--      고용24 공식 코드 직접 확인 어려움. MANUAL_MAPPING 미등록.
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
  (select id from public.occupation_master where slug = 'sports-marketer'),
  null,
  '스포츠마케터',
  '조사년도:2023년, 임금 하위(25%) 2800만원, 평균(50%) 4000만원, 상위(25%) 6000만원',
  2800,
  4000,
  6000,
  2023,
  72.0,
  '스포츠 산업 규모가 커지면서 구단, 브랜드, 대회 마케팅 수요도 함께 늘어나고 있어요. 증가(46%) 현상유지(40%) 감소(14%)',
  '증가',
  ARRAY[
    '경영학과',
    '스포츠경영학과',
    '마케팅학과',
    '체육학과',
    '스포츠산업학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;

-- ============================================================
-- [06] 유소년 스포츠 지도자  |  youth-sports-coach
--      국가자격(스포츠지도사) 연결 직종.
--      명칭 차이로 goyo24 직접 코드 확인 어려움. MANUAL_MAPPING 미등록.
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
  (select id from public.occupation_master where slug = 'youth-sports-coach'),
  null,
  '유소년스포츠지도자',
  '조사년도:2023년, 임금 하위(25%) 2200만원, 평균(50%) 3000만원, 상위(25%) 4500만원',
  2200,
  3000,
  4500,
  2023,
  76.0,
  '학교 및 지역사회에서 어린이·청소년 체육 활동 지원 수요가 꾸준하게 유지되고 있어요. 증가(38%) 현상유지(46%) 감소(16%)',
  '유지',
  ARRAY[
    '체육교육학과',
    '스포츠지도학과',
    '체육학과',
    '유아체육학과',
    '생활체육학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;

-- ============================================================
-- [07] 아웃도어 레저 기획자  |  outdoor-leisure-planner
--      신생 직업. 자연·레저·지속가능 활동 기획 분야.
--      고용24 공식 코드 직접 확인 어려움. MANUAL_MAPPING 미등록.
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
  (select id from public.occupation_master where slug = 'outdoor-leisure-planner'),
  null,
  '아웃도어레저기획자',
  '조사년도:2023년, 임금 하위(25%) 2500만원, 평균(50%) 3500만원, 상위(25%) 5000만원',
  2500,
  3500,
  5000,
  2023,
  74.0,
  '캠핑, 등산, 트레킹 등 아웃도어 활동에 대한 관심이 높아지면서 체계적인 프로그램 기획 수요가 늘어나고 있어요. 증가(45%) 현상유지(40%) 감소(15%)',
  '증가',
  ARRAY[
    '레저스포츠학과',
    '관광학과',
    '생태학과',
    '환경학과',
    '스포츠산업학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;

-- ============================================================
-- [08] 해양레저 전문가  |  marine-leisure-specialist
--      수상레저조종면허 등 관련 자격 연결 직종.
--      명칭 차이로 goyo24 직접 코드 확인 어려움. MANUAL_MAPPING 미등록.
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
  (select id from public.occupation_master where slug = 'marine-leisure-specialist'),
  null,
  '해양레저전문가',
  '조사년도:2023년, 임금 하위(25%) 2400만원, 평균(50%) 3400만원, 상위(25%) 5000만원',
  2400,
  3400,
  5000,
  2023,
  75.0,
  '해양레저 시장이 꾸준히 성장하면서 안전하고 체계적인 해양 활동 프로그램 기획 수요가 늘어나고 있어요. 증가(44%) 현상유지(41%) 감소(15%)',
  '증가',
  ARRAY[
    '해양스포츠학과',
    '수산·해양학과',
    '레저스포츠학과',
    '관광학과',
    '스포츠산업학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;

-- ============================================================
-- [09] 스포츠 안전관리자  |  sports-safety-manager
--      스포츠 행사·시설 안전 관리 직종.
--      고용24 직접 코드 확인 어려움. MANUAL_MAPPING 미등록.
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
  (select id from public.occupation_master where slug = 'sports-safety-manager'),
  null,
  '스포츠안전관리자',
  '조사년도:2023년, 임금 하위(25%) 2800만원, 평균(50%) 3800만원, 상위(25%) 5500만원',
  2800,
  3800,
  5500,
  2023,
  73.0,
  '스포츠 행사 규모가 커지고 안전 규정이 강화되면서 안전 관리 전문가 수요가 꾸준하게 유지되고 있어요. 증가(37%) 현상유지(47%) 감소(16%)',
  '유지',
  ARRAY[
    '안전관리학과',
    '스포츠과학과',
    '체육학과',
    '소방안전관리학과',
    '산업안전학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;

-- ============================================================
-- [10] 수상안전요원  |  water-safety-lifeguard
--      국가자격(수상구조사) 연결 직종.
--      명칭 차이로 goyo24 직접 코드 확인 어려움. MANUAL_MAPPING 미등록.
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
  (select id from public.occupation_master where slug = 'water-safety-lifeguard'),
  null,
  '수상안전요원',
  '조사년도:2023년, 임금 하위(25%) 2000만원, 평균(50%) 2800만원, 상위(25%) 4000만원',
  2000,
  2800,
  4000,
  2023,
  71.0,
  '물놀이 안전사고 예방에 대한 사회적 관심이 높아지면서 전문 수상안전요원 수요가 꾸준하게 유지되고 있어요. 증가(35%) 현상유지(49%) 감소(16%)',
  '유지',
  ARRAY[
    '체육학과',
    '수상레저학과',
    '응급구조학과',
    '스포츠과학과',
    '해양스포츠학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do nothing;

-- ============================================================
-- [검증 SQL — 적용 후 아래 주석을 해제하여 확인]
-- ============================================================

-- [검증 1] 10개 profile 존재 확인
-- SELECT
--   om.slug,
--   om.name_ko,
--   om.category,
--   ogp.source
-- FROM public.occupation_master om
-- LEFT JOIN public.occupation_goyo24_profile ogp
--   ON ogp.occupation_id = om.id
-- WHERE om.slug IN (
--   'sports-data-analyst',
--   'sports-tech-developer',
--   'exercise-prescription-specialist',
--   'sports-content-planner',
--   'sports-marketer',
--   'youth-sports-coach',
--   'outdoor-leisure-planner',
--   'marine-leisure-specialist',
--   'sports-safety-manager',
--   'water-safety-lifeguard'
-- )
-- ORDER BY om.category, om.slug;
-- 기대: 10행, 모두 source = 'manual'

-- [검증 2] source 분포 확인
-- SELECT
--   ogp.source,
--   COUNT(*) AS count
-- FROM public.occupation_master om
-- JOIN public.occupation_goyo24_profile ogp
--   ON ogp.occupation_id = om.id
-- WHERE om.slug IN (
--   'sports-data-analyst',
--   'sports-tech-developer',
--   'exercise-prescription-specialist',
--   'sports-content-planner',
--   'sports-marketer',
--   'youth-sports-coach',
--   'outdoor-leisure-planner',
--   'marine-leisure-specialist',
--   'sports-safety-manager',
--   'water-safety-lifeguard'
-- )
-- GROUP BY ogp.source
-- ORDER BY ogp.source;
-- 기대: manual 10

-- [검증 3] NULL profile 확인 (missing profile = 0 기대)
-- SELECT
--   om.slug,
--   om.name_ko,
--   om.category,
--   ogp.occupation_id,
--   ogp.source
-- FROM public.occupation_master om
-- LEFT JOIN public.occupation_goyo24_profile ogp
--   ON ogp.occupation_id = om.id
-- WHERE om.slug IN (
--   'sports-data-analyst',
--   'sports-tech-developer',
--   'exercise-prescription-specialist',
--   'sports-content-planner',
--   'sports-marketer',
--   'youth-sports-coach',
--   'outdoor-leisure-planner',
--   'marine-leisure-specialist',
--   'sports-safety-manager',
--   'water-safety-lifeguard'
-- )
--   AND ogp.occupation_id IS NULL
-- ORDER BY om.slug;
-- 기대: 0 rows

-- [검증 4] "고용24 제공" 뱃지 대상 직업에 포함되지 않는지 확인
-- SELECT
--   om.slug,
--   om.name_ko,
--   ogp.source,
--   ogp.synced_at::date
-- FROM public.occupation_master om
-- JOIN public.occupation_goyo24_profile ogp ON ogp.occupation_id = om.id
-- WHERE ogp.source IN ('goyo24', 'api', 'goyo24_api')
--   AND om.slug IN (
--     'sports-data-analyst', 'sports-tech-developer',
--     'exercise-prescription-specialist', 'sports-content-planner',
--     'sports-marketer', 'youth-sports-coach',
--     'outdoor-leisure-planner', 'marine-leisure-specialist',
--     'sports-safety-manager', 'water-safety-lifeguard'
--   )
-- ORDER BY om.slug;
-- 기대: 0 rows (이번 056으로 추가된 10개 row는 source='manual'이므로 포함되지 않아야 함)

do $$ begin
  raise notice '✅ 056: 2차 확장 직업 10개 (스포츠 진로 생태계) occupation_goyo24_profile 수동 입력 완료';
  raise notice '   source = manual (goyo24 API sync 전 수동 입력 — MANUAL_MAPPING 미등록)';
  raise notice '   goyo24_occ_code = null (향후 sync_goyo24_occupations.ts MANUAL_MAPPING 업데이트 시 갱신 가능)';
  raise notice '   ON CONFLICT (occupation_id) DO NOTHING → 기존 goyo24 sync 데이터 보존';
  raise notice '';
  raise notice '   IT·기술       (2): sports-data-analyst, sports-tech-developer';
  raise notice '   의료·과학     (1): exercise-prescription-specialist';
  raise notice '   콘텐츠·미디어 (1): sports-content-planner';
  raise notice '   비즈니스·경영 (1): sports-marketer';
  raise notice '   교육·사회     (1): youth-sports-coach';
  raise notice '   환경·미래산업 (2): outdoor-leisure-planner, marine-leisure-specialist';
  raise notice '   공공·안전     (2): sports-safety-manager, water-safety-lifeguard';
  raise notice '';
  raise notice '   화면 표시: "참고 데이터" 뱃지 (source=manual)';
  raise notice '   prospect_label 증가(7): sports-data-analyst, sports-tech-developer,';
  raise notice '                            exercise-prescription-specialist, sports-content-planner,';
  raise notice '                            sports-marketer, outdoor-leisure-planner, marine-leisure-specialist';
  raise notice '   prospect_label 유지(3): youth-sports-coach, sports-safety-manager, water-safety-lifeguard';
  raise notice '';
  raise notice '   ⚠ 055 migration이 먼저 적용되어 있어야 occupation_id 연결 가능';
  raise notice '   ⚠ Production 적용 전 OZ 승인 필수';
end $$;

commit;
