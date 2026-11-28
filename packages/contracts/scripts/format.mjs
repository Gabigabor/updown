// Stable, readable JSON for contracts: two-space indent, but short arrays of strings and
// every token binding on one line, so a contract reads like a table.
export function formatContract(value) {
  const inline = (v) => JSON.stringify(v).replace(/,(?=["{\[])/g, ', ').replace(/":/g, '": ');
  const fmt = (v, indent, key) => {
    const pad = '  '.repeat(indent);
    if (Array.isArray(v)) {
      if (v.every((x) => typeof x !== 'object') && inline(v).length <= 100) return inline(v);
      if (key === 'tokens') return `[\n${v.map((b) => `${pad}  ${inline(b)}`).join(',\n')}\n${pad}]`;
      return `[\n${v.map((x) => `${pad}  ${fmt(x, indent + 1)}`).join(',\n')}\n${pad}]`;
    }
    if (v && typeof v === 'object') {
      const entries = Object.entries(v);
      if (!entries.length) return '{}';
      return `{\n${entries.map(([k, x]) => `${pad}  ${JSON.stringify(k)}: ${fmt(x, indent + 1, k)}`).join(',\n')}\n${pad}}`;
    }
    return JSON.stringify(v);
  };
  return fmt(value, 0) + '\n';
}

// CLI: `pnpm contracts:format` rewrites every packages/react/src/**/*.contract.json in this layout.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../react/src');
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.contract.json') ? [path.join(dir, e.name)] : []);
  for (const file of walk(root)) {
    const before = fs.readFileSync(file, 'utf8');
    const after = formatContract(JSON.parse(before));
    if (after !== before) fs.writeFileSync(file, after);
    console.log(`${after === before ? 'unchanged' : 'formatted'}  ${path.relative(process.cwd(), file)}`);
  }
}
