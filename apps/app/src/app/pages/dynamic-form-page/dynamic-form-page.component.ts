import { JsonPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiClientService } from '../../core/api/api-client.service';
import { UiPresentationService } from '../../core/ui/ui-presentation.service';
import { UiThemeService } from '../../core/ui/ui-theme.service';
import {
  UiKitPreference,
  UiPresentationConfig
} from '../../core/ui/ui-presentation.types';
import {
  FormRuntimeService,
  RuntimeForm,
  StoredRuntimeForm
} from '../../engine/forms/form-runtime.service';
import { FormlyRuntimeComponent } from '../../shared/formly-runtime/formly-runtime.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { MobileFormShellComponent } from '../../shared/mobile-form/mobile-form-shell.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import {
  PreviewViewportComponent,
  PreviewViewportMode
} from '../../shared/preview-viewport/preview-viewport.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiPresentationSwitcherComponent } from '../../shared/ui-presentation-switcher/ui-presentation-switcher.component';

@Component({
  selector: 'app-dynamic-form-page',
  standalone: true,
  imports: [
    FormlyRuntimeComponent,
    JsonPipe,
    LoadingSkeletonComponent,
    MobileFormShellComponent,
    ModuleHeaderComponent,
    PageShellComponent,
    PreviewViewportComponent,
    StatusNoticeComponent,
    UiPresentationSwitcherComponent
  ],
  styles: [
    `
      .runtime-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 18px;
        align-items: start;
      }

      .form-surface,
      .data-panel {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
      }

      .form-surface {
        display: grid;
        gap: 16px;
        padding: 20px;
      }

      .data-panel {
        display: grid;
        gap: 10px;
        padding: 16px;
      }

      h2,
      p,
      pre {
        margin: 0;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      p {
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      pre {
        overflow: auto;
        border-radius: 6px;
        background: #10263e;
        color: #e9f3ff;
        padding: 12px;
        font-size: 0.8rem;
      }

      button {
        justify-self: start;
        min-height: 40px;
        border: 1px solid var(--ch-color-primary);
        border-radius: var(--ch-radius);
        background: var(--ch-color-primary);
        color: var(--ch-color-surface);
        padding: 8px 14px;
        font: inherit;
        font-weight: 800;
      }

      @media (max-width: 900px) {
        .runtime-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <app-page-shell contextLabel="Formularios">
      <app-module-header
        eyebrow="Runtime declarativo"
        [title]="form?.title || 'Formulario dinámico'"
        description="El mismo esquema compone los campos, validaciones y valores en web y móvil."
        [badge]="form ? 'v' + form.version : 'Cargando'"
      ></app-module-header>

      @if (loading) {
        <app-loading-skeleton
          variant="form"
          label="Cargando definición del formulario"
          [rows]="6"
        ></app-loading-skeleton>
      } @else if (error) {
        <app-status-notice tone="error">{{ error }}</app-status-notice>
      } @else if (form) {
        <app-ui-presentation-switcher
          [value]="previewKit"
          [resolvedKit]="resolvedPresentation.kit"
          (valueChange)="setPreviewKit($event)"
        ></app-ui-presentation-switcher>

        <app-preview-viewport [(mode)]="previewMode">
          @if (previewMode === 'mobile') {
            <app-mobile-form-shell
              eyebrow="Móvil"
              [title]="form.title"
              description="Completa los campos marcados como obligatorios."
            >
              <app-formly-runtime
                [definition]="form"
                [model]="values"
                [presentation]="effectivePresentation"
                [viewportWidth]="previewWidth"
                [readonly]="submitting"
                [submitLabel]="submitLabel"
                (modelChange)="updateModel($event)"
                (validChange)="updateValidity($event)"
                (submitted)="completeValidation($event)"
              ></app-formly-runtime>
              @if (submitMessage) {
                <app-status-notice tone="success">{{ submitMessage }}</app-status-notice>
              }
              @if (submitError) {
                <app-status-notice tone="error">{{ submitError }}</app-status-notice>
              }
            </app-mobile-form-shell>
          } @else {
            <div
              class="form-surface"
              [attr.data-ui-kit]="resolvedPresentation.kit"
              [attr.data-ui-theme]="resolvedPresentation.theme"
            >
              <div>
                <h2>{{ form.title }}</h2>
                <p>Completa los campos marcados como obligatorios.</p>
              </div>
              <app-formly-runtime
                [definition]="form"
                [model]="values"
                [presentation]="effectivePresentation"
                [viewportWidth]="previewWidth"
                [readonly]="submitting"
                [submitLabel]="submitLabel"
                (modelChange)="updateModel($event)"
                (validChange)="updateValidity($event)"
                (submitted)="completeValidation($event)"
              ></app-formly-runtime>
              @if (submitMessage) {
                <app-status-notice tone="success">{{ submitMessage }}</app-status-notice>
              }
              @if (submitError) {
                <app-status-notice tone="error">{{ submitError }}</app-status-notice>
              }
            </div>
          }
        </app-preview-viewport>

        <section class="runtime-grid">
          <article class="data-panel">
            <h2>Datos actuales</h2>
            <p>Este objeto será la entrada de las acciones declarativas del formulario.</p>
            <pre>{{ values | json }}</pre>
          </article>
          <article class="data-panel">
            <h2>Estado del renderer</h2>
            <p>
              Kit: {{ resolvedPresentation.kit }} · Tema: {{ resolvedPresentation.theme }} ·
              {{ validationMessage || 'Completa los campos y envía el formulario.' }}
            </p>
            @if (submitOutput) {
              <pre>{{ submitOutput | json }}</pre>
            }
          </article>
        </section>
      }
    </app-page-shell>
  `
})
export class DynamicFormPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiClientService);
  private readonly runtime = inject(FormRuntimeService);
  private readonly presentationService = inject(UiPresentationService);
  private readonly themeService = inject(UiThemeService);
  private previousTheme = 'chicle';

  form?: RuntimeForm;
  values: Record<string, unknown> = {};
  previewMode: PreviewViewportMode = 'desktop';
  previewKit: UiKitPreference = 'auto';
  validationMessage = '';
  submitMessage = '';
  submitError = '';
  submitOutput?: Record<string, unknown>;
  submitting = false;
  loading = true;
  error = '';
  effectivePresentation: UiPresentationConfig = { kit: 'auto' };

  get previewWidth() {
    return {
      desktop: 1280,
      tablet: 760,
      mobile: 390
    }[this.previewMode];
  }

  get resolvedPresentation() {
    return this.presentationService.resolve({
      width: this.previewWidth,
      parent: this.effectivePresentation
    });
  }

  get submitLabel() {
    const label = this.form?.runtime?.['submitLabel'];
    return typeof label === 'string' && label.trim() ? label : 'Enviar formulario';
  }

  ngOnInit() {
    this.previousTheme = this.themeService.activeThemeKey();
    const formKey = this.route.snapshot.paramMap.get('formKey') ?? '';
    this.api.get<StoredRuntimeForm>(`forms/by-key/${encodeURIComponent(formKey)}/runtime`).subscribe({
      next: (stored) => {
        this.form = this.runtime.fromStored(stored);
        this.values = this.runtime.initialValues(this.form);
        this.effectivePresentation = {
          ...(this.form.presentation ?? {}),
          kit: this.previewKit
        };
        this.themeService.apply(this.form.presentation?.theme || this.presentationService.profile().theme, false);
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el formulario o no tienes permiso para verlo.';
        this.loading = false;
      }
    });
  }

  ngOnDestroy() {
    this.themeService.apply(this.previousTheme, false);
  }

  setPreviewKit(kit: UiKitPreference) {
    this.previewKit = kit;
    this.effectivePresentation = {
      ...(this.form?.presentation ?? {}),
      kit
    };
  }

  updateModel(model: Record<string, unknown>) {
    this.values = model;
    this.submitError = '';
    this.submitMessage = '';
  }

  updateValidity(valid: boolean) {
    this.validationMessage = valid
      ? 'Los valores actuales son válidos.'
      : 'Hay campos pendientes por completar.';
  }

  completeValidation(model: Record<string, unknown>) {
    this.values = model;
    this.validationMessage = 'La estructura y los campos obligatorios son válidos.';
    if (!this.form || this.submitting) {
      return;
    }
    this.submitting = true;
    this.submitError = '';
    this.submitMessage = '';
    this.submitOutput = undefined;
    this.api
      .post<Record<string, unknown>>(`forms/by-key/${encodeURIComponent(this.form.key)}/submit`, {
        input: model
      })
      .subscribe({
        next: (output) => {
          this.submitOutput = output;
          this.submitMessage = 'Formulario enviado correctamente.';
          this.submitting = false;
        },
        error: () => {
          this.submitError = 'No se pudo enviar el formulario. Revisa permisos, publicación o configuración.';
          this.submitting = false;
        }
      });
  }
}
