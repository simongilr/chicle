import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import {
  UiPresentationConfig,
  UiRuntimePlatform
} from '../../core/ui/ui-presentation.types';
import { UiPresentationService } from '../../core/ui/ui-presentation.service';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { FieldShellComponent } from '../field-shell/field-shell.component';
import { BootstrapFieldRendererComponent } from '../field-renderers/bootstrap-field-renderer.component';
import { IonicFieldRendererComponent } from '../field-renderers/ionic-field-renderer.component';
import { MaterialFieldRendererComponent } from '../field-renderers/material-field-renderer.component';
import { NativeFieldRendererComponent } from '../field-renderers/native-field-renderer.component';
import { PrimengFieldRendererComponent } from '../field-renderers/primeng-field-renderer.component';

@Component({
  selector: 'app-dynamic-field-control',
  standalone: true,
  imports: [
    BootstrapFieldRendererComponent,
    FieldShellComponent,
    IonicFieldRendererComponent,
    MaterialFieldRendererComponent,
    NativeFieldRendererComponent,
    PrimengFieldRendererComponent
  ],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .renderer {
        min-width: 0;
      }

      .inline-help,
      .inline-error {
        display: block;
        margin-top: 6px;
        font-size: 0.8rem;
        line-height: 1.35;
      }

      .inline-help {
        color: var(--ch-color-muted);
      }

      .inline-error {
        color: var(--ch-color-danger);
        font-weight: 700;
      }
    `
  ],
  template: `
    @if (resolution.kit === 'ionic') {
      <div
        class="renderer"
        [attr.data-ui-kit]="resolution.kit"
        [attr.data-ui-theme]="resolution.theme"
        [attr.data-ui-profile]="resolution.profileKey"
      >
        <app-ionic-field-renderer
          [field]="field"
          [controlId]="controlId"
          [value]="value"
          [help]="help"
          [error]="error"
          [disabled]="disabled"
          [readonly]="readonly"
          (valueChange)="valueChange.emit($event)"
        ></app-ionic-field-renderer>
      </div>
    } @else {
      <app-field-shell
        [label]="field.label"
        [forId]="controlId"
        [help]="help"
        [error]="error"
        [required]="field.required === true"
        [kit]="resolution.kit"
      >
        <div
          class="renderer"
          [attr.data-ui-kit]="resolution.kit"
          [attr.data-ui-theme]="resolution.theme"
          [attr.data-ui-profile]="resolution.profileKey"
        >
          @switch (resolution.kit) {
          @case ('primeng') {
            <app-primeng-field-renderer
              [field]="field"
              [controlId]="controlId"
              [value]="value"
              [disabled]="disabled"
              [readonly]="readonly"
              (valueChange)="valueChange.emit($event)"
            ></app-primeng-field-renderer>
          }
          @case ('material') {
            <app-material-field-renderer
              [field]="field"
              [controlId]="controlId"
              [value]="value"
              [disabled]="disabled"
              [readonly]="readonly"
              (valueChange)="valueChange.emit($event)"
            ></app-material-field-renderer>
          }
          @case ('bootstrap') {
            <app-bootstrap-field-renderer
              [field]="field"
              [controlId]="controlId"
              [value]="value"
              [disabled]="disabled"
              [readonly]="readonly"
              (valueChange)="valueChange.emit($event)"
            ></app-bootstrap-field-renderer>
          }
          @default {
            <app-native-field-renderer
              [field]="field"
              [controlId]="controlId"
              [value]="value"
              [disabled]="disabled"
              [readonly]="readonly"
              (valueChange)="valueChange.emit($event)"
            ></app-native-field-renderer>
          }
        }
      </div>
      </app-field-shell>
    }
  `
})
export class DynamicFieldControlComponent {
  private readonly presentationService = inject(UiPresentationService);

  @Input({ required: true }) field!: RuntimeField;
  @Input() value: unknown = '';
  @Input() help = '';
  @Input() error = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() presentation?: UiPresentationConfig;
  @Input() viewportWidth?: number;
  @Input() platform?: UiRuntimePlatform;
  @Output() readonly valueChange = new EventEmitter<unknown>();

  constructor() {
    this.presentationService.ensureGlobalProfileLoaded();
  }

  get controlId() {
    return `dynamic-field-${this.field.name}`;
  }

  get resolution() {
    return this.presentationService.resolve({
      width: this.viewportWidth,
      platform: this.platform,
      parent: this.presentation,
      local: this.field.presentation
    });
  }

  @HostListener('window:resize')
  handleViewportChange() {
    // The host event schedules change detection so the responsive getter is reevaluated.
  }
}
