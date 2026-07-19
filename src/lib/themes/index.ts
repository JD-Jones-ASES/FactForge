/** Theme pack ids. CSS lives in src/styles/themes/. */
export const THEMES = [
  {
    id: 'ink',
    name: 'Ink',
    description: 'Default dark high-contrast theme with a single teal accent.',
  },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'ink';
