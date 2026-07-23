import { Component, Input } from '@angular/core';

export type DocumentationSectionTone = 'default' | 'critical' | 'setup' | 'ops' | 'security';

@Component({
  selector: 'app-documentation-section-card',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
        scroll-margin-top: 18px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 18px;
        overflow-wrap: anywhere;
      }

      :host([data-tone='critical']) {
        border-left: 4px solid var(--ch-color-danger);
      }

      :host([data-tone='setup']) {
        border-left: 4px solid var(--ch-color-success);
      }

      :host([data-tone='ops']) {
        border-left: 4px solid var(--ch-color-warning);
      }

      :host([data-tone='security']) {
        border-left: 4px solid var(--ch-color-primary);
      }

      .section-header {
        display: grid;
        gap: 6px;
        margin-bottom: 14px;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.25rem;
      }

      p {
        max-width: 800px;
        color: var(--ch-color-muted);
        line-height: 1.55;
      }
    `
  ],
  host: {
    '[attr.id]': 'sectionId',
    '[attr.data-tone]': 'tone',
    '[attr.title]': 'null'
  },
  template: `
    <div class="section-header">
      <h2>{{ title }}</h2>
      @if (lead) {
        <p>{{ lead }}</p>
      }
    </div>
    <ng-content></ng-content>
  `
})
export class DocumentationSectionCardComponent {
  @Input({ required: true }) sectionId = '';
  @Input({ required: true }) title = '';
  @Input() lead = '';
  @Input() tone: DocumentationSectionTone = 'default';
}
