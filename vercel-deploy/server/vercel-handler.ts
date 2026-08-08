import { createServer } from "./index";

/**
 * Vercel serverless handler — Express ilovasining o'zi `(req, res)` funksiyasi,
 * shuning uchun uni to'g'ridan-to'g'ri qaytaramiz. Body'ni Express o'zi o'qiydi
 * (`server/index.ts` dagi maxsus body-parser Vercel muhitini ham qamraydi).
 */
const app = createServer();

export default app;
