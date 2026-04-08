/* ═══════════════════════════════════════════════════════════════
   포켓몬 TCG 가이드 v4 — Korean DB Edition
   세션 7: 도감/수집 탭 전면 재설계
   ═══════════════════════════════════════════════════════════════ */

/* ═══ Constants ═══ */
var DB_URL='https://gengar200005.github.io/pokemon-tcg-guide/data/korean_cards_db.json';
var DB_VERSION='v4-1'; /* 캐시 무효화 키 */
var IDB_NAME='ptcg-cards';
var IDB_STORE='db';
var SK='ptcg-v4';

/* ═══ Firebase Config (기존 유지) ═══ */
var firebaseConfig={
  apiKey:"AIzaSyADTV_fzwM7ZoaLq95yY-o5ZjCKrI_yJW8",
  authDomain:"pokemon-tcg-268ce.firebaseapp.com",
  projectId:"pokemon-tcg-268ce",
  storageBucket:"pokemon-tcg-268ce.firebasestorage.app",
  messagingSenderId:"542865221638",
  appId:"1:542865221638:web:7184175f4349c010f2bb87"
};
try{
  firebase.initializeApp(firebaseConfig);
}catch(e){console.warn('Firebase init failed:',e);}
var auth=firebase.auth();
var db=firebase.firestore();
var currentUser=null;

/* ═══ Local State ═══ */
var cardsDB=[]; /* 전체 카드 DB (메모리 캐시) */
var dbByCode={}; /* bs_code → card 빠른 lookup */
var D={collected:{}}; /* { bs_code: {qty:1, collectedAt:ts} } */
try{
  var _raw=localStorage.getItem(SK);
  if(_raw){var _p=JSON.parse(_raw);if(_p&&_p.collected)D=_p;}
}catch(e){}
var _localDirty=false,_syncTimeout=null;

