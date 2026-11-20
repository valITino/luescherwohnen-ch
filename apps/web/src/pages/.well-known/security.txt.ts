import { securityTxt } from '@luescher/ui/lib/well-known';
import type { APIRoute } from 'astro';
import { company, sites } from '../../config/site.ts';

/**
 * RFC 9116. `Expires` = Build-Datum + 1 Jahr: mindestens einmal pro Jahr neu bauen.
 * Kontakt vorerst die allgemeine Adresse (Annahme, docs/TODO.md).
 */
export const GET: APIRoute = () =>
  new Response(securityTxt(sites.web, company.email), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
