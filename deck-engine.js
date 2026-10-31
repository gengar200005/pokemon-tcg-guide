/* Conservative owned-card builder. No network, storage, or account access.
   Casual 60-card proposals; not a tournament legality or battle simulator. */
(function(root){
'use strict';
var TYPES=['풀','불꽃','물','번개','초','격투','악','강철','페어리'];
function type(t){return ({불:'불꽃',무:'무색',노말:'무색'})[t]||t;}
function qty(v){var n=typeof v==='number'?v:v&&v.qty;return Number.isInteger(n)&&n>0?n:0;}
function basic(c){return c&&c.card_class==='pokemon'&&/^기본/.test(c.card_type||'');}
function stage(c){var t=(c&&c.card_type)||'';return /^기본/.test(t)?0:/^1진화/.test(t)?1:/^2진화/.test(t)?2:9;}
// Some DB names carry padding runs ("기본 악   에너지"); compare words only.
function energy(c){if(!c||c.card_class!=='energy')return null;var n=(c.name_kr||'').replace(/\s+/g,' ').trim();return TYPES.find(function(t){return n==='기본 '+t+' 에너지'||n===t+' 에너지';})||null;}
function attacks(c){return (c.skills||[]).filter(function(s){return Array.isArray(s.cost)&&s.cost.every(function(t){return TYPES.indexOf(type(t))>=0||type(t)==='무색';});});}
// Abilities and rule boxes have no cost; rule boxes are not effects to interpret.
function abilities(c){return (c.skills||[]).filter(function(s){return !('cost' in s)&&s.text&&!/룰\]?$/.test(s.name||'');});}
// Same card name for the copy limit: art variants such as 「박사의 연구(올림박사)」 count as 「박사의 연구」.
function nameKey(c){return c.card_class==='pokemon'?c.name_kr:c.name_kr.replace(/^(박사의 연구|보스의 지령)\(.+\)$/,'$1');}
function prism(c){return /[♢◇]|\(프리즘스타\)/.test(c.name_kr);}
function limited(c){return /^(빛나는|찬란한) /.test(c.name_kr)||prism(c)||/ACE SPEC|에이스 스펙/.test((c.effect_text||'')+' '+(c.card_type||''));}
function rng(seed){return function(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
function shuffle(a,r){for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
// "×" damage depends on game state and counts as 0, except one reviewed wording: discard
// energy for N damage each. Then assume the minimum, i.e. discarding the attack's own cost.
function energyDiscardDamage(s){var t=s.text||'',per=parseInt(s.damage,10)||0,m;
 if(!per||!Array.isArray(s.cost))return 0;
 if((m=t.match(/에너지를\s*(\d+)장까지\s*트래쉬하고 그 장수\s*×/)))return per*Math.min(parseInt(m[1],10),s.cost.length);
 if(/에너지를 원하는 만큼\s*트래쉬하고 그 장수\s*×/.test(t))return per*s.cost.length;
 return 0;}
function baseDamage(s){return /[×x]/.test(s.damage||'')?energyDiscardDamage(s):(parseInt(s.damage,10)||0);}
// Attack text the engine does not model. Damage stays the printed base value.
function attackFlags(s){var t=s.text||'',f=[];
 if(/\+$/.test(s.damage||''))f.push('추가 데미지 조건');
 if(/[×x]/.test(s.damage||''))f.push('버리는 에너지 수만큼 데미지(기술 비용만큼 버린다고 가정)');
 if(/동전/.test(t))f.push('동전 결과에 따라 달라짐');
 if(/다음 차례에 이 포켓몬은 기술을 사용할 수 없다|다음 차례에 이 포켓몬은[^.]*?기술을 사용할 수 없다/.test(t))f.push('연속 사용 불가');
 if(/이 포켓몬에게 붙어 있는 에너지를[^.]*?트래쉬/.test(t))f.push('사용 후 에너지 트래쉬');
 if(/때만 사용할 수 있다|않으면[^.]*?사용할 수 없다|경우에만/.test(t))f.push('사용 조건 있음');
 return f;}

// Reviewed names kept from the first version; also covers synthetic cards without effect text.
var ROLES={
 '박사의 연구':'draw','모야모':'draw','네모':'draw','호브':'draw','티에르노':'draw','체렌':'draw',
 '릴리에의 결심':'draw','난천':'draw','마리':'draw','하우':'draw','네스트볼':'search','하이퍼볼':'search','몬스터볼':'search',
 '포켓몬 교체':'switch','포켓몬교체':'switch','보스의 지령':'gust',
 '슈퍼볼':'search','대단한낚싯대':'recovery','대단한 낚싯대':'recovery',
 '밤의 들것':'recovery','에너지 회수':'recovery','에너지회수':'recovery','에너지 전송':'energySearch','에너지전송':'energySearch'
};
var ROLE_ORDER=['candy','draw','search','energySearch','switch','gust','recovery','accel','heal'];
var ROLE_LABEL={candy:'진화 지원',draw:'카드 드로우',search:'포켓몬 검색',energySearch:'에너지 확보',switch:'포켓몬 교체',gust:'상대 포켓몬 지정',recovery:'자원 회수',accel:'에너지 가속',heal:'회복'};
var RULE_LINE=/^(아이템은|서포트는|서포터는|스타디움은|포켓몬의 도구는|ACE SPEC 카드는).*$/gm;
// Terms in 「」 that describe card categories rather than a specific family.
var GENERIC_TERM=/^\s*(기본 포켓몬|1진화 포켓몬|2진화 포켓몬|진화 포켓몬|룰을 가진 포켓몬|포켓몬 ex|포켓몬 V|포켓몬|기본 .*에너지|[+-]?\d+)\s*$/;
// Effect text is matched sentence by sentence; anything not matched is left uninterpreted.
var ROLE_RULES=[
 ['candy',/1진화\s*를 건너뛰어 진화/],
 ['draw',/(덱|덱에서 카드)을\s*\d+장\s*뽑는다|패가\s*\d+장이 되도록[^.]*?뽑는다|만큼 (자신의 )?덱을 뽑는다/],
 ['search',/(덱에서|덱에 있는)[^.]*?포켓몬[^.]*?(패로 가져|벤치로 내보|벤치에 내보)/],
 ['energySearch',/(덱에서|덱에 있는)[^.]*?에너지[^.]*?패로 가져/],
 ['switch',/자신의 배틀 포켓몬을 벤치 포켓몬과 교체/],
 ['gust',/상대의 벤치 포켓몬[^.]*?배틀 포켓몬과 교체/],
 ['recovery',/트래쉬(에서|에 있는)[^.]*?(포켓몬|에너지)[^.]*?(패로 가져|덱으로 되돌)/],
 ['accel',/(덱|트래쉬)[^.]*?에너지[^.]*?붙인다/],
 ['heal',/HP를[^.]*?회복/]
];
var infoCache={};
function trainerInfo(c){
 if(!c||(c.card_class!=='trainer'&&c.card_class!=='stadium'))return null;
 var key=c.bs_code+'|'+c.name_kr;if(infoCache[key])return infoCache[key];
 var text=(c.effect_text||'').replace(RULE_LINE,''),roles=[];
 if(ROLES[c.name_kr])roles.push(ROLES[c.name_kr]);
 else if(c.card_class==='trainer'&&!/포켓몬의 도구/.test(c.card_type||''))ROLE_RULES.forEach(function(r){if(r[1].test(text))roles.push(r[0]);});
 roles.sort(function(a,b){return ROLE_ORDER.indexOf(a)-ROLE_ORDER.indexOf(b);});
 var draw=(text.match(/(\d+)장\s*뽑는다|(\d+)장이 되도록/)||[]),hp=text.match(/HP가\s*「(\d+)」\s*이하/);
 var info={roles:roles,role:roles[0]||null,
  conditional:/때만 사용할 수 있다|기절\s*하지 않으면 사용할 수 없다|동전/.test(text),
  types:(text.match(/\((풀|불꽃|물|번개|초|격투|악|강철|페어리)\)/g)||[]).map(function(x){return x.slice(1,-1);}),
  keywords:(text.match(/「[^」]+」/g)||[]).map(function(x){return x.slice(1,-1).trim();}).filter(function(x){return !GENERIC_TERM.test(x)&&!/\((풀|불꽃|물|번개|초|격투|악|강철|페어리)\)/.test(x);}),
  maxHp:hp?parseInt(hp[1],10):null,evolvedOnly:/진화 포켓몬을/.test(text),
  drawCount:parseInt(draw[1]||draw[2],10)||0,supporter:c.trainer_subtype==='supporter',ace:limited(c)};
 infoCache[key]=info;return info;
}
function role(c){var i=c&&c.card_class==='trainer'?trainerInfo(c):null;return i?i.role:null;}
// A trainer is used only when the cards it names or the types it requires are in the deck.
function applicable(info,deck){
 if(!info.role)return false;
 if(info.types.some(function(t){return deck.types.indexOf(t)<0;}))return false;
 if(info.keywords.some(function(k){var owner=k.match(/^(.+의) 포켓몬$/);
  return !deck.pokemon.some(function(c){return owner?c.name_kr.indexOf(owner[1]+' ')===0:(c.name_kr.indexOf(k)>=0||(c.card_type||'').indexOf(k)>=0);});}))return false;
 if(info.role==='candy'&&!deck.stage2)return false;
 if(info.evolvedOnly&&!deck.evolved)return false;
 if(info.maxHp&&deck.pokemon.filter(function(c){return basic(c)&&c.hp<=info.maxHp;}).length<2)return false;
 return true;
}

function inspect(cards,db,owned){
 var errors=[],names={},total=0,b=0,ace=0,rad=0,prisms={};
 Object.keys(cards).forEach(function(id){var c=db[id],n=cards[id];if(!Number.isInteger(n)||n<=0){errors.push('잘못된 수량: '+id);return;}total+=n;
 if(!c){errors.push('알 수 없는 카드: '+id);return;}if(owned&&n>qty(owned[id]))errors.push('보유 수량 초과: '+c.name_kr);
 if(basic(c))b+=n;if(!energy(c))names[nameKey(c)]=(names[nameKey(c)]||0)+n;
 if(/ACE SPEC|에이스 스펙/.test((c.effect_text||'')+' '+(c.card_type||'')))ace+=n;
 if(/^(빛나는|찬란한) /.test(c.name_kr))rad+=n;if(prism(c))prisms[c.name_kr]=(prisms[c.name_kr]||0)+n;
 });
 if(total!==60)errors.push('60장 필요: 현재 '+total+'장');if(!b)errors.push('기본 포켓몬이 필요합니다');
 Object.keys(names).forEach(function(n){if(names[n]>4)errors.push('같은 이름 4장 초과: '+n);});
 if(ace>1)errors.push('ACE SPEC 1장 초과');if(rad>1)errors.push('빛나는 포켓몬 1장 초과');
 Object.keys(prisms).forEach(function(n){if(prisms[n]>1)errors.push('프리즘스타 1장 초과: '+n);});
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

// A separate supply view: never add cards to the user's collection.
function supply(database,owned,unlimited){
 var out=Object.assign({},owned||{});if(!unlimited)return out;
 var seen={};database.forEach(function(c){var t=energy(c);if(t&&!seen[t]){out[c.bs_code]={qty:60};seen[t]=true;}});return out;
}
function supportValue(c){return (c.skills||[]).reduce(function(n,s){
 if(s.name==='먹어두기')return n+35;
 if(s.name==='키우기고수')return n+28;
 return n;
},0);}

var STRATEGIES={
 balanced:{label:'균형형',desc:'초반 안정성과 꾸준한 공격을 함께 봅니다.'},
 fast:{label:'빠른 공격형',desc:'적은 준비로 일찍 공격을 시작합니다.'},
 power:{label:'고화력형',desc:'진화와 에너지를 준비한 뒤 강한 공격을 사용합니다.'}
};
// Shared per-request view of the collection; reused across starting points.
function context(options){
 var ctx={db:{},ev:{},owned:supply(options.database,options.owned,options.unlimitedBasicEnergy),realOwned:options.owned||{},selected:options.pokemonTypes||[],options:options};
 options.database.forEach(function(c){ctx.db[c.bs_code]=c;});(options.evolution||[]).forEach(function(e){ctx.ev[e.bs_code]=e;});
 var sel=ctx.selected;
 ctx.available=options.database.filter(function(c){return qty(ctx.owned[c.bs_code])>0&&(c.card_class!=='pokemon'||!sel.length||sel.indexOf(type(c.pokemon_type))>=0);});
 ctx.children={};ctx.byName={};ctx.energySupply={};
 ctx.available.forEach(function(c){
  if(c.card_class==='pokemon'){var e=ctx.ev[c.bs_code];if(e&&e.evolvesFrom_kr)(ctx.children[e.evolvesFrom_kr]=ctx.children[e.evolvesFrom_kr]||[]).push(c);(ctx.byName[c.name_kr]=ctx.byName[c.name_kr]||[]).push(c);}
  var t=energy(c);if(t)ctx.energySupply[t]=(ctx.energySupply[t]||0)+qty(ctx.owned[c.bs_code]);});
 return ctx;
}
// Only complete, exact printed-name evolution chains. Never skip missing middle stages.
function paths(ctx,c,seen){var out=[[c]],name=c.name_kr;if(seen.indexOf(name)>=0||seen.length>3)return out;
 var owner=(name.match(/^(.*의 )/)||[])[1]||'',parent=ctx.ev[c.bs_code],pool=(ctx.children[name]||[]).concat(owner&&parent?ctx.children[parent.base_kr]||[]:[]),ids={};
 pool.filter(function(x){if(ids[identity(x)])return false;ids[identity(x)]=1;
  var childOwner=(x.name_kr.match(/^(.*의 )/)||[])[1]||'';return owner===childOwner&&(stage(x)===stage(c)+1||stage(x)===9);})
 .forEach(function(child){paths(ctx,child,seen.concat(name)).forEach(function(p){out.push([c].concat(p));});});return out;}
function nameCopies(ctx,name){return (ctx.byName[name]||[]).reduce(function(n,c){return n+qty(ctx.owned[c.bs_code]);},0);}
function identityCopies(ctx,c){return (ctx.byName[c.name_kr]||[]).filter(function(x){return identity(x)===identity(c);}).reduce(function(n,x){return n+qty(ctx.owned[x.bs_code]);},0);}
// One attack of the line's final card, scored for a strategy. Returns null when the
// printed cost cannot be paid with owned/assumed basic energy or base damage is not fixed.
function makePlan(ctx,line,s,strategyName){
 var c=line[line.length-1],req={};s.cost.forEach(function(t){t=type(t);if(t!=='무색')req[t]=(req[t]||0)+1;});
 if(Object.keys(req).some(function(t){return (ctx.energySupply[t]||0)<req[t];}))return null;
 if(!Object.keys(req).length&&s.cost.length&&!Object.keys(ctx.energySupply).length)return null;
 var damage=baseDamage(s);if(!damage)return null;
 var candy=line.length===3&&ctx.available.some(function(x){return x.name_kr==='이상한사탕';});
 // Expected first attack turn: Rare Candy needs both cards in hand, so it is not a sure turn 2.
 var setup=Math.max(candy?2.5:line.length,s.cost.length||1);
 var copies=limited(c)?1:Math.min(4,identityCopies(ctx,c)),chain=line.slice(0,-1).reduce(function(m,x){return Math.min(m,nameCopies(ctx,x.name_kr));},4);
 var reliability=Math.min(copies,4)/4*0.7+Math.min(chain,4)/4*0.3,flags=attackFlags(s),penalty=(flags.indexOf('연속 사용 불가')>=0?0.35:0)+(flags.indexOf('동전 결과에 따라 달라짐')>=0?0.25:0)+(flags.indexOf('사용 조건 있음')>=0?0.25:0);
 var d=Math.min(damage,330)*(1-penalty),score;
 if(strategyName==='fast')score=Math.min(d,180)*[1,0.75,0.5][line.length-1]+reliability*90-setup*20;
 else if(strategyName==='power')score=d*1.2-setup*6+reliability*70;
 else score=d*0.5+d/setup-setup*8+reliability*110;
 score+=Math.min(4,copies)*2-(copies<2?150:0)+supportValue(c);
 return {line:line,attack:s,req:req,score:score,setup:setup,copies:copies,chain:chain,flags:flags,candy:candy};
}
function linePlans(ctx,start,targetPath,strategyName){
 var lines=paths(ctx,start,[]).filter(function(p){var c=p[p.length-1];return !targetPath||c.name_kr===targetPath||(ctx.ev[c.bs_code]||{}).base_kr===targetPath;});
 var plans=[];lines.forEach(function(line){attacks(line[line.length-1]).forEach(function(s){var p=makePlan(ctx,line,s,strategyName);if(p)plans.push(p);});});
 // A fast deck still needs an attack that matters; tiny chip attacks are a last resort.
 if(strategyName==='fast'&&plans.some(function(p){return baseDamage(p.attack)>=50;}))plans=plans.filter(function(p){return baseDamage(p.attack)>=50;});
 plans.sort(function(a,b){return b.score-a.score;});return {lines:lines,plans:plans};
}
// Colorless costs can be paid by any basic energy; choose one the deck already uses.
function colorlessEnergy(ctx,line){
 var have=function(t){return TYPES.indexOf(t)>=0&&(ctx.energySupply[t]||0)>0;};
 var t=type(line[line.length-1].pokemon_type);if(have(t))return {type:t,why:'주력 포켓몬의 타입'};
 var s=ctx.selected.find(have);if(s)return {type:s,why:'선택한 타입'};
 var l=line.map(function(c){return type(c.pokemon_type);}).find(have);if(l)return {type:l,why:'진화 라인의 타입'};
 var real={};ctx.available.forEach(function(e){var x=energy(e);if(x)real[x]=(real[x]||0)+qty(ctx.realOwned[e.bs_code]);});
 var best=TYPES.filter(have).sort(function(a,b){return (real[b]||0)-(real[a]||0);})[0];
 return best?{type:best,why:'실제로 가장 많이 보유한 기본 에너지'}:null;
}

function buildFrom(ctx,basicCode,targetPath,strategyName){
 var db=ctx.db,owned=ctx.owned,available=ctx.available,selected=ctx.selected,options=ctx.options,cards={},notes=[],names={},total=0;
 strategyName=STRATEGIES[strategyName]?strategyName:'balanced';
 var start=db[basicCode];
 if(!basic(start)||!qty(owned[basicCode])||(selected.length&&selected.indexOf(type(start.pokemon_type))<0))return {cards:{},notes:['보유한 기본 포켓몬을 선택해주세요.'],validation:inspect({},db,owned)};
 function add(c,n){var used=cards[c.bs_code]||0,limit=energy(c)?60:limited(c)?1:4;
 var k=nameKey(c);n=Math.max(0,Math.min(n,qty(owned[c.bs_code])-used,limit-(names[k]||0),60-total));
 if(n){cards[c.bs_code]=used+n;names[k]=(names[k]||0)+n;total+=n;}return n;}
 // Fill a stage up to target: the exact print first, then functionally identical prints,
 // then (pre-evolutions only) any owned print with the same name.
 function addStage(c,target,anyPrint){var pool=(ctx.byName[c.name_kr]||[]).slice().sort(function(a,b){return (identity(b)===identity(c))-(identity(a)===identity(c))||a.bs_code.localeCompare(b.bs_code);});
  add(c,target);pool.forEach(function(x){if((names[c.name_kr]||0)<target&&(anyPrint||identity(x)===identity(c)))add(x,target-(names[c.name_kr]||0));});return names[c.name_kr]||0;}
 var found=linePlans(ctx,start,targetPath,strategyName);
 if(!found.lines.length){
  notes.push('선택한 진화 경로의 보유 카드가 연결되지 않아 기본 포켓몬으로 구성했습니다.');
  found=linePlans(ctx,start,null,strategyName);found.plans=found.plans.filter(function(p){return p.line.length===1;});
 }
 var plans=found.plans;
 if(!plans.length){
  // The chosen Pokemon cannot carry the deck: explain and point to owned alternatives.
  var alt=[];available.filter(function(c){return basic(c)&&c.bs_code!==basicCode&&type(c.pokemon_type)===type(start.pokemon_type);}).forEach(function(c){var p=linePlans(ctx,c,null,strategyName).plans[0];if(p&&alt.every(function(a){return a.name!==p.line[p.line.length-1].name_kr;}))alt.push({basicCode:c.bs_code,name:p.line[p.line.length-1].name_kr,attack:p.attack.name,score:p.score});});
  alt.sort(function(a,b){return b.score-a.score;});
  var why=attacks(start).length?'보유 기본 에너지로 사용할 수 있는 고정 데미지 기술이 없습니다':'공격 기술 정보를 해석할 수 없습니다';
  return {cards:{},notes:notes.concat(start.name_kr+': '+why+'. (보유 기본 에너지로 사용할 기술을 확인할 수 없습니다.)').concat(alt.length?['대신 '+alt.slice(0,3).map(function(a){return a.name+'('+a.attack+')';}).join(', ')+'을(를) 주력으로 시도해 보세요.']:[]),alternatives:alt.slice(0,3),validation:inspect({},db,owned)};
 }
 var plan=plans[0],attacker=plan.line[plan.line.length-1],reasons=[],weaknesses=[],unsupported=[];
 // Energy plan: printed typed costs first, then colorless costs in a type the deck uses.
 var req=Object.assign({},plan.req),colorless=plan.attack.cost.filter(function(t){return type(t)==='무색';}).length;
 if(!Object.keys(req).length){var ce=colorlessEnergy(ctx,plan.line);if(ce){req[ce.type]=1;if(colorless)notes.push('무색 비용은 어떤 기본 에너지로도 낼 수 있어 '+ce.why+'인 '+ce.type+' 에너지를 사용합니다.');}}
 // Only reviewed effect metadata is used; no arbitrary text-to-rules inference.
 if((attacker.skills||[]).some(function(s){return s.name==='엑스 부트';})&&available.some(function(c){return energy(c)==='초';})){if(!selected.length||selected.indexOf('초')>=0){req['초']=req['초']||1;notes.push('엑스 부트: 강철·초 에너지를 강철 또는 초 포켓몬에게 붙입니다. 무색 포켓몬은 대상이 아닙니다.');}else notes.push('엑스 부트는 초 에너지도 붙일 수 있지만, 초 타입을 선택하지 않아 강철 에너지만 넣었습니다.');}
 // Main line: 4-3-3, or 4-2-3 with Rare Candy. Pre-evolutions may use any owned print.
 var counts=[];plan.line.forEach(function(c,i){var last=i===plan.line.length-1,target=i===0?4:(i===1&&plan.line.length===3&&plan.candy?2:3);counts.push(addStage(c,target,!last));});
 for(var i=1;i<counts.length;i++)if(counts[i]>counts[i-1]+(i===2&&plan.candy?4:0))weaknesses.push(plan.line[i].name_kr+'이(가) 진화 전 카드보다 많아 일부가 진화하지 못할 수 있습니다.');
 if(plan.line.length===3&&plan.candy){available.filter(function(c){return c.name_kr==='이상한사탕';}).forEach(function(c){add(c,3);});notes.push('이상한사탕과 정상 진화를 함께 사용합니다. 진화 가능한 차례인지 확인해주세요.');}
 reasons.push(attacker.name_kr+'의 「'+plan.attack.name+'」(기본 '+baseDamage(plan.attack)+' 데미지, 에너지 '+plan.attack.cost.length+'개)을 주력으로 사용합니다.');
 reasons.push(plan.line.map(function(c,i){return c.name_kr+' '+counts[i]+'장';}).join(' → ')+(plan.line.length>1?' 진화 라인':'')+'.');
 if(plan.copies<2)weaknesses.push('주력 '+attacker.name_kr+'이(가) '+plan.copies+'장뿐이라 프라이즈에 들어가면 공격이 어려울 수 있습니다.');
 if(plan.flags.length)unsupported.push('주력 기술 「'+plan.attack.name+'」: '+plan.flags.join(', ')+' — 표기된 기본 데미지만 계산했습니다.');
 var inDeck=function(){return Object.keys(cards).map(function(id){return db[id];});},pokemonCount=function(){return inDeck().reduce(function(s,c){return s+(c.card_class==='pokemon'?cards[c.bs_code]:0);},0);};
 var usable=function(s){return s.cost.every(function(t){t=type(t);return t==='무색'||req[t];});};
 // Second attacker line that shares the deck's energy (skipped when options disable profiles).
 var second=null;
 if(!options.disableProfiles){
  var seenStart={};available.filter(function(c){return basic(c)&&c.name_kr!==start.name_kr&&!seenStart[c.name_kr]&&(seenStart[c.name_kr]=1);}).forEach(function(c){
   linePlans(ctx,c,null,strategyName).plans.forEach(function(p){if(!usable(p.attack)||p.line.some(function(x){return names[x.name_kr];})||p.copies<2||baseDamage(p.attack)<Math.max(50,baseDamage(plan.attack)*0.35))return;
    var extra=Object.keys(p.req).filter(function(t){return !req[t];});if(extra.length)return;
    if(!second||p.score>second.score)second=p;});});
  if(second){second.line.forEach(function(c,i){var last=i===second.line.length-1;addStage(c,i===0?3:2,!last);});
   reasons.push('보조 공격수: '+second.line[second.line.length-1].name_kr+'의 「'+second.attack.name+'」(같은 에너지 사용).');}
 }
 // Represent a missing selected type with its own small line and energy plan, rather
 // than only looking for incidental colorless attacks in that type.
 selected.forEach(function(t){
 if(inDeck().some(function(c){return c.card_class==='pokemon'&&type(c.pokemon_type)===t;}))return;
 var bestLine=null,tried={};
 available.filter(function(c){return basic(c)&&type(c.pokemon_type)===t&&!tried[c.name_kr]&&(tried[c.name_kr]=1);}).forEach(function(c){
  // A supporting type is judged by its attack and owned line, not by main-attacker copy counts.
  // New energy types are allowed only when they are themselves selected (no 불꽃/물 for a 드래곤 pick).
  var energyOk=function(r){return Object.keys(r).every(function(x){return req[x]||selected.indexOf(x)>=0;});};
  linePlans(ctx,c,null,strategyName).plans.filter(function(p){return energyOk(p.req)&&p.line.every(function(x){return type(x.pokemon_type)===t;});}).forEach(function(p){
   var v=baseDamage(p.attack)+(p.req[t]?20:0)-p.setup*10;p.repValue=v;if(!bestLine||v>bestLine.repValue)bestLine=p;});});
 if(bestLine){bestLine.line.forEach(function(c,i){addStage(c,i===0?3:2,i<bestLine.line.length-1);});Object.keys(bestLine.req).forEach(function(x){req[x]=Math.max(req[x]||0,bestLine.req[x]);});
  reasons.push(t+' 타입은 '+bestLine.line.map(function(c){return c.name_kr;}).join(' → ')+'의 「'+bestLine.attack.name+'」으로 함께 공격합니다.');return;}
 var candidates=[];
 available.filter(function(c){return basic(c)&&type(c.pokemon_type)===t;}).forEach(function(c){attacks(c).forEach(function(a){
 if(baseDamage(a)<1&&supportValue(c)===0)return;
 var r={};a.cost.forEach(function(x){x=type(x);if(x!=='무색')r[x]=(r[x]||0)+1;});
 if(Object.keys(r).some(function(x){return (ctx.energySupply[x]||0)<r[x]||(!req[x]&&selected.indexOf(x)<0);}))return;
 candidates.push({card:c,req:r,score:baseDamage(a)/Math.max(1,a.cost.length)+supportValue(c)+Math.min(4,nameCopies(ctx,c.name_kr))*5});
 });});candidates.sort(function(a,b){return b.score-a.score;});
 if(candidates.length){var best=candidates[0];Object.keys(best.req).forEach(function(x){req[x]=Math.max(req[x]||0,best.req[x]);});add(best.card,Math.min(4,Math.max(2,nameCopies(ctx,best.card.name_kr))));reasons.push(t+' 타입은 '+best.card.name_kr+'(으)로 함께 사용합니다.');return;}
 // No attack this deck can pay for: a Pokemon with an ability may join as support, without new energy.
 var helper=available.filter(function(c){return basic(c)&&type(c.pokemon_type)===t&&abilities(c).length;}).sort(function(a,b){return nameCopies(ctx,b.name_kr)-nameCopies(ctx,a.name_kr)||a.bs_code.localeCompare(b.bs_code);})[0];
 if(helper){add(helper,Math.min(2,nameCopies(ctx,helper.name_kr)));reasons.push(t+' 타입은 '+helper.name_kr+'을(를) 특성용 보조로 넣었습니다. 기술에 필요한 에너지는 선택하지 않은 타입이라 넣지 않았어요.');}
 });
 var ets=Object.keys(req);
 var compatible=available.filter(function(c){return basic(c)&&!names[c.name_kr]&&(supportValue(c)>0||attacks(c).some(function(s){return usable(s)&&baseDamage(s)>0;}));});
 var power=function(c){return Math.max(0,...attacks(c).filter(usable).map(baseDamage))*0.2+supportValue(c)+Math.min(4,nameCopies(ctx,c.name_kr))*6;};
 compatible.sort(function(a,b){return power(b)-power(a)||qty(owned[b.bs_code])-qty(owned[a.bs_code])||a.bs_code.localeCompare(b.bs_code);});
 selected.forEach(function(t){if(!inDeck().some(function(c){return c.card_class==='pokemon'&&type(c.pokemon_type)===t;})){var c=compatible.find(function(c){return type(c.pokemon_type)===t;});if(c)add(c,2);}});
 var evolved=inDeck().some(function(c){return c.card_class==='pokemon'&&stage(c)>0;}),hasStage2=inDeck().some(function(c){return c.card_class==='pokemon'&&stage(c)===2;});
 var pokTarget=hasStage2?16:evolved?14:12;
 compatible.forEach(function(c){if(pokemonCount()<pokTarget)add(c,Math.min(2,pokTarget-pokemonCount()));});
 // Energy: depends on the attack cost, the number of types and owned energy search.
 var cost=Math.max(plan.attack.cost.length,second?second.attack.cost.length:0),energyTarget=Math.max(10,Math.min(16,8+2*Math.min(cost,4)+(ets.length>1?2:0)));
 var deckView=function(){var p=inDeck().filter(function(c){return c.card_class==='pokemon';}),types=ets.slice();p.forEach(function(c){var t=type(c.pokemon_type);if(types.indexOf(t)<0)types.push(t);});
  return {pokemon:p,types:types,stage2:p.some(function(c){return stage(c)===2;}),evolved:p.some(function(c){return stage(c)>0;})};};
 var view=deckView(),trainers=available.filter(function(c){var i=trainerInfo(c);return i&&i.role&&c.card_class==='trainer';}),skipped=[];
 trainers=trainers.filter(function(c){var ok=applicable(trainerInfo(c),view);if(!ok&&trainerInfo(c).role)skipped.push(c.name_kr);return ok;});
 var roleCount={};ROLE_ORDER.forEach(function(r){roleCount[r]=0;});
 var rank=function(c){var i=trainerInfo(c);return (i.conditional?100:0)-(i.drawCount||0)-(i.supporter&&i.role==='draw'?2:0)-Math.min(4,nameCopies(ctx,c.name_kr));};
 trainers.sort(function(a,b){return rank(a)-rank(b)||a.bs_code.localeCompare(b.bs_code);});
 function fillRole(r,quota,limitConditional){trainers.filter(function(c){var i=trainerInfo(c);return i.role===r&&(!limitConditional||!i.conditional);}).forEach(function(c){if(roleCount[r]<quota)roleCount[r]+=add(c,Math.min(4,quota-roleCount[r]));});}
 var quotas={candy:hasStage2&&!(plan.line.length===3&&plan.candy)?2:0,draw:8,search:hasStage2?8:evolved?7:5,energySearch:ets.length>1?2:1,switch:2,gust:2,recovery:evolved?2:1,accel:2,heal:0};
 // Reserve energy before trainers so supply cannot be squeezed out.
 // Colorless costs of the main attack are paid with its primary energy, so weight it.
 var weight=Object.assign({},req),primary=req[type(attacker.pokemon_type)]?type(attacker.pokemon_type):Object.keys(plan.req)[0]||ets[0];if(primary)weight[primary]+=colorless;
 var energyAdded=0;function fillEnergy(target){ets.forEach(function(t){var share=Math.max(Math.ceil(target*weight[t]/ets.reduce(function(s,x){return s+weight[x];},0)),4),have=Object.keys(cards).reduce(function(s,id){return s+(energy(db[id])===t?cards[id]:0);},0);
  available.filter(function(c){return energy(c)===t;}).forEach(function(c){var n=add(c,Math.min(share-have,18-energyAdded));have+=n;energyAdded+=n;});});}
 fillEnergy(energyTarget);
 ROLE_ORDER.forEach(function(r){if(r!=='heal')fillRole(r,quotas[r],true);});
 ROLE_ORDER.forEach(function(r){if(r!=='heal')fillRole(r,quotas[r],false);});
 fillRole('draw',12,false);fillRole('search',12,false);
 // Evolve support basics that are already in the deck when the owned line attacks with the deck's energy.
 var evolvedAdded=[];
 inDeck().filter(function(c){return basic(c)&&!plan.line.some(function(x){return x.name_kr===c.name_kr;});}).forEach(function(b){
  if(total>=60)return;var best=null;
  paths(ctx,b,[]).forEach(function(l){if(l.length<2)return;var f=l[l.length-1];if(!attacks(f).some(function(a){return usable(a)&&baseDamage(a)>0;}))return;if(!best||l.length>best.length)best=l;});
  if(!best)return;var have=names[b.name_kr]||0;
  best.slice(1).forEach(function(c,i){var n=addStage(c,Math.min(have,i===0?2:2),i<best.length-2);if(n)evolvedAdded.push(c.name_kr);have=n;});
 });
 if(evolvedAdded.length)reasons.push('보조 포켓몬 진화: '+evolvedAdded.filter(function(x,i,a){return a.indexOf(x)===i;}).join(', ')+' (보유한 진화 카드).');
 compatible.forEach(function(c){if(total<60&&pokemonCount()<18)add(c,Math.min(2,18-pokemonCount()));});
 // Owned trainers whose effect is not analysed: only those whose named types/families fit the deck.
 var filler=[];view=deckView();
 available.filter(function(c){var i=trainerInfo(c);return i&&!i.role&&!cards[c.bs_code]&&applicable(Object.assign({},i,{role:'fill'}),view);})
  .sort(function(a,b){return (trainerInfo(a).conditional-trainerInfo(b).conditional)||(/포켓몬의 도구/.test(b.card_type||'')-/포켓몬의 도구/.test(a.card_type||''))||nameCopies(ctx,b.name_kr)-nameCopies(ctx,a.name_kr)||a.bs_code.localeCompare(b.bs_code);})
  .forEach(function(c){if(total<60&&energyAdded+Object.keys(cards).length&&add(c,Math.min(2,60-total)))filler.push(c.name_kr);});
 available.filter(function(c){return ets.indexOf(energy(c))>=0;}).forEach(function(c){if(total<60)energyAdded+=add(c,Math.min(60-total,18-energyAdded));});
 fillRole('heal',3,false);fillRole('switch',4,false);fillRole('recovery',4,false);
 compatible.forEach(function(c){if(total<60&&pokemonCount()<20)add(c,Math.min(2,20-pokemonCount()));});
 // Last resort before leaving gaps: owned evolutions of in-deck basics (any attack), then more
 // copies of trainers that already fit the deck. Reported as unanalysed fill.
 var isNew=function(c){return !names[nameKey(c)];};
 if(total<60)inDeck().filter(function(b){return basic(b)&&!plan.line.some(function(x){return x.name_kr===b.name_kr;});}).forEach(function(b){var l=paths(ctx,b,[]).sort(function(x,y){return y.length-x.length;})[0],have=names[b.name_kr]||0;
  (l||[]).slice(1).forEach(function(c){if(total>=60)return;var fresh=isNew(c),n=addStage(c,Math.min(have,4),true);if(n&&fresh&&filler.indexOf(c.name_kr)<0)filler.push(c.name_kr);have=n;});});
 if(total<60){view=deckView();available.filter(function(c){var i=trainerInfo(c);return i&&i.role&&c.card_class==='trainer'&&applicable(i,view);})
  .forEach(function(c){var fresh=isNew(c);if(total<60&&add(c,4)&&fresh&&filler.indexOf(c.name_kr)<0)filler.push(c.name_kr);});}
 if(total<60)available.filter(function(c){return basic(c)&&attacks(c).some(usable);}).forEach(function(c){var fresh=isNew(c);if(total<60&&add(c,4)&&fresh&&filler.indexOf(c.name_kr)<0)filler.push(c.name_kr);});
 // A nearly complete deck may go to 20 energy rather than leave a gap; thin decks keep the 18 cap.
 if(total>=56&&total<60){var before=energyAdded;available.filter(function(c){return ets.indexOf(energy(c))>=0;}).forEach(function(c){if(total<60)energyAdded+=add(c,Math.min(60-total,20-energyAdded));});
  if(energyAdded>18&&energyAdded>before)weaknesses.push('에너지가 '+energyAdded+'장으로 많은 편이라 패에 에너지가 몰릴 수 있습니다.');}
 if(filler.length)unsupported.push('효과를 자동으로 판단하지 않고 빈칸을 채운 카드: '+filler.filter(function(x,i,a){return a.indexOf(x)===i;}).join(', '));
 ets.forEach(function(t){if(!Object.keys(cards).some(function(id){return energy(db[id])===t;}))notes.push(t+' 에너지 부족');});
 if((roleCount.draw||0)<6)weaknesses.push('드로우 카드가 적어 패가 막힐 수 있습니다.'),notes.push('드로우 카드가 적어 패가 막힐 수 있습니다.');
 if((roleCount.search||0)<6)weaknesses.push('포켓몬 검색 수단이 부족합니다.'),notes.push('포켓몬 검색 수단이 부족합니다.');
 if(plan.line.length>1&&!(roleCount.search>=4))weaknesses.push('진화 라인을 모으는 검색 카드가 부족해 진화가 늦어질 수 있습니다.');
 if(!roleCount.switch)weaknesses.push('포켓몬 교체 카드가 없어 후퇴가 어려울 수 있습니다.');
 selected.forEach(function(t){if(!inDeck().some(function(c){return c.card_class==='pokemon'&&type(c.pokemon_type)===t;}))notes.push('선택한 '+t+' 타입을 포함하지 못했습니다. 보유 카드·진화 연결·기술 에너지를 확인해주세요.');});
 if(total<60)notes.push('역할에 맞는 보유 카드가 부족하여 '+(60-total)+'칸을 비웠습니다.'),weaknesses.push('보유 카드가 부족해 '+(60-total)+'장이 비어 있습니다.');
 var ab=inDeck().filter(function(c){return c.card_class==='pokemon'&&abilities(c).length&&!supportValue(c);});
 if(ab.length)unsupported.push('특성은 자동으로 계산하지 않았습니다: '+ab.map(function(c){return c.name_kr+'「'+abilities(c)[0].name+'」';}).filter(function(x,i,a){return a.indexOf(x)===i;}).join(', '));
 var cond=inDeck().filter(function(c){var i=trainerInfo(c);return i&&i.conditional;});
 if(cond.length)unsupported.push('사용 조건이 있는 트레이너: '+cond.map(function(c){return c.name_kr;}).filter(function(x,i,a){return a.indexOf(x)===i;}).join(', '));
 view=deckView();skipped=available.filter(function(c){var i=trainerInfo(c);return i&&i.role&&c.card_class==='trainer'&&!names[nameKey(c)]&&!applicable(i,view);}).map(function(c){return c.name_kr;});
 if(skipped.length)unsupported.push('덱의 포켓몬·타입과 맞지 않아 제외한 트레이너: '+skipped.filter(function(x,i,a){return a.indexOf(x)===i;}).slice(0,6).join(', '));
 notes.push('기술의 추가 조건·특성·검색 비용은 자동 해석하지 않습니다. 대회 레귤레이션 검증은 별도입니다.');
 var validation=inspect(cards,db,owned);selected.forEach(function(t){if(!inDeck().some(function(c){return c.card_class==='pokemon'&&type(c.pokemon_type)===t;}))validation.errors.push('선택 타입 누락: '+t);});
 inDeck().forEach(function(c){if(c.card_class==='pokemon'&&type(c.pokemon_type)&&selected.length&&selected.indexOf(type(c.pokemon_type))<0)validation.errors.push('선택하지 않은 타입 포함: '+c.name_kr);});
 Object.keys(cards).forEach(function(id){var t=energy(db[id]);if(t&&ets.indexOf(t)<0)validation.errors.push('기술에 쓰지 않는 에너지 포함: '+db[id].name_kr);});
 var pk=pokemonCount();if(pk<8){validation.errors.push('포켓몬이 '+pk+'장뿐이라 게임을 이어가기 어렵습니다 (8장 이상 필요)');weaknesses.push('선택 조건에 맞는 보유 포켓몬이 '+pk+'장뿐입니다. 포켓몬 카드를 더 등록하거나 다른 타입을 함께 선택해 보세요.');}
 validation.ok=!validation.errors.length;
 if(options.unlimitedBasicEnergy)notes.unshift('기본 에너지는 충분히 보유한 것으로 계산했습니다. 수집함 수량은 변경하지 않습니다.');
 notes.push('주력: '+attacker.name_kr+' · '+plan.attack.name+' (표기 기본 데미지 '+baseDamage(plan.attack)+')');
 var comp={pokemon:0,trainer:0,energy:0,stadium:0};Object.keys(cards).forEach(function(id){comp[db[id].card_class]=(comp[db[id].card_class]||0)+cards[id];});
 var summary={strategy:strategyName,strategyLabel:STRATEGIES[strategyName].label,strategyDesc:STRATEGIES[strategyName].desc,attacker:attacker.name_kr,attack:plan.attack.name,damage:baseDamage(plan.attack),cost:plan.attack.cost.length,setupTurns:plan.setup,
  line:plan.line.map(function(c){return c.name_kr;}),second:second?second.line[second.line.length-1].name_kr:null,composition:comp,roles:Object.keys(roleCount).filter(function(r){return roleCount[r];}).map(function(r){return {role:r,label:ROLE_LABEL[r],count:roleCount[r]};}),
  reasons:reasons,weaknesses:weaknesses,unsupported:unsupported};
 return {cards:cards,notes:notes,planScore:plan.score,attacker:attacker.bs_code,attack:plan.attack.name,energyTypes:ets,roles:roleCount,validation:validation,summary:summary,
  plan:{line:plan.line.map(function(c){return c.name_kr;}),attackerName:attacker.name_kr,cost:plan.attack.cost.length,candy:plan.candy,energyTypes:ets}};
}
function build(options){return buildFrom(context(options),options.basicCode,options.targetPath,options.strategy);}
// Search owned basic starting points under an explicit Pokemon-type constraint.
function buildByTypes(options,ctx){
 var selected=options.pokemonTypes||[],allowed=TYPES.concat(['드래곤','무색']);
 if(!selected.length||selected.some(function(t){return allowed.indexOf(t)<0;}))return {cards:{},notes:['포켓몬 타입을 하나 이상 선택해주세요.'],validation:{ok:false,total:0,errors:['유효한 타입 선택 필요']}};
 ctx=ctx||context(options);
 var best=null,bestScore=-Infinity,seen={};
 ctx.available.filter(function(c){return basic(c)&&selected.indexOf(type(c.pokemon_type))>=0&&!seen[identity(c)]&&(seen[identity(c)]=1);}).forEach(function(c){
 var r=buildFrom(ctx,c.bs_code,null,options.strategy);if(!r.validation.total)return;
 var present={};Object.keys(r.cards).forEach(function(id){var x=ctx.db[id];if(x.card_class==='pokemon')present[type(x.pokemon_type)]=true;});
 var coverage=selected.filter(function(t){return present[t];}).length;
 var score=coverage*10000+(r.validation.ok?1000:0)+r.validation.total+(r.planScore||0);
 if(score>bestScore){best=r;bestScore=score;}
 });
 return best||{cards:{},notes:['선택한 타입의 보유 기본 포켓몬이 없습니다.'],validation:{ok:false,total:0,errors:['보유 기본 포켓몬 부족']}};
}
// Objective, reproducible figures only: counts, hypergeometric opening chances and
// the seeded early-turn sample. No strength score or win rate.
function deckMetrics(r,database,db){
 var m={valid:r.validation.ok,total:r.validation.total,basics:0,drawSearch:0,energy:0,lineReady:null};
 Object.keys(r.cards).forEach(function(id){var c=db[id],n=r.cards[id];if(basic(c))m.basics+=n;var ro=role(c);if(ro==='draw'||ro==='search')m.drawSearch+=n;if(energy(c))m.energy+=n;});
 m.openingBasic=openingChance(m.basics);m.openingDrawSearch=openingChance(m.drawSearch);m.openingEnergy=openingChance(m.energy);
 if(r.validation.ok){var s=simulate(r.cards,database,{trials:2000,seed:20261031,plan:r.plan});m.lineReady=s.mainReadyBy;m.helperByTurn2=s.helperByTurn2;m.mulliganRate=s.mulliganRate;}
 m.setupTurns=r.summary.setupTurns;m.ownedComplete=r.validation.total===60;return m;
}
// Up to three meaningfully different drafts from the same collection.
function buildCandidates(options){
 var ctx=context(options),db=ctx.db,out=[],seen={};
 ['balanced','fast','power'].forEach(function(s){
  var r=options.pokemonTypes&&options.pokemonTypes.length?buildByTypes(Object.assign({},options,{strategy:s}),ctx):buildFrom(ctx,options.basicCode,options.targetPath,s);
  if(!r.validation||!r.validation.total||(r.summary&&r.summary.composition.pokemon<8)){if(!out.length&&!out.failure)out.failure=r;return;}
  var key=r.attacker+'|'+JSON.stringify(Object.keys(r.cards).sort().map(function(id){return id+':'+r.cards[id];}));
  var same=out.find(function(o){return o.result.attacker===r.attacker&&o.result.attack===r.attack;});
  if(seen[key]||same)return;seen[key]=1;out.push({strategy:s,label:STRATEGIES[s].label,result:r,metrics:deckMetrics(r,options.database,db)});
 });
 var failure=out.failure;delete out.failure;
 return {candidates:out,recommended:out.length?Math.max(0,out.findIndex(function(o){return o.metrics.valid;})):-1,failure:out.length?null:failure||{cards:{},notes:['조건에 맞는 덱을 만들 수 없습니다.'],validation:{ok:false,total:0,errors:[]}},
  limits:'비교 지표는 카드 장수와 시작 패·초반 드로우 확률입니다. 실제 대전 승률이나 강함 점수가 아닙니다.'};
}
// Early turns of one game, going first (no draw on turn 1). Simplified on purpose:
// one draw supporter per turn adds its printed draw count (hand discard/shuffle ignored),
// each search card fetches the next missing card of the main line, one basic energy is
// attached per turn, stages evolve on a later turn than they were played, Rare Candy
// skips stage 1 from turn 2. No opponent, no abilities, no other card effects.
function playTurns(order,db,plan,turns){
 var hand=order.slice(0,7),lib=order.slice(13),line=plan.line,cost=Math.max(1,plan.cost||0),inPlay=[],attached=0,ready=null;
 var take=function(pred){for(var i=0;i<lib.length;i++)if(pred(db[lib[i]])){return lib.splice(i,1)[0];}return null;};
 var pos=function(id){return line.indexOf(db[id].name_kr);};
 for(var t=1;t<=turns;t++){
  if(t>1&&lib.length)hand.push(lib.shift());
  var sup=hand.findIndex(function(id){var i=trainerInfo(db[id]);return i&&i.role==='draw'&&i.supporter;});
  if(sup>=0){var sc=db[hand[sup]],info=trainerInfo(sc),n=info.drawCount||3;hand.splice(sup,1);if(/패가\s*\d+장이 되도록/.test(sc.effect_text||''))n=Math.max(0,n-hand.length);for(var k=0;k<n&&lib.length;k++)hand.push(lib.shift());}
  hand.slice().forEach(function(id){var r=role(db[id]);if(r!=='search'&&r!=='energySearch')return;
   var want=r==='search'?line.find(function(nm,k){return k>inPlay.length-1&&!hand.some(function(h){return db[h].name_kr===nm;});}):null;
   var got=r==='search'?(want?take(function(c){return c.name_kr===want;}):null):take(function(c){return plan.energyTypes.indexOf(energy(c))>=0;});
   if(got){hand.splice(hand.indexOf(id),1);hand.push(got);}});
  // Evolve one stage per turn on a Pokemon that has been in play since an earlier turn.
  if(!inPlay.length){var b=hand.findIndex(function(id){return pos(id)===0;});if(b>=0){inPlay.push(t);hand.splice(b,1);}}
  else if(inPlay.length<line.length&&inPlay[inPlay.length-1]<t&&t>1){
   var nx=hand.findIndex(function(id){return pos(id)===inPlay.length;}),candy=hand.findIndex(function(id){return db[id].name_kr==='이상한사탕';}),top=hand.findIndex(function(id){return pos(id)===2;});
   if(nx>=0){inPlay.push(t);hand.splice(nx,1);}
   else if(plan.candy&&line.length===3&&inPlay.length===1&&candy>=0&&top>=0){inPlay.push(t,t);hand.splice(Math.max(candy,top),1);hand.splice(Math.min(candy,top),1);}
  }
  var e=hand.findIndex(function(id){return plan.energyTypes.indexOf(energy(db[id]))>=0;});if(e>=0&&inPlay.length){attached++;hand.splice(e,1);}
  if(ready===null&&inPlay.length===line.length&&attached>=cost)ready=t;
 }
 return {ready:ready,helper:order.slice(0,7).concat(order.slice(13,14)).some(function(id){var x=role(db[id]);return x==='draw'||x==='search';})};
}
// Opening hand and early-turn Monte Carlo. Not a battle simulation or win rate.
function simulate(cards,database,options){
 options=options||{};var db={};database.forEach(function(c){db[c.bs_code]=c;});var valid=inspect(cards,db);
 if(!valid.ok)return {available:false,reason:valid.errors.join(' / ')};
 var n=options.trials||10000;if(!Number.isInteger(n)||n<1||n>100000)throw Error('trials must be 1..100000');
 var r=rng(options.seed===undefined?20261029:options.seed),base=[],hit=0,energyHit=0,drawHit=0,prized=0,plan=options.plan&&options.plan.line&&options.plan.line.length?options.plan:null;
 var mull=0,helperEarly=0,ready={2:0,3:0,4:0};
 Object.keys(cards).forEach(function(id){for(var k=0;k<cards[id];k++)base.push(id);});
 for(var i=0;i<n;i++){var deck=shuffle(base.slice(),r),hand=deck.slice(0,7);
 if(hand.some(function(id){return basic(db[id]);}))hit++;
 if(hand.some(function(id){return energy(db[id]);}))energyHit++;
 if(hand.some(function(id){return role(db[id])==='draw';}))drawHit++;
 if(options.attacker&&deck.slice(7,13).includes(options.attacker))prized++;
 if(!plan)continue;
 // Mulligan until the opening seven has a basic Pokemon; 6 prizes come off next.
 var d=deck,tries=0;while(!d.slice(0,7).some(function(id){return basic(db[id]);})&&tries<30){d=shuffle(base.slice(),r);tries++;}
 if(tries)mull++;
 var g=playTurns(d,db,plan,4);if(g.helper)helperEarly++;[2,3,4].forEach(function(t){if(g.ready!==null&&g.ready<=t)ready[t]++;});
 }
 var out={available:true,trials:n,seed:options.seed===undefined?20261029:options.seed,openingBasic:hit/n,openingBasicEnergy:energyHit/n,openingDrawSupporter:drawHit/n,attackerInPrizes:options.attacker?prized/n:null,
  scope:'멀리건 전 최초 7장과 뒤 6장 배치만 측정. 카드 효과·승률·실전 공격률 제외.'};
 if(plan){out.mulliganRate=mull/n;out.helperByTurn2=helperEarly/n;out.mainReadyBy={2:ready[2]/n,3:ready[3]/n,4:ready[4]/n};
  out.readyScope='선공 기준 단순 모델: 드로우 서포트 1장/차례, 검색 카드로 주력 라인 확보, 에너지 1장/차례 부착, 진화는 다음 차례부터. 상대·특성·패 버림 효과는 반영하지 않으므로 실제 승률이나 공격 성공률이 아닙니다.';}
 return out;
}
var api={supply:supply,build:build,buildByTypes:buildByTypes,buildCandidates:buildCandidates,inspect:inspect,simulate:simulate,basic:basic,basicEnergy:energy,role:role,trainerInfo:trainerInfo,compareReference:compareReference,openingMetrics:openingMetrics,strategies:STRATEGIES};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DeckEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
