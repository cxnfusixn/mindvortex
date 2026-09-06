"use client";
import { useCopy } from "@/i18n/LocaleProvider";
export function PhilosophyScene() {
  const { copy } = useCopy();
  return (
    <section
      id="philosophy"
      className="philosophy scene section-pad"
      data-scene="07"
      aria-labelledby="philosophy-title"
    >
      <span className="terminal-label">{copy.philosophy.label}</span>
      <h2 id="philosophy-title" data-reveal>
        {copy.philosophy.lines[0]}
        <br />
        <span>{copy.philosophy.lines[1]}</span>
        <br />
        {copy.philosophy.lines[2]}
        <br />
        <br />
        {copy.philosophy.lines[3]}
        <br />
        <span>{copy.philosophy.lines[4]}</span>
        <br />
        {copy.philosophy.lines[5]}
      </h2>
      <p data-reveal>
        {copy.philosophy.ending[0]} <span>{copy.philosophy.ending[1]}</span>
        <span className="philosophy-square" aria-hidden="true" />
      </p>
      <span className="terminal-label philosophy-end">
        {copy.philosophy.aside}
      </span>
    </section>
  );
}