/* ═══ Utils ═══ */
function esc(s){
  if(s==null)return'';
  s=String(s);
  var o='',i,c;
  for(i=0;i<s.length;i++){
    c=s.charCodeAt(i);
    if(c===38)o+='&amp;';
    else if(c===34)o+='&quot;';
    else if(c===39)o+='&#39;';
    else if(c===60)o+='&lt;';
    else if(c===62)o+='&gt;';
    else o+=s[i];
  }
  return o;
}
function $(id){return document.getElementById(id);}
function toast(msg,bg){
  var t=document.createElement('div');
  t.className='scan-toast';
  t.textContent=msg;
  if(bg)t.style.background=bg;
  document.body.appendChild(t);
  setTimeout(function(){t.remove();},2000);
}
function placeholderImg(name){
  /* image_url 누락 시 회색 카드 + 이름 텍스트 SVG data URL */
  var safe=esc(name||'?').slice(0,12);
  var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 350"><rect width="250" height="350" fill="#d6ecf7" rx="12"/><rect x="20" y="20" width="210" height="310" fill="none" stroke="#a0c8e0" stroke-width="2" stroke-dasharray="6 4" rx="8"/><text x="125" y="180" font-family="sans-serif" font-size="20" fill="#4a6070" text-anchor="middle">'+safe+'</text><text x="125" y="210" font-family="sans-serif" font-size="13" fill="#8898a8" text-anchor="middle">이미지 없음</text></svg>';
  return'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}

/* ═══ Tab Switch ═══ */
var _currentTab='rules';
function switchTab(id,btn){
  _currentTab=id;
  var tabs=$('tabbar').getElementsByTagName('button');
  for(var i=0;i<tabs.length;i++)tabs[i].className='tab';
  btn.className='tab on';
  var ids=['rules','dex','coll','scan','deck'];
  for(var j=0;j<ids.length;j++){
    var el=$('p-'+ids[j]);
    if(el)el.className=(ids[j]===id)?'pnl on':'pnl';
  }
  if(id==='dex')renderDex();
  if(id==='coll')renderColl();
  if(id==='deck')renderDeckTab();
}
function togAcc(el){
  el.classList.toggle('open');
  el.nextElementSibling.classList.toggle('open');
}
function closeM(){$('mo').className='mo';}

/* ═══ Auth ═══ */
function authAction(){
  if(currentUser){
    auth.signOut();
  }else{
    var p=new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(p).catch(function(e){
      toast('로그인 실패: '+(e.message||e),'#e74c3c');
    });
  }
}
function updateAuthUI(){
  var lbl=$('auth-label'),st=$('auth-status');
  if(!lbl||!st)return; /* DOM 아직 준비 전 */
  if(currentUser){
    lbl.textContent='로그아웃';
    st.textContent='☁️ '+(currentUser.displayName||currentUser.email||'로그인됨');
  }else{
    lbl.textContent='Google 로그인';
    st.textContent='☁️ 로그인하면 클라우드 저장!';
  }
}
auth.onAuthStateChanged(function(u){
  currentUser=u;
  updateAuthUI();
  if(u)loadFromCloud();
});

/* ═══ Save / Sync ═══ */
function sv(){
  _localDirty=true;
  try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}
  if(currentUser){
    if(_syncTimeout)clearTimeout(_syncTimeout);
    _syncTimeout=setTimeout(saveToCloud,1000);
  }
}
function saveToCloud(){
  if(!currentUser)return;
  /* v4 데이터는 별도 필드(collectedV4)로 저장 — 기존 v3 cards/decks는 건드리지 않음 */
  db.collection('users').doc(currentUser.uid).set({
    collectedV4:D.collected,
    schemaVersion:'v4',
    updatedAtV4:firebase.firestore.FieldValue.serverTimestamp(),
    displayName:currentUser.displayName||'',
    email:currentUser.email||''
  },{merge:true}).then(function(){_localDirty=false;}).catch(function(e){console.warn('cloud save fail',e);});
}
function loadFromCloud(){
  if(!currentUser)return;
  db.collection('users').doc(currentUser.uid).get().then(function(doc){
    if(doc.exists){
      var d=doc.data();
      if(d.collectedV4&&!_localDirty){
        D.collected=d.collectedV4||{};
        try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}
        if(_currentTab==='coll')renderColl();
        if(_currentTab==='dex')renderDex();
      }
    }else if(Object.keys(D.collected).length>0){
      saveToCloud();
    }
  }).catch(function(e){console.warn('cloud load fail',e);});
}

/* ═══ DB Loading: IndexedDB Cache + Network Fallback ═══ */
function openIDB(){
  return new Promise(function(res,rej){
    var req=indexedDB.open(IDB_NAME,1);
    req.onupgradeneeded=function(e){
      var idb=e.target.result;
      if(!idb.objectStoreNames.contains(IDB_STORE))idb.createObjectStore(IDB_STORE);
    };
    req.onsuccess=function(e){res(e.target.result);};
    req.onerror=function(e){rej(e.target.error);};
  });
}
function idbGet(key){
  return openIDB().then(function(idb){
    return new Promise(function(res,rej){
      var tx=idb.transaction(IDB_STORE,'readonly');
      var req=tx.objectStore(IDB_STORE).get(key);
      req.onsuccess=function(){res(req.result);};
      req.onerror=function(){rej(req.error);};
    });
  });
}
function idbSet(key,val){
  return openIDB().then(function(idb){
    return new Promise(function(res,rej){
      var tx=idb.transaction(IDB_STORE,'readwrite');
      tx.objectStore(IDB_STORE).put(val,key);
      tx.oncomplete=function(){res();};
      tx.onerror=function(){rej(tx.error);};
    });
  });
}

