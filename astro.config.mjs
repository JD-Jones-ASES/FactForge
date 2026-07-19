// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

/**
 * GitHub Pages project site (when enabled): /FactForge/
 * CI would set ASTRO_BASE=/FactForge. Local + e2e keep base `/`.
 */
const base = process.env.ASTRO_BASE || '/';

export default defineConfig({
  site: 'https://jd-jones-ases.github.io',
  base,
  integrations: [react()],
});
