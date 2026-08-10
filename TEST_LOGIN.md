# 🧪 LOGIN TEST MA'LUMOTLARI

## ✅ LOCALHOST va PRODUCTION uchun

### 🔑 Admin Login (ASOSIY)

**Email bilan:**
```
Login: admin@orbiserp.uz
Parol: OrbisAdmin2024!
```

**Username bilan:**
```
Login: admin
Parol: OrbisAdmin2024!
```

---

### 👥 Boshqa Foydalanuvchilar

**Menejr:**
```
Login: menejr
Parol: 123456
```

**Hisobchi:**
```
Login: hisobchi
Parol: 123456
```

**Kassir:**
```
Login: kassir
Parol: 123456
```

---

## 🚀 DEPLOY QILISHDAN OLDIN

1. ✅ Database faylini o'chiring (yangi ma'lumotlar yaratiladi):
```bash
Remove-Item -Path ".\data\app.db" -Force
```

2. ✅ O'zgarishlarni commit qiling:
```bash
git add .
git commit -m "ready for deployment with working login"
git push origin main
```

3. ✅ Deploy qiling (Vercel/Netlify)

4. ✅ Login qiling:
   - Email: `admin@orbiserp.uz`
   - Parol: `OrbisAdmin2024!`

---

## 🔧 MUAMMOLARNI HAL QILISH

### ❌ "Login yoki parol noto'g'ri" xatosi

**Sababi:** Database eski, yangi parol hash'lari yo'q

**Yechim:**
```bash
# 1. Database faylini o'chiring
Remove-Item -Path ".\data\app.db" -Force

# 2. Serverni qayta ishga tushiring
pnpm dev
```

### ❌ Email bilan login ishlamayapti

**Sabab:** Eski kod - faqat username qabul qilardi

**Yechim:** Yangi kod email VA username qabul qiladi ✅

### ❌ Deploy qilganda ishlamayapti

**Sabab:** Eski database hali ham serverda

**Yechim:** 
1. Vercel Dashboard → Deployments → Redeploy
2. Yangi deploy yangi database yaratadi
3. Hardcoded admin avtomatik qo'shiladi

---

## 📋 NIMA O'ZGARDI

### ✅ Avvalgi Muammo:
```
❌ Faqat login field'i bilan qidirilardi
❌ Email bilan login ishlamaydi
❌ admin@orbiserp.uz ishlamaydi
```

### ✅ Hozirgi Holat:
```
✅ Email VA login ikkalasi ham ishlaydi
✅ admin@orbiserp.uz ishlaydi  
✅ admin ishlaydi
✅ Hardcoded admin parol: OrbisAdmin2024!
✅ Localhost va Deploy ikkalasida ham ishlaydi
```

---

## 🎯 TEKSHIRISH

### Localhost:
```bash
# 1. Database o'chiring
Remove-Item -Path ".\data\app.db" -Force

# 2. Server ishga tushiring
pnpm dev

# 3. Browser'da oching: http://localhost:8080

# 4. Login qiling:
# Email: admin@orbiserp.uz
# Parol: OrbisAdmin2024!
```

### Deploy (Production):
```
1. Deploy qiling: git push origin main
2. Vercel'da deploy kutamiz (2 daqiqa)
3. URL ochiladi
4. Login:
   - Email: admin@orbiserp.uz
   - Parol: OrbisAdmin2024!
5. ISHLAYDI! ✅
```

---

## 💡 ESLATMA

- ✅ Endi hech qanday environment variable kerak EMAS
- ✅ Hardcoded parol kodda
- ✅ Deploy qilsangiz avtomatik ishlaydi
- ✅ Email yoki username - ikkalasi ham ishlaydi
- ⚠️ Production'da kuchli parol qo'ying (xaridorga sotishdan oldin)

---

**STATUS:** ✅ TAYYOR - DEPLOY QILISH MUMKIN!
