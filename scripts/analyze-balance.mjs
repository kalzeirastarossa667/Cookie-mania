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
globalThis.__balanceResults=__balanceScenarios.map(simulateBalanceScenario);
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
console.log('Balance observatory: PASS');
