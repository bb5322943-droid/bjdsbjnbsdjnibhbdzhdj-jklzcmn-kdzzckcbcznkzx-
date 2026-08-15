# 🚀 VERCEL'GA DEPLOY QILISH QO'LLANMASI

## Bosqichma-bosqich ko'rsatma (5 daqiqa)

### 1️⃣ Vercel hisobini ochish

1. [https://vercel.com](https://vercel.com) saytiga o'ting
2. **"Sign Up"** tugmasini bosing
3. **GitHub** yoki **Email** bilan ro'yxatdan o'ting

### 2️⃣ GitHub repository yaratish

1. [https://github.com/new](https://github.com/new) ga o'ting
2. Repository nomi: `fusion-erp` (yoki boshqa nom)
3. **Private** yoki **Public** tanlang
4. **Create repository** tugmasini bosing

### 3️⃣ Loyihani GitHub'ga yuklash

PowerShell da quyidagi buyruqlarni bajaring:

```powershell
cd C:\Users\user\Desktop\fusion-starter-fab

# Git remote qo'shish (o'zingizning GitHub username'ingiz bilan)
git remote add origin https://github.com/USERNAME/fusion-erp.git

# Push qilish
git branch -M main
git push -u origin main
```

### 4️⃣ Vercel'da import qilish

1. [https://vercel.com/new](https://vercel.com/new) ga o'ting
2. **"Import Git Repository"** tugmasini bosing
3. GitHub repository'ngizni toping va **"Import"** ni bosing

### 5️⃣ Environment Variables o'rnatish

Vercel Dashboard'da **"Environment Variables"** bo'limiga quyidagilarni qo'shing:

```
JWT_SECRET=<32-belgilik-random-string>
JWT_REFRESH_SECRET=<32-belgilik-boshqa-random-string>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongP@ssw0rd123
```

**Secret generatsiya qilish:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6️⃣ Deploy qilish

1. **"Deploy"** tugmasini bosing
2. 2-3 daqiqa kutasiz
3. Deploy muvaffaqiyatli bo'lgandan keyin **URL** ni oling

---

## 🎉 TAYYOR!

Vercel sizga URL beradi, masalan: `https://fusion-erp.vercel.app`

Login qilish:
- Email: `ADMIN_EMAIL` (siz o'rnatgan)
- Password: `ADMIN_PASSWORD` (siz o'rnatgan)

---

## ❓ Muammolar bo'lsa?

1. **Build xatolari**: Vercel Logs'ni tekshiring
2. **API ishlamaydi**: Environment Variables to'g'ri o'rnatilganini tekshiring
3. **Login qila olmasam**: ADMIN_EMAIL va ADMIN_PASSWORD to'g'ri ekanligini tekshiring

---

## 🔧 Qo'shimcha

**Custom domain qo'shish:**
1. Vercel Dashboard → Settings → Domains
2. O'zingizning domeningizni qo'shing (masalan: `erp.yourdomain.com`)

**Database:**
Bu versiya **in-memory** database ishlatadi. Production uchun **PostgreSQL** yoki **MongoDB** ulang.
