import {
  Activity,
  AttendanceRecord,
  AttendanceStatus,
  Branch,
  Customer,
  Deal,
  Employee,
  Invoice,
  InvoiceStatus,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  Order,
  OrderItem,
  OrderStatus,
  Payroll,
  PayrollStatus,
  PaymentStatus,
  Product,
  Purchase,
  PurchaseItem,
  PurchaseStatus,
  StockMovement,
  Supplier,
  Transaction,
  StoredUser,
  UserRole,
} from "@shared/api";
import { hashPassword } from "../lib/auth";

/**
 * Demo ma'lumotlarini joriy sanaga nisbatan generatsiya qiladi.
 *
 * Sanalar qotib qolgan bo'lsa, kalendar keyingi oyga o'tishi bilan barcha
 * "joriy oy" ko'rsatkichlari nolga tushib, dashboard bo'shab qolardi.
 * Shuning uchun tranzaksiyalar har safar joriy va o'tgan oy uchun quriladi.
 */

/**
 * Deterministik PRNG (mulberry32).
 * Math.random() ishlatilsa server har qayta ishga tushganda raqamlar sakrab,
 * demo ishonchsiz ko'rinardi — shuning uchun urug' qat'iy.
 */
function createRandom(seed: number) {
  let state = seed;
  return function random(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20260717);

function between(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(random() * list.length)];
}

