# Fusion Starter - Professional ERP System

Bu Fusion Starter loyihasi to'liq funksional professional darajadagi ERP tizimi. Har bir sahifa va element haqiqiy CRUD amallar, filtrlash, sahifalash va real-time statistika bilan ishlaydi.

## 🚀 Asosiy Funksional Imkoniyatlar

### 1. Bosh Panel (Dashboard) - `/`
- **Real-time statistikalar**: joriy oy ma'lumotlaridan hisoblangan daromad, xarajat, foyda, xodimlar soni (o'tgan oyga nisbatan foizli o'zgarish bilan)
- **Interaktiv grafik**: joriy oyning har bir kuni bo'yicha kirim/xarajat, sichqoncha bilan tafsilotlarni ko'rish
- **Jonli ogohlantirishlar**: tanqis mahsulotlar, muddati o'tgan va yaqin bitimlar — muammo bartaraf bo'lsa avtomatik yo'qoladi
- **Faollik jurnali**: barcha bo'limlardagi CRUD amallar avtomatik qayd etiladi
- **Ombor holati kartasi**: real qoldiq va tanqis mahsulot soni, tezkor omborga o'tish
- **Hisobot olish**: joriy oy tranzaksiyalarini CSV formatida yuklab olish

**API Endpointlar:**
- `GET /api/dashboard/stats` — asosiy ko'rsatkichlar
- `GET /api/dashboard/trend` — kunlik kirim/xarajat grafigi
- `GET /api/dashboard/activities` — so'nggi faolliklar
- `GET /api/dashboard/alerts` — jonli ogohlantirishlar

### 2. Moliya Markazi - `/finance`
- **To'liq tranzaksiya boshqaruvi**: yaratish, tahrirlash, o'chirish
- **Kuchli filtrlash**: turi, kategoriya, sana oralig'i, matnli qidiruv (debounce bilan)
- **CSV eksport**: joriy filtrga mos yozuvlarni yuklab olish
- **Real-time hisobotlar**: joriy balans butun tarix bo'yicha, oylik kirim/chiqim joriy oydan hisoblanadi

**API Endpointlar:**
- `GET/POST /api/finance/transactions`, `PUT/DELETE /api/finance/transactions/:id`
- `GET /api/finance/transactions/export` — CSV eksport
- `GET /api/finance/categories` — mavjud kategoriyalar
- `GET /api/finance/stats`

### 3. Xodimlar Bo'limi (HR) - `/hr`
- **Xodimlar boshqaruvi**: yaratish, tahrirlash (holat, maosh, bo'lim va h.k.), o'chirish
- **Filtrlash**: bo'lim, holat (ishda/ta'tilda/kasallik), matnli qidiruv
- **Email dublikatini tekshirish**: bir xil email bilan ikkinchi xodim qo'shilmaydi
- **Sahifalash**: 10 tadan yozuv

**API Endpointlar:**
- `GET/POST /api/hr/employees`, `PUT/DELETE /api/hr/employees/:id`
- `GET /api/hr/departments`, `GET /api/hr/stats`

### 4. Ombor Boshqaruvi - `/warehouse`
- **Mahsulot inventarizatsiyasi**: yaratish, tahrirlash, o'chirish
- **Tanqis qoldiq nazorati**: minimal chegaradan past mahsulotlar avtomatik belgilanadi
- **"Buyurtma berish"**: bitta bosishda barcha tanqis mahsulotlar qoldig'ini to'ldiradi
- **Filtrlash**: kategoriya, ombor joyi, faqat tanqis mahsulotlar, qidiruv

**API Endpointlar:**
- `GET/POST /api/warehouse/products`, `PUT/DELETE /api/warehouse/products/:id`
- `POST /api/warehouse/restock` — tanqis mahsulotlarni to'ldirish
- `GET /api/warehouse/filters`, `GET /api/warehouse/stats`

### 5. Savdo Bo'limi (CRM) - `/crm`
- **Bitimlar boshqaruvi**: yaratish, tahrirlash, o'chirish
- **Savdo voronkasi**: bosqichlar bo'yicha vizual diagramma, bosish orqali filtrlash
- **Tezkor yopish**: jadval menyusidan bitimni "Yutuq" yoki "Yo'qotilgan" deb belgilash
- **Muddat nazorati**: kutilayotgan yopilish sanasi o'tgan bitimlar alohida ko'rsatiladi

