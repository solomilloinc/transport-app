"use client";

import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";
import { JSX } from "react";

interface AnimatedSectionProps extends HTMLAttributes<HTMLElement> {
  animation?: "fade-up" | "fade-in" | "slide-in-right" | "slide-in-left";
  delay?: number;
  threshold?: number;
  as?: keyof JSX.IntrinsicElements;
}

export const AnimatedSection = forwardRef<HTMLElement, AnimatedSectionProps>(
  (
    {
      animation = "fade-up",
      delay = 0,
      threshold = 0.1,
      as = "section",
      className,
      children,
      ...props
    },
    forwardedRef
  ) => {
    const { ref, isIntersecting } = useIntersectionObserver({ threshold });

    const Component = as as any;

    const animationClasses = {
      "fade-up":
        "opacity-0 translate-y-10 transition-all duration-700 ease-out",
      "fade-in": "opacity-0 transition-opacity duration-700 ease-out",
      "slide-in-right":
        "opacity-0 translate-x-10 transition-all duration-700 ease-out",
      "slide-in-left":
        "opacity-0 -translate-x-10 transition-all duration-700 ease-out",
    };

    const activeClasses = {
      "fade-up": "opacity-100 translate-y-0",
      "fade-in": "opacity-100",
      "slide-in-right": "opacity-100 translate-x-0",
      "slide-in-left": "opacity-100 translate-x-0",
    };

    return (
      <Component
        ref={(node: HTMLElement) => {
          ref.current = node;
          if (typeof forwardedRef === "function") {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        className={cn(
          animationClasses[animation],
          isIntersecting && activeClasses[animation],
          className
        )}
        style={{
          transitionDelay: `${delay}ms`,
        }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

AnimatedSection.displayName = "AnimatedSection";
