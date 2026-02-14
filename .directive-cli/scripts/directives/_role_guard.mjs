export function assertExecutorRoleForLifecycle() {
  const role = String(process.env.DC_ROLE || "").trim().toLowerCase();
  if (!role) return;
  if (role === "executor") return;
  throw new Error(`Executor lifecycle command blocked in role '${role}'. Switch to executor role or use architect authoring commands.`);
}