**API Endpointlar:**
- `GET/POST /api/crm/deals`, `PUT/DELETE /api/crm/deals/:id`
- `GET /api/crm/funnel` — voronka bosqichlari
- `GET /api/crm/stats`

### 6. Buyurtmalar - `/orders`
ERP yadrosi: mijoz, ombor va moliyani bog'laydigan asosiy hujjat.
- **Ko'p qatorli buyurtma**: bitta hujjatda bir nechta mahsulot, har biri uchun miqdor va narx surati
- **Bosqichlar**: qoralama → tasdiqlangan → jo'natilgan → yetkazilgan (yoki bekor qilingan)
- **Avtomatik ombor harakati**: buyurtma tasdiqlanganda qoldiq kamayadi, bekor qilinganda tiklanadi
- **Avtomatik daromad**: to'lov "to'langan" holatiga o'tganda moliyaga kirim yozuvi qo'shiladi
- **Qoldiq nazorati**: omborda yetarli tovar bo'lmasa tasdiqlashga yo'l qo'yilmaydi
- **Tahlil**: bosqichlar taqsimoti, top mijozlar, ko'p sotilgan mahsulotlar

**API:** `GET/POST /api/orders`, `PUT/DELETE /api/orders/:id`, `GET /api/orders/stats`, `GET /api/orders/breakdown`

### 7. Mijozlar - `/customers`
- **Mijoz kartotekasi**: tashkilot yoki jismoniy shaxs, aloqa shaxsi, telefon, email, hudud
- **Filtrlash**: turi, hudud, holat (faol/arxiv), matnli qidiruv
- **Bog'liqlik nazorati**: buyurtmasi bor mijozni o'chirib bo'lmaydi — arxivga o'tkaziladi
- **Nom o'zgarishi**: mijoz nomi o'zgarsa, bog'liq buyurtma va bitimlarda ham yangilanadi

**API:** `GET/POST /api/customers`, `PUT/DELETE /api/customers/:id`, `GET /api/customers/:id` (buyurtma va bitimlar tarixi bilan)

### 8. Ta'minotchilar - `/suppliers`
- **Ta'minotchi kartotekasi**: aloqa ma'lumotlari, kategoriya, 1–5 yulduzli baho
- **Bog'liqlik nazorati**: mahsuloti bog'langan ta'minotchini o'chirib bo'lmaydi
- **Nom o'zgarishi**: ta'minotchi nomi o'zgarsa, ombordagi mahsulotlarda ham yangilanadi

**API:** `GET/POST /api/suppliers`, `PUT/DELETE /api/suppliers/:id`, `GET /api/suppliers/:id` (mahsulotlari bilan)

### 9. Ombor harakatlari
Har bir qoldiq o'zgarishi jurnalga yoziladi: kirim, chiqim yoki qo'lda tuzatish.
- Buyurtma bo'yicha chiqim (hujjat raqami bilan)
- Xarid buyurtmasi bo'yicha kirim
- Qo'lda tuzatish (inventarizatsiya, yaroqsizga chiqarish)
- Har bir yozuvda harakatdan keyingi qoldiq saqlanadi

**API:** `GET /api/warehouse/movements`, `POST /api/warehouse/products/:id/adjust`

### 10. Xaridlar - `/purchases`
Ta'minotchiga beriladigan xarid buyurtmasi — savdo buyurtmasining teskari tomoni.
- **Bosqichlar**: qoralama → buyurtma berilgan → qabul qilingan (yoki bekor qilingan)
- **Avtomatik kirim**: "qabul qilingan" holatida ombor qoldig'i **oshadi** va harakat yoziladi
- **Avtomatik xarajat**: to'lov yakunlanganda moliyaga chiqim yozuvi qo'shiladi
- **Tannarx**: har bir qator uchun alohida (sotish narxidan farq qiladi, standart ~70%)

**API:** `GET/POST /api/purchases`, `PUT/DELETE /api/purchases/:id`, `GET /api/purchases/stats`

