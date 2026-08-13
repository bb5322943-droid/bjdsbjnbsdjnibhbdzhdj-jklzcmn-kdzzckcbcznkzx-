/**
 * Product quantity cache for handling serverless DB reset issues
 * This ensures product quantities persist across page refreshes
 */

interface ProductQuantityCache {
  [productId: string]: {
    quantity: number;
    timestamp: number;
  };
}

const CACHE_KEY = 'product-quantities-cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function getCachedQuantity(productId: string): number | null {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) return null;

    const parsed: ProductQuantityCache = JSON.parse(cache);
    const item = parsed[productId];

    if (!item) return null;

    // Check if cache is expired
    if (Date.now() - item.timestamp > CACHE_EXPIRY) {
      delete parsed[productId];
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      return null;
    }

    return item.quantity;
  } catch {
    return null;
  }
}

export function setCachedQuantity(productId: string, quantity: number): void {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    const parsed: ProductQuantityCache = cache ? JSON.parse(cache) : {};

    parsed[productId] = {
      quantity,
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error('Failed to cache product quantity:', error);
  }
}

export function clearProductCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear product cache:', error);
  }
}

export function applyQuantityCache<T extends { id: string; quantity: number }>(
  products: T[]
): T[] {
  return products.map((product) => {
    const cachedQuantity = getCachedQuantity(product.id);
    if (cachedQuantity !== null) {
      return { ...product, quantity: cachedQuantity };
    }
    return product;
  });
}
