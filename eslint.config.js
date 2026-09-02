const typescriptEslintPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptEslintParser = require('@typescript-eslint/parser');
const angularEslintPlugin = require('@angular-eslint/eslint-plugin');
const angularEslintTemplatePlugin = require('@angular-eslint/eslint-plugin-template');
const angularEslintTemplateParser = require('@angular-eslint/template-parser');

module.exports = [
  {
    ignores: [
      "dist/**/*",
      "**/dist/**/*",
      "coverage/**/*",
      ".angular/**/*",
      "node_modules/**/*",
      "**/*.config.ts",
      // Deliberately isolated fixture for scripts/consumer-smoke.js: type-checked on its
      // own via its own local tsconfig.json (tsc --noEmit against the installed packages,
      // outside the workspace), not part of any of the monorepo's own tsconfig `include`s.
      "scripts/consumer-smoke/fixture/**/*"
    ],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: ["./tsconfig.json", "./packages/core/tsconfig.lib.json", "./packages/core/tsconfig.spec.json", "./packages/primitives/tsconfig.lib.json", "./packages/primitives/tsconfig.spec.json", "./tsconfig.app.json", "./tsconfig.spec.json"],
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      '@angular-eslint': angularEslintPlugin,
    },
    rules: {
      ...typescriptEslintPlugin.configs.recommended.rules,
      ...angularEslintPlugin.configs.recommended.rules,
      "@angular-eslint/directive-selector": [
        "error",
        { "type": "attribute", "prefix": ["qz", "app"], "style": "camelCase" }
      ],
      "@angular-eslint/component-selector": [
        "error",
        { "type": "element", "prefix": ["qz", "app"], "style": "kebab-case" }
      ],
      "@angular-eslint/prefer-standalone": "error",
      "@angular-eslint/prefer-on-push-component-change-detection": "error",
      // no-input-rename's "is this alias just <selector><Property>" heuristic strips
      // brackets from the raw selector text without separating a tag qualifier, so a
      // tag-qualified attribute selector like `button[qzToggleItem]` no longer matches
      // against an alias composed from just the attribute part (`qzToggleItemDisabled`).
      // Button-first-only selectors need exactly this shape (see docs/ai/STABILITY_AUDIT.md).
      "@angular-eslint/no-input-rename": [
        "error",
        { "allowedNames": ["qzToggleItemDisabled"] }
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ]
    }
  },
  {
    files: ["packages/core/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@quartz-headless/primitives", "@quartz-headless/primitives/**"],
              message:
                "Quartz Core must not depend on Headless Primitives — dependencies flow Core -> Primitives only.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    languageOptions: {
      parser: angularEslintTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularEslintTemplatePlugin,
    },
    rules: {
      ...angularEslintTemplatePlugin.configs.recommended.rules,
      ...angularEslintTemplatePlugin.configs.accessibility.rules,
    }
  }
];
