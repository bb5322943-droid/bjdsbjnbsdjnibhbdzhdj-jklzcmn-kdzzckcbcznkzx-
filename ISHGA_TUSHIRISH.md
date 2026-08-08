# 🚀 FUSION ERP - ISHGA TUSHIRISH QO'LLANMASI

## Tez boshlash (5 daqiqa)

---

## 📋 TALABLAR

### Zarur dasturlar:
- ✅ **Node.js** 18+ ([yuklab olish](https://nodejs.org/))
- ✅ **pnpm** yoki npm
- ✅ **Git** (ixtiyoriy)

### Tekshirish:
```bash
node --version   # v18.0.0 yoki yuqori
npm --version    # 9.0.0 yoki yuqori
```

---

## 📥 1. LOYIHANI YUKLAB OLISH

```bash
# Git orqali
git clone https://github.com/your-username/fusion-erp.git
cd fusion-erp

# Yoki ZIP yuklab olib, extract qiling
```

---

## ⚙️ 2. ENVIRONMENT SOZLASH

### .env faylini yaratish:
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

### .env faylini to'ldirish:
```env
# MAJBURIY: Bu qiymatlarni o'zgartiring!

# JWT Secrets (32+ belgi)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-generated-secret-here-32-chars-minimum
JWT_REFRESH_SECRET=your-another-secret-here-32-chars-minimum

# Admin login (birinchi kirish uchun)
# Parol: 8+ belgi, A-Z, a-z, 0-9, !@#$%^&*
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=YourStr0ng!Pass

# Database
DATABASE_PATH=./data/app.db

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

### JWT Secret generatsiya:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: abc123def456... (bu qiymatni JWT_SECRET ga qo'ying)

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: xyz789ghi012... (bu qiymatni JWT_REFRESH_SECRET ga qo'ying)
```

---

## 📦 3. DEPENDENCIES O'RNATISH

```bash
# pnpm (tavsiya etiladi)
pnpm install

# npm
npm install

# Yarn
yarn install
```

⏱️ **Vaqt:** ~2-3 daqiqa

---

## 🏗️ 4. BUILD (Production uchun)

```bash
# To'liq build
npm run build

# Yoki qismlarga bo'lib
npm run build:client   # Frontend
npm run build:server   # Backend
```

⏱️ **Vaqt:** ~1-2 daqiqa

### Build natijasi:
```
dist/
  ├── spa/           # Frontend build
  └── server/        # Backend build
data/
  └── app.db         # Database (avtomatik yaratiladi)
```

---

## ▶️ 5. ISHGA TUSHIRISH

### Development mode (hot reload):
```bash
npm run dev
```
- **URL:** http://localhost:5173
- **Hot reload:** Fayl o'zgarganda avtomatik yangilanadi

### Production mode:
```bash
npm start
```
- **URL:** http://localhost:3000
- **Optimized:** Production build ishlatiladi

---

## 🔑 6. BIRINCHI KIRISH

1. Brauzerni oching: **http://localhost:3000**

2. Login sahifasida:
   - **Email:** `.env` da belgilangan `ADMIN_EMAIL`
   - **Parol:** `.env` da belgilangan `ADMIN_PASSWORD`

3. **Kirish** tugmasini bosing

4. ✅ Dashboard ochiladi!

---

## 📊 7. TIZIMNI TEKSHIRISH

### Health check:
```bash
curl http://localhost:3000/health
```

**Kutilgan javob:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-07T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

### API test:
```bash
curl http://localhost:3000/api/ping
```

**Kutilgan javob:**
```json
{
  "message": "pong"
}
```

---

## 🔧 MUAMMOLARNI HAL QILISH

### Muammo 1: Port band
```
Error: Port 3000 is already in use
```

**Yechim:**
```bash
# .env da portni o'zgartiring
PORT=3001

# Yoki portni bo'shatish (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

### Muammo 2: Database yaratilmadi
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**Yechim:**
```bash
# data papkani qo'lda yaratish
mkdir data

# Yoki loyihani qayta ishga tushiring
npm start
```

---

### Muammo 3: JWT_SECRET xatosi
```
Error: JWT_SECRET environment variable majburiy (production)
```

**Yechim:**
```bash
# .env faylida JWT_SECRET ni o'rnating
JWT_SECRET=your-32-char-secret-here

# Secret generatsiya
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Muammo 4: ADMIN_PASSWORD xatosi
```
Error: ADMIN_PASSWORD environment variable majburiy (production)
```

**Yechim:**
```bash
# .env faylida kuchli parol o'rnating
# Talablar: 8+ belgi, A-Z, a-z, 0-9, !@#$%^&*
ADMIN_PASSWORD=MyStr0ng!Pass123
```

---

### Muammo 5: Node version
```
Error: The engine "node" is incompatible
```

**Yechim:**
```bash
# Node.js 18+ o'rnating
node --version  # Hozirgi versiya

# Yangi versiya yuklab olish: https://nodejs.org/
```

---

## 💾 BACKUP

### Manual backup:
```bash
# Production builddan keyin
npm run backup
```

**Natija:** `backups/app_2026-08-07_12-30-00.db`

### Avtomatik backup:
- **Vaqt:** Har kuni soat 2:00
- **Joylashtirish:** `backups/` papkada
- **Eski backuplar:** 30 kundan keyin o'chiriladi

### Backup'dan tiklash:
```javascript
// Node.js console'da
const { restoreBackup } = require('./dist/server/lib/backup');
restoreBackup('app_2026-08-07_12-30-00.db');
```

---

## 📝 FOYDALI BUYRUQLAR

```bash
# Development
npm run dev              # Hot reload bilan ishga tushirish

# Production
npm run build            # Build qilish
npm start                # Ishga tushirish

# Testing
npm test                 # Testlarni ishga tushirish
npm run typecheck        # TypeScript tekshirish

# Maintenance
npm run backup           # Manual backup
npm run backup:clean     # Eski backuplarni tozalash
npm run check:security   # Security audit
npm run check:env        # Environment tekshirish

# Formatting
npm run format.fix       # Code formatting
```

---

## 🌐 PORTLAR

| Service | Development | Production |
|---------|-------------|------------|
| Frontend | 5173 | 3000 |
| Backend API | 5173/api | 3000/api |
| Health Check | 5173/health | 3000/health |

---

## 📁 PAPKA TUZILISHI

```
fusion-erp/
├── client/              # Frontend (React)
│   ├── components/      # UI komponentlar
│   ├── pages/           # Sahifalar
│   └── App.tsx          # Asosiy app
├── server/              # Backend (Express)
│   ├── routes/          # API routes
│   ├── data/            # Database va seed
│   └── lib/             # Utilities
├── shared/              # Umumiy types
├── data/                # SQLite database
│   └── app.db           # Asosiy database
├── backups/             # Backup fayllar
├── dist/                # Build natijasi
├── .env                 # Environment variables
└── package.json         # Dependencies
```

---

## 🔐 DEFAULT LOGIN

**⚠️ DIQQAT:** Birinchi kirishdan keyin parolni o'zgartiring!

### Admin hisobi:
- **Email:** `.env` da `ADMIN_EMAIL`
- **Parol:** `.env` da `ADMIN_PASSWORD`
- **Role:** Admin (barcha huquqlar)

### Parolni o'zgartirish:
1. Tizimga kiring
2. Profil → Sozlamalar
3. "Parolni o'zgartirish"

---

## 🚀 PRODUCTION DEPLOYMENT

### Vercel (tavsiya etiladi):
```bash
# Vercel CLI o'rnatish
npm install -g vercel

# Deploy
vercel --prod
```

### Manual (VPS/Server):
```bash
# 1. Build
npm run build

# 2. PM2 bilan ishga tushirish
npm install -g pm2
pm2 start dist/server/node-build.mjs --name fusion-erp

# 3. Restart qilish
pm2 restart fusion-erp

# 4. Logs
pm2 logs fusion-erp
```

### Docker:
```bash
# Build
docker build -t fusion-erp .

# Run
docker run -p 3000:3000 -v $(pwd)/data:/app/data fusion-erp
```

---

## 📊 MONITORING

### Health check (har 5 daqiqada):
```bash
curl http://localhost:3000/health
```

### Logs:
```bash
# Development
# Console'da ko'rinadi

# Production
pm2 logs fusion-erp
```

### Database size:
```bash
# Windows
dir data\app.db

# Linux/Mac
ls -lh data/app.db
```

---

## 🆘 YORDAM

### Dokumentatsiya:
- `README.md` - Asosiy ma'lumot
- `API_DOCS.md` - API documentation
- `COMPREHENSIVE_AUDIT.md` - To'liq audit
- `FINAL_AUDIT_SUMMARY.md` - Xulosa

### Support:
- **Email:** support@yourcompany.com
- **Telegram:** @yourcompany
- **GitHub Issues:** github.com/your-username/fusion-erp/issues

---

## ✅ CHECKLIST

Ishga tushirishdan oldin:

- [ ] Node.js 18+ o'rnatilgan
- [ ] `.env` fayli yaratilgan
- [ ] `JWT_SECRET` o'rnatilgan (32+ belgi)
- [ ] `JWT_REFRESH_SECRET` o'rnatilgan (32+ belgi)
- [ ] `ADMIN_PASSWORD` kuchli parol (8+ belgi)
- [ ] Dependencies o'rnatilgan (`npm install`)
- [ ] Build qilingan (`npm run build`)
- [ ] Port (3000) bo'sh
- [ ] Health check ishlayapti

---

## 🎉 TAYYOR!

Tizim ishga tushirildi va ishlatishga tayyor!

**Keyingi qadamlar:**
1. ✅ Login qiling
2. ✅ Parolni o'zgartiring
3. ✅ Xodimlar qo'shing
4. ✅ Mahsulotlar qo'shing
5. ✅ Mijozlar qo'shing
6. ✅ Tizimdan foydalaning!

---

**Omad! 🚀**

*Fusion ERP - Professional Business Management System*
