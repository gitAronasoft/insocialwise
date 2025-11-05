const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting InSocialWise Application...\n');

const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

const clientProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BROWSER: 'none' }
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

clientProcess.on('error', (error) => {
  console.error('❌ Failed to start client:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down InSocialWise Application...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
});

console.log('✅ Backend starting on port 3001...');
console.log('✅ Frontend starting on port 5000...\n');
console.log('📝 Press Ctrl+C to stop both servers\n');
