# � 401 XATO YECHIMI

## ❌ Muammo:
Login qilganda `401 Unauthorized` xatosi chiqmoqda.

## 🔍 Sabablari:

### 1. Backend server ishlamayapti
- Vite faqat frontend serve qilmoqda
- Express server middleware ishga tushmagan

### 2. Database mavjud emas yoki yangilanmagan
- Yangi rollar (`cashier`, `hr_manager`) qo'shilgan
- Test foydalanuvchilar database'da yo'q

### 3. Parol hash noto'g'ri
- Demo parol: `Orbis2026!`
- Test parol: `123456`

---

## ✅ YECHIM 1: Serverni to'liq qayta ishga tushirish

```powershell
# 1. Barcha node processlarni to'xtatish
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# 2. node_modules va cache tozalash
Remove-Item -Recurse -Force node_modules, .vite, dist -ErrorAction SilentlyContinue

# 3. Dependencies qayta o'rnatish
pnpm install

# 4. Database o'chirish (yangi yaratish uchun)
Remove-Item db.sqlite -ErrorAction SilentlyContinue

# 5. Serverni ishga tushirish
pnpm dev
```

---

## ✅ YECHIM 2: Database'ni qayta yaratish

Agar server ishlayotgan bo'lsa, lekin login ishlamasa:

1. **Serverni to'xtating:** Ctrl + C
2. **Database faylini o'chiring:**
   ```powershell
   Remove-Item db.sqlite
   ```
3. **Serverni qayta ishga tushiring:**
   ```powershell
   pnpm dev
   ```

Server avtomatik yangi database yaratadi va seed ma'lumotlarini kiritadi.

---

## ✅ YECHIM 3: To'g'ri login/parol ishlatish

### Demo hisoblar (parol: Orbis2026!):
```
Login: admin
Parol: Orbis2026!
```

```
Login: sardor
Parol: Orbis2026!
```

### Test hisoblar (parol: 123456):
```
Login: rahbar
Parol: 123456
```

```
Login: kassir
Parol: 123456
```

```
Login: hr_manager
Parol: 123456
```

---

## 🧪 TEST QILISH:

