export interface UiThemeTokens {
  primary: string;
  primaryContrast: string;
  surface: string;
  background: string;
  text: string;
  muted: string;
  border: string;
  radius: string;
}

export interface UiThemeDefinition {
  key: string;
  label: string;
  description: string;
  loadPrimePreset: () => Promise<unknown>;
  primaryPalette: Record<number, string>;
  tokens: UiThemeTokens;
}
