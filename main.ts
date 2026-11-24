// Warning label for humans: one line, big laugh.
//
// This script carries the single sealed line from line.txt to
// <output>/entry.txt. It is deliberately split into small stages so each
// gate rule can be checked and reported on its own: read the source,
// pick out the one line, check it against the gate, write it out, then
// read the written file back and prove it matches byte for byte.
// The output stays world-readable (0644) because the scorer may collect
// it as a different user.
import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_CHARS = 160;
const SOURCE_FILE = "line.txt";
const TARGET_FILE = "entry.txt";
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

type GateProblem = string;

function readSourceText(): string {
  const raw = readFileSync(join(SCRIPT_DIR, SOURCE_FILE), "utf8");
  return raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function extractSingleLine(text: string): string {
  const candidates = text.split("\n").map((part) => part.trim()).filter((part) => part.length > 0);
  if (candidates.length !== 1) {
    throw new Error(`line.txt must hold exactly one non-empty line, found ${candidates.length}`);
  }
  return candidates[0];
}

function checkGate(line: string): GateProblem[] {
  const problems: GateProblem[] = [];
  const count = [...line].length;
  if (count < 1 || count > MAX_CHARS) {
    problems.push(`length ${count} is outside the 1-${MAX_CHARS} character gate`);
  }
  if (line.trim().length === 0) {
    problems.push("line is only white space");
  }
  if (line.includes("\n") || /[\u0000-\u001F]/.test(line)) {
    problems.push("line must be a single line with no control characters");
  }
  return problems;
}

function resolveOutputDir(): string {
  const configured = process.env.MAKEFUN_OUTPUT_DIR;
  return configured !== undefined && configured !== "" ? configured : "/output";
}

function persistEntry(line: string, outDir: string): string {
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, TARGET_FILE);
  const tmpPath = `${outPath}.tmp-${process.pid}`;
  writeFileSync(tmpPath, line, "utf8");
  renameSync(tmpPath, outPath);
  chmodSync(outPath, 0o644);
  const writtenBack = readFileSync(outPath, "utf8");
  if (writtenBack !== line) {
    throw new Error("read-back check failed: entry.txt does not match the gated line");
  }
  return outPath;
}

function run(): void {
  const line = extractSingleLine(readSourceText());
  const problems = checkGate(line);
  if (problems.length > 0) {
    throw new Error(`gate failed: ${problems.join("; ")}`);
  }
  const outPath = persistEntry(line, resolveOutputDir());
  console.log(`wrote ${[...line].length} characters to ${outPath}`);
}

run();
