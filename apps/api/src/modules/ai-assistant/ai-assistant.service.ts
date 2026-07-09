import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AuthContext } from '../auth/auth.types';
import { ConfisysService } from '../confisys/confisys.service';
import {
  AiAssistantConfig,
  AiAssistantRequest,
  AiAssistantResponse,
  AiAssistantScope,
  AiAssistantUiAction
} from './ai-assistant.types';
import { OllamaProviderService } from './ollama-provider.service';

interface AssistantServiceScreenState {
  draft?: {
    key?: string;
    name?: string;
    description?: string;
    active?: boolean;
  };
  guide?: {
    primaryTable?: string;
    warnings?: string[];
  };
  definition?: Record<string, unknown>;
  lastRun?: {
    status?: string;
    error?: string | null;
    durationMs?: number;
  } | null;
  availableTables?: Array<{
    name?: string;
    columns?: string[];
  }>;
}

@Injectable()
export class AiAssistantService {
  constructor(
    private readonly confisys: ConfisysService,
    private readonly ollama: OllamaProviderService
  ) {}

  getConfig(): AiAssistantConfig {
    return {
      enabled: this.booleanFromEnv('AI_ENABLED', this.confisys.get<boolean>('ai.enabled', true)),
      provider: this.stringFromEnv('AI_PROVIDER', this.confisys.get<string>('ai.provider', 'ollama')),
      baseUrl: this.stringFromEnv(
        'AI_BASE_URL',
        this.confisys.get<string>('ai.baseUrl', 'http://localhost:11434/v1')
      ),
      chatModel: this.stringFromEnv(
        'AI_CHAT_MODEL',
        this.confisys.get<string>('ai.chatModel', 'qwen2.5-coder:7b')
      ),
      embeddingModel: this.stringFromEnv(
        'AI_EMBEDDING_MODEL',
        this.confisys.get<string>('ai.embeddingModel', 'nomic-embed-text:v1.5')
      ),
      timeoutMs: this.numberFromEnv('AI_TIMEOUT_MS', this.confisys.get<number>('ai.timeoutMs', 60000)),
      ragEnabled: this.booleanFromEnv('AI_RAG_ENABLED', this.confisys.get<boolean>('ai.rag.enabled', true)),
      ragMode: this.stringFromEnv('AI_RAG_MODE', this.confisys.get<string>('ai.rag.mode', 'keyword')),
      maxContextChunks: this.numberFromEnv(
        'AI_MAX_CONTEXT_CHUNKS',
        this.confisys.get<number>('ai.maxContextChunks', 12)
      ),
      allowPublish: this.booleanFromEnv('AI_ALLOW_PUBLISH', this.confisys.get<boolean>('ai.allowPublish', false))
    };
  }

  async status() {
    const config = this.getConfig();
    const providerStatus = config.enabled
      ? await this.getProviderStatus({ ...config, timeoutMs: Math.min(config.timeoutMs, 5000) })
      : null;

    return {
      enabled: config.enabled,
      provider: config.provider,
      baseUrl: config.baseUrl,
      chatModel: config.chatModel,
      embeddingModel: config.embeddingModel,
      rag: {
        enabled: config.ragEnabled,
        mode: config.ragMode,
        maxContextChunks: config.maxContextChunks
      },
      safety: {
        allowPublish: config.allowPublish,
        appliesDraftOnly: true
      },
      providerStatus
    };
  }

