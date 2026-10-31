/**
 * Tiny, dependency-free syntax highlighter for the website's own TypeScript + Angular-template
 * samples. It is deterministic and DOM-free, so the server-rendered and hydrated markup is
 * identical. Output is escaped HTML made only of `<span class="token …">` wrappers.
 */
const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const KEYWORDS =
  'import|from|export|class|const|let|readonly|new|return|if|else|type|interface|extends|implements|void|null|true|false|this|private|public|protected|async|await';

const TEMPLATE_TOKENS = new RegExp(
  [
    '(?<string>"(?:[^"\\\\]|\\\\.)*")',
    '(?<interp>\\{\\{[^}]*\\}\\})',
    '(?<tag></?[A-Za-z][\\w-]*)',
    '(?<attr>(?<=\\s)[\\[\\(*#]*[A-Za-z][\\w.-]*[\\]\\)]*(?==)|(?<=\\s)(?:qz[A-Za-z]+|disabled)(?=[\\s>/]))',
  ].join('|'),
  'g',
);

const span = (kind: string, text: string) => `<span class="token ${kind}">${text}</span>`;

function highlightTemplate(inner: string): string {
  let out = '';
  let last = 0;
  for (const match of inner.matchAll(TEMPLATE_TOKENS)) {
    const index = match.index ?? 0;
    out += escapeHtml(inner.slice(last, index));
    const g = match.groups ?? {};
    const kind = g['string']
      ? 'string'
      : g['interp']
        ? 'function'
        : g['tag']
          ? 'keyword'
          : 'class-name';
    out += span(kind, escapeHtml(match[0]));
    last = index + match[0].length;
  }
  return out + escapeHtml(inner.slice(last));
}

const TS_TOKENS = new RegExp(
  [
    '(?<comment>//[^\\n]*|/\\*[\\s\\S]*?\\*/)',
    '(?<template>`(?:\\\\.|[^`\\\\])*`)',
    '(?<string>\'(?:\\\\.|[^\'\\\\])*\'|"(?:\\\\.|[^"\\\\])*")',
    `(?<keyword>\\b(?:${KEYWORDS})\\b)`,
    '(?<decorator>@[A-Za-z]+)',
    '(?<number>\\b\\d+(?:\\.\\d+)?\\b)',
  ].join('|'),
  'g',
);

export function highlightTypeScript(code: string): string {
  let out = '';
  let last = 0;
  for (const match of code.matchAll(TS_TOKENS)) {
    const index = match.index ?? 0;
    out += escapeHtml(code.slice(last, index));
    const g = match.groups ?? {};
    if (g['template']) {
      const inner = g['template'].slice(1, -1);
      out += span('string', '`') + highlightTemplate(inner) + span('string', '`');
    } else {
      const kind = g['comment']
        ? 'comment'
        : g['string']
          ? 'string'
          : g['keyword']
            ? 'keyword'
            : g['decorator']
              ? 'function'
              : 'number';
      out += span(kind, escapeHtml(match[0]));
    }
    last = index + match[0].length;
  }
  return out + escapeHtml(code.slice(last));
}
