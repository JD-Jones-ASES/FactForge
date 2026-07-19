/** Theme pack ids. CSS lives in src/styles/tokens.css under [data-theme]. */
export const THEMES = [
  {
    id: 'ink',
    name: 'Ink',
    description: 'Default dark high-contrast theme with a single teal accent.',
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'Light paper surface with ink text and a teal accent.',
  },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'ink';

export function isThemeId(v: string): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}
