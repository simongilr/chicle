import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-code-textarea',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .code-field {
        display: grid;
        gap: 8px;
        min-width: 0;
      }

      label {
        color: var(--ch-color-text);
        font-size: 0.82rem;
        font-weight: 850;
      }

      textarea {
        width: 100%;
        height: var(--code-min-height, 180px);
        min-height: var(--code-min-height, 180px) !important;
        max-height: var(--code-max-height, 70vh);
        resize: vertical;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-code-bg, #102033);
        color: var(--ch-color-code-text, #eaf4ff);
        box-shadow: inset 0 1px 0 color-mix(in srgb, white 6%, transparent);
        padding: 12px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
        font-size: 0.84rem;
        line-height: 1.55;
        outline: 0;
        overflow: auto;
      }

      textarea:focus {
        border-color: var(--ch-color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ch-color-primary) 18%, transparent);
      }

      textarea:disabled {
        opacity: 0.68;
        cursor: not-allowed;
      }
    `
  ],
  template: `
    <div class="code-field">
      @if (label) {
        <label [attr.for]="controlId">{{ label }}</label>
      }
      <textarea
        class="code-textarea"
        [id]="controlId"
        [style.--code-min-height]="minHeight"
        [style.--code-max-height]="maxHeight"
        [value]="value"
        [disabled]="disabled"
        [attr.placeholder]="placeholder"
        [attr.spellcheck]="spellcheck"
        (input)="valueChange.emit(textareaValue($event))"
        (keydown)="keydown.emit($event)"
      ></textarea>
    </div>
  `
})
export class CodeTextareaComponent {
  @Input() controlId = 'code-textarea';
  @Input() label = '';
  @Input() value = '';
  @Input() minHeight = '180px';
  @Input() maxHeight = '70vh';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() spellcheck = 'false';
  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly keydown = new EventEmitter<KeyboardEvent>();

  textareaValue(event: Event) {
    return event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }
}
