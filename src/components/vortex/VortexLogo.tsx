import { vortexGeometry } from "./geometry";
type Props = { className?: string; decorative?: boolean };
// Each curved blade edge is one fixed-radius circle; pixels retain their exact geometry.
export function VortexLogo({ className = "", decorative = true }: Props) {
  return (
    <span
      className={`vortex-logo ${className}`}
      aria-hidden={decorative || undefined}
    >
      <svg
        viewBox="385 235 530 530"
        fill="none"
        focusable="false"
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : "Mind Vortex"}
      >
        {vortexGeometry.map((element, index) => {
          if (element.tag === "path") {
            const { id, ...attributes } = element.attributes;
            return <path key={id} {...attributes} />;
          }
          return <rect key={index} {...element.attributes} />;
        })}
      </svg>
    </span>
  );
}
