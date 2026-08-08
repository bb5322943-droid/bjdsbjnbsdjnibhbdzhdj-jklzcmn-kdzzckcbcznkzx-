import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentChange,
  formatTimeAgo,
  formatUzPhone,
  groupDigits,
  normalizeUzPhone,
} from "./format";

afterEach(() => {
  vi.useRealTimers();
});

describe("formatPercentChange", () => {
  it("musbat qiymatga + qo'yadi", () => {
    expect(formatPercentChange(12.6)).toBe("+12,6%");
  });

  it("manfiy qiymatga minus belgisi qo'yadi", () => {
    expect(formatPercentChange(-3)).toBe("−3%");
  });

  it("nolda ishorasiz qaytaradi", () => {
    expect(formatPercentChange(0)).toBe("0%");
  });
});

describe("formatNumber va formatCurrency", () => {
  it("mingliklarni vergul bilan ajratadi", () => {
    expect(formatNumber(1_000_000)).toBe("1,000,000");
    expect(formatNumber(38_450_000)).toBe("38,450,000");
  });

  it("valyutaga so'm qo'shadi va yaxlitlaydi", () => {
    expect(formatCurrency(1_000_000)).toBe("1,000,000 so'm");
    expect(formatCurrency(1234.6)).toBe("1,235 so'm");
  });
});

describe("groupDigits", () => {
  it("xom raqamlarni vergul bilan ajratadi", () => {
    expect(groupDigits("1000000")).toBe("1,000,000");
  });

  it("raqam bo'lmagan belgilarni tashlab yuboradi", () => {
    expect(groupDigits("1a2b3")).toBe("123");
  });

  it("bo'sh satrga bo'sh natija qaytaradi", () => {
    expect(groupDigits("")).toBe("");
  });
});

describe("telefon formatlash", () => {
  it("milliy 9 xonani niqob bilan ko'rsatadi", () => {
    expect(formatUzPhone("901234567")).toBe("+998 90 123 45 67");
  });

  it("+998 kodli raqamni ham to'g'ri ajratadi", () => {
    expect(formatUzPhone("+998901234567")).toBe("+998 90 123 45 67");
  });

  it("raqam bo'lmagan belgilarni e'tiborsiz qoldiradi", () => {
    expect(formatUzPhone("abc90-12")).toBe("+998 90 12");
  });

  it("bo'sh qiymatda bo'sh satr qaytaradi", () => {
    expect(formatUzPhone("")).toBe("");
  });

  it("saqlash uchun normal ko'rinishga keltiradi", () => {
    expect(normalizeUzPhone("+998 90 123 45 67")).toBe("+998901234567");
    expect(normalizeUzPhone("")).toBe("");
  });
});

describe("formatCompactCurrency", () => {
  it("millionni qisqartiradi", () => {
    expect(formatCompactCurrency(38_450_000)).toBe("38,5 mln");
  });

  it("milliardni qisqartiradi", () => {
    expect(formatCompactCurrency(2_400_000_000)).toBe("2,4 mlrd");
  });

  it("mingdan kichik sonni qisqartirmaydi", () => {
    expect(formatCompactCurrency(850)).toBe("850");
  });

  it("manfiy summani ham to'g'ri qisqartiradi", () => {
    expect(formatCompactCurrency(-5_000_000)).toBe("-5,0 mln");
  });
});

describe("formatDate", () => {
  it("ISO sanani o'zbekcha ko'rinishga o'giradi", () => {
    expect(formatDate("2026-07-17")).toBe("17 iyul, 2026");
  });

  it("noto'g'ri sanani o'zgartirmasdan qaytaradi", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("formatTimeAgo", () => {
  it("bir daqiqadan kam vaqtni 'hozirgina' deb ko'rsatadi", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));

    expect(formatTimeAgo("2026-07-17T11:59:30Z")).toBe("hozirgina");
  });

  it("daqiqa va soatni to'g'ri hisoblaydi", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));

    expect(formatTimeAgo("2026-07-17T11:52:00Z")).toBe("8 daqiqa oldin");
    expect(formatTimeAgo("2026-07-17T09:00:00Z")).toBe("3 soat oldin");
  });

  it("noto'g'ri sanada xato bermaydi", () => {
    expect(formatTimeAgo("invalid")).toBe("Noma'lum vaqt");
  });
});
