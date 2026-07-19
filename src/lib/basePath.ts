/** Always ends with `/`. */
export function siteBase(): string {
  const b = (import.meta.env.BASE_URL as string | undefined) ?? '/';
  return b.endsWith('/') ? b : `${b}/`;
}

export function withBase(path: string): string {
  if (!path) return siteBase();
  if (/^https?:\/\//i.test(path) || path.startsWith('//')) return path;
  if (path.startsWith('#')) return path;
  if (path === '/') return siteBase();

  const base = siteBase();
  const cleaned = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleaned}`;
}
