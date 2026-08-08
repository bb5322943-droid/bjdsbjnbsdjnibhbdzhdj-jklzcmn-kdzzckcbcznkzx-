# 💾 DATABASE SETUP - Production PostgreSQL

## 📋 Overview

Sizning loyihangiz hozirda **SQLite** ishlatadi (development uchun). Production'da **PostgreSQL** kerak bo'ladi.

---

## 🎯 3 TA VARIANT

| Variant | Narx | Osonlik | Tavsiya |
|---------|------|---------|---------|
| **Vercel Postgres** | $20/oy (yoki free tier) | ⭐⭐⭐⭐⭐ | Vercel bilan best integration |
| **Supabase** | FREE | ⭐⭐⭐⭐ | **Eng yaxshi free variant** ⭐ |
| **Neon** | FREE | ⭐⭐⭐⭐ | Serverless PostgreSQL |

---

## ✅ VARIANT 1: SUPABASE (Tavsiya - FREE!)

### Nima uchun Supabase?
- ✅ 500MB database (FREE)
- ✅ Unlimited API requests
- ✅ Auto backups
- ✅ Row Level Security
- ✅ Real-time subscriptions

### Setup (5 daqiqa):

#### 1. Account yaratish
```
https://supabase.com → Sign Up with GitHub
```

#### 2. Project yaratish
1. Dashboard → "New Project"
2. Project name: `fusion-erp-prod`
3. Database Password: **Kuchli parol yarating va saqlang!**
4. Region: `East US` (yoki yaqin region)
5. "Create new project" bosing (1-2 daqiqa)

#### 3. Connection String olish
1. Project Settings → Database → Connection string
2. **Connection pooling** tab'ini oching
3. "Transaction" mode'ni tanlang
4. Connection string'ni copy qiling:

```
postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

⚠️ `[YOUR-PASSWORD]` ni o'z parolingizga almashtiring!

#### 4. Vercel'ga qo'shish
1. Vercel Dashboard → Project → Settings → Environment Variables
2. "Add" bosing:
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://postgres.xxx...` (yuqoridagi connection string)
   - ✅ Production
   - ✅ Preview
   - ✅ Development
3. "Save" bosing

