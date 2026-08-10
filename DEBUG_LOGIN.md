# 🔍 LOGIN DEBUGGING QOLLANNMASI

## ❌ Login Xatoligi: "Kirishda xatolik yuz berdi"

Bu qo'llanmada login muammosini tuzatish uchun qadamlar berilgan.

---

## 🎯 ASOSIY SABABLAR:

1. **Password mismatch** - Saqlangan parol bilan kiritilgan parol mos kelmaydi
2. **User not found** - `admin` yoki `admin@orbiserp.uz` bazada yo'q
3. **Database stale** - Eski database file saqlanib qolgan
4. **Environment variable issues** - `ADMIN_PASSWORD` to'g'ri o'rnatilmagan

---

## 🛠️ DEBUGGING QADAM-QADAM

### 1️⃣ Browser Console'da Login Qilish

1. Browser'ni oching (F12 → Console tab)
2. Login forma'ni to'ldiring
3. "Kirish" tugmasini bosing
4. **Console'da** quyidagi log'larni ko'ring:

```
📝 Login attempt: { login: "admin" }
📡 Response status: 200 yoki 401
📦 Response body: { success: false/true, message: "..." }
```

### 2️⃣ Vercel Function Logs'da Tekshiring

Agar deploy'da ishlamasa:

1. **Vercel Dashboard** → Deployments → Latest
2. **Function Logs** tab'ni oching
3. **Quyidagini ko'rishni kutamiz:**

```
🔍 Login attempt: { login: "admin" }
✅ Login successful: { user: "admin@orbiserp.uz", token: "..." }
```

**YOKI xatolik:**

```
❌ User not found: "admin"
📋 Available users: [
  { login: "admin", email: "admin@orbiserp.uz", hasPassword: true },
  { login: "menejr", email: "menejr@test.uz", hasPassword: true },
  ...
]
```

```
❌ Auth failed: { 
  userFound: true, 
  passwordValid: false,
  userEmail: "admin@orbiserp.uz",
  hasPasswordHash: true
}
```

---

## 🔐 XATO TURLARINI HAL QILISH

### ❌ "User not found: admin"

**Sababi:** Bazada admin foydalanuvchi yo'q

**Yechim:**
```bash
# 1. Database o'chiring (yangi baza yaratiladi)
Remove-Item ./data/app.db -Force

# 2. Server qayta ishga tushiring
pnpm dev

# 3. Console'da quyidagi xabar ko'ring:
✅ Admin foydalanuvchi yaratildi: admin@orbiserp.uz
🔑 Admin login ma'lumotlari:
   Email: admin@orbiserp.uz
   Parol: OrbisAdmin2024!
```

---

### ❌ "Auth failed: { userFound: true, passwordValid: false }"

**Sababi:** Parol noto'g'ri (mismatch)

**Sabablar:**
- Parol sifatida `OrbisAdmin2024!` kiritish kerak
- Yoki `/api/auth/me` endpoint'da logged user's password noto'g'ri

**Yechim:**
```
1. Console log'da available users'ni o'qing
2. To'g'ri parolni oling (server logs'dan)
3. Login qiling
```

---

### ❌ "Response status: 401"

**Sababi:** Backend 401 xatosi qaytardi

**Meaning:** 
- User not found YOKI
- Password wrong YOKI
- User suspended

**Yechim:**
```
1. Function Logs'ni tekshiring (server debug logs'ni ko'ring)
2. Backend logs quyidagilardan birini ko'rsatadi:
   - ❌ User not found: "admin"
   - ❌ Auth failed: { userFound: true, passwordValid: false }
   - ⚠️ User suspended: admin@orbiserp.uz
3. Shunga qarab tuzatish qiling
```

---

### ❌ "Response status: 500"

**Sababi:** Server error (exception thrown)

**Yechim:**
```
1. Function Logs'ni ko'ring
2. Xato stack trace'i ko'ring
3. Vercel support yoki local'da reproduce qiling
```

---

## 📋 DEFAULT CREDENTIALS

### Deploy (Hardcoded):
```
Login:  admin
Email:  admin@orbiserp.uz
Parol:  OrbisAdmin2024!
```

### Test (Seeddan):
```
Login: menejr
Parol: 123456

Login: hisobchi
Parol: 123456

Login: kassir
Parol: 123456
```

---

## 🔧 ENVIRONMENT VARIABLES (Optional)

Agar boshqa parol qo'ymoqchi bo'lsangiz:

**Local (.env):**
```
ADMIN_EMAIL=admin@mycompany.com
ADMIN_PASSWORD=MyCustomPassword123!
```

**Vercel:**
```
Settings → Environment Variables → Add:
- ADMIN_EMAIL: admin@mycompany.com
- ADMIN_PASSWORD: MyCustomPassword123!

Keyin: Redeploy
```

---

## 🐛 CONSOLE LOG'NI O'QISH

### Frontend Logs (Browser DevTools):

```
// Form submit
📝 Login attempt: { login: "admin" }

// API call
📡 Response status: 200

// Success
📦 Response body: { success: true, data: { token: "...", user: {...} } }
✅ Login successful: { user: "admin@orbiserp.uz" }

// OR Error
📦 Response body: { success: false, message: "Login yoki parol noto'g'ri" }
❌ Login error: { message: "Login yoki parol noto'g'ri" }
```

### Backend Logs (Vercel Function Logs):

```
// Login attempt
🔍 Login attempt: { login: "admin" }

// User found & password verified
✅ Login successful: { user: "admin@orbiserp.uz", token: "8f9c2a..." }

// OR User not found
❌ User not found: "admin"
📋 Available users: [ { login: "admin", email: "admin@orbiserp.uz", hasPassword: true }, ... ]

// OR Password wrong
❌ Auth failed: { userFound: true, passwordValid: false, userEmail: "admin@orbiserp.uz", hasPasswordHash: true }

// OR User suspended
⚠️ User suspended: admin@orbiserp.uz
```

---

## ✅ COMPLETE DEBUGGING CHECKLIST

- [ ] **Console'da Frontend logs ko'ring**
- [ ] **"📝 Login attempt" log ko'rinyaptimi?**
- [ ] **"📡 Response status" log ko'rinyaptimi?**
- [ ] **Status 200 yoki 401?**
- [ ] **Vercel Function Logs'ni tekshirdingmi?**
- [ ] **Backend logs "User not found" deya ko'rsatadimi?**
- [ ] **Yoki "Auth failed"?**
- [ ] **Database faylini o'chirip qayta test qildingmi?**
- [ ] **Correct password bilan login qildingmi?**

---

## 💡 QISQA TAVSIYA

1. **Birinchi** - Browser console'da log ko'ring
2. **Ikkinchi** - Vercel Function Logs'ni ko'ring
3. **Uchinchi** - Database'ni o'chiring va qayta test qiling
4. **To'rtinchi** - Correct password bilan urinib ko'ring: `OrbisAdmin2024!`

---

## 📞 MUAMMO BO'LMASA

Agar shu qadam'lardan keyin ham ishlamasa:

1. **Database completely reset:**
   ```bash
   Remove-Item ./data/app.db -Force
   pnpm dev
   ```

2. **Use seed credentials:**
   - Login: `menejr`
   - Parol: `123456`

3. **Vercel'da Redeploy:**
   - Dashboard → Deployments → Latest → Redeploy

---

**Debug logs'lar kiritildi!** ✅

Hozir login qilganida, browser console va Vercel logs'da batafsil xato ko'rinadi!
