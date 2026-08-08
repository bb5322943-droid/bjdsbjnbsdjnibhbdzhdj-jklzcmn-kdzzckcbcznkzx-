# Xavfsizlik Ko'rsatmalari

## ⚠️ MUHIM: Sotuvdan oldin

Ushbu tizimni mijozga topshirishdan oldin quyidagi xavfsizlik choralarini ko'ring:

### 1. Environment Fayllarini Tozalash

```bash
# .env faylini hech qachon git'ga push qilmang!
# Faqat .env.example ishlatiladi
```

**Tekshirish:**
```bash
git status
# .env fayli ko'rinmasligi kerak
```

### 2. Secret Kalitlarni Yaratish

Mijoz uchun yangi JWT secret kalitlar yarating:

```bash
# Terminal'da ishga tushiring:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Bu buyruqni 2 marta ishga tushiring va natijalarni `.env` faylidagi `JWT_SECRET` va `JWT_REFRESH_SECRET` ga qo'ying.

### 3. Admin Parolini O'zgartirish

`.env` faylidagi `ADMIN_PASSWORD` ni kuchli parolga o'zgartiring:
- Kamida 12 ta belgi
- Katta va kichik harflar
- Raqamlar va maxsus belgilar

### 4. Database Fayllarini O'chirish

Demo ma'lumotlar bilan database fayllarini o'chiring:

```bash
# Windows
rmdir /s /q data

# Linux/Mac
rm -rf data/
```

Tizim birinchi ishga tushganda yangi, bo'sh database yaratadi.

### 5. CORS Sozlamalarini Tekshirish

`.env` faylidagi `ALLOWED_ORIGINS` ni mijozning domeniga o'zgartiring:

```
ALLOWED_ORIGINS=https://example.com,https://www.example.com
```

### 6. Production Build

```bash
pnpm build
```

## 🔒 Ishlatilgan Xavfsizlik Choralari

- ✅ JWT autentifikatsiya (access va refresh tokenlar)
- ✅ Bcrypt parol hashing (10 rounds)
- ✅ Helmet.js (HTTP header himoyasi)
- ✅ CORS (Cross-Origin qo'llab-quvvatlash)
- ✅ Rate limiting (brute force himoyasi)
- ✅ Role-based access control (RBAC)
- ✅ Audit logging (barcha amallar yoziladi)
- ✅ Input validation (Zod)
- ✅ SQL injection himoyasi (parametrlangan querylar)
- ✅ Soft delete (ma'lumotlar arxivda saqlanadi)

## 📋 Deploy Qilishdan Oldin Checklist

- [ ] `.env` faylini git'dan o'chirilganini tekshiring
- [ ] Yangi JWT secret kalitlar yaratildi
- [ ] Admin paroli o'zgartirildi
- [ ] Demo database o'chirildi
- [ ] CORS sozlamalari to'g'ri
- [ ] Production build muvaffaqiyatli
- [ ] All dependencies o'rnatildi
- [ ] Tests ishga tushirildi (agar mavjud bo'lsa)

## 🚨 Xavfsizlik Zaifliklari

Quyidagi zaifliklarga e'tibor bering:

1. **Environment Variables Exposure**
   - Hech qachon `.env` faylini git'ga yuklmang
   - Hech qachon secret kalitlarni kodda hardcode qilmang

2. **Default Parollar**
   - Barcha default parollarni o'zgartiring
   - Kuchli parol siyosatini amalga oshiring

3. **Database Backups**
   - Backuplarni xavfsiz joyda saqlang
   - Backuplarga kirish huquqini cheklang

## 📞 Qo'llab-quvvatlash

Xavfsizlik muammolarini topsangiz:
1. Darhol tizimni to'xtating
2. Muammoni bartaraf eting
3. Audit log'larni tekshiring
4. Zarur bo'lsa parollarni yangilang

---

**Eslatma:** Bu tizim kichik va o'rta bizneslar uchun mo'ljallangan. Katta korxonalar uchun qo'shimcha xavfsizlik choralari kerak bo'lishi mumkin.
