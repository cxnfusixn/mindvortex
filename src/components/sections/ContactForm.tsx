"use client";
import { useRef, useState, type FormEvent } from "react";
import { useCopy } from "@/i18n/LocaleProvider";
import { contactFormCopy, contactServices } from "@/data/contact-form";

export function ContactForm() {
  const { locale } = useCopy();
  const copy = contactFormCopy[locale];
  const busy = useRef(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<
    "success" | "error" | "unavailable" | "limited" | null
  >(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    const form = event.currentTarget;
    setSending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
        signal: AbortSignal.timeout(25000),
      });
      const result = await response.json();
      if (response.ok && result.ok === true) {
        setStatus("success");
        form.reset();
      } else
        setStatus(
          response.status === 503
            ? "unavailable"
            : response.status === 429
              ? "limited"
              : "error",
        );
    } catch {
      setStatus("error");
    } finally {
      busy.current = false;
      setSending(false);
    }
  }
  return (
    <form
      id="project-form"
      className="contact-form"
      onSubmit={submit}
      aria-labelledby="contact-form-title"
      aria-busy={sending}
    >
      <h3 id="contact-form-title">
        {copy.title}
        <span className="green">_</span>
      </h3>
      <div className="contact-form-grid">
        <label htmlFor="contact-name">
          {copy.name}
          <input
            id="contact-name"
            name="name"
            autoComplete="given-name"
            required
            minLength={2}
            maxLength={80}
          />
        </label>
        <label htmlFor="contact-email">
          {copy.email}
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
      </div>
      <label htmlFor="contact-service">
        {copy.service}
        <select id="contact-service" name="service" defaultValue="web">
          {contactServices.map((service, index) => (
            <option key={service} value={service}>
              {copy.services[index]}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="contact-message">
        {copy.message}
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={2}
        />
      </label>
      <div className="contact-trap" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="contact-form-bottom">
        <p>{copy.note}</p>
        <button type="submit" disabled={sending}>
          &gt; {sending ? copy.sending : copy.send}{" "}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div
        className={`contact-form-status ${status === "success" ? "green" : ""}`}
        role="status"
        aria-live="polite"
      >
        {status ? copy[status] : ""}
      </div>
    </form>
  );
}
