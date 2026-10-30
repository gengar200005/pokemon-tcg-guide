'use strict';
const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const V=require('../scripts/validate-data'),M=require('../scripts/merge-cards');
const DATA=path.join(__dirname,'..','data');

/* Baseline before the 2026-10-30 maintenance pass; a merge may only grow these. */
const BASELINE={cards:15990,evolution:11359,trainerCategories:3910,catalogDecks:79,presets:11};

test('shipped data has no blocking integrity errors',()=>{const r=V.validate(DATA);assert.deepEqual(r.errors,[]);assert(r.ok);});
test('record counts never shrink below the baseline',()=>{const c=V.validate(DATA).counts;for(const k in BASELINE)assert(c[k]>=BASELINE[k],k+' '+c[k]);});
test('merge serializer reproduces the shipped files byte for byte',()=>{for(const k in M.FILES){const [f,indent]=M.FILES[k],raw=fs.readFileSync(path.join(DATA,f),'utf8');assert.equal(M.serialize(JSON.parse(raw),indent),raw,f);}});
test('every preset card and catalog entry resolves',()=>{
 const db=new Set(require('../data/korean_cards_db.json').map(c=>c.bs_code)),p=require('../data/starter_deck_presets.json');
 for(const x of p.presets){assert.equal(x.cards.reduce((a,c)=>a+c.qty,0),60,x.id);for(const c of x.cards)assert(db.has(c.bs_code),x.id+' '+c.bs_code);}
});
test('existing owned/saved deck card IDs stay resolvable (test_autobuild fixture)',()=>{
 const db=new Set(require('../data/korean_cards_db.json').map(c=>c.bs_code));
 const ids=[...fs.readFileSync(path.join(__dirname,'..','test_autobuild.js'),'utf8').matchAll(/D\.collected\['([A-Z0-9m]+)'\]/g)].map(m=>m[1]);
 assert(ids.length>10);for(const id of ids)assert(db.has(id),id);
});

function scratch(){const d=fs.mkdtempSync(path.join(os.tmpdir(),'tcg-test-'));for(const f of fs.readdirSync(DATA))fs.copyFileSync(path.join(DATA,f),path.join(d,f));return d;}
const pokemon={bs_code:'BS2099001001',name_kr:'테스트몬',card_type:'기본 포켓몬',card_class:'pokemon',hp:70,pokemon_type:'풀',skills:[{name:'몸통박치기',damage:'20',cost:['무색']}]};
const evo={bs_code:'BS2099001001',name_kr:'테스트몬',base_kr:'테스트몬',card_type:'기본 포켓몬',stage:'basic',evolvesFrom_kr:null,source:'agreed-basic'};
const item={bs_code:'BS2099001002',name_kr:'테스트볼',card_type:'아이템',card_class:'trainer',trainer_subtype:'item',effect_text:'x'};
const cat={bs_code:'BS2099001002',name_kr:'테스트볼',card_class:'trainer',subtype:'item',tags:['pokemon_search']};
const upd=(o={})=>({source:'https://pokemoncard.co.kr/cards',verified_at:'2026-10-30',cards:[pokemon,item],evolution:[evo],trainer_categories:[cat],...o});

test('merge appends only new records and leaves existing ones untouched',()=>{
 const d=scratch(),before=fs.readFileSync(path.join(d,'korean_cards_db.json'),'utf8');
 const r=M.merge(d,upd(),true);assert(r.ok,JSON.stringify(r.problems));assert.equal(r.after.cards,r.before.cards+2);
 const after=fs.readFileSync(path.join(d,'korean_cards_db.json'),'utf8');assert(after.startsWith(before.slice(0,-1)));
 assert(M.merge(d,upd(),false).ok);assert.deepEqual(M.merge(d,upd(),false).skipped.cards,['BS2099001001','BS2099001002']);
 fs.rmSync(d,{recursive:true,force:true});
});
test('merge rejects changes to existing IDs, missing companions, bad costs and missing provenance',()=>{
 const d=scratch(),existing=require('../data/korean_cards_db.json')[0];
 assert(!M.merge(d,upd({cards:[{...existing,name_kr:'변경'}],evolution:[],trainer_categories:[]}),false).ok);
 assert(!M.merge(d,upd({evolution:[]}),false).ok);
 assert(!M.merge(d,upd({trainer_categories:[]}),false).ok);
 assert(!M.merge(d,upd({cards:[{...pokemon,skills:[{name:'x',cost:['불']}]},item]}),false).ok);
 assert(!M.merge(d,upd({source:''}),false).ok);
 assert(!M.merge(d,upd({cards:[{...pokemon,card_type:'1진화 포켓몬'},item],evolution:[{...evo,card_type:'1진화 포켓몬',stage:'stage1',evolvesFrom_kr:'없는몬',source:'agreed'}]}),false).ok);
 assert(M.merge(d,upd({cards:[{...pokemon,card_type:'1진화 포켓몬'},item],evolution:[{...evo,card_type:'1진화 포켓몬',stage:'stage1',evolvesFrom_kr:'이상해씨',source:'agreed'}]}),false).ok);
 assert.equal(fs.readFileSync(path.join(d,'korean_cards_db.json'),'utf8'),fs.readFileSync(path.join(DATA,'korean_cards_db.json'),'utf8'));
 fs.rmSync(d,{recursive:true,force:true});
});
