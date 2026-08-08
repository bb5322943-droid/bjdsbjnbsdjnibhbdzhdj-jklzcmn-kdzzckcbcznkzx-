# API Dokumentatsiya

Base URL: `https://your-domain.com/api`

## 🔐 Autentifikatsiya

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@company.uz",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "1",
    "name": "User Name",
    "email": "user@company.uz",
    "role": "admin"
  }
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

### Parolni O'zgartirish

```http
POST /api/auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "oldPassword": "oldpass123",
  "newPassword": "NewPass123!"
}
```

**Parol Talablari:**
- Minimum 8 belgi
- Kamida 1 katta harf
- Kamida 1 kichik harf
- Kamida 1 raqam
- Kamida 1 maxsus belgi

### Joriy Foydalanuvchi

```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

## 📊 Dashboard

### Statistika

```http
GET /api/dashboard/stats
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 150000000,
    "totalExpense": 80000000,
    "netProfit": 70000000,
    "totalOrders": 245,
    "activeEmployees": 28,
    "lowStockProducts": 5
  }
}
```

### Daromad Tendensiyasi

```http
GET /api/dashboard/trend?days=30
Authorization: Bearer {accessToken}
```

### So'nggi Harakatlar

```http
GET /api/dashboard/activities?limit=10
Authorization: Bearer {accessToken}
```

## 💰 Moliya (Finance)

### Tranzaksiyalar Ro'yxati

```http
GET /api/finance/transactions?page=1&limit=20&type=income
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page` (number): Sahifa raqami (default: 1)
- `limit` (number): Har sahifada nechta (max: 100, default: 20)
- `type` (string): income | expense
- `category` (string): Kategoriya
- `startDate` (string): YYYY-MM-DD
- `endDate` (string): YYYY-MM-DD
- `search` (string): Qidiruv

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "Mahsulot sotish",
      "category": "Savdo",
      "account": "Naqd pul",
      "amount": 5000000,
      "type": "income",
      "date": "2026-08-05"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Tranzaksiya Qo'shish

```http
POST /api/finance/transactions
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Mahsulot sotish",
  "category": "Savdo",
  "account": "Naqd pul",
  "amount": 5000000,
  "type": "income",
  "date": "2026-08-05"
}
```

**Validation:**
- `title`: 2-200 belgi
- `amount`: musbat son
- `type`: "income" | "expense"
- `date`: YYYY-MM-DD formatida

### Tranzaksiya Tahrirlash

```http
PUT /api/finance/transactions/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "amount": 5500000
}
```

### Tranzaksiya O'chirish

```http
DELETE /api/finance/transactions/{id}
Authorization: Bearer {accessToken}
```

## 👥 Xodimlar (HR)

### Xodimlar Ro'yxati

```http
GET /api/hr/employees?department=IT&status=active
Authorization: Bearer {accessToken}
```

### Xodim Qo'shish

```http
POST /api/hr/employees
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Sardor Mahmudov",
  "position": "Developer",
  "department": "IT",
  "salary": 8000000,
  "email": "sardor@company.uz",
  "phone": "+998901234567",
  "hireDate": "2026-08-01"
}
```

**Validation:**
- `email`: valid email format
- `phone`: +998XXXXXXXXX format
- `salary`: musbat son
- `hireDate`: YYYY-MM-DD

## 📦 Ombor (Warehouse)

### Mahsulotlar

```http
GET /api/warehouse/products?category=Electronics&lowStock=true
Authorization: Bearer {accessToken}
```

### Mahsulot Qo'shish

```http
POST /api/warehouse/products
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Samsung Galaxy A54",
  "category": "Telefonlar",
  "price": 5000000,
  "quantity": 15,
  "minQuantity": 5,
  "location": "A-1-5",
  "supplier": "Samsung Official"
}
```

### Qoldiqni Sozlash

```http
POST /api/warehouse/products/{id}/adjust
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "type": "in",
  "quantity": 10,
  "reason": "Yangi mahsulot kiritildi",
  "reference": "PURCHASE-001"
}
```

**Types:**
- `in`: Kirim
- `out`: Chiqim
- `adjustment`: Tuzatish

## 🤝 Mijozlar (CRM)

### Mijozlar Ro'yxati

```http
GET /api/customers?type=company&region=Toshkent
Authorization: Bearer {accessToken}
```

### Mijoz Qo'shish

```http
POST /api/customers
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "ABC Kompaniya",
  "type": "company",
  "contactPerson": "Alisher Navoiy",
  "phone": "+998901234567",
  "email": "info@abc.uz",
  "region": "Toshkent",
  "address": "Amir Temur ko'chasi 1",
  "status": "active"
}
```

## 🛒 Buyurtmalar (Orders)

### Buyurtma Qo'shish

```http
POST /api/orders
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "customerId": "123",
  "items": [
    {
      "productId": "1",
      "productName": "Samsung Galaxy A54",
      "quantity": 2,
      "price": 5000000
    }
  ],
  "deliveryDate": "2026-08-10",
  "assignedTo": "emp_123",
  "note": "Tez yetkazish kerak"
}
```

### Buyurtma Holati O'zgartirish

```http
PUT /api/orders/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "shipped",
  "paymentStatus": "paid"
}
```

**Statuses:**
- `pending`: Kutilmoqda
- `processing`: Jarayonda
- `shipped`: Yuborilgan
- `delivered`: Yetkazilgan
- `cancelled`: Bekor qilingan

## 💳 Qarzlar (Debts)

### Mijoz Qarzlari

```http
GET /api/debts/customers
Authorization: Bearer {accessToken}
```

### To'lov Kiritish

```http
POST /api/debts/payments
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "orderId": "order_123",
  "customerId": "cust_123",
  "amount": 5000000,
  "paymentMethod": "cash",
  "note": "Qisman to'lov"
}
```

## 📊 Hisobotlar (Reports)

### Hisobot Umumiy Ma'lumot

```http
GET /api/reports/summary?startDate=2026-08-01&endDate=2026-08-31
Authorization: Bearer {accessToken}
```

### Eksport

```http
GET /api/reports/export?type=finance&format=excel&startDate=2026-08-01
Authorization: Bearer {accessToken}
```

**Types:**
- `finance`: Moliyaviy hisobot
- `sales`: Savdo hisoboti
- `warehouse`: Ombor hisoboti
- `hr`: Xodimlar hisoboti

**Formats:**
- `excel`: Excel file (.xlsx)
- `csv`: CSV file
- `pdf`: PDF file (keyinchalik)

## 🔍 Audit Logs

### Audit Ro'yxati

```http
GET /api/audit-logs?entity=customers&action=create&userId=user_123
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `entity`: transactions | employees | products | customers | orders
- `action`: create | update | delete
- `userId`: Foydalanuvchi ID
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

