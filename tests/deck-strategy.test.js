'use strict';
// Regression cases for the owned-card deck strategy (DECK_ENGINE_REPORT.md).
// Inventories are synthetic: either the union of the retail presets or hand-made
// fixtures. Passing tests show the deck obeys the rules; they do not show it plays well.
const assert=require('node:assert/strict'),test=require('node:test');
const E=require('../deck-engine');
const db=require('../data/korean_cards_db.json'),evo=require('../data/evolution_lines.json'),presets=require('../data/starter_deck_presets.json');
const D=Object.fromEntries(db.map(c=>[c.bs_code,c]));
const retail={};for(const p of presets.presets)for(const c of p.cards)retail[c.bs_code]={qty:(retail[c.bs_code]?.qty||0)+c.qty};
const base={database:db,evolution:evo,owned:retail,unlimitedBasicEnergy:true};
const pokemonTypes=r=>[...new Set(Object.keys(r.cards).filter(id=>D[id].card_class==='pokemon').map(id=>D[id].pokemon_type))];
const energyTypes=r=>[...new Set(Object.keys(r.cards).map(id=>E.basicEnergy(D[id])).filter(Boolean))];
const nameKey=c=>c.card_class==='pokemon'?c.name_kr:c.name_kr.replace(/^(박사의 연구|보스의 지령)\(.+\)$/,'$1');
// Rule checks independent of the engine's own validator.
function assertLegal(r,owned){
 let total=0;const names={};
 for(const[id,n]of Object.entries(r.cards)){const c=D[id];total+=n;assert(Number.isInteger(n)&&n>0);
  if(!E.basicEnergy(c)){names[nameKey(c)]=(names[nameKey(c)]||0)+n;assert(n<=(owned[id]?.qty||0),'owned '+c.name_kr);}}
 assert.equal(total,60);for(const[n,k]of Object.entries(names))assert(k<=4,'copies '+n);
 assert(Object.keys(r.cards).some(id=>E.basic(D[id])),'needs a basic');
}
// Every stage of a line must have at least as many cards before it (Rare Candy may skip stage 1).
function assertLine(r){
 const s=r.summary,count=n=>Object.keys(r.cards).filter(id=>D[id].name_kr===n).reduce((a,id)=>a+r.cards[id],0);
 const candy=Object.keys(r.cards).filter(id=>D[id].name_kr==='이상한사탕').reduce((a,id)=>a+r.cards[id],0);
 for(let i=1;i<s.line.length;i++)assert(count(s.line[i])<=count(s.line[i-1])+(i===2?candy:0),s.line.join('>'));
}
function typeCase(types,expectEnergy){
 const res=E.buildCandidates({...base,pokemonTypes:types});assert(res.candidates.length>=1);
 for(const o of res.candidates){const r=o.result;assert(r.validation.ok,r.validation.errors.join(';'));assertLegal(r,E.supply(db,retail,true));assertLine(r);
  for(const t of pokemonTypes(r))assert(types.includes(t),'unexpected Pokemon type '+t);
  for(const t of energyTypes(r))assert(expectEnergy.includes(t),'unexpected energy '+t);
  for(const t of types.filter(t=>t!=='무색'))assert(pokemonTypes(r).includes(t),'missing selected type '+t);}
 return res;
}
test('1. fire + fighting: both types attack, only fire/fighting energy',()=>{const r=typeCase(['불꽃','격투'],['불꽃','격투']).candidates[0].result;assert.deepEqual(energyTypes(r).sort(),['격투','불꽃']);});
test('2. darkness + fighting: both types, only darkness/fighting energy',()=>{typeCase(['악','격투'],['악','격투']);});
test('3. metal + colorless: never psychic or grass energy (old 초 15장 bug)',()=>{const r=typeCase(['강철','무색'],['강철']).candidates[0].result;assert.deepEqual(energyTypes(r),['강철']);});
test('old unrelated-grass bug: colorless attacker energy follows selected type, not DB order',()=>{
 const grassFirst=db.filter(c=>E.basicEnergy(c)==='풀').slice(0,1).concat(db.filter(c=>E.basicEnergy(c)&&E.basicEnergy(c)!=='풀'));
 const att={bs_code:'x1',name_kr:'무색 공격수',card_class:'pokemon',card_type:'기본 포켓몬',pokemon_type:'무색',hp:120,skills:[{name:'몸통박치기',damage:'90',cost:['무색','무색']}]};
 const steel={bs_code:'x2',name_kr:'강철 친구',card_class:'pokemon',card_type:'기본 포켓몬',pokemon_type:'강철',hp:90,skills:[{name:'박치기',damage:'30',cost:['강철']}]};
 const grass={bs_code:'x3',name_kr:'풀 친구',card_class:'pokemon',card_type:'기본 포켓몬',pokemon_type:'풀',hp:90,skills:[{name:'잎',damage:'40',cost:['무색']}]};
 const data=[...grassFirst,att,steel,grass],owned={x1:{qty:4},x2:{qty:4},x3:{qty:4}};
 const r=E.buildByTypes({database:data,evolution:[],owned,pokemonTypes:['강철','무색'],unlimitedBasicEnergy:true});
 assert(!r.cards.x3,'grass Pokemon must not be added');assert.deepEqual(r.energyTypes,['강철']);
 assert(Object.keys(r.cards).every(id=>{const t=E.basicEnergy(data.find(c=>c.bs_code===id));return !t||t==='강철';}));
 // With nothing selected, the colorless choice still follows the deck, and the note says why.
 const solo=E.build({database:data,evolution:[],owned:{x1:{qty:4},[grassFirst[1].bs_code]:{qty:20}},basicCode:'x1'});
 assert.deepEqual(solo.energyTypes,[E.basicEnergy(grassFirst[1])]);assert(solo.notes.some(n=>n.includes('무색 비용')));
});
test('4. Metagross line: owner family, legal stage counts, metal energy',()=>{
 const res=E.buildCandidates({...base,basicCode:'BS2025003005',targetPath:'메타그로스'}),r=res.candidates[0].result;
 assert.equal(D[r.attacker].name_kr,'성호의 메타그로스 ex');assertLegal(r,E.supply(db,retail,true));assertLine(r);
 assert.deepEqual(r.summary.line,['성호의 메탕','성호의 메탕구','성호의 메타그로스 ex']);assert(energyTypes(r).includes('강철'));
});
test('5. missing or short pre-evolution: never orphaned, shortage reported',()=>{
 const [metang,metangu,meta]=['BS2025003005','BS2025003006','BS2025003007'],steel=db.find(c=>E.basicEnergy(c)==='강철').bs_code;
 const noMiddle=E.build({database:db,evolution:evo,owned:{[metang]:{qty:4},[meta]:{qty:3},[steel]:{qty:20}},basicCode:metang,targetPath:'메타그로스'});
 assert(!noMiddle.cards[meta]);assert(noMiddle.notes.some(n=>n.includes('연결되지')));
 const short=E.build({database:db,evolution:evo,owned:{[metang]:{qty:1},[metangu]:{qty:3},[meta]:{qty:3},[steel]:{qty:20}},basicCode:metang,targetPath:'메타그로스'});
 assert(short.summary.weaknesses.some(w=>w.includes('진화하지 못할')));
});
test('6. two required energy types: typed costs of each line are supplied',()=>{
 const r=typeCase(['악','격투'],['악','격투']).candidates[0].result;for(const t of r.energyTypes)assert(energyTypes(r).includes(t));
 assert(energyTypes(r).length===2);
});
test('7. sufficient basic energy assumed without touching the collection',()=>{
 const owned=JSON.parse(JSON.stringify(retail));for(const id of Object.keys(owned))if(E.basicEnergy(D[id]))delete owned[id];
 const before=JSON.stringify(owned),r=E.buildCandidates({...base,owned,pokemonTypes:['번개']}).candidates[0].result;
 assert(r.validation.ok);assert(energyTypes(r).length>0);assert.equal(JSON.stringify(owned),before);
 assert(r.notes[0].includes('충분히 보유'));
 const strict=E.buildByTypes({...base,owned,pokemonTypes:['번개'],unlimitedBasicEnergy:false});assert(!strict.validation.ok||!strict.validation.total);
});
test('8. few draw/search trainers: weaknesses say so instead of padding with energy',()=>{
 const owned=Object.fromEntries(Object.entries(retail).filter(([id])=>D[id].card_class==='pokemon'));
 const r=E.buildByTypes({...base,owned,pokemonTypes:['번개']});
 assert(r.summary.weaknesses.some(w=>w.includes('드로우')));assert(r.summary.weaknesses.some(w=>w.includes('검색')));
 assert(Object.keys(r.cards).filter(id=>E.basicEnergy(D[id])).reduce((a,id)=>a+r.cards[id],0)<=18);
});
test('9. selected type with too few owned cards is reported, never filled with other types',()=>{
 const none=E.buildCandidates({...base,pokemonTypes:['드래곤']});assert.equal(none.candidates.length,0);assert(none.failure.notes.length);
 const fairy=E.buildByTypes({...base,pokemonTypes:['불꽃','페어리']});
 if(!pokemonTypes(fairy).includes('페어리'))assert(fairy.validation.errors.some(e=>e.includes('선택 타입 누락')));
 for(const t of pokemonTypes(fairy))assert(['불꽃','페어리'].includes(t));
});
test('10. cards added in the 2026-10-30 DB update build a legal deck',()=>{
 const owned={};for(const id of ['mega_eevee_ex','mega_zoroark_ex','mega_meowscarada_ex'])for(const c of presets.presets.find(p=>p.id===id).cards)owned[c.bs_code]={qty:(owned[c.bs_code]?.qty||0)+c.qty};
 const res=E.buildCandidates({...base,owned,basicCode:'BS2026008006'}),r=res.candidates[0].result;
 assert(r.validation.ok);assertLegal(r,E.supply(db,owned,true));assert(r.attacker.startsWith('BS20260'));
});
test('11. stored decks and collections stay compatible: inputs untouched, every retail preset valid',()=>{
 const before=JSON.stringify(retail);E.buildCandidates({...base,pokemonTypes:['풀']});E.buildCandidates({...base,basicCode:'BS2026007008'});assert.equal(JSON.stringify(retail),before);
 for(const p of presets.presets){const cards={};p.cards.forEach(c=>cards[c.bs_code]=(cards[c.bs_code]||0)+c.qty);assert(E.inspect(cards,D).ok,p.id+' '+E.inspect(cards,D).errors.join(';'));}
 // Saved decks keep using plain {bs_code: qty} maps that inspect/simulate accept.
 const r=E.build({...base,basicCode:'BS2026007008'});assert(E.simulate(r.cards,db,{trials:200,seed:1}).available);
});
test('12. card-count rules: name variants share four copies, ACE SPEC and Prism Star stay at one',()=>{
 const prof=db.filter(c=>/^박사의 연구/.test(c.name_kr)&&c.card_class==='trainer').slice(0,3),cards={};prof.forEach(c=>cards[c.bs_code]=2);
 assert(E.inspect(cards,D).errors.some(e=>e.includes('같은 이름 4장 초과: 박사의 연구')));
 const prism=db.find(c=>/\(프리즘스타\)/.test(c.name_kr)&&c.card_class==='pokemon');assert(E.inspect({[prism.bs_code]:2},D).errors.some(e=>e.includes('프리즘스타')));
 for(const t of [['불꽃'],['물'],['초'],['풀','번개']]){const res=E.buildCandidates({...base,pokemonTypes:t});for(const o of res.candidates){assertLegal(o.result,E.supply(db,retail,true));const ace=Object.keys(o.result.cards).filter(id=>/ACE SPEC/.test(D[id].effect_text||'')).reduce((a,id)=>a+o.result.cards[id],0);assert(ace<=1);}}
});
test('trainers that name another family, type or Pokemon category are not added to unrelated decks',()=>{
 const r=E.buildByTypes({...base,pokemonTypes:['불꽃']}),names=Object.keys(r.cards).map(id=>D[id].name_kr);
 for(const n of ['원더패치','안개의 수정','주혜','메가시그널','일렉트릭 제너레이터'])assert(!names.includes(n),n);
 const info=E.trainerInfo(db.find(c=>c.name_kr==='메가시그널'));assert.deepEqual(info.keywords,['메가진화 ex']);
 assert.equal(E.trainerInfo(db.find(c=>c.name_kr==='하이퍼볼')).conditional,false);assert.equal(E.trainerInfo(db.find(c=>c.name_kr==='포켓몬 캐처')).conditional,true);
});
test('candidates are distinct strategies compared on objective figures only',()=>{
 const res=E.buildCandidates({...base,pokemonTypes:['번개']});assert(res.candidates.length>=1&&res.candidates.length<=3);
 const keys=res.candidates.map(o=>o.result.attacker+o.result.attack);assert.equal(new Set(keys).size,keys.length);
 for(const o of res.candidates){const m=o.metrics;for(const k of ['openingBasic','openingDrawSearch','openingEnergy'])assert(m[k]>=0&&m[k]<=1);
  assert(m.lineReady[2]<=m.lineReady[3]&&m.lineReady[3]<=m.lineReady[4]);assert(!('score' in m)&&!('winRate' in m));}
 assert(res.limits.includes('승률'));
});
test('chosen Pokemon that cannot attack explains why and offers owned alternatives',()=>{
 const noAttack={bs_code:'na',name_kr:'공격 못함',card_class:'pokemon',card_type:'기본 포켓몬',pokemon_type:'번개',hp:60,skills:[{name:'특성',text:'설명'}]};
 const ok={bs_code:'ok',name_kr:'번개 공격수',card_class:'pokemon',card_type:'기본 포켓몬',pokemon_type:'번개',hp:100,skills:[{name:'방전',damage:'70',cost:['번개']}]};
 const en=db.find(c=>E.basicEnergy(c)==='번개');
 const r=E.build({database:[noAttack,ok,en],evolution:[],owned:{na:{qty:4},ok:{qty:4},[en.bs_code]:{qty:20}},basicCode:'na'});
 assert.equal(r.validation.total,0);assert(r.alternatives.some(a=>a.name==='번개 공격수'));assert(r.notes.some(n=>n.includes('번개 공격수')));
});
test('early-turn simulation is deterministic, bounded and labelled as a simplified model',()=>{
 const r=E.build({...base,basicCode:'BS2025003005',targetPath:'메타그로스'}),a=E.simulate(r.cards,db,{trials:3000,seed:7,plan:r.plan});
 assert.deepEqual(a,E.simulate(r.cards,db,{trials:3000,seed:7,plan:r.plan}));assert(a.mainReadyBy[2]<=a.mainReadyBy[4]);
 for(const k of ['mulliganRate','helperByTurn2'])assert(a[k]>=0&&a[k]<=1);assert(a.readyScope.includes('승률'));
});
test('app keeps the saved deck format; candidates and summaries stay session-only',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../app.js'),'utf8');
 const save=source.slice(source.indexOf('var saveObj={'),source.indexOf('};',source.indexOf('var saveObj={')));
 const keys=[...save.matchAll(/\n\s*(\w+):/g)].map(m=>m[1]);
 assert.deepEqual(keys,['id','name','format','pool','strict','cards','createdAt','updatedAt','unlimitedBasicEnergy','buildNotes','buildAttacker','lastAutoBuild']);
 const from=source.indexOf('function applyBuildProposal('),snippet=source.slice(from,source.indexOf('function rerollAutoBuild(',from));
 const owned={};for(const id of ['mega_zoroark_ex'])for(const c of presets.presets.find(p=>p.id===id).cards)owned[c.bs_code]={qty:c.qty};
 const set=E.buildCandidates({...base,owned,basicCode:'BS2026008006'}),before=JSON.stringify(owned);
 let refreshed=0;const ctx={_deckBuilder:{cards:{},buildNotes:['old']},refreshDeckBuilder(){refreshed++;},toast(){}};vm.createContext(ctx);vm.runInContext(snippet,ctx);
 ctx.applyBuildProposal(set.candidates[0].result,set.candidates,true,0);
 assert(ctx._deckBuilder.buildNotes.every(n=>typeof n==='string')&&ctx._deckBuilder.buildNotes[0].includes(set.candidates[0].label));
 assert.equal(Object.values(ctx._deckBuilder.cards).reduce((a,b)=>a+b,0),60);assert.equal(JSON.stringify(owned),before);
 if(set.candidates.length>1){ctx.selectBuildCandidate(1);assert.equal(ctx._deckBuilder.buildCandidateIndex,1);assert.equal(refreshed,1);}
});
test('owning a single retail deck is enough for a legal 60-card build of its types',()=>{
 for(const p of presets.presets){const owned={};p.cards.forEach(c=>owned[c.bs_code]={qty:c.qty});
  const types=[...new Set(p.cards.map(c=>D[c.bs_code]).filter(c=>c.card_class==='pokemon').map(c=>c.pokemon_type))];
  const res=E.buildCandidates({...base,owned,pokemonTypes:types}),r=res.candidates[0]&&res.candidates[0].result;
  assert(r&&r.validation.ok,p.id+' '+(r?r.validation.errors.join(';'):'no candidate'));assertLegal(r,E.supply(db,owned,true));assertLine(r);
  for(const t of pokemonTypes(r))assert(types.includes(t),p.id+' type '+t);}
});
test('a selected type whose attacks need unselected energy joins without that energy',()=>{
 const r=E.buildByTypes({...base,pokemonTypes:['악','드래곤']});
 assert(r.validation.ok,r.validation.errors.join(';'));for(const t of energyTypes(r))assert(['악'].includes(t),'energy '+t);
 assert(pokemonTypes(r).includes('드래곤'));
});
