import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export type MobileEvidenceMode = 'file' | 'image' | 'gps';

@Component({
  selector: 'app-mobile-evidence-control',
  standalone: true,
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .control {
        display: grid;
        gap: 8px;
      }

      input[type='file'] {
        position: absolute;
        width: 1px;
        height: 1px;
        min-height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .surface,
      button {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        width: 100%;
        min-height: 52px;
        border: 1px dashed var(--ch-color-primary-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 10px 12px;
        font: inherit;
        text-align: left;
      }

      :host([data-ui-kit='material']) .surface,
      :host([data-ui-kit='material']) button {
        border-style: solid;
        border-radius: 4px;
        box-shadow: 0 1px 3px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .surface,
      :host([data-ui-kit='bootstrap']) button {
        border-style: solid;
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .surface,
      :host([data-ui-kit='ionic']) button {
        min-height: 56px;
        border-style: solid;
        border-radius: 14px;
      }

      button {
        border-style: solid;
        font-weight: 800;
      }

      .copy {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      strong {
        overflow: hidden;
        color: var(--ch-color-text);
        font-size: 0.92rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hint,
      .summary {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
        line-height: 1.35;
      }

      .action {
        flex: 0 0 auto;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-surface);
        color: var(--ch-color-primary);
        padding: 5px 9px;
        font-size: 0.78rem;
        font-weight: 850;
      }

      .surface.disabled,
      button:disabled {
        cursor: not-allowed;
        opacity: 0.62;
      }
    `
  ],
  template: `
    <div class="control">
      @if (mode === 'gps') {
        <button type="button" [disabled]="disabled || readonly" (click)="captureLocation()">
          <span class="copy">
            <strong>{{ valueSummary || placeholder || 'Capturar ubicación' }}</strong>
            <span class="hint">{{ valueSummary ? 'Ubicación capturada' : 'Usa GPS del dispositivo' }}</span>
          </span>
          <span class="action">GPS</span>
        </button>
      } @else {
        <input
          [id]="controlId"
          [name]="name"
          type="file"
          [attr.accept]="resolvedAccept"
          [attr.capture]="resolvedCapture"
          [required]="required"
          [disabled]="disabled || readonly"
          (change)="updateFile($event)"
        />
        <label class="surface" [class.disabled]="disabled || readonly" [attr.for]="disabled || readonly ? null : controlId">
          <span class="copy">
            <strong>{{ valueSummary || placeholder || defaultTitle }}</strong>
            <span class="hint">{{ valueSummary ? readyHint : emptyHint }}</span>
          </span>
          <span class="action">{{ actionLabel }}</span>
        </label>
      }
      @if (valueSummary) {
        <span class="summary">{{ valueSummary }}</span>
      }
    </div>
  `
})
export class MobileEvidenceControlComponent extends UiKitAwareComponent {
  @Input() mode: MobileEvidenceMode = 'file';
  @Input() controlId = '';
  @Input() name = '';
  @Input() value: unknown = '';
  @Input() placeholder = '';
  @Input() accept?: string;
  @Input() capture?: string;
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Output() readonly valueChange = new EventEmitter<unknown>();

  get resolvedAccept() {
    return this.mode === 'image' ? 'image/*' : this.accept;
  }

  get resolvedCapture() {
    return this.mode === 'image' ? this.capture : undefined;
  }

  get defaultTitle() {
    return this.mode === 'image' ? 'Capturar o subir foto' : 'Selecciona un archivo';
  }

  get emptyHint() {
    return this.mode === 'image' ? 'Usa cámara o galería' : 'Toca para buscar en el dispositivo';
  }

  get readyHint() {
    return this.mode === 'image' ? 'Evidencia lista' : 'Archivo listo para enviar';
  }

  get actionLabel() {
    return this.mode === 'image' ? 'Foto' : 'Elegir';
  }

  get valueSummary() {
    const value = this.value;
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object') {
      const object = value as Record<string, unknown>;
      if (typeof object['lat'] === 'number' && typeof object['lng'] === 'number') {
        return `${object['lat']}, ${object['lng']}`;
      }
      if (object['name']) {
        return String(object['name']);
      }
    }
    return 'Valor capturado';
  }

  updateFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.valueChange.emit(file ? { name: file.name, size: file.size, type: file.type } : null);
  }

  captureLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.valueChange.emit({ unavailable: true });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.valueChange.emit({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      () => this.valueChange.emit({ unavailable: true })
    );
  }
}
