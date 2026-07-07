import { Component, Input } from '@angular/core';

export type WorkflowGuideTone = 'info' | 'success' | 'warning';

@Component({
  selector: 'app-workflow-guide',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
      }

      .guide {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: center;
        border-left: 4px solid #1554a2;
        background: #eef6ff;
        padding: 13px 15px;
      }

      .guide.success {
        border-left-color: #238152;
        background: #f1faf5;
      }

      .guide.warning {
        border-left-color: #b87515;
        background: #fff8ec;
      }

      .copy {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .step {
        color: #587087;
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
      }

      strong {
        color: #153b61;
        font-size: 1rem;
      }

      p {
        margin: 0;
        color: #49647c;
        line-height: 1.45;
      }

      .actions:empty {
        display: none;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
        align-items: center;
      }

      @media (max-width: 720px) {
        .guide {
          grid-template-columns: 1fr;
        }

        .actions {
          justify-content: flex-start;
        }
      }
    `
  ],
  template: `
    <section class="guide" [class.success]="tone === 'success'" [class.warning]="tone === 'warning'">
      <div class="copy">
        @if (stepLabel) {
          <span class="step">{{ stepLabel }}</span>
        }
        <strong>{{ title }}</strong>
        <p>{{ description }}</p>
      </div>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </section>
  `
})
export class WorkflowGuideComponent {
  @Input() stepLabel = '';
  @Input() title = '';
  @Input() description = '';
  @Input() tone: WorkflowGuideTone = 'info';
}
