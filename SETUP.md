# O'rnatish Ko'rsatmasi

Bu ko'rsatma mijoz uchun tizimni noldan sozlash jarayonini tushuntiradi.

## Tizim Talablari

- **Node.js**: 18.0.0 yoki yuqori
- **PNPM**: Package manager (tavsiya etiladi)
- **Database**: SQLite (default) yoki PostgreSQL (production)

## 1. Dastlabki O'rnatish

### Node.js va PNPM O'rnatish

```bash
# Node.js yuklab olish: https://nodejs.org/

# PNPM o'rnatish
npm install -g pnpm
```

### Loyihani Yuklab Olish

```bash
# GitHub'dan clone qiling (yoki ZIP yuklab oling)
git clone <repository-url>
cd fusion-starter-fab

# Dependencies o'rnatish
pnpm install
```

## 2. Environment Sozlamalari

### .env Faylini Yaratish

```bash
# .env.example dan nusxa oling
copy .env.example .env    # Windows
cp .env.example .env      # Linux/Mac
```

### .env Faylini To'ldirish

`.env` faylini matn muharrirda oching va quyidagilarni to'ldiring:

#### JWT Secret Kalitlar Yaratish

Terminal'da ishga tushiring:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Bu buyruqni **2 marta** ishga tushiring va natijalarni quyidagi joylarga qo'ying:

```env
JWT_SECRET=bu_yerga_birinchi_natija
JWT_REFRESH_SECRET=bu_yerga_ikkinchi_natija
```

#### Admin Parolini O'rnatish

```env
ADMIN_EMAIL=admin@yourcompany.uz
ADMIN_PASSWORD=Kuchli_Parol_2024!
```

**Parol talablari:**
- Kamida 8 ta belgi
- Katta va kichik harflar
- Kamida 1 ta raqam
- Kamida 1 ta maxsus belgi

#### Database Tanlash

**SQLite (Default - Kichik bizneslar uchun):**
```env
DATABASE_PATH=./data/app.db
DATABASE_URL=
```

**PostgreSQL (Production - Katta bizneslar uchun):**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DATABASE_PATH=
```

#### CORS Sozlamalari

Production domenlaringizni kiriting:

```env
ALLOWED_ORIGINS=https://yourcompany.uz,https://www.yourcompany.uz
```

Development uchun:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
```

## 3. Ishga Tushirish

### Development Mode (Test uchun)

```bash
pnpm dev
```

Brauzerda oching: `http://localhost:8080`

**Default login:**
- Email: `.env` faylidagi `ADMIN_EMAIL`
- Parol: `.env` faylidagi `ADMIN_PASSWORD`

### Production Build

```bash
# Build qilish
pnpm build

# Ishga tushirish
pnpm start
```

## 4. Birinchi Kirish

1. Brauzerda `http://localhost:8080` ni oching
2. Admin login va parol bilan kiring
3. **DARHOL parolni o'zgartiring:**
   - Yuqori o'ng burchakdagi profil → "Parolni o'zgartirish"

## 5. Tizimni Sozlash

### Foydalanuvchilar Yaratish

1. "Foydalanuvchilar" bo'limiga o'ting
2. "Yangi foydalanuvchi" tugmasini bosing
3. Ma'lumotlarni to'ldiring:
   - Ism
   - Email
   - Login
   - Rol (Admin, Manager, Accountant, Cashier)
   - Parol

### Filiallar Qo'shish

1. "Filiallar" sahifasiga o'ting
2. Har bir filial uchun ma'lumot kiriting

### Mahsulotlarni Kiritish

1. "Ombor" → "Mahsulotlar"
2. Excel import yoki qo'lda kiritish

### Xodimlarni Qo'shish

1. "Kadrlar" → "Xodimlar"
2. Har bir xodim uchun:
   - Shaxsiy ma'lumotlar
   - Bo'lim
   - Lavozim
   - Oylik maosh

## 6. Production Deploy

### Server'ga Deploy Qilish

```bash
# Build qilish
pnpm build

# dist papkasini server'ga ko'chirish
# Server'da:
cd /path/to/app
pnpm start
```

### PM2 bilan Ishga Tushirish (tavsiya etiladi)

```bash
# PM2 o'rnatish
npm install -g pm2

# Ishga tushirish
pm2 start dist/server/node-build.mjs --name "fusion-erp"

# Auto-restart sozlash
pm2 startup
pm2 save
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourcompany.uz;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 7. Backup Sozlash

Avtomatik backup yoqilgan (har kecha soat 2 da):

```env
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

Qo'lda backup yaratish:

```bash
pnpm backup
```

## 8. Muammolarni Hal Qilish

### Port band bo'lsa

`.env` fayliga qo'shing:
```env
PORT=3000  # yoki boshqa port
```

### Database xatosi

```bash
# Data papkasini o'chiring va qayta boshlang
rmdir /s /q data     # Windows
rm -rf data/         # Linux/Mac
```

### Dependencies o'rnatilmasa

```bash
# Cache'ni tozalang va qayta urinib ko'ring
pnpm store prune
pnpm install --force
```

## 9. Texnik Yordam

### Log Fayllar

Barcha log'lar `./logs/` papkasida:
- `app.log` - Umumiy log
- `error.log` - Xatoliklar

### Audit Log

Barcha foydalanuvchi amallarini ko'rish:
- Tizimga kiring
- "Audit Log" sahifasiga o'ting
- Kim, qachon, nima qilganini ko'ring

### Performance Monitoring

```bash
# Server holatini ko'rish
pm2 monit

# Log'larni ko'rish
pm2 logs fusion-erp
```

## 10. Xavfsizlik Eslatmalari

- ⚠️ `.env` faylini **HECH QACHON** boshqalarga bermang
- ⚠️ Database fayllarini **muntazam backup qiling**
- ⚠️ **Kuchli parollar** ishlating
- ⚠️ **HTTPS** ishlating (production uchun majburiy)
- ⚠️ Firewall sozlang (faqat kerakli portlar ochiq bo'lsin)

## Qo'shimcha Resurslar

- [SECURITY.md](./SECURITY.md) - Xavfsizlik ko'rsatmalari
- [DEPLOY.md](./DEPLOY.md) - Deploy ko'rsatmalari
- [API_DOCS.md](./API_DOCS.md) - API dokumentatsiya

---

**Savollar bormi?** [support@yourcompany.uz](mailto:support@yourcompany.uz) ga yozing
