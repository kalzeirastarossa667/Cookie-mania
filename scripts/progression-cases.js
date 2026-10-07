// Development-only contracts. Runs against the real runtime and observatory helpers.
function runProgressionChecks(){
  const assert=(condition,message)=>{if(!condition) throw new Error('O1 contract: '+message);};
  const fund=(state,amount)=>{state.cookies=HugeNumber.from(amount);state.totalProduced=state.cookies.clone();};
  const spec={name:'contract',mode:'continuous',clickRate:0,controlOrder:[],horizonSeconds:1,targetProduced:null};
  const tracker=createTimelineTracker(spec),policy={usedControls:new Set()};
  const state=GameState.create(),engine=new GameEngine(state);
  const action={kind:'generator',mode:'x10',id:'cursor'};
  const before={generators:{...state.generators},ownedUpgrades:[]};
  const rejected=executeAction(engine,action);
  observeTimelineAction(tracker,{action,result:rejected,before,state},0,1,policy);
  assert(!rejected.ok && tracker.events.length===0,'rejected purchase must not create an event');
  assert(!tracker.milestones.get('first-generator').reached,'rejected first generator remains unreached');

  const calls=[];
  for(const method of ['buyGenerator','buyGenerators','buyMaxGenerator']){
    const original=engine[method];
    engine[method]=function(...args){calls.push([method,...args]);return original.apply(this,args);};
  }
  fund(state,Economy.generatorBatchCost(GENERATORS.cursor,0,10));
  const originalState=JSON.stringify(state);
  const candidate=evaluateAction(state,2,action);
  assert(candidate && JSON.stringify(state)===originalState && calls.length===0 && tracker.events.length===0,
    'candidate evaluation must not buy on the observed engine or record events');
  const purchased=executeAction(engine,action);
  observeTimelineAction(tracker,{action,result:purchased,before,state},1,1,policy);
  assert(purchased.quantity===10 && state.generators.cursor===10 && state.cookies.isZero(),'atomic exact-cost x10');
  assert(JSON.stringify(calls)===JSON.stringify([['buyGenerators','cursor',10]]),'x10 calls buyGenerators(id,10) exactly once');
  assert(tracker.milestones.get('first-x10').reached,'successful x10 recorded');
  assert(tracker.milestones.get('specialization:first-access').reached,'ten cursors expose specialization');

  // The strategy waits for >=2, but a successful runtime Max of one is still a Max event.
  for(const count of [1,4]){
    calls.length=0;
    const snapshot={generators:{...state.generators},ownedUpgrades:[...state.ownedUpgrades]};
    fund(state,Economy.generatorBatchCost(GENERATORS.cursor,state.generators.cursor,count));
    const maxAction={kind:'generator',mode:'max',id:'cursor'};
    const maxTracker=createTimelineTracker(spec);
    const max=executeAction(engine,maxAction);
    observeTimelineAction(maxTracker,{action:maxAction,result:max,before:snapshot,state},2,1,policy);
    assert(max.quantity===count && state.generators.cursor===snapshot.generators.cursor+count,'Max ownership delta');
    assert(JSON.stringify(calls)===JSON.stringify([['buyMaxGenerator','cursor'],['buyGenerators','cursor',count]]),
      'Max delegates through the runtime once, never repeated x1');
    assert(maxTracker.milestones.get('first-max').reached,'successful Max, including one unit, recorded');
  }

  const lateState=GameState.create(),lateEngine=new GameEngine(lateState);
  fund(lateState,'1e30');
  const lateTracker=createTimelineTracker(spec);
  for(let unit=1;unit<=10;unit++){
    const next=unlockOrderCandidate(lateState,5);
    assert(next.id==='cursor','late-run must acquire ten cursors before another generator');
    const snapshot={generators:{...lateState.generators},ownedUpgrades:[]};
    const result=executeAction(lateEngine,next);
    observeTimelineAction(lateTracker,{action:next,result,before:snapshot,state:lateState},unit,1,policy);
    assert(lateTracker.milestones.get('specialization:first-access').reached===(unit===10),
      'specialization gate is observed at the tenth successful cursor purchase');
  }
  assert(unlockOrderCandidate(lateState,5).id==='grandma','catalogue acquisition follows cursor gate');
  assert(Economy.compare(unlockOrderNextCost(lateState),Economy.generatorCost(GENERATORS.grandma,0))===0,
    'late-run next wait follows the same acquisition order');

  const stalled=simulateProgressionTimeline({...spec,mode:'prestige-cycles',prestigeCycles:3});
  assertTimelineIntegrity(stalled);
  assert(stalled.cycles.length===3 && stalled.cycles.every(row=>!row.reached && row.cycleDurationSeconds===null),
    'all unreached cycles explicit, no false completed duration');
  assert(stalled.cycles[0].stopReason==='no-income' && stalled.cycles[1].stopReason==='not-started',
    'stalled and unstarted cycles distinguished');
  assert(stalled.milestones.every(item=>!item.reached && item.atSeconds===null && item.detail===null),
    'unreached milestones explicit');
  const horizon=runEconomicWindow(GameState.create(),{clickRate:2,horizonSeconds:1});
  const bounded=runEconomicWindow(GameState.create(),{clickRate:2,maxSteps:0});
  assert(horizon.stopReason==='horizon' && bounded.stopReason==='step-limit','bounded stop reasons');

  // Check raw representation before formatting/JSON can hide invalid numeric values.
  for(const value of ['0','0.001','1e1000']){
    const n=HugeNumber.from(value),roundtrip=HugeNumber.fromJSON(n.toJSON());
    assert(Economy.compare(n,roundtrip)===0,'HugeNumber canonical round-trip');
    const recovered=Economy.divide(Economy.multiply(n,2),2);
    assert(Economy.compare(n,recovered)===0,'HugeNumber large/fractional multiply/divide');
  }
  assertEconomicState(state);
  for(const invalid of [NaN,Infinity,-Infinity]){
    const broken=GameState.create();broken.cookies.m=invalid;
    let failed=false;try{assertEconomicState(broken);}catch{failed=true;}
    assert(failed,'raw non-finite values rejected');
  }
  let monotoneRejected=false;
  try{assertTimelineIntegrity({...stalled,events:[{atSeconds:2},{atSeconds:1}]});}catch{monotoneRejected=true;}
  assert(monotoneRejected,'non-monotone events rejected');
  globalThis.__progressionContractsPassed=true;
}
