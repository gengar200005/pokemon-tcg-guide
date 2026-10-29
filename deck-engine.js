/* Conservative owned-card builder. No network, storage, or account access.
   Casual 60-card proposals; not a tournament legality or battle simulator. */
(function(root){
'use strict';
var TYPES=['풀','불꽃','물','번개','초','격투','악','강철','페어리'];
function type(t){return ({불:'불꽃',무:'무색',노말:'무색'})[t]||t;}
function qty(v){var n=typeof v==='number'?v:v&&v.qty;return Number.isInteger(n)&&n>0?n:0;}
function basic(c){return c&&c.card_class==='pokemon'&&/^기본/.test(c.card_type||'');}
function energy(c){if(!c||c.card_class!=='energy')return null;return TYPES.find(function(t){return c.name_kr==='기본 '+t+' 에너지'||c.name_kr===t+' 에너지';})||null;}
function attacks(c){return (c.skills||[]).filter(function(s){return Array.isArray(s.cost)&&s.cost.every(function(t){return TYPES.indexOf(type(t))>=0||type(t)==='무색';});});}
function rng(seed){return function(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
function shuffle(a,r){for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
// Deliberately small reviewed pool: unknown/conditional effects are not guessed from tags.
var ROLES={
 '박사의 연구':'draw','모야모':'draw','네모':'draw','호브':'draw','티에르노':'draw','체렌':'draw',
 '릴리에의 결심':'draw','난천':'draw','마리':'draw','하우':'draw','네스트볼':'search','하이퍼볼':'search','몬스터볼':'search',
 '포켓몬 교체':'switch','포켓몬교체':'switch','보스의 지령':'gust',
 '슈퍼볼':'search','대단한낚싯대':'recovery','대단한 낚싯대':'recovery',
 '에너지 회수':'recovery','에너지회수':'recovery','에너지 전송':'energySearch','에너지전송':'energySearch'
};
function role(c){return c.card_class==='trainer'?ROLES[c.name_kr]||null:null;}
function inspect(cards,db,owned){
 var errors=[],names={},total=0,b=0,ace=0,rad=0,prism={};
 Object.keys(cards).forEach(function(id){var c=db[id],n=cards[id];if(!Number.isInteger(n)||n<=0){errors.push('잘못된 수량: '+id);return;}total+=n;
 if(!c){errors.push('알 수 없는 카드: '+id);return;}if(owned&&n>qty(owned[id]))errors.push('보유 수량 초과: '+c.name_kr);
 if(basic(c))b+=n;if(!energy(c))names[c.name_kr]=(names[c.name_kr]||0)+n;
 if(/ACE SPEC|에이스 스펙/.test((c.effect_text||'')+' '+(c.card_type||'')))ace+=n;
 if(/^(빛나는|찬란한) /.test(c.name_kr))rad+=n;if(/[♢◇]/.test(c.name_kr))prism[c.name_kr]=(prism[c.name_kr]||0)+n;
 });
 if(total!==60)errors.push('60장 필요: 현재 '+total+'장');if(!b)errors.push('기본 포켓몬이 필요합니다');
 Object.keys(names).forEach(function(n){if(names[n]>4)errors.push('같은 이름 4장 초과: '+n);});
 if(ace>1)errors.push('ACE SPEC 1장 초과');if(rad>1)errors.push('빛나는 포켓몬 1장 초과');
 Object.keys(prism).forEach(function(n){if(prism[n]>1)errors.push('프리즘스타 1장 초과: '+n);});
 return {errors:errors,total:total,basics:b,ok:!errors.length};
}
// Compare against an explicitly selected retail deck. Cosmetic reprints may be
// equivalent; identical names with different gameplay text must remain distinct.
function identity(c){
 return JSON.stringify(['name_kr','card_class','card_type','hp','pokemon_type','skills','effect_text','trainer_subtype','retreat','weakness_type','weakness_mult','resist_type','resist_value'].map(function(k){return c[k]===undefined?null:c[k];}));
}
function openingChance(count){var miss=1;for(var i=0;i<7;i++)miss*=Math.max(0,60-count-i)/(60-i);return 1-miss;}
function openingMetrics(cards,db){
 var v=inspect(cards,db);if(!v.ok)return null;
 var counts={basic:0,basicEnergy:0,drawSupporter:0};
 Object.keys(cards).forEach(function(id){var c=db[id],n=cards[id];if(basic(c))counts.basic+=n;if(energy(c))counts.basicEnergy+=n;if(role(c)==='draw')counts.drawSupporter+=n;});
 return {counts:counts,basic:openingChance(counts.basic),basicEnergy:openingChance(counts.basicEnergy),drawSupporter:openingChance(counts.drawSupporter)};
}
function compareReference(options){
 var db={};options.database.forEach(function(c){db[c.bs_code]=c;});
 var baseline={},preset=options.preset,candidate=options.cards||{};
 (preset.cards||[]).forEach(function(c){baseline[c.bs_code]=(baseline[c.bs_code]||0)+c.qty;});
 var baseValidation=inspect(baseline,db),candidateValidation=inspect(candidate,db,options.owned);
 if(!baseValidation.ok)return {available:false,reason:'기준덱 데이터 확인 필요: '+baseValidation.errors.join(' / ')};
 function group(cards){var out={};Object.keys(cards).forEach(function(id){var c=db[id];if(!c)return;var key=identity(c);if(!out[key])out[key]={id:id,name:c.name_kr,qty:0};out[key].qty+=cards[id];});return out;}
 var b=group(baseline),d=group(candidate),stock={};
 Object.keys(options.owned||{}).forEach(function(id){if(db[id]){var key=identity(db[id]);stock[key]=(stock[key]||0)+qty(options.owned[id]);}});
 var additions=[],removals=[],missing=[],overlap=0;
 Object.keys(b).forEach(function(k){var n=d[k]?d[k].qty:0;overlap+=Math.min(b[k].qty,n);
 if(b[k].qty>n)removals.push({id:b[k].id,name:b[k].name,qty:b[k].qty-n});
 if(b[k].qty>(stock[k]||0))missing.push({id:b[k].id,name:b[k].name,qty:b[k].qty-(stock[k]||0)});
 });
 Object.keys(d).forEach(function(k){var n=b[k]?b[k].qty:0;if(d[k].qty>n)additions.push({id:d[k].id,name:d[k].name,qty:d[k].qty-n});});
 var same=!additions.length&&!removals.length&&inspect(candidate,db).ok;
 return {available:true,referenceId:preset.id,referenceName:preset.name_kr,classification:same?'unchanged':candidateValidation.ok?'unverified_changes':'invalid_candidate',
 label:same?'기존 시판덱과 동일':candidateValidation.ok?'시판덱 대비 변경안 · 성능 개선 미검증':'현재 덱 구성 확인 필요',overlap:overlap,additions:additions,removals:removals,
 referenceMissing:missing,referenceOwned:missing.length===0,candidateValidation:candidateValidation,
 baselineMetrics:openingMetrics(baseline,db),candidateMetrics:openingMetrics(candidate,db),
 limits:'최초 7장 포함 확률만 비교합니다. 카드 효과·전개 속도·승률·대회 사용 가능성은 판단하지 않습니다.'};
}

function build(options){
 var db={},ev={},owned=options.owned||{},cards={},notes=[],names={},total=0;
 options.database.forEach(function(c){db[c.bs_code]=c;});(options.evolution||[]).forEach(function(e){ev[e.bs_code]=e;});
 var selected=options.pokemonTypes||[];
 var available=options.database.filter(function(c){return qty(owned[c.bs_code])>0&&(c.card_class!=='pokemon'||!selected.length||selected.indexOf(type(c.pokemon_type))>=0);});
 var start=db[options.basicCode];
 if(!basic(start)||!qty(owned[options.basicCode])||(selected.length&&selected.indexOf(type(start.pokemon_type))<0))return {cards:{},notes:['보유한 기본 포켓몬을 선택해주세요.'],validation:inspect({},db,owned)};
 function add(c,n){var used=cards[c.bs_code]||0,limit=energy(c)?60:4;
 if(/^(빛나는|찬란한) |[♢◇]/.test(c.name_kr)||/ACE SPEC|에이스 스펙/.test(c.effect_text||''))limit=1;
 n=Math.max(0,Math.min(n,qty(owned[c.bs_code])-used,limit-(names[c.name_kr]||0),60-total));
 if(n){cards[c.bs_code]=used+n;names[c.name_kr]=(names[c.name_kr]||0)+n;total+=n;}return n;}
 // Only complete, exact printed-name evolution chains. Never skip missing middle stages.
 function paths(c,seen){var out=[[c]],name=c.name_kr;if(seen.indexOf(name)>=0||seen.length>3)return out;
 available.filter(function(x){
 var child=ev[x.bs_code],parent=ev[c.bs_code];
 var owner=(name.match(/^(.*의 )/)||[])[1]||'',childOwner=(x.name_kr.match(/^(.*의 )/)||[])[1]||'';
 if(!child||owner!==childOwner)return false;
 return child.evolvesFrom_kr===name||!!(owner&&parent&&child.evolvesFrom_kr===parent.base_kr);
 }).forEach(function(child){
 paths(child,seen.concat(name)).forEach(function(p){out.push([c].concat(p));});});return out;}
 var lines=paths(start,[]).filter(function(p){var c=p[p.length-1];return !options.targetPath||c.name_kr===options.targetPath||(ev[c.bs_code]||{}).base_kr===options.targetPath;});
 if(!lines.length){notes.push('선택한 진화 경로의 보유 카드가 연결되지 않아 기본 포켓몬으로 구성했습니다.');lines=[[start]];}
 var plans=[];
 lines.forEach(function(line){var c=line[line.length-1];attacks(c).forEach(function(s){
 var req={};s.cost.forEach(function(t){t=type(t);if(t!=='무색')req[t]=(req[t]||0)+1;});
 var supply={};available.forEach(function(e){var t=energy(e);if(t)supply[t]=(supply[t]||0)+qty(owned[e.bs_code]);});
 if(Object.keys(req).some(function(t){return (supply[t]||0)<req[t];}))return;
 if(!Object.keys(req).length){var ts=Object.keys(supply).sort(function(a,b){return supply[b]-supply[a];});if(s.cost.length&&!ts.length)return;if(ts.length)req[ts[0]]=1;}
 var damage=parseInt(s.damage,10)||0;
 plans.push({line:line,attack:s,req:req,score:damage/Math.max(1,s.cost.length)-line.length*8+Math.min(4,qty(owned[c.bs_code]))*5});
 });});
 plans.sort(function(a,b){return b.score-a.score;});
 if(!plans.length)return {cards:{},notes:notes.concat('보유 기본 에너지'+'로 사용할 기술을 확인할 수 없습니다.'),validation:inspect({},db,owned)};
 var plan=plans[0],attacker=plan.line[plan.line.length-1];
 plan.line.forEach(function(c,i){add(c,i===0?4:3);});
 var pokemonCount=function(){return Object.keys(cards).reduce(function(s,id){return s+(db[id].card_class==='pokemon'?cards[id]:0);},0);};
 var compatible=available.filter(function(c){return basic(c)&&attacks(c).some(function(s){return s.cost.every(function(t){t=type(t);return t==='무색'||plan.req[t];});});});
 compatible.sort(function(a,b){return qty(owned[b.bs_code])-qty(owned[a.bs_code])||a.bs_code.localeCompare(b.bs_code);});
 selected.forEach(function(t){if(!Object.keys(cards).some(function(id){return db[id].card_class==='pokemon'&&type(db[id].pokemon_type)===t;})){var c=compatible.find(function(c){return type(c.pokemon_type)===t;});if(c)add(c,2);}});
 compatible.forEach(function(c){if(pokemonCount()<12)add(c,Math.min(4,12-pokemonCount()));});
 var trainers=available.filter(function(c){return role(c);});
 var quotas={draw:10,search:10,switch:3,gust:2,recovery:3,energySearch:2},roleCounts={};
 Object.keys(quotas).forEach(function(r){roleCounts[r]=0;trainers.filter(function(c){return role(c)===r;}).forEach(function(c){roleCounts[r]+=add(c,Math.min(4,quotas[r]-roleCounts[r]));});});
 // Target 15, cap 18. Never hide missing trainers with 30+ energy cards.
 var ets=Object.keys(plan.req),weights=ets.reduce(function(s,t){return s+plan.req[t];},0),energyAdded=0;
 ets.forEach(function(t){var target=Math.ceil(15*plan.req[t]/weights),added=0;
 available.filter(function(c){return energy(c)===t;}).forEach(function(c){var n=add(c,Math.min(target-added,18-energyAdded));added+=n;energyAdded+=n;});
 if(added<plan.req[t])notes.push(t+' 에너지 부족');});
 trainers.forEach(function(c){if(total<60&&((roleCounts[role(c)]||0)<(role(c)==='draw'?12:role(c)==='search'?12:4)))roleCounts[role(c)]+=add(c,1);});
 compatible.forEach(function(c){if(total<60&&pokemonCount()<16)add(c,Math.min(2,16-pokemonCount()));});
 available.filter(function(c){return ets.indexOf(energy(c))>=0;}).forEach(function(c){if(total<60)energyAdded+=add(c,Math.min(60-total,18-energyAdded));});
 if((roleCounts.draw||0)<6)notes.push('드로우 카드가 적어 패가 막힐 수 있습니다.');
 if((roleCounts.search||0)<6)notes.push('포켓몬 검색 수단이 부족합니다.');
 selected.forEach(function(t){if(!Object.keys(cards).some(function(id){return db[id].card_class==='pokemon'&&type(db[id].pokemon_type)===t;}))notes.push('선택한 '+t+' 타입을 포함하지 못했습니다. 보유 카드·진화 연결·기술 에너지를 확인해주세요.');});
 if(total<60)notes.push('역할에 맞는 보유 카드가 부족하여 '+(60-total)+'칸을 비웠습니다.');
 notes.push('기술의 추가 조건·특성·검색 비용은 자동 해석하지 않습니다. 대회 레귤레이션 검증은 별도입니다.');
 return {cards:cards,notes:notes,attacker:attacker.bs_code,attack:plan.attack.name,energyTypes:ets,roles:roleCounts,validation:inspect(cards,db,owned)};
}
// Search owned basic starting points under an explicit Pokemon-type constraint.
function buildByTypes(options){
 var selected=options.pokemonTypes||[],allowed=TYPES.concat(['드래곤','무색']);
 if(!selected.length||selected.some(function(t){return allowed.indexOf(t)<0;}))return {cards:{},notes:['포켓몬 타입을 하나 이상 선택해주세요.'],validation:{ok:false,total:0,errors:['유효한 타입 선택 필요']}};
 var best=null,bestScore=-Infinity;
 options.database.filter(function(c){return basic(c)&&qty((options.owned||{})[c.bs_code])>0&&selected.indexOf(type(c.pokemon_type))>=0;}).forEach(function(c){
 var r=build(Object.assign({},options,{basicCode:c.bs_code,targetPath:null}));
 var present={};options.database.forEach(function(x){if(r.cards[x.bs_code]&&x.card_class==='pokemon')present[type(x.pokemon_type)]=true;});
 var coverage=selected.filter(function(t){return present[t];}).length;
 var score=coverage*10000+(r.validation.ok?1000:0)+r.validation.total;
 if(score>bestScore){best=r;bestScore=score;}
 });
 return best||{cards:{},notes:['선택한 타입의 보유 기본 포켓몬이 없습니다.'],validation:{ok:false,total:0,errors:['보유 기본 포켓몬 부족']}};
}
// Opening-hand Monte Carlo only: no search/draw effects or opponent. Not win rate.
function simulate(cards,database,options){
 options=options||{};var db={};database.forEach(function(c){db[c.bs_code]=c;});var valid=inspect(cards,db);
 if(!valid.ok)return {available:false,reason:valid.errors.join(' / ')};
 var n=options.trials||10000;if(!Number.isInteger(n)||n<1||n>100000)throw Error('trials must be 1..100000');
 var r=rng(options.seed===undefined?20261029:options.seed),base=[],hit=0,energyHit=0,drawHit=0,prized=0;
 Object.keys(cards).forEach(function(id){for(var k=0;k<cards[id];k++)base.push(id);});
 for(var i=0;i<n;i++){var deck=shuffle(base.slice(),r),hand=deck.slice(0,7);
 if(hand.some(function(id){return basic(db[id]);}))hit++;
 if(hand.some(function(id){return energy(db[id]);}))energyHit++;
 if(hand.some(function(id){return role(db[id])==='draw';}))drawHit++;
 if(options.attacker&&deck.slice(7,13).includes(options.attacker))prized++;
 }
 return {available:true,trials:n,seed:options.seed===undefined?20261029:options.seed,openingBasic:hit/n,openingBasicEnergy:energyHit/n,openingDrawSupporter:drawHit/n,attackerInPrizes:options.attacker?prized/n:null,scope:'멀리건 전 최초 7장과 뒤 6장 배치만 측정. 카드 효과·승률·실전 공격률 제외.'};
}
var api={build:build,buildByTypes:buildByTypes,inspect:inspect,simulate:simulate,basic:basic,basicEnergy:energy,role:role,compareReference:compareReference,openingMetrics:openingMetrics};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DeckEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
