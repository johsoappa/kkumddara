// ====================================================
// qa-dream-map-seed.ts — G1.6 드림맵 나침반모드 인증 QA용 테스트 계정·데이터 Seed
//
// [범위] Supabase QA 프로젝트(kkumddara-qa) 전용. 운영 프로젝트에는 어떤 모드로도
//        연결하지 않는다 — project ref allowlist/denylist 이중 검증으로 강제.
//
// [환경변수] 앱 공용 변수(NEXT_PUBLIC_SUPABASE_URL 등)는 절대 읽지 않는다.
//   QA_SUPABASE_URL                QA 프로젝트 URL (https://<ref>.supabase.co)
//   QA_SUPABASE_SERVICE_ROLE_KEY   QA 프로젝트 service role key (verify/apply/cleanup 전용)
//   QA_SUPABASE_PROJECT_REF        QA project ref (URL에서 추출한 값과 일치해야 함)
//   PROD_SUPABASE_PROJECT_REF      운영 project ref (denylist — 절대 일치하면 안 됨)
//   QA_ENV_CONFIRMED               "true"가 아니면 원격 모드(verify/apply/cleanup) 전부 거부
//   QA_APPLY_CONFIRMED             "true"가 아니면 apply/cleanup(write 모드) 거부
//   QA_SEED_PASSWORD               apply에서 생성할 계정 공통 비밀번호 (cleanup은 불필요)
//
// [실행] node scripts/qa-dream-map-seed.ts --help|--dry-run|--apply|--verify|--cleanup
//        인자 없음/--help/알 수 없는 모드/가드 실패 시 원격 요청을 절대 보내지 않는다.
//
// [금지] 실제 project ref, 운영 project ref, 비밀번호, key, 실제 이메일 원문을
//        이 파일에 하드코딩하지 않는다. 로그에도 마스킹된 값만 출력한다.
// ====================================================

const fs = require("fs");
const path = require("path");

// ────────────────────────────────────────────────────────────
// 1. 계정·자녀 정의 (고정 상수)
// ────────────────────────────────────────────────────────────

type Role = "parent" | "student" | null;

interface AccountDef {
  identifier: string;
  role: Role;
  purpose: string;
  // App onboarding 계약(user_metadata.onboarding_completed === true)과 Seed를
  // 일치시키기 위한 계정별 기대값. true인 9계정만 생성 시 onboarding_completed: true를
  // 부여하며, false인 3계정(NO_ROW ×2, NO_ROLE)은 기존 raw metadata 형태를 유지한다.
  onboardingCompleted: boolean;
}

interface ChildDef {
  ownerIdentifier: string;
  childIdentifier: string;
  gradeLevel: string | null;
}

interface StudentChildLink {
  studentIdentifier: string;
  childIdentifier: string;
}

interface PostCreateRowDeletion {
  identifier: string;
  table: "parent" | "student";
}

const ACCOUNTS: AccountDef[] = [
  { identifier: "QA_PARENT_SEED", role: "parent", purpose: "씨앗 자녀 부모", onboardingCompleted: true },
  { identifier: "QA_PARENT_SPROUT", role: "parent", purpose: "새싹 자녀 부모", onboardingCompleted: true },
  { identifier: "QA_PARENT_COMPASS", role: "parent", purpose: "나침반 자녀 부모", onboardingCompleted: true },
  { identifier: "QA_PARENT_MULTI", role: "parent", purpose: "다자녀 전환", onboardingCompleted: true },
  // /parent/home 정상 진입 후 "연결된 자녀 없음" 상태를 검증하는 계정 — onboarding은 완료 상태여야 한다.
  { identifier: "QA_PARENT_NO_CHILD", role: "parent", purpose: "자녀 없음", onboardingCompleted: true },
  { identifier: "QA_STUDENT_SEED", role: "student", purpose: "씨앗 학생", onboardingCompleted: true },
  { identifier: "QA_STUDENT_SPROUT", role: "student", purpose: "새싹 학생", onboardingCompleted: true },
  { identifier: "QA_STUDENT_COMPASS", role: "student", purpose: "나침반 학생", onboardingCompleted: true },
  // /student/home 정상 진입 후 grade 없음 fallback을 검증하는 계정 — onboarding은 완료 상태여야 한다.
  { identifier: "QA_STUDENT_NO_GRADE", role: "student", purpose: "child 미연결", onboardingCompleted: true },
  { identifier: "QA_NO_ROLE", role: null, purpose: "role metadata 없음", onboardingCompleted: false },
  { identifier: "QA_PARENT_NO_ROW", role: "parent", purpose: "parent row 사후 삭제", onboardingCompleted: false },
  { identifier: "QA_STUDENT_NO_ROW", role: "student", purpose: "student row 사후 삭제", onboardingCompleted: false },
];

// onboarding 미완료(non-true) 상태를 유지해야 하는 예외 계정 — 이 목록 밖 9계정은
// 반드시 onboardingCompleted: true 여야 한다 (App/Seed onboarding 계약, G1.6-A4).
const EXPECTED_ONBOARDING_NOT_TRUE_IDENTIFIERS = [
  "QA_PARENT_NO_ROW",
  "QA_STUDENT_NO_ROW",
  "QA_NO_ROLE",
];

const CHILDREN: ChildDef[] = [
  { ownerIdentifier: "QA_PARENT_SEED", childIdentifier: "QA_CHILD_SEED", gradeLevel: "elem_1" },
  { ownerIdentifier: "QA_PARENT_SPROUT", childIdentifier: "QA_CHILD_SPROUT", gradeLevel: "elem_3" },
  { ownerIdentifier: "QA_PARENT_COMPASS", childIdentifier: "QA_CHILD_COMPASS", gradeLevel: "elem_5" },
  { ownerIdentifier: "QA_PARENT_MULTI", childIdentifier: "QA_CHILD_MULTI_SEED", gradeLevel: "elem_1" },
  { ownerIdentifier: "QA_PARENT_MULTI", childIdentifier: "QA_CHILD_MULTI_SPROUT", gradeLevel: "elem_3" },
  { ownerIdentifier: "QA_PARENT_MULTI", childIdentifier: "QA_CHILD_MULTI_COMPASS", gradeLevel: "elem_5" },
  { ownerIdentifier: "QA_PARENT_MULTI", childIdentifier: "QA_CHILD_MULTI_NO_GRADE", gradeLevel: null },
];

// 학생 3명은 부모 소유 child를 공유 연결한다 (G1.5-C1 설계). QA_STUDENT_NO_GRADE는
// 의도적으로 연결하지 않아 student.child_id = null 상태를 유지한다.
const STUDENT_CHILD_LINKS: StudentChildLink[] = [
  { studentIdentifier: "QA_STUDENT_SEED", childIdentifier: "QA_CHILD_SEED" },
  { studentIdentifier: "QA_STUDENT_SPROUT", childIdentifier: "QA_CHILD_SPROUT" },
  { studentIdentifier: "QA_STUDENT_COMPASS", childIdentifier: "QA_CHILD_COMPASS" },
];

const POST_CREATE_ROW_DELETIONS: PostCreateRowDeletion[] = [
  { identifier: "QA_PARENT_NO_ROW", table: "parent" },
  { identifier: "QA_STUDENT_NO_ROW", table: "student" },
];

const EXPECTED_COUNTS = {
  authUsers: 12,
  parentRowsFinal: 5,
  studentRowsFinal: 4,
  childRows: 7,
  subscriptionPlanRowsFinal: 5,
};

