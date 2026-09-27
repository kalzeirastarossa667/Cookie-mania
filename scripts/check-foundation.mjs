import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error('Script du jeu introuvable');

new Script(match[1], { filename: 'index.html' });
const diagnostic = { replaceChildren(node) { this.text = node.textContent; } };
const details = { classList: { toggle() {} }, open: false };
const stored = new Map();
const context = createContext({
  console: { table() {}, error() {} },
  document: {
    createElement: () => ({}),
    getElementById: id => id === 'diagnosticResults' ? diagnostic : details,
  },
  window: { addEventListener() {} },
  localStorage: {
    getItem: key => stored.has(key) ? stored.get(key) : null,
    setItem: (key, value) => stored.set(key, String(value)),
    removeItem: key => stored.delete(key),
  },
  setTimeout,
  clearTimeout,
});
new Script(`${match[1]}\n;globalThis.testOutcome=runFoundationTests();`, { filename: 'index.html' }).runInContext(context);
const result = context.testOutcome;
if (!result.passed) {
  console.error(result.failed);
  process.exitCode = 1;
}
console.log(diagnostic.text);
