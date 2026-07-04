import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ApiClientService } from '../api/api-client.service';
import {
  DEFAULT_UI_PRESENTATION_PROFILE,
  UiKitId,
  UiKitPreference,
  UiPresentationConfig,
  UiPresentationContext,
  UiPresentationProfile,
  UiPresentationResolution,
  UiPresentationRule,
  UiRuntimePlatform
} from './ui-presentation.types';

interface PublicConfisysEntry {
  key: string;
  value: unknown;
}

@Injectable({ providedIn: 'root' })
export class UiPresentationService {
  private readonly api = inject(ApiClientService);
  private readonly profileState = signal<UiPresentationProfile>(DEFAULT_UI_PRESENTATION_PROFILE);
  private loadingStarted = false;

  readonly profile = this.profileState.asReadonly();

  ensureGlobalProfileLoaded() {
    if (this.loadingStarted) {
      return;
    }

    this.loadingStarted = true;
    this.api.get<PublicConfisysEntry[]>('confisys/public').subscribe({
      next: (entries) => {
        const configured = entries.find((entry) => entry.key === 'ui.presentation.defaultProfile')?.value;
        const profile = this.normalizeProfile(configured);
        if (profile) {
          this.profileState.set(profile);
        }
      },
      error: () => {
        // The built-in profile keeps public and offline rendering operational.
      }
    });
  }

  resolve(context: UiPresentationContext = {}): UiPresentationResolution {
    const profile = this.profileState();
    const localKit = this.explicitKit(context.local?.kit);
    if (localKit) {
      return this.resolution(localKit, context.local, profile, 'local');
    }

    const parentKit = this.explicitKit(context.parent?.kit);
    if (parentKit) {
      return this.resolution(parentKit, context.parent, profile, 'parent');
    }

    const width = context.width ?? this.currentWidth();
    const platform = context.platform ?? this.currentPlatform();
    const rules = context.local?.rules ?? context.parent?.rules ?? profile.rules;
    const matchedRule = rules.find((rule) => this.matches(rule, width, platform));
    const config = context.local ?? context.parent;

    if (matchedRule) {
      return {
        kit: matchedRule.kit,
        theme: config?.theme || profile.theme,
        profileKey: config?.profileKey || profile.key,
        matchedRule,
        source: 'rule'
      };
    }

    return {
      kit: profile.defaultKit,
      theme: config?.theme || profile.theme,
      profileKey: config?.profileKey || profile.key,
      source: 'default'
    };
  }

  setProfile(profile: UiPresentationProfile) {
    this.profileState.set(this.normalizeProfile(profile) ?? DEFAULT_UI_PRESENTATION_PROFILE);
  }

  private resolution(
    kit: UiKitId,
    config: UiPresentationConfig | undefined,
    profile: UiPresentationProfile,
    source: 'local' | 'parent'
  ): UiPresentationResolution {
    return {
      kit,
      theme: config?.theme || profile.theme,
      profileKey: config?.profileKey || profile.key,
      source
    };
  }

  private explicitKit(kit: UiKitPreference | undefined): UiKitId | undefined {
    return kit && kit !== 'auto' && kit !== 'inherit' ? kit : undefined;
  }

  private matches(rule: UiPresentationRule, width: number, platform: UiRuntimePlatform) {
    if (rule.platforms?.length && !rule.platforms.includes(platform)) {
      return false;
    }
    if (rule.minWidth !== undefined && width < rule.minWidth) {
      return false;
    }
    if (rule.maxWidth !== undefined && width > rule.maxWidth) {
      return false;
    }
    return true;
  }

  private currentWidth() {
    return typeof window === 'undefined' ? 1280 : window.innerWidth;
  }

  private currentPlatform(): UiRuntimePlatform {
    const platform = Capacitor.getPlatform();
    return platform === 'ios' || platform === 'android' ? platform : 'web';
  }

  private normalizeProfile(value: unknown): UiPresentationProfile | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    const candidate = value as Partial<UiPresentationProfile>;
    const defaultKit = this.isKit(candidate.defaultKit) ? candidate.defaultKit : undefined;
    if (!defaultKit) {
      return undefined;
    }

    const rules = Array.isArray(candidate.rules)
      ? candidate.rules
          .filter((rule): rule is UiPresentationRule => {
            return Boolean(rule) && typeof rule === 'object' && this.isKit((rule as UiPresentationRule).kit);
          })
          .map((rule) => ({
            kit: rule.kit,
            platforms: Array.isArray(rule.platforms)
              ? rule.platforms.filter((platform): platform is UiRuntimePlatform =>
                  ['web', 'ios', 'android'].includes(platform)
                )
              : undefined,
            minWidth: this.validWidth(rule.minWidth),
            maxWidth: this.validWidth(rule.maxWidth)
          }))
      : [];

    return {
      key: typeof candidate.key === 'string' && candidate.key.trim() ? candidate.key.trim() : 'adaptive',
      theme: typeof candidate.theme === 'string' && candidate.theme.trim() ? candidate.theme.trim() : 'chicle',
      defaultKit,
      rules
    };
  }

  private isKit(value: unknown): value is UiKitId {
    return value === 'native' || value === 'primeng' || value === 'ionic';
  }

  private validWidth(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
  }
}

