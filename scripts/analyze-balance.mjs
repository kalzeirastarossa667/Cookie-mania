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

const progressionSpecs=[
  {
    name:'single-efficiency-2-clicks',
    description:'Achats unitaires et recherches classés par rendement immédiat coût/gain ; aucun contrôle bulk forcé.',
    clickRate:2,
    mode:'prestige-cycles',
    prestigeCycles:5,
    controlOrder:[]
  },
  {
    name:'x10-then-max-2-clicks',
    description:'Exerce réellement ×10 puis Max dès que leur contrat déterministe est atteignable, puis revient aux achats unitaires/recherches par coût/gain.',
    clickRate:2,
    mode:'prestige-cycles',
    prestigeCycles:5,
    controlOrder:['x10','max']
  },
  {
    name:'max-then-x10-2-clicks',
    description:'Exerce réellement Max puis ×10 dès que leur contrat déterministe est atteignable, puis revient aux achats unitaires/recherches par coût/gain.',
    clickRate:2,
    mode:'prestige-cycles',
    prestigeCycles:5,
    controlOrder:['max','x10']
  },
  {
    name:'late-run-5-clicks',
    description:'Partie continue sans prestige, destinée à observer les générateurs/ères tardifs avec la même politique d’achat unitaire.',
    clickRate:5,
    mode:'continuous',
    horizonSeconds:10*365*24*60*60,
    targetProduced:'1e22',
    controlOrder:[]
  },
  {
    name:'zero-click-1h',
    description:'Scénario sentinelle sans clic ni production initiale ; vérifie la représentation déterministe des jalons non atteints.',
    clickRate:0,
    mode:'continuous',
    horizonSeconds:60*60,
    targetProduced:'1e12',
    controlOrder:[]
  }
];

context.__balanceScenarios=scenarios;
context.__progressionSpecs=progressionSpecs;
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

function executeAction(engine,action){
  const beforeCookies=engine.state.cookies.clone();
  let quantity=0;
  if(action.kind==='generator'){
    if(action.mode==='single') quantity=engine.buyGenerator(action.id)?1:0;
    else if(action.mode==='x10') quantity=engine.buyGenerators(action.id,10);
    else if(action.mode==='max') quantity=engine.buyMaxGenerator(action.id);
    else throw new Error('Mode achat générateur inconnu');
  }else if(action.kind==='upgrade'){
    quantity=engine.buyUpgrade(action.id)?1:0;
  }else{
    throw new Error('Action observatoire inconnue');
  }
  return {
    ok:quantity>0,
    quantity,
    cost:Economy.subtract(beforeCookies,engine.state.cookies)
  };
}

function evaluateAction(state,clickRate,action,{minimumQuantity=1}={}){
  const baseIncome=modeledIncome(state,clickRate);
  const copy=cloneBalanceState(state);
  const engine=new GameEngine(copy);
  const result=executeAction(engine,action);
  if(!result.ok || result.quantity<minimumQuantity) return null;
  const gain=Economy.subtract(modeledIncome(copy,clickRate),baseIncome);
  if(gain.isZero()) return null;
  return {
    ...action,
    expectedQuantity:result.quantity,
    cost:result.cost,
    gain,
    score:Economy.divide(result.cost,gain)
  };
}

function bestByScore(actions){
  if(!actions.length) return null;
  actions.sort((a,b)=>Economy.compare(a.score,b.score));
  return actions[0];
}

