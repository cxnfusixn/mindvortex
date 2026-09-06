"use client";
import { useCopy } from "@/i18n/LocaleProvider";

export function CapabilitiesScene() {
  const { copy } = useCopy();
  return (
    <section
      id="capabilities"
      className="capabilities scene section-pad"
      data-scene="03"
      aria-labelledby="capabilities-title"
    >
      <div className="section-heading">
        <h2 className="terminal-label" id="capabilities-title">
          {copy.capabilitiesLabel}
        </h2>
        <span className="terminal-label">{copy.capabilitiesAside}</span>
      </div>
      <div>
        {copy.capabilities.map((item, i) => (
          <article
            className={`capability capability-${i}`}
            key={item.name}
            data-reveal
          >
            <div className="capability-title">
              <span className="terminal-label green">0{i + 1}</span>
              <h3>
                {item.name}
                <span className="cap-arrow">↗</span>
              </h3>
            </div>
            <div className="capability-art" aria-hidden="true">
              {i === 0 ? (
                <div className="web-fragments">
                  <span />
                  <span />
                  <span />
                </div>
              ) : i === 1 ? (
                <div className="backend-nodes">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              ) : i === 2 ? (
                <div className="identity-type">
                  Aa<span>+ + +</span>
                </div>
              ) : (
                <div className="creative-pixels">
                  {Array.from({ length: 12 }, (_, n) => (
                    <i key={n} />
                  ))}
                </div>
              )}
            </div>
            <div className="capability-copy">
              <p>{item.copy}</p>
              <div className="tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