function loadDB(){
  $('db-status').textContent='💾 캐시 확인 중...';
  return idbGet('cards-'+DB_VERSION).then(function(cached){
    if(cached&&cached.length){
      cardsDB=cached;
      buildIndexes();
      $('db-status').textContent='✅ '+cardsDB.length.toLocaleString()+'장 (캐시)';
      setTimeout(function(){$('db-status').style.display='none';},1500);
      return;
    }
    /* 네트워크 fetch */
    $('db-status').textContent='🌐 카드 DB 다운로드 중... (~30MB, 첫 1회만)';
    return fetch(DB_URL).then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status);
      return r.json();
    }).then(function(data){
      cardsDB=Array.isArray(data)?data:[];
      buildIndexes();
      $('db-status').textContent='✅ '+cardsDB.length.toLocaleString()+'장 다운로드 완료';
      idbSet('cards-'+DB_VERSION,cardsDB).catch(function(){});
      setTimeout(function(){$('db-status').style.display='none';},2000);
    });
  }).catch(function(e){
    $('db-status').textContent='⚠️ DB 로드 실패: '+(e.message||e);
    $('db-status').style.background='#ffebee';
    $('db-status').style.color='#c62828';
  });
}
function buildIndexes(){
  dbByCode={};
  for(var i=0;i<cardsDB.length;i++){
    var c=cardsDB[i];
    if(c&&c.bs_code)dbByCode[c.bs_code]=c;
  }
}

/* ═══════════════════════════════════════════════════════════════
   📚 도감 탭 (Dex)
   ═══════════════════════════════════════════════════════════════ */
var _dexClass='pokemon';
var _dexQuery='';
var _dexLimit=120; /* 초기 표시 개수 */
var _dexCurFiltered=[];

function setDexClass(cls,btn){
  _dexClass=cls;
  _dexLimit=120;
  var sub=$('dex-subtabs').getElementsByTagName('button');
  for(var i=0;i<sub.length;i++)sub[i].className='subtab';
  btn.className='subtab on';
  renderDex();
}
function onDexSearch(){
  _dexQuery=$('dex-q').value.trim();
  _dexLimit=120;
  renderDex();
}
function renderDex(){
  if(!cardsDB.length){
    $('dex-r').innerHTML='<div class="loading"><div class="spinner"></div><p>카드 DB 로딩 중...</p></div>';
    return;
  }
  /* 필터링 */
  var q=_dexQuery;
  var filtered=[];
  for(var i=0;i<cardsDB.length;i++){
    var c=cardsDB[i];
    if(!c||c.card_class!==_dexClass)continue;
    if(q&&c.name_kr&&c.name_kr.indexOf(q)<0)continue;
    if(q&&!c.name_kr)continue;
    filtered.push(c);
  }
  _dexCurFiltered=filtered;
  var total=filtered.length;
  var shown=filtered.slice(0,_dexLimit);
  var ownedCount=0;
  for(var k=0;k<filtered.length;k++)if(D.collected[filtered[k].bs_code])ownedCount++;

  var h='<div class="dex-meta">총 <b>'+total.toLocaleString()+'</b>장 · 수집 <b style="color:var(--green)">'+ownedCount.toLocaleString()+'</b>장 ('+(total?Math.round(ownedCount/total*100):0)+'%)</div>';
  h+='<div class="dgrid">';
  for(var j=0;j<shown.length;j++){
    var card=shown[j];
    var owned=!!D.collected[card.bs_code];
    var img=card.image_url||placeholderImg(card.name_kr);
    h+='<div class="dc '+(owned?'owned':'unowned')+'" data-idx="'+j+'">'
      +'<div class="ob">'+(owned?'✓':'＋')+'</div>'
      +'<img src="'+esc(img)+'" alt="'+esc(card.name_kr||'')+'" loading="lazy" onerror="this.src=\''+placeholderImg(card.name_kr)+'\'">'
      +'<div class="nm">'+esc(card.name_kr||'(이름 없음)')+'</div>'
      +'</div>';
  }
  h+='</div>';
  if(shown.length<total){
    h+='<div style="text-align:center;margin-top:14px"><button class="btn btn-p" onclick="_dexLimit+=120;renderDex()">더 보기 (+120)</button></div>';
  }
  if(total===0){
    h='<div class="empty"><div class="ei">🔍</div><p>검색 결과 없음<br><span style="font-size:.72rem">"'+esc(q)+'"</span></p></div>';
  }
  $('dex-r').innerHTML=h;
  /* 클릭 핸들러 */
  var els=$('dex-r').querySelectorAll('.dc');
  for(var m=0;m<els.length;m++){
    (function(idx){
      els[idx].addEventListener('click',function(){
        showCardModal(shown[idx]);
      });
    })(m);
  }
}

