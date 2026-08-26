// Quartz Headless — root barrel.
//
// Re-exports both layers for backward compatibility with existing `from 'quartz-headless'`
// imports. Consumers who want a layered import can instead use the secondary entry points:
//   import { OverlayService } from 'quartz-headless/core';
//   import { DialogService } from 'quartz-headless/primitives';
// See docs/ai/ARCHITECTURE.md for the Core / Headless Primitives split.
export * from './core/public-api';
export * from './primitives/public-api';
