// Synthetic inventory made from public DB; never a user's collection.
const E=require('../deck-engine'),db=require('../data/korean_cards_db.json'),evo=require('../data/evolution_lines.json');
const owned={},seen=new Set();
for(const c of db){if((E.role(c)||E.basicEnergy(c))&&!seen.has(c.name_kr)){owned[c.bs_code]={qty:E.basicEnergy(c)?25:4};seen.add(c.name_kr);}}
const basics=db.filter(c=>E.basic(c)&&c.skills?.some(s=>s.cost?.length===1&&s.cost[0]==='불꽃')).slice(0,4);
for(const c of basics)owned[c.bs_code]={qty:4};
const r=E.build({database:db,evolution:evo,owned,basicCode:basics[0].bs_code});
const sim=E.simulate(r.cards,db,{trials:10000,seed:20261029});
console.log(JSON.stringify({inventory:'SYNTHETIC public DB fixture, not user inventory',total:r.validation.total,errors:r.validation.errors,notes:r.notes,roles:r.roles,simulation:sim},null,2));
