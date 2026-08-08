# Vercel Deployment Guide

Bu qo'llanma Fusion ERP loyihasini Vercel'ga deploy qilish jarayonini tushuntiradi.

## 🔧 Tayyorgarlik

### 1. GitHub'ga Push qiling

```bash
git add .
git commit -m "Fix CORS and prepare for Vercel deployment"
git push origin main
```

### 2. Vercel Account yarating

- [vercel.com](https://vercel.com) ga kiring
- GitHub akkauntingiz bilan sign in qiling

## 🚀 Deployment Qadamlari

### Option 1: Vercel Dashboard orqali (Tavsiya etiladi)

1. **Import Project:**
   - Vercel dashboard'da "Add New" > "Project" bosing
   - GitHub repository'ni tanlang
   - Import qiling

2. **Environment Variables o'rnating:**
   
   Vercel dashboard'da "Settings" > "Environment Variables" ga o'ting va quyidagilarni qo'shing:

   ```env
   # Majburiy o'zgaruvchilar
   NODE_ENV=production
   
   # JWT Secrets (yangi generate qiling!)
   JWT_SECRET=<32+ belgilik random string>
   JWT_REFRESH_SECRET=<32+ belgilik random string>
   
   # Admin credentials
   ADMIN_EMAIL=admin@yourcompany.com
   ADMIN_PASSWORD=<kuchli parol>
   
   # CORS - Vercel domeningizni qo'shing
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-preview.vercel.app
   
   # Database (ixtiyoriy - SQLite default)
   DATABASE_PATH=./data/app.db
   
   # Rate limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

   **JWT Secret generatsiya qilish:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Deploy qiling:**
   - "Deploy" tugmasini bosing
   - Build jarayoni tugashini kuting (~2-5 daqiqa)

### Option 2: Vercel CLI orqali

```bash
# Vercel CLI o'rnatish
npm i -g vercel

# Login qiling
vercel login

# Deploy qiling
vercel

# Production'ga deploy
vercel --prod
```

## 🔐 Xavfsizlik

### Majburiy sozlamalar:

1. **JWT Secrets:** HECH QACHON default qiymatlarni ishlatMANG!
2. **ADMIN_PASSWORD:** Kamida 12 belgi, katta/kichik harf, raqam va maxsus belgi
3. **ALLOWED_ORIGINS:** Faqat o'zingizning domenlaringizni kiriting

### Database

- **Development:** SQLite (default)
- **Production (tavsiya):** Vercel Postgres, Neon, Supabase, yoki boshqa cloud DB

Agar cloud database ishlatsangiz, `DATABASE_URL` ni o'rnating:
```env
DATABASE_URL=postgresql://username:password@host:5432/database
```

## ✅ Deployment tekshirish

Deploy qilingandan keyin:

1. **Health check:**
   ```
   https://your-app.vercel.app/api/ping
   ```
   Natija: `{"message":"pong"}`

2. **Login test:**
   ```
   https://your-app.vercel.app
   ```
   Admin credentials bilan kiring

3. **Logs tekshiring:**
   - Vercel dashboard > Deployments > Logs
   - Xatolar bo'lsa, Environment Variables'ni tekshiring

## 🐛 Muammolarni hal qilish

### CORS xatolari

Agar "CORS policy: Origin not allowed" xatosi ko'rsangiz:

1. Vercel dashboard'da `ALLOWED_ORIGINS` ni tekshiring
2. Vercel URL'ingizni qo'shing:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app
   ```
3. Redeploy qiling

### JWT xatolari

Agar "JWT_SECRET" xatosi ko'rsangiz:

1. Environment Variables'da `JWT_SECRET` va `JWT_REFRESH_SECRET` o'rnatilganligini tekshiring
2. Kamida 32 belgi uzunlikda ekanligini tasdiqlang
3. Redeploy qiling

### Build xatolari

```bash
# Local'da build test qiling
pnpm run build:vercel

# Xatolar ko'rsangiz, dependency'larni yangilang
pnpm install
```

## 📝 Post-Deployment

Deploy muvaffaqiyatli bo'lgandan keyin:

1. ✅ Admin akkauntiga kiring
2. ✅ Parolni o'zgartiring (Profile > Change Password)
3. ✅ Yangi foydalanuvchilar yarating
4. ✅ Backup sozlamalarini tekshiring
5. ✅ Custom domen ulang (ixtiyoriy)

## 🔄 Yangilanishlar

Kodda o'zgarish qilganingizdan keyin:

```bash
git add .
git commit -m "Update: your changes"
git push origin main
```

Vercel avtomatik ravishda yangi deployment yaratadi!

## 📞 Yordam

Agar muammo bo'lsa:
- [Vercel Docs](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- Yoki loyiha maintaineriga murojaat qiling

---

**Muvaffaqiyatli deployment!** 🎉
