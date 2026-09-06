import type { ReactNode } from "react";
export function TerminalLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`terminal-label ${className}`}>{children}</span>;
}