/** Summani 100 ming aniqligida qaytaradi — real hisobotlardagidek yaxlit ko'rinsin. */
function money(minMln: number, maxMln: number): number {
  return between(minMln * 10, maxMln * 10) * 100_000;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysIn(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ------------------------------------------------------------------ Xodimlar

const PEOPLE: [name: string, position: string, department: string][] = [
  ["Sardor Mahmudov", "Savdo rahbari", "Savdo"],
  ["Madina Rasulova", "Marketing menejeri", "Marketing"],
  ["Gulnoza Abdullayeva", "Bosh buxgalter", "Moliya"],
  ["Bobur Karimov", "IT mutaxassis", "IT"],
  ["Sevara Umarova", "HR menejeri", "HR"],
  ["Jasur To'rayev", "Ombor mudiri", "Ombor"],
  ["Nilufar Sodiqova", "Savdo menejeri", "Savdo"],
  ["Aziz Yo'ldoshev", "Bosh dasturchi", "IT"],
  ["Dilnoza Ergasheva", "Marketing mutaxassisi", "Marketing"],
  ["Rustam Qodirov", "Logistika mutaxassisi", "Ombor"],
  ["Kamola Nazarova", "Buxgalter", "Moliya"],
  ["Gulnora Salimova", "Kassir", "Savdo"],
  ["Otabek Sharipov", "Savdo menejeri", "Savdo"],
  ["Zulfiya Tosheva", "Yurist", "Yuridik"],
  ["Shohruh Islomov", "Tizim administratori", "IT"],
  ["Feruza Xolmatova", "Recruiter", "HR"],
  ["Doniyor Yusupov", "Ishlab chiqarish ustasi", "Ishlab chiqarish"],
  ["Malika Ibragimova", "Kontent menejer", "Marketing"],
  ["Ulug'bek Rahimov", "Savdo menejeri", "Savdo"],
  ["Nodira Ahmedova", "Moliyaviy analitik", "Moliya"],
  ["Farrux Abdullayev", "Omborchi", "Ombor"],
  ["Sitora Yo'ldosheva", "UX dizayner", "IT"],
  ["Javohir Mirzayev", "Ishlab chiqarish operatori", "Ishlab chiqarish"],
  ["Umida Qosimova", "Ofis menejeri", "HR"],
  ["Sanjar Bekmurodov", "Sifat nazoratchisi", "Ishlab chiqarish"],
];

/** Lavozimga qarab maosh oralig'i (mln so'm) — rahbarlar yuqoriroq. */
function salaryFor(position: string): number {
  if (/rahbar|Bosh /.test(position)) return money(12, 16);
  if (/menejer|Yurist|analitik|administrator|usta/.test(position)) return money(8, 12);
  if (/dizayner|mutaxassis|Recruiter/.test(position)) return money(7, 10);
  return money(5, 8);
}

function buildEmployees(): Employee[] {
  const now = new Date();

  return PEOPLE.map((person, index) => {
    const [name, position, department] = person;

    // Xodimlarning aksari ishda; bir nechtasi ta'til va kasallik ta'tilida.
    let status: Employee["status"] = "active";
    if (index % 11 === 2) status = "vacation";
    else if (index % 17 === 6) status = "sick_leave";

    // Ishga kirish sanasi: ko'pchilik o'tgan yillarda, oxirgi ikkitasi shu oyda —
    // shunda dashboarddagi "bu oyda qo'shildi" ko'rsatkichi bo'sh turmaydi.
    const hire =
      index >= PEOPLE.length - 2
        ? new Date(now.getFullYear(), now.getMonth(), between(1, Math.max(1, now.getDate())))
        : new Date(
            now.getFullYear() - between(0, 4),
            between(0, 11),
            between(1, 28),
          );

    const slug = name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".");

    return {
      id: (index + 1).toString(),
      name,
      position,
      department,
      status,
      salary: salaryFor(position),
      hireDate: isoDate(hire.getFullYear(), hire.getMonth(), hire.getDate()),
      email: `${slug}@company.uz`,
      phone: `+9989${between(0, 9)}${between(1000000, 9999999)}`,
    };
  });
}

// ----------------------------------------------------------------- Mahsulotlar

const CATALOG: [name: string, category: string, supplier: string, priceMln: number][] = [
  // Telefonlar
  ["Samsung Galaxy S24 Ultra 256GB", "Telefonlar", "Samsung Uzbekistan", 12.5],
  ["Samsung Galaxy S24+ 256GB", "Telefonlar", "Samsung Uzbekistan", 9.8],
  ["Samsung Galaxy A55 5G 128GB", "Telefonlar", "Samsung Uzbekistan", 5.2],
  ["Samsung Galaxy A35 5G 128GB", "Telefonlar", "Samsung Uzbekistan", 3.8],
  ["Samsung Galaxy A15 128GB", "Telefonlar", "Samsung Uzbekistan", 2.1],
  ["iPhone 15 Pro Max 256GB", "Telefonlar", "Apple Store UZ", 18.9],
  ["iPhone 15 Pro 128GB", "Telefonlar", "Apple Store UZ", 15.4],
  ["iPhone 15 128GB", "Telefonlar", "Apple Store UZ", 11.2],
  ["iPhone 14 128GB", "Telefonlar", "Apple Store UZ", 8.6],
  ["Xiaomi 14 256GB", "Telefonlar", "Xiaomi Official", 8.7],
  ["Xiaomi Redmi Note 13 Pro 256GB", "Telefonlar", "Xiaomi Official", 4.2],
  ["Xiaomi Redmi 13C 128GB", "Telefonlar", "Xiaomi Official", 2.4],
  ["Xiaomi Redmi 13 128GB", "Telefonlar", "Xiaomi Official", 2.8],
  ["Realme C67 128GB", "Telefonlar", "Xiaomi Official", 2.2],
  // Noutbuklar
  ["MacBook Air M3 15\" 256GB", "Noutbuklar", "Apple Store UZ", 18.5],
  ["MacBook Pro M3 14\" 512GB", "Noutbuklar", "Apple Store UZ", 24.8],
  ["MacBook Pro M3 16\" 1TB", "Noutbuklar", "Apple Store UZ", 32.5],
  ["Lenovo ThinkPad X1 Carbon Gen 11 i7", "Noutbuklar", "Tech Supply", 9.8],
  ["Lenovo IdeaPad 3 15\" i5 8GB", "Noutbuklar", "Tech Supply", 4.6],
  ["Lenovo V15 G4 i5 8GB", "Noutbuklar", "Tech Supply", 3.8],
  ["ASUS ZenBook 14 OLED i7", "Noutbuklar", "Tech Supply", 7.6],
  ["ASUS VivoBook 15 i5 8GB", "Noutbuklar", "Tech Supply", 5.2],
  ["HP Pavilion 15 i5 8GB", "Noutbuklar", "Tech Supply", 5.4],
  ["HP ProBook 450 G10 i7 16GB", "Noutbuklar", "Tech Supply", 6.8],
  ["Dell XPS 15 i7 16GB", "Noutbuklar", "Tech Supply", 11.2],
  ["Acer Aspire 5 i5 8GB", "Noutbuklar", "Tech Supply", 4.2],
  // Maishiy texnikalar
  ["Kir yuvish mashinasi Samsung WW70", "Maishiy texnika", "Samsung Uzbekistan", 8.4],
  ["Kir yuvish mashinasi LG F4", "Maishiy texnika", "LG Electronics", 6.8],
  ["Muzlatgich Samsung RT38", "Maishiy texnika", "Samsung Uzbekistan", 9.2],
  ["Muzlatgich LG GBB62", "Maishiy texnika", "LG Electronics", 7.6],
  ["Muzlatgich Hisense RQ720N6AC2", "Maishiy texnika", "Xiaomi Official", 5.8],
  ["Konditsioner Samsung AR12 Split", "Maishiy texnika", "Samsung Uzbekistan", 5.4],
  ["Konditsioner LG S4NQ14JA3", "Maishiy texnika", "LG Electronics", 4.8],
  ["Dyson V15 Detect Absolute", "Maishiy texnika", "Tech Supply", 5.6],
  ["Robot purkagich Xiaomi Robot Vacuum X10+", "Maishiy texnika", "Xiaomi Official", 4.2],
  ["Mikroto'lqinli pech Samsung ME83", "Maishiy texnika", "Samsung Uzbekistan", 2.8],
  ["Mikroto'lqinli pech LG MS2042DB", "Maishiy texnika", "LG Electronics", 2.4],
  ["Chang yutgich Xiaomi G9", "Maishiy texnika", "Xiaomi Official", 3.2],
  // Televizorlar
  ["Samsung 65\" QLED 4K QN85B", "Televizorlar", "Samsung Uzbekistan", 14.8],
  ["Samsung 55\" Crystal UHD CU8000", "Televizorlar", "Samsung Uzbekistan", 7.2],
  ["Samsung 43\" Crystal UHD CU7100", "Televizorlar", "Samsung Uzbekistan", 4.6],
  ["LG 55\" OLED evo C4", "Televizorlar", "LG Electronics", 12.4],
  ["LG 50\" UR7800 4K", "Televizorlar", "LG Electronics", 5.8],
  ["Sony 65\" BRAVIA XR A95L", "Televizorlar", "Sony Uzbekistan", 18.6],
  ["Hisense 50\" A6K 4K", "Televizorlar", "Xiaomi Official", 4.2],
  ["Sony 55\" BRAVIA X80L 4K", "Televizorlar", "Sony Uzbekistan", 8.8],
  ["Sony WH-1000XM5 quloqchin", "Aksessuarlar", "Sony Uzbekistan", 3.4],
  ["Sony WF-1000XM5", "Aksessuarlar", "Sony Uzbekistan", 2.2],
];

const LOCATIONS = [
  "Asosiy do'kon",
  "Samsung pavilioni",
  "Apple pavilioni",
  "Maishiy texnika bo'limi",
] as const;

/** Kategoriyaga qarab mos ombor tanlanadi. */
function locationFor(category: string): string {
  if (category === "Telefonlar") return pick(["Samsung pavilioni", "Apple pavilioni"]);
  if (category === "Noutbuklar") return pick(["Apple pavilioni", "Asosiy do'kon"]);
  if (category === "Maishiy texnika" || category === "Televizorlar") return "Maishiy texnika bo'limi";
  return pick(["Asosiy do'kon", "Maishiy texnika bo'limi"]);
}

function buildProducts(): Product[] {
  return CATALOG.map((item, index) => {
    const [name, category, supplier, priceMln] = item;
    const minQuantity = between(4, 25);

    // Har beshinchi mahsulot ataylab tanqis qilinadi — ogohlantirishlar
    // va "faqat tanqis" filtri bo'sh natija bermasin.
    const quantity =
      index % 5 === 3 ? between(0, minQuantity) : between(minQuantity + 5, minQuantity + 90);

    return {
      id: (index + 1).toString(),
      name,
      location: locationFor(category),
      quantity,
      minQuantity,
      price: Math.round(priceMln * 1_000_000),
      category,
      supplier,
    };
  });
}

// -------------------------------------------------------------------- Bitimlar

const CLIENTS = [
  "Texno Park do'koni",
  "Smart Electronics",
  "Digi Market",
  "TechZone Toshkent",
  "Elektron UZ",
  "Gadget Store",
  "Phone House",
  "Laptop World",
  "Apex Electronics",
  "Digital Life",
  "TechPoint",
  "Mega Electronics",
  "Future Tech",
  "Pro Electronics",
  "Star Mobile",
  "Vision Electronics",
  "Top Tech Store",
  "Inno Electronics",
] as const;

const DEAL_NOTES: Record<Deal["status"], string[]> = {
  new_lead: ["Yangi so'rov keldi", "Sayt orqali murojaat", "Ko'rgazmada tanishdik"],
  negotiation: ["Narx bo'yicha muzokara", "Shartlar muhokama qilinmoqda", "Hajm kelishilmoqda"],
  proposal: ["Tijorat taklifi yuborildi", "Taklif ko'rib chiqilmoqda", "Shartnoma loyihasi tayyor"],
  closed_won: ["Shartnoma imzolandi", "Buyurtma qabul qilindi", "To'lov amalga oshirildi"],
  closed_lost: ["Narx bo'yicha kelisha olmadik", "Raqobatchini tanladi", "Byudjet muzlatildi"],
};

function buildDeals(sellers: Employee[]): Deal[] {
  const now = new Date();
  const statuses: Deal["status"][] = [
    "new_lead",
    "new_lead",
    "new_lead",
    "negotiation",
    "negotiation",
    "negotiation",
    "negotiation",
    "proposal",
    "proposal",
    "proposal",
    "closed_won",
    "closed_won",
    "closed_won",
    "closed_won",
    "closed_lost",
    "closed_lost",
  ];

  return statuses.map((status, index) => {
    const created = new Date(now);
    created.setDate(created.getDate() - between(3, 55));

    // Yopilish sanasi: yopilgan bitimlar o'tmishda, ochiqlari kelajakda.
    // Bir nechtasi ataylab muddati o'tgan qilinadi — dashboarddagi ogohlantirish ishlasin.
    const close = new Date(created);
    if (status === "closed_won" || status === "closed_lost") {
      close.setDate(close.getDate() + between(5, 20));
    } else if (index % 7 === 4) {
      close.setDate(close.getDate() + between(1, 4));
    } else {
      close.setDate(now.getDate() + between(2, 40));
      close.setMonth(now.getMonth());
      close.setFullYear(now.getFullYear());
    }

    return {
      id: (index + 1).toString(),
      clientName: CLIENTS[index % CLIENTS.length],
      status,
      value: money(4, 45),
      description: pick(DEAL_NOTES[status]),
      createdDate: isoDate(created.getFullYear(), created.getMonth(), created.getDate()),
      expectedCloseDate: isoDate(close.getFullYear(), close.getMonth(), close.getDate()),
      assignedTo: pick(sellers).name,
    };
  });
}

// --------------------------------------------------------------- Tranzaksiyalar

const ACCOUNTS = [
  "Ipak Yo'li bank · UZS",
  "Hamkorbank · UZS",
  "Trastbank · UZS",
  "Kassa · UZS",
] as const;

const INCOME_CATEGORIES = [
  "Savdo daromadi",
  "Xizmat ko'rsatish",
  "Ijara daromadi",
] as const;

const EXPENSE_ITEMS: [category: string, title: string, minMln: number, maxMln: number][] = [
  ["Ijara xarajati", "Office Service MChJ", 8, 9],
  ["Yetkazib berish", "Yangiobod Logistic", 1, 4],
  ["Marketing", "Marketing kampaniya", 3, 12],
  ["Kommunal", "Kommunal to'lovlar", 2, 5],
  ["Xarid", "Ofis jihozlari xaridi", 3, 14],
  ["Transport", "Transport xizmati", 1, 6],
  ["Aloqa", "Internet va aloqa", 1, 3],
  ["Ta'mirlash", "Jihozlarni ta'mirlash", 1, 7],
  ["Soliq", "Soliq to'lovlari", 12, 28],
];

/** Bitta oy uchun tranzaksiyalar. `maxDay` — kelajakdagi sanalar yaratilmasligi uchun. */
function buildMonth(
  year: number,
  month: number,
  maxDay: number,
  salaryFund: number,
  scale: number,
  startId: number,
): Transaction[] {
  const result: Transaction[] = [];
  let id = startId;

  // Har kun uchun turli xil qiymatlar
  const incomeCount = Math.round(35 * scale); // Ko'proq tranzaksiya
  for (let i = 0; i < incomeCount; i++) {
    // Haftaning o'rtasida ko'proq savdo, dam olishda kamroq
    const day = between(1, maxDay);
    const dayOfWeek = new Date(year, month, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Dam olishda kamroq, ish kunida ko'proq
    const multiplier = isWeekend ? 0.3 : 1.2;
    
    result.push({
      id: (id++).toString(),
      title: `${pick(CLIENTS)} to'lovi`,
      category: pick(INCOME_CATEGORIES),
      account: pick(ACCOUNTS),
      date: isoDate(year, month, day),
      amount: Math.round(money(15, 85) * scale * multiplier),
      type: "income",
    });
  }

  // Xarajatlar ham har xil
  const expenseCount = Math.round(28 * scale);
  for (let i = 0; i < expenseCount; i++) {
    const [category, title, min, max] = pick(EXPENSE_ITEMS);
    const day = between(1, maxDay);
    
    result.push({
      id: (id++).toString(),
      title,
      category,
      account: pick(ACCOUNTS),
      date: isoDate(year, month, day),
      amount: Math.round(money(min, max) * scale * between(80, 120) / 100),
      type: "expense",
    });
  }

  // Ish haqi — oyning 10-sanasida, jami maosh fondi bo'yicha bitta yirik chiqim.
  if (maxDay >= 10) {
    result.push({
      id: (id++).toString(),
      title: "Ish haqi to'lovi",
      category: "Ish haqi",
      account: ACCOUNTS[0],
      date: isoDate(year, month, 10),
      amount: salaryFund,
      type: "expense",
    });
  }

  return result;
}

function buildTransactions(salaryFund: number): Transaction[] {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // O'tgan oy pastroq hajmda
  const previous = buildMonth(
    prev.getFullYear(),
    prev.getMonth(),
    daysIn(prev.getFullYear(), prev.getMonth()),
    salaryFund,
    0.75, // Pastroq
    1000,
  );
  // Joriy oy - yanada ko'proq va turli xil
  const current = buildMonth(
    now.getFullYear(),
    now.getMonth(),
    daysIn(now.getFullYear(), now.getMonth()),
    salaryFund,
    1.5, // Yuqoriroq - ko'proq tranzaksiyalar
    2000,
  );

  return [...previous, ...current].sort((a, b) => b.date.localeCompare(a.date));
}

// ------------------------------------------------------------- Ta'minotchilar

/** CATALOG'dagi ta'minotchi nomlariga qo'shimcha ma'lumot. */
const SUPPLIER_META: Record<string, [contact: string, category: string, address: string]> = {
  "Samsung Uzbekistan": ["Aziza Karimova", "Samsung distribyutor", "Toshkent sh., Yunusobod t."],
  "Apple Store UZ": ["Timur Rashidov", "Apple distribyutor", "Toshkent sh., Shayxontohur t."],
  "Tech Supply": ["Dilshod Ergashev", "Texnika optom", "Toshkent sh., Mirzo Ulug'bek t."],
  "Xiaomi Official": ["Nodir Sharipov", "Xiaomi distribyutor", "Toshkent sh., Uchtepa t."],
  "LG Electronics": ["Bekzod Nazarov", "LG distribyutor", "Toshkent sh., Olmazor t."],
  "Sony Uzbekistan": ["Sherzod Qurbonov", "Sony distribyutor", "Toshkent sh., Chilonzor t."],
};

function buildSuppliers(): Supplier[] {
  const names = [...new Set(CATALOG.map(([, , supplier]) => supplier))];
  const now = new Date();

  return names.map((name, index) => {
    const [contactPerson, category, address] = SUPPLIER_META[name] ?? [
      "Mas'ul shaxs",
      "Boshqa",
      "Toshkent sh.",
    ];
    const created = new Date(now.getFullYear() - between(0, 3), between(0, 11), between(1, 28));

    return {
      id: (index + 1).toString(),
      name,
      contactPerson,
      phone: `+9989${between(0, 9)}${between(1000000, 9999999)}`,
      email: `info@${name.toLowerCase().replace(/[^a-z]/g, "")}.uz`,
      category,
      address,
      // Ko'pchiligi faol; bittasi arxivda — filtr bo'sh natija bermasin.
      status: index === names.length - 1 ? "inactive" : "active",
      rating: between(3, 5),
      createdDate: isoDate(created.getFullYear(), created.getMonth(), created.getDate()),
    };
  });
}

// ----------------------------------------------------------------- Filiallar

/** Boshlang'ich filiallar — bosh ofis va bir nechta hududiy filial. */
function buildBranches(): Branch[] {
  const rows: Omit<Branch, "id" | "createdDate">[] = [
    {
      name: "Orbis ERP — Toshkent",
      type: "head_office",
      region: "Toshkent shahri",
      address: "Toshkent sh., Yunusobod tumani",
      phone: "+998 71 200 00 00",
      manager: "Azizbek Zokirov",
      status: "active",
      note: "Bosh ofis va markaziy ombor.",
    },
    {
      name: "Orbis ERP — Samarqand",
      type: "branch",
      region: "Samarqand",
      address: "Samarqand sh., Registon ko'chasi 12",
      phone: "+998 66 233 44 55",
      manager: "Dilnoza Karimova",
      status: "active",
      note: "",
    },
  ];

  const now = new Date();
  return rows.map((row, index) => {
    const created = new Date(now.getFullYear() - between(0, 2), between(0, 11), between(1, 28));
    return {
      id: (index + 1).toString(),
      ...row,
      createdDate: isoDate(created.getFullYear(), created.getMonth(), created.getDate()),
    };
  });
}

// ----------------------------------------------------------------- Mijozlar

const REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand",
  "Buxoro",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Qashqadaryo",
] as const;

const CONTACT_NAMES = [
  "Akmal Tursunov",
  "Zarina Yusupova",
  "Bahodir Ismoilov",
  "Nigora Salimova",
  "Timur Rashidov",
  "Lola Xamidova",
  "Shavkat Bo'riyev",
  "Gulbahor Nazirova",
] as const;

function buildCustomers(): Customer[] {
  const now = new Date();

  return CLIENTS.map((name, index) => {
    // Oxirgi ikkitasi shu oyda qo'shilgan — "yangi mijoz" ko'rsatkichi bo'sh turmasin.
    const created =
      index >= CLIENTS.length - 2
        ? new Date(now.getFullYear(), now.getMonth(), between(1, Math.max(1, now.getDate())))
        : new Date(now.getFullYear() - between(0, 2), between(0, 11), between(1, 28));

    return {
      id: (index + 1).toString(),
      name,
      // Ro'yxatdagi nomlar tashkilot nomlari; har beshinchisini jismoniy shaxs qilamiz.
      type: index % 5 === 3 ? "individual" : "company",
      contactPerson: pick(CONTACT_NAMES),
      phone: `+9989${between(0, 9)}${between(1000000, 9999999)}`,
      email: `info@${name.toLowerCase().replace(/[^a-z]/g, "")}.uz`,
      region: pick(REGIONS),
      address: `${pick(REGIONS)}, ${between(1, 120)}-uy`,
      status: index % 9 === 7 ? "inactive" : "active",
      createdDate: isoDate(created.getFullYear(), created.getMonth(), created.getDate()),
      note: "",
    };
  });
}

// --------------------------------------------------------------- Buyurtmalar

/** Bosqichlar taqsimoti — ko'pchiligi yetkazilgan, bir nechtasi jarayonda. */
const ORDER_STATUSES: OrderStatus[] = [
  "delivered",
  "delivered",
  "delivered",
  "delivered",
  "delivered",
  "delivered",
  "shipped",
  "shipped",
  "shipped",
  "confirmed",
  "confirmed",
  "confirmed",
  "draft",
  "draft",
  "cancelled",
];

function buildOrders(
  customers: Customer[],
  products: Product[],
  sellers: Employee[],
): Order[] {
  const now = new Date();

  return ORDER_STATUSES.map((status, index) => {
    const customer = customers[index % customers.length];

    const ordered = new Date(now);
    ordered.setDate(ordered.getDate() - between(1, 70));

    const delivery = new Date(ordered);
    delivery.setDate(delivery.getDate() + between(3, 21));

    // Har bir buyurtmada 1–4 xil mahsulot, takrorlanmasin.
    const itemCount = between(1, 4);
    const chosen = new Set<string>();
    const items: OrderItem[] = [];

    while (items.length < itemCount) {
      const product = pick(products);
      if (chosen.has(product.id)) continue;
      chosen.add(product.id);
      items.push({
        productId: product.id,
        productName: product.name,
        quantity: between(1, 12),
        price: product.price,
      });
    }

    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    // To'lov holati bosqichga bog'liq: yetkazilgan buyurtmalar odatda to'langan.
    let paymentStatus: PaymentStatus = "unpaid";
    if (status === "delivered") paymentStatus = index % 6 === 5 ? "partial" : "paid";
    else if (status === "shipped") paymentStatus = index % 2 === 0 ? "partial" : "unpaid";

    return {
      id: (index + 1).toString(),
      orderNumber: `ORD-${1000 + index + 1}`,
      customerId: customer.id,
      customerName: customer.name,
      items,
      total,
      status,
      paymentStatus,
      orderDate: isoDate(ordered.getFullYear(), ordered.getMonth(), ordered.getDate()),
      deliveryDate: isoDate(delivery.getFullYear(), delivery.getMonth(), delivery.getDate()),
      assignedTo: pick(sellers).name,
      note: "",
    };
  });
}

// ---------------------------------------------------------- Ombor harakatlari

const MOVEMENT_REASONS = {
  in: ["Ta'minotchidan qabul", "Xarid buyurtmasi", "Qaytarilgan tovar"],
  out: ["Buyurtma bo'yicha chiqim", "Ichki ehtiyoj", "Yaroqsiz deb hisobdan chiqarish"],
  adjustment: ["Inventarizatsiya tuzatishi", "Hisob xatosi tuzatildi"],
} as const;

/**
 * Har bir mahsulot uchun harakatlar tarixini quradi.
 * Boshlang'ich qoldiq shunday tanlanadiki, harakatlardan keyingi yakuniy qoldiq
 * mahsulotning joriy `quantity` qiymatiga aynan teng bo'lsin.
 */
function buildMovements(products: Product[]): StockMovement[] {
  const movements: StockMovement[] = [];
  const now = new Date();
  let id = 1;

  for (const product of products) {
    const count = between(2, 5);
    const deltas: { type: StockMovement["type"]; delta: number }[] = [];

    for (let i = 0; i < count; i++) {
      const roll = random();
      if (roll < 0.45) deltas.push({ type: "in", delta: between(5, 60) });
      else if (roll < 0.9) deltas.push({ type: "out", delta: -between(1, 25) });
      else deltas.push({ type: "adjustment", delta: between(-4, 4) });
    }

    // Yakuniy qoldiq joriy qiymatga teng bo'lishi uchun boshlang'ichni orqaga hisoblaymiz.
    const net = deltas.reduce((sum, move) => sum + move.delta, 0);
    let balance = product.quantity - net;

    // Tarix davomida qoldiq manfiy bo'lib qolmasligi kerak.
    if (balance < 0) {
      deltas.unshift({ type: "in", delta: -balance });
      balance = 0;
    }

    deltas.forEach((move, index) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (deltas.length - index) * between(2, 9));
      balance += move.delta;

      movements.push({
        id: (id++).toString(),
        productId: product.id,
        productName: product.name,
        type: move.type,
        quantity: Math.abs(move.delta),
        balanceAfter: balance,
        reason: pick(MOVEMENT_REASONS[move.type]),
        reference: "—",
        date: isoDate(date.getFullYear(), date.getMonth(), date.getDate()),
      });
    });
  }

  return movements.sort((a, b) => b.date.localeCompare(a.date));
}

