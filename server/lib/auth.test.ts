import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  verifyAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "./auth";
import { closeDatabase } from "../data/db";

describe("Auth", () => {
  afterAll(() => {
    closeDatabase();
  });

  describe("Password Hashing", () => {
    it("parolni hash qiladi", () => {
      const password = "MyPassword123!";
      const hash = hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash).toContain(":");
    });

    it("har gal boshqa hash yaratadi (random salt)", () => {
      const password = "MyPassword123!";
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it("to'g'ri parolni tasdiqlaydi", () => {
      const password = "MyPassword123!";
      const hash = hashPassword(password);
      const isValid = verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("noto'g'ri parolni rad etadi", () => {
      const password = "MyPassword123!";
      const hash = hashPassword(password);
      const isValid = verifyPassword("WrongPassword", hash);

      expect(isValid).toBe(false);
    });

    it("bo'sh hash'ni rad etadi", () => {
      const isValid = verifyPassword("password", "");
      expect(isValid).toBe(false);
    });

    it("noto'g'ri formatdagi hash'ni rad etadi", () => {
      const isValid = verifyPassword("password", "invalid-hash");
      expect(isValid).toBe(false);
    });
  });

  describe("JWT Tokens", () => {
    const mockPayload = {
      userId: "user_123",
      email: "test@company.uz",
      role: "admin",
    };

    it("access token yaratadi", () => {
      const token = createAccessToken(mockPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("access token'ni verify qiladi", () => {
      const token = createAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.role).toBe(mockPayload.role);
    });

    it("noto'g'ri access token'ni rad etadi", () => {
      const decoded = verifyAccessToken("invalid-token");
      expect(decoded).toBeNull();
    });

    it("refresh token yaratadi va bazaga yozadi", async () => {
      const token = await createRefreshToken(mockPayload.userId);
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("refresh token'ni verify qiladi", async () => {
      const token = await createRefreshToken(mockPayload.userId);
      const userId = await verifyRefreshToken(token);

      expect(userId).toBe(mockPayload.userId);
    });

    it("noto'g'ri refresh token'ni rad etadi", async () => {
      const userId = await verifyRefreshToken("invalid-token");
      expect(userId).toBeNull();
    });
  });
});
