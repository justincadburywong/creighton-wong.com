import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const refs = new Set();

for (const file of await fs.readdir(path.join(root, 'src/pages'))) {
  if (!/\.astro$/i.test(file)) continue;
  const text = await fs.readFile(path.join(root, 'src/pages', file), 'utf8');
  for (const match of text.matchAll(/(?:\/images\/)?([A-Za-z0-9._-]+\.(?:jpe?g|png))/gi)) {
    refs.add(match[1]);
  }
}

async function findFile(name) {
  const queue = [path.join(root, 'public', 'images')];
  while (queue.length) {
    const current = queue.pop();
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(full);
      } else if (entry.isFile() && entry.name === name) {
        return full;
      }
    }
  }

  return null;
}

for (const name of refs) {
  const src = await findFile(name);
  if (!src) continue;
  await sharp(src).webp({ quality: 82 }).toFile(src.replace(/\.(jpe?g|png)$/i, '.webp'));
}