/* ═══ Card Detail Modal ═══ */
function showCardModal(c){
  if(!c)return;
  var owned=!!D.collected[c.bs_code];
  var img=c.image_url||placeholderImg(c.name_kr);
  var h='<img src="'+esc(img)+'" onerror="this.src=\''+placeholderImg(c.name_kr)+'\'">';
  h+='<h3>'+esc(c.name_kr||'(이름 없음)')+'</h3>';
  h+='<div class="dr"><span class="dl">카드 종류</span><span>'+esc(c.card_type||'-')+'</span></div>';
  h+='<div class="dr"><span class="dl">팩</span><span>'+esc(c.pack_full_kr||c.pack_name_kr||'-')+'</span></div>';

  if(c.card_class==='pokemon'){
    if(c.hp)h+='<div class="dr"><span class="dl">HP</span><span style="color:var(--red);font-weight:700">'+esc(c.hp)+'</span></div>';
    if(c.pokemon_type)h+='<div class="dr"><span class="dl">타입</span><span>'+typeIcon(c.pokemon_type)+' '+esc(c.pokemon_type)+'</span></div>';
    if(c.weakness_type)h+='<div class="dr"><span class="dl">약점</span><span>'+typeIcon(c.weakness_type)+' '+esc(c.weakness_type)+(c.weakness_mult?' ×'+c.weakness_mult:'')+'</span></div>';
    if(c.resist_type)h+='<div class="dr"><span class="dl">저항력</span><span>'+typeIcon(c.resist_type)+' '+esc(c.resist_type)+(c.resist_value?' −'+c.resist_value:'')+'</span></div>';
    if(typeof c.retreat==='number')h+='<div class="dr"><span class="dl">후퇴</span><span>'+'⚪'.repeat(c.retreat)+(c.retreat===0?'무료':'')+'</span></div>';
    if(c.skills&&c.skills.length){
      h+='<div style="margin-top:10px">';
      for(var i=0;i<c.skills.length;i++){
        var sk=c.skills[i];
        var costStr=(sk.cost||[]).map(typeIcon).join('');
        h+='<div style="padding:8px;background:var(--card);border:1px solid var(--cb);border-radius:8px;margin-bottom:6px">';
        h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:6px">';
        h+='<span style="font-family:var(--ft);font-size:.88rem">'+costStr+' '+esc(sk.name||'')+'</span>';
        if(sk.damage)h+='<span style="font-family:var(--ft);font-size:1.05rem;color:var(--red)">'+esc(sk.damage)+'</span>';
        h+='</div>';
        if(sk.text)h+='<p style="font-size:.72rem;color:var(--text2);margin-top:4px;line-height:1.5">'+esc(sk.text)+'</p>';
        h+='</div>';
      }
      h+='</div>';
    }
    if(c.flavor_text)h+='<p style="font-size:.7rem;color:var(--text3);margin-top:8px;font-style:italic;text-align:center">"'+esc(c.flavor_text)+'"</p>';
  }else if(c.card_class==='trainer'){
    if(c.trainer_subtype)h+='<div class="dr"><span class="dl">서브타입</span><span>'+esc(trainerSubLabel(c.trainer_subtype))+'</span></div>';
    if(c.effect_text){
      h+='<div style="margin-top:10px;padding:10px;background:rgba(255,203,5,.1);border-radius:10px;font-size:.78rem;color:var(--text2);line-height:1.6">'+esc(c.effect_text)+'</div>';
    }
  }else if(c.card_class==='energy'){
    if(c.effect_text){
      h+='<div style="margin-top:10px;padding:10px;background:rgba(61,192,236,.08);border-radius:10px;font-size:.78rem;color:var(--text2);line-height:1.6">'+esc(c.effect_text)+'</div>';
    }
  }else if(c.card_class==='stadium'){
    if(c.effect_text){
      h+='<div style="margin-top:10px;padding:10px;background:rgba(39,174,96,.08);border-radius:10px;font-size:.78rem;color:var(--text2);line-height:1.6">'+esc(c.effect_text)+'</div>';
    }
  }

  h+='<div class="acts" style="margin-top:14px">';
  if(owned){
    var qty=(D.collected[c.bs_code]&&D.collected[c.bs_code].qty)||1;
    h+='<button class="btn btn-g" onclick="changeQty(\''+esc(c.bs_code)+'\',-1)">−</button>';
    h+='<div style="flex:1;text-align:center;font-family:var(--ft);font-size:1rem;padding:8px">수집 '+qty+'장</div>';
    h+='<button class="btn btn-g" onclick="changeQty(\''+esc(c.bs_code)+'\',1)">＋</button>';
    h+='</div><div class="acts" style="margin-top:6px">';
    h+='<button class="btn btn-d" onclick="removeCard(\''+esc(c.bs_code)+'\')">수집 해제</button>';
  }else{
    h+='<button class="btn btn-p" onclick="addCard(\''+esc(c.bs_code)+'\')">📥 수집함에 추가</button>';
  }
  h+='</div>';
  $('mb').innerHTML=h;
  $('mo').className='mo show';
}
function typeIcon(t){
  var m={'풀':'🌿','불꽃':'🔥','물':'💧','번개':'⚡','초':'🔮','격투':'👊','악':'🌙','강철':'⚙️','드래곤':'🐉','무색':'⚪','요정':'🧚'};
  return m[t]||'';
}
function trainerSubLabel(s){
  return{item:'아이템',supporter:'서포터',fossil:'화석',tool:'포켓몬의 도구'}[s]||s;
}