  async chat(auth: AuthContext, request: AiAssistantRequest): Promise<AiAssistantResponse> {
    const config = this.getConfig();
    if (!config.enabled) {
      throw new ServiceUnavailableException('AI assistant is disabled');
    }

    if (config.provider !== 'ollama') {
      throw new ServiceUnavailableException(`AI provider ${config.provider} is not implemented yet`);
    }

    const scope = request.scope ?? this.scopeFromRoute(request.route);
    if (scope === 'services' && !this.hasAccess(auth, 'services.read')) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message:
          'Estás en Servicios, pero tu sesión actual no tiene services.read. Entra de nuevo o sincroniza seguridad antes de que pueda ayudarte en esta pantalla.'
      };
    }

    if (scope === 'services' && !this.hasAccess(auth, 'services.manage')) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message:
          'Puedo explicarte cómo sería el servicio, pero no puedo aplicar drafts en esta pantalla porque falta services.manage.'
      };
    }

    const screenAware = this.buildScreenAwareResponse(scope, request);
    if (screenAware) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        ...screenAware
      };
    }

    const actions = this.buildActions(scope, request);
    if (actions.length) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message: [
          'Preparé una propuesta aplicable en esta pantalla.',
          'Ya la envié al diseñador como draft visual. Revisa la guía y el JSON antes de guardar o publicar.',
          'No guardé ni publiqué nada automáticamente.'
        ].join('\n\n'),
        actions
      };
    }

    if (scope === 'services' && this.looksLikeServiceAuthoring(request.prompt)) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message:
          'Todavía no pude convertir esa solicitud en un draft seguro. Indícame la tabla y el campo, por ejemplo: "servicio de la tabla permissions para listar por key".'
      };
    }

    const system = this.buildSystemPrompt(auth, scope, config);
    const user = this.buildUserPrompt(request);
    const response = await this.ollama
      .chat(config, [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ])
      .catch((error: unknown) => null);

    if (!response) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message: this.providerFailureMessage(scope)
      };
    }

    return {
      ok: true,
      provider: config.provider,
      model: config.chatModel,
      scope,
      message: response.message,
      raw: response.raw
    };
  }

  private async getProviderStatus(config: AiAssistantConfig) {
    if (config.provider === 'ollama') {
      return this.ollama.status(config);
    }

    return {
      reachable: false,
      models: [],
      chatModelAvailable: false,
      embeddingModelAvailable: false,
      error: `Provider ${config.provider} is not implemented yet`
    };
  }

  private buildSystemPrompt(auth: AuthContext, scope: AiAssistantScope, config: AiAssistantConfig) {
    return [
      'Eres Chicle AI, asistente de configuración de Chicle Engine.',
      'Responde en español claro y breve.',
      'No publiques cambios ni digas que ya guardaste algo.',
      'Tu trabajo es ayudar a preparar drafts declarativos para la pantalla actual.',
      'No generes SQL libre, JavaScript arbitrario, secretos, tokens ni contraseñas.',
      'Si falta contexto, pide el dato faltante en vez de inventarlo.',
      'Cuando estés en Servicios, explica la propuesta brevemente; el backend puede adjuntar una acción estructurada para que el front la aplique.',
      `Scope actual: ${scope}.`,
      `Tenant actual: ${auth.tenant.slug}.`,
      `Roles del usuario: ${auth.roles.map((role) => role.key).join(', ') || 'sin roles'}.`,
      `RAG activo: ${config.ragEnabled ? config.ragMode : 'disabled'}.`,
      `Publicación directa permitida: ${config.allowPublish ? 'si' : 'no'}.`
    ].join('\n');
  }

  private buildUserPrompt(request: AiAssistantRequest) {
    return JSON.stringify(
      {
        prompt: request.prompt,
        route: request.route,
        scope: request.scope,
        screenState: request.screenState ?? null
      },
      null,
      2
    );
  }

  private buildActions(scope: AiAssistantScope, request: AiAssistantRequest): AiAssistantUiAction[] {
    if (scope !== 'services') {
      return [];
    }

    const service = this.serviceDraftFromPrompt(request.prompt);
    return service ? [service] : [];
  }

  private looksLikeReview(prompt: string) {
    return /revis|corrig|arregl|fall[oó]|falla|error|no funciona|ajusta|mejora|contin[uú]a|retoma/i.test(prompt);
  }

  private serviceScreenState(value: unknown): AssistantServiceScreenState | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as AssistantServiceScreenState;
  }

  private buildScreenAwareResponse(
    scope: AiAssistantScope,
    request: AiAssistantRequest
  ): Pick<AiAssistantResponse, 'message' | 'actions'> | null {
    if (scope !== 'services' || !this.looksLikeReview(request.prompt)) {
      return null;
    }

    const state = this.serviceScreenState(request.screenState);
    if (!state?.definition) {
      return {
        message:
          'No veo un servicio abierto para revisar. Abre o crea un servicio, o dime tabla y campo para preparar un draft nuevo.'
      };
    }

    const repaired = this.repairServiceDefinitionFromState(request.prompt, state);
    if (!repaired.action) {
      return {
        message: repaired.message
      };
    }

    const lastRunLine = state.lastRun?.error ? `\n\nDetecté el último error: ${state.lastRun.error}` : '';

    return {
      message: [
        'Revisé el servicio actual y preparé una corrección aplicable en esta pantalla.',
        repaired.message,
        'No guardé ni publiqué nada automáticamente. Revisa el JSON, guarda el draft y publica cuando estés conforme.'
      ].join('\n\n') + lastRunLine,
      actions: [repaired.action]
    };
  }

  private repairServiceDefinitionFromState(
    prompt: string,
    state: AssistantServiceScreenState
  ): { action?: AiAssistantUiAction; message: string } {
    const normalized = prompt.toLowerCase();
    const current = { ...(state.definition ?? {}) };
    const dataTarget =
      current.dataTarget && typeof current.dataTarget === 'object' && !Array.isArray(current.dataTarget)
        ? ({ ...(current.dataTarget as Record<string, unknown>) } as Record<string, unknown>)
        : {};

    const tableFromPrompt = this.detectTable(normalized);
    const tableFromState = this.stringValue(dataTarget.primaryTable) || state.guide?.primaryTable;
    const table = tableFromPrompt || tableFromState;
    if (!table) {
      return {
        message:
          'Para corregirlo necesito saber la tabla principal. Ejemplo: "corrige este servicio usando la tabla users por email".'
      };
    }

    const available = state.availableTables?.find((item) => item.name === table);
    const columns = available?.columns ?? [];
    const fieldFromPrompt = this.detectField(normalized);
    const currentFilters = Array.isArray(dataTarget.filters) ? dataTarget.filters : [];
    const firstFilterField = this.stringValue((currentFilters[0] as Record<string, unknown> | undefined)?.field);
    const field = fieldFromPrompt || firstFilterField || this.preferredField(columns);
    if (!field) {
      return {
        message: `Ya identifiqué la tabla ${table}, pero necesito el campo de búsqueda. Campos disponibles: ${
          columns.join(', ') || 'no tengo columnas cargadas'
        }.`
      };
    }

    if (columns.length && !columns.includes(field)) {
      return {
        message: `El campo ${field} no aparece en la tabla ${table}. Campos disponibles: ${columns.join(', ')}.`
      };
    }

    const operator = /igual|exact|exacto|por id|por key exact/.test(normalized) ? 'equals' : 'contains';
    const resultKind = this.stringValue(current.resultKind) || (/uno|un registro|detalle/.test(normalized) ? 'single' : 'list');
    const filters = currentFilters.length
      ? currentFilters.map((filter) =>
          this.normalizeServiceFilter(filter, field, operator)
        )
      : [
          {
            field,
            operator,
            valueSource: 'input',
            inputKey: field,
            required: true
          }
        ];

    const query = {
      ...(current.query && typeof current.query === 'object' && !Array.isArray(current.query)
        ? (current.query as Record<string, string>)
        : {})
    };
    for (const filter of filters) {
      const inputKey = this.stringValue((filter as Record<string, unknown>).inputKey);
      if (inputKey) {
        query[inputKey] = `{{input.${inputKey}}}`;
      }
    }

    const document = {
      ...current,
      intent: this.stringValue(current.intent) || 'query',
      source: 'internal_table',
      resultKind,
      pagination:
        current.pagination && typeof current.pagination === 'object' && !Array.isArray(current.pagination)
          ? (current.pagination as Record<string, unknown>)
          : { enabled: false },
      effects: Array.isArray(current.effects) && current.effects.length ? current.effects : [{ type: 'show_response' }],
      dataTarget: {
        ...dataTarget,
        queryMode: this.stringValue(dataTarget.queryMode) || 'single_table',
        primaryTable: table,
        involvedTables: Array.isArray(dataTarget.involvedTables) ? dataTarget.involvedTables : [],
        relationNotes: this.stringValue(dataTarget.relationNotes),
        filterNotes: filters
          .map((filter) => {
            const item = filter as Record<string, unknown>;
            return `${item.field} ${item.operator} input.${item.inputKey}`;
          })
          .join(' y '),
        matchMode: this.stringValue(dataTarget.matchMode) || 'all',
        filters
      },
      method: 'GET',
      url: `internal://table/${table}`,
      headers:
        current.headers && typeof current.headers === 'object' && !Array.isArray(current.headers)
          ? (current.headers as Record<string, string>)
          : {},
      query,
      body: null,
      timeoutMs: Number(current.timeoutMs ?? 8000),
      retry:
        current.retry && typeof current.retry === 'object' && !Array.isArray(current.retry)
          ? (current.retry as Record<string, unknown>)
          : { attempts: 0, backoffMs: 0 },
      responseMap:
        current.responseMap && typeof current.responseMap === 'object' && !Array.isArray(current.responseMap)
          ? (current.responseMap as Record<string, string>)
          : {}
    };

    return {
      message: `Ajusté el servicio para consultar ${table} por ${field}, usando GET interno y el query {{input.${field}}}.`,
      action: {
        type: 'apply_dynamic_service_json',
        label: 'Aplicar corrección al diseñador de servicios',
        key: state.draft?.key || `${resultKind === 'single' ? 'consultar' : 'listar'}_${table}_por_${field}`,
        name: state.draft?.name || `${resultKind === 'single' ? 'Consultar' : 'Listar'} ${this.labelForTable(table)} por ${field}`,
        description:
          state.draft?.description ||
          `${resultKind === 'single' ? 'Consulta un registro' : 'Lista registros'} de ${this.labelForTable(
            table
          )} filtrando por ${field}.`,
        publish: false,
        document
      }
    };
  }

  private normalizeServiceFilter(filter: unknown, fallbackField: string, fallbackOperator: string) {
    const item =
      filter && typeof filter === 'object' && !Array.isArray(filter) ? (filter as Record<string, unknown>) : {};
    const field = this.stringValue(item.field) || fallbackField;
    return {
      field,
      operator: this.stringValue(item.operator) || fallbackOperator,
      valueSource: this.stringValue(item.valueSource) || 'input',
      inputKey: this.stringValue(item.inputKey) || field,
      required: typeof item.required === 'boolean' ? item.required : true
    };
  }

  private preferredField(columns: string[]) {
    return ['key', 'name', 'email', 'slug', 'id'].find((field) => columns.includes(field)) ?? columns[0];
  }

  private stringValue(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private serviceDraftFromPrompt(prompt: string): AiAssistantUiAction | null {
    const normalized = prompt.toLowerCase();
    const confisysDraft = this.confisysServiceDraftFromPrompt(normalized);
    if (confisysDraft) {
      return confisysDraft;
    }

    const wantsUsers = /usuario|usuarios|user|users/.test(normalized);
    if (!wantsUsers) {
      return this.genericInternalTableServiceDraftFromPrompt(normalized);
    }

    const filters: Array<{
      field: string;
      operator: string;
      valueSource: string;
      inputKey: string;
      required: boolean;
    }> = [];

    if (/nombre|name/.test(normalized)) {
      filters.push({
        field: 'name',
        operator: 'contains',
        valueSource: 'input',
        inputKey: 'name',
        required: true
      });
    }

    if (/correo|email|mail/.test(normalized)) {
      filters.push({
        field: 'email',
        operator: 'contains',
        valueSource: 'input',
        inputKey: 'email',
        required: filters.length === 0
      });
    }

    if (!filters.length) {
      filters.push({
        field: 'name',
        operator: 'contains',
        valueSource: 'input',
        inputKey: 'name',
        required: true
      });
    }

    const matchMode = / o | uno de los dos|cualquiera/.test(normalized) && filters.length > 1 ? 'any' : 'all';
    const byNameOnly = filters.length === 1 && filters[0].field === 'name';
    const key = byNameOnly ? 'filtrar_usuarios_por_nombre' : 'filtrar_usuarios';

    return {
      type: 'apply_dynamic_service_json',
      label: 'Aplicar propuesta al diseñador de servicios',
      key,
      name: byNameOnly ? 'Filtrar usuarios por nombre' : 'Filtrar usuarios',
      description: byNameOnly
        ? 'Consulta usuarios del tenant filtrando por nombre.'
        : 'Consulta usuarios del tenant con filtros configurables.',
      publish: false,
      document: {
        intent: 'query',
        source: 'internal_table',
        resultKind: 'list',
        pagination: {
          enabled: false
        },
        effects: [
          {
            type: 'show_response'
          }
        ],
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: 'users',
          involvedTables: [],
          relationNotes: '',
          filterNotes: filters
            .map((filter) => `${filter.field} ${filter.operator} input.${filter.inputKey}`)
            .join(matchMode === 'any' ? ' o ' : ' y '),
          matchMode,
          filters
        },
        method: 'GET',
        url: 'internal://table/users',
        headers: {},
        query: Object.fromEntries(filters.map((filter) => [filter.inputKey, `{{input.${filter.inputKey}}}`])),
        body: null,
        timeoutMs: 8000,
        retry: {
          attempts: 0,
          backoffMs: 0
        },
        responseMap: {}
      }
    };
  }

  private genericInternalTableServiceDraftFromPrompt(normalizedPrompt: string): AiAssistantUiAction | null {
    const table = this.detectTable(normalizedPrompt);
    if (!table) {
      return null;
    }

    const field = this.detectField(normalizedPrompt) ?? 'key';
    const operator = /igual|exact|exacto|por id|por key exact/.test(normalizedPrompt) ? 'equals' : 'contains';
    const single = /uno|un registro|detalle|exact/.test(normalizedPrompt);
    const label = this.labelForTable(table);
    const key = `${single ? 'consultar' : 'listar'}_${table}_por_${field}`;

    return this.internalTableServiceDraft({
      key,
      name: `${single ? 'Consultar' : 'Listar'} ${label} por ${field}`,
      description: `${single ? 'Consulta un registro' : 'Lista registros'} de ${label} filtrando por ${field}.`,
      table,
      field,
      operator,
      resultKind: single ? 'single' : 'list'
    });
  }

  private confisysServiceDraftFromPrompt(normalizedPrompt: string): AiAssistantUiAction | null {
    const wantsConfisys = /confisys|configuraci[oó]n|parametro|par[aá]metro/.test(normalizedPrompt);
    if (!wantsConfisys) {
      return null;
    }

    const plural = /keys|varios|lista|listar/.test(normalizedPrompt);
    const operator = plural ? 'contains' : 'equals';
    return this.internalTableServiceDraft({
      key: plural ? 'consultar_confisys_por_keys' : 'consultar_confisys_por_key',
      name: plural ? 'Consultar confisys por keys' : 'Consultar confisys por key',
      description: plural
        ? 'Consulta parámetros confisys filtrando por coincidencia en key.'
        : 'Consulta un parámetro confisys por key.',
      table: 'confisys',
      field: 'key',
      operator,
      resultKind: plural ? 'list' : 'single'
    });
  }

  private internalTableServiceDraft(options: {
    key: string;
    name: string;
    description: string;
    table: string;
    field: string;
    operator: string;
    resultKind: string;
  }): AiAssistantUiAction {
    return {
      type: 'apply_dynamic_service_json',
      label: 'Aplicar propuesta al diseñador de servicios',
      key: options.key,
      name: options.name,
      description: options.description,
      publish: false,
      document: {
        intent: 'query',
        source: 'internal_table',
        resultKind: options.resultKind,
        pagination: {
          enabled: false
        },
        effects: [
          {
            type: 'show_response'
          }
        ],
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: options.table,
          involvedTables: [],
          relationNotes: '',
          filterNotes: `${options.field} ${options.operator} input.${options.field}`,
          matchMode: 'all',
          filters: [
            {
              field: options.field,
              operator: options.operator,
              valueSource: 'input',
              inputKey: options.field,
              required: true
            }
          ]
        },
        method: 'GET',
        url: `internal://table/${options.table}`,
        headers: {},
        query: {
          [options.field]: `{{input.${options.field}}}`
        },
        body: null,
        timeoutMs: 8000,
        retry: {
          attempts: 0,
          backoffMs: 0
        },
        responseMap: {}
      }
    };
  }

  private detectTable(normalizedPrompt: string) {
    const candidates: Array<{ table: string; patterns: RegExp[] }> = [
      { table: 'permissions', patterns: [/\bpermissions?\b/, /\bpermisos?\b/] },
      { table: 'roles', patterns: [/\broles?\b/] },
      { table: 'users', patterns: [/\busers?\b/, /\busuarios?\b/] },
      { table: 'tenants', patterns: [/\btenants?\b/, /\borganizaciones?\b/] },
      { table: 'menus', patterns: [/\bmenus?\b/, /\bmen[uú]s?\b/] },
      { table: 'records', patterns: [/\brecords?\b/, /\bregistros?\b/] },
      { table: 'dynamic_forms', patterns: [/\bdynamic_forms?\b/, /\bformularios?\b/] },
      { table: 'dynamic_services', patterns: [/\bdynamic_services?\b/, /\bservicios?\s+din[aá]micos?\b/] },
      { table: 'flows', patterns: [/\bflows?\b/, /\bflujos?\b/] },
      { table: 'confisys', patterns: [/\bconfisys\b/] }
    ];

    return candidates.find((candidate) => candidate.patterns.some((pattern) => pattern.test(normalizedPrompt)))?.table;
  }

  private detectField(normalizedPrompt: string) {
    const candidates = ['key', 'name', 'email', 'slug', 'id', 'category', 'status', 'description'];
    return candidates.find((field) => new RegExp(`\\b${field}\\b`).test(normalizedPrompt));
  }

  private labelForTable(table: string) {
    const labels: Record<string, string> = {
      permissions: 'permisos',
      roles: 'roles',
      users: 'usuarios',
      tenants: 'organizaciones',
      menus: 'menús',
      records: 'records',
      dynamic_forms: 'formularios dinámicos',
      dynamic_services: 'servicios dinámicos',
      flows: 'flows',
      confisys: 'confisys'
    };

    return labels[table] ?? table;
  }

  private looksLikeServiceAuthoring(prompt: string) {
    return /servicio|consult|listar|filtrar|buscar|tabla|table/i.test(prompt);
  }

  private providerFailureMessage(scope: AiAssistantScope) {
    const scopeHelp: Record<AiAssistantScope, string> = {
      general: 'Puedo seguir si divides la solicitud en una acción concreta.',
      services:
        'Para servicios, dime tabla, campo, resultado esperado y si quieres lista o un registro. Ejemplo: "servicio de la tabla users para listar por email".',
      flows:
        'Para flows, dime el disparador, los pasos en orden y qué debe responder al final. Ejemplo: "flow manual que ejecuta buscar_usuario y luego validar_permiso".',
      forms:
        'Para formularios, dime título, pasos, campos obligatorios y acción final. Ejemplo: "formulario de cliente con nombre, email y botón guardar".',
      database: 'Para base de datos, dime tabla, campo u operación concreta.',
      security: 'Para seguridad, dime si quieres usuario, rol, permiso o regla de acceso.',
      components: 'Para componentes, dime qué componente quieres documentar, crear o ajustar.'
    };

    return [
      'El modelo local tardó demasiado o no pudo responder esta vez.',
      'La pantalla sigue funcionando y no guardé nada.',
      scopeHelp[scope],
      'Si ya tienes un JSON, también puedes pegarlo en el editor y guardarlo desde la pantalla.'
    ].join('\n\n');
  }

  private hasAccess(auth: AuthContext, permission: string) {
    return (
      auth.user.systemRole === 'owner' ||
      auth.user.systemRole === 'admin' ||
      auth.roles.some((role) => role.key === 'owner' || role.key === 'admin') ||
      auth.permissions.includes(permission)
    );
  }

  private scopeFromRoute(route?: string): AiAssistantScope {
    if (!route) {
      return 'general';
    }

    if (route.startsWith('/services')) {
      return 'services';
    }

    if (route.startsWith('/flows')) {
      return 'flows';
    }

    if (route.startsWith('/forms')) {
      return 'forms';
    }

    if (route.startsWith('/database')) {
      return 'database';
    }

    if (route.startsWith('/security')) {
      return 'security';
    }

    if (route.startsWith('/components')) {
      return 'components';
    }

    return 'general';
  }

  private stringFromEnv(name: string, fallback: string) {
    return process.env[name]?.trim() || fallback;
  }

  private numberFromEnv(name: string, fallback: number) {
    const raw = process.env[name];
    if (!raw) {
      return fallback;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  private booleanFromEnv(name: string, fallback: boolean) {
    const raw = process.env[name]?.toLowerCase();
    if (raw === 'true') {
      return true;
    }

    if (raw === 'false') {
      return false;
    }

    return fallback;
  }
}
