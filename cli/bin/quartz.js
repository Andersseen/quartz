#!/usr/bin/env node
'use strict';

const { add, CliError, EXIT } = require('../commands/add');
const { REGISTRY } = require('../registry');

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
Quartz UI — Headless Angular primitives

Usage:
  quartz <command> [options]

Commands:
  add <component...>   Copy component source files into your project
  list                 List all available components

Options:
  --output, -o <dir>   Output directory (default: auto-detected)
  --force, -f          Overwrite files you have modified (default: refuse, write nothing)
  --dry-run            Show what would be copied without writing
  --verbose, -v        Show each copied file
  --help, -h           Show this help

Exit codes:
  0 ok · 2 usage · 3 unknown component · 4 destination conflict · 5 missing source · 6 I/O error

Examples:
  node cli/bin/quartz.js add splitter
  node cli/bin/quartz.js add overlay dialog
  node cli/bin/quartz.js add splitter -o src/app/primitives
  `);
}

function usageError(message) {
  throw new CliError('E_USAGE', EXIT.USAGE, message);
}

function parseFlags(rawArgs) {
  const components = [];
  const flags = { output: null, verbose: false, force: false, dryRun: false };
  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a === '--output' || a === '-o') {
      const value = rawArgs[++i];
      if (value === undefined || value.startsWith('-')) usageError(`${a} requires a directory`);
      flags.output = value;
    } else if (a.startsWith('--output=')) {
      flags.output = a.slice('--output='.length);
      if (!flags.output) usageError('--output requires a directory');
    } else if (a === '--verbose' || a === '-v') flags.verbose = true;
    else if (a === '--force' || a === '-f') flags.force = true;
    else if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--help' || a === '-h') flags.help = true;
    else if (a.startsWith('-')) usageError(`Unknown option: ${a}`);
    else components.push(a);
  }
  return { components, flags };
}

function main() {
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'list') {
    console.log('\nAvailable Quartz UI components:\n');
    for (const [name, entry] of Object.entries(REGISTRY)) {
      if (entry.internal) continue;
      console.log(`  ${name.padEnd(14)} ${entry.description}`);
    }
    console.log('');
    return;
  }

  if (command === 'add') {
    const { components, flags } = parseFlags(args.slice(1));
    if (flags.help) return printHelp();
    add(components, flags);
    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exitCode = EXIT.USAGE;
}

try {
  main();
} catch (error) {
  if (error instanceof CliError) {
    console.error(`\n✗  ${error.message}\n   [${error.code}]`);
    process.exitCode = error.exitCode;
  } else {
    console.error(error);
    process.exitCode = 1;
  }
}
