import { useEffect, useState } from "react";

/**
 * Qiymat o'zgarishini kechiktiradi.
 * Qidiruv maydonida har bir bosilgan harf uchun so'rov yuborilmasligi uchun ishlatiladi.
 */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
