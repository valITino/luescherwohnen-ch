import { describe, expect, it } from 'vitest';
import { classify } from './ci-changes.mjs';

describe('CI-Dispatcher', () => {
  it('reine Doku: nur Doku-Prüfungen', () => {
    expect(classify(['docs/DESIGN.md', 'README.md'])).toEqual({
      docs: true,
      web: false,
      container: false,
      workflows: false,
      claude: false,
    });
  });

  it('Website-Code: Web und Container (das Image enthält die Website)', () => {
    const result = classify(['apps/web/src/components/Header.astro']);
    expect(result.web).toBe(true);
    expect(result.container).toBe(true);
    expect(result.docs).toBe(false);
  });

  it('nur Container-Dateien: kein Web-Durchlauf', () => {
    const result = classify(['docker/nginx.conf', 'Dockerfile']);
    expect(result).toMatchObject({ container: true, web: false });
  });

  it('Workflows und Claude-Konfiguration getrennt', () => {
    expect(classify(['.github/workflows/ci.yml']).workflows).toBe(true);
    expect(classify(['.claude/agents/qa-engineer.md'])).toMatchObject({
      claude: true,
      docs: true,
      web: false,
    });
  });

  it('Bestandsbilder lösen keine Website-Prüfung aus', () => {
    expect(classify(['docs/ressources/2021/02/Luescher_logo.png'])).toEqual({
      docs: false,
      web: false,
      container: false,
      workflows: false,
      claude: false,
    });
  });

  it('Lockfile und Werkzeug-Skripte zählen zur Website', () => {
    expect(classify(['pnpm-lock.yaml']).web).toBe(true);
    expect(classify(['scripts/build-pages.mjs']).web).toBe(true);
    expect(classify(['scripts/check-headers.mjs'])).toMatchObject({ container: true });
  });

  it('geänderte Workflows lösen die Module aus, die sie ausführen', () => {
    expect(classify(['.github/workflows/_web.yml'])).toMatchObject({
      workflows: true,
      web: true,
      container: true,
    });
    expect(classify(['.github/workflows/_container.yml'])).toMatchObject({
      container: true,
      web: false,
    });
    expect(Object.values(classify(['.github/workflows/ci.yml'])).every(Boolean)).toBe(true);
    expect(classify(['.github/dependabot.yml'])).toMatchObject({ workflows: true, web: false });
  });

  it('Docker-Startskript zählt zum Container', () => {
    expect(classify(['scripts/docker-up.sh'])).toMatchObject({ container: true, web: false });
  });

  it('leere Liste: nichts', () => {
    expect(Object.values(classify(['', '  '])).every((value) => !value)).toBe(true);
  });
});
