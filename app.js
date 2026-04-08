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
   📸 스캔 탭 — 카메라 + Claude Vision 본구현 (세션 8)
   ═══════════════════════════════════════════════════════════════ */

/* ─── Worker / Model 설정 ─── */
/* 두 개의 워커:
   1차 (PRIMARY): Cloudflare Worker — 빠르지만 가끔 HKG colo로 빠지면 Anthropic에서 차단됨
   2차 (FALLBACK): Vercel Edge Function (hnd1 도쿄 region 고정) — Cloudflare 실패 시 자동 전환
   세션 9에서 Vercel 백업 추가. 모델 폴백은 여전히 없음 (같은 모델로 다른 워커 시도). */
var WORKER_URL_PRIMARY='https://pokemon-tcg-proxy.sieun8475.workers.dev';
var WORKER_URL_FALLBACK='https://pokemon-tcg-proxy-vercel.vercel.app/api/proxy';
/* 호환성: 옛 이름 alias (혹시 다른 곳에서 참조할 경우) */
var WORKER_URL=WORKER_URL_PRIMARY;
var SCAN_MODELS_LIST=[
  {id:'claude-haiku-4-5',label:'Haiku 4.5',sub:'빠르고 저렴 (기본)'},
  {id:'claude-sonnet-4-5',label:'Sonnet 4.5',sub:'정확·약 5배 비용'}
];
var SCAN_MODEL_KEY='ptcg-scan-model';
function getCurrentScanModel(){
  try{
    var saved=localStorage.getItem(SCAN_MODEL_KEY);
    if(saved){
      for(var i=0;i<SCAN_MODELS_LIST.length;i++){
        if(SCAN_MODELS_LIST[i].id===saved)return SCAN_MODELS_LIST[i];
      }
    }
  }catch(e){}
  return SCAN_MODELS_LIST[0]; /* 기본 Haiku */
}
function setCurrentScanModel(id){
  try{localStorage.setItem(SCAN_MODEL_KEY,id);}catch(e){}
}

/* ─── 스캔 상태 ─── */
var _scanStream=null,_scanFacing='environment';
var _scanSessionCount=0;          /* 이번 세션에서 등록한 카드 수 */
var _scanShotDataUrl=null;        /* 마지막 촬영 base64 (data:image/jpeg;base64,...) */
var _scanCandidates=[];           /* 매칭된 DB 카드 객체 배열 */
var _scanSelectedIdx=0;           /* 선택된 후보 index */
var _scanSelectedQty=1;           /* 등록할 수량 */
var _scanProvider=null;           /* 'sonnet' | 'haiku' — 마지막 응답 모델 */
var _scanBusy=false;              /* 인식 진행 중 플래그 (중복 촬영 방지) */
var _scanManualMode=false;        /* 수동 검색 모드 ON/OFF */
var _scanLastError=null;          /* 마지막 에러 정보 (디버그 박스용) {message, debug} */

/* ─── 진입/종료 ─── */
function startScan(){
  _scanSessionCount=0;
  updateScanCount();
  $('scanFs').className='scan-fs on';
  setScanModelBadge();
  updateScanPreprocessBadge();
  openCamera();
}

/* ─── 빛번짐 보정 토글 (HUD 배지) ─── */
function updateScanPreprocessBadge(){
  var el=$('scanPreprocessBadge');
  if(!el)return;
  var on=getScanPreprocess();
  el.textContent='🔆 빛번짐 '+(on?'ON':'OFF');
  el.className='scan-preprocess-badge'+(on?' on':' off');
}
function toggleScanPreprocess(){
  var next=!getScanPreprocess();
  setScanPreprocess(next);
  updateScanPreprocessBadge();
  toast('빛번짐 보정 '+(next?'ON':'OFF'),next?'#27ae60':'#7f8c8d');
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
  $('scanResult').className='scan-result';
  $('scanLoading').className='scan-loading';
  var menu=$('scanModelMenu');
  if(menu)menu.className='scan-model-menu';
  _scanBusy=false;
  _scanManualMode=false;
  /* 종료 시 활성 탭 갱신 */
  if(_scanSessionCount>0){
    if(_currentTab==='coll')renderColl();
    if(_currentTab==='dex')renderDex();
  }
}
function retakeScan(){
  /* 결과 패널 닫고 카메라로 복귀 (스트림은 그대로) */
  $('scanResult').className='scan-result';
  _scanBusy=false;
  _scanManualMode=false;
}
function closeScanResult(){retakeScan();}

/* ─── UI 헬퍼 ─── */
function updateScanCount(){
  var el=$('scanCount');
  if(el)el.textContent=_scanSessionCount+'장';
}
function setScanModelBadge(){
  /* 현재 선택된 모델로 배지 표시 */
  var el=$('scanModelBadge');
  if(!el)return;
  var m=getCurrentScanModel();
  el.textContent=m.label;
  el.className='scan-model-badge'+(m.id==='claude-sonnet-4-5'?' premium':'');
}
function showScanLoading(msg){
  $('scanLoadingMsg').textContent=msg||'카드 인식 중...';
  $('scanLoading').className='scan-loading on';
}
function hideScanLoading(){
  $('scanLoading').className='scan-loading';
}

