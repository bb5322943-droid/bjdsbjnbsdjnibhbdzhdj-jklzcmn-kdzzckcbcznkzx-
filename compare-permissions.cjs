// Ruxsat matritsalarini solishtiruvchi skript (vaqtinchalik)
// client/lib/permissions.ts va server/lib/permissions.ts dagi MATRIX obyektlarini solishtiradi.
const fs = require("fs");

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function matrixBody(src) {
  const start = src.indexOf("const MATRIX");
  if (start === -1) throw new Error("MATRIX topilmadi");
  const eq = src.indexOf("= {", start);
  const end = src.indexOf("};", start) + 2;
  return src.slice(eq + 2, end);
}

function normalize(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "") // blok izohlar
    .replace(/\/\/.*$/gm, "") // qator izohlar
    .replace(/[\s"']/g, "") // bo'sh joy va qo'shtirnoqlar
    .trim();
}

const a = normalize(matrixBody(read("client/lib/permissions.ts")));
const b = normalize(matrixBody(read("server/lib/permissions.ts")));

if (a === b) {
  console.log("✅ MATRIX OBYEKTI 100% IDENTIKAL — farq yo'q");
  const roles = (a.match(/admin:|manager:|accountant:|cashier:|warehouse:|sales:|viewer:|hr_manager:/g) || []).length;
  console.log("Tekshirilgan rol yozuvlari:", roles);
} else {
  console.log("❌ FARQ BOR");
  let i = 0;
  while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
  console.log("Farq boshlangan joy (belgi #" + i + "):");
  console.log("CLIENT:", JSON.stringify(a.slice(Math.max(0, i - 80), i + 80)));
  console.log("SERVER:", JSON.stringify(b.slice(Math.max(0, i - 80), i + 80)));
}
