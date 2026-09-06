"use client";
import { useCopy } from "@/i18n/LocaleProvider";
import { stack } from "@/data/stack";
export function StackScene() {
  const { copy, locale } = useCopy();
  return (
    <section
      id="stack"
      className="stack scene section-pad"
      data-scene="06"
      aria-labelledby="stack-title"
    >
      <div className="section-heading">
        <h2 id="stack-title" className="terminal-label">
          {copy.stack.label}
        </h2>
        <span className="terminal-label">
          <i className="status-dot" /> {copy.stack.aside}
        </span>
      </div>
      <div className="stack-intro" data-reveal>
        <h3>
          {copy.stack.title[0]}
          <br />
          <span className="muted">{copy.stack.title[1]}</span>
        </h3>
        <p>
          {copy.stack.copy[0]}
          <br />
          {copy.stack.copy[1]}
        </p>
      </div>
      <div className="stack-grid">
        {stack.map((group, i) => (
          <article className="stack-module" key={group.name.en} data-reveal>
            <h4 className="terminal-label">
              <span className="green">{String(i + 1).padStart(2, "0")}</span> [
              {group.name[locale]}]
            </h4>
            <ul>
              {group.items.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                  <span className="stack-leader" />
                  <span className="stack-active">{copy.stack.active}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
