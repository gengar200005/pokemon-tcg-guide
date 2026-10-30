/* Read-only integrity check for data/*.json. Never writes files.
   Usage: node scripts/validate-data.js [--json] [--data-dir=path]
   errors   = must be zero before merging a data update
   warnings = pre-existing legacy issues, recorded in DB_UPDATE_REPORT.md, not auto-fixed */
'use strict';
var fs=require('fs'),path=require('path');

var ENERGY_TYPES=['풀','불꽃','물','번개','초','격투','악','강철','페어리','무색'];
/* Cost tokens that already exist in the DB but are not energy symbols.
   The deck engine treats them as unknown, so they are warnings, not errors. */
var LEGACY_COST_TOKENS=['0코스트','플러스','-'];
var STAGES=['basic','stage1','stage2','v-evolution','mega','break','other'];
var EVO_SOURCES=['agreed','agreed-basic','A-only','B-only','unmatched'];
var TRAINER_SUBTYPES=['item','supporter','fossil',null];
var TRAINER_TAGS=['draw_support','pokemon_search','energy_acceleration','recovery','switch','hand_disrupt','energy_search','gust','healing','tool_defensive','evolution_accel'];
var CARD_CLASSES=['pokemon','trainer','energy','stadium'];
var BS_CODE=/^[A-Z]{2,3}\d{9,15}m?$/;

function load(dir,name){return JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));}
function counter(list,key){var m=new Map();list.forEach(function(x){m.set(x[key],(m.get(x[key])||0)+1);});return m;}
function dups(m){var out=[];m.forEach(function(n,k){if(n>1)out.push(k);});return out;}

