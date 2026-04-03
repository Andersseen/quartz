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
  template: `
    <app-demo-page
      badge="Interaction"
      title="Drag & Drop"
      description="Sortable lists and draggable elements with keyboard support and touch gestures. Built with native HTML5 Drag and Drop API."
      [features]="[
        { title: 'Native DnD', description: 'HTML5 Drag & Drop API' },
        { title: 'Sortable', description: 'Reorder items easily' },
        { title: 'Type Support', description: 'Categorize draggables' },
        { title: 'Touch Ready', description: 'Mobile compatible' },
      ]"
    >
      <div class="demos">
        <!-- Kanban Board Demo -->
        <section class="demo-section">
          <h2 class="demo-section__title">Kanban Board</h2>
          <p class="demo-section__desc">
            Drag tasks between columns to change their status. Each column accepts only 'task' type
            items.
          </p>

          <app-code-block [code]="kanbanCode">
            <div preview class="demo-preview">
              <div class="kanban">
                @for (column of columns; track column.id) {
                  <div
                    class="kanban__column"
                    qzDropZone
                    [qzDropZoneAccept]="['task']"
                    (drop)="onTaskDrop($event, column.id)"
                  >
                    <div class="kanban__header">
                      <span class="kanban__badge" [class]="'kanban__badge--' + column.id">
                        {{ getTasksByStatus(column.id).length }}
                      </span>
                      <h3 class="kanban__title">{{ column.title }}</h3>
                    </div>

                    <div class="kanban__tasks">
                      @for (task of getTasksByStatus(column.id); track task.id) {
                        <div
                          class="task-card"
                          qzDraggable
                          [qzDraggableData]="task"
                          qzDraggableType="task"
                          [qzDraggable]="{}"
                          (dragStart)="onDragStart($event)"
                        >
                          <div class="task-card__header">
                            <span
                              class="task-card__priority"
                              [class]="'task-card__priority--' + task.priority"
                            ></span>
                            <span class="task-card__id">{{ task.id }}</span>
                          </div>
                          <h4 class="task-card__title">{{ task.title }}</h4>
                          <p class="task-card__desc">{{ task.description }}</p>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </app-code-block>
        </section>

        <!-- Sortable List Demo -->
        <section class="demo-section">
          <h2 class="demo-section__title">Sortable List</h2>
          <p class="demo-section__desc">
            Drag items to reorder them within the list. The drop zone calculates the insertion index
            automatically.
          </p>

          <app-code-block [code]="sortableCode">
            <div preview class="demo-preview">
              <div
                class="sortable-list"
                qzDropZone
                [qzDropZoneSortable]="true"
                (drop)="onReorder($event)"
              >
                @for (item of sortableItems(); track item.id) {
                  <div
                    class="sortable-item"
                    qzDraggable
                    [qzDraggableData]="item"
                    qzDraggableType="sortable"
                  >
                    <span class="sortable-item__handle">⋮⋮</span>
                    <span class="sortable-item__number">{{ item.id }}</span>
                    <span class="sortable-item__text">{{ item.text }}</span>
                  </div>
                }
              </div>
            </div>
          </app-code-block>
        </section>

        <!-- Simple Drag Demo -->
        <section class="demo-section">
          <h2 class="demo-section__title">Simple Draggable</h2>
          <p class="demo-section__desc">
            Basic draggable element with custom data. Drop it anywhere in the drop zone below.
          </p>

          <app-code-block [code]="simpleCode">
            <div preview class="demo-preview demo-preview--center">
              <div class="simple-demo">
                <div
                  class="draggable-box"
                  qzDraggable
                  [qzDraggableData]="{ message: 'Hello from draggable!' }"
                  (dragStart)="simpleDragStart($event)"
                >
                  <span>🎁</span>
                  <span>Drag me!</span>
                </div>

                <div class="drop-target" qzDropZone (drop)="onSimpleDrop($event)">
                  @if (droppedMessage(); as msg) {
                    <div class="drop-result">
                      <span>✨</span>
                      <span>{{ msg }}</span>
                    </div>
                  } @else {
                    <span class="drop-placeholder">Drop here</span>
                  }
                </div>
              </div>
            </div>
          </app-code-block>
        </section>
      </div>
    </app-demo-page>
  `,
  styles: [
    `
      .demos {
        display: flex;
        flex-direction: column;
        gap: 3rem;
      }

      .demo-section {
        background: #0f0f13;
        border: 1px solid #1e1e2a;
        border-radius: 16px;
        padding: 1.5rem;
      }

      .demo-section__title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #e5e7eb;
        margin: 0 0 0.5rem;
      }

      .demo-section__desc {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 1.5rem;
        line-height: 1.5;
      }

      .demo-preview {
        padding: 1rem;
        min-height: 300px;
      }

      .demo-preview--center {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Kanban */
      .kanban {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .kanban__column {
        background: #0a0a0c;
        border: 1px solid #1e1e2a;
        border-radius: 12px;
        padding: 1rem;
        min-height: 300px;
        transition:
          border-color 0.2s,
          background 0.2s;
      }

      .kanban__column.qz-drag-over {
        border-color: #7c3aed;
        background: rgba(124, 58, 237, 0.05);
      }

      .kanban__header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #1e1e2a;
      }

      .kanban__badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #fff;
      }

      .kanban__badge--todo {
        background: #6b7280;
      }

      .kanban__badge--in-progress {
        background: #3b82f6;
      }

      .kanban__badge--done {
        background: #22c55e;
      }

      .kanban__title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #e5e7eb;
        margin: 0;
      }

      .kanban__tasks {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      /* Task Card */
      .task-card {
        background: #1e1e2a;
        border: 1px solid #2a2a3a;
        border-radius: 8px;
        padding: 0.875rem;
        cursor: grab;
        transition:
          transform 0.15s,
          box-shadow 0.15s;
      }

      .task-card:hover {
        border-color: #3a3a4a;
      }

      .task-card.qz-dragging {
        opacity: 0.5;
        cursor: grabbing;
      }

      .task-card__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }

      .task-card__priority {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .task-card__priority--low {
        background: #22c55e;
      }

      .task-card__priority--medium {
        background: #f59e0b;
      }

      .task-card__priority--high {
        background: #ef4444;
      }

      .task-card__id {
        font-size: 0.7rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .task-card__title {
        font-size: 0.875rem;
        font-weight: 500;
        color: #e5e7eb;
        margin: 0 0 0.25rem;
      }

      .task-card__desc {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0;
        line-height: 1.4;
      }

      /* Sortable List */
      .sortable-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 400px;
        margin: 0 auto;
      }

      .sortable-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: #1e1e2a;
        border: 1px solid #2a2a3a;
        border-radius: 8px;
        cursor: grab;
        transition: all 0.15s;
      }

      .sortable-item:hover {
        border-color: #3a3a4a;
      }

      .sortable-item.qz-dragging {
        opacity: 0.5;
      }

      .sortable-item__handle {
        color: #6b7280;
        font-size: 0.875rem;
        letter-spacing: -2px;
      }

      .sortable-item__number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: #0f0f13;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #a78bfa;
      }

      .sortable-item__text {
        flex: 1;
        font-size: 0.875rem;
        color: #e5e7eb;
      }

      /* Simple Demo */
      .simple-demo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
      }

      .draggable-box {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        border-radius: 12px;
        color: #fff;
        font-weight: 600;
        cursor: grab;
        box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3);
        transition: transform 0.15s;
      }

      .draggable-box:hover {
        transform: translateY(-2px);
      }

      .draggable-box.qz-dragging {
        cursor: grabbing;
        opacity: 0.8;
      }

      .drop-target {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 200px;
        height: 120px;
        background: #0a0a0c;
        border: 2px dashed #2a2a3a;
        border-radius: 12px;
        transition: all 0.2s;
      }

      .drop-target.qz-drag-over {
        border-color: #7c3aed;
        background: rgba(124, 58, 237, 0.05);
      }

      .drop-placeholder {
        color: #6b7280;
        font-size: 0.875rem;
      }

      .drop-result {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: #a78bfa;
        font-size: 0.875rem;
        font-weight: 500;
      }
    `,
  ],
})
export class DragDropPage {
  private dragDropService = inject(DragDropService);

  columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ];

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

  // Code examples
  kanbanCode = `<!-- Draggable Task -->
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

  sortableCode = `<!-- Sortable List -->
<div
  qzDropZone
  [qzDropZoneSortable]="true"
  (drop)="onReorder($event)">

  <div qzDraggable [qzDraggableData]="item">
    {{ item.text }}
  </div>

</div>`;

  simpleCode = `<!-- Draggable -->
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
