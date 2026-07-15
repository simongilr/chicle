import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AuthContext } from '../auth/auth.types';
import { ConfisysService } from '../confisys/confisys.service';
import {
  AiAssistantConfig,
  AiAssistantRequest,
  AiAssistantResponse,
  AiAssistantScope,
  AiAssistantUiAction,
  ApplySchemaChangeAction,
  ApplyDynamicFormJsonAction,
  ApplyDynamicServiceJsonAction,
  ApplyFlowJsonAction
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

interface AssistantFlowScreenState {
  selected?: {
    key?: string;
    name?: string;
    hasPublishedVersion?: boolean;
  } | null;
  draft?: {
    key?: string;
    name?: string;
    description?: string;
    category?: string;
  };
  entry?: {
    mode?: string;
    key?: string;
  };
  inputFields?: Array<{
    key?: string;
    label?: string;
    type?: string;
    required?: boolean;
    example?: string;
  }>;
  currentDocument?: Record<string, unknown>;
  availableServices?: Array<{
    key?: string;
    name?: string;
    hasPublishedVersion?: boolean;
  }>;
  availableFlows?: Array<{
    key?: string;
    name?: string;
    hasPublishedVersion?: boolean;
  }>;
}

interface AssistantFormScreenState {
  selected?: {
    key?: string;
    title?: string;
    published?: boolean;
  } | null;
  draft?: {
    key?: string;
    title?: string;
    description?: string;
    category?: string;
  };
  schema?: Record<string, unknown>;
  availableServices?: Array<{
    key?: string;
    name?: string;
    hasPublishedVersion?: boolean;
  }>;
  availableFlows?: Array<{
    key?: string;
    name?: string;
    hasPublishedVersion?: boolean;
  }>;
  tables?: Array<{
    name?: string;
    scope?: string;
    columns?: Array<{
      name?: string;
      type?: string;
      nullable?: boolean;
      primary?: boolean;
    }>;
  }>;
}

type DynamicFormIntentKind =
  | 'auth_login'
  | 'client_onboarding'
  | 'inspection_mobile'
  | 'approval'
  | 'lookup'
  | 'event_registration'
  | 'ticket_purchase'
  | 'real_estate_lead'
  | 'service_request'
  | 'profile_update'
  | 'custom_capture';

interface DynamicFormIntent {
  kind: DynamicFormIntentKind;
  key: string;
  title: string;
  description: string;
  category: string;
  submitLabel: string;
  persistenceMode: 'none' | 'record' | 'service' | 'flow' | 'hybrid' | 'auth';
  confidence: number;
  notes: string[];
  wantsService: boolean;
  wantsFlow: boolean;
  wantsHybrid: boolean;
  offline: boolean;
  forceMobile: boolean;
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
      timeoutMs: this.numberFromEnv('AI_TIMEOUT_MS', this.confisys.get<number>('ai.timeoutMs', 180000)),
      fastTimeoutMs: this.numberFromEnv('AI_FAST_TIMEOUT_MS', this.confisys.get<number>('ai.fastTimeoutMs', 18000)),
      reasoningTimeoutMs: this.numberFromEnv(
        'AI_REASONING_TIMEOUT_MS',
        this.confisys.get<number>('ai.reasoningTimeoutMs', 45000)
      ),
      maxTokens: this.numberFromEnv('AI_MAX_TOKENS', this.confisys.get<number>('ai.maxTokens', 420)),
      fastMaxTokens: this.numberFromEnv('AI_FAST_MAX_TOKENS', this.confisys.get<number>('ai.fastMaxTokens', 140)),
      contextWindow: this.numberFromEnv('AI_CONTEXT_WINDOW', this.confisys.get<number>('ai.contextWindow', 4096)),
      keepAlive: this.stringFromEnv('AI_KEEP_ALIVE', this.confisys.get<string>('ai.keepAlive', '10m')),
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
      timeouts: {
        fastTimeoutMs: config.fastTimeoutMs,
        reasoningTimeoutMs: config.reasoningTimeoutMs,
        maxTimeoutMs: config.timeoutMs
      },
      generation: {
        maxTokens: config.maxTokens,
        fastMaxTokens: config.fastMaxTokens,
        contextWindow: config.contextWindow,
        keepAlive: config.keepAlive
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

    if (scope === 'flows' && !this.hasAccess(auth, 'flows.read')) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message:
          'Estás en Flows, pero tu sesión actual no tiene flows.read. Entra de nuevo o sincroniza seguridad antes de que pueda ayudarte en esta pantalla.'
      };
    }

    if (scope === 'flows' && !this.hasAccess(auth, 'flows.update') && !this.hasAccess(auth, 'flows.create')) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message:
          'Puedo explicarte cómo sería el flow, pero no puedo aplicar drafts en esta pantalla porque falta flows.create o flows.update.'
      };
    }

    const flowAuthoring = this.flowAuthoringResponse(scope, request);
    if (flowAuthoring) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        ...flowAuthoring
      };
    }

    const databaseAuthoring = this.databaseAuthoringResponse(scope, request, auth);
    if (databaseAuthoring) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        ...databaseAuthoring
      };
    }

    if (scope === 'forms' && !this.hasAccess(auth, 'forms.read')) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message:
          'Estás en Formularios, pero tu sesión actual no tiene forms.read. Entra de nuevo o sincroniza seguridad antes de que pueda ayudarte en esta pantalla.'
      };
    }

    if (scope === 'forms' && !this.hasAccess(auth, 'forms.manage')) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message:
          'Puedo explicarte cómo sería el formulario, pero no puedo aplicar drafts porque falta forms.manage.'
      };
    }

    const designerSaveInstruction = this.designerSaveInstructionResponse(scope, request);
    if (designerSaveInstruction) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message: designerSaveInstruction.message,
        suggestions: designerSaveInstruction.suggestions
      };
    }

    const formLifecycle = this.formLifecycleResponse(scope, request);
    if (formLifecycle) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message: formLifecycle
      };
    }

    const formAuthoring = await this.formAuthoringResponse(scope, request, config);
    if (formAuthoring) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        ...formAuthoring
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

    const roleMembershipGuide = this.userRoleMembershipGuideResponse(scope, request);
    if (roleMembershipGuide) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        ...roleMembershipGuide
      };
    }

    const progressiveService = this.shouldApplyServiceDraft(request)
      ? null
      : this.progressiveServiceAuthoringResponse(scope, request);
    if (progressiveService) {
      return {
        ok: true,
        provider: config.provider,
        model: config.chatModel,
        scope,
        message: progressiveService,
        suggestions: this.serviceSuggestions(progressiveService)
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
      const preflight = await this.reasonAboutServiceAuthoring(auth, request, config);
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
    const response = await this.safeOllamaChat(
      config,
      [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      {
        temperature: 0.2,
        maxTokens: config.maxTokens,
        timeoutMs: config.reasoningTimeoutMs
      }
    );

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

  private async safeOllamaChat(
    config: AiAssistantConfig,
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    options: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {}
  ) {
    try {
      return await Promise.resolve(this.ollama.chat(config, messages, options));
    } catch {
      return null;
    }
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
    const state = this.serviceScreenState(request.screenState);
    const system = [
      'Eres Chicle AI, asistente experto en Dynamic Services de Chicle Engine.',
      'Responde en español, breve y operativo.',
      'Tu meta es analizar cada solicitud antes de proponer cambios.',
      'No uses respuestas plantilla ni frases genéricas si puedes inferir algo concreto.',
      'No inventes tablas, campos, secretos, SQL libre ni JavaScript.',
      'Usa solo tablas y columnas disponibles en currentDraft.availableTables cuando existan.',
      'Si falta un dato crítico, pregunta una sola decisión concreta y explica por qué falta.',
      'Si el usuario responde corto, interpreta esa respuesta dentro de la conversación previa.',
      'No repitas la misma pregunta si la última respuesta ya la contestó.',
      'Para servicios compuestos, explica entrada, consultas, relación entre resultados, respuesta final y riesgos.',
      'Para lecturas con varias tablas, prefiere un Dynamic Service avanzado con queryMode=multi_table si no hay efectos secundarios.',
      'Usa Flow solo si hay pasos con decisiones, side effects, reintentos de negocio, async o varias acciones encadenadas.',
      'No digas que guardaste o publicaste. El usuario aprueba en la pantalla.'
    ].join('\n');
    const user = JSON.stringify(
      {
        prompt: request.prompt,
        conversation: this.compactConversation(request),
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
          'Devuelve máximo 110 palabras. Usa esta forma: Interpretación, Datos detectados, Decisión pendiente o Propuesta, Siguiente paso. No generes JSON todavía salvo que el usuario pida crear/aplicar draft.'
      },
      null,
      2
    );

    const response = await this.safeOllamaChat(
      config,
      [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      {
        temperature: 0.2,
        maxTokens: config.fastMaxTokens,
        timeoutMs: config.fastTimeoutMs
      }
    );

    if (response?.message) {
      return response.message;
    }

    const compositePlan = this.compositeServicePlan(request);
    if (compositePlan) {
      return this.fallbackReasoningNotice(compositePlan);
    }

    const clarification = this.serviceAuthoringClarification(request);
    if (clarification) {
      return this.fallbackReasoningNotice(clarification);
    }

    return this.fallbackReasoningNotice(this.serviceReasoningFallback(request));
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
    const responseShape = this.inferResponseShape(normalized);
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
        `Respuesta: ${responseShape}.`
      ],
      nextStep: `Puedo crear el JSON avanzado en esta pantalla. ${closing}`
    });
  }

  private serviceAuthoringClarification(request: AiAssistantRequest): string | null {
    const normalized = this.servicePromptContext(request).toLowerCase();
    if (!this.looksLikeCompositeService(normalized)) {
      const table = this.detectTable(normalized);
      const field = this.detectField(normalized);
      const resultKind = this.detectResultKind(normalized);
      const missing = !table
        ? 'la tabla principal'
        : !field
          ? 'el campo de búsqueda'
          : !resultKind
            ? 'si esperas lista, un registro o sí/no'
            : '';

      if (!missing) {
        return this.serviceAuthoringPreflight(request);
      }

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
    const mentionsResponse =
      /responder|respuesta|devuelve|devuelva|retorna|retorne|mostrar|front/.test(normalized) ||
      this.hasResponseShape(normalized);

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

    const currentMissing = this.nextMissingDecision(request, missing);
    if (!currentMissing) {
      return null;
    }

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
    const prompt = request.prompt.trim();
    if (this.shouldStartFreshServiceContext(prompt)) {
      return prompt;
    }

    const scopedConversation = this.scopedServiceConversation(request);
    const userConversation = scopedConversation
      .filter((message) => message.role === 'user')
      .map((message) => message.text.trim())
      .filter(Boolean)
      .slice(-4);
    if (userConversation.at(-1) === prompt) {
      return userConversation.join('\n');
    }

    return [...userConversation, prompt].filter(Boolean).join('\n');
  }

  private serviceConversationContext(request: AiAssistantRequest) {
    const prompt = request.prompt.trim();
    if (this.shouldStartFreshServiceContext(prompt)) {
      return prompt;
    }

    const conversation = this.scopedServiceConversation(request)
      .map((message) => message.text.trim())
      .filter(Boolean)
      .slice(-10);
    return [...conversation, prompt].filter(Boolean).join('\n');
  }

  private lastAssistantText(request: AiAssistantRequest) {
    if (this.shouldStartFreshServiceContext(request.prompt)) {
      return undefined;
    }

    return [...this.scopedServiceConversation(request)]
      .reverse()
      .find((message) => message.role === 'assistant')
      ?.text.toLowerCase();
  }

  private scopedServiceConversation(request: AiAssistantRequest) {
    const conversation = request.conversation ?? [];
    const latestFreshIndex = conversation.reduce((latest, message, index) => {
      return message.role === 'user' && this.shouldStartFreshServiceContext(message.text) ? index : latest;
    }, -1);

    return latestFreshIndex >= 0 ? conversation.slice(latestFreshIndex) : conversation;
  }

  private shouldStartFreshServiceContext(prompt: string) {
    const normalized = prompt.toLowerCase().trim();
    if (!normalized || this.isServiceContinuationPrompt(normalized) || !this.looksLikeServiceAuthoring(normalized)) {
      return false;
    }

    const hasExplicitIntent =
      /\b(necesito|quiero|crear|crea|hacer|haz|genera|generar|servicio|listar|lista|consultar|consulta|validar|buscar|filtrar)\b/.test(
        normalized
      );
    const hasConcreteTarget =
      Boolean(this.detectTable(normalized) || this.detectField(normalized)) ||
      /\b(confisys|menus?|men[uú]s?|records?|formularios?|flows?|tenants?|organizaciones?|permissions?|permisos?|roles?|usuarios?)\b/.test(
        normalized
      );

    return hasExplicitIntent && hasConcreteTarget;
  }

  private isServiceContinuationPrompt(normalizedPrompt: string) {
    return /^(correcto|correcta|si|sí|ok|listo|dale|contin[uú]a|tablas correctas|cambiar tablas|ajustar intenci[oó]n|ajustar campo|ajustar propuesta|cancelar|crear draft|crear el draft|genera draft|genera el draft|aplicar|aplica|hazlo|lista|listado|list|un registro|detalle|single|s[ií]\/no|boolean|por email|por nombre|por id|roles\\.(key|id|name))$/.test(
      normalizedPrompt
    );
  }

  private userMessageTexts(request?: AiAssistantRequest) {
    return [
      ...((request?.conversation ?? []).filter((message) => message.role === 'user').map((message) => message.text) ?? []),
      request?.prompt ?? ''
    ]
      .map((message) => message.toLowerCase().trim())
      .filter(Boolean)
      .reverse();
  }

  private selectedOptionFromUserMessages<T>(
    request: AiAssistantRequest | undefined,
    options: T[],
    valueOf: (option: T) => string,
    matches: (message: string, value: string, option: T) => boolean = (message, value) => message === value
  ) {
    const userMessages = this.userMessageTexts(request);
    return options.find((option) => {
      const value = valueOf(option).toLowerCase();
      return userMessages.some((message) => matches(message, value, option));
    });
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

  private designerSaveInstructionResponse(scope: AiAssistantScope, request: AiAssistantRequest) {
    if (!['services', 'flows', 'forms'].includes(scope)) {
      return null;
    }
    const normalized = request.prompt.toLowerCase().trim();
    if (!/^(guardar|guarda|guardar draft|guardar borrador|guardar y publicar|publicar|publica|crear versi[oó]n|crear version|probar|prueba|probar antes)(\b|[.!\s])/.test(normalized)) {
      return null;
    }

    const names: Record<string, string> = {
      services: 'servicio',
      flows: 'flow',
      forms: 'formulario'
    };
    const moduleName = names[scope] ?? 'objeto';
    const wantsPublish = /publicar|publica/.test(normalized);
    const wantsVersion = /versi[oó]n|version/.test(normalized);
    const wantsTest = /probar|prueba/.test(normalized);
    const action = wantsTest
      ? scope === 'services'
        ? 'usa Probar servicio en la pantalla para ejecutar el JSON publicado o el draft preparado.'
        : scope === 'flows'
          ? 'usa Probar flow en la pantalla para ejecutar el draft con un input de ejemplo.'
          : 'usa Probar submit en Prueba real. Puedes generar datos del preview y validar antes de publicar.'
      : wantsPublish
      ? 'usa Guardar y publicar desde la sección JSON, o crea/publica una versión desde el recorrido visual.'
      : wantsVersion
        ? 'usa Crear versión y luego Publicar cuando el preview o la prueba estén correctos.'
        : 'usa Guardar draft en la pantalla. El chat no guarda automáticamente para evitar cambios accidentales.';

    return {
      message: [
        `${wantsTest ? 'Para probar' : 'Para guardar'} el ${moduleName} actual, ${action}`,
        'No generé otro draft ni cambié la propuesta actual.'
      ].join('\n\n'),
      suggestions: ['seguir ajustando']
    };
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

  private progressiveServiceAuthoringResponse(scope: AiAssistantScope, request: AiAssistantRequest): string | null {
    if (scope !== 'services' || !this.looksLikeServiceAuthoring(this.servicePromptContext(request))) {
      return null;
    }

    const lastAssistant = this.lastAssistantText(request);
    const prompt = request.prompt.toLowerCase().trim();
    const context = this.servicePromptContext(request);

    if (
      /lista, un registro o s[ií]\/no|resultado esperado|esperas lista/i.test(lastAssistant ?? '') &&
      this.detectResultKind(prompt)
    ) {
      return this.serviceAuthoringPreflight(request);
    }

    if (/campo de b[uú]squeda|campo de entrada|campos llegan/i.test(lastAssistant ?? '') && this.detectField(prompt)) {
      return this.serviceAuthoringPreflight(request);
    }

    if (this.detectTable(context) && this.detectField(context) && this.detectResultKind(context)) {
      return this.serviceAuthoringPreflight(request);
    }

    return null;
  }

  private serviceAuthoringPreflight(request: AiAssistantRequest): string {
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
    const confirms = /^(si|sí|ok|listo|dale|contin[uú]a|hazlo|g[eé]neralo|gener[aá]|aplica|crea(?:r)?(?: el)? draft|genera el draft)(\b|[.!\s])/.test(
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

  private flowScreenState(value: unknown): AssistantFlowScreenState | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as AssistantFlowScreenState;
  }

  private formScreenState(value: unknown): AssistantFormScreenState | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as AssistantFormScreenState;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private async formAuthoringResponse(
    scope: AiAssistantScope,
    request: AiAssistantRequest,
    config: AiAssistantConfig
  ): Promise<Pick<AiAssistantResponse, 'message' | 'suggestions' | 'actions'> | null> {
    if (scope !== 'forms' || !this.looksLikeFormAuthoring(this.formPromptContext(request))) {
      return null;
    }

    const crudBundle = this.formCrudBundleFromPrompt(this.formPromptContext(request), request);
    if (crudBundle) {
      return crudBundle;
    }

    const submitAction = this.formSubmitAdjustmentFromPrompt(request.prompt, request);
    if (submitAction) {
      return {
        message: [
          'Ajusté la acción final del formulario actual sin cambiar campos ni diseño.',
          'Actualicé persistencia, acción onSubmit y mapeo para que el JSON sea ejecutable por el runtime.',
          'No guardé ni publiqué nada automáticamente.'
        ].join('\n\n'),
        actions: [submitAction],
        suggestions: ['ajustar otro destino']
      };
    }

    const visualAction = this.formVisualAdjustmentFromPrompt(request.prompt, request);
    if (visualAction) {
      return {
        message: [
          'Ajusté el diseño del formulario actual sin cambiar campos ni acciones.',
          'Modifiqué el contrato declarativo de presentación/layout para que puedas revisar el preview y el JSON.',
          'No guardé ni publiqué nada automáticamente.'
        ].join('\n\n'),
        actions: [visualAction],
        suggestions: ['ajustar otro diseño']
      };
    }

    if (this.shouldApplyFormDraft(request)) {
      const action = this.formDraftFromPrompt(this.formPromptContext(request), request);
      if (!action) {
        return {
          message:
            'No tengo suficientes datos para crear un formulario seguro. Dime qué captura, qué campos tiene y qué debe hacer al enviar.',
          suggestions: ['captura de cliente', 'inspección con evidencias', 'formulario que ejecuta servicio']
        };
      }

      return {
        message: [
          'Preparé un formulario como draft visual en esta pantalla.',
          'Usé el contrato JSON estándar de Dynamic Forms: runtime, presentación, layout, pasos, campos y acciones.',
          'No guardé ni publiqué nada automáticamente. Revisa el preview y el JSON antes de guardar.'
        ].join('\n\n'),
        actions: [action]
      };
    }

    const action = this.formDraftFromPrompt(this.formPromptContext(request), request);
    if (!action) {
      return {
        message: [
          'Interpretación: quieres crear o ajustar un formulario dinámico, pero faltan datos para armarlo sin inventar.',
          'Hoja de ruta: primero cerramos propósito, campos, comportamiento responsive y acción final.',
          'Revisión: el formulario puede guardar record, ejecutar servicio, ejecutar flow, operar híbrido, usar datos por servicio y funcionar web/móvil.',
          'Propuesta:',
          '1. Dime el tipo de formulario: captura, consulta, aprobación, inspección o personalizado.',
          '2. Dime campos obligatorios y si tendrá pasos.',
          '3. Dime qué debe pasar al enviar.',
          'Siguiente paso: escribe una frase completa o elige una opción.'
        ].join('\n'),
        suggestions: ['captura de cliente', 'inspección con fotos', 'consulta por servicio']
      };
    }

    const steps = Array.isArray(action.document['steps']) ? (action.document['steps'] as Array<Record<string, unknown>>) : [];
    const fields = steps.flatMap((step) =>
      Array.isArray(step['fields']) ? (step['fields'] as Array<Record<string, unknown>>) : []
    );
    const persistence = this.asRecord(action.document['persistence']);
    const assistantMetadata = this.asRecord(this.asRecord(action.document['metadata'])['assistant']);
    const semanticChecks = Array.isArray(assistantMetadata['semanticChecks'])
      ? (assistantMetadata['semanticChecks'] as string[])
      : [];

    const reasoning = await this.reasonAboutFormAuthoring(request, action, config);

    return {
      message: [
        reasoning ?? `Interpretación: quieres crear el formulario ${action.name}.`,
        'Hoja de ruta: generaré un draft con JSON editable, preview web/móvil y acciones declarativas.',
        `Revisión: ${steps.length} paso(s), ${fields.length} campo(s), persistencia ${persistence['mode'] ?? 'none'}. ${semanticChecks.join(' ')}`.trim(),
        'Propuesta:',
        `1. Key: ${action.key}.`,
        `2. Campos: ${fields.map((field) => field['key']).join(', ') || 'pendientes'}.`,
        `3. Acción final: ${this.formSubmitSummary(action.document)}.`,
        'Siguiente paso: si está bien, pulsa crear draft. Si falta algo, dime qué campo, servicio, flow o diseño ajustar.'
      ].join('\n'),
      suggestions: ['crear draft', 'ajustar campos', 'ajustar acción final']
    };
  }

  private shouldApplyFormDraft(request: AiAssistantRequest) {
    const prompt = request.prompt.toLowerCase().trim();
    const confirms = /^(si|sí|ok|listo|dale|contin[uú]a|hazlo|g[eé]neralo|gener[aá]|aplica|crea(?:r)?(?: el)? draft|genera el draft|crear draft)(\b|[.!\s])/.test(
      prompt
    );
    if (!confirms) {
      return false;
    }

    return this.scopedFormConversation(request).some(
      (message) =>
        message.role === 'assistant' &&
        /Interpretación: quieres crear el formulario|contrato JSON estándar de Dynamic Forms|preview web\/móvil/i.test(
          message.text
        )
      );
  }

  private async reasonAboutFormAuthoring(
    request: AiAssistantRequest,
    action: ApplyDynamicFormJsonAction,
    config: AiAssistantConfig
  ) {
    const state = this.formScreenState(request.screenState);
    const steps = Array.isArray(action.document['steps']) ? (action.document['steps'] as Array<Record<string, unknown>>) : [];
    const fields = steps.flatMap((step) =>
      Array.isArray(step['fields']) ? (step['fields'] as Array<Record<string, unknown>>) : []
    );
    const persistence = this.asRecord(action.document['persistence']);
    const assistant = this.asRecord(this.asRecord(action.document['metadata'])['assistant']);
    const system = [
      'Eres Chicle AI, asistente experto en Dynamic Forms.',
      'Analiza la solicitud de formulario sin inventar capacidades.',
      'Responde en español, máximo 85 palabras.',
      'No generes JSON completo. No digas que guardaste o publicaste.',
      'Debes mencionar si el draft será web/móvil, qué campos detectaste y qué acción final tendrá.',
      'Si falta algo crítico, pregunta una sola decisión concreta.'
    ].join('\n');
    const user = JSON.stringify(
      {
        prompt: request.prompt,
        conversation: this.compactConversation(request).slice(-5),
        detectedDraft: {
          key: action.key,
          title: action.name,
          intent: assistant['intent'] ?? null,
          semanticChecks: assistant['semanticChecks'] ?? [],
          fields: fields.map((field) => ({
            key: field['key'],
            type: field['type'],
            required: field['required']
          })),
          persistence,
          submit: this.formSubmitSummary(action.document)
        },
        availableTargets: {
          services: state?.availableServices?.slice(0, 8).map((service) => service.key) ?? [],
          flows: state?.availableFlows?.slice(0, 8).map((flow) => flow.key) ?? []
        },
        answerFormat: 'Interpretación: ... Revisión: ... Siguiente paso: ...'
      },
      null,
      2
    );

    const response = await this.safeOllamaChat(
      config,
      [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      {
        temperature: 0.15,
        maxTokens: config.fastMaxTokens,
        timeoutMs: config.fastTimeoutMs
      }
    );

    return response?.message?.trim() || null;
  }

  private formPromptContext(request: AiAssistantRequest) {
    const prompt = request.prompt.trim();
    if (this.shouldStartFreshFormContext(prompt)) {
      return prompt;
    }

    const conversation = this.scopedFormConversation(request)
      .filter((message) => message.role === 'user')
      .map((message) => message.text.trim())
      .filter(Boolean)
      .slice(-5);
    if (conversation.at(-1) === prompt) {
      return conversation.join('\n');
    }

    return [...conversation, prompt].filter(Boolean).join('\n');
  }

  private scopedFormConversation(request: AiAssistantRequest) {
    const conversation = request.conversation ?? [];
    const latestFreshIndex = conversation.reduce((latest, message, index) => {
      return message.role === 'user' && this.shouldStartFreshFormContext(message.text) ? index : latest;
    }, -1);

    return latestFreshIndex >= 0 ? conversation.slice(latestFreshIndex) : conversation;
  }

  private shouldStartFreshFormContext(prompt: string) {
    const normalized = prompt.toLowerCase().trim();
    if (!normalized || this.isFormContinuationPrompt(normalized) || !this.looksLikeFormAuthoring(normalized)) {
      return false;
    }

    const hasExplicitIntent =
      /\b(necesito|quiero|crear|crea|hacer|haz|genera|generar|formulario|form|crud|tabla|capturar|captura|consultar|consulta|validar|aprobar|inspecci[oó]n|registrar|registro|login|logueo|ingresar|acceso)\b/.test(
        normalized
      );
    const hasConcreteTarget =
      this.isAuthLoginPrompt(normalized) ||
      /cliente|usuario|persona|evento|ticket|inmueble|propiedad|inspecci[oó]n|aprobaci[oó]n|solicitud|serial|c[oó]digo|documento|cedula|c[eé]dula|direccion|direcci[oó]n|apellido|campo|campos|email|correo|tel[eé]fono|servicio|flow|record|archivo|foto|gps|select|lista|password|contrase[nñ]a|clave|login|logueo|crud|tabla/i.test(
        normalized
      );

    return hasExplicitIntent && hasConcreteTarget;
  }

  private isFormContinuationPrompt(normalizedPrompt: string) {
    return /^(correcto|correcta|si|sí|ok|listo|dale|contin[uú]a|hazlo|g[eé]neralo|gener[aá]|aplica|crear draft|crea draft|crear el draft|genera draft|genera el draft|ajustar campos|ajustar acci[oó]n final|guardar|publicar|record|servicio|flow|h[ií]brido|m[oó]vil|web|tablet)$/.test(
      normalizedPrompt
    );
  }

  private looksLikeFormAuthoring(prompt: string) {
    return (
      this.isAuthLoginPrompt(prompt) ||
      /formulario|form|crud|tabla|campo|campos|captur|onboarding|inspecci[oó]n|aprobaci[oó]n|consulta|evidencia|foto|archivo|select|lista|servicio|flow|guardar|record|offline|m[oó]vil|web|login|logueo|ingresar|acceso|password|contrase[nñ]a|dise[nñ]o|centr|aline|bot[oó]n|tema|oscuro|claro|material|primeng|ionic|bootstrap/i.test(
        prompt
      )
    );
  }

  private isNewFormDefinitionPrompt(prompt: string) {
    const normalized = prompt.toLowerCase();
    return (
      /(?:necesito|crear|crea|genera|generar|haz|hacer|nuevo|nueva).{0,48}(?:formulario|form)\b/.test(normalized) ||
      /\b(?:formulario|form)\b.{0,80}\b(?:campos?|fields?|captura|guardar|crud|llamado|llamada|nuevo|nueva)\b/.test(normalized) ||
      /\b(?:campos?|fields?)\s+(?!(?:de|del|a|al)\b)(?:son|incluyen|incluye|:)?\s*[a-z0-9_]/.test(normalized)
    );
  }

  private formLifecycleResponse(scope: AiAssistantScope, request: AiAssistantRequest) {
    if (scope !== 'forms') {
      return null;
    }

    const normalized = request.prompt.toLowerCase();
    const state = this.formScreenState(request.screenState);
    const selectedKey = state?.selected?.key || state?.draft?.key || this.formKeyFromPrompt(normalized);

    if (/restaur|recuper/.test(normalized) && /form|formulario|pantalla/.test(normalized)) {
      return this.serviceWorkResponse({
        interpretation: selectedKey
          ? `Quieres restaurar el formulario ${selectedKey}.`
          : 'Quieres restaurar un formulario desde papelera.',
        route: 'La restauración debe confirmarse desde la pantalla para evitar cambios accidentales.',
        investigation: 'Los formularios en papelera conservan JSON, versiones y bindings para poder recuperarlos.',
        proposal: [
          'Abre Papelera en Formularios.',
          selectedKey ? `Selecciona ${selectedKey}.` : 'Selecciona el formulario exacto.',
          'Usa Restaurar y luego revisa el preview antes de publicar.'
        ],
        nextStep: 'Cuando esté restaurado puedo ayudarte a revisar el JSON o preparar una nueva versión.'
      });
    }

    if (/elimin|borrar|desactivar|archivar|enviar\s+a\s+papelera/.test(normalized) && /form|formulario|pantalla/.test(normalized)) {
      return this.serviceWorkResponse({
        interpretation: selectedKey ? `Quieres retirar el formulario ${selectedKey}.` : 'Quieres retirar un formulario.',
        route: 'Por seguridad Chicle AI no envía formularios a papelera automáticamente.',
        investigation: 'El módulo usa papelera, no borrado físico. Las versiones y el JSON quedan recuperables si confirmas desde UI.',
        proposal: [
          selectedKey
            ? `Selecciona ${selectedKey} en el catálogo de Formularios.`
            : 'Selecciona el formulario exacto en el catálogo o dime su key.',
          'Usa Papelera / Enviar a papelera desde la pantalla.',
          'Si fue un error, entra a Papelera y usa Restaurar.'
        ],
        nextStep: 'Puedo revisar el formulario antes de retirarlo, pero la acción final la haces tú desde la pantalla.'
      });
    }

    return null;
  }

  private formDraftFromPrompt(prompt: string, request?: AiAssistantRequest): ApplyDynamicFormJsonAction | null {
    const normalized = prompt.toLowerCase();
    if (!this.looksLikeFormAuthoring(normalized)) {
      return null;
    }

    const state = this.formScreenState(request?.screenState);
    const serviceKeys = this.formServiceKeys(state);
    const flowKeys = this.formFlowKeys(state);
    const intent = this.formIntentFromPrompt(normalized);
    const key = intent.key;
    const title = intent.title;
    const description = intent.description;
    const fields = this.formFieldsFromPrompt(normalized, serviceKeys, intent, state?.tables ?? []);
    const commands = intent.kind === 'approval'
      ? [
          this.formCommand(
            'aprobar',
            'Aprobar',
            intent.wantsFlow ? 'execute_flow' : 'execute_service',
            serviceKeys[0],
            flowKeys[0]
          ),
          this.formCommand('rechazar', 'Rechazar', 'show_message', serviceKeys[0], flowKeys[0])
        ]
      : [];
    const persistence = this.formPersistence({
      key,
      intent,
      serviceKey: intent.kind === 'auth_login' ? 'auth.login' : serviceKeys[0],
      flowKey: flowKeys[0]
    });
    const actions = this.formActions({
      key,
      intent,
      serviceKey: intent.kind === 'auth_login' ? 'auth.login' : serviceKeys[0],
      flowKey: flowKeys[0]
    });
    const document: Record<string, unknown> = {
      schemaVersion: 1,
      kind: 'dynamic_form',
      key,
      title,
      description,
      category: intent.category,
      runtime: {
        mode: 'guided',
        submitLabel: intent.submitLabel,
        autosave: /autosave|autoguardado/.test(normalized),
        offline: {
          enabled: intent.offline,
          queueKey: key,
          idempotencyKey: this.formIdempotencyKey(fields)
        },
        limits: {
          timeoutMs: /lento|integraci[oó]n/.test(normalized) ? 30000 : 10000,
          maxPayloadKb: intent.kind === 'inspection_mobile' ? 4096 : 512
        }
      },
      presentation: {
        profileKey: 'adaptive',
        kit: 'auto',
        theme: /oscuro|dark/.test(normalized) ? 'chicle-dark' : 'chicle',
        themeMode: /oscuro|dark/.test(normalized) ? 'dark' : 'system',
        density: /compact/.test(normalized) ? 'compact' : 'comfortable',
        radius: 'md',
        rules: [
          { kit: 'ionic', platforms: ['ios', 'android'] },
          { kit: 'primeng', platforms: ['web'] }
        ],
        tokens: {
          buttonPrimary: {
            background: this.buttonToneFromPrompt(normalized) || 'primary',
            text: 'primaryContrast',
            radius: 'md'
          }
        }
      },
      layout: {
        strategy: 'adaptive_steps',
        form: {
          width: fields.length <= 4 || intent.kind === 'auth_login' ? 'compact' : 'standard',
          align: fields.length <= 4 || intent.kind === 'auth_login' ? 'left' : 'stretch'
        },
        desktop: {
          mode: fields.length > 8 ? 'step_cards' : 'single_form',
          fieldColumns: fields.length <= 4 || intent.kind === 'auth_login' ? 1 : 2,
          cardColumns: 2,
          allowSingleLongForm: true,
          maxFieldsPerSection: 8,
          actions: {
            position: 'inline',
            align: fields.length <= 4 || intent.kind === 'auth_login' ? 'right' : 'stretch',
            size: fields.length <= 4 || intent.kind === 'auth_login' ? 'md' : 'full'
          }
        },
        tablet: {
          mode: 'step_cards',
          fieldColumns: 1,
          cardColumns: 1,
          maxFieldsPerSection: 6,
          actions: {
            position: 'footer',
            align: 'stretch',
            size: 'full'
          }
        },
        mobile: {
          mode: 'step_screens',
          progress: 'compact',
          navigation: 'bottom_actions',
          fieldColumns: 1,
          maxFieldsPerScreen: 6,
          actions: {
            position: 'bottom_sticky',
            align: 'stretch',
            size: 'full'
          }
        },
        autoSplit: {
          enabled: true,
          suggestAfterFields: 8,
          forceReviewAfterFields: 14
        }
      },
      persistence,
      steps: this.formStepsFromFields(normalized, fields),
      commands,
      actions,
      dataSources: this.formDataSources(fields),
      metadata: {
        assistant: {
          intent: intent.kind,
          confidence: intent.confidence,
          notes: intent.notes,
          semanticChecks: []
        }
      },
      tests: [
        {
          name: 'Preview básico',
          input: Object.fromEntries(fields.map((field) => [field.key, field.example ?? 'test']))
        }
      ]
    };
    this.repairAndValidateFormDraft(document, intent, fields);

    return {
      type: 'apply_dynamic_form_json',
      label: 'Aplicar propuesta al diseñador de formularios',
      key,
      name: title,
      description,
      publish: false,
      document
    };
  }

  private formCrudBundleFromPrompt(
    prompt: string,
    request?: AiAssistantRequest
  ): Pick<AiAssistantResponse, 'message' | 'suggestions' | 'actions'> | null {
    const normalized = prompt.toLowerCase();
    if (!/\bcrud\b|crear.*formulario.*tabla|formulario.*tabla|guardar.*tabla|registrar.*tabla/.test(normalized)) {
      return null;
    }

    const state = this.formScreenState(request?.screenState);
    const explicitTable = this.formExplicitTableNameFromPrompt(normalized);
    const wantsNewTable = this.formWantsNewCustomTable(normalized);
    const table = this.formTableFromPrompt(normalized, state);
    if (table && explicitTable && wantsNewTable) {
      const requestedColumns = this.schemaColumnsFromPrompt(normalized);
      const mismatch = this.formExistingTableMismatch(table, requestedColumns);
      if (requestedColumns.length && (mismatch.missing.length || mismatch.typeMismatches.length)) {
        const tableName = table.name ?? this.customTableNameFromPrompt(explicitTable);
        return this.incompatibleExistingTableResponse(tableName, mismatch);
      }
    }
    if (!table) {
      if (explicitTable && wantsNewTable) {
        return this.formNewTableCrudBundleFromPrompt(normalized, explicitTable, state);
      }
      const tables = state?.tables?.map((item) => item.name).filter((name): name is string => Boolean(name)) ?? [];
      if (explicitTable && tables.length) {
        return {
          message: [
            `Interpretación: quieres crear un formulario CRUD para la tabla ${explicitTable}.`,
            `Revisión: esa tabla no aparece en el catálogo visible de esta sesión, así que no puedo inventar columnas ni generar un writeMap seguro.`,
            `Tablas visibles ahora: ${tables.slice(0, 12).join(', ')}${tables.length > 12 ? ', ...' : ''}.`,
            'Siguiente paso: elige una tabla visible o crea primero la tabla desde Base de datos y vuelve a intentarlo.'
          ].join('\n'),
          suggestions: tables.slice(0, 3).map((name) => `formulario CRUD a la tabla ${name}`)
        };
      }

      if (explicitTable) {
        return {
          message: [
            `Interpretación: quieres crear un formulario CRUD para la tabla ${explicitTable}.`,
            'Revisión: el catálogo de tablas no está cargado en esta pantalla. Sin catálogo no puedo validar columnas reales ni crear el servicio companion.',
            'Siguiente paso: recarga la pantalla o verifica que tu usuario tenga permiso para administrar formularios. Después vuelve a pedir el CRUD.'
          ].join('\n'),
          suggestions: ['recargar formularios', 'abrir base de datos']
        };
      }

      return {
        message: [
          'Interpretación: quieres crear un formulario conectado a una tabla real.',
          'Revisión: para no inventar columnas necesito identificar la tabla visible del catálogo.',
          'Siguiente paso: dime el nombre exacto de la tabla, por ejemplo "formulario CRUD a la tabla custom_clients".'
        ].join('\n'),
        suggestions: ['formulario CRUD a la tabla custom_clients']
      };
    }

    const allTables = state?.tables ?? [];
    const fields = this.formFieldsFromTable(table, allTables);
    if (!fields.length) {
      return {
        message: [
          `Encontré la tabla ${table.name}, pero no tiene columnas editables seguras para construir el formulario.`,
          'No usaré id, tenantId, fechas automáticas ni columnas sensibles.'
        ].join('\n')
      };
    }

    const tableName = table.name ?? 'registro';
    if (this.normalizeKey(tableName) === 'users') {
      return this.userCrudFormBundle(tableName, normalized);
    }

    const serviceKey = `crear_${this.normalizeKey(tableName)}`;
    const serviceName = `Crear ${this.formReadableName(tableName)}`;
    const payloadMap = Object.fromEntries(fields.map((field) => [field.key, `{{input.${field.key}}}`]));
    const writeMap = Object.fromEntries(fields.map((field) => [field.key, `{{input.${field.key}}}`]));
    const formKey = `form_${this.normalizeKey(tableName)}`;
    const formTitle = `Formulario ${this.formReadableName(tableName)}`;
    const formDescription = `Crea registros en ${tableName} usando un servicio dinámico seguro.`;
    const primaryColumn = this.primaryTableColumn(table);
    const serviceActions: ApplyDynamicServiceJsonAction[] = [
      this.formInternalCrudServiceAction({
        key: serviceKey,
        name: serviceName,
        description: `Inserta registros en ${tableName} desde formularios dinámicos.`,
        tableName,
        intent: 'create',
        method: 'POST',
        resultKind: 'single',
        writeMap
      }),
      this.formInternalCrudServiceAction({
        key: `listar_${this.normalizeKey(tableName)}`,
        name: `Listar ${this.formReadableName(tableName)}`,
        description: `Lista registros visibles de ${tableName}.`,
        tableName,
        intent: 'query',
        method: 'GET',
        resultKind: 'list'
      })
    ];

    if (primaryColumn) {
      const idFilter = [
        { field: primaryColumn, operator: 'equals', valueSource: 'input', inputKey: primaryColumn, required: true }
      ];
      serviceActions.push(
        this.formInternalCrudServiceAction({
          key: `actualizar_${this.normalizeKey(tableName)}`,
          name: `Actualizar ${this.formReadableName(tableName)}`,
          description: `Actualiza registros de ${tableName} por ${primaryColumn}.`,
          tableName,
          intent: 'update',
          method: 'PATCH',
          resultKind: 'single',
          writeMap,
          filters: idFilter
        }),
        this.formInternalCrudServiceAction({
          key: `eliminar_${this.normalizeKey(tableName)}`,
          name: `Eliminar ${this.formReadableName(tableName)}`,
          description: `Elimina registros de ${tableName} por ${primaryColumn}.`,
          tableName,
          intent: 'delete',
          method: 'DELETE',
          resultKind: 'none',
          filters: idFilter
        })
      );
    }

    for (const lookupAction of this.formLookupServiceActions(fields, allTables)) {
      if (!serviceActions.some((action) => action.key === lookupAction.key)) {
        serviceActions.push(lookupAction);
      }
    }

    const formDocument: Record<string, unknown> = {
      schemaVersion: 1,
      kind: 'dynamic_form',
      key: formKey,
      title: formTitle,
      description: formDescription,
      category: 'tablas',
      runtime: {
        mode: 'guided',
        submitLabel: 'Guardar',
        autosave: false,
        offline: {
          enabled: /offline|sin conexi[oó]n/.test(normalized),
          queueKey: formKey,
          idempotencyKey: fields.some((field) => field.key === 'email') ? '{{input.email}}' : '{{input.id}}'
        },
        limits: { timeoutMs: 10000, maxPayloadKb: 512 }
      },
      presentation: {
        profileKey: 'adaptive',
        kit: 'auto',
        theme: 'chicle',
        themeMode: 'system',
        density: 'comfortable',
        radius: 'md',
        rules: [
          { kit: 'ionic', platforms: ['ios', 'android'] },
          { kit: 'primeng', platforms: ['web'] }
        ],
        tokens: {
          buttonPrimary: { background: 'primary', text: 'primaryContrast', radius: 'md' }
        }
      },
      layout: {
        strategy: 'adaptive_steps',
        form: { width: fields.length <= 4 ? 'compact' : 'standard', align: fields.length <= 4 ? 'left' : 'stretch' },
        desktop: {
          mode: fields.length > 8 ? 'step_cards' : 'single_form',
          fieldColumns: fields.length <= 4 ? 1 : 2,
          cardColumns: 2,
          allowSingleLongForm: true,
          maxFieldsPerSection: 8,
          actions: { position: 'inline', align: fields.length <= 4 ? 'stretch' : 'stretch', size: 'field' }
        },
        tablet: {
          mode: 'step_cards',
          fieldColumns: 1,
          cardColumns: 1,
          maxFieldsPerSection: 6,
          actions: { position: 'footer', align: 'stretch', size: 'full' }
        },
        mobile: {
          mode: 'step_screens',
          progress: 'compact',
          navigation: 'bottom_actions',
          fieldColumns: 1,
          maxFieldsPerScreen: 6,
          actions: { position: 'bottom_sticky', align: 'stretch', size: 'full' }
        },
        autoSplit: { enabled: true, suggestAfterFields: 8, forceReviewAfterFields: 14 }
      },
      persistence: {
        mode: 'service',
        defaultTarget: { type: 'dynamic_service', serviceKey }
      },
      steps: this.formStepsFromFields(normalized, fields),
      commands: [],
      actions: [
        {
          event: 'onSubmit',
          type: 'execute_service',
          serviceKey,
          resultKey: 'created',
          payloadMap,
          onSuccess: [{ type: 'show_message', tone: 'success', message: 'Registro guardado correctamente.' }],
          onError: [{ type: 'show_message', tone: 'danger', message: 'No se pudo guardar el registro.' }]
        }
      ],
      dataSources: this.formDataSources(fields),
      metadata: {
        assistant: {
          intent: 'table_crud_form',
          confidence: 0.86,
          notes: [
            'El formulario no escribe directo a la tabla.',
            'El submit llama un Dynamic Service companion con writeMap validado por backend.',
            'Los controles se infieren desde tipos y relaciones visibles del catálogo.'
          ],
          semanticChecks: [
            `Tabla real usada: ${table.name}`,
            ...fields
              .filter((field) => field['type'] === 'select' || field['type'] === 'toggle')
              .map((field) => `${field['key']}: ${field['type']}`)
          ]
        }
      },
      tests: [
        {
          name: `Crear registro en ${table.name}`,
          input: Object.fromEntries(fields.map((field) => [field.key, field.example ?? 'test']))
        }
      ]
    };

    const formAction: ApplyDynamicFormJsonAction = {
      type: 'apply_dynamic_form_json',
      label: 'Aplicar formulario CRUD conectado',
      key: formKey,
      name: formTitle,
      description: formDescription,
      publish: false,
      document: formDocument
    };

    return {
      message: [
        `Preparé un formulario CRUD para la tabla ${tableName}.`,
        `También preparé servicios companion publicados automáticamente por la pantalla: ${serviceActions.map((action) => action.key).join(', ')}.`,
        `El formulario queda conectado a ${serviceKey} para que el preview pueda probar guardado real.`,
        `Campos mapeados: ${fields.map((field) => field.key).join(', ')}.`,
        `Controles inferidos: ${fields
          .map((field) => `${field.key}:${String(field['type'] ?? 'text')}`)
          .join(', ')}.`,
        'No uso SQL libre: el servicio declara writeMap y el backend valida tabla, columnas y tenant scope.'
      ].join('\n\n'),
      actions: [...serviceActions, formAction],
      suggestions: ['probar submit', 'ajustar campos', 'guardar y publicar']
    };
  }

  private userCrudFormBundle(
    tableName: string,
    normalizedPrompt: string
  ): Pick<AiAssistantResponse, 'message' | 'suggestions' | 'actions'> {
    const formKey = 'form_users';
    const fields = [
      this.formField('email', 'Email', 'email', true, 'usuario@empresa.com', 'viewer@example.com'),
      this.formField('name', 'Nombre', 'text', false, 'Nombre visible', 'Usuario viewer'),
      this.formField('password', 'Password', 'password', true, 'Mínimo 12 caracteres', 'CambiaEstaClave123'),
      {
        ...this.formField('role', 'Rol', 'select', true, 'Selecciona rol', 'viewer'),
        options: [
          { label: 'Owner', value: 'owner' },
          { label: 'Admin', value: 'admin' },
          { label: 'Operator', value: 'operator' },
          { label: 'Viewer', value: 'viewer' },
          { label: 'Cliente app', value: 'client' }
        ],
        config: {
          help: 'Rol RBAC inicial del usuario. Viewer funciona para consulta básica.',
          defaultValue: 'viewer'
        }
      }
    ];
    const formDocument: Record<string, unknown> = {
      schemaVersion: 1,
      kind: 'dynamic_form',
      key: formKey,
      title: 'Crear usuario',
      description: 'Crea usuarios usando el módulo seguro de seguridad, con password hasheado y rol inicial.',
      category: 'seguridad',
      runtime: {
        mode: 'guided',
        submitLabel: 'Guardar usuario',
        autosave: false,
        offline: { enabled: false, queueKey: formKey, idempotencyKey: '{{input.email}}' },
        limits: { timeoutMs: 10000, maxPayloadKb: 512 }
      },
      presentation: {
        profileKey: 'adaptive',
        kit: 'auto',
        theme: 'chicle',
        themeMode: 'system',
        density: 'comfortable',
        radius: 'md',
        rules: [
          { kit: 'ionic', platforms: ['ios', 'android'] },
          { kit: 'primeng', platforms: ['web'] }
        ],
        tokens: { buttonPrimary: { background: 'primary', text: 'primaryContrast', radius: 'md' } }
      },
      layout: {
        strategy: 'adaptive_steps',
        form: { width: 'compact', align: 'left' },
        desktop: {
          mode: 'single_form',
          fieldColumns: 1,
          cardColumns: 1,
          allowSingleLongForm: true,
          maxFieldsPerSection: 8,
          actions: { position: 'inline', align: 'stretch', size: 'field' }
        },
        tablet: {
          mode: 'single_form',
          fieldColumns: 1,
          cardColumns: 1,
          maxFieldsPerSection: 6,
          actions: { position: 'footer', align: 'stretch', size: 'full' }
        },
        mobile: {
          mode: 'step_screens',
          progress: 'compact',
          navigation: 'bottom_actions',
          fieldColumns: 1,
          maxFieldsPerScreen: 6,
          actions: { position: 'bottom_sticky', align: 'stretch', size: 'full' }
        },
        autoSplit: { enabled: true, suggestAfterFields: 8, forceReviewAfterFields: 14 }
      },
      persistence: { mode: 'submit_action' },
      steps: this.formStepsFromFields(normalizedPrompt, fields),
      commands: [],
      actions: [
        {
          event: 'onSubmit',
          type: 'create_user',
          resultKey: 'user',
          payloadMap: {
            email: '{{input.email}}',
            name: '{{input.name}}',
            password: '{{input.password}}',
            roles: ['{{input.role}}']
          },
          onSuccess: [{ type: 'show_message', tone: 'success', message: 'Usuario creado correctamente.' }],
          onError: [{ type: 'show_message', tone: 'danger', message: 'No se pudo crear el usuario.' }]
        }
      ],
      dataSources: [],
      metadata: {
        assistant: {
          intent: 'secure_user_create_form',
          confidence: 0.9,
          notes: [
            'La tabla users no se escribe con CRUD directo porque passwordHash es sensible.',
            'El submit usa create_user para aplicar política de password, hash y roles desde el módulo de seguridad.'
          ],
          semanticChecks: [`Tabla solicitada: ${tableName}`, 'Acción segura usada: create_user']
        }
      },
      tests: [
        {
          name: 'Crear usuario viewer',
          input: {
            email: 'viewer@example.com',
            name: 'Usuario viewer',
            password: 'CambiaEstaClave123',
            role: 'viewer'
          }
        }
      ]
    };

    return {
      message: [
        `Preparé un formulario seguro para crear usuarios desde ${tableName}.`,
        'No escribo passwordHash ni hago INSERT directo en users.',
        'El botón Guardar usuario ejecuta la acción create_user del backend: valida password, hashea, crea membership y asigna rol.',
        'Puedes usar Viewer inmediatamente; también quedan Admin, Operator, Owner y Cliente app como opciones.'
      ].join('\n\n'),
      actions: [
        {
          type: 'apply_dynamic_form_json',
          label: 'Aplicar formulario seguro de usuarios',
          key: formKey,
          name: 'Crear usuario',
          description: 'Crea usuarios con password seguro y rol inicial.',
          publish: false,
          document: formDocument
        }
      ],
      suggestions: ['probar submit', 'guardar y publicar', 'crear cliente app']
    };
  }

  private formExplicitTableNameFromPrompt(prompt: string) {
    const patterns = [
      /(?:tabla|table)\s+(?:que\s+(?:llamaremos|se\s+llama|llamada|llamado|nombre)|llamada|llamado|nombrada|nombrado)\s+([a-zA-Z0-9_]+)/i,
      /(?:tabla|table)\s+(?:nueva\s+)?([a-zA-Z0-9_]+)/i,
      /(?:llamaremos|se\s+llama|llamada|llamado|nombre)\s+([a-zA-Z0-9_]+)/i
    ];

    for (const pattern of patterns) {
      const value = prompt.match(pattern)?.[1];
      if (value && !this.isPromptConnectorWord(value)) {
        return value;
      }
    }

    return undefined;
  }

  private isPromptConnectorWord(value: string) {
    return ['que', 'llamada', 'llamado', 'nombre', 'nueva', 'nuevo', 'con', 'los', 'las', 'campo', 'campos'].includes(
      this.normalizeKey(value)
    );
  }

  private databaseAuthoringResponse(
    scope: AiAssistantScope,
    request: AiAssistantRequest,
    auth: AuthContext
  ): Pick<AiAssistantResponse, 'message' | 'suggestions' | 'actions'> | null {
    if (scope !== 'database') {
      return null;
    }

    if (!(auth.user.systemRole === 'owner' || auth.user.systemRole === 'admin' || auth.roles.some((role) => role.key === 'owner' || role.key === 'admin'))) {
      return {
        message: 'El asistente de Base de datos solo puede preparar cambios para usuarios owner o admin.'
      };
    }

    const prompt = request.prompt.toLowerCase();
    const tableName = this.databaseTableNameFromPrompt(prompt);
    if (!tableName) {
      return {
        message: [
          'Interpretación: quieres trabajar con el diseñador de tablas.',
          'Siguiente paso: dime la tabla y la operación. Ejemplo: "crear tabla test con campos nombre texto, email email, activo boolean".'
        ].join('\n'),
        suggestions: ['crear tabla test con campos nombre texto, email email, activo boolean']
      };
    }

    if (/borrar tabla|eliminar tabla|drop table/.test(prompt)) {
      if (!(auth.user.systemRole === 'owner' || auth.roles.some((role) => role.key === 'owner'))) {
        return { message: 'Eliminar una tabla completa solo está disponible para usuarios owner.' };
      }
      const action = this.databaseSchemaAction({
        operation: 'drop_table',
        tableName,
        confirmation: `DROP TABLE ${tableName}`
      });
      return {
        message: [
          `Preparé la eliminación de ${tableName} en el diseñador.`,
          'No la apliqué automáticamente. Revisa el preview y confirma solo si estás en desarrollo local.'
        ].join('\n'),
        actions: [action],
        suggestions: ['previsualizar', 'cancelar']
      };
    }

    const columnName = this.databaseColumnNameFromPrompt(prompt);
    if (/agregar campo|agrega campo|add column|nuevo campo/.test(prompt)) {
      if (!columnName) {
        return {
          message: `Entiendo que quieres agregar un campo en ${tableName}, pero falta el nombre del campo y tipo.`,
          suggestions: [`agregar campo status string a tabla ${tableName}`]
        };
      }
      const action = this.databaseSchemaAction({
        operation: 'add_column',
        tableName,
        column: this.schemaColumnFromPromptPart(this.databaseColumnPromptPart(prompt, columnName)) ?? {
          name: columnName,
          type: 'string',
          length: 160,
          nullable: true
        }
      });
      return {
        message: `Preparé agregar el campo ${columnName} en ${tableName}. Revisa SQL y migración antes de aplicar.`,
        actions: [action],
        suggestions: ['aplicar cambio', 'ajustar tipo']
      };
    }

    if (/editar campo|alterar campo|modificar campo|alter column/.test(prompt)) {
      if (!columnName) {
        return {
          message: `Entiendo que quieres editar un campo en ${tableName}, pero falta el campo actual.`,
          suggestions: [`editar campo status en tabla ${tableName} a string nullable`]
        };
      }
      const action = this.databaseSchemaAction({
        operation: 'alter_column',
        tableName,
        currentColumnName: columnName,
        column: this.schemaColumnFromPromptPart(this.databaseColumnPromptPart(prompt, columnName)) ?? {
          name: columnName,
          type: 'string',
          length: 160,
          nullable: true
        }
      });
      return {
        message: `Preparé editar el campo ${columnName} en ${tableName}. Revisa el preview porque puede afectar datos existentes.`,
        actions: [action],
        suggestions: ['previsualizar', 'ajustar nullable']
      };
    }

    if (/borrar campo|eliminar campo|drop column/.test(prompt)) {
      if (!columnName) {
        return {
          message: `Entiendo que quieres eliminar un campo en ${tableName}, pero falta el nombre del campo.`,
          suggestions: [`eliminar campo status de tabla ${tableName}`]
        };
      }
      const action = this.databaseSchemaAction({
        operation: 'drop_column',
        tableName,
        currentColumnName: columnName,
        confirmation: `DROP ${tableName}.${columnName}`
      });
      return {
        message: `Preparé eliminar el campo ${columnName} de ${tableName}. No lo apliqué automáticamente.`,
        actions: [action],
        suggestions: ['previsualizar', 'cancelar']
      };
    }

    const columns = this.schemaColumnsFromPrompt(prompt);
    if (!columns.length) {
      return {
        message: [
          `Interpretación: quieres crear o preparar la tabla ${tableName}.`,
          'Revisión: necesito columnas explícitas para no inventar estructura.',
          `Ejemplo: "crear tabla ${tableName} con campos nombre texto, email email, activo boolean".`
        ].join('\n'),
        suggestions: [`crear tabla ${tableName} con campos nombre texto, email email, activo boolean`]
      };
    }

    const action = this.databaseSchemaAction({
      operation: 'create_table',
      tableName,
      columns
    });
    return {
      message: [
        `Preparé la creación de ${tableName}.`,
        `Columnas: ${columns.map((column) => `${column.name}:${column.type}`).join(', ')}.`,
        'No apliqué nada automáticamente: el diseñador de DB queda listo para previsualizar/aplicar.'
      ].join('\n'),
      actions: [action],
      suggestions: ['aplicar cambio', 'ajustar campos']
    };
  }

  private databaseSchemaAction(options: {
    operation: 'create_table' | 'add_column' | 'alter_column' | 'drop_column' | 'drop_table';
    tableName: string;
    columns?: Array<Record<string, unknown>>;
    column?: Record<string, unknown>;
    currentColumnName?: string;
    confirmation?: string;
  }): ApplySchemaChangeAction {
    return {
      type: 'apply_schema_change',
      label: 'Preparar cambio de esquema',
      tableName: options.tableName,
      operation: options.operation,
      apply: false,
      request: {
        operation: options.operation,
        tableName: options.tableName,
        columns: options.columns as ApplySchemaChangeAction['request']['columns'],
        column: options.column,
        currentColumnName: options.currentColumnName,
        confirmation: options.confirmation
      }
    };
  }

  private databaseTableNameFromPrompt(prompt: string) {
    const explicit = this.formExplicitTableNameFromPrompt(prompt);
    if (!explicit) {
      return '';
    }
    return this.customTableNameFromPrompt(explicit);
  }

  private databaseColumnNameFromPrompt(prompt: string) {
    return prompt.match(/(?:campo|columna|column)\s+([a-zA-Z0-9_]+)/i)?.[1] ?? '';
  }

  private databaseColumnPromptPart(prompt: string, columnName: string) {
    const after = prompt.slice(Math.max(0, prompt.indexOf(columnName)));
    return after.split(/(?:\s+a\s+tabla|\s+de\s+tabla|\s+en\s+tabla|\s+tabla\s+)/i)[0] || columnName;
  }

  private formWantsNewCustomTable(prompt: string) {
    return /tabla nueva|nueva tabla|crear.*tabla.*campos?|generar.*tabla|construir.*tabla|tabla.*campos?|con\s+(?:los\s+|las\s+)?campos?/.test(prompt);
  }

  private formNewTableCrudBundleFromPrompt(
    prompt: string,
    requestedTableName: string,
    state: AssistantFormScreenState | null
  ): Pick<AiAssistantResponse, 'message' | 'suggestions' | 'actions'> {
    const tableName = this.customTableNameFromPrompt(requestedTableName);
    const existing = state?.tables?.find((table) => this.normalizeKey(table.name ?? '') === this.normalizeKey(tableName));
    if (existing) {
      const requestedColumns = this.schemaColumnsFromPrompt(prompt);
      const mismatch = this.formExistingTableMismatch(existing, requestedColumns);
      if (requestedColumns.length && (mismatch.missing.length || mismatch.typeMismatches.length)) {
        return this.incompatibleExistingTableResponse(existing.name ?? tableName, mismatch);
      }
      return this.formCrudBundleForTable(prompt, existing, state?.tables ?? []);
    }

    const columns = this.schemaColumnsFromPrompt(prompt);
    if (!columns.length) {
      return {
        message: [
          `Interpretación: quieres crear una tabla nueva ${tableName} y un formulario CRUD conectado.`,
          'Revisión: para escribir DB y migración necesito columnas explícitas; no voy a inventarlas.',
          'Siguiente paso: dime los campos con tipo. Ejemplo: "formulario CRUD a tabla test con campos nombre texto, email email, activo boolean".'
        ].join('\n'),
        suggestions: [
          `formulario CRUD a tabla ${tableName} con campos nombre texto, email email, activo boolean`,
          `formulario CRUD a tabla ${tableName} con campos titulo texto, descripcion larga, fecha date`
        ]
      };
    }

    const table = {
      name: tableName,
      scope: 'tenant',
      columns: [
        { name: 'id', type: 'varchar', nullable: false, primary: true },
        { name: 'tenantId', type: 'varchar', nullable: false, primary: false },
        ...columns.map((column) => ({
          name: column.name,
          type: this.formCatalogTypeFromSchemaType(column.type),
          nullable: column.nullable !== false,
          primary: false
        })),
        { name: 'createdAt', type: 'datetime', nullable: false, primary: false },
        { name: 'updatedAt', type: 'datetime', nullable: false, primary: false }
      ]
    };
    const actions = this.formCrudBundleForTable(prompt, table, [...(state?.tables ?? []), table]).actions ?? [];
    const schemaAction: ApplySchemaChangeAction = {
      type: 'apply_schema_change',
      label: 'Crear tabla custom y migración',
      tableName,
      operation: 'create_table',
      apply: true,
      request: {
        operation: 'create_table',
        tableName,
        columns
      }
    };

    return {
      message: [
        `Preparé la creación de la tabla ${tableName} y un formulario CRUD conectado.`,
        `Columnas custom: ${columns.map((column) => `${column.name}:${column.type}`).join(', ')}.`,
        'La pantalla primero aplicará el cambio de schema usando el diseñador de DB; eso registra schema_changes y genera migración TypeORM.',
        'Después creará los servicios companion y aplicará el formulario al diseñador para que puedas probar el guardado real en el preview.',
        'No guardé ni publiqué el formulario automáticamente.'
      ].join('\n\n'),
      actions: [schemaAction, ...actions],
      suggestions: ['probar submit', 'guardar y publicar', 'ver base de datos']
    };
  }

  private formCrudBundleForTable(
    normalized: string,
    table: NonNullable<AssistantFormScreenState['tables']>[number],
    allTables: NonNullable<AssistantFormScreenState['tables']> = []
  ): Pick<AiAssistantResponse, 'message' | 'suggestions' | 'actions'> {
    const fields = this.formFieldsFromTable(table, allTables);
    if (!fields.length) {
      return {
        message: [
          `Encontré la tabla ${table.name}, pero no tiene columnas editables seguras para construir el formulario.`,
          'No usaré id, tenantId, fechas automáticas ni columnas sensibles.'
        ].join('\n')
      };
    }

    const tableName = table.name ?? 'registro';
    if (this.normalizeKey(tableName) === 'users') {
      return this.userCrudFormBundle(tableName, normalized);
    }

    const serviceKey = `crear_${this.normalizeKey(tableName)}`;
    const serviceName = `Crear ${this.formReadableName(tableName)}`;
    const payloadMap = Object.fromEntries(fields.map((field) => [field.key, `{{input.${field.key}}}`]));
    const writeMap = Object.fromEntries(fields.map((field) => [field.key, `{{input.${field.key}}}`]));
    const formKey = `form_${this.normalizeKey(tableName)}`;
    const formTitle = `Formulario ${this.formReadableName(tableName)}`;
    const formDescription = `Crea registros en ${tableName} usando un servicio dinámico seguro.`;
    const primaryColumn = this.primaryTableColumn(table);
    const serviceActions: ApplyDynamicServiceJsonAction[] = [
      this.formInternalCrudServiceAction({
        key: serviceKey,
        name: serviceName,
        description: `Inserta registros en ${tableName} desde formularios dinámicos.`,
        tableName,
        intent: 'create',
        method: 'POST',
        resultKind: 'single',
        writeMap
      }),
      this.formInternalCrudServiceAction({
        key: `listar_${this.normalizeKey(tableName)}`,
        name: `Listar ${this.formReadableName(tableName)}`,
        description: `Lista registros visibles de ${tableName}.`,
        tableName,
        intent: 'query',
        method: 'GET',
        resultKind: 'list'
      })
    ];

    if (primaryColumn) {
      const idFilter = [
        { field: primaryColumn, operator: 'equals', valueSource: 'input', inputKey: primaryColumn, required: true }
      ];
      serviceActions.push(
        this.formInternalCrudServiceAction({
          key: `actualizar_${this.normalizeKey(tableName)}`,
          name: `Actualizar ${this.formReadableName(tableName)}`,
          description: `Actualiza registros de ${tableName} por ${primaryColumn}.`,
          tableName,
          intent: 'update',
          method: 'PATCH',
          resultKind: 'single',
          writeMap,
          filters: idFilter
        }),
        this.formInternalCrudServiceAction({
          key: `eliminar_${this.normalizeKey(tableName)}`,
          name: `Eliminar ${this.formReadableName(tableName)}`,
          description: `Elimina registros de ${tableName} por ${primaryColumn}.`,
          tableName,
          intent: 'delete',
          method: 'DELETE',
          resultKind: 'none',
          filters: idFilter
        })
      );
    }

    for (const lookupAction of this.formLookupServiceActions(fields, allTables)) {
      if (!serviceActions.some((action) => action.key === lookupAction.key)) {
        serviceActions.push(lookupAction);
      }
    }

    const formDocument = this.formCrudDocumentFromTable({
      normalized,
      tableName,
      formKey,
      formTitle,
      formDescription,
      serviceKey,
      fields,
      payloadMap
    });

    const formAction: ApplyDynamicFormJsonAction = {
      type: 'apply_dynamic_form_json',
      label: 'Aplicar formulario CRUD conectado',
      key: formKey,
      name: formTitle,
      description: formDescription,
      publish: false,
      document: formDocument
    };

    return {
      message: [
        `Preparé un formulario CRUD para la tabla ${tableName}.`,
        `También preparé servicios companion publicados automáticamente por la pantalla: ${serviceActions.map((action) => action.key).join(', ')}.`,
        `El formulario queda conectado a ${serviceKey} para que el preview pueda probar guardado real.`,
        `Campos mapeados: ${fields.map((field) => field.key).join(', ')}.`,
        `Controles inferidos: ${fields.map((field) => `${field.key}:${String(field['type'] ?? 'text')}`).join(', ')}.`,
        'No uso SQL libre: el servicio declara writeMap y el backend valida tabla, columnas y tenant scope.'
      ].join('\n\n'),
      actions: [...serviceActions, formAction],
      suggestions: ['probar submit', 'ajustar campos', 'guardar y publicar']
    };
  }

  private customTableNameFromPrompt(value: string) {
    const normalized = this.normalizeKey(value);
    return normalized.startsWith('custom_') ? normalized : `custom_${normalized}`;
  }

  private formCrudDocumentFromTable(options: {
    normalized: string;
    tableName: string;
    formKey: string;
    formTitle: string;
    formDescription: string;
    serviceKey: string;
    fields: Array<Record<string, unknown> & { key: string; example?: unknown }>;
    payloadMap: Record<string, string>;
  }): Record<string, unknown> {
    const { normalized, tableName, formKey, formTitle, formDescription, serviceKey, fields, payloadMap } = options;
    const wideFields = this.wantsWideFormFields(normalized);
    const documentFields = wideFields ? fields.map((field) => this.withWideFieldLayout(field)) : fields;
    const fieldColumns = wideFields ? 1 : fields.length <= 4 ? 1 : 2;
    return {
      schemaVersion: 1,
      kind: 'dynamic_form',
      key: formKey,
      title: formTitle,
      description: formDescription,
      category: 'tablas',
      runtime: {
        mode: 'guided',
        submitLabel: 'Guardar',
        autosave: false,
        offline: {
          enabled: /offline|sin conexi[oó]n/.test(normalized),
          queueKey: formKey,
          idempotencyKey: fields.some((field) => field.key === 'email') ? '{{input.email}}' : '{{input.id}}'
        },
        limits: { timeoutMs: 10000, maxPayloadKb: 512 }
      },
      presentation: {
        profileKey: 'adaptive',
        kit: 'auto',
        theme: 'chicle',
        themeMode: 'system',
        density: 'comfortable',
        radius: 'md',
        rules: [
          { kit: 'ionic', platforms: ['ios', 'android'] },
          { kit: 'primeng', platforms: ['web'] }
        ],
        tokens: {
          buttonPrimary: { background: this.buttonToneFromPrompt(normalized) || 'primary', text: 'primaryContrast', radius: 'md' }
        }
      },
      layout: {
        strategy: 'adaptive_steps',
        form: {
          width: wideFields ? 'standard' : fields.length <= 4 ? 'compact' : 'standard',
          align: wideFields ? 'stretch' : fields.length <= 4 ? 'left' : 'stretch'
        },
        desktop: {
          mode: fields.length > 8 ? 'step_cards' : 'single_form',
          fieldColumns,
          cardColumns: 2,
          allowSingleLongForm: true,
          maxFieldsPerSection: 8,
          actions: { position: 'inline', align: 'stretch', size: 'field' }
        },
        tablet: {
          mode: 'step_cards',
          fieldColumns: 1,
          cardColumns: 1,
          maxFieldsPerSection: 6,
          actions: { position: 'footer', align: 'stretch', size: 'full' }
        },
        mobile: {
          mode: 'step_screens',
          progress: 'compact',
          navigation: 'bottom_actions',
          fieldColumns: 1,
          maxFieldsPerScreen: 6,
          actions: { position: 'bottom_sticky', align: 'stretch', size: 'full' }
        },
        autoSplit: { enabled: true, suggestAfterFields: 8, forceReviewAfterFields: 14 }
      },
      persistence: {
        mode: 'service',
        defaultTarget: { type: 'dynamic_service', serviceKey }
      },
      steps: this.formStepsFromFields(normalized, documentFields),
      commands: [],
      actions: [
        {
          event: 'onSubmit',
          type: 'execute_service',
          serviceKey,
          resultKey: 'created',
          payloadMap,
          onSuccess: [{ type: 'show_message', tone: 'success', message: 'Registro guardado correctamente.' }],
          onError: [{ type: 'show_message', tone: 'danger', message: 'No se pudo guardar el registro.' }]
        }
      ],
      dataSources: this.formDataSources(fields),
      metadata: {
        assistant: {
          intent: 'table_crud_form',
          confidence: 0.86,
          notes: [
            'El formulario no escribe directo a la tabla.',
            'El submit llama un Dynamic Service companion con writeMap validado por backend.',
            'Los controles se infieren desde tipos y relaciones visibles del catálogo.'
          ],
          semanticChecks: [
            `Tabla real usada: ${tableName}`,
            ...fields
              .filter((field) => field['type'] === 'select' || field['type'] === 'toggle')
              .map((field) => `${field['key']}: ${field['type']}`)
          ]
        }
      },
      tests: [
        {
          name: `Crear registro en ${tableName}`,
          input: Object.fromEntries(documentFields.map((field) => [field.key, field.example ?? 'test']))
        }
      ]
    };
  }

  private wantsWideFormFields(prompt: string) {
    return /campos?\s+a\s+lo\s+ancho|a\s+lo\s+ancho|ancho\s+completo|full\s+width|una\s+columna|campos?\s+anchos/.test(
      prompt
    );
  }

  private withWideFieldLayout(field: Record<string, unknown> & { key: string; example?: unknown }) {
    const layout = this.asRecord(field['layout']);
    return {
      ...field,
      layout: {
        ...layout,
        desktop: 'full',
        tablet: 'full',
        mobile: 'full',
        maxWidth: 'full'
      }
    };
  }

  private schemaColumnsFromPrompt(prompt: string) {
    const raw = this.schemaColumnsPromptSegment(prompt);
    const parts = this.schemaColumnPartsFromSegment(raw);
    const seen = new Set<string>();
    return parts
      .map((part) => this.schemaColumnFromPromptPart(part))
      .filter((column): column is NonNullable<ReturnType<typeof this.schemaColumnFromPromptPart>> => Boolean(column))
      .filter((column) => {
        if (seen.has(column.name)) {
          return false;
        }
        seen.add(column.name);
        return true;
      })
      .slice(0, 20);
  }

  private schemaColumnPartsFromSegment(raw: string) {
    const normalized = raw
      .replace(/^\s*(?:son|son:|son los|son las|ser[aá]n|incluyen|incluye|son\s+los\s+campos?)\s+/i, '')
      .replace(/\s+campos?\s+a\s+lo\s+ancho\b.*$/i, '')
      .replace(/\s+a\s+lo\s+ancho\b.*$/i, '')
      .replace(/\s+ancho\s+completo\b.*$/i, '')
      .trim();
    if (!normalized) {
      return [];
    }

    if (/,|;|\sy\s|\sand\s/i.test(normalized)) {
      return normalized
        .split(/,|;|\sy\s|\sand\s/gi)
        .map((part) => part.trim())
        .filter(Boolean);
    }

    const typeWords = new Set([
      'string',
      'texto',
      'text',
      'boolean',
      'bool',
      'decimal',
      'money',
      'integer',
      'entero',
      'numero',
      'número',
      'date',
      'datetime',
      'json',
      'uuid'
    ]);
    const stopWords = new Set([
      'son',
      'el',
      'la',
      'los',
      'las',
      'un',
      'una',
      'campo',
      'campos',
      'columna',
      'columnas',
      'a',
      'lo',
      'ancho',
      'full',
      'width',
      'guardar',
      'guarda',
      'salvar',
      'grabar',
      'boton',
      'boto',
      'button',
      'verde',
      'azul',
      'rojo'
    ]);
    const words = normalized
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word && !stopWords.has(this.normalizeKey(word)));
    const parts: string[] = [];

    for (let index = 0; index < words.length; index += 1) {
      const current = words[index];
      const next = words[index + 1];
      const normalizedNext = this.normalizeKey(next ?? '');
      if (next && typeWords.has(normalizedNext) && this.normalizeKey(current) !== normalizedNext) {
        parts.push(`${current} ${next}`);
        index += 1;
        continue;
      }
      parts.push(current);
    }

    return parts;
  }

  private schemaColumnFromPromptPart(part: string) {
    const cleaned = part
      .replace(/\b(obligatorio|required|requerido|nullable|opcional|optional|campo|columna)\b/gi, ' ')
      .replace(/\b(un|una|el|la|los|las)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const name = this.normalizeKey(cleaned.split(/\s+/)[0] ?? '');
    if (!name || ['id', 'tenantid', 'createdat', 'updatedat', 'deletedat', 'passwordhash'].includes(name.toLowerCase())) {
      return null;
    }
    const lower = part.toLowerCase();
    const required = /\bobligatorio|required|requerido\b/.test(lower);
    const nullable = /\bopcional|optional|nullable\b/.test(lower) ? true : !required;
    const type = this.schemaTypeFromPromptPart(name, lower);
    const column: {
      name: string;
      type: 'string' | 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'json' | 'uuid';
      length?: number;
      precision?: number;
      scale?: number;
      nullable?: boolean;
      defaultValue?: string | number | boolean | null;
    } = { name, type, nullable };

    if (type === 'string') {
      column.length = /email|correo/.test(name) ? 180 : 160;
    }
    if (type === 'decimal') {
      column.precision = 12;
      column.scale = 2;
    }
    if (type === 'boolean' && /activo|active|enabled|habilitado/.test(name)) {
      column.defaultValue = true;
      column.nullable = false;
    }
    return column;
  }

  private schemaColumnsPromptSegment(prompt: string) {
    const match = prompt.match(/(?:campos?|fields?)\s+([^\n\r]+)/i);
    if (!match?.[1]) {
      return '';
    }

    return match[1]
      .replace(/^\s*(?:son|son:|son los|son las|ser[aá]n|incluyen|incluye)\s+/i, '')
      .replace(/\b(?:con\s+)?(?:un|una)\s+(comentario|observaci[oó]n|nota)\b/gi, ', $1')
      .replace(/\s+(?:y\s+)?(?:guardar|guarda|salvar|grabar)\b.*$/i, '')
      .replace(/\s+y\s+(?:un\s+|una\s+|el\s+|la\s+)?(?:bot[oó]n|boto|button)\b.*$/i, '')
      .replace(/\s+(?:con\s+)?(?:un\s+|una\s+|el\s+|la\s+)?(?:bot[oó]n|boto|button)\b.*$/i, '')
      .trim();
  }

  private schemaTypeFromPromptPart(name: string, text: string): 'string' | 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'json' | 'uuid' {
    if (/json|metadata|config/.test(text)) {
      return 'json';
    }
    if (/uuid|guid/.test(text) || /id$/.test(name)) {
      return 'uuid';
    }
    if (/boolean|bool|switch|toggle|activo|active|habilitado|enabled|sí\/no|si\/no/.test(text)) {
      return 'boolean';
    }
    if (/decimal|money|monto|precio|valor|currency/.test(text)) {
      return 'decimal';
    }
    if (/integer|entero|numero|número|cantidad|int\b/.test(text)) {
      return 'integer';
    }
    if (/datetime|fecha hora|fecha_hora/.test(text)) {
      return 'datetime';
    }
    if (/\bdate\b|fecha/.test(text)) {
      return 'date';
    }
    if (/texto largo|textarea|descripcion|descripción|observaciones|nota|comentario/.test(text)) {
      return 'text';
    }
    return 'string';
  }

  private formCatalogTypeFromSchemaType(type: string) {
    const map: Record<string, string> = {
      string: 'varchar',
      text: 'text',
      integer: 'int',
      decimal: 'decimal',
      boolean: 'boolean',
      date: 'date',
      datetime: 'datetime',
      json: 'json',
      uuid: 'varchar'
    };
    return map[type] ?? 'varchar';
  }

  private formInternalCrudServiceAction(options: {
    key: string;
    name: string;
    description: string;
    tableName: string;
    intent: 'query' | 'create' | 'update' | 'delete';
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    resultKind: 'single' | 'list' | 'none';
    writeMap?: Record<string, string>;
    filters?: Array<Record<string, unknown>>;
  }): ApplyDynamicServiceJsonAction {
    return {
      type: 'apply_dynamic_service_json',
      label: 'Crear y publicar servicio companion',
      key: options.key,
      name: options.name,
      description: options.description,
      publish: true,
      document: {
        intent: options.intent,
        source: 'internal_table',
        resultKind: options.resultKind,
        pagination: { enabled: false },
        effects: [{ type: 'show_response' }],
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: options.tableName,
          filters: options.filters ?? [],
          writeMap: options.writeMap ?? {}
        },
        method: options.method,
        url: `internal://table/${options.tableName}`,
        headers: {},
        query: {},
        body: null,
        timeoutMs: 8000,
        retry: { attempts: 0, backoffMs: 0 },
        responseMap: {}
      }
    };
  }

  private primaryTableColumn(table: NonNullable<AssistantFormScreenState['tables']>[number]) {
    return table.columns?.find((column) => column.primary)?.name ?? table.columns?.find((column) => column.name === 'id')?.name;
  }

  private formTableFromPrompt(prompt: string, state: AssistantFormScreenState | null) {
    const tables = state?.tables?.filter((table) => table.name) ?? [];
    if (!tables.length) {
      return null;
    }

    const explicit = this.formExplicitTableNameFromPrompt(prompt);
    if (explicit) {
      const normalizedExplicit = this.normalizeKey(explicit);
      const exact = tables.find((table) => this.normalizeKey(table.name ?? '') === normalizedExplicit);
      if (exact) {
        return exact;
      }
    }

    return (
      tables.find((table) => {
        const tableName = table.name ?? '';
        return prompt.includes(tableName.toLowerCase()) || prompt.includes(this.formReadableName(tableName).toLowerCase());
      }) ?? null
    );
  }

  private formExistingTableMismatch(
    table: NonNullable<AssistantFormScreenState['tables']>[number],
    requestedColumns: ReturnType<typeof this.schemaColumnsFromPrompt>
  ) {
    const existing = new Map((table.columns ?? []).map((column) => [this.normalizeKey(column.name ?? ''), column]));
    const missing: string[] = [];
    const typeMismatches: string[] = [];

    for (const requested of requestedColumns) {
      const column = existing.get(this.normalizeKey(requested.name));
      if (!column) {
        missing.push(requested.name);
        continue;
      }

      const existingType = this.formSchemaTypeFromCatalogType(String(column.type ?? ''));
      if (existingType && existingType !== requested.type) {
        typeMismatches.push(`${requested.name}: existe ${existingType}, pedido ${requested.type}`);
      }
    }

    return { missing, typeMismatches };
  }

  private incompatibleExistingTableResponse(
    tableName: string,
    mismatch: { missing: string[]; typeMismatches: string[] }
  ): Pick<AiAssistantResponse, 'message' | 'suggestions'> {
    return {
      message: [
        `Interpretación: quieres crear un CRUD para ${tableName}, pero esa tabla ya existe.`,
        `Revisión: la tabla existente no coincide con los campos pedidos.`,
        mismatch.missing.length ? `Faltan columnas: ${mismatch.missing.join(', ')}.` : '',
        mismatch.typeMismatches.length ? `Tipos distintos: ${mismatch.typeMismatches.join(', ')}.` : '',
        'No voy a generar un formulario conectado a una tabla incompatible porque el submit podría guardar en records o fallar contra el servicio.',
        'Siguiente paso: ajusta la tabla desde Base de datos, elimínala/recréala si estás en local, o usa otro nombre de tabla.'
      ]
        .filter(Boolean)
        .join('\n'),
      suggestions: [
        `abrir base de datos y ajustar ${tableName}`,
        `crear tabla ${tableName.replace(/^custom_/, '')}_2 con los campos pedidos`
      ]
    };
  }

  private formSchemaTypeFromCatalogType(type: string) {
    const normalized = type.toLowerCase();
    if (/date/.test(normalized) && !/datetime|timestamp/.test(normalized)) {
      return 'date';
    }
    if (/datetime|timestamp/.test(normalized)) {
      return 'datetime';
    }
    if (/tinyint|boolean|bool/.test(normalized)) {
      return 'boolean';
    }
    if (/int/.test(normalized)) {
      return 'integer';
    }
    if (/decimal|float|double/.test(normalized)) {
      return 'decimal';
    }
    if (/json/.test(normalized)) {
      return 'json';
    }
    if (/text|varchar|char/.test(normalized)) {
      return 'string';
    }
    return '';
  }

  private formFieldsFromTable(
    table: NonNullable<AssistantFormScreenState['tables']>[number],
    tables: NonNullable<AssistantFormScreenState['tables']> = []
  ) {
    return (table.columns ?? [])
      .filter((column) => this.isFormEditableTableColumn(column.name ?? ''))
      .slice(0, 14)
      .map((column) => {
        const columnName = column.name ?? '';
        return this.decorateTableFormField(
          this.formField(
            columnName,
            this.formReadableName(columnName),
            this.fieldTypeFromColumn(columnName, column.type),
            column.nullable === false,
            this.placeholderFromColumn(columnName),
            this.exampleFromColumn(columnName, column.type)
          ),
          columnName,
          column.type,
          tables
        );
      });
  }

  private decorateTableFormField(
    field: Record<string, unknown> & { key: string; example?: unknown },
    columnName: string,
    type = '',
    tables: NonNullable<AssistantFormScreenState['tables']> = []
  ) {
    const normalized = `${columnName} ${type}`.toLowerCase();
    const config = this.asRecord(field['config']);

    if (/^systemrole$/i.test(columnName)) {
      return {
        ...field,
        type: 'select',
        placeholder: 'Selecciona rol',
        options: [
          { label: 'Owner', value: 'owner' },
          { label: 'Admin', value: 'admin' },
          { label: 'Operator', value: 'operator' },
          { label: 'Viewer', value: 'viewer' },
          { label: 'Cliente app', value: 'client' }
        ],
        config: {
          ...config,
          defaultValue: 'viewer',
          help: 'Rol de sistema usado por seguridad. Puedes cambiarlo antes de guardar.'
        },
        example: 'viewer'
      };
    }

    const relatedTable = this.relatedLookupTableForColumn(columnName, tables);
    if (relatedTable) {
      const valueColumn = this.lookupValueColumn(relatedTable);
      const labelColumn = this.lookupLabelColumn(relatedTable);
      return {
        ...field,
        type: 'select',
        placeholder: `Selecciona ${this.formReadableName(columnName).toLowerCase()}`,
        dataSource: {
          type: 'dynamic_service',
          bindingType: 'options',
          serviceKey: `listar_${this.normalizeKey(relatedTable.name ?? '')}`,
          sourceTable: relatedTable.name,
          labelPath: labelColumn,
          valuePath: valueColumn,
          cache: { ttlSeconds: 60 },
          timeoutMs: 8000
        },
        config: {
          ...config,
          help: `Opciones cargadas desde ${relatedTable.name}.`
        },
        example: valueColumn === 'key' ? this.normalizeKey(relatedTable.name ?? 'opcion') : 'uuid-relacionado'
      };
    }

    if (field['type'] === 'toggle' || /bool|tinyint|active|enabled|activo|habilitado/.test(normalized)) {
      const defaultValue = /active|enabled|activo|habilitado/.test(normalized) ? true : false;
      return {
        ...field,
        type: 'toggle',
        config: {
          ...config,
          defaultValue
        },
        example: defaultValue
      };
    }

    return field;
  }

  private relatedLookupTableForColumn(
    columnName: string,
    tables: NonNullable<AssistantFormScreenState['tables']> = []
  ) {
    if (!/id$/i.test(columnName) || /^id$/i.test(columnName) || /^tenantid$/i.test(columnName)) {
      return null;
    }

    const base = columnName.replace(/id$/i, '');
    const candidates = this.relatedTableNameCandidates(base);
    return tables.find((table) => candidates.includes(this.normalizeKey(table.name ?? ''))) ?? null;
  }

  private relatedTableNameCandidates(base: string) {
    const normalized = this.normalizeKey(base);
    const candidates = new Set([normalized, this.normalizeKey(`${base}s`), this.normalizeKey(`${base}es`)]);
    if (/y$/i.test(base)) {
      candidates.add(this.normalizeKey(`${base.slice(0, -1)}ies`));
    }
    return [...candidates].filter(Boolean);
  }

  private lookupValueColumn(table: NonNullable<AssistantFormScreenState['tables']>[number]) {
    return table.columns?.find((column) => column.primary)?.name ?? table.columns?.find((column) => column.name === 'id')?.name ?? 'id';
  }

  private lookupLabelColumn(table: NonNullable<AssistantFormScreenState['tables']>[number]) {
    const columns = table.columns ?? [];
    return (
      columns.find((column) => /^(name|label|title)$/i.test(column.name ?? ''))?.name ??
      columns.find((column) => /^(key|code|slug)$/i.test(column.name ?? ''))?.name ??
      this.lookupValueColumn(table)
    );
  }

  private formLookupServiceActions(
    fields: Array<Record<string, unknown>>,
    tables: NonNullable<AssistantFormScreenState['tables']> = []
  ): ApplyDynamicServiceJsonAction[] {
    const actions: ApplyDynamicServiceJsonAction[] = [];
    const seen = new Set<string>();

    for (const field of fields) {
      const dataSource = this.asRecord(field['dataSource']);
      const serviceKey = typeof dataSource['serviceKey'] === 'string' ? dataSource['serviceKey'] : '';
      const sourceTable = typeof dataSource['sourceTable'] === 'string' ? dataSource['sourceTable'] : '';
      if (!serviceKey || !sourceTable || seen.has(serviceKey)) {
        continue;
      }
      const table = tables.find((item) => item.name === sourceTable);
      if (!table) {
        continue;
      }
      seen.add(serviceKey);
      actions.push(
        this.formInternalCrudServiceAction({
          key: serviceKey,
          name: `Listar ${this.formReadableName(sourceTable)}`,
          description: `Lista opciones para seleccionar ${this.formReadableName(String(field['key'] ?? sourceTable))}.`,
          tableName: sourceTable,
          intent: 'query',
          method: 'GET',
          resultKind: 'list'
        })
      );
    }

    return actions;
  }

  private isFormEditableTableColumn(columnName: string) {
    return (
      Boolean(columnName) &&
      !/password|token|secret|hash/i.test(columnName) &&
      !['id', 'tenantId', 'tenant_id', 'createdAt', 'created_at', 'updatedAt', 'updated_at'].includes(columnName)
    );
  }

  private fieldTypeFromColumn(columnName: string, type = '') {
    const normalized = `${columnName} ${type}`.toLowerCase();
    if (/email|correo|mail/.test(normalized)) {
      return 'email';
    }
    if (/phone|telefono|tel[eé]fono|celular|mobile/.test(normalized)) {
      return 'tel';
    }
    if (/url|link|website/.test(normalized)) {
      return 'url';
    }
    if (/date|fecha/.test(normalized) && /time|hora|datetime|timestamp/.test(normalized)) {
      return 'datetime';
    }
    if (/date|fecha/.test(normalized)) {
      return 'date';
    }
    if (/time|hora/.test(normalized)) {
      return 'time';
    }
    if (/amount|monto|price|precio|cost|costo|decimal|float|double/.test(normalized)) {
      return 'currency';
    }
    if (/int|number|cantidad|qty|count|total/.test(normalized)) {
      return 'number';
    }
    if (/bool|tinyint|active|enabled|activo|habilitado/.test(normalized)) {
      return 'toggle';
    }
    if (/description|descripcion|descripci[oó]n|notes|observaciones|comment|comentario|text|json/.test(normalized)) {
      return 'textarea';
    }
    return 'text';
  }

  private placeholderFromColumn(columnName: string) {
    if (/email|correo|mail/i.test(columnName)) {
      return 'cliente@empresa.com';
    }
    if (/phone|telefono|celular|mobile/i.test(columnName)) {
      return '+57 300 000 0000';
    }
    if (/active|enabled|activo|habilitado/i.test(columnName)) {
      return '';
    }
    return `Escribe ${this.formReadableName(columnName).toLowerCase()}`;
  }

  private exampleFromColumn(columnName: string, type = '') {
    const fieldType = this.fieldTypeFromColumn(columnName, type);
    if (fieldType === 'email') {
      return 'cliente@empresa.com';
    }
    if (fieldType === 'tel') {
      return '+573001112233';
    }
    if (fieldType === 'number') {
      return 1;
    }
    if (fieldType === 'currency') {
      return 100;
    }
    if (fieldType === 'toggle') {
      return true;
    }
    if (fieldType === 'date') {
      return '2026-07-14';
    }
    if (fieldType === 'datetime') {
      return '2026-07-14T09:00';
    }
    if (/key|slug|code|codigo|c[oó]digo/i.test(columnName)) {
      return this.normalizeKey(columnName || 'valor');
    }
    return 'Ejemplo';
  }

  private formReadableName(value: string) {
    return value
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private formServiceKeys(state: AssistantFormScreenState | null) {
    const keys =
      state?.availableServices
        ?.filter((service) => service.hasPublishedVersion !== false)
        .map((service) => service.key?.trim())
        .filter((key): key is string => Boolean(key)) ?? [];
    return keys.length ? keys : ['buscar_usuario', 'validar_cliente', 'guardar_formulario'];
  }

  private formSubmitAdjustmentFromPrompt(prompt: string, request?: AiAssistantRequest): ApplyDynamicFormJsonAction | null {
    const normalized = prompt.toLowerCase();
    const state = this.formScreenState(request?.screenState);
    const schema = this.asRecord(state?.schema);
    if (!Object.keys(schema).length) {
      return null;
    }
    const submitRequested =
      /al enviar|submit|acci[oó]n final|destino|guardar|guarde|iniciar sesi[oó]n|inicie sesi[oó]n|sesi[oó]n|login|logueo|auth|servicio|flow|record|naveg/.test(
        normalized
      );
    if (!submitRequested || /bot[oó]n|color|ancho|largo|tama[nñ]o|centr|aline|tema|oscuro|claro|material|primeng|ionic/.test(normalized)) {
      return null;
    }

    const document = JSON.parse(JSON.stringify(schema)) as Record<string, unknown>;
    const runtime = this.asRecord(document['runtime']);
    const fields = this.formFieldsFromSchema(document);
    const serviceKeys = this.formServiceKeys(state);
    const flowKeys = this.formFlowKeys(state);
    const route = this.routeFromPrompt(normalized) ?? '/home';

    if (this.isAuthLoginPrompt(normalized) || /inicie sesi[oó]n|\bauth\b|autentic/.test(normalized)) {
      const userField =
        this.findFormFieldKey(fields, ['usuario', 'username', 'email', 'correo', 'mail']) ??
        fields.find((field) => field.type === 'email')?.key ??
        fields[0]?.key ??
        'usuario';
      const passwordField =
        this.findFormFieldKey(fields, ['password', 'contraseña', 'contrasena', 'clave']) ??
        fields.find((field) => field.type === 'password')?.key ??
        'password';
      runtime['submitLabel'] = 'Iniciar sesion';
      document['runtime'] = runtime;
      document['persistence'] = { mode: 'auth', defaultTarget: { type: 'dynamic_service', serviceKey: 'auth.login' } };
      document['actions'] = [this.authLoginAction(userField, passwordField, route, 'Credenciales incorrectas')];
      return this.formSubmitAdjustmentAction(document, state, 'Ajustar acción final a login');
    }

    if (/flow|flujo|proceso/.test(normalized)) {
      const flowKey = this.targetKeyFromPrompt(normalized, flowKeys) ?? flowKeys[0] ?? '';
      document['persistence'] = { mode: 'flow', defaultTarget: { type: 'flow', flowKey } };
      document['actions'] = [{ event: 'onSubmit', type: 'execute_flow', flowKey, payloadMap: { input: '{{input}}' } }];
      return this.formSubmitAdjustmentAction(document, state, 'Ajustar acción final a flow');
    }

    if (/servicio|service/.test(normalized)) {
      const serviceKey = this.targetKeyFromPrompt(normalized, serviceKeys) ?? serviceKeys[0] ?? '';
      document['persistence'] = { mode: 'service', defaultTarget: { type: 'dynamic_service', serviceKey } };
      document['actions'] = [{ event: 'onSubmit', type: 'execute_service', serviceKey, payloadMap: { input: '{{input}}' } }];
      return this.formSubmitAdjustmentAction(document, state, 'Ajustar acción final a servicio');
    }

    if (/record|registro|guardar|guarde|captur/.test(normalized)) {
      const key = String(document['key'] ?? state?.draft?.key ?? 'formulario');
      const recordType = this.normalizeKey(this.recordTypeFromPrompt(normalized) ?? key);
      document['persistence'] = { mode: 'record', defaultTarget: { type: 'record', recordType } };
      document['actions'] = [{ event: 'onSubmit', type: 'create_record', recordType, payloadMap: { input: '{{input}}' } }];
      return this.formSubmitAdjustmentAction(document, state, 'Ajustar acción final a record');
    }

    return null;
  }

  private formSubmitAdjustmentAction(
    document: Record<string, unknown>,
    state: AssistantFormScreenState | null,
    label: string
  ): ApplyDynamicFormJsonAction {
    return {
      type: 'apply_dynamic_form_json',
      label,
      key: String(document['key'] ?? state?.selected?.key ?? state?.draft?.key ?? 'formulario'),
      name: String(document['title'] ?? state?.selected?.title ?? state?.draft?.title ?? 'Formulario'),
      description: String(document['description'] ?? state?.draft?.description ?? ''),
      publish: false,
      document
    };
  }

  private formFieldsFromSchema(schema: Record<string, unknown>) {
    const steps = Array.isArray(schema['steps']) ? (schema['steps'] as Array<Record<string, unknown>>) : [];
    return steps
      .flatMap((step) => {
        const fields = Array.isArray(step['fields']) ? (step['fields'] as Array<Record<string, unknown>>) : [];
        return fields.map((field) => ({
          key: String(field['key'] ?? field['name'] ?? ''),
          type: String(field['type'] ?? ''),
          label: String(field['label'] ?? '')
        }));
      })
      .filter((field) => field.key);
  }

  private findFormFieldKey(fields: Array<{ key: string; type: string; label: string }>, candidates: string[]) {
    const normalizedCandidates = candidates.map((candidate) => this.normalizeKey(candidate));
    return fields.find((field) => {
      const key = this.normalizeKey(field.key);
      const label = this.normalizeKey(field.label);
      return normalizedCandidates.some((candidate) => key === candidate || label === candidate || key.includes(candidate));
    })?.key;
  }

  private authLoginAction(userField: string, passwordField: string, successRoute: string, errorMessage: string) {
    return {
      event: 'onSubmit',
      type: 'execute_service',
      serviceKey: 'auth.login',
      resultKey: 'session',
      payloadMap: {
        username: `{{input.${userField}}}`,
        password: `{{input.${passwordField}}}`
      },
      onSuccess: [
        { type: 'set_session', from: '{{result}}' },
        { type: 'navigate', to: successRoute }
      ],
      onError: [{ type: 'show_message', tone: 'danger', message: errorMessage }]
    };
  }

  private routeFromPrompt(prompt: string) {
    const match = prompt.match(/(?:ruta|ir a|navegar a|redirigir a)\s+(\/[a-z0-9_/-]+)/i);
    return match?.[1];
  }

  private recordTypeFromPrompt(prompt: string) {
    const match = prompt.match(/(?:record|registro|tipo)\s+([a-z0-9_]+)/i);
    return match?.[1];
  }

  private targetKeyFromPrompt(prompt: string, keys: string[]) {
    return keys.find((key) => prompt.includes(key.toLowerCase()));
  }

  private normalizeKey(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private formVisualAdjustmentFromPrompt(prompt: string, request?: AiAssistantRequest): ApplyDynamicFormJsonAction | null {
    const normalized = prompt.toLowerCase();
    if (this.isNewFormDefinitionPrompt(normalized)) {
      return null;
    }
    if (!/centr|aline|ancho|amplio|full|bot[oó]n|color|azul|verde|rojo|tema|oscuro|claro|material|primeng|ionic|bootstrap|nora|lara|chicle/.test(normalized)) {
      return null;
    }
    const state = this.formScreenState(request?.screenState);
    const current = state?.schema;
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return null;
    }

    const document = JSON.parse(JSON.stringify(current)) as Record<string, unknown>;
    const layout = this.asRecord(document['layout']);
    const form = this.asRecord(layout['form']);
    const desktop = this.asRecord(layout['desktop']);
    const tablet = this.asRecord(layout['tablet']);
    const mobile = this.asRecord(layout['mobile']);
    const desktopActions = this.asRecord(desktop['actions']);
    const tabletActions = this.asRecord(tablet['actions']);
    const mobileActions = this.asRecord(mobile['actions']);
    const presentation = this.asRecord(document['presentation']);
    const tokens = this.asRecord(presentation['tokens']);
    const buttonPrimary = this.asRecord(tokens['buttonPrimary']);

    if (/centr|centro/.test(normalized)) {
      form['align'] = 'center';
    }
    if (/izquierda/.test(normalized)) {
      form['align'] = 'left';
    }
    if (/derecha/.test(normalized)) {
      form['align'] = 'right';
    }
    if (/ancho completo|todo el ancho|full width|estirar/.test(normalized)) {
      form['width'] = 'full';
      form['align'] = 'stretch';
    } else if (/ancho|amplio|wide/.test(normalized) && /formulario|pantalla|contenedor/.test(normalized)) {
      form['width'] = 'wide';
    } else if (/compact|peque[nñ]o|login/.test(normalized)) {
      form['width'] = 'compact';
    }

    if (/bot[oó]n/.test(normalized)) {
      const affectedActions = [
        ...(/m[oó]vil|mobile/.test(normalized) ? [mobileActions] : []),
        ...(/tablet/.test(normalized) ? [tabletActions] : []),
        ...(/web|desktop|escritorio/.test(normalized) ? [desktopActions] : [])
      ];
      const targets = affectedActions.length ? affectedActions : [desktopActions, tabletActions, mobileActions];
      const fieldWidthRequested =
        /mismo tama[nñ]o|igual que (?:los )?(?:inputs|campos)|tama[nñ]o de (?:los )?(?:inputs|campos)/.test(normalized) ||
        /(?:ancho|largo)\s+(?:de|igual a|igual que|como)\s+(?:los )?(?:inputs|campos|campos de input)/.test(normalized) ||
        /(?:al|a lo largo de)\s+(?:los )?(?:inputs|campos|campos de input)/.test(normalized);
      if (fieldWidthRequested) {
        targets.forEach((actions) => {
          actions['align'] = 'center';
          actions['size'] = 'field';
        });
      }
      if (!fieldWidthRequested && /ancho|amplio|completo|full|grande/.test(normalized)) {
        targets.forEach((actions) => {
          actions['align'] = 'stretch';
          actions['size'] = 'full';
        });
      }
      if (/bot[oó]n.{0,32}(centr|centro)|bot[oó]n al centro/.test(normalized)) {
        targets.forEach((actions) => {
          actions['align'] = 'center';
        });
      }
      if (/derecha/.test(normalized)) {
        targets.forEach((actions) => {
          actions['align'] = 'right';
        });
      }
      if (/abajo|fijo|sticky/.test(normalized)) {
        targets.forEach((actions) => {
          actions['position'] = 'bottom_sticky';
        });
      }
      if (/footer|pie/.test(normalized)) {
        targets.forEach((actions) => {
          actions['position'] = 'footer';
        });
      }
    }

    const tone = this.buttonToneFromPrompt(normalized);
    if (tone) {
      buttonPrimary['background'] = tone;
      buttonPrimary['text'] = 'primaryContrast';
      buttonPrimary['radius'] = buttonPrimary['radius'] || 'md';
    }

    const kit = this.formKitFromPrompt(normalized);
    if (kit) {
      presentation['kit'] = kit;
    }
    const theme = this.formThemeFromPrompt(normalized);
    if (theme) {
      presentation['theme'] = theme;
    }
    if (/oscuro|dark/.test(normalized)) {
      presentation['themeMode'] = 'dark';
    }
    if (/\bclaro\b|light/.test(normalized)) {
      presentation['themeMode'] = 'light';
    }
    if (/sistema|system/.test(normalized)) {
      presentation['themeMode'] = 'system';
    }

    desktop['actions'] = desktopActions;
    tablet['actions'] = tabletActions;
    mobile['actions'] = mobileActions;
    layout['form'] = form;
    layout['desktop'] = desktop;
    layout['tablet'] = tablet;
    layout['mobile'] = mobile;
    tokens['buttonPrimary'] = buttonPrimary;
    presentation['tokens'] = tokens;
    document['layout'] = layout;
    document['presentation'] = presentation;

    return {
      type: 'apply_dynamic_form_json',
      label: 'Aplicar ajuste visual al formulario',
      key: String(document['key'] ?? state?.selected?.key ?? state?.draft?.key ?? 'formulario'),
      name: String(document['title'] ?? state?.selected?.title ?? state?.draft?.title ?? 'Formulario'),
      description: String(document['description'] ?? state?.draft?.description ?? ''),
      publish: false,
      document
    };
  }

  private buttonToneFromPrompt(prompt: string) {
    if (/azul|blue|primario|primary/.test(prompt)) {
      return 'primary';
    }
    if (/verde|green|success|exito|éxito/.test(prompt)) {
      return 'success';
    }
    if (/rojo|red|danger|peligro/.test(prompt)) {
      return 'danger';
    }
    if (/gris|neutral|negro/.test(prompt)) {
      return 'neutral';
    }
    if (/secundario|secondary/.test(prompt)) {
      return 'secondary';
    }
    return '';
  }

  private formKitFromPrompt(prompt: string) {
    if (/primeng|prime/.test(prompt)) {
      return 'primeng';
    }
    if (/ionic/.test(prompt)) {
      return 'ionic';
    }
    if (/nativo|native/.test(prompt)) {
      return 'native';
    }
    if (/auto|autom[aá]tico/.test(prompt)) {
      return 'auto';
    }
    return '';
  }

  private formThemeFromPrompt(prompt: string) {
    if (/material/.test(prompt)) {
      return 'material';
    }
    if (/lara/.test(prompt)) {
      return 'lara';
    }
    if (/nora/.test(prompt)) {
      return 'nora';
    }
    if (/bootstrap/.test(prompt)) {
      return 'bootstrap';
    }
    if (/chicle|aura/.test(prompt)) {
      return 'chicle';
    }
    return '';
  }

  private formIntentFromPrompt(prompt: string): DynamicFormIntent {
    const wantsMobile = /m[oó]vil|mobile|celular|app/.test(prompt);
    const wantsOffline = /offline|sin conexi[oó]n|cola/.test(prompt);
    const wantsFlow = /\bflow\b|flujo|proceso/.test(prompt);
    const wantsHybrid = /record.*servicio|guardar.*servicio|record.*flow|guardar.*flow|h[ií]brido/.test(prompt);
    const explicitKey = this.formExplicitKeyFromPrompt(prompt);

    if (this.isAuthLoginPrompt(prompt)) {
      return {
        kind: 'auth_login',
        key: wantsMobile ? 'login_movil' : 'login',
        title: 'Iniciar sesion',
        description: wantsMobile
          ? 'Permite iniciar sesion desde la app movil con credenciales.'
          : 'Permite iniciar sesion con credenciales.',
        category: 'seguridad',
        submitLabel: 'Iniciar sesion',
        persistenceMode: 'auth',
        confidence: 0.92,
        notes: ['Arquetipo auth_login: no guarda record y ejecuta autenticacion.'],
        wantsService: true,
        wantsFlow: false,
        wantsHybrid: false,
        offline: false,
        forceMobile: wantsMobile
      };
    }

    if (/inspecci[oó]n|gps|evidencia/.test(prompt)) {
      return {
        kind: 'inspection_mobile',
        key: 'inspeccion_operativa',
        title: 'Inspeccion Operativa',
        description: 'Captura datos de inspeccion con evidencias y soporte movil.',
        category: 'operaciones',
        submitLabel: 'Guardar inspeccion',
        persistenceMode: wantsHybrid ? 'hybrid' : wantsFlow ? 'flow' : 'record',
        confidence: 0.88,
        notes: ['Arquetipo inspection_mobile: foto/GPS pueden ser obligatorios y offline queda activo.'],
        wantsService: /servicio|validar|consulta/.test(prompt),
        wantsFlow,
        wantsHybrid,
        offline: true,
        forceMobile: true
      };
    }

    if (/aprobaci[oó]n|aprobar|rechazar/.test(prompt)) {
      return {
        kind: 'approval',
        key: 'aprobacion_solicitud',
        title: 'Aprobacion Solicitud',
        description: 'Recolecta datos de una solicitud y permite aprobar o rechazar.',
        category: 'aprobaciones',
        submitLabel: 'Enviar decisión',
        persistenceMode: wantsHybrid ? 'hybrid' : 'flow',
        confidence: 0.86,
        notes: ['Arquetipo approval: agrega comandos aprobar/rechazar.'],
        wantsService: !wantsFlow,
        wantsFlow: true,
        wantsHybrid,
        offline: wantsOffline,
        forceMobile: wantsMobile
      };
    }

    if (wantsFlow) {
      return {
        kind: 'custom_capture',
        key: 'formulario_flow',
        title: 'Formulario Flow',
        description: 'Captura datos y ejecuta un flow al enviar.',
        category: 'procesos',
        submitLabel: 'Ejecutar flow',
        persistenceMode: wantsHybrid ? 'hybrid' : 'flow',
        confidence: 0.8,
        notes: ['Arquetipo flow-backed: usa flow como accion final.'],
        wantsService: /servicio|select|lista/.test(prompt),
        wantsFlow: true,
        wantsHybrid,
        offline: wantsOffline,
        forceMobile: wantsMobile
      };
    }

    if (/consulta|buscar|validar|servicio/.test(prompt) && !/guardar|crear record|record/.test(prompt)) {
      return {
        kind: 'lookup',
        key: 'consulta_dinamica',
        title: 'Consulta Dinamica',
        description: 'Captura criterios y ejecuta una consulta o validacion dinamica.',
        category: 'consultas',
        submitLabel: 'Consultar',
        persistenceMode: 'service',
        confidence: 0.84,
        notes: ['Arquetipo lookup: usa servicio y no crea record por defecto.'],
        wantsService: true,
        wantsFlow: false,
        wantsHybrid: false,
        offline: wantsOffline,
        forceMobile: wantsMobile
      };
    }

    if (/evento/.test(prompt)) {
      return this.captureIntent('event_registration', 'registro_evento', 'Registro Evento', 'eventos', wantsMobile, wantsOffline, wantsHybrid);
    }
    if (/ticket/.test(prompt)) {
      return this.captureIntent('ticket_purchase', 'venta_ticket', 'Venta Ticket', 'tickets', wantsMobile, wantsOffline, wantsHybrid);
    }
    if (/inmobili|propiedad|inmueble/.test(prompt)) {
      return this.captureIntent('real_estate_lead', 'captura_inmueble', 'Captura Inmueble', 'inmobiliaria', wantsMobile, wantsOffline, wantsHybrid);
    }
    if (/perfil|actualizar usuario|editar usuario/.test(prompt)) {
      return this.captureIntent('profile_update', 'actualizacion_perfil', 'Actualizacion Perfil', 'usuarios', wantsMobile, wantsOffline, wantsHybrid);
    }
    if (/servicio|agenda|cita|solicitud/.test(prompt)) {
      return this.captureIntent('service_request', 'solicitud_servicio', 'Solicitud Servicio', 'servicios', wantsMobile, wantsOffline, wantsHybrid);
    }
    if (explicitKey) {
      return this.captureIntent(
        'custom_capture',
        explicitKey,
        this.formTitleFromKey(explicitKey),
        'personalizados',
        wantsMobile,
        wantsOffline,
        wantsHybrid
      );
    }

    return this.captureIntent('client_onboarding', 'onboarding_cliente', 'Onboarding Cliente', 'clientes', wantsMobile, wantsOffline, wantsHybrid);
  }

  private captureIntent(
    kind: DynamicFormIntentKind,
    key: string,
    title: string,
    category: string,
    forceMobile: boolean,
    offline: boolean,
    wantsHybrid = false
  ): DynamicFormIntent {
    return {
      kind,
      key,
      title,
      description:
        kind === 'client_onboarding'
          ? 'Captura y valida informacion del usuario desde web y movil.'
          : `Captura informacion para ${title.toLowerCase()} desde web y movil.`,
      category,
      submitLabel: 'Guardar',
      persistenceMode: wantsHybrid ? 'hybrid' : 'record',
      confidence: 0.78,
      notes: ['Arquetipo de captura: guarda record por defecto.'],
      wantsService: wantsHybrid,
      wantsFlow: false,
      wantsHybrid,
      offline,
      forceMobile
    };
  }

  private formFlowKeys(state: AssistantFormScreenState | null) {
    const keys =
      state?.availableFlows
        ?.filter((flow) => flow.hasPublishedVersion !== false)
        .map((flow) => flow.key?.trim())
        .filter((key): key is string => Boolean(key)) ?? [];
    return keys.length ? keys : ['flow_validar_cliente', 'flow_aprobacion'];
  }

  private formKeyFromPrompt(prompt: string) {
    const explicitKey = this.formExplicitKeyFromPrompt(prompt);
    if (explicitKey) {
      return explicitKey;
    }
    if (this.isAuthLoginPrompt(prompt)) {
      return /m[oó]vil|mobile|celular|app/.test(prompt) ? 'login_movil' : 'login';
    }
    if (/inspecci[oó]n/.test(prompt)) {
      return 'inspeccion_operativa';
    }
    if (/aprobaci[oó]n|aprobar/.test(prompt)) {
      return 'aprobacion_solicitud';
    }
    if (/consulta|buscar|validar/.test(prompt)) {
      return 'consulta_dinamica';
    }
    if (/evento/.test(prompt)) {
      return 'registro_evento';
    }
    if (/ticket/.test(prompt)) {
      return 'venta_ticket';
    }
    if (/inmobili|propiedad/.test(prompt)) {
      return 'captura_inmueble';
    }
    return 'onboarding_cliente';
  }

  private formExplicitKeyFromPrompt(prompt: string) {
    const match = prompt.match(
      /(?:formulario|form)\s+(?:(?:llamado|llamada|nombrado|nombrada|con\s+nombre|key)\s+)?([a-zA-Z0-9_]+)/i
    );
    const raw = this.normalizeKey(match?.[1] ?? '');
    const reserved = new Set([
      'de',
      'para',
      'que',
      'con',
      'los',
      'las',
      'un',
      'una',
      'crud',
      'nuevo',
      'nueva',
      'movil',
      'mobile',
      'inicio',
      'sesion',
      'login',
      'logueo',
      'cliente',
      'clientes',
      'usuario',
      'usuarios',
      'inspeccion',
      'personalizado',
      'personalizada',
      'campos',
      'campo'
    ]);
    return raw && !reserved.has(raw) ? raw : '';
  }

  private formTitleFromKey(key: string) {
    return key
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private formDescriptionFromPrompt(prompt: string) {
    if (this.isAuthLoginPrompt(prompt)) {
      return 'Permite iniciar sesion con credenciales.';
    }
    if (/inspecci[oó]n/.test(prompt)) {
      return 'Captura datos de inspección con evidencias y soporte móvil.';
    }
    if (/aprobaci[oó]n|aprobar/.test(prompt)) {
      return 'Recolecta datos de una solicitud y permite aprobar o rechazar.';
    }
    if (/consulta|buscar|validar/.test(prompt)) {
      return 'Captura criterios y ejecuta una consulta o validación dinámica.';
    }
    return 'Captura y valida información del usuario desde web y móvil.';
  }

  private isAuthLoginPrompt(prompt: string) {
    return /login|logueo|inicio de sesi[oó]n|iniciar sesi[oó]n|inicie sesi[oó]n|autentic|ingresar|acceso|usuario y contrase[nñ]a|contrase[nñ]a.*usuario/.test(
      prompt
    );
  }

  private formFieldsFromPrompt(
    prompt: string,
    serviceKeys: string[],
    intent: DynamicFormIntent,
    tables: NonNullable<AssistantFormScreenState['tables']> = []
  ) {
    const fields: Array<Record<string, unknown> & { key: string; example?: unknown }> = [];
    const push = (field: Record<string, unknown> & { key: string; example?: unknown }) => {
      if (!fields.some((item) => item.key === field.key)) {
        fields.push(field);
      }
    };

    if (intent.kind === 'auth_login') {
      push(this.formField('usuario', 'Usuario', 'text', true, 'Usuario o correo', 'simon'));
      push(this.formField('password', 'Contraseña', 'password', true, 'Ingresa tu contraseña', 'secret'));
      return fields;
    }

    const explicitColumns = this.schemaColumnsFromPrompt(prompt);
    if (explicitColumns.length) {
      explicitColumns.forEach((column) => {
        const type = this.formCatalogTypeFromSchemaType(column.type);
        const required = column.nullable === false || !/comentario|observaci[oó]n|nota|descripcion|descripci[oó]n/.test(column.name);
        push(
          this.decorateTableFormField(
            this.formField(
              column.name,
              this.formReadableName(column.name),
              this.fieldTypeFromColumn(column.name, type),
              required,
              this.placeholderFromColumn(column.name),
              this.exampleFromColumn(column.name, type)
            ),
            column.name,
            type,
            tables
          )
        );
      });
      return fields;
    }

    if (/nombre|cliente|usuario|persona|onboarding/.test(prompt)) {
      push(this.formField('nombre', 'Nombre', 'text', true, 'Escribe el nombre', 'Simon'));
    }
    if (/email|correo|mail|cliente|usuario|onboarding/.test(prompt)) {
      push(this.formField('email', 'Email', 'email', true, 'cliente@empresa.com', 'cliente@empresa.com'));
    }
    if (/tel[eé]fono|telefono|celular/.test(prompt)) {
      push(this.formField('telefono', 'Teléfono', 'tel', false, '+57 300 000 0000', '+573001112233'));
    }
    if (/documento|identificaci[oó]n|cedula|c[eé]dula|nit/.test(prompt)) {
      push(this.formField('documento', 'Documento', 'text', true, 'Número de documento', '123456789'));
    }
    if (/direcci[oó]n|direccion|domicilio/.test(prompt)) {
      push(this.formField('direccion', 'Dirección', 'text', false, 'Dirección principal', 'Calle 123'));
    }
    if (/password|contrase[nñ]a|clave/.test(prompt)) {
      push(this.formField('password', 'Password', 'password', true, 'Ingresa una contraseña', 'secret'));
    }
    if (/\burl\b|enlace|link|sitio web|website/.test(prompt)) {
      push(this.formField('url', 'URL', 'url', false, 'https://empresa.com', 'https://empresa.com'));
    }
    if (/edad|cantidad|n[uú]mero|numero|unidades|cupos/.test(prompt)) {
      push(this.formField('cantidad', 'Cantidad', 'number', false, '0', 1));
    }
    if (/serial|c[oó]digo|codigo|consulta|validar|buscar/.test(prompt)) {
      push(this.formField('serial', 'Serial', 'text', true, 'ABC-123', 'ABC-123'));
    }
    if (/monto|valor|precio|ticket|tarifa|costo/.test(prompt)) {
      push(this.formField('monto', 'Monto', 'currency', false, '0.00', 100));
    }
    if (/fecha|evento|visita/.test(prompt)) {
      push(this.formField('fecha', 'Fecha', 'date', true, '2026-07-11', '2026-07-11'));
    }
    if (/hora/.test(prompt)) {
      push(this.formField('hora', 'Hora', 'time', false, '09:00', '09:00'));
    }
    if (/fecha y hora|datetime|agenda|cita/.test(prompt)) {
      push(this.formField('fecha_hora', 'Fecha y hora', 'datetime', false, '2026-07-11T09:00', '2026-07-11T09:00'));
    }
    if (/estado|status|tipo|categor[ií]a|select|lista/.test(prompt)) {
      push({
        ...this.formField('estado', 'Estado', 'select', true, 'Selecciona estado', 'activo'),
        options: [
          { label: 'Activo', value: 'activo' },
          { label: 'Pendiente', value: 'pendiente' },
          { label: 'Cerrado', value: 'cerrado' }
        ]
      });
    }
    if (/servicio.*opciones|opciones.*servicio|select.*servicio|lista.*servicio/.test(prompt)) {
      push({
        ...this.formField('catalogo', 'Catálogo', 'select', true, 'Selecciona una opción', ''),
        dataSource: {
          type: 'dynamic_service',
          bindingType: 'options',
          event: 'onOpen',
          serviceKey: serviceKeys[0],
          payloadMap: { input: '{{input}}' },
          cache: { ttlSeconds: 60 },
          timeoutMs: 8000
        }
      });
    }
    if (/observaci[oó]n|comentario|nota|descripci[oó]n|inspecci[oó]n/.test(prompt)) {
      push(this.formField('observaciones', 'Observaciones', 'textarea', false, 'Escribe observaciones', 'Sin novedades'));
    }
    if (/foto|imagen|evidencia|inspecci[oó]n/.test(prompt)) {
      push(this.formField('foto', 'Foto', 'image', intent.kind === 'inspection_mobile', 'Adjunta una foto', ''));
    }
    if (/archivo|adjuntar documento|documento adjunto|subir documento|cargar documento/.test(prompt)) {
      push(this.formField('archivo', 'Archivo', 'file', false, 'Adjunta un archivo', ''));
    }
    if (/gps|ubicaci[oó]n|localizaci[oó]n|inspecci[oó]n/.test(prompt)) {
      push(this.formField('ubicacion', 'Ubicación', 'gps', intent.kind === 'inspection_mobile', '', ''));
    }
    if (/t[eé]rminos|terminos|acepta|aceptaci[oó]n|consentimiento/.test(prompt)) {
      push(this.formField('acepta_terminos', 'Acepta términos', 'checkbox', true, '', true));
    }
    if (/activo|habilitado|toggle|switch/.test(prompt)) {
      push(this.formField('activo', 'Activo', 'toggle', false, '', true));
    }
    if (/aprobar|aprobaci[oó]n|rechazar/.test(prompt)) {
      push({
        ...this.formField('decision', 'Decisión', 'radio', true, '', 'aprobar'),
        options: [
          { label: 'Aprobar', value: 'aprobar' },
          { label: 'Rechazar', value: 'rechazar' }
        ]
      });
      push(this.formField('comentario', 'Comentario', 'textarea', false, 'Explica la decisión', 'Aprobado'));
    }

    return fields.length
      ? fields
      : [
          this.formField('nombre', 'Nombre', 'text', true, 'Escribe el nombre', 'Simon'),
          this.formField('email', 'Email', 'email', true, 'cliente@empresa.com', 'cliente@empresa.com')
        ];
  }

  private formField(
    key: string,
    label: string,
    type: string,
    required: boolean,
    placeholder: string,
    example: unknown
  ): Record<string, unknown> & { key: string; example?: unknown } {
    return {
      key,
      name: key,
      type,
      label,
      required,
      placeholder,
      help: '',
      layout: {
        desktop: type === 'textarea' || type === 'image' || type === 'file' || type === 'gps' ? 'full' : 'half',
        tablet: 'full',
        mobile: 'full',
        maxWidth: type === 'textarea' || type === 'image' || type === 'file' || type === 'gps' ? 'full' : 'md'
      },
      config: {
        help: '',
        accept: type === 'image' ? 'image/*' : type === 'file' ? '*/*' : undefined,
        capture: type === 'image' ? 'environment' : undefined,
        currency: type === 'currency' ? 'COP' : undefined
      },
      example
    };
  }

  private formStepsFromFields(prompt: string, fields: Array<Record<string, unknown> & { key: string }>) {
    if (fields.length > 6 || /pasos|steps|m[oó]vil|inspecci[oó]n|aprobaci[oó]n/.test(prompt)) {
      const mid = Math.ceil(fields.length / 2);
      return [
        {
          key: 'datos_principales',
          title: /inspecci[oó]n/.test(prompt) ? 'Datos de inspección' : 'Datos principales',
          description: 'Información inicial para ejecutar el formulario.',
          fields: fields.slice(0, mid)
        },
        {
          key: /inspecci[oó]n/.test(prompt) ? 'evidencias' : 'detalle',
          title: /inspecci[oó]n/.test(prompt) ? 'Evidencias' : 'Detalle',
          description: 'Datos complementarios antes de enviar.',
          fields: fields.slice(mid)
        }
      ];
    }

    return [
      {
        key: 'principal',
        title: 'Principal',
        description: 'Completa la información requerida.',
        fields
      }
    ];
  }

  private formPersistence(options: {
    key: string;
    intent: DynamicFormIntent;
    serviceKey: string;
    flowKey: string;
  }) {
    if (options.intent.persistenceMode === 'auth') {
      return { mode: 'auth', defaultTarget: { type: 'dynamic_service', serviceKey: options.serviceKey } };
    }
    if (options.intent.persistenceMode === 'none') {
      return { mode: 'none' };
    }
    if (options.intent.wantsHybrid || options.intent.persistenceMode === 'hybrid') {
      return { mode: 'hybrid', defaultTarget: { type: 'record', recordType: options.key } };
    }
    if (options.intent.wantsFlow || options.intent.persistenceMode === 'flow') {
      return { mode: 'flow', defaultTarget: { type: 'flow', flowKey: options.flowKey } };
    }
    if (options.intent.wantsService || options.intent.persistenceMode === 'service') {
      return { mode: 'service', defaultTarget: { type: 'dynamic_service', serviceKey: options.serviceKey } };
    }
    return { mode: 'record', defaultTarget: { type: 'record', recordType: options.key } };
  }

  private formActions(options: {
    key: string;
    intent: DynamicFormIntent;
    serviceKey: string;
    flowKey: string;
  }) {
    if (options.intent.kind === 'auth_login') {
      return [this.authLoginAction('usuario', 'password', '/home', 'Credenciales incorrectas')];
    }
    if (options.intent.wantsHybrid || options.intent.persistenceMode === 'hybrid') {
      return [
        {
          event: 'onSubmit',
          type: 'create_record',
          recordType: options.key,
          resultKey: 'record',
          payloadMap: { input: '{{input}}' }
        },
        options.intent.wantsFlow
          ? {
              event: 'onSubmit',
              type: 'execute_flow',
              flowKey: options.flowKey,
              resultKey: 'flow',
              payloadMap: { input: '{{input}}', record: '{{steps.record}}' }
            }
          : {
              event: 'onSubmit',
              type: 'execute_service',
              serviceKey: options.serviceKey,
              resultKey: 'service',
              payloadMap: { input: '{{input}}' }
            }
      ];
    }
    if (options.intent.wantsFlow || options.intent.persistenceMode === 'flow') {
      return [{ event: 'onSubmit', type: 'execute_flow', flowKey: options.flowKey, payloadMap: { input: '{{input}}' } }];
    }
    if (options.intent.wantsService || options.intent.persistenceMode === 'service') {
      return [
        { event: 'onSubmit', type: 'execute_service', serviceKey: options.serviceKey, payloadMap: { input: '{{input}}' } }
      ];
    }
    return [{ event: 'onSubmit', type: 'create_record', recordType: options.key, payloadMap: { input: '{{input}}' } }];
  }

  private repairAndValidateFormDraft(
    document: Record<string, unknown>,
    intent: DynamicFormIntent,
    fields: Array<Record<string, unknown> & { key: string; example?: unknown }>
  ) {
    const checks: string[] = [];
    const runtime = this.asRecord(document['runtime']);
    const offline = this.asRecord(runtime['offline']);
    const persistence = this.asRecord(document['persistence']);
    const metadata = this.asRecord(document['metadata']);
    const assistant = this.asRecord(metadata['assistant']);
    const actions = Array.isArray(document['actions']) ? (document['actions'] as Array<Record<string, unknown>>) : [];
    const fieldKeys = new Set(fields.map((field) => field.key));

    if (intent.kind === 'auth_login') {
      document['category'] = 'seguridad';
      runtime['submitLabel'] = 'Iniciar sesion';
      offline['enabled'] = false;
      runtime['offline'] = offline;
      document['runtime'] = runtime;
      document['persistence'] = { mode: 'auth', defaultTarget: { type: 'dynamic_service', serviceKey: 'auth.login' } };
      document['actions'] = [this.authLoginAction('usuario', 'password', '/home', 'Credenciales incorrectas')];
      checks.push('Login detectado: no se crea record y se usa acción de autenticación.');
    }

    if (intent.kind === 'inspection_mobile') {
      for (const key of ['foto', 'ubicacion']) {
        if (fieldKeys.has(key)) {
          const field = fields.find((item) => item.key === key);
          if (field) {
            field['required'] = true;
          }
        }
      }
      offline['enabled'] = true;
      runtime['offline'] = offline;
      document['runtime'] = runtime;
      checks.push('Inspección detectada: evidencias/GPS requeridos y offline activo.');
    }

    if (intent.kind === 'lookup' && persistence['mode'] !== 'service') {
      document['persistence'] = {
        mode: 'service',
        defaultTarget: { type: 'dynamic_service', serviceKey: actions[0]?.['serviceKey'] ?? 'buscar_usuario' }
      };
      checks.push('Consulta detectada: se evita crear record por defecto.');
    }

    assistant['semanticChecks'] = checks;
    assistant['intent'] = intent.kind;
    assistant['confidence'] = intent.confidence;
    metadata['assistant'] = assistant;
    document['metadata'] = metadata;
  }

  private formCommand(key: string, label: string, type: string, serviceKey: string, flowKey: string) {
    return {
      key,
      label,
      placement: 'form_toolbar',
      style: key === 'aprobar' ? 'primary' : 'secondary',
      event: 'onClick',
      type,
      serviceKey: type === 'execute_service' ? serviceKey : undefined,
      flowKey: type === 'execute_flow' ? flowKey : undefined,
      payloadMap: type === 'show_message' ? undefined : { input: '{{input}}', command: key },
      action: {
        type,
        serviceKey: type === 'execute_service' ? serviceKey : undefined,
        flowKey: type === 'execute_flow' ? flowKey : undefined,
        payloadMap: type === 'show_message' ? undefined : { input: '{{input}}', command: key },
        resultKey: key
      },
      responseMode: type === 'show_message' ? 'show_response' : 'show_response',
      requiresValidForm: true
    };
  }

  private formDataSources(fields: Array<Record<string, unknown>>) {
    return fields
      .map((field) => this.asRecord(field['dataSource']))
      .filter((source) => source['type'] === 'dynamic_service' && typeof source['serviceKey'] === 'string');
  }

  private formIdempotencyKey(fields: Array<{ key: string }>) {
    if (fields.some((field) => field.key === 'email')) {
      return '{{input.email}}';
    }
    if (fields.some((field) => field.key === 'usuario')) {
      return '{{input.usuario}}';
    }
    if (fields.some((field) => field.key === 'serial')) {
      return '{{input.serial}}';
    }
    return '{{input.id}}';
  }

  private formSubmitSummary(document: Record<string, unknown>) {
    const actions = Array.isArray(document['actions']) ? (document['actions'] as Array<Record<string, unknown>>) : [];
    if (!actions.length) {
      return 'sin acción final';
    }
    return actions.map((action) => action['type']).join(' + ');
  }

  private flowAuthoringResponse(
    scope: AiAssistantScope,
    request: AiAssistantRequest
  ): Pick<AiAssistantResponse, 'message' | 'suggestions' | 'actions'> | null {
    if (scope !== 'flows' || !this.looksLikeFlowAuthoring(this.flowPromptContext(request))) {
      return null;
    }

    const adjustment = this.flowAdjustmentFromPrompt(request.prompt, request);
    if (adjustment) {
      return {
        message: [
          'Ajusté el flow actual sin recrearlo.',
          adjustment.message,
          'No guardé ni publiqué nada automáticamente. Revisa el JSON y prueba el draft.'
        ].join('\n\n'),
        actions: [adjustment.action],
        suggestions: ['guardar draft', 'probar flow', 'seguir ajustando']
      };
    }

    if (this.shouldApplyFlowDraft(request)) {
      const action = this.flowDraftFromPrompt(this.flowPromptContext(request), request);
      if (!action) {
        return {
          message:
            'No tengo suficientes datos para crear un draft seguro. Dime el disparador, los servicios o pasos y qué debe responder el flow.',
          suggestions: ['usar un servicio', 'encadenar dos servicios', 'validar y decidir']
        };
      }

      return {
        message: [
          'Preparé un flow como draft visual en esta pantalla.',
          'Usé el contrato JSON estándar de Flow: entrada, pasos, rutas y respuesta final.',
          'No guardé ni publiqué nada automáticamente. Revisa el JSON y luego usa Guardar draft o Guardar y publicar.'
        ].join('\n\n'),
        actions: [action]
      };
    }

    const action = this.flowDraftFromPrompt(this.flowPromptContext(request), request);
    if (!action) {
      return {
        message: [
          'Interpretación: quieres crear o ajustar un flow, pero faltan datos para armarlo sin inventar.',
          'Hoja de ruta: primero cerramos disparador, pasos y respuesta final.',
          'Revisión: Flow debe usarse para orquestar servicios, decisiones, eventos, foreach, subflows o lógica con varios pasos.',
          'Propuesta:',
          '1. Dime qué inicia el flow: manual, directo, webhook, evento, formulario o schedule.',
          '2. Dime los servicios o pasos que debe ejecutar.',
          '3. Dime qué debe responder al front.',
          'Siguiente paso: escribe una frase completa o elige una opción.'
        ].join('\n'),
        suggestions: ['flow manual con un servicio', 'encadenar dos servicios', 'validar y decidir']
      };
    }

    const document = action.document;
    const stepSummary = document.steps
      .map((step) => `${step['key']} (${step['type']})`)
      .join(' -> ');

    return {
      message: [
        `Interpretación: quieres crear el flow ${action.name}.`,
        'Hoja de ruta: generaré un draft de Flow con JSON editable, sin guardar ni publicar automáticamente.',
        `Revisión: entrada ${document.entry.mode}:${document.entry.key}; pasos ${stepSummary}.`,
        'Propuesta:',
        `1. Key: ${action.key}.`,
        `2. Campos de entrada: ${document.inputFields.map((field) => field.key).join(', ') || 'sin entrada obligatoria'}.`,
        `3. Respuesta final: ${document.output.stepKey ?? 'pendiente'}.`,
        'Siguiente paso: si está bien, pulsa crear draft. Si falta algo, dime qué servicio, campo o salida ajustar.'
      ].join('\n'),
      suggestions: ['crear draft', 'ajustar servicios', 'ajustar respuesta']
    };
  }

  private flowAdjustmentFromPrompt(
    prompt: string,
    request?: AiAssistantRequest
  ): { action: ApplyFlowJsonAction; message: string } | null {
    const normalized = prompt.toLowerCase();
    if (!/ajusta|cambia|modifica|actualiza|entrada|trigger|webhook|manual|directo|schedule|programad|formulario|responder|front|timeout|servicio/.test(normalized)) {
      return null;
    }
    const state = this.flowScreenState(request?.screenState);
    const current = state?.currentDocument;
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return null;
    }

    const document = JSON.parse(JSON.stringify(current)) as ApplyFlowJsonAction['document'];
    const changes: string[] = [];

    const entry = this.asRecord(document.entry);
    const entryMode = this.flowEntryModeFromPrompt(normalized);
    if (entryMode) {
      entry['mode'] = entryMode;
      entry['key'] = entryMode === 'direct' ? 'direct' : entryMode;
      document.entry = entry as ApplyFlowJsonAction['document']['entry'];
      changes.push(`entry.mode=${entryMode}`);
    }

    if (/responder|respuesta|front|caller/.test(normalized)) {
      document.output = {
        ...(document.output ?? { stepKey: null, responseTo: 'caller' }),
        responseTo: 'caller'
      };
      changes.push('output.responseTo=caller');
    }

    const timeout = this.firstNumber(normalized, /timeout(?:\s*(?:ms|de|a|en))?\s*(\d{3,6})/);
    if (timeout) {
      document.steps = document.steps.map((step) => {
        if (String(step['type']) !== 'dynamic_service') {
          return step;
        }
        const config = this.asRecord(step['config']);
        config['timeoutMs'] = timeout;
        return { ...step, config };
      });
      changes.push(`dynamic_service.timeoutMs=${timeout}`);
    }

    const serviceKey = this.flowServiceKeyFromPrompt(normalized, state);
    if (serviceKey) {
      document.steps = document.steps.map((step) => {
        if (String(step['type']) !== 'dynamic_service') {
          return step;
        }
        const config = this.asRecord(step['config']);
        config['serviceKey'] = serviceKey;
        return { ...step, config };
      });
      changes.push(`dynamic_service.serviceKey=${serviceKey}`);
    }

    if (!changes.length) {
      return null;
    }

    return {
      message: `Cambios aplicados: ${changes.join(', ')}.`,
      action: {
        type: 'apply_flow_json',
        label: 'Aplicar ajuste al diseñador de flows',
        key: document.flow?.key || state?.draft?.key || 'flow',
        name: document.flow?.name || state?.draft?.name || 'Flow',
        description: document.flow?.description ?? state?.draft?.description ?? '',
        publish: false,
        document
      }
    };
  }

  private shouldApplyFlowDraft(request: AiAssistantRequest) {
    const prompt = request.prompt.toLowerCase().trim();
    const confirms = /^(si|sí|ok|listo|dale|contin[uú]a|hazlo|g[eé]neralo|gener[aá]|aplica|crea(?:r)?(?: el)? draft|genera el draft|crear draft)(\b|[.!\s])/.test(
      prompt
    );
    if (!confirms) {
      return false;
    }

    return (request.conversation ?? []).some(
      (message) =>
        message.role === 'assistant' &&
        /Interpretación: quieres crear el flow|contrato JSON estándar de Flow|pasos .*\(/i.test(message.text)
    );
  }

  private flowPromptContext(request: AiAssistantRequest) {
    const prompt = request.prompt.trim();
    const conversation = (request.conversation ?? [])
      .filter((message) => message.role === 'user')
      .map((message) => message.text.trim())
      .filter(Boolean)
      .slice(-5);
    if (conversation.at(-1) === prompt) {
      return conversation.join('\n');
    }

    return [...conversation, prompt].filter(Boolean).join('\n');
  }

  private looksLikeFlowAuthoring(prompt: string) {
    return /flow|flujo|proceso|automatiz|orquest|workflow|encaden|paralel|foreach|por cada|subflow|servicio|validar|decidir|decisi[oó]n|emitir evento|evento|webhook|schedule|programad|manual/i.test(
      prompt
    );
  }

  private flowDraftFromPrompt(prompt: string, request?: AiAssistantRequest): ApplyFlowJsonAction | null {
    const normalized = prompt.toLowerCase();
    const state = this.flowScreenState(request?.screenState);
    const serviceKeys = this.flowServiceKeys(state);
    const flowKeys = this.flowKeys(state);
    const isParallel = /paralel|al mismo tiempo|simult[aá]neo/.test(normalized);
    const isForeach = /foreach|por cada|cada item|cada registro|lista de/.test(normalized);
    const isSubflow = /subflow|otro flow|flow hijo|llamar flow/.test(normalized);
    const emitsEvent = /emitir evento|evento|outbox/.test(normalized);
    const calculates = /calcular|formula|f[oó]rmula|total|iva|porcentaje/.test(normalized);
    const validates = /validar|decidir|decisi[oó]n|si |cuando/.test(normalized);
    const chains = /encaden|luego|despu[eé]s|primero|segundo|dos servicios|varios servicios/.test(normalized);
    const usesService = /servicio|services?|dynamic service|consulta|consultar|buscar/.test(normalized);

    if (!isParallel && !isForeach && !isSubflow && !emitsEvent && !calculates && !validates && !chains && !usesService) {
      return null;
    }

    const key = this.flowKeyFromPrompt(normalized);
    const name = this.flowNameFromKey(key);
    const entry = this.flowEntryFromPrompt(normalized, key);
    const inputFields = this.flowInputFieldsFromPrompt(normalized, isForeach, calculates);
    const steps: Array<Record<string, unknown>> = [];

    if (isParallel) {
      steps.push({
        key: 'consultas_paralelas',
        name: 'Ejecutar servicios en paralelo',
        type: 'parallel',
        position: 10,
        outputKey: 'paralelo',
        nextStepKey: 'respuesta',
        config: {
          branches: [
            { key: 'servicio_a', serviceKey: serviceKeys[0], inputMap: this.defaultServiceInputMap(inputFields) },
            { key: 'servicio_b', serviceKey: serviceKeys[1] ?? serviceKeys[0], inputMap: this.defaultServiceInputMap(inputFields) }
          ]
        }
      });
    } else if (isForeach) {
      steps.push({
        key: 'procesar_items',
        name: 'Procesar cada item',
        type: 'foreach',
        position: 10,
        outputKey: 'items_procesados',
        nextStepKey: 'respuesta',
        config: {
          itemsPath: 'input.items',
          serviceKey: serviceKeys[0],
          itemInputKey: 'item',
          concurrency: 4,
          inputMap: {}
        }
      });
    } else if (isSubflow) {
      steps.push({
        key: 'ejecutar_subflow',
        name: 'Ejecutar subflow',
        type: 'subflow',
        position: 10,
        outputKey: 'subflow',
        nextStepKey: 'respuesta',
        config: {
          flowKey: flowKeys[0] ?? 'flow_hijo_publicado'
        },
        inputMap: this.defaultServiceInputMap(inputFields)
      });
    } else if (calculates) {
      steps.push({
        key: 'calcular_valor',
        name: 'Calcular valor',
        type: 'formula',
        position: 10,
        outputKey: 'calculo',
        nextStepKey: 'respuesta',
        config: {
          rule: { '*': [{ var: 'input.amount' }, 1.19] },
          precision: 2
        }
      });
    } else {
      steps.push({
        key: 'ejecutar_servicio',
        name: 'Ejecutar servicio',
        type: 'dynamic_service',
        position: 10,
        outputKey: 'servicio',
        nextStepKey: chains ? 'ejecutar_segundo_servicio' : validates ? 'validar_resultado' : emitsEvent ? 'emitir_evento' : 'respuesta',
        config: { serviceKey: serviceKeys[0], timeoutMs: 8000, retry: { attempts: 0, backoffMs: 0 } },
        inputMap: this.defaultServiceInputMap(inputFields)
      });

      if (chains) {
        steps.push({
          key: 'ejecutar_segundo_servicio',
          name: 'Ejecutar segundo servicio',
          type: 'dynamic_service',
          position: 20,
          outputKey: 'segundo_servicio',
          nextStepKey: validates ? 'validar_resultado' : emitsEvent ? 'emitir_evento' : 'respuesta',
          config: { serviceKey: serviceKeys[1] ?? serviceKeys[0], timeoutMs: 8000, retry: { attempts: 0, backoffMs: 0 } },
          inputMap: { previous: '{{steps.servicio.response}}' }
        });
      }

      if (validates) {
        steps.push({
          key: 'validar_resultado',
          name: 'Validar resultado',
          type: 'decision',
          position: chains ? 30 : 20,
          outputKey: 'decision',
          onTrueStepKey: emitsEvent ? 'emitir_evento' : 'respuesta',
          onFalseStepKey: 'respuesta_rechazada',
          config: {
            rule: { '==': [{ var: chains ? 'steps.segundo_servicio.ok' : 'steps.servicio.ok' }, true] }
          }
        });
        steps.push({
          key: 'respuesta_rechazada',
          name: 'Responder rechazo',
          type: 'response',
          position: chains ? 40 : 30,
          config: {
            status: 'rejected',
            body: { ok: false, reason: 'La validación del flow no permitió continuar.' }
          }
        });
      }
    }

    if (emitsEvent) {
      steps.push({
        key: 'emitir_evento',
        name: 'Emitir evento',
        type: 'emit_event',
        position: 80,
        outputKey: 'evento',
        nextStepKey: 'respuesta',
        config: {
          eventKey: this.flowEventKeyFromPrompt(normalized),
          aggregateType: 'flow',
          payload: { input: '{{input}}', steps: '{{steps}}' }
        }
      });
    }

    steps.push({
      key: 'respuesta',
      name: 'Responder al front',
      type: 'response',
      position: 100,
      outputKey: 'respuesta',
      config: {
        status: 'success',
        body: {
          ok: true,
          input: '{{input}}',
          steps: '{{steps}}'
        }
      }
    });

    return {
      type: 'apply_flow_json',
      label: 'Aplicar propuesta al diseñador de flows',
      key,
      name,
      description: this.flowDescriptionFromPrompt(normalized),
      publish: false,
      document: {
        schemaVersion: 1,
        flow: {
          key,
          name,
          description: this.flowDescriptionFromPrompt(normalized),
          category: emitsEvent || chains || isParallel || isForeach ? 'orquestacion' : 'operaciones'
        },
        entry,
        inputFields,
        steps,
        output: {
          stepKey: 'respuesta',
          responseTo: 'caller'
        }
      }
    };
  }

  private flowServiceKeys(state: AssistantFlowScreenState | null) {
    const keys =
      state?.availableServices
        ?.filter((service) => service.hasPublishedVersion !== false)
        .map((service) => service.key?.trim())
        .filter((key): key is string => Boolean(key)) ?? [];
    return keys.length ? keys : ['buscar_usuario', 'buscar_roles', 'notificar_item'];
  }

  private flowKeys(state: AssistantFlowScreenState | null) {
    return (
      state?.availableFlows
        ?.filter((flow) => flow.hasPublishedVersion !== false)
        .map((flow) => flow.key?.trim())
        .filter((key): key is string => Boolean(key)) ?? []
    );
  }

  private flowEntryFromPrompt(prompt: string, key: string): {
    mode: 'direct' | 'manual' | 'http' | 'record_event' | 'form_submit' | 'schedule';
    key: string;
    config: Record<string, unknown>;
  } {
    if (/webhook|http/.test(prompt)) {
      return { mode: 'http', key: `${key}.webhook`, config: {} };
    }
    if (/schedule|programad|cada hora|diario|cron/.test(prompt)) {
      return { mode: 'schedule', key: `${key}.schedule`, config: { intervalSeconds: 3600 } };
    }
    if (/record|registro|evento/.test(prompt)) {
      return { mode: 'record_event', key: this.flowEventKeyFromPrompt(prompt), config: {} };
    }
    if (/formulario|form submit|submit/.test(prompt)) {
      return { mode: 'form_submit', key: `${key}.form_submitted`, config: {} };
    }
    if (/manual|bot[oó]n/.test(prompt)) {
      return { mode: 'manual', key: `${key}.manual`, config: {} };
    }
    return { mode: 'direct', key: 'direct', config: {} };
  }

  private flowInputFieldsFromPrompt(prompt: string, foreach: boolean, calculates: boolean) {
    if (foreach) {
      return [{ key: 'items', label: 'Items', type: 'text' as const, required: true, example: '[{\"id\":\"1\"}]' }];
    }
    if (calculates) {
      return [{ key: 'amount', label: 'Monto', type: 'number' as const, required: true, example: '100' }];
    }
    if (/email|correo|mail/.test(prompt)) {
      return [{ key: 'email', label: 'Email', type: 'email' as const, required: true, example: 'usuario@empresa.com' }];
    }
    if (/role|rol/.test(prompt)) {
      return [{ key: 'roleKey', label: 'Rol', type: 'text' as const, required: true, example: 'client' }];
    }
    return [{ key: 'value', label: 'Valor', type: 'text' as const, required: true, example: 'ABC-123' }];
  }

  private defaultServiceInputMap(inputFields: Array<{ key: string }>) {
    return Object.fromEntries(inputFields.map((field) => [field.key, `{{input.${field.key}}}`]));
  }

  private flowKeyFromPrompt(prompt: string) {
    if (/paralel/.test(prompt)) {
      return 'flow_servicios_paralelos';
    }
    if (/foreach|por cada/.test(prompt)) {
      return 'flow_procesar_items';
    }
    if (/subflow/.test(prompt)) {
      return 'flow_ejecutar_subflow';
    }
    if (/calcular|formula|f[oó]rmula/.test(prompt)) {
      return 'flow_calcular_valor';
    }
    if (/encaden|luego|despu[eé]s|dos servicios/.test(prompt)) {
      return 'flow_encadenar_servicios';
    }
    if (/validar|decidir|decisi[oó]n/.test(prompt)) {
      return 'flow_validar_y_decidir';
    }
    if (/evento|outbox/.test(prompt)) {
      return 'flow_emitir_evento';
    }
    return 'flow_ejecutar_servicio';
  }

  private flowNameFromKey(key: string) {
    return key
      .replace(/^flow_/, '')
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private flowDescriptionFromPrompt(prompt: string) {
    if (/paralel/.test(prompt)) {
      return 'Ejecuta servicios publicados en paralelo y consolida la respuesta.';
    }
    if (/foreach|por cada/.test(prompt)) {
      return 'Procesa una lista de items reutilizando un servicio publicado por cada elemento.';
    }
    if (/subflow/.test(prompt)) {
      return 'Orquesta un flow publicado como parte de un proceso mayor.';
    }
    if (/encaden|luego|despu[eé]s|dos servicios/.test(prompt)) {
      return 'Encadena servicios publicados pasando resultados entre pasos.';
    }
    if (/validar|decidir|decisi[oó]n/.test(prompt)) {
      return 'Valida el resultado de un paso y decide la respuesta final.';
    }
    return 'Ejecuta pasos declarativos y responde al front desde el motor de Flow.';
  }

  private flowEventKeyFromPrompt(prompt: string) {
    if (/record|registro/.test(prompt)) {
      return 'record.created';
    }
    if (/user|usuario/.test(prompt)) {
      return 'user.updated';
    }
    return 'flow.completed';
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

    const tuned = this.tuneCurrentServiceDefinition(request.prompt, state);
    if (tuned) {
      return tuned;
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

  private tuneCurrentServiceDefinition(
    prompt: string,
    state: AssistantServiceScreenState
  ): Pick<AiAssistantResponse, 'message' | 'actions'> | null {
    const normalized = prompt.toLowerCase();
    if (!/timeout|reintento|retry|backoff|pagin|page|lista|un registro|detalle|s[ií]\/no|boolean|m[eé]todo|method|post|get|put|patch|delete|url|endpoint/.test(normalized)) {
      return null;
    }
    const document = JSON.parse(JSON.stringify(state.definition ?? {})) as Record<string, unknown>;
    const changed: string[] = [];

    const timeout = this.firstNumber(normalized, /timeout(?:\s*(?:ms|de|a|en))?\s*(\d{3,6})/);
    if (timeout) {
      document['timeoutMs'] = timeout;
      changed.push(`timeoutMs=${timeout}`);
    }

    const retryAttempts = this.firstNumber(normalized, /(?:reintentos?|retry|attempts?)\s*(\d{1,2})/);
    const backoff = this.firstNumber(normalized, /backoff\s*(\d{2,6})/);
    if (retryAttempts !== null || backoff !== null) {
      const retry = this.asRecord(document['retry']);
      if (retryAttempts !== null) {
        retry['attempts'] = retryAttempts;
        changed.push(`retry.attempts=${retryAttempts}`);
      }
      if (backoff !== null) {
        retry['backoffMs'] = backoff;
        changed.push(`retry.backoffMs=${backoff}`);
      }
      document['retry'] = retry;
    }

    if (/pagin/.test(normalized)) {
      const pagination = this.asRecord(document['pagination']);
      pagination['enabled'] = !/sin pagin|desactiva.*pagin/.test(normalized);
      const pageSize = this.firstNumber(normalized, /(?:page\s*size|tama[nñ]o|por p[aá]gina)\s*(\d{1,4})/);
      if (pageSize) {
        pagination['pageSize'] = pageSize;
      }
      document['pagination'] = pagination;
      changed.push(`pagination.enabled=${pagination['enabled']}`);
    }

    const resultKind = this.resultKindFromPrompt(normalized);
    if (resultKind) {
      document['resultKind'] = resultKind;
      changed.push(`resultKind=${resultKind}`);
    }

    const method = this.methodFromPrompt(normalized);
    if (method) {
      document['method'] = method;
      changed.push(`method=${method}`);
    }

    const url = prompt.match(/https?:\/\/\S+|internal:\/\/\S+/)?.[0]?.replace(/[),.;]+$/, '');
    if (url) {
      document['url'] = url;
      changed.push(`url=${url}`);
    }

    if (!changed.length) {
      return null;
    }
    document['method'] = this.stringValue(document['method']) || 'GET';
    document['url'] = this.stringValue(document['url']) || 'internal://table/unknown';

    return {
      message: [
        'Ajusté el servicio actual sin cambiar su key ni recrear la lógica completa.',
        `Cambios aplicados: ${changed.join(', ')}.`,
        'No guardé ni publiqué nada automáticamente. Revisa el JSON y usa Guardar draft si está correcto.'
      ].join('\n\n'),
      actions: [
        {
          type: 'apply_dynamic_service_json',
          label: 'Aplicar ajuste al diseñador de servicios',
          key: state.draft?.key || state.selected?.key || String(document['key'] ?? 'servicio'),
          name: state.draft?.name || state.selected?.name || String(document['name'] ?? 'Servicio'),
          description: state.draft?.description || String(document['description'] ?? ''),
          publish: false,
          document: document as ApplyDynamicServiceJsonAction['document']
        } as ApplyDynamicServiceJsonAction
      ]
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

  private firstNumber(text: string, pattern: RegExp) {
    const match = text.match(pattern);
    if (!match?.[1]) {
      return null;
    }
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
  }

  private resultKindFromPrompt(prompt: string) {
    if (/s[ií]\/no|boolean|verdadero|falso/.test(prompt)) {
      return 'boolean';
    }
    if (/un registro|uno solo|detalle|single/.test(prompt)) {
      return 'single';
    }
    if (/lista|listado|varios|list/.test(prompt)) {
      return 'list';
    }
    return '';
  }

  private methodFromPrompt(prompt: string) {
    const method = prompt.match(/\b(get|post|put|patch|delete)\b/i)?.[1]?.toUpperCase();
    return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method ?? '') ? method : '';
  }

  private flowEntryModeFromPrompt(prompt: string) {
    if (/webhook|http/.test(prompt)) {
      return 'http';
    }
    if (/schedule|programad|cada hora|diario|semanal/.test(prompt)) {
      return 'schedule';
    }
    if (/formulario|form submit|submit/.test(prompt)) {
      return 'form_submit';
    }
    if (/evento|record event/.test(prompt)) {
      return 'record_event';
    }
    if (/manual/.test(prompt)) {
      return 'manual';
    }
    if (/directo|direct/.test(prompt)) {
      return 'direct';
    }
    return '';
  }

  private flowServiceKeyFromPrompt(prompt: string, state: AssistantFlowScreenState | null) {
    return (
      state?.availableServices
        ?.map((service) => service.key)
        .filter((key): key is string => Boolean(key))
        .find((key) => prompt.includes(key.toLowerCase())) ?? ''
    );
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

  private fallbackReasoningNotice(message: string) {
    return [
      'Modo ligero: la IA local no respondió dentro del tiempo interactivo, así que sigo con la guía segura de Chicle para no bloquearte.',
      message
    ].join('\n\n');
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
    if (/Si esta interpretaci[oó]n es correcta|genera el draft|crear(?: el)? draft|desea crear el draft|aplicar[aá] como borrador/i.test(message)) {
      return ['crear draft', 'ajustar propuesta', 'cancelar'];
    }

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

    if (/papelera|restaurar/i.test(message)) {
      return ['abrir Papelera', 'seleccionar servicio', 'cancelar'];
    }

    if (/queryMode=multi_table|servicio avanzado|Join:/i.test(message)) {
      return ['crear servicio avanzado', 'ajustar entrada', 'explicar join'];
    }

    return [];
  }

  private nextMissingDecision(request: AiAssistantRequest, missing: string[]) {
    const lastAssistant = [...(request.conversation ?? [])].reverse().find((message) => message.role === 'assistant');
    if (!lastAssistant) {
      return missing[0];
    }

    const lastQuestion = lastAssistant.text.toLowerCase();
    const prompt = request.prompt.toLowerCase();
    const answeredMissing = missing.find((item) => {
      if (/devolver/.test(item)) {
        return /devolver|recibir|front/.test(lastQuestion) && this.hasResponseShape(prompt);
      }
      if (/campos llegan|campo/.test(item)) {
        return /campo/.test(lastQuestion) && Boolean(this.detectField(prompt) || this.inferInputField(prompt));
      }
      if (/relaciona|relaci/.test(item)) {
        return /relaciona|conecta/.test(lastQuestion) && /->|=|userid|roleid|tenantid|user_roles|asignad/.test(prompt);
      }
      if (/dos tablas|servicios/.test(item)) {
        return /tablas|servicios/.test(lastQuestion) && this.detectTables(prompt).length >= 2;
      }
      return false;
    });

    return answeredMissing ? missing.find((item) => item !== answeredMissing) ?? null : missing[0];
  }

  private hasResponseShape(prompt: string) {
    return /usuario\s*\+\s*roles?|usuario y roles?|solo roles?|roles solamente|s[ií]\/no|boolean|lista|un registro|todo el rol|informaci[oó]n del rol/.test(
      prompt
    );
  }

  private inferResponseShape(prompt: string) {
    if (/solo roles?|roles solamente|todo el rol|informaci[oó]n del rol/.test(prompt)) {
      return 'solo la información de roles relacionados';
    }
    if (/s[ií]\/no|boolean/.test(prompt)) {
      return 'un resultado sí/no indicando si existe la relación';
    }
    if (/usuario\s*\+\s*roles?|usuario y roles?/.test(prompt)) {
      return 'usuario y roles relacionados';
    }
    return 'filas combinadas para que el front reciba la información relacionada';
  }

  private advancedCompositeServiceAction(scope: AiAssistantScope, request: AiAssistantRequest) {
    if (
      scope !== 'services' ||
      !/crear servicio avanzado|consulta avanzada|servicio con join|crear join|crear(?: el)? draft|genera el draft|contin[uú]a|hazlo|aplica/i.test(
        request.prompt
      )
    ) {
      return null;
    }

    const context = this.serviceConversationContext(request).toLowerCase();
    if (!this.looksLikeCompositeService(context)) {
      return null;
    }

    const userRoleDraft = this.userRoleJoinServiceDraft(context, request);
    if (userRoleDraft) {
      return userRoleDraft;
    }

    return null;
  }

  private userRoleMembershipGuideResponse(
    scope: AiAssistantScope,
    request: AiAssistantRequest
  ): Pick<AiAssistantResponse, 'message' | 'suggestions'> | null {
    if (scope !== 'services') {
      return null;
    }

    const context = this.serviceConversationContext(request).toLowerCase();
    if (!this.isUserRoleMembershipQuery(context) && !this.isUserRoleMembershipFlowInProgress(context)) {
      return null;
    }

    const prompt = request.prompt.toLowerCase().trim();
    const lastAssistant = this.lastAssistantText(request);
    const roleColumns = this.tableColumnsFromRequest(request, 'roles', ['id', 'key', 'name']);
    const userColumns = this.tableColumnsFromRequest(request, 'users', ['id', 'email', 'name', 'active']);
    const userRoleColumns = this.tableColumnsFromRequest(request, 'user_roles', ['id', 'userId', 'roleId']);
    const roleFilterOptions = this.roleFilterOptions(roleColumns);
    const selectedRoleField = roleFilterOptions.find((option) => prompt === option.value.toLowerCase());

    if (selectedRoleField) {
      return {
        message: [
          'Configuración propuesta:',
          `Entrada del servicio: ${selectedRoleField.inputKey}. Ejemplo: ${selectedRoleField.example}.`,
          `Filtro interno: ${selectedRoleField.value} equals input.${selectedRoleField.inputKey}.`,
          'Respuesta: lista de usuarios encontrados, con el dato del rol usado para validar la relación.',
          'Siguiente paso: si esto es correcto, pulsa crear draft para aplicar el JSON en el diseñador.'
        ].join('\n'),
        suggestions: ['crear draft', 'ajustar campo', 'cancelar']
      };
    }

    if (/^lista$|^listado$|^list$/.test(prompt) && /configuraci[oó]n propuesta/.test(lastAssistant ?? '')) {
      return {
        message: [
          'Perfecto, la respuesta será una lista de usuarios.',
          'Mantengo el filtro del rol que elegiste y la relación users -> user_roles -> roles.',
          'Siguiente paso: pulsa crear draft para aplicar el JSON compuesto en el diseñador.'
        ].join('\n'),
        suggestions: ['crear draft', 'ajustar campo', 'cancelar']
      };
    }

    if (/^tablas correctas|^correctas|^sí tablas|^si tablas/.test(prompt) || /tablas involucradas reales/.test(lastAssistant ?? '')) {
      if (roleFilterOptions.some((option) => prompt === option.value.toLowerCase())) {
        const selected = roleFilterOptions.find((option) => prompt === option.value.toLowerCase()) ?? roleFilterOptions[0];
        return {
          message: [
            'Configuración propuesta:',
            `Entrada del servicio: ${selected.inputKey}. Ejemplo: ${selected.example}.`,
            `Filtro interno: ${selected.value} equals input.${selected.inputKey}.`,
            'Respuesta: lista de usuarios encontrados, con el dato del rol usado para validar la relación.',
            'Siguiente paso: si esto es correcto, pulsa crear draft para aplicar el JSON en el diseñador.'
          ].join('\n'),
          suggestions: ['crear draft', 'ajustar campo', 'cancelar']
        };
      }

      return {
        message: [
          'Campos reales para identificar el rol:',
          ...roleFilterOptions.map((option) => `- ${option.value}: ${option.description}`),
          'Recomendación: usa roles.key cuando el usuario escribirá valores como cliente, admin u owner.',
          'Siguiente paso: elige el campo que recibirá el servicio.'
        ].join('\n'),
        suggestions: roleFilterOptions.map((option) => option.value)
      };
    }

    if (/^correcto|^contin[uú]a|^sí|^si$/.test(prompt) || /interpretaci[oó]n normalizada/.test(lastAssistant ?? '')) {
      return {
        message: [
          'Tablas involucradas reales:',
          `- users: ${userColumns.join(', ') || 'sin columnas cargadas'}`,
          `- user_roles: ${userRoleColumns.join(', ') || 'sin columnas cargadas'}`,
          `- roles: ${roleColumns.join(', ') || 'sin columnas cargadas'}`,
          'Relación propuesta:',
          'users.id -> user_roles.userId -> roles.id',
          'Siguiente paso: confirma si estas tablas y relación son correctas.'
        ].join('\n'),
        suggestions: ['tablas correctas', 'cambiar tablas']
      };
    }

    return {
      message: [
        'Interpretación normalizada:',
        'Quieres crear un Dynamic Service de lectura que reciba un rol, por ejemplo cliente, y devuelva los usuarios que tienen ese rol asignado.',
        'Prompt de trabajo:',
        'Crear servicio interno multi_table: listar usuarios filtrando por un campo real de roles, usando la tabla puente user_roles.',
        'No usaré nombre ni campos inventados; primero validaremos tablas y columnas reales.',
        'Siguiente paso: confirma si esta interpretación es correcta.'
      ].join('\n'),
      suggestions: ['correcto', 'ajustar intención']
    };
  }

  private isUserRoleMembershipQuery(context: string) {
    return (
      /usuarios?/.test(context) &&
      /\brol\b|\brole\b|\broles\b/.test(context) &&
      /asignad|tienen|tenga|con\s+(?:un\s+)?rol|por\s+(?:un\s+)?rol|cierto\s+rol|role\s+cliente|rol\s+cliente/.test(
        context
      )
    );
  }

  private isUserRoleMembershipFlowInProgress(context: string) {
    return /campos reales para identificar el rol|roles\.key|roles\.id|roles\.name|users\.id -> user_roles\.userid -> roles\.id|configuraci[oó]n propuesta/.test(
      context
    );
  }

  private roleFilterOptions(roleColumns: string[]) {
    const options: Array<{ value: string; inputKey: string; example: string; description: string }> = [];
    if (roleColumns.includes('key')) {
      options.push({
        value: 'roles.key',
        inputKey: 'roleKey',
        example: 'cliente',
        description: 'clave estable del rol; recomendado para valores como cliente'
      });
    }
    if (roleColumns.includes('id')) {
      options.push({
        value: 'roles.id',
        inputKey: 'roleId',
        example: 'uuid-del-rol',
        description: 'identificador interno exacto'
      });
    }
    if (roleColumns.includes('name')) {
      options.push({
        value: 'roles.name',
        inputKey: 'roleName',
        example: 'Cliente app',
        description: 'nombre visible del rol si esa columna existe'
      });
    }

    return options.length ? options : [{ value: 'roles.id', inputKey: 'roleId', example: 'uuid-del-rol', description: 'identificador interno exacto' }];
  }

  private userRoleMembershipFilter(context: string, request?: AiAssistantRequest) {
    const roleColumns = this.tableColumnsFromRequest(request, 'roles', ['id', 'key', 'name']);
    const options = this.roleFilterOptions(roleColumns);
    const selected =
      this.selectedRoleFilterOption(request, options) ??
      options.find((option) => this.latestRoleFieldMention(context, option.value)) ??
      options.find((option) => option.value === 'roles.key') ??
      options[0];
    const field = selected.value.replace('roles.', 'r.');

    return {
      field,
      inputKey: selected.inputKey,
      operator: 'equals' as const
    };
  }

  private selectedRoleFilterOption(
    request: AiAssistantRequest | undefined,
    options: Array<{ value: string; inputKey: string; example: string; description: string }>
  ) {
    return this.selectedOptionFromUserMessages(request, options, (option) => option.value, (message, value) =>
      message === value || message.includes(`usar ${value}`)
    );
  }

  private latestRoleFieldMention(context: string, value: string) {
    const index = context.lastIndexOf(value.toLowerCase());
    if (index < 0) {
      return false;
    }

    const competingIndexes = ['roles.key', 'roles.id', 'roles.name']
      .filter((item) => item !== value.toLowerCase())
      .map((item) => context.lastIndexOf(item))
      .filter((item) => item >= 0);
    return !competingIndexes.length || index > Math.max(...competingIndexes);
  }

  private userRoleMembershipSelectFields(request?: AiAssistantRequest) {
    const userColumns = this.tableColumnsFromRequest(request, 'users', ['id', 'email', 'name', 'active']);
    const roleColumns = this.tableColumnsFromRequest(request, 'roles', ['id', 'key', 'name']);
    const select: Array<{ field: string; alias: string }> = [];

    for (const column of ['id', 'email', 'name', 'active']) {
      if (userColumns.includes(column)) {
        select.push({ field: `u.${column}`, alias: column === 'id' ? 'userId' : `user${this.capitalize(column)}` });
      }
    }
    for (const column of ['id', 'key', 'name']) {
      if (roleColumns.includes(column)) {
        select.push({ field: `r.${column}`, alias: column === 'id' ? 'roleId' : `role${this.capitalize(column)}` });
      }
    }

    return select.length ? select : [{ field: 'u.id', alias: 'userId' }];
  }

  private tableColumnsFromRequest(request: AiAssistantRequest | undefined, tableName: string, fallback: string[]) {
    const state = request ? this.serviceScreenState(request.screenState) : null;
    const columns = state?.availableTables?.find((table) => table.name === tableName)?.columns ?? [];
    return columns.length ? columns : fallback;
  }

  private capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private userRoleJoinServiceDraft(context: string, request?: AiAssistantRequest): ApplyDynamicServiceJsonAction | null {
    const tables = this.detectTables(context);
    if (!tables.includes('users') || !tables.includes('roles')) {
      return null;
    }

    const roleMembership = this.isUserRoleMembershipQuery(context) || this.isUserRoleMembershipFlowInProgress(context);
    const roleFilter = roleMembership
      ? this.userRoleMembershipFilter(context, request)
      : null;
    const fields = this.detectFields(context);
    const field =
      roleFilter?.inputKey ??
      fields.find((item) => !item.toLowerCase().endsWith('id') || item === 'id') ??
      this.inferInputField(context).split(' ')[0] ??
      'name';
    const filterField = roleFilter?.field ?? `u.${field}`;
    const operator = roleFilter?.operator ?? (['email', 'id', 'key'].includes(field) ? 'equals' : 'contains');
    const key = roleMembership ? `listar_usuarios_por_${field}` : `consultar_usuario_roles_por_${field}`;
    const select = roleMembership ? this.userRoleMembershipSelectFields(request) : this.userRoleSelectFields(context);
    const query = roleMembership ? { [field]: `{{input.${field}}}` } : { [field]: `{{input.${field}}}` };

    return {
      type: 'apply_dynamic_service_json',
      label: 'Aplicar servicio avanzado con join',
      key,
      name: roleMembership ? `Listar usuarios por ${field}` : `Consultar usuario y roles por ${field}`,
      description: roleMembership
        ? `Lista usuarios que tienen asignado el rol recibido en ${field}.`
        : `Consulta usuarios y sus roles relacionados filtrando por ${field}.`,
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
            ...select
          ],
          relationNotes: 'users.id -> user_roles.userId -> roles.id',
          filterNotes: `${filterField} ${operator} input.${field}`,
          matchMode: 'all',
          filters: [
            {
              field: filterField,
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
        query,
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

  private userRoleSelectFields(context: string) {
    const roleFields = [
      { field: 'r.id', alias: 'roleId' },
      { field: 'r.key', alias: 'roleKey' },
      { field: 'r.name', alias: 'roleName' }
    ];
    if (/solo roles?|roles solamente|todo el rol|informaci[oó]n del rol/.test(context)) {
      return roleFields;
    }

    return [
      { field: 'u.id', alias: 'userId' },
      { field: 'u.email', alias: 'userEmail' },
      { field: 'u.name', alias: 'userName' },
      ...roleFields
    ];
  }

  private serviceKeyFromPrompt(prompt: string) {
    const quoted = prompt.match(/["'`]([a-zA-Z0-9_-]{3,120})["'`]/)?.[1];
    if (quoted) {
      return quoted;
    }

    return prompt.match(/\b([a-z][a-z0-9_]{2,119})\b/i)?.[1] ?? '';
  }

  private serviceDraftFromPrompt(prompt: string): ApplyDynamicServiceJsonAction | null {
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
    const normalizedFilters =
      matchMode === 'any'
        ? filters.map((filter) => ({
            ...filter,
            required: false
          }))
        : filters;
    const byNameOnly = filters.length === 1 && filters[0].field === 'name';
    const key = byNameOnly ? 'filtrar_usuarios_por_nombre' : 'filtrar_usuarios';
    const resultKind = this.detectResultKind(normalized) || 'list';

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
        resultKind,
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
          filterNotes: normalizedFilters
            .map((filter) => `${filter.field} ${filter.operator} input.${filter.inputKey}`)
            .join(matchMode === 'any' ? ' o ' : ' y '),
          matchMode,
          filters: normalizedFilters
        },
        method: 'GET',
        url: 'internal://table/users',
        headers: {},
        query: Object.fromEntries(normalizedFilters.map((filter) => [filter.inputKey, `{{input.${filter.inputKey}}}`])),
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

  private genericInternalTableServiceDraftFromPrompt(normalizedPrompt: string): ApplyDynamicServiceJsonAction | null {
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

  private confisysServiceDraftFromPrompt(normalizedPrompt: string): ApplyDynamicServiceJsonAction | null {
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
  }): ApplyDynamicServiceJsonAction {
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
      { table: 'roles', patterns: [/\brol\b/, /\broles?\b/, /\btabla\s+rol\b/, /\btabla\s+role\b/, /\btabla\s+roles\b/] },
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

  private detectResultKind(normalizedPrompt: string) {
    if (/\bs[ií]\s*\/?\s*no\b|\bboolean\b|\bexiste\b|\bvalidar\b/.test(normalizedPrompt)) {
      return 'boolean';
    }
    if (/\bun registro\b|\buno\b|\bdetalle\b|\bprimero\b|\bsingle\b/.test(normalizedPrompt)) {
      return 'single';
    }
    if (/\blista\b|\blistar\b|\bvarios\b|\btodos\b|\bfiltrar\b|\bconsultar\b|\bquery\b/.test(normalizedPrompt)) {
      return 'list';
    }
    return '';
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
      { field: 'formKey', patterns: [/\bformkey\b/, /\bform_key\b/, /\bkey\s+del\s+formulario\b/] },
      { field: 'recordType', patterns: [/\brecordtype\b/, /\brecord_type\b/, /\btipo\s+de\s+record\b/, /\btipo\s+de\s+registro\b/] },
      { field: 'category', patterns: [/\bcategory\b/, /\bcategor[ií]a\b/] },
      { field: 'status', patterns: [/\bstatus\b/, /\bestado\b/] },
      { field: 'active', patterns: [/\bactive\b/, /\bactivo\b/] },
      { field: 'label', patterns: [/\blabel\b/, /\betiqueta\b/, /\bt[ií]tulo\b/] },
      { field: 'route', patterns: [/\broute\b/, /\bruta\b/] },
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
