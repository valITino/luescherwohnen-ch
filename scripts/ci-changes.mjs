// Zentraler Dispatcher der CI (CLAUDE.md, Abschnitt 5): ordnet geänderte Pfade Modulen zu, damit
// nur die betroffenen Prüfungen laufen. Basis-Scans laufen in der CI immer, unabhängig davon.
//
// Aufruf in der CI:  git diff --name-only "$BASE" "$HEAD" | node scripts/ci-changes.mjs
//   → schreibt docs=…, web=…, container=…, workflows=…, claude=… nach $GITHUB_OUTPUT
//   (`claude` ist informativ: Die Claude-Validierung läuft in den Basis-Scans ohnehin immer.)
//   (ohne GITHUB_OUTPUT auf stdout). `--all` setzt alles auf true (z. B. neuer Branch).
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Module und ihre Pfade (Regex auf den Pfad relativ zum Repository) */
export const MODULES = {
  docs: [/\.md$/, /^docs\//, /^\.markdownlint/],
  web: [
    /^apps\//,
    /^packages\//,
    /^e2e\//,
    /^scripts\/.*\.(mjs|ts)$/,
    /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|tsconfig\.json|eslint\.config\.mjs)$/,
    /^(playwright|vitest)\.config\.ts$/,
    /^\.(nvmrc|prettierrc\.mjs|prettierignore|editorconfig)$/,
  ],
  container: [
    /^Dockerfile$/,
    /^\.dockerignore$/,
    /^docker\//,
    /^compose\.yaml$/,
    /^scripts\/(docker|check-headers|nginx-headers)\.mjs$/,
    /^scripts\/docker-up\.sh$/,
  ],
  workflows: [/^\.github\//],
  claude: [/^\.claude\//, /^CLAUDE\.md$/, /^scripts\/validate_claude_config\.py$/, /^tests\//],
};

/** Bestandsbilder und Rohmaterial lösen keine Website-Prüfung aus (nur Basis-Scans). */
const IGNORED = [/^docs\/ressources\//, /^docs\/.*\.(docx|html)$/];

/**
 * @param {string[]} files
 * @returns {Record<keyof typeof MODULES, boolean>}
 */
export function classify(files) {
  const result = Object.fromEntries(Object.keys(MODULES).map((name) => [name, false]));
  for (const file of files.map((line) => line.trim()).filter(Boolean)) {
    if (IGNORED.some((pattern) => pattern.test(file))) continue;
    for (const [name, patterns] of Object.entries(MODULES)) {
      if (patterns.some((pattern) => pattern.test(file))) result[name] = true;
    }
  }
  // Wiederverwendbare Workflows prüfen sich selbst: Wer sie ändert, löst sie auch aus.
  for (const file of files.map((line) => line.trim())) {
    if (file === '.github/workflows/_web.yml') result.web = true;
    if (file === '.github/workflows/_container.yml') result.container = true;
    if (file === '.github/workflows/ci.yml') {
      for (const name of Object.keys(result)) result[name] = true;
    }
  }
  // Das Image enthält die gebaute Website: Ändert sich die Website, wird es neu gebaut und geprüft.
  if (result.web) result.container = true;
  return /** @type {Record<keyof typeof MODULES, boolean>} */ (result);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const all = process.argv.includes('--all');
  const result = all
    ? Object.fromEntries(Object.keys(MODULES).map((name) => [name, true]))
    : classify(readFileSync(0, 'utf8').split('\n'));
  const lines = Object.entries(result).map(([name, value]) => `${name}=${value}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
  console.log(lines.join('\n'));
}
