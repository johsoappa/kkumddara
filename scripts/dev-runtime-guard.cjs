// ====================================================
// dev-runtime-guard.cjs — QA branch PROD 오접속 fail-fast guard
//
// [역할] `npm run dev` 진입점. QA 작업 branch에서 Runtime Identity가
//        명시적으로 QA로 확인된 경우에만 `next dev`를 시작한다.
//        non-QA branch에서는 기존 동작(next dev 그대로 시작)을 보존한다.
//
// [금지] service_role 참조/DB·Auth 호출/PROD API 요청/파일 쓰기/
//        migration/git mutation — 이 스크립트는 local process/env
//        검사와 `next dev` child process 기동만 수행한다.
// ====================================================

const { execFileSync, spawn } = require("child_process");
const path = require("path");

const QA_BRANCH_PREFIX = "goal/dream-map-qa-";
const SUPABASE_PROJECT_REF_REGEX = /^[a-z0-9]{20}$/;

function maskRef(ref) {
  if (!ref) return "(none)";
  return ref.length <= 4 ? "***" : `${ref.slice(0, 4)}***(len:${ref.length})`;
}

function fail(marker, extraLines) {
  console.error(marker);
  if (extraLines) {
    for (const line of extraLines) console.error(line);
  }
  process.exit(1);
}

function getCurrentBranch() {
  try {
    return execFileSync("git", ["branch", "--show-current"], {
      cwd: __dirname + "/..",
      encoding: "utf-8",
    }).trim();
  } catch {
    // git 조회 자체가 실패한 경우 — identity 판별 불가이므로 fail-closed 처리 대상
    // (빈 문자열과 구분하기 위해 null 반환 — 빈 문자열은 detached HEAD의 정상 조회 결과)
    return null;
  }
}

function isHeadOnQaBranchLineage() {
  // detached HEAD일 때 현재 커밋이 QA-prefix 브랜치의 lineage에 포함되는지 확인
  // (QA 작업 브랜치 checkout 상태의 uncommitted 손실은 없음 — 조회만 수행)
  try {
    const output = execFileSync(
      "git",
      ["branch", "--contains", "HEAD", "--format=%(refname:short)"],
      { cwd: __dirname + "/..", encoding: "utf-8" }
    );
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .some((name) => name.startsWith(QA_BRANCH_PREFIX));
  } catch {
    return null;
  }
}

function runQaIdentityGuard() {
  const qaEnvConfirmed = process.env.QA_ENV_CONFIRMED;
  const qaRef = process.env.QA_SUPABASE_PROJECT_REF;
  const prodRef = process.env.PROD_SUPABASE_PROJECT_REF;
  const runtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (qaEnvConfirmed !== "true") {
    fail("DEV_RUNTIME_GUARD_FAIL_QA_ENV_NOT_CONFIRMED");
  }

  if (!qaRef) {
    fail("DEV_RUNTIME_GUARD_FAIL_QA_REF_MISSING");
  }

  if (!runtimeUrl) {
    fail("DEV_RUNTIME_GUARD_FAIL_RUNTIME_URL_MISSING");
  }

  let parsed;
  try {
    parsed = new URL(runtimeUrl);
  } catch {
    fail("DEV_RUNTIME_GUARD_FAIL_URL_INVALID");
    return;
  }

  if (parsed.protocol !== "https:") {
    fail("DEV_RUNTIME_GUARD_FAIL_URL_INVALID");
  }

  const hostMatch = /^([a-z0-9-]+)\.supabase\.co$/i.exec(parsed.hostname);
  if (!hostMatch) {
    fail("DEV_RUNTIME_GUARD_FAIL_URL_INVALID");
    return;
  }

  const runtimeRef = hostMatch[1];
  if (!SUPABASE_PROJECT_REF_REGEX.test(runtimeRef)) {
    fail("DEV_RUNTIME_GUARD_FAIL_URL_INVALID");
  }

  if (prodRef && runtimeRef === prodRef) {
    fail("DEV_RUNTIME_GUARD_FAIL_RUNTIME_POINTS_TO_PROD");
  }

  if (prodRef && qaRef === prodRef) {
    // 설정 오류: QA ref가 PROD ref와 동일 — PROD 오접속과 동일한 위험으로 취급
    fail("DEV_RUNTIME_GUARD_FAIL_RUNTIME_POINTS_TO_PROD");
  }

  if (runtimeRef !== qaRef) {
    fail("DEV_RUNTIME_GUARD_FAIL_RUNTIME_REF_MISMATCH");
  }

  console.log("DEV_RUNTIME_GUARD_QA_IDENTITY_PASS");
  console.log("[dev-runtime-guard] runtime ref (masked):", maskRef(runtimeRef));
}

function startNextDev() {
  const nextBin = require.resolve("next/dist/bin/next");
  const extraArgs = process.argv.slice(2);
  const child = spawn(process.execPath, [nextBin, "dev", ...extraArgs], {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  // Ctrl+C 등 signal을 child에 그대로 전달 — zombie process 방지
  const forwardSignal = (signal) => {
    if (!child.killed) child.kill(signal);
  };
  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });

  child.on("error", (err) => {
    console.error("[dev-runtime-guard] next dev 실행 실패:", err.message);
    process.exit(1);
  });
}

function main() {
  // @next/env — Next.js와 동일한 우선순위로 .env.local 등을 로드
  // (이미 설정된 process.env 값이 항상 우선순위를 가짐 — override 없음)
  const { loadEnvConfig } = require("@next/env");
  loadEnvConfig(path.join(__dirname, ".."), true);

  const branch = getCurrentBranch();

  if (branch === null) {
    fail("DEV_RUNTIME_GUARD_FAIL_BRANCH_LOOKUP_ERROR");
    return;
  }

  let isQaBranch;
  if (branch === "") {
    // detached HEAD — 빈 branch를 자동으로 non-QA 취급하지 않고 lineage로 판별
    const onQaLineage = isHeadOnQaBranchLineage();
    if (onQaLineage === null) {
      fail("DEV_RUNTIME_GUARD_FAIL_DETACHED_HEAD_LINEAGE_UNKNOWN");
      return;
    }
    isQaBranch = onQaLineage;
    if (isQaBranch) {
      console.error(
        "[dev-runtime-guard] detached HEAD on QA branch lineage — enforcing QA Runtime Identity Guard"
      );
    }
  } else {
    isQaBranch = branch.startsWith(QA_BRANCH_PREFIX);
  }

  if (isQaBranch) {
    runQaIdentityGuard();
  }

  startNextDev();
}

main();
