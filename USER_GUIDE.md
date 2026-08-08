# Foydalanuvchi Qo'llanmasi

## 🎯 Kirish

Orbis ERP - bu kichik va o'rta bizneslar uchun to'liq ERP tizimi. Ushbu qo'llanma sizga tizimdan qanday foydalanishni o'rgatadi.

## 📱 Tizimga Kirish

### Birinchi Kirish

1. Brauzerda `https://your-domain.com` ochiladi
2. Administrator sizga email va parol beradi
3. **Birinchi ish**: Parolni almashtiring!
   - O'ng yuqoridagi profilingizni bosing
   - "Parolni o'zgartirish" tugmasini bosing
   - Kuchli yangi parol o'rnating

### Parolni Unutdim

Administrator bilan bog'laning. U parolni reset qila oladi.

## 👥 Foydalanuvchi Rollari

### Admin
- **Huquqlari**: Barcha modullar va sozlamalarga to'liq kirish
- **Vazifalar**: Tizimni sozlash, foydalanuvchilarni boshqarish, hisobotlar

### Manager
- **Huquqlari**: Buyurtmalar, mijozlar, savdo, ombor
- **Vazifalar**: Kundalik biznes operatsiyalarini boshqarish

### Accountant (Buxgalter)
- **Huquqlari**: Moliya, hisobotlar, qarzlar
- **Vazifalar**: Moliyaviy hisob-kitoblar, to'lovlar

### HR (Kadrlar bo'limi)
- **Huquqlari**: Xodimlar, davomat, tatillar, ish haqi
- **Vazifalar**: Kadrlarni boshqarish

### Warehouse (Omborchi)
- **Huquqlari**: Mahsulotlar, ombor, xaridlar
- **Vazifalar**: Ombor operatsiyalari