### 11. Hisob-fakturalar - `/invoices`
- **Buyurtmadan avtomatik**: buyurtma tanlansa summa va mijoz o'zi to'ldiriladi
- **Qisman to'lov**: bir necha bosqichda to'lash qo'llab-quvvatlanadi, progress ko'rsatiladi
- **Ortiqcha to'lovdan himoya**: qoldiqdan ko'p summa yuborilsa faqat qoldiq qabul qilinadi
- **Muddat nazorati**: to'lov sanasi o'tgan fakturalar avtomatik "muddati o'tgan" bo'ladi
- **Avtomatik daromad**: har bir to'lov moliyaga kirim sifatida yoziladi

**API:** `GET/POST /api/invoices`, `POST /api/invoices/:id/payment`, `PUT/DELETE /api/invoices/:id`

### 12. Davomat va ta'til - `/attendance`
Ikki tabli sahifa: kunlik davomat jurnali va ta'til so'rovlari.
- **Davomat**: kelgan / kechikkan / masofadan / kelmagan / ta'tilda, kelish-ketish vaqti bilan
- **Sana bo'yicha filtr**: istalgan kunning davomatini ko'rish
- **Ta'til so'rovlari**: tasdiqlash va rad etish oqimi
- **Avtomatik holat**: tasdiqlangan ta'til bugungi kunni qamrasa, xodim holati o'zi o'zgaradi

**API:** `GET /api/attendance`, `POST /api/attendance`, `GET/POST /api/leave`, `PUT/DELETE /api/leave/:id`

### 13. Foydalanuvchilar va rollar - `/users`
- **6 ta rol**: administrator, rahbar, buxgalter, ombor xodimi, sotuv menejeri, kuzatuvchi
- **Ruxsatlar matritsasi**: har bir rol qaysi bo'limlarni ochishi ko'rsatilgan
- **Xodimga bog'lash**: hisob ochishda xodim tanlansa ism va email avtomatik to'ladi
- **Himoya**: oxirgi faol administratorni o'chirib yoki roli pasaytirib bo'lmaydi

**API:** `GET/POST /api/users`, `PUT/DELETE /api/users/:id`, `GET /api/users/roles`

### 14. Hisobotlar - `/reports`
- **Davr tanlash**: shu oy / o'tgan oy / chorak / yil boshidan yoki qo'lda sana oralig'i
- **Asosiy ko'rsatkichlar**: daromad, xarajat, sof foyda, rentabellik
- **Oylik dinamika**: daromad va xarajat ustunli diagrammasi
- **Foyda va zarar jadvali**: kategoriyalar kesimida, yakuniy qator bilan
- **Top ro'yxatlar**: eng ko'p sotilgan mahsulotlar va eng yirik mijozlar
- **CSV eksport**: butun hisobotni faylga yuklab olish

**API:** `GET /api/reports/summary`, `GET /api/reports/export`

### 15. Sozlamalar - `/settings`
Profil ma'lumotlari va bildirishnoma sozlamalari.

### 11. Filiallar - `/branches`
Kompaniya filiallari bo'yicha umumiy ko'rsatkichlar.

### 12. Global qidiruv (⌘K / Ctrl+K)
Sahifalar, buyurtmalar, mijozlar, xodimlar, mahsulotlar va bitimlar bo'yicha bir joydan qidirish.

## 🔗 Modullararo bog'liqlik

Bu ERP'ni oddiy CRUD to'plamidan ajratib turadigan asosiy jihat — modullar bir-biriga
haqiqiy biznes-mantiq orqali bog'langan:

