"use client";

import { useEffect, useRef, useState } from "react";

export default function useAppearOnView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement | null>(null);
  const [appeared, setAppeared] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || appeared) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setAppeared(true);
          observer.disconnect();
        }
      },
      {
        root: options?.root ?? null,
        rootMargin: options?.rootMargin ?? "0px",
        threshold: options?.threshold ?? 0.05,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options, appeared]);

  return { ref, appeared } as const;
}
