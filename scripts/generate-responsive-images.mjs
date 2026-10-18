import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const inputDir = path.resolve('assets/images/recipes');
const widths = [480, 768, 1200];
const files = (await fs.readdir(inputDir)).filter(name => name.toLowerCase().endsWith('.webp'));

for (const file of files) {
  const source = path.join(inputDir, file);
  const slug = file.slice(0, -'.webp'.length);
  const image = sharp(source, { failOn: 'none' });

  for (const width of widths) {
    await image.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(path.join(inputDir, `${slug}-${width}.webp`));
    await image.clone().resize({ width, withoutEnlargement: true }).avif({ quality: 58, effort: 5 }).toFile(path.join(inputDir, `${slug}-${width}.avif`));
  }

  console.log(`Generated responsive variants for ${slug}`);
}

console.log(`Processed ${files.length} recipe images.`);
