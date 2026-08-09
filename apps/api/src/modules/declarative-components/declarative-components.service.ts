import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComponentAdapter } from './component-adapter.entity';
import { ComponentDefinition } from './component-definition.entity';
import { DECLARATIVE_COMPONENT_SEEDS } from './declarative-components.seed';
import { DynamicComponentTemplate } from './dynamic-component-template.entity';
import { DynamicComponentTemplateVersion } from './dynamic-component-template-version.entity';

export interface DeclarativeComponentContract {
  schemaVersion?: number;
  kind?: string;
  id?: string;
  componentKey?: string;
  props?: Record<string, unknown>;
  bindings?: Record<string, unknown>;
  actions?: Record<string, unknown> | Array<Record<string, unknown>>;
  permissions?: string[];
  layout?: Record<string, unknown>;
  children?: DeclarativeComponentContract[];
  metadata?: Record<string, unknown>;
}

const ALLOWED_ACTION_TYPES = new Set([
  'navigate',
  'execute_service',
  'execute_flow',
  'submit_form',
  'open_modal',
  'show_modal',
  'show_message',
  'set_state',
  'refresh_data',
  'queue_offline',
  'emit_event'
]);

const ACTION_REQUIRED_KEYS: Record<string, string[]> = {
  navigate: ['to|route'],
  execute_service: ['serviceKey'],
  execute_flow: ['flowKey'],
  open_modal: ['modalKey|templateKey|componentKey'],
  show_modal: ['modalKey|templateKey|componentKey'],
  show_message: ['message|text'],
  set_state: ['key|path'],
  emit_event: ['eventKey|name']
};

@Injectable()
export class DeclarativeComponentsService implements OnModuleInit {
  constructor(
    @InjectRepository(ComponentDefinition)
    private readonly definitions: Repository<ComponentDefinition>,
    @InjectRepository(ComponentAdapter)
    private readonly adapters: Repository<ComponentAdapter>,
    @InjectRepository(DynamicComponentTemplate)
    private readonly templates: Repository<DynamicComponentTemplate>,
    @InjectRepository(DynamicComponentTemplateVersion)
    private readonly templateVersions: Repository<DynamicComponentTemplateVersion>
  ) {}

  async onModuleInit() {
    await this.syncSeedCatalog();
  }

  async syncSeedCatalog() {
    for (const seed of DECLARATIVE_COMPONENT_SEEDS) {
      const definition = await this.definitions.findOne({ where: { componentKey: seed.componentKey } });
      const definitionPayload = {
        componentKey: seed.componentKey,
        name: seed.name,
        category: seed.category,
        description: seed.description,
        schemaVersion: 1,
        status: 'active' as const,
        propsSchema: seed.propsSchema ?? null,
        eventsSchema: seed.eventsSchema ?? null,
        defaultProps: seed.defaultProps ?? null,
        allowedChildren: seed.allowedChildren ?? null,
        documentation: seed.documentation ?? null,
        metadata: seed.metadata ?? null
      };
      await this.definitions.save(
        definition ? this.definitions.merge(definition, definitionPayload) : this.definitions.create(definitionPayload)
      );

      for (const adapterSeed of seed.adapters) {
        const adapter = await this.adapters.findOne({
          where: { componentKey: seed.componentKey, kit: adapterSeed.kit }
        });
        const adapterPayload = {
          componentKey: seed.componentKey,
          kit: adapterSeed.kit,
          adapterStatus: adapterSeed.adapterStatus,
          technicalSelector: adapterSeed.technicalSelector ?? null,
          importPath: adapterSeed.importPath ?? null,
          previewKey: adapterSeed.previewKey ?? null,
          adapterMetadata: adapterSeed.adapterMetadata ?? null
        };
        await this.adapters.save(
          adapter ? this.adapters.merge(adapter, adapterPayload) : this.adapters.create(adapterPayload)
        );
      }
    }
  }

  async catalog() {
    const definitions = await this.definitions.find({ order: { category: 'ASC', componentKey: 'ASC' } });
    const adapters = await this.adapters.find({ order: { componentKey: 'ASC', kit: 'ASC' } });
    const adaptersByKey = new Map<string, ComponentAdapter[]>();
    for (const adapter of adapters) {
      adaptersByKey.set(adapter.componentKey, [...(adaptersByKey.get(adapter.componentKey) ?? []), adapter]);
    }

    return definitions.map((definition) => ({
      componentKey: definition.componentKey,
      name: definition.name,
      category: definition.category,
      description: definition.description,
      schemaVersion: definition.schemaVersion,
      status: definition.status,
      propsSchema: definition.propsSchema ?? {},
      eventsSchema: definition.eventsSchema ?? {},
      defaultProps: definition.defaultProps ?? {},
      allowedChildren: definition.allowedChildren ?? {},
      documentation: definition.documentation ?? {},
      metadata: definition.metadata ?? {},
      kits: (adaptersByKey.get(definition.componentKey) ?? [])
        .filter((adapter) => adapter.adapterStatus === 'available' || adapter.adapterStatus === 'fallback')
        .map((adapter) => adapter.kit),
      adapters: (adaptersByKey.get(definition.componentKey) ?? []).map((adapter) => ({
        kit: adapter.kit,
        status: adapter.adapterStatus,
        technicalSelector: adapter.technicalSelector,
        importPath: adapter.importPath,
        previewKey: adapter.previewKey,
        metadata: adapter.adapterMetadata ?? {}
      }))
    }));
  }