function addCard(bs_code){
  if(!bs_code)return;
  D.collected[bs_code]={qty:1,collectedAt:Date.now()};
  sv();
  closeM();
  toast('✅ 수집함에 추가됨');
  if(_currentTab==='dex')renderDex();
  if(_currentTab==='coll')renderColl();
}
function removeCard(bs_code){
  delete D.collected[bs_code];
  sv();
  closeM();
  toast('🗑️ 수집 해제됨','#f39c12');
  if(_currentTab==='dex')renderDex();
  if(_currentTab==='coll')renderColl();
}
function changeQty(bs_code,delta){
  if(!D.collected[bs_code])return;
  var newQty=(D.collected[bs_code].qty||1)+delta;
  if(newQty<=0){removeCard(bs_code);return;}
  if(newQty>4){toast('한 덱에 최대 4장입니다','#f39c12');return;}
  D.collected[bs_code].qty=newQty;
  sv();
  showCardModal(dbByCode[bs_code]); /* 모달 갱신 */
}

/* ═══════════════════════════════════════════════════════════════
   🃏 수집 탭 (Collection)
   ═══════════════════════════════════════════════════════════════ */
var _collFilters={
  type:'all',     /* 풀/불꽃/물/번개/초/격투/악/강철/드래곤/무색 */
  stage:'all',    /* basic/stage1/stage2 */
  ex:'all',       /* normal/ex/mega */
  trainerSub:'all', /* item/supporter/fossil/tool */
  retreat:'all'   /* 0/1/2/3+ */
};

