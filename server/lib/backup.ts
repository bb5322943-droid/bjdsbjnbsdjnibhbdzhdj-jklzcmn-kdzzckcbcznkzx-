import { mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { resolve, join } from "node:path";
import { logger } from "./logger";
import * as schedule from "node-schedule";

/**
 * Avtomatik backup tizimi.
 * 
 * Har kuni belgilangan vaqtda database faylining nusxasini oladi.
 * Eski backuplar avtomatik o'chiriladi (retention policy).
 */

const BACKUP_DIR = resolve(process.cwd(), "backups");
const DB_PATH = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : resolve(process.cwd(), "data", "app.db");

const BACKUP_ENABLED = process.env.BACKUP_ENABLED === "true";
const BACKUP_SCHEDULE = process.env.BACKUP_SCHEDULE || "0 2 * * *"; // Har kuni soat 2:00 da
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || "30");

/**
 * Backup scheduler'ni ishga tushiradi.
 * Environment variable orqali o'chirib qo'yish mumkin.
 */
export function startBackupScheduler(): void {
  if (!BACKUP_ENABLED) {
    logger.info("Backup scheduler o'chirilgan (BACKUP_ENABLED=false)");
    return;
  }

  try {
    // Backup papkasini yaratish
    mkdirSync(BACKUP_DIR, { recursive: true });
    
    // Cron schedule bo'yicha backup olish
    schedule.scheduleJob(BACKUP_SCHEDULE, () => {
      try {
        createBackup();
        cleanOldBackups();
      } catch (error) {
        logger.error("Backup jarayonida xatolik:", error);
      }
    });

    logger.info(`Backup scheduler ishga tushdi: ${BACKUP_SCHEDULE}`);
    logger.info(`Backup retention: ${BACKUP_RETENTION_DAYS} kun`);
  } catch (error) {
    logger.error("Backup scheduler'ni ishga tushirishda xatolik:", error);
  }
}

/**
 * Database faylining nusxasini oladi.
 * Fayl nomi: app_YYYY-MM-DD_HH-mm-ss.db
 */
export function createBackup(): string {
  try {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "")
      .replace("T", "_");
    
    const backupFileName = `app_${timestamp}.db`;
    const backupPath = join(BACKUP_DIR, backupFileName);

    // Database faylini nusxalash
    copyFileSync(DB_PATH, backupPath);
    
    const stats = statSync(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    logger.info(`✅ Backup yaratildi: ${backupFileName} (${sizeMB} MB)`);
    
    return backupPath;
  } catch (error) {
    logger.error("Backup yaratishda xatolik:", error);
    throw error;
  }
}

/**
 * Eski backuplarni retention policy bo'yicha o'chiradi.
 * Retention days'dan eskiroq backuplar o'chiriladi.
 */
export function cleanOldBackups(): void {
  try {
    const files = readdirSync(BACKUP_DIR);
    const now = Date.now();
    const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;
    
    for (const file of files) {
      if (!file.endsWith(".db")) continue;
      
      const filePath = join(BACKUP_DIR, file);
      const stats = statSync(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > retentionMs) {
        unlinkSync(filePath);
        deletedCount++;
        logger.info(`🗑️  Eski backup o'chirildi: ${file}`);
      }
    }
    
    if (deletedCount > 0) {
      logger.info(`Jami ${deletedCount} ta eski backup o'chirildi`);
    }
  } catch (error) {
    logger.error("Eski backuplarni tozalashda xatolik:", error);
  }
}

/**
 * Mavjud backuplar ro'yxatini qaytaradi.
 */
export function listBackups(): Array<{ name: string; size: number; date: Date }> {
  try {
    mkdirSync(BACKUP_DIR, { recursive: true });
    
    const files = readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.endsWith(".db"))
      .map(file => {
        const filePath = join(BACKUP_DIR, file);
        const stats = statSync(filePath);
        return {
          name: file,
          size: stats.size,
          date: stats.mtime,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return backups;
  } catch (error) {
    logger.error("Backuplar ro'yxatini olishda xatolik:", error);
    return [];
  }
}

/**
 * Backupdan database'ni tiklaydi.
 * DIQQAT: Bu mavjud database'ni to'liq almashtiradi!
 */
export function restoreBackup(backupFileName: string): void {
  try {
    const backupPath = join(BACKUP_DIR, backupFileName);
    
    if (!backupPath.endsWith(".db")) {
      throw new Error("Faqat .db fayllar restore qilish mumkin");
    }
    
    // Backup faylini tekshirish
    const stats = statSync(backupPath);
    if (!stats.isFile()) {
      throw new Error("Backup fayli topilmadi");
    }
    
    // Hozirgi database'ning backup'ini olish (xavfsizlik uchun)
    const emergencyBackup = `emergency_${Date.now()}.db`;
    copyFileSync(DB_PATH, join(BACKUP_DIR, emergencyBackup));
    logger.info(`⚠️  Emergency backup yaratildi: ${emergencyBackup}`);
    
    // Backup'dan tiklash
    copyFileSync(backupPath, DB_PATH);
    
    logger.info(`✅ Database tiklandi: ${backupFileName}`);
  } catch (error) {
    logger.error("Backup'dan tiklashda xatolik:", error);
    throw error;
  }
}