/* ─── 핵심: 촬영 → 인식 → 결과 표시 ─── */
function captureCard(){
  if(_scanBusy){return;}
  if(!_scanStream){toast('카메라가 활성화되지 않았습니다','#e74c3c');return;}
  _scanBusy=true;

  var v=$('scanVideo');
  if(!v.videoWidth||!v.videoHeight){
    toast('카메라 준비 중입니다. 잠시 후 다시','#f39c12');
    _scanBusy=false;
    return;
  }

  /* 비디오 → canvas (scan-frame 영역만 crop) */
  var dataUrl;
  try{
    dataUrl=cropVideoToCardFrame(v);
  }catch(e){
    toast('촬영 실패: '+(e.message||e),'#e74c3c');
    _scanBusy=false;
    return;
  }
  _scanShotDataUrl=dataUrl;

  /* 셔터 피드백 */
  var sh=$('scanShutter');
  if(sh){sh.style.opacity='.5';setTimeout(function(){sh.style.opacity='1';},150);}

  /* 인식 시작 */
  var curModel=getCurrentScanModel();
  showScanLoading(curModel.label+'(으)로 카드 인식 중...');
  recognizeCard(dataUrl).then(function(result){
    hideScanLoading();
    _scanProvider=result.provider;
    setScanModelBadge();
    console.log('[Scan] success',result.modelLabel,result.debug);

    /* 매칭 시도 */
    var matched=matchCandidatesToDB(result.candidates);
    showScanResult(matched,dataUrl,result);
  }).catch(function(err){
    hideScanLoading();
    _scanBusy=false;
    var msg=err&&err.message?err.message:String(err);
    console.error('[Scan] FAILED',msg,err.debug);
    toast('❌ 인식 실패','#e74c3c');
    /* 에러 시에도 결과 패널을 띄워 디버그 정보 + 수동 검색 옵션 제공 */
    showScanResult([],dataUrl,{candidates:[],provider:null,error:msg,debug:err.debug||null});
  });
}

/* ─── 빛번짐 보정 토글 (localStorage) ─── */
var SCAN_PREPROCESS_KEY='ptcg-scan-preprocess';
function getScanPreprocess(){
  var v=localStorage.getItem(SCAN_PREPROCESS_KEY);
  if(v===null)return true;  /* 기본 ON */
  return v==='1';
}
function setScanPreprocess(on){
  localStorage.setItem(SCAN_PREPROCESS_KEY,on?'1':'0');
}

/* ─── 마지막 스캔의 전처리 메타 (디버그 박스 표시용) ─── */
var _lastPreprocessMeta=null;  /* {on, sat, gamma, ms} */

/* ─── 이미지 전처리 (프리즘/홀로 카드 빛번짐 대응)
   1) 채도 감소 (S=0.4)  — 무지개 홀로 패턴 죽여서 OCR이 텍스트에 집중
   2) 감마 보정 (γ=0.75) — 빛번짐 영역의 텍스트 가시성 향상
   픽셀 루프 한 번에 두 작업 함께 처리. */
function applyImagePreprocessing(ctx,w,h){
  var t0=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  var SAT=0.4;       /* 0=완전 흑백, 1=원본 */
  var GAMMA=0.75;    /* <1 = 어두운 부분을 더 어둡게(텍스트 강조) */
  var invG=1/GAMMA;
  /* 256-entry LUT 미리 계산 → 픽셀당 pow() 호출 제거 (모바일 성능) */
  var lut=new Uint8ClampedArray(256);
  for(var i=0;i<256;i++){
    lut[i]=Math.round(Math.pow(i/255,invG)*255);
  }
  var imageData=ctx.getImageData(0,0,w,h);
  var data=imageData.data;
  var len=data.length;
  for(var p=0;p<len;p+=4){
    var r=data[p],g=data[p+1],b=data[p+2];
    /* 1) 채도 감소 — luminance 기준 lerp */
    var lum=0.299*r+0.587*g+0.114*b;
    r=lum+(r-lum)*SAT;
    g=lum+(g-lum)*SAT;
    b=lum+(b-lum)*SAT;
    /* 2) 감마 보정 — LUT lookup (clamp 0~255) */
    var ri=r<0?0:(r>255?255:r|0);
    var gi=g<0?0:(g>255?255:g|0);
    var bi=b<0?0:(b>255?255:b|0);
    data[p]=lut[ri];
    data[p+1]=lut[gi];
    data[p+2]=lut[bi];
    /* alpha (data[p+3]) 는 그대로 */
  }
  ctx.putImageData(imageData,0,0);
  var t1=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  _lastPreprocessMeta={on:true,sat:SAT,gamma:GAMMA,ms:Math.round(t1-t0)};
}

