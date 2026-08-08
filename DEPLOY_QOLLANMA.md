# 🚀 FUSION ERP - Vercel Deploy Qo'llanmasi

## ⚠️ MUHIM: SSL Sertifikat Muammosi Yechimi

Sizning kompyuteringizda SSL sertifikat muammosi bor (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`). 

Bu korporativ firewall/proxy yoki antivirus dasturi tufayli yuzaga kelmoqda.

---

## ✅ YECHIM 1: Vercel Dashboard orqali deploy (ENG OSON)

### 1-qadam: GitHub'ga yuklab qo'ying

```bash
# Git repozitoriyasini yaratish
git init
git add .
git commit -m "Initial commit - Fusion ERP"

# GitHub'da yangi repo yarating, keyin:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2-qadam: Vercel'ga import qiling

1. **Vercel.com ga kiring:** https://vercel.com
2. **"Add New" → "Project"** bosing
3. **"Import Git Repository"** tanlang
4. **GitHub'dan repo'ni tanlang**

### 3-qadam: Sozlamalarni to'g'rilang

```
Framework Preset: Other
Build Command: pnpm build:vercel
Output Directory: dist/spa
Install Command: pnpm install
Node Version: 18.x
```

### 4-qadam: Environment Variables

**MAJBURIY** - Quyidagi barcha o'zgaruvchilarni qo'shing:

#### 🔐 JWT Secrets (YARATING!)

Terminalda bajaring:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ikki marta ishga tushiring va natijalarni saqlang:

```
JWT_SECRET=<birinchi_natija>
JWT_REFRESH_SECRET=<ikkinchi_natija>
JWT_EXPIRES_IN=12h
JWT_REFRESH_EXPIRES_IN=7d
```

#### 🔑 Admin Login

```
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=YourStrongPassword123!
```

#### 💾 Database (Vercel PostgreSQL tavsiya)

**Variant A: Vercel PostgreSQL (tavsiya)**
1. Vercel Dashboard → Storage → Create Database → Postgres
2. Connect to Project
3. `DATABASE_URL` avtomatik qo'shiladi

**Variant B: SQLite (test uchun)**
```
DATABASE_PATH=./data/app.db
```

#### 🌐 CORS

```
ALLOWED_ORIGINS=https://your-app.vercel.app
NODE_ENV=production
```

#### 📊 Ixtiyoriy

```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

### 5-qadam: Deploy!

**"Deploy"** tugmasini bosing va 2-3 daqiqa kuting.

---

## ✅ YECHIM 2: GitHub Actions bilan avtomatik deploy

`.github/workflows/deploy.yml` yarating:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install
        
      - name: Build
        run: pnpm build:vercel
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

GitHub Secrets qo'shing:
- `VERCEL_TOKEN` - Vercel Dashboard → Settings → Tokens
- `VERCEL_ORG_ID` - `.vercel/project.json` dan: `team_QfPvAlfRHJc28ElhW3FXp8HP`
- `VERCEL_PROJECT_ID` - `.vercel/project.json` dan: `prj_HLGLN9GNlWtaD8TG8pOQlT7uDS3M`

---

## ✅ YECHIM 3: SSL muammosini yechish

### Windows uchun:

```bash
# Node.js environment variable
set NODE_TLS_REJECT_UNAUTHORIZED=0

# Keyin deploy qiling
vercel --prod --yes
```

### Vercel CLI bilan deploy:

```bash
# 1. SSL'ni disable qiling (faqat development!)
set NODE_TLS_REJECT_UNAUTHORIZED=0

# 2. Deploy
vercel --prod --yes

# 3. Environment variable'ni o'chiring
set NODE_TLS_REJECT_UNAUTHORIZED=
```

**⚠️ XAVFSIZLIK:** `NODE_TLS_REJECT_UNAUTHORIZED=0` faqat development muhitida ishlating!

---

## ✅ YECHIM 4: Boshqa platformalar

### Railway.app
1. Railway.app ga kiring
2. "New Project" → "Deploy from GitHub repo"
3. Environment variables qo'shing
4. Deploy!

### Render.com
1. Render.com ga kiring
2. "New" → "Web Service"
3. GitHub'dan repo tanlang
4. Build Command: `pnpm build`
5. Start Command: `pnpm start`

### DigitalOcean App Platform
1. DigitalOcean'ga kiring
2. "Create App" → GitHub
3. Build command va environment variables qo'shing

---

## 📋 Deploy tekshirish

Deploy bo'lgandan keyin:

1. **URL'ni oching:** `https://your-app.vercel.app`
2. **API'ni tekshiring:** `https://your-app.vercel.app/api/ping`
3. **Login:** Admin email va parol bilan

---

## ❓ Muammolar

### Build xatosi

```bash
# Local'da tekshiring:
pnpm build:vercel

# Xatoliklar bo'lsa, loglarga qarang
```

### Database ulanmayapti

- PostgreSQL `DATABASE_URL` to'g'ri formatda ekanligini tekshiring
- Vercel PostgreSQL ishlatayotgan bo'lsangiz, connection pooling qo'shing

### 401 Unauthorized

- `.env` fayldagi `JWT_SECRET` va `ADMIN_PASSWORD` to'g'riligini tekshiring
- Vercel Dashboard'da Environment Variables'ni qayta tekshiring

---

## 🎯 Tavsiyalar

1. **GitHub'dan deploy qiling** - eng qulay va xavfsiz
2. **Vercel PostgreSQL** database uchun ishlatiladi
3. **Environment secrets** - `.env` faylini GitHub'ga push qilmang!
4. **Domen ulang** - Vercel Settings → Domains

---

## 📞 Yordam

Agar muammo bo'lsa:
1. Vercel Logs'ni tekshiring (Dashboard → Deployments → Log)
2. Browser Console'ni oching (F12)
3. Network tab'da API so'rovlarni kuzating

---

**Omad tilayman! 🚀**
