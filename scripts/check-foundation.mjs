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
  requestAnimationFrame() {},
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
if (result.total < 157) throw new Error(`Suite de régression incomplète : ${result.total}/157 cas attendus`);
if (!result.passed) {
  console.error(result.failed);
  process.exitCode = 1;
}
console.log(diagnostic.text);
new Script(`
  const counts={render:0,recovery:0,save:0,tick:0};
  const app={lastFrame:0,saveAccumulator:0,renderAccumulator:0,state:{},
    engine:{tick(){counts.tick++;}},
    ui:{render(){counts.render++;},renderRecovery(){counts.recovery++;}},
    saveSystem:{save(){counts.save++;}}};
  for(let time=250;time<=5000;time+=250) CookieEmpireApp.prototype.loop.call(app,time);
  if(counts.tick!==20 || counts.render!==20 || counts.save!==1 || counts.recovery!==1)
    throw new Error('Cadence UI/sauvegarde incorrecte : '+JSON.stringify(counts));
  globalThis.loopCounts=counts;
`).runInContext(context);
console.log(`Cadence simulation : ${context.loopCounts.render} rendus, ${context.loopCounts.save} sauvegarde sur 5 s`);
