/**
 * Serves Ontime the way Ontime Cloud does: the docker bundle behind a router prefix
 * ie: http://localhost:4003/client-hash/timer
 * IS_CLOUD is not set since it forces the port used by the main test server
 *
 * The server writes the prefix into the client index.html at startup
 * so we serve a staged copy of the app to keep the shared client build untouched
 */
import { execFileSync, spawn } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const serverDir = join(root, 'apps/server');
const clientDir = join(root, 'apps/client');
const stage = join(root, 'e2e/tests/fixtures/tmp/cloud-server');
const app = join(stage, 'app');

rmSync(stage, { recursive: true, force: true });

// mirror the docker image layout
execFileSync('pnpm', ['--filter', 'ontime-server', 'build'], {
  cwd: root,
  env: { ...process.env, NODE_ENV: 'docker' },
  stdio: 'inherit',
});
cpSync(join(serverDir, 'dist'), join(app, 'server'), { recursive: true });
for (const folder of ['external', 'user', 'html']) {
  cpSync(join(serverDir, 'src', folder), join(app, folder), { recursive: true });
}

if (process.env.NODE_ENV === 'development') {
  // dev mode does not prebuild the client, we build our own copy to avoid racing other servers
  execFileSync('pnpm', ['--filter', 'ontime-ui', 'exec', 'vite', 'build', '--outDir', join(app, 'client')], {
    cwd: root,
    stdio: 'inherit',
  });
} else {
  cpSync(join(clientDir, 'build'), join(app, 'client'), { recursive: true });
}

const server = spawn(process.execPath, [join(app, 'server/docker.cjs')], {
  env: {
    ...process.env,
    NODE_ENV: 'docker',
    PORT: process.env.PORT ?? '4003',
    ONTIME_DATA: join(stage, 'data'),
    ROUTER_PREFIX: process.env.ROUTER_PREFIX ?? 'client-hash',
    IS_CLOUD: '',
    SESSION_PASSWORD: '',
  },
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}
server.on('exit', (code) => process.exit(code ?? 0));
