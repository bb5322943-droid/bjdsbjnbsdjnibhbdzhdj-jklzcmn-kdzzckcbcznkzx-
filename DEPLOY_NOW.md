# ⚡ 3 QADAM - DEPLOY QILING!

Men sizning loyihangizni deploy qilishga tayyor qildim. Endi faqat 3 ta oddiy qadam!

---

## 📦 QADAM 1: GitHub Repository Yarating (2 daqiqa)

### A. GitHub'ga kiring va yangi repo yarating:
👉 **Bu havolani oching:** https://github.com/new

### B. Sozlamalar:
- **Repository name:** `fusion-erp` (yoki boshqa nom)
- **Public** yoki **Private** - istagan tanlang
- ⚠️ **MUHIM:** "Add a README file" - **BOSHMANG** (bo'sh repo kerak!)
- **"Create repository"** tugmasini bosing

### C. Terminalda ishga tushiring:

```powershell
# 1. Remote URL'ni o'zgartiring (SIZNING USERNAME'ingiz bilan)
git remote remove origin
git remote add origin https://github.com/SIZNING_USERNAME/fusion-erp.git

# 2. Push qiling
git branch -M main
git push -u origin main
```

**Namuna:**
```powershell
git remote remove origin
git remote add origin https://github.com/shodiyorfozilov18-glitch/fusion-erp.git
git branch -M main
git push -u origin main
```

---

## 🚀 QADAM 2: Vercel'ga Deploy Qiling (3 daqiqa)

### A. Vercel'ga kiring:
👉 **Bu havolani oching:** https://vercel.com/new

### B. GitHub repository'ni import qiling:
1. "Import Git Repository" bo'limidan GitHub repo'ingizni tanlang
2. "Import" tugmasini bosing

### C. Environment Variables qo'shing:

**"Environment Variables" bo'limiga quyidagilarni qo'shing:**

#### 🔐 JWT Secrets (Majburiy - pastdagi generatsiya qiling!)

**Terminal'da ishga tushiring:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Bu sizga 2 ta random string beradi. Ikkinchi marta ham ishga tushiring:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Vercel'da qo'shing:**

| Variable Name           | Value                                |
|------------------------|--------------------------------------|
| `JWT_SECRET`           | (birinchi random string)             |
| `JWT_REFRESH_SECRET`   | (ikkinchi random string)             |
| `ADMIN_EMAIL`          | admin@yourcompany.com               |
| `ADMIN_PASSWORD`       | Admin123!Strong                     |
| `NODE_ENV`             | production                          |
| `ALLOWED_ORIGINS`      | (Vercel deploy'dan keyin qo'shamiz) |

### D. Deploy qiling:
- **"Deploy"** tugmasini bosing
- 2-3 daqiqa kuting...

---

## ✅ QADAM 3: CORS Sozlang va Test Qiling (1 daqiqa)

### A. Deploy URL'ini oling:
Deploy tugagach, Vercel sizga URL beradi, masalan:
```
https://fusion-erp-abc123.vercel.app
```

### B. CORS sozlang:
1. Vercel dashboard'da **"Settings" > "Environment Variables"** ga o'ting
2. `ALLOWED_ORIGINS` ni qo'shing yoki tahrirlang:
   ```
   https://fusion-erp-abc123.vercel.app
   ```
3. **Redeploy qiling:** "Deployments" > "..." > "Redeploy"

### C. Test qiling:
1. Vercel URL'ingizni oching: `https://fusion-erp-abc123.vercel.app`
2. Login qiling:
   - **Email:** `admin@yourcompany.com`
   - **Password:** (siz o'rnatgan parol)

---

## 🎉 TAYYOR!

Agar hammasi to'g'ri bo'lsa, loyihangiz ishga tushdi! 

### 🔧 Keyingi qadamlar:

1. ✅ Admin parolni o'zgartiring (Profile > Change Password)
2. ✅ Yangi foydalanuvchilar yarating
3. ✅ Ma'lumotlarni kiriting

---

## ❌ Muammolar?

### "CORS error" ko'rsangiz:
- `ALLOWED_ORIGINS` da Vercel URL'ingiz borligini tekshiring
- Redeploy qiling

### "JWT_SECRET" xatosi:
- Environment Variables'da `JWT_SECRET` va `JWT_REFRESH_SECRET` borligini tekshiring
- Kamida 32 belgi uzunlikda ekanligini tasdiqlang

### Build xatosi:
- Logs'ni tekshiring: Vercel dashboard > Deployments > Logs

---

## 📞 Yordam

Agar muammo bo'lsa, menga ayting - men yordam beraman!

**Omad! 🚀**
