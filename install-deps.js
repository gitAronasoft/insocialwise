const { execSync } = require('child_process');
const path = require('path');

console.log('Installing server dependencies...');
try {
  execSync('npm install', { 
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit'
  });
  console.log('Server dependencies installed successfully');
} catch (error) {
  console.error('Error installing server dependencies:', error.message);
}

console.log('\nInstalling client dependencies...');
try {
  execSync('npm install --legacy-peer-deps', { 
    cwd: path.join(__dirname, 'client'),
    stdio: 'inherit'
  });
  console.log('Client dependencies installed successfully');
} catch (error) {
  console.error('Error installing client dependencies:', error.message);
}
