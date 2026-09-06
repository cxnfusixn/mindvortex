"use client";
import { useCopy } from "@/i18n/LocaleProvider";
import { site } from "@/data/site";
import Image from "next/image";
import { ContactForm } from "./ContactForm";
export function ContactScene() {
  const { copy } = useCopy();
  return (
    <section
      id="contact"
      className="contact scene section-pad"
      data-scene="08"
      aria-labelledby="contact-title"
    >
      <div className="section-heading">
        <span className="terminal-label">{copy.contact.label}</span>
        <span className="terminal-label">{copy.contact.aside}</span>
      </div>
      <div className="contact-main">
        <h2 id="contact-title" data-reveal>
          {copy.contact.title[0]}
          <br />
          {copy.contact.title[1]}
          <br />
          <span className="green">
            {copy.contact.title[2]}
            <br className="mobile-break" /> {copy.contact.title[3]}
          </span>
        </h2>
        <div className="contact-bottom">
          <div className="contact-details">
            <p>
              {copy.contact.copy[0]}
              <br />
              {copy.contact.copy[1]}
              <br />
              <strong>{copy.contact.talk}</strong>
            </p>
            <div className="social-links">
              {[
                {
                  label: site.email || "Email",
                  href: site.email ? `mailto:${site.email}` : "",
                },
                { label: "LinkedIn", href: site.linkedin },
              ].map((link) =>
                link.href ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="terminal-link"
                    data-cursor={copy.open}
                  >
                    {link.label} ↗
                  </a>
                ) : (
                  <span key={link.label}>
                    {link.label} <small>{copy.contact.toAdd}</small>
                  </span>
                ),
              )}
            </div>
          </div>
          <ContactForm />
        </div>
      </div>
      <footer>
        <a href="#home" className="footer-brand">
          <Image
            src="/brand/mv-wordmark.svg"
            alt="Mind Vortex"
            width={180}
            height={18}
          />
          <small>PATRYK PYRKA</small>
        </a>
        <span className="terminal-label">
          © {new Date().getFullYear()} MIND VORTEX
        </span>
        <span className="terminal-label">
          {copy.contact.footer} <b className="green blink">_</b>
        </span>
      </footer>
    </section>
  );
}
