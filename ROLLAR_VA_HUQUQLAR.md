# 🔐 ROLLAR VA HUQUQLAR

## Foydalanuvchilar va Parollar

Barcha parollar: **123456**

| Login | Parol | Rol | Izoh |
|-------|-------|-----|------|
| `admin` | 123456 | Administrator | Barcha bo'limlarga to'liq kirish |
| `menejr` | 123456 | Menejr | Ko'p bo'limlarga kirish (Foydalanuvchilardan tashqari) |
| `hisobchi` | 123456 | Hisobchi | Faqat moliya bo'limi |
| `kassir` | 123456 | Kassir | Faqat savdo/kassa bo'limi |

---

## 🎯 Har bir rolning huquqlari

### 1. ADMIN (Administrator)
**Barcha bo'limlarga to'liq kirish va boshqarish**

✅ **Ko'rish va boshqarish:**
- 📊 Boshqaruv paneli
- 💰 Moliya
- 👥 Xodimlar
- 📦 Ombor
- 🤝 CRM (Bitimlar, Mijozlar)
- 🛒 Savdo va Kassa
- 📋 Hisobotlar
- 👤 Foydalanuvchilar
- 📝 Audit jurnali
- 🏢 Filiallar

---

### 2. MENEJR (Manager)
**Ko'p bo'limlarga kirish, lekin ba'zi cheklovlar bor**

✅ **To'liq boshqarish:**
- 📊 Boshqaruv paneli
- 📦 Ombor (Mahsulotlar, Xaridlar, Ta'minotchilar)
- 🤝 CRM (Bitimlar, Buyurtmalar, Mijozlar, Fakturalar, Qarzlar)
- 🛒 Savdo va Kassa
- 📋 Hisobotlar

👁️ **Faqat ko'rish:**
- 💰 Moliya (ma'lumotlarni ko'radi, lekin o'zgartira olmaydi)
- 👥 Xodimlar (ko'radi, lekin o'zgartira olmaydi)

❌ **Kirish yo'q:**
- 👤 Foydalanuvchilar (boshqara olmaydi)
- 📝 Audit jurnali (ko'ra olmaydi)

---

### 3. HISOBCHI (Accountant)
**Faqat moliya bo'limi bilan ishlaydi**

✅ **To'liq boshqarish:**
- 💰 Moliya (tranzaksiyalar, hisoblar, to'lovlar)

👁️ **Faqat ko'rish:**
- 📊 Boshqaruv paneli (umumiy statistika)
- 📋 Hisobotlar (moliya hisobotlari)

❌ **Kirish yo'q:**
- 👥 Xodimlar
- 📦 Ombor
- 🤝 CRM
- 🛒 Savdo
- 👤 Foydalanuvchilar
- 📝 Audit jurnali

---

### 4. KASSIR (Cashier)
**Faqat savdo/kassa bilan ishlaydi**

✅ **To'liq boshqarish:**
- 🛒 Savdo va Kassa (POS tizimi, sotish)

👁️ **Faqat ko'rish:**
- 📋 Hisobotlar (o'z sotuvlari bo'yicha)

❌ **Kirish yo'q:**
- 📊 Boshqaruv paneli
- 💰 Moliya
- 👥 Xodimlar
- 📦 Ombor
- 🤝 CRM
- 👤 Foydalanuvchilar
- 📝 Audit jurnali

---

## 🔄 Sidebar Menyusi

Har bir foydalanuvchi **faqat o'ziga ruxsat berilgan bo'limlarni** ko'radi:

### Admin ko'radigan menyu:
```
Boshqaruv
  - Boshqaruv paneli
  - Moliya

Savdo
  - Sotuv
  - Kassa
  - Buyurtmalar
  - Fakturalar
  - Bitimlar
  - Mijozlar
  - Qarzlar
  - To'lovlar

Ta'minot
  - Ombor
  - Mahsulotlar
  - Xaridlar
  - Ta'minotchilar

Tashkilot
  - Xodimlar
  - Davomat va ta'til
  - Ish haqi
  - Filiallar

Tizim
  - Hisobotlar
  - Foydalanuvchilar
  - Audit jurnali
```

### Kassir ko'radigan menyu (eng sodda):
```
Savdo
  - Sotuv
  - Kassa

Tizim
  - Hisobotlar
```

---

## 🛡️ Xavfsizlik

### Frontend himoya:
- Sidebar'da faqat ruxsat berilgan bo'limlar ko'rsatiladi
- Ruxsat bo'lmagan sahifalarga o'tish urinishida 403 xato

### Backend himoya:
- Har bir API endpoint roli tekshiradi
- GET so'rovlar uchun: "view" huquqi kerak
- POST/PUT/DELETE uchun: "manage" huquqi kerak
- Noto'g'ri so'rovlar 403 Forbidden qaytaradi

---

## 📝 Test Qilish

1. **Admin bilan kirish:**
   ```
   Login: admin
   Parol: 123456
   ```
   Natija: Barcha bo'limlar ko'rinadi

2. **Kassir bilan kirish:**
   ```
   Login: kassir
   Parol: 123456
   ```
   Natija: Faqat "Savdo" va "Hisobotlar" ko'rinadi

3. **Hisobchi bilan kirish:**
   ```
   Login: hisobchi
   Parol: 123456
   ```
   Natija: "Boshqaruv paneli", "Moliya", "Hisobotlar" ko'rinadi

4. **Menejr bilan kirish:**
   ```
   Login: menejr
   Parol: 123456
   ```
   Natija: Ko'p bo'limlar, lekin foydalanuvchilar va audit yo'q

---

## ✅ Yaratilgan: 2026-08-05
## ✅ Status: TO'LIQ KONFIGURATSIYA QILINGAN
