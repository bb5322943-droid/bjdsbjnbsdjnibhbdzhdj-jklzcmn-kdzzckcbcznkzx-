# 👥 TEST FOYDALANUVCHILARI

**Yaratilgan sana:** 2026-08-04  
**Maqsad:** Har bir rol uchun test login/parol  
**Parol:** Barcha foydalanuvchilar uchun `123456`

---

## 📋 BARCHA FOYDALANUVCHILAR

| # | Rol | Login | Parol | To'liq ism | Kirish huquqlari |
|---|-----|-------|-------|-----------|------------------|
| 1 | **Admin** | `admin` | `123456` | Sardor Mahmudov | ✅ HAMMASI (to'liq huquq) |
| 2 | **Rahbar** | `rahbar` | `123456` | Aziz Alimov | ✅ Boshqaruv, Moliya, HR, Ombor, Sotuv, Hisobotlar |
| 3 | **Buxgalter** | `buxgalter` | `123456` | Malika Karimova | ✅ Moliya, Qarzlar, Hisobotlar |
| 4 | **Ombor** | `ombor` | `123456` | Jasur Toshmatov | ✅ Ombor, Mahsulotlar, Xaridlar, Ta'minotchilar |
| 5 | **Sotuv** | `sotuv` | `123456` | Dilshod Ergashev | ✅ Sotuv, Buyurtmalar, Mijozlar, Bitimlar |
| 6 | **Kuzatuvchi** | `kuzatuvchi` | `123456` | Nodira Narimanova | ✅ Faqat ko'rish (hech narsa o'zgartira olmaydi) |
| 7 | **Kassir** ⭐ | `kassir` | `123456` | Gulnora Salimova | ✅ Faqat Kassa (POS), To'lovlar |
| 8 | **HR Menejeri** ⭐ | `hr_manager` | `123456` | Sevara Rahimova | ✅ Faqat Xodimlar, Davomat, Ish haqi |

---

## 🔐 KIRISH MA'LUMOTLARI

### 1️⃣ ADMINISTRATOR
```
Login:    admin
Parol:    123456
Rol:      Administrator
Huquqlar: TO'LIQ HUQUQ (barcha modullar)
```

**Nima qila oladi:**
- ✅ Barcha sahifalarni ko'rish va tahrirlash
- ✅ Foydalanuvchilarni boshqarish
- ✅ Tizim sozlamalarini o'zgartirish
- ✅ Audit jurnalini ko'rish
- ✅ Barcha hisobotlar

---

### 2️⃣ RAHBAR
```
Login:    rahbar
Parol:    123456
Rol:      Rahbar (Manager)
Huquqlar: Barcha bo'limlar (users va audit dan tashqari)
```

**Nima qila oladi:**
- ✅ Moliya boshqarish
- ✅ Xodimlar boshqarish
- ✅ Ombor boshqarish
- ✅ Sotuv va buyurtmalar
- ✅ Hisobotlar
- ❌ Foydalanuvchilarni boshqarish (faqat admin)
- ❌ Audit jurnal (faqat admin)

---

### 3️⃣ BUXGALTER
```
Login:    buxgalter
Parol:    123456
Rol:      Buxgalter (Accountant)
Huquqlar: Moliya, Qarzlar, Hisobotlar
```

**Nima qila oladi:**
- ✅ Moliya boshqarish (to'lov, harajat, kirim)
- ✅ Qarzlarni boshqarish
- ✅ Moliyaviy hisobotlar
- ✅ Fakturalar ko'rish
- ⚠️ Sotuv va buyurtmalarni faqat ko'rish (tahrirlash yo'q)
- ❌ Xodimlar, Ombor, Ish haqi

---

### 4️⃣ OMBOR XODIMI
```
Login:    ombor
Parol:    123456
Rol:      Ombor xodimi (Warehouse)
Huquqlar: Ombor, Mahsulotlar, Xaridlar
```

**Nima qila oladi:**
- ✅ Ombor boshqarish (qabul, chiqarish)
- ✅ Mahsulotlar boshqarish
- ✅ Xaridlar boshqarish
- ✅ Ta'minotchilar bilan ishlash
- ⚠️ Sotuv va buyurtmalarni faqat ko'rish
- ❌ Moliya, Xodimlar, Qarzlar

---

### 5️⃣ SOTUV MENEJERI
```
Login:    sotuv
Parol:    123456
Rol:      Sotuv menejeri (Sales)
Huquqlar: Sotuv, Buyurtmalar, Mijozlar, Bitimlar
```

