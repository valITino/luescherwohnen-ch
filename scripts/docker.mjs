// Container-Image bauen und lokal starten, mit denselben Härtungen wie in compose.yaml.
//
//   node scripts/docker.mjs build [--tag luescherwohnen:local] [--preview]
//   node scripts/docker.mjs run   [--tag luescherwohnen:local] [--port 8080] [--name luescher-web]
//   node scripts/docker.mjs stop  [--name luescher-web]
//
// Hinter einem TLS-Proxy (Claude-Code-Cloud, Firmennetz) übernimmt `build` den Proxy aus
// HTTPS_PROXY und reicht das CA-Zertifikat aus SSL_CERT_FILE / NODE_EXTRA_CA_CERTS als
// Build-Secret durch. Das Zertifikat landet nie im Image.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [command = 'build', ...args] = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const tag = flag('--tag', 'luescherwohnen:local');
const name = flag('--name', 'luescher-web');
const port = flag('--port', '8080');

/**
 * Führt docker aus und zeigt den Aufruf. `shown` ersetzt Werte aus der Umgebung durch Platzhalter:
 * Eine Proxy-Adresse kann Zugangsdaten enthalten und gehört nicht ins Protokoll.
 * @param {string[]} dockerArgs
 * @param {{ shown?: string[], env?: NodeJS.ProcessEnv }} [options]
 */
const docker = (dockerArgs, { shown = dockerArgs, env = process.env } = {}) => {
  console.log(`$ docker ${shown.join(' ')}`);
  execFileSync('docker', dockerArgs, { cwd: root, stdio: 'inherit', env });
};

if (command === 'build') {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || '';
  const noProxy = process.env.NO_PROXY || process.env.no_proxy || '';
  const ca = [process.env.NODE_EXTRA_CA_CERTS, process.env.SSL_CERT_FILE].find(
    (file) => file && existsSync(file),
  );
  const preview = args.includes('--preview');
  const buildArgs = ['build', '--tag', tag, '--progress', 'plain'];
  const shown = [...buildArgs];
  const env = { ...process.env };
  if (proxy) {
    // Der Proxy lauscht auf 127.0.0.1 des Hosts: nur im Host-Netz erreichbar. `--build-arg NAME`
    // ohne Wert übernimmt docker aus seiner Umgebung: So steht die Adresse weder im Protokoll
    // noch in der Prozessliste.
    env.HTTPS_PROXY = proxy;
    buildArgs.push('--network', 'host', '--build-arg', 'HTTPS_PROXY');
    shown.push('--network', 'host', '--build-arg', 'HTTPS_PROXY');
    if (noProxy) {
      env.NO_PROXY = noProxy;
      buildArgs.push('--build-arg', 'NO_PROXY');
      shown.push('--build-arg', 'NO_PROXY');
    }
  }
  if (ca) {
    buildArgs.push('--secret', `id=ca,src=${ca}`);
    shown.push('--secret', 'id=ca,src=<CA-Zertifikat>');
  }
  if (preview) {
    const previewArgs = [
      '--build-arg',
      `PUBLIC_WEB_URL=http://localhost:${port}`,
      '--build-arg',
      'PUBLIC_CONTACT_ENDPOINT=mock',
      '--build-arg',
      'PUBLIC_PREVIEW=true',
    ];
    buildArgs.push(...previewArgs);
    shown.push(...previewArgs);
  }
  buildArgs.push('.');
  shown.push('.');
  docker(buildArgs, { shown, env });
} else if (command === 'run') {
  docker([
    'run',
    '--detach',
    '--rm',
    '--name',
    name,
    '--publish',
    `127.0.0.1:${port}:8080`,
    '--read-only',
    '--tmpfs',
    '/tmp:size=16m',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges:true',
    tag,
  ]);
  console.log(`Läuft: http://localhost:${port}/  (stoppen: node scripts/docker.mjs stop)`);
} else if (command === 'stop') {
  docker(['rm', '--force', name]);
} else {
  console.error('Aufruf: node scripts/docker.mjs build|run|stop [Optionen]');
  process.exit(1);
}
