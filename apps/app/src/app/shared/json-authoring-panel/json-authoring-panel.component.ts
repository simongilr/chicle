import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CodeTextareaComponent } from '../code-textarea/code-textarea.component';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { StatusNoticeComponent } from '../status-notice/status-notice.component';
import { UiKitButtonComponent } from '../ui-kit-button/ui-kit-button.component';

@Component({
  selector: 'app-json-authoring-panel',
  standalone: true,
  imports: [CodeTextareaComponent, SectionHeaderComponent, StatusNoticeComponent, UiKitButtonComponent],
  styles: [
    `
      :host {
        display: block;
      }

      .json-authoring {
        display: grid;
        gap: 14px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 16px;
      }

      .json-authoring.invalid {
        border-color: var(--ch-color-danger-border);
        background: var(--ch-color-danger-soft);
      }

      .tools {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }

      .status-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .chip {
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        font-size: 0.78rem;
        font-weight: 850;
        padding: 5px 10px;
      }

      .chip.success {
        border-color: var(--ch-color-success-border);
        background: var(--ch-color-success-soft);
        color: var(--ch-color-success);
      }

      .chip.warning {
        border-color: var(--ch-color-warning-border);
        background: var(--ch-color-warning-soft);
        color: var(--ch-color-warning);
      }

      .hint {
        color: var(--ch-color-muted);
        font-size: 0.88rem;
        line-height: 1.45;
      }

      @media (max-width: 760px) {
        .json-authoring {
          padding: 14px;
        }

        .tools,
        .tools app-ui-kit-button {
          width: 100%;
        }
      }
    `
  ],
  template: `
    <section class="json-authoring" [class.invalid]="!ready">
      <app-section-header
        [stepLabel]="stepLabel"
        [title]="title || artifactLabel + ' JSON editable'"
        [description]="
          description ||
          'Puedes trabajar solo desde este JSON. Aplicar sincroniza la guía visual; guardar draft y publicar usan este JSON como fuente de verdad.'
        "
      >
        <div class="tools">
          <app-ui-kit-button
            label="Restaurar JSON"
            tone="neutral"
            variant="outline"
            [disabled]="resetDisabled || isBusy"
            (pressed)="resetJson.emit()"
          ></app-ui-kit-button>
          <app-ui-kit-button
            label="Aplicar a guía"
            tone="secondary"
            variant="outline"
            [disabled]="applyDisabled || isBusy || !ready"
            (pressed)="applyJson.emit()"
          ></app-ui-kit-button>
          <app-ui-kit-button
            label="Guardar draft"
            tone="secondary"
            variant="outline"
            [disabled]="draftDisabled || isBusy || !ready"
            (pressed)="saveDraft.emit()"
          ></app-ui-kit-button>
          <app-ui-kit-button
            label="Guardar y publicar"
            tone="primary"
            [disabled]="publishDisabled || isBusy || !ready"
            (pressed)="saveAndPublish.emit()"
          ></app-ui-kit-button>
        </div>
      </app-section-header>

      <div class="status-row">
        <span class="chip" [class.success]="ready" [class.warning]="!ready">
          {{ ready ? 'JSON válido' : 'JSON inválido' }}
        </span>
        @if (endpoint) {
          <span class="chip">{{ endpoint }}</span>
        }
      </div>

      <app-code-textarea
        [controlId]="artifactLabel + '-json-authoring'"
        [value]="value"
        minHeight="360px"
        maxHeight="72vh"
        [spellcheck]="'false'"
        (valueChange)="valueChange.emit($event)"
      ></app-code-textarea>

      @if (error) {
        <app-status-notice tone="error" title="Revisa el JSON">{{ error }}</app-status-notice>
      } @else {
        <p class="hint">
          La edición guiada y la edición JSON son dos entradas al mismo contrato. Esto permite que una persona o un
          asistente de IA configuren, guarden y publiquen sin depender de controles únicos de cada pantalla.
        </p>
      }

      <ng-content></ng-content>
    </section>
  `
})
export class JsonAuthoringPanelComponent {
  @Input() artifactLabel = 'Contrato';
  @Input() title = '';
  @Input() description = '';
  @Input() stepLabel = 'JSON';
  @Input() endpoint = '';
  @Input() value = '';
  @Input() error = '';
  @Input() ready = true;
  @Input() isBusy = false;
  @Input() applyDisabled = false;
  @Input() resetDisabled = false;
  @Input() draftDisabled = false;
  @Input() publishDisabled = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() applyJson = new EventEmitter<void>();
  @Output() resetJson = new EventEmitter<void>();
  @Output() saveDraft = new EventEmitter<void>();
  @Output() saveAndPublish = new EventEmitter<void>();
}
