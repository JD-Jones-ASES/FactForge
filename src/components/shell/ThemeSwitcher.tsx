import { useEffect, useState } from 'react';
import {
  THEMES,
  DEFAULT_THEME,
  isThemeId,
  type ThemeId,
} from '../../lib/themes';

const STORAGE_KEY = 'factforge-theme';

export function applyTheme(id: ThemeId): void {
  document.documentElement.setAttribute('data-theme', id);
  document.documentElement.style.colorScheme =
    id === 'paper' ? 'light' : 'dark';
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isThemeId(saved)) {
        setTheme(saved);
        applyTheme(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    applyTheme(DEFAULT_THEME);
  }, []);

  const onPick = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="theme-switcher" role="group" aria-label="Theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className="chip theme-chip"
          aria-pressed={theme === t.id}
          title={t.description}
          onClick={() => onPick(t.id)}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
