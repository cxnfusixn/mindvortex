"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useCopy } from "@/i18n/LocaleProvider";
import { vortexGeometry } from "./geometry";

/** Hero-only motion; the canonical circular blade geometry stays untouched. */
export function GalaxyVortex() {
  const { copy } = useCopy();
  const root = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const syncPlayback = useRef<() => void>(() => {});
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const element = root.current!;
    const media = gsap.matchMedia();
    media.add(
      {
        reduced: "(prefers-reduced-motion: reduce)",
        mobile: "(max-width: 767px)",
        desktop: "(min-width: 768px)",
      },
      (context) => {
        if (context.conditions?.reduced) {
          element.dataset.motion = "reduced";
          return;
        }
        const mobile = context.conditions?.mobile;
        const rotor = element.querySelector(".galaxy-rotor");
        const timelines: gsap.core.Animation[] = [
          gsap.fromTo(
            rotor,
            { scale: mobile ? 0.96 : 0.92, svgOrigin: "650 500" },
            {
              scale: mobile ? 1.02 : 1.04,
              duration: mobile ? 11.25 : 8,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              paused: true,
            },
          ),
          gsap.to(rotor, {
            rotation: 360,
            svgOrigin: "650 500",
            duration: mobile ? 90 : 64,
            repeat: -1,
            ease: "none",
            paused: true,
          }),
        ];
        element
          .querySelectorAll<SVGRectElement>(".galaxy-pixel")
          .forEach((pixel, index) => {
            if (mobile && index % 2) return;
            const x =
              pixel.x.baseVal.value + pixel.width.baseVal.value / 2 - 650;
            const y =
              pixel.y.baseVal.value + pixel.height.baseVal.value / 2 - 500;
            const length = Math.hypot(x, y) || 1;
            const distance = mobile ? 65 : 95 + (index % 4) * 12;
            const dx = (x / length) * distance - (y / length) * 35;
            const dy = (y / length) * distance + (x / length) * 35;
            const timeline = gsap.timeline({
              paused: true,
              delay: 0.8 + index * 0.29,
              repeat: -1,
              repeatDelay: 3 + (index % 4),
            });
            timeline
              .set(pixel, { transformOrigin: "50% 50%" })
              .to(pixel, {
                x: dx * 0.2,
                y: dy * 0.2,
                duration: 1.4,
                ease: "sine.in",
              })
              .to(pixel, {
                x: dx,
                y: dy,
                scale: 0.06,
                opacity: 0,
                rotation: 22,
                duration: 3.2,
                ease: "sine.out",
              })
              .set(pixel, { x: 0, y: 0, scale: 1, rotation: 0 })
              .to(pixel, { opacity: 1, duration: 1.2, ease: "sine.inOut" });
            timelines.push(timeline);
          });
        let inView = false;
        const sync = () => {
          const running = inView && !document.hidden && !paused.current;
          timelines.forEach((timeline) => timeline.paused(!running));
          element.dataset.motion = running ? "running" : "paused";
        };
        syncPlayback.current = sync;
        const observer = new IntersectionObserver(
          ([entry]) => {
            inView = entry.isIntersecting;
            sync();
          },
          { threshold: 0.05 },
        );
        observer.observe(element);
        document.addEventListener("visibilitychange", sync);
        return () => {
          observer.disconnect();
          document.removeEventListener("visibilitychange", sync);
          syncPlayback.current = () => {};
        };
      },
    );
    return () => media.revert();
  }, []);

  return (
    <div ref={root} className="galaxy-vortex">
      <span className="vortex-logo" aria-hidden="true">
        <svg viewBox="385 235 530 530" fill="none" focusable="false">
          <g className="galaxy-rotor">
            {vortexGeometry.map((element, index) => {
              if (element.tag === "path") {
                const { id, ...attributes } = element.attributes;
                return (
                  <path
                    key={id}
                    {...attributes}
                    shapeRendering="geometricPrecision"
                  />
                );
              }
              return (
                <rect
                  key={index}
                  {...element.attributes}
                  className="galaxy-pixel"
                  shapeRendering="geometricPrecision"
                />
              );
            })}
          </g>
        </svg>
      </span>
      <button
        type="button"
        className="galaxy-toggle"
        aria-label={isPaused ? copy.hero.resumeMotion : copy.hero.pauseMotion}
        title={isPaused ? copy.hero.resumeMotion : copy.hero.pauseMotion}
        onClick={() => {
          paused.current = !paused.current;
          setIsPaused(paused.current);
          syncPlayback.current();
        }}
      >
        <span aria-hidden="true">{isPaused ? "▷" : "Ⅱ"}</span>
      </button>
    </div>
  );
}
