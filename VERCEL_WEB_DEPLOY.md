# 🌐 VERCEL WEB UI DEPLOY - CLI MUAMMOSI YECHIMI

## ❌ Muammo: Vercel CLI ishlamayapti

**Xato:**
```
Error: unable to verify the first certificate
```

**Sabab:**
- Korporativ proksi/firewall
- SSL sertifikat muammosi
- Antivirus bloklagan

---

## ✅ YECHIM: Web UI orqali deploy (5 daqiqa)

CLI kerak emas! Brauzer orqali deploy qilish **osonroq va ishonchli**.

---

## 📋 QADAM-MA-QADAM (Copy-Paste tayyor)

### QADAM 1: Vercel'ga kirish

**Link:** https://vercel.com/login

1. Brauzerda oching
2. **"Continue with GitHub"** bosing
3. GitHub bilan authorize qiling

---

### QADAM 2: Repository Import

**Link:** https://vercel.com/new

**Yoki to'g'ridan-to'g'ri:**
```
https://vercel.com/new/git/external?repository-url=https://github.com/shodiyorfozilov18-glitch/fusion-erp
```

1. "Import Git Repository" bo'limini ko'ring
2. **fusion-erp** repository'ni toping
3. **"Import"** tugmasini bosing

---

### QADAM 3: Configure Project

#### Project Settings:

```
Project Name: fusion-erp (yoki o'zingizniki)
Framework Preset: Other
Root Directory: ./
```

#### Build & Development Settings:

**⚠️ DIQQAT: Bu sozlamalarni to'g'ri kiriting!**

```
Build Command:
pnpm run build:vercel

Output Directory:
dist/spa

Install Command:
pnpm install

Development Command:
pnpm dev
```

**Node.js Version:** 18.x (default)

---

### QADAM 4: Environment Variables

**Environment Variables** bo'limida quyidagilarni **BIRIN-KETIN** qo'shing:

#### Variable 1:
```
Name: NODE_ENV
Value: production
☑ Production  ☑ Preview  ☑ Development
```

#### Variable 2:
```
Name: JWT_SECRET
Value: 8065f7e15a2c3f45066dfa6fd74dde6e3586c94996d078509d4bca75a13849e2
☑ Production  ☑ Preview  ☑ Development
```

#### Variable 3:
```
Name: JWT_REFRESH_SECRET
Value: 07cf1169d3b0f8a4c87a2295c8e7c2c589d24f03b2c75011522c662de6f6b09f
☑ Production  ☑ Preview  ☑ Development
```

#### Variable 4:
```
Name: JWT_EXPIRES_IN
Value: 15m
☑ Production  ☑ Preview  ☑ Development
```

#### Variable 5:
```
Name: JWT_REFRESH_EXPIRES_IN
Value: 7d
☑ Production  ☑ Preview  ☑ Development
```

#### Variable 6:
```
Name: ADMIN_EMAIL
Value: admin@yourcompany.uz
☑ Production  ☑ Preview  ☑ Development
```

#### Variable 7:
```
Name: ADMIN_PASSWORD
Value: YourStrongPassword123!
☑ Production  ☑ Preview  ☑ Development
```

⚠️ **MUHIM:** Bu parolni o'zgartiring! Kamida 12 belgi, katta/kichik harf, raqam, maxsus belgi.

#### Variable 8:
```
Name: ALLOWED_ORIGINS
Value: https://your-app.vercel.app
☑ Production  ☑ Preview  ☑ Development
```

⚠️ **DIQQAT:** Deploy tugagach bu URL'ni haqiqiy URL'ga o'zgartiring!

#### Variable 9:
```
Name: RATE_LIMIT_WINDOW_MS
Value: 900000
☑ Production  ☑ Preview  ☑ Development
```

#### Variable 10:
```
Name: RATE_LIMIT_MAX_REQUESTS
Value: 100
☑ Production  ☑ Preview  ☑ Development
```

