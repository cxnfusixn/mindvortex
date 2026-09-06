"use client";
import { useEffect, useRef } from "react";
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia(
      "(pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!media.matches) return;
    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const target = (e.target as Element).closest<HTMLElement>(
        "[data-cursor]",
      );
      el.style.transform = `translate3d(${e.clientX + 18}px,${e.clientY + 18}px,0)`;
      el.textContent = target?.dataset.cursor || "";
      el.dataset.active = String(!!target);
    };
    const hide = () => {
      if (ref.current) ref.current.dataset.active = "false";
    };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", hide);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
    };
  }, []);
  return (
    <div
      className="custom-cursor terminal-label"
      ref={ref}
      aria-hidden="true"
    />
  );
}
