# 📍 Yangi Ombor/Filial Qo'shish va Ko'rish

## Qo'shilgan Ombor Qayerda? 🔍

Siz **"Ombor qo'shish"** tugmasini bosganda, yangi ombor ma'lumoti **Filiallar** sahifasiga qo'shiladi.

---

## Filiallar Sahifasiga Qanday O'tish Mumkin? 🚀

### Variant 1: Chap Menyu Orqali
1. **Chap sidebar**da pastga aylantiring
2. **"Tashkilot"** bo'limini toping
3. **"Filiallar"** tugmasini bosing

```
Tashkilot
├── Xodimlar
├── Davomat va ta'til
├── Ish haqi
└── Filiallar  ← Bu yerda!
```

### Variant 2: URL Orqali
Brauzer manzil qatoriga quyidagini kiriting:
```
http://localhost:8082/branches
```

### Variant 3: Qidiruv Orqali (⌘K yoki Ctrl+K)
1. Klaviaturada **Ctrl + K** bosing (Mac'da **⌘ + K**)
2. **"Filiallar"** deb yozing
3. Enter bosing

---

## Filiallar Sahifasida Nima Ko'rinadi? 👀

Sahifada quyidagilar mavjud:

### 📊 Statistika Kartochkalari (yuqorida)
- **Jami filiallar**: Hammasi (bosh ofis + filiallar)
- **Faol filiallar**: Hozir ishlayotganlar
- **Nofarol filiallar**: Yopilgan yoki to'xtatilgan

### 🏢 Filiallar Ro'yxati (pastda)

Har bir filial kartochkasida:
- **Nom**: "Asosiy do'kon", "Samsung pavilioni", "Samarqand filiali" va h.k.
- **Turi**: "Bosh ofis" yoki "Filial"
- **Holat**: "Faol" yoki "Nofarol"
- **Viloyat**: Qaysi hududda joylashgan
- **Manzil**: To'liq manzil
- **Telefon**: Aloqa raqami
- **Mas'ul**: Filial menejeri
- **Eslatma**: Qo'shimcha ma'lumot

### 🔧 Harakatlar
Har bir kartochkada 3 ta tugma:
- 👁️ **Ko'rish**: To'liq ma'lumotni ko'rish
- ✏️ **Tahrirlash**: Ma'lumotni o'zgartirish
- 🗑️ **O'chirish**: Filialni o'chirish

---

## Ombor vs Filial — Farqi Nima? 🤔

### Ombor (Warehouse sahifasida)
- **Mahsulotlar** bilan ishlash
- Qoldig'i, minimal miqdor
- Mahsulot qo'shish/o'chirish
- Stok harakatlari

### Filial (Branches sahifasida)
- **Joylashuv** ma'lumotlari
- Bosh ofis yoki filial
- Manzil, telefon, mas'ul
- Hududlar bo'yicha boshqaruv

---

## Misol: Qo'shilgan Filiallar 📝

Loyihangizda allaqachon quyidagi filiallar mavjud:

1. **Orbis ERP — Toshkent**
   - Turi: Bosh ofis
   - Manzil: Toshkent sh., Yunusobod tumani
   - Telefon: +998 71 200 00 00
   - Mas'ul: Azizbek Zokirov

2. **Orbis ERP — Samarqand**
   - Turi: Filial
   - Manzil: Samarqand sh., Registon ko'chasi 12
   - Telefon: +998 66 233 44 55
   - Mas'ul: Dilnoza Karimova

**Yangi qo'shgan filialingiz ham shu ro'yxatda ko'rinadi!**

---

## Yangi Filial Qo'shish ✨

Agar yana filial qo'shmoqchi bo'lsangiz:

1. **Filiallar** sahifasiga o'ting
2. Yuqorida o'ng tomonda **"Filial qo'shish"** tugmasini bosing
3. Formani to'ldiring:
   - **Filial nomi** (majburiy)
   - **Turi**: Bosh ofis yoki Filial
   - **Holat**: Faol yoki Nofarol
   - **Viloyat**
   - **Manzil**
   - **Telefon**
   - **Mas'ul**
   - **Eslatma** (ixtiyoriy)
4. **"Saqlash"** tugmasini bosing

---

## Muammo Bo'lsa? 🆘

Agar filiallar sahifasida yangi qo'shgan filialingiz ko'rinmasa:

1. **Sahifani yangilang** (F5 yoki Ctrl+R)
2. **Qidiruv qutisini tekshiring** - bo'sh ekanligiga ishonch hosil qiling
3. **Brauzer konsolini oching** (F12) va xatolar bormi tekshiring

---

## Qisqacha Yo'l 🎯

```
Dashboard → Chap sidebar → Tashkilot → Filiallar
```

yoki

```
http://localhost:8082/branches
```

**Mana shu yerda yangi qo'shgan omboringiz ko'rinadi!** 🎉
