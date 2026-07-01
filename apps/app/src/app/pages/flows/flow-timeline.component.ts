import { Component, EventEmitter, Input, Output } from '@angular/core';

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
        border: 1px solid #c5d7e9;
        background: #fff;
        color: #153b61;
        border-radius: 7px;
      }

      .terminal {
        padding: 9px 11px;
        text-align: center;
        font-weight: 800;
        background: #eef4fa;
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
        border-color: #1f5ca8;
        box-shadow: 0 0 0 2px rgba(31, 92, 168, 0.12);
        background: #f2f7ff;
      }

      .icon {
        display: inline-flex;
        width: 32px;
        height: 32px;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        background: #e8f0f8;
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
        color: #587087;
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
        background: #e9eef4;
      }

      .status.success {
        color: #116b3b;
        background: #e5f6ec;
      }

      .status.failed {
        color: #9b1c24;
        background: #fff0f0;
      }

      .connector {
        display: grid;
        justify-items: center;
        height: 46px;
      }

      .line {
        width: 2px;
        height: 14px;
        background: #bfd0e1;
      }

      .add {
        width: 30px;
        height: 30px;
        min-height: 30px;
        padding: 0;
        border: 1px solid #a9c3dd;
        border-radius: 50%;
        background: #fff;
        color: #1f5ca8;
        cursor: pointer;
      }

      .actions {
        display: grid;
        gap: 5px;
        justify-items: end;
      }

      .test {
        min-height: 28px;
        padding: 4px 7px;
        border: 1px solid #bfd2e5;
        background: #fff;
        color: #153b61;
        border-radius: 6px;
        font-weight: 800;
        cursor: pointer;
      }

      .step-tools {
        display: inline-flex;
        gap: 4px;
      }

      .tool {
        width: 28px;
        height: 28px;
        min-height: 28px;
        padding: 0;
        border: 1px solid #bfd2e5;
        border-radius: 6px;
        background: #fff;
        color: #153b61;
        cursor: pointer;
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
        <button class="add" type="button" title="Agregar primer paso" (click)="addAfter.emit(null)">
          <i class="pi pi-plus" aria-hidden="true"></i>
        </button>
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
          <span class="actions">
            @if (statusFor(step.key); as status) {
              <span class="status" [class.success]="status === 'success'" [class.failed]="status === 'failed'">
                {{ status === 'success' ? 'Correcto' : status === 'failed' ? 'Error' : status }}
              </span>
            }
            <button class="test" type="button" (click)="testClicked($event, step)">
              <i class="pi pi-bolt" aria-hidden="true"></i> Probar hasta aquí
            </button>
            <span class="step-tools">
              <button class="tool" type="button" title="Duplicar paso" (click)="duplicateClicked($event, step)">
                <i class="pi pi-copy" aria-hidden="true"></i>
              </button>
            </span>
          </span>
        </div>

        <div class="connector">
          <span class="line"></span>
          <button class="add" type="button" title="Agregar paso después" (click)="addAfter.emit(step)">
            <i class="pi pi-plus" aria-hidden="true"></i>
          </button>
        </div>
      }

      <div class="terminal"><i class="pi pi-stop" aria-hidden="true"></i> Fin del proceso</div>
    </div>
  `
})
export class FlowTimelineComponent {
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

  testClicked(event: Event, step: FlowTimelineStep) {
    event.stopPropagation();
    this.testStep.emit(step);
  }

  duplicateClicked(event: Event, step: FlowTimelineStep) {
    event.stopPropagation();
    this.duplicateStep.emit(step);
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