function candidateActions(state,clickRate){
  const actions=[];
  for(const id of Object.keys(GENERATORS)){
    const candidate=evaluateAction(state,clickRate,{kind:'generator',mode:'single',id});
    if(candidate) actions.push(candidate);
  }
  for(const id of Object.keys(UPGRADES)){
    if(Economy.upgradeQuote(state,id).status!=='available') continue;
    const candidate=evaluateAction(state,clickRate,{kind:'upgrade',mode:'research',id});
    if(candidate) actions.push(candidate);
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

function controlTargetCost(state,control){
  let best=null;
  for(const id of Object.keys(GENERATORS)){
    const owned=state.generators[id];
    if(!Number.isSafeInteger(owned) || owned<0) throw new Error('Compteur générateur invalide dans observatoire');
    const quantity=control==='x10'?10:control==='max'?2:0;
    if(!quantity || quantity>Number.MAX_SAFE_INTEGER-owned) continue;
    const cost=Economy.generatorBatchCost(GENERATORS[id],owned,quantity);
    if(best===null || Economy.compare(cost,best)<0) best=cost;
  }
  return best;
}

function forcedControlCandidate(state,clickRate,control){
  const actions=[];
  for(const id of Object.keys(GENERATORS)){
    const action={kind:'generator',mode:control,id};
    const candidate=evaluateAction(state,clickRate,action,{minimumQuantity:control==='max'?2:10});
    if(candidate) actions.push(candidate);
  }
  return bestByScore(actions);
}

function pendingControl(policyState){
  return policyState.controlOrder.find(control=>!policyState.usedControls.has(control)) ?? null;
}

function chooseProgressionAction(state,clickRate,policyState){
  const control=pendingControl(policyState);
  if(control) return forcedControlCandidate(state,clickRate,control);
  return bestByScore(candidateActions(state,clickRate));
}

function progressionNextCost(state,policyState){
  const control=pendingControl(policyState);
  return control?controlTargetCost(state,control):nextReachableCost(state);
}

function runEconomicWindow(state,{
  clickRate,
  targetProduced='1e12',
  horizonSeconds=365*24*60*60,
  maxSteps=200000,
  chooseAction=(current)=>bestByScore(candidateActions(current,clickRate)),
  chooseNextCost=(current)=>nextReachableCost(current),
  onAction=null
}={}){
  const engine=new GameEngine(state);
  let seconds=0,purchases=0,steps=0;
  while(seconds<horizonSeconds && Economy.compare(state.totalProduced,targetProduced)<0 && steps<maxSteps){
    steps++;
    const action=chooseAction(state);
    if(action){
      const before={
        generators:{...state.generators},
        ownedUpgrades:[...state.ownedUpgrades]
      };
      const result=executeAction(engine,action);
      if(!result.ok) throw new Error('Action candidate devenue invalide');
      if(action.expectedQuantity!==undefined && result.quantity!==action.expectedQuantity) throw new Error('Quantité candidate différente à l’exécution');
      purchases++;
      if(onAction) onAction({seconds,action,result,before,state});
      continue;
    }

    const income=modeledIncome(state,clickRate);
    if(income.isZero()) break;
    const nextCost=chooseNextCost(state);
    let wait=1;
    if(nextCost && Economy.compare(state.cookies,nextCost)<0){
      wait=boundedSeconds(Economy.divide(Economy.subtract(nextCost,state.cookies),income),horizonSeconds-seconds);
    }
    wait=Math.min(wait,horizonSeconds-seconds);
    const amount=Economy.multiply(income,wait);
    state.cookies=Economy.add(state.cookies,amount);
    state.totalProduced=Economy.add(state.totalProduced,amount);
    seconds+=wait;
  }
  return {
    engine,
    reached:Economy.compare(state.totalProduced,targetProduced)>=0,
    seconds,
    purchases,
    steps
  };
}

function simulateBalanceScenario(spec){
  const state=GameState.create();
  state.prestigePoints=HugeNumber.from(spec.prestigePoints);
  Economy.refreshDerived(state);
  const run=runEconomicWindow(state,{clickRate:spec.clickRate,targetProduced:'1e12'});
  return {
    name:spec.name,clickRate:spec.clickRate,prestigePoints:spec.prestigePoints,
    reached:run.reached,seconds:run.seconds,purchases:run.purchases,steps:run.steps,
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
    const run=runEconomicWindow(state,{clickRate,targetProduced:'1e12'});
    if(!run.reached) throw new Error('Cycle prestige non atteint');
    const candidate=run.engine.prestigeCandidate();
    if(!candidate || candidate.reward.isZero()) throw new Error('Récompense prestige absente');
    const pointsAfterPrestige=candidate.state.prestigePoints.clone();
    const spending=spendPrestigeShop(candidate.state,policy);
    if(Economy.compare(candidate.state.prestigePoints,pointsAfterPrestige)!==0) throw new Error('Dépense modifie le Rayonnement');
    const multiplier=Economy.prestigeMultiplier(candidate.state);
    const row={
      policy,cycle,seconds:run.seconds,purchases:run.purchases,steps:run.steps,
      reward:Economy.format(candidate.reward),prestigePoints:Economy.format(candidate.state.prestigePoints),
      walletBefore:spending.walletBefore,walletAfter:spending.walletAfter,
      purchasedPrestigeUpgrades:spending.purchased,
      ownedPrestigeUpgrades:[...candidate.state.ownedPrestigeUpgrades],
      multiplier:Economy.format(multiplier),prestigeCount:candidate.state.prestigeCount
    };
    if(previousSeconds!==null && run.seconds>previousSeconds) throw new Error('Un cycle prestige devient plus lent sous politique identique');
    previousSeconds=run.seconds;rows.push(row);state=candidate.state;
  }
  return rows;
}

function generatorEra(id){
  for(const era of GENERATOR_ERAS) if(era.ids.includes(id)) return era;
  throw new Error('Ère introuvable pour '+id);
}

function specializationDefinitions(){
  return Object.entries(UPGRADES).filter(([,definition])=>Boolean(definition.requiresGenerator));
}

function createTimelineTracker(spec){
  const milestones=new Map(),events=[];
  const ensure=(key,category)=>{
    if(!milestones.has(key)) milestones.set(key,{key,category,reached:false,atSeconds:null,cycle:null,detail:null});
  };
  ensure('first-generator','generator');
  ensure('first-x10','purchase-control');
  ensure('first-max','purchase-control');
  ensure('first-research','research');
  ensure('first-advanced-generator','generator');
  ensure('specialization:first-access','specialization');
  ensure('first-prestige','prestige');
  for(const era of GENERATOR_ERAS) ensure('era:'+era.id,'era');
  for(const id of Object.keys(GENERATORS)){
    ensure('generator:'+id,'generator');
    if(generatorEra(id).id!=='workshop') ensure('advanced-generator:'+id,'generator');
  }
  for(const id of Object.keys(UPGRADES)) ensure('research:'+id,'research');
  for(const [id] of specializationDefinitions()) ensure('specialization:'+id,'specialization');
  if(spec.mode==='prestige-cycles'){
    for(let cycle=1;cycle<=spec.prestigeCycles;cycle++) ensure('prestige:'+cycle,'prestige');
  }

  function record(key,category,atSeconds,cycle,detail){
    ensure(key,category);
    const milestone=milestones.get(key);
    if(milestone.reached) return;
    if(!Number.isFinite(atSeconds) || atSeconds<0) throw new Error('Temps de jalon invalide');
    milestone.reached=true;
    milestone.atSeconds=atSeconds;
    milestone.cycle=cycle;
    milestone.detail=detail ?? {};
    events.push({key,category,atSeconds,cycle,detail:detail ?? {}});
  }

  return {milestones,events,record};
}

function observeSpecializationAccess(tracker,state,atSeconds,cycle){
  for(const [id,definition] of specializationDefinitions()){
    const quote=Economy.upgradeQuote(state,id);
    if(['locked','unknown'].includes(quote.status)) continue;
    const detail={
      upgradeId:id,
      name:definition.name,
      generatorId:definition.requiresGenerator.id,
      requiredCount:definition.requiresGenerator.count,
      status:quote.status
    };
    tracker.record('specialization:'+id,'specialization',atSeconds,cycle,detail);
    tracker.record('specialization:first-access','specialization',atSeconds,cycle,detail);
  }
}

function observeTimelineAction(tracker,info,atSeconds,cycle,policyState){
  const {action,result,before,state}=info;
  if(action.kind==='generator'){
    const era=generatorEra(action.id);
    const detail={
      generatorId:action.id,
      name:GENERATORS[action.id].name,
      era:era.id,
      mode:action.mode,
      api:action.mode==='single'?'buyGenerator':action.mode==='x10'?'buyGenerators':'buyMaxGenerator',
      quantity:result.quantity,
      ownedAfter:state.generators[action.id]
    };
    const totalBefore=Object.values(before.generators).reduce((sum,value)=>sum+value,0);
    if(totalBefore===0) tracker.record('first-generator','generator',atSeconds,cycle,detail);
    if(before.generators[action.id]===0 && state.generators[action.id]>0){
      tracker.record('generator:'+action.id,'generator',atSeconds,cycle,detail);
      tracker.record('era:'+era.id,'era',atSeconds,cycle,detail);
      if(era.id!=='workshop'){
        tracker.record('advanced-generator:'+action.id,'generator',atSeconds,cycle,detail);
        tracker.record('first-advanced-generator','generator',atSeconds,cycle,detail);
      }
    }
    if(action.mode==='x10' && result.quantity===10){
      tracker.record('first-x10','purchase-control',atSeconds,cycle,detail);
      policyState.usedControls.add('x10');
    }
    if(action.mode==='max' && result.quantity>=2){
      tracker.record('first-max','purchase-control',atSeconds,cycle,detail);
      policyState.usedControls.add('max');
    }
  }else if(action.kind==='upgrade'){
    const detail={upgradeId:action.id,name:UPGRADES[action.id].name,status:'owned'};
    tracker.record('research:'+action.id,'research',atSeconds,cycle,detail);
    tracker.record('first-research','research',atSeconds,cycle,detail);
  }
  observeSpecializationAccess(tracker,state,atSeconds,cycle);
}

function timelineSummary(tracker){
  return [...tracker.milestones.values()].map(item=>({
    key:item.key,
    category:item.category,
    reached:item.reached,
    atSeconds:item.reached?item.atSeconds:null,
    cycle:item.reached?item.cycle:null,
    detail:item.reached?item.detail:null
  }));
}

function simulateProgressionTimeline(spec){
  let state=GameState.create();
  const tracker=createTimelineTracker(spec);
  const policyState={controlOrder:[...(spec.controlOrder ?? [])],usedControls:new Set()};
  const cycles=[];
  let elapsedSeconds=0;
  observeSpecializationAccess(tracker,state,0,1);

  if(spec.mode==='prestige-cycles'){
    for(let cycle=1;cycle<=spec.prestigeCycles;cycle++){
      Economy.refreshDerived(state);
      const baseElapsed=elapsedSeconds;
      const run=runEconomicWindow(state,{
        clickRate:spec.clickRate,
        targetProduced:'1e12',
        horizonSeconds:365*24*60*60,
        chooseAction:current=>chooseProgressionAction(current,spec.clickRate,policyState),
        chooseNextCost:current=>progressionNextCost(current,policyState),
        onAction:info=>observeTimelineAction(tracker,info,baseElapsed+info.seconds,cycle,policyState)
      });
      elapsedSeconds+=run.seconds;
      if(!run.reached){
        cycles.push({cycle,reached:false,cycleDurationSeconds:run.seconds,elapsedSeconds,purchases:run.purchases,steps:run.steps,reward:null});
        break;
      }
      const candidate=run.engine.prestigeCandidate();
      if(!candidate || candidate.reward.isZero()) throw new Error('Timeline : prestige attendu mais absent');
      const prestigeDetail={
        reward:Economy.format(candidate.reward),
        prestigePointsAfter:Economy.format(candidate.state.prestigePoints),
        prestigeCountAfter:candidate.state.prestigeCount
      };
      tracker.record('prestige:'+cycle,'prestige',elapsedSeconds,cycle,prestigeDetail);
      tracker.record('first-prestige','prestige',elapsedSeconds,cycle,prestigeDetail);
      cycles.push({
        cycle,reached:true,cycleDurationSeconds:run.seconds,elapsedSeconds,
        purchases:run.purchases,steps:run.steps,reward:Economy.format(candidate.reward)
      });
      state=candidate.state;
    }
  }else if(spec.mode==='continuous'){
    const run=runEconomicWindow(state,{
      clickRate:spec.clickRate,
      targetProduced:spec.targetProduced,
      horizonSeconds:spec.horizonSeconds,
      chooseAction:current=>chooseProgressionAction(current,spec.clickRate,policyState),
      chooseNextCost:current=>progressionNextCost(current,policyState),
      onAction:info=>observeTimelineAction(tracker,info,info.seconds,1,policyState)
    });
    elapsedSeconds=run.seconds;
    cycles.push({
      cycle:1,reached:run.reached,cycleDurationSeconds:run.seconds,elapsedSeconds,
      purchases:run.purchases,steps:run.steps,reward:null
    });
  }else{
    throw new Error('Mode timeline inconnu');
  }

  return {
    name:spec.name,
    description:spec.description,
    clickRate:spec.clickRate,
    mode:spec.mode,
    controlOrder:[...(spec.controlOrder ?? [])],
    horizonSeconds:spec.horizonSeconds ?? 365*24*60*60,
    targetProduced:spec.mode==='continuous'?spec.targetProduced:'1e12 per prestige cycle',
    elapsedSeconds,
    events:tracker.events,
    milestones:timelineSummary(tracker),
    cycles,
    final:{
      cookies:Economy.format(state.cookies),
      totalProduced:Economy.format(state.totalProduced),
      cps:Economy.format(state.cps),
      clickReward:Economy.format(state.clickReward),
      prestigePoints:Economy.format(state.prestigePoints),
      prestigeCount:state.prestigeCount
    }
  };
}

function assertFiniteTree(value,path='root'){
  if(typeof value==='number'){
    if(!Number.isFinite(value)) throw new Error('Métrique non finie : '+path);
    return;
  }
  if(typeof value==='string'){
    if(/NaN|Infinity/.test(value)) throw new Error('Texte numérique invalide : '+path);
    return;
  }
  if(Array.isArray(value)){
    value.forEach((item,index)=>assertFiniteTree(item,path+'['+index+']'));
    return;
  }
  if(value && typeof value==='object'){
    for(const [key,item] of Object.entries(value)) assertFiniteTree(item,path+'.'+key);
  }
}

function assertTimelineIntegrity(timeline){
  let previous=-1;
  for(const event of timeline.events){
    if(!Number.isFinite(event.atSeconds) || event.atSeconds<0) throw new Error(timeline.name+': événement sans temps fini');
    if(event.atSeconds<previous) throw new Error(timeline.name+': chronologie non monotone');
    previous=event.atSeconds;
  }
  for(const milestone of timeline.milestones){
    if(milestone.reached){
      if(!Number.isFinite(milestone.atSeconds) || milestone.atSeconds<0) throw new Error(timeline.name+': jalon atteint sans temps');
    }else if(milestone.atSeconds!==null || milestone.cycle!==null || milestone.detail!==null){
      throw new Error(timeline.name+': jalon non atteint mal représenté');
    }
  }
  let cycleElapsed=-1;
  for(const row of timeline.cycles){
    if(!Number.isFinite(row.cycleDurationSeconds) || row.cycleDurationSeconds<0) throw new Error(timeline.name+': durée cycle invalide');
    if(!Number.isFinite(row.elapsedSeconds) || row.elapsedSeconds<cycleElapsed) throw new Error(timeline.name+': cumul cycles non monotone');
    cycleElapsed=row.elapsedSeconds;
  }
  assertFiniteTree(timeline,timeline.name);
}

function milestone(timeline,key){
  const found=timeline.milestones.find(item=>item.key===key);
  if(!found) throw new Error(timeline.name+': jalon absent '+key);
  return found;
}

globalThis.__prestigeCatalogue=Object.fromEntries(Object.entries(PRESTIGE_UPGRADES).map(([id,d])=>[id,{requires:[...(d.requires ?? [])]}]));
globalThis.__balanceResults=__balanceScenarios.map(simulateBalanceScenario);
globalThis.__prestigeSeries=simulatePrestigeSeries(2,10,'hold');
globalThis.__prestigeShopSeries=simulatePrestigeSeries(2,10,'sequential');
globalThis.__prestigeClickSeries=simulatePrestigeSeries(2,15,'click-priority');
globalThis.__prestigeProductionSeries=simulatePrestigeSeries(2,15,'production-priority');

const timelineRuns=__progressionSpecs.map(spec=>simulateProgressionTimeline(spec));
for(const timeline of timelineRuns) assertTimelineIntegrity(timeline);

for(let index=0;index<__progressionSpecs.length;index++){
  const repeated=simulateProgressionTimeline(__progressionSpecs[index]);
  if(JSON.stringify(timelineRuns[index])!==JSON.stringify(repeated)) throw new Error(__progressionSpecs[index].name+': exécution non déterministe');
}

for(const name of ['x10-then-max-2-clicks','max-then-x10-2-clicks']){
  const timeline=timelineRuns.find(item=>item.name===name);
  const x10=milestone(timeline,'first-x10'),max=milestone(timeline,'first-max');
  if(!x10.reached || x10.detail.api!=='buyGenerators' || x10.detail.quantity!==10) throw new Error(name+': contrat ×10 non exercé via GameEngine.buyGenerators');
  if(!max.reached || max.detail.api!=='buyMaxGenerator' || max.detail.quantity<2) throw new Error(name+': contrat Max non exercé via GameEngine.buyMaxGenerator');
}

const late=timelineRuns.find(item=>item.name==='late-run-5-clicks');
for(const era of GENERATOR_ERAS){
  if(!milestone(late,'era:'+era.id).reached) throw new Error('late-run: ère non atteinte '+era.id);
}
if(!milestone(late,'first-advanced-generator').reached) throw new Error('late-run: aucun générateur avancé observé');
if(!milestone(late,'specialization:first-access').reached) throw new Error('late-run: aucune spécialisation accessible');

const zero=timelineRuns.find(item=>item.name==='zero-click-1h');
for(const key of ['first-generator','first-x10','first-max','first-research','first-prestige']){
  const item=milestone(zero,key);
  if(item.reached || item.atSeconds!==null) throw new Error('zero-click: jalon devrait rester non atteint '+key);
}

globalThis.__progressionTimelines=timelineRuns;
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

const hold=context.__prestigeSeries,shop=context.__prestigeShopSeries;
if(hold[0].seconds!==25141 || hold[9].seconds!==13148) throw new Error('Référence hold Foundation 2.5 modifiée');
if(shop[0].seconds!==hold[0].seconds) throw new Error('Le cycle 1 doit être identique avant toute dépense');
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

for(const timeline of context.__progressionTimelines){
  console.log('\nProgression timeline O1: '+timeline.name);
  console.log(timeline.description);
  console.table(timeline.events.map(event=>({
    seconds:event.atSeconds,
    cycle:event.cycle,
    event:event.key,
    detail:event.detail?.name ?? event.detail?.generatorId ?? event.detail?.upgradeId ?? event.detail?.reward ?? ''
  })));
  console.table(timeline.cycles);
  const unreached=timeline.milestones.filter(item=>!item.reached).map(item=>item.key);
  console.log('Unreached milestones: '+(unreached.length?unreached.join(', '):'none'));
}

console.log('Progression observatory O1: PASS');
console.log('Balance observatory: PASS');
