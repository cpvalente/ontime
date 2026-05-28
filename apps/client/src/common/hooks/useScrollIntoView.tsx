import { useEffect, useRef } from 'react';

export default function useScrollIntoView<T extends HTMLElement>(
  name: string,
  location?: string,
  onVisible?: (name: string) => void,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (location && ref.current) {
      if (location === name) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [location, name]);

  useEffect(() => {
    if (!ref.current || !onVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible(name);
      },
      { threshold: 0.3, rootMargin: '0px 0px -40% 0px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [name, onVisible]);

  return ref;
}
