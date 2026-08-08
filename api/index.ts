// @ts-nocheck
// Vercel serverless funksiya entry.
// Haqiqiy Express ilovasi `vite.config.vercel.ts` orqali bitta `.mjs` faylga
// bundle qilinadi. Bu yerda faqat shu tayyor bundle'ni re-export qilamiz.
export { default } from "./_bundle/index.func.mjs";
