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
  selected?: {
    key?: string;
    name?: string;
    active?: boolean;
    hasLatestVersion?: boolean;
    hasPublishedVersion?: boolean;
  } | null;
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

    const lifecycle = this.serviceLifecycleResponse(scope, request);
    if (lifecycle) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message: lifecycle,
        suggestions: this.serviceSuggestions(lifecycle)
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

    const firstCompositeAction = this.advancedCompositeServiceAction(scope, request);
    if (firstCompositeAction) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message: [
          'Preparé un servicio avanzado con join como draft visual.',
          'Este servicio resuelve la consulta compuesta dentro de Services usando queryMode=multi_table. No necesita Flow para esta lectura.',
          'No guardé ni publiqué nada automáticamente.'
        ].join('\n\n'),
        actions: [firstCompositeAction]
      };
    }

    if (scope === 'services' && this.looksLikeCompositeService(this.servicePromptContext(request))) {
      const serviceReasoning = await this.reasonAboutServiceAuthoring(auth, request, config);
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message: serviceReasoning,
        suggestions: this.serviceSuggestions(serviceReasoning)
      };
    }

    if (scope === 'services' && this.looksLikeServiceAuthoring(this.servicePromptContext(request)) && !this.shouldApplyServiceDraft(request)) {
      const preflight = this.serviceAuthoringPreflight(request);
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message: preflight,
        suggestions: this.serviceSuggestions(preflight)
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
      const serviceReasoning = await this.reasonAboutServiceAuthoring(auth, request, config);
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message: serviceReasoning,
        suggestions: this.serviceSuggestions(serviceReasoning)
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
        conversation: this.compactConversation(request),
        screenState: request.screenState ?? null
      },
      null,
      2
    );
  }

  private async reasonAboutServiceAuthoring(
    auth: AuthContext,
    request: AiAssistantRequest,
    config: AiAssistantConfig
  ) {
    const compositePlan = this.compositeServicePlan(request);
    if (compositePlan) {
      return compositePlan;
    }

    const clarification = this.serviceAuthoringClarification(request);
    if (clarification) {
      return clarification;
    }

    const state = this.serviceScreenState(request.screenState);
    const system = [
      'Eres Chicle AI, asistente experto en Dynamic Services de Chicle Engine.',
      'Responde en español, breve y operativo.',
      'Tu meta es ayudar a crear un servicio declarativo seguro.',
      'No inventes tablas, campos, secretos, SQL libre ni JavaScript.',
      'Si falta un dato crítico, haz preguntas concretas en vez de generar JSON dudoso.',
      'Para servicios compuestos, explica entrada, consultas, relación entre resultados, respuesta final y riesgos.',
      'No digas que guardaste o publicaste. El usuario aprueba en la pantalla.'
    ].join('\n');
    const user = JSON.stringify(
      {
        prompt: request.prompt,
        tenant: auth.tenant.slug,
        route: request.route,
        currentDraft: state
          ? {
              draft: state.draft ?? null,
              guide: state.guide ?? null,
              definition: state.definition ?? null,
              lastRun: state.lastRun ?? null,
              availableTables: this.compactTables(state.availableTables)
            }
          : null,
        expectedAnswer:
          'Devuelve una respuesta conversacional. Si hay suficiente información, describe el plan del servicio y el siguiente paso en el diseñador. Si falta información, pregunta máximo 4 datos.'
      },
      null,
      2
    );

    const response = await this.ollama
      .chat(
        config,
        [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        {
          temperature: 0.1,
          maxTokens: 700,
          timeoutMs: Math.min(config.timeoutMs, 90000)
        }
      )
      .catch(() => null);

    return response?.message ?? this.serviceReasoningFallback(request);
  }

  private compositeServicePlan(request: AiAssistantRequest) {
    const normalized = this.servicePromptContext(request).toLowerCase();
    if (!this.looksLikeCompositeService(normalized)) {
      return null;
    }

    const clarification = this.serviceAuthoringClarification(request);
    if (clarification) {
      return clarification;
    }

    const tables = this.detectTables(normalized);
    const fields = this.detectFields(normalized);
    const firstTable = tables[0] ?? 'primera tabla o servicio';
    const secondTable = tables[1] ?? 'segunda tabla o servicio';
    const inputField =
      fields.find((field) => field !== 'id' && !field.toLowerCase().endsWith('id')) ??
      this.inferInputField(normalized) ??
      'campo de búsqueda del usuario';
    const explicitRelationField = fields.find((field) => field.toLowerCase().endsWith('id'));
    const relationField = explicitRelationField ?? this.inferRelationField(normalized) ?? 'id del resultado anterior';
    const closing = explicitRelationField || this.inferRelationField(normalized)
      ? 'Con esos datos ya puedo preparar un servicio avanzado con join declarativo.'
      : 'Para avanzar sin ambigüedad necesito que confirmes el campo exacto que conecta las tablas, por ejemplo userId, roleId o tenantId.';

    return this.serviceWorkResponse({
      interpretation: 'Quieres una consulta avanzada con más de una tabla.',
      route:
        'La resolveré como un Dynamic Service avanzado con queryMode=multi_table, joins declarativos y filtros parametrizados.',
      investigation:
        'Services ya puede ejecutar joins seguros desde JSON: tablas visibles, aliases, columnas reales, filtros con parámetros y sin SQL libre.',
      proposal: [
        `Tabla base: ${firstTable}, filtrada por ${inputField}.`,
        `Join: ${secondTable} usando ${relationField}.`,
        'Respuesta: filas combinadas para que el front reciba el usuario con la información relacionada.'
      ],
      nextStep: `Puedo crear el JSON avanzado en esta pantalla. ${closing}`
    });
  }

  private serviceAuthoringClarification(request: AiAssistantRequest) {
    const normalized = this.servicePromptContext(request).toLowerCase();
    if (!this.looksLikeCompositeService(normalized)) {
      const table = this.detectTable(normalized);
      const field = this.detectField(normalized);
      const missing = !table
        ? 'la tabla principal'
        : !field
          ? 'el campo de búsqueda'
          : 'si esperas lista, un registro o sí/no';

      return this.serviceWorkResponse({
        interpretation: 'Quieres crear o ajustar un servicio, pero la solicitud todavía no tiene suficiente estructura.',
        route: 'Necesito tomar una decisión a la vez para generar un draft seguro.',
        investigation:
          'No debo inventar tablas custom ni campos. El diseñador puede consultar tablas reales visibles desde el catálogo.',
        proposal: [`Necesito saber ${missing}.`],
        nextStep: this.nextStepForMissingServiceDecision(missing)
      });
    }

    const tables = this.detectTables(normalized);
    const fields = this.detectFields(normalized);
    const mentionsRelation = /relaci[oó]n|join|unir|cruzar|conectar|asignad|pertenece|por .*id|tenantid|userid|roleid|id/.test(
      normalized
    );
    const mentionsResponse = /responder|respuesta|devuelve|devuelva|retorna|retorne|mostrar|front/.test(normalized);

    const missing: string[] = [];
    if (tables.length < 2 && !/servicios?\s+publicados?|servicio\s+\w+/.test(normalized)) {
      missing.push('cuáles son las dos tablas o servicios que quieres consultar');
    }
    if (!fields.length) {
      missing.push('qué campos llegan como entrada desde el front');
    }
    if (!mentionsRelation && !this.inferRelationField(normalized)) {
      missing.push('cómo se relaciona la primera consulta con la segunda');
    }
    if (!mentionsResponse) {
      missing.push('qué debe devolver exactamente al front');
    }

    if (!missing.length) {
      return null;
    }

    const currentMissing = missing[0];
    return this.serviceWorkResponse({
      interpretation: 'Quieres un servicio compuesto con más de una consulta.',
      route: 'Antes de generar configuración necesito cerrar los datos mínimos para no inventar un JSON que falle.',
      investigation: 'No tengo completa la entrada, relación o salida final del proceso.',
      proposal: [`Necesito saber ${currentMissing}.`],
      nextStep: this.nextStepForMissingServiceDecision(currentMissing)
    });
  }

  private serviceReasoningFallback(request: AiAssistantRequest) {
    if (this.looksLikeCompositeService(this.servicePromptContext(request))) {
      return this.serviceWorkResponse({
        interpretation: 'Quieres una operación compuesta.',
        route: 'No voy a bloquear la pantalla esperando al modelo local.',
        investigation: 'Ollama no respondió a tiempo en este equipo, así que continúo con el flujo guiado.',
        proposal: [
          'Definir primera consulta: tabla/servicio, campo de entrada y resultado esperado.',
          'Definir segunda consulta: tabla/servicio y cómo usa el resultado de la primera.',
          'Definir respuesta final: qué objeto vuelve al front.'
        ],
        nextStep: 'Con esos datos preparo el draft o corrijo el servicio abierto.'
      });
    }

    return this.providerFailureMessage('services');
  }

  private servicePromptContext(request: AiAssistantRequest) {
    const userConversation = (request.conversation ?? [])
      .filter((message) => message.role === 'user')
      .map((message) => message.text.trim())
      .filter(Boolean)
      .slice(-4);
    const prompt = request.prompt.trim();
    if (userConversation.at(-1) === prompt) {
      return userConversation.join('\n');
    }

    return [...userConversation, prompt].filter(Boolean).join('\n');
  }

  private compactConversation(request: AiAssistantRequest) {
    return (request.conversation ?? [])
      .map((message) => ({
        role: message.role,
        text: message.text.trim().slice(0, 900)
      }))
      .filter((message) => message.text)
      .slice(-8);
  }

  private serviceLifecycleResponse(scope: AiAssistantScope, request: AiAssistantRequest) {
    if (scope !== 'services') {
      return null;
    }

    const normalized = request.prompt.toLowerCase();
    const state = this.serviceScreenState(request.screenState);
    const selectedKey = state?.selected?.key || state?.draft?.key || this.serviceKeyFromPrompt(request.prompt);

    if (/restaur|recuper/.test(normalized)) {
      return this.serviceWorkResponse({
        interpretation: selectedKey
          ? `Quieres restaurar el servicio ${selectedKey}.`
          : 'Quieres restaurar un servicio desde papelera.',
        route: 'La restauración debe confirmarse desde la pantalla para evitar cambios accidentales.',
        investigation: 'Los servicios en papelera conservan versiones e historial.',
        proposal: ['Abre Papelera.', selectedKey ? `Selecciona ${selectedKey}.` : 'Selecciona el servicio exacto.', 'Usa Restaurar.'],
        nextStep: 'Después de restaurarlo puedo ayudarte a revisar o publicar una nueva versión.'
      });
    }

    if (/elimin|borrar|desactivar|archivar|enviar\s+a\s+papelera/.test(normalized)) {
      return this.serviceWorkResponse({
        interpretation: selectedKey
          ? `Quieres retirar el servicio ${selectedKey}.`
          : 'Quieres retirar un servicio.',
        route: 'Por seguridad Chicle AI no elimina ni envía a papelera automáticamente.',
        investigation:
          'El módulo usa papelera, no borrado físico. Las versiones e historial quedan recuperables si el usuario confirma.',
        proposal: [
          selectedKey
            ? `Selecciona ${selectedKey} en el catálogo de Servicios.`
            : 'Selecciona el servicio exacto en el catálogo o dime su key.',
          'Usa Enviar a papelera para retirarlo.',
          'Si fue un error, entra a Papelera y usa Restaurar.'
        ],
        nextStep: selectedKey
          ? 'Cuando lo tengas seleccionado puedo revisar el estado antes de enviarlo a papelera.'
          : 'Dime la key del servicio o selecciónalo para revisarlo.'
      });
    }

    return null;
  }

  private serviceAuthoringPreflight(request: AiAssistantRequest) {
    const context = this.servicePromptContext(request);
    const proposal = this.serviceDraftFromPrompt(context);
    if (!proposal) {
      return (
        this.serviceAuthoringClarification(request) ??
        this.serviceWorkResponse({
          interpretation: 'Quieres crear o ajustar un servicio.',
          route: 'Necesito más datos antes de generar un draft seguro.',
          investigation: 'No logré identificar una tabla y filtro ejecutables.',
          proposal: ['Dime tabla principal.', 'Dime campo de búsqueda.', 'Dime si esperas lista, un registro o sí/no.'],
          nextStep: 'Ejemplo: "servicio de la tabla users para listar por email".'
        })
      );
    }

    const dataTarget = proposal.document.dataTarget ?? {};
    const filters = Array.isArray(dataTarget['filters'])
      ? (dataTarget['filters'] as Array<Record<string, unknown>>)
      : [];
    const filterText = filters.length
      ? filters.map((filter) => `${filter['field']} ${filter['operator']} input.${filter['inputKey']}`).join(', ')
      : 'sin filtros detectados';

    return this.serviceWorkResponse({
      interpretation: `Quieres crear un servicio llamado ${proposal.name}.`,
      route:
        'Primero estructuro la intención y valido si es un servicio simple, compuesto o si debe convertirse en flow.',
      investigation:
        'La solicitud sí parece ejecutable como Dynamic Service simple porque apunta a una sola tabla interna con filtros seguros.',
      proposal: [
        `Tabla principal: ${dataTarget['primaryTable'] ?? 'pendiente'}.`,
        `Resultado esperado: ${proposal.document.resultKind ?? 'list'}.`,
        `Filtros: ${filterText}.`,
        'El JSON se aplicará como borrador visual, no se guardará ni publicará automáticamente.'
      ],
      nextStep:
        'Si esta interpretación es correcta, responde "continúa" o "genera el draft". Si no, corrige tabla, campo o resultado esperado.'
    });
  }

  private shouldApplyServiceDraft(request: AiAssistantRequest) {
    const prompt = request.prompt.toLowerCase().trim();
    const confirms = /^(si|sí|ok|listo|dale|contin[uú]a|hazlo|g[eé]neralo|gener[aá]|aplica|crea el draft|genera el draft)(\b|[.!\s])/.test(
      prompt
    );
    if (!confirms) {
      return false;
    }

    return (request.conversation ?? []).some(
      (message) =>
        message.role === 'assistant' &&
        /Interpretación:|Hoja de ruta:|Si esta interpretación es correcta|genera el draft/i.test(message.text)
    );
  }

  private buildActions(scope: AiAssistantScope, request: AiAssistantRequest): AiAssistantUiAction[] {
    if (scope !== 'services') {
      return [];
    }

    const service = this.serviceDraftFromPrompt(this.servicePromptContext(request));
    return service ? [service] : [];
  }

  private looksLikeReview(prompt: string) {
    return /revis|corrig|arregl|fall[oó]|falla|error|no funciona|ajusta|mejora|retoma|edit|modific|actualiz|cambia/i.test(prompt);
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
    const filters = fieldFromPrompt
      ? [
          {
            field,
            operator,
            valueSource: 'input',
            inputKey: field,
            required: true
          }
        ]
      : currentFilters.length
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

  private serviceWorkResponse(parts: {
    interpretation: string;
    route: string;
    investigation: string;
    proposal: string[];
    nextStep: string;
  }) {
    return [
      `Interpretación: ${parts.interpretation}`,
      `Hoja de ruta: ${parts.route}`,
      `Revisión: ${parts.investigation}`,
      'Propuesta:',
      ...parts.proposal.map((item, index) => `${index + 1}. ${item}`),
      `Siguiente paso: ${parts.nextStep}`
    ].join('\n');
  }

  private nextStepForMissingServiceDecision(missing: string) {
    if (/campos llegan como entrada|campo/.test(missing)) {
      return 'Elige el campo de entrada principal para continuar. Después te preguntaré la siguiente decisión si hace falta.';
    }

    if (/dos tablas|servicios/.test(missing)) {
      return 'Elige o escribe las tablas/servicios que participan. Después definimos cómo se conectan.';
    }

    if (/relaciona|relaci/.test(missing)) {
      return 'Elige cómo se conecta la primera consulta con la segunda.';
    }

    if (/devolver/.test(missing)) {
      return 'Elige qué debe recibir el front al final del proceso.';
    }

    return 'Elige una opción o escribe la respuesta exacta para continuar.';
  }

  private serviceSuggestions(message: string) {
    if (/campo de entrada|campos llegan como entrada|campo de b[uú]squeda/i.test(message)) {
      return ['por email', 'por nombre', 'por id'];
    }

    if (/dos tablas|tablas o servicios|tabla principal/i.test(message)) {
      return ['users y user_roles', 'users y roles', 'dynamic_services'];
    }

    if (/c[oó]mo se conecta|c[oó]mo se relaciona|relaciona la primera consulta/i.test(message)) {
      return ['user.id -> user_roles.userId', 'user.roleId -> roles.id', 'tenantId'];
    }

    if (/qu[eé] debe recibir el front|qu[eé] debe devolver|devolver exactamente/i.test(message)) {
      return ['usuario + roles', 'solo roles', 'sí/no'];
    }

    if (/lista, un registro o s[ií]\/no|resultado esperado/i.test(message)) {
      return ['lista', 'un registro', 'sí/no'];
    }

    if (/Si esta interpretaci[oó]n es correcta|genera el draft|aplicar[aá] como borrador/i.test(message)) {
      return ['continúa', 'cambiar tabla', 'cambiar campo'];
    }

    if (/papelera|restaurar/i.test(message)) {
      return ['abrir Papelera', 'seleccionar servicio', 'cancelar'];
    }

    if (/queryMode=multi_table|servicio avanzado|Join:/i.test(message)) {
      return ['crear servicio avanzado', 'ajustar entrada', 'explicar join'];
    }

    return [];
  }

  private advancedCompositeServiceAction(scope: AiAssistantScope, request: AiAssistantRequest) {
    if (scope !== 'services' || !/crear servicio avanzado|consulta avanzada|servicio con join|crear join/i.test(request.prompt)) {
      return null;
    }

    const context = this.servicePromptContext(request).toLowerCase();
    if (!this.looksLikeCompositeService(context)) {
      return null;
    }

    const userRoleDraft = this.userRoleJoinServiceDraft(context);
    if (userRoleDraft) {
      return userRoleDraft;
    }

    return null;
  }

  private userRoleJoinServiceDraft(context: string): AiAssistantUiAction | null {
    const tables = this.detectTables(context);
    if (!tables.includes('users') || !tables.includes('roles')) {
      return null;
    }

    const fields = this.detectFields(context);
    const field =
      fields.find((item) => !item.toLowerCase().endsWith('id') || item === 'id') ||
      this.inferInputField(context).split(' ')[0] ||
      'name';
    const operator = ['email', 'id', 'key'].includes(field) ? 'equals' : 'contains';
    const key = `consultar_usuario_roles_por_${field}`;

    return {
      type: 'apply_dynamic_service_json',
      label: 'Aplicar servicio avanzado con join',
      key,
      name: `Consultar usuario y roles por ${field}`,
      description: `Consulta usuarios y sus roles relacionados filtrando por ${field}.`,
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
          queryMode: 'multi_table',
          primaryTable: 'users',
          primaryAlias: 'u',
          involvedTables: ['user_roles', 'roles'],
          joins: [
            {
              type: 'left',
              table: 'user_roles',
              alias: 'ur',
              on: [{ left: 'u.id', operator: 'equals', right: 'ur.userId' }]
            },
            {
              type: 'left',
              table: 'roles',
              alias: 'r',
              on: [{ left: 'ur.roleId', operator: 'equals', right: 'r.id' }]
            }
          ],
          select: [
            { field: 'u.id', alias: 'userId' },
            { field: 'u.email', alias: 'userEmail' },
            { field: 'u.name', alias: 'userName' },
            { field: 'r.id', alias: 'roleId' },
            { field: 'r.key', alias: 'roleKey' },
            { field: 'r.name', alias: 'roleName' }
          ],
          relationNotes: 'users.id -> user_roles.userId -> roles.id',
          filterNotes: `u.${field} ${operator} input.${field}`,
          matchMode: 'all',
          filters: [
            {
              field: `u.${field}`,
              operator,
              valueSource: 'input',
              inputKey: field,
              required: true
            }
          ],
          limit: 100
        },
        method: 'GET',
        url: 'internal://query/users_roles',
        headers: {},
        query: {
          [field]: `{{input.${field}}}`
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

  private serviceKeyFromPrompt(prompt: string) {
    const quoted = prompt.match(/["'`]([a-zA-Z0-9_-]{3,120})["'`]/)?.[1];
    if (quoted) {
      return quoted;
    }

    return prompt.match(/\b([a-z][a-z0-9_]{2,119})\b/i)?.[1] ?? '';
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
    return this.tableCandidates().find((candidate) =>
      candidate.patterns.some((pattern) => pattern.test(normalizedPrompt))
    )?.table;
  }

  private detectTables(normalizedPrompt: string) {
    return this.tableCandidates()
      .map((candidate) => ({
        table: candidate.table,
        index: this.firstPatternIndex(normalizedPrompt, candidate.patterns)
      }))
      .filter((candidate) => candidate.index >= 0)
      .sort((left, right) => left.index - right.index)
      .map((candidate) => candidate.table);
  }

  private tableCandidates(): Array<{ table: string; patterns: RegExp[] }> {
    return [
      { table: 'permissions', patterns: [/\bpermissions?\b/, /\bpermisos?\b/] },
      { table: 'user_roles', patterns: [/\buser_roles?\b/, /\broles?\s+de\s+usuario\b/, /\broles?\s+por\s+userid\b/] },
      { table: 'roles', patterns: [/\broles?\b/, /\btabla\s+role\b/, /\btabla\s+roles\b/] },
      { table: 'users', patterns: [/\busers?\b/, /\busuarios?\b/, /\busuario\b/] },
      { table: 'tenants', patterns: [/\btenants?\b/, /\borganizaciones?\b/] },
      { table: 'menus', patterns: [/\bmenus?\b/, /\bmen[uú]s?\b/] },
      { table: 'records', patterns: [/\brecords?\b/, /\bregistros?\b/] },
      { table: 'dynamic_forms', patterns: [/\bdynamic_forms?\b/, /\bformularios?\b/] },
      { table: 'dynamic_services', patterns: [/\bdynamic_services?\b/, /\bservicios?\s+din[aá]micos?\b/] },
      { table: 'flows', patterns: [/\bflows?\b/, /\bflujos?\b/] },
      { table: 'confisys', patterns: [/\bconfisys\b/] }
    ];
  }

  private firstPatternIndex(value: string, patterns: RegExp[]) {
    const indexes = patterns
      .map((pattern) => {
        pattern.lastIndex = 0;
        const match = pattern.exec(value);
        return match?.index ?? -1;
      })
      .filter((index) => index >= 0);

    return indexes.length ? Math.min(...indexes) : -1;
  }

  private detectField(normalizedPrompt: string) {
    return this.detectFields(normalizedPrompt)[0];
  }

  private detectFields(normalizedPrompt: string) {
    const candidates: Array<{ field: string; patterns: RegExp[] }> = [
      { field: 'key', patterns: [/\bkey\b/, /\bclave\b/] },
      { field: 'name', patterns: [/\bname\b/, /\bnombre\b/] },
      { field: 'email', patterns: [/\bemail\b/, /\bmail\b/, /\bcorreo\b/] },
      { field: 'slug', patterns: [/\bslug\b/] },
      { field: 'id', patterns: [/\bid\b/, /\bidentificador\b/] },
      { field: 'tenantId', patterns: [/\btenantid\b/, /\btenant_id\b/] },
      { field: 'userId', patterns: [/\buserid\b/, /\buser_id\b/, /\bid\s+del\s+usuario\b/] },
      { field: 'roleId', patterns: [/\broleid\b/, /\brole_id\b/, /\bid\s+del\s+rol\b/] },
      { field: 'category', patterns: [/\bcategory\b/, /\bcategor[ií]a\b/] },
      { field: 'status', patterns: [/\bstatus\b/, /\bestado\b/] },
      { field: 'description', patterns: [/\bdescription\b/, /\bdescripci[oó]n\b/] }
    ];
    const normalizedCandidates = candidates
      .filter((candidate) => candidate.patterns.some((pattern) => pattern.test(normalizedPrompt)))
      .map((candidate) => candidate.field);

    return [...new Set(normalizedCandidates)];
  }

  private looksLikeCompositeService(prompt: string) {
    const normalized = prompt.toLowerCase();
    const tables = this.detectTables(normalized);
    return (
      tables.length > 1 ||
      /dos|varias|m[uú]ltiples|compuest|encaden|primero|luego|despu[eé]s|join|unir|cruzar|relacion|si\s+existe|si\s+encuentra|vaya\s+a|ir\s+a\s+la\s+tabla|tabla\s+\w+\s+y\s+devuelva|asignad/.test(
        normalized
      )
    );
  }

  private hasConditionalPhrase(prompt: string) {
    return /si\s+existe|si\s+encuentra|si\s+hay|cuando\s+exista/.test(prompt);
  }

  private inferInputField(prompt: string) {
    if (/correo|email|mail/.test(prompt)) {
      return 'email';
    }
    if (/nombre|name/.test(prompt)) {
      return 'name';
    }
    if (/usuario/.test(prompt)) {
      return 'name o email';
    }
    return '';
  }

  private inferRelationField(prompt: string) {
    if (/role|rol|asignad/.test(prompt)) {
      return 'userId / roleId según la tabla puente user_roles';
    }
    if (/tenant|organizaci[oó]n/.test(prompt)) {
      return 'tenantId';
    }
    return '';
  }

  private compactTables(tables?: Array<{ name?: string; columns?: string[] }>) {
    return (tables ?? []).slice(0, 20).map((table) => ({
      name: table.name,
      columns: (table.columns ?? []).slice(0, 18)
    }));
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
