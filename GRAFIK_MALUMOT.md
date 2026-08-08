# 📊 Avgust Oyi Uchun Grafik Ma'lumotlari

## Hozirgi Holat ✅

Sizning loyihangizda **backend avtomatik ravishda avgust oyi uchun ma'lumotlar yaratadi**:

### Backend Ishlash Mexanizmi

1. **`buildTransactions()` funksiyasi** (server/data/seed.ts):
   - Joriy oy = **Avgust 2026** (1-31 avgust)
   - O'tgan oy = **Iyul 2026** (taqqoslash uchun)

2. **Har bir kun uchun tranzaksiyalar**:
   - **Kirim** (income): ~22 ta tranzaksiya/oy, har biri 8-55 million so'm
   - **Chiqim** (expense): ~18 ta tranzaksiya/oy, har biri turli kategoriyalar bo'yicha
   - **Ish haqi**: Oyning 10-sanasida yirik to'lov

3. **Scale koeffitsiyenti**:
   - Avgust oy: **1.2** (oshirilgan hajm)
   - Iyul oy: **0.85** (past hajm - statistikada o'sish ko'rinishi uchun)

## Ma'lumotlarni Ko'rish 👁️

### 1. Brauzerda Ko'rish
1. `http://localhost:8081/` ni oching
2. Login qiling: **sardor** / **Orbis2026!**
3. Dashboard sahifasida **"Daromad va xarajatlar"** grafigini ko'ring

### 2. Grafik Dizayni

✅ **Bar (ustun) + Line (chiziq) kombinatsiyasi**
- Har kun uchun **ikkita ustun**: ko'k (kirim) va to'q sariq (chiqim)
- Ustunlar ustida **ikkita chiziq** trend chizig'i
- Chiziqlar ustida **interaktiv nuqtalar**
- Hover qilganda **tooltipda** ko'rsatiladi:
  - Sana (avgust formati)
  - Kirim summasi
  - Chiqim summasi
  - **Sof foyda** (kirim - chiqim) - yashil/qizil rang bilan

### 3. Real Ma'lumotlar

Backend har safar ishga tushganda **avtomatik yangilanadi**:
- Joriy oy avgust bo'lgani uchun, avgust 1-31 kunlar uchun ma'lumotlar yaratiladi
- Ma'lumotlar **deterministik** (har safar bir xil seed bilan)
- `revenueTrend()` API endpoint `/api/revenue-trend` orqali ma'lumotlarni beradi

## Grafik Xususiyatlari 🎨

### Interaktiv Elementlar
- ✅ Hover animatsiyasi
- ✅ Tooltip ko'rsatish
- ✅ Dot (nuqta) kattalashtirish
- ✅ Vertikal chiziq hover paytida

### Dizayn
- ✅ Gradient to'ldirish (ustunlarda)
- ✅ Solid chiziqlar (trend uchun)
- ✅ Grid lines (o'qish uchun qulay)
- ✅ X va Y o'qi belgilari
- ✅ Legenda (kirim/chiqim ranglari)

### Raqamlar Formati
- ✅ `150,000,000 so'm` - vergul ajratgich bilan
- ✅ `5-avgust` - sana formati
- ✅ Foiz o'zgarishi: `+12.6%` yoki `−3.4%`

## Agar Real Ma'lumot Kiritmoqchi Bo'lsangiz 📝

### Variant 1: Seed Faylini Tahrirlash
`server/data/seed.ts` faylida `buildMonth()` funksiyasini o'zgartiring:

```typescript
// Aynan siz aytgan raqamlarni qo'shish
const augustData = [
  { date: "2026-08-01", income: 150000, expense: 50000 },
  { date: "2026-08-02", income: 200000, expense: 80000 },
  { date: "2026-08-03", income: 0, expense: 30000 },
  // ... 31 kungacha
];
```

### Variant 2: API orqali Qo'shish
`POST /api/transactions` endpoint orqali yangi tranzaksiya qo'shing.

### Variant 3: CSV Import
Excel/CSV fayldan import qilish funksiyasini qo'shamiz (kerak bo'lsa).

## Test Qilish 🧪

1. **Dev server ishlayotganligini tekshiring**:
   ```
   pnpm dev
   ```

2. **Brauzerda ochish**:
   ```
   http://localhost:8081/
   ```

3. **Login**:
   - Username: `sardor`
   - Password: `Orbis2026!`

4. **Dashboard'ni ko'ring**:
   - Grafikda avgust kunlari ko'rinishi kerak
   - Hover qilganda tooltip chiqishi kerak
   - Bar va line kombinatsiyasi ko'rinishi kerak

## Xulosa 🎯

✅ Backend tayyor va ishlayapti
✅ Grafik komponenti yangilangan
✅ Ma'lumotlar avtomatik generatsiya qilinadi
✅ Professional dizayn (bar + line)
✅ Tooltip'da sof foyda hisobi

**Keyingi qadam**: Brauzerda natijani ko'ring va agar real ma'lumot kerak bo'lsa, menga ayting - qo'shaman! 🚀
