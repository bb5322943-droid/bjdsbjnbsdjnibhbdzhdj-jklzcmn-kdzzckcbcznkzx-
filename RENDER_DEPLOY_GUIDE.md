# 🚀 RENDER.COM DEPLOY - GITHUB'SIZ

## ✅ Nima uchun Render?

**Vercel CLI ishlamayapti** (SSL muammosi)
**Render** - GitHub'siz deploy qilish mumkin! ⭐

---

## 📊 RENDER vs VERCEL

| Feature | Vercel | Render |
|---------|--------|--------|
| GitHub'siz deploy | ❌ Qiyin | ✅ Oson |
| Docker support | ⚠️ Cheklangan | ✅ To'liq |
| PostgreSQL | Tashqi kerak | ✅ Ichida (free) |
| Free tier | ✅ Yaxshi | ✅ Yaxshi |
| CLI muammosi | ❌ SSL error | ✅ Ishlaydi |

---

## 🎯 RENDER'GA DEPLOY (10 daqiqa)

### QADAM 1: Account yaratish

**Link:** https://render.com/register

1. Email bilan sign up qiling
2. Email'ni verify qiling

---

### QADAM 2: Dockerfile yaratish

Render Docker orqali deploy qiladi. Dockerfile kerak.

**Loyiha papkasida yarating: `Dockerfile`**

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build
RUN pnpm run build

# Production image
FROM node:18-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

EXPOSE 8080

CMD ["node", "dist/server/node-build.mjs"]
```

---

### QADAM 3: Render Dashboard'da

**Link:** https://dashboard.render.com

1. **"New +"** tugmasini bosing
2. **"Web Service"** ni tanlang

---

### QADAM 4: Deploy Options

#### **Variant A: GitHub (agar qaytarsangiz)**
- Repository'ni tanlang
- Auto-deploy yoqiladi

#### **Variant B: Docker Hub** 
- Docker image'ni upload qiling
- Render'da pull qiladi

#### **Variant C: Manual Git (SSH)** ⭐ **Tavsiya**
- Render sizga Git URL beradi
- Siz push qilasiz

---

### QADAM 5: Render Manual Git Deploy

1. **Render Dashboard → New Web Service**
2. **"Deploy from Git"** tanlang
3. **Render Git URL'ni copy qiling:**
   ```
   https://git.render.com/srv-xxxxx.git
   ```

4. **Loyihangizda Git'ni qaytadan ishga tushiring:**
   ```powershell
   git init
   git add .
   git commit -m "Deploy to Render"
   git remote add render https://git.render.com/srv-xxxxx.git
   git push render main
   ```

---

### QADAM 6: Build Settings

**Render Dashboard'da:**

```
Name: fusion-erp
Environment: Docker
Branch: main (yoki master)
```

**Build Command:** (Docker o'zi build qiladi)
```
(bo'sh qoldiring)
```

**Start Command:**
```
node dist/server/node-build.mjs
```

---

### QADAM 7: Environment Variables

**Render Dashboard → Environment → Environment Variables:**

```
NODE_ENV=production
JWT_SECRET=8065f7e15a2c3f45066dfa6fd74dde6e3586c94996d078509d4bca75a13849e2
JWT_REFRESH_SECRET=07cf1169d3b0f8a4c87a2295c8e7c2c589d24f03b2c75011522c662de6f6b09f
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_EMAIL=admin@yourcompany.uz
ADMIN_PASSWORD=YourStrongPassword123!
ALLOWED_ORIGINS=https://fusion-erp.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

---

### QADAM 8: PostgreSQL Database (Optional)

**Render → New → PostgreSQL:**

1. Database name: `fusion_erp_db`
2. Free tier: ✅
3. Create Database

**Internal Database URL'ni copy qiling va env var qo'shing:**
```
DATABASE_URL=postgresql://...
```

---

### QADAM 9: Deploy!

**Render Dashboard'da:**
- "Create Web Service" tugmasini bosing
- Build jarayonini kuzating (5-10 daqiqa)

**Deploy tugagach:**
```
https://fusion-erp.onrender.com
```

---

## 🎯 QISQA YO'L (Git'siz)

**Agar Git ishlatishni xohlamasangiz:**

### Docker Image orqali:

1. **Docker Desktop o'rnating**
2. **Dockerfile yarating** (yuqoridagi)
3. **Image build qiling:**
   ```powershell
   docker build -t fusion-erp .
   ```
4. **Docker Hub'ga push:**
   ```powershell
   docker tag fusion-erp username/fusion-erp
   docker push username/fusion-erp
   ```
5. **Render'da Docker Image'dan deploy:**
   - "Docker Image" option
   - `username/fusion-erp`

---

## 💰 NARX

**Free Tier:**
- 750 soat/oy (1 ta service uchun yetarli)
- 512 MB RAM
- PostgreSQL free tier: 90 kun

**Paid:**
- Starter: $7/oy
- PostgreSQL: $7/oy

---

## ✅ AFZALLIKLARI

- ✅ GitHub'siz ishlaydi
- ✅ Docker native support
- ✅ PostgreSQL ichida
- ✅ SSL sertifikat avtomatik
- ✅ Custom domain
- ✅ Logs va monitoring

---

## 📋 TEKSHIRISH LISTI

**Pre-Deploy:**
- [ ] Render account yaratildi
- [ ] Dockerfile yaratildi
- [ ] Environment variables tayyorlandi

**Deploy:**
- [ ] Web Service yaratildi
- [ ] Git/Docker configured
- [ ] Environment variables qo'shildi
- [ ] Deploy boshlandi

**Post-Deploy:**
- [ ] URL test qilindi
- [ ] API ishlayapti
- [ ] Login qilindi
- [ ] Database ulandi

---

## 🚨 XATOLIKLAR

### Build Failed
**Yechim:**
- Logs'ni tekshiring
- Dockerfile to'g'riligini tekshiring
- pnpm-lock.yaml mavjudligini tekshiring

### Runtime Error
**Yechim:**
- Environment variables to'g'riligini tekshiring
- Start command to'g'riligini tekshiring

### Database Error
**Yechim:**
- DATABASE_URL to'g'riligini tekshiring
- PostgreSQL yaratilganligini tekshiring

---

## 📞 YORDAM

**Agar muammo bo'lsa:**
1. Render Logs'ni o'qing
2. Screenshot yuboring
3. Men yordam beraman!

---

## 🎯 XULOSA

**Render - GitHub'siz deploy qilishning eng yaxshi yo'li!**

- ✅ Oson
- ✅ Ishonchli
- ✅ Free tier
- ✅ Professional

**5-10 daqiqada tayyor bo'ladi!** 🚀
