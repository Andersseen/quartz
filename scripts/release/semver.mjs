/**
 * Minimal, dependency-free semver for the release tooling.
 *
 * Only the range forms Quartz is allowed to publish are supported: an exact version, a caret
 * range (`^X.Y.Z[-pre]`) and `||` unions of those. Anything else throws, so an unexpected
 * peer range is rejected instead of silently interpreted. Prerelease handling follows npm: a
 * prerelease version only satisfies a comparator that names a prerelease of the SAME
 * major.minor.patch tuple.
 */

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export function parse(version) {
  const m = SEMVER.exec(String(version));
  if (!m) throw new Error(`Invalid semver version: ${JSON.stringify(version)}`);
  const pre = m[4] ? m[4].split('.') : [];
  for (const id of pre) {
    if (/^\d+$/.test(id) && id.length > 1 && id.startsWith('0'))
      throw new Error(`Invalid semver version (numeric prerelease with leading zero): ${version}`);
  }
  return { major: +m[1], minor: +m[2], patch: +m[3], pre, raw: String(version) };
}

export const isPrerelease = (version) => parse(version).pre.length > 0;

function comparePre(a, b) {
  if (!a.length && !b.length) return 0;
  if (!a.length) return 1; // a release outranks its prereleases
  if (!b.length) return -1;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === undefined) return -1;
    if (b[i] === undefined) return 1;
    const an = /^\d+$/.test(a[i]);
    const bn = /^\d+$/.test(b[i]);
    if (an && bn) {
      if (+a[i] !== +b[i]) return +a[i] < +b[i] ? -1 : 1;
    } else if (an !== bn) return an ? -1 : 1;
    else if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

export function compare(x, y) {
  const a = typeof x === 'string' ? parse(x) : x;
  const b = typeof y === 'string' ? parse(y) : y;
  for (const k of ['major', 'minor', 'patch']) if (a[k] !== b[k]) return a[k] < b[k] ? -1 : 1;
  return comparePre(a.pre, b.pre);
}

function caretUpper(v) {
  if (v.major > 0) return { major: v.major + 1, minor: 0, patch: 0, pre: [] };
  if (v.minor > 0) return { major: 0, minor: v.minor + 1, patch: 0, pre: [] };
  return { major: 0, minor: 0, patch: v.patch + 1, pre: [] };
}

function satisfiesComparator(version, comparator) {
  const c = comparator.trim();
  if (c.startsWith('^')) {
    const low = parse(c.slice(1));
    const high = caretUpper(low);
    if (compare(version, low) < 0 || compare(version, high) >= 0) return false;
    // npm: a prerelease only matches when the comparator itself is a prerelease of the same tuple.
    if (version.pre.length) {
      return (
        low.pre.length > 0 &&
        low.major === version.major &&
        low.minor === version.minor &&
        low.patch === version.patch
      );
    }
    return true;
  }
  if (SEMVER.test(c)) return compare(version, parse(c)) === 0;
  throw new Error(`Unsupported range syntax: ${JSON.stringify(comparator)}`);
}

export function satisfies(version, range) {
  const v = parse(version);
  return String(range)
    .split('||')
    .some((part) => satisfiesComparator(v, part));
}

/**
 * Peer range Primitives must declare for its companion Core. Stable releases use a caret;
 * prereleases pin the exact companion so a `next` install can never resolve a different build.
 */
export function corePeerRangeFor(version) {
  return isPrerelease(version) ? version : `^${version}`;
}

/** npm dist-tag for a version: prereleases never reach `latest`. */
export function distTagFor(version) {
  return isPrerelease(version) ? 'next' : 'latest';
}

/** Only `beta.N` and `rc.N` prereleases are valid release channels. */
export function validateReleaseVersion(version) {
  const v = parse(version);
  if (v.pre.length && !/^(beta|rc)\.(0|[1-9]\d*)$/.test(v.pre.join('.')))
    throw new Error(
      `Invalid prerelease "${version}": only -beta.N and -rc.N identifiers may be released`,
    );
  return v;
}
