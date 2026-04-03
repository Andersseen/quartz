import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import {
  DraggableDirective,
  DropZoneDirective,
  DragDropService,
  type QzDropInfo,
  type QzDragInfo,
} from 'quartz';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { KANBAN_SNIPPET, SORTABLE_SNIPPET, SIMPLE_SNIPPET } from './drag-drop.snippets';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-drag-drop-page',
  imports: [DraggableDirective, DropZoneDirective, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drag-drop.page.html',
  styleUrl: './drag-drop.page.scss',
})
export class DragDropPage {
  private dragDropService = inject(DragDropService);

  readonly columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ];

  readonly kanbanCode = KANBAN_SNIPPET;
  readonly sortableCode = SORTABLE_SNIPPET;
  readonly simpleCode = SIMPLE_SNIPPET;

  tasks = signal<Task[]>([
    {
      id: 'TASK-1',
      title: 'Design System',
      description: 'Create component library foundation',
      status: 'done',
      priority: 'high',
    },
    {
      id: 'TASK-2',
      title: 'Dark Mode',
      description: 'Implement theme switching',
      status: 'in-progress',
      priority: 'medium',
    },
    {
      id: 'TASK-3',
      title: 'Documentation',
      description: 'Write API docs and examples',
      status: 'todo',
      priority: 'low',
    },
    {
      id: 'TASK-4',
      title: 'Accessibility',
      description: 'ARIA labels and keyboard nav',
      status: 'todo',
      priority: 'high',
    },
    {
      id: 'TASK-5',
      title: 'Unit Tests',
      description: 'Achieve 90% coverage',
      status: 'in-progress',
      priority: 'medium',
    },
  ]);

  sortableItems = signal([
    { id: '01', text: 'First item' },
    { id: '02', text: 'Second item' },
    { id: '03', text: 'Third item' },
    { id: '04', text: 'Fourth item' },
    { id: '05', text: 'Fifth item' },
  ]);

  droppedMessage = signal<string | null>(null);

  getTasksByStatus(status: string): Task[] {
    return this.tasks().filter((t) => t.status === status);
  }

  onTaskDrop(event: QzDropInfo, newStatus: string): void {
    const task = event.data as Task;
    if (!task) return;

    this.tasks.update((tasks) =>
      tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus as Task['status'] } : t)),
    );
  }

  onDragStart(event: QzDragInfo): void {
    console.log('Drag started:', event.data);
  }

  onReorder(event: QzDropInfo): void {
    const item = event.data as { id: string; text: string };
    const newIndex = event.index;
    if (!item || newIndex === undefined) return;

    this.sortableItems.update((items) => {
      const oldIndex = items.findIndex((i) => i.id === item.id);
      if (oldIndex === -1) return items;

      const newItems = [...items];
      newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, item);
      return newItems;
    });
  }

  simpleDragStart(event: QzDragInfo): void {
    console.log('Simple drag started');
  }

  onSimpleDrop(event: QzDropInfo): void {
    const data = event.data as { message: string } | null;
    if (data?.message) {
      this.droppedMessage.set(data.message);
      setTimeout(() => this.droppedMessage.set(null), 2000);
    }
  }
}
