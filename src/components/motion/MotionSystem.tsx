"use client";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLenis } from "@/hooks/useLenis";
export function MotionSystem() {
  useLenis();
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
        gsap.from(el, {
          y: 38,
          opacity: 0.15,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        }),
      );
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count);
        const value = { n: 0 };
        gsap.to(value, {
          n: target,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = `${Math.round(value.n).toString().padStart(2, "0")}+`;
          },
        });
      });
    });
    media.add(
      "(min-width: 1000px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)",
      () => {
        gsap.to(".hero-line:first-child", {
          x: -75,
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
        gsap.to(".hero-line:last-child", {
          x: 80,
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
        gsap.utils.toArray<HTMLElement>(".manifesto-line").forEach((el) =>
          gsap.fromTo(
            el,
            { opacity: 0.2 },
            {
              opacity: 1,
              scrollTrigger: {
                trigger: el,
                start: "top 80%",
                end: "top 48%",
                scrub: true,
              },
            },
          ),
        );
      },
    );
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    return () => media.revert();
  }, []);
  return null;
}
