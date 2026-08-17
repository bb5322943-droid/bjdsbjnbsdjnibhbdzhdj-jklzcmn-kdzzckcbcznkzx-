# 📘 FUSION ERP - FOYDALANUVCHI QO'LLANMASI

**Versiya:** 1.0.0  
**Sana:** 2026-08-17  
**Til:** O'zbek

---

## 🎯 KIRISH

Fusion ERP - bu kichik va o'rta bizneslar uchun mo'ljallangan to'liq funksional boshqaruv tizimi. Moliya, ombor, xodimlar, mijozlar va yetkazib beruvchilar bilan ishlashning barcha zarur vositalari bitta tizimda.

---

## 🔐 TIZIMGA KIRISH

### Birinchi Marta Kirish

1. **Brauzerda oching:** `https://your-app.vercel.app`

2. **Login ma'lumotlari:**
   - **Email:** `admin@orbiserp.uz`
   - **Parol:** `OrbisAdmin2024!`

3. **Kirish** tugmasini bosing

⚠️ **MUHIM:** Birinchi kirishdan keyin parolni o'zgartiring!

### Parolni O'zgartirish

1. O'ng yuqori burchakdagi **profil** tugmasini bosing
2. **Sozlamalar** → **Parolni o'zgartirish**
3. **Joriy parol:** eski parolni kiriting
4. **Yangi parol:** yangi kuchli parol kiriting
5. **Saqlash** tugmasini bosing

**Kuchli parol talablari:**
- Kamida 8 ta belgi
- 1 katta harf
- 1 kichik harf
- 1 raqam

---

## 🏠 DASHBOARD (BOSH SAHIFA)

Dashboard - bu tizimning markaziy qismi. Bu yerda barcha muhim ma'lumotlar bir joyda ko'rsatiladi.

### Ko'rsatkichlar

1. **Jami Daromad** - ushbu oyda olingan daromad
2. **Xarajatlar** - ushbu oyda qilingan xarajatlar
3. **Foyda** - daromad minus xarajatlar
4. **Sotuvlar** - ushbu oyda amalga oshirilgan sotuvlar soni

### Trend Grafigi

12 oylik daromad va xarajatlar grafigi. Har bir oy ustiga bosganda aniq raqamlar ko'rinadi.

### So'nggi Faoliyat

Tizimda amalga oshirilgan oxirgi 10 ta harakat ro'yxati:
- Yangi mahsulot qo'shilgan
- Sotuv amalga oshirilgan
- To'lov qabul qilingan

### Ogohlantirishlar

- 🔴 **Qizil:** Jiddiy muammo (mahsulot tugagan)
- 🟡 **Sariq:** Diqqat talab etadi (stok kam)
- 🟢 **Yashil:** Hammasi yaxshi

---

## 💰 MOLIYA (FINANCE)

Daromad va xarajatlarni boshqarish moduli.

### Tranzaksiyalar Ro'yxati

**Ko'rish:**
- Moliya → Tranzaksiyalar

**Filter:**
- **Turi:** Daromad / Xarajat
- **Kategoriya:** Sotuv, Ish haqi, Arenda, va h.k.
- **Sana oralig'i:** Boshlanish va tugash sanasi

### Yangi Tranzaksiya Qo'shish

1. **+ Yangi tranzaksiya** tugmasini bosing
2. **Turi:** Daromad yoki Xarajat tanlang
3. **Kategoriya:** To'g'ri kategoriyani tanlang
4. **Miqdor:** Pul miqdorini kiriting
5. **Sana:** Tranzaksiya sanasini tanlang
6. **Izoh:** Qo'shimcha ma'lumot (majburiy emas)
7. **Saqlash**

### Tranzaksiyani Tahrirlash

1. Tranzaksiya ustiga bosing
2. **Tahrirlash** tugmasini bosing
3. Kerakli o'zgarishlarni kiriting
4. **Saqlash**

### Tranzaksiyani O'chirish

1. Tranzaksiya ustiga bosing
2. **O'chirish** tugmasini bosing
3. Tasdiqlash oynasida **Ha** tugmasini bosing

⚠️ **Diqqat:** O'chirilgan tranzaksiyalar arxivga o'tadi, to'liq o'chirilmaydi.

