// Erzeugt src/icons/data.ts aus lucide-static (ISC-Lizenz).
// Nur die hier gelisteten Icons landen im Bundle. Aufruf: pnpm --filter @luescher/ui icons
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const nodes = JSON.parse(readFileSync(require.resolve('lucide-static/icon-nodes.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(require.resolve('lucide-static/package.json'), 'utf8'));

/** Name im Projekt → Name bei Lucide */
const ICONS = {
  'arrow-right': 'arrow-right',
  'arrow-left': 'arrow-left',
  'arrow-down': 'arrow-down',
  'arrow-up-right': 'arrow-up-right',
  'arrow-down-right': 'arrow-down-right',
  check: 'check',
  x: 'x',
  plus: 'plus',
  minus: 'minus',
  menu: 'menu',
  'chevron-down': 'chevron-down',
  'chevron-right': 'chevron-right',
  clock: 'clock',
  'calendar-clock': 'calendar-clock',
  mail: 'mail',
  phone: 'phone',
  'map-pin': 'map-pin',
  route: 'route',
  store: 'store',
  house: 'house',
  info: 'info',
  'circle-check': 'circle-check',
  'circle-alert': 'circle-exclamation-point',
  'circle-x': 'circle-x',
  'triangle-alert': 'triangle-exclamation-point',
  'external-link': 'external-link',
  send: 'send',
  printer: 'printer',
  pause: 'pause',
  play: 'play',
  cookie: 'cookie',
  sofa: 'sofa',
  armchair: 'armchair',
  utensils: 'utensils',
  'bed-double': 'bed-double',
  blinds: 'blinds',
  layers: 'layers',
  'grid-2x2': 'grid-2x2',
  lamp: 'lamp',
  'lamp-ceiling': 'lamp-ceiling',
  'pencil-ruler': 'pencil-ruler',
  truck: 'truck',
  wrench: 'wrench',
  'messages-square': 'messages-square',
  sparkles: 'sparkles',
  leaf: 'leaf',
  recycle: 'recycle',
  'audio-lines': 'audio-lines',
  newspaper: 'newspaper',
  users: 'users',
  user: 'user',
  handshake: 'handshake',
  palette: 'palette',
  image: 'image',
  'door-open': 'door-open',
  'swatch-book': 'swatch-book',
};

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const out = {};
const missing = [];
for (const [name, lucide] of Object.entries(ICONS)) {
  const node = nodes[lucide];
  if (!node) {
    missing.push(`${name} (${lucide})`);
    continue;
  }
  out[name] = node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .map(([k, v]) => `${k}="${esc(v)}"`)
        .join(' ');
      return `<${tag} ${a}/>`;
    })
    .join('');
}
if (missing.length) {
  console.error('Nicht gefunden bei Lucide:', missing.join(', '));
  process.exit(1);
}

const names = Object.keys(out).sort();
const body = names.map((n) => `  ${JSON.stringify(n)}: ${JSON.stringify(out[n])},`).join('\n');
const file = `// GENERIERT von scripts/gen-icons.mjs – nicht von Hand ändern.
// Quelle: lucide-static v${pkg.version} (ISC-Lizenz, https://lucide.dev)

export const iconData = {
${body}
} as const;

export type IconName = keyof typeof iconData;
`;
const target = resolve(dirname(fileURLToPath(import.meta.url)), '../src/icons/data.ts');
writeFileSync(target, file);
console.log(`${names.length} Icons → ${target}`);
