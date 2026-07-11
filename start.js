// Combined start script for Railway deployment
// Runs both the NestJS API and Next.js web app in a single container
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname);

// Start API on internal port 3001
const api = spawn('node', ['apps/api/dist/main'], {
  cwd: ROOT,
  env: { ...process.env, PORT: '3001', API_PORT: '3001' },
  stdio: 'inherit',
});

// Start Next.js on the Railway-assigned PORT (external-facing)
const web = spawn('node_modules/.bin/next', ['start', '--port', process.env.PORT || '3000'], {
  cwd: path.join(ROOT, 'apps/web'),
  env: {
    ...process.env,
    NEXT_PUBLIC_API_URL: process.env.API_URL || `http://localhost:3001`,
  },
  stdio: 'inherit',
});

// Handle process exits
function shutdown(code) {
  api.kill();
  web.kill();
  process.exit(code);
}

api.on('exit', (code) => {
  console.error(`[API] Process exited with code ${code}`);
  if (code !== 0) shutdown(code);
});

web.on('exit', (code) => {
  console.error(`[WEB] Process exited with code ${code}`);
  if (code !== 0) shutdown(code);
});

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

console.log('🚀 Revorax starting — API on :3001, Web on :' + (process.env.PORT || '3000'));
