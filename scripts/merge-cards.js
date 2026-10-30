/* Append-only incremental merge of verified new cards into data/*.json.
   Usage: node scripts/merge-cards.js <update.json> [--write] [--data-dir=path]
   Without --write it is a dry run. Existing records are never modified or deleted:
   an incoming bs_code that already exists is skipped when identical and rejected when different
   (data corrections go to DB_UPDATE_REPORT.md for manual review instead).

   update.json = {
     "source": "https://pokemoncard.co.kr/...",   required: where the card text was verified
     "verified_at": "YYYY-MM-DD",                 required
     "cards": [ ...korean_cards_db.json records... ],
     "evolution": [ ...evolution_lines.json records, one per new pokemon... ],
     "trainer_categories": [ ...one per new trainer/stadium... ]
   } */
'use strict';
var fs=require('fs'),os=require('os'),path=require('path'),V=require('./validate-data');

var FILES={cards:['korean_cards_db.json',0],evolution:['evolution_lines.json',2],trainer_categories:['trainer_categories.json',2]};
function read(dir,f){return JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));}
function serialize(list,indent){return indent?JSON.stringify(list,null,indent):JSON.stringify(list);}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}

function plan(dir,update){
  var problems=[];
  if(!update||typeof update!=='object')return {problems:['update file is not an object']};
  if(!update.source||!/^https?:\/\//.test(update.source))problems.push('source URL required');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(update.verified_at||''))problems.push('verified_at YYYY-MM-DD required');
  var result={problems:problems,added:{},skipped:{},data:{}};
  Object.keys(FILES).forEach(function(key){
    var existing=read(dir,FILES[key][0]),byId=new Map(existing.map(function(x){return [x.bs_code,x];}));
    var incoming=update[key]||[],seen=new Set(),add=[],skip=[];
    if(!Array.isArray(incoming)){problems.push(key+' must be an array');incoming=[];}
    incoming.forEach(function(x){
      if(!x||typeof x.bs_code!=='string'){problems.push(key+': record without bs_code');return;}
      if(seen.has(x.bs_code)){problems.push(key+': duplicate in update '+x.bs_code);return;}
      seen.add(x.bs_code);
      var old=byId.get(x.bs_code);
      if(old){if(same(old,x))skip.push(x.bs_code);else problems.push(key+': '+x.bs_code+' already exists with different data (record as correction, not merged)');return;}
      add.push(x);
    });
    result.added[key]=add.map(function(x){return x.bs_code;});result.skipped[key]=skip;
    result.data[key]=existing.concat(add);
  });
  /* every new card needs its companion records, and vice versa */
  var newCards=new Map((update.cards||[]).filter(function(c){return result.added.cards&&result.added.cards.indexOf(c.bs_code)>=0;}).map(function(c){return [c.bs_code,c];}));
  var evoIds=new Set((result.data.evolution||[]).map(function(e){return e.bs_code;})),tcIds=new Set((result.data.trainer_categories||[]).map(function(t){return t.bs_code;}));
  /* legacy unresolved names stay warnings; new entries must resolve */
  var evoNames=new Set();(result.data.evolution||[]).forEach(function(e){evoNames.add(e.base_kr);evoNames.add(e.name_kr);});
  (update.evolution||[]).forEach(function(e){if(result.added.evolution.indexOf(e.bs_code)>=0&&e.evolvesFrom_kr&&!evoNames.has(e.evolvesFrom_kr))problems.push('evolvesFrom_kr not found for '+e.bs_code+': '+e.evolvesFrom_kr);});
  newCards.forEach(function(c){
    if(c.card_class==='pokemon'&&!evoIds.has(c.bs_code))problems.push('evolution entry missing for new pokemon '+c.bs_code);
    if((c.card_class==='trainer'||c.card_class==='stadium')&&!tcIds.has(c.bs_code))problems.push('trainer_categories entry missing for '+c.bs_code);
  });
  return result;
}

/* Validate the merged result in a scratch copy before touching data/. */
function check(dir,result){
  var tmp=fs.mkdtempSync(path.join(os.tmpdir(),'tcg-merge-'));
  try{
    fs.readdirSync(dir).filter(function(f){return /\.json$/.test(f);}).forEach(function(f){fs.copyFileSync(path.join(dir,f),path.join(tmp,f));});
    Object.keys(FILES).forEach(function(key){fs.writeFileSync(path.join(tmp,FILES[key][0]),serialize(result.data[key],FILES[key][1]));});
    return V.validate(tmp);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}

function merge(dir,update,write){
  var before=V.validate(dir).counts,result=plan(dir,update);
  if(result.problems.length)return {ok:false,problems:result.problems};
  var after=check(dir,result);
  if(!after.ok)return {ok:false,problems:after.errors.map(function(e){return e.check+': '+e.msg+' '+e.sample.join(', ');})};
  if(write)Object.keys(FILES).forEach(function(key){if(result.added[key].length)fs.writeFileSync(path.join(dir,FILES[key][0]),serialize(result.data[key],FILES[key][1]));});
  return {ok:true,written:!!write,added:result.added,skipped:result.skipped,before:before,after:after.counts,warnings:after.warnings.length};
}

module.exports={plan:plan,merge:merge,serialize:serialize,FILES:FILES};

if(require.main===module){
  var args=process.argv.slice(2),file=args.find(function(a){return a.indexOf('--')!==0;}),dirArg=args.find(function(a){return a.indexOf('--data-dir=')===0;});
  if(!file){console.error('usage: node scripts/merge-cards.js <update.json> [--write] [--data-dir=path]');process.exit(2);}
  var r=merge(dirArg?dirArg.slice(11):path.join(__dirname,'..','data'),JSON.parse(fs.readFileSync(file,'utf8')),args.indexOf('--write')>=0);
  console.log(JSON.stringify(r,null,2));
  process.exitCode=r.ok?0:1;
}
