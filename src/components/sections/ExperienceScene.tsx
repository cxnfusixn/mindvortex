"use client";
import { useCopy } from "@/i18n/LocaleProvider";
export function ExperienceScene() {
  const { copy } = useCopy();
  return (
    <section
      id="experience"
      className="experience scene section-pad"
      data-scene="04"
      aria-labelledby="experience-title"
    >
      <div className="section-heading">
        <h2 id="experience-title" className="terminal-label">
          {copy.experience.label}
        </h2>
        <span className="terminal-label">{copy.experience.aside}</span>
      </div>
      <div className="experience-counts">
        <div>
          <span className="counter" data-count="9">
            09+
          </span>
          <p className="terminal-label">{copy.experience.software}</p>
        </div>
        <span className="experience-times">×</span>
        <div>
          <span className="counter" data-count="5">
            05+
          </span>
          <p className="terminal-label">{copy.experience.design}</p>
        </div>
      </div>
    </section>
  );
}