// ------------------------------------------------------------------ Xaridlar

const PURCHASE_STATUSES: PurchaseStatus[] = [
  "received",
  "received",
  "received",
  "received",
  "received",
  "ordered",
  "ordered",
  "ordered",
  "draft",
  "draft",
  "cancelled",
];

function buildPurchases(
  suppliers: Supplier[],
  products: Product[],
  staff: Employee[],
): Purchase[] {
  const now = new Date();

  return PURCHASE_STATUSES.map((status, index) => {
    const supplier = suppliers[index % suppliers.length];
    // Ta'minotchi o'zi yetkazadigan mahsulotlardan tanlaymiz — hujjat mantiqiy bo'lsin.
    const catalog = products.filter((p) => p.supplier === supplier.name);
    const pool = catalog.length > 0 ? catalog : products;

    const ordered = new Date(now);
    ordered.setDate(ordered.getDate() - between(2, 80));

    const expected = new Date(ordered);
    expected.setDate(expected.getDate() + between(5, 25));

    const itemCount = Math.min(pool.length, between(1, 3));
    const chosen = new Set<string>();
    const items: PurchaseItem[] = [];

    while (items.length < itemCount) {
      const product = pick(pool);
      if (chosen.has(product.id)) continue;
      chosen.add(product.id);
      items.push({
        productId: product.id,
        productName: product.name,
        quantity: between(10, 80),
        // Tannarx sotish narxining ~60–75% i.
        cost: Math.round((product.price * between(60, 75)) / 100),
      });
    }

    const total = items.reduce((sum, item) => sum + item.quantity * item.cost, 0);

    let paymentStatus: PaymentStatus = "unpaid";
    if (status === "received") paymentStatus = index % 5 === 4 ? "partial" : "paid";
    else if (status === "ordered") paymentStatus = index % 2 === 0 ? "partial" : "unpaid";

    return {
      id: (index + 1).toString(),
      purchaseNumber: `PO-${2000 + index + 1}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      total,
      status,
      paymentStatus,
      orderDate: isoDate(ordered.getFullYear(), ordered.getMonth(), ordered.getDate()),
      expectedDate: isoDate(expected.getFullYear(), expected.getMonth(), expected.getDate()),
      createdBy: pick(staff).name,
      note: "",
    };
  });
}

// ------------------------------------------------------------ Hisob-fakturalar

/** Yetkazilgan va jo'natilgan buyurtmalar uchun faktura chiqariladi. */
function buildInvoices(orders: Order[]): Invoice[] {
  const today = new Date().toISOString().split("T")[0];
  const billable = orders.filter(
    (order) => order.status === "delivered" || order.status === "shipped",
  );

  return billable.map((order, index) => {
    const issue = new Date(order.orderDate);
    issue.setDate(issue.getDate() + between(0, 3));

    const due = new Date(issue);
    due.setDate(due.getDate() + between(10, 30));
    const dueDate = isoDate(due.getFullYear(), due.getMonth(), due.getDate());

    // Faktura holati buyurtmaning to'lov holatidan kelib chiqadi.
    let status: InvoiceStatus;
    let paidAmount: number;
    if (order.paymentStatus === "paid") {
      status = "paid";
      paidAmount = order.total;
    } else if (order.paymentStatus === "partial") {
      status = dueDate < today ? "overdue" : "sent";
      paidAmount = Math.round(order.total / 2);
    } else {
      status = dueDate < today ? "overdue" : "sent";
      paidAmount = 0;
    }

    return {
      id: (index + 1).toString(),
      invoiceNumber: `INV-${3000 + index + 1}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      amount: order.total,
      paidAmount,
      status,
      issueDate: isoDate(issue.getFullYear(), issue.getMonth(), issue.getDate()),
      dueDate,
      note: "",
    };
  });
}

