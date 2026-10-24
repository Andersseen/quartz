---
title: Toast
description: 'Notification system with multiple positions, durations, and action support. Keep users informed without interrupting their workflow.'
group: Primitives
order: 103
---

## At a glance

- **6 Positions** — All corners + centers
- **Auto-dismiss** — Configurable duration
- **Persistent** — Manual close option
- **Actions** — Button support

## Live examples

::demo[toast]

## Code

### Toast Types

```ts
// Shorthand methods
toastService.success('Operation completed!', 'Success');
toastService.error('Something went wrong!', 'Error');
toastService.warning('Please review your input.', 'Warning');
toastService.info('This is an informational message.', 'Info');
```

### Positions

```ts
// Any of 6 positions
toastService.show({
  type: 'info',
  message: 'Positioned toast',
  position: 'top-right', // or 'bottom-center', etc.
});
```

### Duration Control

```ts
// Custom duration (ms)
toastService.show({
  type: 'info',
  message: 'Quick toast',
  duration: 2000, // 2 seconds
});

// Persistent toast
toastService.show({
  type: 'info',
  message: 'Manual close required',
  duration: 0, // No auto-dismiss
  closable: true,
});
```

### API Usage

```ts
// Full options
toastService.show({
  type: 'success',
  title: 'Changes Saved',
  message: 'Your modifications have been saved successfully.',
  position: 'bottom-right',
  duration: 5000,
  closable: true,
});
```
