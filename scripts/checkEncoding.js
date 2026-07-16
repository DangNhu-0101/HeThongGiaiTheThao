const fs = require("fs");
const path = require("path");

const root = process.cwd();
const scanRoots = ["frontend/src", "backend/src", "backend/src/config", "backend/config"]
  .map((item) => path.join(root, item))
  .filter((item) => fs.existsSync(item));
const ignoredDirs = new Set(["node_modules", "dist", "build", ".git", "uploads", "coverage"]);
const textExt = new Set([".js", ".jsx", ".ts", ".tsx", ".json", ".css", ".html", ".md", ".env"]);
const banned = [
  "T\u00C3\u00A1\u00C2\u00BB", "h\u00C3\u00A1\u00C2\u00BB", "gi\u00C3\u00A1\u00C2\u00BA",
  "\u00C3", "\u00C4", "\u00C3\u00A1\u00C2\u00BB", "\u00C3\u00A1\u00C2\u00BA", "\u00C3\u0082\u00C2\u00B7",
  "s?n", "gi?i", "v?n", "??u", "kh?ng",
];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const fullPath = path.join(dir, entry.name);
  if (entry.isDirectory()) return ignoredDirs.has(entry.name) ? [] : walk(fullPath);
  return textExt.has(path.extname(entry.name)) ? [fullPath] : [];
});

const offenders = [];
for (const file of Array.from(new Set(scanRoots.flatMap(walk)))) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    const hit = banned.find((pattern) => line.includes(pattern));
    if (hit) offenders.push({ file, line: index + 1, hit, text: line.trim().slice(0, 220) });
  });
}

if (offenders.length) {
  console.error("Encoding check failed. Mojibake or banned text found:");
  offenders.slice(0, 200).forEach((item) => {
    console.error(`${path.relative(root, item.file)}:${item.line} [${item.hit}] ${item.text}`);
  });
  if (offenders.length > 200) console.error(`...and ${offenders.length - 200} more`);
  process.exit(1);
}

console.log("Encoding check passed.");
