# 🔧 Login/Parol Muammosini Hal Qilish

## ❌ Muammo
Localhost'da login ishlayapti, lekin deploy qilganda ishlamayapti.

## ✅ Yechim
Vercel'da environment variables o'rnatilmagan. Quyidagi qadamlarni bajaring:

---

## 📝 Qisqa Qo'llanma (5 daqiqa)

### 1. Vercel Dashboard'ga kiring
🔗 https://vercel.com/dashboard

### 2. Loyihangizni tanlang va Settings'ga o'ting
```
Loyihangiz → Settings → Environment Variables
```

### 3. Quyidagi 4 ta o'zgaruvchini qo'shing:

#### ① ADMIN_EMAIL
```
Key: ADMIN_EMAIL
Value: admin@test.com
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### ② ADMIN_PASSWORD
```
Key: ADMIN_PASSWORD
Value: Admin123!Fusion
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### ③ JWT_SECRET
```
Key: JWT_SECRET
Value: 148ed1d6d534697d8c58f59c743bee2ef964975198ab7cc38ff2fedb1201a91d
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### ④ JWT_REFRESH_SECRET
```
Key: JWT_REFRESH_SECRET
Value: a8d2c6c95aab2698b29e12d715a12e5b32f087e601db7d81f53474584781e3e6
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### 4. Qayta Deploy Qiling
```
Deployments → oxirgi deployment → ... menyu → Redeploy
```

### 5. Tizimga Kiring
```
Login: admin@test.com
Parol: Admin123!Fusion
```

---

## 🎯 Batafsil Ko'rsatma (Screenshot bilan)

### Bosqich 1: Environment Variables sahifasiga o'ting
1. Vercel dashboard'da loyihangizni oching
2. Yuqori menyudan **Settings** tugmasini bosing
3. Chap paneldan **Environment Variables** ni tanlang

### Bosqich 2: Har bir variable uchun:
1. **Add New** yoki **Add** tugmasini bosing
2. Quyidagi ma'lumotlarni kiriting:
   - **Key**: O'zgaruvchi nomi
   - **Value**: Qiymati
   - **Environments**: Barcha muhitlarni belgilang (Production, Preview, Development)
3. **Save** bosing

### Bosqich 3: Barcha 4 ta o'zgaruvchini qo'shing
- [x] ADMIN_EMAIL
- [x] ADMIN_PASSWORD
- [x] JWT_SECRET
- [x] JWT_REFRESH_SECRET

### Bosqich 4: Qayta deploy qiling
1. **Deployments** tabiga o'ting
2. Eng so'nggi deployment'ni toping
3. O'ng tarafdagi **...** (3 nuqta) tugmasini bosing
4. **Redeploy** ni tanlang
5. **Redeploy** tasdiqlash oynasida yana bir marta **Redeploy** bosing

### Bosqich 5: Kutish va tekshirish
- Deploy 1-2 daqiqa davom etadi
- **Building...** → **Ready** bo'lganda tayyor
- Saytingizga kiring va login qiling

---

## 🔑 Test Login Ma'lumotlari

```
Email/Login: admin@test.com
Parol: Admin123!Fusion
```

---

## 🛠️ Agar Ishlamasa

### Variant 1: Loglarni Tekshiring
```
Vercel Dashboard → Deployments → Oxirgi deployment → Function Logs
```
Bu yerda xato xabarlarini ko'ring.

### Variant 2: Environment Variables Tekshirish
```
Settings → Environment Variables
```
4 ta o'zgaruvchi borligini va ularning qiymatlari to'g'ri ekanligini tekshiring.

### Variant 3: Qayta Deploy
```
Deployments → ... → Redeploy
```
Ba'zan environment variables o'zgargandan keyin qayta deploy qilish kerak.

### Variant 4: Browser Cache Tozalash
```
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)
```
Browser cache'ni tozalang va qaytadan kiriting.

---

## 💡 Muhim Eslatmalar

1. **Environment variables o'zgargandan keyin** ALBATTA qayta deploy qiling
2. **Localhost va Vercel alohida** - localhost `.env` faylidan, Vercel dashboard'dan o'qiydi
3. **Parol kuchli bo'lishi kerak** - production uchun murakkab parol ishlating
4. **JWT_SECRET 32 belgidan kam bo'lmasligi kerak**

---

## 📚 Qo'shimcha Resurslar

- [Vercel Environment Variables Documentation](https://vercel.com/docs/projects/environment-variables)
- [Loyihadagi to'liq ko'rsatma](./VERCEL_DEPLOYMENT_GUIDE.md)

---

## ✅ Tekshirish Ro'yxati

Deploy qilishdan oldin:
- [ ] 4 ta environment variable qo'shildi
- [ ] Barcha environments tanlandi (Production, Preview, Development)
- [ ] Qiymatlar to'g'ri kiritildi
- [ ] Deploy qayta bajariladı
- [ ] Login ishlayapti

---

**Yordam kerak bo'lsa:** `VERCEL_DEPLOYMENT_GUIDE.md` faylini o'qing yoki savol bering!
