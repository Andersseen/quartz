import type {
  DoqPlaygroundControl,
  DoqPlaygroundDefinition,
  DoqPlaygroundValues,
} from '@doqs/analog';

/**
 * Strict-AOT consumer fixtures generated from the REAL playground registry (0.24).
 *
 * This module is pure: no file system, no Angular, no test runner. It is evaluated by
 * `scripts/consumer/playground-fixtures.mjs` on the repository toolchain (Node 22+) and its output
 * is compiled by the disposable consumer applications under THEIR matrix Node version. The unit
 * tests in `usage-code.spec.ts` exercise the same function against `DOC_PLAYGROUNDS`.
 */

/** A non-default value set per family; the default variant uses each control's `initial`. */
export const CONSUMER_COMPILE_VARIANTS: Readonly<Record<string, DoqPlaygroundValues>> = {
  'quartz-toolbar': { orientation: 'vertical', rtl: true, disabled: true },
  'quartz-toggle-group': {
    type: 'multiple',
    allowDeselection: false,
    orientation: 'vertical',
    disabled: true,
  },
  'quartz-toggle': { pressed: true, disabled: true },
  'quartz-slider': {
    min: -10,
    max: 30,
    step: 0.5,
    value: 7,
    orientation: 'vertical',
    disabled: true,
  },
  'quartz-range-slider': {
    min: -20,
    max: 80,
    step: 2,
    low: 0,
    high: 40,
    minDistance: 6,
    orientation: 'vertical',
    disabled: true,
  },
  'quartz-select': {
    multiple: true,
    grouped: false,
    closeOnSelect: true,
    disabled: true,
    rtl: true,
  },
  'quartz-input-otp': { length: 8, disabled: true },
  'quartz-pagination': { page: 5, pageCount: 5, disabled: true },
  'quartz-navigation-menu': {
    orientation: 'vertical',
    showDelay: 0,
    hideDelay: 400,
    disabled: true,
    rtl: true,
  },
};

export const CONSUMER_FIXTURE_VARIANT_NAMES = ['default', 'representative'] as const;

export interface ConsumerFixtureVariant {
  readonly family: string;
  readonly variant: (typeof CONSUMER_FIXTURE_VARIANT_NAMES)[number];
  readonly file: string;
  readonly className: string;
  readonly selector: string;
}

export interface ConsumerFixtureSet {
  /** File name (relative to the generated directory) → TypeScript source. Sorted by name. */
  readonly files: Readonly<Record<string, string>>;
  readonly variants: readonly ConsumerFixtureVariant[];
}

type Registry = Readonly<Record<string, DoqPlaygroundDefinition>>;

const initialValues = (definition: DoqPlaygroundDefinition): DoqPlaygroundValues =>
  Object.fromEntries(
    (definition.controls ?? []).map((c: DoqPlaygroundControl) => [c.input, c.initial]),
  );

const componentExample = (family: string, definition: DoqPlaygroundDefinition) => {
  const entry = (definition.code ?? []).find((candidate) => candidate.label === 'Component');
  if (!entry) throw new Error(`${family}: missing copyable Component example`);
  return entry;
};

/**
 * Builds the strict consumer compilation fixtures. Fails loudly when the registry and the variant
 * table drift apart (a family gains or loses a Component example), when a generator is not
 * deterministic, or when an example is malformed.
 */
export function buildConsumerFixtures(registry: Registry): ConsumerFixtureSet {
  const withComponent = Object.entries(registry)
    .filter(([, definition]) => definition.code?.some((entry) => entry.label === 'Component'))
    .map(([family]) => family)
    .sort();
  const declared = Object.keys(CONSUMER_COMPILE_VARIANTS).sort();
  const missing = withComponent.filter((family) => !declared.includes(family));
  const unknown = declared.filter((family) => !withComponent.includes(family));
  if (missing.length || unknown.length)
    throw new Error(
      `consumer compile variants out of sync with DOC_PLAYGROUNDS: ` +
        `missing [${missing.join(', ')}], without a Component example [${unknown.join(', ')}]`,
    );

  const files: Record<string, string> = {};
  const variants: ConsumerFixtureVariant[] = [];
  const hosts: string[] = [];
  const rootSelectors: string[] = [];
  for (const [family, change] of Object.entries(CONSUMER_COMPILE_VARIANTS)) {
    const definition = registry[family];
    const example = componentExample(family, definition);
    const values = {
      default: initialValues(definition),
      representative: { ...initialValues(definition), ...change },
    };
    for (const variant of CONSUMER_FIXTURE_VARIANT_NAMES) {
      const render = () =>
        typeof example.code === 'function' ? example.code(values[variant]) : example.code;
      const source = render();
      if (source !== render())
        throw new Error(`${family}/${variant}: generated source is not deterministic`);
      const className = source.match(/export class (\w+)/)?.[1];
      const selector = source.match(/selector: '([^']+)'/)?.[1];
      if (!className || !selector)
        throw new Error(`${family}/${variant}: malformed component example`);
      const index = variants.length;
      const file = `${family.replace('quartz-', '')}-${variant}`;
      files[`${file}.ts`] = `// ${family} / ${variant}\n${source}\n`;
      variants.push({ family, variant, file: `${file}.ts`, className, selector });
      const hostSelector = `qz-example-host-${index}`;
      hosts.push(
        `import { ${className} as ExampleComponent${index} } from './${file}';\n` +
          `@Component({ selector: '${hostSelector}', imports: [ExampleComponent${index}], template: '<${selector}></${selector}>' })\n` +
          `export class ExampleHost${index} {}`,
      );
      rootSelectors.push(`<${hostSelector}></${hostSelector}>`);
    }
  }
  files['index.ts'] =
    `import { Component } from '@angular/core';\n${hosts.join('\n')}\n` +
    `export const GENERATED_PLAYGROUND_HOSTS = [${variants.map((_, i) => `ExampleHost${i}`).join(', ')}] as const;\n` +
    `export const GENERATED_PLAYGROUND_TEMPLATE = ${JSON.stringify(rootSelectors.join('\n'))};\n`;
  const sorted = Object.fromEntries(
    Object.keys(files)
      .sort()
      .map((name) => [name, files[name]]),
  );
  return { files: sorted, variants };
}
