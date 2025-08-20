import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('src');
const distDir = path.resolve('dist');

// Copy popup.html to dist folder
const popupSrc = path.join(srcDir, 'popup.html');
const popupDest = path.join(distDir, 'popup.html');

try {
  fs.copyFileSync(popupSrc, popupDest);
  console.log('✅ popup.html copied to dist folder');
} catch (error) {
  console.error('❌ Failed to copy popup.html:', error.message);
}
