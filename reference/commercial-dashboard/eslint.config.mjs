// =============================================================================
// Prickles canon — TypeScript flat config (eslint.config.mjs) · v1.0
// Source of truth: https://prickles.org/implementation
//
// What this file enforces (21 of 50 tenets):
//   F1 F2 F3 F4 F5 F6      ·  Foundations
//   A1 A2 A3 A6 A11        ·  Architecture (folder + import discipline)
//   S2 S3 S4 S5            ·  Style (caps, params, guards, inline-first)
//   T2                     ·  Types (no escape hatches)
//   P5                     ·  Quality outside QA (React + a11y safety)
//   TA1 TA2                ·  Tooling (linter as law, detect duplication)
//   TS5                    ·  Testing (locate by structure — a11y roles)
//
// What this file CANNOT enforce — the canon ships these on other surfaces:
//   AI rule files (.cursor/rules/, AGENTS.md, .claude/rules):
//     AI1 AI2 AI3 AI4 AI5 AI6
//   TypeScript itself + tsconfig strictness + Zod/Valibot at boundaries:
//     T1 Domain-Driven Types · T3 Type Guards · T4 Schema Sovereignty
//   Architecture review (folder layout, transport boundaries, polymorphism):
//     A4 Common Closure · A5 Smart Endpoints · A7 Connascence ·
//     A8 Locality of Computation · A9 Liskov · A10 ISP
//   Process gates (CI, PR templates, definition of done):
//     P1 Test First · P2 Acceptance Criteria · P3 Definition of Done ·
//     P4 Shift-Left · P6 Tidy First · P7 Trunk-Based
//   Test discipline (test runner config + review):
//     TS1 TS2 TS3 TS4 TS6 TS7 TS8
//   Pattern review:
//     PT1 Name the Pattern · PT3 Name the Failure Mode
//
// Per-rule comments below name the primary tenet as a link; siblings the rule
// also enforces sit in brackets — (also covers: …). See the canon entry on
// each tenet for the editorial reasoning.
// =============================================================================
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import importPlugin from "eslint-plugin-import";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  sonarjs.configs.recommended,
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "node_modules/**"]),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: { project: "./tsconfig.json", tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    plugins: { prettier: prettierPlugin, sonarjs, unicorn, import: importPlugin },
    rules: {
      // TA1 Linter as Law — https://prickles.org/tenet/linter-as-law/TA1 (also covers: F5)
      "prettier/prettier": "error",

      // T2 No Type Escape Hatches — https://prickles.org/tenet/no-escape-hatches/T2
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "off",
      // T2 (also covers: F2, F5)
      "@typescript-eslint/explicit-function-return-type": "error",
      // T2 (also covers: TA1)
      "@typescript-eslint/ban-ts-comment": "error",
      // F4 Simplicity — https://prickles.org/tenet/simplicity/F4 (also covers: T2)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // F6 Encapsulation — https://prickles.org/tenet/encapsulation/F6
      "no-param-reassign": "error",

      // F4 Simplicity (also covers: F5, P5)
      "no-console": ["error", { allow: ["error"] }],
      // F4 (also covers: F5)
      "no-multi-str": "error",

      // F1 Single Responsibility — https://prickles.org/tenet/single-responsibility-principle/F1 (also covers: S2)
      "max-lines-per-function": ["warn", { max: 15, skipBlankLines: true, skipComments: true }],
      // F1 (also covers: S2, F4)
      "max-lines": ["warn", { max: 150, skipBlankLines: true, skipComments: true }],

      // S2 Cyclomatic Caps — https://prickles.org/tenet/cyclomatic-caps/S2 (also covers: F1, F4)
      complexity: ["warn", 3],
      // S2 (also covers: S4)
      "max-depth": ["warn", 3],
      // S2 (also covers: S4)
      "max-nested-callbacks": ["warn", 3],
      // S2 (also covers: F1, F4)
      "max-statements": ["warn", 10],
      // S3 Parameter Object — https://prickles.org/tenet/parameter-object/S3 (also covers: S2, F1)
      "max-params": ["warn", 3],

      // F5 Self-Documenting Code — https://prickles.org/tenet/self-documenting-code/F5
      "no-inline-comments": "error",
      // F5 (also covers: F4)
      "no-warning-comments": ["error", { terms: ["todo", "fixme", "xxx", "hack"] }],
      // F5
      "line-comment-position": ["error", { position: "above", ignorePattern: "$^" }],
      // F5
      "multiline-comment-style": ["error", "starred-block"],

      // P5 Quality outside QA — https://prickles.org/tenet/quality-outside-qa/P5 (React safety net)
      "react/no-array-index-key": "error",
      "react/jsx-key": "error",
      "react/jsx-no-target-blank": "error",
      // P5 (also covers: F4)
      "react/jsx-no-useless-fragment": "error",
      "react/no-danger": "error",
      "react/no-deprecated": "error",
      "react/no-unstable-nested-components": "error",
      // P5 (also covers: F4)
      "react/self-closing-comp": "error",

      // P5 (a11y safety net — also covers: TS5 Locate by Structure)
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      // F3 DRY — https://prickles.org/tenet/dont-repeat-yourself/F3 (also covers: TA2)
      "sonarjs/no-duplicate-string": ["error", { threshold: 3 }],
      // F3 (also covers: TA2)
      "sonarjs/no-identical-functions": "error",
      // F3
      "sonarjs/no-identical-expressions": "error",
      // S5 Earn Each Binding — https://prickles.org/tenet/earn-each-binding/S5 (also covers: F4)
      "sonarjs/prefer-immediate-return": "error",
      // S5 (also covers: F4)
      "sonarjs/prefer-single-boolean-return": "error",
      // S5 (also covers: F4)
      "sonarjs/no-inverted-boolean-check": "error",
      // F4 (also covers: S4)
      "sonarjs/no-collapsible-if": "error",
      // F4 (also covers: S5)
      "sonarjs/no-redundant-boolean": "error",
      // F4
      "sonarjs/no-unused-collection": "error",
      // F4
      "sonarjs/no-gratuitous-expressions": "error",

      // A2 Three-Tier Hoisting — https://prickles.org/tenet/three-tier-hoisting/A2 (also covers: F1)
      "unicorn/consistent-function-scoping": "error",
      // TA1 Linter as Law
      "unicorn/no-abusive-eslint-disable": "error",
      // F4 Simplicity (also covers: S5)
      "unicorn/no-array-for-each": "error",
      "unicorn/no-for-loop": "error",
      // S4 Guard Clauses — https://prickles.org/tenet/guard-clauses/S4 (also covers: F4)
      "unicorn/no-lonely-if": "error",
      // S5 (also covers: F4)
      "unicorn/no-negated-condition": "error",
      // F4 (also covers: S5)
      "unicorn/no-nested-ternary": "error",
      // F4
      "unicorn/no-useless-spread": "error",
      "unicorn/no-useless-undefined": "error",
      // S5 (also covers: F4)
      "unicorn/prefer-array-find": "error",
      // F4
      "unicorn/prefer-array-flat": "error",
      "unicorn/prefer-array-flat-map": "error",
      "unicorn/prefer-array-some": "error",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-modern-math-apis": "error",
      "unicorn/prefer-negative-index": "error",
      "unicorn/prefer-number-properties": "error",
      "unicorn/prefer-object-from-entries": "error",
      "unicorn/prefer-optional-catch-binding": "error",
      "unicorn/prefer-set-has": "error",
      "unicorn/prefer-spread": "error",
      "unicorn/prefer-string-replace-all": "error",
      "unicorn/prefer-string-slice": "error",
      "unicorn/prefer-string-starts-ends-with": "error",
      "unicorn/prefer-string-trim-start-end": "error",
      // S5 (also covers: F4)
      "unicorn/prefer-switch": ["error", { minimumCases: 3 }],
      // S5 (also covers: F4)
      "unicorn/prefer-ternary": "error",
      // F4
      "unicorn/prefer-type-error": "error",
      "unicorn/throw-new-error": "error",

      // F2 Intention-Revealing Names — https://prickles.org/tenet/intention-revealing-names/F2 (also covers: A1)
      "unicorn/filename-case": ["error", { case: "kebabCase", ignore: ["^README\\.md$"] }],

      // A6 Bounded Contexts — https://prickles.org/tenet/bounded-contexts/A6 (also covers: A1, A3)
      "import/no-restricted-paths": "error",
      // A6 (also covers: A11)
      "no-restricted-imports": "error",
      // A3 Stable Dependencies — https://prickles.org/tenet/stable-dependencies/A3 (also covers: A11)
      "import/no-cycle": "error",
    },
  },
]);