function setCollFilter(key,val,btn){
  _collFilters[key]=val;
  /* 같은 그룹 버튼들 active 갱신 */
  var grp=btn.parentNode.querySelectorAll('.fchip');
  for(var i=0;i<grp.length;i++)grp[i].classList.remove('active');
  btn.classList.add('active');
  renderColl();
}
function resetCollFilters(){
  _collFilters={type:'all',stage:'all',ex:'all',trainerSub:'all',retreat:'all'};
  renderColl();
}
function matchCollFilter(c){
  var f=_collFilters;
  if(f.type!=='all'&&c.pokemon_type!==f.type)return false;
  if(f.stage!=='all'){
    var ct=c.card_type||'';
    if(f.stage==='basic'&&ct.indexOf('기본')<0)return false;
    if(f.stage==='stage1'&&ct.indexOf('1진화')<0)return false;
    if(f.stage==='stage2'&&ct.indexOf('2진화')<0)return false;
  }
  if(f.ex!=='all'){
    var nm=c.name_kr||'';
    var isEx=/ex$/i.test(nm)||nm.indexOf(' ex')>=0;
    var isMega=nm.indexOf('메가')===0||nm.indexOf('M ')===0;
    if(f.ex==='normal'&&(isEx||isMega))return false;
    if(f.ex==='ex'&&(!isEx||isMega))return false;
    if(f.ex==='mega'&&!isMega)return false;
  }
  if(f.trainerSub!=='all'&&c.trainer_subtype!==f.trainerSub)return false;
  if(f.retreat!=='all'){
    var r=c.retreat;
    if(f.retreat==='3'&&!(r>=3))return false;
    else if(f.retreat!=='3'&&r!==parseInt(f.retreat,10))return false;
  }
  return true;
}
function renderColl(){
  if(!cardsDB.length){
    $('coll-r').innerHTML='<div class="loading"><div class="spinner"></div><p>카드 DB 로딩 중...</p></div>';
    return;
  }
  var codes=Object.keys(D.collected);
  if(codes.length===0){
    $('coll-r').innerHTML='<div class="empty"><div class="ei">🃏</div><p>아직 수집한 카드가 없어요!<br><span style="font-size:.72rem">📚 도감 탭에서 카드를 추가해보세요</span></p></div>';
    return;
  }
  /* 수집 카드 → 풀 데이터로 hydrate */
  var collCards=[];
  for(var i=0;i<codes.length;i++){
    var c=dbByCode[codes[i]];
    if(c)collCards.push(c);
  }
  /* 필터 적용 */
  var filtered=collCards.filter(matchCollFilter);
  /* 종류별 카운트 */
  var byClass={pokemon:0,trainer:0,energy:0,stadium:0};
  for(var k=0;k<collCards.length;k++){
    var cc=collCards[k];
    if(byClass.hasOwnProperty(cc.card_class))byClass[cc.card_class]++;
  }
  var totalQty=0;
  for(var bc in D.collected)if(D.collected.hasOwnProperty(bc))totalQty+=(D.collected[bc].qty||1);

  /* 헤더 */
  var h='<div class="coll-summary">';
  h+='<div class="cs-row"><b>'+collCards.length.toLocaleString()+'</b>종 · 총 '+totalQty.toLocaleString()+'장</div>';
  h+='<div class="cs-breakdown">🐾 '+byClass.pokemon+' · 🎫 '+byClass.trainer+' · ⚡ '+byClass.energy+' · 🏟️ '+byClass.stadium+'</div>';
  h+='</div>';

  /* 필터 칩 */
  h+='<details class="coll-filters" id="coll-filt"><summary>🔍 필터 ('+filtered.length+'/'+collCards.length+'장 표시)</summary>';
  h+='<div class="fgroup"><div class="fl">속성</div><div class="frow">';
  h+=fchip('type','all','전체');
  ['풀','불꽃','물','번개','초','격투','악','강철','드래곤','무색'].forEach(function(t){
    h+=fchip('type',t,typeIcon(t)+' '+t);
  });
  h+='</div></div>';
  h+='<div class="fgroup"><div class="fl">진화</div><div class="frow">';
  h+=fchip('stage','all','전체')+fchip('stage','basic','기본')+fchip('stage','stage1','1진화')+fchip('stage','stage2','2진화');
  h+='</div></div>';
  h+='<div class="fgroup"><div class="fl">ex</div><div class="frow">';
  h+=fchip('ex','all','전체')+fchip('ex','normal','일반')+fchip('ex','ex','ex')+fchip('ex','mega','메가 ex');
  h+='</div></div>';
  h+='<div class="fgroup"><div class="fl">트레이너</div><div class="frow">';
  h+=fchip('trainerSub','all','전체')+fchip('trainerSub','item','아이템')+fchip('trainerSub','supporter','서포터')+fchip('trainerSub','tool','도구')+fchip('trainerSub','fossil','화석');
  h+='</div></div>';
  h+='<div class="fgroup"><div class="fl">후퇴</div><div class="frow">';
  h+=fchip('retreat','all','전체')+fchip('retreat','0','0')+fchip('retreat','1','1')+fchip('retreat','2','2')+fchip('retreat','3','3+');
  h+='</div></div>';
  h+='<button class="btn btn-g" style="margin-top:8px;width:100%" onclick="resetCollFilters()">필터 초기화</button>';
  h+='</details>';

  /* 카드 그리드 */
  if(filtered.length===0){
    h+='<div class="empty"><div class="ei">🔍</div><p>필터 조건에 맞는 카드 없음</p></div>';
  }else{
    h+='<div class="dgrid">';
    for(var m=0;m<filtered.length;m++){
      var fc=filtered[m];
      var img=fc.image_url||placeholderImg(fc.name_kr);
      var qty=(D.collected[fc.bs_code]&&D.collected[fc.bs_code].qty)||1;
      h+='<div class="dc owned" data-bs="'+esc(fc.bs_code)+'">';
      if(qty>1)h+='<div class="ob" style="background:var(--accent2);color:#333">×'+qty+'</div>';
      else h+='<div class="ob">✓</div>';
      h+='<img src="'+esc(img)+'" alt="'+esc(fc.name_kr||'')+'" loading="lazy" onerror="this.src=\''+placeholderImg(fc.name_kr)+'\'">';
      h+='<div class="nm">'+esc(fc.name_kr||'')+'</div>';
      h+='</div>';
    }
    h+='</div>';
  }

  $('coll-r').innerHTML=h;
  /* 클릭 핸들러 */
  var els=$('coll-r').querySelectorAll('.dc');
  for(var n=0;n<els.length;n++){
    (function(el){
      el.addEventListener('click',function(){
        showCardModal(dbByCode[el.dataset.bs]);
      });
    })(els[n]);
  }
}
function fchip(key,val,label){
  var active=_collFilters[key]===val;
  return'<button class="fchip'+(active?' active':'')+'" onclick="setCollFilter(\''+key+'\',\''+esc(val)+'\',this)">'+esc(label)+'</button>';
}