**Nima qila oladi:**
- ✅ Sotuv boshqarish
- ✅ Buyurtmalar yaratish va tahrirlash
- ✅ Mijozlar boshqarish
- ✅ Bitimlar (CRM)
- ✅ Fakturalar yaratish
- ⚠️ Ombor va mahsulotlarni faqat ko'rish
- ❌ Moliya, Xodimlar, Qarzlar

---

### 6️⃣ KUZATUVCHI
```
Login:    kuzatuvchi
Parol:    123456
Rol:      Kuzatuvchi (Viewer)
Huquqlar: FAQAT KO'RISH (hech narsani o'zgartira olmaydi)
```

**Nima qila oladi:**
- ✅ Barcha sahifalarni faqat ko'rish
- ❌ Hech narsani tahrirlash, qo'shish yoki o'chirish yo'q
- 👁️ Faqat kuzatuvchi rejimida

---

### 7️⃣ KASSIR ⭐ YANGI
```
Login:    kassir
Parol:    123456
Rol:      Kassir (Cashier)
Huquqlar: Faqat Kassa (POS) va To'lovlar
```

**Nima qila oladi:**
- ✅ Kassa (POS) da sotuv qilish
- ✅ Chek chop etish
- ✅ O'z to'lovlarini ko'rish
- ✅ Buyurtmalar va mijozlarni ko'rish
- ❌ Moliya, Ombor, Xodimlar, Hisobotlar
- ❌ Narxlarni o'zgartirish
- ❌ Qarzlarni boshqarish

**Ish stsenariyi:**
1. Kirish → Kassa (POS) sahifasi ochiladi
2. Mahsulotlarni tanlash va savatga qo'shish
3. To'lov usulini tanlash (Naqd/Karta/Terminal/Aralash)
4. Savdoni yakunlash va chek chop etish

---

### 8️⃣ HR MENEJERI ⭐ YANGI
```
Login:    hr_manager
Parol:    123456
Rol:      HR Menejeri (HR Manager)
Huquqlar: Faqat Xodimlar, Davomat, Ish haqi
```