// ------------------------------------------------------------ Davomat va ta'til

const ATTENDANCE_POOL: AttendanceStatus[] = [
  "present",
  "present",
  "present",
  "present",
  "present",
  "present",
  "present",
  "remote",
  "late",
  "absent",
];

/** Dam olish kuni emasligini tekshiradi (shanba/yakshanba). */
function isWorkday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/** Oxirgi 14 ish kuni uchun har bir xodimning davomat yozuvi. */
function buildAttendance(employees: Employee[]): AttendanceRecord[] {
  const result: AttendanceRecord[] = [];
  const now = new Date();
  let id = 1;

  // Oxirgi 14 ish kunini topish (dam olish kunlarini o'tkazib yuborish)
  const workdays: Date[] = [];
  let pointer = new Date(now);
  
  while (workdays.length < 14) {
    if (isWorkday(pointer)) {
      workdays.push(new Date(pointer));
    }
    pointer.setDate(pointer.getDate() - 1);
  }
  
  workdays.reverse();

  for (const employee of employees) {
    // Har bir xodim uchun har bir ish kuni
    for (const day of workdays) {
      // Ta'til yoki kasallik ta'tilidagi xodimlar uchun davomat yo'q
      if (employee.status === "vacation" || employee.status === "sick_leave") {
        continue;
      }

      const status = pick(ATTENDANCE_POOL);
      const date = isoDate(day.getFullYear(), day.getMonth(), day.getDate());

      let checkIn = "—";
      let checkOut = "—";
      let hours = 0;

      if (status === "present") {
        // Odatiy ish kuni: 09:00-18:00
        const startHour = 9;
        const endHour = 18;
        checkIn = `${String(startHour).padStart(2, "0")}:${String(between(0, 15)).padStart(2, "0")}`;
        checkOut = `${String(endHour).padStart(2, "0")}:${String(between(0, 30)).padStart(2, "0")}`;
        hours = endHour - startHour + between(0, 30) / 60;
      } else if (status === "remote") {
        // Masofaviy ish
        checkIn = `${String(between(8, 10)).padStart(2, "0")}:${String(between(0, 59)).padStart(2, "0")}`;
        checkOut = `${String(between(17, 19)).padStart(2, "0")}:${String(between(0, 59)).padStart(2, "0")}`;
        hours = 8 + between(0, 60) / 60;
      } else if (status === "late") {
        // Kechikkan
        const lateMinutes = between(15, 90);
        const startHour = 9;
        const startMinute = lateMinutes;
        checkIn = `${String(startHour + Math.floor(startMinute / 60)).padStart(2, "0")}:${String(startMinute % 60).padStart(2, "0")}`;
        checkOut = "18:00";
        hours = 18 - (startHour + startMinute / 60);
      }
      // absent uchun checkIn/checkOut "—" qoladi

      result.push({
        id: (id++).toString(),
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        date,
        status,
        checkIn,
        checkOut,
        hours: Math.round(hours * 10) / 10,
        note: "",
      });
    }
  }

  return result.sort((a, b) => b.date.localeCompare(a.date));
}

