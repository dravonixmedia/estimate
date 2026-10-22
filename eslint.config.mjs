// eslint-config-next 16.x ships native ESLint 9 flat-config arrays (see
// node_modules/eslint-config-next/dist/core-web-vitals.js) rather than the
// legacy eslintrc-style shareable config the old FlatCompat.extends(...)
// call expected — routing it through FlatCompat throws ("Converting
// circular structure to JSON") because it now embeds plugins' own rich,
// self-referential `configs` objects. core-web-vitals already supersets
// the base "next" and "next/typescript" rule sets, so importing it alone
// is equivalent to the old two-arg compat.extends() call.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      // opennextjs-cloudflare's generated Worker bundle — never meant to be
      // linted as project source.
      ".open-next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
