import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiClientService } from '../../core/api/api-client.service';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { AdminMetricCardComponent, AdminMetricTone } from '../../shared/admin-metric-card/admin-metric-card.component';
import { AdminPanelComponent } from '../../shared/admin-panel/admin-panel.component';
import { CatalogItemComponent } from '../../shared/catalog-item/catalog-item.component';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { SegmentedControlComponent, SegmentedControlItem } from '../../shared/segmented-control/segmented-control.component';
import { StatusNoticeComponent, StatusNoticeTone } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';

type EnvironmentKind = 'local' | 'non_prod' | 'production' | 'custom';
type EnvironmentValueType = 'string' | 'number' | 'boolean' | 'json';
type EnvironmentVariableTarget = 'api' | 'app' | 'worker' | 'docker' | 'runtime' | 'microservice';
type EnvironmentSecretScopeType = 'api' | 'app' | 'worker' | 'integration' | 'dynamic_service' | 'flow' | 'microservice';
type EnvironmentSecretStatus = 'active' | 'pending' | 'rotating' | 'disabled';
type ServiceRegistryType = 'internal_module' | 'microservice' | 'external_api' | 'worker' | 'provider';
type ServiceRegistryAuthMode = 'none' | 'service_token' | 'jwt' | 'mtls' | 'basic' | 'api_key';

interface EnvironmentProfile {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  kind: EnvironmentKind;
  active: boolean;
  isDefault: boolean;
  requiresReauth: boolean;
}

interface EnvironmentVariableView {
  id: string;
  groupKey: string;
  key: string;
  value: string;
  valueType: EnvironmentValueType;
  target: EnvironmentVariableTarget;
  editable: boolean;
  requiresRestart: boolean;
  description?: string | null;
  parsedValue?: unknown;
}

interface EnvironmentSecretView {
  id: string;
  scopeType: EnvironmentSecretScopeType;
  scopeKey: string;
  key: string;
  maskedPreview?: string | null;
  status: EnvironmentSecretStatus;
  description?: string | null;
  secretRef: string;
  lastRotatedAt?: string | null;
}

interface ServiceRegistryEntryView {
  id: string;
  key: string;
  name: string;
  type: ServiceRegistryType;
  baseUrl: string;
  healthPath: string;
  authMode: ServiceRegistryAuthMode;
  secretRef?: string | null;
  timeoutMs: number;
  retryPolicy?: Record<string, unknown> | null;
  tlsRequired: boolean;
  allowedOperations?: string[] | null;
  active: boolean;
  description?: string | null;
}

interface EnvironmentValidationItem {
  severity: 'ok' | 'warning' | 'danger';
  key: string;
  title: string;
  detail: string;
}

interface EnvironmentValidationResult {
  readiness: number;
  status: 'ready' | 'warning' | 'blocked';
  items: EnvironmentValidationItem[];
}

interface EnvironmentDetail {
  profile: EnvironmentProfile;
  variables: EnvironmentVariableView[];
  secrets: EnvironmentSecretView[];
  services: ServiceRegistryEntryView[];
  validation: EnvironmentValidationResult;
  runtimeConfig: Record<string, unknown>;
}

interface EnvironmentOverview {
  vault: {
    provider: string;
    keyVersion: string;
    vaultPath: string;
    healthy: boolean;
  };
  currentEnvironment: string;
  profiles: EnvironmentProfile[];
  selected: EnvironmentDetail | null;
}

interface DeploymentBundleFile {
  path: string;
  kind: string;
  content: string;
}

interface DeploymentBundle {
  generatedAt: string;
  files: DeploymentBundleFile[];
}

