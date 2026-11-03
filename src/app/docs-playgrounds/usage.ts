/**
 * Usage-code serializer for playground `code` tabs.
 *
 * `formatDoqUsage()` from Doqs escapes its `text` option on purpose (it is meant for plain text), so
 * passing nested markup through it prints `&lt;div qzSliderTrack&gt;` literally. This module builds
 * the snippet from a small tree instead: elements are explicit nodes (`el()`), plain strings are
 * always text and are escaped, and attribute values are escaped by `attr()`. The result is Angular
 * template source — the text Doqs prints verbatim and copies to the clipboard — so it contains
 * exactly one level of escaping and never HTML-decodes anything.
 */

export interface UsageElement {
  readonly tag: string;
  readonly attributes: readonly string[];
  readonly children: readonly UsageNode[];
}

/** A child is either an element or plain text. Text is escaped; markup must be built with `el()`. */
export type UsageNode = UsageElement | string;

const TAG = /^[a-z][a-z0-9-]*$/;
const ATTRIBUTE_NAME = /^[A-Za-z_][\w.-]*$/;
const LINE_WIDTH = 80;

/** Escapes a double-quoted attribute value. `&` first so entities are never double-escaped twice. */
const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Escapes element text; braces would start an Angular interpolation or control-flow block. */
const escapeText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');

/** A static attribute: `name="value"`. Text Angular would read as an interpolation becomes a bound string. */
export function attr(name: string, value: string): string {
  if (!ATTRIBUTE_NAME.test(name)) throw new Error(`usage: "${name}" is not an attribute name`);
  if (/\{\{|\}\}|[\n\r\t\\]/.test(value)) {
    const literal = `'${value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')}'`;
    return `[${name}]="${escapeAttribute(literal)}"`;
  }
  return `${name}="${escapeAttribute(value)}"`;
}

/** A property binding to a literal value: numbers and booleans only; `undefined` for anything unusable. */
export function bind(name: string, value: unknown): string | undefined {
  if (!ATTRIBUTE_NAME.test(name)) throw new Error(`usage: "${name}" is not an attribute name`);
  if (typeof value === 'boolean') return `[${name}]="${value}"`;
  if (typeof value === 'number' && Number.isFinite(value)) return `[${name}]="${value}"`;
  return undefined;
}

/** A two-way (`[(name)]="field"`) or output (`(name)="handler($event)"`) binding. `target` is trusted source. */
export const twoWay = (name: string, field: string) => `[(${name})]="${field}"`;
export const output = (name: string, handler: string) => `(${name})="${handler}"`;

/** A bare boolean attribute, or nothing: `flag('disabled', on)` → `['disabled']` / `[]`. */
export const flag = (name: string, on: unknown): string[] => (on ? [name] : []);

/** An element. `null`/`undefined`/`false` attributes are dropped so callers can use conditionals inline. */
export function el(
  tag: string,
  attributes: readonly (string | false | null | undefined)[] = [],
  children: readonly UsageNode[] = [],
): UsageElement {
  if (!TAG.test(tag)) throw new Error(`usage: "${tag}" is not an element name`);
  return {
    tag,
    attributes: attributes.filter((a): a is string => typeof a === 'string'),
    children,
  };
}

const isComponent = (tag: string) => tag.includes('-');

function openTag(node: UsageElement, indent: string): { open: string; multiline: boolean } {
  const { tag, attributes } = node;
  const single = `<${tag}${attributes.length ? ` ${attributes.join(' ')}` : ''}`;
  if (single.length + indent.length <= LINE_WIDTH || attributes.length < 2) {
    return { open: single, multiline: false };
  }
  const lines = attributes.map((a) => `${indent}  ${a}`).join('\n');
  return { open: `<${tag}\n${lines}\n${indent}`, multiline: true };
}

function render(node: UsageNode, indent: string): string {
  if (typeof node === 'string') return `${indent}${escapeText(node)}`;
  const { tag, children } = node;
  const { open, multiline } = openTag(node, indent);
  if (!children.length) {
    return isComponent(tag)
      ? `${indent}${open}${multiline ? '' : ' '}/>`
      : `${indent}${open}></${tag}>`;
  }
  if (children.every((child) => typeof child === 'string')) {
    const text = escapeText(children.join(''));
    const inline = `${indent}${open}>${text}</${tag}>`;
    if (multiline || inline.length <= LINE_WIDTH) return inline;
    return `${indent}${open}>\n${indent}  ${text}\n${indent}</${tag}>`;
  }
  const body = children.map((child) => render(child, `${indent}  `)).join('\n');
  return `${indent}${open}>\n${body}\n${indent}</${tag}>`;
}

/** Serializes an element tree to Angular template source (two-space indent, wrapped attributes). */
export const usage = (node: UsageElement): string => render(node, '').trimStart();

/** A standalone-component wrapper so a template snippet is copyable: imports, state and the template. */
export function componentSource(options: {
  readonly selector: string;
  readonly importFrom: readonly { readonly names: readonly string[]; readonly from: string }[];
  readonly imports: readonly string[];
  readonly members: readonly string[];
  readonly template: string;
}): string {
  const importLines = [
    "import { ChangeDetectionStrategy, Component, signal } from '@angular/core';",
    ...options.importFrom.map(
      ({ names, from }) => `import { ${[...names].join(', ')} } from '${from}';`,
    ),
  ];
  const indent = (text: string, by: string) =>
    text
      .split('\n')
      .map((line) => (line ? `${by}${line}` : line))
      .join('\n');
  return [
    ...importLines,
    '',
    '@Component({',
    `  selector: '${options.selector}',`,
    `  imports: [${options.imports.join(', ')}],`,
    '  changeDetection: ChangeDetectionStrategy.OnPush,',
    '  template: `',
    indent(options.template, '    '),
    '  `,',
    '})',
    `export class ${options.selector
      .split('-')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('')}Component {`,
    ...options.members.map((member) => `  ${member}`),
    '}',
  ].join('\n');
}
