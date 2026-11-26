import { Jimp } from 'jimp';
import fs from 'node:fs';
import path from 'node:path';

const srcImgPath = path.resolve('public/assets/layla_blush.jpg');

async function main() {
  const img = await Jimp.read(srcImgPath);
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  const side = Math.min(w, h);
  const x = Math.floor((w - side) / 2);
  const y = Math.floor((h - side) * 0.25);

  const square = img.crop({ x, y: Math.max(0, y), w: side, h: side });

  const icon512 = square.clone().resize({ w: 512, h: 512 });
  await icon512.write('public/icon-512.png');

  const icon192 = square.clone().resize({ w: 192, h: 192 });
  await icon192.write('public/icon-192.png');

  // Also update Android mipmap launcher icons if android/ exists
  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  const resBase = path.resolve('android/app/src/main/res');
  if (fs.existsSync(resBase)) {
    for (const m of mipmaps) {
      const targetDir = path.join(resBase, m.dir);
      if (fs.existsSync(targetDir)) {
        const resized = square.clone().resize({ w: m.size, h: m.size });
        await resized.write(path.join(targetDir, 'ic_launcher.png'));
        await resized.write(path.join(targetDir, 'ic_launcher_round.png'));
        const fg = square.clone().resize({ w: Math.round(m.size * 2.25), h: Math.round(m.size * 2.25) });
        await fg.write(path.join(targetDir, 'ic_launcher_foreground.png'));
      }
    }
    console.log('Updated Android launcher icons!');
  }
  console.log('Generated PWA & App icons!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
