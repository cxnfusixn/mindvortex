"use client";
import { useCopy } from "@/i18n/LocaleProvider";
export function LanguageSwitch() {
  const { locale, copy } = useCopy();
  return (
    <nav className="language-switch" aria-label={copy.language}>
      {(["pl", "en"] as const).map((language) => (
        <a
          key={language}
          href={`/${language}`}
          hrefLang={language}
          lang={language}
          aria-current={locale === language ? "page" : undefined}
          onClick={(event) => {
            const section = document.querySelector<HTMLElement>(
              `[data-scene="${document.querySelector(".scene-number > span")?.textContent || "01"}"]`,
            );
            const hash = section?.id ? `#${section.id}` : window.location.hash;
            event.currentTarget.href = `/${language}${hash}`;
          }}
        >
          {language.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}