/* ─── 비디오 → scan-frame 영역 crop → JPEG base64 ─── */
function cropVideoToCardFrame(video){
  var vw=video.videoWidth,vh=video.videoHeight;
  /* video DOM 표시 영역 (object-fit:cover 기준) */
  var rect=video.getBoundingClientRect();
  var dispW=rect.width,dispH=rect.height;
  /* object-fit:cover scale 계산 */
  var scale=Math.max(dispW/vw,dispH/vh);
  var srcW=dispW/scale,srcH=dispH/scale;
  var srcX=(vw-srcW)/2,srcY=(vh-srcH)/2;
  /* scan-frame DOM 위치 → 비디오 표시 좌표계 */
  var frameEl=document.querySelector('.scan-frame');
  if(!frameEl)throw new Error('scan-frame 요소 없음');
  var fr=frameEl.getBoundingClientRect();
  var fx=(fr.left-rect.left)/dispW;  /* 0~1 */
  var fy=(fr.top-rect.top)/dispH;
  var fw=fr.width/dispW;
  var fh=fr.height/dispH;
  /* 비디오 원본 좌표로 변환 */
  var cx=srcX+fx*srcW,cy=srcY+fy*srcH;
  var cw=fw*srcW,ch=fh*srcH;
  /* 약간의 패딩 (5%) 추가해서 잘림 방지 */
  var padX=cw*0.05,padY=ch*0.05;
  cx=Math.max(0,cx-padX);cy=Math.max(0,cy-padY);
  cw=Math.min(vw-cx,cw+2*padX);ch=Math.min(vh-cy,ch+2*padY);
  /* canvas 출력 — 긴 변 1024px 제한 (토큰 절약) */
  var maxSide=1024;
  var ratio=Math.min(1,maxSide/Math.max(cw,ch));
  var outW=Math.round(cw*ratio),outH=Math.round(ch*ratio);
  var canvas=document.createElement('canvas');
  canvas.width=outW;canvas.height=outH;
  var ctx=canvas.getContext('2d');
  ctx.drawImage(video,cx,cy,cw,ch,0,0,outW,outH);
  /* ─── 전처리 (프리즘/홀로 카드 빛번짐 보정) — 토글 ON일 때만 ─── */
  if(getScanPreprocess()){
    try{
      applyImagePreprocessing(ctx,outW,outH);
    }catch(e){
      console.warn('[Scan] preprocessing failed, using raw frame',e);
      _lastPreprocessMeta={on:true,error:String(e&&e.message||e)};
    }
  }else{
    _lastPreprocessMeta={on:false};
  }
  /* JPEG 품질: 전처리 효과 보존 위해 0.82 → 0.90 (세션 10) */
  return canvas.toDataURL('image/jpeg',0.90);
}

/* ─── Worker 호출 (현재 선택된 모델 단독 — 모델 폴백 없음, 워커 폴백만 있음) ─── */
function recognizeCard(dataUrl){
  /* dataUrl에서 base64만 추출 */
  var b64=dataUrl.replace(/^data:image\/jpeg;base64,/,'');
  var prompt=buildScanPrompt();
  /* 통합 디버그 */
  var model=getCurrentScanModel();
  var debugAll={model:model.label,startedAt:Date.now()};

  /* 선택된 모델로 워커 폴백 호출:
     1차 Cloudflare → 503/4xx/네트워크 에러 시 → 2차 Vercel.
     모델은 절대 자동 변경 안 함 (크레딧 절약 — 마스터 확정 사양). */
  return callWorkerWithFallback(model.id,b64,prompt).then(function(parsed){
    debugAll.attempts=parsed._debug?parsed._debug.attempts:[];
    debugAll.totalMs=Date.now()-debugAll.startedAt;
    return {candidates:parsed.candidates||[],provider:model.id,modelLabel:model.label,raw:parsed,debug:debugAll};
  }).catch(function(err){
    debugAll.attempts=err.debug?err.debug.attempts:[];
    debugAll.error=err.message;
    debugAll.totalMs=Date.now()-debugAll.startedAt;
    err.debug=debugAll;
    throw err;
  });
}

/* ─── 워커 폴백 호출 (1차 Cloudflare → 2차 Vercel) ─── */
/* 세션 9에서 추가. 1차 워커가 실패하면 자동으로 2차 시도.
   - 모델 폴백은 없음 (같은 모델로 다른 워커만 시도)
   - 재시도는 1회 (1차 실패 → 2차 1회만)
   - attempts[]에 두 번 모두 기록 → 디버그 패널에서 둘 다 보임
   - 폴백 트리거: 503, 5xx, 4xx (Anthropic 차단 포함), 네트워크 에러
     → 사실상 "1차 200 아니면 폴백". 모든 비-200 케이스에서 2차 시도.
   - 폴백도 실패하면 마지막(2차) 에러를 사용자에게 표시 (양쪽 attempts 모두 포함) */
