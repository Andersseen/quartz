/**
 * npm registry lookups that FAIL CLOSED.
 *
 * `npm view` exiting non-zero is NOT evidence that a version is free: it also fails for network
 * errors, expired tokens, permission problems and rate limits. Only a definite E404 ("no such
 * version / package") is reported as `absent`; every other failure throws a classified
 * RegistryError so the release stops instead of publishing on a guess.
 */
import { spawnSync } from 'node:child_process';

export class RegistryError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'RegistryError';
    this.kind = kind;
  }
}

/** Remove anything token-shaped before text reaches a log or an error message. */
export function redact(text) {
  return String(text ?? '')
    .replace(/npm_[A-Za-z0-9]{20,}/g, '[redacted-npm-token]')
    .replace(/(_authToken\s*=\s*)\S+/gi, '$1[redacted]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi, '$1[redacted]')
    .replace(/(NODE_AUTH_TOKEN\s*=\s*)\S+/gi, '$1[redacted]');
}

function extractCode(stdout, stderr) {
  try {
    const parsed = JSON.parse(stdout);
    if (parsed?.error?.code)
      return { code: String(parsed.error.code), summary: parsed.error.summary };
  } catch {
    /* fall through to stderr scanning */
  }
  const m = /npm (?:error|ERR!)\s+(?:code\s+)?(E[A-Z0-9_]+|ENOTFOUND|ETIMEDOUT|ECONNRESET)/.exec(
    stderr,
  );
  return m ? { code: m[1] } : { code: undefined };
}

/** Map an `npm view`/`npm publish` failure to a stable error kind. */
export function classifyFailure({ stdout = '', stderr = '' }) {
  const { code } = extractCode(stdout, stderr);
  const text = `${stdout}\n${stderr}`;
  if (code === 'E404') return 'absent';
  if (code === 'E401' || code === 'ENEEDAUTH' || /\b401\b.*Unauthorized/i.test(text)) return 'auth';
  if (code === 'E403' || /\b403\b.*Forbidden/i.test(text)) return 'permission';
  if (code === 'E429' || /\b429\b|Too Many Requests/i.test(text)) return 'rate-limit';
  if (code === 'EINVALIDPACKAGENAME' || /Invalid package name/i.test(text)) return 'invalid-name';
  if (
    [
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'EAI_AGAIN',
      'ESOCKETTIMEDOUT',
    ].includes(code) ||
    /\bE5\d\d\b|\b50[0-4]\b/.test(code ?? '') ||
    /\b(500|502|503|504)\b/.test(text)
  )
    return 'unavailable';
  return 'unexpected';
}

/** Default executor: runs the real npm CLI. Tests inject a fake with the same shape. */
export function npmExec(args, { cwd } = {}) {
  const r = spawnSync('npm', args, { cwd, encoding: 'utf8', timeout: 120_000 });
  if (r.error)
    return {
      status: 1,
      stdout: '',
      stderr: `npm error code ${r.error.code ?? 'ENOENT'}\n${r.error.message}`,
    };
  return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

/**
 * @returns {{state:'absent'} | {state:'present', integrity:string, shasum?:string, tarball?:string, attestations?:boolean}}
 * @throws {RegistryError} for every ambiguous or failing response
 */
export function lookupVersion({ name, version, exec = npmExec }) {
  const result = exec(['view', `${name}@${version}`, 'dist', '--json']);
  if (result.status !== 0) {
    const kind = classifyFailure(result);
    if (kind === 'absent') return { state: 'absent' };
    throw new RegistryError(
      kind,
      `Registry lookup for ${name}@${version} failed (${kind}): ${redact(
        (result.stderr || result.stdout).trim().split('\n').slice(0, 3).join(' | '),
      )}`,
    );
  }
  let dist;
  try {
    dist = JSON.parse(result.stdout);
  } catch {
    throw new RegistryError('unexpected', `Registry returned non-JSON for ${name}@${version}`);
  }
  // `npm view pkg@range` can return an array when the spec matches several versions; we always ask
  // for an exact version, so an array or a missing integrity is an unexpected response.
  if (!dist || Array.isArray(dist) || typeof dist.integrity !== 'string')
    throw new RegistryError(
      'unexpected',
      `Registry response for ${name}@${version} has no dist.integrity`,
    );
  return {
    state: 'present',
    integrity: dist.integrity,
    shasum: dist.shasum,
    tarball: dist.tarball,
    attestations: Boolean(dist.attestations?.url),
  };
}
