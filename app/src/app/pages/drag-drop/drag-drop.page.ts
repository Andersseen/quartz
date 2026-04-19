import { Component, ChangeDetectionStrategy, signal, inject, NgZone } from '@angular/core';
import {
  DraggableDirective,
  DropZoneDirective,
  DragDropService,
  type QzDropInfo,
  type QzDragInfo,
} from 'quartz';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { KANBAN_SNIPPET, SORTABLE_SNIPPET, UPLOAD_SNIPPET } from './drag-drop.snippets';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
}

interface FileItem {
  id: string;
  name: string;
  icon: string;
  size: string;
  type: string;
}

interface UploadEntry extends FileItem {
  progress: number;
  done: boolean;
}

@Component({
  selector: 'app-drag-drop-page',
  imports: [DraggableDirective, DropZoneDirective, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drag-drop.page.html',
  styleUrl: './drag-drop.page.scss',
})
export default class DragDropPage {
  private readonly zone = inject(NgZone);
  private dragDropService = inject(DragDropService);

  // ─── Kanban ───────────────────────────────────────────────────────────────
  readonly columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ];

  tasks = signal<Task[]>([
    { id: 'T-1', title: 'Design System', description: 'Component library foundation', status: 'done', priority: 'high' },
    { id: 'T-2', title: 'Dark Mode', description: 'Implement theme switching', status: 'in-progress', priority: 'medium' },
    { id: 'T-3', title: 'Documentation', description: 'Write API docs', status: 'todo', priority: 'low' },
    { id: 'T-4', title: 'Accessibility', description: 'ARIA & keyboard nav', status: 'todo', priority: 'high' },
    { id: 'T-5', title: 'Unit Tests', description: 'Achieve 90% coverage', status: 'in-progress', priority: 'medium' },
  ]);

  getTasksByStatus(status: string): Task[] {
    return this.tasks().filter(t => t.status === status);
  }

  onTaskDrop(event: QzDropInfo, newStatus: string): void {
    const task = event.data as Task;
    if (!task) return;
    this.tasks.update(tasks =>
      tasks.map(t => t.id === task.id ? { ...t, status: newStatus as Task['status'] } : t)
    );
  }

  // ─── Sortable list ────────────────────────────────────────────────────────
  sortableItems = signal([
    { id: '01', text: 'First item' },
    { id: '02', text: 'Second item' },
    { id: '03', text: 'Third item' },
    { id: '04', text: 'Fourth item' },
    { id: '05', text: 'Fifth item' },
  ]);

  onReorder(event: QzDropInfo): void {
    const item = event.data as { id: string; text: string };
    const newIndex = event.index;
    if (!item || newIndex === undefined) return;
    this.sortableItems.update(items => {
      const oldIndex = items.findIndex(i => i.id === item.id);
      if (oldIndex === -1) return items;
      const next = [...items];
      next.splice(oldIndex, 1);
      next.splice(newIndex, 0, item);
      return next;
    });
  }

  // ─── File upload simulation ───────────────────────────────────────────────
  readonly fileItems = signal<FileItem[]>([
    { id: 'f1', name: 'design-system.pdf', icon: '📄', size: '2.4 MB', type: 'file' },
    { id: 'f2', name: 'hero-image.png', icon: '🖼️', size: '1.1 MB', type: 'file' },
    { id: 'f3', name: 'app.component.ts', icon: '🔷', size: '4.2 KB', type: 'file' },
    { id: 'f4', name: 'data.json', icon: '📋', size: '8.9 KB', type: 'file' },
  ]);

  uploadQueue = signal<UploadEntry[]>([]);

  onFileDrop(event: QzDropInfo): void {
    const file = event.data as FileItem;
    if (!file) return;

    // Remove from source list
    this.fileItems.update(items => items.filter(f => f.id !== file.id));

    // Add to queue with progress 0
    const entry: UploadEntry = { ...file, progress: 0, done: false };
    this.uploadQueue.update(q => [...q, entry]);

    // Animate progress
    this.zone.runOutsideAngular(() => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 8;
        this.zone.run(() => {
          this.uploadQueue.update(q =>
            q.map(e => e.id === file.id ? { ...e, progress: Math.min(progress, 100) } : e)
          );
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              this.uploadQueue.update(q =>
                q.map(e => e.id === file.id ? { ...e, done: true } : e)
              );
            }, 200);
          }
        });
      }, 80);
    });
  }

  resetUpload(): void {
    this.uploadQueue.set([]);
    this.fileItems.set([
      { id: 'f1', name: 'design-system.pdf', icon: '📄', size: '2.4 MB', type: 'file' },
      { id: 'f2', name: 'hero-image.png', icon: '🖼️', size: '1.1 MB', type: 'file' },
      { id: 'f3', name: 'app.component.ts', icon: '🔷', size: '4.2 KB', type: 'file' },
      { id: 'f4', name: 'data.json', icon: '📋', size: '8.9 KB', type: 'file' },
    ]);
  }

  // ─── Snippets ─────────────────────────────────────────────────────────────
  readonly kanbanCode = KANBAN_SNIPPET;
  readonly sortableCode = SORTABLE_SNIPPET;
  readonly uploadCode = UPLOAD_SNIPPET;

  onDragStart(_event: QzDragInfo): void {}
}
