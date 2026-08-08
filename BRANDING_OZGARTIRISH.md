# 🎨 Loyiha Nomi va Logosini O'zgartirish

## Qisqa Javob ✅

Faqat **bitta fayl**ni tahrirlang:
```
client/config/branding.ts
```

---

## Bosqichma-Bosqich Yo'riqnoma 📋

### 1. Branding Faylini Oching

Faylni topish:
```
fusion-starter-fab/
└── client/
    └── config/
        └── branding.ts  ← Bu faylni oching
```

### 2. Quyidagi Qiymatlarni O'zgartiring

```typescript
export const branding = {
  // ====== ASOSIY NOM ======
  name: "Orbis",                    // ← Bu yerda nomni o'zgartiring
  
  // ====== TAGLINE (Qo'shimcha matn) ======
  tagline: "ERP PLATFORM",          // ← Bu yerda tagline'ni o'zgartiring
  
  // ====== TO'LIQ NOM ======
  fullName: "Orbis ERP",            // ← To'liq nomni o'zgartiring
  
  // ====== WEBSITE ======
  website: "www.orbis-erp.uz",      // ← Website'ni o'zgartiring
  
  // ====== TELEFON ======
  phone: "+998 71 200 00 00",       // ← Telefon raqamni o'zgartiring
  
  // ====== MANZIL ======
  address: {
    city: "Toshkent",
    district: "Yunusobod tumani",
    full: "Toshkent sh., Yunusobod tumani"
  },
  
  // ====== RANGLAR ======
  colors: {
    primary: "#173f38",             // ← Asosiy rangni o'zgartiring
    primaryHover: "#0f312b",        // ← Hover rangni o'zgartiring
    logoBackground: "#173f38",      // ← Logo fon rangini o'zgartiring
    logoText: "#ffffff",            // ← Logo matn rangini o'zgartiring
  },
  
  // ====== LOGO IKONA ======
  logoIcon: "Command",              // ← Lucide ikonasini o'zgartiring
  logoIconSize: 20,                 // ← Ikona o'lchamini o'zgartiring
  logoIconStrokeWidth: 2.5,         // ← Chiziq qalinligini o'zgartiring
}
```

---

## Misol: "TechStore" ga O'zgartirish 🏪

```typescript
export const branding = {
  name: "TechStore",
  tagline: "SAVDO PLATFORMASI",
  fullName: "TechStore Savdo Tizimi",
  website: "www.techstore.uz",
  phone: "+998 90 123 45 67",
  
  address: {
    city: "Samarqand",
    district: "Registon tumani",
    full: "Samarqand sh., Registon tumani, 25-uy"
  },
  
  colors: {
    primary: "#2563eb",        // Ko'k rang
    primaryHover: "#1d4ed8",   // To'q ko'k
    logoBackground: "#2563eb",
    logoText: "#ffffff",
  },
  
  logoIcon: "Store",           // Do'kon ikonasi
  logoIconSize: 20,
  logoIconStrokeWidth: 2.5,
}
```

---

## Logo Ikonasini O'zgartirish 🎯

### Mavjud Ikonalar (Lucide React)

Quyidagi ikonalardan birini tanlang:

```typescript
// Biznes va Savdo
logoIcon: "Store"           // Do'kon
logoIcon: "ShoppingBag"     // Xarid sumkasi
logoIcon: "Package"         // Quti
logoIcon: "TrendingUp"      // O'sish
logoIcon: "BarChart"        // Diagramma

// Texnologiya
logoIcon: "Zap"             // Chaqmoq
logoIcon: "Cpu"             // Protsessor
logoIcon: "Command"         // Komanda (hozirgi)
logoIcon: "Code"            // Kod

// Kompaniya
logoIcon: "Building2"       // Bino
logoIcon: "Home"            // Uy
logoIcon: "Briefcase"       // Portfel
logoIcon: "Award"           // Mukofot

// Boshqa
logoIcon: "Sparkles"        // Yulduzchalar
logoIcon: "Rocket"          // Raketa
logoIcon: "Globe"           // Globus
logoIcon: "Layers"          // Qatlamlar
```

