# 🚀 FUSION ERP - GITHUB + VERCEL DEPLOY (5 daqiqa)

## QADAMLAR:

### 1️⃣ GitHub repository yaratish (1 daqiqa)

1. Brauzerda oching: https://github.com/new
2. Repository nomi: `fusion-erp` 
3. **Private** tanlang (xavfsizlik uchun)
4. **Create repository** tugmasini bosing
5. Ko'rsatilgan **HTTPS URL**ni nusxalang (masalan: `https://github.com/username/fusion-erp.git`)

### 2️⃣ Loyihani GitHub'ga yuklash (2 daqiqa)

PowerShell'da quyidagi buyruqlarni bajaring:

```powershell
cd C:\Users\user\Desktop\fusion-starter-fab

# GitHub URL'ni o'zingiznikiga o'zgartiring!
git remote add origin https://github.com/YOUR_USERNAME/fusion-erp.git

# Push qilish
git branch -M main
git push -u origin main
```

Agar parol so'rasa, **Personal Access Token** kiriting:
- https://github.com/settings/tokens/new
- Scope: `repo` belgisini tanlang
- Token yarating va saqlang

### 3️⃣ Vercel'da import qilish (2 daqiqa)

1. Oching: https://vercel.com/login
2. **GitHub** bilan login qiling
3. Oching: https://vercel.com/new
4. **Import Git Repository** bo'limida `fusion-erp` ni toping
5. **Import** tugmasini bosing

### 4️⃣ Environment Variables o'rnatish

Vercel Deploy Settings sahifasida **Environment Variables** bo'limiga:

```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_REFRESH_SECRET=z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
ADMIN_EMAIL=admin@fusion-erp.com
ADMIN_PASSWORD=Admin123!@#
```

**YOKI** bu secretlarni generatsiya qiling:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5️⃣ Deploy qiling

1. **Deploy** tugmasini bosing
2. 3-5 daqiqa kutasiz (build jarayoni)
3. **Success!** - URL oling: `https://fusion-erp-xxxxx.vercel.app`

---

## ✅ DEPLOY TUGALLANDI!

### Login ma'lumotlar:

```
URL: https://your-app.vercel.app
Email: admin@fusion-erp.com  (yoki ADMIN_EMAIL'dagi qiymat)
Password: Admin123!@#  (yoki ADMIN_PASSWORD'dagi qiymat)
```

---

## 🔧 KEYINGI QADAMLAR

### Custom domain qo'shish:
1. Vercel Dashboard → Settings → Domains
2. O'z domeningizni qo'shing: `erp.mycompany.uz`

### Production parolni o'zgartish:
1. Vercel Dashboard → Settings → Environment Variables
2. `ADMIN_PASSWORD` ni yangi qiymatga o'zgartiring
3. **Redeploy** qiling

### Auto-deployment:
GitHub'ga har `git push` qilganingizda, Vercel avtomatik deploy qiladi! 🎉

---

## ❓ MUAMMOLAR?

### Build failed
- Vercel Dashboard → Deployments → Logs'ni tekshiring
- Ko'pincha Environment Variables noto'g'ri

### 404 Not Found
- `vercel.json` fayli to'g'ri ekanligini tekshiring (allaqachon to'g'ri)

### Database not working
- Bu versiya in-memory DB ishlatadi
- Production uchun PostgreSQL/MongoDB ulang

---

## 📞 YORDAM

Agar muammo bo'lsa:
1. Vercel Logs'ni tekshiring
2. Environment Variables to'g'ri ekanligini tasdiqlang
3. GitHub'da yangi commit qiling va qayta deploy bo'lishini kuting

---

**🎉 Omad! Loyihangiz onlayn bo'ladi!**
