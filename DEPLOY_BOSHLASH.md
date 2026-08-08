# 🚀 HOZIR DEPLOY QILISH - QADAMMA-QADAM

Siz **Vercel'ga ro'yxatdan o'tdingiz** ✅  
Endi deploy qilish **5 daqiqa**! 

---

## 📋 TANLANG:

### **VARIANT A: GitHub orqali** ⭐ TAVSIYA (avtomatik deploy)
### **VARIANT B: GitHub'siz** ⚡ TEZKOR (bir martalik)

---

# VARIANT A: GitHub orqali (5 daqiqa)

## QADAM 1: GitHub repository yaratish

Ochilgan sahifada (`https://github.com/new`):

```
Repository name: fusion-erp
Description: Full-featured ERP system for small business
Visibility: ✅ Private (tavsiya) yoki Public
```

**✅ "Create repository" bosing**

---

## QADAM 2: Git push qilish

Repository yaratilgandan keyin, GitHub sizga URL ko'rsatadi:

```
https://github.com/YOUR_USERNAME/fusion-erp.git
```

**Terminal'ni oching va quyidagi buyruqlarni bajaring:**

### Windows PowerShell:

```powershell
cd C:\Users\user\Desktop\fusion-starter-fab

# PATH'ni yangilash
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# GitHub'ga ulash (URL'ni o'zingizniki bilan almashtiring!)
git remote add origin https://github.com/YOUR_USERNAME/fusion-erp.git

# Push qilish
git push -u origin main
```

**Agar Git credentials so'rasa:**
- Username: GitHub username'ingiz
- Password: GitHub Personal Access Token (parol emas!)
  - Token yaratish: https://github.com/settings/tokens
  - "Generate new token (classic)" → "repo" checkbox → Copy token

---

## QADAM 3: Vercel'ga import qilish

**1. Vercel.com'da:**

```
https://vercel.com
```

**2. "Add New" tugmasini bosing**

**3. "Project" tanlang**

**4. "Import Git Repository" bosing**

**5. GitHub'ni ulang:**
- "Connect GitHub Account" bosing
- GitHub'da ruxsat bering
- Repository'ni tanlang: `fusion-erp`

**6. Project Settings:**

```
Framework Preset: Other
Build Command: npm run build:vercel
Output Directory: dist/spa
Install Command: npm install
Root Directory: ./
Node.js Version: 18.x
```

**7. Environment Variables qo'shing:**

Quyidagi buyruqni terminal'da bajaring (2 marta):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Vercel'da Add qiling:

```
JWT_SECRET = <birinchi_natija>
JWT_REFRESH_SECRET = <ikkinchi_natija>
ADMIN_EMAIL = admin@yourcompany.com
ADMIN_PASSWORD = YourStrongPassword123!
NODE_ENV = production
ALLOWED_ORIGINS = https://your-app.vercel.app
DATABASE_URL = (PostgreSQL - keyinroq qo'shamiz)
```

**8. "Deploy" tugmasini bosing!**

---

# VARIANT B: GitHub'siz deploy (3 daqiqa)

Agar GitHub'ni o'rnatish/sozlash qiyin bo'lsa.

## QADAM 1: Vercel CLI login

Terminal'da:

```bash
# SSL bypass
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

# PATH yangilash
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Login
vercel login
```

Bu sizning brauzeringizni ochadi - Vercel'da login qiling.

---

## QADAM 2: Deploy

```bash
# Deploy qilish
vercel --prod

# Savollar:
# ? Set up and deploy? → Yes
# ? Which scope? → Sizning username
# ? Link to existing project? → No
# ? What's your project's name? → fusion-erp
# ? In which directory is your code located? → ./
```

---

## QADAM 3: Environment Variables

Deploy bo'lgandan keyin:

**Vercel Dashboard'da:**

```
Settings → Environment Variables
```

Qo'shing:

```bash
# Terminal'da 2 marta ishga tushiring:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Vercel'ga kiriting:
JWT_SECRET = <birinchi>
JWT_REFRESH_SECRET = <ikkinchi>
ADMIN_EMAIL = admin@yourcompany.com
ADMIN_PASSWORD = YourStrongPassword123!
NODE_ENV = production
ALLOWED_ORIGINS = https://your-app-name.vercel.app
```

**Redeploy qiling:**

```
Deployments → ... → Redeploy
```

---

# 🗄️ DATABASE QO'SHISH (MUHIM!)

Vercel serverless PostgreSQL kerak!

## Vercel Dashboard'da:

1. **Storage** tab'ga o'ting
2. **"Create Database"** bosing
3. **"Postgres"** tanlang
4. **"Continue"** → Database nomi kiriting
5. **"Create"** bosing
6. **"Connect to Project"** → loyihangizni tanlang
7. `DATABASE_URL` avtomatik qo'shiladi ✅

**Redeploy qiling!**

---

# ✅ TEST QILING

Deploy bo'lgandan keyin:

## 1. URL'ni oching:

```
https://your-app-name.vercel.app
```

## 2. API test:

```
https://your-app-name.vercel.app/api/ping
```

Javob:
```json
{
  "status": "success",
  "message": "pong"
}
```

## 3. Login:

- Email: `.env` dagi ADMIN_EMAIL
- Parol: `.env` dagi ADMIN_PASSWORD

---

# 🔧 MUAMMOLARNI HAL QILISH

## Build failed

**Vercel Dashboard → Deployments → Logs** ga qarang

**Keng tarqalgan:**
- `pnpm not found` → Build Command: `npm install -g pnpm && pnpm build:vercel`
- Environment variables missing → Settings'dan qo'shing

## Database error

PostgreSQL database yaratilganini tekshiring.

## 401 Unauthorized

Environment variables to'g'ri kiritilganini tekshiring.

---

# 🎯 QISQA QILIB:

## GitHub bilan (tavsiya):

```
1. https://github.com/new → repo yaratish
2. Terminal: git push
3. Vercel: Import from GitHub
4. Deploy!
```

## GitHub'siz:

```
1. Terminal: vercel login
2. Terminal: vercel --prod
3. Vercel: Environment variables
4. Redeploy!
```

---

# 🆘 YORDAM KERAKMI?

Men terminal buyruqlarini sizning o'rningizda bajara olmayman (xavfsizlik), lekin:

✅ Ko'rsatmalar to'liq
✅ Har qadam batafsil
✅ Muammolar hal qilish yo'llari bor

**Qayerda tiqilib qoldingiz?**

1. GitHub repository yaratishda?
2. Git push qilishda?
3. Vercel'da import qilishda?
4. Environment variables qo'shishda?
5. Boshqa narsa?

**Xabar bering, yordam beraman!** 🚀

---

**P.S.** Har bir qadam uchun screenshot yoki video kerakmi?