### Hisobot Export Qilish

1. **Export** tugmasini bosing
2. **Format:** Excel / PDF / CSV tanlang
3. **Sana oralig'i:** tanlang
4. **Yuklab olish**

---

## 📦 OMBOR (WAREHOUSE)

Mahsulotlar va stok boshqaruvi.

### Mahsulotlar Ro'yxati

**Ko'rish:**
- Ombor → Mahsulotlar

**Kolonkalar:**
- **Nomi:** Mahsulot nomi
- **SKU:** Mahsulot kodi
- **Kategoriya:** Mahsulot kategoriyasi
- **Soni:** Hozirgi stok
- **Sotish narxi:** Bir dona narxi
- **Xarid narxi:** Bizning xarid narximiz

### Yangi Mahsulot Qo'shish

1. **+ Yangi mahsulot** tugmasini bosing
2. **Nomi:** Mahsulot nomini kiriting
3. **SKU:** Mahsulot kodini kiriting (majburiy emas)
4. **Kategoriya:** Kategoriyani tanlang
5. **Xarid narxi:** Bizning xarid narximiz
6. **Sotish narxi:** Mijozga sotish narxi
7. **Soni:** Dastlabki stok miqdori
8. **O'lchov birligi:** dona / kg / litr / metr
9. **Minimal stok:** Ogohlantirish uchun minimal soni
10. **Yetkazib beruvchi:** Tanlang (majburiy emas)
11. **Izoh:** Qo'shimcha ma'lumot
12. **Saqlash**

### Mahsulot Stokini O'zgartirish

**Qo'shish (Kirim):**
1. Mahsulot ustiga bosing
2. **Stokni sozlash** tugmasini bosing
3. **Turi:** Kirim tanlang
4. **Soni:** Qancha qo'shilayotganini kiriting
5. **Sabab:** Xarid, qaytish, va h.k.
6. **Saqlash**

**Kamaytirish (Chiqim):**
1. Mahsulot ustiga bosing
2. **Stokni sozlash** tugmasini bosing
3. **Turi:** Chiqim tanlang
4. **Soni:** Qancha kamayayotganini kiriting
5. **Sabab:** Sotuv, nosozlik, va h.k.
6. **Saqlash**

### Stok Harakatlari

**Ko'rish:**
- Ombor → Harakatlar

Bu yerda barcha stok o'zgarishlari tarixini ko'rish mumkin:
- Qachon
- Qancha
- Kim
- Sabab

---

## 🤝 MIJOZLAR (CRM)

Mijozlar bilan munosabatlarni boshqarish.

### Mijozlar Ro'yxati

**Ko'rish:**
- CRM → Mijozlar

**Filter:**
- **Hudud:** Shahar/viloyat bo'yicha
- **Status:** Faol / Nofaol
- **Qarz:** Qarzi bor / yo'q

### Yangi Mijoz Qo'shish

1. **+ Yangi mijoz** tugmasini bosing
2. **Ism:** To'liq ism
3. **Email:** Email manzil (majburiy emas)
4. **Telefon:** +998901234567
5. **Manzil:** To'liq manzil
6. **Hudud:** Shahar/viloyat
7. **Izoh:** Qo'shimcha ma'lumot
8. **Saqlash**

### Mijoz Tarixi

Har bir mijoz sahifasida:

1. **Buyurtmalar:** Barcha buyurtmalar tarixi
2. **To'lovlar:** To'lov tarixi
3. **Qarzlar:** Joriy qarz holati

**Ko'rish:**
- Mijoz nomiga bosing
- Statistika: Jami buyurtmalar, jami summa, qarz

---

## 📝 BUYURTMALAR (ORDERS)

Mijozlardan kelgan buyurtmalarni boshqarish.

### Yangi Buyurtma Yaratish

1. **+ Yangi buyurtma** tugmasini bosing
2. **Mijoz:** Mijozni tanlang
3. **Mahsulotlar qo'shish:**
   - **Mahsulot:** ro'yxatdan tanlang
   - **Soni:** kerakli sonini kiriting
   - **Narx:** avtomatik to'ldiriladi (o'zgartirish mumkin)
