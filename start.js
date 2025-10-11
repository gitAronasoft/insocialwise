const { spawn } = require('child_process');
const path = require('path');

console.log('==========================================');
console.log('Starting Full-Stack Application');
console.log('Backend (API) will run on http://0.0.0.0:3001');
console.log('Frontend (React) will run on http://0.0.0.0:5000');
console.log('==========================================\n');

// Start backend
const backend = spawn('node', ['index.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: ['inherit', 'pipe', 'pipe'],
  detached: false
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`[Backend] ${data}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`[Backend] ${data}`);
});

backend.on('error', (error) => {
  console.error(`[Backend] Error: ${error.message}`);
});

backend.on('close', (code) => {
  console.log(`[Backend] Process exited with code ${code}`);
});

// Start frontend  
const frontend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'client'),
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, PORT: '5000', HOST: '0.0.0.0', BROWSER: 'none' },
  detached: false
});

frontend.stdout.on('data', (data) => {
  process.stdout.write(`[Frontend] ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`[Frontend] ${data}`);
});

frontend.on('error', (error) => {
  console.error(`[Frontend] Error: ${error.message}`);
});

frontend.on('close', (code) => {
  console.log(`[Frontend] Process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nStopping servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nStopping servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});
