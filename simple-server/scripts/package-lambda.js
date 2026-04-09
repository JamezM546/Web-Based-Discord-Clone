const fs = require('fs');
const path = require('path');
const child = require('child_process');
const archiver = require('archiver');

const root = process.cwd();
const outName = `deploy-package-${Date.now()}.zip`;
const outputPath = path.join(root, outName);

async function run() {
  console.log('Packaging lambda deployment...');

  // Install production dependencies only
  console.log('Installing production dependencies...');
  child.execSync('npm ci --production', { stdio: 'inherit' });

  // Create zip
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log(`${outName} created (${archive.pointer()} total bytes)`);
    console.log('Upload this zip to the AWS Lambda console and set handler to: simple-server/lambda.handler');
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') console.warn(err);
    else throw err;
  });

  archive.on('error', (err) => { throw err; });

  archive.pipe(output);

  // Include everything in this folder except common heavy/dev files
  const exclude = ['.git/**', 'coverage/**', 'tests/**', '.github/**'];

  archive.glob('**/*', {
    cwd: root,
    dot: true,
    ignore: exclude
  });

  await archive.finalize();
}

run().catch(err => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