// ────────────────────────────────────────────────────────────
// 1-B. Additive fixture 정의 (G1.6-A12-B1 — elem_4 경계 확인용)
//
// [목적] 정확한 초4(elem_4)/초5 grade boundary 실계정 검증을 위한
//        QA 전용 합성 fixture 1세트.
// [원칙] 기존 ACCOUNTS/CHILDREN/STUDENT_CHILD_LINKS/EXPECTED_COUNTS는
//        건드리지 않는다 — 기존 --apply/--verify(12개 fixture)의
//        semantics를 그대로 보존하기 위해 완전히 분리된 상수로 정의.
// [부모] 신규 parent auth user를 만들지 않고 기존 QA_PARENT_MULTI
//        ("다자녀 전환" 목적, 이미 3개 child 보유)를 소유자로 재사용한다.
//        → 이번 GOAL의 "신규 auth user 1개(student)만" 제약을 만족.
// ────────────────────────────────────────────────────────────

const ADDITIVE_ACCOUNT: AccountDef = {
  identifier: "QA_STUDENT_ELEM4",
  role: "student",
  purpose: "초4 경계 확인 학생 (G1.6-A12-B1)",
  onboardingCompleted: true,
};

const ADDITIVE_CHILD: ChildDef = {
  ownerIdentifier: "QA_PARENT_MULTI",
  childIdentifier: "QA_CHILD_ELEM4",
  gradeLevel: "elem_4",
};

const ADDITIVE_LINK: StudentChildLink = {
  studentIdentifier: "QA_STUDENT_ELEM4",
  childIdentifier: "QA_CHILD_ELEM4",
};

// 정의 배열 자체의 무결성을 기동 시점에 즉시 검증한다 (코드 버그 방지용, 환경과 무관).
if (ACCOUNTS.length !== EXPECTED_COUNTS.authUsers) {
  throw new Error(
    `[정의 오류] ACCOUNTS 길이(${ACCOUNTS.length})가 기대값(${EXPECTED_COUNTS.authUsers})과 다릅니다.`
  );
}
if (CHILDREN.length !== EXPECTED_COUNTS.childRows) {
  throw new Error(
    `[정의 오류] CHILDREN 길이(${CHILDREN.length})가 기대값(${EXPECTED_COUNTS.childRows})과 다릅니다.`
  );
}

// onboarding 완료/예외 계정 매트릭스 무결성 검증 (G1.6-A4 App/Seed onboarding 계약).
const onboardingTrueCount = ACCOUNTS.filter((a) => a.onboardingCompleted).length;
const expectedOnboardingTrueCount = EXPECTED_COUNTS.authUsers - EXPECTED_ONBOARDING_NOT_TRUE_IDENTIFIERS.length;
if (onboardingTrueCount !== expectedOnboardingTrueCount) {
  throw new Error(
    `[정의 오류] onboardingCompleted=true 계정 수(${onboardingTrueCount})가 기대값(${expectedOnboardingTrueCount})과 다릅니다.`
  );
}
const actualNotTrueIdentifiers = ACCOUNTS.filter((a) => !a.onboardingCompleted)
  .map((a) => a.identifier)
  .sort();
const expectedNotTrueIdentifiers = [...EXPECTED_ONBOARDING_NOT_TRUE_IDENTIFIERS].sort();
if (JSON.stringify(actualNotTrueIdentifiers) !== JSON.stringify(expectedNotTrueIdentifiers)) {
  throw new Error(
    `[정의 오류] onboarding 미완료 예외 계정 목록이 예상과 다릅니다: [${actualNotTrueIdentifiers.join(", ")}] (기대: [${expectedNotTrueIdentifiers.join(", ")}])`
  );
}

// ────────────────────────────────────────────────────────────
// 2. 이메일 규칙
// ────────────────────────────────────────────────────────────

const QA_EMAIL_DOMAIN = "example.com";
const QA_EMAIL_REGEX = /^qa-dreammap-[a-z0-9-]+@example\.com$/;

function toEmailSlug(identifier: string): string {
  return identifier.replace(/^QA_/, "").toLowerCase().replace(/_/g, "-");
}

function buildEmail(identifier: string): string {
  const email = `qa-dreammap-${toEmailSlug(identifier)}@${QA_EMAIL_DOMAIN}`;
  if (!QA_EMAIL_REGEX.test(email)) {
    throw new Error(`[정의 오류] ${identifier}에서 생성한 이메일이 QA 패턴과 불일치: 형식 오류`);
  }
  return email;
}

// 기동 시점에 12개 계정 전부 이메일 패턴 검증 (하나라도 어긋나면 즉시 종료).
for (const account of ACCOUNTS) {
  buildEmail(account.identifier);
}

// ────────────────────────────────────────────────────────────
// 3. 마스킹 헬퍼 (민감정보는 절대 원문 출력하지 않는다)
// ────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, 3);
  return `${visible}***@${domain}`;
}

function maskRef(ref: string | undefined): string {
  if (!ref) return "(none)";
  if (ref.length <= 4) return "***";
  return `${ref.slice(0, 4)}***(len:${ref.length})`;
}

function maskUuid(id: string | null | undefined): string {
  if (!id) return "(none)";
  return `${id.slice(0, 8)}...`;
}

// ────────────────────────────────────────────────────────────
// 4. 모드/인자 파싱
// ────────────────────────────────────────────────────────────

type Mode = "help" | "dry-run" | "apply" | "verify" | "cleanup" | "apply-missing";

interface ParsedArgs {
  mode: Mode;
  unknown: boolean;
  rawArg?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  if (args.length === 0) {
    return { mode: "help", unknown: false };
  }
  const first = args[0];
  if (first === "--help" || first === "-h") {
    return { mode: "help", unknown: false };
  }
  if (first === "--dry-run") return { mode: "dry-run", unknown: false };
  if (first === "--apply") return { mode: "apply", unknown: false };
  if (first === "--verify") return { mode: "verify", unknown: false };
  if (first === "--cleanup") return { mode: "cleanup", unknown: false };
  if (first === "--apply-missing") return { mode: "apply-missing", unknown: false };
  return { mode: "help", unknown: true, rawArg: first };
}

function printHelp(): void {
  const lines = [
    "꿈따라 드림맵 QA Seed 스크립트",
    "",
    "사용법:",
    "  node scripts/qa-dream-map-seed.ts <mode>",
    "",
    "지원 모드:",
    "  --help       이 도움말만 출력 (원격 연결 없음)",
    "  --dry-run    생성 예정 계정·row를 로컬 계산만으로 출력 (원격 연결 없음)",
    "  --verify     [WRITE 아님] QA 프로젝트의 실제 상태를 조회만 함 (원격 연결 있음)",
    "  --apply      [WRITE 모드] QA 프로젝트에 테스트 계정·데이터를 실제로 생성함",
    "  --cleanup    [WRITE 모드] QA 프로젝트의 QA 테스트 데이터를 실제로 삭제함",
    "  --apply-missing",
    "               [WRITE 모드 / additive 전용] --apply와 다르다 — 기존 12개",
    "               fixture가 전부 온전할 때만, G1.6-A12-B1 elem_4 경계 확인용",
    "               fixture 1세트(student 1 + child 1)만 추가 생성한다.",
    "               기존 12개 fixture는 절대 생성/수정/삭제하지 않는다.",
    "               이미 elem_4 fixture가 있으면 아무 것도 하지 않고 종료한다.",
    "",
    "필수 환경변수 (값이 아니라 이름만 여기 표시됨):",
    "  --dry-run : QA_SUPABASE_URL, QA_SUPABASE_PROJECT_REF, PROD_SUPABASE_PROJECT_REF, QA_ENV_CONFIRMED",
    "  --verify  : 위 4개 + QA_SUPABASE_SERVICE_ROLE_KEY",
    "  --apply   : --verify 필수값 전체 + QA_APPLY_CONFIRMED, QA_SEED_PASSWORD",
    "  --cleanup : --verify 필수값 전체 + QA_APPLY_CONFIRMED",
    "  --apply-missing : --apply와 동일한 필수값(QA_APPLY_CONFIRMED, QA_SEED_PASSWORD 포함)",
    "",
    "주의: --apply / --cleanup / --apply-missing은 QA 프로젝트에 실제 쓰기·삭제를 수행하는 WRITE 모드입니다.",
    "      반드시 --dry-run으로 먼저 예상 결과를 확인한 뒤 실행하세요.",
    "      이 스크립트는 QA_SUPABASE_* 환경변수만 사용하며, 앱이 쓰는",
    "      NEXT_PUBLIC_SUPABASE_URL 등 공용 환경변수는 절대 읽지 않습니다.",
  ];
  for (const line of lines) {
    console.log(line);
  }
}