### Sales (Sotuvchi)
- **Huquqlari**: Buyurtmalar, mijozlar (faqat ko'rish)
- **Vazifalar**: Savdo operatsiyalari

## 📊 Asosiy Modullar

### 1. Dashboard (Bosh Sahifa)

Birinchi ochilgan sahifa. Bu yerda:
- **Bugungi statistika**: Daromad, xarajat, savdo
- **Grafik**: Daromad tendensiyasi (30 kun)
- **So'nggi harakatlar**: Oxirgi amallar ro'yxati
- **Ogohlantirishlar**: Qoldiq kam mahsulotlar, muddati o'tgan invoicelar

### 2. Moliya (Finance)

#### Tranzaksiyalar
- **Qo'shish**: "Yangi tranzaksiya" tugmasi
  - Sarlavha, kategoriya, summa kiriting
  - Turi: Kirim yoki Chiqim
  - Sana va hisob tanlang
- **Tahrirlash**: Qatorni bosing → O'zgartiring → Saqlash
- **O'chirish**: Qatorning oxiridagi "O'chirish" tugmasi
- **Eksport**: Excel/CSV formatda eksport qilish

#### Kategoriyalar
Standart kategoriyalar:
- **Kirim**: Savdo, xizmatlar, boshqalar
- **Chiqim**: Ish haqi, ijara, utilities, marketing

### 3. HR (Kadrlar)

#### Xodimlar
- **Qo'shish**: 
  - Ism, lavozim, bo'lim
  - Ish haqi, telefon, email
  - Ishga kirish sanasi
- **Holat**: Faol / Tatilda / O'chirilgan
- **Ko'rish**: Har bir xodimning batafsil ma'lumotlari

#### Davomat (Attendance)
- **Belgilash**: 
  - Xodimni tanlang
  - Kelgan/Ketgan vaqtini kiriting
  - Holat: Ishda / Kasallikda / Ta'tilda
- **Tezkor belgilash**: Dashboard'dagi "Tezkor davomat" orqali
- **Statistika**: Oylik davomat hisoboti

#### Tatil So'rovlari (Leave Requests)
- **Yaratish**: 
  - Turi: Dam olish / Kasallik / Boshqa
  - Boshlanish va tugash sanasi
  - Sabab
- **Tasdiqlash**: Manager/Admin tasdiqlasin
- **Holat**: Kutilmoqda / Tasdiqlangan / Rad etilgan

#### Ish Haqi (Payroll)
- **Hisoblash**: Oylik ish haqi avtomatik hisoblanadi
  - Asosiy maosh
  - Davomat bo'yicha chegirma
  - Bonus va jarima
  - Soliq (12%)
- **To'lash**: Holatni "To'langan" ga o'zgartiring

### 4. Ombor (Warehouse)

#### Mahsulotlar
- **Qo'shish**:
  - Nomi, kategoriya
  - Narx, miqdor
  - Minimal miqdor (ogohlantirishlar uchun)
  - Joylashuv, ta'minotchi
- **Qoldiqni Sozlash**:
  - Mahsulotni tanlang
  - "Qoldiqni sozlash" tugmasi
  - Turi: Kirim / Chiqim / Tuzatish
  - Sabab va miqdorni kiriting

#### Harakatlar (Stock Movements)
Barcha qoldiq o'zgarishlari avtomatik yoziladi:
- Xarid
- Sotish
- Qaytarish
- Tuzatish

### 5. Mijozlar (Customers)

#### Mijoz Qo'shish
- Turi: Jismoniy shaxs / Kompaniya
- Aloqa ma'lumotlari
- Hudud va manzil
- Holat: Faol / Nofaol

#### Mijoz Profili
- Barcha buyurtmalar tarixi
- Qarz holati
- To'lov tarixi

### 6. Buyurtmalar (Orders)

#### Yangi Buyurtma
1. Mijozni tanlang
2. Mahsulotlarni qo'shing (nomi, miqdor, narx)
3. Yetkazish sanasini belgilang
4. Mas'ul xodimni tanlang
5. Izoh qoldiring (ixtiyoriy)

#### Buyurtma Holatlari
- **Kutilmoqda** (Pending): Yangi buyurtma
- **Jarayonda** (Processing): Tayyorlanmoqda
- **Yuborilgan** (Shipped): Yo'lda
- **Yetkazilgan** (Delivered): Bajarildi
- **Bekor qilingan** (Cancelled): Rad etildi

#### To'lov Holati
- **To'lanmagan** (Unpaid)
- **Qisman** (Partial): Qisman to'langan
- **To'langan** (Paid): To'liq to'langan

### 7. Invoice (Hisob-faktura)

#### Yaratish
- Buyurtmadan avtomatik yaratiladi
- Qo'lda ham yaratish mumkin
- Invoice raqami avtomatik beriladi

#### To'lov Kiritish
- Invoice'ni tanlang
- "To'lov kiritish" tugmasi
- Summa va usulni kiriting
- Status avtomatik yangilanadi

### 8. Qarzlar (Debts)

#### Mijoz Qarzlari
- Barcha to'lanmagan invoicelar
- Har bir mijoz uchun umumiy qarz
- To'lov tarixi

#### To'lov Qabul Qilish
- Mijozni tanlang
- To'lov usuli va summasini kiriting
- Qaysi buyurtmaga tegishli ekanini belgilang

### 9. Hisobotlar (Reports)

#### Mavjud Hisobotlar
- **Moliyaviy hisobot**: Kirim va chiqim tahlili
- **Savdo hisoboti**: Sotuvlar statistikasi
- **Ombor hisoboti**: Qoldiq va harakatlar
- **Xodimlar hisoboti**: Davomat va ish haqi

#### Eksport
- Excel formatida yuklab olish
- Sanalar oralig'ini tanlash
- Filtr qo'llash

### 10. Filiallar (Branches)

#### Qo'shish
- Filial nomi va turi
- Hudud va manzil
- Menejer
- Holat: Faol / Yopiq

#### Boshqarish
- Har bir filial uchun alohida statistika
- Xodimlar va mahsulotlarni filialga biriktiris

## ⚡ Tezkor Amallar

### Klaviatura Yorliqlari
- `Ctrl + K`: Tezkor qidiruv (Command Palette)
- `Ctrl + /`: Yordam
- `Esc`: Dialog'ni yopish

### Qidiruv
- Tepadagi qidiruv maydoniga yozing
- Tezkor topish: `Ctrl + K`
- Mijozlar, mahsulotlar, buyurtmalarni qidirish

### Filtrlar
Ko'pchilik ro'yxatlarda filtrlash mavjud:
- Holat bo'yicha
- Sana oralig'i
- Kategoriya
- Hudud

## 🔔 Bildirishnomalar

### Xabarnomalar Turlari
- Qoldiq kam mahsulotlar (minimal miqdordan past)
- Muddati o'tgan invoicelar
- Tasdiqlashni kutayotgan tatil so'rovlari
- To'lanmagan buyurtmalar

### Sozlash
Profil → Sozlamalar → Bildirishnomalar

## 🎨 Interfeys Sozlamalari

### Tema
- Yorug' / To'q rejim
- Profil → Sozlamalar → Tema

### Til
Hozircha faqat O'zbek va Ingliz tillari

## ❓ Ko'p So'raladigan Savollar

### Q: Xatoni qanday tuzataman?
A: Tahrirlash tugmasini bosing, o'zgartiring va saqlang.

### Q: O'chirilgan ma'lumotni qanday tiklash mumkin?
A: Administrator tiklashi mumkin (soft delete tizimi).

### Q: Eksport qilish imkoniyati bormi?
A: Ha, ko'pchilik ro'yxatlarni Excel/CSV formatida eksport qilish mumkin.

### Q: Ma'lumotlarim xavfsizmi?
A: Ha, barcha ma'lumotlar shifrlangan va backup olinadi. [SECURITY.md](./SECURITY.md) o'qing.

### Q: Mobil ilovasi bormi?
A: Hozircha yo'q, lekin responsive web versiya mavjud.

## 📞 Yordam

### Texnik Qo'llab-quvvatlash
- 📧 Email: support@yourcompany.uz
- 💬 Telegram: @yourcompany_support
- 📱 Telefon: +998 XX XXX XX XX
- ⏰ Ish vaqti: 9:00 - 18:00 (Dush-Juma)

### Video Darsliklar
YouTube kanalimizda video qo'llanmalar:
- Tizimga kirish va asosiy sozlamalar
- Har bir modul bo'yicha alohida darslik
- Ko'p uchraydigan muammolar va yechimlar

## 🔄 Yangilanishlar

Tizim muntazam yangilanadi. Yangi xususiyatlar qo'shilganda:
1. Bildirishnoma olasiz
2. "Yangiliklar" bo'limida o'qishingiz mumkin
3. Video qo'llanma tayyorlanadi

---

**Savollaringiz bormi?** Bemalol murojaat qiling! 😊
