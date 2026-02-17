import { createInterface, emitKeypressEvents } from "node:readline";

const COLOR_CODES = {
  dim: "2",
  red: "31",
  green: "32",
  yellow: "33",
  blue: "34",
  magenta: "35",
  cyan: "36",
};

function supportsInteractiveMenu(input, output) {
  return Boolean(input && output && input.isTTY && output.isTTY && !process.env.NO_COLOR);
}

function color(text, code) {
  if (process.env.NO_COLOR) return text;
  const resolved = COLOR_CODES[String(code || "").trim()] || String(code || "0");
  return `\x1b[${resolved}m${text}\x1b[0m`;
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

function clearMenu(lines, output) {
  if (lines <= 0) return;
  output.write("\x1b[0G");
  for (let i = 0; i < lines; i += 1) {
    output.write("\x1b[2K");
    if (i < lines - 1) output.write("\x1b[1A");
  }
  output.write("\x1b[0G");
}

function truncateToColumns(input, maxCols) {
  const plain = stripAnsi(String(input || ""));
  const limit = Math.max(8, Number(maxCols || 80));
  if (plain.length <= limit) return plain;
  return `${plain.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

function renderMenu(label, options, selected, columns) {
  const out = [label];
  const cols = Math.max(40, Number(columns || 80));
  const labelMax = Math.max(10, cols - 10);
  for (let i = 0; i < options.length; i += 1) {
    const prefix = i === selected ? color("❯", "32") : " ";
    const idx = color(`${i + 1})`, "33");
    const plain = truncateToColumns(options[i].label, labelMax);
    const styled = i === selected
      ? color(plain, "36")
      : (options[i].color ? color(plain, options[i].color) : plain);
    const text = styled;
    out.push(`${prefix} ${idx} ${text}`);
  }
  return out.join("\n");
}

function renderMultiMenu(label, options, selected, toggled, columns) {
  const submitIndex = options.length;
  const out = [label, color("Enter/x: toggle item  Enter on submit: apply  Esc/Ctrl+C: cancel", "2")];
  const cols = Math.max(40, Number(columns || 80));
  const labelMax = Math.max(10, cols - 14);
  for (let i = 0; i <= submitIndex; i += 1) {
    if (i === submitIndex) {
      const cursor = i === selected ? color("❯", "32") : " ";
      const idx = color(`${i + 1})`, "33");
      const count = toggled.size;
      const submitText = count > 0 ? `Submit selection (${count} selected)` : "Submit selection";
      const text = i === selected ? color(submitText, "36") : color(submitText, "green");
      out.push(`${cursor} ${idx} ${text}`);
      continue;
    }
    const cursor = i === selected ? color("❯", "32") : " ";
    const idx = color(`${i + 1})`, "33");
    const mark = toggled.has(i) ? color("[x]", "32") : color("[ ]", "2");
    const plain = truncateToColumns(options[i].label, labelMax);
    const text = i === selected ? color(plain, "36") : plain;
    out.push(`${cursor} ${idx} ${mark} ${text}`);
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
      clearMenu(lines, output);
      const frame = renderMenu(label, options, selected, output.columns);
      output.write(`${frame}\n`);
      // +1 for the trailing cursor line after printing '\n'
      lines = countRenderedLines(frame, output.columns) + 1;
    }
    function cleanup() {
      input.removeListener("keypress", onKeypress);
      clearMenu(lines, output);
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

export async function selectMultiOption({ input, output, label, options, defaultSelectedValues = [] }) {
  if (!Array.isArray(options) || options.length === 0) return [];
  const selectedFromDefaults = new Set(
    options
      .map((opt, idx) => ({ opt, idx }))
      .filter(({ opt }) => defaultSelectedValues.includes(opt.value))
      .map(({ idx }) => idx),
  );

  if (!supportsInteractiveMenu(input, output)) {
    const rl = createInterface({ input, output });
    try {
      output.write(`${label}\n`);
      for (let i = 0; i < options.length; i += 1) {
        output.write(`  ${i + 1}) ${options[i].label}\n`);
      }
      const answer = String(await rl.question("Select one or more numbers (comma-separated, blank=none): ")).trim();
      if (!answer) return [];
      const picked = Array.from(new Set(
        answer.split(",").map((s) => Number(String(s).trim()) - 1).filter((n) => Number.isInteger(n) && n >= 0 && n < options.length),
      ));
      return picked.map((idx) => options[idx].value);
    } finally {
      rl.close();
    }
  }

  const previousRawMode = typeof input.isRaw === "boolean" ? input.isRaw : false;
  let cursor = 0;
  const toggled = new Set(selectedFromDefaults);
  const submitIndex = options.length;
  let lines = 0;

  return await new Promise((resolve, reject) => {
    function redraw() {
      clearMenu(lines, output);
      const frame = renderMultiMenu(label, options, cursor, toggled, output.columns);
      output.write(`${frame}\n`);
      // +1 for the trailing cursor line after printing '\n'
      lines = countRenderedLines(frame, output.columns) + 1;
    }
    function cleanup() {
      input.removeListener("keypress", onKeypress);
      clearMenu(lines, output);
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
    function onKeypress(str, key = {}) {
      if (key.name === "up") {
        cursor = cursor > 0 ? cursor - 1 : submitIndex;
        redraw();
        return;
      }
      if (key.name === "down") {
        cursor = cursor < submitIndex ? cursor + 1 : 0;
        redraw();
        return;
      }
      if (key.name === "space" || str === " ") {
        if (cursor === submitIndex) return;
        if (toggled.has(cursor)) toggled.delete(cursor);
        else toggled.add(cursor);
        redraw();
        return;
      }
      if (str === "x" || str === "X") {
        if (cursor === submitIndex) return;
        if (toggled.has(cursor)) toggled.delete(cursor);
        else toggled.add(cursor);
        redraw();
        return;
      }
      if (key.name === "return" || key.name === "enter") {
        if (cursor !== submitIndex) {
          if (toggled.has(cursor)) toggled.delete(cursor);
          else toggled.add(cursor);
          redraw();
          return;
        }
        return done(() => resolve(Array.from(toggled).sort((a, b) => a - b).map((idx) => options[idx].value)));
      }
      if (key.name && /^[1-9]$/.test(key.name)) {
        const idx = Number(key.name) - 1;
        if (idx >= 0 && idx <= submitIndex) {
          cursor = idx;
          if (idx !== submitIndex) {
            if (toggled.has(idx)) toggled.delete(idx);
            else toggled.add(idx);
          }
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
