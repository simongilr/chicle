import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import {
  UiPresentationConfig,
  UiRuntimePlatform
} from '../../core/ui/ui-presentation.types';
import { UiPresentationService } from '../../core/ui/ui-presentation.service';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { FieldShellComponent } from '../field-shell/field-shell.component';
import { IonicFieldRendererComponent } from '../field-renderers/ionic-field-renderer.component';
import { NativeFieldRendererComponent } from '../field-renderers/native-field-renderer.component';
import { PrimengFieldRendererComponent } from '../field-renderers/primeng-field-renderer.component';

@Component({
  selector: 'app-dynamic-field-control',
  standalone: true,
  imports: [
    FieldShellComponent,
    IonicFieldRendererComponent,
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
    `
  ],
  template: `
    <app-field-shell
      [label]="field.label"
      [forId]="controlId"
      [help]="help"
      [error]="error"
      [required]="field.required === true"
    >
      <div
        class="renderer"
        [attr.data-ui-kit]="resolution.kit"
        [attr.data-ui-theme]="resolution.theme"
        [attr.data-ui-profile]="resolution.profileKey"
      >
        @switch (resolution.kit) {
          @case ('ionic') {
            <app-ionic-field-renderer
              [field]="field"
              [controlId]="controlId"
              [value]="value"
              [disabled]="disabled"
              [readonly]="readonly"
              (valueChange)="valueChange.emit($event)"
            ></app-ionic-field-renderer>
          }
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
  handleViewportChange() {}
}
