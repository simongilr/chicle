import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitAwareComponent } from '../../shared/ui-kit/ui-kit-aware.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';

export interface FlowTimelineStep {
  id: string;
  key: string;
  name: string;
  type: string;
  position: number;
  outputKey?: string | null;
  nextStepKey?: string | null;
  onTrueStepKey?: string | null;
  onFalseStepKey?: string | null;
  onErrorStepKey?: string | null;
}

export interface FlowTimelineStatus {
  stepKey: string;
  status: string;
}

@Component({
  selector: 'app-flow-timeline',
  standalone: true,
  imports: [UiKitButtonComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
      }

      .timeline {
        display: grid;
        gap: 0;
      }

      .terminal,
      .step {
        width: 100%;
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        border-radius: 7px;
      }

      :host([data-ui-kit='material']) .terminal,
      :host([data-ui-kit='material']) .step {
        border-radius: 4px;
        box-shadow: 0 1px 4px color-mix(in srgb, var(--ch-color-text) 12%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .terminal,
      :host([data-ui-kit='bootstrap']) .step {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .terminal,
      :host([data-ui-kit='ionic']) .step {
        border-radius: 14px;
      }

      :host([data-ui-kit='native']) .terminal,
      :host([data-ui-kit='native']) .step {
        border-radius: 2px;
      }

      .terminal {
        padding: 9px 11px;
        text-align: center;
        font-weight: 800;
        background: var(--ch-color-primary-soft);
      }

      .step {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        gap: 9px;
        align-items: center;
        padding: 10px;
        text-align: left;
        cursor: pointer;
      }

      .step.active {
        border-color: var(--ch-color-primary);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--ch-color-primary) 12%, transparent);
        background: var(--ch-color-primary-soft);
      }

      .icon {
        display: inline-flex;
        width: 32px;
        height: 32px;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        background: var(--ch-color-surface-muted);
      }

      .copy {
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .copy strong,
      .copy span {
        display: block;
      }

      .meta,
      .branch {
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        line-height: 1.35;
      }

      .branch {
        margin-top: 4px;
      }

      .status {
        font-size: 0.72rem;
        font-weight: 900;
        border-radius: 999px;
        padding: 4px 7px;
        background: var(--ch-color-surface-muted);
      }

      .status.success {
        color: var(--ch-color-success);
        background: var(--ch-color-success-soft);
      }

      .status.failed {
        color: var(--ch-color-danger);
        background: var(--ch-color-surface)0f0;
      }

      .connector {
        display: grid;
        justify-items: center;
        height: 46px;
      }

      .line {
        width: 2px;
        height: 14px;
        background: var(--ch-color-border);
      }

      app-ui-kit-button.add {
        width: 34px;
      }

      .actions {
        display: grid;
        gap: 5px;
        justify-items: end;
      }

      .step-tools {
        display: inline-flex;
        gap: 4px;
      }

      app-ui-kit-button.tool {
        width: 28px;
      }

      @media (max-width: 620px) {
        .step {
          grid-template-columns: 32px minmax(0, 1fr);
        }

        .actions {
          grid-column: 1 / -1;
          grid-template-columns: 1fr auto;
          width: 100%;
          justify-items: start;
        }
      }
    `
  ],
  template: `
    <div class="timeline">
      <div class="terminal"><i class="pi pi-play" aria-hidden="true"></i> Datos de entrada</div>

      <div class="connector">
        <span class="line"></span>
        <app-ui-kit-button
          class="add"
          label=""
          icon="pi pi-plus"
          tone="secondary"
          variant="outline"
          (pressed)="addAfter.emit(null)"
        ></app-ui-kit-button>
      </div>

      @for (step of steps; track step.id) {
        <div
          class="step"
          role="button"
          tabindex="0"
          [class.active]="step.id === selectedStepId"
          (click)="selected.emit(step)"
          (keydown.enter)="selected.emit(step)"
        >
          <span class="icon"><i [class]="iconClass(step.type)" aria-hidden="true"></i></span>
          <span class="copy">
            <strong>{{ step.name }}</strong>
            <span class="meta">{{ typeLabel(step.type) }} · guarda en {{ step.outputKey || step.key }}</span>
            @if (step.type === 'decision') {
              <span class="branch">
                Sí → {{ step.onTrueStepKey || 'siguiente' }} · No →
                {{ step.onFalseStepKey || 'siguiente' }}
              </span>
            } @else if (step.onErrorStepKey) {
              <span class="branch">Si falla → {{ step.onErrorStepKey }}</span>
            }
          </span>
          <span class="actions" (click)="$event.stopPropagation()">
            @if (statusFor(step.key); as status) {
              <span class="status" [class.success]="status === 'success'" [class.failed]="status === 'failed'">
                {{ status === 'success' ? 'Correcto' : status === 'failed' ? 'Error' : status }}
              </span>
            }
            <app-ui-kit-button
              label="Probar hasta aquí"
              icon="pi pi-bolt"
              tone="secondary"
              variant="outline"
              (pressed)="testStep.emit(step)"
            ></app-ui-kit-button>
            <span class="step-tools">
              <app-ui-kit-button
                class="tool"
                label=""
                icon="pi pi-copy"
                tone="neutral"
                variant="outline"
                (pressed)="duplicateStep.emit(step)"
              ></app-ui-kit-button>
            </span>
          </span>
        </div>

        <div class="connector">
          <span class="line"></span>
          <app-ui-kit-button
            class="add"
            label=""
            icon="pi pi-plus"
            tone="secondary"
            variant="outline"
            (pressed)="addAfter.emit(step)"
          ></app-ui-kit-button>
        </div>
      }

      <div class="terminal"><i class="pi pi-stop" aria-hidden="true"></i> Fin del proceso</div>
    </div>
  `
})
export class FlowTimelineComponent extends UiKitAwareComponent {
  @Input() steps: FlowTimelineStep[] = [];
  @Input() selectedStepId = '';
  @Input() statuses: FlowTimelineStatus[] = [];
  @Output() selected = new EventEmitter<FlowTimelineStep>();
  @Output() addAfter = new EventEmitter<FlowTimelineStep | null>();
  @Output() testStep = new EventEmitter<FlowTimelineStep>();
  @Output() duplicateStep = new EventEmitter<FlowTimelineStep>();

  statusFor(stepKey: string) {
    return this.statuses.find((status) => status.stepKey === stepKey)?.status;
  }

  typeLabel(type: string) {
    const labels: Record<string, string> = {
      dynamic_service: 'Servicio',
      parallel: 'En paralelo',
      foreach: 'Por cada elemento',
      subflow: 'Otro flow',
      delay: 'Espera',
      emit_event: 'Evento',
      validation: 'Validación',
      decision: 'Decisión',
      formula: 'Fórmula',
      response: 'Respuesta',
      action: 'Acción'
    };
    return labels[type] ?? type;
  }

  iconClass(type: string) {
    const icons: Record<string, string> = {
      dynamic_service: 'pi pi-cloud',
      parallel: 'pi pi-sitemap',
      foreach: 'pi pi-replay',
      subflow: 'pi pi-directions-alt',
      delay: 'pi pi-clock',
      emit_event: 'pi pi-bell',
      validation: 'pi pi-check-circle',
      decision: 'pi pi-share-alt',
      formula: 'pi pi-calculator',
      response: 'pi pi-send',
      action: 'pi pi-bolt'
    };
    return icons[type] ?? 'pi pi-circle';
  }
}
