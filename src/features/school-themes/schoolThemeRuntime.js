const DARK_OVERRIDES = {
  pageBackground: '#111713',
  surfaceColor: '#202a24',
  textColor: '#edf4ef',
  mutedTextColor: '#b6c2b9',
  borderColor: '#3e4c42',
};

const DEFAULTS = {
  primaryColor: '#216b49',
  secondaryColor: '#287b59',
  accentColor: '#eaf3ec',
  pageBackground: '#f4f6f5',
  surfaceColor: '#ffffff',
  textColor: '#1c2821',
  mutedTextColor: '#59665e',
  borderColor: '#dfe5e0',
  mode: 'LIGHT',
  fontFamily: 'Inter',
};

export function applySchoolTheme(theme = DEFAULTS, displayModeOverride) {
  const root = document.documentElement;
  const settings = { ...DEFAULTS, ...theme };
  const mode = displayModeOverride === "DARK" || displayModeOverride === "LIGHT"
    ? displayModeOverride
    : settings.mode;

  const effective = mode === 'DARK'
    ? {
      ...settings,
      ...DARK_OVERRIDES,
      primaryColor: `color-mix(in srgb, ${settings.primaryColor} 48%, #9be8b9)`,
      secondaryColor: `color-mix(in srgb, ${settings.secondaryColor} 48%, #82dba6)`,
      accentColor: `color-mix(in srgb, ${settings.primaryColor} 20%, #1b2a21)`,
    }
    : settings;

  root.dataset.colorMode = mode.toLowerCase();

  root.style.setProperty('--app-primary', effective.primaryColor);
  root.style.setProperty('--app-secondary', effective.secondaryColor);
  root.style.setProperty('--app-accent', effective.primaryColor);
  root.style.setProperty('--app-accent-soft', effective.accentColor);

  root.style.setProperty('--app-background', effective.pageBackground);
  root.style.setProperty('--app-surface', effective.surfaceColor);
  root.style.setProperty('--app-surface-muted', `color-mix(in srgb, ${effective.surfaceColor} 55%, ${effective.pageBackground})`);
  root.style.setProperty('--app-text-primary', effective.textColor);
  root.style.setProperty('--app-text-secondary', effective.mutedTextColor);
  root.style.setProperty('--app-text-subtle', effective.mutedTextColor);
  root.style.setProperty('--app-border', effective.borderColor);
  root.style.setProperty('--app-danger-soft', mode === 'DARK' ? '#3a2623' : '#fff4f1');
  root.style.setProperty('--app-success-soft', mode === 'DARK' ? '#20352a' : '#f1f8f1');
  root.style.setProperty('--app-warning-soft', mode === 'DARK' ? '#3b3220' : '#fff9e9');

  root.style.setProperty(
    '--font-sans',
    `"${settings.fontFamily}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  );

  root.style.colorScheme = mode === 'DARK' ? 'dark' : 'light';
}
