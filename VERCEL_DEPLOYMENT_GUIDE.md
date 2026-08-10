# Vercel Deploy Qilish Ko'rsatmasi

## ⚠️ MUHIM: Login/Parol Muammosini Hal Qilish

Deploy qilganda login/parol ishlamasligi sababi - Vercel'da environment variables to'g'ri o'rnatilmagan.

## 1️⃣ Vercel Dashboard'da Environment Variables O'rnatish

### Kerakli Environment Variables:

Vercel dashboardingizga kiring: https://vercel.com/dashboard

1. Loyihangizni tanlang
2. **Settings** → **Environment Variables** bo'limiga o'ting
3. Quyidagi o'zgaruvchilarni qo'shing:

#### MAJBURIY O'zgaruvchilar:

```env
# JWT Secrets (32+ belgidan iborat random qiymat)
# Terminal'da quyidagi buyruqni bajaring:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_SECRET=148ed1d6d534697d8c58f59c743bee2ef964975198ab7cc38ff2fedb1201a91d
JWT_REFRESH_SECRET=a8d2c6c95aab2698b29e12d715a12e5b32f087e601db7d81f53474584781e3e6

# Admin Login Ma'lumotlari (MAJBURIY!)
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=Admin123!Fusion

# CORS - Vercel URL'ingiz
# Masalan: https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# JWT token muddati
JWT_EXPIRES_IN=12h
JWT_REFRESH_EXPIRES_IN=7d
```

### 2️⃣ Environment Variables Qo'shish Bosqichlari:

1. Har bir variable uchun **Add** tugmasini bosing
2. **Key** ga o'zgaruvchi nomini kiriting (masalan: `ADMIN_EMAIL`)
3. **Value** ga qiymatni kiriting (masalan: `admin@yourcompany.com`)
4. **Environment** da barcha muhitlarni tanlang:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Save** tugmasini bosing

### 3️⃣ Deploy Qilish

Environment variables o'rnatilgandan keyin:

```bash
# Git'ga commit qiling
git add .
git commit -m "fix: admin login configuration"
git push origin main

# Yoki Vercel orqali qayta deploy qiling:
vercel --prod
```

### 4️⃣ Tekshirish

Deploy tugagandan keyin:

1. Deploy qilingan URL'ga kiring
2. Login sahifasiga o'ting
3. Quyidagi ma'lumotlar bilan kiring:
   - **Login**: `admin@yourcompany.com` (ADMIN_EMAIL'da nima bo'lsa)
   - **Parol**: `Admin123!Fusion` (ADMIN_PASSWORD'da nima bo'lsa)

## 🔐 Xavfsizlik Maslahatlar

1. **Production'da kuchli parol ishlating:**
   - Kamida 12 belgi
   - Katta va kichik harflar
   - Raqamlar
   - Maxsus belgilar (!@#$%^&*)

2. **JWT Secret'larni random generate qiling:**
```bash
# Terminal'da bajaring:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. **ADMIN_PASSWORD'ni hech qachon kodga yozmang** - faqat environment variables'da saqlang

4. **Environment variables o'zgargandan keyin** albatta qayta deploy qiling

## 📋 To'liq Environment Variables Ro'yxati

Vercel'da quyidagi barcha o'zgaruvchilarni o'rnating:

```env
# Environment
NODE_ENV=production

# Admin Credentials (MAJBURIY!)
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=YourStrongP@ssw0rd123

# JWT Secrets (MAJBURIY!)
JWT_SECRET=your-32-char-random-secret-here
JWT_REFRESH_SECRET=your-32-char-refresh-secret-here
JWT_EXPIRES_IN=12h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://your-app.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## ❓ Tez-tez So'raladigan Savollar

**Q: Environment variables qo'shdim, lekin hali ham ishlamayapti?**
A: Vercel'da yangi deployment qilishingiz kerak. Settings'da "Redeploy" tugmasini bosing.

**Q: Qaysi login va parol ishlataman?**
A: `ADMIN_EMAIL` va `ADMIN_PASSWORD` environment variables'da qanday qiymat o'rnatgan bo'lsangiz, o'shanisi.

**Q: Localhost'da ishlayapti, lekin Vercel'da yo'q?**
A: Localhost `.env` faylidan o'qiydi, Vercel esa dashboard'dagi Environment Variables'dan. Ularni alohida o'rnatish kerak.

**Q: Parolni qanday o'zgartirsam bo'ladi?**
A: 
1. Vercel dashboard → Settings → Environment Variables
2. `ADMIN_PASSWORD` ni toping
3. Edit → yangi parol kiriting → Save
4. Qayta deploy qiling

## 🚀 Tezkor Hal Qilish

Agar hozir login ishlamayotgan bo'lsa:

1. Vercel dashboard'ga kiring: https://vercel.com
2. Loyihangizni tanlang
3. Settings → Environment Variables
4. `ADMIN_EMAIL` qo'shing: `admin@test.com`
5. `ADMIN_PASSWORD` qo'shing: `Admin123!`
6. `JWT_SECRET` qo'shing: `148ed1d6d534697d8c58f59c743bee2ef964975198ab7cc38ff2fedb1201a91d`
7. `JWT_REFRESH_SECRET` qo'shing: `a8d2c6c95aab2698b29e12d715a12e5b32f087e601db7d81f53474584781e3e6`
8. Deployments → oxirgi deployment → ⋯ → Redeploy
9. Deploy tugagach kirish: `admin@test.com` / `Admin123!`

---

✅ **Qo'shimcha yordam kerak bo'lsa, Vercel documentation'ga qarang:**
https://vercel.com/docs/projects/environment-variables
