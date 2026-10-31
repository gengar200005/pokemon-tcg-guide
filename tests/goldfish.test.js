'use strict';
// Solo ("goldfish") speed simulation. These tests pin the modelled rules on hand-checkable decks;
// they do not show that the figures predict real games.
const assert=require('node:assert/strict'),test=require('node:test');
const E=require('../deck-engine');
const db=require('../data/korean_cards_db.json'),evo=require('../data/evolution_lines.json'),presets=require('../data/starter_deck_presets.json');
const fire=db.find(c=>E.basicEnergy(c)==='불꽃');
const mon=(i,dmg,cost=['불꽃'])=>({bs_code:'g'+i,name_kr:'시험몬'+i,card_class:'pokemon',card_type:'기본 포켓몬',pokemon_type:'불꽃',hp:100,retreat:1,skills:[{name:'불꽃',damage:String(dmg),cost}]});
const simple=dmg=>{const mons=[0,1,2,3].map(i=>mon(i,dmg));const cards={[fire.bs_code]:44};mons.forEach(m=>cards[m.bs_code]=4);return {cards,data:[...mons,fire]};};
const preset=id=>{const c={};presets.presets.find(p=>p.id===id).cards.forEach(x=>c[x.bs_code]=(c[x.bs_code]||0)+x.qty);return c;};

