"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
export function useLenis() {
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
      () => {
        const lenis = new Lenis({ duration: 1.05, anchors: true });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        return () => {
          gsap.ticker.remove(tick);
          lenis.destroy();
        };
      },
    );
    return () => media.revert();
  }, []);
}