function callWorkerWithFallback(modelId,b64,prompt){
  var combinedDebug={attempts:[]};
  /* 1차: Cloudflare */
  return callWorkerOnce(WORKER_URL_PRIMARY,'cloudflare',modelId,b64,prompt).then(function(parsed){
    /* 1차 성공 */
    if(parsed._debug&&parsed._debug.attempts){
      for(var i=0;i<parsed._debug.attempts.length;i++)combinedDebug.attempts.push(parsed._debug.attempts[i]);
    }
    parsed._debug=combinedDebug;
    return parsed;
  }).catch(function(err1){
    /* 1차 실패 → attempts 보존하고 2차 시도 */
    if(err1.debug&&err1.debug.attempts){
      for(var i=0;i<err1.debug.attempts.length;i++)combinedDebug.attempts.push(err1.debug.attempts[i]);
    }
    console.log('[Scan] primary failed, trying fallback Vercel:',err1.message);
    return callWorkerOnce(WORKER_URL_FALLBACK,'vercel',modelId,b64,prompt).then(function(parsed){
      /* 2차 성공 */
      if(parsed._debug&&parsed._debug.attempts){
        for(var j=0;j<parsed._debug.attempts.length;j++)combinedDebug.attempts.push(parsed._debug.attempts[j]);
      }
      parsed._debug=combinedDebug;
      return parsed;
    }).catch(function(err2){
      /* 2차도 실패 → 양쪽 attempts 합친 후 마지막 에러 throw */
      if(err2.debug&&err2.debug.attempts){
        for(var k=0;k<err2.debug.attempts.length;k++)combinedDebug.attempts.push(err2.debug.attempts[k]);
      }
      err2.debug=combinedDebug;
      /* 에러 메시지에 두 워커 모두 실패했음을 명시 */
      var combinedMsg='두 워커 모두 실패. 1차(Cloudflare): '+(err1.message||'?')+' / 2차(Vercel): '+(err2.message||'?');
      var combinedErr=new Error(combinedMsg);
      combinedErr.debug=combinedDebug;
      throw combinedErr;
    });
  });
}

/* ─── 단일 워커 단발 호출 (재시도 없음 — 크레딧 절약) ─── */
/* 세션 9에서 일반화: 워커 URL과 provider 라벨을 매개변수로 받음.
   각 attempt에 provider 정보가 포함되어 디버그 패널에서 어느 워커인지 표시 가능. */
function callWorkerOnce(workerUrl,provider,modelId,b64,prompt){
  /* 디버그 추적 정보 — 에러 시 사용자에게 표시 */
  var debugLog={attempts:[]};
  var attemptInfo={n:1,provider:provider,model:modelId,startedAt:Date.now()};
  var body={
    model:modelId,
    max_tokens:512,
    messages:[{
      role:'user',
      content:[
        {type:'image',source:{type:'base64',media_type:'image/jpeg',data:b64}},
        {type:'text',text:prompt}
      ]
    }]
  };
  return fetch(workerUrl,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  }).then(function(res){
    var status=res.status;
    attemptInfo.status=status;
    /* Cloudflare는 X-Worker-Colo, Vercel은 X-Vercel-Region 사용 */
    if(provider==='cloudflare'){
      attemptInfo.colo=res.headers.get('X-Worker-Colo')||'?';
    }else{
      attemptInfo.region=res.headers.get('X-Vercel-Region')||'?';
    }
    attemptInfo.upstreamMs=res.headers.get('X-Upstream-Elapsed-Ms')||null;
    attemptInfo.elapsed=Date.now()-attemptInfo.startedAt;
    return res.text().then(function(txt){
      attemptInfo.bodySnippet=txt.length>500?txt.slice(0,500)+'...':txt;
      debugLog.attempts.push(attemptInfo);
      console.log('[Scan]',JSON.stringify(attemptInfo));
      /* 모든 에러는 즉시 throw — 재시도 없음 (워커 폴백은 상위에서 처리) */
      if(status===503){
        var locStr=provider==='cloudflare'?('colo='+attemptInfo.colo):('region='+attemptInfo.region);
        var err503=new Error('Worker 라우팅 실패 ('+locStr+'). HKG 차단 가능성');
        err503.debug=debugLog;
        throw err503;
      }
      if(status>=500){
        var locStr2=provider==='cloudflare'?('colo='+attemptInfo.colo):('region='+attemptInfo.region);
        var err5xx=new Error('서버 오류 ('+status+', '+locStr2+')');
        err5xx.debug=debugLog;
        throw err5xx;
      }
      if(status===429){
        var err429=new Error('요청 한도 초과 (1분 후 재시도)');
        err429.debug=debugLog;
        throw err429;
      }
      if(status>=400){
        var errMsg='HTTP '+status;
        try{var ej=JSON.parse(txt);if(ej.error){errMsg+=': '+(ej.error.message||ej.error.type||JSON.stringify(ej.error));}}catch(e){}
        var err4xx=new Error(errMsg);
        err4xx.debug=debugLog;
        throw err4xx;
      }
      /* 성공 — Anthropic 응답 파싱 */
      var data;
      try{data=JSON.parse(txt);}catch(e){
        var errParse=new Error('응답 JSON 파싱 실패');
        errParse.debug=debugLog;
        throw errParse;
      }
      try{
        var parsed=parseAnthropicResponse(data);
        parsed._debug=debugLog;
        return parsed;
      }catch(eParse){
        eParse.debug=debugLog;
        throw eParse;
      }
    });
  }).catch(function(netErr){
    /* fetch 자체 실패 (네트워크 에러) */
    if(!attemptInfo.status){
      attemptInfo.status='fetch-fail';
      attemptInfo.error=netErr.message||String(netErr);
      attemptInfo.elapsed=Date.now()-attemptInfo.startedAt;
      debugLog.attempts.push(attemptInfo);
      console.log('[Scan]',JSON.stringify(attemptInfo));
    }
    if(!netErr.debug)netErr.debug=debugLog;
    throw netErr;
  });
}

