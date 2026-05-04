/**
 * Produces lambda-deploy.zip for `aws lambda update-function-code`.
 * Copies app sources (no tests), runs npm ci --omit=dev, zips the bundle.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'lambda-package');
const ZIP_PATH = path.join(ROOT, 'lambda-deploy.zip');

const COPY_NAMES = [
  'lambda.js',
  'server.js',
  'websocket-lambda.js',
  'websocket.js',
  'package.json',
  'package-lock.json',
  'docs.html',
  'config',
  'middleware',
  'models',
  'prompts',
  'routes',
  'services',
  'utils',
  'websocket',
];

function rimraf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyTree(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyTree(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

async function zipDirectory(srcDir, outFile) {
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outFile);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(srcDir, false);
    archive.finalize();
  });
}

async function main() {
  rimraf(OUT_DIR);
  rimraf(ZIP_PATH);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const name of COPY_NAMES) {
    const from = path.join(ROOT, name);
    if (!fs.existsSync(from)) {
      console.error(`Missing required path: ${from}`);
      process.exit(1);
    }
    copyTree(from, path.join(OUT_DIR, name));
  }

  console.log('npm ci --omit=dev …');
  execSync('npm ci --omit=dev', { cwd: OUT_DIR, stdio: 'inherit' });

  console.log(`Writing ${ZIP_PATH} …`);
  await zipDirectory(OUT_DIR, ZIP_PATH);
  const stats = fs.statSync(ZIP_PATH);
  console.log(`Done. Size: ${(stats.size / 1024 / 1024).toFixed(2)} MiB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
