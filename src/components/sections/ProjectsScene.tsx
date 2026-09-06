"use client";
import { useCopy } from "@/i18n/LocaleProvider";
import { subprojects } from "@/data/subprojects";
import { LiveProject } from "./LiveProject";

export function ProjectsScene() {
  const { copy, locale } = useCopy();
  return (
    <section
      id="work"
      className="projects scene section-pad"
      data-scene="05"
      aria-labelledby="projects-title"
    >
      <div className="section-heading">
        <h2 className="terminal-label" id="projects-title">
          {copy.work.label}
        </h2>
        <span className="terminal-label">NEXT.JS / DESIGN / DEVELOPMENT</span>
      </div>
      <div className="projects-intro">
        <h3>
          {copy.work.title[0]}
          <br />
          <span className="green">{copy.work.title[1]}</span>
        </h3>
        <p>
          {copy.work.copy[0]}
          <br />
          {copy.work.copy[1]}
        </p>
      </div>
      <div
        className="live-project-track"
        tabIndex={0}
        role="region"
        aria-label={
          locale === "pl"
            ? "Projekty — przewijaj poziomo"
            : "Projects — scroll horizontally"
        }
        data-lenis-prevent
      >
        {subprojects.map((project, index) => (
          <LiveProject key={project.id} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}