  async validateContract(contract: unknown) {
    const normalized = await this.normalizeContract(contract);
    return {
      ok: true,
      contract: normalized,
      checks: [
        { key: 'component_key', ok: true, message: `${normalized.componentKey} exists in the declarative registry.` },
        { key: 'children', ok: true, message: `${normalized.children?.length ?? 0} child component(s) normalized.` }
      ]
    };
  }

  async normalizeContract(contract: unknown): Promise<DeclarativeComponentContract> {
    const value = this.asObject(contract);
    if (!value) {
      throw new BadRequestException('component contract must be an object');
    }

    const componentKey = this.asString(value['componentKey']);
    if (!componentKey) {
      throw new BadRequestException('componentKey is required');
    }

    const exists = await this.definitions.findOne({ where: { componentKey } });
    if (!exists) {
      throw new BadRequestException(`Unknown componentKey: ${componentKey}`);
    }

    const children = Array.isArray(value['children'])
      ? await Promise.all(value['children'].map((child) => this.normalizeContract(child)))
      : [];

    const props = this.asObject(value['props']) ?? {};
    const bindings = this.asObject(value['bindings']) ?? {};
    const actions = this.normalizeActions(value['actions']);
    this.validateBindings(bindings, componentKey);
    this.validateActions(actions, componentKey);

    return {
      schemaVersion: typeof value['schemaVersion'] === 'number' ? value['schemaVersion'] : 1,
      kind: this.asString(value['kind']) || 'dynamic_component',
      id: this.asString(value['id']) || undefined,
      componentKey,
      props,
      bindings,
      actions,
      permissions: Array.isArray(value['permissions'])
        ? value['permissions'].filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
        : [],
      layout: this.asObject(value['layout']) ?? {},
      children,
      metadata: this.asObject(value['metadata']) ?? {}
    };
  }

  private normalizeActions(value: unknown) {
    if (Array.isArray(value)) {
      return value.filter((item): item is Record<string, unknown> => Boolean(this.asObject(item)));
    }
    return this.asObject(value) ?? {};
  }

  private validateActions(value: Record<string, unknown> | Array<Record<string, unknown>>, componentKey: string) {
    const actions = Array.isArray(value)
      ? value
      : Object.values(value).flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));

    for (const action of actions) {
      const item = this.asObject(action);
      if (!item) {
        throw new BadRequestException(`Invalid action in ${componentKey}: action must be an object`);
      }
      const type = this.asString(item['type']);
      if (!type) {
        throw new BadRequestException(`Invalid action in ${componentKey}: type is required`);
      }
      if (!ALLOWED_ACTION_TYPES.has(type)) {
        throw new BadRequestException(`Invalid action in ${componentKey}: unsupported type ${type}`);
      }
      const required = ACTION_REQUIRED_KEYS[type] ?? [];
      for (const requirement of required) {
        const alternatives = requirement.split('|');
        const hasOne = alternatives.some((key) => Boolean(this.asString(item[key])));
        if (!hasOne) {
          throw new BadRequestException(
            `Invalid action in ${componentKey}: ${type} requires ${alternatives.join(' or ')}`
          );
        }
      }
      this.validateActionPermissions(item, componentKey);
      this.validateActionPayload(item, componentKey);
    }
  }

  private validateActionPermissions(action: Record<string, unknown>, componentKey: string) {
    if (action['permission'] != null && !this.asString(action['permission'])) {
      throw new BadRequestException(`Invalid action in ${componentKey}: permission must be a non-empty string`);
    }
    if (
      action['permissions'] != null &&
      (!Array.isArray(action['permissions']) || action['permissions'].some((item) => !this.asString(item)))
    ) {
      throw new BadRequestException(`Invalid action in ${componentKey}: permissions must be a string array`);
    }
  }

  private validateActionPayload(action: Record<string, unknown>, componentKey: string) {
    for (const key of ['payloadMap', 'input', 'context']) {
      if (action[key] != null && !this.asObject(action[key])) {
        throw new BadRequestException(`Invalid action in ${componentKey}: ${key} must be an object`);
      }
    }
  }

  private validateBindings(bindings: Record<string, unknown>, componentKey: string) {
    for (const [key, value] of Object.entries(bindings)) {
      if (key.toLowerCase().includes('sql')) {
        throw new BadRequestException(`Invalid binding in ${componentKey}: raw SQL binding keys are not allowed`);
      }
      this.validateBindingValue(value, componentKey);
    }
  }

  private validateBindingValue(value: unknown, componentKey: string) {
    if (typeof value === 'string') {
      const lowered = value.toLowerCase();
      if (lowered.includes('select ') || lowered.includes('drop table') || lowered.includes('http://') || lowered.includes('https://')) {
        throw new BadRequestException(
          `Invalid binding in ${componentKey}: direct SQL or raw external URLs are not valid component bindings`
        );
      }
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        this.validateBindingValue(item, componentKey);
      }
      return;
    }
    const object = this.asObject(value);
    if (object) {
      this.validateBindings(object, componentKey);
    }
  }

  private asObject(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
