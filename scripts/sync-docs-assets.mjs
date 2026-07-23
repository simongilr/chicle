import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const docsDir = join(root, 'docs');
const assetsDir = join(root, 'apps/app/src/assets/chicle-docs');

rmSync(assetsDir, { force: true, recursive: true });
mkdirSync(assetsDir, { recursive: true });

for (const entry of readdirSync(docsDir)) {
  const source = join(docsDir, entry);
  if (!entry.endsWith('.md') || !statSync(source).isFile()) {
    continue;
  }

  copyFileSync(source, join(assetsDir, basename(entry)));
}
