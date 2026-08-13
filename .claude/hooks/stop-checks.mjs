import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const MAX_LINES = 300;
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const EXCLUDED_DIRS = ["node_modules/", ".next/", ".git/"];

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function run(cmd, args) {
  try {
    const output = execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, output };
  } catch (err) {
    const output = [err.stdout, err.stderr].filter(Boolean).join("\n");
    return { ok: false, output: output || err.message };
  }
}

function listCodeFiles() {
  const result = execFileSync("git", ["ls-files"], { encoding: "utf8" });
  return result
    .split("\n")
    .filter(Boolean)
    .filter((f) => CODE_EXTENSIONS.has(path.extname(f)))
    .filter((f) => !EXCLUDED_DIRS.some((dir) => f.startsWith(dir)));
}

function checkFileLength() {
  const violations = [];
  for (const file of listCodeFiles()) {
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lineCount = content.split("\n").length;
    if (lineCount > MAX_LINES) {
      violations.push(`${file} (${lineCount}줄)`);
    }
  }
  if (violations.length === 0) {
    return { ok: true, output: "300줄을 넘는 코드 파일 없음" };
  }
  return {
    ok: false,
    output: `300줄을 넘는 파일:\n${violations.map((v) => `  - ${v}`).join("\n")}`,
  };
}

function main() {
  const raw = readStdin();
  let payload = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = {};
  }

  if (payload.stop_hook_active) {
    process.exit(0);
  }

  const checks = [
    { name: "lint", run: () => run("npm", ["run", "--silent", "lint"]) },
    { name: "typecheck", run: () => run("npm", ["run", "--silent", "typecheck"]) },
    { name: "build", run: () => run("npm", ["run", "--silent", "build"]) },
    { name: "파일 300줄 제한", run: () => checkFileLength() },
  ];

  const failures = [];
  for (const check of checks) {
    const result = check.run();
    if (!result.ok) {
      failures.push({ name: check.name, output: result.output });
    }
  }

  if (failures.length === 0) {
    process.exit(0);
  }

  const reason = failures
    .map((f) => `## ${f.name} 실패\n${f.output.trim()}`)
    .join("\n\n");

  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason: `응답을 끝내기 전 검사에서 실패했습니다:\n\n${reason}`,
    })
  );
  process.exit(0);
}

main();
