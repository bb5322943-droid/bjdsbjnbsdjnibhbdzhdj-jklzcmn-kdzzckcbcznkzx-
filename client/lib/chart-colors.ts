/**
 * Grafiklar uchun yagona rang manbai.
 *
 * Bu qiymatlar taxmin bilan emas, validator bilan tanlangan (OKLab ΔE, CVD
 * simulyatsiyasi, kontrast). Sirt — kartochkalarning oq foni (#ffffff).
 * Rangni o'zgartirishdan oldin validatordan qayta o'tkazing, aks holda
 * rang ko'rlikda ajralmaydigan juftlik paydo bo'lishi mumkin.
 *
 * Tekshirilgan natijalar:
 *  - Kategoriyali 4 slot (barcha juftlar): eng yomon CVD ΔE 13.0, normal ΔE 19.6 — PASS
 *  - Kirim/chiqim juftligi: CVD ΔE 24.7, normal ΔE 33.6, ikkalasi ≥3:1 — PASS
 *  - Voronka ordinal ramp: monoton yorug'lik, bitta ohang (3°) — PASS
 *
 * Eslatma: yashil↔to'q sariq juftligi sinovdan o'tmadi (protanopiya ΔE 3.2 —
 * rang ko'rlikda deyarli bir xil), shuning uchun kirim/chiqim ko'k↔to'q sariq.
 */

/** Ikki seriyali grafiklar: kirim va chiqim. */
export const SERIES = {
  income: "#2a78d6",
  expense: "#eb6834",
} as const;

/**
 * Kategoriyali slotlar — qat'iy tartibda beriladi, hech qachon aylantirilmaydi.
 * To'rttadan ortiq toifa bo'lsa qolgani `OTHER` ostiga yig'iladi.
 */
export const CATEGORICAL = ["#2a78d6", "#008300", "#e87ba4", "#eda100"] as const;

/** "Boshqa" — neytral kulrang, hech qachon toifa rangi sifatida ishlatilmaydi. */
export const OTHER = "#898781";

/**
 * Tartiblangan bosqichlar uchun (voronka, darajalar) — bitta ohang, light→dark.
 * Eng ochiq qadam sirtdan ajralib turishi uchun 250-qadamdan boshlanadi.
 */
export const ORDINAL = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"] as const;

/** Grafik chrome'i — setka, o'q va matn. Seriya ranglaridan alohida turadi. */
export const CHROME = {
  gridline: "#e1e0d9",
  axis: "#c3c2b7",
  muted: "#898781",
} as const;

/**
 * Kategoriya ro'yxatini rangli bo'laklarga aylantiradi: eng yiriklari alohida,
 * qolgani bitta "Boshqa" bo'lagiga qo'shiladi.
 *
 * Tail'ni tashlab yuborish o'rniga yig'ish muhim — aks holda diagramma
 * butunning bir qismini ko'rsatib, o'zini butun deb ko'rsatadi.
 */
export function toSegments<T>(
  rows: T[],
  getLabel: (row: T) => string,
  getValue: (row: T) => number,
  otherLabel = "Boshqa",
): { label: string; value: number; color: string }[] {
  const sorted = [...rows]
    .map((row) => ({ label: getLabel(row), value: getValue(row) }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const head = sorted.slice(0, CATEGORICAL.length).map((row, index) => ({
    ...row,
    color: CATEGORICAL[index],
  }));

  const tail = sorted.slice(CATEGORICAL.length);
  if (tail.length === 0) return head;

  return [
    ...head,
    {
      label: otherLabel,
      value: tail.reduce((sum, row) => sum + row.value, 0),
      color: OTHER,
    },
  ];
}