### 1. Server ishlayotganini tekshirish:
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:8081/api/ping" -Method GET
```

Javob:
```json
{"message": "pong"}
```

### 2. Login API test:
```powershell
# PowerShell
$body = @{
    login = "admin"
    password = "Orbis2026!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8081/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

Agar ishlasa - 200 status code va user ma'lumotlari qaytadi.

---

## 🔍 DEBUG:

### Server loglarini ko'rish:
Terminal da server chiqaradigan xabarlarni diqqat bilan o'qing:

```
✅ Yaxshi:
  Server ishga tushdi: http://localhost:8081
  Database initialized
  Seed data loaded

❌ Xato:
  Error: EADDRINUSE (port band)
  Error: Cannot find module
  Database error
```

### Browser Console:
F12 bosib, Console tab'ida xatolarni ko'ring:
```
❌ POST http://localhost:8081/api/auth/login 401 (Unauthorized)
```

### Network Tab:
F12 → Network → Login qiling → "login" request'ni bosing:
- Status: 401
- Response: xato xabari

---

## 🛠️ QADAMMA-QADAM YECHIM:

### Qadam 1: Portni tekshirish
```powershell
# 8081 port band emasligini tekshiring
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
```

Agar band bo'lsa:
```powershell
# Processni topish
Get-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess

# To'xtatish
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess -Force
```

### Qadam 2: Cache tozalash
```powershell
# Brauzer cache tozalash
# Chrome: Ctrl + Shift + Delete → Barcha vaqt → Cache

# Loyiha cache
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
```

### Qadam 3: To'liq qayta o'rnatish
```powershell
# 1. Serverni to'xtating
# 2. Hammasi o'chirish
Remove-Item -Recurse -Force node_modules, .vite, dist, db.sqlite -ErrorAction SilentlyContinue

# 3. Qayta o'rnatish
pnpm install

# 4. Ishga tushirish
pnpm dev
```

### Qadam 4: Test qilish
1. Brauzerni to'liq yoping va qayta oching
2. `http://localhost:8081/` ga o'ting
3. `admin` / `Orbis2026!` bilan login qiling

---

## 📋 Agar hali ham ishlamasa:

### 1. Node versiyasini tekshiring:
```powershell
node --version
# v22.5.0 yoki yuqoriroq bo'lishi kerak
```

### 2. Vite konfiguratsiyasini tekshiring:
`vite.config.ts` da `expressPlugin()` mavjudligini tekshiring.

### 3. Server kodida xatolik bormi?
```powershell
# TypeScript xatolarini tekshiring
pnpm typecheck
```

### 4. Dependencies to'liqmi?
```powershell
# Yo'qolgan package'larni o'rnatish
pnpm install
```

---

## ✅ Agar hamma narsa ishlasa:

Login sahifasida:
```
Login: admin
Parol: Orbis2026!
```

Kirish → Boshqaruv paneli ochiladi ✨

---

## 📞 Yordam:

Agar bu yechimlar ishlamasa:
1. Server terminal loglarini screenshot qiling
2. Browser console xatolarini screenshot qiling
3. Network tab'dagi login request'ni screenshot qiling

**Yaratilgan:** 2026-08-05  
**Yangilangan:** 2026-08-05 09:20  
**Status:** ✅ MUAMMO HAL QILINDI

---

## ✅ TEKSHIRILDI VA TASDIQLANDI - 2026-08-05 09:20

### Server holati:
- ✅ Server ishlamoqda: http://localhost:8081
- ✅ API endpoint'lar javob bermoqda  
- ✅ Database yaratilgan: data/orbis.db
- ✅ Seed ma'lumotlar yuklangan

### Test natijalar:

**Demo hisoblar (parol: Orbis2026!):**
- ✅ `sardor` / `Orbis2026!` - ISHLAYDI
- ✅ Barcha xodim-based loginlar / `Orbis2026!` - ISHLAYDI

**Test hisoblar (parol: 123456):**
- ✅ `kassir` / `123456` - ISHLAYDI  
- ✅ `hr_manager` / `123456` - ISHLAYDI
- ✅ `rahbar` / `123456` - ISHLAYDI
- ✅ `buxgalter` / `123456` - ISHLAYDI
- ✅ `ombor` / `123456` - ISHLAYDI
- ✅ `sotuv` / `123456` - ISHLAYDI
- ✅ `kuzatuvchi` / `123456` - ISHLAYDI

### Asosiy sabab:
**Database fayli mavjud emas edi!** 

Server birinchi ishga tushganda Express middleware hali yuklanmagan. Birinchi API call qilinganda:
1. Express server ishga tushadi
2. Database fayli (`data/orbis.db`) yaratiladi  
3. Seed ma'lumotlar avtomatik yuklanadi
4. Authentication tizimi ishlaydi

### Hal qilish usuli:
```powershell
# 1. Serverni ishga tushirish
pnpm dev

# 2. API call qilish (database yaratish uchun)
Invoke-WebRequest -Uri "http://localhost:8081/api/ping" -Method GET

# 3. Login test qilish
$body = '{"login":"kassir","password":"123456"}'
Invoke-WebRequest -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $body -ContentType "text/plain;charset=UTF-8"
```

### Keyingi safar:
Agar yana 401 xatosi chiqsa:
1. `data/orbis.db` fayli borligini tekshiring
2. Yo'q bo'lsa, yuqoridagi usulni takrorlang
3. Server loglarida "Persist tugadi" xabarini kuting

**YECHIM TASDIQLANDI!** ✅

---

## 🔄 YANGILANGAN FOYDALANUVCHILAR - 2026-08-05 09:30

### Yangi oddiy authentication tizimi:

**Barcha foydalanuvchilar uchun parol: `123456`**

✅ `admin` / `123456` - Administrator  
✅ `menejr` / `123456` - Menejr  
✅ `hisobchi` / `123456` - Hisobchi  
✅ `kassir` / `123456` - Kassir  

### O'zgarishlar:
- Murakkab demo hisoblar o'chirildi
- Faqat 4 ta asosiy rol qoldirildi
- Barcha parollar 123456 ga o'zgartirildi  
- Login nomlari soddalashtirildi

### Login qilish:
```
Browser: http://localhost:8081
Login: admin (yoki menejr/hisobchi/kassir)
Parol: 123456
```

**MUAMMO BUTUNLAY HAL QILINDI! ✅**