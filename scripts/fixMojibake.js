const fs = require("fs");
const path = require("path");

const root = process.cwd();
const targets = ["frontend/src", "backend/src", "backend/src/config", "backend/config"]
  .map((item) => path.join(root, item));
const ignored = new Set(["node_modules", "dist", "build", ".git", "uploads", "coverage"]);
const textExt = new Set([".js", ".jsx", ".ts", ".tsx", ".json", ".css", ".html", ".md", ".env"]);

const cp1252Reverse = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a],
  [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92],
  [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c],
  [0x017e, 0x9e], [0x0178, 0x9f],
]);

const mojibakeToken = /\S*(?:\u00C3|\u00C4|\u00C6|\u00C2|\u00E1\u00BA|\u00E1\u00BB)\S*/g;

const toByte = (char) => {
  const code = char.codePointAt(0);
  if (code <= 0xff) return code;
  return cp1252Reverse.get(code);
};

const decodeToken = (token) => {
  const bytes = [];
  for (const char of token) {
    const byte = toByte(char);
    if (byte === undefined) return token;
    bytes.push(byte);
  }
  const decoded = Buffer.from(bytes).toString("utf8");
  return decoded.includes("\uFFFD") ? token : decoded;
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return ignored.has(entry.name) ? [] : walk(fullPath);
    return textExt.has(path.extname(entry.name)) ? [fullPath] : [];
  });
};

let changed = 0;
for (const file of Array.from(new Set(targets.flatMap(walk)))) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(mojibakeToken, decodeToken).replace(/\u00C2\u00B7/g, "\u00B7");
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed += 1;
    console.log(`fixed ${path.relative(root, file)}`);
  }
}

console.log(`Done. Changed ${changed} file(s).`);
