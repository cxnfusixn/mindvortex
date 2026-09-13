import type { Metadata } from "next";
import localFont from "next/font/local";
import "./prospecting.css";
const geist = localFont({
  src: "../../../node_modules/@fontsource/geist/files/geist-latin-400-normal.woff2",
  variable: "--prospect-font",
  display: "swap",
});
export const metadata: Metadata = {
  title: "Prospecting · MindVortex",
  description: "Prywatny moduł pozyskiwania klientów MindVortex.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
