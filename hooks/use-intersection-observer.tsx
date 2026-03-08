"use client"

import { useCallback, useRef, useState } from "react"

interface UseIntersectionObserverProps {
  threshold?: number
  rootMargin?: string
}

export function useIntersectionObserver({ threshold = 0.1, rootMargin = "0px" }: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (node === elementRef.current) return;

      // Desconectar el observador previo si existe
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      elementRef.current = node;

      if (node) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            setIsIntersecting(entry.isIntersecting);
          },
          { rootMargin, threshold },
        );

        observer.observe(node);
        observerRef.current = observer;
      }
    },
    [rootMargin, threshold],
  );

  return { ref, isIntersecting }
}
