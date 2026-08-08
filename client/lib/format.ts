/** Barcha sahifalarda bir xil formatlash uchun yagona manba. */

// Vergul bilan ajratish: 1000000 → "1,000,000" (loyiha bo'ylab yagona pul formati).
const numberFormat = new Intl.NumberFormat("en-US");

/** 38450000 → "38,450,000" */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** 38450000 → "38,450,000 so'm" */
export function formatCurrency(value: number): string {
  return `${numberFormat.format(Math.round(value))} so'm`;
}

/** Raqamlar ketma-ketligini pul ko'rinishida ajratadi: "1000000" → "1,000,000". */
export function groupDigits(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  return clean ? numberFormat.format(Number(clean)) : "";
}

/**
 * Katta summalarni qisqartiradi: 38450000 → "38,5 mln".
 * Kartochkalardagi joy tor bo'lgani uchun ishlatiladi.
 */
export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${round(value / 1_000_000_000)} mlrd`;
  if (abs >= 1_000_000) return `${round(value / 1_000_000)} mln`;
  if (abs >= 1_000) return `${round(value / 1_000)} ming`;
  return numberFormat.format(value);
}

function round(value: number): string {
  return new Intl.NumberFormat("uz-UZ", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/** Manfiy qiymatda ham to'g'ri ishora qo'yadi: 12.6 → "+12,6%", -3 → "−3%" */
export function formatPercentChange(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const formatted = new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 1,
  }).format(Math.abs(value));
  return `${sign}${formatted}%`;
}

const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

/** "2026-07-17T14:30:00Z" → "14:30" */
export function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "2026-07-17" → "17 iyul, 2026" */
export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}

/** "2026-07-17" → "17 iyul" — jadval ustunlari tor bo'lganda. */
export function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/**
 * Kun raqamini ("05") joriy oy nomi bilan birlashtiradi: "5-iyul".
 * Kunlik grafik joriy oyga tegishli bo'lgani uchun oy `new Date()` dan olinadi.
 */
export function formatMonthDay(dayLabel: string): string {
  const day = Number.parseInt(dayLabel, 10);
  const monthName = MONTHS[new Date().getMonth()];
  if (Number.isNaN(day)) return dayLabel;
  return `${day}-${monthName}`;
}

/** Nisbiy vaqt, o'zbek tilida: "8 daqiqa oldin". */
export function formatTimeAgo(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Noma'lum vaqt";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "hozirgina";

  const units: [number, string][] = [
    [60, "daqiqa"],
    [60, "soat"],
    [24, "kun"],
    [30, "oy"],
    [12, "yil"],
  ];

  let amount = seconds;
  let label = "soniya";
  for (const [divisor, name] of units) {
    if (amount < divisor) break;
    amount = Math.floor(amount / divisor);
    label = name;
  }

  return `${amount} ${label} oldin`;
}

/** Bugungi sana, <input type="date"> uchun. */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// --------------------------------------------------------------- Telefon

/**
 * O'zbek telefon raqamini ko'rsatish uchun formatlaydi:
 * "+998901234567" yoki "901234567" → "+998 90 123 45 67".
 * Faqat raqamlar hisobga olinadi, boshqa belgilar tashlab yuboriladi.
 */
export function formatUzPhone(raw: string): string {
  const national = nationalDigits(raw);
  if (!national) return "";
  const groups = [
    national.slice(0, 2),
    national.slice(2, 5),
    national.slice(5, 7),
    national.slice(7, 9),
  ].filter(Boolean);
  return `+998 ${groups.join(" ")}`;
}

/** Saqlash uchun normal ko'rinish: "+998901234567" yoki bo'sh bo'lsa "". */
export function normalizeUzPhone(raw: string): string {
  const national = nationalDigits(raw);
  return national ? `+998${national}` : "";
}

/** +998 kod va ortiqcha belgilardan tozalangan 9 xonali milliy qism. */
function nationalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  return digits.slice(0, 9);
}
