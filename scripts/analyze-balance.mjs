import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
if(!match) throw new Error('Script du jeu introuvable');

const context=createContext({
  console:{table(){},error(){}},
  document:{getElementById(){return null;}},
  window:{addEventListener(){}},
  requestAnimationFrame(){},
  localStorage:{getItem(){return null;},setItem(){},removeItem(){}},
  setTimeout,clearTimeout
});
new Script(match[1],{filename:'index.html'}).runInContext(context);

const scenarios=[
  {name:'fresh-0-click',clickRate:0,prestigePoints:'0'},
  {name:'fresh-2-clicks',clickRate:2,prestigePoints:'0'},
  {name:'fresh-5-clicks',clickRate:5,prestigePoints:'0'},
  {name:'one-shard-2-clicks',clickRate:2,prestigePoints:'1'}
];
context.__balanceScenarios=scenarios;
new Script(`
function cloneBalanceState(source){
  const state=GameState.create();
  state.cookies=source.cookies.clone();
  state.totalProduced=source.totalProduced.clone();
  state.totalClicks=source.totalClicks;
  state.clickPower=source.clickPower.clone();
  state.generators={...source.generators};
  state.ownedUpgrades=[...source.ownedUpgrades];
  state.prestigePoints=source.prestigePoints.clone();
  state.prestigeCurrency=source.prestigeCurrency.clone();
  state.ownedPrestigeUpgrades=[...source.ownedPrestigeUpgrades];
  state.prestigeCount=source.prestigeCount;
  Economy.refreshDerived(state);
  return state;
}
function modeledIncome(state,clickRate){
  return Economy.add(state.cps,Economy.multiply(state.clickReward,clickRate));
}
function boundedSeconds(value,remaining){
  const n=HugeNumber.from(value);
  if(n.e>8) return remaining+1;
  return Math.max(1,Math.min(remaining+1,Math.ceil(n.m*Math.pow(10,n.e))));
}
function candidateActions(state,clickRate){
  const baseIncome=modeledIncome(state,clickRate),actions=[];
  for(const id of Object.keys(GENERATORS)){
    const cost=Economy.generatorCost(GENERATORS[id],state.generators[id]);
    if(Economy.compare(state.cookies,cost)>-1){
      const copy=cloneBalanceState(state),engine=new GameEngine(copy);
      if(engine.buyGenerator(id)){
        const gain=Economy.subtract(modeledIncome(copy,clickRate),baseIncome);
        if(!gain.isZero()) actions.push({kind:'generator',id,cost,gain,score:Economy.divide(cost,gain)});
      }
    }
  }
  for(const id of Object.keys(UPGRADES)){
    const quote=Economy.upgradeQuote(state,id);
    if(quote.status==='available'){
      const copy=cloneBalanceState(state),engine=new GameEngine(copy);
      if(engine.buyUpgrade(id)){
        const gain=Economy.subtract(modeledIncome(copy,clickRate),baseIncome);
        if(!gain.isZero()) actions.push({kind:'upgrade',id,cost:quote.cost,gain,score:Economy.divide(quote.cost,gain)});
      }
    }
  }
  return actions;
}
function nextReachableCost(state){
  let best=null;
  for(const id of Object.keys(GENERATORS)){
    const cost=Economy.generatorCost(GENERATORS[id],state.generators[id]);
    if(best===null || Economy.compare(cost,best)<0) best=cost;
  }
  for(const id of Object.keys(UPGRADES)){
    const quote=Economy.upgradeQuote(state,id);
    if(quote.status==='insufficient' && (best===null || Economy.compare(quote.cost,best)<0)) best=quote.cost;
  }
  return best;
}
function simulateBalanceScenario(spec){
  const state=GameState.create();
  state.prestigePoints=HugeNumber.from(spec.prestigePoints);
  Economy.refreshDerived(state);
  const engine=new GameEngine(state),horizon=365*24*60*60;
  let seconds=0,purchases=0,steps=0;
  while(seconds<horizon && Economy.compare(state.totalProduced,'1e12')<0 && steps<200000){
    steps++;
    const actions=candidateActions(state,spec.clickRate);
    if(actions.length){
      actions.sort((a,b)=>Economy.compare(a.score,b.score));
      const chosen=actions[0];
      const ok=chosen.kind==='generator'?engine.buyGenerator(chosen.id):engine.buyUpgrade(chosen.id);
      if(!ok) throw new Error('Action candidate devenue invalide');
      purchases++;
      continue;
    }
    const income=modeledIncome(state,spec.clickRate);
    if(income.isZero()) break;
    const nextCost=nextReachableCost(state);
    let wait=1;
    if(nextCost && Economy.compare(state.cookies,nextCost)<0){
      wait=boundedSeconds(Economy.divide(Economy.subtract(nextCost,state.cookies),income),horizon-seconds);
    }
    wait=Math.min(wait,horizon-seconds);
    const amount=Economy.multiply(income,wait);
    state.cookies=Economy.add(state.cookies,amount);
    state.totalProduced=Economy.add(state.totalProduced,amount);
    seconds+=wait;
  }
  const reached=Economy.compare(state.totalProduced,'1e12')>=0;
  return {
    name:spec.name,clickRate:spec.clickRate,prestigePoints:spec.prestigePoints,
    reached,seconds,purchases,steps,
    cookies:Economy.format(state.cookies),totalProduced:Economy.format(state.totalProduced),
    cps:Economy.format(state.cps),clickReward:Economy.format(state.clickReward),
    pendingReward:Economy.format(Economy.prestigeReward(state))
  };
}
function prestigePolicyOrder(policy){
  const catalogue=Object.keys(PRESTIGE_UPGRADES);
  if(policy==='hold') return [];
  if(policy==='sequential') return catalogue;
  const preferred=policy==='click-priority'
    ? ['radiant_click','radiant_precision','radiant_production','harmonic_resonance','radiant_convergence']
    : policy==='production-priority'
      ? ['radiant_click','radiant_production','harmonic_resonance','radiant_precision','radiant_convergence']
      : null;
  if(!preferred) throw new Error('Politique prestige inconnue');
  return [...preferred.filter(id=>catalogue.includes(id)),...catalogue.filter(id=>!preferred.includes(id))];
}
function spendPrestigeShop(state,policy){
  const before=state.prestigeCurrency.clone(),pointsBefore=state.prestigePoints.clone(),purchased=[];
  const order=prestigePolicyOrder(policy);
  if(order.length){
    const engine=new GameEngine(state);
    let progressed=true;
    while(progressed){
      progressed=false;
      for(const id of order){
        if(Economy.prestigeUpgradeQuote(state,id).status==='available'){
          const cost=HugeNumber.from(PRESTIGE_UPGRADES[id].cost),walletBefore=state.prestigeCurrency.clone();
          if(!engine.buyPrestigeUpgrade(id)) throw new Error('Achat prestige annoncé disponible mais refusé');
          if(Economy.compare(Economy.subtract(walletBefore,state.prestigeCurrency),cost)!==0) throw new Error('Débit Éclat incorrect');
          if(Economy.compare(state.prestigePoints,pointsBefore)!==0) throw new Error('Un achat a réduit le Rayonnement');
          purchased.push(id);progressed=true;break;
        }
      }
    }
  }
  if(Economy.compare(state.prestigeCurrency,0)<0 || Economy.compare(state.prestigeCurrency,state.prestigePoints)>0) throw new Error('Portefeuille prestige invalide');
  return {walletBefore:Economy.format(before),walletAfter:Economy.format(state.prestigeCurrency),purchased};
}
function simulatePrestigeSeries(clickRate,cycles,policy='hold'){
  let state=GameState.create(),previousSeconds=null;
  const rows=[];
  for(let cycle=1;cycle<=cycles;cycle++){
    Economy.refreshDerived(state);
    const engine=new GameEngine(state),horizon=365*24*60*60;
    let seconds=0,purchases=0,steps=0;
    while(seconds<horizon && Economy.compare(state.totalProduced,'1e12')<0 && steps<200000){
      steps++;
      const actions=candidateActions(state,clickRate);
      if(actions.length){
        actions.sort((a,b)=>Economy.compare(a.score,b.score));
        const chosen=actions[0];
        const ok=chosen.kind==='generator'?engine.buyGenerator(chosen.id):engine.buyUpgrade(chosen.id);
        if(!ok) throw new Error('Action candidate prestige invalide');
        purchases++;continue;
      }
      const income=modeledIncome(state,clickRate);
      if(income.isZero()) break;
      const nextCost=nextReachableCost(state);
      let wait=1;
      if(nextCost && Economy.compare(state.cookies,nextCost)<0) wait=boundedSeconds(Economy.divide(Economy.subtract(nextCost,state.cookies),income),horizon-seconds);
      wait=Math.min(wait,horizon-seconds);
      const amount=Economy.multiply(income,wait);
      state.cookies=Economy.add(state.cookies,amount);state.totalProduced=Economy.add(state.totalProduced,amount);seconds+=wait;
    }
    if(Economy.compare(state.totalProduced,'1e12')<0) throw new Error('Cycle prestige non atteint');
    const candidate=engine.prestigeCandidate();
    if(!candidate || candidate.reward.isZero()) throw new Error('Récompense prestige absente');
    const pointsAfterPrestige=candidate.state.prestigePoints.clone();
    const spending=spendPrestigeShop(candidate.state,policy);
    if(Economy.compare(candidate.state.prestigePoints,pointsAfterPrestige)!==0) throw new Error('Dépense modifie le Rayonnement');
    const multiplier=Economy.prestigeMultiplier(candidate.state);
    const row={policy,cycle,seconds,purchases,steps,reward:Economy.format(candidate.reward),prestigePoints:Economy.format(candidate.state.prestigePoints),walletBefore:spending.walletBefore,walletAfter:spending.walletAfter,purchasedPrestigeUpgrades:spending.purchased,ownedPrestigeUpgrades:[...candidate.state.ownedPrestigeUpgrades],multiplier:Economy.format(multiplier),prestigeCount:candidate.state.prestigeCount};
    if(previousSeconds!==null && seconds>previousSeconds) throw new Error('Un cycle prestige devient plus lent sous politique identique');
    previousSeconds=seconds;rows.push(row);state=candidate.state;
  }
  return rows;
}
globalThis.__prestigeCatalogue=Object.fromEntries(Object.entries(PRESTIGE_UPGRADES).map(([id,d])=>[id,{requires:[...(d.requires ?? [])]}]));
globalThis.__balanceResults=__balanceScenarios.map(simulateBalanceScenario);
globalThis.__prestigeSeries=simulatePrestigeSeries(2,10,'hold');
globalThis.__prestigeShopSeries=simulatePrestigeSeries(2,10,'sequential');
globalThis.__prestigeClickSeries=simulatePrestigeSeries(2,15,'click-priority');
globalThis.__prestigeProductionSeries=simulatePrestigeSeries(2,15,'production-priority');
`,{filename:'balance-observatory'}).runInContext(context);

