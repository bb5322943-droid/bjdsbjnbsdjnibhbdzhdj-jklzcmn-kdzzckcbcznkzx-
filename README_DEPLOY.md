# 🚀 FUSION ERP - DEPLOY QILISH

## TEZKOR DEPLOY (3 daqiqa)

### Variant 1: Avtomatik (Eng oson)

1. `DEPLOY_NOW.bat` faylini ikki marta bosing
2. Brauzerda Vercel'ga login qiling
3. Loyiha avtomatik deploy bo'ladi
4. URL ni oling va oching!

### Variant 2: Qo'lda

```powershell
# 1. Vercel'ga login
vercel login

# 2. Deploy qilish
vercel --prod
```

---

## LOGIN MA'LUMOTLARI

Deploy bo'lgandan keyin:

```
URL: https://your-app-name.vercel.app
Email: admin@test.uz
Password: admin123
```

**⚠️ DIQQAT**: Production uchun parolni o'zgartiring!

---

## ENVIRONMENT VARIABLES

Vercel Dashboard'da qo'shish kerak:

```env
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword123
```

Secret generatsiya:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## MUAMMOLAR?

### "vercel: command not found"
```powershell
npm install -g vercel
```

### Build xatolari
Vercel Dashboard → Deployments → Logs'ni tekshiring

### 500 Internal Server Error
Environment Variables to'g'ri o'rnatilganini tekshiring

---

## 🎉 TAYYOR!

Loyiha ishga tushgandan keyin barcha funksiyalar ishlaydi:
- ✅ Ombor boshqaruvi
- ✅ Sotuvlar va buyurtmalar
- ✅ Mijozlar va ta'minotchilar
- ✅ Moliya va hisobotlar
- ✅ Xodimlar va ish haqi
- ✅ Filiallar boshqaruvi

---

**Support**: Agar muammo bo'lsa, VERCEL_DEPLOY_INSTRUCTIONS.md faylini o'qing
