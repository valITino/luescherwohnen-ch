import { describe, expect, it } from 'vitest';
import { QUARANTINE, forbiddenFiles } from './check-forbidden-files.mjs';

const known = Object.entries(QUARANTINE);

describe('Sperre für ausführbare und archivierte Dateien', () => {
  it('lässt Bilder, Code und Doku durch', () => {
    expect(
      forbiddenFiles(['docs/ressources/a.jpg', 'apps/web/src/x.ts', 'README.md'], () => ''),
    ).toEqual([]);
  });

  it('meldet PHP, Archive und .htaccess', () => {
    expect(
      forbiddenFiles(['wp/shell.php', 'upload/x.ZIP', 'a/.htaccess', 'b/x.phtml'], () => ''),
    ).toEqual(['wp/shell.php', 'upload/x.ZIP', 'a/.htaccess', 'b/x.phtml']);
  });

  it('bekannte Archive nur mit unveränderter Prüfsumme', () => {
    const [file, sum] = known[0]!;
    expect(forbiddenFiles([file], () => sum)).toEqual([]);
    expect(forbiddenFiles([file], () => 'anders')).toEqual([`${file} (Prüfsumme geändert)`]);
  });
});
