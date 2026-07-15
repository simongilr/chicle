export type UiRuntimePlatform = 'web' | 'ios' | 'android';
export type UiKitId = 'native' | 'primeng' | 'ionic' | 'material' | 'bootstrap';
export type UiKitPreference = UiKitId | 'auto' | 'inherit';

export interface UiPresentationRule {
  kit: UiKitId;
  platforms?: UiRuntimePlatform[];
  minWidth?: number;
  maxWidth?: number;
}

export interface UiPresentationConfig {
  profileKey?: string;
  kit?: UiKitPreference;
  theme?: string;
  rules?: UiPresentationRule[];
}

export interface UiPresentationProfile {
  key: string;
  theme: string;
  defaultKit: UiKitId;
  rules: UiPresentationRule[];
}

export interface UiPresentationContext {
  width?: number;
  platform?: UiRuntimePlatform;
  parent?: UiPresentationConfig;
  local?: UiPresentationConfig;
}

export interface UiPresentationResolution {
  kit: UiKitId;
  theme: string;
  profileKey: string;
  matchedRule?: UiPresentationRule;
  source: 'local' | 'parent' | 'rule' | 'default';
}

export const DEFAULT_UI_PRESENTATION_PROFILE: UiPresentationProfile = {
  key: 'adaptive',
  theme: 'chicle',
  defaultKit: 'primeng',
  rules: [
    { kit: 'ionic', platforms: ['ios', 'android'] },
    { kit: 'primeng', platforms: ['web'] }
  ]
};
