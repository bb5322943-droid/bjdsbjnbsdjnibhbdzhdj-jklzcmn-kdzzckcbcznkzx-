import { defineConfig } from "vite";
import path from "node:path";

/**
 * Vercel serverless funksiyasi uchun build.
 *
 * `@vercel/node` xom TypeScript'ni bundle qilmasdan ESM sifatida ishga tushiradi
 * va kengaytmasiz nisbiy importlarni (`../server/index`) hal qila olmaydi.
 * Shuning uchun butun Express ilovasini shu yerda bitta `.mjs` faylga yig'amiz —
 * natijada funksiya ichida hech qanday hal qilinmagan import qolmaydi.
 *
 * Chiqish: `api/_bundle/index.func.mjs` — uni `vercel.json` funksiya sifatida
 * ishlatadi. `express`/`cors` ham bundle ichiga kiritiladi (Vercel'da alohida
 * `node_modules` bo'lmasligi mumkin), faqat `node:` built-in'lar tashqarida.
 */
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/vercel-handler.ts"),
      formats: ["es"],
    },
    outDir: "api",
    target: "node22",
    ssr: true,
    rollupOptions: {
      // Faqat Node built-in'lar tashqarida — qolgani bundle'ga kiradi.
      external: [/^node:/],
      output: {
        entryFileNames: "index.mjs",
      },
    },
    minify: false,
    sourcemap: false,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
