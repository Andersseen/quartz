#!/usr/bin/env node
'use strict';

const { add } = require('../commands/add');
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
  --verbose, -v        Show each copied file
  --help, -h           Show this help

Examples:
  node cli/bin/quartz.js add splitter
  node cli/bin/quartz.js add overlay dialog
  node cli/bin/quartz.js add splitter -o src/app/primitives
  `);
}

function parseFlags(rawArgs) {
  const components = [];
  const flags = { output: null, verbose: false };
  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a === '--output' || a === '-o') { flags.output = rawArgs[++i]; }
    else if (a === '--verbose' || a === '-v') { flags.verbose = true; }
    else if (!a.startsWith('-')) { components.push(a); }
  }
  return { components, flags };
}

if (!command || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command === 'list') {
  console.log('\nAvailable Quartz UI components:\n');
  for (const [name, entry] of Object.entries(REGISTRY)) {
    console.log(`  ${name.padEnd(14)} ${entry.description}`);
  }
  console.log('');
  process.exit(0);
}

if (command === 'add') {
  const { components, flags } = parseFlags(args.slice(1));
  add(components, flags);
  process.exit(0);
}

console.error(`Unknown command: ${command}`);
printHelp();
process.exit(1);
