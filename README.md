# Fusion ERP - Kichik va O'rta Biznes Uchun

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

To'liq funksional, production-ready ERP tizimi React, TypeScript va Express bilan qurilgan.

## ✨ Asosiy Imkoniyatlar

### 📊 Biznes Modullari

- **Dashboard** - Real-time biznes ko'rsatkichlari
- **Moliya** - Kirim/chiqim, hisob-kitob, bank operatsiyalari
- **Kadrlar** - Xodimlar boshqaruvi, davomat, ta'til, ish haqi
- **Ombor** - Mahsulotlar inventarizatsiyasi, qoldiq nazorati
- **Sotuvlar** - POS tizimi, sotuv tarixi, chegirmalar
- **CRM** - Mijozlar bilan ishlash, bitimlar voronkasi
- **Buyurtmalar** - Savdo buyurtmalari, yetkazish, to'lovlar
- **Xaridlar** - Ta'minotchilar, xarid buyurtmalari
- **Hisob-fakturalar** - Invoicing, to'lov tracking
- **Qarzlar** - Mijoz qarzlari, to'lov tarixi
- **Hisobotlar** - Moliyaviy hisobotlar, eksport
- **Filiallar** - Bir nechta joylashuvlar
- **Foydalanuvchilar** - Rol-based access control (RBAC)
- **Audit Log** - Barcha amallar tarixi

### 🔒 Xavfsizlik

- JWT autentifikatsiya (access va refresh tokenlar)
- Bcrypt parol hashing
- Rate limiting (brute force himoyasi)
- Helmet.js HTTP xavfsizlik sarlavhalari
- CORS sozlamalari
- Role-based permissions (6 ta rol)
- Audit logging
- Input validation (Zod)
- SQL injection himoyasi

### 🚀 Texnologiyalar

**Frontend:**
- React 18 + TypeScript
- React Router 6 (SPA)
- TailwindCSS 3 + Radix UI
- TanStack Query
- Zod validation
- Lucide icons

**Backend:**
- Express 5
- TypeScript
- SQLite (development) / PostgreSQL (production)
- JWT + Bcrypt
- Winston logging
- Node Cron (backups)

## 📦 O'rnatish

### Talablar

- Node.js >= 18.0.0
- PNPM (tavsiya etiladi)

### Bosqichma-bosqich

1. **Loyihani yuklab oling:**
```bash
git clone <repository-url>
cd fusion-starter-fab
```

2. **Dependencies o'rnating:**
```bash
pnpm install
```

3. **Environment sozlang:**
```bash
copy .env.example .env    # Windows
cp .env.example .env      # Linux/Mac
```

4. **JWT secret kalitlar yarating:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Bu buyruqni 2 marta ishga tushiring va natijalarni `.env` faylidagi `JWT_SECRET` va `JWT_REFRESH_SECRET` ga qo'ying.

5. **Admin parolini o'zgartiring:**

`.env` faylida `ADMIN_PASSWORD` ni kuchli parolga o'zgartiring.

6. **Ishga tushiring:**
```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

7. **Brauzerda oching:**
```
http://localhost:8080
```

**Default login:**
- Email: `.env` faylidagi `ADMIN_EMAIL`
- Parol: `.env` faylidagi `ADMIN_PASSWORD`

## 📚 Hujjatlar

- [SETUP.md](./SETUP.md) - To'liq o'rnatish ko'rsatmasi
- [SECURITY.md](./SECURITY.md) - Xavfsizlik ko'rsatmalari
- [DEPLOY.md](./DEPLOY.md) - Deploy ko'rsatmalari
- [API_DOCS.md](./API_DOCS.md) - API dokumentatsiya
- [AGENTS.md](./AGENTS.md) - Loyiha arxitekturasi

## 🎯 Foydalanish

### Birinchi Kirish

1. Admin login bilan kiring
2. **Darhol parolni o'zgartiring** (Profil → Parolni o'zgartirish)
3. Yangi foydalanuvchilar yarating
4. Filiallar qo'shing
5. Mahsulotlar va xodimlarni kiritng

### Asosiy Operatsiyalar

- **Sotuv qilish:** POS sahifasiga o'ting
- **Davomat belgilash:** Kadrlar → Davomat
- **Buyurtma yaratish:** Orders → Yangi buyurtma
- **Hisobot olish:** Hisobotlar → Eksport
- **Backup:** Avtomatik har kecha soat 2 da

## 🏗️ Loyiha Tuzilishi

```
├── client/              # React frontend
│   ├── pages/          # Route sahifalari
│   ├── components/     # UI komponentlar
│   ├── hooks/          # Custom hooks (API, auth)
│   └── lib/            # Utility funksiyalar
├── server/             # Express backend
│   ├── routes/         # API route handlers
│   ├── data/           # Database layer
│   └── lib/            # Server utilities
├── shared/             # Client va server umumiy kodlar
│   └── api.ts          # TypeScript type'lar
└── data/               # SQLite database fayllari
```

## 🔧 Development

```bash
# Development server (hot reload)
pnpm dev

# Type checking
pnpm typecheck

# Build
pnpm build

# Tests
pnpm test

# Format code
pnpm format.fix
```

## 📊 Database

### SQLite (Default - Development)

- Fayl asosli
- O'rnatish talab qilmaydi
- Kichik va o'rta bizneslar uchun yetarli

### PostgreSQL (Production)

`.env` faylida:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

## 🚀 Deploy

### PM2 (tavsiya etiladi)

```bash
# Build
pnpm build

# PM2 bilan ishga tushiring
pm2 start dist/server/node-build.mjs --name "fusion-erp"
pm2 startup
pm2 save
```

### Docker

```bash
docker build -t fusion-erp .
docker run -p 8080:8080 fusion-erp
```

### Vercel/Netlify

```bash
pnpm build:vercel
# Deploy via Vercel CLI or GitHub integration
```

## 🔐 Xavfsizlik Eslatmalari

⚠️ **MUHIM:** Production uchun:

1. ✅ `.env` faylini **HECH QACHON** git'ga push qilmang
2. ✅ JWT secret kalitlarni **random** yarating
3. ✅ **Kuchli admin paroli** qo'ying
4. ✅ **HTTPS** ishlating
5. ✅ **Firewall** sozlang
6. ✅ **Backup** rejasi o'rnating
7. ✅ **Audit log**ni muntazam tekshiring

## 📈 Production Checklist

- [ ] JWT secret kalitlari o'zgartirildi
- [ ] Admin paroli kuchli
- [ ] Demo database o'chirildi
- [ ] CORS sozlamalari to'g'ri
- [ ] HTTPS sozlandi
- [ ] Backup tizimi yoqilgan
- [ ] Monitoring sozlandi
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Database backup'lari

## 🤝 Qo'llab-quvvatlash

### Texnik Yordam

- Email: support@yourcompany.uz
- Telegram: @yoursupport

### Issues

GitHub Issues orqali bug'larni xabar qiling.

## 📝 License

MIT License - batafsil [LICENSE](./LICENSE) faylida.

## 🙏 Credits

- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)

---

© 2024 Fusion ERP. All rights reserved.