// ────────────────────────────────────────────────────────────
// 5. 환경 설정 로드
// ────────────────────────────────────────────────────────────

interface Config {
  mode: Mode;
  qaUrl?: string;
  qaServiceRoleKey?: string;
  qaProjectRef?: string;
  prodProjectRef?: string;
  seedPassword?: string;
}

const REQUIRED_ENV_BY_MODE: Record<Mode, string[]> = {
  help: [],
  "dry-run": [
    "QA_SUPABASE_URL",
    "QA_SUPABASE_PROJECT_REF",
    "PROD_SUPABASE_PROJECT_REF",
    "QA_ENV_CONFIRMED",
  ],
  verify: [
    "QA_SUPABASE_URL",
    "QA_SUPABASE_SERVICE_ROLE_KEY",
    "QA_SUPABASE_PROJECT_REF",
    "PROD_SUPABASE_PROJECT_REF",
    "QA_ENV_CONFIRMED",
  ],
  apply: [
    "QA_SUPABASE_URL",
    "QA_SUPABASE_SERVICE_ROLE_KEY",
    "QA_SUPABASE_PROJECT_REF",
    "PROD_SUPABASE_PROJECT_REF",
    "QA_ENV_CONFIRMED",
    "QA_APPLY_CONFIRMED",
    "QA_SEED_PASSWORD",
  ],
  cleanup: [
    "QA_SUPABASE_URL",
    "QA_SUPABASE_SERVICE_ROLE_KEY",
    "QA_SUPABASE_PROJECT_REF",
    "PROD_SUPABASE_PROJECT_REF",
    "QA_ENV_CONFIRMED",
    "QA_APPLY_CONFIRMED",
  ],
  "apply-missing": [
    "QA_SUPABASE_URL",
    "QA_SUPABASE_SERVICE_ROLE_KEY",
    "QA_SUPABASE_PROJECT_REF",
    "PROD_SUPABASE_PROJECT_REF",
    "QA_ENV_CONFIRMED",
    "QA_APPLY_CONFIRMED",
    "QA_SEED_PASSWORD",
  ],
};

class GuardError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

function loadConfig(mode: Mode): Config {
  if (mode === "help") {
    return { mode };
  }

  const required = REQUIRED_ENV_BY_MODE[mode];
  const missing = required.filter((name) => !process.env[name] || process.env[name] === "");
  if (missing.length > 0) {
    throw new GuardError(
      `[가드 실패] ${mode} 모드에 필요한 환경변수가 누락됨: ${missing.join(", ")}`,
      1
    );
  }

  if (process.env.QA_ENV_CONFIRMED !== "true") {
    throw new GuardError(
      `[가드 실패] QA_ENV_CONFIRMED가 정확히 "true"가 아닙니다.`,
      1
    );
  }

  if (
    (mode === "apply" || mode === "cleanup" || mode === "apply-missing") &&
    process.env.QA_APPLY_CONFIRMED !== "true"
  ) {
    throw new GuardError(
      `[가드 실패] QA_APPLY_CONFIRMED가 정확히 "true"가 아닙니다. (write 모드에만 필요)`,
      1
    );
  }

  return {
    mode,
    qaUrl: process.env.QA_SUPABASE_URL,
    qaServiceRoleKey: process.env.QA_SUPABASE_SERVICE_ROLE_KEY,
    qaProjectRef: process.env.QA_SUPABASE_PROJECT_REF,
    prodProjectRef: process.env.PROD_SUPABASE_PROJECT_REF,
    seedPassword: process.env.QA_SEED_PASSWORD,
  };
}

// ────────────────────────────────────────────────────────────
// 6. project identity 가드
// ────────────────────────────────────────────────────────────

// project ref 엄격 형식: Supabase project ref는 소문자·숫자 20자로 고정된다.
// 앞뒤 공백은 조용히 trim하지 않고 설정 오류로 거부한다(G1.5-C4 P1-1 보정).
const SUPABASE_PROJECT_REF_REGEX = /^[a-z0-9]{20}$/;

function validateProjectRef(rawValue: string, label: string): string {
  const trimmed = rawValue.trim();

  if (rawValue !== trimmed) {
    throw new GuardError(`[가드 실패] ${label}에 앞뒤 공백이 포함되어 있습니다.`, 1);
  }

  if (!SUPABASE_PROJECT_REF_REGEX.test(trimmed)) {
    throw new GuardError(
      `[가드 실패] ${label} 형식이 올바르지 않습니다(소문자·숫자 20자만 허용).`,
      1
    );
  }

  return trimmed;
}

function validateProjectIdentity(config: Config): string {
  const { qaUrl, qaProjectRef, prodProjectRef } = config;

  if (!qaProjectRef || qaProjectRef.length === 0) {
    throw new GuardError("[가드 실패] QA_SUPABASE_PROJECT_REF가 비어 있습니다.", 1);
  }
  if (!prodProjectRef || prodProjectRef.length === 0) {
    throw new GuardError("[가드 실패] PROD_SUPABASE_PROJECT_REF가 비어 있습니다.", 1);
  }

  const validQaRef = validateProjectRef(qaProjectRef, "QA_SUPABASE_PROJECT_REF");
  const validProdRef = validateProjectRef(prodProjectRef, "PROD_SUPABASE_PROJECT_REF");

  let parsed: URL;
  try {
    parsed = new URL(qaUrl as string);
  } catch {
    throw new GuardError("[가드 실패] QA_SUPABASE_URL을 URL로 파싱할 수 없습니다.", 1);
  }

  if (parsed.protocol !== "https:") {
    throw new GuardError("[가드 실패] QA_SUPABASE_URL의 protocol이 https가 아닙니다.", 1);
  }

  const hostMatch = /^([a-z0-9-]+)\.supabase\.co$/i.exec(parsed.hostname);
  if (!hostMatch) {
    throw new GuardError(
      "[가드 실패] QA_SUPABASE_URL host가 <project-ref>.supabase.co 형식이 아닙니다.",
      1
    );
  }
  const extractedRef = validateProjectRef(
    hostMatch[1],
    "QA_SUPABASE_URL(추출된 project ref)"
  );

  if (extractedRef !== validQaRef) {
    throw new GuardError(
      "[가드 실패] URL에서 추출한 project ref가 QA_SUPABASE_PROJECT_REF와 일치하지 않습니다.",
      1
    );
  }

  if (validQaRef === validProdRef) {
    throw new GuardError(
      "[가드 실패] QA_SUPABASE_PROJECT_REF와 PROD_SUPABASE_PROJECT_REF가 동일합니다. 설정 오류로 판단해 중단합니다.",
      1
    );
  }

  if (extractedRef === validProdRef) {
    throw new GuardError(
      "[가드 실패] URL에서 추출한 project ref가 운영 project ref(PROD_SUPABASE_PROJECT_REF)와 일치합니다. 운영 프로젝트로 판단해 즉시 중단합니다.",
      1
    );
  }

  return extractedRef;
}

// ────────────────────────────────────────────────────────────
// 7. Supabase Admin 클라이언트 (verify/apply/cleanup 에서만 생성)
// ────────────────────────────────────────────────────────────