const LEAVE_TYPES: LeaveType[] = ["vacation", "vacation", "sick", "personal", "unpaid"];
const LEAVE_REASONS: Record<LeaveType, string[]> = {
  vacation: ["Yillik mehnat ta'tili", "Oilaviy sayohat", "Dam olish"],
  sick: ["Shifokor tavsiyasi", "Kasallik varaqasi", "Sog'liqni tiklash"],
  personal: ["Shaxsiy sabab", "Oilaviy tadbir", "Hujjat rasmiylashtirish"],
  unpaid: ["Haq to'lanmaydigan ta'til", "Shaxsiy ishlar"],
};

function buildLeaveRequests(employees: Employee[]): LeaveRequest[] {
  const now = new Date();
  const statuses: LeaveStatus[] = [
    "approved",
    "approved",
    "approved",
    "approved",
    "pending",
    "pending",
    "pending",
    "rejected",
  ];

  return statuses.map((status, index) => {
    const employee = employees[(index * 3) % employees.length];
    const type = LEAVE_TYPES[index % LEAVE_TYPES.length];

    // Kutilayotgan so'rovlar kelajakka, tasdiqlanganlar yaqin o'tmish/hozirga.
    const start = new Date(now);
    if (status === "pending") start.setDate(start.getDate() + between(3, 25));
    else start.setDate(start.getDate() - between(0, 20));

    const days = between(1, 12);
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);

    const requested = new Date(start);
    requested.setDate(requested.getDate() - between(3, 14));

    return {
      id: (index + 1).toString(),
      employeeId: employee.id,
      employeeName: employee.name,
      type,
      startDate: isoDate(start.getFullYear(), start.getMonth(), start.getDate()),
      endDate: isoDate(end.getFullYear(), end.getMonth(), end.getDate()),
      days,
      status,
      reason: pick(LEAVE_REASONS[type]),
      requestedDate: isoDate(
        requested.getFullYear(),
        requested.getMonth(),
        requested.getDate(),
      ),
    };
  });
}

