// Warning Label for Humans: one line, printed on every human being.
// The grader runs this file and the sealed scorer reads /output/entry.txt,
// so all this script does is carry the single line from line.txt into
// that file, after proving it obeys the gate: one line, 1-160 characters,
// not only white space. The output is left world-readable (0644) because
// the grader collects it as a different user than the one running here.
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LIMIT = 160;
const HERE = dirname(fileURLToPath(import.meta.url));

function loadLine(): string {
  const raw = readFileSync(join(HERE, "line.txt"), "utf8");
  const clean = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = clean.split("\n").map((part) => part.trim()).filter(Boolean);
  if (lines.length !== 1) {
    throw new Error(`expected exactly one non-empty line in line.txt, found ${lines.length}`);
  }
  return lines[0];
}

function gate(line: string): void {
  const chars = [...line];
  if (chars.length < 1 || chars.length > LIMIT) {
    throw new Error(`entry must be 1-${LIMIT} characters, got ${chars.length}`);
  }
  if (line.trim().length === 0) {
    throw new Error("entry must not be only white space");
  }
  if (/\n/.test(line) || /[\u0000-\u001F]/.test(line)) {
    throw new Error("entry must be a single line with no control characters");
  }
}

function main(): void {
  const line = loadLine();
  gate(line);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, line, "utf8");
  chmodSync(outPath, 0o644);
  console.log(`wrote ${[...line].length} characters to ${outPath}`);
}

main();
