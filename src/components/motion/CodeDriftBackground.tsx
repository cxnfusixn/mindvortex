"use client";

import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/i18n/LocaleProvider";
import { createMatrixRain } from "@/lib/matrix-rain";

export function CodeDriftBackground() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const playback = useRef<ReturnType<typeof createMatrixRain> | null>(null);
  const [paused, setPaused] = useState(false);
  const { locale } = useCopy();
  useEffect(() => {
    const rain = createMatrixRain(canvas.current!);
    playback.current = rain;
    return () => { rain.destroy(); playback.current = null; };
  }, []);

  return (
    <>
      <canvas ref={canvas} className="code-drift-background" aria-hidden="true" />
      <button
        type="button"
        className="ambient-background-toggle terminal-label"
        aria-pressed={paused}
        aria-label={locale === "pl" ? "Wstrzymaj animację kodu w tle" : "Pause background code animation"}
        onClick={() => {
          playback.current?.setPaused(!paused);
          setPaused(!paused);
        }}
      >
        <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span> CODE / {paused ? "OFF" : "ON"}
      </button>
    </>
  );
}
