---
title: Drag & Drop
description: 'Sortable lists, between-container transfers, and drop zones — built on the native HTML5 DnD API with keyboard and touch support.'
group: Core
order: 35
---

## At a glance

- **Native DnD** — HTML5 Drag & Drop API
- **Sortable** — Reorder within a list
- **Typed drops** — Accept only matching types
- **Touch ready** — Mobile compatible

## Live examples

::demo[drag-drop]

## Code

### File Upload Zone

```html
<!-- Draggable file chip -->
<div qzDraggable [qzDraggableData]="file" qzDraggableType="file">{{ file.name }}</div>

<!-- Upload drop zone — accepts only 'file' type -->
<div qzDropZone [qzDropZoneAccept]="['file']" (qzDrop)="onFileDrop($event)">
  Drop files to upload
</div>
```

### Sortable List

```html
<!-- Sortable List -->
<div qzDropZone [qzDropZoneSortable]="true" (qzDrop)="onReorder($event)">
  <div qzDraggable [qzDraggableData]="item">{{ item.text }}</div>
</div>
```

### Between Containers (Kanban)

```html
<!-- Draggable Task -->
<div qzDraggable [qzDraggableData]="task" qzDraggableType="task">{{ task.title }}</div>

<!-- Drop Zone Column -->
<div qzDropZone [qzDropZoneAccept]="['task']" (qzDrop)="onTaskDrop($event, column.id)">
  <!-- Tasks here -->
</div>
```

### Free Position Drag

```html
<!-- Bounded container -->
<div class="canvas" (pointermove)="onMove($event)" (pointerup)="onRelease()">
  <!-- Freely positioned token -->
  @for (node of nodes(); track node.id) {
  <div
    class="token"
    [style.left.px]="node.x"
    [style.top.px]="node.y"
    (pointerdown)="onGrab($event, node.id)"
  >
    {{ node.label }}
  </div>
  }
</div>
```
