import path from "node:path";
import { createServer } from "./index";
import { closeDatabase } from "./data/db";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Build qilingan frontend fayllari
app.use(express.static(distPath, {
  setHeaders: (res, filepath) => {
    // CSS fayllar uchun to'g'ri MIME type
    if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    // JS fayllar uchun
    if (filepath.endsWith('.js') || filepath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

/**
 * SPA fallback: `/orders` kabi client-side yo'llar to'g'ridan-to'g'ri ochilganda
 * ham index.html qaytariladi va React Router yo'lni o'zi hal qiladi.
 *
 * Bu yerda `app.get("*")` ishlatilmaydi — Express 5 nomsiz wildcard'ni qabul
 * qilmaydi va server ishga tushmay qoladi. Middleware bu cheklovdan xoli.
 */
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();

  // API yo'llari shu yerga yetib kelsa — bunday endpoint yo'q.
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "Endpoint topilmadi" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM signal qabul qilindi, graceful shutdown...");
  
  try {
    closeDatabase();
    console.log("✅ Database connection yopildi");
  } catch (error) {
    console.error("⚠️ Database yopishda xatolik:", error);
  }
  
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT signal qabul qilindi, graceful shutdown...");
  
  try {
    closeDatabase();
    console.log("✅ Database connection yopildi");
  } catch (error) {
    console.error("⚠️ Database yopishda xatolik:", error);
  }
  
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
