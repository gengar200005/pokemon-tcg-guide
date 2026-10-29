'use strict';
const assert=require('node:assert/strict'),test=require('node:test');
const E=require('../deck-engine');
const db=require('../data/korean_cards_db.json'),evo=require('../data/evolution_lines.json');
const card=(id,name,cls,extra={})=>({bs_code:id,name_kr:name,card_class:cls,...extra});
const starter=card('p','테스트 주력','pokemon',{card_type:'기본 포켓몬',pokemon_type:'악',skills:[{name:'공격',damage:'100',cost:['불꽃','불꽃']}]});
const fire=card('e','기본 불꽃 에너지','energy');
const trainers=['박사의 연구','네모','홉','네스트볼','하이퍼볼','몬스터볼','포켓몬 교체','보스의 지령','대단한낚싯대','에너지 전송'].map((n,i)=>card('t'+i,n,'trainer'));
const basics=Array.from({length:3},(_,i)=>({...starter,bs_code:'b'+i,name_kr:'보조'+i}));
const fixture=[starter,fire,...trainers,...basics];
const owned=Object.fromEntries(fixture.map(c=>[c.bs_code,{qty:c===fire?30:4}]));
function build(o={}){return E.build({database:fixture,evolution:[],owned,basicCode:'p',...o});}
test('60 cards, owned limits and source immutability',()=>{const before=JSON.stringify(owned),r=build();assert.equal(r.validation.total,60);assert(r.validation.ok);assert.equal(JSON.stringify(owned),before);assert.deepEqual(r.energyTypes,['불꽃']);assert(r.cards.e<=18);});
test('energy absent or insufficient: never invent it',()=>{const o={...owned,e:{qty:1}},r=build({owned:o});assert(!r.validation.ok);assert(!r.cards.e||r.cards.e<=1);});
test('sparse collection is partial, not 1 Pokemon + 59 energy',()=>{const r=build({owned:{p:{qty:1},e:{qty:60}}});assert(r.validation.total<60);assert(r.cards.e<=18);});
test('alternate prints share the four-copy limit',()=>{const copy={...starter,bs_code:'p2'},r=build({database:[...fixture,copy],owned:{...owned,p2:{qty:4}}});assert((r.cards.p||0)+(r.cards.p2||0)<=4);});
test('no basic and malformed counts fail validation',()=>{const d=Object.fromEntries(fixture.map(c=>[c.bs_code,c]));assert(!E.inspect({e:60},d).ok);assert(!E.inspect({p:1.5,e:58.5},d).ok);});
test('missing middle evolution is never added',()=>{const final={...starter,bs_code:'z',name_kr:'최종',card_type:'2진화 포켓몬'};const r=build({database:[...fixture,final],owned:{...owned,z:{qty:3}},evolution:[{bs_code:'z',evolvesFrom_kr:'중간',base_kr:'최종'}],targetPath:'최종'});assert(!r.cards.z);assert(r.notes.some(n=>n.includes('연결되지')));});
test('unknown costs are not silently treated as colorless',()=>{const p={...starter,skills:[{name:'?',cost:['알수없음']}]};const r=build({database:[p,fire],owned});assert.equal(r.validation.total,0);});
test('colorless attacks choose actual owned basic energy',()=>{const p={...starter,skills:[{name:'무색공격',cost:['무색']}]};const r=build({database:[p,...fixture.slice(1)]});assert.deepEqual(r.energyTypes,['불꽃']);});
test('deterministic simulation and analytical opening probability',()=>{const r=build(),a=E.simulate(r.cards,fixture,{seed:1,trials:10000});assert.deepEqual(a,E.simulate(r.cards,fixture,{seed:1,trials:10000}));let miss=1;for(let i=0;i<7;i++)miss*=(60-r.validation.basics-i)/(60-i);assert(Math.abs(a.openingBasic-(1-miss))<0.02);assert(!E.simulate({p:1},fixture).available);});
test('real Korean DB attack costs and owned evolution chain',()=>{
 const basic=db.find(c=>c.name_kr==='파이리'&&E.basic(c));
 const middle=db.find(c=>c.name_kr==='리자드'&&evo.some(e=>e.bs_code===c.bs_code&&e.evolvesFrom_kr==='파이리'));
 const final=db.find(c=>c.name_kr==='리자몽 ex'&&c.pokemon_type==='악'&&evo.some(e=>e.bs_code===c.bs_code&&e.evolvesFrom_kr==='리자드'));
 assert(basic&&middle&&final);
 const en=db.find(c=>E.basicEnergy(c)==='불꽃');const o={[basic.bs_code]:{qty:4},[middle.bs_code]:{qty:3},[final.bs_code]:{qty:3},[en.bs_code]:{qty:20}};
 const r=E.build({database:db,evolution:evo,owned:o,basicCode:basic.bs_code,targetPath:'리자몽 ex'});
 assert.equal(r.attacker,final.bs_code);assert.deepEqual(r.energyTypes,['불꽃']);assert(r.cards[en.bs_code]<=20);
});
test('100 seeded inventory perturbations preserve every hard constraint except size',()=>{for(let k=1;k<=100;k++){const o={};fixture.forEach((c,i)=>o[c.bs_code]={qty:c===fire?k%25:(k*(i+1))%7});o.p={qty:2};const r=build({owned:o});const d=Object.fromEntries(fixture.map(c=>[c.bs_code,c]));const errs=E.inspect(r.cards,d,o).errors.filter(e=>!e.includes('60장')&&!e.includes('기본 포켓몬이'));assert.deepEqual(errs,[]);}});
test('application full-deck entry point uses new engine without saving',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../app.js'),'utf8');
 const snippet=source.slice(source.indexOf('function runAutoBuild('),source.indexOf('function rerollAutoBuild('));
 let refresh=0,opened=0;const ctx={DeckEngine:E,cardsDB:fixture,evolutionLines:[],D:{collected:owned},_deckBuilder:{format:'full',cards:{}},refreshDeckBuilder(){refresh++;},openDeckSheet(){opened++;},toast(){}};
 vm.createContext(ctx);vm.runInContext(snippet,ctx);ctx.runAutoBuild(starter,null);
 assert.equal(Object.values(ctx._deckBuilder.cards).reduce((a,b)=>a+b,0),60);assert.equal(refresh,1);assert.equal(opened,1);
 const sheet=source.slice(source.indexOf('function renderDeckSheet('),source.indexOf('function renderDeckSheet(')+10000);
 assert(sheet.includes('showDeckSimulation()'));
});
test('normalized owner evolution stays in the same trainer family',()=>{
 const line=db.filter(c=>['BS2025003005','BS2025003006','BS2025003007'].includes(c.bs_code));
 const en=db.find(c=>E.basicEnergy(c)==='강철');const inv=Object.fromEntries(line.map(c=>[c.bs_code,{qty:3}]));inv[en.bs_code]={qty:20};
 const r=E.build({database:[...line,en],evolution:evo,owned:inv,basicCode:'BS2025003005',targetPath:'메타그로스',disableProfiles:true});assert.equal(r.attacker,'BS2025003007');
 const ordinary={...line[0],bs_code:'ordinary',name_kr:'메탕'};inv.ordinary={qty:4};
 const no=E.build({database:[ordinary,...line.slice(1),en],evolution:[...evo,{bs_code:'ordinary',base_kr:'메탕'}],owned:inv,basicCode:'ordinary',targetPath:'메타그로스',disableProfiles:true});assert(!no.cards.BS2025003007);
});
const refCards={p:4,e:56},refPreset={id:'fixture',name_kr:'기준덱',cards:[{bs_code:'p',qty:4},{bs_code:'e',qty:56}]};
const refOwned={p:{qty:4},e:{qty:60}};
function compare(extra={}){return E.compareReference({database:fixture,cards:refCards,owned:refOwned,preset:refPreset,...extra});}
test('retail baseline reproduction is unchanged, never an improvement',()=>{const r=compare();assert.equal(r.classification,'unchanged');assert.equal(r.overlap,60);assert.deepEqual(r.additions,[]);assert.deepEqual(r.baselineMetrics,r.candidateMetrics);assert(r.referenceOwned);});
test('cosmetic reprints match but different attacks do not',()=>{
 const alt={...starter,bs_code:'alt',image:'alternate.png'};
 assert.equal(compare({database:[...fixture,alt],cards:{alt:4,e:56},owned:{alt:{qty:4},e:{qty:56}}}).classification,'unchanged');
 const different={...alt,skills:[{name:'다른 공격',damage:'10',cost:['무색']}]};
 const r=compare({database:[...fixture,different],cards:{alt:4,e:56},owned:{alt:{qty:4},e:{qty:56}}});
 assert.equal(r.classification,'unverified_changes');assert.equal(r.overlap,56);assert.equal(r.additions[0].qty,4);assert.equal(r.removals[0].qty,4);
});
test('comparison reports inventory shortages without changing inputs',()=>{const o={p:{qty:1},e:{qty:56}},before=JSON.stringify(o);const r=compare({owned:o});assert.equal(r.classification,'unchanged');assert(!r.referenceOwned);assert.equal(r.referenceMissing[0].qty,3);assert(!r.candidateValidation.ok);assert.equal(JSON.stringify(o),before);});
test('invalid baseline and incomplete candidate cannot be a valid recommendation',()=>{assert(!compare({preset:{cards:[{bs_code:'p',qty:4}]}}).available);const r=compare({cards:{p:4,e:55}});assert.equal(r.classification,'invalid_candidate');assert.equal(r.candidateMetrics,null);});
test('opening comparison uses exact hypergeometric probability',()=>{const r=compare();let miss=1;for(let i=0;i<7;i++)miss*=(56-i)/(60-i);assert.equal(r.candidateMetrics.basic,1-miss);});
test('comparison UI reads selected baseline and does not mutate deck or inventory',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../app.js'),'utf8');
 const snippet=source.slice(source.indexOf('function compareCurrentReference('));
 const output={innerHTML:''},select={value:'fixture'};
 const ctx={DeckEngine:E,cardsDB:fixture,D:{collected:refOwned},_deckBuilder:{cards:refCards},_bdmPresets:{presets:[refPreset]},$:id=>id==='deck-reference-select'?select:output,normalizeDeckCards:d=>d.cards,esc:x=>String(x)};
 const before=JSON.stringify([ctx.D,ctx._deckBuilder]);vm.createContext(ctx);vm.runInContext(snippet,ctx);ctx.compareCurrentReference();
 assert(output.innerHTML.includes('기존 시판덱과 동일'));assert.equal(JSON.stringify([ctx.D,ctx._deckBuilder]),before);
});
