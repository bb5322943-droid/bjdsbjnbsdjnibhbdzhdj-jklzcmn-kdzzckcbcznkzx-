# 🚀 GitHub → Vercel Deploy Ko'rsatmasi

## Sizning SSL muammo tufayli CLI ishlamayapti. Shuning uchun GitHub orqali deploy qilamiz.

---

## 1️⃣ GitHub'ga yuklab qo'yish

### A. GitHub'da yangi repository yaratish

1. **GitHub.com ga kiring:** https://github.com
2. **"New repository" bosing** (yashil + button)
3. **Repository sozlamalari:**
   ```
   Repository name: fusion-erp-production
   Description: Full-featured ERP System for SMB
   Visibility: Private (tavsiya) yoki Public
   ✅ Initialize without README (bizda bor)
   ```
4. **"Create repository" bosing**

### B. Local loyihani GitHub'ga push qilish

Terminal'da (loyiha papkasida):

```bash
# 1. Git repository yaratish (agar yo'q bo'lsa)
git init

# 2. Barcha fayllarni staging'ga qo'shish
git add .

# 3. Commit yaratish
git commit -m "Production-ready ERP system"

# 4. Main branch yaratish
git branch -M main

# 5. GitHub'ga ulash (SIZNING REPO URL'INGIZNI QO'YING!)
git remote add origin https://github.com/YOUR_USERNAME/fusion-erp-production.git

# 6. Push qilish
git push -u origin main
```

**⚠️ MUHIM:** `YOUR_USERNAME` va `fusion-erp-production` ni o'zingizniki bilan almashtiring!

---

## 2️⃣ Vercel'ga import qilish

### A. Vercel Dashboard

1. **Vercel.com ga kiring:** https://vercel.com
2. **"Add New" → "Project"** bosing
3. **"Import Git Repository"** tanlang
4. **GitHub'dan repo'ni tanlang:** `fusion-erp-production`

### B. Project sozlamalari

```
Framework Preset: Other
Build Command: pnpm build:vercel
Output Directory: dist/spa
Install Command: pnpm install
Root Directory: ./
Node.js Version: 18.x
```

**⚠️ MUHIM:** `pnpm` o'rnatilmaganligini aytsa:

```
Install Command: npm install -g pnpm && pnpm install
```

---

## 3️⃣ Environment Variables qo'shish

Vercel Dashboard → Settings → Environment Variables:

### A. JWT Secrets (MAJBURIY!)

Terminal'da 2 marta bajaring:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Vercel'da qo'shing:
```
JWT_SECRET = <birinchi_natija>
JWT_REFRESH_SECRET = <ikkinchi_natija>
JWT_EXPIRES_IN = 12h
JWT_REFRESH_EXPIRES_IN = 7d
```

### B. Admin Login

```
ADMIN_EMAIL = admin@yourcompany.com
ADMIN_PASSWORD = YourStrongPassword123!
```

**⚠️ MUHIM:** Kuchli parol qo'ying!

### C. Database

**VARIANT 1: Vercel PostgreSQL (tavsiya)**

1. Vercel Dashboard → Storage → Create Database → Postgres
2. Connect to Project → `fusion-erp-production` tanlang
3. `DATABASE_URL` avtomatik qo'shiladi ✅

**VARIANT 2: SQLite (test uchun, tavsiya etilmaydi)**

```
DATABASE_PATH = ./data/app.db
```

⚠️ SQLite Vercel serverless'da ishlamaydi! Faqat PostgreSQL ishlatiladi!

### D. CORS (MUHIM!)

```
ALLOWED_ORIGINS = https://your-app-name.vercel.app
NODE_ENV = production
```

**⚠️ MUHIM:** `your-app-name.vercel.app` ni Vercel sizga bergan URL bilan almashtiring!

### E. Ixtiyoriy sozlamalar

```
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
LOG_LEVEL = info
BACKUP_ENABLED = false
```

**ESLATMA:** Vercel serverless backup qo'llab-quvvatlamaydi!

---

## 4️⃣ Deploy qilish

1. **"Deploy" tugmasini bosing**
2. **2-3 daqiqa kuting** ☕
3. **Deploy log'larni kuzatib boring**

### Kutilgan natija:

```
✓ Building...
✓ Linting and Checking validity of types...
✓ Collecting page data...
✓ Build completed successfully
```

---

## 5️⃣ Tekshirish

### A. URL'ni oching

```
https://your-app-name.vercel.app
```

### B. API'ni test qiling

```
https://your-app-name.vercel.app/api/ping
```

Javob:
```json
{
  "status": "success",
  "message": "pong",
  "timestamp": "..."
}
```

### C. Login qiling

- Email: `.env` dagi `ADMIN_EMAIL`
- Parol: `.env` dagi `ADMIN_PASSWORD`

---

## 6️⃣ Muammolarni hal qilish

### ❌ Build failed

**Sabab:** Dependencies o'rnatilmadi

**Yechim:**
1. Vercel Dashboard → Settings → General
2. Install Command:
   ```
   npm install -g pnpm && pnpm install
   ```
3. Redeploy

---

### ❌ 500 Internal Server Error

**Sabab:** Environment variables to'g'ri emas

**Yechim:**
1. Vercel Dashboard → Settings → Environment Variables
2. Barcha o'zgaruvchilarni tekshiring (JWT_SECRET, ADMIN_EMAIL...)
3. Redeploy

---

### ❌ Database connection error

**Sabab:** PostgreSQL ulanmagan

**Yechim:**
1. Vercel → Storage → Create Database → Postgres
2. Connect to your project
3. Redeploy

---

### ❌ CORS error

**Sabab:** `ALLOWED_ORIGINS` to'g'ri emas

**Yechim:**
```
ALLOWED_ORIGINS = https://your-actual-vercel-url.vercel.app
```

---

## 7️⃣ Custom Domain (ixtiyoriy)

### A. Domen sotib oling

- Namecheap
- GoDaddy
- Cloudflare

### B. Vercel'ga qo'shing

1. Vercel Dashboard → Settings → Domains
2. Add Domain: `yourcompany.com`
3. DNS record'larni qo'shing (Vercel ko'rsatadi)

### C. SSL

Vercel avtomatik Let's Encrypt SSL sertifikat beradi ✅

---

## 8️⃣ Monitoring va Logs

### A. Logs ko'rish

Vercel Dashboard → Deployments → [Latest] → Logs

### B. Analytics

Vercel Dashboard → Analytics

### C. Error Tracking (ixtiyoriy)

**Sentry.io:**
```bash
pnpm add @sentry/react @sentry/node
```

---

## 9️⃣ Avtomatik Deploy

Endi har safar GitHub'ga push qilganingizda, Vercel avtomatik deploy qiladi!

```bash
# Kod o'zgartirasiz
git add .
git commit -m "Fix: some bug"
git push

# Vercel avtomatik deploy qiladi ✅
```

---

## 🎉 TAYYOR!

Sizning Fusion ERP tiziminigiz ishlayapti:

```
🌐 URL: https://your-app.vercel.app
🔐 Login: admin@yourcompany.com
📊 Analytics: Vercel Dashboard
```

---

## 📞 Yordam

Muammo bo'lsa:

1. **Vercel Logs'ni tekshiring**
2. **Browser Console'ni oching** (F12)
3. **Network tab'da API so'rovlarni kuzating**
4. **GitHub Issues'ga xabar bering**

---

**Omad tilayman! 🚀**