const results=context.__balanceResults;
const byName=Object.fromEntries(results.map(x=>[x.name,x]));
for(const row of results){
  for(const key of ['seconds','purchases','steps']) if(!Number.isFinite(row[key]) || row[key]<0) throw new Error(`${row.name}: métrique invalide ${key}`);
  if(row.reached && row.pendingReward==='0') throw new Error(`${row.name}: seuil atteint sans récompense prestige`);
}
if(byName['fresh-0-click'].reached) throw new Error('Une partie fraîche sans clic ne doit pas démarrer seule');
if(!byName['fresh-2-clicks'].reached || !byName['fresh-5-clicks'].reached) throw new Error('Le prestige doit être atteignable dans l’horizon diagnostique avec clics');
if(byName['fresh-5-clicks'].seconds>byName['fresh-2-clicks'].seconds) throw new Error('Plus de clics gratuits ralentissent le scénario déterministe');

console.table(results);
const hold=context.__prestigeSeries,shop=context.__prestigeShopSeries;
if(hold[0].seconds!==25141 || hold[9].seconds!==13148) throw new Error('Référence hold Foundation 2.5 modifiée');
if(shop[0].seconds!==hold[0].seconds) throw new Error('Le cycle 1 doit être identique avant toute dépense');
const catalogue=Object.keys(context.PRESTIGE_UPGRADES ?? {});
for(let i=0;i<shop.length;i++){
  const row=shop[i];
  if(!Array.isArray(row.purchasedPrestigeUpgrades)||!Array.isArray(row.ownedPrestigeUpgrades)) throw new Error('Traçage boutique absent');
  if(i && row.ownedPrestigeUpgrades.length<shop[i-1].ownedPrestigeUpgrades.length) throw new Error('Possession prestige non monotone');
}
const prestigeCatalogue=context.__prestigeCatalogue;
function assertValidPrestigeSeries(rows,label){
  let previous=new Set();
  for(const row of rows){
    const owned=new Set(row.ownedPrestigeUpgrades);
    if(owned.size!==row.ownedPrestigeUpgrades.length) throw new Error(label+': doublon prestige');
    for(const id of owned){
      if(!prestigeCatalogue[id]) throw new Error(label+': achat prestige inconnu');
      if(!(prestigeCatalogue[id].requires ?? []).every(dep=>owned.has(dep))) throw new Error(label+': prérequis absent');
    }
    for(const id of previous) if(!owned.has(id)) throw new Error(label+': possession non monotone');
    previous=owned;
  }
}
const click=context.__prestigeClickSeries,production=context.__prestigeProductionSeries;
assertValidPrestigeSeries(shop,'sequential');
assertValidPrestigeSeries(click,'click-priority');
assertValidPrestigeSeries(production,'production-priority');
if(!click.at(-1).ownedPrestigeUpgrades.includes('radiant_convergence') || !production.at(-1).ownedPrestigeUpgrades.includes('radiant_convergence')) throw new Error('Les politiques de branche doivent pouvoir converger');
console.table(results);
console.table(hold);
console.table(shop);
console.table(click);
console.table(production);
console.log('Balance observatory: PASS');