/* ═══════════════════════════════════════════════════════════════
   🏗️ 덱 탭 (placeholder + 시판 덱 카탈로그)
   ═══════════════════════════════════════════════════════════════ */
function renderDeckTab(){
  /* 시판 덱은 정적이라 한 번만 렌더 */
  if($('deck-r').dataset.rendered)return;
  var h='<div class="deck-notice">';
  h+='<div style="font-family:var(--ft);font-size:1rem;color:var(--accent);margin-bottom:6px">🚧 덱 빌더 개발 중</div>';
  h+='<p style="font-size:.78rem;color:var(--text2);line-height:1.6">속성을 선택하면 마스터의 수집 카드 중에서 60장 풀덱 / 30장 하프덱을 자동 구성해드릴 예정이에요. 세션 9에서 본격 구현됩니다. 지금은 수집 카드를 늘려주세요!</p>';
  h+='</div>';
  h+='<div class="st" style="margin-top:18px">📦 시판 덱 카탈로그</div>';
  h+='<p style="font-size:.72rem;color:var(--text3);margin-bottom:10px">참고용 — 실제 구성을 보고 어떤 카드가 강한지 익혀보세요</p>';
  h+='<div id="preset-list"></div>';
  $('deck-r').innerHTML=h;
  $('deck-r').dataset.rendered='1';
  if(typeof PRESET_DECKS!=='undefined'){
    var pl=$('preset-list'),ph='';
    for(var i=0;i<PRESET_DECKS.length;i++){
      var p=PRESET_DECKS[i];
      var cnt=0;
      if(p.cards)for(var j=0;j<p.cards.length;j++)cnt+=p.cards[j].q||0;
      ph+='<div class="preset-card" onclick="showPresetDetail('+i+')"><div><div class="pn">'+esc(p.type||'')+' '+esc(p.name||'')+'</div><div class="pt">'+cnt+'장 구성</div></div><div class="btn btn-s btn-b">보기</div></div>';
    }
    pl.innerHTML=ph;
  }
}
function showPresetDetail(idx){
  var p=PRESET_DECKS[idx];
  if(!p)return;
  var h='<h3>'+esc(p.type||'')+' '+esc(p.name||'')+'</h3>';
  h+='<p style="font-size:.75rem;color:var(--text3);text-align:center;margin-bottom:12px">시판 덱 구성 (참고용)</p>';
  h+='<div style="background:var(--bg3);border-radius:10px;padding:10px;font-size:.82rem">';
  if(p.cards){
    for(var i=0;i<p.cards.length;i++){
      var card=p.cards[i];
      h+='<div style="padding:5px 0;border-bottom:1px solid var(--cb);display:flex;justify-content:space-between"><span>'+esc(card.name||'')+'</span><span style="color:var(--text3)">×'+(card.q||1)+'</span></div>';
    }
  }
  h+='</div>';
  $('mb').innerHTML=h;
  $('mo').className='mo show';
}

