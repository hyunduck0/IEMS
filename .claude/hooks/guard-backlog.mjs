let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  // 도구 이름을 하드코딩한 화이트리스트(Read/Edit/Write 등) 대신, tool_input 안의 어떤 필드든
  // backlog.json을 가리키면 막는다. 새 파일 편집 도구가 추가되거나 필드 이름이 달라져도
  // (file_path가 아닌 path, notebook_path, edits[].file_path 등) 우회되지 않는다.
  function targetsBacklog(value, depth = 0) {
    if (value == null || depth > 4) return false;
    if (typeof value === "string") return value.replace(/\\/g, "/").endsWith("backlog.json");
    if (Array.isArray(value)) return value.some((v) => targetsBacklog(v, depth + 1));
    if (typeof value === "object") return Object.values(value).some((v) => targetsBacklog(v, depth + 1));
    return false;
  }

  if (targetsBacklog(payload.tool_input)) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason:
            "백로그는 tools/backlog.mjs로만 읽고 수정할 수 있습니다. list/set/validate를 쓰세요.",
        },
      })
    );
  }

  process.exit(0);
});
