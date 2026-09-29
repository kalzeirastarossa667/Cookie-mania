// Development-only regression cases. Never included in the playable HTML.
function runFoundationTests(){
  const results=[];
  function test(name,fn){
    try{ fn(); results.push({name,ok:true}); }
    catch(error){ results.push({name,ok:false,error:error.message}); }
  }
  function assert(condition,message){ if(!condition) throw new Error(message); }
  function fresh(){ return {state:GameState.create(),engine:null}; }

  test('initialisation à zéro',()=>{
    const {state}=fresh();
    assert(state.cookies.isZero(),'cookies');
    assert(state.totalProduced.isZero(),'totalProduced');
    assert(state.totalClicks===0,'totalClicks');
    assert(state.clickPower.compare(1)===0,'clickPower');
    assert(state.cps.isZero(),'cps');
    assert(state.generators.cursor===0,'curseurs');
    assert(state.generators.grandma===0,'grand-mères');
  });

  test('un clic produit exactement 1 cookie',()=>{
    const x=fresh(); x.engine=new GameEngine(x.state);
    assert(x.engine.click().compare(1)===0,'récompense');
    assert(x.state.cookies.compare(1)===0,'cookies');
    assert(x.state.totalProduced.compare(1)===0,'produit');
    assert(x.state.totalClicks===1,'clics');
  });

  test('dix clics donnent dix cookies',()=>{
    const x=fresh(); x.engine=new GameEngine(x.state);
    for(let i=0;i<10;i++) x.engine.click();
    assert(x.state.cookies.compare(10)===0,'cookies');
    assert(x.state.totalClicks===10,'clics');
  });

  test('puissance de clic respectée',()=>{
    const x=fresh(); x.state.clickPower=HugeNumber.from(5); x.engine=new GameEngine(x.state);
    assert(x.engine.click().compare(5)===0,'récompense');
    assert(x.state.cookies.compare(5)===0,'cookies');
  });

  test('production à 0 CPS ne produit rien',()=>{
    const x=fresh(); x.engine=new GameEngine(x.state);
    assert(x.engine.tick(10).isZero(),'gain');
    assert(x.state.cookies.isZero(),'cookies');
  });

  test('production fractionnaire correcte',()=>{
    const x=fresh(); x.state.generators.cursor=25; x.engine=new GameEngine(x.state);
    assert(x.engine.tick(4).compare(10)===0,'gain');
    assert(x.state.cookies.compare(10)===0,'cookies');
  });


  test('invariant temporel : 0.1 CPS pendant 10 s produit exactement 1 cookie',()=>{
    const x=fresh(); x.state.generators.cursor=1; x.engine=new GameEngine(x.state);
    assert(x.state.cps.compare('0.1')===0,'CPS');
    assert(x.engine.tick(10).compare(1)===0,'gain');
    assert(x.state.cookies.compare(1)===0,'cookies');
    assert(x.state.totalProduced.compare(1)===0,'totalProduced');
  });

  test('invariant temporel : 4.8 CPS pendant 10 s produit exactement 48 cookies',()=>{
    const x=fresh(); x.state.generators.cursor=8; x.state.generators.grandma=4; x.engine=new GameEngine(x.state);
    assert(x.state.cps.compare('4.8')===0,'CPS');
    assert(x.engine.tick(10).compare(48)===0,'gain');
    assert(x.state.cookies.compare(48)===0,'cookies');
  });

  test('invariant temporel : subdiviser 10 s ne change pas la production',()=>{
    const whole=fresh(); whole.state.generators.cursor=8; whole.state.generators.grandma=4; whole.engine=new GameEngine(whole.state);
    const split=fresh(); split.state.generators.cursor=8; split.state.generators.grandma=4; split.engine=new GameEngine(split.state);
    whole.engine.tick(10);
    for(let i=0;i<100;i++) split.engine.tick(0.1);
    assert(whole.state.cookies.compare(split.state.cookies)===0,'cookies indépendants du découpage temporel');
    assert(split.state.cookies.compare(48)===0,'production totale');
  });

  test('temps nul, négatif et invalide ignoré',()=>{
    const x=fresh(); x.state.generators.cursor=100; x.engine=new GameEngine(x.state);
    assert(x.engine.tick(0).isZero(),'zéro');
    assert(x.engine.tick(-2).isZero(),'négatif');
    assert(x.engine.tick(NaN).isZero(),'NaN');
    assert(x.engine.tick(Infinity).isZero(),'Infinity');
    assert(x.state.cookies.isZero(),'cookies');
  });

  test('offline limité à 30 jours',()=>{
    const x=fresh(); x.state.generators.cursor=10; x.engine=new GameEngine(x.state);
    const gained=x.engine.applyOffline(60*60*24*90);
    assert(gained.compare(60*60*24*30)===0,'plafond');
  });

  test('offline négatif ou invalide ignoré',()=>{
    const x=fresh(); x.state.generators.cursor=10; x.engine=new GameEngine(x.state);
    assert(x.engine.applyOffline(-1).isZero(),'négatif');
    assert(x.engine.applyOffline(NaN).isZero(),'NaN');
  });

  test('nombres gigantes sans perte par overflow Number',()=>{
    const a=HugeNumber.from('1e1000');
    const b=HugeNumber.from('2.5e999');
    assert(a.compare(b)>0,'comparaison');
    assert(a.add(b).compare('1.25e1000')===0,'addition');
    assert(a.multiply(10).compare('1e1001')===0,'multiplication');
  });

  test('zéro est inférieur aux fractions positives',()=>{
    for(const value of ['0.1','0.001','1e-100']){
      const n=HugeNumber.from(value);
      assert(HugeNumber.zero().compare(n)<0,'0 < fraction');
      assert(n.compare(0)>0,'fraction > 0');
      assert(n.subtract(0).compare(n)===0,'fraction - 0');
      assert(HugeNumber.zero().subtract(n).isZero(),'soustraction plafonnée');
    }
    assert(HugeNumber.zero().compare(0)===0,'zéros égaux');
  });

  test('arithmétique scientifique complète',()=>{
    assert(Economy.subtract('1e1000','2.5e999').compare('7.5e999')===0,'soustraction');
    assert(Economy.divide('1e1000',4).compare('2.5e999')===0,'division');
    assert(Economy.multiply('2.5e-3',4).compare('1e-2')===0,'fraction');
    assert(Economy.compare('9.99e999','1e1000')<0,'comparaison frontière');
  });

  test('sérialisation HugeNumber stable',()=>{
    const original=HugeNumber.from('1.23456789e2500');
    const restored=HugeNumber.fromJSON(JSON.parse(JSON.stringify(original)));
    assert(restored.compare(original)===0,'round-trip');
  });

  test('croissance exponentielle des coûts',()=>{
    assert(Economy.scaleCost(15,1.15,0).compare(15)===0,'achat 0');
    const c1000=Economy.scaleCost(15,1.15,1000);
    assert(c1000.compare('1e61')>0,'coût énorme');
    assert(c1000.compare('1e63')<0,'ordre de grandeur');
  });

  test('opérations invalides rejetées',()=>{
    let division=false,owned=false,growth=false;
    try{ Economy.divide(1,0); }catch{ division=true; }
    try{ Economy.scaleCost(10,1.15,-1); }catch{ owned=true; }
    try{ Economy.scaleCost(10,0.9,1); }catch{ growth=true; }
    assert(division&&owned&&growth,'validation');
  });

  test('noms français des grands nombres',()=>{
    assert(Economy.format('1e6')==='1 million','million');
    assert(Economy.format('1e9')==='1 milliard','milliard');
    assert(Economy.format('1e12')==='1 billion','billion');
    assert(Economy.format('1e18')==='1 trillion','trillion');
  });

  test('formatage des nombres',()=>{
    assert(Economy.format(0)==='0','0');
    assert(Economy.format(999)==='999','999');
    assert(Economy.format(1000)==='1 mille','1000');
  });

  test('CPS dérivé du nombre de curseurs',()=>{
    const x=fresh(); x.state.generators.cursor=3; x.engine=new GameEngine(x.state);
    assert(x.state.cps.compare('0.3')===0,'0.3 CPS');
  });

  test('achat exact débite, incrémente et recalcule le CPS',()=>{
    const x=fresh(); x.engine=new GameEngine(x.state);
    const cost=x.engine.getGeneratorCost('cursor');
    x.state.cookies=cost.clone(); x.state.totalProduced=cost.clone();
    assert(x.engine.buyGenerator('cursor')===true,'achat');
    assert(x.state.cookies.isZero(),'solde');
    assert(x.state.generators.cursor===1,'quantité');
    assert(x.state.cps.compare('0.1')===0,'CPS');
  });

  test('achat refusé sous le coût sans mutation',()=>{
    const x=fresh(); x.engine=new GameEngine(x.state);
    x.state.cookies=HugeNumber.from('14.999999'); x.state.totalProduced=x.state.cookies.clone();
    assert(x.engine.buyGenerator('cursor')===false,'refus');
    assert(x.state.cookies.compare('14.999999')===0,'solde intact');
    assert(x.state.generators.cursor===0,'quantité intacte');
  });

  test('coût du curseur suit la courbe exponentielle',()=>{
    const x=fresh(); x.engine=new GameEngine(x.state);
    assert(x.engine.getGeneratorCost('cursor').compare(15)===0,'coût initial');
    x.state.generators.cursor=1;
    assert(x.engine.getGeneratorCost('cursor').compare('17.25')===0,'coût suivant');
  });

  test('coût cumulé de 10 curseurs égale la somme des coûts unitaires',()=>{
    const definition=GENERATORS.cursor;
    let sum=HugeNumber.zero();
    for(let i=0;i<10;i++) sum=Economy.add(sum,Economy.generatorCost(definition,i));
    const batch=Economy.generatorBatchCost(definition,0,10);
    const relativeError=Math.abs(batch.m-sum.m)/sum.m;
    assert(batch.e===sum.e && relativeError<1e-12,'somme géométrique');
  });

  test('achat ×10 est atomique',()=>{
    const x=fresh(); x.engine=new GameEngine(x.state);
    const cost=Economy.generatorBatchCost(GENERATORS.cursor,0,10);
    x.state.cookies=cost.clone(); x.state.totalProduced=cost.clone();
    assert(x.engine.buyGenerators('cursor',10)===10,'quantité achetée');
    assert(x.state.cookies.isZero(),'solde exact');
    assert(x.state.generators.cursor===10,'possession');
    assert(x.state.cps.compare(1)===0,'CPS');
  });

  test('achat ×10 insuffisant ne fait aucun achat partiel',()=>{
    const x=fresh(); x.engine=new GameEngine(x.state);
    const cost9=Economy.generatorBatchCost(GENERATORS.cursor,0,9);
    x.state.cookies=cost9.clone(); x.state.totalProduced=cost9.clone();
    assert(x.engine.buyGenerators('cursor',10)===0,'refus');
    assert(x.state.generators.cursor===0,'aucune mutation');
    assert(x.state.cookies.compare(cost9)===0,'solde intact');
  });

  test('achat Max trouve exactement la quantité abordable',()=>{
    const x=fresh(); x.engine=new GameEngine(x.state);
    const cost25=Economy.generatorBatchCost(GENERATORS.cursor,0,25);
    x.state.cookies=cost25.clone(); x.state.totalProduced=cost25.clone();
    assert(Economy.maxAffordableGeneratorCount(GENERATORS.cursor,0,x.state.cookies)===25,'max exact');
    assert(x.engine.buyMaxGenerator('cursor')===25,'achat max');
    assert(x.state.generators.cursor===25,'possession');
    assert(x.state.cookies.isZero(),'solde');
  });

  test('limite du compteur de générateurs est protégée',()=>{
    const x=fresh(); x.state.generators.cursor=Number.MAX_SAFE_INTEGER; x.engine=new GameEngine(x.state);
    x.state.cookies=HugeNumber.from('1e1000'); x.state.totalProduced=x.state.cookies.clone();
    assert(x.engine.buyGenerator('cursor')===false,'achat unitaire bloqué');
    assert(x.engine.buyMaxGenerator('cursor')===0,'max bloqué');
    assert(x.state.generators.cursor===Number.MAX_SAFE_INTEGER,'compteur exact');
  });

  test('deuxième générateur utilise le moteur générique',()=>{
    const x=fresh(); x.engine=new GameEngine(x.state);
    assert(x.engine.getGeneratorCost('grandma').compare(100)===0,'coût initial grand-mère');
    x.state.cookies=HugeNumber.from(100); x.state.totalProduced=HugeNumber.from(100);
    assert(x.engine.buyGenerator('grandma')===true,'achat générique');
    assert(x.state.generators.grandma===1,'quantité');
    assert(x.state.cps.compare(1)===0,'CPS');
  });

  test('CPS additionne plusieurs types de générateurs',()=>{
    const x=fresh(); x.state.generators.cursor=10; x.state.generators.grandma=3; x.engine=new GameEngine(x.state);
    assert(x.state.cps.compare(4)===0,'1 CPS curseurs + 3 CPS grand-mères');
  });

  test('état initial couvre toutes les définitions de générateurs',()=>{
    const state=GameState.create();
    assert(Object.keys(state.generators).length===Object.keys(GENERATORS).length,'même cardinalité');
    for(const id of Object.keys(GENERATORS)) assert(state.generators[id]===0,`initialisation ${id}`);
  });

  test('ancienne sauvegarde v3 sans nouveau générateur reste compatible',()=>{
    const key='cookie-empire-test-v3-forward-'+Date.now();
    const save=new SaveSystem(key);
    localStorage.setItem(key,JSON.stringify({version:3,state:{cookies:{m:5,e:1},totalProduced:{m:5,e:1},totalClicks:10,clickPower:{m:1,e:0},generators:{cursor:2},lastSavedAt:Date.now()}}));
    const loaded=save.load();
    assert(loaded!==null,'chargement');
    assert(loaded.generators.cursor===2,'curseurs conservés');
    assert(loaded.generators.grandma===0,'nouveau générateur initialisé');
    assert(loaded.cps.compare('0.2')===0,'CPS reconstruit');
    save.clear();
  });

  test('quantité de générateur corrompue rejetée',()=>{
    const key='cookie-empire-test-generator-'+Date.now();
    const save=new SaveSystem(key);
    localStorage.setItem(key,JSON.stringify({version:3,state:{cookies:{m:0,e:0},totalProduced:{m:0,e:0},totalClicks:0,clickPower:{m:1,e:0},generators:{cursor:-1,grandma:0},lastSavedAt:Date.now()}}));
    assert(save.load()===null,'quantité négative');
    save.clear();
  });

  test('migration v2 initialise les générateurs sans faire confiance au CPS sauvegardé',()=>{
    const key='cookie-empire-test-v2-'+Date.now();
    const save=new SaveSystem(key);
    localStorage.setItem(key,JSON.stringify({version:2,state:{cookies:{m:5,e:1},totalProduced:{m:5,e:1},totalClicks:10,clickPower:{m:1,e:0},cps:{m:9,e:9},lastSavedAt:Date.now()}}));
    const loaded=save.load();
    assert(loaded!==null,'migration');
    assert(loaded.generators.cursor===0,'curseurs');
    assert(loaded.generators.grandma===0,'grand-mères');
    assert(loaded.cps.isZero(),'CPS reconstruit');
    save.clear();
  });

  test('sauvegarde puis chargement',()=>{
    const key='cookie-empire-test-'+Date.now();
    const save=new SaveSystem(key);
    const state=GameState.create();
    state.cookies=HugeNumber.from(42); state.totalProduced=HugeNumber.from(50); state.totalClicks=8; state.clickPower=HugeNumber.from(3); state.generators.cursor=20; state.generators.grandma=2; Economy.refreshDerived(state);
    assert(save.save(state)===true,'save');
    const loaded=save.load();
    assert(loaded!==null,'load');
    assert(loaded.cookies.compare(42)===0,'cookies');
    assert(loaded.totalProduced.compare(50)===0,'produit');
    assert(loaded.totalClicks===8,'clics');
    assert(loaded.clickPower.compare(3)===0,'puissance');
    assert(loaded.generators.cursor===20,'curseurs');
    assert(loaded.generators.grandma===2,'grand-mères');
    assert(loaded.cps.compare(4)===0,'cps dérivé');
    save.clear();
  });

  test('sauvegarde corrompue rejetée',()=>{
    const key='cookie-empire-test-corrupt-'+Date.now();
    const save=new SaveSystem(key);
    localStorage.setItem(key,'{not-json');
    assert(save.load()===null,'JSON invalide');
    save.clear();
  });

  test('mauvaise version rejetée',()=>{
    const key='cookie-empire-test-version-'+Date.now();
    const save=new SaveSystem(key);
    localStorage.setItem(key,JSON.stringify({version:999,state:{}}));
    assert(save.load()===null,'version');
    save.clear();
  });

  test('champs manquants rejetés',()=>{
    const key='cookie-empire-test-missing-'+Date.now();
    const save=new SaveSystem(key);
    localStorage.setItem(key,JSON.stringify({version:1,state:{cookies:10}}));
    assert(save.load()===null,'champs');
    save.clear();
  });

  test('valeur numérique invalide rejetée',()=>{
    const key='cookie-empire-test-invalid-'+Date.now();
    const save=new SaveSystem(key);
    localStorage.setItem(key,JSON.stringify({version:3,state:{cookies:{m:NaN,e:0},totalProduced:{m:0,e:0},totalClicks:0,clickPower:{m:1,e:0},generators:{cursor:0,grandma:0},lastSavedAt:Date.now()}}));
    assert(save.load()===null,'NaN');
    save.clear();
  });

  test('état impossible rejeté',()=>{
    const key='cookie-empire-test-impossible-'+Date.now();
    const save=new SaveSystem(key);
    localStorage.setItem(key,JSON.stringify({version:3,state:{cookies:{m:1,e:1},totalProduced:{m:1,e:1},totalClicks:0,clickPower:{m:0,e:0},generators:{cursor:0,grandma:0},lastSavedAt:Date.now()}}));
    assert(save.load()===null,'clickPower 0');
    save.clear();
  });

  function funded(amount='10000'){
    const state=GameState.create(); state.cookies=HugeNumber.from(amount); state.totalProduced=state.cookies.clone();
    return {state,engine:new GameEngine(state)};
  }
  function rejects(fn){ try{fn();return false;}catch{return true;} }
  function snapshot(state){return JSON.stringify(state);}
  function fixture(version=4){
    return {version,state:{cookies:{m:5,e:1},totalProduced:{m:1,e:2},totalClicks:12,clickPower:{m:3,e:0},generators:{cursor:10,grandma:2},ownedUpgrades:[],lastSavedAt:Date.now()}};
  }
  function loadFixture(data){
    const key='cookie-empire-test-upgrades'; const save=new SaveSystem(key);
    try{localStorage.setItem(key,JSON.stringify(data));return save.load();}finally{save.clear();}
  }

  test('améliorations : état neutre et caches séparés',()=>{
    const {state}=funded();
    assert(state.ownedUpgrades.length===0,'aucune');
    assert(state.clickReward.compare(1)===0 && state.clickPower.compare(1)===0,'clic');
    const m=Economy.deriveMultipliers(state);
    assert(m.click.compare(1)===0 && m.globalCps.compare(1)===0 && m.generators.cursor.compare(1)===0,'neutres');
  });
  test('contenu immuable et valide',()=>{
    // Dependency graph validation is separate from saved ownership validation.
function validateResearchGraph(definitions){
  const visiting=new Set(),done=new Set();
  function visit(id){
    if(visiting.has(id)) throw new Error('Cycle de recherche');
    if(done.has(id)) return;
    visiting.add(id);
    const deps=definitions[id].requires ?? [];
    if(!Array.isArray(deps) || new Set(deps).size!==deps.length) throw new Error('Prérequis invalides');
    for(const dependency of deps){
      if(typeof dependency!=='string' || dependency===id || !owns(definitions,dependency)) throw new Error('Prérequis inconnu');
      visit(dependency);
    }
    visiting.delete(id);done.add(id);
  }
  for(const id of Object.keys(definitions)) visit(id);
}
validateUpgradeContent(UPGRADES);
validateResearchGraph(UPGRADES);
    assert(Object.isFrozen(UPGRADES),'table');
    for(const def of Object.values(UPGRADES)) assert(Object.isFrozen(def)&&Object.isFrozen(def.effect),'définition');
  });
  test('contenu invalide refusé',()=>{
    const base=UPGRADES.reinforced_click;
    for(const cost of ['0','-1','Infinity']) assert(rejects(()=>validateUpgradeContent({[base.id]:{...base,cost}})),'coût');
    for(const effect of [{target:'click',factor:'0.5'},{target:'click',factor:'NaN'},{target:'unknown',factor:'2'},{target:'generator',generatorId:'constructor',factor:'2'},{target:'click',generatorId:'cursor',factor:'2'}])
      assert(rejects(()=>validateUpgradeContent({[base.id]:{...base,effect}})),'effet');
  });
  test('achat amélioration au solde exact',()=>{
    const {state,engine}=funded('50');
    assert(engine.buyUpgrade('reinforced_click')===true,'achat');
    assert(state.cookies.isZero() && state.ownedUpgrades.length===1,'débit');
    assert(state.totalProduced.compare(50)===0 && state.totalClicks===0,'pas de production');
    assert(state.clickReward.compare(2)===0 && state.clickPower.compare(1)===0,'base conservée');
  });
  test('achat amélioration insuffisant atomique',()=>{
    const {state,engine}=funded('49.999999');const before=snapshot(state);
    assert(!engine.buyUpgrade('reinforced_click'),'refus');assert(snapshot(state)===before,'état inchangé');
  });
  test('achat amélioration unique même en appels répétés',()=>{
    const {state,engine}=funded();engine.buyUpgrade('reinforced_click');const before=snapshot(state);
    for(let i=0;i<100;i++) assert(!engine.buyUpgrade('reinforced_click'),'réachat');
    assert(snapshot(state)===before,'pas de débit ni cumul');
  });
  test('identifiants achat invalides refusés sans mutation',()=>{
    const {state,engine}=funded();const before=snapshot(state);
    for(const id of ['',null,undefined,{},1,'toString','constructor','__proto__','missing']) assert(!engine.buyUpgrade(id),'refus');
    assert(snapshot(state)===before,'état inchangé');
  });
  test('calcul invalide ne laisse pas un achat partiel',()=>{
    const {state,engine}=funded();state.generators.cursor=-1;const before=snapshot(state);
    assert(rejects(()=>engine.buyUpgrade('reinforced_click')),'échec calcul');assert(snapshot(state)===before,'atomicité');
  });
  test('bonus clic ne modifie pas le CPS',()=>{
    const {state,engine}=funded();state.generators.cursor=10;Economy.refreshDerived(state);
    engine.buyUpgrade('reinforced_click');const before=state.cookies.clone();
    assert(engine.click().compare(4)===0,'gain');assert(state.cookies.compare(before.add(4))===0,'crédit');
    assert(state.cps.compare(1)===0,'CPS inchangé');
  });
  test('bonus curseur ciblé laisse grand-mère et clic intacts',()=>{
    const {state,engine}=funded();state.generators.cursor=10;state.generators.grandma=3;
    Economy.refreshDerived(state);const beforeClick=state.clickReward.clone();
    engine.buyUpgrade('efficient_cursor');
    assert(state.cps.compare(5)===0,'2 + 3');assert(state.clickReward.compare(beforeClick)===0 && state.clickReward.compare(5)===0,'clic inchangé par le bonus CPS');
  });
  test('bonus grand-mère ciblé laisse curseur intact',()=>{
    const {state,engine}=funded();state.generators.cursor=10;state.generators.grandma=3;
    engine.buyUpgrade('grandma_recipe');assert(state.cps.compare(7)===0,'1 + 6');
  });
  test('bonus global fractionnaire ne modifie pas le clic',()=>{
    const {state,engine}=funded();state.generators.cursor=1;Economy.refreshDerived(state);const beforeClick=state.clickReward.clone();engine.buyUpgrade('warm_ovens');
    assert(state.cps.compare('0.15')===0,'CPS fractionnaire');assert(state.clickReward.compare(beforeClick)===0 && state.clickReward.compare('1.1')===0,'clic inchangé par le bonus CPS');
  });
  test('cumul des quatre bonus et production par unité',()=>{
    const {state,engine}=funded();state.generators.cursor=10;state.generators.grandma=3;
    for(const id of ['reinforced_click','efficient_cursor','grandma_recipe','warm_ovens']) assert(engine.buyUpgrade(id),'achat');
    assert(state.cps.compare(12)===0,'(2 + 6) * 1.5');assert(state.clickReward.compare(10)===0,'clic');
    const m=Economy.deriveMultipliers(state);
    assert(Economy.generatorUnitCps('cursor',m).compare('0.3')===0,'curseur effectif');
    assert(Economy.generatorUnitCps('grandma',m).compare(3)===0,'grand-mère effective');
  });
  test('ordre acquisition ne change pas les bonus',()=>{
    const a=funded(),b=funded();
    for(const x of [a,b]){x.state.generators.cursor=8;x.state.generators.grandma=4;}
    for(const id of ['reinforced_click','efficient_cursor','grandma_recipe','warm_ovens']) a.engine.buyUpgrade(id);
    for(const id of ['reinforced_click','efficient_cursor','grandma_recipe','warm_ovens'].reverse()) b.engine.buyUpgrade(id);
    assert(a.state.cps.compare(b.state.cps)===0 && a.state.clickReward.compare(b.state.clickReward)===0,'ordre');
    assert(a.state.cookies.compare(b.state.cookies)===0,'dépenses');
  });
  test('recalcul répété ne cumule pas les bonus',()=>{
    const {state,engine}=funded();state.generators.grandma=2;engine.buyUpgrade('warm_ovens');engine.buyUpgrade('reinforced_click');
    for(let i=0;i<100;i++) Economy.refreshDerived(state);
    assert(state.cps.compare(3)===0 && state.clickReward.compare(6)===0,'idempotence');
  });
  test('amélioration avant possession du générateur',()=>{
    const {state,engine}=funded();engine.buyUpgrade('efficient_cursor');assert(state.cps.isZero(),'aucun générateur');
    engine.buyGenerator('cursor');assert(state.cps.compare('0.2')===0,'futur générateur');
  });
  test('bonus préserve coûts et achats ×1 ×10 Max',()=>{
    const {state,engine}=funded();engine.buyUpgrade('efficient_cursor');engine.buyUpgrade('warm_ovens');
    assert(engine.getGeneratorCost('cursor').compare(15)===0,'prix intact');
    assert(engine.buyGenerator('cursor'),'×1');assert(engine.buyGenerators('cursor',10)===10,'×10');
    const price=Economy.generatorBatchCost(GENERATORS.cursor,11,25);state.cookies=price.clone();state.totalProduced=price.clone();
    assert(engine.buyMaxGenerator('cursor')===25,'Max');assert(state.generators.cursor===36,'quantité');
    assert(state.cookies.isZero() && state.cps.compare('10.8')===0,'CPS');
  });
  test('améliorations préservent invariants temporels',()=>{
    const a=funded(),b=funded();
    for(const x of [a,b]){x.state.generators.cursor=8;x.state.generators.grandma=4;for(const id of ['reinforced_click','efficient_cursor','grandma_recipe','warm_ovens'])x.engine.buyUpgrade(id);x.state.cookies=HugeNumber.zero();x.state.totalProduced=HugeNumber.zero();}
    a.engine.tick(10);for(let i=0;i<100;i++)b.engine.tick(0.1);
    assert(a.state.cookies.compare(144)===0,'14.4 CPS * 10 s');
    assert(a.state.cookies.compare(b.state.cookies)===0,'subdivision');
  });
  test('offline applique bonus et plafond inchangé',()=>{
    const {state,engine}=funded();state.generators.grandma=2;engine.buyUpgrade('warm_ovens');
    assert(engine.applyOffline(10).compare(30)===0,'10 s');
    assert(engine.applyOffline(90*86400).compare(3*30*86400)===0,'30 jours');
    for(const seconds of [0,-1,NaN,Infinity]) assert(engine.applyOffline(seconds).isZero(),'temps invalide');
  });
  test('récompense clic gigantesque reste HugeNumber',()=>{
    const {state,engine}=funded();state.clickPower=HugeNumber.from('1e1000');engine.buyUpgrade('reinforced_click');
    assert(engine.click().compare('2e1000')===0,'pas overflow');
  });
  test('v4 ne sauvegarde aucune valeur dérivée',()=>{
    const {state,engine}=funded();engine.buyUpgrade('reinforced_click');engine.buyUpgrade('warm_ovens');
    const save=new SaveSystem('cookie-empire-test-v4-schema');
    try{assert(save.save(state),'save');const raw=JSON.parse(localStorage.getItem(save.key));
      assert(raw.version===5,'version');
      assert(Object.keys(raw.state).sort().join(',')==='clickPower,cookies,generators,lastSavedAt,ownedUpgrades,prestigeCount,prestigePoints,totalClicks,totalProduced','champs exacts');
      assert(raw.state.clickPower.m===1 && raw.state.ownedUpgrades.length===2,'base + IDs');
    }finally{save.clear();}
  });
  test('v5 round-trip conserve achats et reconstruit effets',()=>{
    const {state,engine}=funded();state.clickPower=HugeNumber.from(3);state.generators.grandma=4;
    for(const id of ['reinforced_click','efficient_cursor','grandma_recipe','warm_ovens'])engine.buyUpgrade(id);
    const save=new SaveSystem('cookie-empire-test-v4-roundtrip');
    try{save.save(state);const restored=save.load();assert(restored!==null,'load');
      assert(restored.clickPower.compare(3)===0 && restored.clickReward.compare(14)===0 && restored.cps.compare(12)===0,'reconstruction');
      assert(restored.cookies.compare(state.cookies)===0 && restored.ownedUpgrades.length===4,'source');
      assert(!new GameEngine(restored).buyUpgrade('reinforced_click'),'unicité après reload');
    }finally{save.clear();}
  });
  test('v4 ignore les valeurs dérivées injectées',()=>{
    const f=fixture();f.state.ownedUpgrades=['warm_ovens'];f.state.cps={m:9,e:999};f.state.clickReward={m:9,e:999};f.state.multipliers={globalCps:999};
    const state=loadFixture(f);assert(state && state.cps.compare('4.5')===0 && state.clickReward.compare(6)===0,'recalcul');
  });
  test('v4 rejette possessions manquantes et corrompues',()=>{
    for(const value of [undefined,null,{},'reinforced_click',1,['missing'],['constructor'],['__proto__'],[null],[{}],['reinforced_click','reinforced_click'],Array(5).fill('warm_ovens')]){
      const f=fixture();f.state.ownedUpgrades=value;assert(loadFixture(f)===null,'rejet possession');
    }
  });
  test('v4 rejette champs numériques et structure invalides',()=>{
    for(const [field,values] of Object.entries({totalClicks:[-1,0.5,'1',null,Number.MAX_SAFE_INTEGER+1],lastSavedAt:[-1,null,'1',Date.now()+120000],clickPower:[{m:0,e:0},{m:-1,e:0},{}],generators:[null,[],{cursor:-1},{cursor:1.5},{grandma:Number.MAX_SAFE_INTEGER+1}]})){
      for(const value of values){const f=fixture();f.state[field]=value;assert(loadFixture(f)===null,field);}
    }
  });
  test('fraction positive avec solde zéro se recharge',()=>{
    const f=fixture();f.state.cookies={m:0,e:0};f.state.totalProduced={m:1,e:-1};
    assert(loadFixture(f)!==null,'fraction >= zéro');
  });
  test('zéro produit avec solde fractionnaire rejeté',()=>{
    const f=fixture();f.state.cookies={m:1,e:-1};f.state.totalProduced={m:0,e:0};
    assert(loadFixture(f)===null,'incohérence');
  });
  test('migration v1 conserve base clic et retire CPS obsolète',()=>{
    const f={version:1,state:{cookies:50,totalProduced:100,totalClicks:12,clickPower:3,cps:999,lastSavedAt:Date.now()}};
    const state=loadFixture(f);assert(state && state.ownedUpgrades.length===0 && state.clickReward.compare(3)===0 && state.cps.isZero(),'migration');
  });
  test('migration v2 initialise les améliorations',()=>{
    const f=fixture(2);f.state.ownedUpgrades=['warm_ovens'];const state=loadFixture(f);
    assert(state && state.ownedUpgrades.length===0 && state.clickReward.compare(3)===0 && state.cps.isZero(),'migration');
  });
  test('migration v3 conserve économie sans bonus fantôme',()=>{
    const f=fixture(3);f.state.ownedUpgrades=['warm_ovens'];const state=loadFixture(f);
    assert(state && state.ownedUpgrades.length===0 && state.clickReward.compare(6)===0 && state.cps.compare(3)===0,'migration');
    assert(state.cookies.compare(50)===0 && state.totalProduced.compare(100)===0 && state.totalClicks===12,'totaux');
  });
  test('réinitialisation état supprime les améliorations',()=>{
    const x=funded();x.engine.buyUpgrade('reinforced_click');const state=GameState.create();new GameEngine(state);
    assert(state.ownedUpgrades.length===0 && state.clickReward.compare(1)===0 && state.cps.isZero(),'neuf');
    assert(GameState.create().ownedUpgrades!==state.ownedUpgrades,'pas de liste partagée');
  });

  test('v4 rejette un compteur générateur explicitement null',()=>{
    const f=fixture();f.state.generators.cursor=null;
    assert(loadFixture(f)===null,'null ne signifie pas générateur absent');
  });

  test('prestige : migration v4 initialise les valeurs permanentes',()=>{
    const state=loadFixture(fixture(4));
    assert(state && state.prestigePoints.isZero() && state.prestigeCount===0,'migration prestige neutre');
  });
  test('prestige : seuil exact, récompense et multiplicateur séparé',()=>{
    const state=GameState.create();state.totalProduced=HugeNumber.from('1e12');state.generators.cursor=1;Economy.refreshDerived(state);
    const reward=Economy.prestigeReward(state);assert(reward.compare(1)===0,'récompense seuil');
    state.prestigePoints=HugeNumber.from(10);Economy.refreshDerived(state);
    assert(Economy.prestigeMultiplier(state).compare(2)===0,'multiplicateur x2');
    assert(state.cps.compare('0.2')===0,'cps prestige');
    assert(state.clickReward.compare('1.2')===0,'base clic non multipliée, bonus générateur oui');
  });
  test('prestige : candidat atomique réinitialise le run et accumule',()=>{
    const state=GameState.create();state.cookies=HugeNumber.from('9e11');state.totalProduced=HugeNumber.from('4e12');
    state.totalClicks=99;state.generators.cursor=10;state.ownedUpgrades=['reinforced_click'];state.prestigePoints=HugeNumber.from(3);state.prestigeCount=2;
    const engine=new GameEngine(state),before=snapshot(state),candidate=engine.prestigeCandidate();
    assert(candidate && candidate.reward.compare(2)===0,'récompense racine');
    assert(snapshot(state)===before,'source non mutée');
    assert(candidate.state.cookies.isZero() && candidate.state.totalProduced.isZero() && candidate.state.totalClicks===0,'run remis à zéro');
    assert(candidate.state.generators.cursor===0 && candidate.state.ownedUpgrades.length===0,'contenu remis à zéro');
    assert(candidate.state.prestigePoints.compare(5)===0 && candidate.state.prestigeCount===3,'permanent accumulé');
  });
  test('prestige : sous le seuil aucun candidat',()=>{
    const state=GameState.create();state.totalProduced=HugeNumber.from('9.999e11');
    assert(new GameEngine(state).prestigeCandidate()===null,'verrou');
  });
  test('prestige : v5 rejette valeurs permanentes invalides',()=>{
    const save=new SaveSystem('prestige-v5-invalid'),state=GameState.create(),raw=JSON.parse(save.encode(state));
    for(const value of [null,{}, {m:-1,e:0},{m:1,e:.5},{m:10,e:0},{m:0,e:99}]){const f=JSON.parse(JSON.stringify(raw));f.state.prestigePoints=value;assert(save.decode(JSON.stringify(f))===null,'points invalides');}
    for(const value of [-1,0.5,'1',Number.MAX_SAFE_INTEGER+1]){const f=JSON.parse(JSON.stringify(raw));f.state.prestigeCount=value;assert(save.decode(JSON.stringify(f))===null,'compteur invalide');}
  });

  test('prestige : deux rayonnements accumulent les éclats sans fuite du run',()=>{
    const state=GameState.create();state.totalProduced=HugeNumber.from('1e12');
    const first=new GameEngine(state).prestigeCandidate();assert(first && first.state.prestigePoints.compare(1)===0 && first.state.prestigeCount===1,'premier');
    first.state.totalProduced=HugeNumber.from('4e12');
    const second=new GameEngine(first.state).prestigeCandidate();
    assert(second && second.reward.compare(2)===0 && second.state.prestigePoints.compare(3)===0 && second.state.prestigeCount===2,'second');
    assert(second.state.cookies.isZero() && second.state.totalProduced.isZero() && second.state.ownedUpgrades.length===0,'run neuf');
  });
  test('prestige : nouvelle partie efface les valeurs permanentes',()=>{
    const storage=memoryStore(),save=new SaveSystem('prestige-full-reset',storage),state=GameState.create();
    state.prestigePoints=HugeNumber.from('12.5');state.prestigeCount=7;
    assert(save.save(state),'sauvegarde prestige');
    const fresh=GameState.create();assert(save.newGame(fresh),'nouvelle partie');
    const loaded=save.load();assert(loaded && loaded.prestigePoints.isZero() && loaded.prestigeCount===0,'prestige effacé');
  });

  function memoryStore(initial={}){
    const data=new Map(Object.entries(initial));
    return {data,failGet:null,failSet:null,failRemove:null,writes:[],
      getItem(key){if(this.failGet && this.failGet(key))throw Error('lecture refusée');return data.has(key)?data.get(key):null;},
      setItem(key,value){if(this.failSet && this.failSet(key))throw Error('quota');this.writes.push(key);data.set(key,String(value));},
      removeItem(key){if(this.failRemove && this.failRemove(key))throw Error('suppression refusée');data.delete(key);}};
  }
  function recoveryFixture(){
    const storage=memoryStore(),save=new SaveSystem('recovery-test',storage),state=GameState.create();
    state.cookies=HugeNumber.from(500);state.totalProduced=HugeNumber.from(600);state.generators.cursor=10;
    state.ownedUpgrades=['reinforced_click','efficient_cursor'];Economy.refreshDerived(state);
    return {storage,save,state,raw:save.encode(state)};
  }
  test('prestige : échec de stockage conserve le run vivant',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);assert(save.load(),'chargement');
    state.totalProduced=HugeNumber.from('1e12');Economy.refreshDerived(state);
    const engine=new GameEngine(state),candidate=engine.prestigeCandidate(),before=snapshot(state);
    storage.failSet=key=>key===save.key;
    assert(candidate && !save.commitPrestige(candidate.state,state),'échec attendu');
    assert(snapshot(state)===before,'run vivant intact');
    assert(save.mode==='uncertain','écriture ambiguë suspendue');
  });
  test('protection : chargement corrompu bloque toutes les écritures automatiques',()=>{
    const {save,storage}=recoveryFixture();storage.data.set(save.key,'{broken');
    assert(save.load()===null,'repli');for(let i=0;i<100;i++)assert(!save.save(GameState.create()),'bloqué');
    assert(storage.getItem(save.key)==='{broken','original intact');
    assert(storage.getItem(save.quarantineKey).includes('{broken'),'archive');
  });
  test('copie saine : sauvegarde précédente conservée',()=>{
    const {save,storage,state}=recoveryFixture();assert(save.save(state),'première');const first=storage.getItem(save.key);
    new GameEngine(state).click();assert(save.save(state),'seconde');
    assert(storage.getItem(save.backupKey)===first,'précédente exacte');assert(storage.getItem(save.key)!==first,'nouvelle');
  });
  test('première écriture prépare une copie valide',()=>{
    const {save,storage,state}=recoveryFixture();assert(save.save(state),'save');
    assert(storage.getItem(save.key)===storage.getItem(save.backupKey),'copies initiales');
    assert(save.decode(storage.getItem(save.backupKey))!==null,'validée');
  });
  test('restauration explicite reconstruit les améliorations',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,'oops');storage.data.set(save.backupKey,raw);
    save.load();assert(save.status().canRestore,'proposition');const state=save.restoreBackup();
    assert(state && state.cps.compare(2)===0 && state.clickReward.compare(4)===0,'dérivés');
    assert(storage.getItem(save.key)===raw && storage.getItem(save.backupKey)===raw,'copie non écrasée');
  });
  test('aucune copie : aucun état inventé à restaurer',()=>{
    const {save,storage}=recoveryFixture();storage.data.set(save.key,'oops');save.load();
    assert(!save.status().canRestore && save.restoreBackup()===null,'aucune');assert(storage.getItem(save.key)==='oops','intact');
  });
  test('copie orpheline valide doit être proposée sans sauvegarde automatique',()=>{
    const {save,storage,raw,state}=recoveryFixture();storage.data.set(save.backupKey,raw);assert(save.load()===null,'pas de rollback silencieux');
    assert(save.status().canRestore && !save.save(state),'protégée');assert(save.restoreBackup()!==null,'restore');
  });
  test('JSON vide et version future restent protégés',()=>{
    for(const raw of ['',JSON.stringify({version:999,state:{}}),'null','[]']){
      const x=recoveryFixture();x.storage.data.set(x.save.key,raw);x.save.load();assert(!x.save.save(x.state),'refus');assert(x.storage.getItem(x.save.key)===raw,'octets');
    }
  });
  test('quota pendant archive interdit restauration et nouvelle partie',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,'oops');storage.data.set(save.backupKey,raw);storage.failSet=k=>k===save.quarantineKey;
    save.load();assert(save.restoreBackup()===null,'restore refusée');assert(!save.newGame(GameState.create()),'reset refusé');
    assert(storage.getItem(save.key)==='oops' && storage.getItem(save.backupKey)===raw,'deux originaux');
  });
  test('quota pendant copie interdit remplacement du principal',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();state.lastSavedAt=123;
    storage.failSet=k=>k===save.backupKey;assert(!save.save(state),'erreur');assert(storage.getItem(save.key)===raw,'principal');assert(state.lastSavedAt===123,'horodatage intact');
  });
  test('quota pendant principal conserve copie validée et horodatage mémoire',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();state.lastSavedAt=123;
    storage.failSet=k=>k===save.key;assert(!save.save(state),'erreur');assert(storage.getItem(save.backupKey)===raw,'copie sûre');assert(state.lastSavedAt===123,'horodatage');
  });
  test('stockage illisible : aucune écriture même après réapparition sans relecture',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);storage.failGet=()=>true;assert(save.load()===null,'indisponible');
    storage.failGet=null;assert(!save.save(state),'bloqué');assert(storage.getItem(save.key)===raw,'intact');assert(save.load()!==null,'relecture');assert(save.save(state),'reprend');
  });
  test('candidat invalide refusé avant toute écriture',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();state.ownedUpgrades=['unknown'];
    assert(!save.save(state),'rejet');assert(storage.writes.length===0 && storage.getItem(save.key)===raw,'aucune écriture');
  });
  test('changement externe détecté protège le nouvel original',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();storage.data.set(save.key,'other');
    assert(!save.save(state) && save.mode==='conflict','conflit');assert(storage.getItem(save.key)==='other','intact');assert(!save.newGame(GameState.create()),'relecture exigée');
  });
  test('nouveau saver inspecte la sauvegarde avant sa première écriture',()=>{
    const {save,storage,state}=recoveryFixture();storage.data.set(save.key,'damaged');assert(!save.save(state),'ne remplace pas');assert(storage.getItem(save.key)==='damaged','intact');
  });
  test('copie corrompue refusée au moment de restaurer',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,'oops');storage.data.set(save.backupKey,raw);save.load();storage.data.set(save.backupKey,'bad-backup');
    assert(save.restoreBackup()===null,'revalidation');assert(storage.getItem(save.key)==='oops','principal intact');
  });
  test('export contient les chaînes exactes sans modifier le stockage',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,' { bad\n');storage.data.set(save.backupKey,raw);save.load();
    const before=JSON.stringify([...storage.data]),out=JSON.parse(save.exportRecovery());
    assert(out.version===1 && out.primary===' { bad\n' && out.backup===raw,'octets');assert(out.quarantine===storage.getItem(save.quarantineKey),'archive');assert(JSON.stringify([...storage.data])===before,'aucune mutation');
  });
  test('libération explicite ne supprime pas principal ni copie',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,'oops');storage.data.set(save.backupKey,raw);save.load();
    assert(save.releaseArchive(),'libérée');assert(storage.getItem(save.quarantineKey)===null,'vide');assert(storage.getItem(save.key)==='oops' && storage.getItem(save.backupKey)===raw,'principaux');
  });
  test('nouvelle partie confirmée conserve archive et réinitialise les deux slots',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,'oops');storage.data.set(save.backupKey,raw);save.load();const archive=storage.getItem(save.quarantineKey);
    const state=GameState.create();assert(save.newGame(state),'nouvelle');assert(save.decode(storage.getItem(save.key)).cookies.isZero(),'zéro');
    assert(storage.getItem(save.key)===storage.getItem(save.backupKey),'copie neuve');const protectedEntries=JSON.parse(storage.getItem(save.quarantineKey)).entries;assert(JSON.stringify(protectedEntries[0])===JSON.stringify(JSON.parse(archive).entries[0]),'premier original conservé');assert(protectedEntries.some(entry=>entry.raw===raw),'copie saine aussi protégée');
  });
  test('nettoyage des clés isolé aux trois clés de cette partie',()=>{
    const {save,storage,state}=recoveryFixture();save.save(state);storage.data.set('other-game','keep');save.clear();assert(storage.getItem('other-game')==='keep','isolation');assert(storage.getItem(save.backupKey)===null,'copie nettoyée');
  });
  test('deux slots corrompus peuvent être protégés avant nouvelle partie',()=>{
    const {save,storage}=recoveryFixture();storage.data.set(save.key,'bad-main');storage.data.set(save.backupKey,'bad-backup');save.load();
    assert(save.newGame(GameState.create()),'les deux originaux doivent pouvoir être protégés');
    const archive=storage.getItem(save.quarantineKey);assert(archive.includes('bad-main') && archive.includes('bad-backup'),'deux bruts');
  });

  test('archive pleine ne remplace jamais un original différent',()=>{
    const {save,storage,state}=recoveryFixture();save.protect('first','a');save.protect('second','b');const archive=storage.getItem(save.quarantineKey);
    storage.data.set(save.key,'third');save.load();assert(!save.newGame(state),'refus');assert(storage.getItem(save.key)==='third','troisième conservé');assert(storage.getItem(save.quarantineKey)===archive,'archive immuable');
    assert(save.releaseArchive(),'libération explicite');assert(save.newGame(state),'reprise après choix');assert(storage.getItem(save.quarantineKey).includes('third'),'nouvel original protégé');
  });
  test('archive illisible est conservée sans interprétation',()=>{
    const {save,storage,state}=recoveryFixture();storage.data.set(save.quarantineKey,'unknown-envelope');storage.data.set(save.key,'broken');save.load();
    assert(!save.newGame(state),'refus');assert(storage.getItem(save.quarantineKey)==='unknown-envelope','conservée');
  });
  test('doublon de protection ne consomme pas un nouvel emplacement',()=>{
    const {save,storage}=recoveryFixture();save.protect('same','a');const before=storage.getItem(save.quarantineKey);for(let i=0;i<100;i++)save.protect('same','a');assert(storage.getItem(save.quarantineKey)===before,'idempotent');
  });
  test('copie invalide protégée avant rotation avec principal sain',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);storage.data.set(save.backupKey,'bad-backup');save.load();
    assert(save.save(state),'save');assert(storage.getItem(save.quarantineKey).includes('bad-backup'),'brut conservé');assert(storage.getItem(save.backupKey)===raw,'copie saine');
  });
  test('échec écriture restauration conserve copie et données protégées',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,'bad');storage.data.set(save.backupKey,raw);save.load();storage.failSet=k=>k===save.key;
    assert(save.restoreBackup()===null,'échec');assert(storage.getItem(save.key)==='bad' && storage.getItem(save.backupKey)===raw,'originaux');
  });
  test('échec reset laisse principal existant et horodatage candidat inchangés',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();const fresh=GameState.create();fresh.lastSavedAt=123;storage.failSet=k=>k===save.key;
    assert(!save.newGame(fresh),'échec');assert(storage.getItem(save.key)===raw && fresh.lastSavedAt===123,'intacts');
  });
  test('export impossible et suppression refusée ne modifient rien',()=>{
    const {save,storage}=recoveryFixture();save.protect('bad','a');const before=storage.getItem(save.quarantineKey);storage.failGet=()=>true;assert(save.exportRecovery()===null,'export');storage.failGet=null;storage.failRemove=()=>true;assert(!save.releaseArchive(),'suppression');assert(storage.getItem(save.quarantineKey)===before,'conservée');
  });
  test('vérification écriture de copie empêche écrasement principal',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();const original=storage.setItem.bind(storage);storage.setItem=(key,value)=>{if(key!==save.backupKey)original(key,value);};
    assert(!save.save(state),'écriture silencieusement perdue détectée');assert(storage.getItem(save.key)===raw,'principal intact');
  });

  test('reset échoué depuis corruption conserve la copie saine précédente',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,'bad-main');storage.data.set(save.backupKey,raw);save.load();storage.failSet=k=>k===save.key;
    assert(!save.newGame(GameState.create()),'échec');assert(storage.getItem(save.backupKey)===raw,'copie saine conservée');
  });

  test('reset : échec de relecture de copie restaure la copie précédente',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,raw);storage.data.set(save.backupKey,raw);save.load();
    const original=storage.setItem.bind(storage);let armed=true;
    storage.setItem=(key,value)=>{original(key,value);if(key===save.backupKey && armed){armed=false;storage.failGet=k=>{if(k!==save.backupKey)return false;storage.failGet=null;return true;};}};
    const fresh=GameState.create();fresh.lastSavedAt=123;
    assert(!save.newGame(fresh),'échec détecté');assert(storage.getItem(save.backupKey)===raw,'copie précédente rétablie');
    assert(storage.getItem(save.key)===raw && fresh.lastSavedAt===123,'principal et horodatage inchangés');
  });
  test('reset : copie initialement absente retirée après échec de relecture',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();
    const original=storage.setItem.bind(storage);let armed=true;
    storage.setItem=(key,value)=>{original(key,value);if(key===save.backupKey && armed){armed=false;storage.failGet=k=>{if(k!==save.backupKey)return false;storage.failGet=null;return true;};}};
    assert(!save.newGame(GameState.create()),'échec');assert(storage.getItem(save.backupKey)===null,'absence rétablie');assert(storage.getItem(save.key)===raw,'principal intact');
  });
  test('reset : retour arrière ne remplace pas une copie changée ailleurs',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,raw);storage.data.set(save.backupKey,raw);save.load();
    const other=GameState.create();other.cookies=HugeNumber.from(987);other.totalProduced=other.cookies.clone();const foreign=save.encode(other);
    const original=storage.setItem.bind(storage);
    storage.setItem=(key,value)=>{if(key===save.key){storage.data.set(save.backupKey,foreign);throw Error('écriture interrompue');}original(key,value);};
    assert(!save.newGame(GameState.create()),'échec');assert(storage.getItem(save.backupKey)===foreign,'copie concurrente intacte');assert(storage.getItem(save.key)===raw,'principal intact');
  });
  test('reset : écriture principale non confirmée suspend toute nouvelle mutation',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);storage.data.set(save.backupKey,raw);save.load();
    const original=storage.setItem.bind(storage);let armed=true;
    storage.setItem=(key,value)=>{original(key,value);if(key===save.key && armed){armed=false;storage.failGet=k=>{if(k!==save.key)return false;storage.failGet=null;return true;};}};
    assert(!save.newGame(GameState.create()),'résultat non confirmé');const main=storage.getItem(save.key),backup=storage.getItem(save.backupKey),writes=storage.writes.length;
    assert(save.mode==='uncertain','relecture explicite requise');assert(!save.save(state),'autosave suspendue');assert(!save.newGame(GameState.create()),'nouveau reset suspendu');assert(save.restoreBackup()===null,'restore suspendu');
    assert(storage.getItem(save.key)===main && storage.getItem(save.backupKey)===backup && storage.writes.length===writes,'aucune écriture');
    const loaded=save.load();assert(loaded && loaded.cookies.isZero(),'principal effectivement écrit relu');assert(save.mode==='ready' && save.save(loaded),'reprise après relecture');
  });
  test('reset : retour arrière inaccessible laisse les bruts protégés et exige relecture',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,'broken');storage.data.set(save.backupKey,raw);save.load();
    const original=storage.setItem.bind(storage);
    storage.setItem=(key,value)=>{if(key===save.key){storage.failGet=k=>k===save.backupKey;throw Error('quota');}original(key,value);};
    assert(!save.newGame(GameState.create()),'échec');assert(save.mode==='uncertain','écritures suspendues');
    const entries=JSON.parse(storage.data.get(save.quarantineKey)).entries;assert(entries.some(e=>e.raw===raw) && entries.some(e=>e.raw==='broken'),'deux originaux protégés');
    const writes=storage.writes.length;assert(!save.save(GameState.create()) && storage.writes.length===writes,'pas de nouvelle écriture');
  });
  test('reset : échec avant toute écriture laisse les trois clés intactes',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,raw);storage.data.set(save.backupKey,raw);save.load();
    const fresh=GameState.create();fresh.ownedUpgrades=['unknown'];const before=JSON.stringify([...storage.data]);
    assert(!save.newGame(fresh),'candidat rejeté');assert(JSON.stringify([...storage.data])===before && storage.writes.length===0,'aucune mutation');assert(save.mode==='ready','pas de transaction commencée');
  });
  test('reset : suppression de retour arrière non vérifiée suspend les écritures',()=>{
    const {save,storage,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();storage.failSet=k=>k===save.key;storage.removeItem=()=>{};
    assert(!save.newGame(GameState.create()),'échec');assert(save.mode==='uncertain','résultat incertain');assert(save.status().visible && /reli/i.test(save.status().text),'instruction de relecture');assert(storage.getItem(save.key)===raw,'principal intact');
  });

  function importBundle(primary,backup=null,quarantine=null){return JSON.stringify({format:'cookie-empire-recovery',version:1,exportedAt:Date.now(),primary,backup,quarantine});}
  function importArchive(raws){return JSON.stringify({version:1,entries:raws.map(raw=>({raw,sourceKey:'test',capturedAt:Date.now()}))});}
  function importRaw(save,amount){const s=GameState.create();s.cookies=HugeNumber.from(amount);s.totalProduced=s.cookies.clone();return save.encode(s);}
  test('import : inspection export existant sans écriture ni mutation',()=>{
    const {save,storage,state}=recoveryFixture();save.save(state);const before=JSON.stringify([...storage.data]),writes=storage.writes.length;
    const result=save.inspectImport(save.exportRecovery());assert(result.candidates.length===1 && result.invalidCount===0,'doublon principal/copie');assert(result.candidates[0].state.cps.compare(2)===0,'bonus reconstruits');assert(JSON.stringify([...storage.data])===before && storage.writes.length===writes,'lecture seule');
  });
  test('import : quatre sources distinctes avec labels locaux et ordre stable',()=>{
    const {save,raw}=recoveryFixture(),a=importRaw(save,3),b=importRaw(save,4),c=importRaw(save,5);
    const result=save.inspectImport(importBundle(raw,a,importArchive([b,c])));assert(result.candidates.length===4,'quatre');assert(result.candidates.map(c=>c.label).join('|')==='Sauvegarde principale|Copie précédente|Copie protégée 1|Copie protégée 2','ordre');
  });
  test('import : duplication de brut dans archive ignorée',()=>{
    const {save,raw}=recoveryFixture();const r=save.inspectImport(importBundle(raw,raw,importArchive([raw,raw])));assert(r.candidates.length===1,'une seule source');
  });
  test('import : principal invalide et archive illisible laissent choisir la copie',()=>{
    const {save,raw}=recoveryFixture();const r=save.inspectImport(importBundle('<img src=invalid onerror=alert(1)>',raw,'broken'));assert(r.candidates.length===1 && r.candidates[0].label==='Copie précédente' && r.invalidCount===2,'copies invalides signalées');
  });
  test('import : enveloppes malformées ou inconnues rejetées',()=>{
    const {save,raw}=recoveryFixture();const valid=JSON.parse(importBundle(raw));
    const bad=['','{','null','[]',raw,JSON.stringify({...valid,version:2}),JSON.stringify({...valid,format:'other'}),JSON.stringify({...valid,exportedAt:-1}),JSON.stringify({...valid,backup:7}),JSON.stringify({...valid,primary:undefined}),JSON.stringify({...valid,quarantine:undefined})];
    for(const text of bad){let rejected=false;try{save.inspectImport(text);}catch{rejected=true;}assert(rejected,'refus format');}
  });
  test('import : taille et absence de partie valide contrôlées',()=>{
    const {save}=recoveryFixture();for(const text of [' '.repeat(SaveSystem.MAX_IMPORT_SIZE+1),importBundle(null),importBundle('bad',null,importArchive(['bad']))]){let rejected=false;try{save.inspectImport(text);}catch{rejected=true;}assert(rejected,'refus');}
  });
  test('import : archive inconnue ou surdimensionnée ne remplace jamais les données locales',()=>{
    const {save,storage,raw}=recoveryFixture();save.protect('local','local');const before=storage.getItem(save.quarantineKey);
    for(const archive of [JSON.stringify({version:2,entries:[]}),importArchive([raw,raw,raw]),JSON.stringify({version:1,entries:[{raw,sourceKey:'x',capturedAt:-1}]})]){const r=save.inspectImport(importBundle(raw,null,archive));assert(r.candidates.length===1 && r.invalidCount===1,'archive ignorée');}
    assert(storage.getItem(save.quarantineKey)===before,'archive locale intacte');
  });
  test('import : v1 à v3 migrent vers un état v5 sans valeurs dérivées persistées',()=>{
    const {save,raw}=recoveryFixture();for(const version of [1,2,3]){
      const data=JSON.parse(raw);data.version=version;delete data.state.ownedUpgrades;data.state.cps={m:9,e:99};
      if(version===1){data.state.cookies=500;data.state.totalProduced=600;data.state.clickPower=3;}
      const state=save.decodeImport(JSON.stringify(data));assert(state && state.ownedUpgrades.length===0,'migration');
      const persisted=JSON.parse(save.encode(state));assert(persisted.version===5 && !('cps' in persisted.state) && !('clickReward' in persisted.state) && 'prestigePoints' in persisted.state && 'prestigeCount' in persisted.state,'sources seules');assert(state.generators.cursor===(version===3?10:0),'générateurs');
    }
  });
  test('import : compteurs et horodatages hérités doivent être réinscriptibles',()=>{
    const {save,raw}=recoveryFixture();for(const patch of [{totalClicks:1e20},{lastSavedAt:-1},{lastSavedAt:1.5}]){const d=JSON.parse(raw);d.version=3;Object.assign(d.state,patch);assert(save.decodeImport(JSON.stringify(d))===null,'migration v4 refusée');}
  });
  test('import : possessions et cohérence économique invalides refusées',()=>{
    const {save,raw}=recoveryFixture();for(const patch of [{ownedUpgrades:['unknown']},{ownedUpgrades:['reinforced_click','reinforced_click']},{generators:{cursor:-1}},{cookies:{m:9,e:30}},{lastSavedAt:Date.now()+120000}]){const d=JSON.parse(raw);Object.assign(d.state,patch);assert(save.decodeImport(JSON.stringify(d))===null,'refus');}
  });
  test('import : nombres non canoniques après normalisation refusés',()=>{
    const {save,raw}=recoveryFixture();for(const number of [{m:2,e:.5},{m:5e-324,e:0}]){const d=JSON.parse(raw);d.state.cookies=number;d.state.totalProduced=number;assert(save.decodeImport(JSON.stringify(d))===null,'nombre importé invalide');}
  });
  test('import : grands nombres et CPS fractionnaire préservés',()=>{
    const {save,raw}=recoveryFixture();const d=JSON.parse(raw);d.state.cookies={m:1.23,e:1000};d.state.totalProduced=d.state.cookies;d.state.generators.cursor=1;
    const s=save.decodeImport(JSON.stringify(d));assert(s && s.cookies.compare('1.23e1000')===0 && s.cps.compare(.2)===0 && s.clickReward.compare('2.2')===0,'valeurs reconstruites');
  });
  test('import : progression en mémoire protégée, copie et clés étrangères intactes',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);storage.data.set(save.backupKey,'backup-untouched');storage.data.set('other','keep');save.load();new GameEngine(state).click();const oldStamp=state.lastSavedAt;
    const next=save.decodeImport(importRaw(save,123));assert(save.commitImport(next,state),'import');
    const entries=JSON.parse(storage.getItem(save.quarantineKey)).entries;const preserved=save.decodeImport(entries[0].raw);assert(preserved.cookies.compare(504)===0 && preserved.ownedUpgrades.length===2,'clic non sauvegardé protégé');assert(state.cookies.compare(504)===0 && state.lastSavedAt===oldStamp,'mémoire source intacte');assert(save.load().cookies.compare(123)===0,'principal');assert(storage.getItem(save.backupKey)==='backup-untouched' && storage.getItem('other')==='keep','isolation');
  });
  test('import : principal corrompu conservé avec progression temporaire',()=>{
    const {save,storage,state}=recoveryFixture();storage.data.set(save.key,' broken\n');save.load();assert(save.commitImport(GameState.create(),state),'import');const entries=JSON.parse(storage.getItem(save.quarantineKey)).entries;assert(entries.length===2 && entries.some(e=>e.raw===' broken\n') && entries.some(e=>save.decodeImport(e.raw)?.cookies.compare(500)===0),'deux sources protégées');
  });
  test('import : archive pleine ou illisible refuse le remplacement',()=>{
    for(const archive of [importArchive(['a','b']),'unknown']){const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);storage.data.set(save.quarantineKey,archive);save.load();assert(!save.commitImport(GameState.create(),state),'refus');assert(storage.getItem(save.key)===raw && storage.getItem(save.quarantineKey)===archive,'originaux');}
  });
  test('import : protection refusée empêche toute écriture principale',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();storage.failSet=k=>k===save.quarantineKey;assert(!save.commitImport(GameState.create(),state),'refus');assert(storage.getItem(save.key)===raw && storage.writes.length===0,'aucune écriture');
  });
  test('import : écriture principale refusée conserve progression et protection',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();storage.failSet=k=>k===save.key;const next=GameState.create();next.lastSavedAt=123;assert(!save.commitImport(next,state),'échec');assert(save.mode==='uncertain' && storage.getItem(save.key)===raw && next.lastSavedAt===123,'échec non confirmé');assert(JSON.parse(storage.getItem(save.quarantineKey)).entries.some(e=>save.decodeImport(e.raw)?.cookies.compare(500)===0),'ancienne partie protégée');assert(!save.save(state),'écritures suspendues');
  });
  test('import : écriture effective non relue reste incertaine jusqu’à relecture',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();const original=storage.setItem.bind(storage);
    storage.setItem=(key,value)=>{original(key,value);if(key===save.key)storage.failGet=k=>{if(k!==save.key)return false;storage.failGet=null;return true;};};
    assert(!save.commitImport(GameState.create(),state),'non confirmé');assert(save.mode==='uncertain' && !save.save(state),'pause');assert(save.load()?.cookies.isZero() && save.mode==='ready','relecture résout état réellement écrit');
  });
  test('import : principal modifié avant commit n’est pas écrasé',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();const other=importRaw(save,800);storage.data.set(save.key,other);assert(!save.commitImport(GameState.create(),state),'conflit');assert(storage.getItem(save.key)===other && save.mode==='conflict','tiers intact');
  });
  test('import : principal modifié pendant protection est recontrôlé',()=>{
    const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();const other=importRaw(save,900),original=storage.setItem.bind(storage);
    storage.setItem=(k,v)=>{original(k,v);if(k===save.quarantineKey)storage.data.set(save.key,other);};assert(!save.commitImport(GameState.create(),state),'conflit');assert(storage.getItem(save.key)===other,'pas de remplacement');
  });
  test('import : modes bloqués refusent toute mutation',()=>{
    for(const mode of ['unavailable','conflict','uncertain']){const {save,storage,state}=recoveryFixture();save.mode=mode;assert(!save.commitImport(GameState.create(),state) && storage.writes.length===0,'mode '+mode);}
  });
  test('import : état candidat ou actuel invalide refuse avant protection',()=>{
    for(const which of ['next','current']){const {save,storage,state,raw}=recoveryFixture();storage.data.set(save.key,raw);save.load();const next=GameState.create();(which==='next'?next:state).ownedUpgrades=['unknown'];assert(!save.commitImport(next,state),'refus');assert(storage.writes.length===0 && storage.getItem(save.key)===raw,'aucune écriture');}
  });

  const step=(state,id)=>Progression.derive(state).rows.find(row=>row.definition.id===id);
  test('progression : départ vide et prochaine étape déterministes',()=>{
    const p=Progression.derive(GameState.create());assert(p.completed===0 && p.total===44,'départ');assert(p.rank==='Les débuts gourmands' && p.next.definition.id==='first_batch','orientation');assert(p.rows.every(r=>!r.done && r.percent===0),'zéro');
  });
  test('progression : seuils de production exacts sans arrondir la condition',()=>{
    for(const [id,target] of [['first_batch',25],['thousand_cookies',1000],['ten_thousand_cookies',10000],['hundred_thousand',100000],['million_cookies',1000000],['ten_million',10000000]]){
      const s=GameState.create();s.totalProduced=HugeNumber.from(target-.001);assert(!step(s,id).done && step(s,id).percent<100,'juste avant');s.totalProduced=HugeNumber.from(target);assert(step(s,id).done && step(s,id).percent===100,'exact');s.totalProduced=HugeNumber.from(target+1);assert(step(s,id).shown.compare(target)===0,'affichage plafonné');
    }
  });
  test('progression : aucun passage anticipé par le pourcentage',()=>{
    const p=Progression.progress('24.99999999999',25);assert(!p.done && p.percent===99,'proche du seuil');const tiny=Progression.progress('0.001',10000);assert(!tiny.done && tiny.percent===0,'petite fraction');
  });
  test('progression : grandeurs immenses sans conversion absolue en Number',()=>{
    const s=GameState.create();s.totalProduced=HugeNumber.from('1e1000');assert(step(s,'ten_thousand_cookies').done && step(s,'ten_thousand_cookies').percent===100,'grand total');const p=Progression.progress('5e999','1e1000');assert(!p.done && p.percent===50,'rapport immense');
  });
  test('progression : étapes indépendantes et premier objectif incomplet',()=>{
    const s=GameState.create();s.generators.cursor=1;const p=Progression.derive(s);assert(p.completed===1 && step(s,'first_cursor').done,'étape anticipée');assert(p.next.definition.id==='first_batch','pas de saut du premier objectif');s.totalProduced=HugeNumber.from(25);assert(Progression.derive(s).next.definition.id==='first_grandma','étape suivante');
  });
  test('progression : seuils de possessions et catalogue acquis',()=>{
    const s=GameState.create();s.generators.cursor=9;s.generators.grandma=1;s.ownedUpgrades=['reinforced_click'];assert(step(s,'first_grandma').done && step(s,'first_upgrade').done && !step(s,'cursor_team').done,'possessions');s.generators.cursor=10;s.ownedUpgrades=['reinforced_click','efficient_cursor','grandma_recipe','warm_ovens','cocoa_excavators','cosmic_click'];assert(step(s,'cursor_team').done && step(s,'recipe_book').done,'seuils');
  });
  test('progression : dépenser ne fait pas perdre une production atteinte',()=>{
    const s=GameState.create();s.cookies=HugeNumber.from(1000);s.totalProduced=HugeNumber.from(1000);const e=new GameEngine(s);assert(e.buyGenerator('grandma'),'achat');assert(s.cookies.compare(1000)<0 && step(s,'thousand_cookies').done,'total indépendant de réserve');
  });
  test('progression : achats groupés actualisent les étapes sans récompense cachée',()=>{
    const s=GameState.create();s.cookies=HugeNumber.from(10000);s.totalProduced=s.cookies.clone();const e=new GameEngine(s);assert(e.buyGenerators('cursor',10)===10,'lot');const before=JSON.stringify(s);const p=Progression.derive(s);assert(p.rows.find(r=>r.definition.id==='cursor_team').done,'lot reconnu');assert(JSON.stringify(s)===before && s.cps.compare(1)===0,'aucune mutation ni bonus');
  });
  test('progression : production hors ligne participe aux étapes',()=>{
    const s=GameState.create();s.generators.grandma=1;new GameEngine(s).applyOffline(1000);assert(step(s,'first_batch').done && step(s,'thousand_cookies').done,'production reconnue');
  });
  test('progression : titres et fin du parcours cohérents',()=>{
    const s=GameState.create();s.totalProduced=HugeNumber.from(25);s.generators.cursor=1;assert(Progression.derive(s).rank==='Petit atelier','deux');s.generators.grandma=1;s.ownedUpgrades=['reinforced_click'];assert(Progression.derive(s).rank==='Boulangerie en essor','quatre');s.generators.cursor=10;s.totalProduced=HugeNumber.from(1000);assert(Progression.derive(s).rank==='Fabrique reconnue','six');s.ownedUpgrades=['reinforced_click','efficient_cursor','grandma_recipe','warm_ovens'];s.totalProduced=HugeNumber.from(10000);let p=Progression.derive(s);assert(p.completed===8 && p.next.definition.id==='first_mine' && p.rank==='Empire en devenir','suite');s.generators.cocoa_mine=10;p=Progression.derive(s);assert(p.completed===10 && p.rank==='Royaume du cacao','mines');s.totalProduced=HugeNumber.from(1000000);p=Progression.derive(s);assert(p.completed===12 && p.next.definition.id==='all_recipes' && p.rank==='Empire gourmand','suite');s.ownedUpgrades=['reinforced_click','efficient_cursor','grandma_recipe','warm_ovens','cocoa_excavators','cosmic_click'];s.totalProduced=HugeNumber.from(10000000);p=Progression.derive(s);assert(p.completed===14 && p.next.definition.id==='first_lab' && p.rank==='Constellation gourmande','suite');s.generators.chocolate_lab=5;p=Progression.derive(s);assert(p.completed===16 && p.next.definition.id==='hundred_million' && p.rank==='Académie du chocolat','fin');
  });
  test('progression : dérivations répétées pures et sans alias modifiable',()=>{
    const s=GameState.create();s.totalProduced=HugeNumber.from(50);const before=JSON.stringify(s),content=JSON.stringify(MILESTONES);for(let i=0;i<30;i++){const p=Progression.derive(s);p.rows[0].current.m=9;p.rows[0].target.m=9;}assert(JSON.stringify(s)===before && JSON.stringify(MILESTONES)===content,'sources intactes');assert(Object.isFrozen(MILESTONES) && MILESTONES.every(Object.isFrozen) && Object.isFrozen(PROGRESSION_RANKS),'contenu immuable');
  });
  test('progression : définitions invalides refusées au démarrage',()=>{
    const d=MILESTONES[0];const bad=[[],[d,d],[{...d,id:''}],[{...d,metric:'balance'}],[{...d,target:'0'}],[{...d,target:'-1'}],[{...d,metric:'generator',generatorId:'unknown'}],[{...d,generatorId:'cursor'}],[{...d,metric:'generator',generatorId:'cursor',target:'.5'}],[{...d,metric:'upgrades',target:'23'}],[{...d,metric:'generator',generatorId:['cursor'],target:'1'}]];
    for(const definitions of bad){let rejected=false;try{validateMilestoneContent(definitions);}catch{rejected=true;}assert(rejected,'contenu invalide '+JSON.stringify(definitions));}
  });
  test('progression : sauvegarde inchangée et étapes reconstruites',()=>{
    const {save,state}=recoveryFixture();state.totalProduced=HugeNumber.from(1000);const before=Progression.derive(state),raw=save.encode(state),data=JSON.parse(raw);assert(Object.keys(data.state).sort().join(',')==='clickPower,cookies,generators,lastSavedAt,ownedUpgrades,prestigeCount,prestigePoints,totalClicks,totalProduced','sources persistées uniquement');const loaded=save.decode(raw);assert(Progression.derive(loaded).completed===before.completed,'reconstruction');data.state.completedMilestones=MILESTONES.map(x=>x.id);data.state.rank='faux';data.state.progression={completed:99};assert(Progression.derive(save.decode(JSON.stringify(data))).completed===before.completed,'faux caches ignorés');
  });
  test('progression : migration ancienne respecte ses possessions historiques',()=>{
    const {save,raw}=recoveryFixture();const data=JSON.parse(raw);data.version=3;delete data.state.ownedUpgrades;const s=save.decode(JSON.stringify(data));assert(step(s,'first_cursor').done && !step(s,'first_upgrade').done,'v3');data.version=2;const v2=save.decode(JSON.stringify(data));assert(step(v2,'first_batch').done && !step(v2,'first_cursor').done,'v2 sans ownership');
  });
  test('progression : une nouvelle partie ne conserve pas les étapes dérivées',()=>{
    const {save,state}=recoveryFixture();assert(Progression.derive(state).completed>0,'ancien état');assert(save.newGame(GameState.create()),'reset');assert(Progression.derive(save.load()).completed===0,'reset complet');
  });

  test('four artisanal : état et prix initial',()=>{
    const s=GameState.create(),e=new GameEngine(s);
    assert(s.generators.oven===0,'initialisation');
    assert(e.getGeneratorCost('oven').compare(1100)===0,'prix initial');
    s.generators.oven=1;
    assert(e.getGeneratorCost('oven').compare(1265)===0,'prix suivant');
  });
  test('four artisanal : achat exact et production hors ligne',()=>{
    const s=GameState.create(),e=new GameEngine(s);
    s.cookies=HugeNumber.from(1100);s.totalProduced=s.cookies.clone();
    assert(e.buyGenerator('oven'),'achat exact');
    assert(s.cookies.isZero() && s.generators.oven===1 && s.cps.compare(8)===0,'coût et CPS');
    assert(e.applyOffline(10).compare(80)===0 && s.cookies.compare(80)===0,'production');
  });
  test('four artisanal : lot atomique et maximum',()=>{
    const s=GameState.create(),e=new GameEngine(s),price=Economy.generatorBatchCost(GENERATORS.oven,0,10);
    s.cookies=Economy.subtract(price,1);s.totalProduced=price.clone();
    assert(e.buyGenerators('oven',10)===0 && s.generators.oven===0,'lot insuffisant');
    s.cookies=price.clone();assert(e.buyMaxGenerator('oven')===10,'max exact');
    assert(s.cookies.isZero() && s.generators.oven===10 && s.cps.compare(80)===0,'débit et CPS');
  });
  test('four artisanal : ancienne sauvegarde et valeur invalide',()=>{
    const store={data:new Map(),getItem(k){return this.data.get(k)??null;},setItem(k,v){this.data.set(k,String(v));},removeItem(k){this.data.delete(k);}};
    const save=new SaveSystem('oven-test',store),state=GameState.create();
    const old=JSON.parse(save.encode(state));delete old.state.generators.oven;
    assert(save.decode(JSON.stringify(old))?.generators.oven===0,'ancien format');
    old.state.generators.oven=-1;assert(save.decode(JSON.stringify(old))===null,'négatif refusé');
    old.state.generators.oven='1';assert(save.decode(JSON.stringify(old))===null,'type invalide refusé');
  });
  test('four artisanal : sauvegarde puis recharge et reset',()=>{
    const store={data:new Map(),getItem(k){return this.data.get(k)??null;},setItem(k,v){this.data.set(k,String(v));},removeItem(k){this.data.delete(k);}};
    const save=new SaveSystem('oven-test-roundtrip',store),s=GameState.create();s.generators.oven=2;Economy.refreshDerived(s);
    assert(save.save(s),'écriture');const loaded=save.load();
    assert(loaded.generators.oven===2 && loaded.cps.compare(16)===0,'reconstruction');
    assert(save.newGame(GameState.create()) && save.load().generators.oven===0,'reset');
  });
  test('four artisanal : import d’un ancien export v4',()=>{
    const {save,state}=recoveryFixture();
    const previous=JSON.parse(save.encode(state));delete previous.state.generators.oven;
    const bundle=JSON.stringify({format:'cookie-empire-recovery',version:1,exportedAt:Date.now(),primary:JSON.stringify(previous),backup:null,quarantine:null});
    const candidates=save.inspectImport(bundle).candidates;
    assert(candidates.length===1 && candidates[0].state.generators.oven===0,'four initialisé à zéro');
    assert(candidates[0].state.cps.compare(2)===0,'anciens bonus reconstruits');
  });
  test('synergie clic : contributions de chaque générateur',()=>{
    const s=GameState.create(),e=new GameEngine(s);
    assert(s.clickReward.compare(1)===0,'départ');
    s.generators.cursor=1;Economy.refreshDerived(s);assert(s.clickReward.compare('1.1')===0,'curseur');
    s.generators.grandma=1;Economy.refreshDerived(s);assert(s.clickReward.compare('2.1')===0,'grand-mère');
    s.generators.oven=1;Economy.refreshDerived(s);assert(s.clickReward.compare('10.1')===0,'four');
    const before=s.totalProduced.clone();assert(e.click().compare('10.1')===0 && s.totalProduced.compare(before.add('10.1'))===0,'gain réel');
  });
  test('synergie clic : achat simple, ×10 et Max mettent à jour le clic',()=>{
    const s=GameState.create(),e=new GameEngine(s);s.cookies=HugeNumber.from(100000);s.totalProduced=s.cookies.clone();
    assert(e.buyGenerator('grandma') && s.clickReward.compare(2)===0,'×1');
    assert(e.buyGenerators('cursor',10)===10 && s.clickReward.compare(3)===0,'×10');
    const cost=Economy.generatorBatchCost(GENERATORS.oven,0,2);s.cookies=cost;s.totalProduced=HugeNumber.from(100000);
    assert(e.buyMaxGenerator('oven')===2 && s.clickReward.compare(19)===0,'Max');
  });
  test('synergie clic : amélioration clic et production restent séparées',()=>{
    const {state,engine}=funded();state.generators.cursor=10;state.generators.grandma=1;state.generators.oven=1;Economy.refreshDerived(state);
    assert(state.clickReward.compare(11)===0,'base plus atelier');
    engine.buyUpgrade('efficient_cursor');engine.buyUpgrade('grandma_recipe');engine.buyUpgrade('warm_ovens');
    assert(state.clickReward.compare(11)===0,'CPS seulement');
    engine.buyUpgrade('reinforced_click');assert(state.clickReward.compare(22)===0,'multiplicateur clic unique');
    for(let i=0;i<30;i++) Economy.refreshDerived(state);
    assert(state.clickReward.compare(22)===0,'pas de cumul répétitif');
  });
  test('synergie clic : ancien format sauvegardé reconstruit le gain',()=>{
    const f=fixture(3);const loaded=loadFixture(f);
    assert(loaded.clickPower.compare(3)===0 && loaded.clickReward.compare(6)===0,'base préservée, +10 curseurs +2 grand-mères');
    const save=new SaveSystem('synergy-roundtrip',{getItem(){return null;},setItem(){},removeItem(){}});
    const raw=JSON.parse(save.encode(loaded));assert(!('clickReward' in raw.state),'bonus dérivé non persisté');
    assert(save.decode(JSON.stringify(raw)).clickReward.compare(6)===0,'rechargement');
  });
  test('synergie clic : grand nombre de générateurs et reset',()=>{
    const s=GameState.create();s.generators.oven=Number.MAX_SAFE_INTEGER;Economy.refreshDerived(s);
    assert(s.clickReward.compare(Economy.multiply(8,Number.MAX_SAFE_INTEGER))===0,'HugeNumber');
    assert(GameState.create().clickReward.compare(1)===0,'nouvelle partie');
  });
  test('excavatrices : uniquement les CPS des mines sont doublés',()=>{
    const {state,engine}=funded();state.cookies=HugeNumber.from(1000000);state.totalProduced=state.cookies.clone();state.generators.cocoa_mine=3;state.generators.oven=2;Economy.refreshDerived(state);
    const clickBefore=state.clickReward.clone(),cost=engine.getGeneratorCost('cocoa_mine');
    assert(engine.buyUpgrade('cocoa_excavators'),'achat');
    assert(state.cps.compare(298)===0,'3 × 47 × 2 + 2 × 8');
    assert(state.clickReward.compare(clickBefore)===0,'bonus clic inchangé');
    assert(engine.getGeneratorCost('cocoa_mine').compare(cost)===0,'prix inchangé');
    assert(!engine.buyUpgrade('cocoa_excavators'),'pas de double achat');
  });
  test('clic cosmique : six fois la base avec le clic renforcé',()=>{
    const {state,engine}=funded();state.cookies=HugeNumber.from(1000000);state.totalProduced=state.cookies.clone();state.generators.cocoa_mine=2;Economy.refreshDerived(state);
    assert(engine.buyUpgrade('reinforced_click') && engine.buyUpgrade('cosmic_click'),'achats');
    assert(state.clickReward.compare(570)===0,'(1 + 2 × 47) × 2 × 3');
    assert(state.cps.compare(94)===0,'production passive stable');
    const before=state.cookies.clone();assert(engine.click().compare(570)===0 && state.cookies.compare(before.add(570))===0,'clic crédité');
    for(let i=0;i<25;i++) Economy.refreshDerived(state);
    assert(state.clickReward.compare(570)===0,'recalcul idempotent');
  });
  test('nouvelles recettes : une ancienne sauvegarde reste compatible',()=>{
    const save=new SaveSystem('new-recipes-test',{getItem(){return null;},setItem(){},removeItem(){}});
    const s=GameState.create();s.generators.cocoa_mine=2;s.ownedUpgrades=['reinforced_click'];
    const old=save.decode(save.encode(s));assert(old.ownedUpgrades.length===1 && old.clickReward.compare(190)===0,'ancienne possession');
    old.cookies=HugeNumber.from(1000000);old.totalProduced=old.cookies.clone();
    const engine=new GameEngine(old);assert(engine.buyUpgrade('cocoa_excavators') && engine.buyUpgrade('cosmic_click'),'nouveaux achats');
    const reloaded=save.decode(save.encode(old));
    assert(reloaded.ownedUpgrades.length===3 && reloaded.cps.compare(188)===0 && reloaded.clickReward.compare(570)===0,'nouveaux bonus reconstruits');
  });
  test('six recettes et cinq laboratoires survivent au rechargement',()=>{
    const save=new SaveSystem('late-game-roundtrip',{getItem(){return null;},setItem(){},removeItem(){}});
    const state=GameState.create();state.generators.chocolate_lab=5;state.ownedUpgrades=['reinforced_click','efficient_cursor','grandma_recipe','warm_ovens','cocoa_excavators','cosmic_click'];
    const loaded=save.decode(save.encode(state));
    assert(loaded.ownedUpgrades.length===6 && loaded.generators.chocolate_lab===5,'sources');
    assert(loaded.cps.compare(1725)===0 && loaded.clickReward.compare(6906)===0,'valeurs dérivées');
    assert(Progression.derive(loaded).rows.find(row=>row.definition.id==='five_labs').done,'étape reconstruite');
  });
  test('recherche : achat verrouillé sans mutation',()=>{
    const s=GameState.create();s.cookies=HugeNumber.from('1e20');const e=new GameEngine(s),before=JSON.stringify(s);
    assert(Economy.upgradeQuote(s,'precision_click').status==='locked','statut');
    assert(!e.buyUpgrade('precision_click') && JSON.stringify(s)===before,'aucune mutation');
  });
  test('recherche : seuil exact et unicité après prérequis',()=>{
    const s=GameState.create();s.ownedUpgrades=['cosmic_click'];s.cookies=HugeNumber.from(2000000);const e=new GameEngine(s);
    assert(e.buyUpgrade('precision_click') && s.cookies.isZero(),'achat exact');
    assert(s.clickReward.compare(6)===0 && !e.buyUpgrade('precision_click'),'effet une fois');
  });
  test('recherche : chaîne de clics complète',()=>{
    const s=GameState.create();s.cookies=HugeNumber.from('1e18');s.generators.orbital_bakery=1;const e=new GameEngine(s);
    for(const id of ['reinforced_click','cosmic_click','precision_click','quantum_click','singularity_click']) assert(e.buyUpgrade(id),'chaîne');
    assert(s.clickReward.compare(100872)===0,'1401 × 72');assert(s.cps.compare(1400)===0,'CPS distinct');
    const before=s.cookies.clone();assert(e.click().compare(100872)===0 && s.cookies.compare(before.add(100872))===0,'gain réel');
  });
  test('recherche : une découverte sauvegardée ne perd jamais son effet',()=>{
    const s=GameState.create();s.ownedUpgrades=['quantum_click'];new GameEngine(s);
    assert(s.clickReward.compare(2)===0 && Economy.upgradeQuote(s,'quantum_click').status==='owned','possession préservée');
  });
  test('recherche : graphes invalides rejetés',()=>{
    const bad=[{a:{requires:['a']}},{a:{requires:['b']}},{a:{requires:['b','b']},b:{}},{a:{requires:['b']},b:{requires:['a']}},{a:{requires:'b'},b:{}}];
    for(const graph of bad){let threw=false;try{validateResearchGraph(graph);}catch{threw=true;}assert(threw,'graphe invalide');}
    validateResearchGraph({a:{},b:{requires:['a']},c:{requires:['a','b']}});
  });
  test('extension : lots et achat maximal restent cohérents',()=>{
    const s=GameState.create(),d=GENERATORS.orbital_bakery;s.cookies=Economy.generatorBatchCost(d,0,10);const e=new GameEngine(s);
    assert(e.buyMaxGenerator(d.id)===10 && s.generators[d.id]===10,'max exact');
    assert(s.cps.compare(14000)===0 && s.clickReward.compare(14001)===0,'lot');
  });
  test('extension : toutes les recherches survivent à la sauvegarde',()=>{
    const save=new SaveSystem('new-constellation',{getItem(){return null;},setItem(){},removeItem(){}});
    const s=GameState.create();s.ownedUpgrades=Object.keys(UPGRADES);s.generators.orbital_bakery=4;s.generators.lunar_harvest=2;s.generators.stellar_forge=1;
    const e=new GameEngine(s),raw=save.encode(s),loaded=save.decode(raw);
    assert(loaded.ownedUpgrades.length===22 && loaded.clickReward.compare(s.clickReward)===0 && loaded.cps.compare(s.cps)===0,'reconstruction');
    assert(!Object.hasOwn(JSON.parse(raw).state,'clickReward'),'pas de cache persisté');
  });
  test('extension : multiplicateurs de production séparés des clics',()=>{
    const s=GameState.create();s.cookies=HugeNumber.from('1e18');s.generators.chocolate_lab=1;s.generators.orbital_bakery=1;s.generators.lunar_harvest=1;const e=new GameEngine(s),before=s.clickReward.clone();
    for(const id of ['cocoa_excavators','lab_synergy','orbital_logistics','lunar_crystals','warm_ovens','stellar_network','infinite_ovens'])assert(e.buyUpgrade(id),'achat');
    assert(s.cps.compare(169740)===0 && s.clickReward.compare(before)===0,'domaines séparés');
  });
  test('extension : parcours complet et nouvelle partie',()=>{
    const s=GameState.create();s.totalProduced=HugeNumber.from('1e12');s.ownedUpgrades=Object.keys(UPGRADES);for(const id of Object.keys(GENERATORS))s.generators[id]=10;
    const p=Progression.derive(s);assert(p.completed===44 && !p.next && p.rank==='Gardien des origines','final');
    const fresh=GameState.create();assert(Progression.derive(fresh).completed===0 && fresh.clickReward.compare(1)===0,'départ');
  });
  test('HUD : nombres compacts sans mutation',()=>{
    const n=HugeNumber.from('183000000'),before=JSON.stringify(n);
    assert(Economy.compact(n)==='183 M' && JSON.stringify(n)===before,'stable');
    assert(Economy.compact('1e1000')==='1e1000','valeur extrême');
    assert(Economy.compact(999999)==='1 M','arrondi de frontière');
  });

  test('achat générateur : échec de dérivation sans mutation partielle',()=>{
    const s=GameState.create();s.cookies=HugeNumber.from(1000);const e=new GameEngine(s),before=JSON.stringify(s),original=Economy.deriveValues;let rejected=false;
    Economy.deriveValues=()=>{throw new Error('calcul simulé');};
    try{e.buyGenerator('cursor');}catch{rejected=true;}finally{Economy.deriveValues=original;}
    assert(rejected && JSON.stringify(s)===before,'aucun débit ni possession si calcul impossible');
  });
  test('achat générateur : clés héritées et types invalides refusés',()=>{
    const s=GameState.create();s.cookies=HugeNumber.from(1000);const e=new GameEngine(s),before=JSON.stringify(s);
    for(const id of ['toString','constructor','__proto__',[],{},null,1]){
      assert(e.buyGenerators(id,1)===0 && e.buyMaxGenerator(id)===0,'refus');
    }
    assert(JSON.stringify(s)===before,'état intact');
  });

  test('catalogue : achat exact, clic, production et croissance des seize générateurs',()=>{
    assert(Object.keys(GENERATORS).length===16,'objectif catalogue');
    for(const [id,d] of Object.entries(GENERATORS)){
      const s=GameState.create();s.cookies=HugeNumber.from(d.baseCost);const e=new GameEngine(s);
      assert(e.buyGenerator(id) && s.cookies.isZero() && s.generators[id]===1,id+' achat');
      assert(s.cps.compare(d.baseCps)===0 && s.clickReward.compare(HugeNumber.from(d.baseCps).add(1))===0,id+' gains');
      assert(e.click().compare(HugeNumber.from(d.baseCps).add(1))===0,id+' clic réel');
      assert(e.getGeneratorCost(id).compare(HugeNumber.from(d.baseCost).multiply('1.15'))===0,id+' croissance');
      s.cookies=Economy.generatorBatchCost(d,1,10);assert(e.buyGenerators(id,10)===10 && s.generators[id]===11,id+' lot');
    }
  });
  test('catalogue : compatibilité et validation de chaque possession',()=>{
    const save=new SaveSystem('catalogue-migration',{getItem(){return null;},setItem(){},removeItem(){}});
    const state=GameState.create();state.generators.cursor=3;state.ownedUpgrades=['reinforced_click'];const original=JSON.parse(save.encode(state));
    for(const id of Object.keys(GENERATORS)){
      const missing=JSON.parse(JSON.stringify(original));delete missing.state.generators[id];
      const loaded=save.decode(JSON.stringify(missing));assert(loaded && loaded.generators[id]===0,id+' absent');
      for(const value of [-1,.5,null,Number.MAX_SAFE_INTEGER+1]){
        const invalid=JSON.parse(JSON.stringify(original));invalid.state.generators[id]=value;assert(save.decode(JSON.stringify(invalid))===null,id+' invalide');
      }
    }
    for(const id of Object.keys(GENERATORS))state.generators[id]=10;
    state.ownedUpgrades=Object.keys(UPGRADES);new GameEngine(state);
    const restored=save.decode(save.encode(state));assert(restored.ownedUpgrades.length===22 && restored.clickReward.compare(state.clickReward)===0 && restored.cps.compare(state.cps)===0,'roundtrip complet');
  });
  test('spécialisations : seuil de dix, débit exact et double effet isolé',()=>{
    for(const d of Object.values(UPGRADES).filter(item=>item.effect.target==='generatorPower')){
      const id=d.effect.generatorId,s=GameState.create();s.generators[id]=9;s.cookies=HugeNumber.from(d.cost);const e=new GameEngine(s);
      const before=JSON.stringify(s);assert(Economy.upgradeQuote(s,d.id).status==='locked' && !e.buyUpgrade(d.id) && JSON.stringify(s)===before,'neuf unités');
      s.generators[id]=10;Economy.refreshDerived(s);const beforeCps=s.cps.clone(),baseBonus=Economy.deriveGeneratorClickBonus(s);
      assert(e.buyUpgrade(d.id) && s.cookies.isZero(),'dix unités et coût exact');
      assert(s.cps.compare(beforeCps.multiply(2))===0 && s.clickReward.compare(baseBonus.multiply(2).add(1))===0,'double effet');
      assert(!e.buyUpgrade(d.id),'achat unique');
      const multipliers=Economy.deriveMultipliers(s);
      for(const other of Object.keys(GENERATORS).filter(key=>key!==id))assert(multipliers.generators[other].compare(1)===0 && multipliers.generatorClicks[other].compare(1)===0,'autres générateurs intacts');
    }
  });
  test('spécialisations : cumul multiplicatif sans bonus à la base du clic',()=>{
    const s=GameState.create();s.generators.cursor=10;s.generators.grandma=2;s.cookies=HugeNumber.from(5000);const e=new GameEngine(s);
    for(const id of ['expert_cursor','efficient_cursor','reinforced_click','warm_ovens'])assert(e.buyUpgrade(id),'achat');
    assert(s.cps.compare(9)===0 && s.clickReward.compare(10)===0,'CPS 9 et clic 10');
    for(let i=0;i<50;i++)Economy.refreshDerived(s);
    assert(s.cps.compare(9)===0 && s.clickReward.compare(10)===0,'idempotence');
  });
  test('spécialisations : possession acquise respectée après restauration',()=>{
    const s=GameState.create();s.generators.cursor=1;s.ownedUpgrades=['expert_cursor'];new GameEngine(s);
    assert(s.clickReward.compare('1.2')===0 && Economy.upgradeQuote(s,'expert_cursor').status==='owned','pas de désactivation');
  });
  test('spécialisations : contenu invalide refusé',()=>{
    const d=UPGRADES.expert_cursor;
    for(const gate of [{id:'missing',count:10},{id:'cursor',count:0},{id:'cursor',count:.5},{id:['cursor'],count:10},null]){
      let threw=false;try{validateUpgradeContent({expert_cursor:{...d,requiresGenerator:gate}});}catch{threw=true;}assert(threw,'gate invalide');
    }
  });
  test('attente : coût manquant et estimation sans clic',()=>{
    let wait=Economy.purchaseWait(100,40,2);assert(wait.missing.compare(60)===0 && wait.seconds.compare(30)===0,'30 secondes');
    assert(Economy.purchaseWait(100,40,0).seconds===null,'sans production');
    assert(Economy.purchaseWait(100,101,0).seconds.isZero(),'déjà finançable');
    wait=Economy.purchaseWait('1e1000',0,'1e999');assert(wait.seconds.compare(10)===0,'division de grandes valeurs');
    assert(Economy.formatWait('1e1000').includes('jours sans clic'),'pas de conversion infinie');
  });
  test('régions : chaque générateur figure exactement une fois',()=>{
    const ids=GENERATOR_ERAS.flatMap(era=>era.ids);assert(ids.length===16 && new Set(ids).size===16 && ids.every(id=>owns(GENERATORS,id)),'partition');
  });

  const failed=results.filter(r=>!r.ok);
  const status=document.createElement('div');
  status.id='testStatus';

  status.textContent=failed.length===0
    ? `Tests Foundation : ${results.length}/${results.length} réussis`
    : `Tests Foundation : ${results.length-failed.length}/${results.length} réussis · ${failed.map(f=>f.name).join(' | ')}`;
  document.getElementById('diagnosticResults').replaceChildren(status);
  const diagnostics=document.getElementById('diagnostics');
  diagnostics.classList.toggle('has-failures',failed.length>0);
  diagnostics.open=failed.length>0;
  console.table(results);
  return {passed:failed.length===0,total:results.length,failed};
}

