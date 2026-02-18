function lower(value) {
  return String(value || "").trim().toLowerCase();
}

export function statusColor(status) {
  const s = lower(status);
  if (s === "todo") return "yellow";
  if (s === "open") return "cyan";
  if (s === "ready") return "blue";
  if (s === "in_progress") return "magenta";
  if (s === "blocked") return "red";
  if (s === "done" || s === "completed") return "green";
  if (s === "archived" || s === "cancelled") return "dim";
  return "magenta";
}

export function statusTag(status) {
  return `[${String(status || "open")}]`;
}

export function directiveListLabel(item) {
  return `${statusTag(item && item.status)} ${String((item && item.title) || "").trim()}`;
}

export function taskListLabel(item) {
  return `${statusTag(item && item.task_status)} ${String((item && item.task_title) || "").trim()}`;
}

export function formatNumberedListRow(item, index, extras = []) {
  const idx = Number(index) + 1;
  const status = statusTag(item && item.status);
  const title = String((item && item.title) || "").trim();
  const extraParts = [];
  for (const key of extras) {
    const value = item && Object.prototype.hasOwnProperty.call(item, key) ? item[key] : undefined;
    if (value === undefined || value === null || String(value).trim() === "") continue;
    extraParts.push(`${key}=${String(value)}`);
  }
  const base = `${idx}) ${status} ${title}`;
  return extraParts.length > 0 ? `${base} | ${extraParts.join(" | ")}` : base;
}

