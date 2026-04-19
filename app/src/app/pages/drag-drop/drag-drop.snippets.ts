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
  (qzDrop)="onTaskDrop($event, column.id)">
  <!-- Tasks here -->
</div>`;

export const SORTABLE_SNIPPET = `<!-- Sortable List -->
<div
  qzDropZone
  [qzDropZoneSortable]="true"
  (qzDrop)="onReorder($event)">

  <div qzDraggable [qzDraggableData]="item">
    {{ item.text }}
  </div>

</div>`;

export const UPLOAD_SNIPPET = `<!-- Draggable file chip -->
<div
  qzDraggable
  [qzDraggableData]="file"
  qzDraggableType="file">
  {{ file.name }}
</div>

<!-- Upload drop zone — accepts only 'file' type -->
<div
  qzDropZone
  [qzDropZoneAccept]="['file']"
  (qzDrop)="onFileDrop($event)">
  Drop files to upload
</div>`;
