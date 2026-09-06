"use client";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import type { ReactNode } from "react";
import { useCopy } from "@/i18n/LocaleProvider";
export function MagneticButton({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  const { copy } = useCopy();
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 20 });
  const sy = useSpring(y, { stiffness: 220, damping: 20 });
  return (
    <motion.a
      href={href}
      className={`magnetic-button ${className}`}
      style={{ x: sx, y: sy }}
      data-cursor={copy.enter}
      onPointerMove={(e) => {
        if (reduced || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.12);
        y.set((e.clientY - r.top - r.height / 2) * 0.16);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.a>
  );
}
