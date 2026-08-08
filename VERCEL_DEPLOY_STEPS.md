# 🚀 VERCEL DEPLOY - GITHUB ORQALI (ENG OSON)

## Nega GitHub orqali?
- ✅ SSL muammolari yo'q
- ✅ Avtomatik deploy (har push'da)
- ✅ Rollback imkoniyati
- ✅ Preview deploys
- ✅ Team collaboration

---

## QADAM-MA-QADAM (5 daqiqa)

### 1️⃣ GitHub'ga Push Qiling

Loyiha allaqachon Git'da, faqat GitHub'ga push qiling:

```bash
# Agar GitHub repository yo'q bo'lsa:
# 1. github.com/new da yangi repository yarating
# 2. Repository URL'ni copy qiling

# Remote qo'shing (agar yo'q bo'lsa):
git remote add origin https://github.com/USERNAME/fusion-erp.git

# Main branch'ni push qiling:
git push -u origin main
```

**Yoki mavjud remote'ga push:**
```bash
git push
```

---

### 2️⃣ Vercel'ga Kiring

1. Brauzerda oching: https://vercel.com
2. "Sign Up" yoki "Log In"
3. **"Continue with GitHub"** ni bosing
4. GitHub bilan login qiling

---

### 3️⃣ Loyihani Import Qiling

1. Vercel Dashboard → **"Add New..."** → **"Project"**
2. **"Import Git Repository"** bo'limida GitHub repository'ni toping
3. `fusion-starter-fab` (yoki sizning repo nomingiz) ni tanlang
4. **"Import"** tugmasini bosing

---

### 4️⃣ Build Settings Sozlang

Vercel avtomatik aniqlaydi, lekin tekshiring:

**Framework Preset:** `Other`

**Build & Development Settings:**
- **Build Command:** `pnpm run build:vercel` 
- **Output Directory:** `dist/spa`
- **Install Command:** `pnpm install`

**Root Directory:** `.` (default)

---

### 5️⃣ Environment Variables Qo'shing

**Kerakli o'zgaruvchilar (MAJBURIY):**

```
NODE_ENV = production

JWT_SECRET = 8065f7e15a2c3f45066dfa6fd74dde6e3586c94996d078509d4bca75a13849e2

JWT_REFRESH_SECRET = 07cf1169d3b0f8a4c87a2295c8e7c2c589d24f03b2c75011522c662de6f6b09f

JWT_EXPIRES_IN = 15m

JWT_REFRESH_EXPIRES_IN = 7d

ADMIN_EMAIL = admin@yourcompany.uz

ADMIN_PASSWORD = YourStrongPassword123!

ALLOWED_ORIGINS = https://your-app.vercel.app

RATE_LIMIT_WINDOW_MS = 900000

RATE_LIMIT_MAX_REQUESTS = 100

LOG_LEVEL = info
```

**Har birini alohida qo'shing:**
1. "Add Environment Variable" ni bosing
2. Name va Value kiriting
3. Checkboxlar: ✅ Production ✅ Preview ✅ Development

---

### 6️⃣ Database Sozlash (Keyin)

Vercel o'zi database bermaydi. 2 ta variant:

**A. Vercel Postgres (Tavsiya):**
1. Vercel Dashboard → Storage → Create Database → Postgres
2. Avtomatik `DATABASE_URL` qo'shiladi

**B. Supabase (Free):**
1. supabase.com → New Project
2. Settings → Database → Connection String
3. Vercel'ga `DATABASE_URL` sifatida qo'shing

---

### 7️⃣ Deploy!

1. **"Deploy"** tugmasini bosing
2. Build jarayonini kuzating (2-3 daqiqa)
3. ✅ Deploy tugagach URL oling

**Sizning URL:** `https://fusion-starter-fab.vercel.app`

---

## 🎉 TAYYOR!

**Test qiling:**
```
https://your-app.vercel.app
https://your-app.vercel.app/api/ping
```

---

## 🔄 Keyingi Deploy'lar

Endi har `git push` qilganingizda avtomatik deploy bo'ladi!

```bash
git add .
git commit -m "Feature qo'shildi"
git push
```

Vercel avtomatik build va deploy qiladi! 🚀

---

## ⚠️ MUHIM ESLATMALAR

### Database
- Hozir SQLite ishlatmaydi (serverless environment)
- Vercel Postgres yoki Supabase kerak
- Migration'lar avtomatik ishlamaydi - qo'lda bajarish kerak

### Logs
- Vercel Dashboard → Deployments → Logs
- Real-time monitoring

### Custom Domain
- Vercel Dashboard → Settings → Domains
- DNS sozlang (A record yoki CNAME)

### Troubleshooting
- Build xatosi → Build Logs'ni tekshiring
- Runtime xato → Function Logs
- 500 error → Environment variables tekshiring

---

## 📞 Yordam Kerakmi?

Vercel support: https://vercel.com/support
Community: https://github.com/vercel/vercel/discussions