/* ─── Anthropic content[] 에서 type='text' 추출 + JSON 파싱 ─── */
function parseAnthropicResponse(data){
  var txt='';
  if(data.content&&data.content.length){
    for(var i=0;i<data.content.length;i++){
      if(data.content[i].type==='text'){txt=data.content[i].text;break;}
    }
  }
  if(!txt)throw new Error('응답에 텍스트가 없습니다');
  /* 코드펜스 제거 */
  txt=txt.replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```\s*$/,'').trim();
  /* 첫 { 부터 마지막 } 까지만 추출 (앞뒤 잡설 방어) */
  var s=txt.indexOf('{'),e=txt.lastIndexOf('}');
  if(s>=0&&e>s)txt=txt.slice(s,e+1);
  var parsed;
  try{parsed=JSON.parse(txt);}catch(err){throw new Error('카드 정보 파싱 실패: '+err.message);}
  if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.candidates)){
    throw new Error('응답 형식이 올바르지 않습니다');
  }
  return parsed;
}

/* ─── Claude용 한글 카드 식별 프롬프트 ─── */
function buildScanPrompt(){
  return '이 포켓몬 TCG 카드(한국판)를 식별해서 JSON으로만 답해주세요. 마크다운/코드펜스/설명 금지.\n\n'+
    '{"candidates":[\n'+
    '  {"name_kr":"한글 카드명","hp":null,"pack":"팩명 또는 코드","card_no":"카드번호","confidence":"high"}\n'+
    ']}\n\n'+
    '규칙:\n'+
    '- name_kr: 카드 상단의 한글 이름 그대로 (예: "리자몽 ex", "페이검", "박사의 연구")\n'+
    '- 진화 단계 보조 텍스트("1단계 진화" 등)는 무시\n'+
    '- ex/V/VMAX/MEGA/테라스탈 같은 접미사는 포함\n'+
    '- hp: 포켓몬 카드만 우상단 HP 숫자 (정수), 트레이너/에너지는 null\n'+
    '- pack: 카드 우하단의 팩 한글명 또는 팩 코드(예: "M3", "SV1A")\n'+
    '- card_no: 우하단 "001/100" 형식 그대로\n'+
    '- 최대 3개 후보를 confidence 높은 순으로 (high/medium/low)\n'+
    '- 카드가 안 보이거나 읽을 수 없으면 candidates를 빈 배열 []로\n'+
    '- 일본판/영문판이면 한글로 가장 가까운 이름으로 추정 + confidence를 low로';
}

/* ─── 후보 → 한글 DB 매칭 (3단계 fallback) ─── */
function matchCandidatesToDB(candidates){
  if(!candidates||!candidates.length)return [];
  var results=[];
  var seen={};
  for(var i=0;i<candidates.length;i++){
    var cand=candidates[i];
    if(!cand||!cand.name_kr)continue;
    var matches=findCardsInDB(cand);
    for(var j=0;j<matches.length;j++){
      var m=matches[j];
      if(seen[m.bs_code])continue;
      seen[m.bs_code]=true;
      results.push({
        card:m,
        confidence:cand.confidence||'medium',
        candidateName:cand.name_kr
      });
      if(results.length>=3)break;
    }
    if(results.length>=3)break;
  }
  return results;
}

function findCardsInDB(cand){
  if(!cardsDB||!cardsDB.length)return [];
  var name=String(cand.name_kr||'').trim();
  if(!name)return [];

  /* 1단계: 정확 일치 */
  var exact=cardsDB.filter(function(c){return c.name_kr===name;});
  if(exact.length){
    return narrowByMeta(exact,cand);
  }

  /* 2단계: 부분 일치 (양방향) */
  var partial=cardsDB.filter(function(c){
    if(!c.name_kr)return false;
    return c.name_kr.indexOf(name)>=0||name.indexOf(c.name_kr)>=0;
  });
  if(partial.length){
    return narrowByMeta(partial,cand).slice(0,5);
  }

  /* 3단계: 공백/특수문자 제거 후 부분 일치 */
  var norm=name.replace(/[\s\-·.]/g,'');
  var loose=cardsDB.filter(function(c){
    if(!c.name_kr)return false;
    var n=c.name_kr.replace(/[\s\-·.]/g,'');
    return n.indexOf(norm)>=0||norm.indexOf(n)>=0;
  });
  return narrowByMeta(loose,cand).slice(0,3);
}

function narrowByMeta(list,cand){
  /* HP / pack_code / card_no 로 좁히기 */
  if(list.length<=1)return list;
  var filtered=list;

  /* HP 일치 우선 (포켓몬만) */
  if(cand.hp!=null&&!isNaN(parseInt(cand.hp,10))){
    var hpVal=parseInt(cand.hp,10);
    var hpMatch=filtered.filter(function(c){return c.hp===hpVal;});
    if(hpMatch.length)filtered=hpMatch;
  }

  /* pack_code 부분 일치 */
  if(cand.pack&&filtered.length>1){
    var pk=String(cand.pack).toUpperCase();
    var packMatch=filtered.filter(function(c){
      var code=(c.pack_code||'').toUpperCase();
      var name=(c.pack_name_kr||'');
      return code===pk||code.indexOf(pk)>=0||pk.indexOf(code)>=0||name.indexOf(cand.pack)>=0;
    });
    if(packMatch.length)filtered=packMatch;
  }

  /* card_no 일치 */
  if(cand.card_no&&filtered.length>1){
    var cn=String(cand.card_no).split('/')[0].replace(/^0+/,'');
    var noMatch=filtered.filter(function(c){
      return String(c.card_no||'').replace(/^0+/,'')===cn;
    });
    if(noMatch.length)filtered=noMatch;
  }

  return filtered;
}

/* ─── 결과 패널 렌더 ─── */
function showScanResult(matched,shotDataUrl,recogResult){
  _scanCandidates=matched;
  _scanSelectedIdx=0;
  _scanSelectedQty=1;
  _scanManualMode=false;
  /* 에러/디버그 정보 캐시 */
  if(recogResult&&(recogResult.error||recogResult.debug)){
    _scanLastError={
      message:recogResult.error||null,
      debug:recogResult.debug||null,
      provider:recogResult.provider||null
    };
  }else if(recogResult&&recogResult.debug){
    /* 성공 시에도 디버그는 보관 (사용자가 콘솔에서 확인 가능) */
    _scanLastError={message:null,debug:recogResult.debug,provider:recogResult.provider};
  }else{
    _scanLastError=null;
  }

  /* provider 배지 — 사용된 모델 표시 */
  var provEl=$('srProv');
  if(recogResult&&recogResult.modelLabel){
    provEl.textContent=recogResult.modelLabel;
    provEl.className='sr-prov'+(recogResult.provider==='claude-sonnet-4-5'?' premium':'');
  }else{
    provEl.textContent='';
    provEl.className='sr-prov';
  }

  renderScanResultBody();
  $('scanResult').className='scan-result on';
}

/* ─── 디버그 박스 HTML 빌드 ─── */
function buildDebugBoxHtml(){
  if(!_scanLastError||!_scanLastError.debug)return '';
  var dbg=_scanLastError.debug;
  var msg=_scanLastError.message;
  var html='<details class="sr-debug"'+(msg?' open':'')+'>';
  html+='<summary>'+(msg?'🔍 디버그 정보 (에러)':'🔍 디버그 정보')+'</summary>';
  html+='<div class="dbg-body">';

  if(msg){
    html+='<div class="dbg-row"><div class="dbg-k">에러 메시지</div><div class="dbg-v bad">'+esc(msg)+'</div></div>';
  }
  if(dbg.model){
    html+='<div class="dbg-row"><div class="dbg-k">사용 모델</div><div class="dbg-v">'+esc(dbg.model)+'</div></div>';
  }
  if(dbg.totalMs!=null){
    html+='<div class="dbg-row"><div class="dbg-k">총 소요</div><div class="dbg-v">'+dbg.totalMs+'ms</div></div>';
  }
  /* 전처리 정보 (세션 10) */
  if(_lastPreprocessMeta){
    var pm=_lastPreprocessMeta;
    var pv;
    if(pm.error){
      pv='ON (실패: '+esc(pm.error)+')';
    }else if(pm.on){
      pv='ON / 채도 '+pm.sat+' / γ '+pm.gamma+(pm.ms!=null?' / '+pm.ms+'ms':'');
    }else{
      pv='OFF';
    }
    html+='<div class="dbg-row"><div class="dbg-k">전처리</div><div class="dbg-v">'+pv+'</div></div>';
  }

  /* 시도들 (1회만) */
  if(dbg.attempts&&dbg.attempts.length){
    for(var i=0;i<dbg.attempts.length;i++){
      html+=renderAttemptRows(dbg.attempts[i],i+1);
    }
  }

  html+='<div class="dbg-row"><div class="dbg-k" style="color:rgba(255,255,255,.4);font-size:.65rem">DevTools Console에도 동일 정보 출력됨</div><div class="dbg-v"></div></div>';
  html+='</div></details>';
  return html;
}

function renderAttemptRows(att,idx){
  var statusClass='';
  if(typeof att.status==='number'){
    if(att.status>=200&&att.status<300)statusClass='good';
    else if(att.status>=400)statusClass='bad';
  }else statusClass='bad';
  /* provider 라벨 (세션 9): 어느 워커였는지 표시
     - cloudflare → "CF" + colo
     - vercel → "Vercel" + region */
  var providerLabel='';
  if(att.provider==='cloudflare')providerLabel='Cloudflare';
  else if(att.provider==='vercel')providerLabel='Vercel (백업)';
  var html='';
  html+='<div class="dbg-row"><div class="dbg-k">  시도 #'+idx+(providerLabel?' ('+providerLabel+')':'')+'</div><div class="dbg-v '+statusClass+'">HTTP '+att.status+'</div></div>';
  if(att.colo)html+='<div class="dbg-row"><div class="dbg-k">  colo</div><div class="dbg-v'+(att.colo==='HKG'?' bad':'')+'">'+esc(att.colo)+'</div></div>';
  if(att.region)html+='<div class="dbg-row"><div class="dbg-k">  region</div><div class="dbg-v">'+esc(att.region)+'</div></div>';
  if(att.upstreamMs)html+='<div class="dbg-row"><div class="dbg-k">  upstream</div><div class="dbg-v">'+att.upstreamMs+'ms</div></div>';
  if(att.elapsed!=null)html+='<div class="dbg-row"><div class="dbg-k">  total</div><div class="dbg-v">'+att.elapsed+'ms</div></div>';
  if(att.bodySnippet){
    html+='<div class="dbg-row"><div class="dbg-k">  body</div><div class="dbg-v"><pre>'+esc(att.bodySnippet)+'</pre></div></div>';
  }
  if(att.error){
    html+='<div class="dbg-row"><div class="dbg-k">  fetch err</div><div class="dbg-v bad">'+esc(att.error)+'</div></div>';
  }
  return html;
}

function renderScanResultBody(){
  var body=$('srBody');
  var html='';

  if(_scanShotDataUrl){
    html+='<img class="sr-shot" src="'+_scanShotDataUrl+'" alt="촬영 사진">';
  }

  if(_scanCandidates.length===0){
    /* 인식 실패 */
    html+='<div class="sr-empty">'+
      '<span class="em">🤔</span>'+
      '<div class="et">카드를 인식하지 못했어요</div>'+
      '<div class="es">밝은 곳에서 카드를 프레임에 가득 차게 맞추고<br>다시 촬영해보세요.</div>'+
      '</div>';
    html+='<div class="sr-actions">'+
      '<button class="sr-btn secondary" onclick="retakeScan()">📸 재촬영</button>'+
      '</div>';
    /* 디버그 박스 (에러 시 자동 펼침) */
    html+=buildDebugBoxHtml();
    html+='<div class="sr-manual-link"><a onclick="showManualSearch()">🔍 수동으로 검색하기</a></div>';
    body.innerHTML=html;
    return;
  }

  /* 후보 카드들 */
  html+='<div class="sr-section-label">후보 카드 (탭하여 선택)</div>';
  html+='<div class="sr-cands">';
  for(var i=0;i<_scanCandidates.length;i++){
    var m=_scanCandidates[i];
    var c=m.card;
    var img=c.image_url||placeholderImg(c.name_kr);
    var sel=(i===_scanSelectedIdx)?' sel':'';
    html+='<div class="sr-cand'+sel+'" onclick="selectScanCandidate('+i+')">'+
      '<img src="'+esc(img)+'" alt="'+esc(c.name_kr)+'" onerror="this.src=\''+placeholderImg(c.name_kr).replace(/'/g,'%27')+'\'">'+
      '<div class="cn">'+esc(c.name_kr)+'</div>'+
      '<div class="cs">'+esc(c.pack_code||'')+'</div>'+
      '</div>';
  }
  html+='</div>';

  /* 모든 후보가 low confidence면 경고 */
  var allLow=_scanCandidates.every(function(m){return m.confidence==='low';});
  if(allLow){
    html+='<div class="sr-low-warn">⚠️ 자신 없음 — 카드가 맞는지 확인해주세요</div>';
  }

  /* 선택된 카드 상세 */
  var sel=_scanCandidates[_scanSelectedIdx];
  if(sel){
    var c=sel.card;
    html+='<div class="sr-detail">';
    html+='<div class="dl">카드명</div><div class="dv">'+esc(c.name_kr)+(c.hp?' · HP '+c.hp:'')+'</div>';
    if(c.pack_full_kr||c.pack_name_kr){
      html+='<div class="dl">팩</div><div class="dv">📦 '+esc(c.pack_full_kr||c.pack_name_kr)+'</div>';
    }
    if(c.card_no){
      html+='<div class="dl">번호</div><div class="dv">'+esc(c.card_no)+'</div>';
    }
    /* 이미 수집한 카드인지 표시 */
    var existing=D.collected[c.bs_code];
    if(existing){
      html+='<div class="dl">현재 보유</div><div class="dv" style="color:#7dd3fc">✓ 이미 '+(existing.qty||1)+'장 수집됨</div>';
    }
    html+='</div>';

    /* 수량 */
    html+='<div class="sr-qty">'+
      '<button onclick="changeScanQty(-1)">−</button>'+
      '<span class="qv" id="srQtyVal">'+_scanSelectedQty+'</span>'+
      '<button onclick="changeScanQty(1)">+</button>'+
      '</div>';

    /* 액션 */
    html+='<div class="sr-actions">'+
      '<button class="sr-btn secondary" onclick="retakeScan()">↻ 재촬영</button>'+
      '<button class="sr-btn primary" onclick="confirmScanRegister()">✅ 등록</button>'+
      '</div>';
  }

  /* 디버그 박스 (성공 시 접힘) */
  html+=buildDebugBoxHtml();

  /* 수동 검색 링크 (항상 노출) */
  html+='<div class="sr-manual-link"><a onclick="showManualSearch()">🔍 다른 카드 수동 검색</a></div>';

  body.innerHTML=html;
}

function selectScanCandidate(idx){
  _scanSelectedIdx=idx;
  renderScanResultBody();
}

function changeScanQty(delta){
  var existing=0;
  var sel=_scanCandidates[_scanSelectedIdx];
  if(sel&&D.collected[sel.card.bs_code])existing=D.collected[sel.card.bs_code].qty||0;
  var newQty=_scanSelectedQty+delta;
  if(newQty<1){newQty=1;}
  if(existing+newQty>4){
    toast('한 덱에 최대 4장입니다','#f39c12');
    return;
  }
  _scanSelectedQty=newQty;
  $('srQtyVal').textContent=newQty;
}

function confirmScanRegister(){
  var sel=_scanCandidates[_scanSelectedIdx];
  if(!sel){toast('선택된 카드가 없습니다','#e74c3c');return;}
  var c=sel.card;
  var existing=D.collected[c.bs_code];
  var currentQty=existing?(existing.qty||0):0;
  var newQty=Math.min(4,currentQty+_scanSelectedQty);
  D.collected[c.bs_code]={
    qty:newQty,
    collectedAt:existing?existing.collectedAt:Date.now()
  };
  sv();
  _scanSessionCount++;
  updateScanCount();
  toast('✅ '+c.name_kr+' 추가됨 ('+newQty+'장)');
  /* 결과 패널 닫고 카메라 복귀 — 연속 스캔 */
  retakeScan();
}

/* ─── 수동 검색 모드 ─── */
function showManualSearch(){
  _scanManualMode=true;
  var body=$('srBody');
  var html='<div class="sr-section-label">🔍 수동 카드 검색</div>'+
    '<input type="text" class="sr-search-input" id="srSearchInput" placeholder="한글 카드명 입력 (예: 리자몽)" oninput="onManualSearchInput()">'+
    '<div class="sr-search-results" id="srSearchResults"></div>'+
    '<div class="sr-actions" style="margin-top:14px">'+
    '<button class="sr-btn secondary" onclick="retakeScan()">← 카메라로 돌아가기</button>'+
    '</div>';
  body.innerHTML=html;
  setTimeout(function(){var inp=$('srSearchInput');if(inp)inp.focus();},100);
}

var _manualSearchTimer=null;
function onManualSearchInput(){
  if(_manualSearchTimer)clearTimeout(_manualSearchTimer);
  _manualSearchTimer=setTimeout(runManualSearch,200);
}

function runManualSearch(){
  var inp=$('srSearchInput');
  if(!inp)return;
  var q=inp.value.trim();
  var resBox=$('srSearchResults');
  if(!q||q.length<1){resBox.innerHTML='';return;}
  var results=cardsDB.filter(function(c){
    return c.name_kr&&c.name_kr.indexOf(q)>=0;
  }).slice(0,30);
  if(results.length===0){
    resBox.innerHTML='<div style="text-align:center;color:rgba(255,255,255,.5);padding:20px;font-size:.8rem">검색 결과 없음</div>';
    return;
  }
  var html='';
  for(var i=0;i<results.length;i++){
    var c=results[i];
    var img=c.image_url||placeholderImg(c.name_kr);
    var meta=(c.pack_code||'')+(c.card_no?' · '+c.card_no:'')+(c.hp?' · HP '+c.hp:'');
    var existing=D.collected[c.bs_code];
    var existMark=existing?' ✓'+(existing.qty||1):'';
    html+='<div class="sr-search-item" onclick="selectManualResult(\''+esc(c.bs_code)+'\')">'+
      '<img src="'+esc(img)+'" alt="" onerror="this.style.opacity=0.3">'+
      '<div class="si-info">'+
      '<div class="si-name">'+esc(c.name_kr)+existMark+'</div>'+
      '<div class="si-meta">'+esc(meta)+'</div>'+
      '</div></div>';
  }
  resBox.innerHTML=html;
}

function selectManualResult(bs_code){
  var c=dbByCode[bs_code];
  if(!c){toast('카드를 찾을 수 없습니다','#e74c3c');return;}
  /* 선택된 카드를 후보 1개짜리 리스트로 만들어 일반 결과 흐름 재사용 */
  _scanCandidates=[{card:c,confidence:'manual',candidateName:c.name_kr}];
  _scanSelectedIdx=0;
  _scanSelectedQty=1;
  _scanManualMode=false;
  renderScanResultBody();
}

/* ─── 모델 선택 메뉴 ─── */
function toggleModelMenu(){
  var menu=$('scanModelMenu');
  if(!menu)return;
  if(menu.className.indexOf('on')>=0){
    menu.className='scan-model-menu';
    return;
  }
  /* 메뉴 동적 빌드 */
  var cur=getCurrentScanModel();
  var html='';
  for(var i=0;i<SCAN_MODELS_LIST.length;i++){
    var m=SCAN_MODELS_LIST[i];
    var sel=(m.id===cur.id)?' sel':'';
    html+='<div class="smm-item'+sel+'" onclick="selectScanModel(\''+m.id+'\')">'+
      '<div class="smm-radio">'+(m.id===cur.id?'●':'○')+'</div>'+
      '<div class="smm-info">'+
      '<div class="smm-label">'+esc(m.label)+'</div>'+
      '<div class="smm-sub">'+esc(m.sub||'')+'</div>'+
      '</div></div>';
  }
  menu.innerHTML=html;
  menu.className='scan-model-menu on';
}
function selectScanModel(id){
  setCurrentScanModel(id);
  setScanModelBadge();
  $('scanModelMenu').className='scan-model-menu';
  var m=getCurrentScanModel();
  toast('🤖 '+m.label+' 선택됨','#3dc0ec');
}

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
