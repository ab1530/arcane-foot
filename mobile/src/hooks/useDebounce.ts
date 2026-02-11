import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight debounce hook (drop-in replacement for `use-debounce` dependency)
 * Returns an array to stay compatible with the previous API.
 */
export const useDebounce = <T,>(value: T, delay = 300): [T] => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return [debouncedValue];
};

export default useDebounce;
