# Changelog

Barcha muhim o'zgarishlar shu faylda yozib boriladi.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) asosida.

## [2.0.0] - 2026-08-05

### 🔒 Xavfsizlik (Security)

#### Qo'shildi
- **JWT Autentifikatsiya**: Access token (12 soat) va refresh token (7 kun) tizimi
- **Scrypt Parol Hashlash**: Har bir foydalanuvchi uchun alohida salt
- **Rate Limiting**: API (100/15min) va login (5/15min) cheklovi
- **Helmet**: HTTP sarlavhalarini xavfsizlashtirish middleware
- **CORS**: Faqat ruxsat etilgan domenlardan so'rovlar
- **Zod Validation**: Barcha API endpoint'lar uchun input validatsiya
- **Audit Logging**: Barcha muhim amallar tarixini saqlash
- **Environment Variables**: Parol va secretlarni .env dan o'qish

#### O'zgartirildi
- Standart parollar environment variable'larga ko'chirildi
- CORS sozlamalari qattiqlashtir ildi
- Error handling yaxshilandi (production/development rejim)

#### Olib tashlandi
- ❌ Ochiq parollar hujjatlardan olib tashlandi
- ❌ In-memory production database (PostgreSQL majburiy)

### 🗄️ Database

#### Qo'shildi
- **PostgreSQL qo'llab-quvvatlash**: Production muhitlar uchun
- **Database abstraction**: SQLite va PostgreSQL uchun bir xil API
- **Migrations tizimi**: Avtomatik schema yangilanishi
- **Avtomatik backup**: Har kuni soat 2:00 da (sozlanishi mumkin)
- **Backup retention**: 30 kunlik zaxiralar saqlash

#### O'zgartirildi
- SQLite faqat development uchun
- DATABASE_URL orqali connection string

### 📝 Logging va Monitoring

#### Qo'shildi
- **Winston Logger**: Professional logging tizimi
- **Log rotation**: 10MB dan keyin yangi fayl
- **Error tracking**: Alohida error.log fayli
- **Request logging**: Har bir HTTP so'rov yoziladi
- **Security events**: Xavfsizlik hodisalari log'lanadi

### 📚 Hujjatlashtirish

#### Qo'shildi
- `README.md` - Loyiha umumiy tavsifi
- `INSTALLATION.md` - Batafsil o'rnatish qo'llanmasi
- `SECURITY.md` - Xavfsizlik best practices
- `USER_GUIDE.md` - Foydalanuvchi qo'llanmasi (70+ sahifa)
- `CHANGELOG.md` - O'zgarishlar tarixi
- `.env.example` - Environment variable'lar namunasi

#### O'zgartirildi
- `DEPLOY.md` to'liq qayta yozildi (PostgreSQL focus)
- `AGENTS.md` yangilandi (yangi texnologiyalar)

### 🛠️ Development

#### Qo'shildi
- **NPM scripts**: 
  - `pnpm check:security` - Zaifliklarni tekshirish
  - `pnpm check:env` - .env fayli xavfsizligini tekshirish
  - `pnpm backup` - Qo'lda backup yaratish
  - `pnpm backup:clean` - Eski backuplarni tozalash
- **Node.js 18+ qo'llab-quvvatlash**: Eski versiya talabi olib tashlandi

#### Dependencies
- Qo'shildi:
  - `express-rate-limit` ^7.5.0
  - `helmet` ^8.0.0
  - `winston` ^3.17.0
  - `pg` ^8.13.1 (PostgreSQL)
  - `bcrypt` ^5.1.1
  - `jsonwebtoken` ^9.0.2
  - `node-cron` ^3.0.3

### 🐛 Tuzatilgan Muammolar

#### Kritik
- ✅ Production'da ma'lumotlar yo'qolishi muammosi (in-memory DB)
- ✅ CORS har qanday domendan so'rov qabul qilish
- ✅ Brute-force hujumlarga himoyasizlik
- ✅ Standart parollar hujjatlarda ochiq turishi
- ✅ SQL injection xavflari (parametrlangan so'rovlar)

#### Muhim
- ✅ Input validation yo'qligi
- ✅ Error handling zaif
- ✅ Log tizimi yo'q
- ✅ Backup tizimi yo'q
- ✅ Session management zaif

## [1.0.0] - 2026-07-01

### Qo'shildi
- Asosiy modullar (Dashboard, Moliya, HR, Ombor, CRM)
- SQLite database
- Basic authentication
- RBAC (Role-Based Access Control)
- React 18 + TypeScript frontend
- Express backend
- TailwindCSS + Radix UI

### Ma'lum Muammolar
- Production database in-memory (ma'lumot yo'qoladi)
- Xavfsizlik zaif
- Hujjatlar cheklangan
- Backup yo'q
- Monitoring yo'q

---

## Yangilanish Rejasi (Keyinchalik)

### v2.1.0 (Rejadagi)
- [ ] Email bildirishnomalar (SMTP)
- [ ] PDF hisobotlar
- [ ] Multi-language support (i18n)
- [ ] Dark mode
- [ ] Mobile responsive yaxshilash
- [ ] PWA qo'llab-quvvatlash

### v2.2.0 (Rejadagi)
- [ ] Multi-tenant arxitekturasi
- [ ] Real-time yangilanishlar (WebSocket)
- [ ] Advanced analytics va BI
- [ ] Export to 1C/accounting software
- [ ] Telegram bot integration

### v3.0.0 (Uzoq muddatli)
- [ ] Mobile app (React Native)
- [ ] AI/ML bashoratlar
- [ ] Blockchain integration (payment tracking)
- [ ] Microservices arxitekturasi
- [ ] GraphQL API

---

**Format:**
- `Qo'shildi` - Yangi xususiyatlar
- `O'zgartirildi` - Mavjud funksionallik o'zgarishi
- `Tuzatildi` - Bug fix'lar
- `Olib tashlandi` - O'chirilgan funksionallik
- `Xavfsizlik` - Xavfsizlik muammolari va yechimlar

