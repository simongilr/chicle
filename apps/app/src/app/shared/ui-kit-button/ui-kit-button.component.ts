import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ButtonModule } from 'primeng/button';
import { UiKitId, UiKitPreference } from '../../core/ui/ui-presentation.types';
import { UiPresentationService } from '../../core/ui/ui-presentation.service';

export type UiKitButtonTone = 'primary' | 'secondary' | 'success' | 'danger' | 'neutral';
export type UiKitButtonVariant = 'solid' | 'outline' | 'ghost';

@Component({
  selector: 'app-ui-kit-button',
  standalone: true,
  imports: [ButtonModule, MatButtonModule],
  styles: [
    `
      :host {
        display: inline-block;
        min-width: 0;
      }

      button,
      ion-button,
      p-button {
        font: inherit;
      }

      .native-button,
      .bootstrap-button,
      .ionic-button {
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

      .bootstrap-button,
      .ionic-button {
        min-height: 38px;
      }

      .native-button:disabled,
      .bootstrap-button:disabled,
      .ionic-button:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }

      :host([data-full='true']) {
        display: block;
        width: 100%;
      }

      :host([data-full='true']) .native-button,
      :host([data-full='true']) .bootstrap-button,
      :host([data-full='true']) .ionic-button,
      :host([data-full='true']) button[mat-raised-button],
      :host([data-full='true']) button[mat-stroked-button],
      :host([data-full='true']) button[mat-button] {
        width: 100%;
      }
    `
  ],
  host: {
    '[attr.data-full]': 'full ? "true" : null'
  },
  template: `
    @switch (resolvedKit) {
      @case ('primeng') {
        <p-button
          [label]="label"
          [icon]="icon"
          [severity]="primeSeverity"
          [outlined]="variant === 'outline'"
          [text]="variant === 'ghost'"
          [disabled]="disabled"
          (onClick)="pressed.emit()"
        ></p-button>
      }
      @case ('ionic') {
        <button
          type="button"
          class="ionic-button"
          [style.--button-bg]="buttonBg"
          [style.--button-fg]="buttonFg"
          [style.--button-border]="buttonBorder"
          [disabled]="disabled"
          (click)="pressed.emit()"
        >
          @if (icon) {
            <i [class]="icon" aria-hidden="true"></i>
          }
          {{ label }}
        </button>
      }
      @case ('material') {
        @if (variant === 'solid') {
          <button mat-raised-button [color]="materialColor" [disabled]="disabled" (click)="pressed.emit()">
            @if (icon) {
              <i [class]="icon" aria-hidden="true"></i>
            }
            {{ label }}
          </button>
        } @else if (variant === 'outline') {
          <button mat-stroked-button [color]="materialColor" [disabled]="disabled" (click)="pressed.emit()">
            @if (icon) {
              <i [class]="icon" aria-hidden="true"></i>
            }
            {{ label }}
          </button>
        } @else {
          <button mat-button [color]="materialColor" [disabled]="disabled" (click)="pressed.emit()">
            @if (icon) {
              <i [class]="icon" aria-hidden="true"></i>
            }
            {{ label }}
          </button>
        }
      }
      @case ('bootstrap') {
        <button
          type="button"
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
          (click)="pressed.emit()"
        >
          @if (icon) {
            <i [class]="icon" aria-hidden="true"></i>
          }
          {{ label }}
        </button>
      }
      @default {
        <button
          type="button"
          class="native-button"
          [style.--button-bg]="buttonBg"
          [style.--button-fg]="buttonFg"
          [style.--button-border]="buttonBorder"
          [disabled]="disabled"
          (click)="pressed.emit()"
        >
          @if (icon) {
            <i [class]="icon" aria-hidden="true"></i>
          }
          {{ label }}
        </button>
      }
    }
  `
})
export class UiKitButtonComponent {
  private readonly presentation = inject(UiPresentationService);

  @Input() label = 'Acción';
  @Input() icon = '';
  @Input() kit: UiKitPreference = 'auto';
  @Input() tone: UiKitButtonTone = 'primary';
  @Input() variant: UiKitButtonVariant = 'solid';
  @Input() disabled = false;
  @Input() full = false;
  @Output() readonly pressed = new EventEmitter<void>();

  get resolvedKit(): UiKitId {
    return this.presentation.resolve({ local: { kit: this.kit } }).kit;
  }

  get primeSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    return {
      primary: undefined,
      secondary: 'info',
      success: 'success',
      danger: 'danger',
      neutral: 'secondary'
    }[this.tone] as 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;
  }

  get ionicColor() {
    return this.tone === 'success' ? 'success' : this.tone === 'danger' ? 'danger' : this.tone === 'neutral' ? 'medium' : 'primary';
  }

  get materialColor(): 'primary' | 'accent' | 'warn' | undefined {
    return this.tone === 'danger' ? 'warn' : this.tone === 'secondary' || this.tone === 'success' ? 'accent' : 'primary';
  }

  get ionicIcon() {
    return this.icon.includes('plus') ? 'add-outline' : this.icon.includes('trash') ? 'trash-outline' : 'ellipse-outline';
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
          : 'var(--ch-color-primary)';
    }
    return this.tone === 'secondary' ? 'var(--ch-color-primary)' : 'var(--ch-color-primary-contrast)';
  }

  get buttonBorder() {
    if (this.variant === 'ghost') return 'transparent';
    return this.tone === 'danger'
      ? 'var(--ch-color-danger)'
      : this.tone === 'success'
        ? 'var(--ch-color-success)'
        : this.tone === 'secondary'
          ? 'var(--ch-color-primary-border)'
          : 'var(--ch-color-primary)';
  }
}
