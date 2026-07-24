import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitPreference } from '../../core/ui/ui-presentation.types';
import { UiKitButtonComponent } from '../ui-kit-button/ui-kit-button.component';

@Component({
  selector: 'app-component-doc-card',
  standalone: true,
  imports: [UiKitButtonComponent],
  host: {
    '[attr.data-ui-kit]': 'kit === "inherit" ? null : kit'
  },
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .card {
        display: grid;
        align-content: start;
        gap: 14px;
        overflow: hidden;
        min-width: 0;
        height: 100%;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        box-shadow: var(--ch-shadow-card);
        color: var(--ch-color-text);
        padding: 18px;
      }

      header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        min-width: 0;
      }

      .identity,
      .detail {
        display: grid;
        gap: 6px;
        min-width: 0;
        max-width: 100%;
      }

      .card > *,
      .detail > * {
        min-width: 0;
        max-width: 100%;
      }

      h2,
      p,
      pre {
        margin: 0;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.05rem;
        line-height: 1.25;
      }

      p {
        color: var(--ch-color-muted);
        line-height: 1.5;
      }

      .selector,
      .badge,
      .consumer {
        border-radius: 999px;
        font-size: 0.76rem;
        font-weight: 800;
      }

      .selector {
        width: fit-content;
        max-width: 100%;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
        padding: 5px 8px;
        overflow-wrap: anywhere;
      }

      .badge {
        flex: 0 0 auto;
        background: var(--ch-color-surface-muted);
        color: var(--ch-color-muted);
        padding: 5px 8px;
      }

      .detail-label {
        color: var(--ch-color-muted);
        font-size: 0.74rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .consumers {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .consumer {
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        padding: 5px 8px;
      }

      pre {
        box-sizing: border-box;
        display: block;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        border-radius: 6px;
        background: color-mix(in srgb, var(--ch-color-text) 88%, #10263e);
        color: var(--ch-color-surface);
        padding: 12px;
        font-size: 0.78rem;
        line-height: 1.5;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      @media (max-width: 620px) {
        header {
          display: grid;
        }

        .badge {
          justify-self: start;
        }
      }
    `
  ],
  template: `
    <article class="card">
      <header>
        <div class="identity">
          <h2>{{ name }}</h2>
          <code class="selector">&lt;{{ selector }}&gt;</code>
        </div>
        <span class="badge">{{ status }}</span>
      </header>

      <p>{{ purpose }}</p>

      <app-ui-kit-button
        [label]="expanded ? collapseLabel : expandLabel"
        [icon]="expanded ? 'pi pi-eye-slash' : 'pi pi-eye'"
        [kit]="kit"
        tone="secondary"
        variant="outline"
        (pressed)="previewToggle.emit()"
      ></app-ui-kit-button>

      @if (expanded) {
        <ng-content select="[component-preview]"></ng-content>
      }

      <div class="detail">
        <span class="detail-label">Category</span>
        <span>{{ category }}</span>
      </div>

      <div class="detail">
        <span class="detail-label">Current Consumers</span>
        <div class="consumers">
          @for (consumer of consumers; track consumer) {
            <span class="consumer">{{ consumer }}</span>
          }
        </div>
      </div>

      <div class="detail">
        <span class="detail-label">Import</span>
        <pre>{{ importPath }}</pre>
      </div>

      <div class="detail">
        <span class="detail-label">Minimal Invocation</span>
        <pre>{{ example }}</pre>
      </div>
    </article>
  `
})
export class ComponentDocCardComponent {
  @Input({ required: true }) name = '';
  @Input({ required: true }) selector = '';
  @Input({ required: true }) purpose = '';
  @Input({ required: true }) status = '';
  @Input({ required: true }) category = '';
  @Input() consumers: string[] = [];
  @Input() importPath = '';
  @Input() example = '';
  @Input() expanded = false;
  @Input() kit: UiKitPreference = 'auto';
  @Input() expandLabel = 'Show Component';
  @Input() collapseLabel = 'Hide View';
  @Output() readonly previewToggle = new EventEmitter<void>();
}
