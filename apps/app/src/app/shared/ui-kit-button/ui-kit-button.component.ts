import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { MatButtonModule } from '@angular/material/button';
import { ButtonModule } from 'primeng/button';
import { UiKitId, UiKitPreference } from '../../core/ui/ui-presentation.types';
import { UiPresentationService } from '../../core/ui/ui-presentation.service';

export type UiKitButtonTone = 'primary' | 'secondary' | 'success' | 'danger' | 'neutral';
export type UiKitButtonVariant = 'solid' | 'outline' | 'ghost';
export type UiKitButtonSize = 'small' | 'medium';

@Component({
  selector: 'app-ui-kit-button',
  standalone: true,
  imports: [ButtonModule, IonButton, MatButtonModule],
  styles: [
    `
      :host {
        display: inline-block;
        min-width: 0;
        margin: 0;
      }

      button,
      ion-button,
      p-button {
        font: inherit;
        margin: 0;
      }

      .button-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }

      ion-button .button-icon {
        margin-inline-end: 7px;
      }

      .native-button,
      .bootstrap-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 38px;
        border: 1px solid var(--button-border);
        border-radius: var(--ch-radius);
        background: var(--button-bg);
        color: var(--button-fg);
        padding: 8px 13px;
        font: inherit;
        font-weight: 850;
        line-height: 1;
      }

      :host([data-size='small']) .native-button,
      :host([data-size='small']) .bootstrap-button,
      :host([data-size='small']) .material-button,
      :host([data-size='small']) button[mat-raised-button],
      :host([data-size='small']) button[mat-stroked-button],
      :host([data-size='small']) button[mat-button] {
        min-height: 32px;
        padding: 6px 10px;
        font-size: 0.86rem;
      }

      .native-button:disabled,
      .bootstrap-button:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }

      ion-button {
        width: 100%;
        display: block;
        min-height: var(--button-min-height, 38px);
        font-weight: 850;
        text-transform: none;
        --background: var(--button-bg);
        --background-hover: color-mix(in srgb, var(--button-bg) 88%, var(--ch-color-text));
        --background-activated: color-mix(in srgb, var(--button-bg) 80%, var(--ch-color-text));
        --background-focused: color-mix(in srgb, var(--button-bg) 88%, var(--ch-color-text));
        --border-color: var(--button-border);
        --color: var(--button-fg);
        --border-radius: var(--ch-radius);
        --box-shadow: none;
        --padding-end: 13px;
        --padding-start: 13px;
      }

      ion-button::part(native) {
        gap: 8px;
        min-height: var(--button-min-height, 38px);
        font: inherit;
        font-weight: 850;
        text-transform: none;
      }

      :host([data-size='small']) ion-button {
        --button-min-height: 32px;
        font-size: 0.86rem;
        --padding-end: 10px;
        --padding-start: 10px;
      }

      :host([data-size='small']) ::ng-deep .p-button {
        min-height: 32px;
        padding: 6px 10px;
        font-size: 0.86rem;
      }

      :host ::ng-deep .p-button {
        min-height: 38px;
        border-color: var(--button-border);
        border-radius: var(--ch-radius);
        background: var(--button-bg);
        color: var(--button-fg);
        font-weight: 850;
        line-height: 1;
      }

      :host ::ng-deep .p-button,
      .native-button,
      .bootstrap-button,
      .material-button,
      button[mat-raised-button],
      button[mat-stroked-button],
      button[mat-button] {
        margin: 0;
      }

      :host ::ng-deep .p-button .p-button-label {
        font-weight: inherit;
      }

      :host([data-variant='outline']) ::ng-deep .p-button,
      :host([data-variant='ghost']) ::ng-deep .p-button {
        background: var(--button-bg);
        color: var(--button-fg);
      }

      .material-button {
        min-height: 38px;
        border-radius: var(--ch-radius);
        color: var(--button-fg) !important;
        font: inherit;
        font-weight: 850;
        line-height: 1;
        --mdc-protected-button-container-color: var(--button-bg);
        --mdc-protected-button-label-text-color: var(--button-fg);
        --mdc-protected-button-container-shape: var(--ch-radius);
        --mdc-outlined-button-label-text-color: var(--button-fg);
        --mdc-outlined-button-outline-color: var(--button-border);
        --mdc-text-button-label-text-color: var(--button-fg);
      }

      .material-button.mat-mdc-raised-button:not(:disabled) {
        background: var(--button-bg) !important;
        color: var(--button-fg) !important;
      }

      .material-button.mat-mdc-outlined-button:not(:disabled),
      .material-button.mat-mdc-button:not(:disabled) {
        border-color: var(--button-border) !important;
        color: var(--button-fg) !important;
      }

      .bootstrap-button {
        --bs-btn-bg: var(--button-bg);
        --bs-btn-border-color: var(--button-border);
        --bs-btn-color: var(--button-fg);
        --bs-btn-hover-bg: color-mix(in srgb, var(--button-bg) 88%, var(--ch-color-text));
        --bs-btn-hover-border-color: var(--button-border);
        --bs-btn-hover-color: var(--button-fg);
        --bs-btn-active-bg: color-mix(in srgb, var(--button-bg) 80%, var(--ch-color-text));
        --bs-btn-active-border-color: var(--button-border);
        --bs-btn-disabled-bg: var(--button-bg);
        --bs-btn-disabled-border-color: var(--button-border);
        --bs-btn-disabled-color: var(--button-fg);
      }

      :host([data-variant='outline']) .bootstrap-button,
      :host([data-variant='ghost']) .bootstrap-button {
        --bs-btn-bg: transparent;
        --bs-btn-color: var(--button-fg);
        --bs-btn-border-color: var(--button-border);
      }

      :host([data-icon-only='true']) .native-button,
      :host([data-icon-only='true']) .bootstrap-button,
      :host([data-icon-only='true']) .material-button,
      :host([data-icon-only='true']) button[mat-raised-button],
      :host([data-icon-only='true']) button[mat-stroked-button],
      :host([data-icon-only='true']) button[mat-button] {
        width: 34px;
        min-width: 34px;
        min-height: 34px;
        padding: 0;
      }

      :host([data-icon-only='true']) ion-button {
        width: 34px;
        min-width: 34px;
        --button-min-height: 34px;
        --padding-start: 0;
        --padding-end: 0;
      }

      :host([data-icon-only='true']) ::ng-deep .p-button {
        width: 34px;
        min-width: 34px;
        min-height: 34px;
        padding: 0;
      }

      :host([data-full='true']) ion-button {
        display: block;
      }

      :host([data-full='true']) {
        display: block;
        width: 100%;
      }

      :host([data-full='true']) .native-button,
      :host([data-full='true']) .bootstrap-button,
      :host([data-full='true']) button[mat-raised-button],
      :host([data-full='true']) button[mat-stroked-button],
      :host([data-full='true']) button[mat-button] {
        width: 100%;
      }
    `
  ],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit',
    '[attr.data-full]': 'full ? "true" : null',
    '[attr.data-size]': 'size',
    '[attr.data-variant]': 'variant',
    '[attr.data-icon-only]': 'iconOnly ? "true" : null',
    '[style.--button-bg]': 'buttonBg',
    '[style.--button-fg]': 'buttonFg',
    '[style.--button-border]': 'buttonBorder'
  },
  template: `
    @switch (resolvedKit) {
      @case ('primeng') {
        <p-button
          [type]="type"
          [label]="label"
          [icon]="icon"
          [severity]="primeSeverity"
          [outlined]="variant === 'outline'"
          [text]="variant === 'ghost'"
          [disabled]="disabled"
          [attr.aria-label]="computedAriaLabel"
          (onClick)="pressed.emit()"
        ></p-button>
      }
      @case ('ionic') {
        <ion-button
          [type]="type"
          [color]="ionicColor"
          [fill]="ionicFill"
          [expand]="full ? 'block' : undefined"
          [disabled]="disabled"
          [attr.aria-label]="computedAriaLabel"
          (click)="pressed.emit()"
        >
          @if (icon) {
            <i [class]="iconClass" aria-hidden="true"></i>
          }
          {{ label }}
        </ion-button>
      }
      @case ('material') {
        @if (variant === 'solid') {
          <button
            mat-raised-button
            class="material-button"
            [type]="type"
            [disabled]="disabled"
            [attr.aria-label]="computedAriaLabel"
            (click)="pressed.emit()"
          >
            @if (icon) {
              <i [class]="iconClass" aria-hidden="true"></i>
            }
            {{ label }}
          </button>
        } @else if (variant === 'outline') {
          <button
            mat-stroked-button
            class="material-button"
            [type]="type"
            [disabled]="disabled"
            [attr.aria-label]="computedAriaLabel"
            (click)="pressed.emit()"
          >
            @if (icon) {
              <i [class]="iconClass" aria-hidden="true"></i>
            }
            {{ label }}
          </button>
        } @else {
          <button
            mat-button
            class="material-button"
            [type]="type"
            [disabled]="disabled"
            [attr.aria-label]="computedAriaLabel"
            (click)="pressed.emit()"
          >
            @if (icon) {
              <i [class]="iconClass" aria-hidden="true"></i>
            }
            {{ label }}
          </button>
        }
      }
      @case ('bootstrap') {
        <button
          [type]="type"
          class="bootstrap-button"
          [class.btn]="true"
          [class.btn-primary]="tone === 'primary' && variant === 'solid'"
          [class.btn-outline-primary]="tone === 'primary' && variant === 'outline'"
          [class.btn-success]="tone === 'success' && variant === 'solid'"
          [class.btn-outline-success]="tone === 'success' && variant === 'outline'"
          [class.btn-danger]="tone === 'danger' && variant === 'solid'"
          [class.btn-outline-danger]="tone === 'danger' && variant === 'outline'"
          [class.btn-secondary]="isBootstrapSecondary"
          [class.btn-link]="variant === 'ghost'"
          [disabled]="disabled"
          [attr.aria-label]="computedAriaLabel"
          (click)="pressed.emit()"
        >
          @if (icon) {
            <i [class]="iconClass" aria-hidden="true"></i>
          }
          {{ label }}
        </button>
      }
      @default {
        <button
          [type]="type"
          class="native-button"
          [disabled]="disabled"
          [attr.aria-label]="computedAriaLabel"
          (click)="pressed.emit()"
        >
          @if (icon) {
            <i [class]="iconClass" aria-hidden="true"></i>
          }
          {{ label }}
        </button>
      }
    }
  `
})
export class UiKitButtonComponent {
  private readonly presentation = inject(UiPresentationService);

