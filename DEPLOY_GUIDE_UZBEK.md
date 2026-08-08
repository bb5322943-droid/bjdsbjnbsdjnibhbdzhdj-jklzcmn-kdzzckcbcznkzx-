# 🚀 FUSION ERP - TO'LIQ DEPLOY QO'LLANMASI

## 📋 Loyiha Haqida Ma'lumot

**Backend:** Node.js + Express 5 + TypeScript  
**Frontend:** React 18 + TypeScript + Vite  
**Database:** SQLite (dev) / PostgreSQL (production)  
**Hosting Variants:** Vercel, Render, Railway, VPS (DigitalOcean/Hetzner)

---

## 📑 Mundarija

1. [Deploy variantlari taqqoslash](#1-deploy-variantlari-taqqoslash)
2. [Loyihani deployga tayyorlash](#2-loyihani-deployga-tayyorlash)
3. [Vercel (Serverless) - Eng oson](#3-vercel-serverless---eng-oson)
4. [Render (PaaS) - Tavsiya etiladi](#4-render-paas---tavsiya-etiladi)
5. [Railway (PaaS)](#5-railway-paas)
6. [VPS (DigitalOcean/Hetzner)](#6-vps-digitalocean-hetzner)
7. [Database setup](#7-database-setup)
8. [CI/CD GitHub Actions](#8-cicd-github-actions)
9. [Ko'p uchraydigan xatolar va yechimlar](#9-kop-uchraydigan-xatolar-va-yechimlar)
10. [Production Checklist](#10-production-checklist)

---

## 1. Deploy Variantlari Taqqoslash

| Platform | Narx | Database | Deploy Osonligi | Masshtablanish | Tavsiya |
|----------|------|----------|-----------------|----------------|---------|
| **Vercel** | Free (hobby) | Tashqi kerak | ⭐⭐⭐⭐⭐ | Cheklangan | Demo/MVP uchun |
| **Render** | $7/oy | Ichki PostgreSQL | ⭐⭐⭐⭐ | Yaxshi | **Production** |
| **Railway** | $5/oy | Ichki PostgreSQL | ⭐⭐⭐⭐⭐ | Yaxshi | Startup |
| **VPS** | $5-20/oy | O'zingiz sozlaysiz | ⭐⭐ | To'liq nazorat | Katta loyihalar |

**Tavsiya:** Kichik biznes uchun **Render** yoki **Railway** eng yaxshi variant.

---

## 2. Loyihani Deployga Tayyorlash


### 2.1. Environment Variables Tayyorlash

#### Hozirgi `.env` faylingizni tekshiring:

```bash
# ❌ ASLA production'da ishlatmang!
JWT_SECRET=default-secret
ADMIN_PASSWORD=Admin123

# ✅ Production uchun kuchli qiymatlar kerak
```

#### Xavfsiz JWT secret yaratish:

**Windows (PowerShell):**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Linux/Mac:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2 marta ishga tushiring - `JWT_SECRET` va `JWT_REFRESH_SECRET` uchun.

#### Production `.env` namunasi:

```env
# Environment
NODE_ENV=production

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT (YANGI qiymatlar!)
JWT_SECRET=a8f5e6c7d9b2a4c8e9f1a3b5c7d9e2f4a6b8c9d1e3f5a7b9c1d3e5f7a9b1c3d5
JWT_REFRESH_SECRET=b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin (KUCHLI parol!)
ADMIN_EMAIL=admin@yourcompany.uz
ADMIN_PASSWORD=MyStr0ng!P@ssw0rd2024

# CORS (domain'ingizni kiriting)
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/fusion-erp.log
```


### 2.2. Xavfsizlik Tekshiruvi

**Ushbu komandani ishga tushiring:**

```bash
pnpm run check:env
```

Agar `❌ .env faylida standart parollar topildi` chiqsa - parollarni o'zgartiring!

### 2.3. Build Test

**Local'da build qilib ko'ring:**

```bash
pnpm install
pnpm run build
pnpm start
```

Agar xato chiqmasa - tayyor! ✅

### 2.4. Git Repository Tayyorlash

#### .gitignore tekshiruvi:

`.gitignore` faylida **ALBATTA** bo'lishi kerak:

```gitignore
# Environment variables
.env
.env.local
.env.production

# Database
data/*.db
data/*.db-*
*.sqlite
*.sqlite3

# Logs
logs/
*.log

# Build
dist/
node_modules/

# OS
.DS_Store
Thumbs.db

# Backups
backups/
```

#### Git commit va push:

```bash
git init
git add .
git commit -m "Initial commit - Production ready"
git branch -M main
git remote add origin https://github.com/username/fusion-erp.git
git push -u origin main
```

---


## 3. Vercel (Serverless) - Eng Oson

### ✅ Afzalliklar:
- Juda oson deploy
- Free tier mavjud
- Avtomatik HTTPS
- Global CDN

### ❌ Kamchiliklari:
- Database o'zi bilan kelmaydi (tashqi kerak)
- Serverless - ba'zi feature'lar ishlamasligi mumkin
- Free tier cheklangan

### 3.1. Vercel Account Yaratish

1. [vercel.com](https://vercel.com) ga o'ting
2. GitHub bilan sign up qiling
3. GitHub repository'ga ruxsat bering

### 3.2. Loyihani Import Qilish

**CLI orqali (tavsiya etiladi):**

```bash
# Vercel CLI o'rnatish
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

**Web UI orqali:**

1. Vercel Dashboard → "Add New" → "Project"
2. "Import Git Repository" → GitHub repo'ni tanlang
3. Framework Preset: **Other**
4. Build Command: `npm run build:vercel`
5. Output Directory: `dist/spa`
6. Install Command: `npm install`

### 3.3. Environment Variables Sozlash

Vercel Dashboard → Project Settings → Environment Variables:

**Kerakli o'zgaruvchilar:**

```
JWT_SECRET = <yangi-secret-1>
JWT_REFRESH_SECRET = <yangi-secret-2>
ADMIN_EMAIL = admin@yourcompany.uz
ADMIN_PASSWORD = <kuchli-parol>
NODE_ENV = production
DATABASE_URL = <postgresql-url>
ALLOWED_ORIGINS = https://your-app.vercel.app
```

**Important:** Har bir variable uchun "Production", "Preview", va "Development" checkboxlarni belgilang!

### 3.4. Database Sozlash (Vercel uchun)

**Variant 1: Vercel Postgres (Tavsiya etiladi)**

```bash
# Vercel Postgres qo'shish
vercel postgres create
```

Dashboard → Storage → Postgres → Connect → Environment Variables ni copy qiling.

**Variant 2: Supabase (Free tier)**

1. [supabase.com](https://supabase.com) → Sign Up
2. New Project yarating
3. Settings → Database → Connection string'ni copy qiling
4. Vercel'ga `DATABASE_URL` sifatida qo'shing

**Variant 3: Neon (Serverless PostgreSQL)**

1. [neon.tech](https://neon.tech) → Sign Up
2. New Project
3. Connection string'ni oling
4. Vercel'ga qo'shing

### 3.5. Deploy va Test

```bash
vercel --prod
```

Yoki GitHub'ga push qiling - avtomatik deploy bo'ladi!

**Test qiling:**

```
https://your-app.vercel.app
https://your-app.vercel.app/api/ping
```

---

