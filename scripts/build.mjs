import fs from 'node:fs/promises';
import { build } from 'esbuild';
import { zipSync } from 'fflate';
await fs.mkdir('dist', { recursive: true });
await build({ entryPoints: ['src/runtime.ts'], outfile: 'dist/runtime.js', bundle: true, format: 'iife', globalName: 'EngramWeave', platform: 'browser', target: 'firefox140', sourcemap: false });
const files = ['manifest.json','bootstrap.js','capture.xhtml','preferences.xhtml','styles.css','prefs-pane.xhtml','prefs-pane.js','locale/en-US/engramweave.ftl'];
for (const name of files) { await fs.mkdir(new URL(`../dist/${name.substring(0,name.lastIndexOf('/')+1)}`,import.meta.url),{recursive:true});await fs.copyFile(name, `dist/${name}`); }
const entries = {};
for (const name of [...files,'runtime.js']) entries[name] = new Uint8Array(await fs.readFile(`dist/${name}`));
await fs.writeFile('dist/engramweave-zotero.xpi', zipSync(entries, { level: 6 }));
