# 🚀 FUSION ERP - DEPLOYMENT GUIDE

**Loyiha:** Fusion ERP System  
**Versiya:** 1.0.0  
**Sana:** 2026-08-17

---

## 📋 TABLE OF CONTENTS

1. [Pre-Deployment Setup](#pre-deployment-setup)
2. [Vercel Deployment](#vercel-deployment)
3. [Database Setup](#database-setup)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment](#post-deployment)
6. [Custom Domain](#custom-domain)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 PRE-DEPLOYMENT SETUP

### 1. System Requirements
- Node.js 18+ LTS
- pnpm 8+
- Git
- Vercel CLI (optional)

### 2. Local Testing
```bash
# Dependencies install
pnpm install

# Build production
pnpm build

# Test production build locally
pnpm start

# Open: http://localhost:8081
```

### 3. Generate Security Secrets
```bash
# JWT Secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

**Muhim:** Bu secretlarni copy qilib oling, keyinroq Vercel'da kerak bo'ladi!

---

## 🌐 VERCEL DEPLOYMENT

### Option 1: GitHub Auto-Deploy (Tavsiya etiladi)

#### Step 1: GitHub Repository
```bash
# Git repository yaratish
git init
git add .
git commit -m "Initial commit - Production ready"

# GitHub'ga push
git remote add origin https://github.com/username/fusion-erp.git
git branch -M main
git push -u origin main
```

#### Step 2: Vercel Import
1. **Vercel'ga kiring:** https://vercel.com/login
2. **New Project** tugmasini bosing
3. **Import Git Repository** → GitHub repository'ni tanlang
4. **Import** tugmasini bosing

#### Step 3: Configure
**Framework Preset:** Other (yoki Vite)  
**Root Directory:** `./` (default)  
**Build Command:** `pnpm run build`  
**Output Directory:** `dist/public`  
**Install Command:** `pnpm install`

#### Step 4: Environment Variables
**Important:** Environment variables'ni qo'shishdan oldin deploy qilmang!

Settings → Environment Variables → Add:

```env
# Production only
NODE_ENV=production

# Database (PostgreSQL)
DATABASE_URL=postgresql://...

# JWT Secrets (generated above)
JWT_SECRET=<your-generated-jwt-secret>
JWT_REFRESH_SECRET=<your-generated-refresh-secret>

# JWT Expiration
JWT_EXPIRES_IN=12h
JWT_REFRESH_EXPIRES_IN=7d

# Admin Account
ADMIN_EMAIL=admin@orbiserp.uz
ADMIN_PASSWORD=<your-strong-password>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (add your domain after deployment)
ALLOWED_ORIGINS=https://your-app.vercel.app

# Logging
LOG_LEVEL=error

# Backup (for PostgreSQL - usually handled by provider)
BACKUP_ENABLED=false
```

#### Step 5: Deploy
**Deploy** tugmasini bosing va kutib turing (2-5 daqiqa).

✅ **Deployment successful!** → `https://your-app.vercel.app`

---

### Option 2: CLI Deployment

#### Step 1: Vercel CLI Install
```bash
pnpm add -g vercel
```

#### Step 2: Login
```bash
vercel login
```

#### Step 3: Deploy
```bash
# Test deployment (preview)
vercel

# Production deployment
vercel --prod
```

#### Step 4: Environment Variables
```bash
# Add via CLI
vercel env add JWT_SECRET
# Paste your secret when prompted

# Or via dashboard
# https://vercel.com/your-username/your-project/settings/environment-variables
```

---

## 💾 DATABASE SETUP

### Option 1: Vercel Postgres (Recommended)

#### Step 1: Create Database
1. Vercel Dashboard → **Storage** tab
2. **Create Database** → **Postgres**
3. **Region:** tanlang (eng yaqin server)
4. **Create**

#### Step 2: Connect
Database yaratilgandan keyin **`POSTGRES_URL`** ko'rsatiladi.

**Settings → Environment Variables:**
```env
DATABASE_URL=${POSTGRES_URL}
```

**Pricing:**
- **Hobby:** Free (1 database, 256 MB storage, 60 hours compute/month)
- **Pro:** $20/mo (unlimited databases, 512 MB storage, 100 hours compute)

#### Step 3: Auto-Migration
Server birinchi ishga tushganda avtomatik migration va seed qiladi.

---

### Option 2: Supabase Postgres

#### Step 1: Create Project
1. https://app.supabase.com → **New project**
2. **Name:** fusion-erp
3. **Password:** kuchli parol kiriting
4. **Region:** tanlang
5. **Create project**

#### Step 2: Get Connection String
**Settings → Database → Connection string**

Copy: `postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres`

#### Step 3: Add to Vercel
**Environment Variables:**
```env
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
```

**Pricing:**
- **Free:** 500 MB database, 2 GB file storage, 50 MB file upload
- **Pro:** $25/mo (8 GB database, 100 GB storage)

---

### Option 3: Neon (Serverless Postgres)

#### Step 1: Create Project
1. https://console.neon.tech → **New Project**
2. **Name:** fusion-erp
3. **Region:** tanlang
4. **Create**

#### Step 2: Connection String
Dashboard'da **Connection String** copy qiling.

#### Step 3: Add to Vercel
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/main
```

**Pricing:**
- **Free:** 3 projects, 1 GB storage, 100 hours compute/month
- **Pro:** $19/mo (unlimited projects, 10 GB storage)

---

## 🔐 ENVIRONMENT VARIABLES

### Full List (Production)

```env
# ==============================================
# REQUIRED (Majburiy)
# ==============================================
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<64-char-hex>
ADMIN_EMAIL=admin@orbiserp.uz
ADMIN_PASSWORD=<strong-password>

# ==============================================
# OPTIONAL (Sozlash mumkin)
# ==============================================
# Server
PORT=8081

# JWT
JWT_EXPIRES_IN=12h
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com

# Logging
LOG_LEVEL=error

# Backup (PostgreSQL usually has managed backups)
BACKUP_ENABLED=false
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# ==============================================
# ADVANCED (Optional)
# ==============================================
# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx

# Email
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@orbiserp.uz

# File Storage
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=fusion-erp-files
AWS_REGION=us-east-1

# Redis (Caching)
REDIS_URL=redis://username:password@host:6379
```

### How to Add in Vercel

**Method 1: Dashboard**
1. Project → **Settings** → **Environment Variables**
2. **Add** tugmasini bosing
3. Key + Value kiriting
4. **Production** ni tanlang
5. **Save**

**Method 2: CLI**
```bash
vercel env add VARIABLE_NAME production
# Paste value when prompted
```

**Method 3: Bulk Import**
1. `.env.production` faylini yarating
2. Vercel Dashboard → **Environment Variables**
3. **Import from .env** tugmasini bosing
4. Faylni tanlang va yuklang

---

## ✅ POST-DEPLOYMENT

### 1. Verify Deployment
```bash
# Health check
curl https://your-app.vercel.app/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-08-17T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### 2. Test Login
1. Open: `https://your-app.vercel.app`
2. Login credentials:
   - **Email:** `admin@orbiserp.uz` (yoki sizning ADMIN_EMAIL)
   - **Password:** `OrbisAdmin2024!` (yoki sizning ADMIN_PASSWORD)

✅ **Agar login successful bo'lsa, hammasi to'g'ri ishlayapti!**

### 3. Update CORS
Environment Variables'ni update qiling:
```env
ALLOWED_ORIGINS=https://your-app.vercel.app
```

**Redeploy qiling:**
```bash
vercel --prod
```

### 4. Setup Monitoring

#### Uptime Monitoring (Free)
1. https://uptimerobot.com → **Add New Monitor**
2. **Monitor Type:** HTTP(s)
3. **URL:** `https://your-app.vercel.app/health`
4. **Monitoring Interval:** 5 minutes
5. **Alert Contacts:** email kiriting

#### Error Tracking (Optional)
```bash
pnpm add @sentry/node @sentry/tracing
```

**server/index.ts:**
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Sentry setup:**
1. https://sentry.io → **Create Project**
2. Copy **DSN**
3. Add to Vercel: `SENTRY_DSN=https://xxx@sentry.io/xxx`

---

## 🌍 CUSTOM DOMAIN

### Step 1: Buy Domain
**Recommended:**
- Namecheap: https://www.namecheap.com
- GoDaddy: https://www.godaddy.com
- Google Domains: https://domains.google

**Masalan:** `orbiserp.uz`

### Step 2: Add to Vercel
1. Vercel Dashboard → **Settings** → **Domains**
2. **Add Domain** tugmasini bosing
3. Domain kiriting: `orbiserp.uz`
4. **Add**

### Step 3: Configure DNS
Vercel sizga DNS records beradi:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME Record (www):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Domain registrar'da (Namecheap/GoDaddy):**
1. **DNS Management** → **Advanced DNS**
2. Vercel bergan recordlarni qo'shing
3. **Save**

### Step 4: Wait for Propagation
DNS propagation: 15 minutes - 24 hours

**Check status:**
```bash
nslookup orbiserp.uz
```

### Step 5: SSL Certificate
Vercel avtomatik SSL certificate (HTTPS) qo'shadi.

✅ **Domain ready:** `https://orbiserp.uz`

### Step 6: Update Environment
```env
ALLOWED_ORIGINS=https://orbiserp.uz,https://www.orbiserp.uz
```

Redeploy qiling.

---

## 🔧 TROUBLESHOOTING

### ❌ Deployment Failed

**Error:** `Build failed`

**Fix:**
1. Check build locally: `pnpm run build`
2. Fix errors
3. Commit and push
4. Vercel avtomatik redeploy qiladi

---

### ❌ 500 Internal Server Error

**Error:** Server xatosi

**Fix:**
1. Vercel Dashboard → **Deployments** → **Latest**
2. **Runtime Logs** ni ochib xatoni toping
3. Environment variables tekshiring (DATABASE_URL, JWT_SECRET)
4. Redeploy qiling

**Common issues:**
- DATABASE_URL noto'g'ri
- JWT_SECRET o'rnatilmagan
- ADMIN_PASSWORD juda qisqa

---

### ❌ Database Connection Failed

**Error:** `ECONNREFUSED` yoki `Connection timeout`

**Fix:**
1. DATABASE_URL to'g'riligini tekshiring
2. Database service (Vercel/Supabase/Neon) ishlab turganini tekshiring
3. IP whitelist (agar bor bo'lsa) Vercel IP'larni qo'shilganini tekshiring

**Vercel Postgres:**
- Auto-configured, qo'shimcha sozlash shart emas

**Supabase/Neon:**
- Database settings'da **Allow connections from everywhere** enabled bo'lishi kerak

---

### ❌ Login Not Working

**Error:** `Invalid credentials`

**Fix:**
1. Environment variables tekshiring:
   ```env
   ADMIN_EMAIL=admin@orbiserp.uz
   ADMIN_PASSWORD=YourPassword
   ```
2. Console logs tekshiring (Vercel Logs)
3. Database'da user mavjudligini tekshiring

**Debug:**
```bash
# Vercel logs
vercel logs --follow

# Database query (Supabase SQL Editor)
SELECT * FROM users WHERE email = 'admin@orbiserp.uz';
```

---

### ❌ CORS Error

**Error:** `Access-Control-Allow-Origin`

**Fix:**
```env
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

**Development'da:**
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8081
```

---

### ❌ Rate Limited

**Error:** `Too many requests`

**Fix:** Bu normal - 15 daqiqa kuting yoki rate limit'ni oshiring:
```env
RATE_LIMIT_MAX_REQUESTS=200
```

---

## 📊 MONITORING

### View Logs
```bash
# Real-time logs
vercel logs --follow

# Last 100 lines
vercel logs -n 100

# Filter by type
vercel logs --filter error
```

### Analytics
**Vercel Dashboard → Analytics:**
- Page views
- Unique visitors
- Top pages
- Performance metrics

### Performance
**Vercel Dashboard → Speed Insights:**
- Core Web Vitals
- Real user monitoring
- Performance scores

---

## 🔄 UPDATE & REDEPLOY

### Auto-Deploy (GitHub)
```bash
# Make changes
git add .
git commit -m "Feature: Added new feature"
git push origin main

# Vercel automatically deploys
```

### Manual Deploy (CLI)
```bash
# Preview
vercel

# Production
vercel --prod
```

### Rollback
```bash
# Vercel Dashboard → Deployments
# Find previous successful deployment
# Click "..." → "Promote to Production"
```

---

## 📝 MAINTENANCE

### Weekly
- [ ] Check error logs
- [ ] Review analytics
- [ ] Update dependencies: `pnpm update`
- [ ] Test backup restore (if using SQLite)

### Monthly
- [ ] Security audit: `pnpm audit`
- [ ] Performance review
- [ ] Database optimization
- [ ] Cost review

---

## 💰 COST ESTIMATION

### Minimal Setup (Hobby)
- **Vercel Hosting:** Free
- **Vercel Postgres:** Free (Hobby plan)
- **Total:** **$0/month**

**Limitations:**
- 1 database
- 256 MB storage
- 60 hours compute/month
- Vercel branding

### Professional Setup
- **Vercel Pro:** $20/month
- **Vercel Postgres Pro:** $20/month
- **Sentry:** Free (or $26/month)
- **Custom Domain:** $10-15/year
- **Total:** **~$45-50/month**

### Enterprise Setup
- **Vercel Enterprise:** Custom pricing
- **Dedicated Database:** $100-300/month
- **Monitoring:** $50-100/month
- **Total:** **$200-500/month**

---

## 🎯 DEPLOYMENT CHECKLIST

### Pre-Deploy
- [ ] `pnpm build` successful
- [ ] `pnpm start` works locally
- [ ] All tests passing: `pnpm test`
- [ ] Environment variables prepared
- [ ] JWT secrets generated
- [ ] Database ready
- [ ] Git repository clean

### Deploy
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Health check passing
- [ ] Login working

### Post-Deploy
- [ ] Custom domain configured (optional)
- [ ] CORS updated
- [ ] Monitoring setup
- [ ] Backup tested
- [ ] Documentation updated
- [ ] Team notified

---

## 🆘 SUPPORT

### Issues
- **GitHub:** https://github.com/username/fusion-erp/issues
- **Email:** support@orbiserp.uz

### Documentation
- **API Docs:** `/docs` (after deployment)
- **Security Guide:** `PRODUCTION_SECURITY_GUIDE.md`
- **README:** `README.md`

### Community
- **Vercel:** https://vercel.com/support
- **Supabase:** https://supabase.com/support
- **Stack Overflow:** `[vercel] [react] [express]` tags

---

**DEPLOYMENT STATUS:** ✅ READY  
**LAST UPDATED:** 2026-08-17  
**VERSION:** 1.0.0
