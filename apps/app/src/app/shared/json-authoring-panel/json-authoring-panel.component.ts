import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { StatusNoticeComponent } from '../status-notice/status-notice.component';

@Component({
  selector: 'app-json-authoring-panel',
  standalone: true,
  imports: [FormsModule, SectionHeaderComponent, StatusNoticeComponent],
  styles: [
    `
      :host {
        display: block;
      }

      .json-authoring {
        display: grid;
        gap: 14px;
        border: 1px solid #cfe0f0;
        border-radius: 8px;
        background: #ffffff;
        padding: 16px;
      }

      .json-authoring.invalid {
        border-color: #f0b5b5;
        background: #fffafa;
      }

      .tools {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }

      button {
        min-height: 38px;
        border: 1px solid #bfd2e5;
        border-radius: 7px;
        background: #ffffff;
        color: #123a5f;
        cursor: pointer;
        font-weight: 850;
        padding: 0 14px;
      }

      button.primary {
        border-color: #1f62ad;
        background: #1f62ad;
        color: #ffffff;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .status-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .chip {
        border: 1px solid #cfe0f0;
        border-radius: 999px;
        background: #f7fbff;
        color: #173b5f;
        font-size: 0.78rem;
        font-weight: 850;
        padding: 5px 10px;
      }

      .chip.success {
        border-color: #9bd2aa;
        background: #f3fbf5;
        color: #17643a;
      }

      .chip.warning {
        border-color: #e6bd7d;
        background: #fff8ed;
        color: #71400f;
      }

      textarea {
        width: 100%;
        min-height: 300px;
        resize: vertical;
        border: 1px solid #bed2e5;
        border-radius: 8px;
        background: #0f2236;
        color: #eaf4ff;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
        font-size: 0.86rem;
        line-height: 1.55;
        padding: 14px;
        outline: none;
      }

      textarea:focus {
        border-color: #1f62ad;
        box-shadow: 0 0 0 3px rgba(31, 98, 173, 0.14);
      }

      .hint {
        color: #52677a;
        font-size: 0.88rem;
        line-height: 1.45;
      }

      @media (max-width: 760px) {
        .json-authoring {
          padding: 14px;
        }

        .tools,
        .tools button {
          width: 100%;
        }

        textarea {
          min-height: 260px;
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
          <button type="button" (click)="resetJson.emit()" [disabled]="resetDisabled || isBusy">Restaurar JSON</button>
          <button type="button" (click)="applyJson.emit()" [disabled]="applyDisabled || isBusy || !ready">
            Aplicar a guía
          </button>
          <button type="button" (click)="saveDraft.emit()" [disabled]="draftDisabled || isBusy || !ready">
            Guardar draft
          </button>
          <button class="primary" type="button" (click)="saveAndPublish.emit()" [disabled]="publishDisabled || isBusy || !ready">
            Guardar y publicar
          </button>
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

      <textarea
        [ngModel]="value"
        (ngModelChange)="valueChange.emit($event)"
        spellcheck="false"
        [attr.aria-label]="artifactLabel + ' JSON editable'"
      ></textarea>

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
