'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('../deck-engine');
const mon={bs_code:'p',name_kr:'시험몬',card_class:'pokemon',card_type:'기본 포켓몬',skills:[{name:'공격',cost:['불꽃'],damage:'110'}]};
const fire={bs_code:'e',name_kr:'기본 불꽃 에너지',card_class:'energy'};
const tr=(id,name,text)=>({bs_code:id,name_kr:name,card_class:'trainer',trainer_subtype:'supporter',effect_text:text});
test('normalized research names, spaces and full-width parentheses share four-copy limit',()=>{
 const a=tr('a','박사의 연구 (오박사)',''),b=tr('b','박사의 연구（투로박사）','');
 const d={p:mon,e:fire,a,b};assert(E.inspect({p:4,e:51,a:3,b:2},d).errors.some(e=>e.includes('같은 이름')));
 assert(E.inspect({p:4,e:52,a:2,b:2},d).ok);
});
test('special cards: Radiant global, ACE global, Prism per name; basic energy exempt',()=>{
 const a={...mon,bs_code:'a',name_kr:'찬란한 A'},b={...mon,bs_code:'b',name_kr:'찬란한 B'};
 assert(E.inspect({a:1,b:1,e:58},{a,b,e:fire}).errors.some(e=>e.includes('빛나는')));
 const x={...fire,bs_code:'x',name_kr:'에너지 X',effect_text:'ACE SPEC 카드는 덱에 1장만 넣을 수 있다.'};
 assert(E.inspect({p:4,x:2,e:54},{p:mon,x,e:fire}).errors.some(e=>e.includes('ACE')));
 const u={...mon,bs_code:'u',name_kr:'A(프리즘스타)'},v={...u,bs_code:'v',name_kr:'B(프리즘스타)'};
 assert(E.inspect({u:1,v:1,e:58},{u,v,e:fire}).ok);assert(!E.inspect({u:2,e:58},{u,e:fire}).ok);
});
test('first-turn supporter ban has explicit printed exceptions',()=>{
 assert(!E.supportAllowed(tr('a','네모','자신의 덱을 3장 뽑는다.'),1));
 assert(E.supportAllowed(tr('a','네모',''),2));
 assert(E.supportAllowed(tr('a','예외','이 카드는 선공 플레이어의 첫 차례라도 사용할 수 있다.'),1));
});
test('search execution is narrower than role classification',()=>{
 assert(E.searchRule(tr('a','네스트볼','')).basic);assert(E.searchRule(tr('a','네스트볼','')).bench);
 assert.equal(E.searchRule(tr('a','하이퍼볼','')).cost,2);
 assert.equal(E.searchRule(tr('a','빛나','자신의 덱에서 포켓몬을 패로 가져온다.')),null);
});
test('goldfish trace never plays normal supporter on turn one and reports unsupported cards',()=>{
 const data=[fire,...[0,1,2,3].map(i=>({...mon,bs_code:'p'+i,name_kr:'시험몬'+i})),tr('n','네모','자신의 덱을 3장 뽑는다.'),tr('x','빛나','자신의 덱에서 포켓몬을 3장 패로 가져온다.')];
 const cards={e:36,n:4,x:4,p0:4,p1:4,p2:4,p3:4},trace=[];
 const r=E.goldfish(cards,data,[],{trials:20,seed:3,trace});assert(r.available);assert(!trace.some(s=>s.startsWith('T1 서포트:')));assert(r.trainersIgnored.includes('빛나'));
});
test('app uses shared validator and retains save fields',()=>{
 const s=require('fs').readFileSync(require.resolve('../app.js'),'utf8');
 const v=s.slice(s.indexOf('function validateDeck('),s.indexOf('function validateDeck(')+5000);
 assert(v.includes('DeckEngine.inspect(cards,dbByCode'));assert(!v.includes('var aceTotal='));
});
