const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function packageWebSocketLambda() {
  const output = fs.createWriteStream(path.join(__dirname, '..', 'websocket-lambda.zip'));
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log('WebSocket Lambda package created: websocket-lambda.zip');
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add WebSocket handler files
    archive.file(path.join(__dirname, '..', 'websocket', 'lambdaHandler.js'), { name: 'lambdaHandler.js' });
    archive.file(path.join(__dirname, '..', 'websocket', 'websocketHandler.js'), { name: 'websocketHandler.js' });
    
    // Add node_modules (only production dependencies)
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const dependencies = Object.keys(packageJson.dependencies || {});
    
    archive.directory(path.join(__dirname, '..', 'node_modules'), 'node_modules');

    archive.finalize();
  });
}

if (require.main === module) {
  packageWebSocketLambda().catch(console.error);
}

module.exports = { packageWebSocketLambda };
