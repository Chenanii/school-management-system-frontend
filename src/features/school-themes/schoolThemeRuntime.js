const DARK_OVERRIDES = {
  pageBackground: '#151d19',
  surfaceColor: '#202b24',
  textColor: '#edf4ef',
  mutedTextColor: '#b0beb4',
  borderColor: '#38483d',
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

export function applySchoolTheme(theme = DEFAULTS) {
  const root = document.documentElement;
  const settings = { ...DEFAULTS, ...theme };

  const effective = settings.mode === 'DARK'
    ? { ...settings, ...DARK_OVERRIDES }
    : settings;

  root.style.setProperty('--app-primary', effective.primaryColor);
  root.style.setProperty('--app-secondary', effective.secondaryColor);
  root.style.setProperty('--app-accent', effective.primaryColor);
  root.style.setProperty('--app-accent-soft', effective.accentColor);

  root.style.setProperty('--app-background', effective.pageBackground);
  root.style.setProperty('--app-surface', effective.surfaceColor);
  root.style.setProperty('--app-text-primary', effective.textColor);
  root.style.setProperty('--app-text-secondary', effective.mutedTextColor);
  root.style.setProperty('--app-text-subtle', effective.mutedTextColor);
  root.style.setProperty('--app-border', effective.borderColor);

  root.style.setProperty(
    '--font-sans',
    `"${settings.fontFamily}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  );

  root.style.colorScheme = settings.mode === 'DARK' ? 'dark' : 'light';
}