import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";
import { routeBoundaryZones } from "./lib/eslint/route-boundaries.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/app/**", "@/components/ui/dm/**"],
        },
      ],
    },
  },
  {
    files: ["components/ui/dm/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/app/**"],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/no-restricted-paths": ["error", { zones: routeBoundaryZones }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