function createAdminClient(config: Config): any {
  // 원격 연결이 필요한 모드에서만 호출된다. require를 함수 내부에서 수행해
  // help/dry-run 경로에서는 모듈 평가 시점 로그·부작용만 남기고 실제 클라이언트
  // 인스턴스는 절대 생성되지 않게 한다.
  const { createClient } = require("@supabase/supabase-js");
  return createClient(config.qaUrl, config.qaServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ────────────────────────────────────────────────────────────
// 8. Manifest
// ────────────────────────────────────────────────────────────

const MANIFEST_PATH = path.join(__dirname, ".qa-seed-manifest.json");
const MANIFEST_VERSION = 1;

interface ManifestAccountEntry {
  identifier: string;
  authUserId: string;
  maskedEmail: string;
  parentId?: string;
  studentId?: string;
}

interface ManifestChildEntry {
  childIdentifier: string;
  childId: string;
  ownerIdentifier: string;
  gradeLevel: string | null;
}

interface Manifest {
  manifestVersion: number;
  createdAt: string;
  qaProjectRefMasked: string;
  accounts: ManifestAccountEntry[];
  children: ManifestChildEntry[];
}

function writeManifestAtomic(manifest: Manifest): void {
  const tmpPath = `${MANIFEST_PATH}.tmp-${process.pid}`;
  fs.writeFileSync(tmpPath, JSON.stringify(manifest, null, 2), { encoding: "utf-8" });
  fs.renameSync(tmpPath, MANIFEST_PATH);
}

function readManifestIfValid(): Manifest | null {
  if (!fs.existsSync(MANIFEST_PATH)) return null;
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, { encoding: "utf-8" });
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      parsed.manifestVersion === MANIFEST_VERSION &&
      Array.isArray(parsed.accounts)
    ) {
      return parsed as Manifest;
    }
    return null;
  } catch {
    return null;
  }
}

function deleteManifestIfExists(): void {
  if (fs.existsSync(MANIFEST_PATH)) {
    fs.unlinkSync(MANIFEST_PATH);
  }
}

// ────────────────────────────────────────────────────────────
// 9. --dry-run
// ────────────────────────────────────────────────────────────

function runDryRun(config: Config): void {
  const ref = validateProjectIdentity(config);

  console.log("[DRY-RUN] 대상 QA project ref (마스킹):", maskRef(ref));
  console.log("[DRY-RUN] 실제 원격 요청 없음. 아래는 --apply 실행 시 생성될 예정 목록입니다.\n");

  console.log(`[DRY-RUN] 생성 예정 Auth 계정: ${ACCOUNTS.length}개`);
  for (const account of ACCOUNTS) {
    const email = buildEmail(account.identifier);
    console.log(
      `  - ${account.identifier} | role=${account.role ?? "(없음)"} | ${maskEmail(email)} | ${account.purpose}`
    );
  }

  console.log(`\n[DRY-RUN] 생성 예정 child: ${CHILDREN.length}개`);
  for (const child of CHILDREN) {
    console.log(
      `  - ${child.childIdentifier} (owner=${child.ownerIdentifier}, grade_level=${child.gradeLevel ?? "null"})`
    );
  }

  console.log(`\n[DRY-RUN] student-child 연결 예정: ${STUDENT_CHILD_LINKS.length}건`);
  for (const link of STUDENT_CHILD_LINKS) {
    console.log(`  - ${link.studentIdentifier} → ${link.childIdentifier}`);
  }

  console.log(`\n[DRY-RUN] 생성 후 row 삭제 예정(예외 케이스): ${POST_CREATE_ROW_DELETIONS.length}건`);
  for (const del of POST_CREATE_ROW_DELETIONS) {
    console.log(`  - ${del.identifier}의 ${del.table} row 삭제`);
  }

  console.log("\n[DRY-RUN] 최종 기대 건수:");
  console.log(`  - Auth user: ${EXPECTED_COUNTS.authUsers}`);
  console.log(`  - parent row: ${EXPECTED_COUNTS.parentRowsFinal}`);
  console.log(`  - student row: ${EXPECTED_COUNTS.studentRowsFinal}`);
  console.log(`  - child row: ${EXPECTED_COUNTS.childRows}`);
  console.log(`  - subscription_plan row: ${EXPECTED_COUNTS.subscriptionPlanRowsFinal}`);

  console.log("\nDRY_RUN_COMPLETE_NO_REMOTE_ACCESS");
}

// ────────────────────────────────────────────────────────────
// 10. Auth 사용자 목록 조회 (페이지네이션, QA 패턴만 필터)
// ────────────────────────────────────────────────────────────

async function listQaAuthUsers(
  adminClient: any
): Promise<Array<{ id: string; email: string; userMetadata: Record<string, unknown> }>> {
  const perPage = 200;
  let page = 1;
  const matches: Array<{ id: string; email: string; userMetadata: Record<string, unknown> }> = [];

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new GuardError(`[원격 조회 실패] Auth 사용자 목록 조회 실패: ${error.message ?? "알 수 없는 오류"}`, 2);
    }
    const users = data?.users ?? [];
    for (const user of users) {
      const email = user.email as string | undefined;
      if (email && QA_EMAIL_REGEX.test(email)) {
        matches.push({ id: user.id, email, userMetadata: user.user_metadata ?? {} });
      }
    }
    if (users.length < perPage) break;
    page += 1;
  }

  return matches;
}

// ────────────────────────────────────────────────────────────
// 11. --verify
// ────────────────────────────────────────────────────────────

type VerifyOutcome = "pass" | "not_applied" | "fail";

