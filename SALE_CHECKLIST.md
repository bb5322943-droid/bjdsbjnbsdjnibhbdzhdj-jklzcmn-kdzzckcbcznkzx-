# Sotishdan Oldin Tekshirish Ro'yxati

Bu ro'yxat tizimni mijozga topshirishdan oldin bajarilishi kerak bo'lgan barcha vazifalarni o'z ichiga oladi.

## ✅ Xavfsizlik

- [ ] `.env` faylini git'dan o'chirilganini tekshiring
- [ ] Yangi JWT secret kalitlar yaratildi va `.env` ga qo'yildi
- [ ] Admin paroli kuchli parolga o'zgartirildi
- [ ] Default parollar o'zgartirildi
- [ ] CORS sozlamalari production domain uchun to'g'ri
- [ ] `.gitignore` da barcha maxfiy fayllar bor

## 📁 Fayl Tizimi

- [ ] Demo database fayllari o'chirildi (`data/` papka)
- [ ] Backup papkasi tozalandi
- [ ] Log fayllari tozalandi
- [ ] `node_modules/` papka yo'q (mijoz o'zi install qiladi)

## 🔧 Konfiguratsiya

- [ ] `.env.example` faylida barcha kerakli o'zgaruvchilar bor
- [ ] `package.json` da to'g'ri loyiha nomi
- [ ] `README.md` yangilandi
- [ ] `SETUP.md` ko'rsatmalari to'liq
- [ ] Branding ma'lumotlari o'zgartirildi (agar kerak bo'lsa)

## 📝 Hujjatlar

- [ ] README.md mavjud va to'liq
- [ ] SETUP.md mavjud (o'rnatish ko'rsatmasi)
- [ ] SECURITY.md mavjud (xavfsizlik ko'rsatmalari)
- [ ] API_DOCS.md mavjud (ixtiyoriy)
- [ ] LICENSE fayli mavjud

## 🧪 Test

- [ ] Dependencies o'rnatiladi (`pnpm install`)
- [ ] Development mode ishga tushadi (`pnpm dev`)
- [ ] Production build muvaffaqiyatli (`pnpm build`)
- [ ] Production server ishga tushadi (`pnpm start`)
- [ ] Login sahifasi ochiladi
- [ ] Admin login ishlaydi
- [ ] Asosiy sahifalar ochiladi

## 📦 Deploy Tayorligi

- [ ] Build skriptlar ishlaydi
- [ ] Environment variables hujjatlashtirilgan
- [ ] Database migration (agar kerak bo'lsa)
- [ ] Static assets to'g'ri
- [ ] API endpoints test qilindi

## 🎨 Frontend

- [ ] Barcha sahifalar responsive
- [ ] Loading states mavjud
- [ ] Error handling to'g'ri
- [ ] Toast notifications ishlaydi
- [ ] Form validations ishlaydi

## 🔌 Backend

- [ ] Barcha API endpoints ishlaydi
- [ ] Authentication ishlaydi
- [ ] Permissions to'g'ri tekshiriladi
- [ ] Error handling to'g'ri
- [ ] Logging ishlaydi
- [ ] Backup tizimi sozlangan

## 💾 Database

- [ ] Schema to'liq
- [ ] Soft delete ishlaydi
- [ ] Audit logging ishlaydi
- [ ] Indekslar qo'shilgan (performance uchun)

## 📋 Mijozga Topshirish Uchun Fayllar

Quyidagi fayllarni ZIP yoki Git repository sifatida bering:

### Majburiy:
- [ ] Barcha kod fayllari
- [ ] `package.json` va `pnpm-lock.yaml`
- [ ] `.env.example` (`.env` emas!)
- [ ] README.md
- [ ] SETUP.md
- [ ] SECURITY.md
- [ ] LICENSE

### Ixtiyoriy:
- [ ] API_DOCS.md
- [ ] CHANGELOG.md
- [ ] Demo screenshot'lar
- [ ] Video ko'rsatmalar

## 📞 Mijozga Ko'rsatmalar

Mijozga quyidagilarni tushuntiring:

- [ ] Tizimni qanday o'rnatish (SETUP.md ko'rsating)
- [ ] Birinchi kirish va parol o'zgartirish
- [ ] Xavfsizlik eslatmalari (SECURITY.md)
- [ ] Backup qanday olinadi
- [ ] Texnik yordam qanday olinadi
- [ ] License shartlari

## 🔒 Maxfiy Ma'lumotlarni Tekshiring

Quyidagi fayllar va ma'lumotlar **HECH QACHON** mijozga berilmasligi kerak:

- [ ] Haqiqiy `.env` fayli
- [ ] Database fayllari (`*.db`, `*.sqlite`)
- [ ] Backup fayllari
- [ ] Log fayllari
- [ ] `node_modules/` papka
- [ ] `.git/` papka (agar private repo bo'lsa)
- [ ] Sizning shaxsiy kalitlaringiz

## 💰 Mijoz Qabul Qilishi Kerak

- [ ] Barcha kod fayllari
- [ ] O'rnatish ko'rsatmalari
- [ ] 30 kunlik texnik yordam (ixtiyoriy)
- [ ] Training sessiyalar (ixtiyoriy)

## 📝 Shartnoma

Mijoz bilan shartnomada quyidagilar aniq bo'lishi kerak:

- [ ] License turi (MIT, Commercial, etc.)
- [ ] Texnik yordam muddati
- [ ] Update'lar siyosati
- [ ] Ma'lumotlar maxfiyligi
- [ ] Warrantiya shartlari

---

## ✨ So'nggi Tekshiruv

Barcha bandlar belgilangach:

```bash
# 1. Final test
pnpm install
pnpm build
pnpm start

# 2. Barcha maxfiy fayllarni o'chiring
rm .env
rm -rf data/
rm -rf logs/

# 3. ZIP yarating yoki git push qiling
git add .
git commit -m "Ready for delivery"
git push
```

**Eslatma:** Ushbu checklist'dan keyin tizim sotuvga tayyor!

---

**Muvaffaqiyatli sotuvlar! 🎉**
