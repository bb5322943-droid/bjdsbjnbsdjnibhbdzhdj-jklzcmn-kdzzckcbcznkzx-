# 📦 VERCEL ZIP UPLOAD DEPLOY (GitHub'siz)

## ⚠️ MUHIM: Bu usul tavsiya etilmaydi!

**Nega?**
- ❌ Har safar qo'lda upload qilish kerak
- ❌ Avtomatik deploy yo'q
- ❌ Version control yo'q
- ❌ Team collaboration qiyin

**Lekin:** Agar GitHub ishlatishni xohlamasangiz, ishlaydi.

---

## 🎯 ZIP ORQALI DEPLOY (3 daqiqa)

### QADAM 1: Loyihani ZIP qiling

**PowerShell'da:**
```powershell
# node_modules, dist, .git va boshqalarni o'chirish
$exclude = @('node_modules', 'dist', '.git', 'data', 'logs', 'backups')
Get-ChildItem -Recurse -File | 
  Where-Object { $path = $_.FullName; -not ($exclude | Where-Object { $path -like "*$_*" }) } |
  Compress-Archive -DestinationPath "vercel-deploy.zip" -Force
```

**Yoki qo'lda:**
1. Loyiha papkasini oching
2. Quyidagi papkalarni **O'CHIRMANG** (ZIP'ga kiritish kerak):
   - ✅ client/
   - ✅ server/
   - ✅ shared/
   - ✅ api/
   - ✅ package.json
   - ✅ pnpm-lock.yaml
   - ✅ tsconfig.json
   - ✅ vite.config.ts
   - ✅ Barcha config fayllar

3. Quyidagi papkalarni **O'CHIRING** (ZIP'ga kiritmaslik):
   - ❌ node_modules/
   - ❌ dist/
   - ❌ .git/
   - ❌ data/
   - ❌ logs/
   - ❌ backups/
   - ❌ .env (maxfiy!)

4. Barcha qolgan fayllarni tanlang va **ZIP qiling**

---

### QADAM 2: Vercel'ga Upload qiling

**Web UI orqali:**

1. **Vercel Dashboard'ga o'ting:**
   ```
   https://vercel.com/dashboard
   ```

2. **"Add New..." → "Project"** bosing

3. **"Deploy from local files" yoki "Upload"** tugmasini bosing
   (Ba'zan "Skip" GitHub step)

4. **ZIP faylni drag & drop qiling** yoki **"Browse"** orqali tanlang

---

### QADAM 3: Configure Project

**Project Settings:**
```
Project Name: fusion-erp
Framework Preset: Other
Root Directory: ./
```

**Build Settings:**
```
Build Command: pnpm run build:vercel
Output Directory: dist/spa
Install Command: pnpm install
Node.js Version: 18.x
```

---

### QADAM 4: Environment Variables

**11 ta variable qo'shing** (VERCEL_ENV_VARS.txt dan):

```
NODE_ENV=production
JWT_SECRET=8065f7e15a2c3f45066dfa6fd74dde6e3586c94996d078509d4bca75a13849e2
JWT_REFRESH_SECRET=07cf1169d3b0f8a4c87a2295c8e7c2c589d24f03b2c75011522c662de6f6b09f
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_EMAIL=admin@yourcompany.uz
ADMIN_PASSWORD=YourStrongPassword123!
ALLOWED_ORIGINS=https://your-app.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

Har biri uchun: ✅ Production ✅ Preview ✅ Development

---

### QADAM 5: Deploy!

"Deploy" tugmasini bosing → 2-3 daqiqa

---

## 🔄 KEYINGI DEPLOY'LAR

**Har safar o'zgartirish qilsangiz:**

1. Yangi ZIP yarating
2. Vercel Dashboard → Project → Settings → General → "Deploy"
3. Yangi ZIP'ni upload qiling
4. Redeploy

**Bu juda noqulay!** Shuning uchun GitHub tavsiya etiladi.

---

## ⚠️ MUAMMOLAR

### ZIP juda katta
**Yechim:** 
- node_modules/ ni o'chiring
- dist/ ni o'chiring
- Faqat source code'ni ZIP qiling

### Upload failed
**Yechim:**
- ZIP hajmini kamaytiring (< 50MB)
- Internet tezligini tekshiring

### Build failed
**Yechim:**
- package.json va pnpm-lock.yaml bor ekanligini tekshiring
- Build command to'g'riligini tekshiring

---

## 💡 YAXSHIROQ ALTERNATIV: GITHUB

**Agar GitHub ishlatish mumkin bo'lsa:**
- ✅ Avtomatik deploy (git push)
- ✅ Version history
- ✅ Rollback oson
- ✅ Team collaboration
- ✅ Preview deployments

**5 daqiqa vaqt:**
1. GitHub account yarating (free)
2. Repository yarating
3. Kodni push qiling
4. Vercel'da GitHub'dan import qiling

---

## 🎯 XULOSA

**ZIP upload:**
- ✅ GitHub'siz ishlaydi
- ❌ Qo'lda deploy
- ❌ Noqulay
- ⚠️ Faqat test uchun

**GitHub + Vercel:**
- ✅ Avtomatik
- ✅ Qulay
- ✅ Professional
- ⭐ **Tavsiya etiladi**

---

**Agar GitHub muammosi bo'lsa, ayting - hal qilamiz!** 🤝
