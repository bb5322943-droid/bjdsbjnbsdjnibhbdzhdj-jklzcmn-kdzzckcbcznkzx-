# O'rnatish Qo'llanmasi

## 📋 Minimal Talablar

- **Node.js**: 18.0.0 yoki undan yuqori
- **PNPM**: 8.0.0+ (tavsiya etiladi) yoki NPM 9.0.0+
- **Database**: SQLite (default) yoki PostgreSQL (production uchun tavsiya)
- **OS**: Windows, macOS, Linux

## 🚀 Tez Boshlash (Development)

### 1. Repository'ni Clone Qiling

```bash
git clone https://github.com/yourcompany/orbis-erp.git
cd orbis-erp
```

### 2. Dependencies O'rnating

```bash
# PNPM bilan (tavsiya etiladi)
pnpm install

# yoki NPM bilan
npm install
```

### 3. Environment O'zgaruvchilarini Sozlang

```bash
# .env.example'dan nusxa oling
cp .env.example .env

# .env faylini tahrirlang
```

**Muhim**: `.env` faylida quyidagilarni o'zgartiring:
```bash
JWT_SECRET=your-unique-secret-here-min-32-characters
JWT_REFRESH_SECRET=another-unique-secret-min-32-chars
ADMIN_PASSWORD=YourStrongPassword123!
```

### 4. Ishga Tushiring

```bash
pnpm dev
```

Brauzerda `http://localhost:8080` ochiladi.

### 5. Birinchi Kirish

```
Email: admin@company.uz
Parol: .env faylidagi ADMIN_PASSWORD
```

## 🗄️ Database Sozlamalari

### SQLite (Default - Development)

Hech narsa qilish shart emas. Avtomatik `data/orbis.db` yaratiladi.

### PostgreSQL (Production)

1. PostgreSQL o'rnating yoki bulutli xizmat ishlating (Supabase, Neon, Railway)

2. Database yarating:
```sql
CREATE DATABASE orbis_erp;
```

3. `.env` faylida connection string'ni o'rnating:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/orbis_erp
```

4. Schema avtomatik yaratiladi birinchi ishga tushganda.

## 📦 Production Build

### 1. Build Yaratish

```bash
pnpm build
```

Bu quyidagilarni yaratadi:
- `dist/spa/` - Frontend (static files)
- `dist/server/` - Backend (Node.js server)

### 2. Production'da Ishga Tushirish

```bash
# Environment o'zgaruvchilarini o'rnating
export NODE_ENV=production
export DATABASE_URL=postgresql://...
export JWT_SECRET=...

# Server'ni ishga tushiring
pnpm start
```

## 🌐 Hosting Platformalari

### Render.com (Tavsiya - Bepul)

1. `render.yaml` fayli allaqachon tayyorlangan
2. Render.com da GitHub repository'ni ulang
3. Environment variable'larni sozlang
4. Deploy!

Batafsil: [DEPLOY.md](./DEPLOY.md)

### Vercel

⚠️ **Diqqat**: Vercel bepul tarifida fayl tizimi saqlanmaydi!

```bash
# Build va deploy
pnpm build:vercel
vercel deploy --prod
```

Environment variable'lar:
- `DATABASE_URL` - PostgreSQL connection string (majburiy!)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ADMIN_PASSWORD`

### Railway / Fly.io

1. PostgreSQL database yarating
2. Environment variable'larni o'rnating
3. `Dockerfile` orqali deploy qiling (keyinchalik qo'shiladi)

## 🔧 Muammolarni Hal Qilish

### `MODULE_NOT_FOUND` xatosi

```bash
# node_modules ni o'chiring va qayta o'rnating
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Port band

```bash
# .env faylida boshqa port o'rnating
PORT=3000
```

### Database xatolari

```bash
# Ma'lumotlar bazasini qayta yaratish (DIQQAT: barcha ma'lumotlar o'chadi!)
rm data/orbis.db
pnpm dev
```

### Permission xatolari

```bash
# Linux/macOS da
chmod +x node_modules/.bin/*

# Windows da Admin sifatida ishga tushiring
```

## 📝 Keyingi Qadamlar

1. [SECURITY.md](./SECURITY.md) - Xavfsizlik sozlamalarini o'qing
2. [USER_GUIDE.md](./USER_GUIDE.md) - Foydalanuvchi qo'llanmasini o'rganing
3. [API_DOCS.md](./API_DOCS.md) - API dokumentatsiyasini ko'ring

## 🆘 Yordam

Muammo yuzaga kelsa:
- 📧 Email: support@yourcompany.uz
- 💬 Telegram: @yourcompany_support
- 🐛 GitHub Issues: https://github.com/yourcompany/orbis-erp/issues

## 📄 Litsenziya

Proprietary - [LICENSE.md](./LICENSE.md) faylini o'qing