  @Input() label = 'Action';
  @Input() icon = '';
  @Input() ariaLabel = '';
  @Input() kit: UiKitPreference = 'auto';
  @Input() tone: UiKitButtonTone = 'primary';
  @Input() variant: UiKitButtonVariant = 'solid';
  @Input() size: UiKitButtonSize = 'medium';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() full = false;
  @Output() readonly pressed = new EventEmitter<void>();

  get computedAriaLabel() {
    return this.ariaLabel || this.label || 'Action';
  }

  get resolvedKit(): UiKitId {
    return this.presentation.resolve({ local: { kit: this.kit } }).kit;
  }

  get primeSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    return {
      primary: undefined,
      secondary: 'secondary',
      success: 'success',
      danger: 'danger',
      neutral: 'secondary'
    }[this.tone] as 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;
  }

  get ionicColor() {
    return this.tone === 'success'
      ? 'success'
      : this.tone === 'danger'
        ? 'danger'
        : this.tone === 'neutral' || this.tone === 'secondary'
          ? 'medium'
          : 'primary';
  }

  get ionicFill(): 'clear' | 'outline' | 'solid' {
    return this.variant === 'ghost' ? 'clear' : this.variant === 'outline' ? 'outline' : 'solid';
  }

  get iconClass() {
    return `${this.icon} button-icon`.trim();
  }

  get iconOnly() {
    return Boolean(this.icon) && this.label.trim().length === 0;
  }

  get isBootstrapSecondary() {
    return (this.tone === 'secondary' || this.tone === 'neutral') && this.variant === 'solid';
  }

  get buttonBg() {
    if (this.variant === 'ghost') return 'transparent';
    if (this.variant === 'outline') return 'var(--ch-color-surface)';
    return {
      primary: 'var(--ch-color-primary)',
      secondary: 'var(--ch-color-primary-soft)',
      success: 'var(--ch-color-success)',
      danger: 'var(--ch-color-danger)',
      neutral: 'var(--ch-color-text)'
    }[this.tone];
  }

  get buttonFg() {
    if (this.variant === 'outline' || this.variant === 'ghost') {
      return this.tone === 'danger'
        ? 'var(--ch-color-danger)'
        : this.tone === 'success'
          ? 'var(--ch-color-success)'
          : this.tone === 'primary'
            ? 'var(--ch-color-primary)'
            : 'var(--ch-color-text)';
    }
    return this.tone === 'secondary' ? 'var(--ch-color-primary)' : 'var(--ch-color-primary-contrast)';
  }

  get buttonBorder() {
    if (this.variant === 'ghost') return 'transparent';
    return this.tone === 'danger'
      ? 'var(--ch-color-danger)'
      : this.tone === 'success'
        ? 'var(--ch-color-success)'
        : this.tone === 'neutral' || this.tone === 'secondary'
          ? 'var(--ch-color-border)'
          : 'var(--ch-color-primary)';
  }
}