## ⚠️ Xatolar (Error Handling)

### Xato Formatı

```json
{
  "success": false,
  "message": "Xato tavsifi",
  "errors": [
    {
      "field": "email",
      "message": "Email noto'g'ri formatda"
    }
  ]
}
```

### HTTP Status Kodlar

- `200 OK`: Muvaffaqiyatli
- `201 Created`: Yangi yozuv yaratildi
- `400 Bad Request`: Validatsiya xatosi
- `401 Unauthorized`: Autentifikatsiya talab qilinadi
- `403 Forbidden`: Ruxsat yo'q
- `404 Not Found`: Topilmadi
- `429 Too Many Requests`: Rate limit oshdi
- `500 Internal Server Error`: Server xatosi

## 🔒 Rate Limiting

### Cheklovlar

- **Umumiy API**: 100 so'rov / 15 daqiqa
- **Login**: 5 urinish / 15 daqiqa

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1659705600
```

## 📝 Best Practices

### 1. Har doim HTTPS ishlating

```bash
# ❌ Noto'g'ri
http://api.example.com/api/users

# ✅ To'g'ri
https://api.example.com/api/users
```

### 2. Token'ni xavfsiz saqlang

```javascript
// ❌ LocalStorage (XSS xavfi)
localStorage.setItem('token', token);

// ✅ HttpOnly Cookie yoki secure state management
// React Query, Zustand, yoki boshqa xavfsiz yechim
```

### 3. Refresh Token Ishlatish

```javascript
// Access token muddati tugaganda
if (error.status === 401) {
  const newToken = await refreshAccessToken(refreshToken);
  // So'rovni qayta yuboring
}
```

### 4. Paginatsiya

```javascript
// ❌ Hamma ma'lumotni olish
GET /api/products

// ✅ Pagination ishlatish
GET /api/products?page=1&limit=20
```

### 5. Error Handling

```javascript
try {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  
  const data = await response.json();
  
  if (!data.success) {
    // Xatoni ko'rsatish
    console.error(data.message);
  }
} catch (error) {
  // Network xatosi
  console.error('Connection error:', error);
}
```

## 🧪 Test Qilish

### cURL bilan

```bash
# Login
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.uz","password":"password123"}'

# Token bilan so'rov
curl https://api.example.com/api/dashboard/stats \
  -H "Authorization: Bearer eyJhbGc..."
```

### Postman Collection

Postman collection yuklab olish: [Download](./postman_collection.json)

## 📞 Yordam

API bilan bog'liq savollar:
- 📧 Email: api@yourcompany.uz
- 📚 Documentation: https://docs.yourcompany.uz
- 💬 Telegram: @yourcompany_api

---

**Versiya:** 2.0.0  
**Oxirgi yangilanish:** 2026-08-05