/* ═══════════════════════════════════════════════════════════════
   📦 PRESET DECKS (기존 데이터 보존, 덱 카탈로그용)
   ═══════════════════════════════════════════════════════════════ */
var PRESET_DECKS=[
  {type:'스타터',name:'리자몽 ex',cards:[
    {name:'파이리',q:4},{name:'리자드',q:3},{name:'리자몽 ex',q:3},
    {name:'박사의 연구',q:4},{name:'몬스터볼',q:4},{name:'하이퍼볼',q:3},
    {name:'불꽃 에너지',q:14}
  ]},
  {type:'스타터',name:'팽도리 덱',cards:[
    {name:'팽도리',q:4},{name:'팽태자',q:3},{name:'엠페르트',q:2},
    {name:'박사의 연구',q:4},{name:'몬스터볼',q:4},
    {name:'물 에너지',q:13}
  ]},
  {type:'대회',name:'미라이돈 ex',cards:[
    {name:'미라이돈 ex',q:4},{name:'레지엘레키 VMAX',q:2},
    {name:'박사의 연구',q:4},{name:'네스트볼',q:4},{name:'얼티메이트볼',q:3},
    {name:'번개 에너지',q:13}
  ]}
];

/* ═══════════════════════════════════════════════════════════════
   📸 스캔 탭 (UI 보존, 세션 8 본구현 대기)
   ═══════════════════════════════════════════════════════════════ */
var _scanStream=null,_scanFacing='environment';

function startScan(){
  $('scanFs').className='scan-fs on';
  openCamera();
}
function openCamera(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    toast('카메라를 지원하지 않는 브라우저입니다','#e74c3c');
    stopScan();
    return;
  }
  navigator.mediaDevices.getUserMedia({
    video:{facingMode:_scanFacing,width:{ideal:1920},height:{ideal:1080}},
    audio:false
  }).then(function(stream){
    _scanStream=stream;
    var v=$('scanVideo');
    v.srcObject=stream;
    v.play();
  }).catch(function(e){
    toast('카메라 접근 실패: '+(e.message||e),'#e74c3c');
    stopScan();
  });
}
function flipCamera(){
  _scanFacing=(_scanFacing==='environment')?'user':'environment';
  if(_scanStream){_scanStream.getTracks().forEach(function(t){t.stop();});}
  openCamera();
}
function stopScan(){
  if(_scanStream){_scanStream.getTracks().forEach(function(t){t.stop();});_scanStream=null;}
  $('scanFs').className='scan-fs';
}
function captureCard(){
  toast('📸 스캔 기능은 세션 8에서 구현 예정','#f39c12');
}
function retakeScan(){stopScan();}
function toggleModelMenu(){toast('모델 선택은 세션 8에서 구현 예정','#f39c12');}

/* ═══════════════════════════════════════════════════════════════
   🚀 Init
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',function(){
  loadDB().then(function(){
    /* DB 로드 후 현재 활성 탭이 도감/수집이면 다시 렌더 */
    if(_currentTab==='dex')renderDex();
    if(_currentTab==='coll')renderColl();
  });
});
