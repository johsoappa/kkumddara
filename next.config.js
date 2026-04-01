/** @type {import('next').NextConfig} */
const { execSync } = require("child_process");

let commitSha = "unknown";
try {
  commitSha = execSync("git rev-parse --short HEAD").toString().trim();
} catch (_) {}

const nextConfig = {
  env: {
    NEXT_PUBLIC_COMMIT_SHA: commitSha,
  },
};

module.exports = nextConfig;
