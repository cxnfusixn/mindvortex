"use client";
import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/i18n/LocaleProvider";
import { subprojects } from "@/data/subprojects";

const labels = {
  pl: {
    live: "ŻYWA STRONA",
    open: "Otwórz pełną stronę",
    hint: "Przewijaj i klikaj wewnątrz podglądu",
    loading: "Ładowanie strony…",
    desktop: "Desktop",
    mobile: "Mobile",
    note: "Wersja demonstracyjna. Formularze nie wysyłają zgłoszeń.",
  },
  en: {
    live: "LIVE WEBSITE",
    open: "Open full website",
    hint: "Scroll and click inside the preview",
    loading: "Loading website…",
    desktop: "Desktop",
    mobile: "Mobile",
    note: "Demo version. Forms do not send submissions.",
  },
};

export function LiveProject({
  project,
  index,
}: {
  project: (typeof subprojects)[number];
  index: number;
}) {
  const { locale } = useCopy();
  const copy = labels[locale];
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mobile, setMobile] = useState(false);
  const viewport = mobile
    ? { width: 390, height: 844 }
    : { width: 1920, height: 1080 };
  const scale = availableWidth
    ? Math.min(availableWidth / viewport.width, 1)
    : 0;
  const url = `/previews/${project.id}/`;
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setAvailableWidth(entry.contentRect.width),
    );
    observer.observe(stage.current!);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(root.current!);
    return () => observer.disconnect();
  }, []);
  return (
    <article
      ref={root}
      className="live-project"
      id={`project-${project.id}`}
      aria-labelledby={`${project.id}-title`}
    >
      <div className="live-project-heading">
        <div>
          <span className="terminal-label green">
            PROJECT_00{index + 1} / {copy.live}
          </span>
          <h4 id={`${project.id}-title`}>{project.title}</h4>
          <span className="terminal-label">{project.subtitle[locale]}</span>
        </div>
        <div>
          <p>{project.description[locale]}</p>
          <ul className="subproject-stack terminal-label">
            {project.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="live-toolbar">
        <span className="terminal-label">{copy.hint}</span>
        <div className="live-actions">
          <button
            type="button"
            aria-pressed={!mobile}
            onClick={() => setMobile(false)}
          >
            {copy.desktop}
          </button>
          <button
            type="button"
            aria-pressed={mobile}
            onClick={() => setMobile(true)}
          >
            {copy.mobile}
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {copy.open} ↗
          </a>
        </div>
      </div>
      <div
        ref={stage}
        className={`live-stage ${mobile ? "mobile-preview" : ""}`}
        style={{ height: scale ? viewport.height * scale : undefined }}
        data-lenis-prevent
      >
        {!loaded && (
          <span className="live-loading terminal-label" role="status">
            {copy.loading}
          </span>
        )}
        {mounted && (
          <iframe
            src={url}
            title={`${project.title} — ${copy.live}`}
            onLoad={(event) => {
              setLoaded(true);
              const document = event.currentTarget.contentDocument;
              if (document) {
                document.documentElement.style.overflowY = "scroll";
                document.documentElement.style.scrollbarGutter = "stable";
                document.documentElement.style.overscrollBehaviorY = "contain";
              }
            }}
            className="live-frame"
            style={{
              width: viewport.width,
              height: viewport.height,
              maxWidth: "none",
              position: "absolute",
              top: 0,
              left: "50%",
              marginLeft: -viewport.width / 2,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          />
        )}
      </div>
      <p className="live-note">{copy.note}</p>
    </article>
  );
}