To'liq ro'yxat: https://lucide.dev/icons/

---

## Ranglarni O'zgartirish 🎨

### Ranglar Uchun Kod Olish

1. **Google'da qidiring**: "color picker"
2. Rang tanlang
3. **HEX kod**ni oling (masalan: `#ff5733`)
4. `branding.ts` fayliga joylashtiring

### Ommabop Rang Sxemalari

```typescript
// Yashil (Ekologik)
colors: {
  primary: "#10b981",
  primaryHover: "#059669",
  logoBackground: "#10b981",
  logoText: "#ffffff",
}

// Ko'k (Professional)
colors: {
  primary: "#3b82f6",
  primaryHover: "#2563eb",
  logoBackground: "#3b82f6",
  logoText: "#ffffff",
}

// Binafsha (Zamonaviy)
colors: {
  primary: "#8b5cf6",
  primaryHover: "#7c3aed",
  logoBackground: "#8b5cf6",
  logoText: "#ffffff",
}

// To'q sariq (Energetik)
colors: {
  primary: "#f59e0b",
  primaryHover: "#d97706",
  logoBackground: "#f59e0b",
  logoText: "#ffffff",
}

// Qizil (Ta'sirli)
colors: {
  primary: "#ef4444",
  primaryHover: "#dc2626",
  logoBackground: "#ef4444",
  logoText: "#ffffff",
}
```

---

## O'zgarishlarni Ko'rish 👁️

O'zgarishlar **avtomatik** qo'llaniladi (dev server ishlayotgan bo'lsa):

1. `branding.ts` faylini saqlang (Ctrl+S)
2. Brauzer **avtomatik yangilanadi**
3. Yangi nom va logo ko'rinadi!

Agar ko'rinmasa:
- Sahifani qo'lda yangilang (F5)
- Dev serverni qayta ishga tushiring: `pnpm dev`

---

## Branding Qayerlarda Ishlatiladi? 📍

Quyidagi joylarda avtomatik o'zgaradi:

1. ✅ **Login sahifasi** - logo va nom
2. ✅ **Chap sidebar** - logo va nom  
3. ✅ **Header** - nom (breadcrumb'da)
4. ✅ **POS cheki** - kompaniya nomi va website
5. ✅ **Footer** - copyright matni

---

## POS Chekini Ham O'zgartirish 🧾

POS sahifasida chek chiqarish uchun `client/pages/POS.tsx` faylini yangilash kerak:

### Hozirgi Kod:
```typescript
<div class="company-name">ORBIS ERP</div>
<div>www.orbis-erp.uz</div>
```

### Yangi Kod (branding ishlatadi):
```typescript
<div class="company-name">${branding.fullName.toUpperCase()}</div>
<div>${branding.website}</div>
```

Men buni avtomatik tuzatib beraman? Xohlasangiz aytib qo'ying!

---

## Qisqacha Cheklista ✅

- [ ] `client/config/branding.ts` faylini oching
- [ ] `name` ni o'zgartiring
- [ ] `tagline` ni o'zgartiring  
- [ ] `fullName` ni o'zgartiring
- [ ] `website` ni o'zgartiring
- [ ] `phone` ni o'zgartiring
- [ ] `colors.primary` ni o'zgartiring
- [ ] `logoIcon` ni o'zgartiring (ixtiyoriy)
- [ ] Faylni saqlang (Ctrl+S)
- [ ] Brauzerda natijani ko'ring!

---

## Yordam Kerakmi? 🆘

Agar savol bo'lsa, menga ayting:
- Qanday nom qo'ymoqchisiz?
- Qanday rang istaysiz?
- Qanday ikona kerak?

Men sizga to'liq kod yozib beraman! 🚀
