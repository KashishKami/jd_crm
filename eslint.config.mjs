import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // NOTE: eslint-config-next/typescript is intentionally excluded.
  // It enables type-aware @typescript-eslint rules which require a full `tsc`
  // compilation pass, making lint as slow as `npm run typecheck`. Type checking
  // is handled separately via `npm run typecheck`.
  globalIgnores([
    // Next.js build output
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific
    "crm_php/**",
    "seed.sql",
    // Scratch/utility scripts (not production code)
    "scratch/**",
  ]),
]);

export default eslintConfig;
