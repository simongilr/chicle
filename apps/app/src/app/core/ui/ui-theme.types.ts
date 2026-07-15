export interface UiThemeTokens {
  primary: string;
  primaryContrast: string;
  surface: string;
  surfaceAlt?: string;
  surfaceMuted?: string;
  background: string;
  text: string;
  muted: string;
  border: string;
  primarySoft?: string;
  primaryBorder?: string;
  success?: string;
  successSoft?: string;
  successBorder?: string;
  warning?: string;
  warningSoft?: string;
  warningBorder?: string;
  danger?: string;
  dangerSoft?: string;
  dangerBorder?: string;
  shadow?: string;
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
