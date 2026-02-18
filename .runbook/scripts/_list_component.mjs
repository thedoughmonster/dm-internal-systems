import { createInterface, emitKeypressEvents } from "node:readline";

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  bgGray: "\x1b[100;97m",
};

function useColor() {
  return process.stdout.isTTY && !process.env.NO_COLOR;
}

function colorize(text, color) {
  if (!useColor() || !COLORS[color]) return String(text || "");
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function stripAnsi(text) {
  return String(text || "").replace(/\x1B\[[0-9;]*m/g, "");
}

function clearLines(output, lines) {
  if (!lines) return;
  output.write("\x1b[0G");
  for (let i = 0; i < lines; i += 1) {
    output.write("\x1b[2K");
    if (i < lines - 1) output.write("\x1b[1A");
  }
  output.write("\x1b[0G");
}

function lineCount(frame, columns) {
  const cols = Math.max(40, Number(columns || 80));
  return String(frame || "")
    .split("\n")
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(stripAnsi(line).length / cols)), 0);
}

function phaseColor(phaseId) {
  const id = String(phaseId || "");
  if (id.startsWith("architect")) return "cyan";
  if (id.includes("closeout")) return "yellow";
  if (id.includes("task")) return "green";
  return "magenta";
}

export function formatPhaseLabel(item) {
  const sub = Array.isArray(item.subphases) && item.subphases.length > 0 ? ` [${item.subphases.join(", ")}]` : "";
  return `${item.id}${sub}`;
}

export function printList({ title, options, output }) {
  const lines = [String(title || "Options:")];
  options.forEach((opt, idx) => {
    const idxText = colorize(`${idx + 1})`, "yellow");
    const label = colorize(opt.label, opt.color || "dim");
    lines.push(`  ${idxText} ${label}`);
  });
  output.write(`${lines.join("\n")}\n`);
}

export async function selectFromList({ input, output, title, options, defaultIndex = 0 }) {
  if (!(input && output && input.isTTY && output.isTTY)) {
    printList({ title, options, output });
    const rl = createInterface({ input, output });
    try {
      const answer = String(await rl.question("Select option number: ")).trim();
      const n = Number(answer);
      if (!Number.isInteger(n) || n < 1 || n > options.length) throw new Error("Invalid selection.");
      return options[n - 1].value;
    } finally {
      rl.close();
    }
  }

  let selected = Math.max(0, Math.min(Number(defaultIndex) || 0, options.length - 1));
  let rendered = 0;
  const previousRaw = Boolean(input.isRaw);

  return await new Promise((resolve, reject) => {
    function frame() {
      const rows = [String(title || "Select option:")];
      options.forEach((opt, idx) => {
        const cursor = idx === selected ? colorize("❯", "green") : " ";
        const idxText = colorize(`${idx + 1})`, "yellow");
        const body = idx === selected
          ? colorize(` ${opt.label} `, "bgGray")
          : colorize(opt.label, opt.color || "dim");
        rows.push(`${cursor} ${idxText} ${body}`);
      });
      return rows.join("\n");
    }

    function redraw() {
      clearLines(output, rendered);
      const text = frame();
      output.write(`${text}\n`);
      rendered = lineCount(text, output.columns) + 1;
    }

    function cleanup() {
      input.removeListener("keypress", onKeypress);
      clearLines(output, rendered);
      rendered = 0;
      try {
        input.setRawMode(previousRaw);
      } catch {
        // noop
      }
    }

    function onKeypress(_s, key = {}) {
      if (key.name === "up") {
        selected = selected > 0 ? selected - 1 : options.length - 1;
        redraw();
        return;
      }
      if (key.name === "down") {
        selected = selected < options.length - 1 ? selected + 1 : 0;
        redraw();
        return;
      }
      if (key.name === "return" || key.name === "enter") {
        const value = options[selected].value;
        cleanup();
        resolve(value);
        return;
      }
      if (key.name && /^[1-9]$/.test(key.name)) {
        const idx = Number(key.name) - 1;
        if (idx >= 0 && idx < options.length) {
          selected = idx;
          redraw();
        }
        return;
      }
      if (key.name === "escape" || (key.ctrl && key.name === "c")) {
        cleanup();
        reject(new Error("Selection cancelled."));
      }
    }

    try {
      emitKeypressEvents(input);
      input.setRawMode(true);
      input.resume();
      input.on("keypress", onKeypress);
      redraw();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

export function toPhaseOptions(phases) {
  return (phases || []).map((phase) => ({
    value: phase.id,
    label: formatPhaseLabel(phase),
    color: phaseColor(phase.id),
  }));
}