4. **Qo'shimcha mahsulot** tugmasini bosib ko'proq qo'shing
5. **Jami summa:** avtomatik hisoblanadi
6. **Izoh:** Buyurtma haqida qo'shimcha ma'lumot
7. **Saqlash**

### Buyurtma Statusini O'zgartirish

**Statuslar:**
- 🟡 **Kutilmoqda** - yangi buyurtma
- 🔵 **Jarayonda** - ishlanmoqda
- 🟢 **Bajarildi** - yetkazib berildi
- 🔴 **Bekor qilindi** - bekor qilingan

**O'zgartirish:**
1. Buyurtma ustiga bosing
2. **Status** dropdown'ni oching
3. Yangi statusni tanlang
4. Avtomatik saqlanadi

### Buyurtma Detallari

Buyurtma nomiga bosganda:
- Mijoz ma'lumotlari
- Mahsulotlar ro'yxati
- To'lov holati
- Yetkazish ma'lumotlari

---

## 🏢 YETKAZIB BERUVCHILAR (SUPPLIERS)

Mahsulot yetkazib beruvchilar bilan ishlash.

### Yangi Yetkazib Beruvchi

1. **+ Yangi yetkazib beruvchi** tugmasini bosing
2. **Kompaniya nomi:** To'liq nom
3. **Email:** Aloqa email
4. **Telefon:** Aloqa telefon
5. **Manzil:** Ofis manzili
6. **Kategoriya:** Qaysi mahsulotlar
7. **Izoh:** Qo'shimcha
8. **Saqlash**

### Xarid Qilish

1. Yetkazib beruvchi nomiga bosing
2. **Xarid qilish** tugmasini bosing
3. **Mahsulot:** tanlang
4. **Soni:** kerakli soni
5. **Narx:** xarid narxi
6. **Jami:** avtomatik hisoblanadi
7. **Saqlash**

✅ **Stok avtomatik yangilanadi!**

### Mahsulotni Qaytarish

1. Yetkazib beruvchi sahifasida **Qaytarishlar** tab'ini oching
2. **+ Qaytarish** tugmasini bosing
3. **Mahsulot:** qaytarish kerak bo'lgan mahsulot
4. **Soni:** qaytarilayotgan soni
5. **Sabab:** Nosozlik, muddati o'tgan, va h.k.
6. **Summa:** qaytarilayotgan pul (avtomatik)
7. **Saqlash**

✅ **Stok va moliya avtomatik yangilanadi!**

---

## 👥 XODIMLAR (HR)

Xodimlarni boshqarish va ish haqi hisoblash.

### Yangi Xodim Qo'shish

1. **HR → Xodimlar**
2. **+ Yangi xodim** tugmasini bosing
3. **To'liq ism:** Ism familiya
4. **Email:** Ish email
5. **Telefon:** Aloqa telefon
6. **Lavozim:** Direktor, Menejer, va h.k.
7. **Bo'lim:** Sotuv, IT, Buxgalteriya
8. **Maosh:** Oylik maosh
9. **Ish boshlagan sana:** tanlang
10. **Manzil:** Yashash manzili
11. **Saqlash**

### Davomat Belgilash

**Ko'rish:**
- HR → Davomat

**Yangi yozuv:**
1. **+ Davomat belgilash**
2. **Xodim:** tanlang
3. **Sana:** bugun yoki o'tmish
4. **Turi:** Ishda / Kasallikda / Ta'tilda / Yo'q
5. **Saqlash**

**Statistika:**
- Ishda: 23 kun
- Kasallikda: 2 kun
- Ta'tilda: 3 kun
- Yo'q: 0 kun

### Ta'til So'rash

**Xodim uchun:**
1. **HR → Ta'tillar**
2. **+ Ta'til so'rash**
3. **Xodim:** tanlang
4. **Turi:** Yillik / Kasallik / Oilaviy
5. **Boshlanish:** sanani tanlang
6. **Tugash:** sanani tanlang
7. **Sabab:** qisqacha izoh
8. **Yuborish**

**Manager uchun:**
- Kutilayotgan so'rovlar ro'yxati
- **Tasdiqlash** yoki **Rad etish** tugmalari

