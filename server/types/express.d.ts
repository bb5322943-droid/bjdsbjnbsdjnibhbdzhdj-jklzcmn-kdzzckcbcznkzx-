import { StoredUser } from "@shared/api";

/**
 * `requireAuth` middleware sessiya egasini shu maydonga qo'yadi,
 * shuning uchun route'lar uni tipdan chiqarib olishi mumkin.
 */
declare global {
  namespace Express {
    interface Request {
      currentUser?: StoredUser;
    }
  }
}

export {};
