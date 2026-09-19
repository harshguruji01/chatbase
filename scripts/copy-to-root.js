import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const distAssets = path.resolve(distDir, 'assets');
const rootAssets = path.resolve(rootDir, 'assets');
const distIndex = path.resolve(distDir, 'index.html');
const rootIndex = path.resolve(rootDir, 'index.html');

if (fs.existsSync(distIndex)) {
  fs.copyFileSync(distIndex, rootIndex);
  console.log('✓ Copied dist/index.html to root index.html');
}

if (fs.existsSync(distAssets)) {
  if (fs.existsSync(rootAssets)) {
    fs.rmSync(rootAssets, { recursive: true, force: true });
  }
  fs.cpSync(distAssets, rootAssets, { recursive: true });
  console.log('✓ Copied dist/assets to root assets/');
}
