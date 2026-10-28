---
title: Avatar
description: Image loading and consumer supplied fallback behavior.
group: Primitives
order: 107
---

Avatar manages whether a profile image has loaded and when to show a supplied fallback. Use native `<img>` when you do not need managed load and error state.

## Live demo

::demo[avatar]

::playground[quartz-avatar]

## Installation and imports

```sh
pnpm quartz add avatar
```

```ts
import { AvatarComponent } from '@quartz-headless/primitives';
```

## Usage

```html
<qz-avatar src="/people/jane.jpg" alt="Jane Doe" fallback="JD" [fallbackDelay]="300" />
```

The standalone component exposes `src`, `alt`, `fallback`, and `fallbackDelay`. Until the image loads, the optional fallback is shown immediately for a zero delay or after the requested delay. A load error shows the fallback immediately. Changing `src` resets the load state and starts the delay again. `data-qz-state` is `empty`, `loading`, `fallback`, or `loaded`; image and fallback elements expose `data-qz-part`. The consumer owns dimensions and appearance. There is no keyboard behavior. Server rendering starts with fallback content; after hydration the client applies the configured delay while the image loads. Timers use the document window and are cleaned up on destroy; keep initial sources consistent between server and client to avoid hydration changes. CLI source-copy usage is `pnpm quartz add avatar`; see the API reference.
