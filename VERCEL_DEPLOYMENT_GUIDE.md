# 🚀 VERCEL GA DEPLOY QILISH - ODDIY QO'LLANMA

## ⚡ TEZKOR DEPLOY (3 daqiqa)

### Variant 1: Vercel CLI (Eng tez)

1. **PowerShell'ni oching va bajaring:**

```powershell
cd C:\Users\user\Desktop\fusion-starter-fab
vercel
```

2. **Savollarga javob bering:**
   - Setup and deploy? `Y` (Enter)
   - Which scope? `(o'zingizni tanlang)` (Enter)
   - Link to existing project? `N` (Enter)
   - Project name? `fusion-erp` (Enter)
   - Directory? `./` (Enter)
   - Override settings? `N` (Enter)

3. **Deployment URL olinadi:**
```
✅ Deployed to production: https://fusion-erp-xxxxx.vercel.app
```

4. **Production'ga deploy qilish:**
```powershell
vercel --prod
```

---

### Variant 2: Vercel Dashboard (Vizual)

#### 1. Vercel'ga kirish
1. Oching: https://vercel.com/login
2. GitHub bilan login qiling

#### 2. GitHub Repository yaratish
1. Oching: https://github.com/new
2. Repository name: `fusion-erp`
3. Private tanlang
4. Create repository

#### 3. Kodni GitHub'ga yuklash

PowerShell'da:
```powershell
cd C:\Users\user\Desktop\fusion-starter-fab

# GitHub URL'ni o'zingiznikiga o'zgartiring
git remote add origin https://github.com/YOUR_USERNAME/fusion-erp.git
git branch -M main
git push -u origin main
```

**Token kerak bo'lsa:**
- https://github.com/settings/tokens/new
- Select: `repo`
- Generate token
- Token'ni parol o'rniga ishlating

#### 4. Vercel'da Import qilish
1. Oching: https://vercel.com/new
2. "Import Git Repository" tugmasini bosing
3. `fusion-erp` ni tanlang
4. "Import" tugmasini bosing

#### 5. Build Settings (Avtomatik to'ldiriladi)
```
Framework Preset: Vite
Build Command: pnpm run build:vercel
Output Directory: dist/spa
Install Command: pnpm install
```

#### 6. Environment Variables
**MAJBURIY!** Qo'shing:

```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_REFRESH_SECRET=z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
ADMIN_EMAIL=admin@fusion-erp.com
ADMIN_PASSWORD=Admin123!@#
NODE_ENV=production
```

**Secret generatsiya:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 7. Deploy qilish
1. **Deploy** tugmasini bosing
2. 3-5 daqiqa kutasiz
3. **✅ Success!**

---

## 🎯 DEPLOYMENT URL

Deploy muvaffaqiyatli bo'lgandan keyin:

```
🌐 URL: https://fusion-erp-xxxxx.vercel.app
📧 Email: admin@fusion-erp.com
🔒 Password: Admin123!@#
```

---

## 🔧 MUAMMOLAR VA YECHIMLAR

### 1. Build Failed - "Command not found"
**Sabab:** `pnpm` topilmadi

**Yechim:**
Vercel Dashboard → Settings → General → Node.js Version:
- `18.x` yoki `20.x` tanlang

### 2. 500 Internal Server Error
**Sabab:** Environment Variables noto'g'ri

**Yechim:**
1. Settings → Environment Variables'ni tekshiring
2. Barcha kerakli variablelar mavjudligini tasdiqlang
3. Redeploy qiling: Deployments → ••• → Redeploy

### 3. "Failed to load module"
**Sabab:** Build noto'g'ri

**Yechim:**
- Build Command: `pnpm run build:vercel`
- Output Directory: `dist/spa`

### 4. GitHub push xatoligi
**Sabab:** Authentication

**Yechim:**
```powershell
# Personal Access Token ishlatish
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/fusion-erp.git
git push -u origin main
```

---

## � VERCEL DASHBOARD

Deploy bo'lgandan keyin:

### Monitoring:
- **Analytics**: Traffic ko'rish
- **Logs**: Xatolarni topish
- **Speed Insights**: Performance

### Settings:
- **Domains**: Custom domain qo'shish
- **Environment Variables**: O'zgartirish
- **Git**: Auto-deploy sozlamalari

---

## 🔄 AUTO DEPLOYMENT

GitHub'ga har `git push` qilganingizda, Vercel avtomatik deploy qiladi:

```powershell
cd C:\Users\user\Desktop\fusion-starter-fab
git add .
git commit -m "fix: some changes"
git push
```

Vercel avtomatik:
1. Build qiladi
2. Test qiladi
3. Deploy qiladi
4. URL yangilanadi

---

## 🌐 CUSTOM DOMAIN

### 1. Vercel Dashboard
- Settings → Domains
- "Add" tugmasini bosing

### 2. Domain qo'shish
```
erp.mycompany.uz
```

### 3. DNS sozlamalari
```
Type: CNAME
Name: erp
Value: cname.vercel-dns.com
```

### 4. SSL
Vercel avtomatik SSL sertifikat beradi (Let's Encrypt)

---

## � PRODUCTION SECURITY

### 1. Environment Variables o'zgartirish
```powershell
# Yangi secret generatsiya
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Vercel'da:
- Settings → Environment Variables
- `JWT_SECRET` va `JWT_REFRESH_SECRET` ni yangilang
- Redeploy qiling

### 2. Admin parolni o'zgartirish
- `ADMIN_PASSWORD` environment variable'ni o'zgartiring
- Redeploy qiling

### 3. CORS sozlash
Agar API alohida bo'lsa:
```env
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-domain.com
```

---

## 📱 TEST QILISH

Deploy bo'lgandan keyin:

1. **URL'ni oching**: `https://fusion-erp-xxxxx.vercel.app`
2. **Login qiling**:
   - Email: Environment Variables'dagi `ADMIN_EMAIL`
   - Password: Environment Variables'dagi `ADMIN_PASSWORD`
3. **Barcha sahifalarni test qiling**:
   - ✅ Ombor boshqaruvi
   - ✅ Sotuvlar
   - ✅ Mijozlar
   - ✅ Moliya
   - ✅ Xodimlar
   - ✅ Hisobotlar

---

## 🎉 TAYYOR!

Loyihangiz onlayn: `https://fusion-erp-xxxxx.vercel.app`

**Keyingi qadamlar:**
1. Custom domain qo'shing
2. Production parolni o'zgartiring
3. Team memberlarni invite qiling
4. Database ulang (PostgreSQL/MongoDB)

---

## 📞 YORDAM

- Vercel Docs: https://vercel.com/docs
- Vercel Support: support@vercel.com
- GitHub Issues: https://github.com/vercel/vercel/issues

**Omad! 🚀**
