export const KANBAN_SNIPPET = `<!-- Draggable Task -->
<div
  qzDraggable
  [qzDraggableData]="task"
  qzDraggableType="task">
  {{ task.title }}
</div>

<!-- Drop Zone Column -->
<div
  qzDropZone
  [qzDropZoneAccept]="['task']"
  (drop)="onTaskDrop($event, column.id)">
  <!-- Tasks here -->
</div>`;

export const SORTABLE_SNIPPET = `<!-- Sortable List -->
<div
  qzDropZone
  [qzDropZoneSortable]="true"
  (drop)="onReorder($event)">

  <div qzDraggable [qzDraggableData]="item">
    {{ item.text }}
  </div>

</div>`;

export const SIMPLE_SNIPPET = `<!-- Draggable -->
<div
  qzDraggable
  [qzDraggableData]="{ message: 'Hello!' }"
  (dragStart)="onDragStart($event)">
  Drag me!
</div>

<!-- Drop Zone -->
<div qzDropZone (drop)="onDrop($event)">
  Drop here
</div>`;
