import winston from "winston";
import { resolve } from "path";
import { mkdirSync } from "fs";

const logDir = resolve(process.cwd(), "logs");
mkdirSync(logDir, { recursive: true });

const logLevel = process.env.LOG_LEVEL || "info";
const logFile = process.env.LOG_FILE_PATH || "./logs/app.log";

/**
 * Markaziy logging tizimi.
 * Console va faylga yozadi, production'da faqat error+ saqlanadi.
 */
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Faylga yozish
    new winston.transports.File({
      filename: resolve(logFile),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    // Error'lar alohida
    new winston.transports.File({
      filename: resolve(logDir, "error.log"),
      level: "error",
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
});

// Development'da console'ga ham yozamiz
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/**
 * Express middleware uchun request logger
 */
export function logRequest(
  req: { method: string; originalUrl: string; ip?: string },
  res: { statusCode: number },
  duration: number
) {
  const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
  
  logger.log(level, "HTTP Request", {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
  });
}
