# 🔄 NETLIFY → VERCEL MIGRATSIYA

## ❌ Netlify Muammosi

**Xato:** "Site not found"

**Sabab:**
- Netlify asosan **static site hosting**
- Sizning loyihangiz **fullstack** (React + Express)
- Backend API'lar serverless functions orqali ishlaydi (murakkab)

---

## ✅ YECHIM: VERCEL'GA O'TISH

Vercel **fullstack** loyihalar uchun optimal:

| Feature | Netlify | Vercel |
|---------|---------|--------|
| Static Sites | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Node.js API** | ⭐⭐ (murakkab) | **⭐⭐⭐⭐⭐ (oson)** |
| Express Support | ⚠️ Cheklangan | ✅ To'liq |
| Build Speed | Tez | Tez |
| Free Tier | 300 build min/oy | 100GB bandwidth |

---

## 🚀 VERCEL'GA O'TISH (5 daqiqa)

### 1. Vercel'ga kiring
```
https://vercel.com/login
```
- "Continue with GitHub" bosing

### 2. Repository Import
```
https://vercel.com/new
```
- `fusion-erp` ni tanlang
- "Import" bosing

### 3. Build Settings
```
Framework: Other
Build Command: pnpm run build:vercel
Output Directory: dist/spa
Install Command: pnpm install
```

### 4. Environment Variables

**11 ta variable** (VERCEL_ENV_VARS.txt faylidan):

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

### 5. Deploy!
- "Deploy" tugmasini bosing
- 2-3 daqiqa

---

## 📊 NETLIFY vs VERCEL - Sizning Loyihangiz Uchun

**Sizning loyihangiz:**
- ✅ React frontend
- ✅ Express backend
- ✅ SQLite/PostgreSQL database
- ✅ API endpoints (20+)
- ✅ Authentication (JWT)
- ✅ Cron jobs (backup)

**Netlify:**
- ❌ Express backend murakkab (serverless functions)
- ❌ Cron jobs ishlamaydi
- ❌ SQLite qo'llab-quvvatlanmaydi
- ⚠️ PostgreSQL bilan ishlash murakkab

**Vercel:**
- ✅ Express backend to'liq qo'llab-quvvatlaydi
- ✅ API routes oson
- ✅ PostgreSQL integratsiya
- ✅ Serverless functions optimal

---

## 🎯 XULOSA

**Tavsiya: VERCEL'GA O'TING** ⭐

Netlify'ni to'g'rilash mumkin, lekin:
- 🕐 Ko'p vaqt ketadi
- 🔧 Murakkab sozlash
- ⚠️ Ba'zi funksiyalar ishlamasligi mumkin

Vercel:
- ⏱️ 5 daqiqa
- ✅ Oson sozlash
- ✅ Barcha funksiyalar ishlaydi

---

## 🔄 MIGRATSIYA QADAMLARI

1. **Vercel'ga o'ting:** https://vercel.com/new
2. **Repository import qiling**
3. **Environment variables qo'shing**
4. **Deploy qiling**
5. **Netlify deployment'ni o'chiring** (optional)

---

## 💰 NARX

**Netlify Free:**
- 300 build minutes/month
- 100GB bandwidth
- Serverless functions: 125k requests/month

**Vercel Free (Hobby):**
- 100 deployments/month
- 100GB bandwidth/month
- Serverless functions: 100GB-hours

**Ikkalasi ham free tier yetarli!** Lekin Vercel **fullstack** uchun yaxshiroq.

---

## ✅ ACTION PLAN

**Hozir qiling:**

1. Vercel'ni oching: https://vercel.com/new
2. `fusion-erp` import qiling
3. Build settings va env vars qo'shing
4. Deploy qiling

**10 daqiqada tayyor bo'ladi!** 🚀

---

## 📞 YORDAM

Agar Vercel'da muammo bo'lsa:
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support
- Guide: VERCEL_WEB_DEPLOY.md fayli

---

**NETLIFY'ni TOZALASH** (optional):

Vercel'da ishlab ketgach, Netlify deployment'ni o'chirish:
```
Netlify Dashboard → Site Settings → Delete Site
```
