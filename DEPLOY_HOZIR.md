# 🚀 HOZIR DEPLOY QILISH - 5 DAQIQA

## VAZIYAT:
- ✅ Loyiha tayyor
- ✅ Build mavjud (dist/)
- ✅ Vercel proyekt mavjud (orbis)
- ❌ Git o'rnatilmagan
- ❌ Vercel CLI SSL muammosi

## ✅ YECHIM: Drag & Drop Upload

---

## QADAM 1: ZIP yaratish

### Windows Explorer'da:

1. **Fayl menejerini oching:** `C:\Users\user\Desktop\fusion-starter-fab`
2. **Quyidagi papka/fayllarni TANLANG:**
   ```
   ✅ client/
   ✅ server/
   ✅ shared/
   ✅ api/
   ✅ dist/
   ✅ public/
   ✅ package.json
   ✅ vercel.json
   ✅ .env.example
   ✅ .npmrc
   ✅ .prettierrc
   ✅ tsconfig.json
   ✅ vite.config.ts
   ✅ vite.config.server.ts
   ✅ vite.config.vercel.ts
   ✅ tailwind.config.ts
   ✅ postcss.config.js
   ```

3. **TANLMANG (exclude):**
   ```
   ❌ node_modules/
   ❌ .git/
   ❌ .env (maxfiy!)
   ❌ data/
   ❌ logs/
   ❌ .vercel/
   ```

4. **O'ng tugma → Send to → Compressed (zipped) folder**
5. Nomi: `fusion-erp-deploy.zip`

---

## QADAM 2: Vercel Dashboard

### A. Proyektni oching

1. **Vercel.com ga kiring:** https://vercel.com
2. **"orbis" proyektini toping**
3. **Proyektga kiring**

### B. Manual deploy

**VARIANT A: Vercel CLI (agar ishlasa):**

Terminal'da:
```bash
# SSL muammosini bypass qiling
set NODE_TLS_REJECT_UNAUTHORIZED=0

# Deploy
vercel --prod --yes

# SSL check'ni qayta yoqing
set NODE_TLS_REJECT_UNAUTHORIZED=
```

**VARIANT B: GitHub Desktop (agar Git bo'lmasa):**

1. **Git o'rnatish:**
   - Download: https://git-scm.com/download/win
   - Yoki GitHub Desktop: https://desktop.github.com

2. **Git o'rnatilgandan keyin:**
   ```bash
   git init
   git add .
   git commit -m "Production deploy"
   git remote add origin https://github.com/YOUR_USERNAME/fusion-erp.git
   git push -u origin main
   ```

3. **Vercel'da:**
   - Import from GitHub
   - Auto-deploy yoqiladi ✅

**VARIANT C: Vercel API (Advanced):**

Agar barchasi ishlamasa, Vercel API orqali qo'lda deploy qilish mumkin.

---

## QADAM 3: Environment Variables

### Vercel Dashboard'da:

1. **Settings → Environment Variables**
2. **Quyidagilarni qo'shing:**

```bash
# JWT Secrets (YARATISH KERAK!)
# Terminal'da 2 marta ishga tushiring:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Natijalarni Vercel'ga kiriting:

```
JWT_SECRET = <birinchi_random_string>
JWT_REFRESH_SECRET = <ikkinchi_random_string>
JWT_EXPIRES_IN = 12h
JWT_REFRESH_EXPIRES_IN = 7d

# Admin
ADMIN_EMAIL = admin@yourcompany.com
ADMIN_PASSWORD = YourStrongPassword123!

# Node
NODE_ENV = production

# Database (MUHIM!)
# Vercel PostgreSQL kerak!
DATABASE_URL = postgresql://...

# CORS
ALLOWED_ORIGINS = https://orbis.vercel.app

# Rate Limit
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100

# Logs
LOG_LEVEL = info

# Backup (serverless'da ishlamaydi)
BACKUP_ENABLED = false
```

### ⚠️ DIQQAT: Vercel uchun PostgreSQL kerak!

**PostgreSQL qo'shish:**

1. **Vercel Dashboard → Storage**
2. **Create Database → Postgres**
3. **Connect to Project → orbis**
4. `DATABASE_URL` avtomatik qo'shiladi ✅

---

## QADAM 4: Deploy tugmasi

1. **Vercel Dashboard → Deployments**
2. **"Redeploy" yoki "New Deployment"**
3. **Production branch: main**
4. **Deploy tugmasini bosing!**

---

## QADAM 5: Tekshirish

### Deploy bo'lgandan keyin:

```
🌐 URL: https://orbis.vercel.app
```

### Test qiling:

1. **API ping:**
   ```
   https://orbis.vercel.app/api/ping
   ```
   
   Javob:
   ```json
   {"status":"success","message":"pong"}
   ```

2. **Login:**
   - Email: `.env` dagi ADMIN_EMAIL
   - Parol: `.env` dagi ADMIN_PASSWORD

---

## ❓ MUAMMOLAR

### ❌ Build failed

**Log'ni o'qing:**
```
Vercel Dashboard → Deployments → [Latest] → Logs
```

**Keng tarqalgan xatolar:**

1. **"pnpm not found"**
   ```
   Build Command: npm install -g pnpm && pnpm build:vercel
   ```

2. **"Environment variable missing"**
   - Settings → Environment Variables
   - Barcha kerakli o'zgaruvchilarni qo'shing

3. **"Database connection error"**
   - PostgreSQL database yarating
   - DATABASE_URL ni qo'shing

---

## 🎯 ENG OSON YO'L

Agar **hamma narsa ishlamasa**, men sizga **qo'lda deploy** qilaman:

### Menga kerak:

1. **Vercel login token:**
   - Vercel → Settings → Tokens
   - Create token
   - Menga yuboring (xavfsiz kanal orqali)

2. **Yoki:**
   - GitHub repository access bering
   - Men sizning proyektingizga push qilaman
   - Vercel avtomatik deploy qiladi

---

## ✅ XULOSA

Sizning muammo: **Git va SSL**

Yechimlar:
1. ✅ Git o'rnating → GitHub → Vercel (ENG YAXSHI)
2. ✅ SSL bypass → Vercel CLI
3. ✅ Manual ZIP upload (agar Vercel qo'llab-quvvatlasa)
4. ✅ Vercel API (advanced)

**TAVSIYA: Git o'rnatib, GitHub orqali qiling!**

Git download: https://git-scm.com/download/win

---

**Yordam kerakmi? Qaysi variantni tanlaymiz?**
