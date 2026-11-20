import { robotsTxt } from '@luescher/ui/lib/well-known';
import type { APIRoute } from 'astro';
import { absoluteUrl, sites } from '../config/site.ts';

/**
 * Alles darf gelesen werden. Der Styleguide und die 404-Seite tragen «noindex» und stehen darum
 * nicht unter Disallow. In der Vorschau wird nichts indexiert.
 */
export const GET: APIRoute = () =>
  new Response(
    robotsTxt({
      host: 'luescherwohnen.ch',
      mode: sites.preview ? 'closed' : 'open',
      sitemap: absoluteUrl('/sitemap-index.xml'),
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
