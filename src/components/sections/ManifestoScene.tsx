"use client";
import { useCopy } from "@/i18n/LocaleProvider";
export function ManifestoScene() {
  const { copy } = useCopy();
  return (
    <section
      id="about"
      className="manifesto scene section-pad"
      data-scene="02"
      aria-labelledby="manifesto-title"
    >
      <div className="section-heading terminal-label">
        <span>{copy.manifesto.label}</span>
        <span>{copy.manifesto.aside}</span>
      </div>
      <h2 id="manifesto-title">
        <span className="manifesto-line">{copy.manifesto.lines[0]}</span>
        <span className="manifesto-line">
          {copy.manifesto.lines[1]}{" "}
          <span className="muted">{copy.manifesto.lines[2]}</span>
        </span>
        <span className="manifesto-line green">{copy.manifesto.lines[3]}</span>
      </h2>
      <div className="manifesto-bottom" data-reveal>
        <div className="terminal-label">
          {copy.manifesto.fields[0]}
          <br />
          {copy.manifesto.fields[1]}
          <br />
          <span className="green">{copy.manifesto.fields[2]}</span>
        </div>
        <p>
          {copy.manifesto.copy}
          <br />
          <strong>{copy.manifesto.ending}</strong>
        </p>
        <span className="asterisk" aria-hidden="true">
          ✳
        </span>
      </div>
    </section>
  );
}
