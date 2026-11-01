'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),E=require('../deck-engine');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
const functions=source.slice(source.indexOf('function addToDeck('),source.indexOf('/* ─── 덱 비우기',source.indexOf('function addToDeck(')));
const card=(id,name,cls='trainer',extra={})=>({bs_code:id,name_kr:name,card_class:cls,...extra});
const data=[card('a','박사의 연구(올림박사)'),card('b','박사의 연구(투로박사)'),card('r','찬란한 리자몽','pokemon'),card('g','찬란한 개굴닌자','pokemon'),card('x','프라임 캐처','trainer',{effect_text:'ACE SPEC'}),card('y','시크릿박스','trainer',{effect_text:'ACE SPEC'}),card('z','시험(프리즘스타)'),card('zz','시험(프리즘스타)'),card('e','기본 불꽃 에너지','energy'),card('p','파이리','pokemon',{card_type:'기본 포켓몬'}),card('s','리자몽','pokemon',{card_type:'2진화 포켓몬'})];
function setup(cards={},extra={}){
 const messages=[],ctx={DeckEngine:E,dbByCode:Object.fromEntries(data.map(c=>[c.bs_code,c])),_deckBuilder:{format:'full',cards:{...cards},...extra},isBasicEnergy:E.basicEnergy,cardStage:c=>c.card_type==='2진화 포켓몬'?'stage2':'basic',toast:m=>messages.push(m),refreshDeckBuilder(){},renderDeckSheet(){},$:()=>({className:''}),deckCounts:d=>({total:Object.values(d.cards).reduce((a,b)=>a+b,0)})};
 vm.createContext(ctx);vm.runInContext(functions,ctx);return {ctx,messages};
}
for(const [name,cards,id] of [['research',{a:3,b:1},'b'],['radiant',{r:1},'g'],['ACE',{x:1},'y'],['prism alternate print',{z:1},'zz']])test('manual edit blocks '+name+' without mutating cards',()=>{
 const {ctx,messages}=setup(cards),before=JSON.stringify(ctx._deckBuilder.cards);ctx.addToDeck(id);assert.equal(JSON.stringify(ctx._deckBuilder.cards),before);assert(messages.length>0);
});
test('basic energy over four and incomplete draft remain editable',()=>{const {ctx}=setup({e:4});ctx.addToDeck('e');assert.equal(ctx._deckBuilder.cards.e,5);ctx.addToDeck('p');assert.equal(ctx._deckBuilder.cards.p,1);ctx.removeFromDeck('p');assert(!('p' in ctx._deckBuilder.cards));});
test('ordinary edit enforces same-name four-copy cap',()=>{const {ctx}=setup({p:3});ctx.addToDeck('p');assert.equal(ctx._deckBuilder.cards.p,4);ctx.addToDeck('p');assert.equal(ctx._deckBuilder.cards.p,4);});
test('half strict and free copy policies and thirty-card cap remain intact',()=>{for(const strict of [true,false]){const {ctx}=setup({p:2},{format:'half',strict});ctx.addToDeck('p');assert.equal(ctx._deckBuilder.cards.p,strict?2:3);ctx.addToDeck('s');assert.equal(ctx._deckBuilder.cards.s,strict?undefined:1);const full=setup({e:30},{format:'half',strict}).ctx;full.addToDeck('p');assert.equal(full._deckBuilder.cards.e,30);assert(!full._deckBuilder.cards.p);}});
test('final validation agrees with edit rules and still rejects incomplete drafts',()=>{
 const {ctx}=setup({a:3,b:2});
 for(const name of ['normalizeDeckCards','validateDeck']){const a=source.indexOf('function '+name+'('),b=source.indexOf('\nfunction ',a+1);vm.runInContext(source.slice(a,b),ctx);}
 assert(!ctx.validateDeck(ctx._deckBuilder).ok);assert(ctx.validateDeck(ctx._deckBuilder).errors.some(e=>e.msg.includes('같은 이름')));
 ctx._deckBuilder.cards={e:5};assert(!ctx.validateDeck(ctx._deckBuilder).ok);ctx.addToDeck('p');assert.equal(ctx._deckBuilder.cards.p,1);
});
test('real save/reopen functions round-trip an incomplete edited deck without changing collection',()=>{
 const {ctx}=setup({e:5,p:1});let saved;
 ctx._deckBuilder.id='draft';ctx._deckBuilder.createdAt=1;ctx.D={collected:{p:{qty:4}}};const before=JSON.stringify(ctx.D.collected);
 ctx.$=id=>id==='dbmName'?{value:'임시 덱'}:{dataset:{},className:''};ctx.openDeckBuilder=()=>{};ctx.sv=()=>{saved=JSON.parse(JSON.stringify(ctx.D));};
 for(const name of ['normalizeDeckCards','saveCurrentDeck','editDeck']){const a=source.indexOf('function '+name+'('),b=source.indexOf('\nfunction ',a+1);vm.runInContext(source.slice(a,b),ctx);}
 ctx.addToDeck('p');ctx.removeFromDeck('e');const expected=JSON.stringify(ctx._deckBuilder.cards);ctx.saveCurrentDeck();
 assert(Array.isArray(saved.customDecksV1[0].cards));ctx.D=saved;ctx._deckBuilder=null;ctx.editDeck('draft');assert.equal(JSON.stringify(ctx._deckBuilder.cards),expected);assert.equal(JSON.stringify(ctx.D.collected),before);
});
