"use client";
import { useCopy } from "@/i18n/LocaleProvider";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { VortexLogo } from "@/components/vortex/VortexLogo";
export function CinematicIntro() {
  const { copy } = useCopy();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("mv-intro") === "1";
      sessionStorage.setItem("mv-intro", "1");
    } catch {}
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const ctx = gsap.context(() => {
      gsap.set(ref.current, { visibility: "visible" });
      gsap
        .timeline()
        .from(".intro .vortex-logo", {
          opacity: 0,
          duration: 0.85,
          ease: "power3.out",
        })
        .from(".intro-line", { opacity: 0, y: 10, duration: 0.3 }, 0.3)
        .to(
          ref.current,
          { yPercent: -100, duration: 0.65, ease: "power4.inOut" },
          1.15,
        )
        .set(ref.current, { visibility: "hidden" });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} className="intro" aria-hidden="true">
      <div>
        <VortexLogo />
        <p className="terminal-label">MIND VORTEX · SYSTEM // 2026</p>
        <p className="intro-line">
          &gt; {copy.intro}
          <span className="blink">_</span>
        </p>
      </div>
    </div>
  );
}