#### 5. Redeploy
Vercel Dashboard → Deployments → "Redeploy" (environment variable ta'sir qilishi uchun)

---

## 🔧 VARIANT 2: VERCEL POSTGRES

### Narx:
- Hobby: $20/oy (256MB)
- Pro: $36/oy (512MB)

### Setup (2 daqiqa):

#### 1. Database yaratish
```
Vercel Dashboard → Storage → Create Database → Postgres
```

#### 2. Database tanlash
1. "Postgres" ni bosing
2. Database name: `fusion-erp`
3. Region: tanlang (yaqin region)
4. "Create" bosing

#### 3. Project'ga ulash
1. "Connect to Project" ni bosing
2. Loyihangizni tanlang
3. Avtomatik `DATABASE_URL` qo'shiladi

#### 4. Redeploy
Vercel → Deployments → "Redeploy"

---

## ⚡ VARIANT 3: NEON (Serverless PostgreSQL)

### Afzalliklar:
- ✅ FREE tier (3GB storage)
- ✅ Instant branching
- ✅ Auto-scaling
- ✅ Serverless

### Setup (3 daqiqa):

#### 1. Account yaratish
```
https://neon.tech → Sign Up
```

#### 2. Project yaratish
1. "Create a project"
2. Project name: `fusion-erp`
3. Database name: `fusion_db`
4. Region: tanlang
5. "Create project"

#### 3. Connection String
1. Dashboard → Connection Details
2. Copy **Pooled connection**:

```
postgresql://user:pass@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

#### 4. Vercel'ga qo'shish
1. Vercel → Settings → Environment Variables
2. `DATABASE_URL` = connection string
3. Save va Redeploy

---

## 📊 DATABASE MIGRATION

Database yaratgandan keyin, jadvallarni setup qilish kerak.

### Migration Script

`server/data/migrations/init.sql` fayli mavjud bo'lishi kerak. Agar yo'q bo'lsa, yaratamiz.

#### Supabase orqali:

1. Supabase Dashboard → SQL Editor → "New Query"
2. Quyidagi SQL'ni ishga tushiring:

```sql
-- Foydalanuvchilar jadvali
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  branch_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions (JWT)
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(100),
  department VARCHAR(100),
  salary DECIMAL(15,2),
  hire_date DATE,
  branch_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 10,
  unit_price DECIMAL(15,2),
  supplier_id INTEGER,
  branch_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  branch_id INTEGER,
  total_amount DECIMAL(15,2) NOT NULL,
  discount DECIMAL(15,2) DEFAULT 0,
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'completed',
  sold_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  company VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  branch_id INTEGER,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  manager_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- Admin foydalanuvchi yaratish
-- Parol: hash from .env (bcrypt)
-- Bu qator Vercel deploy'dan keyin avtomatik bajariladi
```

3. "Run" bosing

#### Admin User Yaratish

Birinchi admin user avtomatik yaratilishi kerak. Agar yaratilmagan bo'lsa, SQL orqali:

```sql
-- DIQQAT: Bu faqat test uchun!
-- Production'da ilova avtomatik yaratadi
INSERT INTO users (email, password, name, role, is_active)
VALUES (
  'admin@yourcompany.uz',
  '$2b$10$...',  -- bcrypt hash (ilova yaratadi)
  'Super Admin',
  'super_admin',
  true
);
```

---

## 🔄 MIGRATION STRATEGIYASI

### Development'dan Production'ga o'tish:

#### 1. Local SQLite'dan PostgreSQL'ga eksport

```bash
# SQLite'dan dump olish (Windows)
sqlite3 data/app.db .dump > backup.sql

# PostgreSQL'ga import qilish
psql $DATABASE_URL < backup.sql
```

#### 2. Vercel'da Auto-migration

`server/data/db.ts` faylida migration avtomatik ishga tushadi:

```typescript
// Birinchi start'da schema yaratiladi
await db.exec(`CREATE TABLE IF NOT EXISTS ...`);
```

---

## ✅ TEKSHIRISH

Database to'g'ri ulangani:

### 1. Vercel Logs
```
Vercel Dashboard → Deployments → Latest → Logs
```

Qidiruv: "database" yoki "PostgreSQL connected"

### 2. Test API
```bash
# API ping
curl https://your-app.vercel.app/api/ping

# Dashboard stats
curl https://your-app.vercel.app/api/dashboard/stats
```

### 3. Login qiling
Brauzerda oching va admin login qiling.

---

## 🚨 KO'P UCHRAYDIGAN XATOLAR

### Error: "unable to connect to database"
**Yechim:**
- `DATABASE_URL` to'g'ri kiritilganligini tekshiring
- Vercel'da redeploy qiling
- Supabase/Neon'da database ishlab turganini tekshiring

### Error: "SSL certificate verify failed"
**Yechim:**
Connection string'ga `?sslmode=require` qo'shing:
```
postgresql://...?sslmode=require
```

### Error: "relation does not exist"
**Yechim:**
Migration SQL'ni ishga tushiring (yuqoridagi SQL)

### Error: "password authentication failed"
**Yechim:**
- Connection string'dagi parol to'g'riligini tekshiring
- Supabase/Neon'da parolni reset qiling

---

## 📊 PRODUCTION CHECKLIST

- [ ] Database yaratildi (Supabase/Vercel/Neon)
- [ ] `DATABASE_URL` Vercel'ga qo'shildi
- [ ] Migration SQL'ni ishga tushirildi
- [ ] Indexlar yaratildi
- [ ] Admin user yaratildi
- [ ] Vercel redeploy qilindi
- [ ] API test qilindi
- [ ] Login test qilindi
- [ ] Backup strategiyasi o'ylandi

---

## 🔐 XAVFSIZLIK

### Database Parol
- ✅ Kamida 16 belgi
- ✅ Katta/kichik harf, raqam, maxsus belgi
- ✅ Password manager'da saqlang

### Connection String
- ⚠️ HECH QACHON git'ga commit qilmang
- ⚠️ Faqat Vercel environment variables'da
- ✅ SSL/TLS connection ishlatilsin

### Backup
- Supabase: avtomatik daily backup
- Vercel Postgres: avtomatik backup
- Neon: manual backup kerak

---

## 📞 YORDAM

- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs/storage/vercel-postgres
- Neon: https://neon.tech/docs

---

**KEYINGI QADAM:** Database sozlagandan keyin, deploy test qiling! 🚀
