import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { UiKitPreference } from '../../core/ui/ui-presentation.types';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent, UiKitButtonSize, UiKitButtonTone, UiKitButtonVariant } from '../../shared/ui-kit-button/ui-kit-button.component';
import { UiKitCardComponent, UiKitCardTone, UiKitCardVariant } from '../../shared/ui-kit-card/ui-kit-card.component';
import { RuntimeField } from '../forms/form-runtime.service';
import { DeclarativeComponentRegistryService } from './declarative-component-registry.service';
import {
  DeclarativeComponentAction,
  DeclarativeComponentActionEvent,
  DeclarativeComponentContext,
  DeclarativeComponentContract,
  DeclarativeFieldProps
} from './declarative-component.types';

@Component({
  selector: 'app-declarative-component-renderer',
  standalone: true,
  imports: [CommonModule, DynamicFieldControlComponent, StatusNoticeComponent, UiKitButtonComponent, UiKitCardComponent],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .stack,
      .grid {
        min-width: 0;
      }

      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--dc-gap, 12px);
        align-items: var(--dc-align, stretch);
      }

      .stack.horizontal {
        flex-direction: row;
        flex-wrap: wrap;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--dc-min-col, 220px), 1fr));
        gap: var(--dc-gap, 12px);
      }

      .card-heading {
        display: grid;
        gap: 3px;
        margin-bottom: 12px;
      }

      .card-heading h3 {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      .card-heading p {
        margin: 0;
        color: var(--ch-color-muted);
      }

      .fallback {
        color: var(--ch-color-muted);
        font-size: 0.9rem;
      }
    `
  ],
  template: `
    @if (contract) {
      @switch (contract.componentKey) {
        @case ('ui.button') {
          <app-ui-kit-button
            [kit]="kitForRender"
            [label]="stringProp('label', 'Action')"
            [icon]="stringProp('icon', '')"
            [tone]="buttonTone"
            [variant]="buttonVariant"
            [size]="buttonSize"
            [full]="booleanProp('full', false)"
            [disabled]="booleanProp('disabled', false)"
            (pressed)="emitConfiguredAction('onClick')"
          ></app-ui-kit-button>
        }

        @case ('form.field') {
          <app-dynamic-field-control
            [field]="fieldProp"
            [value]="fieldValue"
            [help]="fieldTextProp('help')"
            [error]="fieldTextProp('error')"
            [disabled]="fieldBooleanProp('disabled')"
            [readonly]="fieldBooleanProp('readonly')"
            [presentation]="context?.presentation"
            [viewportWidth]="context?.viewportWidth"
            [platform]="context?.platform"
            (valueChange)="emitValueChange($event)"
          ></app-dynamic-field-control>
        }

        @case ('ui.card') {
          <app-ui-kit-card
            [kit]="kitForRender"
            [tone]="cardTone"
            [variant]="cardVariant"
            [padding]="stringProp('padding', '16px')"
          >
            @if (stringProp('title', '') || stringProp('subtitle', '')) {
              <div class="card-heading">
                @if (stringProp('title', '')) {
                  <h3>{{ stringProp('title', '') }}</h3>
                }
                @if (stringProp('subtitle', '')) {
                  <p>{{ stringProp('subtitle', '') }}</p>
                }
              </div>
            }
            @for (child of contract.children ?? []; track trackChild($index, child)) {
              <app-declarative-component-renderer
                [contract]="child"
                [context]="context"
                [kit]="kit"
                (action)="action.emit($event)"
              ></app-declarative-component-renderer>
            }
          </app-ui-kit-card>
        }

        @case ('layout.stack') {
          <div
            class="stack"
            [class.horizontal]="stringProp('direction', 'vertical') === 'horizontal'"
            [style.--dc-gap]="stringProp('gap', '12px')"
            [style.--dc-align]="alignProp"
          >
            @for (child of contract.children ?? []; track trackChild($index, child)) {
              <app-declarative-component-renderer
                [contract]="child"
                [context]="context"
                [kit]="kit"
                (action)="action.emit($event)"
              ></app-declarative-component-renderer>
            }
          </div>
        }

        @case ('layout.grid') {
          <div class="grid" [style.--dc-gap]="stringProp('gap', '12px')" [style.--dc-min-col]="stringProp('minColumnWidth', '220px')">
            @for (child of contract.children ?? []; track trackChild($index, child)) {
              <app-declarative-component-renderer
                [contract]="child"
                [context]="context"
                [kit]="kit"
                (action)="action.emit($event)"
              ></app-declarative-component-renderer>
            }
          </div>
        }

        @case ('feedback.alert') {
          <app-status-notice [kit]="kitForRender" [title]="stringProp('title', 'Notice')" [tone]="noticeTone">
            {{ stringProp('message', 'Review this information.') }}
          </app-status-notice>
        }

        @default {
          <app-status-notice [kit]="kitForRender" title="Component pending" tone="info">
            <span class="fallback">
              {{ contract.componentKey }} is valid in the declarative catalog, but its renderer adapter is pending.
            </span>
          </app-status-notice>
        }
      }
    }
  `
})
export class DeclarativeComponentRendererComponent {
  private readonly registry = inject(DeclarativeComponentRegistryService);

  @Input() contract: DeclarativeComponentContract | null = null;
  @Input() context?: DeclarativeComponentContext;
  @Input() kit: UiKitPreference = 'auto';
  @Output() readonly action = new EventEmitter<DeclarativeComponentActionEvent>();

  get kitForRender(): UiKitPreference {
    return this.kit === 'inherit' || this.kit === 'auto' ? this.context?.kit ?? this.kit : this.kit;
  }

  get buttonTone(): UiKitButtonTone {
    return this.oneOf(this.stringProp('tone', 'primary'), ['primary', 'secondary', 'success', 'danger', 'neutral'], 'primary');
  }

  get buttonVariant(): UiKitButtonVariant {
    return this.oneOf(this.stringProp('variant', 'solid'), ['solid', 'outline', 'ghost'], 'solid');
  }

  get buttonSize(): UiKitButtonSize {
    return this.oneOf(this.stringProp('size', 'medium'), ['small', 'medium'], 'medium');
  }

  get cardTone(): UiKitCardTone {
    return this.oneOf(this.stringProp('tone', 'neutral'), ['neutral', 'primary', 'success', 'warning', 'danger'], 'neutral');
  }

  get cardVariant(): UiKitCardVariant {
    return this.oneOf(this.stringProp('variant', 'surface'), ['surface', 'subtle', 'outline'], 'surface');
  }

  get noticeTone(): 'neutral' | 'info' | 'success' | 'warning' | 'error' {
    const tone = this.stringProp('tone', 'info');
    return tone === 'danger' ? 'error' : this.oneOf(tone, ['neutral', 'info', 'success', 'warning', 'error'], 'info');
  }

  get alignProp() {
    return {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch'
    }[this.stringProp('align', 'stretch')] ?? 'stretch';
  }

  get fieldProp(): RuntimeField {
    const props = this.contract?.props as DeclarativeFieldProps | undefined;
    const field = props?.field;
    if (field && typeof field === 'object') {
      return {
        ...field,
        name: field.name || field.key || 'value',
        label: field.label || field.name || field.key || 'Value',
        type: field.type || 'text'
      };
    }
    return { name: 'value', label: 'Value', type: 'text', placeholder: 'Write a value' };
  }

  get fieldValue() {
    const props = this.contract?.props as DeclarativeFieldProps | undefined;
    return props?.value ?? this.context?.state?.[this.fieldProp.name] ?? '';
  }

  stringProp(key: string, fallback: string) {
    const value = this.contract?.props?.[key];
    return typeof value === 'string' ? value : fallback;
  }

  booleanProp(key: string, fallback: boolean) {
    const value = this.contract?.props?.[key];
    return typeof value === 'boolean' ? value : fallback;
  }

  fieldTextProp(key: keyof DeclarativeFieldProps) {
    const value = (this.contract?.props as DeclarativeFieldProps | undefined)?.[key];
    return typeof value === 'string' ? value : '';
  }

  fieldBooleanProp(key: keyof DeclarativeFieldProps) {
    const value = (this.contract?.props as DeclarativeFieldProps | undefined)?.[key];
    return typeof value === 'boolean' ? value : false;
  }

  emitConfiguredAction(eventName: string) {
    const action = this.resolveAction(eventName);
    if (!action || !this.contract) {
      return;
    }
    this.action.emit({ source: this.contract, eventName, action });
  }

  emitValueChange(value: unknown) {
    const configured = this.resolveAction('valueChange');
    if (configured && this.contract) {
      this.action.emit({ source: this.contract, eventName: 'valueChange', action: configured, value });
      return;
    }
    if (this.contract) {
      this.action.emit({ source: this.contract, eventName: 'valueChange', action: { type: 'set_state', key: this.fieldProp.name }, value });
    }
  }

  trackChild(index: number, child: DeclarativeComponentContract) {
    return child.id || `${child.componentKey}-${index}`;
  }

  private resolveAction(eventName: string): DeclarativeComponentAction | null {
    const actions = this.contract?.actions;
    if (Array.isArray(actions)) {
      return (actions[0] as DeclarativeComponentAction | undefined) ?? null;
    }
    const action = actions?.[eventName];
    if (Array.isArray(action)) {
      return (action[0] as DeclarativeComponentAction | undefined) ?? null;
    }
    return (action as DeclarativeComponentAction | undefined) ?? null;
  }

  private oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
    return allowed.includes(value as T) ? (value as T) : fallback;
  }

  // Injected for early validation side effects and future catalog-backed rendering decisions.
  protected componentExists(componentKey: string) {
    return this.registry.has(componentKey);
  }
}
