# ✅ Verification Tests - Tizimni Tekshirish

Mijozga topshirishdan oldin quyidagi barcha testlarni o'tkazing.

## 1. 🔧 O'rnatish Testi

```bash
# Dependencies o'rnatish
pnpm install

# ✅ Kutilayotgan natija:
# - Barcha paketlar muvaffaqiyatli o'rnatildi
# - Xatolik yo'q
```

## 2. 🏗️ Build Testi

```bash
# Production build
pnpm build

# ✅ Kutilayotgan natija:
# - dist/ papka yaratildi
# - Build xatoliksiz tugadi
# - Warning'lar minimal
```

## 3. 🚀 Development Server Testi

```bash
# Development mode
pnpm dev

# ✅ Kutilayotgan natija:
# - Server ishga tushdi (port 8080)
# - Xatolik yo'q
# - Hot reload ishlaydi
```

Brauzerda `http://localhost:8080` ni oching:

- [ ] Login sahifasi ochildi
- [ ] UI to'g'ri ko'rinadi
- [ ] Console'da xatolik yo'q

## 4. 🔐 Authentication Testi

### Login
1. Email: `.env` dagi `ADMIN_EMAIL`
2. Parol: `.env` dagi `ADMIN_PASSWORD`

- [ ] Login muvaffaqiyatli
- [ ] Dashboard sahifasi ochildi
- [ ] Foydalanuvchi nomi ko'rinadi

### Noto'g'ri login
1. Noto'g'ri parol bilan urinish

- [ ] Xato xabari ko'rinadi
- [ ] Tizimga kirmadi

### Logout
1. Profil → Logout

- [ ] Logout muvaffaqiyatli
- [ ] Login sahifasiga qaytdi

## 5. 📊 Dashboard Testi

Login qilib dashboard'ni oching:

- [ ] Statistika ko'rinadi
- [ ] Grafik chizildi
- [ ] Faollik jurnali ko'rinadi
- [ ] Ogohlantirishlar ishlaydi
- [ ] Loading states ishlaydi

## 6. 💰 Moliya Moduli Testi

### Tranzaksiya yaratish
1. Moliya → Yangi tranzaksiya
2. Ma'lumotlarni to'ldiring
3. Saqlang

- [ ] Tranzaksiya yaratildi
- [ ] Ro'yxatda ko'rinadi
- [ ] Statistika yangilandi

### Tranzaksiyani tahrirlash
1. Tranzaksiyani oching
2. O'zgartirish kiriting
3. Saqlang

- [ ] O'zgarishlar saqlandi
- [ ] Ro'yxat yangilandi

### Tranzaksiyani o'chirish
1. O'chirish tugmasini bosing
2. Tasdiqlang

- [ ] Tranzaksiya o'chirildi
- [ ] Ro'yxatdan yo'qoldi

## 7. 👥 Kadrlar Moduli Testi

### Xodim qo'shish
1. Kadrlar → Yangi xodim
2. Barcha maydonlarni to'ldiring
3. Saqlang

- [ ] Xodim yaratildi
- [ ] Ro'yxatda ko'rinadi

### Davomat belgilash
1. Davomat → Belgila
2. Xodimni tanlang
3. Saqlang

- [ ] Davomat belgilandi
- [ ] Statistika yangilandi

## 8. 📦 Ombor Moduli Testi

### Mahsulot qo'shish
1. Ombor → Yangi mahsulot
2. Ma'lumotlarni kiriting
3. Saqlang

- [ ] Mahsulot yaratildi
- [ ] Ombor statistikasi yangilandi

### Qoldiq tuzatish
1. Mahsulotni oching
2. Qoldiqni tuzating
3. Saqlang

- [ ] Qoldiq o'zgartirildi
- [ ] Harakat jurnalida ko'rinadi

## 9. 🛒 Sotuvlar Moduli Testi

### Yangi sotuv
1. Sotuvlar → POS
2. Mahsulot qo'shing
3. To'lovni amalga oshiring

- [ ] Sotuv yaratildi
- [ ] Chek chiqdi
- [ ] Qoldiq kamayd
i

### Sotuv qaytarish
1. Sotuvlar → Ro'yxat
2. Sotuvni oching
3. Qaytarish

