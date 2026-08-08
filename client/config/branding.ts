/**
 * Loyiha brending konfiguratsiyasi
 * 
 * Bu faylda loyiha nomi, logosi, ranglar va boshqa brend elementlarini
 * markazlashtirilgan holda boshqarish mumkin.
 * 
 * O'zgartirish uchun quyidagi qiymatlarni tahrirlang:
 * - name: Kompaniya nomi (sidebar, header, login sahifasida ko'rinadi)
 * - tagline: Qo'shimcha matn (logo ostida ko'rinadi)
 * - logoUrl: Logo rasmi URL (berilsa ikona o'rniga rasm ko'rsatiladi)
 * - colors: Rang sxemasi
 */

export const branding = {
  // ─── Kompaniya ma'lumotlari ──────────────────────────────────
  
  /** Asosiy nom (sidebar, header, login sahifasida ko'rinadi) */
  name: "Orbis",
  
  /** Qo'shimcha matn / tagline (logo ostida ko'rinadi) */
  tagline: "ERP PLATFORM",
  
  /** To'liq nom (footer, chek va hisobotlarda ishlatiladi) */
  fullName: "Orbis ERP",
  
  // ─── Logo sozlamalari ────────────────────────────────────────
  
  /** 
   * Logo rasm URL — berilsa Lucide ikona o'rniga shu rasm ko'rsatiladi.
   * Bo'sh string ("") qoldirilsa, standart ikona ishlatiladi.
   * 
   * Misol: "/logo.png" (public/ papkaga joylashtiring)
   * Misol: "https://example.com/logo.png" (tashqi URL)
   */
  logoUrl: "",
  
  /** Lucide React ikona nomi (faqat logoUrl bo'sh bo'lganda ishlatiladi) */
  logoIcon: "Command" as const,
  
  /** Logo ikona o'lchamlari */
  logoIconSize: 20,
  logoIconStrokeWidth: 2.5,
  
  // ─── Rang sxemasi ────────────────────────────────────────────
  
  colors: {
    /** Asosiy rang (sidebar logo foni, login sahifasi) */
    primary: "#173f38",
    /** Hover holati */
    primaryHover: "#0f312b",
    /** Logo fon rangi */
    logoBackground: "#173f38",
    /** Logo matn rangi */
    logoText: "#ffffff",
  },
  
  // ─── Aloqa ma'lumotlari ──────────────────────────────────────
  
  /** Website URL (chek va footerda ko'rinadi) */
  website: "www.orbis-erp.uz",
  
  /** Telefon raqam (chekda ko'rinadi) */
  phone: "+998 71 200 00 00",
  
  /** Manzil (filiallar uchun) */
  address: {
    city: "Toshkent",
    district: "Yunusobod tumani",
    full: "Toshkent sh., Yunusobod tumani"
  },
} as const;

/** Branding turi — boshqa fayllarda import qilish uchun */
export type Branding = typeof branding;

/**
 * Foydalanish:
 * 
 * import { branding } from '@/config/branding';
 * 
 * // Nom va tagline
 * <h1>{branding.name}</h1>
 * <p>{branding.tagline}</p>
 * 
 * // Logo — rasm yoki ikona
 * {branding.logoUrl 
 *   ? <img src={branding.logoUrl} alt={branding.name} />
 *   : <Command size={branding.logoIconSize} />
 * }
 */
