let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const toolName = payload.tool_name;
  const filePath = (payload.tool_input && payload.tool_input.file_path) || "";
  const isFileTool = ["Read", "Edit", "Write"].includes(toolName);
  const targetsBacklog = filePath.replace(/\\/g, "/").endsWith("backlog.json");

  if (isFileTool && targetsBacklog) {
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