async function runVerify(config: Config): Promise<VerifyOutcome> {
  const ref = validateProjectIdentity(config);
  console.log("[VERIFY] 대상 QA project ref (마스킹):", maskRef(ref));

  const adminClient = createAdminClient(config);

  const qaUsers = await listQaAuthUsers(adminClient);
  console.log(`[VERIFY] QA 이메일 패턴과 일치하는 Auth user 수: ${qaUsers.length}`);

  if (qaUsers.length === 0) {
    console.log("QA_SEED_NOT_APPLIED");
    return "not_applied";
  }

  const emailToId = new Map<string, string>();
  const emailToMetadata = new Map<string, Record<string, unknown>>();
  for (const user of qaUsers) {
    emailToId.set(user.email, user.id);
    emailToMetadata.set(user.email, user.userMetadata);
  }

  let allFound = true;
  const identifierToUserId = new Map<string, string>();
  for (const account of ACCOUNTS) {
    const email = buildEmail(account.identifier);
    const id = emailToId.get(email);
    const found = Boolean(id);
    if (!found) allFound = false;
    if (id) identifierToUserId.set(account.identifier, id);
    console.log(`  - ${account.identifier} | ${maskEmail(email)} | ${found ? "PASS" : "FAIL"}`);
  }

  // ── onboarding metadata 계약 검증 (G1.6-A4) ──────────────────────
  // App middleware가 요구하는 user_metadata.onboarding_completed === true 계약을
  // Seed 기대 매트릭스(ACCOUNTS[].onboardingCompleted)와 대조한다.
  // 이메일/UUID/raw metadata는 출력하지 않고 QA identifier·기대/실제 상태만 남긴다.
  let onboardingContractOk = true;
  for (const account of ACCOUNTS) {
    const email = buildEmail(account.identifier);
    const metadata = emailToMetadata.get(email);
    const rawValue = metadata?.onboarding_completed;
    const actualTrue = rawValue === true;
    const expectedTrue = account.onboardingCompleted === true;
    const pass = expectedTrue ? actualTrue : !actualTrue;

    if (!pass) {
      onboardingContractOk = false;
      const actualLabel =
        rawValue === true ? "true" : rawValue === false ? "false" : rawValue === undefined ? "missing" : "unexpected";
      console.log("QA_SEED_ONBOARDING_METADATA_MISMATCH");
      console.log(`identifier=${account.identifier}`);
      console.log(`expected=${expectedTrue ? "true" : "not_true"}`);
      console.log(`actual=${actualLabel}`);
    }
  }
  console.log(
    onboardingContractOk
      ? "QA_SEED_ONBOARDING_METADATA_VERIFY_PASS"
      : "QA_SEED_ONBOARDING_METADATA_VERIFY_FAIL"
  );

  const userIds = Array.from(identifierToUserId.values());

  const { data: parentRows, error: parentErr } = await adminClient
    .from("parent")
    .select("id, user_id")
    .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  if (parentErr) {
    throw new GuardError(`[원격 조회 실패] parent 조회 실패: ${parentErr.message}`, 2);
  }

  const { data: studentRows, error: studentErr } = await adminClient
    .from("student")
    .select("id, user_id, child_id")
    .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  if (studentErr) {
    throw new GuardError(`[원격 조회 실패] student 조회 실패: ${studentErr.message}`, 2);
  }

  const parentIds = (parentRows ?? []).map((row: any) => row.id);
  const { data: childRows, error: childErr } = await adminClient
    .from("child")
    .select("id, parent_id, name, grade_level")
    .in("parent_id", parentIds.length > 0 ? parentIds : ["00000000-0000-0000-0000-000000000000"]);
  if (childErr) {
    throw new GuardError(`[원격 조회 실패] child 조회 실패: ${childErr.message}`, 2);
  }

  const { data: planRows, error: planErr } = await adminClient
    .from("subscription_plan")
    .select("id, parent_id")
    .in("parent_id", parentIds.length > 0 ? parentIds : ["00000000-0000-0000-0000-000000000000"]);
  if (planErr) {
    throw new GuardError(`[원격 조회 실패] subscription_plan 조회 실패: ${planErr.message}`, 2);
  }

  // ── baseline / additive / unexpected child 분리 (additive-aware) ───────
  // child.name에는 deterministic identifier(CHILDREN[].childIdentifier 또는
  // ADDITIVE_CHILD.childIdentifier)가 저장되므로, 이를 기준으로 baseline
  // fixture 카운트에서 additive fixture를 명확히 제외한다. "row 수가 늘면
  // 무조건 이상"이 아니라 "정체를 식별할 수 없는 row가 있으면 이상"으로 판정한다.
  const baselineChildIdentifiers = new Set(CHILDREN.map((c) => c.childIdentifier));
  const knownAdditiveChildIdentifiers = new Set([ADDITIVE_CHILD.childIdentifier]);

  const baselineChildRows = (childRows ?? []).filter((row: any) => baselineChildIdentifiers.has(row.name));
  const additiveChildRows = (childRows ?? []).filter((row: any) => knownAdditiveChildIdentifiers.has(row.name));
  const unexpectedChildRows = (childRows ?? []).filter(
    (row: any) => !baselineChildIdentifiers.has(row.name) && !knownAdditiveChildIdentifiers.has(row.name)
  );

  console.log(`\n[VERIFY] parent row 수: ${(parentRows ?? []).length} (기대 ${EXPECTED_COUNTS.parentRowsFinal})`);
  console.log(`[VERIFY] student row 수: ${(studentRows ?? []).length} (기대 ${EXPECTED_COUNTS.studentRowsFinal})`);
  console.log(
    `[VERIFY] child row 수(baseline): ${baselineChildRows.length} (기대 ${EXPECTED_COUNTS.childRows}) | additive: ${additiveChildRows.length} | unexpected: ${unexpectedChildRows.length} | 전체: ${(childRows ?? []).length}`
  );
  console.log(`[VERIFY] subscription_plan row 수: ${(planRows ?? []).length} (기대 ${EXPECTED_COUNTS.subscriptionPlanRowsFinal})`);

  if (unexpectedChildRows.length > 0) {
    console.log(
      `[VERIFY] ⚠ 식별 불가 child row ${unexpectedChildRows.length}건 발견 — baseline/additive 어느 identifier와도 일치하지 않음`
    );
    console.log("QA_SEED_UNEXPECTED_CHILD_FIXTURE_DETECTED");
  }

  const countsMatch =
    (parentRows ?? []).length === EXPECTED_COUNTS.parentRowsFinal &&
    (studentRows ?? []).length === EXPECTED_COUNTS.studentRowsFinal &&
    baselineChildRows.length === EXPECTED_COUNTS.childRows &&
    (planRows ?? []).length === EXPECTED_COUNTS.subscriptionPlanRowsFinal &&
    unexpectedChildRows.length === 0;

  const studentsWithChild = (studentRows ?? []).filter((row: any) => row.child_id).length;
  console.log(`[VERIFY] student.child_id 연결 건수: ${studentsWithChild} (기대 ${STUDENT_CHILD_LINKS.length})`);

  const gradeLevelCounts: Record<string, number> = {};
  for (const row of childRows ?? []) {
    const key = row.grade_level ?? "null";
    gradeLevelCounts[key] = (gradeLevelCounts[key] ?? 0) + 1;
  }
  console.log("[VERIFY] child.grade_level 분포(전체, baseline+additive):", JSON.stringify(gradeLevelCounts));

  const overallPass =
    allFound &&
    countsMatch &&
    studentsWithChild === STUDENT_CHILD_LINKS.length &&
    onboardingContractOk;

  console.log(overallPass ? "\nQA_SEED_VERIFY_PASS" : "\nQA_SEED_VERIFY_FAIL");

  // ── Additive elem_4 fixture 확인 (G1.6-A12-B1, 읽기 전용) ──────────────
  // 위 12개 fixture 판정(overallPass)에는 영향을 주지 않는 별도 부가 확인.
  const additiveEmail = buildEmail(ADDITIVE_ACCOUNT.identifier);
  const additiveUserId = emailToId.get(additiveEmail);
  if (!additiveUserId) {
    console.log("QA_SEED_ADDITIVE_ELEM4_NOT_APPLIED");
  } else {
    const { data: additiveStudentRow } = await adminClient
      .from("student")
      .select("id, child_id")
      .eq("user_id", additiveUserId)
      .maybeSingle();
    let additiveGradeOk = false;
    if (additiveStudentRow?.child_id) {
      const { data: additiveChildRow } = await adminClient
        .from("child")
        .select("grade_level")
        .eq("id", additiveStudentRow.child_id)
        .maybeSingle();
      additiveGradeOk = additiveChildRow?.grade_level === ADDITIVE_CHILD.gradeLevel;
    }
    console.log(
      `[VERIFY] additive elem_4 학생 | ${maskEmail(additiveEmail)} | child 연결: ${Boolean(additiveStudentRow?.child_id)} | grade_level 일치: ${additiveGradeOk}`
    );
    console.log(additiveGradeOk ? "QA_SEED_ADDITIVE_ELEM4_VERIFY_PASS" : "QA_SEED_ADDITIVE_ELEM4_VERIFY_FAIL");
  }

  return overallPass ? "pass" : "fail";
}

