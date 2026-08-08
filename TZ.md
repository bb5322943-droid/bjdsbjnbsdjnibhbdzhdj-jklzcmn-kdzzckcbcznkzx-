# TEXNIK VAZIFA (TZ)

## Fusion ERP — Kichik va O'rta Biznes Uchun ERP Tizimi

| | |
|---|---|
| **Hujjat turi** | Texnik vazifa (Technical Specification) |
| **Loyiha nomi** | Fusion ERP (Orbis ERP) |
| **Versiya** | 1.0 |
| **Sana** | 2026-08-06 |
| **Holat** | Tasdiqlash uchun |
| **Tayyorlovchi** | Fusion Starter loyihasi asosida |

---

## Mundarija

1. [Kirish](#1-kirish)
2. [Loyihaning maqsadi](#2-loyihaning-maqsadi)
3. [Qamrov doirasi](#3-qamrov-doirasi)
4. [Atamalar va qisqartmalar](#4-atamalar-va-qisqartmalar)
5. [Foydalanuvchilar va rollar](#5-foydalanuvchilar-va-rollar)
6. [Funksional talablar](#6-funksional-talablar)
7. [Modullararo bog'liqlik (biznes mantiq)](#7-modullararo-bogliqlik-biznes-mantiq)
8. [Nofunksional talablar](#8-nofunksional-talablar)
9. [Arxitektura va texnologiyalar](#9-arxitektura-va-texnologiyalar)
10. [Ma'lumotlar modeli](#10-malumotlar-modeli)
11. [API spetsifikatsiyasi](#11-api-spetsifikatsiyasi)
12. [Ruxsatlar matritsasi (RBAC)](#12-ruxsatlar-matritsasi-rbac)
13. [Xavfsizlik talablari](#13-xavfsizlik-talablari)
14. [Test talablari](#14-test-talablari)
15. [Deploy va operatsiya](#15-deploy-va-operatsiya)
16. [Qabul mezonlari](#16-qabul-mezonlari)
17. [Kelajak rejalari](#17-kelajak-rejalari)

---

## 1. Kirish

### 1.1 Hujjatning maqsadi

Ushbu texnik vazifa Fusion ERP tizimiga qo'yiladigan to'liq talablarni belgilaydi: funksional imkoniyatlar, arxitektura, ma'lumotlar modeli, xavfsizlik, test va deploy talablari. Hujjat buyurtmachi, loyiha menejeri, dasturchilar va testerlar uchun yagona manba hisoblanadi.

### 1.2 Qo'llaniladigan hujjatlar

- `README.md` — umumiy tavsif va o'rnatish
- `AGENTS.md` — arxitektura qo'llanmasi
- `API_DOCS.md` — API hujjati
- `FUNCTIONALITY_OVERVIEW.md` — funksional imkoniyatlar sharhi
- `SECURITY.md` — xavfsizlik ko'rsatmalari
- `SETUP.md`, `DEPLOY.md` — o'rnatish va deploy
- `TODO.md` — rivojlanish rejasi

---

## 2. Loyihaning maqsadi

Kichik va o'rta bizneslarning kundalik operatsion jarayonlarini yagona platformada boshqarish: sotuv, ombor, moliya, kadrlar, mijozlar va hisobotlar. Tizim quyidagi asosiy maqsadlarga xizmat qiladi:

1. **Barcha biznes jarayonlarni raqamlashtirish** — qog'oz va Excel o'rniga yagona tizim.
2. **Modullararo avtomatik sinxronizatsiya** — sotuv omborga, to'lov moliyaga avtomatik ta'sir qiladi.
3. **Real-time boshqaruv paneli** — egasi/rahbar tizim holatini bir qarashda ko'radi.
4. **Rol asosidagi xavfsizlik** — har bir xodim faqat o'z vazifasiga tegishli ma'lumotni ko'radi.
5. **To'liq kuzatuvchanlik** — har bir amal audit-logda qayd etiladi.

### 2.1 Maqsadli auditoriya

- Savdo va xizmat ko'rsatish korxonalari
- Chakana (do'kon, POS) va ulgurji sotuvchilar
- Ombor boshqaruvi talab qiladigan bizneslar
- Buxgalteriya va kadrlar bo'limi bo'lgan kompaniyalar

---

## 3. Qamrov doirasi

### 3.1 Doiraga kiradi (v1.0)

| # | Modul | Sahifa yo'li |
|---|---|---|
| 1 | Autentifikatsiya va profil | `/login` |
| 2 | Bosh panel (Dashboard) | `/` |
| 3 | Moliya | `/finance` |
| 4 | Kadrlar (HR) | `/hr` |
| 5 | Davomat va ta'til | `/attendance` |
| 6 | Ish haqi (Payroll) | `/payroll` |
| 7 | Ombor | `/warehouse`, `/warehouse/:id` |
| 8 | Mahsulotlar | `/products` |
| 9 | Savdo (Sales + POS) | `/sales`, `/pos` |
| 10 | CRM (bitimlar) | `/crm` |
| 11 | Buyurtmalar | `/orders` |
| 12 | Mijozlar | `/customers` |
| 13 | Ta'minotchilar | `/suppliers` |
| 14 | Xaridlar | `/purchases` |
| 15 | Hisob-fakturalar | `/invoices` |
| 16 | Qarzlar | `/debts` |
| 17 | To'lovlar | `/payments` |
| 18 | Filiallar | `/branches` |
| 19 | Foydalanuvchilar va rollar | `/users` |
| 20 | Audit-log | `/audit` |
| 21 | Hisobotlar | `/reports` |

### 3.2 Doiraga kirmaydi (v1.0)

- Multi-tenant (bir nechta kompaniya)
- Onlayn to'lov integratsiyasi (Click, Payme)
- Email bildirishnomalar
- Telegram/WhatsApp integratsiyasi
- Mobil ilova (React Native)
- Real-time (WebSocket) yangilanishlar

---

## 4. Atamalar va qisqartmalar

| Atama | Ta'rif |
|---|---|
| **ERP** | Enterprise Resource Planning — korxona resurslarini boshqarish |
| **RBAC** | Role-Based Access Control — rol asosidagi kirish nazorati |
| **POS** | Point of Sale — savdo nuqtasi (kassa) |
| **JWT** | JSON Web Token — autentifikatsiya tokeni |
| **CRUD** | Create, Read, Update, Delete — yaratish, o'qish, yangilash, o'chirish |
| **Soft delete** | Yozuvni butunlay o'chirmasdan `deletedAt` belgisi bilan arxivlash |
| **CSV** | Comma-Separated Values — jadval ma'lumot formati |
| **TZ** | Texnik Vazifa |
| **PBX** | — (ishlatilmaydi) |

---

## 5. Foydalanuvchilar va rollar

### 5.1 Foydalanuvchi turlari

| Tur | Tavsif |
|---|---|
| **Admin (administrator)** | Tizimning to'liq boshqaruvchisi — barcha modullar, foydalanuvchilar, audit |
| **Manager (rahbar)** | Operatsion boshqaruv — savdo, ombor, CRM, hisobotlar |
| **Accountant (buxgalter)** | Moliya bo'limi — tranzaksiyalar va hisobotlar |
| **Cashier (kassir)** | Savdo/POS — kassa operatsiyalari |
| **HR manager** | Kadrlar bo'limi — xodimlar, davomat, ta'til, ish haqi |
| **Warehouse (omborchi)** | Ombor boshqaruvi — mahsulotlar, xaridlar, qoldiqlar |
| **Sales (sotuvchi)** | Savdo va CRM |
| **Viewer (kuzatuvchi)** | Faqat ko'rish huquqi |

### 5.2 Rollar va modullar mosligi

To'liq matritsa [12-bo'lim](#12-ruxsatlar-matritsasi-rbac) da keltirilgan.

---

## 6. Funksional talablar

> Har bir talab **FT-{modul}-{raqam}** kodi bilan belgilanadi. Holati: ✅ bajarilgan, ⚠️ qisman, ❌ bajarilmagan.

### 6.1 Autentifikatsiya (AUTH)

| Kod | Talab | Holat |
|---|---|---|
| FT-AUTH-01 | Foydalanuvchi login yoki email va parol bilan tizimga kiradi | ✅ |
| FT-AUTH-02 | Parol scrypt algoritmi bilan, har biri uchun alohida tuz (salt) qo'shib hashlanadi | ✅ |
| FT-AUTH-03 | Muvaffaqiyatli kirishda JWT access token (12 soat) va refresh token (7 kun) beriladi | ✅ |
| FT-AUTH-04 | Refresh tokenlar bazada saqlanadi, sessiyani bekor qilish mumkin | ✅ |
| FT-AUTH-05 | Login endpointiga brute-force himoyasi: 15 daqiqada maksimal 5 urinish | ✅ |
| FT-AUTH-06 | Foydalanuvchi parolni o'zgartira oladi (joriy parolni tasdiqlab) | ✅ |
| FT-AUTH-07 | Sessiya muddati tugagan yoki token bekor qilingan bo'lsa, foydalanuvchi login sahifasiga qaytariladi | ✅ |
| FT-AUTH-08 | Login sahifasi allaqachon kirgan foydalanuvchi uchun bloklanadi (qayta yo'naltiriladi) | ✅ |
| FT-AUTH-09 | Kirilgandan keyin foydalanuvchi kirishni boshlagan sahifaga qaytariladi | ✅ |

### 6.2 Bosh panel (DASHBOARD)

| Kod | Talab | Holat |
|---|---|---|
| FT-DASH-01 | Joriy oy daromadi, xarajati, sof foyda va faol xodimlar soni ko'rsatiladi | ✅ |
| FT-DASH-02 | Har bir ko'rsatkich o'tgan oyga nisbatan foizli o'zgarish bilan ko'rsatiladi | ✅ |
| FT-DASH-03 | Oyning har kuni bo'yicha kirim/xarajat interaktiv grafigi mavjud | ✅ |
| FT-DASH-04 | Jonli ogohlantirishlar: tanqis mahsulotlar, muddati o'tgan bitimlar (muammo hal bo'lsa avtomatik yo'qoladi) | ✅ |
| FT-DASH-05 | So'nggi faolliklar jurnali ko'rsatiladi | ✅ |
| FT-DASH-06 | Ombor holati kartasi: real qoldiq, tanqis mahsulotlar soni | ✅ |
| FT-DASH-07 | Joriy oy tranzaksiyalarini CSV yuklab olish tugmasi | ✅ |

### 6.3 Moliya (FINANCE)

| Kod | Talab | Holat |
|---|---|---|
| FT-FIN-01 | Tranzaksiya yaratish, tahrirlash, o'chirish (kirim/chiqim) | ✅ |
| FT-FIN-02 | Filtrlar: tur, kategoriya, sana oralig'i, matnli qidiruv (debounce bilan) | ✅ |
| FT-FIN-03 | Joriy filtrga mos tranzaksiyalarni CSV eksport qilish | ✅ |
| FT-FIN-04 | Joriy balans butun tarix bo'yicha, oylik kirim/chiqim joriy oydan hisoblanadi | ✅ |
| FT-FIN-05 | Kategoriya va hisob (bank/kassa) bo'yicha tahliliy kesimlar | ✅ |
| FT-FIN-06 | Tranzaksiya maydonlari serverda Zod bilan validatsiya qilinadi | ✅ |
| FT-FIN-07 | Barcha yozuvlar soft-delete qo'llab-quvvatlaydi | ✅ |

### 6.4 Kadrlar (HR)

| Kod | Talab | Holat |
|---|---|---|
| FT-HR-01 | Xodim yaratish, tahrirlash (holat, maosh, bo'lim), o'chirish | ✅ |
| FT-HR-02 | Filtrlar: bo'lim, holat (ishda/ta'tilda/kasallik), qidiruv | ✅ |
| FT-HR-03 | Email dublikatini oldini olish (unikallik indeksi) | ✅ |
| FT-HR-04 | Sahifalash (10 ta yozuv) | ✅ |
| FT-HR-05 | Bo'limlar bo'yicha tahlil: xodimlar soni, maosh fondi, ta'tildagilar | ✅ |
| FT-HR-06 | Statistika: jami xodimlar, bugungi ta'tildagilar, davomat darajasi, bo'sh o'rinlar | ✅ |

### 6.5 Davomat va ta'til (ATTENDANCE & LEAVE)

| Kod | Talab | Holat |
|---|---|---|
| FT-ATT-01 | Kunlik davomat belgilash: kelgan / kechikkan / masofadan / kelmagan / ta'tilda | ✅ |
| FT-ATT-02 | Kelish-ketish vaqti va ishlagan soatlar qayd etiladi | ✅ |
| FT-ATT-03 | Sana bo'yicha filtr orqali istalgan kun davomatini ko'rish | ✅ |
| FT-ATT-04 | Ta'til so'rovi yaratish: turi (ta'til/kasallik/to'lovsiz/shaxsiy), muddat, sabab | ✅ |
| FT-ATT-05 | Ta'til so'rovlarini tasdiqlash va rad etish oqimi | ✅ |
| FT-ATT-06 | Tasdiqlangan ta'til bugungi kunni qamrasa, xodim holati avtomatik o'zgaradi | ✅ |
| FT-ATT-07 | Ta'til o'chirilsa/rad etilsa, xodim holati qayta hisoblanadi | ✅ |
| FT-ATT-08 | Davomat statistikasi: hozir bo'lganlar, kechikkanlar, masofadan, ta'tildagilar, davomat darajasi | ✅ |

### 6.6 Ish haqi (PAYROLL)

| Kod | Talab | Holat |
|---|---|---|
| FT-PAY-01 | Ish haqi davr (oy) bo'yicha hisoblanadi — `YYYY-MM` formati | ✅ |
| FT-PAY-02 | Hisob-kitob davomat yozuvlariga asoslanadi: ish kunlari, kelgan kunlar | ✅ |
| FT-PAY-03 | Kelmagan kunlar uchun ushlanma hisoblanadi | ✅ |
| FT-PAY-04 | Bonus va jarima qo'shish/moslashtirish mumkin | ✅ |
| FT-PAY-05 | Daromad solig'i (12%) avtomatik hisoblanadi | ✅ |
| FT-PAY-06 | Yakuniy to'lanadigan summa (net salary) hisoblanadi | ✅ |
| FT-PAY-07 | Holatlar: qoralama → tasdiqlangan → to'langan | ✅ |
| FT-PAY-08 | Davr bo'yicha statistika: jami net summa, to'langan/kutilayotganlar | ✅ |
| FT-PAY-09 | Hisob-kitob bitta xodim uchun yoki barcha faol xodimlar uchun bo'lishi mumkin | ✅ |

### 6.7 Ombor va mahsulotlar (WAREHOUSE)

| Kod | Talab | Holat |
|---|---|---|
| FT-WH-01 | Mahsulot yaratish, tahrirlash, o'chirish (nom, joy, qoldiq, min qoldiq, narx, kategoriya, ta'minotchi) | ✅ |
| FT-WH-02 | Tanqis qoldiq nazorati: min chegaradan past mahsulotlar avtomatik belgilanadi | ✅ |
| FT-WH-03 | "Buyurtma berish" — bitta bosishda barcha tanqis mahsulotlar qoldig'ini to'ldirish | ✅ |
| FT-WH-04 | Filtrlar: kategoriya, joy, faqat tanqislar, qidiruv | ✅ |
| FT-WH-05 | Har bir qoldiq o'zgarishi ombor harakatlari jurnaliga yoziladi (kirim/chiqim/tuzatish) | ✅ |
| FT-WH-06 | Har bir harakatda keyingi qoldiq saqlanadi (inventarizatsiya tekshiruvi) | ✅ |
| FT-WH-07 | Qo'lda qoldiq tuzatish (inventarizatsiya, yaroqsizga chiqarish) | ✅ |
| FT-WH-08 | Qoldiq hech qachon manfiy bo'lmaydi | ✅ |
| FT-WH-09 | Mahsulotlarni CSV eksport qilish | ✅ |
| FT-WH-10 | Statistika: jami mahsulotlar, normal/tanqis qoldiq, ombor qiymati | ✅ |
| FT-WH-11 | Kategoriya, joy, top ta'minotchilar bo'yicha tahlil | ✅ |

### 6.8 Savdo (SALES + POS)

| Kod | Talab | Holat |
|---|---|---|
| FT-SALE-01 | Sotuv yaratish: mahsulotlar, miqdor, narx, chegirma, soliq | ✅ |
| FT-SALE-02 | To'lov usullari: naqd / karta / o'tkazma / nasiya | ✅ |
| FT-SALE-03 | Sotuvni qaytarish (refund) — hujjat bilan, mahsulot omborga qaytadi | ✅ |
| FT-SALE-04 | Sotuv statistikasi: bugungi/oylik sotuvlar, top mahsulotlar, top sotuvchilar | ✅ |
| FT-SALE-05 | **POS interfeysi real ma'lumotlar bilan ishlamaydi** — `/api/pos/*` endpointlari demo (hardcode) ma'lumot qaytaradi | ⚠️ |
| FT-SALE-06 | POS: shtrix-kod bo'yicha qidiruv, kategoriya tez tugmalari | ⚠️ (qisman — demo) |

### 6.9 CRM (bitimlar)

| Kod | Talab | Holat |
|---|---|---|
| FT-CRM-01 | Bitim yaratish, tahrirlash, o'chirish (mijoz, qiymat, holat, muddat, mas'ul) | ✅ |
| FT-CRM-02 | Savdo voronkasi: 5 bosqich (yangi mijoz → muzokara → taklif → yutuq/yo'qotilgan) | ✅ |
| FT-CRM-03 | Voronka diagrammasini bosish orqali bosqich bo'yicha filtrlash | ✅ |
| FT-CRM-04 | Jadval menyusidan bitimni tez yopish (yutuq/yo'qotilgan) | ✅ |
| FT-CRM-05 | Muddati o'tgan va yaqin 7 kun ichida yopilishi kutilayotgan bitimlar alohida ko'rsatiladi | ✅ |
| FT-CRM-06 | Statistika: umumiy pipeline, yangi mijozlar, muzokaralar, oyda yopilganlar | ✅ |
| FT-CRM-07 | Konversiya darajasi va o'rtacha bitim hajmi hisoblanadi | ✅ |

### 6.10 Buyurtmalar (ORDERS)

| Kod | Talab | Holat |
|---|---|---|
| FT-ORD-01 | Ko'p qatorli buyurtma: bir hujjatda bir nechta mahsulot, miqdor va narx | ✅ |
| FT-ORD-02 | Bosqichlar: qoralama → tasdiqlangan → jo'natilgan → yetkazilgan (yoki bekor) | ✅ |
| FT-ORD-03 | Buyurtma tasdiqlanganda ombor qoldig'i kamayadi va harakat yoziladi | ✅ |
| FT-ORD-04 | Buyurtma bekor qilinsa/o'chirilsa, tovar omborga qaytariladi | ✅ |
| FT-ORD-05 | To'lov "to'langan" bo'lsa, moliyaga daromad yoziladi | ✅ |
| FT-ORD-06 | Omborda yetarli tovar bo'lmasa, tasdiqlashga yo'l qo'yilmaydi (409 xato) | ✅ |
| FT-ORD-07 | Buyurtma paytidagi mahsulot nomi va narxi saqlanadi (keyin o'zgarsa ham hujjat o'zgarmaydi) | ✅ |
| FT-ORD-08 | Tahlil: bosqichlar taqsimoti, top mijozlar, ko'p sotilgan mahsulotlar | ✅ |
| FT-ORD-09 | To'lov holatlari: to'lanmagan / qisman / to'langan | ✅ |

### 6.11 Mijozlar (CUSTOMERS)

| Kod | Talab | Holat |
|---|---|---|
| FT-CUST-01 | Mijoz kartotekasi: tashkilot/jismoniy shaxs, aloqa shaxsi, telefon, email, hudud | ✅ |
| FT-CUST-02 | Filtrlar: turi, hudud, holat (faol/arxiv), qidiruv | ✅ |
| FT-CUST-03 | Buyurtmasi bor mijozni o'chirib bo'lmaydi — arxivga o'tkaziladi (soft delete) | ✅ |
| FT-CUST-04 | Mijoz nomi o'zgarsa, bog'liq buyurtma va bitimlarda ham yangilanadi | ✅ |
| FT-CUST-05 | Mijoz tafsiloti: buyurtmalar va bitimlar tarixi bilan | ✅ |
| FT-CUST-06 | Statistika: jami/faol mijozlar, oyda yangilar, jami tushum | ✅ |

### 6.12 Ta'minotchilar (SUPPLIERS)

| Kod | Talab | Holat |
|---|---|---|
| FT-SUP-01 | Ta'minotchi kartotekasi: aloqa ma'lumotlari, kategoriya, 1–5 yulduzli baho | ✅ |
| FT-SUP-02 | Mahsuloti bog'langan ta'minotchini o'chirib bo'lmaydi (arxivga o'tadi) | ✅ |
| FT-SUP-03 | Ta'minotchi nomi o'zgarsa, ombordagi mahsulotlarda ham yangilanadi | ✅ |
| FT-SUP-04 | Statistika: jami/faol ta'minotchilar, kategoriyalar, o'rtacha baho | ✅ |

### 6.13 Xaridlar (PURCHASES)

| Kod | Talab | Holat |
|---|---|---|
| FT-PUR-01 | Xarid buyurtmasi: ta'minotchi, mahsulotlar, tannarx, muddat | ✅ |
| FT-PUR-02 | Bosqichlar: qoralama → buyurtma berilgan → qabul qilingan (yoki bekor) | ✅ |
| FT-PUR-03 | "Qabul qilingan" holatida ombor qoldig'i oshadi va harakat yoziladi | ✅ |
| FT-PUR-04 | To'lov yakunlanganda moliyaga xarajat yoziladi | ✅ |
| FT-PUR-05 | Xarid o'chirilsa, qabul qilingan tovar ombor hisobidan chiqariladi | ✅ |
| FT-PUR-06 | Har bir qator uchun tannarx alohida (sotish narxidan farq qiladi, standart ~70%) | ✅ |

### 6.14 Hisob-fakturalar (INVOICES)

| Kod | Talab | Holat |
|---|---|---|
| FT-INV-01 | Faktura yaratish: buyurtmadan avtomatik to'ldirish (summa va mijoz) | ✅ |
| FT-INV-02 | Qisman to'lov qo'llab-quvvatlanadi, progress ko'rsatiladi | ✅ |
| FT-INV-03 | Qoldiqdan ortiq to'lov yuborilsa, faqat qoldiq qabul qilinadi | ✅ |
| FT-INV-04 | Muddati o'tgan fakturalar avtomatik "muddati o'tgan" holatiga o'tadi | ✅ |
| FT-INV-05 | Har bir to'lov moliyaga daromad sifatida yoziladi | ✅ |
| FT-INV-06 | Holatlar: qoralama → yuborilgan → to'langan / muddati o'tgan / bekor | ✅ |
| FT-INV-07 | Statistika: jami, to'lanmaganlar soni/summasi, muddati o'tganlar | ✅ |

### 6.15 Qarzlar va to'lovlar (DEBTS & PAYMENTS)

| Kod | Talab | Holat |
|---|---|---|
| FT-DEBT-01 | Mijoz bo'yicha qarz xulosasi: jami qarz, to'langan, qoldiq | ✅ |
| FT-DEBT-02 | Qarzli buyurtmalar soni va eng eski qarz sanasi ko'rsatiladi | ✅ |
| FT-DEBT-03 | Qarz to'lovi qayd etish (buyurtma bo'yicha, to'lov usuli, izoh) | ✅ |
| FT-DEBT-04 | To'lovlar tarixi sahifasi | ✅ |
| FT-DEBT-05 | Mijoz qarzini butunlay tozalash amali | ✅ |
| FT-DEBT-06 | Statistika: jami qarz, bugun to'langan, muddati o'tgan, qarzdor mijozlar | ✅ |
| FT-DEBT-07 | Har bir mijozning to'liq qarz tarixi (buyurtmalar + to'lovlar) | ✅ |

### 6.16 Filiallar (BRANCHES)

| Kod | Talab | Holat |
|---|---|---|
| FT-BR-01 | Filial yaratish, tahrirlash, o'chirish | ✅ |
| FT-BR-02 | Filial turlari: bosh ofis / filial | ✅ |
| FT-BR-03 | Filial ma'lumotlari: hudud, manzil, telefon, mas'ul, holat | ✅ |
| FT-BR-04 | Statistika: jami/faol filiallar, hududlar soni | ✅ |

### 6.17 Foydalanuvchilar va rollar (USERS)

| Kod | Talab | Holat |
|---|---|---|
| FT-USR-01 | Foydalanuvchi yaratish, tahrirlash, o'chirish (nom, email, rol, holat) | ✅ |
| FT-USR-02 | Foydalanuvchini xodimga bog'lash — ism va email avtomatik to'ldiriladi | ✅ |
| FT-USR-03 | Ruxsatlar matritsasi sahifada ko'rsatiladi (rol × modul) | ✅ |
| FT-USR-04 | Oxirgi faol administratorni o'chirish yoki rolini pasaytirish mumkin emas | ✅ |
| FT-USR-05 | Statistika: jami/faol foydalanuvchilar, adminlar, haftada faollar | ✅ |

### 6.18 Audit-log (AUDIT)

| Kod | Talab | Holat |
|---|---|---|
| FT-AUD-01 | Har bir o'zgartiruvchi so'rov (POST/PUT/PATCH/DELETE) avtomatik qayd etiladi | ✅ |
| FT-AUD-02 | Yozuvda: foydalanuvchi, rol, amal turi, entity, ID, tavsif, IP, vaqt | ✅ |
| FT-AUD-03 | Filtrlar: amal turi, sana oralig'i, qidiruv | ✅ |
| FT-AUD-04 | Statistika: jami, bugungi, create/update/delete sonlari | ✅ |
| FT-AUD-05 | Audit sahifasining o'zi audit qilinmaydi (rekursiyadan himoya) | ✅ |

### 6.19 Hisobotlar (REPORTS)

| Kod | Talab | Holat |
|---|---|---|
| FT-REP-01 | Davr tanlash: shu oy / o'tgan oy / chorak / yil boshidan / qo'lda sana oralig'i | ✅ |
| FT-REP-02 | Asosiy ko'rsatkichlar: daromad, xarajat, sof foyda, rentabellik | ✅ |
| FT-REP-03 | Oylik dinamika diagrammasi (daromad/xarajat) | ✅ |
| FT-REP-04 | Foyda va zarar jadvali: kategoriyalar kesimida, yakuniy qator bilan | ✅ |
| FT-REP-05 | Top ro'yxatlar: eng ko'p sotilgan mahsulotlar, eng yirik mijozlar | ✅ |
| FT-REP-06 | Butun hisobotni CSV eksport qilish | ✅ |

### 6.20 Global qidiruv (⌘K / Ctrl+K)

| Kod | Talab | Holat |
|---|---|---|
| FT-SEARCH-01 | Sahifalar, buyurtmalar, mijozlar, xodimlar, mahsulotlar, bitimlar bo'yicha bir joydan qidirish | ✅ |

### 6.21 Posts moduli (BLOG)

| Kod | Talab | Holat |
|---|---|---|
| FT-POST-01 | Post yaratish/tahrirlash: sarlavha, kontent, kategoriya, holat, teg | ⚠️ (qisman — DB va type mavjud, API/UI to'liq ulanmagan) |

---

## 7. Modullararo bog'liqlik (biznes mantiq)

Bu ERP'ni oddiy CRUD to'plamidan ajratib turadigan asosiy jihat — modullar bir-biriga haqiqiy biznes-mantiq orqali bog'langan:

| Amal | Natija |
|---|---|
| Buyurtma tasdiqlanadi | Ombor qoldig'i **kamayadi** + harakat jurnaliga yoziladi |
| Buyurtma bekor qilinadi / o'chiriladi | Ajratilgan tovar omborga **qaytariladi** |
| Buyurtma "to'langan" bo'ladi | Moliyaga **daromad** yoziladi, balans oshadi |
| Omborda tovar yetmaydi | Tasdiqlashga yo'l qo'yilmaydi (409, aniq xabar bilan) |
| Xarid "qabul qilingan" bo'ladi | Ombor qoldig'i **oshadi** + harakat yoziladi |
| Xarid to'lanadi | Moliyaga **xarajat** yoziladi, balans kamayadi |
| Xarid o'chiriladi | Qabul qilingan tovar ombor hisobidan chiqariladi |
| Faktura bo'yicha to'lov qabul qilinadi | Moliyaga daromad yoziladi, qoldiq qayta hisoblanadi |
| Faktura muddati o'tadi | Har so'rovda holat avtomatik "muddati o'tgan"ga o'tadi |
| Ta'til tasdiqlanadi | Xodim holati ta'til turiga qarab o'zgaradi (ta'til/kasallik) |
| Ta'til o'chiriladi yoki rad etiladi | Xodim holati qayta hisoblanadi |
| Mijoz nomi o'zgaradi | Bog'liq buyurtma va bitimlarda ham yangilanadi |
| Ta'minotchi nomi o'zgaradi | Ombordagi mahsulotlarda ham yangilanadi |
| Har qanday CRUD amali | Audit-logga yoziladi va bog'liq ko'rsatkichlar qayta hisoblanadi |

---

## 8. Nofunksional talablar

### 8.1 Ishlash (Performance)

| Kod | Talab | Holat |
|---|---|---|
| NT-PERF-01 | Sahifa yuklanishi 2 sekunddan oshmasligi kerak (oddiy sharoitda) | ✅ |
| NT-PERF-02 | TanStack Query orqali server state keshlash va invalidatsiya | ✅ |
| NT-PERF-03 | Ro'yxatlar sahifalash (odatda 10–20 ta yozuv) | ✅ |
| NT-PERF-04 | Baza yozuvlari indekslangan (sana, mijoz, ta'minotchi, sessiya, audit) | ✅ |

> ⚠️ **Ma'lum**: `persist()` har bir mutatsiyada butun jadvalni qayta yozadi (`DELETE + INSERT`). Katta hajmdagi ma'lumotlarda sekinlashishi mumkin — optimallashtirish kelajak rejasida.

### 8.2 Xavfsizlik

Batafsil [13-bo'lim](#13-xavfsizlik-talablari) da.

### 8.3 Moslashuvchanlik (Compatibility)

| Kod | Talab | Holat |
|---|---|---|
| NT-COMP-01 | Zamonaviy brauzerlar: Chrome, Firefox, Safari, Edge | ✅ |
| NT-COMP-02 | Mobile responsive (jadval/kartochka ko'rinishlari) | ✅ |
| NT-COMP-03 | Node.js >= 18 | ✅ |

### 8.4 Foydalanish qulayligi (Usability)

| Kod | Talab | Holat |
|---|---|---|
| NT-USE-01 | Klaviatura qidiruvi (⌘K / Ctrl+K) | ✅ |
| NT-USE-02 | Barcha amallar toast bildirishnoma bilan tasdiqlanadi (Sonner) | ✅ |
| NT-USE-03 | Xatolar o'qiladigan o'zbek tilida ko'rsatiladi | ✅ |
| NT-USE-04 | Yozuvlar jadval yoki kartochka ko'rinishida ko'rish mumkin | ✅ |
| NT-USE-05 | Valyuta/sana formatlash yagona manbadan (`client/lib/format.ts`) | ✅ |

### 8.5 Ishonchlilik (Reliability)

| Kod | Talab | Holat |
|---|---|---|
| NT-REL-01 | Har kecha soat 2:00 da avtomatik backup (30 kun saqlanadi) | ✅ |
| NT-REL-02 | Backend xatoliklari Winston log fayliga yoziladi | ✅ |
| NT-REL-03 | Kutilmagan xatolarda JSON javob qaytariladi (Production'da detal yashiriladi) | ✅ |

---

## 9. Arxitektura va texnologiyalar

### 9.1 Texnologik stack

**Frontend:**
- React 18 + TypeScript
- Vite 8 (build tool)
- React Router 6 (SPA rejimi)
- TailwindCSS 3 + Radix UI (accessibility-compliant komponentlar)
- TanStack Query (server state)
- Recharts (diagrammalar)
- framer-motion (animatsiyalar)
- Lucide React (ikonkalar)
- Zod (validatsiya)
- Sonner (toast)

**Backend:**
- Express 5 + TypeScript
- Zod (so'rov validatsiyasi)
- SQLite (`node:sqlite`) — development / PostgreSQL (`pg`) — production
- jsonwebtoken + scrypt (auth)
- helmet, cors, express-rate-limit (xavfsizlik)
- winston (logging)
- node-cron (backup scheduler)

### 9.2 Arxitektura qatlamlari

```
┌─────────────────────────────────────────────┐
│  CLIENT (React SPA)                         │
│  pages → hooks(use-api) → fetchApi(/api)    │
└────────────────────┬────────────────────────┘
                     │ REST JSON (Bearer token)
┌────────────────────▼────────────────────────┐
│  SERVER (Express)                           │
│  middleware → routes → validators(Zod)      │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│  DATA LAYER                                 │
│  store.ts (in-memory) ⇄ db.ts (SQLite/Postgres)│
│  persist() — mutatsiyadan keyin yozish       │
└─────────────────────────────────────────────┘
```

### 9.3 Asosiy arxitektura qarorlari

1. **Yagona ma'lumotlar ombori** (`server/data/store.ts`) — barcha route'lar xotiradagi massivlardan o'qiydi; har bir muvaffaqiyatli mutatsiyadan keyin `persist()` middleware bazaga yozadi. Natijada modullar o'zaro doim sinxron bo'ladi.
2. **Soft delete** — yozuvlar `deletedAt` belgisi bilan arxivlanadi; tarix va hisobotlar buzilmaydi.
3. **Shared types** (`shared/api.ts`) — client va server bir xil TypeScript interfeyslaridan foydalanadi.
4. **RBAC ikki nusxada** — frontend matritsa menyu/route yashirish uchun, backend matritsa haqiqiy himoya uchun (bir xil saqlanadi).
5. **Vercel moslashuvi** — `Content-Type: text/plain` bilan POST yuboriladi, chunki Vercel runtime `application/json` body'ni o'zi parse qilmoqchi bo'lib 400 qaytaradi.
6. **Demo ma'lumotlar** joriy sanaga nisbatan generatsiya qilinadi (`server/data/seed.ts`) — kalendar o'zgarganda dashboard bo'sh qolmaydi.

---

## 10. Ma'lumotlar modeli

### 10.1 Entity-relationship xulosasi

| Entity | Asosiy maydonlar | Bog'liqliklar |
|---|---|---|
| **User** | name, login, email, role, status, employeeId, passwordHash | → Employee (ixtiyoriy) |
| **Session** | token, userId, expiresAt | → User |
| **Employee** | name, position, department, status, salary, hireDate | ← User |
| **Product** | name, location, quantity, minQuantity, price, category, supplier | → Supplier (nom orqali) |
| **Customer** | name, type, contactPerson, phone, region, status | → Orders, Deals |
| **Supplier** | name, category, rating, status | → Products, Purchases |
| **Branch** | name, type (head/branch), region, manager, status | — |
| **Order** | orderNumber, customerId, items[], total, status, paymentStatus | → Customer, Product |
| **Purchase** | purchaseNumber, supplierId, items[], total, status | → Supplier, Product |
| **Invoice** | invoiceNumber, orderId, customerId, amount, paidAmount, status | → Order, Customer |
| **DebtPayment** | orderId, customerId, amount, paymentMethod | → Order, Customer |
| **Deal** | clientName, status, value, expectedCloseDate, assignedTo | → Customer (nom orqali) |
| **Transaction** | title, category, account, date, amount, type | — |
| **AttendanceRecord** | employeeId, date, status, checkIn, checkOut, hours | → Employee |
| **LeaveRequest** | employeeId, type, startDate, endDate, status | → Employee |
| **Payroll** | employeeId, period, baseSalary, presentDays, netSalary, status | → Employee |
| **StockMovement** | productId, type, quantity, balanceAfter, reason, reference | → Product |
| **Sale / Refund** | saleNumber, items[], total, paymentMethod, sellerId, branchId | → Product, User, Branch |
| **AuditLog** | userId, action, entity, summary, ipAddress, timestamp | → User |
| **Post** | title, content, category, status, tags, viewCount | → User (author) |

### 10.2 Muhim texnik jihatlar

- Ichma-ich ro'yxatlar (buyurtma/xarid/sotuv qatorlari) JSON ustunlarda saqlanadi.
- `deletedAt` ustuni soft-delete jadvallarida mavjud (migratsiya orqali qo'shiladi).
- Unikallik indekslari: users.email, users.login, sales.saleNumber, refunds.refundNumber, employees.email.
- PostgreSQL rejimida `DATABASE_URL` orqali ishlaydi; `node:sqlite` rejimi `DATABASE_PATH` orqali.

---

## 11. API spetsifikatsiyasi

### 11.1 Umumiy qoidalar

- Barcha API yo'llari `/api` prefiksi bilan boshlanadi.
- Javob formati: `{ success: boolean, data?: T, message?: string }`.
- Xatolar: 400 (validatsiya), 401 (avtorizatsiya), 403 (ruxsat yo'q), 404 (topilmadi), 409 (biznes ziddiyat), 500 (server xatosi).
- O'zgartiruvchi so'rovlar `Authorization: Bearer <token>` talab qiladi.
- Noma'lum API yo'li: `404 JSON { success: false, message: "Endpoint topilmadi" }`.

### 11.2 Endpointlar ro'yxati (to'liq)

**Auth:**
- `POST /api/auth/login` — kirish (rate limit: 15 daqiqa / 5 urinish)
- `POST /api/auth/logout` — chiqish
- `GET /api/auth/me` — joriy foydalanuvchi
- `POST /api/auth/change-password` — parol o'zgartirish

**Dashboard:**
- `GET /api/dashboard/stats` — asosiy ko'rsatkichlar
- `GET /api/dashboard/trend` — kunlik kirim/xarajat
- `GET /api/dashboard/activities` — so'nggi faolliklar
- `GET /api/dashboard/alerts` — ogohlantirishlar

**Finance:**
- `GET /api/finance/stats`, `GET /api/finance/breakdown`, `GET /api/finance/categories`
- `GET /api/finance/transactions`, `GET /api/finance/transactions/export` (CSV)
- `POST /api/finance/transactions`, `PUT/DELETE /api/finance/transactions/:id`

**HR:**
- `GET /api/hr/stats`, `GET /api/hr/breakdown`, `GET /api/hr/departments`
- `GET/POST /api/hr/employees`, `PUT/DELETE /api/hr/employees/:id`

**Warehouse:**
- `GET /api/warehouse/stats`, `GET /api/warehouse/breakdown`, `GET /api/warehouse/filters`
- `GET /api/warehouse/movements`
- `GET/POST /api/warehouse/products`, `PUT/DELETE /api/warehouse/products/:id`
- `POST /api/warehouse/products/:id/adjust` — qoldiq tuzatish
- `POST /api/warehouse/restock` — tanqislarni to'ldirish

**Sales & POS:**
- `GET /api/sales/stats`, `GET/POST /api/sales`, `POST /api/sales/:id/refund`, `DELETE /api/sales/:id`
- `GET /api/pos/products`, `GET /api/pos/categories`, `POST /api/pos/transaction` ⚠️ (demo)

**CRM:**
- `GET /api/crm/stats`, `GET /api/crm/breakdown`, `GET /api/crm/funnel`
- `GET/POST /api/crm/deals`, `PUT/DELETE /api/crm/deals/:id`

**Orders:**
- `GET /api/orders/stats`, `GET /api/orders/breakdown`
- `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders`, `PUT/DELETE /api/orders/:id`

**Customers:**
- `GET /api/customers/stats`, `GET /api/customers/regions`
- `GET /api/customers`, `GET /api/customers/:id`, `POST /api/customers`, `PUT/DELETE /api/customers/:id`

**Suppliers:**
- `GET /api/suppliers/stats`, `GET /api/suppliers/categories`
- `GET /api/suppliers`, `GET /api/suppliers/:id`, `POST /api/suppliers`, `PUT/DELETE /api/suppliers/:id`

**Branches:**
- `GET /api/branches/stats`, `GET/POST /api/branches`, `PUT/DELETE /api/branches/:id`

**Purchases:**
- `GET /api/purchases/stats`, `GET/POST /api/purchases`, `PUT/DELETE /api/purchases/:id`

**Invoices:**
- `GET /api/invoices/stats`, `GET/POST /api/invoices`
- `POST /api/invoices/:id/payment`, `PUT/DELETE /api/invoices/:id`

**Debts:**
- `GET /api/debts/stats`
- `GET /api/debts/customers`, `GET /api/debts/customers/:customerId/history`
- `GET/POST /api/debts/payments`, `DELETE /api/debts/customers/:customerId`

**Attendance & Leave:**
- `GET /api/attendance/stats`, `GET/POST /api/attendance`, `DELETE /api/attendance/clear`
- `GET /api/leave/stats`, `GET/POST /api/leave`, `PUT/DELETE /api/leave/:id`

**Payroll:**
- `GET /api/payroll/stats`, `GET /api/payroll/periods`, `GET /api/payroll`
- `POST /api/payroll/calculate`, `PUT/DELETE /api/payroll/:id`

**Users:**
- `GET /api/users/stats`, `GET /api/users/roles`
- `GET/POST /api/users`, `PUT/DELETE /api/users/:id`

**Reports:**
- `GET /api/reports/summary`, `GET /api/reports/export` (CSV)

**Audit:**
- `GET /api/audit-logs/stats`, `GET /api/audit-logs`

---

## 12. Ruxsatlar matritsasi (RBAC)

`manage` = to'liq boshqarish, `view` = faqat ko'rish, bo'sh = kirish yo'q.

| Modul | admin | manager | accountant | cashier | hr_manager | warehouse | sales | viewer |
|---|---|---|---|---|---|---|---|---|
| dashboard | manage | manage | view | — | — | — | — | view |
| finance | manage | view | manage | — | — | — | — | — |
| hr | manage | view | — | — | manage | — | — | — |
| warehouse | manage | manage | — | — | — | manage | — | — |
| crm | manage | manage | — | — | — | — | view | — |
| sales | manage | manage | — | manage | — | — | manage | — |
| reports | manage | manage | view | view | view | view | view | view |
| users | manage | — | — | — | — | — | — | — |
| audit | manage | — | — | — | — | — | — | — |
| posts | manage | — | — | — | — | — | — | — |

**Muhim:** Matritsa ikki faylda saqlanadi va ular **doim sinxron** bo'lishi kerak:
- `client/lib/permissions.ts` (frontend — menyu/route himoyasi)
- `server/lib/permissions.ts` (backend — haqiqiy himoya)

---

## 13. Xavfsizlik talablari

| Kod | Talab | Holat |
|---|---|---|
| SEC-01 | Parollar scrypt bilan, har biri uchun alohida tuz bilan hashlanadi | ✅ |
| SEC-02 | Parol taqqoslash `timingSafeEqual` orqali (vaqt hujumidan himoya) | ✅ |
| SEC-03 | JWT access (12s) + refresh (7k) tokenlar; refresh tokenlar bazada saqlanadi | ✅ |
| SEC-04 | `helmet` HTTP xavfsizlik sarlavhalari | ✅ |
| SEC-05 | CORS — ruxsat etilgan originlar ro'yxati | ✅ |
| SEC-06 | Global rate limit: 15 daqiqa / 100 so'rov | ✅ |
| SEC-07 | Login rate limit: 15 daqiqa / 5 urinish | ✅ |
| SEC-08 | Barcha so'rovlar Zod bilan validatsiya qilinadi (SQL injection himoyasi) | ✅ |
| SEC-09 | RBAC — backend har bir modul so'rovini tekshiradi | ✅ |
| SEC-10 | Audit-log — har bir o'zgartirish kim/qachon/IP bilan yoziladi | ✅ |
| SEC-11 | Production xatolarida tafsilotlar yashiriladi (faqat umumiy xabar) | ✅ |
| SEC-12 | `passwordHash` hech qachon API javobida qaytmaydi | ✅ |
| SEC-13 | Admin paroli va JWT secretlar `.env` orqali, standart qiymatlar ishlab chiqarishda taqiqlanadi | ✅ |
| SEC-14 | Muddati o'tgan sessiyalar server ishga tushganda tozalanadi | ✅ |

---

## 14. Test talablari

| Kod | Talab | Holat |
|---|---|---|
| TST-01 | `pnpm typecheck` — TypeScript xatosiz o'tadi | ✅ |
| TST-02 | `pnpm test` — Vitest testlari o'tadi | ✅ |
| TST-03 | Auth testlari (`server/lib/auth.test.ts`) | ✅ |
| TST-04 | Validator testlari (`server/lib/validators.test.ts`) | ✅ |
| TST-05 | Format util testlari (`client/lib/format.spec.ts`, `utils.spec.ts`) | ✅ |
| TST-06 | API endpoint integration testlari | ❌ (rejada) |
| TST-07 | E2E testlar (Playwright) | ❌ (rejada) |
| TST-08 | Test qamrovi 80%+ | ❌ (rejada) |

---

## 15. Deploy va operatsiya

### 15.1 Deploy variantlari

| Usul | Buyruq | Izoh |
|---|---|---|
| Mahalliy production | `pnpm build` + `pnpm start` | `dist/server/node-build.mjs` |
| PM2 | `pm2 start dist/server/node-build.mjs --name "fusion-erp"` | Tavsiya etilgan |
| Docker | `docker build -t fusion-erp .` + `docker run -p 8080:8080` | — |
| Vercel | `pnpm build:vercel` | Serverless; custom body-parsing trick ishlatiladi |
| Netlify | `pnpm build:vercel` | `netlify/functions/api.ts` |

### 15.2 Production env o'zgaruvchilari

| O'zgaruvchi | Tavsif | Majburiy |
|---|---|---|
| `NODE_ENV` | production | ✅ |
| `DATABASE_URL` | PostgreSQL ulanish | ✅ (production) |
| `JWT_SECRET` | Access token secret (>=32 belgi, random) | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token secret (random) | ✅ |
| `ADMIN_EMAIL` | Admin email | ✅ |
| `ADMIN_PASSWORD` | Admin parol (kuchli) | ✅ |
| `ALLOWED_ORIGINS` | CORS originlar | ⚠️ |
| `BACKUP_ENABLED` | Backup yoqish | ⚠️ |
| `BACKUP_SCHEDULE` | Cron ifoda (standart: `0 2 * * *`) | ⚠️ |

### 15.3 Backup

- `node-cron` orqali har kecha soat 2:00 da avtomatik backup.
- Backup fayllari `BACKUP_RETENTION_DAYS` (standart 30 kun) davomida saqlanadi.
- Qo'lda: `npm run backup`, tozalash: `npm run backup:clean`.

---

## 16. Qabul mezonlari

Loyiha quyidagi shartlarning barchasi bajarilganda qabul qilinadi:

### 16.1 Funksional
- [ ] 6-bo'limdagi barcha `✅` talablar ish holatida va tekshirilgan
- [ ] Modullararo bog'liqlik (7-bo'lim) to'liq ishlaydi — sotuv ombor/moliya bilan sinxron
- [ ] POS moduli real ma'lumotlar bilan ishlaydi (hozingi demo emas) — **ochiq masala**
- [ ] Rol asosidagi kirish cheklovlari backend darajasida samarali

### 16.2 Texnik
- [ ] `pnpm typecheck` xatosiz
- [ ] `pnpm test` barcha testlar o'tadi
- [ ] `pnpm build` muvaffaqiyatli
- [ ] Production deploy ishga tushadi (PM2 yoki Vercel/Netlify)

### 16.3 Xavfsizlik
- [ ] JWT secretlar va admin parol o'zgartirilgan
- [ ] Standart parollar ishlatilmaydi (`npm run check:env` toza)
- [ ] HTTPS yoqilgan
- [ ] Backup tizimi ishlayapti

---

## 17. Kelajak rejalari

### Qisqa muddat (1–2 hafta)
- [ ] POS modulini real qilish (`/api/pos/*` — demo ma'lumot o'rniga haqiqiy mahsulot/qoldiq)
- [ ] Posts moduli API va UI ni to'liq ulash
- [ ] Email xizmati (SMTP) — parolni tiklash, bildirishnomalar
- [ ] PDF hisobotlar (invoice, hisobot eksporti)

### O'rta muddat (1 oy)
- [ ] Monitoring va error tracking (Sentry)
- [ ] Performance optimizatsiya (query, indeks, CDN)
- [ ] i18n (o'zbek/ingliz/rus)
- [ ] Dark mode
- [ ] Test qamrovini oshirish (integration + E2E)

### Uzoq muddat (2–3 oy)
- [ ] Multi-tenant (har kompaniya uchun alohida schema)
- [ ] Real-time yangilanishlar (WebSocket)
- [ ] Mobile ilova (React Native)
- [ ] AI/ML: sotuv prognozi, ombor optimizatsiyasi
- [ ] Integratsiyalar: 1C, Telegram bot, Click/Payme

---

## Ilova A: Mualliflik va tasdiqlash

| Rol | Ism | Sana | Imzo |
|---|---|---|---|
| Tayyorlovchi | — | 2026-08-06 | |
| Buyurtmachi | — | | |
| Dasturchi | — | | |
| Tester | — | | |

---

*Hujjat loyiha kod bazasi va amaldagi hujjatlarga asoslanib tayyorlandi. Har qanday o'zgarish ushbu hujjatda qayd etilishi shart.*
