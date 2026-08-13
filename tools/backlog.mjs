import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKLOG_PATH = path.join(__dirname, "..", "backlog.json");

const REQUIRED_FIELDS = [
  "id",
  "status",
  "priority",
  "category",
  "title",
  "summary",
  "where",
  "parent",
  "deps",
  "doc",
  "done_at",
  "note",
];
const ID_PATTERN = /^LB-\d{3}$/;

async function loadBacklog() {
  const raw = await readFile(BACKLOG_PATH, "utf8");
  return JSON.parse(raw);
}

async function saveBacklog(data) {
  await writeFile(BACKLOG_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function cmdList(data) {
  for (const task of data.tasks) {
    console.log(`${task.id}\t${task.status}\t${task.title}`);
  }
}

function cmdShow(data, id) {
  const task = data.tasks.find((t) => t.id === id);
  if (!task) {
    console.error(`거부: id "${id}"를 찾을 수 없습니다.`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(task, null, 2));
}

async function cmdSet(data, id, status) {
  const validStatuses = data.enums?.status ?? [];
  if (!validStatuses.includes(status)) {
    console.error(
      `거부: "${status}"는 유효한 status가 아닙니다. 허용값: ${validStatuses.join(", ")}`
    );
    process.exitCode = 1;
    return;
  }

  const task = data.tasks.find((t) => t.id === id);
  if (!task) {
    console.error(`거부: id "${id}"를 찾을 수 없습니다.`);
    process.exitCode = 1;
    return;
  }

  task.status = status;
  await saveBacklog(data);
  console.log(`${id} -> ${status} 저장 완료`);
}

async function cmdAdd(data, jsonArg) {
  let task;
  try {
    task = JSON.parse(jsonArg);
  } catch {
    console.error("거부: 유효한 JSON이 아닙니다.");
    process.exitCode = 1;
    return;
  }

  if (task.deps === undefined) task.deps = [];
  if (task.done_at === undefined) task.done_at = null;
  if (task.parent === undefined) task.parent = null;
  if (task.doc === undefined) task.doc = null;
  if (task.status === undefined) task.status = "todo";

  if (!Array.isArray(task.deps)) {
    console.error(`거부: deps는 배열이어야 합니다 — 현재값: ${JSON.stringify(task.deps)}`);
    process.exitCode = 1;
    return;
  }

  if (typeof task.id !== "string" || !ID_PATTERN.test(task.id)) {
    console.error(`거부: id 형식이 "LB-숫자3자리"가 아닙니다 — 현재값: ${JSON.stringify(task.id)}`);
    process.exitCode = 1;
    return;
  }
  if (data.tasks.some((t) => t.id === task.id)) {
    console.error(`거부: id "${task.id}"가 이미 존재합니다.`);
    process.exitCode = 1;
    return;
  }

  const enums = data.enums ?? {};
  for (const [field, values] of Object.entries({
    status: enums.status,
    priority: enums.priority,
    category: enums.category,
  })) {
    if (values && !values.includes(task[field])) {
      console.error(`거부: ${field} "${task[field]}"는 허용값(${values.join(", ")})에 없습니다.`);
      process.exitCode = 1;
      return;
    }
  }

  const missing = REQUIRED_FIELDS.filter((f) => !Object.prototype.hasOwnProperty.call(task, f));
  if (missing.length > 0) {
    console.error(`거부: 필수 필드 누락 - ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  data.tasks.push(task);
  await saveBacklog(data);
  console.log(`${task.id} 추가 완료`);
}

function cmdValidate(data) {
  const problems = [];
  const enums = data.enums ?? {};
  const seenIds = new Set();

  data.tasks.forEach((task, index) => {
    const label = task.id ?? `#${index}`;

    for (const field of REQUIRED_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(task, field)) {
        problems.push(`${label}: 필수 필드 "${field}"가 없습니다`);
      }
    }

    if (typeof task.id !== "string" || !ID_PATTERN.test(task.id)) {
      problems.push(
        `${label}: id 형식이 "LB-숫자3자리"가 아닙니다 (예: LB-101) — 현재값: ${JSON.stringify(task.id)}`
      );
    } else if (seenIds.has(task.id)) {
      problems.push(`${label}: id가 중복되었습니다`);
    } else {
      seenIds.add(task.id);
    }

    if (enums.status && !enums.status.includes(task.status)) {
      problems.push(`${label}: status "${task.status}"는 enums.status에 없습니다`);
    }
    if (enums.priority && !enums.priority.includes(task.priority)) {
      problems.push(`${label}: priority "${task.priority}"는 enums.priority에 없습니다`);
    }
    if (enums.category && !enums.category.includes(task.category)) {
      problems.push(`${label}: category "${task.category}"는 enums.category에 없습니다`);
    }
    if (!Array.isArray(task.deps)) {
      problems.push(`${label}: deps는 배열이어야 합니다`);
    }
  });

  if (problems.length === 0) {
    console.log("VALID");
  } else {
    console.log(`INVALID (${problems.length}건)`);
    for (const p of problems) console.log(`- ${p}`);
    process.exitCode = 1;
  }
}

async function main() {
  const [, , command, ...args] = process.argv;
  const data = await loadBacklog();

  switch (command) {
    case "list":
      cmdList(data);
      break;
    case "show": {
      const [id] = args;
      if (!id) {
        console.error("사용법: node tools/backlog.mjs show <id>");
        process.exitCode = 1;
        return;
      }
      cmdShow(data, id);
      break;
    }
    case "set": {
      const [id, status] = args;
      if (!id || !status) {
        console.error("사용법: node tools/backlog.mjs set <id> <status>");
        process.exitCode = 1;
        return;
      }
      await cmdSet(data, id, status);
      break;
    }
    case "validate":
      cmdValidate(data);
      break;
    case "add": {
      const [json] = args;
      if (!json) {
        console.error("사용법: node tools/backlog.mjs add '<task json>'");
        process.exitCode = 1;
        return;
      }
      await cmdAdd(data, json);
      break;
    }
    default:
      console.error("사용법: node tools/backlog.mjs <list|show|set|add|validate>");
      process.exitCode = 1;
  }
}

main();