| Amal | Natijasi |
|---|---|
| Buyurtma tasdiqlanadi | Ombor qoldig'i **kamayadi** + harakat jurnaliga yoziladi |
| Buyurtma bekor qilinadi / o'chiriladi | Ajratilgan tovar omborga qaytariladi |
| Buyurtma "to'langan" bo'ladi | Moliyaga **daromad** yoziladi, balans oshadi |
| Omborda tovar yetmaydi | Tasdiqlashga yo'l qo'yilmaydi (409, aniq xabar bilan) |
| Xarid "qabul qilingan" bo'ladi | Ombor qoldig'i **oshadi** + harakat yoziladi |
| Xarid to'lanadi | Moliyaga **xarajat** yoziladi, balans kamayadi |
| Xarid o'chiriladi | Qabul qilingan tovar ombor hisobidan chiqariladi |
| Faktura bo'yicha to'lov qabul qilinadi | Moliyaga daromad yoziladi, qoldiq qayta hisoblanadi |
| Faktura muddati o'tadi | Har so'rovda holat avtomatik "muddati o'tgan" ga o'tadi |
| Ta'til tasdiqlanadi | Xodim holati ta'til turiga qarab o'zgaradi (ta'til / kasallik) |
| Ta'til o'chiriladi yoki rad etiladi | Xodim holati qayta hisoblanadi |
| Mijoz nomi o'zgaradi | Bog'liq buyurtma va bitimlarda ham yangilanadi |
| Ta'minotchi nomi o'zgaradi | Ombordagi mahsulotlarda ham yangilanadi |
| Har qanday CRUD amali | Faollik jurnaliga yoziladi va bog'liq ko'rsatkichlar qayta hisoblanadi |

## 🐛 Tuzatilgan xatolar

| Xato | Tuzatish |
|---|---|
| `attendanceRate` bandlik holatidan hisoblanardi — bu davomat emas edi | Endi haqiqiy kunlik davomat yozuvlaridan hisoblanadi; ta'tildagilar hisobdan chiqariladi |
| `openPositions` formulasi `12 - xodimlar soni` edi va 24 xodimda **doim 0** chiqardi | Endi bo'limlar bo'yicha shtat rejasidan hisoblanadi |
| `onVacationToday` xodim yozuvidagi statusga tayanardi | Endi tasdiqlangan ta'til so'rovlaridan sanaladi |

## 🛠 Texnik Imkoniyatlar

### Frontend
- React 18 + TypeScript, React Query (server state, cache invalidation), React Router 6
- Radix UI (accessibility-compliant), TailwindCSS, Sonner (toast), React Hook Form uslubidagi validatsiya, Lucide React

### Backend
- Express.js + TypeScript, Zod bilan so'rov validatsiyasi
- Yagona in-memory store (`server/data/store.ts`) — barcha modullar bir xil ma'lumotdan foydalanadi
- Hisoblangan statistika (`server/data/metrics.ts`) — CRUD amali darhol barcha bog'liq ko'rsatkichlarga ta'sir qiladi
- Har bir CRUD amali faollik jurnaliga yoziladi

### Arxitektura
- Monorepo: client, server, shared kod
- API-First Design, to'liq TypeScript type safety (shared/api.ts)
- Umumiy UI komponentlari: DataTable, CardGrid, ConfirmDialog, PageKit, FormField, Breakdown
- Demo ma'lumotlar joriy sanaga nisbatan generatsiya qilinadi (`server/data/seed.ts`) —
  kalendar keyingi oyga o'tganda ham dashboard bo'sh qolmaydi

## 🖥 Ko'rinish rejimlari
Buyurtmalar, Mijozlar, Ta'minotchilar, Xodimlar, Ombor, Bitimlar va Moliya bo'limlarida
ma'lumotni **jadval** yoki **kartochka** ko'rinishida ko'rish mumkin — o'ng yuqoridagi
almashtirgich orqali.

## 📊 Ma'lumotlar Formatlash
- `client/lib/format.ts` — valyuta, sana, foiz, nisbiy vaqt formatlash yagona manbadan
- Pul formati: `1,000,000 so'm` (vergul bilan ajratilgan)
- Telefon: faqat raqam qabul qiladi, `+998 XX XXX XX XX` shaklida ko'rsatiladi
- Modal oynalardagi pul maydonlari yozayotganda avtomatik ajratiladi

## 🚀 Production Ready
- ✅ `npm run typecheck` — xatosiz
- ✅ `npm run build` — client va server muvaffaqiyatli build bo'ladi
- ✅ `npm run test` — barcha testlar o'tadi
- ✅ Har bir CRUD amali server tomonida validatsiya qilinadi (Zod)
- ✅ 404 va server xatolari JSON formatida qaytariladi
- ✅ Mobile responsive, keyboard-accessible (⌘K, focus states)