// ────────────────────────────────────────────────────────────
// 12. --apply
// ────────────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runApply(config: Config): Promise<void> {
  const ref = validateProjectIdentity(config);
  console.log("[APPLY] 대상 QA project ref (마스킹):", maskRef(ref));

  const adminClient = createAdminClient(config);

  // 1) 기존 QA 계정 존재 여부 사전 확인 — 하나라도 있으면 중단
  const existing = await listQaAuthUsers(adminClient);
  if (existing.length > 0) {
    console.log(`[APPLY] 기존 QA 계정 ${existing.length}개 발견 — 신규 생성을 진행하지 않습니다.`);
    console.log("QA_SEED_DATA_ALREADY_EXISTS");
    console.log("다음 행동: --verify로 현재 상태를 확인하거나 --cleanup으로 정리 후 재실행하세요.");
    throw new GuardError("기존 QA 데이터 존재로 apply 중단", 1);
  }

  // 2) Auth user 12개 순차 생성
  const identifierToUserId = new Map<string, string>();
  for (const account of ACCOUNTS) {
    const email = buildEmail(account.identifier);
    // App onboarding 계약(user_metadata.onboarding_completed === true) 재현.
    // role 없음(QA_NO_ROLE)은 기존과 동일하게 metadata 자체를 부여하지 않는다.
    // 예외 계정(onboardingCompleted: false)은 role만 부여 — onboarding_completed 키를
    // 추가하지 않아 missing 상태(App 계약상 미완료와 동일)를 그대로 유지한다.
    const metadata = account.role
      ? account.onboardingCompleted
        ? { role: account.role, onboarding_completed: true }
        : { role: account.role }
      : undefined;

    let created: any = null;
    let lastError: string | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password: config.seedPassword,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (!error && data?.user) {
        created = data.user;
        break;
      }
      lastError = error?.message ?? "알 수 없는 오류";
      if (attempt === 0) await sleep(500);
    }

    if (!created) {
      console.log(`[APPLY] 계정 생성 실패: ${account.identifier} (${maskEmail(email)}) — ${lastError}`);
      console.log(`[APPLY] 부분 생성 상태: ${identifierToUserId.size}/${ACCOUNTS.length}개 완료 후 중단`);
      throw new GuardError("Auth 계정 생성 실패", 3);
    }

    identifierToUserId.set(account.identifier, created.id);
    console.log(`[APPLY] 생성 완료: ${account.identifier} | ${maskEmail(email)} | ${maskUuid(created.id)}`);
  }

  // 3) trigger가 생성한 parent/student row 조회 (레이스 컨디션 없음 — 방어적 1회 재시도만 둔다)
  const userIds = Array.from(identifierToUserId.values());

  async function fetchRowsWithRetry(table: "parent" | "student") {
    let { data, error } = await adminClient.from(table).select("id, user_id").in("user_id", userIds);
    if (error) throw new GuardError(`[원격 조회 실패] ${table} 조회 실패: ${error.message}`, 2);
    if ((data ?? []).length === 0) {
      await sleep(500);
      const retry = await adminClient.from(table).select("id, user_id").in("user_id", userIds);
      if (retry.error) throw new GuardError(`[원격 조회 실패] ${table} 재조회 실패: ${retry.error.message}`, 2);
      data = retry.data;
    }
    return data ?? [];
  }

  const parentRows = await fetchRowsWithRetry("parent");
  const studentRows = await fetchRowsWithRetry("student");

  const userIdToParentId = new Map<string, string>();
  for (const row of parentRows) userIdToParentId.set(row.user_id, row.id);
  const userIdToStudentId = new Map<string, string>();
  for (const row of studentRows) userIdToStudentId.set(row.user_id, row.id);

  const identifierToParentId = new Map<string, string>();
  const identifierToStudentId = new Map<string, string>();
  for (const account of ACCOUNTS) {
    const userId = identifierToUserId.get(account.identifier);
    if (!userId) continue;
    if (account.role === "parent") {
      const parentId = userIdToParentId.get(userId);
      if (parentId) identifierToParentId.set(account.identifier, parentId);
    }
    if (account.role === "student") {
      const studentId = userIdToStudentId.get(userId);
      if (studentId) identifierToStudentId.set(account.identifier, studentId);
    }
  }

  // 예상되는 row 존재 여부 검증 (QA_NO_ROLE만 parent/student 어느 쪽도 없어야 정상)
  for (const account of ACCOUNTS) {
    if (account.role === "parent" && !identifierToParentId.has(account.identifier)) {
      throw new GuardError(`[가드 실패] ${account.identifier}의 parent row가 트리거로 생성되지 않았습니다.`, 3);
    }
    if (account.role === "student" && !identifierToStudentId.has(account.identifier)) {
      throw new GuardError(`[가드 실패] ${account.identifier}의 student row가 트리거로 생성되지 않았습니다.`, 3);
    }
  }

  // 4) 부모용 child row 7개 생성
  const identifierToChildId = new Map<string, string>();
  for (const child of CHILDREN) {
    const parentId = identifierToParentId.get(child.ownerIdentifier);
    if (!parentId) {
      throw new GuardError(`[가드 실패] ${child.childIdentifier}의 소유 parent(${child.ownerIdentifier})를 찾을 수 없습니다.`, 3);
    }
    const { data, error } = await adminClient
      .from("child")
      .insert({
        parent_id: parentId,
        name: child.childIdentifier,
        grade_level: child.gradeLevel,
      })
      .select("id")
      .single();
    if (error || !data) {
      console.log(`[APPLY] child 생성 실패: ${child.childIdentifier} — ${error?.message ?? "알 수 없는 오류"}`);
      throw new GuardError("child row 생성 실패", 3);
    }
    identifierToChildId.set(child.childIdentifier, data.id);
    console.log(`[APPLY] child 생성 완료: ${child.childIdentifier} | ${maskUuid(data.id)}`);
  }

  // 5) student.child_id 연결
  for (const link of STUDENT_CHILD_LINKS) {
    const studentId = identifierToStudentId.get(link.studentIdentifier);
    const childId = identifierToChildId.get(link.childIdentifier);
    if (!studentId || !childId) {
      throw new GuardError(`[가드 실패] ${link.studentIdentifier}↔${link.childIdentifier} 연결에 필요한 id를 찾을 수 없습니다.`, 3);
    }
    const { error } = await adminClient.from("student").update({ child_id: childId }).eq("id", studentId);
    if (error) {
      throw new GuardError(`[가드 실패] student.child_id 연결 실패(${link.studentIdentifier}): ${error.message}`, 3);
    }
    console.log(`[APPLY] 연결 완료: ${link.studentIdentifier} → ${link.childIdentifier}`);
  }

  // 6) 예외 row 삭제 (QA_PARENT_NO_ROW의 parent, QA_STUDENT_NO_ROW의 student)
  for (const del of POST_CREATE_ROW_DELETIONS) {
    if (del.table === "parent") {
      const parentId = identifierToParentId.get(del.identifier);
      if (!parentId) {
        throw new GuardError(`[가드 실패] ${del.identifier}의 parent row를 찾을 수 없어 삭제할 수 없습니다.`, 3);
      }
      const { error } = await adminClient.from("parent").delete().eq("id", parentId);
      if (error) throw new GuardError(`[가드 실패] ${del.identifier} parent 삭제 실패: ${error.message}`, 3);
      console.log(`[APPLY] 예외 처리 완료: ${del.identifier}의 parent row 삭제`);
    } else {
      const studentId = identifierToStudentId.get(del.identifier);
      if (!studentId) {
        throw new GuardError(`[가드 실패] ${del.identifier}의 student row를 찾을 수 없어 삭제할 수 없습니다.`, 3);
      }
      const { error } = await adminClient.from("student").delete().eq("id", studentId);
      if (error) throw new GuardError(`[가드 실패] ${del.identifier} student 삭제 실패: ${error.message}`, 3);
      console.log(`[APPLY] 예외 처리 완료: ${del.identifier}의 student row 삭제`);
    }
  }

  // 7) 최종 기대 건수 검증
  const finalParentIds = Array.from(identifierToParentId.values()).filter(
    (id) => id !== identifierToParentId.get("QA_PARENT_NO_ROW")
  );
  const finalStudentIds = Array.from(identifierToStudentId.values()).filter(
    (id) => id !== identifierToStudentId.get("QA_STUDENT_NO_ROW")
  );

  const { data: finalPlanRows, error: finalPlanErr } = await adminClient
    .from("subscription_plan")
    .select("id")
    .in("parent_id", finalParentIds.length > 0 ? finalParentIds : ["00000000-0000-0000-0000-000000000000"]);
  if (finalPlanErr) {
    throw new GuardError(`[원격 조회 실패] 최종 subscription_plan 검증 실패: ${finalPlanErr.message}`, 2);
  }

  const countsOk =
    finalParentIds.length === EXPECTED_COUNTS.parentRowsFinal &&
    finalStudentIds.length === EXPECTED_COUNTS.studentRowsFinal &&
    identifierToChildId.size === EXPECTED_COUNTS.childRows &&
    (finalPlanRows ?? []).length === EXPECTED_COUNTS.subscriptionPlanRowsFinal;

  if (!countsOk) {
    console.log("[APPLY] 최종 건수 불일치 발견:");
    console.log(`  parent: ${finalParentIds.length}/${EXPECTED_COUNTS.parentRowsFinal}`);
    console.log(`  student: ${finalStudentIds.length}/${EXPECTED_COUNTS.studentRowsFinal}`);
    console.log(`  child: ${identifierToChildId.size}/${EXPECTED_COUNTS.childRows}`);
    console.log(`  subscription_plan: ${(finalPlanRows ?? []).length}/${EXPECTED_COUNTS.subscriptionPlanRowsFinal}`);
    console.log("자동 cleanup을 트리거하지 않습니다. --verify로 정확한 상태를 확인 후 판단하세요.");
    throw new GuardError("최종 기대 건수 불일치", 3);
  }

  // 8) manifest 기록
  const manifest: Manifest = {
    manifestVersion: MANIFEST_VERSION,
    createdAt: new Date().toISOString(),
    qaProjectRefMasked: maskRef(ref),
    accounts: ACCOUNTS.map((account) => {
      const userId = identifierToUserId.get(account.identifier) as string;
      return {
        identifier: account.identifier,
        authUserId: userId,
        maskedEmail: maskEmail(buildEmail(account.identifier)),
        parentId: identifierToParentId.get(account.identifier),
        studentId: identifierToStudentId.get(account.identifier),
      };
    }),
    children: CHILDREN.map((child) => ({
      childIdentifier: child.childIdentifier,
      childId: identifierToChildId.get(child.childIdentifier) as string,
      ownerIdentifier: child.ownerIdentifier,
      gradeLevel: child.gradeLevel,
    })),
  };
  writeManifestAtomic(manifest);
  console.log(`[APPLY] manifest 기록 완료: ${MANIFEST_PATH}`);

  console.log("\n[APPLY] 요약:");
  console.log(`  Auth user: ${identifierToUserId.size}`);
  console.log(`  parent row(최종): ${finalParentIds.length}`);
  console.log(`  student row(최종): ${finalStudentIds.length}`);
  console.log(`  child row: ${identifierToChildId.size}`);
  console.log(`  subscription_plan row(최종): ${(finalPlanRows ?? []).length}`);
  console.log("\nQA_SEED_APPLY_COMPLETE");
}

