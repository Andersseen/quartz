/**
 * Release artifacts: pack ONCE, describe, verify.
 *
 * `packArtifacts` turns the built `dist/` folders into tarballs plus `release-manifest.json`
 * (sha256 + npm integrity + source commit + toolchain). Every later job re-verifies the tarballs
 * against that manifest (`verifyManifestFiles`) and the publish job uploads exactly those files.
 * A tarball changed after packing fails because its recomputed hash no longer matches.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import { corePeerRangeFor, parse, satisfies, validateReleaseVersion } from './semver.mjs';

export const PACKAGES = [
  { key: 'core', name: '@quartz-headless/core', dist: 'packages/core/dist' },
  { key: 'primitives', name: '@quartz-headless/primitives', dist: 'packages/primitives/dist' },
];
export const ANGULAR_PEER = '^21.2.0 || ^22.0.0';
export const MANIFEST_FILE = 'release-manifest.json';

const FORBIDDEN = [
  [/(^|\/)node_modules\//, 'node_modules'],
  [/\.(spec|test)\.[cm]?[jt]s$/, 'test file'],
  [/(^|\/)(src|e2e|consumer|demo|docs|scripts|cli)\//, 'repository source folder'],
  [/(?<!\.d)\.ts$/, 'TypeScript source (only .d.ts is allowed)'],
  [/(^|\/)\.(env|npmrc)/, 'secret/config file'],
  [/(^|\/)(tsconfig|ng-package|vite\.config)[^/]*$/, 'build config'],
];

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
export const npmIntegrity = (buf) => `sha512-${createHash('sha512').update(buf).digest('base64')}`;

const tar = (args) => execFileSync('tar', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

export function listTarball(file) {
  return tar(['-tzf', file])
    .split('\n')
    .filter((l) => l && !l.endsWith('/'))
    .map((l) => l.replace(/^package\//, ''));
}

export function readTarballJson(file, inner) {
  return JSON.parse(tar(['-xzOf', file, `package/${inner}`]));
}

/** Collect every file a package.json `exports`/typings/module field points at. */
function referencedFiles(pkg) {
  const out = new Set();
  const add = (p) => typeof p === 'string' && p.startsWith('.') && out.add(p.replace(/^\.\//, ''));
  const walk = (node) => {
    if (typeof node === 'string') add(node);
    else if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };
  walk(pkg.exports);
  add(pkg.module);
  add(pkg.typings);
  add(pkg.types);
  out.delete('package.json');
  return [...out];
}

/**
 * Inspect a tarball against the packaging contract. Returns { problems, info }.
 * @param {string} file tarball path
 * @param {{name:string, version:string, coreVersion?:string}} expected
 */
export function inspectTarball(file, expected) {
  const problems = [];
  const files = listTarball(file);
  const pkg = readTarballJson(file, 'package.json');
  const fileSet = new Set(files);

  if (pkg.name !== expected.name) problems.push(`name is ${pkg.name}, expected ${expected.name}`);
  if (pkg.version !== expected.version)
    problems.push(`version is ${pkg.version}, expected ${expected.version}`);
  if (pkg.private === true) problems.push('package is marked private');
  if (pkg.sideEffects !== false)
    problems.push(`sideEffects must be false, found ${JSON.stringify(pkg.sideEffects)}`);
  if (pkg.license !== 'MIT') problems.push(`license field must be MIT, found ${pkg.license}`);
  for (const must of ['README.md', 'LICENSE', 'package.json'])
    if (!fileSet.has(must)) problems.push(`missing ${must}`);

  for (const f of files)
    for (const [re, why] of FORBIDDEN)
      if (re.test(f)) {
        problems.push(`unexpected file ${f} (${why})`);
        break;
      }

  for (const script of ['preinstall', 'install', 'postinstall', 'prepare', 'prepublish'])
    if (pkg.scripts?.[script]) problems.push(`lifecycle script "${script}" must not ship`);

  const deps = Object.keys(pkg.dependencies ?? {});
  if (deps.some((d) => d !== 'tslib'))
    problems.push(`unexpected runtime dependencies: ${deps.join(', ')}`);
  if (pkg.optionalDependencies && Object.keys(pkg.optionalDependencies).length)
    problems.push('optionalDependencies must be empty');

  for (const ref of referencedFiles(pkg))
    if (!fileSet.has(ref)) problems.push(`exports/typings reference missing file ${ref}`);
  const exportsMap = pkg.exports ?? {};
  for (const [subpath, conditions] of Object.entries(exportsMap)) {
    if (subpath === './package.json') continue;
    if (!conditions.types) problems.push(`export "${subpath}" has no "types" condition`);
    if (!conditions.default) problems.push(`export "${subpath}" has no "default" condition`);
  }

  const peers = pkg.peerDependencies ?? {};
  for (const ng of ['@angular/core', '@angular/common'])
    if (peers[ng] !== ANGULAR_PEER)
      problems.push(`peer ${ng} is ${peers[ng]}, expected ${ANGULAR_PEER}`);
  if (expected.name.endsWith('/primitives')) {
    if (!exportsMap['./forms'])
      problems.push('secondary entry point ./forms is missing from exports');
    if (pkg.peerDependenciesMeta?.['@angular/forms']?.optional !== true)
      problems.push('@angular/forms must be an optional peer');
    if (peers['@angular/forms'] !== ANGULAR_PEER)
      problems.push(`peer @angular/forms is ${peers['@angular/forms']}, expected ${ANGULAR_PEER}`);
    const corePeer = peers['@quartz-headless/core'];
    const wanted = corePeerRangeFor(expected.version);
    if (corePeer !== wanted)
      problems.push(`Core peer is ${corePeer}, release policy requires ${wanted}`);
    else if (!satisfies(expected.coreVersion ?? expected.version, corePeer))
      problems.push(`Core peer ${corePeer} does not accept companion Core ${expected.coreVersion}`);
    if (pkg.devDependencies) problems.push('devDependencies must not ship');
  }

  return {
    problems,
    info: {
      exports: Object.fromEntries(
        Object.entries(exportsMap).map(([k, v]) => [k, typeof v === 'string' ? v : { ...v }]),
      ),
      typings: pkg.typings ?? null,
      peerDependencies: peers,
      peerDependenciesMeta: pkg.peerDependenciesMeta ?? {},
      dependencies: pkg.dependencies ?? {},
      sideEffects: pkg.sideEffects,
      engines: pkg.engines ?? {},
      fileCount: files.length,
    },
  };
}

function gitSha(root) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
}

/**
 * Pack both built dist folders once and write the manifest.
 * @returns {object} manifest
 */
export function packArtifacts({ root, outDir, sourceCommit, toolchain = {} }) {
  mkdirSync(outDir, { recursive: true });
  const versions = {};
  for (const p of PACKAGES) {
    const distPkg = join(root, p.dist, 'package.json');
    if (!existsSync(distPkg))
      throw new Error(`${p.dist} is not built — run \`pnpm build:lib\` first`);
    versions[p.key] = JSON.parse(readFileSync(distPkg, 'utf8')).version;
  }
  if (versions.core !== versions.primitives)
    throw new Error(
      `Core (${versions.core}) and Primitives (${versions.primitives}) must share one version`,
    );
  const version = versions.core;
  validateReleaseVersion(version);

  const manifest = {
    schema: 1,
    version,
    prerelease: parse(version).pre.length > 0,
    sourceCommit: sourceCommit ?? gitSha(root),
    toolchain: {
      node: process.version,
      npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
      ...toolchain,
    },
    packages: [],
  };
  for (const p of PACKAGES) {
    const raw = execFileSync('npm', ['pack', '--json', '--pack-destination', outDir], {
      cwd: join(root, p.dist),
      encoding: 'utf8',
    });
    const filename = JSON.parse(raw)[0].filename;
    const file = join(outDir, filename);
    const bytes = readFileSync(file);
    const { problems, info } = inspectTarball(file, {
      name: p.name,
      version,
      coreVersion: version,
    });
    if (problems.length)
      throw new Error(
        `${p.name} tarball violates the package contract:\n  - ${problems.join('\n  - ')}`,
      );
    manifest.packages.push({
      key: p.key,
      name: p.name,
      version,
      filename,
      size: bytes.length,
      sha256: sha256(bytes),
      integrity: npmIntegrity(bytes),
      ...info,
    });
  }
  writeFileSync(join(outDir, MANIFEST_FILE), JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(
    join(outDir, 'SHA256SUMS'),
    manifest.packages.map((p) => `${p.sha256}  ${p.filename}`).join('\n') + '\n',
  );
  return manifest;
}

export function readManifest(dir) {
  const file = join(dir, MANIFEST_FILE);
  if (!existsSync(file)) throw new Error(`${MANIFEST_FILE} not found in ${dir}`);
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  if (manifest.schema !== 1 || !Array.isArray(manifest.packages) || manifest.packages.length !== 2)
    throw new Error(`${MANIFEST_FILE} has an unexpected shape`);
  return manifest;
}

/**
 * Re-verify tarballs on disk against the manifest and the packaging contract.
 * Throws with every problem listed; never trusts a filename alone.
 */
export function verifyManifestFiles(dir, { expectedCommit } = {}) {
  const manifest = readManifest(dir);
  const problems = [];
  validateReleaseVersion(manifest.version);
  if (expectedCommit && manifest.sourceCommit !== expectedCommit)
    problems.push(`manifest source ${manifest.sourceCommit} != expected commit ${expectedCommit}`);
  const core = manifest.packages.find((p) => p.key === 'core');
  const prim = manifest.packages.find((p) => p.key === 'primitives');
  if (!core || !prim) throw new Error('manifest must contain core and primitives');
  const onDisk = readdirSync(dir).filter((f) => f.endsWith('.tgz'));
  const known = new Set(manifest.packages.map((p) => p.filename));
  for (const f of onDisk)
    if (!known.has(f)) problems.push(`unlisted tarball ${f} in artifact directory`);
  for (const p of manifest.packages) {
    const file = join(dir, p.filename);
    if (!existsSync(file)) {
      problems.push(`${p.filename} is missing`);
      continue;
    }
    const bytes = readFileSync(file);
    if (sha256(bytes) !== p.sha256 || npmIntegrity(bytes) !== p.integrity) {
      // A modified archive may not even be readable: report the hash failure and do not inspect it.
      problems.push(`${p.filename}: sha256/npm integrity mismatch (artifact was modified)`);
      continue;
    }
    if (p.version !== manifest.version)
      problems.push(`${p.name}: version ${p.version} != release ${manifest.version}`);
    const r = inspectTarball(file, {
      name: p.name,
      version: manifest.version,
      coreVersion: core.version,
    });
    problems.push(...r.problems.map((m) => `${p.filename}: ${m}`));
  }
  if (problems.length)
    throw new Error(`Artifact verification failed:\n  - ${problems.join('\n  - ')}`);
  return manifest;
}

/** Copy verified tarballs into `dest` and return { core, primitives } absolute paths. */
export function stageVerifiedTarballs(dir, dest, opts) {
  const manifest = verifyManifestFiles(dir, opts);
  mkdirSync(dest, { recursive: true });
  const out = {};
  for (const p of manifest.packages) {
    copyFileSync(join(dir, p.filename), join(dest, p.filename));
    out[p.key] = join(dest, basename(p.filename));
  }
  return out;
}
