"use client";
import { useCopy } from "@/i18n/LocaleProvider";
import { GalaxyVortex } from "@/components/vortex/GalaxyVortex";
import { MagneticButton } from "@/components/ui/MagneticButton";
export function HeroScene() {
  const { copy } = useCopy();
  return (
    <section
      id="home"
      className="hero scene"
      data-scene="01"
      aria-labelledby="hero-title"
    >
      <div className="hero-top terminal-label">
        <span>
          <i className="status-dot" /> {copy.hero.studio}
        </span>
        <span>{copy.hero.disciplines}</span>
      </div>
      <div className="hero-title-wrap">
        <p className="hero-kicker terminal-label">{copy.hero.kicker}</p>
        <h1 id="hero-title">
          <span className="hero-line">{copy.hero.lines[0]}</span>
          <span className="hero-line middle">{copy.hero.lines[1]}</span>
          <span className="hero-line">
            {copy.hero.lines[2]}
            <span className="green">.</span>
          </span>
        </h1>
      </div>
      <div className="hero-symbol">
        <span className="cross cross-one" aria-hidden="true">
          +
        </span>
        <span className="cross cross-two" aria-hidden="true">
          +
        </span>
        <div className="hero-symbol-inner">
          <GalaxyVortex />
        </div>
        <span className="symbol-label terminal-label">{copy.hero.symbol}</span>
      </div>
      <div className="hero-bottom">
        <a href="#about" className="scroll-indicator terminal-label">
          {copy.hero.scroll} <span>↓</span>
        </a>
        <p>{copy.hero.copy}</p>
        <div className="hero-actions">
          <MagneticButton href="#work">
            &gt; {copy.hero.explore} <span>↗</span>
          </MagneticButton>
          <a className="terminal-link" href="#contact">
            {copy.hero.contact} <span>↗</span>
          </a>
        </div>
      </div>
      <div className="hero-foot terminal-label">
        <span>{copy.hero.location}</span>
        <span>{copy.hero.chapter}</span>
        <span>{copy.hero.fields}</span>
      </div>
    </section>
  );
}