**Nima qila oladi:**
- ✅ Xodimlar boshqarish (qo'shish, tahrirlash, o'chirish)
- ✅ Davomat boshqarish (keldi/ketdi, ta'til)
- ✅ Ish haqi hisobi va to'lash
- ✅ HR hisobotlari
- ⚠️ Boshqaruv panelini faqat ko'rish
- ❌ Moliya, Ombor, Sotuv, Qarzlar

**Ish stsenariyi:**
1. Kirish → Xodimlar bo'limi
2. Yangi xodim qo'shish yoki mavjudlarini tahrirlash
3. Davomat belgilash
4. Ish haqi hisoblash va to'lash

---

## 🔒 XAVFSIZLIK

### Parol siyosati:
- ⚠️ Test uchun barcha parollar: `123456`
- 🔐 Production'da: 
  - Minimal 8 ta belgi
  - Katta va kichik harflar
  - Raqamlar va maxsus belgilar
  - Parolni o'zgartirish majburiy

### Sessiya:
- ⏱️ Session timeout: 8 soat
- 🔄 Remember me: 30 kun
- 🚪 Avtomatik logout: faoliyat bo'lmaganda

### Audit:
- 📝 Barcha amallar logga yoziladi
- 👁️ Admin va Rahbar ko'rishi mumkin
- 🕐 Log storage: 1 yil

---

## 📊 ROL MATRITSA

| Modul | Admin | Rahbar | Buxgalter | Ombor | Sotuv | Kuzatuvchi | Kassir | HR Menejeri |
|-------|-------|--------|-----------|-------|-------|------------|--------|-------------|
| Boshqaruv paneli | ✅✏️ | ✅✏️ | ✅👁️ | ❌ | ❌ | ✅👁️ | ❌ | ✅👁️ |
| Moliya | ✅✏️ | ✅✏️ | ✅✏️ | ❌ | ⚠️👁️ | ✅👁️ | ❌ | ❌ |
| Xodimlar | ✅✏️ | ✅✏️ | ❌ | ❌ | ❌ | ✅👁️ | ❌ | ✅✏️ |
| Davomat | ✅✏️ | ✅✏️ | ❌ | ❌ | ❌ | ✅👁️ | ❌ | ✅✏️ |
| Ish haqi | ✅✏️ | ✅✏️ | ❌ | ❌ | ❌ | ✅👁️ | ❌ | ✅✏️ |
| Ombor | ✅✏️ | ✅✏️ | ❌ | ✅✏️ | ⚠️👁️ | ✅👁️ | ❌ | ❌ |
| Mahsulotlar | ✅✏️ | ✅✏️ | ❌ | ✅✏️ | ⚠️👁️ | ✅👁️ | ❌ | ❌ |
| Sotuv | ✅✏️ | ✅✏️ | ⚠️👁️ | ⚠️👁️ | ✅✏️ | ✅👁️ | ✅✏️ | ❌ |
| Kassa (POS) | ✅✏️ | ✅✏️ | ❌ | ❌ | ✅✏️ | ❌ | ✅✏️ | ❌ |
| Buyurtmalar | ✅✏️ | ✅✏️ | ⚠️👁️ | ⚠️👁️ | ✅✏️ | ✅👁️ | ⚠️👁️ | ❌ |
| Fakturalar | ✅✏️ | ✅✏️ | ⚠️👁️ | ❌ | ✅✏️ | ✅👁️ | ❌ | ❌ |
| Mijozlar | ✅✏️ | ✅✏️ | ❌ | ❌ | ✅✏️ | ✅👁️ | ⚠️👁️ | ❌ |
| Qarzlar | ✅✏️ | ✅✏️ | ✅✏️ | ❌ | ⚠️👁️ | ✅👁️ | ❌ | ❌ |
| To'lovlar | ✅✏️ | ✅✏️ | ✅✏️ | ❌ | ⚠️👁️ | ✅👁️ | ⚠️👁️ | ❌ |
| Xaridlar | ✅✏️ | ✅✏️ | ❌ | ✅✏️ | ⚠️👁️ | ✅👁️ | ❌ | ❌ |
| Ta'minotchilar | ✅✏️ | ✅✏️ | ❌ | ✅✏️ | ❌ | ✅👁️ | ❌ | ❌ |
| Hisobotlar | ✅✏️ | ✅✏️ | ✅✏️ | ⚠️👁️ | ⚠️👁️ | ✅👁️ | ⚠️👁️ | ⚠️👁️ |
| Filiallar | ✅✏️ | ✅✏️ | ❌ | ❌ | ❌ | ✅👁️ | ❌ | ❌ |
| Foydalanuvchilar | ✅✏️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit jurnal | ✅✏️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Belgilar:**
- ✅✏️ = To'liq huquq (ko'rish + tahrirlash + o'chirish)
- ⚠️👁️ = Faqat ko'rish
- ❌ = Kirish yo'q

---

## 🧪 TEST SSENARIYLARI

### Kassir testi:
1. `kassir` / `123456` bilan kirish
2. Avtomatik Kassa (POS) sahifasi ochiladi
3. Mahsulot qo'shish va sotuv qilish
4. Naqd/Karta/Aralash to'lov
5. Chek chop etish
6. Boshqa sahifalarga kirish imkoniyati yo'qligini tekshirish

### HR Menejeri testi:
1. `hr_manager` / `123456` bilan kirish
2. Xodimlar bo'limiga o'tish
3. Yangi xodim qo'shish
4. Davomat belgilash
5. Ish haqi hisoblash
6. Moliya va Ombor bo'limiga kirish imkoniyati yo'qligini tekshirish

---

## 📝 IZOHLAR

1. **Kassir roli:**
   - Faqat sotuv qilish uchun
   - Qarzlar yoki to'lovlarni boshqara olmaydi
   - Faqat o'z smenasidagi sotuvlarni ko'radi (keyinchalik)

2. **HR Menejeri roli:**
   - Faqat xodimlar bilan ishlash
   - Moliya yoki sotuv bilan aloqasi yo'q
   - Rahbardan farqli - faqat HR bo'limi

3. **Parollar:**
   - Test uchun oson: `123456`
   - Production'da murakkab parol majburiy
   - Birinchi kirishda parolni o'zgartirish (keyinchalik)

4. **Session:**
   - Cookie-based authentication
   - JWT token (keyinchalik)
   - Remember me funksiyasi

---

**Test yaratilgan:** 2026-08-04  
**Keyingi yangilanish:** Production'dan oldin parollarni o'zgartirish  
**Status:** ✅ TEST UCHUN TAYYOR
