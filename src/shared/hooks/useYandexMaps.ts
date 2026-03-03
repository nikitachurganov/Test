import { useEffect, useState } from 'react';

type YMapsApi = typeof window extends { ymaps: infer T } ? T : any;

const YMAPS_SRC = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';

let ymapsLoadPromise: Promise<YMapsApi | null> | null = null;

const loadYandexMaps = (): Promise<YMapsApi | null> => {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if ((window as any).ymaps && typeof (window as any).ymaps.ready === 'function') {
    return new Promise((resolve) => {
      (window as any).ymaps.ready(() => resolve((window as any).ymaps));
    });
  }

  if (ymapsLoadPromise) return ymapsLoadPromise;

  ymapsLoadPromise = new Promise<YMapsApi | null>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${YMAPS_SRC}"]`,
    );

    const handleReady = () => {
      const ymaps = (window as any).ymaps;
      if (ymaps && typeof ymaps.ready === 'function') {
        ymaps.ready(() => resolve(ymaps));
      } else {
        resolve(ymaps ?? null);
      }
    };

    if (existing) {
      existing.addEventListener('load', handleReady, { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Yandex Maps script failed to load')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = YMAPS_SRC;
    script.async = true;
    script.addEventListener('load', handleReady, { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error('Yandex Maps script failed to load')),
      { once: true },
    );

    document.head.appendChild(script);
  });

  return ymapsLoadPromise;
};

export const useYandexMaps = () => {
  const [ymaps, setYmaps] = useState<YMapsApi | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    setIsLoading(true);

    loadYandexMaps()
      .then((api) => {
        if (!isMounted) return;
        setYmaps(api);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error('Yandex Maps load error'));
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { ymaps, isLoading, error };
};

