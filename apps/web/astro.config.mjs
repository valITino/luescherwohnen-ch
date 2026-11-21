// @ts-check
import sitemap from '@astrojs/sitemap';
import { loadSites } from '@luescher/config/astro-env';
import { earlyScript } from '@luescher/config/early-script';
import { cspConfig } from '@luescher/config/security';
import { splitSiteUrl } from '@luescher/config/sites';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const { sites } = loadSites();
const { site, base } = splitSiteUrl(sites.web);

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site,
  base: base || '/',
  output: 'static',
  trailingSlash: 'ignore',
  compressHTML: true,
  build: {
    // /impressum statt /impressum/: passt zu nginx (try_files) und GitHub Pages.
    format: 'file',
  },
  devToolbar: { enabled: false },
  // Kein Syntax-Highlighting nötig; Shiki würde Inline-Styles erzeugen (CSP).
  markdown: { syntaxHighlight: false },
  server: { port: 4321 },
  security: { csp: cspConfig({ connectOrigin: sites.contact.origin }) },
  image: {
    // Responsive Bilder ohne Inline-Styles (CSP): Grössen kommen aus dem eigenen CSS.
    responsiveStyles: false,
  },
  integrations: [
    // Das Skript einer Seite läuft vor ihrem ersten Bild (docs/DECISIONS.md 44).
    earlyScript(),
    sitemap({
      filter: (page) => !/\/(styleguide|404)(\.html)?\/?$/.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keine data:-URIs: so bleibt die CSP bei img-src und font-src auf 'self'.
      assetsInlineLimit: 0,
    },
  },
});