test('rules on a hand-checkable deck: no attack on turn 1, 220/110 opponents, 6 prizes on turn 7',()=>{
 const {cards,data}=simple(110),g=E.goldfish(cards,data,[],{trials:300,seed:3});
 assert(g.available);assert.equal(g.medianFirstAttack,2);assert.equal(g.medianFinish,7);assert.equal(g.finishBy[6],0);assert.equal(g.unfinished,0);
 const big=E.goldfish(simple(220).cards,simple(220).data,[],{trials:300,seed:3});assert.equal(big.medianFinish,5); // one hit per opponent: 2+1+2+1 prizes
});
test('attack costs are paid with attached energy, one attachment per turn',()=>{
 const two=[0,1,2,3].map(i=>mon(i,220,['불꽃','불꽃'])),cards={[fire.bs_code]:44};two.forEach(m=>cards[m.bs_code]=4);
 const g=E.goldfish(cards,[...two,fire],[],{trials:300,seed:3});assert.equal(g.medianFirstAttack,2);
 const three=[0,1,2,3].map(i=>mon(i,220,['불꽃','불꽃','불꽃'])),c3={[fire.bs_code]:44};three.forEach(m=>c3[m.bs_code]=4);
 assert.equal(E.goldfish(c3,[...three,fire],[],{trials:300,seed:3}).medianFirstAttack,3);
});
test('deterministic, bounded and labelled as a solo model rather than win rate',()=>{
 const c=preset('mega_eevee_ex'),a=E.goldfish(c,db,evo,{trials:300,seed:11});assert.deepEqual(a,E.goldfish(c,db,evo,{trials:300,seed:11}));
 for(const k of ['unfinished','deckOut','attackRate','stallEnergy','stallNoAttacker'])assert(a[k]>=0&&a[k]<=1,k);
 assert(a.finishBy[6]<=a.finishBy[8]&&a.finishBy[8]<=a.finishBy[10]&&a.finishBy[10]<=a.finishBy[12]);
 assert(a.scope.includes('승률이 아닙니다'));assert(!E.goldfish({},db,evo).available);
});
test('reviewed energy abilities are parsed exactly; other wordings are skipped',()=>{
 const ab=(name,skill)=>E.energyAbility(db.find(c=>c.name_kr===name&&(c.skills||[]).some(s=>s.name===skill)).skills.find(s=>s.name===skill));
 assert.deepEqual(ab('리자몽 ex','연옥 지배'),{source:'deck',count:3,mode:'attach',types:['불꽃'],when:'evolve',activeOnly:false,draw:0});
 assert.deepEqual(ab('빠르모트','발전 터치'),{source:'discard',count:1,mode:'attach',types:['번개'],when:'turn',activeOnly:false,draw:0});
 assert.equal(ab('파오젠 ex','부들부들 냉기').mode,'hand');assert.equal(ab('파오젠 ex','부들부들 냉기').activeOnly,true);
 assert.equal(ab('오리진 펄기아 VSTAR','VSTAR 파워스타포털').when,'game');assert.equal(ab('네이티오','아카식 센스').draw,2);
 assert.equal(ab('찬란한 개굴닌자','숨겨진 수단'),null);assert.equal(ab('딜리버드','에너지 프레젠트'),null);
});
test('a modelled ability changes the result: Charizard ex without 연옥 지배 is slower',()=>{
 const c=preset('charizard_bm'),zard=db.find(x=>x.bs_code in c&&x.name_kr==='리자몽 ex');
 const plain={...zard,bs_code:'nozard',skills:zard.skills.filter(s=>s.name!=='연옥 지배')},c2={...c,nozard:c[zard.bs_code]};delete c2[zard.bs_code];
 const withAb=E.goldfish(c,db,evo,{trials:800,seed:5}),without=E.goldfish(c2,[...db,plain],[...evo,{...evo.find(e=>e.bs_code===zard.bs_code),bs_code:'nozard'}],{trials:800,seed:5});
 assert(withAb.abilitiesModelled.some(x=>x.includes('연옥 지배')));assert(withAb.medianFinish<without.medianFinish||withAb.finishBy[10]>without.finishBy[10]);
});
test('knockout scenario: a backup basic attacks right away unless the bench was empty',()=>{
 const {cards,data}=simple(110),k=E.goldfish(cards,data,[],{trials:300,seed:3,knockoutTurn:4});
 assert.equal(k.knockout.turn,4);assert(k.knockout.nextTurnAttack>=0.85);
 // Every game either attacks right after the knockout or had nothing on the bench (no search cards in this deck).
 assert(k.knockout.noBackup<0.15);assert(Math.abs(k.knockout.nextTurnAttack+k.knockout.noBackup-1)<1e-9);
});
test('app renders the comparison without claiming a win rate',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../app.js'),'utf8');
 const ctx={esc:x=>String(x)};vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function goldfishHtml('),source.indexOf('/* Retail decks are explicit baselines')),ctx);
 const c=preset('mega_zoroark_ex'),g=E.goldfish(c,db,evo,{trials:200,seed:1}),k=E.goldfish(c,db,evo,{trials:200,seed:1,knockoutTurn:4});
 const html=ctx.goldfishHtml(g,k,g,{name_kr:'기준'});assert(html.includes('시판덱과 비슷한 속도'));assert(html.includes('승률이 아닙니다'));assert(!/승률\s*\d/.test(html));
});
test('evaluate option recommends the fastest valid candidate and says why; default is unchanged',()=>{
 const owned={};for(const p of presets.presets)for(const c of p.cards)owned[c.bs_code]={qty:(owned[c.bs_code]?.qty||0)+c.qty};
 const opts={database:db,evolution:evo,owned,pokemonTypes:['악','번개'],unlimitedBasicEnergy:true};
 const plain=E.buildCandidates(opts),ev=E.buildCandidates({...opts,evaluate:300});
 assert(plain.candidates.every(o=>!o.metrics.goldfish));assert.equal(plain.recommended,0);
 const meds=ev.candidates.map(o=>o.metrics.goldfish.medianFinish);assert.equal(meds[ev.recommended],Math.min(...meds));
 if(ev.recommended!==0)assert(ev.candidates[ev.recommended].result.summary.reasons[0].includes('혼자 돌려보기'));
});
test('trainer energy acceleration is not reported as a Pokemon ability',()=>{
 const c=preset('pikachu_special'),g=E.goldfish(c,db,evo,{trials:300,seed:2});
 assert(g.abilitiesModelled.every(x=>!x.includes('일렉트릭 제너레이터')));
});
