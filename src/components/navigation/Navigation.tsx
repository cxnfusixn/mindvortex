"use client";
import { useCopy } from "@/i18n/LocaleProvider";
import { useEffect, useState } from "react";
import Image from "next/image";
import { navigation } from "@/data/navigation";
import { LanguageSwitch } from "./LanguageSwitch";
import { VortexLogo } from "@/components/vortex/VortexLogo";
export function Navigation() {
  const { copy } = useCopy();
  const [scene, setScene] = useState("01");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            setScene((entry.target as HTMLElement).dataset.scene || "01");
        });
      },
      { rootMargin: "-25% 0px -55% 0px" },
    );
    document
      .querySelectorAll("[data-scene]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <header className="navigation">
      <a className="brand" href="#home" aria-label={copy.homeLabel}>
        <VortexLogo />
        <span>
          <Image
            className="brand-wordmark"
            src="/brand/mv-wordmark.svg"
            alt=""
            width={154}
            height={15}
          />
          <small>PATRYK PYRKA</small>
        </span>
      </a>
      <nav className="main-navigation" aria-label={copy.navLabel}>
        {navigation.map((link, index) => (
          <a key={link.label} href={link.href} className="terminal-link">
            {copy.nav[index]}
          </a>
        ))}
      </nav>
      <LanguageSwitch />
      <span className="scene-number">
        <span>{scene}</span> / 08
      </span>
    </header>
  );
}
