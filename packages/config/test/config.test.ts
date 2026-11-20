import { describe, expect, it } from 'vitest';
import { cspDirectives, nginxHeaders, securityHeaders } from '../src/security.mjs';
import {
  joinPath,
  resolveContact,
  resolveSites,
  splitSiteUrl,
  stripTrailingSlashes,
} from '../src/sites.mjs';

describe('Adressen und Basis-Pfad', () => {
  it('zerlegt GitHub-Pages-Adressen in site und base', () => {
    expect(splitSiteUrl('https://valitino.github.io/luescherwohnen-ch')).toEqual({
      site: 'https://valitino.github.io',
      base: '/luescherwohnen-ch',
    });
    expect(splitSiteUrl('https://luescherwohnen.ch/')).toEqual({
      site: 'https://luescherwohnen.ch',
      base: '',
    });
  });

  it('entfernt Schrägstriche am Ende, auch viele, in linearer Zeit', () => {
    expect(stripTrailingSlashes('https://luescherwohnen.ch///')).toBe('https://luescherwohnen.ch');
    expect(stripTrailingSlashes('/luescherwohnen-ch/')).toBe('/luescherwohnen-ch');
    expect(stripTrailingSlashes('/')).toBe('');
    expect(stripTrailingSlashes('')).toBe('');
    expect(resolveSites({ PUBLIC_WEB_URL: ' https://example.ch// ' }).web).toBe(
      'https://example.ch',
    );
    // Viele Schrägstriche mitten im Text: Der frühere reguläre Ausdruck brauchte dafür Sekunden.
    const hostile = `x${'/'.repeat(200_000)}x`;
    const start = performance.now();
    expect(stripTrailingSlashes(hostile)).toBe(hostile);
    expect(performance.now() - start).toBeLessThan(100);
  });

  it('baut interne Links mit Basis-Pfad', () => {
    expect(joinPath('/luescherwohnen-ch', '/impressum')).toBe('/luescherwohnen-ch/impressum');
    expect(joinPath('', '/')).toBe('/');
    expect(joinPath('', 'datenschutz')).toBe('/datenschutz');
  });

  it('Produktion: echte Domain, kein Formular, keine Vorschau', () => {
    const sites = resolveSites({});
    expect(sites.web).toBe('https://luescherwohnen.ch');
    expect(sites.contact.mode).toBe('off');
    expect(sites.preview).toBe(false);
  });

  it('Entwicklung: localhost und simuliertes Formular', () => {
    const sites = resolveSites({}, { dev: true });
    expect(sites.web).toBe('http://localhost:4321');
    expect(sites.contact.mode).toBe('mock');
  });

  it('Vorschau: Adresse ohne Slash am Ende, Hinweis an', () => {
    const sites = resolveSites({
      PUBLIC_WEB_URL: 'https://valitino.github.io/luescherwohnen-ch/',
      PUBLIC_PREVIEW: 'true',
      PUBLIC_CONTACT_ENDPOINT: 'mock',
    });
    expect(sites.web).toBe('https://valitino.github.io/luescherwohnen-ch');
    expect(sites.preview).toBe(true);
    expect(sites.contact).toEqual({ mode: 'mock', endpoint: '', origin: '' });
  });

  it('Formular-Empfänger nur über https', () => {
    expect(resolveContact('https://formular.example.ch/anfrage')).toEqual({
      mode: 'post',
      endpoint: 'https://formular.example.ch/anfrage',
      origin: 'https://formular.example.ch',
    });
    expect(() => resolveContact('http://formular.example.ch/anfrage')).toThrow(/https/);
    expect(resolveContact('http://localhost:8787/anfrage').mode).toBe('post');
  });

  it('nimmt nur gültige Bestätigungscodes', () => {
    const sites = resolveSites({
      PUBLIC_GOOGLE_SITE_VERIFICATION: 'abc_DEF-123456',
      PUBLIC_BING_SITE_VERIFICATION: '"><script>',
    });
    expect(sites.verification).toEqual({ google: 'abc_DEF-123456', bing: '' });
  });
});

describe('Security-Header', () => {
  it('CSP-Meta: nichts von Dritten', () => {
    const directives = cspDirectives();
    expect(directives).toContain("default-src 'none'");
    expect(directives).toContain("connect-src 'self'");
    expect(directives.join(' ')).not.toMatch(/https?:/);
  });

  it('CSP erlaubt den Formular-Empfänger nur in connect-src', () => {
    const directives = cspDirectives({ connectOrigin: 'https://formular.example.ch' });
    expect(directives).toContain("connect-src 'self' https://formular.example.ch");
    expect(directives.filter((d) => d.includes('formular'))).toHaveLength(1);
  });

  it('Header für nginx: alle Pflicht-Header, immer gesendet', () => {
    const names = securityHeaders().map(([name]) => name);
    for (const name of [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Resource-Policy',
    ]) {
      expect(names).toContain(name);
    }
    const conf = nginxHeaders();
    expect(conf.split('\n').filter((line) => line.startsWith('add_header'))).toHaveLength(8);
    for (const line of conf.split('\n').filter((l) => l.startsWith('add_header'))) {
      expect(line).toMatch(/" always;$/);
    }
    expect(conf).toContain("frame-ancestors 'none'");
  });

  it('Vorschaubilder dürfen fremd eingebunden werden, sonst nichts', () => {
    const header = (cross: boolean) =>
      securityHeaders({ crossOriginResource: cross }).find(
        ([name]) => name === 'Cross-Origin-Resource-Policy',
      )?.[1];
    expect(header(false)).toBe('same-origin');
    expect(header(true)).toBe('cross-origin');
  });

  it('HSTS preload nur auf Wunsch', () => {
    const hsts = (preload: boolean) =>
      securityHeaders({ hstsPreload: preload }).find(
        ([name]) => name === 'Strict-Transport-Security',
      )?.[1];
    // Vorsichtiger Start: kurz und ohne Subdomains (alte Subdomains ohne HTTPS blieben sonst gesperrt)
    expect(hsts(false)).toBe('max-age=86400');
    expect(hsts(true)).toBe('max-age=31536000; includeSubDomains; preload');
  });
});
