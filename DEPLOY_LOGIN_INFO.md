# 🔐 DEPLOY LOGIN MA'LUMOTLARI

## ✅ AVTOMATIK ISHLAYDI - Environment Variable KERAK EMAS!

Deploy qilgandan keyin **avtomatik** quyidagi login/parol ishlaydi:

---

## 🎯 PRODUCTION LOGIN (Vercel/Deploy)

```
Email:  admin@orbiserp.uz
Parol:  OrbisAdmin2024!
```

**YOKi:**

```
Login:  admin
Parol:  OrbisAdmin2024!
```

---

## 💻 LOCALHOST LOGIN (Local Development)

```
Email:  admin@orbiserp.uz
Parol:  OrbisAdmin2024!
```

**Boshqa foydalanuvchilar (localhost va deploy):**

```
Login: menejr
Parol: 123456

Login: hisobchi
Parol: 123456

Login: kassir
Parol: 123456
```

---

## 🚀 QANDAY ISHLAYDI

1. **Kodda hardcoded** - environment variable kerak emas
2. **Deploy qilsangiz avtomatik ishlaydi** - hech narsa qo'shish shart emas
3. **Xavfsiz emas** - lekin oson va ishonchli
4. **Parolni o'zgartirish mumkin** - Vercel'da `ADMIN_PASSWORD` environment variable qo'shing

---

## ⚙️ PAROLNI O'ZGARTIRISH (Ixtiyoriy)

Agar boshqa parol qo'ymoqchi bo'lsangiz:

1. Vercel Dashboard → Settings → Environment Variables
2. `ADMIN_PASSWORD` qo'shing → o'z parolingiz
3. `ADMIN_EMAIL` qo'shing → o'z emailingiz (ixtiyoriy)
4. Qayta deploy qiling

Environment variable bo'lsa - u ishlaydi
Environment variable yo'q bo'lsa - default hardcoded parol ishlaydi

---

## 📝 DEPLOY KETMA-KETLIGI

```bash
# 1. O'zgarishlarni commit qiling
git add .
git commit -m "feat: hardcoded admin credentials for deployment"
git push origin main

# 2. Deploy avtomatik boshlanadi (Vercel)

# 3. Deploy tugagach kirish:
# Email: admin@orbiserp.uz
# Parol: OrbisAdmin2024!
```

---

## ✅ DEPLOY TEKSHIRISH

1. ✅ Vercel'da deploy tugadi
2. ✅ Saytga kirdim
3. ✅ Login sahifasi ochildi
4. ✅ `admin@orbiserp.uz` / `OrbisAdmin2024!` bilan kirdim
5. ✅ ISHLADI! 🎉

---

## 🔒 XAVFSIZLIK OGOHLANTIRISH

⚠️ **MUHIM:** Bu parol kodda ko'rinadi (GitHub'da ham)

**Xaridorga sotishdan oldin:**
- Bu faylni o'chiring yoki parolni o'zgartiring
- Environment variables ishlatishni tavsiya qiling
- `CLEAN_FOR_SALE.bat` ni ishga tushiring

**Production uchun eng yaxshi amaliyot:**
- Vercel'da `ADMIN_PASSWORD` environment variable o'rnating
- Hardcoded parolni o'zgartiring yoki olib tashlang
- Kuchli parol ishlating (16+ belgi, maxsus belgilar)

---

## 📞 YORDAM

Agar kirish muammolari bo'lsa:

1. Browser cache tozalang (Ctrl+Shift+R)
2. Vercel logs'ni tekshiring: Dashboard → Deployments → Function Logs
3. Admin ma'lumotlari ko'rinishi kerak:
   ```
   ✅ Admin foydalanuvchi yaratildi: admin@orbiserp.uz
   🔑 Admin login ma'lumotlari:
      Email: admin@orbiserp.uz
      Parol: OrbisAdmin2024!
   ```

---

**ESLATMA:** Endi environment variable qo'shish SHART EMAS! Hardcoded parol avtomatik ishlaydi! ✅