function validate(dir){
  var db=load(dir,'korean_cards_db.json'),evo=load(dir,'evolution_lines.json'),tc=load(dir,'trainer_categories.json');
  var catalog=load(dir,'korean_decks_catalog.json'),presets=load(dir,'starter_deck_presets.json');
  var errors=[],warnings=[];
  function err(check,msg,sample){errors.push({check:check,msg:msg,sample:(sample||[]).slice(0,10),count:(sample||[]).length});}
  function warn(check,msg,sample){warnings.push({check:check,msg:msg,sample:(sample||[]).slice(0,10),count:(sample||[]).length});}

  /* 1. card IDs */
  var ids=counter(db,'bs_code'),byId=new Map(db.map(function(c){return [c.bs_code,c];}));
  var d=dups(ids);if(d.length)err('card_id_duplicate','카드 ID 중복',d);
  var badId=db.filter(function(c){return typeof c.bs_code!=='string'||!BS_CODE.test(c.bs_code);}).map(function(c){return c.bs_code;});
  if(badId.length)err('card_id_format','카드 ID 형식 오류',badId);

  /* 2. names, classes, set numbers */
  var noName=db.filter(function(c){return typeof c.name_kr!=='string'||!c.name_kr.trim()||c.name_kr!==c.name_kr.trim();}).map(function(c){return c.bs_code;});
  if(noName.length)err('card_name','카드명 누락 또는 앞뒤 공백',noName);
  var badClass=db.filter(function(c){return CARD_CLASSES.indexOf(c.card_class)<0;}).map(function(c){return c.bs_code;});
  if(badClass.length)err('card_class','card_class 값 오류',badClass);
  var badNo=db.filter(function(c){return 'card_no' in c&&!(Number.isInteger(c.card_no)&&c.card_no>0);}).map(function(c){return c.bs_code;});
  if(badNo.length)err('card_no_type','card_no가 양의 정수가 아님',badNo);
  var dupNo=[],seenNo=new Map();
  db.forEach(function(c){if(!c.pack_file||!Number.isInteger(c.card_no))return;var k=c.pack_file+'#'+c.card_no+'#'+c.bs_code.slice(0,9);if(seenNo.has(k))dupNo.push(c.bs_code+'='+seenNo.get(k));else seenNo.set(k,c.bs_code);});
  if(dupNo.length)warn('set_number_duplicate','같은 세트·같은 번호에 카드가 2장 이상(기존 데이터)',dupNo);
  var ordinal=db.filter(function(c){return /^BS\d{10}$/.test(c.bs_code)&&Number.isInteger(c.card_no)&&+c.bs_code.slice(9)!==c.card_no;}).map(function(c){return c.bs_code;});
  if(ordinal.length)warn('set_number_ordinal','bs_code 끝 3자리와 card_no 불일치(하이클래스팩 등 공식 사이트 고유 번호 체계, 기존 데이터)',ordinal);
  var overTotal=db.filter(function(c){return Number.isInteger(c.set_total)&&c.card_no_display&&/^\d+$/.test(c.card_no_display)&&+c.card_no_display>c.set_total;}).map(function(c){return c.bs_code;});
  if(overTotal.length)warn('set_total','card_no_display가 set_total 초과(시크릿 레어 가능)',overTotal);

  /* 3. attack energy cost format */
  var badCost=[],legacyCost=[],dmgNoCost=[],noSkills=[];
  db.forEach(function(c){
    if(c.card_class!=='pokemon')return;
    if(!('skills' in c)){noSkills.push(c.bs_code);return;}
    if(!Array.isArray(c.skills)){badCost.push(c.bs_code+':skills');return;}
    c.skills.forEach(function(s,i){
      if(!s||typeof s.name!=='string'){badCost.push(c.bs_code+'#'+i+':name');return;}
      if(!('cost' in s)){if(s.damage)dmgNoCost.push(c.bs_code+'#'+i);return;} /* abilities / rule boxes have no cost */
      if(!Array.isArray(s.cost)){badCost.push(c.bs_code+'#'+i+':cost');return;}
      s.cost.forEach(function(t){
        if(ENERGY_TYPES.indexOf(t)>=0)return;
        if(LEGACY_COST_TOKENS.indexOf(t)>=0)legacyCost.push(c.bs_code+'#'+i+':'+t);
        else badCost.push(c.bs_code+'#'+i+':'+t);
      });
      if(s.damage!=null&&typeof s.damage!=='string')badCost.push(c.bs_code+'#'+i+':damage');
    });
  });
  if(badCost.length)err('attack_cost_format','기술 에너지 비용 형식 오류',badCost);
  if(legacyCost.length)warn('attack_cost_legacy_token','에너지 기호가 아닌 비용 토큰(0코스트/플러스/-) — 엔진은 미지원 비용으로 제외',legacyCost);
  if(noSkills.length)warn('pokemon_without_skills','skills 필드가 없는 포켓몬(V-UNION 조각 5장 + 원본 누락 의심 1장, 기존 데이터)',noSkills);
  if(dmgNoCost.length)warn('attack_damage_without_cost','데미지는 있으나 cost 필드가 없는 기술(원본 누락 의심)',dmgNoCost);

  /* 4. evolution referential integrity */
  var evoIds=counter(evo,'bs_code');
  d=dups(evoIds);if(d.length)err('evolution_duplicate','evolution_lines 중복 ID',d);
  var orphan=evo.filter(function(e){return !byId.has(e.bs_code);}).map(function(e){return e.bs_code;});
  if(orphan.length)err('evolution_orphan','DB에 없는 카드를 가리키는 진화 항목',orphan);
  var missingEvo=db.filter(function(c){return c.card_class==='pokemon'&&!evoIds.has(c.bs_code);}).map(function(c){return c.bs_code;});
  if(missingEvo.length)err('evolution_missing','진화 정보가 없는 포켓몬 카드',missingEvo);
  var nameMismatch=evo.filter(function(e){var c=byId.get(e.bs_code);return c&&c.name_kr!==e.name_kr;}).map(function(e){return e.bs_code;});
  if(nameMismatch.length)err('evolution_name','진화 항목과 카드 DB 이름 불일치',nameMismatch);
  var badStage=evo.filter(function(e){return STAGES.indexOf(e.stage)<0||EVO_SOURCES.indexOf(e.source)<0;}).map(function(e){return e.bs_code;});
  if(badStage.length)err('evolution_enum','stage/source 값 오류',badStage);
  var basicFrom=evo.filter(function(e){return e.stage==='basic'&&e.evolvesFrom_kr;}).map(function(e){return e.bs_code;});
  if(basicFrom.length)err('evolution_basic_from','기본 포켓몬인데 evolvesFrom_kr 존재',basicFrom);
  var names=new Set();evo.forEach(function(e){names.add(e.base_kr);names.add(e.name_kr);});
  var unresolved=evo.filter(function(e){return e.evolvesFrom_kr&&!names.has(e.evolvesFrom_kr);}).map(function(e){return e.bs_code+':'+e.evolvesFrom_kr;});
  if(unresolved.length)warn('evolution_unresolved','evolvesFrom_kr 이름이 어떤 카드에도 없음(기존 B-only 항목, 주로 V→VMAX 표기 차이)',unresolved);
  var stageNoFrom=evo.filter(function(e){return (e.stage==='stage1'||e.stage==='stage2')&&!e.evolvesFrom_kr;}).map(function(e){return e.bs_code;});
  if(stageNoFrom.length)warn('evolution_stage_without_from','1·2진화인데 evolvesFrom_kr 없음(기존 데이터, 엔진은 진화 라인에서 제외)',stageNoFrom);

  /* 5. trainer categories */
  var tcIds=counter(tc,'bs_code');
  d=dups(tcIds);if(d.length)err('trainer_duplicate','trainer_categories 중복 ID',d);
  var tcOrphan=tc.filter(function(t){return !byId.has(t.bs_code);}).map(function(t){return t.bs_code;});
  if(tcOrphan.length)err('trainer_orphan','DB에 없는 카드를 가리키는 트레이너 분류',tcOrphan);
  var tcMissing=db.filter(function(c){return (c.card_class==='trainer'||c.card_class==='stadium')&&!tcIds.has(c.bs_code);}).map(function(c){return c.bs_code;});
  if(tcMissing.length)err('trainer_missing','분류가 없는 트레이너/스타디움 카드',tcMissing);
  var tcBad=tc.filter(function(t){var c=byId.get(t.bs_code);return TRAINER_SUBTYPES.indexOf(t.subtype)<0||!Array.isArray(t.tags)||t.tags.some(function(x){return TRAINER_TAGS.indexOf(x)<0;})||(c&&(c.card_class!==t.card_class||c.name_kr!==t.name_kr));}).map(function(t){return t.bs_code;});
  if(tcBad.length)err('trainer_fields','트레이너 분류 값 또는 DB와의 이름/클래스 불일치',tcBad);

  /* 6. retail products vs 60-card presets */
  var presetErr=[];
  (presets.presets||[]).forEach(function(p){
    var total=0;(p.cards||[]).forEach(function(x){if(!byId.has(x.bs_code))presetErr.push(p.id+':'+x.bs_code);if(!Number.isInteger(x.qty)||x.qty<1)presetErr.push(p.id+':qty');total+=x.qty;});
    if(total!==60)presetErr.push(p.id+':total='+total);
  });
  d=dups(counter(presets.presets||[],'id'));d.forEach(function(x){presetErr.push('dup:'+x);});
  if(presetErr.length)err('preset_integrity','시판덱 프리셋 참조/60장 오류',presetErr);
  var catErr=[];
  if(!Array.isArray(catalog.decks))catErr.push('decks');
  else{if(catalog.count!==catalog.decks.length)catErr.push('count='+catalog.count+'/'+catalog.decks.length);
    catalog.decks.forEach(function(x,i){if(!x.name||!x.series)catErr.push('#'+i);});
    dups(counter(catalog.decks,'name')).forEach(function(x){catErr.push('dup:'+x);});}
  if(catErr.length)err('catalog_integrity','시판덱 제품 목록 형식 오류',catErr);

  var classes={};db.forEach(function(c){classes[c.card_class]=(classes[c.card_class]||0)+1;});
  return {ok:!errors.length,errors:errors,warnings:warnings,counts:{cards:db.length,byClass:classes,evolution:evo.length,trainerCategories:tc.length,catalogDecks:(catalog.decks||[]).length,presets:(presets.presets||[]).length,packs:new Set(db.map(function(c){return c.bs_code.slice(0,9);})).size}};
}

module.exports={validate:validate,ENERGY_TYPES:ENERGY_TYPES,TRAINER_TAGS:TRAINER_TAGS};

if(require.main===module){
  var arg=process.argv.slice(2),dirArg=arg.find(function(a){return a.indexOf('--data-dir=')===0;});
  var r=validate(dirArg?dirArg.slice(11):path.join(__dirname,'..','data'));
  if(arg.indexOf('--json')>=0)console.log(JSON.stringify(r,null,2));
  else{
    console.log('counts',JSON.stringify(r.counts));
    r.errors.forEach(function(e){console.log('ERROR  ',e.check,e.count,e.msg,e.sample.join(', '));});
    r.warnings.forEach(function(w){console.log('WARN   ',w.check,w.count,w.msg,w.sample.slice(0,3).join(', '));});
    console.log(r.ok?'OK: no blocking errors':'FAIL: '+r.errors.length+' blocking checks');
  }
  process.exitCode=r.ok?0:1;
}
