# 🚀 Tezkor Boshlash - 5 Daqiqada

## 1️⃣ O'rnatish (2 daqiqa)

```bash
# Repository'ni clone qiling
git clone https://github.com/yourcompany/orbis-erp.git
cd orbis-erp

# Dependencies o'rnating
pnpm install
```

## 2️⃣ Sozlash (1 daqiqa)

```bash
# .env faylini nusxalang
copy .env.example .env

# .env faylini ochib quyidagilarni o'zgartiring:
# - JWT_SECRET (random string, 32+ belgi)
# - JWT_REFRESH_SECRET (boshqa random string)
# - ADMIN_PASSWORD (kuchli parol)
```

**Maslahat:** Random string yaratish uchun:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3️⃣ Ishga Tushirish (1 daqiqa)

```bash
pnpm dev
```

Brauzerda ochiladi: `http://localhost:8080`

## 4️⃣ Kirish (30 soniya)

```
Email: admin@company.uz
Parol: [.env faylidagi ADMIN_PASSWORD]
```

## 5️⃣ Birinchi Ishlar (30 soniya)

1. **Parolni o'zgartiring!** (o'ng yuqori burchak → Profil → Parolni o'zgartirish)
2. Dashboard'ni ko'ring - demo ma'lumotlar allaqachon tayyor
3. Har bir modulni sinab ko'ring

---

## 🎯 Keyingi Qadamlar

### Development Uchun:
- [AGENTS.md](./AGENTS.md) - Texnik hujjat
- [API_DOCS.md](./API_DOCS.md) - API dokumentatsiya

### Foydalanuvchi Uchun:
- [USER_GUIDE.md](./USER_GUIDE.md) - To'liq qo'llanma
- Video darsliklar (YouTube)

### Production'ga Chiqarish:
- [SECURITY.md](./SECURITY.md) - Xavfsizlik checklist
- [DEPLOY.md](./DEPLOY.md) - Deployment qo'llanmasi
- [INSTALLATION.md](./INSTALLATION.md) - Batafsil o'rnatish

---

## ⚡ Tezkor Yo'llanma

### Modullar:
- **Dashboard** - Umumiy statistika va grafiklar
- **Moliya** - Kirim/chiqim, tranzaksiyalar
- **HR** - Xodimlar, davomat, ish haqi
- **Ombor** - Mahsulotlar, qoldiq
- **CRM** - Mijozlar, buyurtmalar, qarzlar
- **Hisobotlar** - Excel eksport

### Tezkor Amallar:
- `Ctrl + K` - Tezkor qidiruv
- `Esc` - Dialog yopish
- Filtrlash - Har bir ro'yxatda mavjud

---

## 🐛 Muammolar?

### Port band:
```bash
# .env faylida PORT o'zgartiring
PORT=3000
```

### Database xatolari:
```bash
# Ma'lumotlar bazasini qayta yaratish
del data\orbis.db
pnpm dev
```

### Dependencies xatolari:
```bash
# node_modules ni tozalash
rmdir /s /q node_modules
del pnpm-lock.yaml
pnpm install
```

---

## 📞 Yordam Kerakmi?

- 📧 support@yourcompany.uz
- 💬 Telegram: @yourcompany_support
- 📚 Batafsil: [INSTALLATION.md](./INSTALLATION.md)

---

**Omad tilaymiz!** 🎉
