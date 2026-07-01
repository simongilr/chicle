import { Component, Input } from '@angular/core';

export type StatusNoticeTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-status-notice',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
      }

      .notice {
        display: grid;
        gap: 8px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #f8fbfe;
        color: #254057;
        padding: 14px;
      }

      .notice.info {
        border-color: #b7cce2;
        background: #f2f8ff;
      }

      .notice.success {
        border-color: #a9ddb7;
        background: #f4fbf6;
        color: #17643a;
      }

      .notice.warning {
        border-color: #e6bd7d;
        background: #fff9ef;
        color: #71400f;
      }

      .notice.error {
        border-color: #f1b4b4;
        background: #fff6f6;
        color: #8b2323;
      }

      strong {
        font-weight: 850;
      }

      .actions:empty {
        display: none;
      }
    `
  ],
  template: `
    <section
      class="notice"
      [class.info]="tone === 'info'"
      [class.success]="tone === 'success'"
      [class.warning]="tone === 'warning'"
      [class.error]="tone === 'error'"
    >
      @if (title) {
        <strong>{{ title }}</strong>
      }
      <ng-content></ng-content>
      <div class="actions">
        <ng-content select="[notice-action]"></ng-content>
      </div>
    </section>
  `
})
export class StatusNoticeComponent {
  @Input() title = '';
  @Input() tone: StatusNoticeTone = 'neutral';
}