#### Variable 11:
```
Name: LOG_LEVEL
Value: info
☑ Production  ☑ Preview  ☑ Development
```

---

### QADAM 5: Deploy!

1. Barcha sozlamalarni tekshiring
2. **"Deploy"** tugmasini bosing
3. Build jarayonini kuzating (2-3 daqiqa)

**Build Logs:**
- ✅ Installing dependencies
- ✅ Building client
- ✅ Building server
- ✅ Deploying...

---

### QADAM 6: URL Oling

Deploy tugagach:

```
✅ Deployment completed!

Your URL: https://fusion-erp-xxx.vercel.app
```

URL'ni copy qiling va test qiling!

---

## 🧪 TEST QILISH

### 1. Homepage Test
```
https://your-app.vercel.app
```
✅ Login sahifasi ochilishi kerak

### 2. API Test
```
https://your-app.vercel.app/api/ping
```
✅ `{"message":"pong"}` qaytishi kerak

### 3. Login Test
```
Email: admin@yourcompany.uz
Password: YourStrongPassword123!
```
✅ Dashboard'ga kirish kerak

---

## ⚙️ DEPLOY TUGAGACH

### 1. ALLOWED_ORIGINS'ni yangilang

Haqiqiy URL'ni kiriting:

```
Vercel Dashboard → Settings → Environment Variables → ALLOWED_ORIGINS

Old: https://your-app.vercel.app
New: https://fusion-erp-xxx.vercel.app (haqiqiy URL)
```

Save va **Redeploy** qiling.

### 2. Database sozlang

**DATABASE_SETUP_GUIDE.md** faylini o'qing va database ulang.

---

## 📊 MONITORING

### Logs ko'rish:
```
Vercel Dashboard → Deployments → Latest → Logs
```

**3 xil log:**
- Build Logs (build jarayoni)
- Function Logs (API runtime)
- Static Logs (frontend)

### Analytics:
```
Vercel Dashboard → Analytics
```

---

## 🚨 XATOLAR VA YECHIMLAR

### Build Failed
**Yechim:**
1. Build Logs'ni o'qing
2. Xato qatorini toping
3. Local'da test qiling: `pnpm run build:vercel`

### Runtime Error 500
**Yechim:**
1. Function Logs'ni tekshiring
2. Environment variables to'g'riligini tekshiring
3. DATABASE_URL yo'qligini bildirsa - normal (keyingi qadam)

### CORS Error
**Yechim:**
1. ALLOWED_ORIGINS'ga haqiqiy URL qo'shing
2. Redeploy qiling

---

## ✅ SUCCESS CHECKLIST

**Pre-Deploy:**
- [x] GitHub'ga push qilindi
- [x] Build local'da ishlaydi

**Deploy:**
- [ ] Vercel'ga login qilindi
- [ ] Repository import qilindi
- [ ] Build settings to'g'ri kiritildi
- [ ] 11 ta environment variable qo'shildi
- [ ] Deploy boshlandi

**Post-Deploy:**
- [ ] URL olindi
- [ ] Homepage test o'tdi
- [ ] API test o'tdi
- [ ] ALLOWED_ORIGINS yangilandi
- [ ] Redeploy qilindi

**Next Steps:**
- [ ] Database sozlandi (Supabase)
- [ ] Login test o'tdi
- [ ] Production monitoring sozlandi

---

## 📞 YORDAM

Agar muammo bo'lsa:

1. **Build Logs** tekshiring
2. **VERCEL_ENV_VARS.txt** dan variable'larni qayta tekshiring
3. **FINAL_DEPLOY_CHECKLIST.md** ni o'qing

---

## 🎯 XULOSA

**CLI kerak emas!** Web UI orqali deploy qilish:
- ✅ Osonroq
- ✅ Ishonchli
- ✅ SSL muammosi yo'q
- ✅ Visual interface

**5-10 daqiqada deploy tugaydi!** 🚀

---

**ENDI BOSHLANG:**
```
https://vercel.com/new
```

**OMAD!** 🎉
