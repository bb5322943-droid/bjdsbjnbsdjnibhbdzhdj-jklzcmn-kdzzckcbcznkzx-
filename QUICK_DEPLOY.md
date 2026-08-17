# ⚡ TEZKOR DEPLOY (3 daqiqa)

## VARIANT 1: Avtomatik Script (TAVSIYA)

1. **PowerShell'ni Administrator rejimida oching**

2. **Script'ni ishga tushiring:**
```powershell
cd C:\Users\user\Desktop\fusion-starter-fab
powershell -ExecutionPolicy Bypass -File .\SETUP_GITHUB_AND_DEPLOY.ps1
```

3. **Savollarga javob bering:**
   - GitHub username: `sizning_username`
   - Repository name: `fusion-erp` (Enter bosing)
   - GitHub Token: https://github.com/settings/tokens/new dan oling

4. **Brauzerda Vercel ochiladi:**
   - Login qiling
   - `fusion-erp` ni Import qiling
   - Environment Variables qo'shing
   - Deploy qiling!

---

## VARIANT 2: Qo'lda (5 daqiqa)

### 1. GitHub repository yarating
https://github.com/new

### 2. Push qiling
```powershell
cd C:\Users\user\Desktop\fusion-starter-fab
git remote add origin https://github.com/USERNAME/fusion-erp.git
git branch -M main
git push -u origin main
```

### 3. Vercel'ga import qiling
https://vercel.com/new

---

## Environment Variables (Muhim!)

Vercel Dashboard'da qo'shing:

```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
JWT_REFRESH_SECRET=z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=YourStrongPassword123
```

Secret generatsiya:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🎉 TAYYOR!

Deploy muvaffaqiyatli bo'lgandan keyin:
- URL: `https://your-app.vercel.app`
- Login: `ADMIN_EMAIL` / `ADMIN_PASSWORD`

---

## Muammolar?

- Build failed → Vercel Logs'ni tekshiring
- 500 Error → Environment Variables to'g'ri ekanligini tekshiring
- GitHub push xatosi → Personal Access Token to'g'ri ekanligini tekshiring

Batafsil: `DEPLOY_INSTRUCTIONS_FINAL.md`
