import type { SecurityPolicy } from '../auth/auth.service';
import { ConfisysValueType } from './confisys.entity';

export interface ConfisysDefault {
  key: string;
  value: string | number | boolean | Record<string, unknown> | unknown[];
  valueType: ConfisysValueType;
  category: string;
  description: string;
  isPublic?: boolean;
  editable?: boolean;
}

export const CONFISYS_DEFAULTS: ConfisysDefault[] = [
  {
    key: 'setup.seedProfile',
    value: 'blank',
    valueType: 'string',
    category: 'setup',
    description: 'Perfil de semilla inicial usado cuando se crea el primer tenant.',
    isPublic: true
  },
  {
    key: 'api.cors.origin',
    value: true,
    valueType: 'boolean',
    category: 'api',
    description: 'Origen CORS permitido por defecto. En producción debe restringirse por despliegue.'
  },
  {
    key: 'files.storage.driver',
    value: 'local',
    valueType: 'string',
    category: 'files',
    description: 'Driver de almacenamiento de evidencias. Preparado para local, MinIO o S3.'
  },
  {
    key: 'files.storage.localPath',
    value: '/app/storage/files',
    valueType: 'string',
    category: 'files',
    description: 'Ruta base para evidencias cuando el driver de storage es local.'
  },
  {
    key: 'security.level',
    value: 'standard',
    valueType: 'string',
    category: 'security',
    description: 'Nivel base de seguridad del sistema: basic, standard o high.',
    isPublic: true
  },
  {
    key: 'security.mfa.required',
    value: false,
    valueType: 'boolean',
    category: 'security',
    description: 'Indica si MFA debe ser obligatorio por defecto.',
    isPublic: true
  },
  {
    key: 'security.password.enabled',
    value: true,
    valueType: 'boolean',
    category: 'security',
    description: 'Activa el login por email y password en la política base.',
    isPublic: true
  },
  {
    key: 'security.password.minLength',
    value: 12,
    valueType: 'number',
    category: 'security',
    description: 'Longitud mínima de password para usuarios nuevos.',
    isPublic: true
  },
  {
    key: 'security.password.hash',
    value: 'bcrypt',
    valueType: 'string',
    category: 'security',
    description: 'Algoritmo de hash preparado para passwords: bcrypt o argon2id.',
    isPublic: true
  },
  {
    key: 'security.session.webMode',
    value: 'refresh_cookie',
    valueType: 'string',
    category: 'security',
    description: 'Modo de sesión web por defecto.',
    isPublic: true
  },
  {
    key: 'security.session.accessTokenTtlMinutes',
    value: 15,
    valueType: 'number',
    category: 'security',
    description: 'Minutos de vida para access tokens.',
    isPublic: true
  },
  {
    key: 'security.session.refreshTokenTtlDays',
    value: 14,
    valueType: 'number',
    category: 'security',
    description: 'Días de vida para refresh tokens.',
    isPublic: true
  },
  {
    key: 'security.loginRateLimit.maxAttempts',
    value: 5,
    valueType: 'number',
    category: 'security',
    description: 'Intentos fallidos permitidos antes de bloquear temporalmente el login.'
  },
  {
    key: 'security.loginRateLimit.windowMinutes',
    value: 10,
    valueType: 'number',
    category: 'security',
    description: 'Ventana en minutos para contar intentos fallidos de login.'
  },
  {
    key: 'security.loginRateLimit.blockMinutes',
    value: 5,
    valueType: 'number',
    category: 'security',
    description: 'Minutos de bloqueo temporal tras demasiados intentos fallidos.'
  },
  {
    key: 'security.methods.password.enabled',
    value: true,
    valueType: 'boolean',
    category: 'security',
    description: 'Muestra y permite password como método de login.',
    isPublic: true
  },
  {
    key: 'security.methods.passkey.enabled',
    value: false,
    valueType: 'boolean',
    category: 'security',
    description: 'Prepara activación futura de passkeys.',
    isPublic: true
  },
  {
    key: 'security.methods.oidc.enabled',
    value: false,
    valueType: 'boolean',
    category: 'security',
    description: 'Prepara activación futura de OIDC/OAuth2.',
    isPublic: true
  },
  {
    key: 'security.methods.deviceCode.enabled',
    value: false,
    valueType: 'boolean',
    category: 'security',
    description: 'Prepara activación futura de códigos de dispositivo.',
    isPublic: true
  },
  {
    key: 'features.offlineSync.enabled',
    value: true,
    valueType: 'boolean',
    category: 'features',
    description: 'Bandera base para sincronización offline.'
  },
  {
    key: 'ui.presentation.defaultProfile',
    value: {
      key: 'adaptive',
      theme: 'chicle',
      defaultKit: 'primeng',
      rules: [
        { kit: 'ionic', platforms: ['ios', 'android'] },
        { kit: 'ionic', maxWidth: 767 },
        { kit: 'primeng', minWidth: 768 }
      ]
    },
    valueType: 'json',
    category: 'ui',
    description:
      'Perfil visual global. Resuelve el kit por plataforma y ancho cuando una pantalla no define un override.',
    isPublic: true
  },
  {
    key: 'services.defaultTimeoutMs',
    value: 8000,
    valueType: 'number',
    category: 'services',
    description: 'Timeout por defecto para servicios dinámicos cuando la definición no lo especifica.'
  },
  {
    key: 'services.maxTimeoutMs',
    value: 30000,
    valueType: 'number',
    category: 'services',
    description: 'Timeout máximo permitido para servicios dinámicos.'
  },
  {
    key: 'services.maxResponseBytes',
    value: 262144,
    valueType: 'number',
    category: 'services',
    description: 'Tamaño máximo de respuesta que se guarda en el historial de servicios dinámicos.'
  },
  {
    key: 'services.allowPrivateHosts',
    value: false,
    valueType: 'boolean',
    category: 'services',
    description:
      'Permite llamar localhost o redes privadas desde servicios dinámicos. Debe permanecer apagado salvo desarrollo controlado.'
  },
  {
    key: 'ai.enabled',
    value: true,
    valueType: 'boolean',
    category: 'ai',
    description: 'Activa el asistente IA. Si el runtime local o cloud no está disponible, la API sigue arrancando.'
  },
  {
    key: 'ai.provider',
    value: 'ollama',
    valueType: 'string',
    category: 'ai',
    description: 'Provider IA por defecto. V1 local-first usa ollama; cloud futuro puede usar openai u otro adapter.'
  },
  {
    key: 'ai.baseUrl',
    value: 'http://localhost:11434/v1',
    valueType: 'string',
    category: 'ai',
    description: 'URL OpenAI-compatible del provider IA. Para Docker Compose local usar http://ollama:11434/v1.'
  },
  {
    key: 'ai.chatModel',
    value: 'qwen3-coder:30b',
    valueType: 'string',
    category: 'ai',
    description: 'Modelo local recomendado para generar configuración declarativa de Chicle.'
  },
  {
    key: 'ai.embeddingModel',
    value: 'nomic-embed-text:v1.5',
    valueType: 'string',
    category: 'ai',
    description: 'Modelo local recomendado para embeddings RAG cuando se active búsqueda semántica.'
  },
  {
    key: 'ai.timeoutMs',
    value: 60000,
    valueType: 'number',
    category: 'ai',
    description: 'Timeout máximo para llamadas al provider IA.'
  },
  {
    key: 'ai.rag.enabled',
    value: true,
    valueType: 'boolean',
    category: 'ai',
    description: 'Activa la capa RAG. V1 usa tags/keywords; embeddings llegan en la siguiente fase.'
  },
  {
    key: 'ai.rag.mode',
    value: 'keyword',
    valueType: 'string',
    category: 'ai',
    description: 'Modo RAG activo: keyword en V1, hybrid cuando agreguemos embeddings locales.'
  },
  {
    key: 'ai.maxContextChunks',
    value: 12,
    valueType: 'number',
    category: 'ai',
    description: 'Cantidad máxima de fragmentos de conocimiento que el asistente puede usar por solicitud.'
  },
  {
    key: 'ai.allowPublish',
    value: false,
    valueType: 'boolean',
    category: 'ai',
    description: 'La IA no debe publicar directamente. Debe proponer drafts y el usuario aprueba.'
  },
  {
    key: 'flow.enabled',
    value: true,
    valueType: 'boolean',
    category: 'flow',
    description: 'Activa el motor de flujos configurables.'
  },
  {
    key: 'flow.maxSteps',
    value: 50,
    valueType: 'number',
    category: 'flow',
    description: 'Cantidad máxima de pasos permitida por ejecución de flow.'
  },
  {
    key: 'flow.maxDurationMs',
    value: 30000,
    valueType: 'number',
    category: 'flow',
    description: 'Duración máxima por defecto para una ejecución completa de flow.'
  },
  {
    key: 'flow.defaultStepTimeoutMs',
    value: 8000,
    valueType: 'number',
    category: 'flow',
    description: 'Timeout por defecto para un paso cuando el flow o el paso no lo especifica.'
  },
  {
    key: 'flow.maxStepTimeoutMs',
    value: 60000,
    valueType: 'number',
    category: 'flow',
    description: 'Timeout máximo permitido para un paso aunque la definición pida más.'
  },
  {
    key: 'flow.maxRetryAttempts',
    value: 5,
    valueType: 'number',
    category: 'flow',
    description: 'Máximo de reintentos permitidos por paso.'
  },
  {
    key: 'flow.logs.retentionDays',
    value: 30,
    valueType: 'number',
    category: 'flow',
    description: 'Días de retención sugerida para historial técnico de ejecuciones de flow.'
  },
  {
    key: 'flow.expression.maxDepth',
    value: 10,
    valueType: 'number',
    category: 'flow',
    description: 'Profundidad máxima para expresiones declarativas del Flow Engine.'
  },
  {
    key: 'flow.expression.maxLength',
    value: 2000,
    valueType: 'number',
    category: 'flow',
    description: 'Longitud máxima para expresiones declarativas del Flow Engine.'
  },
  {
    key: 'flow.worker.enabled',
    value: true,
    valueType: 'boolean',
    category: 'flow',
    description: 'Activa el worker interno que procesa outbox, schedules y jobs de flows.'
  },
  {
    key: 'flow.worker.pollMs',
    value: 1000,
    valueType: 'number',
    category: 'flow',
    description: 'Intervalo de revisión de la cola durable de flows.'
  },
  {
    key: 'flow.worker.batchSize',
    value: 10,
    valueType: 'number',
    category: 'flow',
    description: 'Cantidad máxima de eventos o jobs reclamados por ciclo.'
  },
  {
    key: 'flow.worker.maxJobAttempts',
    value: 3,
    valueType: 'number',
    category: 'flow',
    description: 'Intentos por defecto de una ejecución asíncrona.'
  },
  {
    key: 'flow.worker.retryBackoffMs',
    value: 1000,
    valueType: 'number',
    category: 'flow',
    description: 'Backoff exponencial base para reintentos de jobs y outbox.'
  },
  {
    key: 'flow.worker.staleLockMs',
    value: 300000,
    valueType: 'number',
    category: 'flow',
    description: 'Tiempo para recuperar un job bloqueado por un worker interrumpido.'
  },
  {
    key: 'flow.outbox.maxAttempts',
    value: 10,
    valueType: 'number',
    category: 'flow',
    description: 'Máximo de intentos al despachar un evento durable.'
  },
  {
    key: 'flow.maxDelayMs',
    value: 30000,
    valueType: 'number',
    category: 'flow',
    description: 'Espera síncrona máxima permitida dentro de un paso de flow.'
  },
  {
    key: 'flow.foreach.maxItems',
    value: 100,
    valueType: 'number',
    category: 'flow',
    description: 'Cantidad máxima de elementos procesados por un paso para cada elemento.'
  },
  {
    key: 'flow.foreach.maxConcurrency',
    value: 10,
    valueType: 'number',
    category: 'flow',
    description: 'Concurrencia máxima permitida en un paso para cada elemento.'
  },
  {
    key: 'flow.subflow.maxDepth',
    value: 5,
    valueType: 'number',
    category: 'flow',
    description: 'Profundidad máxima de llamadas entre flows publicados.'
  }
];

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  level: 'standard',
  requireMfa: false,
  password: {
    enabled: true,
    minLength: 12,
    hash: 'bcrypt'
  },
  session: {
    webMode: 'refresh_cookie',
    accessTokenTtlMinutes: 15,
    refreshTokenTtlDays: 14
  },
  methods: [
    {
      type: 'password',
      enabled: true,
      label: 'Email y password',
      channels: ['web', 'mobile'],
      primary: true
    },
    {
      type: 'passkey',
      enabled: false,
      label: 'Passkey',
      channels: ['web', 'mobile']
    },
    {
      type: 'oidc',
      enabled: false,
      label: 'OIDC / OAuth2',
      channels: ['web', 'mobile']
    },
    {
      type: 'device_code',
      enabled: false,
      label: 'Código de dispositivo',
      channels: ['device', 'mobile']
    }
  ]
};