// ────────────────────────────────────────────────────────────
// 12-B. --apply-missing (G1.6-A12-B1)
//
// [원칙] 기존 --apply와 완전히 분리된 additive-only 실행 경로.
//   - 기존 12개 fixture는 절대 생성/수정/삭제하지 않는다 (조회만).
//   - 기존 12개 fixture가 하나라도 누락되면 아무 것도 만들지 않고 중단한다.
//   - elem_4 fixture가 이미 있으면(재실행) 아무 것도 하지 않고 종료한다(idempotent).
//   - 생성 대상은 정확히: student auth user 1개 + child 1개 + student.child_id 연결 1건.
//   - 신규 parent를 만들지 않고 기존 QA_PARENT_MULTI를 소유자로 재사용한다.
// ────────────────────────────────────────────────────────────

async function runApplyMissing(config: Config): Promise<void> {
  const ref = validateProjectIdentity(config);
  console.log("[APPLY-MISSING] 대상 QA project ref (마스킹):", maskRef(ref));

  const adminClient = createAdminClient(config);

  // 1) 기존 12개 fixture 무결성 사전 확인 (조회만 — 생성/수정/삭제 없음)
  const qaUsers = await listQaAuthUsers(adminClient);
  const emailToUser = new Map(qaUsers.map((u) => [u.email, u]));

  let baseIntact = true;
  for (const account of ACCOUNTS) {
    const email = buildEmail(account.identifier);
    if (!emailToUser.has(email)) {
      baseIntact = false;
      console.log(`[APPLY-MISSING] 기존 fixture 누락 감지: ${account.identifier}`);
    }
  }
  if (!baseIntact) {
    console.log("QA_SEED_BASE_FIXTURE_INCOMPLETE");
    console.log("기존 12개 fixture가 온전하지 않아 additive 생성을 진행하지 않습니다. --verify로 먼저 확인하세요.");
    throw new GuardError("기존 fixture 불완전 — additive 중단", 1);
  }
  console.log("[APPLY-MISSING] 기존 12개 fixture 무결성 확인 완료 (변경 없음)");

  // 2) elem_4 fixture 이미 존재하는지 확인 — 있으면 idempotent 종료
  const additiveEmail = buildEmail(ADDITIVE_ACCOUNT.identifier);
  if (emailToUser.has(additiveEmail)) {
    console.log("QA_SEED_ADDITIVE_FIXTURE_ALREADY_EXISTS");
    console.log(`[APPLY-MISSING] ${ADDITIVE_ACCOUNT.identifier} 이미 존재 — 생성을 건너뜁니다.`);
    return;
  }

  // 3) 생성 예정 대상 사전 보고 (실제 write 이전)
  console.log("CREATE_AUTH_USERS_EXPECTED=1");
  console.log("CREATE_CHILDREN_EXPECTED=1");
  console.log("CREATE_LINK_ROWS_EXPECTED=1");
  console.log("UPDATE_EXISTING_EXPECTED=0");
  console.log("DELETE_EXISTING_EXPECTED=0");

  // 4) 소유 parent(QA_PARENT_MULTI) row 조회 — 기존 row는 읽기만, 수정 없음
  const ownerEmail = buildEmail(ADDITIVE_CHILD.ownerIdentifier);
  const ownerUser = emailToUser.get(ownerEmail);
  if (!ownerUser) {
    throw new GuardError(`[가드 실패] ${ADDITIVE_CHILD.ownerIdentifier} auth user를 찾을 수 없습니다.`, 2);
  }
  const { data: ownerParentRow, error: ownerParentErr } = await adminClient
    .from("parent")
    .select("id")
    .eq("user_id", ownerUser.id)
    .maybeSingle();
  if (ownerParentErr || !ownerParentRow) {
    throw new GuardError(
      `[가드 실패] ${ADDITIVE_CHILD.ownerIdentifier}의 parent row를 찾을 수 없습니다.`,
      2
    );
  }

  // 5) elem_4 student auth user 생성 (정확히 1개)
  const metadata = { role: ADDITIVE_ACCOUNT.role, onboarding_completed: ADDITIVE_ACCOUNT.onboardingCompleted };
  let created: any = null;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: additiveEmail,
      password: config.seedPassword,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (!error && data?.user) {
      created = data.user;
      break;
    }
    lastError = error?.message ?? "알 수 없는 오류";
    if (attempt === 0) await sleep(500);
  }
  if (!created) {
    throw new GuardError(`Auth 계정 생성 실패: ${lastError}`, 3);
  }
  console.log(
    `[APPLY-MISSING] 생성 완료: ${ADDITIVE_ACCOUNT.identifier} | ${maskEmail(additiveEmail)} | ${maskUuid(created.id)}`
  );

  // 6) trigger가 생성한 student row 조회 (방어적 1회 재시도)
  let studentRow: { id: string } | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data } = await adminClient.from("student").select("id").eq("user_id", created.id).maybeSingle();
    if (data) {
      studentRow = data;
      break;
    }
    await sleep(500);
  }
  if (!studentRow) {
    throw new GuardError(
      `[가드 실패] ${ADDITIVE_ACCOUNT.identifier}의 student row가 트리거로 생성되지 않았습니다.`,
      3
    );
  }

  // 7) child row 생성 (정확히 1개, 기존 QA_PARENT_MULTI 소유)
  const { data: childRow, error: childErr } = await adminClient
    .from("child")
    .insert({
      parent_id:   ownerParentRow.id,
      name:        ADDITIVE_CHILD.childIdentifier,
      grade_level: ADDITIVE_CHILD.gradeLevel,
    })
    .select("id")
    .single();
  if (childErr || !childRow) {
    throw new GuardError(`child row 생성 실패: ${childErr?.message ?? "알 수 없는 오류"}`, 3);
  }
  console.log(`[APPLY-MISSING] child 생성 완료: ${ADDITIVE_CHILD.childIdentifier} | ${maskUuid(childRow.id)}`);

  // 8) student.child_id 연결 (정확히 1건, 신규 student row 자신에 한함)
  const { error: linkErr } = await adminClient
    .from("student")
    .update({ child_id: childRow.id })
    .eq("id", studentRow.id);
  if (linkErr) {
    throw new GuardError(`student.child_id 연결 실패: ${linkErr.message}`, 3);
  }
  console.log(`[APPLY-MISSING] 연결 완료: ${ADDITIVE_LINK.studentIdentifier} → ${ADDITIVE_LINK.childIdentifier}`);

  // 9) 로컬 manifest에 additive 항목 append (있으면만 — 없으면 정보성 로그만)
  const existingManifest = readManifestIfValid();
  if (existingManifest) {
    existingManifest.accounts.push({
      identifier:   ADDITIVE_ACCOUNT.identifier,
      authUserId:   created.id,
      maskedEmail:  maskEmail(additiveEmail),
      studentId:    studentRow.id,
    });
    existingManifest.children.push({
      childIdentifier: ADDITIVE_CHILD.childIdentifier,
      childId:         childRow.id,
      ownerIdentifier: ADDITIVE_CHILD.ownerIdentifier,
      gradeLevel:      ADDITIVE_CHILD.gradeLevel,
    });
    writeManifestAtomic(existingManifest);
    console.log(`[APPLY-MISSING] manifest 갱신 완료: ${MANIFEST_PATH}`);
  } else {
    console.log("[APPLY-MISSING] 로컬 manifest 없음 — manifest 갱신 생략(원격 상태에는 영향 없음)");
  }

  console.log("\nQA_SEED_ADDITIVE_APPLY_COMPLETE");
}

