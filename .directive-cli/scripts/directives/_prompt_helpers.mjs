import { createInterface, emitKeypressEvents } from "node:readline";

function supportsInteractiveMenu(input, output) {
  return Boolean(input && output && input.isTTY && output.isTTY && !process.env.NO_COLOR);
}

function color(text, code) {
  if (process.env.NO_COLOR) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

function stripAnsi(input) {
  return String(input || "").replace(/\x1B\[[0-9;]*m/g, "");
}

function countRenderedLines(text, columns) {
  const cols = Math.max(20, Number(columns || 80));
  return String(text || "")
    .split("\n")
    .reduce((sum, line) => {
      const width = stripAnsi(line).length;
      return sum + Math.max(1, Math.ceil(width / cols));
    }, 0);
}

function clearMenu(lines) {
  if (lines <= 0) return;
  process.stdout.write("\x1b[0G");
  for (let i = 0; i < lines; i += 1) {
    process.stdout.write("\x1b[2K");
    if (i < lines - 1) process.stdout.write("\x1b[1A");
  }
  process.stdout.write("\x1b[0G");
}

function renderMenu(label, options, selected) {
  const out = [label];
  for (let i = 0; i < options.length; i += 1) {
    const prefix = i === selected ? color("❯", "32") : " ";
    const idx = color(`${i + 1})`, "33");
    const text = i === selected ? color(options[i].label, "36") : options[i].label;
    out.push(`${prefix} ${idx} ${text}`);
  }
  return out.join("\n");
}

export async function selectOption({ input, output, label, options, defaultIndex = 0 }) {
  if (!Array.isArray(options) || options.length === 0) throw new Error("selectOption requires non-empty options");
  const safeDefault = Math.max(0, Math.min(defaultIndex, options.length - 1));

  if (!supportsInteractiveMenu(input, output)) {
    const rl = createInterface({ input, output });
    try {
      output.write(`${label}\n`);
      for (let i = 0; i < options.length; i += 1) {
        output.write(`  ${i + 1}) ${options[i].label}\n`);
      }
      const answer = String(await rl.question(`Select option number [${safeDefault + 1}]: `)).trim();
      const idx = answer ? Number(answer) - 1 : safeDefault;
      if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) throw new Error("Invalid selection.");
      return options[idx].value;
    } finally {
      rl.close();
    }
  }

  const previousRawMode = typeof input.isRaw === "boolean" ? input.isRaw : false;
  let selected = safeDefault;
  let lines = 0;

  return await new Promise((resolve, reject) => {
    function redraw() {
      clearMenu(lines);
      const frame = renderMenu(label, options, selected);
      output.write(`${frame}\n`);
      lines = countRenderedLines(frame, output.columns);
    }
    function cleanup() {
      input.removeListener("keypress", onKeypress);
      clearMenu(lines);
      lines = 0;
      try {
        input.setRawMode(previousRawMode);
      } catch {
        // noop
      }
    }
    function done(fn) {
      cleanup();
      fn();
    }
    function onKeypress(_str, key = {}) {
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
        return done(() => resolve(options[selected].value));
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
        return done(() => reject(new Error("Selection cancelled.")));
      }
    }

    try {
      emitKeypressEvents(input);
      input.setRawMode(true);
      input.resume();
      input.on("keypress", onKeypress);
      redraw();
    } catch (error) {
      done(() => reject(error));
    }
  });
}
