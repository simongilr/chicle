import { Component, Input } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-admin-code-block',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: grid;
        gap: 8px;
        min-width: 0;
      }

      .label {
        color: var(--ch-color-text);
        font-size: 1rem;
        font-weight: 850;
      }

      pre {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        max-height: var(--code-max-height);
        margin: 0;
        overflow: auto;
        border: 1px solid color-mix(in srgb, var(--ch-color-primary) 20%, transparent);
        border-radius: var(--code-radius);
        background: #10243b;
        color: #f7fbff;
        padding: 14px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.82rem;
        line-height: 1.45;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      :host([data-ui-kit='ionic']) pre {
        --code-radius: 14px;
      }

      :host([data-ui-kit='material']) pre {
        --code-radius: 4px;
      }

      :host([data-ui-kit='bootstrap']) pre {
        --code-radius: 6px;
      }

      :host([data-ui-kit='native']) pre {
        --code-radius: 2px;
      }
    `
  ],
  template: `
    @if (label) {
      <span class="label">{{ label }}</span>
    }
    <pre [style.--code-max-height]="maxHeight">{{ renderedValue }}</pre>
  `
})
export class AdminCodeBlockComponent extends UiKitAwareComponent {
  @Input() label = '';
  @Input() value: unknown = '';
  @Input() maxHeight = '360px';

  get renderedValue() {
    return typeof this.value === 'string' ? this.value : JSON.stringify(this.value ?? null, null, 2);
  }
}
