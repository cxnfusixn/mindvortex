"use client";
import { createContext, useContext } from "react";
import { content, type Locale } from "./content";
const LocaleContext = createContext<Locale>("en");
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}
export function useCopy() {
  const locale = useContext(LocaleContext);
  return { locale, copy: content[locale] };
}
