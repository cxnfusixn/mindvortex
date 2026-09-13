import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Social Studio is a separate Next app with its own package and deployment.
  globalIgnores([".next/**", "next-env.d.ts", ".preview-build/**", "public/previews/**", "social/automation/**"]),
]);
