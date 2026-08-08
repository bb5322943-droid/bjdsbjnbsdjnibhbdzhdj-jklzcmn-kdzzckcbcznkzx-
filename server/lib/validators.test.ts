import { describe, it, expect } from "vitest";
import {
  loginSchema,
  changePasswordSchema,
  createUserSchema,
  createEmployeeSchema,
  createProductSchema,
  createCustomerSchema,
  createTransactionSchema,
  paginationSchema,
} from "./validators";

describe("Validators", () => {
  describe("loginSchema", () => {
    it("valid login ma'lumotlarini qabul qiladi", () => {
      const data = {
        email: "user@company.uz",
        password: "password123",
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("noto'g'ri email formatini rad etadi", () => {
      const data = {
        email: "notanemail",
        password: "password123",
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("qisqa parolni rad etadi", () => {
      const data = {
        email: "user@company.uz",
        password: "short",
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("changePasswordSchema", () => {
    it("kuchli parolni qabul qiladi", () => {
      const data = {
        oldPassword: "OldPass123!",
        newPassword: "NewPass123!",
      };
      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("katta harf bo'lmagan parolni rad etadi", () => {
      const data = {
        oldPassword: "OldPass123!",
        newPassword: "newpass123!",
      };
      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("raqam bo'lmagan parolni rad etadi", () => {
      const data = {
        oldPassword: "OldPass123!",
        newPassword: "NewPassword!",
      };
      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("maxsus belgi bo'lmagan parolni rad etadi", () => {
      const data = {
        oldPassword: "OldPass123!",
        newPassword: "NewPass123",
      };
      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("createEmployeeSchema", () => {
    it("to'g'ri xodim ma'lumotlarini qabul qiladi", () => {
      const data = {
        name: "Sardor Mahmudov",
        position: "Developer",
        department: "IT",
        salary: 8000000,
        email: "sardor@company.uz",
        phone: "+998901234567",
        hireDate: "2026-08-01",
      };
      const result = createEmployeeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("manfiy maoshni rad etadi", () => {
      const data = {
        name: "Test User",
        position: "Developer",
        department: "IT",
        salary: -1000,
        email: "test@company.uz",
        phone: "+998901234567",
        hireDate: "2026-08-01",
      };
      const result = createEmployeeSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("noto'g'ri telefon formatini rad etadi", () => {
      const data = {
        name: "Test User",
        position: "Developer",
        department: "IT",
        salary: 8000000,
        email: "test@company.uz",
        phone: "invalid-phone",
        hireDate: "2026-08-01",
      };
      const result = createEmployeeSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("createProductSchema", () => {
    it("to'g'ri mahsulot ma'lumotlarini qabul qiladi", () => {
      const data = {
        name: "Samsung Galaxy A54",
        category: "Telefonlar",
        price: 5000000,
        quantity: 15,
        minQuantity: 5,
        location: "A-1-5",
        supplier: "Samsung",
      };
      const result = createProductSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("manfiy narxni rad etadi", () => {
      const data = {
        name: "Test Product",
        category: "Test",
        price: -100,
        quantity: 10,
        minQuantity: 5,
        location: "A-1",
        supplier: "Supplier",
      };
      const result = createProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("manfiy miqdorni rad etadi", () => {
      const data = {
        name: "Test Product",
        category: "Test",
        price: 100000,
        quantity: -5,
        minQuantity: 5,
        location: "A-1",
        supplier: "Supplier",
      };
      const result = createProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("paginationSchema", () => {
    it("default qiymatlarni qo'llaydi", () => {
      const data = {};
      const result = paginationSchema.parse(data);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("string'ni number'ga aylantiradi", () => {
      const data = { page: "2", limit: "50" };
      const result = paginationSchema.parse(data);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it("100 dan katta limit'ni rad etadi", () => {
      const data = { limit: 150 };
      const result = paginationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("manfiy page'ni rad etadi", () => {
      const data = { page: -1 };
      const result = paginationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("createTransactionSchema", () => {
    it("to'g'ri tranzaksiya ma'lumotlarini qabul qiladi", () => {
      const data = {
        title: "Mahsulot sotish",
        category: "Savdo",
        account: "Naqd pul",
        amount: 5000000,
        type: "income",
        date: "2026-08-05",
      };
      const result = createTransactionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("noto'g'ri type'ni rad etadi", () => {
      const data = {
        title: "Test",
        category: "Test",
        account: "Test",
        amount: 100000,
        type: "invalid",
        date: "2026-08-05",
      };
      const result = createTransactionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("noto'g'ri sana formatini rad etadi", () => {
      const data = {
        title: "Test",
        category: "Test",
        account: "Test",
        amount: 100000,
        type: "income",
        date: "05-08-2026",
      };
      const result = createTransactionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