// -------------------------------------------------------- Foydalanuvchi va rol

/** Lavozimga qarab mos rol beriladi. */
function roleFor(employee: Employee, index: number): UserRole {
  if (index === 0) return "admin";
  if (/rahbar|Bosh /.test(employee.position)) return "manager";
  if (employee.department === "Moliya") return "accountant";
  if (employee.department === "Ombor") return "warehouse";
  if (employee.department === "Savdo") return "sales";
  if (employee.department === "HR") return "hr_manager";
  if (employee.position.toLowerCase().includes("kassir")) return "cashier";
  return "viewer";
}

/**
 * Oddiy 4 ta foydalanuvchi: admin, menejr, hisobchi, kassir
 * 
 * DEPLOY UCHUN DEFAULT LOGIN/PAROL:
 * Login: admin@orbiserp.uz
 * Parol: OrbisAdmin2024!
 * 
 * Bu parol production'da ham ishlaydi (environment variable bo'lmasa)
 */
export const DEMO_PASSWORD = "123456";

// Production uchun default admin credentials (hardcoded - deploy'da ishlaydi)
const PRODUCTION_ADMIN_EMAIL = "admin@orbiserp.uz";
const PRODUCTION_ADMIN_PASSWORD = "OrbisAdmin2024!";

function buildUsers(employees: Employee[]): StoredUser[] {
  const now = new Date();
  const createdDate = isoDate(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Production yoki development muhitini aniqlash
  const isProduction = process.env.NODE_ENV === "production";
  
  // Admin uchun parol - environment variable yoki default
  const adminEmail = process.env.ADMIN_EMAIL || PRODUCTION_ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD || PRODUCTION_ADMIN_PASSWORD;
  const adminPasswordHash = hashPassword(adminPassword);
  
  // Boshqa foydalanuvchilar uchun oddiy parol
  const demoPasswordHash = hashPassword("123456");

  // Faqat 4 ta oddiy foydalanuvchi
  const users: StoredUser[] = [
    {
      id: "1",
      name: "Administrator",
      login: "admin",
      email: adminEmail,
      role: "admin",
      status: "active",
      lastLogin: now.toISOString(),
      employeeId: null,
      createdDate,
      passwordHash: adminPasswordHash, // Production parol
    },
    {
      id: "2", 
      name: "Menejr",
      login: "menejr",
      email: "menejr@test.uz",
      role: "manager",
      status: "active",
      lastLogin: now.toISOString(),
      employeeId: null,
      createdDate,
      passwordHash: demoPasswordHash,
    },
    {
      id: "3",
      name: "Hisobchi",
      login: "hisobchi", 
      email: "hisobchi@test.uz",
      role: "accountant",
      status: "active",
      lastLogin: now.toISOString(),
      employeeId: null,
      createdDate,
      passwordHash: demoPasswordHash,
    },
    {
      id: "4",
      name: "Kassir",
      login: "kassir",
      email: "kassir@test.uz", 
      role: "cashier",
      status: "active",
      lastLogin: now.toISOString(),
      employeeId: null,
      createdDate,
      passwordHash: demoPasswordHash,
    },
  ];

  return users;
}

// ------------------------------------------------------------------ Ish haqi

/** "YYYY-MM" davridagi ish (dam olishsiz) kunlari — dush–juma. */
function workingDaysOf(year: number, month: number): number {
  const total = daysIn(year, month);
  let count = 0;
  for (let day = 1; day <= total; day++) {
    const weekday = new Date(year, month, day).getDay();
    if (weekday !== 0 && weekday !== 6) count++;
  }
  return count;
}

/**
 * O'tgan oy uchun barcha faol xodimlarga ish haqi hisob-kitobini quradi.
 * Joriy oy ataylab bo'sh qoldiriladi — foydalanuvchi uni "Hisoblash" tugmasi
 * bilan yaratib ko'radi. Statuslar aralash: ko'pchilik to'langan, ba'zilari
 * tasdiqlangan yoki qoralama.
 */
function buildPayrolls(employees: Employee[]): Payroll[] {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = prev.getFullYear();
  const month = prev.getMonth();
  const period = `${year}-${String(month + 1).padStart(2, "0")}`;
  const workingDays = workingDaysOf(year, month);
  const createdDate = isoDate(year, month, Math.min(28, daysIn(year, month)));

  return employees
    .filter((employee) => !employee.deletedAt)
    .map((employee, index) => {
      // Har uchdan biri kamroq kelgan — ushlanma hosil qiladi (realroq ko'rinish).
      const absentDays = index % 3 === 0 ? between(1, 3) : 0;
      const presentDays = workingDays - absentDays;
      const perDay = workingDays === 0 ? 0 : employee.salary / workingDays;
      const absenceDeduction = Math.round(perDay * absentDays);

      // Har to'rtinchi xodimga bonus, kamdan-kam jarima.
      const bonus = index % 4 === 0 ? money(0.5, 2) : 0;
      const penalty = index % 7 === 0 ? money(0.2, 0.6) : 0;

      const taxable = Math.max(0, employee.salary - absenceDeduction + bonus - penalty);
      const tax = Math.round(taxable * 0.12);
      const netSalary = taxable - tax;

      const status: PayrollStatus =
        index % 5 === 0 ? "approved" : index % 11 === 0 ? "draft" : "paid";

      return {
        id: `payroll-${period}-${employee.id}`,
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        period,
        baseSalary: employee.salary,
        workingDays,
        presentDays,
        absenceDeduction,
        bonus,
        penalty,
        tax,
        netSalary,
        status,
        createdDate,
        note: "",
      };
    });
}

// -------------------------------------------------------------------- Faollik

function buildActivities(): Activity[] {
  const entries: [initials: string, bg: string, action: string, details: string, icon: string, minutesAgo: number][] = [
    ["AB", "bg-[#def0ea] text-[#317b68]", "Yangi buyurtma yaratildi", "#ORD-1098 · Texno Park do'koni", "Plus", 8],
    ["MP", "bg-[#fff0dc] text-[#bf7430]", "Xarajat tranzaksiyasi qo'shildi", "Ofis ijarasi · 8 500 000 so'm", "ArrowDownRight", 24],
    ["HR", "bg-[#eeeafd] text-[#6b61b7]", "Ta'til so'rovi tasdiqlandi", "Madina Rasulova · 5 ish kuni", "UsersRound", 62],
    ["SM", "bg-[#e3eefb] text-[#3f77ad]", "Bitim muvaffaqiyatli yopildi", "Smart Electronics · 24 000 000 so'm", "Handshake", 180],
    ["JT", "bg-[#fdeae9] text-[#b8564a]", "Mahsulot qoldig'i tanqis darajaga tushdi", "iPhone 15 Pro Max 256GB · 2 dona", "PackageMinus", 300],
    ["GA", "bg-[#def0ea] text-[#317b68]", "Oylik hisobot yuklandi", "Iyul oyi · moliya bo'limi", "Download", 420],
  ];

  return entries.map(([userInitials, userBgClass, action, details, icon, minutesAgo], index) => ({
    id: (index + 1).toString(),
    userId: `user${index + 1}`,
    userInitials,
    userBgClass,
    action,
    details,
    timestamp: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
    icon,
  }));
}

/** Barcha demo ma'lumotlarini bir marta quradi. */
export function buildSeedData() {
  const employees = buildEmployees();
  const salaryFund = employees.reduce((sum, e) => sum + e.salary, 0);
  const sellers = employees.filter((e) => e.department === "Savdo");

  const products = buildProducts();
  const customers = buildCustomers();
  const suppliers = buildSuppliers();
  const orders = buildOrders(customers, products, sellers);

  return {
    employees,
    products,
    customers,
    suppliers,
    branches: buildBranches(),
    orders,
    purchases: buildPurchases(suppliers, products, employees),
    invoices: buildInvoices(orders),
    attendance: buildAttendance(employees),
    leaveRequests: buildLeaveRequests(employees),
    users: buildUsers(employees),
    movements: buildMovements(products),
    deals: buildDeals(sellers),
    payrolls: buildPayrolls(employees),
    transactions: buildTransactions(salaryFund),
    activities: buildActivities(),
  };
}
