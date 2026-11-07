import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1]+';({HugeNumber,GameState,GameEngine,SaveSystem})',{window:{addEventListener(){}},console:{error(){}}});
const {HugeNumber,GameState,SaveSystem}=api;
const pair=n=>JSON.parse(JSON.stringify(n));
const saver=()=>new SaveSystem('numeric-test',{});

test('positive scientific strings below Number range retain their magnitude',()=>{
  for(const [input,m,e] of [['1e-1000',1,-1000],['1e-324',1,-324],['.001e-1000',1,-1003],['+000123e-1000',1.23,-998]]){
    assert.deepEqual(pair(HugeNumber.from(input)),{m,e},input);
  }
  for(const input of ['0','0e-1000','0.000e1000']) assert.deepEqual(pair(HugeNumber.from(input)),{m:0,e:0});
  assert.equal(HugeNumber.from('1e-1000').multiply('1e1000').compare(1),0);
});
test('positive Number subnormals remain finite, canonical and positive',()=>{
  for(const input of [Number.MIN_VALUE,1e-320,1e-309]){
    const n=HugeNumber.from(input);
    assert.ok(n.m>=1&&n.m<10&&Number.isInteger(n.e));
    assert.ok(n.compare(0)>0);
    assert.equal(n.compare(HugeNumber.from(input.toExponential())),0);
    assert.equal(n.compare(HugeNumber.fromJSON(n.toJSON())),0);
  }
});
test('fractional exponents cannot enter comparison through constructors or JSON',()=>{
  for(const e of [0.5,-0.5,NaN,Infinity]){
    assert.throws(()=>new HugeNumber(1,e));
    assert.throws(()=>HugeNumber.fromJSON({m:1,e}));
  }
  assert.deepEqual(pair(HugeNumber.fromJSON({m:12,e:2})),{m:1.2,e:3});
  assert.deepEqual(pair(HugeNumber.fromJSON({m:0,e:5})),{m:0,e:0});
});
test('v2-v7 decode rejects fractional exponent fields without changing raw input',()=>{
  for(const version of [2,3,4,5,6,7]) for(const field of ['cookies','totalProduced','clickPower']){
    const payload=JSON.parse(saver().encode(GameState.create()));payload.version=version;
    payload.state[field]={m:1,e:0.5};
    const raw=JSON.stringify(payload);
    assert.equal(saver().decode(raw),null,`${version}:${field}`);
    assert.equal(JSON.stringify(payload),raw);
  }
});
test('valid legacy saves and very small fractional balances round-trip through v7',()=>{
  for(const version of [2,3,4,5,6,7]){
    const payload=JSON.parse(saver().encode(GameState.create()));payload.version=version;
    payload.state.cookies={m:1,e:-1000};payload.state.totalProduced={m:1,e:-1000};
    const decoded=saver().decode(JSON.stringify(payload));assert.ok(decoded,`v${version}`);
    const saved=saver().decode(saver().encode(decoded));
    assert.deepEqual(pair(saved.cookies),{m:1,e:-1000});
  }
});
test('legacy subnormal JSON now normalizes to a valid import instead of Infinity',()=>{
  const save=saver(),payload=JSON.parse(save.encode(GameState.create()));
  payload.state.cookies={m:Number.MIN_VALUE,e:0};payload.state.totalProduced={m:Number.MIN_VALUE,e:0};
  const decoded=save.decodeImport(JSON.stringify(payload));assert.ok(decoded);
  assert.deepEqual(pair(decoded.cookies),{m:5,e:-324});
});
test('invalid on-disk fractional data remains protected while play can continue',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const save=new SaveSystem('numeric-test',storage),payload=JSON.parse(save.encode(GameState.create()));
  payload.state.cookies={m:1,e:0.5};payload.state.totalProduced={m:1,e:0.5};
  const raw=JSON.stringify(payload);data.set(save.key,raw);
  assert.equal(save.load(),null);assert.equal(save.mode,'recovery');
  assert.equal(save.save(GameState.create()),false);assert.equal(data.get(save.key),raw);
  assert.ok(JSON.parse(data.get(save.quarantineKey)).entries.some(e=>e.raw===raw));
});
test('click count saturates at its saveable limit while rewards continue',()=>{
  const state=GameState.create();state.totalClicks=Number.MAX_SAFE_INTEGER-1;
  const engine=new api.GameEngine(state);engine.click();engine.click();
  assert.equal(state.totalClicks,Number.MAX_SAFE_INTEGER);
  assert.equal(state.cookies.compare(2),0);assert.equal(state.totalProduced.compare(2),0);
  assert.equal(saver().decode(saver().encode(state)).totalClicks,Number.MAX_SAFE_INTEGER);
});