- [ ] Qaytarish amalga oshdi
- [ ] Qoldiq qaytdi
- [ ] Statistika yangilandi

## 10. 🤝 CRM Moduli Testi

### Mijoz qo'shish
1. Mijozlar → Yangi mijoz
2. Ma'lumotlarni kiriting
3. Saqlang

- [ ] Mijoz yaratildi
- [ ] Ro'yxatda ko'rinadi

### Bitim yaratish
1. CRM → Yangi bitim
2. Ma'lumotlarni to'ldiring
3. Saqlang

- [ ] Bitim yaratildi
- [ ] Voronkada ko'rinadi

## 11. 📝 Buyurtmalar Moduli Testi

### Buyurtma yaratish
1. Buyurtmalar → Yangi
2. Mijoz va mahsulotlarni tanlang
3. Saqlang

- [ ] Buyurtma yaratildi
- [ ] Qoldiq band qilindi
- [ ] Statistika yangilandi

### Buyurtmani yetkazish
1. Buyurtmani oching
2. Holatni "Yetkazildi" ga o'zgartiring

- [ ] Holat o'zgartirildi
- [ ] Qoldiq kamaydi

## 12. 👤 Foydalanuvchilar Moduli Testi

### Yangi foydalanuvchi
1. Foydalanuvchilar → Yangi
2. Rol tanlang
3. Saqlang

- [ ] Foydalanuvchi yaratildi
- [ ] Login ishlaydi

### Ruxsatlar
1. Turli rollar bilan login qiling
2. Modullarni tekshiring

- [ ] Admin - barcha modullarga kiradi
- [ ] Manager - ruxsat etilgan modullarga kiradi
- [ ] Accountant - faqat moliyaga kiradi
- [ ] Cashier - faqat sotuvlarga kiradi

## 13. 📜 Audit Log Testi

1. Har xil amallarni bajaring
2. Audit Log sahifasiga o'ting

- [ ] Barcha amallar yozilgan
- [ ] Kim, qachon, nima ko'rinadi
- [ ] Filter ishlaydi

## 14. 📈 Hisobotlar Testi

1. Hisobotlar → Yaratish
2. Davr tanlang
3. Eksport qiling

- [ ] Hisobot yaratildi
- [ ] CSV yuklab olindi
- [ ] Ma'lumotlar to'g'ri

## 15. 🔍 Qidiruv Testi

Har bir modulda:

- [ ] Qidiruv ishlaydi
- [ ] Filter ishlaydi
- [ ] Pagination ishlaydi
- [ ] Sorting ishlaydi

## 16. 📱 Responsive Testi

Brauzer hajmini o'zgartiring:

- [ ] Desktop (1920x1080) - ✅
- [ ] Laptop (1366x768) - ✅
- [ ] Tablet (768x1024) - ✅
- [ ] Mobile (375x667) - ✅

## 17. 🌐 Browser Testi

Turli brauzerlarda tekshiring:

- [ ] Chrome - ✅
- [ ] Firefox - ✅
- [ ] Safari - ✅
- [ ] Edge - ✅

## 18. ⚡ Performance Testi

- [ ] Sahifa yuklanish tezi < 2s
- [ ] API response < 500ms
- [ ] Smooth scrolling
- [ ] No memory leaks

## 19. 🔒 Security Testi

- [ ] Login without token - blocked
- [ ] Wrong permissions - blocked
- [ ] SQL injection - protected
- [ ] XSS - protected
- [ ] CSRF - protected

## 20. 💾 Data Persistence Testi

1. Ma'lumot kiriting
2. Server'ni to'xtating
3. Qayta ishga tushiring
4. Tekshiring

- [ ] Barcha ma'lumotlar saqlanib qoldi
- [ ] Database intact

---

## ✅ Yakuniy Tekshiruv

Barcha testlar o'tgach:

```bash
# Final build
pnpm build

# Production test
pnpm start
```

- [ ] Production server ishlaydi
- [ ] Barcha funksiyalar ishlaydi
- [ ] No console errors
- [ ] No warnings

---

## 🎉 Tayyor!

Agar barcha testlar ✅ bo'lsa, tizim sotuvga **100% tayyor**!

Keyingi qadam: [SALE_CHECKLIST.md](./SALE_CHECKLIST.md)