// ────────────────────────────────────────────────────────────
// 13. --cleanup
// ────────────────────────────────────────────────────────────

async function runCleanup(config: Config): Promise<void> {
  const ref = validateProjectIdentity(config);
  console.log("[CLEANUP] 대상 QA project ref (마스킹):", maskRef(ref));

  const adminClient = createAdminClient(config);

  const manifest = readManifestIfValid();
  let targets: Array<{ id: string; email: string }> = [];

  if (manifest) {
    console.log("[CLEANUP] manifest 로드 성공 — manifest 기준으로 삭제 대상을 결정합니다.");
    targets = manifest.accounts
      .filter((entry) => QA_EMAIL_REGEX.test(`placeholder@${QA_EMAIL_DOMAIN}`) || true)
      .map((entry) => ({ id: entry.authUserId, email: "" }));
    // manifest에는 마스킹된 이메일만 있으므로, 실제 삭제 전 auth 조회로 원문 이메일을
    // 다시 확보해 패턴 검증한다(이중 가드 — manifest만으로 이메일 패턴 검증을 건너뛰지 않음).
    const qaUsers = await listQaAuthUsers(adminClient);
    const idToEmail = new Map(qaUsers.map((u) => [u.id, u.email]));
    targets = targets
      .map((t) => ({ id: t.id, email: idToEmail.get(t.id) ?? "" }))
      .filter((t) => t.email.length > 0);
  } else {
    console.log("[CLEANUP] manifest 없음 또는 손상됨 — QA 이메일 패턴으로 재조회합니다.");
    targets = await listQaAuthUsers(adminClient);
  }

  // 이메일 패턴 이중 검증
  const invalidTargets = targets.filter((t) => !QA_EMAIL_REGEX.test(t.email));
  if (invalidTargets.length > 0) {
    console.log(`[CLEANUP] QA 패턴과 일치하지 않는 대상 ${invalidTargets.length}건 발견 — 삭제 목록에서 제외합니다.`);
    targets = targets.filter((t) => QA_EMAIL_REGEX.test(t.email));
  }

  if (targets.length === 0) {
    console.log("[CLEANUP] 삭제 대상 0건 — 정상적인 idempotent cleanup으로 처리합니다.");
    deleteManifestIfExists();
    console.log("QA_SEED_CLEANUP_COMPLETE");
    return;
  }

  if (targets.length > EXPECTED_COUNTS.authUsers) {
    console.log(
      `[CLEANUP] 삭제 대상(${targets.length}건)이 상한(${EXPECTED_COUNTS.authUsers}건)을 초과합니다 — 안전을 위해 삭제하지 않고 목록만 출력합니다.`
    );
    for (const t of targets) console.log(`  - ${maskUuid(t.id)} | ${maskEmail(t.email)}`);
    throw new GuardError("cleanup 대상 건수 상한 초과", 1);
  }

  const failed: string[] = [];
  let successCount = 0;
  for (const target of targets) {
    const { error } = await adminClient.auth.admin.deleteUser(target.id);
    if (error) {
      failed.push(`${maskUuid(target.id)} (${error.message})`);
      console.log(`[CLEANUP] 삭제 실패: ${maskUuid(target.id)} | ${maskEmail(target.email)} — ${error.message}`);
      continue;
    }
    successCount += 1;
    console.log(`[CLEANUP] 삭제 완료: ${maskUuid(target.id)} | ${maskEmail(target.email)}`);
  }

  const remaining = await listQaAuthUsers(adminClient);
  console.log(`[CLEANUP] 삭제 후 잔여 QA 계정 수: ${remaining.length}`);

  if (remaining.length === 0 && failed.length === 0) {
    deleteManifestIfExists();
    console.log("QA_SEED_CLEANUP_COMPLETE");
    return;
  }

  console.log(`[CLEANUP] 부분 실패 ${failed.length}건, 잔여 ${remaining.length}건`);
  console.log("QA_SEED_CLEANUP_PARTIAL");
  throw new GuardError("cleanup 일부 실패", 5);
}

// ────────────────────────────────────────────────────────────
// 14. main
// ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  if (parsed.unknown) {
    console.error(`[오류] 알 수 없는 모드: ${parsed.rawArg}`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  if (parsed.mode === "help") {
    printHelp();
    process.exitCode = 0;
    return;
  }

  const config = loadConfig(parsed.mode);

  if (parsed.mode === "dry-run") {
    runDryRun(config);
    process.exitCode = 0;
    return;
  }

  if (parsed.mode === "verify") {
    const verifyOutcome = await runVerify(config);
    process.exitCode = verifyOutcome === "pass" ? 0 : 4;
    return;
  }

  if (parsed.mode === "apply") {
    await runApply(config);
    process.exitCode = 0;
    return;
  }

  if (parsed.mode === "cleanup") {
    await runCleanup(config);
    process.exitCode = 0;
    return;
  }

  if (parsed.mode === "apply-missing") {
    await runApplyMissing(config);
    process.exitCode = 0;
    return;
  }
}

main().catch((err: unknown) => {
  if (err instanceof GuardError) {
    console.error(err.message);
    process.exitCode = err.code;
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[치명적 오류] ${message}`);
  console.error("민감정보(key/password/token)는 이 오류 메시지에 포함되지 않습니다.");
  process.exitCode = 3;
});
