import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const distAssets = path.resolve(distDir, 'assets');
const rootAssets = path.resolve(rootDir, 'assets');
const distHtml = path.resolve(distDir, 'template.html');
const distIndex = path.resolve(distDir, 'index.html');
const rootIndex = path.resolve(rootDir, 'index.html');

// 1. Ensure dist/index.html exists for Capacitor / mobile build
if (fs.existsSync(distHtml)) {
  fs.copyFileSync(distHtml, distIndex);
}

// 2. Read template.html or index.html from dist
let htmlContent = fs.readFileSync(fs.existsSync(distHtml) ? distHtml : distIndex, 'utf8');

// 3. Read CSS & JS to inline them directly into root index.html as requested
let cssContent = '';
let jsContent = '';

if (fs.existsSync(distAssets)) {
  const files = fs.readdirSync(distAssets);
  for (const file of files) {
    const filePath = path.join(distAssets, file);
    if (file.endsWith('.css')) {
      cssContent += fs.readFileSync(filePath, 'utf8') + '\n';
    } else if (file.endsWith('.js')) {
      jsContent += fs.readFileSync(filePath, 'utf8') + '\n';
    }
  }

  // Also sync assets/ to root assets/ so both inline and asset references work 100% reliably
  if (fs.existsSync(rootAssets)) {
    fs.rmSync(rootAssets, { recursive: true, force: true });
  }
  fs.cpSync(distAssets, rootAssets, { recursive: true });
  console.log('✓ Synced dist/assets to root assets/');
}

// 4. Inline CSS and JS into root index.html using function replacers to prevent $` corruption
if (cssContent) {
  htmlContent = htmlContent.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
  htmlContent = htmlContent.replace('</head>', () => `    <style>\n${cssContent}    </style>\n  </head>`);
}

if (jsContent) {
  htmlContent = htmlContent.replace(/<script[^>]*type=["']module["'][^>]*src=[^>]*><\/script>/gi, '');
  htmlContent = htmlContent.replace('</body>', () => `    <script type="module">\n${jsContent}    </script>\n  </body>`);
}

// 5. Write self-contained root index.html
fs.writeFileSync(rootIndex, htmlContent, 'utf8');
console.log('✓ Successfully wrote inlined full UI, CSS & JS into root index.html');

// 6. Ensure root chatbase.png exists for root index.html and favicon
const publicLogo = path.resolve(rootDir, 'public', 'chatbase.png');
const rootLogo = path.resolve(rootDir, 'chatbase.png');
if (fs.existsSync(publicLogo)) {
  fs.copyFileSync(publicLogo, rootLogo);
  console.log('✓ Ensured chatbase.png exists in project root');
}

// 7. Write .nojekyll for GitHub Pages so no files are blocked
const noJekyllPath = path.resolve(rootDir, '.nojekyll');
fs.writeFileSync(noJekyllPath, '', 'utf8');
console.log('✓ Ensured .nojekyll exists in root');