@Component({
  selector: 'app-environments-page',
  standalone: true,
  imports: [
    AdminMetricCardComponent,
    AdminPanelComponent,
    CatalogItemComponent,
    CommonModule,
    DynamicFieldControlComponent,
    LoadingSkeletonComponent,
    ModuleHeaderComponent,
    PageShellComponent,
    SegmentedControlComponent,
    StatusNoticeComponent,
    UiKitButtonComponent
  ],
  styles: [
    `
      .env-page {
        display: grid;
        gap: 16px;
      }

      .metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(150px, 1fr));
        gap: 10px;
      }

      .workspace {
        display: grid;
        grid-template-columns: minmax(230px, 280px) minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }

      .env-list,
      .list-stack,
      .form-grid,
      .bundle-list {
        display: grid;
        gap: 10px;
      }

      .resource-card,
      .bundle-card {
        display: grid;
        gap: 6px;
        width: 100%;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 12px;
        text-align: left;
      }

      .resource-card {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
      }

      .form-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .span-2 {
        grid-column: 1 / -1;
      }

      .json-block {
        overflow: auto;
        max-height: 360px;
        border-radius: var(--ch-radius);
        background: #10243b;
        color: #f7fbff;
        padding: 14px;
        font-size: 0.82rem;
        line-height: 1.45;
      }

      .muted,
      .meta {
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .meta {
        font-size: 0.82rem;
      }

      h2,
      h3,
      p {
        margin: 0;
      }

      h3 {
        font-size: 1rem;
      }

      .validation-list {
        display: grid;
        gap: 8px;
      }

      .validation-item {
        border: 1px solid var(--item-border);
        border-radius: var(--ch-radius);
        background: var(--item-bg);
        padding: 10px 12px;
      }

      .validation-item.ok {
        --item-bg: var(--ch-color-success-soft);
        --item-border: var(--ch-color-success-border);
      }

      .validation-item.warning {
        --item-bg: var(--ch-color-warning-soft);
        --item-border: var(--ch-color-warning-border);
      }

      .validation-item.danger {
        --item-bg: var(--ch-color-danger-soft);
        --item-border: var(--ch-color-danger-border);
      }

      .secret-value {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        overflow-wrap: anywhere;
      }

      @media (max-width: 900px) {
        .workspace,
        .metrics,
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  template: `
    <app-page-shell contextLabel="Ambientes">
      <section class="env-page">
        <app-module-header
          eyebrow="Deploy Center"
          title="Ambientes y secrets"
          description="Administra local, dev, qa, pre y prod desde un centro seguro: variables, Chicle Vault, URLs de servicios y readiness de despliegue."
          badge="V1"
        ></app-module-header>

        @if (message) {
          <app-status-notice tone="success" title="Cambio aplicado">{{ message }}</app-status-notice>
        }
        @if (error) {
          <app-status-notice tone="error" title="No se pudo completar">{{ error }}</app-status-notice>
        }

        @if (loading) {
          <app-loading-skeleton variant="page" label="Cargando ambientes" [rows]="6"></app-loading-skeleton>
        } @else {
          <section class="metrics">
            <app-admin-metric-card
              label="Ambiente actual"
              [value]="overview?.currentEnvironment || 'local'"
              detail="Lo que reporta la API en este arranque."
              tone="primary"
            ></app-admin-metric-card>
            <app-admin-metric-card
              label="Chicle Vault"
              [value]="overview?.vault?.healthy ? 'Activo' : 'Revisar'"
              [detail]="overview?.vault?.provider || 'self managed'"
              [tone]="overview?.vault?.healthy ? 'success' : 'danger'"
            ></app-admin-metric-card>
            <app-admin-metric-card
              label="Readiness"
              [value]="readinessText"
              [detail]="statusText"
              [tone]="readinessTone"
            ></app-admin-metric-card>
            <app-admin-metric-card
              label="Servicios registrados"
              [value]="servicesCount"
              detail="URLs internas, microservicios y proveedores."
            ></app-admin-metric-card>
          </section>

          <section class="workspace">
            <app-admin-panel title="Ambientes" [description]="profiles.length + ' perfiles configurados'">
              <div panel-actions>
                <app-ui-kit-button
                  label="Nuevo"
                  variant="outline"
                  tone="primary"
                  (pressed)="resetProfileDraft()"
                ></app-ui-kit-button>
              </div>
              <div class="env-list">
                @for (profile of profiles; track profile.key) {
                  <app-catalog-item
                    [title]="profile.name"
                    [meta]="profile.key + ' · ' + profile.kind"
                    [detail]="profile.requiresReauth ? 'Reauth para secrets' : 'Sin reauth extra'"
                    [active]="selectedKey === profile.key"
                    (selected)="selectEnvironment(profile.key)"
                  ></app-catalog-item>
                }
              </div>
            </app-admin-panel>

            <div class="list-stack">
              <app-admin-panel
                [title]="selected?.profile?.name || 'Ambiente'"
                [description]="selected?.profile?.key ? 'Configura ' + selected?.profile?.key + ' sin exponer secrets.' : ''"
                eyebrow="Environment profile"
              >
                <div class="form-grid">
                  <app-dynamic-field-control
                    [field]="profileKeyField"
                    [value]="profileDraft.key"
                    (valueChange)="profileDraft.key = asText($event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="profileNameField"
                    [value]="profileDraft.name"
                    (valueChange)="profileDraft.name = asText($event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="profileKindField"
                    [value]="profileDraft.kind"
                    (valueChange)="profileDraft.kind = asEnvironmentKind($event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="profileReauthField"
                    [value]="profileDraft.requiresReauth"
                    (valueChange)="profileDraft.requiresReauth = $event === true"
                  ></app-dynamic-field-control>
                </div>
                <app-ui-kit-button
                  label="Guardar ambiente"
                  icon="pi pi-save"
                  [disabled]="saving === 'profile'"
                  (pressed)="saveProfile()"
                ></app-ui-kit-button>
              </app-admin-panel>

              <app-segmented-control
                ariaLabel="Environment sections"
                [items]="tabItems"
                [value]="activeTab"
                (valueChange)="setActiveTab($event)"
              ></app-segmented-control>

              @if (activeTab === 'variables') {
                <app-admin-panel title="Variables no secretas" description="Valores por ambiente con target api, app, docker, runtime o microservice. Siempre queda default local.">
                  <div class="form-grid">
                    <app-dynamic-field-control [field]="variableGroupField" [value]="variableDraft.groupKey" (valueChange)="variableDraft.groupKey = asText($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="variableKeyField" [value]="variableDraft.key" (valueChange)="variableDraft.key = asText($event).toUpperCase()"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="variableTypeField" [value]="variableDraft.valueType" (valueChange)="variableDraft.valueType = asValueType($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="variableTargetField" [value]="variableDraft.target" (valueChange)="variableDraft.target = asVariableTarget($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control class="span-2" [field]="variableValueField" [value]="variableDraft.value" (valueChange)="variableDraft.value = asText($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control class="span-2" [field]="variableDescriptionField" [value]="variableDraft.description" (valueChange)="variableDraft.description = asText($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="variableRestartField" [value]="variableDraft.requiresRestart" (valueChange)="variableDraft.requiresRestart = $event === true"></app-dynamic-field-control>
                  </div>
                  <app-ui-kit-button label="Guardar variable" icon="pi pi-save" [disabled]="saving === 'variable'" (pressed)="saveVariable()"></app-ui-kit-button>
                  <div class="list-stack">
                    @for (item of selected?.variables || []; track item.id) {
                      <article class="resource-card">
                        <div>
                          <strong>{{ item.key }}</strong>
                          <p class="meta">{{ item.groupKey }} · {{ item.target }} · {{ item.valueType }}{{ item.requiresRestart ? ' · reinicio requerido' : '' }}</p>
                          <p class="muted">{{ item.description || item.value }}</p>
                        </div>
                        <app-ui-kit-button
                          label="Editar"
                          variant="outline"
                          tone="neutral"
                          (pressed)="editVariable(item)"
                        ></app-ui-kit-button>
                      </article>
                    }
                  </div>
                </app-admin-panel>
              }

              @if (activeTab === 'secrets') {
                <app-admin-panel title="Chicle Vault" description="Secrets cifrados con AES-256-GCM. El valor real nunca vuelve al frontend.">
                  <div class="form-grid">
                    <app-dynamic-field-control [field]="secretScopeTypeField" [value]="secretDraft.scopeType" (valueChange)="secretDraft.scopeType = asSecretScope($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="secretScopeKeyField" [value]="secretDraft.scopeKey" (valueChange)="secretDraft.scopeKey = asText($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="secretKeyField" [value]="secretDraft.key" (valueChange)="secretDraft.key = asText($event).toUpperCase()"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="secretStatusField" [value]="secretDraft.status" (valueChange)="secretDraft.status = asSecretStatus($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control class="span-2" [field]="secretValueField" [value]="secretDraft.value" (valueChange)="secretDraft.value = asText($event)"></app-dynamic-field-control>
                    @if (selected?.profile?.requiresReauth) {
                      <app-dynamic-field-control class="span-2" [field]="secretReauthField" [value]="secretDraft.reauthPassword" (valueChange)="secretDraft.reauthPassword = asText($event)"></app-dynamic-field-control>
                    }
                    <app-dynamic-field-control class="span-2" [field]="secretDescriptionField" [value]="secretDraft.description" (valueChange)="secretDraft.description = asText($event)"></app-dynamic-field-control>
                  </div>
                  <app-ui-kit-button label="Guardar secret" icon="pi pi-lock" [disabled]="saving === 'secret'" (pressed)="saveSecret()"></app-ui-kit-button>
                  <div class="list-stack">
                    @for (item of selected?.secrets || []; track item.id) {
                      <article class="resource-card">
                        <div>
                          <strong>{{ item.scopeType }}/{{ item.scopeKey }}/{{ item.key }}</strong>
                          <p class="meta">{{ item.status }} · {{ item.maskedPreview || 'configured' }}</p>
                          <p class="secret-value">{{ item.secretRef }}</p>
                        </div>
                        <app-ui-kit-button
                          label="Rotar"
                          variant="outline"
                          tone="neutral"
                          (pressed)="editSecret(item)"
                        ></app-ui-kit-button>
                      </article>
                    }
                  </div>
                </app-admin-panel>
              }

              @if (activeTab === 'services') {
                <app-admin-panel title="Service registry" description="URLs y contratos por ambiente para módulos internos, microservicios, workers, proveedores e integraciones.">
                  <div class="form-grid">
                    <app-dynamic-field-control [field]="serviceKeyField" [value]="serviceDraft.key" (valueChange)="serviceDraft.key = asText($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="serviceNameField" [value]="serviceDraft.name" (valueChange)="serviceDraft.name = asText($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="serviceTypeField" [value]="serviceDraft.type" (valueChange)="serviceDraft.type = asServiceType($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="serviceAuthField" [value]="serviceDraft.authMode" (valueChange)="serviceDraft.authMode = asServiceAuth($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control class="span-2" [field]="serviceBaseUrlField" [value]="serviceDraft.baseUrl" (valueChange)="serviceDraft.baseUrl = asText($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="serviceHealthField" [value]="serviceDraft.healthPath" (valueChange)="serviceDraft.healthPath = asText($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="serviceTimeoutField" [value]="serviceDraft.timeoutMs" (valueChange)="serviceDraft.timeoutMs = asNumber($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control class="span-2" [field]="serviceSecretRefField" [value]="serviceDraft.secretRef" (valueChange)="serviceDraft.secretRef = asText($event)"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="serviceTlsField" [value]="serviceDraft.tlsRequired" (valueChange)="serviceDraft.tlsRequired = $event === true"></app-dynamic-field-control>
                    <app-dynamic-field-control [field]="serviceActiveField" [value]="serviceDraft.active" (valueChange)="serviceDraft.active = $event === true"></app-dynamic-field-control>
                  </div>
                  <app-ui-kit-button label="Guardar servicio" icon="pi pi-cloud" [disabled]="saving === 'service'" (pressed)="saveService()"></app-ui-kit-button>
                  <div class="list-stack">
                    @for (item of selected?.services || []; track item.id) {
                      <article class="resource-card">
                        <div>
                          <strong>{{ item.name }}</strong>
                          <p class="meta">{{ item.key }} · {{ item.type }} · {{ item.authMode }} · {{ item.timeoutMs }} ms</p>
                          <p class="muted">{{ item.baseUrl }}{{ item.healthPath }}</p>
                        </div>
                        <app-ui-kit-button
                          label="Editar"
                          variant="outline"
                          tone="neutral"
                          (pressed)="editService(item)"
                        ></app-ui-kit-button>
                      </article>
                    }
                  </div>
                </app-admin-panel>
              }

              @if (activeTab === 'deploy') {
                <app-admin-panel title="Readiness y artefactos" description="Valida condiciones mínimas y genera archivos revisables sin incluir secrets reales.">
                  <app-ui-kit-button label="Generar bundle" icon="pi pi-file-export" [disabled]="saving === 'bundle'" (pressed)="generateBundle()"></app-ui-kit-button>
                  <section class="validation-list">
                    @for (item of validationItems; track item.key) {
                      <article class="validation-item" [class.ok]="item.severity === 'ok'" [class.warning]="item.severity === 'warning'" [class.danger]="item.severity === 'danger'">
                        <strong>{{ item.title }}</strong>
                        <p>{{ item.detail }}</p>
                      </article>
                    }
                  </section>
                  <div class="form-grid">
                    <div>
                      <h3>Runtime config público</h3>
                      <pre class="json-block">{{ selected?.runtimeConfig | json }}</pre>
                    </div>
                    <div>
                      <h3>Bundle generado</h3>
                      @if (bundle) {
                        <div class="bundle-list">
                          @for (file of bundle.files; track file.path) {
                            <article class="bundle-card">
                              <strong>{{ file.path }}</strong>
                              <span class="meta">{{ file.kind }}</span>
                            </article>
                          }
                        </div>
                      } @else {
                        <p class="muted">Genera el bundle para revisar compose, env template, runtime-config y checklist.</p>
                      }
                    </div>
                  </div>
                </app-admin-panel>
              }
            </div>
          </section>
        }
      </section>
    </app-page-shell>
  `
})
export class EnvironmentsPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);

  loading = true;
  saving = '';
  message = '';
  error = '';
  selectedKey = 'local';
  activeTab: 'variables' | 'secrets' | 'services' | 'deploy' = 'variables';
  overview: EnvironmentOverview | null = null;
  profiles: EnvironmentProfile[] = [];
  selected: EnvironmentDetail | null = null;
  bundle: DeploymentBundle | null = null;
  readonly tabItems: SegmentedControlItem[] = [
    { key: 'variables', label: 'Variables' },
    { key: 'secrets', label: 'Secrets' },
    { key: 'services', label: 'Service registry' },
    { key: 'deploy', label: 'Deploy' }
  ];

  profileDraft = {
    key: 'local',
    name: 'Local',
    kind: 'local' as EnvironmentKind,
    requiresReauth: false
  };

  variableDraft = {
    groupKey: 'runtime',
    key: 'API_PUBLIC_URL',
    value: '/api',
    valueType: 'string' as EnvironmentValueType,
    target: 'runtime' as EnvironmentVariableTarget,
    requiresRestart: true,
    description: ''
  };

  secretDraft = {
    scopeType: 'api' as EnvironmentSecretScopeType,
    scopeKey: 'default',
    key: 'JWT_SECRET',
    value: '',
    status: 'active' as EnvironmentSecretStatus,
    description: '',
    reauthPassword: ''
  };

  serviceDraft = {
    key: 'catalog-api',
    name: 'Catalog API',
    type: 'microservice' as ServiceRegistryType,
    baseUrl: 'http://localhost:3000',
    healthPath: '/health',
    authMode: 'none' as ServiceRegistryAuthMode,
    secretRef: '',
    timeoutMs: 8000,
    tlsRequired: false,
    active: true
  };

  readonly profileKeyField = this.textField('key', 'Key', 'prod');
  readonly profileNameField = this.textField('name', 'Nombre', 'Production');
  readonly profileKindField = this.selectField('kind', 'Tipo', [
    ['Local', 'local'],
    ['No productivo', 'non_prod'],
    ['Producción', 'production'],
    ['Custom', 'custom']
  ]);
  readonly profileReauthField = this.toggleField('requiresReauth', 'Reauth para secrets', 'Exigir contraseña al guardar secrets');
  readonly variableGroupField = this.textField('groupKey', 'Grupo', 'runtime');
  readonly variableKeyField = this.textField('key', 'Variable', 'API_PUBLIC_URL');
  readonly variableTypeField = this.selectField('valueType', 'Tipo de valor', [
    ['Texto', 'string'],
    ['Número', 'number'],
    ['Booleano', 'boolean'],
    ['JSON', 'json']
  ]);
  readonly variableTargetField = this.selectField('target', 'Target', [
    ['API', 'api'],
    ['App', 'app'],
    ['Worker', 'worker'],
    ['Docker', 'docker'],
    ['Runtime público', 'runtime'],
    ['Microservice', 'microservice']
  ]);
  readonly variableValueField = this.textareaField('value', 'Valor', 'Valor visible o JSON.');
  readonly variableDescriptionField = this.textareaField('description', 'Descripción', 'Para qué sirve esta variable.');
  readonly variableRestartField = this.toggleField('requiresRestart', 'Requiere reinicio', 'Aplica al reiniciar artefactos/runtime');
  readonly secretScopeTypeField = this.selectField('scopeType', 'Scope', [
    ['API', 'api'],
    ['App', 'app'],
    ['Worker', 'worker'],
    ['Integration', 'integration'],
    ['Dynamic service', 'dynamic_service'],
    ['Flow', 'flow'],
    ['Microservice', 'microservice']
  ]);
  readonly secretScopeKeyField = this.textField('scopeKey', 'Scope key', 'default');
  readonly secretKeyField = this.textField('key', 'Secret key', 'JWT_SECRET');
  readonly secretStatusField = this.selectField('status', 'Estado', [
    ['Activo', 'active'],
    ['Pendiente', 'pending'],
    ['Rotando', 'rotating'],
    ['Desactivado', 'disabled']
  ]);
  readonly secretValueField = { ...this.textField('value', 'Valor secreto', 'Pega el secret'), type: 'password' };
  readonly secretReauthField = { ...this.textField('reauthPassword', 'Contraseña owner/admin', 'Reautenticación'), type: 'password' };
  readonly secretDescriptionField = this.textareaField('description', 'Descripción', 'Dónde se usa este secret.');
  readonly serviceKeyField = this.textField('key', 'Key', 'billing-api');
  readonly serviceNameField = this.textField('name', 'Nombre', 'Billing API');
  readonly serviceTypeField = this.selectField('type', 'Tipo', [
    ['Módulo interno', 'internal_module'],
    ['Microservicio', 'microservice'],
    ['API externa', 'external_api'],
    ['Worker', 'worker'],
    ['Provider', 'provider']
  ]);
  readonly serviceAuthField = this.selectField('authMode', 'Auth', [
    ['Ninguna', 'none'],
    ['Service token', 'service_token'],
    ['JWT', 'jwt'],
    ['mTLS', 'mtls'],
    ['Basic', 'basic'],
    ['API key', 'api_key']
  ]);
  readonly serviceBaseUrlField = this.textField('baseUrl', 'Base URL', 'https://api.empresa.com');
  readonly serviceHealthField = this.textField('healthPath', 'Health path', '/health');
  readonly serviceTimeoutField = { ...this.textField('timeoutMs', 'Timeout ms', '8000'), type: 'number' };
  readonly serviceSecretRefField = this.textField('secretRef', 'Secret ref', 'secret:prod.api.default.SERVICE_TOKEN');
  readonly serviceTlsField = this.toggleField('tlsRequired', 'TLS requerido', 'Exigir HTTPS/TLS');
  readonly serviceActiveField = this.toggleField('active', 'Servicio activo', 'Disponible para ejecución');

  ngOnInit() {
    this.loadOverview();
  }

  setActiveTab(value: string) {
    if (value === 'variables' || value === 'secrets' || value === 'services' || value === 'deploy') {
      this.activeTab = value;
    }
  }

  get readinessText() {
    return this.selected ? `${this.selected.validation.readiness}%` : '0%';
  }

  get readinessTone(): AdminMetricTone {
    if (!this.selected) return 'neutral';
    return this.selected.validation.status === 'ready'
      ? 'success'
      : this.selected.validation.status === 'warning'
        ? 'warning'
        : 'danger';
  }

  get statusText() {
    return this.selected?.validation.status ?? 'Sin validar';
  }

  get servicesCount() {
    return String(this.selected?.services.length ?? 0);
  }

  get validationItems() {
    return this.selected?.validation.items ?? [];
  }

  loadOverview() {
    this.loading = true;
    this.clearStatus();
    this.api.get<EnvironmentOverview>('environment-deploy/overview').subscribe({
      next: (overview) => {
        this.overview = overview;
        this.profiles = overview.profiles;
        this.selected = overview.selected;
        this.selectedKey = overview.selected?.profile.key ?? overview.profiles[0]?.key ?? 'local';
        this.hydrateProfileDraft();
        this.loading = false;
      },
      error: (err) => this.fail(err, 'No se pudieron cargar los ambientes.')
    });
  }

  selectEnvironment(key: string) {
    this.selectedKey = key;
    this.bundle = null;
    this.clearStatus();
    this.api.get<EnvironmentDetail>(`environment-deploy/environments/${key}`).subscribe({
      next: (detail) => {
        this.selected = detail;
        this.hydrateProfileDraft();
      },
      error: (err) => this.fail(err, 'No se pudo cargar el ambiente.')
    });
  }

  saveProfile() {
    this.saving = 'profile';
    this.clearStatus();
    const isNew = !this.profiles.some((profile) => profile.key === this.profileDraft.key);
    const request = {
      key: this.profileDraft.key,
      name: this.profileDraft.name,
      kind: this.profileDraft.kind,
      requiresReauth: this.profileDraft.requiresReauth,
      active: true
    };
    const call = isNew
      ? this.api.post<EnvironmentProfile>('environment-deploy/environments', request)
      : this.api.patch<EnvironmentProfile>(`environment-deploy/environments/${this.selectedKey}`, request);

    call.subscribe({
      next: (profile) => {
        this.saving = '';
        this.message = 'Ambiente guardado.';
        this.selectedKey = profile.key;
        this.loadOverview();
      },
      error: (err) => this.fail(err, 'No se pudo guardar el ambiente.')
    });
  }

  saveVariable() {
    this.saving = 'variable';
    this.clearStatus();
    this.api
      .post<EnvironmentVariableView>(`environment-deploy/environments/${this.selectedKey}/variables`, {
        ...this.variableDraft,
        value: this.variableValue()
      })
      .subscribe({
        next: () => this.afterSave('Variable guardada.'),
        error: (err) => this.fail(err, 'No se pudo guardar la variable.')
      });
  }

  saveSecret() {
    this.saving = 'secret';
    this.clearStatus();
    this.api
      .post<EnvironmentSecretView>(`environment-deploy/environments/${this.selectedKey}/secrets`, {
        ...this.secretDraft,
        reauthPassword: this.secretDraft.reauthPassword || undefined
      })
      .subscribe({
        next: () => {
          this.secretDraft.value = '';
          this.secretDraft.reauthPassword = '';
          this.afterSave('Secret guardado en Chicle Vault.');
        },
        error: (err) => this.fail(err, 'No se pudo guardar el secret.')
      });
  }

  saveService() {
    this.saving = 'service';
    this.clearStatus();
    this.api
      .post<ServiceRegistryEntryView>(`environment-deploy/environments/${this.selectedKey}/service-registry`, {
        ...this.serviceDraft,
        secretRef: this.serviceDraft.secretRef || null,
        retryPolicy: { attempts: 0, backoffMs: 0 },
        allowedOperations: []
      })
      .subscribe({
        next: () => this.afterSave('Servicio registrado.'),
        error: (err) => this.fail(err, 'No se pudo guardar el servicio.')
      });
  }

  generateBundle() {
    this.saving = 'bundle';
    this.clearStatus();
    this.api.get<DeploymentBundle>(`environment-deploy/environments/${this.selectedKey}/deployment-bundle`).subscribe({
      next: (bundle) => {
        this.bundle = bundle;
        this.saving = '';
        this.message = 'Bundle generado para revisión.';
      },
      error: (err) => this.fail(err, 'No se pudo generar el bundle.')
    });
  }

  editVariable(item: EnvironmentVariableView) {
    this.variableDraft = {
      groupKey: item.groupKey,
      key: item.key,
      value: item.value,
      valueType: item.valueType,
      target: item.target,
      requiresRestart: item.requiresRestart,
      description: item.description ?? ''
    };
  }

  editSecret(item: EnvironmentSecretView) {
    this.secretDraft = {
      scopeType: item.scopeType,
      scopeKey: item.scopeKey,
      key: item.key,
      value: '',
      status: item.status,
      description: item.description ?? '',
      reauthPassword: ''
    };
  }

  editService(item: ServiceRegistryEntryView) {
    this.serviceDraft = {
      key: item.key,
      name: item.name,
      type: item.type,
      baseUrl: item.baseUrl,
      healthPath: item.healthPath,
      authMode: item.authMode,
      secretRef: item.secretRef ?? '',
      timeoutMs: item.timeoutMs,
      tlsRequired: item.tlsRequired,
      active: item.active
    };
  }

  resetProfileDraft() {
    this.profileDraft = {
      key: 'custom-env',
      name: 'Custom environment',
      kind: 'custom',
      requiresReauth: false
    };
  }

  asText(value: unknown) {
    return String(value ?? '');
  }

  asNumber(value: unknown) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  asEnvironmentKind(value: unknown): EnvironmentKind {
    return this.asText(value) as EnvironmentKind;
  }

  asValueType(value: unknown): EnvironmentValueType {
    return this.asText(value) as EnvironmentValueType;
  }

  asVariableTarget(value: unknown): EnvironmentVariableTarget {
    return this.asText(value) as EnvironmentVariableTarget;
  }

  asSecretScope(value: unknown): EnvironmentSecretScopeType {
    return this.asText(value) as EnvironmentSecretScopeType;
  }

  asSecretStatus(value: unknown): EnvironmentSecretStatus {
    return this.asText(value) as EnvironmentSecretStatus;
  }

  asServiceType(value: unknown): ServiceRegistryType {
    return this.asText(value) as ServiceRegistryType;
  }

  asServiceAuth(value: unknown): ServiceRegistryAuthMode {
    return this.asText(value) as ServiceRegistryAuthMode;
  }

  private hydrateProfileDraft() {
    if (!this.selected) return;
    this.profileDraft = {
      key: this.selected.profile.key,
      name: this.selected.profile.name,
      kind: this.selected.profile.kind,
      requiresReauth: this.selected.profile.requiresReauth
    };
  }

  private afterSave(message: string) {
    this.saving = '';
    this.message = message;
    this.selectEnvironment(this.selectedKey);
  }

  private variableValue() {
    const raw = this.variableDraft.value;
    if (this.variableDraft.valueType === 'json') {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
    if (this.variableDraft.valueType === 'number') {
      return Number(raw);
    }
    if (this.variableDraft.valueType === 'boolean') {
      return raw === 'true' || raw === '1' || raw.toLowerCase() === 'sí' || raw.toLowerCase() === 'si';
    }
    return raw;
  }

  private clearStatus() {
    this.message = '';
    this.error = '';
  }

  private fail(err: unknown, fallback: string) {
    this.loading = false;
    this.saving = '';
    this.error = this.errorMessage(err, fallback);
  }

  private errorMessage(err: unknown, fallback: string) {
    if (err && typeof err === 'object' && 'error' in err) {
      const payload = (err as { error?: { message?: string | string[] } }).error;
      if (Array.isArray(payload?.message)) {
        return payload.message.join(' ');
      }
      if (payload?.message) {
        return payload.message;
      }
    }
    return fallback;
  }

  private textField(name: string, label: string, placeholder: string): RuntimeField {
    return { name, type: 'text', label, placeholder };
  }

  private textareaField(name: string, label: string, placeholder: string): RuntimeField {
    return { name, type: 'textarea', label, placeholder };
  }

  private toggleField(name: string, label: string, placeholder: string): RuntimeField {
    return { name, type: 'toggle', label, placeholder };
  }

  private selectField(name: string, label: string, options: Array<[string, string]>): RuntimeField {
    return {
      name,
      type: 'select',
      label,
      placeholder: 'Selecciona una opción',
      options: options.map(([optionLabel, value]) => ({ label: optionLabel, value }))
    };
  }
}
