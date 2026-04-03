#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

// On parse les arguments (port et server URL)
const rawArgs = process.argv.slice(2);
const nuxiArgs = [];
const envOverrides = { ...process.env };

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--port' || arg === '-p') {
    nuxiArgs.push('--port', rawArgs[++i]);
  } else if (arg === '--server' || arg === '-s') {
    envOverrides.NUXT_PUBLIC_AGENT_SERVER_URL = rawArgs[++i];
  } else {
    nuxiArgs.push(arg);
  }
}

// Par défaut on lance 'dev'
if (nuxiArgs.length === 0 || !['dev', 'build', 'preview', 'generate'].includes(nuxiArgs[0])) {
  if (nuxiArgs.length > 0 && nuxiArgs[0].startsWith('-')) {
    nuxiArgs.unshift('dev');
  } else if (nuxiArgs.length === 0) {
    nuxiArgs.push('dev');
  }
}

console.log('\x1b[32m%s\x1b[0m', '🤖 AI SDK Office - Lancement de l\'interface...');
if (envOverrides.NUXT_PUBLIC_AGENT_SERVER_URL) {
  console.log('\x1b[36m%s\x1b[0m', `🔗 Agent Server URL set to: ${envOverrides.NUXT_PUBLIC_AGENT_SERVER_URL}`);
}

// On force le répertoire de travail vers la racine du package pour que nuxi trouve nuxt.config.ts
process.chdir(root);

// Détermine la commande nuxi (support Windows .cmd)
const shell = process.platform === 'win32';
const nuxiPath = join(root, 'node_modules', '.bin', shell ? 'nuxi.cmd' : 'nuxi');

const nuxi = spawn(nuxiPath, nuxiArgs, {
  stdio: 'inherit',
  shell: shell,
  env: envOverrides
});

nuxi.on('error', (err) => {
  console.error('\x1b[31m%s\x1b[0m', '❌ Erreur lors du lancement de nuxi. Assurez-vous d\'avoir installé les dépendances.');
  process.exit(1);
});

nuxi.on('exit', (code) => {
  process.exit(code || 0);
});