### Ish Haqi Hisoblash

**Ko'rish:**
- HR → Ish haqi

**Yangi hisoblash:**
1. **+ Hisoblash** tugmasini bosing
2. **Oy:** tanlang (masalan, Avgust 2026)
3. **Xodimlar:** barcha yoki tanlangan
4. **Hisoblash** tugmasini bosing

✅ **Avtomatik:**
- Oylik maosh
- Minus davomat (kasallik/yo'q)
- Minus oldindan olingan
- Plus bonus

**To'lash:**
1. Ish haqi yozuviga bosing
2. **To'lash** tugmasini bosing
3. **To'lov usuli:** Naqd / Bank / Karta
4. **Tasdiqlash**

---

## 💳 QARZLAR (DEBTS)

Mijozlar qarzi boshqaruvi.

### Qarzdorlar Ro'yxati

**Ko'rish:**
- CRM → Qarzlar

**Ko'rsatiladi:**
- Mijoz nomi
- Jami qarz
- Oxirgi to'lov
- Muddati (qancha kun o'tgan)

### Qarz To'lash

1. Mijoz nomiga bosing
2. **To'lov qabul qilish** tugmasini bosing
3. **Summa:** to'lanayotgan summa
4. **To'lov usuli:** Naqd / Bank / Karta
5. **Izoh:** majburiy emas
6. **Saqlash**

✅ **Qarz avtomatik kamayadi!**

### To'lov Tarixi

Har bir mijoz uchun to'lov tarixi:
- Qachon to'lagan
- Qancha to'lagan
- Qancha qarz qolgan
- Kim qabul qilgan

---

## 🏪 SAVDO NUQTASI (POS)

Tez sotuv uchun kassir interfeysi.

### Sotuv Qilish

1. **POS** menyusini oching
2. **Mijoz:** tanlang (majburiy emas)
3. **Mahsulot qidirish:** nom yoki kod kiriting
4. **Mahsulotga bosing** → savatga qo'shiladi
5. **Soni:** kerak bo'lsa o'zgartiring
6. **Narx:** kerak bo'lsa o'zgartiring (chegirma)
7. **Jami:** avtomatik hisoblanadi
8. **To'lov qabul qilish** tugmasini bosing
9. **To'lov usuli:** Naqd / Karta / Bank
10. **Tasdiqlash**

✅ **Stok avtomatik kamayadi!**
✅ **Moliya avtomatik yangilanadi!**

### Qaytarish (Refund)

1. **Sotuvlar tarixi** ni oching
2. Qaytarish kerak bo'lgan sotuvni toping
3. **Qaytarish** tugmasini bosing
4. **Sabab:** Nosozlik, xato, va h.k.
5. **Summa:** avtomatik
6. **Tasdiqlash**

✅ **Stok qaytariladi!**
✅ **Pul qaytariladi!**

---

## 📊 HISOBOTLAR (REPORTS)

Turli hisobotlarni ko'rish va export qilish.

### Mavjud Hisobotlar

1. **Moliya hisoboti**
   - Daromad va xarajatlar
   - Foyda/zarar
   - Kategoriyalar bo'yicha

2. **Sotuv hisoboti**
   - Eng ko'p sotilgan mahsulotlar
   - Sotuvlar trendi
   - Mijozlar bo'yicha

3. **Ombor hisoboti**
   - Stok holati
   - Kam qolgan mahsulotlar
   - Stok harakatlari

4. **Xodimlar hisoboti**
   - Davomat statistikasi
   - Ish haqi xarajatlari
   - Ta'tillar

### Hisobotni Export Qilish

1. Hisobotni oching
2. **Export** tugmasini bosing
3. **Format:** Excel / PDF / CSV
4. **Sana oralig'i:** tanlang
5. **Yuklab olish**

---

## ⚙️ SOZLAMALAR (SETTINGS)

### Profil Sozlamalari

1. **Profil** tugmasini bosing
2. **Sozlamalar**

**O'zgartirish mumkin:**
- Ism
- Email
- Telefon
- Parol
- Avatar rasm

### Tizim Sozlamalari (Admin)

**Faqat adminlar uchun:**

1. **Filiallar:** yangi filial qo'shish
2. **Foydalanuvchilar:** yangi user yaratish
3. **Rollar:** ruxsatlarni boshqarish
4. **Backup:** ma'lumotlarni saqlash

### Foydalanuvchi Yaratish

1. **Sozlamalar → Foydalanuvchilar**
2. **+ Yangi foydalanuvchi**
3. **Ism:** To'liq ism
4. **Email/Login:** kirish uchun
5. **Parol:** birinchi parol
6. **Rol:** Admin / Manager / Kassir
7. **Xodim:** bog'lash (majburiy emas)
8. **Saqlash**

**Rollar:**
- **Admin:** Barcha ruxsatlar
- **Manager:** Ko'rish + tahrirlash
- **Kassir:** Faqat sotuv

---

## 🔔 OGOHLANTIRISHLAR

### Stok Ogohlantirish

Mahsulot minimal stokdan kamaysa:
- 🟡 Dashboard'da ogohlantirish
- 📧 Email (sozlangan bo'lsa)

**Ko'rish:**
- Dashboard → Ogohlantirishlar
- Yoki Ombor → Mahsulotlar (qizil belgili)

### Qarz Ogohlantirish

Qarz muddati o'tsa:
- 🔴 Mijozlar ro'yxatida qizil belgi
- Dashboard'da statistika

---

## ❓ TEZKOR YORDAM

### Mahsulot Topilmadi

**Muammo:** POS'da mahsulot chiqmayapti

**Yechim:**
1. Ombor → Mahsulotlar
2. Mahsulot borligini tekshiring
3. Status: Faol ekanligini tekshiring
4. Stok: 0 dan katta ekanligini tekshiring

### Parol Esdan Chiqdi

**Yechim:**
1. Login sahifasida **Parolni unutdim** tugmasini bosing
2. Email kiriting
3. Email'ga kelgan link orqali yangi parol o'rnating

(Agar email service sozlanmagan bo'lsa, admin'dan yangi parol so'rang)

### Ma'lumot Yo'qoldi

**Yechim:**
1. Arxiv'ni tekshiring (o'chirilgan elementlar)
2. Backup'dan tiklash (admin)
3. Support'ga murojaat

### Tizim Sekin Ishlayapti

**Yechim:**
1. Brauzer cache'ni tozalang
2. Brauzer qayta ishga tushiring
3. Internet aloqasini tekshiring
4. Admin'ga xabar bering

---

## 📞 QOIDA VAR SUPPORT

### Texnik Support

- **Email:** support@orbiserp.uz
- **Telefon:** +998 XX XXX XX XX
- **Ish vaqti:** 9:00 - 18:00 (Dush-Juma)

### Online Yordam

- **Telegram:** @fusionerp_support
- **FAQ:** https://orbiserp.uz/faq
- **Video Darsliklar:** https://orbiserp.uz/tutorials

### Bug Report

Agar xatolik topsangiz:
1. Screenshot oling
2. Qaysi sahifada yuz berganini yozing
3. Nima qilganingizni yozing
4. support@orbiserp.uz ga yuboring

---

## 🎓 VIDEO DARSLIKLAR

1. **Tizimga kirish va asosiy sozlamalar** (5 daqiqa)
2. **Mahsulot qo'shish va stok boshqaruvi** (10 daqiqa)
3. **Mijozlar va buyurtmalar** (12 daqiqa)
4. **POS orqali sotuv qilish** (8 daqiqa)
5. **Xodimlar va ish haqi hisoblash** (15 daqiqa)
6. **Hisobotlar va analytics** (10 daqiqa)

**Ko'rish:** https://orbiserp.uz/video-tutorials

---

## 📋 TEZKOR KLAVIATURA TUGMALARI

- **Ctrl + K:** Qidiruv
- **Ctrl + N:** Yangi element qo'shish
- **Ctrl + S:** Saqlash
- **Esc:** Oynani yopish
- **Alt + D:** Dashboard'ga o'tish
- **Alt + P:** POS'ga o'tish

---

**VERSIYA:** 1.0.0  
**OXIRGI YANGILANISH:** 2026-08-17  
**SUPPORT:** support@orbiserp.uz
