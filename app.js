/* ═══════════════════════════════════════════════════════════════
   포켓몬 TCG 가이드 v4 — Korean DB Edition
   세션 7: 도감/수집 탭 전면 재설계
   ═══════════════════════════════════════════════════════════════ */

/* ═══ Constants ═══ */
var DB_URL='https://gengar200005.github.io/pokemon-tcg-guide/data/korean_cards_db.json';
var DB_VERSION='v4-1'; /* 캐시 무효화 키 */
/* 세션 14: 자동 빌드용 데이터 */
var EVOLUTION_URL='https://gengar200005.github.io/pokemon-tcg-guide/data/evolution_lines.json';
var TRAINER_CAT_URL='https://gengar200005.github.io/pokemon-tcg-guide/data/trainer_categories.json';
var EVOLUTION_VERSION='s14-1'; /* 세션 14 데이터 버전 */
var TRAINER_CAT_VERSION='s14-1';
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
var effectiveUid=null; /* 클라우드 읽기/쓰기에 사용할 UID — 가족 연결 시 부모 UID */

/* ═══ Local State ═══ */
var cardsDB=[]; /* 전체 카드 DB (메모리 캐시) */
var dbByCode={}; /* bs_code → card 빠른 lookup */
/* 세션 14: 자동 빌드용 상태 */
var evolutionLines=[]; /* evolution_lines.json 원본 */
var evolutionByCode={}; /* bs_code → {stage, evolvesFrom_kr, base_kr, ...} */
var evolutionForwardIndex={}; /* parent_name_kr → [자식카드 배열] — 정방향 진화 추적 */
var trainerCategories=[]; /* trainer_categories.json 원본 */
var trainerByCode={}; /* bs_code → {tags:[], subtype, ...} */
var trainerTagIndex={}; /* tag → [bs_code 배열] */
var D={collected:{},customDecksV1:[]}; /* { bs_code: {qty:1, collectedAt:ts} }, customDecksV1: 사용자 커스텀 덱 */
try{
  var _raw=localStorage.getItem(SK);
  if(_raw){var _p=JSON.parse(_raw);if(_p&&_p.collected){D=_p;if(!Array.isArray(D.customDecksV1))D.customDecksV1=[];}}
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
var _currentTab='dex';
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
var _returnToDeckId=null;
function closeM(){
  $('mo').className='mo';
  /* 카드 상세 → 덱 상세 자동 복귀 */
  if(_returnToDeckId){
    var rid=_returnToDeckId;
    _returnToDeckId=null;
    setTimeout(function(){viewDeckDetail(rid);},150);
  }
}
/* 덱 상세 모달 안에서 카드 행 탭 → 카드 상세 모달 띄우고 닫으면 덱으로 복귀 */
function openCardFromDeck(deckId,bc){
  var c=dbByCode[bc];
  if(!c){toast('카드 정보를 찾을 수 없어요','#e74c3c');return;}
  _returnToDeckId=deckId;
  showCardModal(c);
}

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
    var base='☁️ '+(currentUser.displayName||currentUser.email||'로그인됨');
    if(effectiveUid && effectiveUid!==currentUser.uid){
      base+=' · 👨‍👧 가족 공유중';
    }
    st.textContent=base;
  }else{
    lbl.textContent='Google 로그인';
    st.textContent='☁️ 로그인하면 클라우드 저장!';
  }
  var linkBtn=$('link-btn');
  if(linkBtn)linkBtn.style.display=currentUser?'inline-flex':'none';
}
/* 이메일 → UID 역색인 (가족 연결용). 로그인 시 본인 매핑을 기록 */
function ensureUserIndex(){
  if(!currentUser||!currentUser.email)return;
  var key=currentUser.email.toLowerCase();
  db.collection('userIndex').doc(key).set({
    uid:currentUser.uid,
    displayName:currentUser.displayName||'',
    updatedAt:firebase.firestore.FieldValue.serverTimestamp()
  },{merge:true}).catch(function(e){console.warn('userIndex fail',e);});
}
/* 현재 로그인 사용자가 부모 계정에 연결되어 있는지 확인하고 effectiveUid 결정 */
function resolveEffectiveUid(cb){
  if(!currentUser){effectiveUid=null;if(cb)cb();return;}
  db.collection('users').doc(currentUser.uid).get().then(function(doc){
    if(doc.exists&&doc.data().linkedParentUid){
      effectiveUid=doc.data().linkedParentUid;
    }else{
      effectiveUid=currentUser.uid;
    }
    if(cb)cb();
  }).catch(function(e){
    console.warn('resolveEffectiveUid fail',e);
    effectiveUid=currentUser.uid;
    if(cb)cb();
  });
}
auth.onAuthStateChanged(function(u){
  currentUser=u;
  if(u){
    ensureUserIndex();
    resolveEffectiveUid(function(){
      updateAuthUI();
      loadFromCloud();
    });
  }else{
    effectiveUid=null;
    updateAuthUI();
  }
});

/* ═══ 가족 계정 연결 (부모 이메일로 도감 공유) ═══ */
function openLinkModal(){
  if(!currentUser){toast('먼저 Google 로그인이 필요해요','#e74c3c');return;}
  var mb=$('mb');if(!mb)return;
  var linked=(effectiveUid&&effectiveUid!==currentUser.uid);
  var html='<h3>👨‍👧 가족 도감 공유</h3>';
  if(linked){
    html+='<p style="font-size:.82rem;line-height:1.55;color:var(--text2);text-align:center;margin:10px 0">이 계정은 현재 <b>부모 계정의 도감·덱을 공유</b>하고 있어요.<br>여기서 추가/수정한 내용은 부모 계정에도 그대로 반영돼요.</p>';
    html+='<div style="background:#eaf6fc;padding:10px 12px;border-radius:10px;margin:12px 0;font-size:.72rem;color:#35637a"><b>연결된 부모 UID</b><br><code style="font-size:.68rem;word-break:break-all">'+esc(effectiveUid)+'</code></div>';
    html+='<div class="acts"><button class="btn btn-g" onclick="closeM()">닫기</button><button class="btn btn-d" onclick="unlinkAccount()">🔓 연결 해제</button></div>';
  }else{
    html+='<p style="font-size:.82rem;line-height:1.55;color:var(--text2);text-align:center;margin:10px 0">부모님의 <b>Google 계정 이메일</b>을 입력하면<br>같은 도감·덱을 함께 사용할 수 있어요.</p>';
    html+='<div style="background:#fff4e0;padding:10px 12px;border-radius:10px;margin:10px 0;font-size:.72rem;color:#8b6000;line-height:1.5">⚠️ 부모님이 이 앱에 <b>먼저 Google 로그인</b>을 한 번 해야 찾을 수 있어요.<br>⚠️ 연결 후에는 이 계정의 기존 도감·덱 데이터는 부모 계정 데이터로 <b>대체</b>됩니다.</div>';
    html+='<input type="email" id="linkParentEmail" placeholder="부모님 이메일 (예: mom@gmail.com)" style="width:100%;padding:10px 12px;border:1.5px solid var(--cb);border-radius:10px;font-size:.9rem;margin:8px 0 14px;box-sizing:border-box" autocomplete="email">';
    html+='<div class="acts"><button class="btn btn-g" onclick="closeM()">취소</button><button class="btn btn-p" onclick="submitLinkParent()">🔗 연결하기</button></div>';
  }
  mb.innerHTML=html;
  $('mo').className='mo show';
  setTimeout(function(){var el=$('linkParentEmail');if(el)el.focus();},80);
}
function submitLinkParent(){
  if(!currentUser)return;
  var input=$('linkParentEmail');
  if(!input)return;
  var email=(input.value||'').trim().toLowerCase();
  if(!email||email.indexOf('@')<0){toast('올바른 이메일을 입력해 주세요','#e74c3c');return;}
  if(currentUser.email&&email===currentUser.email.toLowerCase()){
    toast('자기 자신과는 연결할 수 없어요','#e74c3c');return;
  }
  db.collection('userIndex').doc(email).get().then(function(doc){
    if(!doc.exists){
      toast('해당 이메일을 찾을 수 없어요. 부모님이 먼저 앱에 로그인해야 해요.','#e74c3c');
      return;
    }
    var parentUid=doc.data().uid;
    if(!parentUid){toast('매핑 정보가 잘못되었어요','#e74c3c');return;}
    if(parentUid===currentUser.uid){toast('자기 자신과는 연결할 수 없어요','#e74c3c');return;}
    db.collection('users').doc(currentUser.uid).set({
      linkedParentUid:parentUid,
      email:currentUser.email||'',
      displayName:currentUser.displayName||''
    },{merge:true}).then(function(){
      effectiveUid=parentUid;
      _localDirty=false;
      closeM();
      toast('✅ 가족 도감 연결 완료!','#2ecc71');
      updateAuthUI();
      loadFromCloud();
    }).catch(function(e){
      console.warn('link fail',e);
      toast('연결 실패: '+(e.message||e),'#e74c3c');
    });
  }).catch(function(e){
    console.warn('userIndex lookup fail',e);
    toast('조회 실패: '+(e.message||e),'#e74c3c');
  });
}
function unlinkAccount(){
  if(!currentUser)return;
  if(!confirm('가족 연결을 해제할까요?\n이 계정은 다시 자신의 (빈) 도감을 사용하게 돼요.\n부모 계정의 데이터는 그대로 남아있어요.'))return;
  db.collection('users').doc(currentUser.uid).set({
    linkedParentUid:firebase.firestore.FieldValue.delete()
  },{merge:true}).then(function(){
    effectiveUid=currentUser.uid;
    _localDirty=false;
    /* 로컬 D를 비워서 부모 데이터가 남지 않도록 */
    D.collected={};
    D.customDecksV1=[];
    try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}
    closeM();
    toast('🔓 가족 연결 해제됨','#e67e22');
    updateAuthUI();
    loadFromCloud();
    if(_currentTab==='coll')renderColl();
    if(_currentTab==='dex')renderDex();
    if(_currentTab==='deck'){var dr=$('deck-r');if(dr)dr.dataset.rendered='';renderDeckTab();}
  }).catch(function(e){
    console.warn('unlink fail',e);
    toast('해제 실패: '+(e.message||e),'#e74c3c');
  });
}

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
  if(!currentUser||!effectiveUid)return;
  /* v4 데이터는 별도 필드(collectedV4)로 저장 — 기존 v3 cards/decks는 건드리지 않음 */
  /* customDecksV1도 별도 필드 — v3 decks 절대 안 건드림 */
  /* 가족 연결 상태면 부모 문서(effectiveUid)에 씀. 부모 본인의 displayName/email은 덮어쓰지 않음 */
  var payload={
    collectedV4:D.collected,
    customDecksV1:D.customDecksV1||[],
    schemaVersion:'v4',
    updatedAtV4:firebase.firestore.FieldValue.serverTimestamp()
  };
  if(effectiveUid===currentUser.uid){
    payload.displayName=currentUser.displayName||'';
    payload.email=currentUser.email||'';
  }
  db.collection('users').doc(effectiveUid).set(payload,{merge:true}).then(function(){_localDirty=false;}).catch(function(e){console.warn('cloud save fail',e);});
}
function loadFromCloud(){
  if(!currentUser||!effectiveUid)return;
  db.collection('users').doc(effectiveUid).get().then(function(doc){
    if(doc.exists){
      var d=doc.data();
      if(d.collectedV4&&!_localDirty){
        D.collected=d.collectedV4||{};
        D.customDecksV1=Array.isArray(d.customDecksV1)?d.customDecksV1:(D.customDecksV1||[]);
        try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}
        if(_currentTab==='coll')renderColl();
        if(_currentTab==='dex')renderDex();
        if(_currentTab==='deck'){$('deck-r').dataset.rendered='';renderDeckTab();}
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
   🪄 세션 14: 자동 빌드 데이터 로딩 + 인덱스
   ═══════════════════════════════════════════════════════════════ */

/* evolution_lines.json 로딩 (IndexedDB 캐시) */
function loadEvolutionData(){
  return idbGet('evolution-'+EVOLUTION_VERSION).then(function(cached){
    if(cached&&cached.length){
      evolutionLines=cached;
      buildEvolutionIndexes();
      console.log('[AutoBuild] evolution_lines 캐시 로드: '+evolutionLines.length+'장');
      return;
    }
    return fetch(EVOLUTION_URL).then(function(r){
      if(!r.ok)throw new Error('evolution HTTP '+r.status);
      return r.json();
    }).then(function(data){
      evolutionLines=Array.isArray(data)?data:[];
      buildEvolutionIndexes();
      idbSet('evolution-'+EVOLUTION_VERSION,evolutionLines).catch(function(){});
      console.log('[AutoBuild] evolution_lines 다운로드: '+evolutionLines.length+'장');
    });
  }).catch(function(e){
    console.warn('[AutoBuild] evolution 로드 실패:',e.message||e);
    evolutionLines=[];
    evolutionByCode={};
    evolutionForwardIndex={};
  });
}

/* trainer_categories.json 로딩 (IndexedDB 캐시) */
function loadTrainerCategories(){
  return idbGet('trainerCat-'+TRAINER_CAT_VERSION).then(function(cached){
    if(cached&&cached.length){
      trainerCategories=cached;
      buildTrainerIndexes();
      console.log('[AutoBuild] trainer_categories 캐시 로드: '+trainerCategories.length+'장');
      return;
    }
    return fetch(TRAINER_CAT_URL).then(function(r){
      if(!r.ok)throw new Error('trainerCat HTTP '+r.status);
      return r.json();
    }).then(function(data){
      trainerCategories=Array.isArray(data)?data:[];
      buildTrainerIndexes();
      idbSet('trainerCat-'+TRAINER_CAT_VERSION,trainerCategories).catch(function(){});
      console.log('[AutoBuild] trainer_categories 다운로드: '+trainerCategories.length+'장');
    });
  }).catch(function(e){
    console.warn('[AutoBuild] trainerCat 로드 실패:',e.message||e);
    trainerCategories=[];
    trainerByCode={};
    trainerTagIndex={};
  });
}

/* 진화 인덱스 빌드:
   - evolutionByCode: bs_code → 진화 정보 (O(1) 조회)
   - evolutionForwardIndex: parent_name_kr → 자식 카드 배열 (정방향 추적)
     예) evolutionForwardIndex['파이리'] = [리자드 카드들..., BREAK 등]
   base_kr 정규화로 같은 이름 카드(여러 시리즈)도 다 들어감 */
function buildEvolutionIndexes(){
  evolutionByCode={};
  evolutionForwardIndex={};
  for(var i=0;i<evolutionLines.length;i++){
    var e=evolutionLines[i];
    if(!e||!e.bs_code)continue;
    evolutionByCode[e.bs_code]=e;
    /* 부모 이름이 있으면 정방향 인덱스에 등록 */
    var parent=e.evolvesFrom_kr;
    if(parent){
      if(!evolutionForwardIndex[parent])evolutionForwardIndex[parent]=[];
      evolutionForwardIndex[parent].push(e);
    }
  }
}

/* 트레이너 인덱스 빌드:
   - trainerByCode: bs_code → 트레이너 정보
   - trainerTagIndex: tag → bs_code 배열 (우선순위 채우기용) */
function buildTrainerIndexes(){
  trainerByCode={};
  trainerTagIndex={};
  for(var i=0;i<trainerCategories.length;i++){
    var t=trainerCategories[i];
    if(!t||!t.bs_code)continue;
    trainerByCode[t.bs_code]=t;
    if(t.tags&&t.tags.length){
      for(var j=0;j<t.tags.length;j++){
        var tag=t.tags[j];
        if(!trainerTagIndex[tag])trainerTagIndex[tag]=[];
        trainerTagIndex[tag].push(t.bs_code);
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   🪄 세션 14: 자동 빌드 — 단계 2 (Basic 선택 모달)
   ═══════════════════════════════════════════════════════════════ */

/* 자동 빌드 상태 (모달 내 검색/필터) */
var _abQuery='';
var _abTypeFilter='all';

/* 🎲 세션 17: 다시 뽑기 — 직전 자동 빌드 입력/요약 보관.
   recipe는 renderDeckSheet에서 "아이 친화 요약 카드"로 렌더됨. */
var _lastAutoBuild=null;
/* {basicBsCode, targetPath, recipe:{protagonist, protagonistQty, drawName, drawQty, energyName, energyQty}} */

/* Fisher–Yates 셔플 — 자동 빌드 다양성용. 원본 배열을 변조. */
function shuffleArray(arr){
  for(var i=arr.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;
  }
  return arr;
}

/* 카드가 "자동 빌드 후보 Basic"인지 판정:
   - card_class === 'pokemon'
   - evolution_lines의 stage가 'basic' (진짜 기본 + Basic ex 포함, 예: 미라이돈 ex, 코라이돈 ex)
   - 단, "M"으로 시작하는 메가 ex는 이름상 basic이어도 실제론 진화 카드 → 제외
     (evolution_lines에서 stage='mega'로 분류됨, basic 필터에서 자동 배제)
*/
function isAutoBuildBasic(card){
  if(!card||card.card_class!=='pokemon')return false;
  var ev=evolutionByCode[card.bs_code];
  if(!ev)return false; /* evolution 데이터에 없으면 스킵 (안전) */
  return ev.stage==='basic';
}

/* 에이스성 점수 계산:
   진화체/ex/V/VMAX 카드가 상위에 오도록 정렬.
   Basic만 대상이지만 "기라티나 EX" 같은 Basic ex는 점수가 높아야 함.
   점수 기준:
     - 이름에 "ex": +20
     - 이름에 "EX" (옛 대문자): +15
     - 이름에 "V" 단독: +15 (VMAX/VSTAR는 basic이 아니라 제외되지만 안전망)
     - HP 값 / 10 (250HP → +25)
*/
function getAceScore(card){
  var s=0;
  var nm=card.name_kr||'';
  if(/\sex$/i.test(nm)||nm.indexOf(' ex ')>=0||/ ex$/.test(nm))s+=20;
  else if(/\sEX$/.test(nm)||nm.indexOf(' EX')>=0)s+=15;
  else if(/\sV$/.test(nm))s+=15;
  if(card.hp){
    var hp=parseInt(card.hp,10);
    if(!isNaN(hp))s+=Math.floor(hp/10);
  }
  return s;
}

/* 컬렉션의 Basic 포켓몬 카드 목록 (중복 제거, bs_code 유니크)
   반환: [{card, owned}, ...] — owned는 컬렉션 수량 */
function getCollectionBasics(){
  var result=[];
  var seen={};
  var collected=D.collected||{};
  for(var bsCode in collected){
    if(seen[bsCode])continue;
    var entry=collected[bsCode];
    if(!entry)continue;
    var owned=entry.qty||1;
    var card=dbByCode[bsCode];
    if(!card)continue;
    if(!isAutoBuildBasic(card))continue;
    seen[bsCode]=true;
    result.push({card:card,owned:owned});
  }
  return result;
}

/* 🪄 버튼 핸들러 — 자동 빌드 모달 열기 */
function openAutoBuildModal(){
  if(!_deckBuilder){toast('빌더가 열려있지 않아요','#e74c3c');return;}
  /* 데이터 로딩 체크 */
  if(!evolutionLines.length){
    toast('⏳ 진화 데이터 로딩 중입니다. 잠시 후 다시 시도하세요','#f39c12');
    /* 혹시 로딩 시작이 안 됐으면 시동 */
    loadEvolutionData();
    return;
  }
  if(!trainerCategories.length){
    toast('⏳ 트레이너 데이터 로딩 중입니다. 잠시 후 다시 시도하세요','#f39c12');
    loadTrainerCategories();
    return;
  }
  /* 컬렉션에 Basic 포켓몬이 있는지 확인 */
  var basics=getCollectionBasics();
  if(!basics.length){
    toast('⚠️ 컬렉션에 기본 포켓몬이 없어요. 먼저 카드를 등록하세요','#f39c12');
    return;
  }
  /* 상태 초기화 + 모달 열기 */
  _abQuery='';
  _abTypeFilter='all';
  var q=$('abQuery');if(q)q.value='';
  $('abFs').className='ab-fs on';
  renderAutoBuildFilters();
  renderBasicPokemonList();
}

/* 자동 빌드 모달 닫기 */
function closeAutoBuildModal(){
  $('abFs').className='ab-fs';
}

/* 모달 내 검색 입력 핸들러 */
function onAutoBuildSearch(){
  var q=$('abQuery');
  _abQuery=q?q.value.trim():'';
  renderBasicPokemonList();
}

/* 타입 필터 칩 렌더 */
function renderAutoBuildFilters(){
  /* 세션 15: 이모지 → SVG 심볼. 세션 14 버그 수정 — 기존 '불'/'무'는 DB 실제값('불꽃'/'무색')과 불일치해 필터 결과 0건이었음. 공식 TCG 11종으로 교정. */
  var types=['all','풀','불꽃','물','번개','초','격투','악','강철','페어리','드래곤','무색'];
  var h='';
  for(var i=0;i<types.length;i++){
    var t=types[i];
    var active=(_abTypeFilter===t)?' active':'';
    var label;
    if(t==='all'){
      label='<svg class="t-ico"><use href="#tt-colorless"/></svg> 전체';
    }else{
      label=typeIcon(t)+' '+esc(t);
    }
    h+='<button class="fchip'+active+'" onclick="setAutoBuildType(\''+t+'\')">'+label+'</button>';
  }
  $('abFilters').innerHTML=h;
}

function setAutoBuildType(t){
  _abTypeFilter=t;
  renderAutoBuildFilters();
  renderBasicPokemonList();
}

/* Basic 포켓몬 그리드 렌더 — 세션 17f: 진화 라인 그룹핑 + 큰 카드.
   - base_kr (evolution_lines) 기준으로 그룹화 → 같은 포켓몬의 모든 버전이 한 묶음
   - 그룹 내부: 에이스 점수 내림 (ex/V 우선)
   - 그룹 간: 그룹 최강 카드의 에이스 점수 내림 → 동률은 가나다
   - 카드 크기: 한 줄 2장 (CSS .ab-group-grid)
*/
function renderBasicPokemonList(){
  var basics=getCollectionBasics();
  /* 필터 적용 */
  var filtered=basics.filter(function(b){
    if(_abTypeFilter!=='all'&&b.card.pokemon_type!==_abTypeFilter)return false;
    if(_abQuery&&b.card.name_kr&&b.card.name_kr.indexOf(_abQuery)<0)return false;
    return true;
  });
  /* 렌더 */
  var grid=$('abGrid');
  if(!filtered.length){
    grid.innerHTML='<div class="ab-empty"><div class="ei">🔍</div><p>조건에 맞는 기본 포켓몬이<br>없어요.</p></div>';
    return;
  }

  /* 그룹핑: base_kr (없으면 name_kr 폴백) */
  var groups={};
  for(var i=0;i<filtered.length;i++){
    var b=filtered[i];
    var ev=evolutionByCode[b.card.bs_code];
    var key=(ev&&ev.base_kr)||b.card.name_kr||'?';
    if(!groups[key])groups[key]=[];
    groups[key].push(b);
  }

  /* 그룹 내부 정렬: 에이스 점수 내림 → HP 내림 → 이름 */
  var groupKeys=Object.keys(groups);
  for(var g=0;g<groupKeys.length;g++){
    groups[groupKeys[g]].sort(function(a,b){
      var sa=getAceScore(a.card),sb=getAceScore(b.card);
      if(sa!==sb)return sb-sa;
      var ha=parseInt(a.card.hp,10)||0,hb=parseInt(b.card.hp,10)||0;
      if(ha!==hb)return hb-ha;
      return (a.card.name_kr||'').localeCompare(b.card.name_kr||'');
    });
  }

  /* 그룹 정렬: 그룹 내 최고 에이스 점수 → 동률은 이름 가나다 */
  groupKeys.sort(function(ka,kb){
    var ma=0,mb=0;
    for(var i=0;i<groups[ka].length;i++)ma=Math.max(ma,getAceScore(groups[ka][i].card));
    for(var j=0;j<groups[kb].length;j++)mb=Math.max(mb,getAceScore(groups[kb][j].card));
    if(ma!==mb)return mb-ma;
    return ka.localeCompare(kb);
  });

  /* HTML 빌드 */
  var h='';
  for(var k=0;k<groupKeys.length;k++){
    var key=groupKeys[k];
    var group=groups[key];
    var totalQty=0,totalKinds=group.length;
    for(var n=0;n<group.length;n++)totalQty+=group[n].owned;
    h+='<div class="ab-group-hdr">🌿 '+esc(key)+' <span class="ab-group-meta">'+totalKinds+'종 · 총 '+totalQty+'장</span></div>';
    h+='<div class="ab-group-grid">';
    for(var m=0;m<group.length;m++){
      var b2=group[m];
      var c=b2.card;
      var img=c.image_url||placeholderImg(c.name_kr);
      var nm=c.name_kr||'(이름 없음)';
      var isEx=/\sex$/i.test(nm)||nm.indexOf(' ex ')>=0;
      var exBadge=isEx?'<div class="exbadge">ex</div>':'';
      h+='<div class="ab-card" onclick="selectBasicPokemon(\''+esc(c.bs_code)+'\')">'
        +exBadge
        +'<div class="qty">×'+b2.owned+'</div>'
        +'<img src="'+esc(img)+'" alt="'+esc(nm)+'" loading="lazy" onerror="this.src=\''+placeholderImg(nm)+'\'">'
        +'<div class="nm">'+esc(nm)+'</div>'
        +'</div>';
    }
    h+='</div>';
  }
  grid.innerHTML=h;
}

/* Basic 선택 핸들러 — 단계 3: 실제 자동 빌드 실행 */
function selectBasicPokemon(bsCode){
  var card=dbByCode[bsCode];
  if(!card){toast('카드를 찾을 수 없어요','#e74c3c');return;}

  /* 진화 경로 탐색 (단일/다중 판정) */
  var paths=findEvolutionPath(card);

  if(paths.length===0){
    /* Basic 자체로 완결 (진화 없음). 예: 미라이돈 ex, 코라이돈 ex */
    closeAutoBuildModal();
    confirmAndRunAutoBuild(card,null);
  }else if(paths.length===1){
    /* 단일 진화 경로 — 자동 진행 */
    closeAutoBuildModal();
    confirmAndRunAutoBuild(card,paths[0]);
  }else{
    /* 다중 진화 경로 (예: 이브이) — 경로 선택 모달 */
    openEvolutionPathModal(card,paths);
  }
}

/* ═══════════════════════════════════════════════════════════════
   🪄 세션 14: 자동 빌드 — 단계 3 (코어 알고리즘)
   ═══════════════════════════════════════════════════════════════ */

/* 컬렉션 수량 유틸 */
function getOwnedQty(bsCode){
  if(!D.collected||!D.collected[bsCode])return 0;
  return D.collected[bsCode].qty||1;
}

/* 진화 경로 탐색:
   Basic 카드에서 출발 → evolutionForwardIndex로 자식 → 자식 → 자식 (최대 3단계)
   반환: 각 경로는 "최종 도달 base_kr 이름" 목록.
   예) 파이리 → ['리자몽'] (단일)
   예) 이브이 → ['샤미드','쥬피썬더','부스터',...] (다중)
   예) 미라이돈 ex → [] (진화 없음)

   우리는 자식의 base_kr를 모아서 **베이스 이름 집합**을 반환.
   이브이 → 샤미드/쥬피썬더/... 8개 베이스.
   파이리 → 리자드가 먼저 나오지만, 리자드의 자식(리자몽)도 같은 "리자몽 라인"이라
     → 최종 단계까지 따라가서 "리자몽" 하나만 경로로 반환.
*/
function findEvolutionPath(basicCard){
  var startName=basicCard.base_kr||basicCard.name_kr;
  var ev=evolutionByCode[basicCard.bs_code];
  if(ev&&ev.base_kr)startName=ev.base_kr;

  /* BFS로 자식 수집 (3단계 제한) */
  var visited={};
  var finalBases={}; /* 최종 도달 베이스 이름 집합 */
  visited[startName]=true;

  /* 단계 1: startName의 직접 자식들 */
  var directChildren=evolutionForwardIndex[startName]||[];
  if(directChildren.length===0){
    return []; /* 진화 없음 */
  }

  /* 각 직접 자식의 base_kr 집합 (여러 경로의 시작점) */
  var rootBases={};
  for(var i=0;i<directChildren.length;i++){
    var childBase=directChildren[i].base_kr;
    if(childBase&&childBase!==startName)rootBases[childBase]=true;
  }

  /* 각 rootBase별로 끝까지 따라가서 "최종 진화체 base_kr" 찾기 */
  for(var rootBase in rootBases){
    var finalBase=traceToFinalEvolution(rootBase,visited,0);
    finalBases[finalBase]=true;
  }

  /* 결과: 최종 베이스 이름 배열 */
  var paths=[];
  for(var fb in finalBases)paths.push(fb);
  return paths;
}

/* 재귀로 마지막 진화 단계까지 따라감.
   같은 베이스 이름이 여러 단계에 퍼져있어도, 자식이 더 이상 없으면 거기가 끝.
   메가 ex는 1진화 포지션이지만 "베이스→메가 ex"가 최종이라 자연스레 처리됨. */
function traceToFinalEvolution(baseName,visited,depth){
  if(depth>=3)return baseName; /* 깊이 제한 */
  if(visited[baseName])return baseName; /* 순환 방지 */
  visited[baseName]=true;

  var nextChildren=evolutionForwardIndex[baseName]||[];
  var nextBases={};
  for(var i=0;i<nextChildren.length;i++){
    var nb=nextChildren[i].base_kr;
    if(nb&&nb!==baseName)nextBases[nb]=true;
  }

  var keys=Object.keys(nextBases);
  if(keys.length===0)return baseName; /* 자식 없음 = 최종 */
  /* 자식이 여럿이면 첫 번째로 (이런 경우는 드물고, 상위에서 분기된 상태일 것) */
  return traceToFinalEvolution(keys[0],visited,depth+1);
}

/* 다중 진화 경로 선택 모달 */
function openEvolutionPathModal(basicCard,paths){
  $('epTitle').textContent='🌿 '+esc(basicCard.name_kr)+' 진화 경로';
  $('epSub').textContent='어느 진화체 중심으로 짤까요?';
  var listEl=$('epList');
  var h='';
  for(var i=0;i<paths.length;i++){
    var pname=paths[i];
    /* 대표 카드 찾기 — 해당 base_kr의 첫 번째 카드 이미지 사용 */
    var repCard=null;
    for(var j=0;j<cardsDB.length;j++){
      var c=cardsDB[j];
      if(c&&c.card_class==='pokemon'&&c.base_kr===pname){
        repCard=c;
        break;
      }
    }
    /* 폴백: evolution_lines에서 찾기 */
    if(!repCard){
      for(var k=0;k<evolutionLines.length;k++){
        if(evolutionLines[k].base_kr===pname){
          repCard=dbByCode[evolutionLines[k].bs_code];
          if(repCard)break;
        }
      }
    }
    var img=repCard?(repCard.image_url||placeholderImg(pname)):placeholderImg(pname);
    /* 컬렉션에 있는지 표시 */
    var hasInColl=false;
    for(var bc in D.collected){
      var cc=dbByCode[bc];
      if(cc&&cc.base_kr===pname){hasInColl=true;break;}
    }
    var sub=hasInColl?'✅ 컬렉션에 있음':'⚠️ 컬렉션 없음 (부분 진화)';
    h+='<div class="ep-item" onclick="chooseEvolutionPath(\''+esc(basicCard.bs_code)+'\',\''+esc(pname)+'\')">'
      +'<img src="'+esc(img)+'" alt="'+esc(pname)+'" onerror="this.src=\''+placeholderImg(pname)+'\'">'
      +'<div class="info"><div class="nm">'+esc(pname)+'</div><div class="sub">'+sub+'</div></div>'
      +'</div>';
  }
  listEl.innerHTML=h;
  $('epFs').className='ab-fs on';
}

function chooseEvolutionPath(basicBsCode,targetPath){
  $('epFs').className='ab-fs';
  closeAutoBuildModal();
  var card=dbByCode[basicBsCode];
  if(!card){toast('카드를 찾을 수 없어요','#e74c3c');return;}
  confirmAndRunAutoBuild(card,targetPath);
}

/* 자동 빌드 실행 전 확인:
   - 빌더에 이미 카드 있으면 덮어쓰기 확인 */
function confirmAndRunAutoBuild(basicCard,targetPath){
  if(!_deckBuilder){toast('빌더가 열려있지 않아요','#e74c3c');return;}
  var hasCards=false;
  for(var bc in _deckBuilder.cards){
    if(_deckBuilder.cards[bc]>0){hasCards=true;break;}
  }
  if(hasCards){
    if(!confirm('현재 덱을 비우고 자동 빌드할까요?'))return;
    _deckBuilder.cards={};
  }
  runAutoBuild(basicCard,targetPath);
}

/* ═══ 메인 자동 빌드 ═══
   알고리즘 v2 Step 1~7
   입력: basicCard (선택한 Basic 카드), targetPath (최종 진화 base_kr 이름 or null)
*/
function runAutoBuild(basicCard,targetPath){
  var isHalf=_deckBuilder.format==='half';
  var targetTotal=isHalf?30:60;
  var strict=isHalf&&(_deckBuilder.strict!==false);
  var maxCopy=strict?2:4;

  /* Step 1~2: 포켓몬 라인 채우기 */
  var lineStats=fillPokemonLine(basicCard,targetPath,maxCopy);

  /* 에이스 타입 추출 (트레이너/에너지 분배용) */
  var energyType=basicCard.pokemon_type||'무';

  /* Step 2.5 (세션 17b): 포켓몬 수가 부족하면 같은 타입의 다른 Basic으로 보강.
     시나리오: 진화 라인이 없거나, 컬렉션에 카드가 1장씩만 있을 때 "포켓몬 1장
     + 에너지 59장" 같은 쓸모없는 덱이 나오는 걸 방지. */
  var fillerStats=fillBasicFiller(basicCard,maxCopy,isHalf);

  /* Step 4: 트레이너 자동 채우기 */
  var trainerStats=fillTrainers(lineStats.hasStage2,maxCopy,isHalf,energyType);

  /* Step 5: 에너지 채우기 (타입 맞춤) */
  var counts=deckCounts(_deckBuilder);
  var energyTarget=isHalf?6:11;
  var energyStats=fillEnergy(energyType,energyTarget,strict);

  /* Step 6: 빈 슬롯 보정 (에너지로 부족분 채움) */
  counts=deckCounts(_deckBuilder);
  var deficit=targetTotal-counts.total;
  if(deficit>0){
    var extra=fillEnergy(energyType,deficit,strict); /* 부족분 만큼 추가 */
    if(extra&&extra.name&&!energyStats.name)energyStats=extra;
  }

  /* Step 7: 결과 요약 + UI 갱신 */
  counts=deckCounts(_deckBuilder);
  refreshDeckBuilder();

  /* 세션 17: 레시피 카드 데이터 — 아이 친화 요약 (주인공/카드뽑기/에너지).
     에너지 합계는 deckCounts.ene 사용. */
  var recipe={
    protagonist:basicCard.name_kr||'',
    protagonistImg:basicCard.image_url||'',
    protagonistQty:_deckBuilder.cards[basicCard.bs_code]||0,
    targetPath:targetPath||'',
    drawName:(trainerStats.firstDraw&&trainerStats.firstDraw.name)||'',
    drawQty:(trainerStats.firstDraw&&trainerStats.firstDraw.qty)||0,
    energyName:(energyStats&&energyStats.name)||'',
    energyQty:counts.ene||0,
    energyType:energyType,
    pokQty:counts.pok||0,    /* 세션 17b: 포켓몬 합계 */
    trnQty:counts.trn||0,    /* 세션 17b: 트레이너 합계 (0이면 경고 행 노출) */
    fillerAdded:(fillerStats&&fillerStats.added)||0,
    fillerScanned:(fillerStats&&fillerStats.scanned)||0,  /* 세션 17d: 진단 — 컬렉션 총 스캔 개수 */
    fillerMatched:(fillerStats&&fillerStats.matched)||0   /* 세션 17d: 진단 — 필터 통과 후보 개수 */
  };

  /* 세션 17d: 콘솔 디버그 — 브라우저 F12로 확인 가능 */
  var debugInfo={
    version:'v17e',
    basic:basicCard.name_kr,
    basicBs:basicCard.bs_code,
    type:energyType,
    pokQty:counts.pok,
    trnQty:counts.trn,
    eneQty:counts.ene,
    total:counts.total,
    target:targetTotal,
    filler:fillerStats,
    collectionSize:Object.keys(D.collected||{}).length
  };
  if(typeof console!=='undefined'&&console.log){
    console.log('[AutoBuild v17e]',debugInfo);
  }

  /* 세션 17e: 진단 강제 노출 — Pokemon 채우기 실패 시 alert으로 정보 표시.
     사용자가 캡처해서 공유 가능. 정상 빌드면 alert 없음. */
  var pokeTargetCheck=isHalf?6:12;
  if(counts.pok<pokeTargetCheck&&typeof alert==='function'){
    setTimeout(function(){
      alert('🔍 자동 빌드 진단 (v17e)\n\n'+
        '주인공: '+debugInfo.basic+' ('+debugInfo.basicBs+')\n'+
        '타입: '+debugInfo.type+'\n'+
        '포켓몬: '+debugInfo.pokQty+'/'+pokeTargetCheck+'장\n'+
        '트레이너: '+debugInfo.trnQty+'장\n'+
        '에너지: '+debugInfo.eneQty+'장\n\n'+
        '━━ 보강 진단 ━━\n'+
        '컬렉션 총 카드: '+debugInfo.collectionSize+'장\n'+
        '필러 스캔: '+(debugInfo.filler&&debugInfo.filler.scanned)+'장\n'+
        '같은 타입 Basic 발견: '+(debugInfo.filler&&debugInfo.filler.matched)+'장\n'+
        '추가됨: '+(debugInfo.filler&&debugInfo.filler.added)+'장\n\n'+
        '※ 이 화면을 캡처해서 보내주세요.');
    },800);
  }

  _lastAutoBuild={
    basicBsCode:basicCard.bs_code,
    targetPath:targetPath,
    recipe:recipe,
    isHalf:isHalf,
    debug:debugInfo  /* 세션 17e: 진단 정보 영구 저장 */
  };
  /* 세션 17e: 덱 객체에도 저장 → 새로고침/저장 후에도 레시피 카드 유지 */
  if(_deckBuilder)_deckBuilder.lastAutoBuild=_lastAutoBuild;

  showAutoBuildResult({
    total:counts.total,
    target:targetTotal,
    pok:counts.pok,
    trn:counts.trn,
    ene:counts.ene,
    std:counts.std,
    basicName:basicCard.name_kr,
    targetPath:targetPath,
    evolutionStages:lineStats.stages,
    trainerMissing:trainerStats.missing
  });
}

/* 🎲 세션 17: 다시 뽑기 — 직전 자동 빌드를 동일 입력으로 재실행.
   랜덤화 덕분에 포켓몬 동률/트레이너/에너지 선택이 달라져 매번 다른 덱이 나옴. */
function rerollAutoBuild(){
  if(!_lastAutoBuild){toast('먼저 자동 빌드를 해주세요','#f39c12');return;}
  if(!_deckBuilder){toast('빌더가 열려있지 않아요','#e74c3c');return;}
  var card=dbByCode[_lastAutoBuild.basicBsCode];
  if(!card){toast('카드를 찾을 수 없어요','#e74c3c');return;}
  /* 기존 덱 비우고 재실행 (확인 안 묻고 바로) */
  _deckBuilder.cards={};
  runAutoBuild(card,_lastAutoBuild.targetPath);
  /* 시트가 이미 열려있으니 즉시 갱신 (500ms 대기 없이 시각 피드백) */
  if(typeof renderDeckSheet==='function')renderDeckSheet();
}

/* Step 1~2: 포켓몬 라인 채우기
   - Step 1: 선택한 Basic을 maxCopy 장 추가
   - Step 2: targetPath까지 진화 단계별 자식 찾아서 컬렉션에 있는 만큼 추가
   반환: {hasStage2:bool, stages:{basic:n, stage1:n, stage2:n, mega:n}, missing:[]}
*/
function fillPokemonLine(basicCard,targetPath,maxCopy){
  var stages={basic:0,stage1:0,stage2:0,mega:0,other:0};
  var missing=[];

  /* Step 1: 에이스 Basic 투입 */
  var basicOwned=getOwnedQty(basicCard.bs_code);
  var basicQty=Math.min(maxCopy,basicOwned);
  if(basicQty>0){
    _deckBuilder.cards[basicCard.bs_code]=basicQty;
    stages.basic+=basicQty;
  }

  /* targetPath가 없으면 (예: 미라이돈 ex) 종료 */
  if(!targetPath)return {hasStage2:false,stages:stages,missing:missing};

  /* Step 2: 진화 라인 타고 올라가기
     startName에서 시작 → forward 탐색 → targetPath에 도달하거나 막다른 길까지 */
  var startName=basicCard.base_kr||basicCard.name_kr;
  var ev=evolutionByCode[basicCard.bs_code];
  if(ev&&ev.base_kr)startName=ev.base_kr;

  /* BFS: 각 단계에서 컬렉션에 있는 카드를 추가 */
  var visited={};
  visited[startName]=true;
  var currentBase=startName;
  var safety=0;
  while(currentBase&&currentBase!==targetPath&&safety<5){
    safety++;
    /* currentBase의 자식들 중 targetPath 방향으로 가는 것 선택 */
    var children=evolutionForwardIndex[currentBase]||[];
    if(children.length===0)break;

    /* 자식을 base_kr별로 그룹핑 */
    var byBase={};
    for(var i=0;i<children.length;i++){
      var cb=children[i].base_kr;
      if(!cb||cb===currentBase)continue;
      if(!byBase[cb])byBase[cb]=[];
      byBase[cb].push(children[i]);
    }

    /* targetPath 방향으로 갈 base_kr 선택 */
    var nextBase=null;
    if(byBase[targetPath]){
      nextBase=targetPath;
    }else{
      /* 직접 일치 안 하면, 어느 base가 targetPath까지 이어지는지 탐색 */
      for(var bname in byBase){
        if(visited[bname])continue;
        if(leadsToTarget(bname,targetPath,3)){nextBase=bname;break;}
      }
      /* 그래도 못 찾으면 첫 번째 */
      if(!nextBase)nextBase=Object.keys(byBase)[0];
    }

    if(!nextBase)break;
    visited[nextBase]=true;

    /* nextBase 그룹의 카드들 중 컬렉션에 있는 것들을 수집 */
    var groupCards=byBase[nextBase]||[];
    var ownedInGroup=[];
    for(var j=0;j<groupCards.length;j++){
      var evCard=groupCards[j];
      var dbCard=dbByCode[evCard.bs_code];
      if(!dbCard)continue;
      var owned=getOwnedQty(evCard.bs_code);
      if(owned>0){
        ownedInGroup.push({card:dbCard,ev:evCard,owned:owned,aceScore:getAceScore(dbCard)});
      }
    }

    if(ownedInGroup.length===0){
      missing.push(nextBase);
      currentBase=nextBase; /* 다음 단계로 계속 진행 (중간 단계 비어도 끝까지 시도) */
      continue;
    }

    /* 에이스성 점수 내림차순 정렬 — 강한 카드 우선.
       세션 17: 동률 카드는 셔플해서 "다시 뽑기" 시 다양성 확보. */
    shuffleArray(ownedInGroup);
    ownedInGroup.sort(function(a,b){return b.aceScore-a.aceScore;});

    /* maxCopy까지 채우기 (여러 카드 섞어도 됨 — 같은 base_kr이면 진화 라인상 같은 역할) */
    var remain=maxCopy;
    for(var k=0;k<ownedInGroup.length&&remain>0;k++){
      var g=ownedInGroup[k];
      var put=Math.min(remain,g.owned,maxCopy);
      if(put>0){
        _deckBuilder.cards[g.card.bs_code]=(_deckBuilder.cards[g.card.bs_code]||0)+put;
        remain-=put;
        /* stage 카운팅 */
        var st=g.ev.stage||'other';
        if(stages.hasOwnProperty(st))stages[st]+=put;
        else stages.other+=put;
      }
    }

    currentBase=nextBase;
  }

  return {
    hasStage2:stages.stage2>0,
    stages:stages,
    missing:missing
  };
}

/* 🌱 세션 17b: 포켓몬 보강 — 같은 타입의 다른 Basic으로 포켓몬 칸을 채움.
   진화 라인이 없거나 sparse한 컬렉션에서 "포켓몬 1장 + 에너지 59장" 문제를 방지.
   - 목표: 풀덱 12장, 하프덱 6장까지 포켓몬 확보
   - 선정: 같은 pokemon_type의 Basic, 주인공/이미 덱에 있는 카드 제외
   - 정렬: 에이스 점수 내림차순 + 동률 셔플 (다시 뽑기 시 다양성)

   세션 17c: isAutoBuildBasic (evolution_lines 필수) 대신 "관대한 Basic 판정" 사용.
   evolution_lines에 등록 안 된 최신 카드도 포함되도록 card_type='기본 포켓몬' 직접 검사.
*/
function fillBasicFiller(basicCard,maxCopy,isHalf){
  var pokeTarget=isHalf?6:12;
  var counts=deckCounts(_deckBuilder);
  if(counts.pok>=pokeTarget)return {added:0,scanned:0,matched:0};

  var myType=basicCard.pokemon_type||'';
  if(!myType)return {added:0,scanned:0,matched:0};

  /* 컬렉션 직접 순회 — 관대한 Basic 판정.
     조건: card_class='pokemon' AND (card_type에 '기본' 포함 OR evolution_lines stage='basic')
     AND pokemon_type 일치 AND 주인공이 아니고 아직 덱에 없음. */
  var candidates=[];
  var scanned=0;
  var collected=D.collected||{};
  for(var bsCode in collected){
    scanned++;
    if(bsCode===basicCard.bs_code)continue;
    if(_deckBuilder.cards[bsCode]>0)continue;
    var entry=collected[bsCode];
    if(!entry)continue;
    var card=dbByCode[bsCode];
    if(!card)continue;
    if(card.card_class!=='pokemon')continue;
    if(card.pokemon_type!==myType)continue;
    /* Basic 판정 (관대): card_type 직접 검사 우선, 없으면 evolution_lines 폴백 */
    var isBasic=false;
    var ct=card.card_type||'';
    if(ct.indexOf('기본')>=0)isBasic=true;
    else{
      var ev=evolutionByCode[bsCode];
      if(ev&&ev.stage==='basic')isBasic=true;
    }
    /* 진화 카드 제외 (1진화/2진화/M진화 등) — '기본'이 이름에 있어도 'M진화'이면 제외 */
    if(ct.indexOf('1진화')>=0||ct.indexOf('2진화')>=0||ct.indexOf('M진화')>=0)isBasic=false;
    if(!isBasic)continue;
    candidates.push({card:card,owned:entry.qty||1});
  }
  var matched=candidates.length;
  if(matched===0)return {added:0,scanned:scanned,matched:0};

  /* 에이스 점수 내림차순 + 동률 셔플 */
  shuffleArray(candidates);
  candidates.sort(function(a,b){return getAceScore(b.card)-getAceScore(a.card);});

  var added=0;
  for(var j=0;j<candidates.length;j++){
    counts=deckCounts(_deckBuilder);
    if(counts.pok>=pokeTarget)break;
    var s=candidates[j];
    var put=Math.min(maxCopy,s.owned,pokeTarget-counts.pok);
    if(put>0){
      _deckBuilder.cards[s.card.bs_code]=(_deckBuilder.cards[s.card.bs_code]||0)+put;
      added+=put;
    }
  }
  return {added:added,scanned:scanned,matched:matched};
}

/* 재귀 판정: baseName에서 출발해 depth 내에 targetPath에 도달 가능한가? */
function leadsToTarget(baseName,targetPath,depth){
  if(depth<=0)return false;
  if(baseName===targetPath)return true;
  var children=evolutionForwardIndex[baseName]||[];
  var seen={};
  for(var i=0;i<children.length;i++){
    var cb=children[i].base_kr;
    if(!cb||seen[cb])continue;
    seen[cb]=true;
    if(leadsToTarget(cb,targetPath,depth-1))return true;
  }
  return false;
}

/* Step 4: 트레이너 자동 채우기
   9단계 우선순위로 컬렉션의 트레이너 카테고리를 순회.
   각 카테고리당 1종 선택해서 maxCopy까지.
   반환: {added:n, missing:['tag1',...]}
*/
function fillTrainers(hasStage2,maxCopy,isHalf,energyType){
  /* 수량 목표 (세션 14 컨펌 3/4) */
  var trainerTarget=isHalf?11:25;

  /* 우선순위 (evolution_accel은 Stage 2 있을 때만 위로) */
  var priority=['draw_support','pokemon_search','gust'];
  if(hasStage2)priority.push('evolution_accel');
  priority=priority.concat(['energy_search','switch','recovery','energy_acceleration','healing']);
  /* 조건부: 빈 슬롯 있으면 hand_disrupt/tool_defensive도 */
  var lowPriority=['hand_disrupt','tool_defensive'];

  var added=0;
  var missing=[];
  var usedBsCodes={}; /* 이미 추가한 카드는 다음 카테고리에서 제외 */
  var firstDraw=null; /* 세션 17: 레시피 카드용 — 처음 뽑힌 draw_support 저장 */

  function addFromTag(tag){
    if(added>=trainerTarget)return;
    var bsCodes=trainerTagIndex[tag]||[];
    /* 컬렉션에 있는 카드만 필터 */
    var owned=[];
    for(var i=0;i<bsCodes.length;i++){
      var bs=bsCodes[i];
      if(usedBsCodes[bs])continue;
      var q=getOwnedQty(bs);
      if(q<=0)continue;
      var card=dbByCode[bs];
      if(!card)continue;
      /* energy_acceleration은 타입 매칭 — 이름/효과에 에이스 타입이 들어가야 */
      if(tag==='energy_acceleration'){
        var txt=(card.effect_text||'')+' '+(card.name_kr||'');
        /* 에이스 타입 또는 '기본 에너지' 같은 범용 키워드 필요 */
        if(txt.indexOf(energyType)<0&&txt.indexOf('기본 에너지')<0)continue;
      }
      owned.push({bs:bs,card:card,qty:q});
    }
    if(owned.length===0){
      missing.push(tag);
      return;
    }
    /* 세션 17: 대표 1종 — 이전엔 owned[0] 고정이었으나 "다시 뽑기" 다양성을 위해
       후보 중 랜덤 선택. 카테고리 하나당 후보가 보통 2~5개라 체감 변화 큼. */
    var chosen=owned[Math.floor(Math.random()*owned.length)];
    var put=Math.min(maxCopy,chosen.qty,trainerTarget-added);
    if(put>0){
      _deckBuilder.cards[chosen.bs]=(_deckBuilder.cards[chosen.bs]||0)+put;
      usedBsCodes[chosen.bs]=true;
      added+=put;
      if(tag==='draw_support'&&!firstDraw){
        firstDraw={name:chosen.card.name_kr||'',qty:put};
      }
    }
  }

  /* 우선순위 순회 */
  for(var i=0;i<priority.length;i++){
    addFromTag(priority[i]);
    if(added>=trainerTarget)break;
  }
  /* 여유 슬롯 있으면 저우선순위 태그도 */
  if(added<trainerTarget){
    for(var j=0;j<lowPriority.length;j++){
      addFromTag(lowPriority[j]);
      if(added>=trainerTarget)break;
    }
  }

  return {added:added,missing:missing,firstDraw:firstDraw};
}

/* Step 5~6: 에너지 채우기
   에이스 타입에 맞는 기본 에너지를 deficit만큼 추가.
   기본 에너지는 무제한(룰상)이지만 컬렉션에 있는 것만 사용. 없으면 무색.
   타입명 → 기본 에너지 카드명 매핑:
     '풀'→'풀 에너지', '불'→'불 에너지', 등
*/
function fillEnergy(energyType,deficit,strict){
  if(deficit<=0)return {added:0};
  /* 타입 → 기본 에너지 이름 매핑 */
  var energyNameMap={
    '풀':'풀 에너지','불':'불 에너지','물':'물 에너지','번개':'번개 에너지',
    '초':'초 에너지','격투':'격투 에너지','악':'악 에너지','강철':'강철 에너지',
    '페어리':'페어리 에너지','드래곤':'드래곤 에너지','무':'무색 에너지'
  };
  var wantedName=energyNameMap[energyType]||'무색 에너지';

  /* 세션 17: 컬렉션에서 해당 기본 에너지 카드를 "모두" 수집 → 랜덤 1종 선택.
     같은 타입의 다른 일러스트/세트가 여러 장 있으면 다시 뽑을 때 달라짐. */
  var primaryCandidates=[];  /* 이름에 "기본" 포함 (확실한 기본 에너지) */
  var fallbackCandidates=[]; /* "특수" 없는 타입 에너지 (폴백) */
  for(var bc in D.collected){
    var card=dbByCode[bc];
    if(!card||card.card_class!=='energy')continue;
    var nm=card.name_kr||'';
    if(nm.indexOf(wantedName)>=0&&nm.indexOf('기본')>=0){
      primaryCandidates.push(card);
    }else if(nm.indexOf(wantedName)>=0&&nm.indexOf('특수')<0){
      fallbackCandidates.push(card);
    }
  }
  var pool=primaryCandidates.length>0?primaryCandidates:fallbackCandidates;
  var chosen=null;
  if(pool.length>0){
    chosen=pool[Math.floor(Math.random()*pool.length)];
  }
  /* 폴백 2: 컬렉션에 없으면 cardsDB 전체에서 첫 매칭 */
  if(!chosen){
    for(var i=0;i<cardsDB.length;i++){
      var c=cardsDB[i];
      if(!c||c.card_class!=='energy')continue;
      var nm2=c.name_kr||'';
      if(nm2.indexOf(wantedName)>=0&&(nm2.indexOf('기본')>=0||nm2.indexOf('특수')<0)){
        chosen=c;
        break;
      }
    }
  }

  if(!chosen)return {added:0};

  /* 기본 에너지는 무제한 — maxCopy 제약 없이 추가 */
  _deckBuilder.cards[chosen.bs_code]=(_deckBuilder.cards[chosen.bs_code]||0)+deficit;
  return {added:deficit,name:chosen.name_kr||wantedName};
}

/* Step 7: 결과 토스트 + 현재 덱 시트 자동 펼치기
   세션 17: 아이 친화 톤 — "부족" 대신 응원/축하 문구로. */
function showAutoBuildResult(stats){
  var msg='';
  var bg='#27ae60';
  if(stats.total>=stats.target){
    msg='✨ 덱 완성! '+(stats.basicName||'')+' 덱 '+stats.total+'/'+stats.target;
  }else if(stats.total>=Math.floor(stats.target*0.75)){
    msg='🎉 거의 다 됐어! '+stats.total+'/'+stats.target+'장';
    bg='#3dc0ec';
  }else{
    msg='🌱 '+stats.total+'/'+stats.target+'장 — 카드를 더 모으면 더 멋져져!';
    bg='#f39c12';
  }
  toast(msg,bg);

  /* 진화 라인 안내 — 경고가 아니라 "괜찮아" 응원으로 */
  if(stats.evolutionStages){
    var s=stats.evolutionStages;
    if(s.basic>0&&(s.stage1===0&&s.stage2===0&&s.mega===0)&&stats.targetPath){
      setTimeout(function(){
        toast('💪 '+stats.targetPath+'은 아직이지만, '+(stats.basicName||'기본 포켓몬')+'만으로도 멋진 덱이야!','#3dc0ec');
      },1500);
    }
  }

  /* 세션 17b: 트레이너 0장 안내 — 핵심적으로 놓치는 부분이라 명확히 알려줌 */
  if(stats.trn===0){
    setTimeout(function(){
      toast('🛠️ 트레이너 카드가 없어요! 카드 뽑기 도우미부터 등록해봐요','#f39c12');
    },stats.evolutionStages&&stats.evolutionStages.basic>0&&stats.evolutionStages.stage1===0&&stats.targetPath?3000:1500);
  }

  /* 현재 덱 시트 자동 펼치기 (사용자가 바로 검토) */
  setTimeout(function(){
    if(typeof openDeckSheet==='function')openDeckSheet();
  },500);
}

/* ═══════════════════════════════════════════════════════════════
   📚 도감 탭 (Dex)
   ═══════════════════════════════════════════════════════════════ */
var _dexClass='pokemon';
var _dexQuery='';
var _dexLimit=120; /* 초기 표시 개수 */
var _dexCurFiltered=[];

/* 세션 16: 도감 탭 필터 (수집 탭과 동일 구조, 독립 상태) */
var _dexFilters={
  type:'all',
  stage:'all',
  ex:'all',
  trainerSub:'all',
  retreat:'all'
};
function setDexFilter(key,val,btn){
  _dexFilters[key]=val;
  var grp=btn.parentNode.querySelectorAll('.fchip');
  for(var i=0;i<grp.length;i++)grp[i].classList.remove('active');
  btn.classList.add('active');
  _dexLimit=120; /* 필터 변경 시 페이지네이션 리셋 */
  renderDex();
}
function resetDexFilters(){
  _dexFilters={type:'all',stage:'all',ex:'all',trainerSub:'all',retreat:'all'};
  _dexLimit=120;
  renderDex();
}
function matchDexFilter(c){
  var f=_dexFilters;
  /* 세션 16 fix: 현재 서브탭 기준으로 적용 가능한 필터만 평가
     (포켓몬 전용 필터가 트레이너/에너지/스타디움에 적용되면 전부 탈락하는 버그 방지) */
  var isPokemonTab=(_dexClass==='pokemon');
  var isTrainerTab=(_dexClass==='trainer');
  if(isPokemonTab){
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
    if(f.retreat!=='all'){
      var r=c.retreat;
      if(f.retreat==='3'&&!(r>=3))return false;
      else if(f.retreat!=='3'&&r!==parseInt(f.retreat,10))return false;
    }
  }else if(isTrainerTab){
    if(f.trainerSub!=='all'){
      if(trainerGroup(c)!==f.trainerSub)return false;
    }
  }
  /* energy, stadium 서브탭: 적용 가능한 필터 없음 → 통과 */
  return true;
}
/* 세션 16: 도감 필터 칩 헬퍼 (fchip/fchipRaw와 동일 구조, setDexFilter 호출) */
function dchip(key,val,label){
  var active=_dexFilters[key]===val;
  return'<button class="fchip'+(active?' active':'')+'" onclick="setDexFilter(\''+key+'\',\''+esc(val)+'\',this)">'+esc(label)+'</button>';
}
function dchipRaw(key,val,labelHtml){
  var active=_dexFilters[key]===val;
  return'<button class="fchip'+(active?' active':'')+'" onclick="setDexFilter(\''+key+'\',\''+esc(val)+'\',this)">'+labelHtml+'</button>';
}

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
  /* 세션 16 fix: 필터 details open 상태 보존 */
  var _prevFiltOpen=(function(){var el=$('dex-filt');return el?el.open:false;})();
  /* 1차 필터링: 서브탭(card_class) + 이름 검색 */
  var q=_dexQuery;
  var preFiltered=[];
  for(var i=0;i<cardsDB.length;i++){
    var c=cardsDB[i];
    if(!c||c.card_class!==_dexClass)continue;
    if(q&&c.name_kr&&c.name_kr.indexOf(q)<0)continue;
    if(q&&!c.name_kr)continue;
    preFiltered.push(c);
  }
  /* 2차 필터링: 세션 16 도감 필터 */
  var filtered=preFiltered.filter(matchDexFilter);
  _dexCurFiltered=filtered;
  var total=filtered.length;
  var preTotal=preFiltered.length;
  var shown=filtered.slice(0,_dexLimit);
  var ownedCount=0;
  for(var k=0;k<filtered.length;k++)if(D.collected[filtered[k].bs_code])ownedCount++;

  var h='<div class="dex-meta">총 <b>'+total.toLocaleString()+'</b>장 · 수집 <b style="color:var(--green)">'+ownedCount.toLocaleString()+'</b>장 ('+(total?Math.round(ownedCount/total*100):0)+'%)</div>';

  /* 세션 16: 도감 필터 칩 — 서브탭별로 의미 있는 필터만 표시 */
  var hasPokemonFilters=(_dexClass==='pokemon');
  var hasTrainerFilters=(_dexClass==='trainer');
  if(hasPokemonFilters||hasTrainerFilters){
    h+='<details class="coll-filters" id="dex-filt"><summary>🔍 필터 ('+total.toLocaleString()+'/'+preTotal.toLocaleString()+'장 표시)</summary>';
    if(hasPokemonFilters){
      h+='<div class="fgroup"><div class="fl">속성</div><div class="frow">';
      h+=dchip('type','all','전체');
      ['풀','불꽃','물','번개','초','격투','악','강철','페어리','드래곤','무색'].forEach(function(t){
        h+=dchipRaw('type',t,typeIcon(t)+' '+esc(t));
      });
      h+='</div></div>';
      h+='<div class="fgroup"><div class="fl">진화</div><div class="frow">';
      h+=dchip('stage','all','전체')+dchip('stage','basic','기본')+dchip('stage','stage1','1진화')+dchip('stage','stage2','2진화');
      h+='</div></div>';
      h+='<div class="fgroup"><div class="fl">ex</div><div class="frow">';
      h+=dchip('ex','all','전체')+dchip('ex','normal','일반')+dchip('ex','ex','ex')+dchip('ex','mega','메가 ex');
      h+='</div></div>';
      h+='<div class="fgroup"><div class="fl">후퇴</div><div class="frow">';
      h+=dchip('retreat','all','전체')+dchip('retreat','0','0')+dchip('retreat','1','1')+dchip('retreat','2','2')+dchip('retreat','3','3+');
      h+='</div></div>';
    }
    if(hasTrainerFilters){
      h+='<div class="fgroup"><div class="fl">트레이너</div><div class="frow">';
      h+=dchip('trainerSub','all','전체')+dchip('trainerSub','item','아이템')+dchip('trainerSub','supporter','서포터')+dchip('trainerSub','tool','도구');
      h+='</div></div>';
    }
    h+='<button class="btn btn-g" style="margin-top:8px;width:100%" onclick="resetDexFilters()">필터 초기화</button>';
    h+='</details>';
  }

  if(total===0){
    /* 세션 16: 빈 결과 — 필터 UI는 보존하고 그리드 자리만 empty 메시지로 대체 */
    if(preTotal===0){
      /* 검색어 때문에 0개 */
      h+='<div class="empty"><div class="ei">🔍</div><p>검색 결과 없음<br><span style="font-size:.72rem">"'+esc(q)+'"</span></p></div>';
    }else{
      /* 필터 때문에 0개 (검색 결과는 있음) */
      h+='<div class="empty"><div class="ei">🔍</div><p>필터 조건에 맞는 카드 없음<br><span style="font-size:.72rem">필터를 초기화하거나 조건을 바꿔보세요</span></p></div>';
    }
  }else{
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
  }
  $('dex-r').innerHTML=h;
  /* 세션 16 fix: 필터 details open 상태 복원 */
  if(_prevFiltOpen){var _filtEl=$('dex-filt');if(_filtEl)_filtEl.open=true;}
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
    /* 세션 15: trainerGroup()으로 통합 분류 (도구는 card_type에 있음) */
    var tg=trainerGroup(c);
    var tgLabel={supporter:'서포터',item:'아이템',tool:'포켓몬의 도구'}[tg]||tg;
    if(tg)h+='<div class="dr"><span class="dl">서브타입</span><span>'+esc(tgLabel)+'</span></div>';
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
  /* 세션 15: 이모지 → SVG 심볼. DB 실제값 기준 (공식 TCG 타입명 11종: 풀/불꽃/물/번개/초/격투/악/강철/페어리/드래곤/무색). */
  var m={'풀':'tt-grass','불꽃':'tt-fire','물':'tt-water','번개':'tt-lightning','초':'tt-psychic','격투':'tt-fighting','악':'tt-dark','강철':'tt-steel','페어리':'tt-fairy','드래곤':'tt-dragon','무색':'tt-colorless'};
  var id=m[t];
  if(!id)return '';
  return '<svg class="t-ico"><use href="#'+id+'"/></svg>';
}
function trainerSubLabel(s){
  /* 세션 15: DB 실측 기반 정리. trainer_subtype 필드에는 item/supporter/null만 존재.
     도구/화석은 card_type으로 별도 판별되므로 여기서 처리하지 않음. */
  return{item:'아이템',supporter:'서포터'}[s]||s;
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
  trainerSub:'all', /* item/supporter/tool (세션 15: fossil 제거, DB 증거 없음) */
  retreat:'all'   /* 0/1/2/3+ */
};
/* 세션 17: 수집 탭 서브탭 + 페이지네이션 */
var _collClass='pokemon';
var _collLimit=120;
function setCollClass(cls,btn){
  _collClass=cls;
  _collLimit=120;
  var sub=$('coll-subtabs').getElementsByTagName('button');
  for(var i=0;i<sub.length;i++)sub[i].className='subtab';
  btn.className='subtab on';
  renderColl();
}

function setCollFilter(key,val,btn){
  _collFilters[key]=val;
  /* 같은 그룹 버튼들 active 갱신 */
  var grp=btn.parentNode.querySelectorAll('.fchip');
  for(var i=0;i<grp.length;i++)grp[i].classList.remove('active');
  btn.classList.add('active');
  _collLimit=120; /* 세션 17: 필터 변경 시 페이지네이션 리셋 */
  renderColl();
}
function resetCollFilters(){
  _collFilters={type:'all',stage:'all',ex:'all',trainerSub:'all',retreat:'all'};
  _collLimit=120;
  renderColl();
}
function matchCollFilter(c){
  var f=_collFilters;
  /* 세션 17: 현재 서브탭(_collClass) 기준으로 적용 가능한 필터만 평가
     도감 탭 matchDexFilter와 동일 패턴 — 숨겨진 필터는 적용도 안 됨 */
  var isPokemonTab=(_collClass==='pokemon');
  var isTrainerTab=(_collClass==='trainer');
  if(isPokemonTab){
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
    if(f.retreat!=='all'){
      var r=c.retreat;
      if(f.retreat==='3'&&!(r>=3))return false;
      else if(f.retreat!=='3'&&r!==parseInt(f.retreat,10))return false;
    }
  }else if(isTrainerTab){
    if(f.trainerSub!=='all'){
      if(trainerGroup(c)!==f.trainerSub)return false;
    }
  }
  /* energy, stadium 서브탭: 적용 가능한 필터 없음 → 통과 */
  return true;
}
function renderColl(){
  if(!cardsDB.length){
    $('coll-summary-top').innerHTML='';
    $('coll-subtabs').style.display='none';
    $('coll-r').innerHTML='<div class="loading"><div class="spinner"></div><p>카드 DB 로딩 중...</p></div>';
    return;
  }
  /* 세션 16 fix: 필터 details open 상태 보존 */
  var _prevCollFiltOpen=(function(){var el=$('coll-filt');return el?el.open:false;})();
  var codes=Object.keys(D.collected);
  if(codes.length===0){
    /* 세션 17: 빈 수집함 — 요약 헤더/서브탭 숨기고 안내만 표시 */
    $('coll-summary-top').innerHTML='';
    $('coll-subtabs').style.display='none';
    $('coll-r').innerHTML='<div class="empty"><div class="ei">🃏</div><p>아직 수집한 카드가 없어요!<br><span style="font-size:.72rem">📚 도감 탭에서 카드를 추가해보세요</span></p></div>';
    return;
  }
  /* 서브탭 다시 표시 (이전에 숨겨졌을 수 있음) */
  $('coll-subtabs').style.display='';

  /* 수집 카드 → 풀 데이터로 hydrate */
  var collCards=[];
  for(var i=0;i<codes.length;i++){
    var c=dbByCode[codes[i]];
    if(c)collCards.push(c);
  }
  /* 종류별 카운트 (전체 수집 breakdown — 서브탭 필터 이전의 전체 수) */
  var byClass={pokemon:0,trainer:0,energy:0,stadium:0};
  for(var k=0;k<collCards.length;k++){
    var cc=collCards[k];
    if(byClass.hasOwnProperty(cc.card_class))byClass[cc.card_class]++;
  }
  var totalQty=0;
  for(var bc in D.collected)if(D.collected.hasOwnProperty(bc))totalQty+=(D.collected[bc].qty||1);

  /* 세션 17: 요약 헤더 — 서브탭 위에 별도 렌더 (전체 수집 규모 항상 표시) */
  var topHtml='<div class="coll-summary">';
  topHtml+='<div class="cs-row"><b>'+collCards.length.toLocaleString()+'</b>종 · 총 '+totalQty.toLocaleString()+'장</div>';
  topHtml+='<div class="cs-breakdown">🐾 '+byClass.pokemon+' · 🎫 '+byClass.trainer+' · ⚡ '+byClass.energy+' · 🏟️ '+byClass.stadium+'</div>';
  topHtml+='</div>';
  $('coll-summary-top').innerHTML=topHtml;

  /* 세션 17: 1차 필터 — 서브탭(card_class) */
  var classCards=collCards.filter(function(c){return c.card_class===_collClass;});
  /* 2차 필터 — 사용자 필터 */
  var filtered=classCards.filter(matchCollFilter);
  var total=filtered.length;
  var preTotal=classCards.length;
  var shown=filtered.slice(0,_collLimit);

  /* 필터 칩 — 서브탭별로 의미 있는 필터만 표시 (도감과 동일 패턴) */
  var h='';
  var hasPokemonFilters=(_collClass==='pokemon');
  var hasTrainerFilters=(_collClass==='trainer');
  if(hasPokemonFilters||hasTrainerFilters){
    h+='<details class="coll-filters" id="coll-filt"><summary>🔍 필터 ('+total.toLocaleString()+'/'+preTotal.toLocaleString()+'장 표시)</summary>';
    if(hasPokemonFilters){
      h+='<div class="fgroup"><div class="fl">속성</div><div class="frow">';
      h+=fchip('type','all','전체');
      ['풀','불꽃','물','번개','초','격투','악','강철','페어리','드래곤','무색'].forEach(function(t){
        h+=fchipRaw('type',t,typeIcon(t)+' '+esc(t));
      });
      h+='</div></div>';
      h+='<div class="fgroup"><div class="fl">진화</div><div class="frow">';
      h+=fchip('stage','all','전체')+fchip('stage','basic','기본')+fchip('stage','stage1','1진화')+fchip('stage','stage2','2진화');
      h+='</div></div>';
      h+='<div class="fgroup"><div class="fl">ex</div><div class="frow">';
      h+=fchip('ex','all','전체')+fchip('ex','normal','일반')+fchip('ex','ex','ex')+fchip('ex','mega','메가 ex');
      h+='</div></div>';
      h+='<div class="fgroup"><div class="fl">후퇴</div><div class="frow">';
      h+=fchip('retreat','all','전체')+fchip('retreat','0','0')+fchip('retreat','1','1')+fchip('retreat','2','2')+fchip('retreat','3','3+');
      h+='</div></div>';
    }
    if(hasTrainerFilters){
      h+='<div class="fgroup"><div class="fl">트레이너</div><div class="frow">';
      h+=fchip('trainerSub','all','전체')+fchip('trainerSub','item','아이템')+fchip('trainerSub','supporter','서포터')+fchip('trainerSub','tool','도구');
      h+='</div></div>';
    }
    h+='<button class="btn btn-g" style="margin-top:8px;width:100%" onclick="resetCollFilters()">필터 초기화</button>';
    h+='</details>';
  }

  /* 카드 그리드 */
  if(total===0){
    if(preTotal===0){
      /* 이 서브탭에 수집한 카드가 없음 */
      var emptyMsg={pokemon:'포켓몬',trainer:'트레이너',energy:'에너지',stadium:'스타디움'}[_collClass]||'카드';
      h+='<div class="empty"><div class="ei">🃏</div><p>수집한 '+emptyMsg+' 카드 없음</p></div>';
    }else{
      /* 필터 때문에 0개 */
      h+='<div class="empty"><div class="ei">🔍</div><p>필터 조건에 맞는 카드 없음<br><span style="font-size:.72rem">필터를 초기화하거나 조건을 바꿔보세요</span></p></div>';
    }
  }else{
    h+='<div class="dgrid">';
    for(var m=0;m<shown.length;m++){
      var fc=shown[m];
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
    if(shown.length<total){
      h+='<div style="text-align:center;margin-top:14px"><button class="btn btn-p" onclick="_collLimit+=120;renderColl()">더 보기 (+120)</button></div>';
    }
  }

  $('coll-r').innerHTML=h;
  /* 세션 16 fix: 필터 details open 상태 복원 */
  if(_prevCollFiltOpen){var _cfEl=$('coll-filt');if(_cfEl)_cfEl.open=true;}
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
/* 세션 15: SVG 심볼 포함 라벨용 — HTML 이스케이프 안 함. 오직 typeIcon() 결과 + 타입명에만 사용. */
function fchipRaw(key,val,labelHtml){
  var active=_collFilters[key]===val;
  return'<button class="fchip'+(active?' active':'')+'" onclick="setCollFilter(\''+key+'\',\''+esc(val)+'\',this)">'+labelHtml+'</button>';
}

/* ═══════════════════════════════════════════════════════════════
   🏗️ 덱 탭 — 커스텀 덱 빌더 (세션 11)

   주요 기능:
   - 풀덱(60장) / 하프덱(30장) 모드
   - 카드 풀: 도감 전체(15,990) ↔ 내 컬렉션 토글 (기본=도감)
   - 룰 검증: 매수/4장(2장)/2진화금지(하프덱)/약식 진화라인/에너지비율
   - 저장: Firestore customDecksV1 (v3 decks 절대 안 건드림)
   ═══════════════════════════════════════════════════════════════ */

/* ─── 덱 빌더 상태 ─── */
var _deckBuilder=null; /* { id, name, format, pool, strict, cards:{bs_code:qty}, isNew } */
var _deckPool='dex';
var _deckQuery='';
var _deckClassFilter='all'; /* all|pokemon|trainer|energy|stadium */
var _deckStageFilter='all'; /* all|basic|stage1|stage2 (포켓몬 한정) */
var _deckTypeFilter='all'; /* all|불꽃|물|... (포켓몬 타입 한정) */
var _deckTrainerFilter='all'; /* all|supporter|item|tool (트레이너 한정, trainerGroup() 반환값) */
var _deckBuilderRendering=false;

/* 포켓몬 타입 11종 — DB의 pokemon_type 필드 값 (세션 15: '노말'→'무색' 버그 수정. DB 실제값 확인 완료) */
var POKEMON_TYPES=['불꽃','물','풀','번개','초','격투','악','강철','페어리','드래곤','무색'];
/* 트레이너 세부 — trainerGroup() 반환값 기준 (세션 15: DB 실측 기반 재정리)
   DB의 trainer_subtype 필드는 item/supporter/null 뿐이고, 도구는 card_type='포켓몬의 도구'에서 판별.
   tool은 trainerGroup()이 card_type 기반으로 합성 생성. stadium/fossil은 DB상 별도 분류 아니므로 제외. */
var TRAINER_SUBTYPES=[
  {key:'supporter',label:'서포트'},
  {key:'item',label:'아이템'},
  {key:'tool',label:'도구'}
];

/* ─── 카드 분류 헬퍼 (DB 필드 기반) ─── */
function cardStage(c){
  /* 진화 단계: card_type 한국어 텍스트 파싱 */
  if(!c||c.card_class!=='pokemon')return null;
  var t=c.card_type||'';
  if(t.indexOf('2진화')>=0)return 'stage2';
  if(t.indexOf('1진화')>=0)return 'stage1';
  /* 세션 15 버그 수정: V진화 포켓몬(VSTAR/VMAX)은 포켓몬 V에서 진화하는 1진화급 */
  if(t.indexOf('V진화')>=0)return 'stage1';
  if(t.indexOf('기본')>=0)return 'basic';
  return 'basic'; /* 기본값 — "포켓몬 GX", "TAG TEAM GX" 등 명시 없는 케이스 */
}
/* 트레이너 카드 통합 분류 (세션 15 신규)
   DB 불일치 해결: trainer_subtype은 'item'/'supporter'/null 뿐이고,
   도구 카드는 card_type='포켓몬의 도구'로 별도 분류돼있음.
   화석 카드는 DB상 그냥 아이템으로 저장 (별도 분류 없음).
   반환값: 'supporter' | 'item' | 'tool' */
function trainerGroup(c){
  if(!c||c.card_class!=='trainer')return null;
  /* card_type 우선 체크 — 도구는 여기에 있음 */
  var t=c.card_type||'';
  if(t.indexOf('포켓몬의 도구')>=0)return 'tool';
  /* trainer_subtype 기반 */
  var s=c.trainer_subtype;
  if(s==='supporter')return 'supporter';
  /* item 또는 null → 아이템으로 분류 (화석 포함) */
  return 'item';
}
function isBasicEnergy(c){
  /* 기본 에너지: card_class='energy' AND 이름에 "기본" 포함 또는 짧은 이름 */
  if(!c||c.card_class!=='energy')return false;
  var n=c.name_kr||'';
  /* 한국 카드는 "기본 불꽃 에너지" 같은 형식 또는 그냥 "불꽃 에너지" */
  /* 실용 휴리스틱: 이름이 "X 에너지" 형태고 "기본"이거나 카드 텍스트가 짧으면 기본 */
  if(n.indexOf('기본')>=0)return true;
  /* 보강: 11가지 기본 타입명 매칭 (세션 15: '노말'→'무색' 버그 수정) */
  var basicTypes=['불꽃','물','풀','번개','초','격투','악','강철','페어리','드래곤','무색'];
  for(var i=0;i<basicTypes.length;i++){
    if(n===basicTypes[i]+' 에너지')return true;
  }
  return false;
}
function isPrismStar(c){return c&&c.name_kr&&c.name_kr.indexOf('♢')>=0;}
function isRadiant(c){return c&&c.name_kr&&c.name_kr.indexOf('빛나는')>=0;}
function isAceSpec(c){
  /* DB에 명시 필드 없음 — effect_text 휴리스틱 */
  if(!c)return false;
  var t=(c.effect_text||'')+' '+(c.flavor_text||'');
  return t.indexOf('ACE SPEC')>=0||t.indexOf('에이스 스펙')>=0;
}

/* ─── 덱 카드 정규화 헬퍼 ─── 
   deck.cards가 객체({bc:qty})든 배열([{bs_code,qty},...])이든 
   항상 {bc:qty} 형태 객체로 변환. 모든 deck 입력 함수의 입구에서 호출. */
function normalizeDeckCards(deck){
  var out={};
  if(!deck||!deck.cards)return out;
  if(Array.isArray(deck.cards)){
    for(var i=0;i<deck.cards.length;i++){
      var it=deck.cards[i];
      if(it&&it.bs_code&&typeof it.qty==='number'&&it.qty>0)out[it.bs_code]=it.qty;
    }
  }else if(typeof deck.cards==='object'){
    for(var bc in deck.cards){
      var v=deck.cards[bc];
      if(typeof v==='number'&&v>0)out[bc]=v;
      else if(v&&typeof v==='object'&&typeof v.qty==='number'&&v.qty>0)out[bc]=v.qty;
    }
  }
  return out;
}

/* ─── 덱 카드 누적 카운터 ─── */
function deckCounts(deck){
  var pok=0,trn=0,ene=0,std=0,total=0;
  var cards=normalizeDeckCards(deck);
  for(var bc in cards){
    var qty=cards[bc];
    total+=qty;
    var c=dbByCode[bc];
    if(!c)continue;
    if(c.card_class==='pokemon')pok+=qty;
    else if(c.card_class==='trainer')trn+=qty;
    else if(c.card_class==='energy')ene+=qty;
    else if(c.card_class==='stadium')std+=qty;
  }
  return {pok:pok,trn:trn,ene:ene,std:std,total:total};
}

/* ─── 덱 검증 (룰 체크) ─── */
function validateDeck(deck){
  var errors=[],warnings=[],info=[];
  var cards=normalizeDeckCards(deck);
  var counts=deckCounts(deck);
  var target=deck.format==='half'?30:60;
  /* 자유 모드: 하프덱이지만 strict=false. 풀덱은 항상 정식 룰 */
  var strict=deck.format!=='half'||deck.strict!==false;
  var maxPerName=(deck.format==='half'&&strict)?2:4;

  /* 1) 총 매수 — 자유 모드여도 30/60 매수는 유지 */
  if(counts.total===target){
    info.push({lvl:'ok',msg:'카드 수: '+counts.total+'/'+target+' ✓'});
  }else if(counts.total<target){
    errors.push({lvl:'bad',msg:'카드가 '+(target-counts.total)+'장 부족합니다 ('+counts.total+'/'+target+')'});
  }else{
    errors.push({lvl:'bad',msg:'카드가 '+(counts.total-target)+'장 초과입니다 ('+counts.total+'/'+target+')'});
  }

  /* 2) 같은 이름 4장(2장) 제한 — 기본 에너지 예외 */
  var byName={}; /* {name_kr: qty} */
  var basics=0;
  for(var bc in cards){
    var qty=cards[bc];
    var c=dbByCode[bc];
    if(!c)continue;
    if(isBasicEnergy(c)){basics+=qty;continue;}
    var nm=c.name_kr||bc;
    byName[nm]=(byName[nm]||0)+qty;
  }
  for(var n in byName){
    if(byName[n]>maxPerName){
      errors.push({lvl:'bad',msg:'"'+n+'" '+byName[n]+'장 — '+maxPerName+'장 초과'});
    }
  }

  /* 3) 진화 라인 약식 검증 */
  var stageCount={basic:0,stage1:0,stage2:0};
  for(var bc2 in cards){
    var qty2=cards[bc2];
    var c2=dbByCode[bc2];
    if(!c2)continue;
    var st=cardStage(c2);
    if(st&&stageCount.hasOwnProperty(st))stageCount[st]+=qty2;
  }
  if((stageCount.stage1>0||stageCount.stage2>0)&&stageCount.basic===0){
    warnings.push({lvl:'warn',msg:'1·2진화 포켓몬이 있는데 기본 포켓몬이 0장이에요'});
  }
  if(stageCount.stage2>0&&stageCount.stage1===0){
    warnings.push({lvl:'warn',msg:'2진화 포켓몬이 있는데 1진화 포켓몬이 0장이에요'});
  }

  /* 4) 하프덱 전용: 2진화 금지 (정식 룰일 때만 ❌, 자유 모드면 ⚠️ 경고만) */
  if(deck.format==='half'&&strict){
    if(stageCount.stage2>0){
      errors.push({lvl:'bad',msg:'하프덱은 2진화 포켓몬을 사용할 수 없어요 ('+stageCount.stage2+'장 발견)'});
    }
  }else if(deck.format==='half'&&!strict&&stageCount.stage2>0){
    warnings.push({lvl:'warn',msg:'🎈 자유 모드: 2진화 '+stageCount.stage2+'장 사용 중 (정식 룰에선 ❌)'});
  }

  /* 5) 풀덱 전용: ACE SPEC / 프리즘스타 / 빛나는 1장 제한 */
  if(deck.format==='full'){
    var aceTotal=0,prismMap={},radTotal=0;
    for(var bc3 in cards){
      var qty3=cards[bc3];
      var c3=dbByCode[bc3];
      if(!c3)continue;
      if(isAceSpec(c3))aceTotal+=qty3;
      if(isPrismStar(c3)){
        var pn=c3.name_kr;
        prismMap[pn]=(prismMap[pn]||0)+qty3;
      }
      if(isRadiant(c3))radTotal+=qty3;
    }
    if(aceTotal>1)errors.push({lvl:'bad',msg:'ACE SPEC 카드는 덱 전체에 1장만 가능해요 ('+aceTotal+'장)'});
    for(var pn2 in prismMap){
      if(prismMap[pn2]>1)errors.push({lvl:'bad',msg:'프리즘스타 "'+pn2+'" — 1장만 가능 ('+prismMap[pn2]+'장)'});
    }
    if(radTotal>1)errors.push({lvl:'bad',msg:'빛나는 포켓몬은 덱 전체에 1장만 가능해요 ('+radTotal+'장)'});
  }

  /* 6) 정보: 카드 종류 분포 */
  if(counts.total>0){
    if(deck.format==='half'){
      info.push({lvl:'info',msg:'모드: '+(strict?'🔒 정식 룰':'🎈 자유 모드 (아이용)')});
    }
    info.push({lvl:'info',msg:'분포: 포켓몬 '+counts.pok+' · 트레이너 '+counts.trn+' · 에너지 '+counts.ene+(counts.std?' · 스타디움 '+counts.std:'')});
    /* 에너지 비율 권장 (기본 에너지만 카운트하지 않고 전체 에너지) */
    var eneRatio=counts.total>0?counts.ene/counts.total:0;
    if(counts.pok>0&&counts.ene===0){
      warnings.push({lvl:'warn',msg:'포켓몬은 있는데 에너지가 0장이에요'});
    }else if(counts.pok>0&&eneRatio<0.15){
      warnings.push({lvl:'warn',msg:'에너지 비율이 낮아요 ('+Math.round(eneRatio*100)+'% — 보통 20~28% 권장)'});
    }else if(counts.pok>0&&eneRatio>0.40){
      warnings.push({lvl:'warn',msg:'에너지 비율이 높아요 ('+Math.round(eneRatio*100)+'% — 보통 20~28% 권장)'});
    }
  }

  return {ok:errors.length===0,errors:errors,warnings:warnings,info:info,counts:counts};
}

/* ─── 덱 탭 메인 렌더 ─── */
function renderDeckTab(){
  if(!cardsDB.length){
    $('deck-r').innerHTML='<div class="loading"><div class="spinner"></div><p>카드 DB 로딩 중...</p></div>';
    return;
  }
  var h='';

  /* 새 덱 만들기 */
  h+='<div class="st">🆕 새 덱 만들기</div>';
  h+='<div class="deck-new-btns">';
  h+='<button class="deck-new-btn" onclick="newDeck(\'full\')"><span class="em">🎴</span>풀덱<span class="sub">60장 · 정식 룰</span></button>';
  h+='<button class="deck-new-btn half" onclick="newDeck(\'half\')"><span class="em">👨‍👦</span>하프덱<span class="sub">30장 · 아이와 함께</span></button>';
  h+='</div>';

  /* 내 덱 목록 */
  h+='<div class="deck-section"><div class="sh"><h4>📋 내 덱</h4></div>';
  var decks=D.customDecksV1||[];
  if(decks.length===0){
    h+='<div class="deck-empty">아직 만든 덱이 없어요. 위에서 풀덱 또는 하프덱을 만들어 보세요!</div>';
  }else{
    /* 최신순 */
    var sorted=decks.slice().sort(function(a,b){return (b.updatedAt||0)-(a.updatedAt||0);});
    for(var i=0;i<sorted.length;i++){
      var d=sorted[i];
      var v=validateDeck(d);
      var fmtCls=d.format==='half'?'half':'full';
      var fmtLbl=d.format==='half'?'하프덱':'풀덱';
      var statusPill=v.ok?'<span class="pill '+fmtCls+'">'+fmtLbl+'</span>':'<span class="pill bad">⚠️ 미완성</span>';
      h+='<div class="my-deck-card" onclick="viewDeckDetail(\''+esc(d.id)+'\')">';
      h+='<div style="flex:1;min-width:0"><div class="dn">'+esc(d.name||'(이름 없음)')+'</div>';
      h+='<div class="dm">'+statusPill+'<span class="pill">'+v.counts.total+'/'+(d.format==='half'?30:60)+'</span><span class="pill">🐉'+v.counts.pok+'</span><span class="pill">🛠️'+v.counts.trn+'</span><span class="pill">⚡'+v.counts.ene+'</span></div></div>';
      h+='<div class="da">';
      h+='<button class="btn btn-b" onclick="event.stopPropagation();editDeck(\''+esc(d.id)+'\')">편집</button>';
      h+='<button class="btn btn-d" onclick="event.stopPropagation();confirmDeleteDeck(\''+esc(d.id)+'\')">삭제</button>';
      h+='</div>';
      h+='</div>';
    }
  }
  h+='</div>';

  $('deck-r').innerHTML=h;
}

/* ─── 덱 상세 보기 모달 ─── */
function viewDeckDetail(id){
  var decks=D.customDecksV1||[];
  var d=null;
  for(var i=0;i<decks.length;i++)if(decks[i].id===id){d=decks[i];break;}
  if(!d){toast('덱을 찾을 수 없어요','#e74c3c');return;}
  /* 정규화 */
  var cards=normalizeDeckCards(d);
  var v=validateDeck(d);
  var target=d.format==='half'?30:60;
  var fmtLbl=d.format==='half'?'하프덱':'풀덱';
  var modeLbl='';
  if(d.format==='half')modeLbl=(d.strict===false)?' · 🎈 자유 모드':' · 🔒 정식 룰';

  var h='<h3>'+esc(d.name||'(이름 없음)')+'</h3>';
  h+='<p style="font-size:.75rem;color:var(--text3);text-align:center;margin-bottom:8px">'+fmtLbl+modeLbl+' · '+v.counts.total+'/'+target+'장</p>';

  /* 검증 요약 (간단히 한 줄) */
  if(v.errors.length>0){
    h+='<div style="background:#ffe8e8;border-radius:8px;padding:6px 10px;font-size:.72rem;color:var(--red);text-align:center;margin-bottom:10px">⚠️ '+v.errors.length+'개 룰 위반 — 미완성</div>';
  }else if(v.warnings.length>0){
    h+='<div style="background:#fff7e0;border-radius:8px;padding:6px 10px;font-size:.72rem;color:var(--orange);text-align:center;margin-bottom:10px">💡 '+v.warnings.length+'개 안내</div>';
  }else if(v.counts.total>0){
    h+='<div style="background:#e8f7f0;border-radius:8px;padding:6px 10px;font-size:.72rem;color:var(--green);text-align:center;margin-bottom:10px">✅ 완성된 덱</div>';
  }

  /* 카드 종류별 그룹핑 */
  var groups={pokemon:[],trainer:[],energy:[],stadium:[]};
  var labels={pokemon:'🐉 포켓몬',trainer:'🛠️ 트레이너',energy:'⚡ 에너지',stadium:'🏟️ 스타디움'};
  for(var bc in cards){
    var c=dbByCode[bc];
    if(!c)continue;
    var grp=c.card_class;
    if(!groups[grp])grp='trainer';
    groups[grp].push({card:c,qty:cards[bc]});
  }
  /* 각 그룹 안에서 이름순 */
  for(var g in groups){
    groups[g].sort(function(a,b){return (a.card.name_kr||'').localeCompare(b.card.name_kr||'');});
  }

  if(v.counts.total===0){
    h+='<div style="text-align:center;padding:16px;color:var(--text3);font-size:.78rem">덱이 비어있어요</div>';
  }else{
    h+='<div style="background:var(--bg3);border-radius:10px;padding:8px 10px;font-size:.78rem;max-height:50vh;overflow-y:auto">';
    var order=['pokemon','trainer','energy','stadium'];
    for(var k=0;k<order.length;k++){
      var key=order[k];
      var arr=groups[key];
      if(!arr.length)continue;
      var sub=0;for(var x=0;x<arr.length;x++)sub+=arr[x].qty;
      h+='<div style="font-family:var(--ft);color:var(--accent);font-size:.78rem;padding:6px 0 4px;border-bottom:2px solid var(--accent);margin-top:4px">'+labels[key]+' ('+sub+')</div>';
      for(var y=0;y<arr.length;y++){
        var item=arr[y];
        var c2=item.card;
        h+='<div onclick="event.stopPropagation();openCardFromDeck(\''+esc(d.id)+'\',\''+esc(c2.bs_code)+'\')" style="display:flex;justify-content:space-between;padding:7px 4px;border-bottom:1px solid var(--cb);cursor:pointer;border-radius:4px;transition:background .15s" onmouseover="this.style.background=\'var(--bg2)\'" onmouseout="this.style.background=\'\'"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(c2.name_kr||'')+'</span><span style="color:var(--text3);flex-shrink:0;margin-left:8px">×'+item.qty+'</span></div>';
      }
    }
    h+='</div>';
  }

  /* 액션 버튼 */
  h+='<div class="acts" style="margin-top:14px"><button class="btn btn-b" onclick="_returnToDeckId=null;closeM();editDeck(\''+esc(d.id)+'\')">✏️ 편집</button></div>';

  $('mb').innerHTML=h;
  $('mo').className='mo show';
}

/* ─── 새 덱 만들기 ─── */
function newDeck(format){
  var defName=format==='half'?'새 하프덱':'새 풀덱';
  _deckBuilder={
    id:'d_'+Date.now()+'_'+Math.floor(Math.random()*1000),
    name:defName,
    format:format,
    pool:'dex',
    strict:true, /* 하프덱 기본=정식 룰. 풀덱은 사용 안 함 */
    cards:{},
    isNew:true,
    createdAt:Date.now(),
    updatedAt:Date.now()
  };
  _lastAutoBuild=null; /* 세션 17: 새 덱 시작 시 레시피 초기화 */
  _deckPool='dex';
  _deckQuery='';
  _deckClassFilter='all';
  _deckStageFilter='all';
  _deckTypeFilter='all';
  _deckTrainerFilter='all';
  openDeckBuilder();
}

/* ─── 기존 덱 편집 ─── */
function editDeck(id){
  var decks=D.customDecksV1||[];
  var found=null;
  for(var i=0;i<decks.length;i++){
    if(decks[i].id===id){found=decks[i];break;}
  }
  if(!found){toast('덱을 찾을 수 없어요','#e74c3c');return;}
  /* 깊은 복사 + 정규화 */
  _deckBuilder={
    id:found.id,
    name:found.name||'',
    format:found.format||'full',
    pool:found.pool||'dex',
    strict:found.strict!==false, /* 기본 true (옛 덱 호환) */
    cards:normalizeDeckCards(found),
    isNew:false,
    createdAt:found.createdAt||Date.now(),
    updatedAt:found.updatedAt||Date.now(),
    lastAutoBuild:found.lastAutoBuild||null  /* 세션 17e: 저장된 레시피 복원 */
  };
  /* 세션 17e: 저장된 자동 빌드 레시피가 있으면 복원, 없으면 초기화 */
  _lastAutoBuild=_deckBuilder.lastAutoBuild||null;
  _deckPool=_deckBuilder.pool;
  _deckQuery='';
  _deckClassFilter='all';
  _deckStageFilter='all';
  _deckTypeFilter='all';
  _deckTrainerFilter='all';
  openDeckBuilder();
}

/* ─── 덱 삭제 ─── */
function confirmDeleteDeck(id){
  var decks=D.customDecksV1||[];
  var name='';
  for(var i=0;i<decks.length;i++)if(decks[i].id===id)name=decks[i].name||'';
  if(!confirm('"'+name+'" 덱을 삭제할까요? 되돌릴 수 없어요.'))return;
  D.customDecksV1=decks.filter(function(d){return d.id!==id;});
  sv();
  $('deck-r').dataset.rendered='';
  renderDeckTab();
  toast('덱이 삭제되었어요');
}

/* ─── 덱 빌더 열기 / 닫기 ─── */
function openDeckBuilder(){
  $('dbm').className='dbm show';
  $('dbmName').value=_deckBuilder.name||'';
  /* 포맷 표시 */
  var isHalf=_deckBuilder.format==='half';
  $('dbmFmt').textContent=isHalf?'하프덱 30':'풀덱 60';
  /* 풀 토글 */
  $('poolBtnDex').className='pool-btn'+(_deckPool==='dex'?' on':'');
  $('poolBtnColl').className='pool-btn'+(_deckPool==='collection'?' on':'');
  /* strict 모드 토글 버튼 (하프덱일 때만 표시) */
  updateStrictBtn();
  /* 필터칩 렌더 */
  renderDbmFilters();
  /* 검색 초기화 */
  $('dbmQuery').value='';
  /* 카드 그리드 + 카운터 */
  refreshDeckBuilder();
}
function updateStrictBtn(){
  var btn=$('dbmStrictBtn');
  if(!btn||!_deckBuilder)return;
  if(_deckBuilder.format!=='half'){
    btn.style.display='none';
    return;
  }
  btn.style.display='';
  if(_deckBuilder.strict===false){
    btn.textContent='🎈';
    btn.title='자유 모드 (아이용) — 탭하면 정식 룰로';
    btn.className='dbm-strict-btn free';
  }else{
    btn.textContent='🔒';
    btn.title='정식 룰 — 탭하면 자유 모드로';
    btn.className='dbm-strict-btn';
  }
}
function toggleStrictMode(){
  if(!_deckBuilder||_deckBuilder.format!=='half')return;
  _deckBuilder.strict=_deckBuilder.strict===false; /* 토글 */
  updateStrictBtn();
  if(_deckBuilder.strict){
    toast('🔒 정식 룰 모드 — 2진화 금지, 같은 카드 2장까지');
  }else{
    toast('🎈 자유 모드 — 2진화 OK, 같은 카드 4장까지');
  }
  /* 필터칩 재렌더 (자유 모드면 2진화 칩 다시 표시) */
  renderDbmFilters();
  refreshDeckBuilder();
}
function closeDeckBuilder(){
  if(_deckBuilder&&hasUnsavedChanges()){
    if(!confirm('저장하지 않은 변경사항이 있어요. 정말 닫을까요?'))return;
  }
  $('dbm').className='dbm';
  _deckBuilder=null;
}
function hasUnsavedChanges(){
  if(!_deckBuilder)return false;
  if(_deckBuilder.isNew){
    /* 새 덱은 카드 0이면 변경 없음 취급 */
    var n=0;for(var bc in _deckBuilder.cards)n+=(_deckBuilder.cards[bc]||0);
    return n>0;
  }
  /* 기존 덱: 원본과 비교 */
  var decks=D.customDecksV1||[];
  for(var i=0;i<decks.length;i++){
    if(decks[i].id===_deckBuilder.id){
      var orig=decks[i];
      if((orig.name||'')!==($('dbmName').value||''))return true;
      /* strict 모드 변경 감지 (하프덱만) */
      if(_deckBuilder.format==='half'){
        var origStrict=orig.strict!==false;
        var curStrict=_deckBuilder.strict!==false;
        if(origStrict!==curStrict)return true;
      }
      var origMap={};
      if(Array.isArray(orig.cards)){
        for(var j=0;j<orig.cards.length;j++){
          if(orig.cards[j]&&orig.cards[j].bs_code)origMap[orig.cards[j].bs_code]=orig.cards[j].qty||1;
        }
      }
      var allKeys={};
      for(var k in origMap)allKeys[k]=1;
      for(var k2 in _deckBuilder.cards)allKeys[k2]=1;
      for(var k3 in allKeys){
        if((origMap[k3]||0)!==(_deckBuilder.cards[k3]||0))return true;
      }
      return false;
    }
  }
  return true;
}

/* ─── 풀 토글 ─── */
function setDeckPool(pool){
  _deckPool=pool;
  if(_deckBuilder)_deckBuilder.pool=pool;
  $('poolBtnDex').className='pool-btn'+(pool==='dex'?' on':'');
  $('poolBtnColl').className='pool-btn'+(pool==='collection'?' on':'');
  refreshDeckBuilder();
}

/* ─── 검색 ─── */
function onDbmSearch(){
  _deckQuery=$('dbmQuery').value.trim();
  refreshDeckBuilder();
}

/* ─── 필터 칩 렌더 ─── */
function renderDbmFilters(){
  var h='';
  /* 1행: 카드 클래스 */
  h+='<button class="fchip'+(_deckClassFilter==='all'?' active':'')+'" onclick="setDeckFilter(\'class\',\'all\')">전체</button>';
  h+='<button class="fchip'+(_deckClassFilter==='pokemon'?' active':'')+'" onclick="setDeckFilter(\'class\',\'pokemon\')">🐉포켓몬</button>';
  h+='<button class="fchip'+(_deckClassFilter==='trainer'?' active':'')+'" onclick="setDeckFilter(\'class\',\'trainer\')">🛠️트레이너</button>';
  h+='<button class="fchip'+(_deckClassFilter==='energy'?' active':'')+'" onclick="setDeckFilter(\'class\',\'energy\')">⚡에너지</button>';
  h+='<button class="fchip'+(_deckClassFilter==='stadium'?' active':'')+'" onclick="setDeckFilter(\'class\',\'stadium\')">🏟️스타디움</button>';
  /* 2행: 포켓몬 선택 시 → 진화 단계 */
  if(_deckClassFilter==='pokemon'){
    h+='<span style="width:1px;background:var(--cb);margin:0 2px;align-self:stretch"></span>';
    h+='<button class="fchip'+(_deckStageFilter==='basic'?' active':'')+'" onclick="setDeckFilter(\'stage\',\'basic\')">기본</button>';
    h+='<button class="fchip'+(_deckStageFilter==='stage1'?' active':'')+'" onclick="setDeckFilter(\'stage\',\'stage1\')">1진화</button>';
    /* 2진화 칩: 풀덱 또는 하프덱 자유 모드일 때만 표시 */
    var hideStage2=_deckBuilder&&_deckBuilder.format==='half'&&_deckBuilder.strict!==false;
    if(!hideStage2){
      h+='<button class="fchip'+(_deckStageFilter==='stage2'?' active':'')+'" onclick="setDeckFilter(\'stage\',\'stage2\')">2진화</button>';
    }
    /* 3행: 포켓몬 타입 */
    h+='<span style="width:1px;background:var(--cb);margin:0 2px;align-self:stretch"></span>';
    for(var ti=0;ti<POKEMON_TYPES.length;ti++){
      var t=POKEMON_TYPES[ti];
      h+='<button class="fchip'+(_deckTypeFilter===t?' active':'')+'" onclick="setDeckFilter(\'type\',\''+esc(t)+'\')">'+esc(t)+'</button>';
    }
  }
  /* 트레이너 선택 시 → 세부 분류 */
  if(_deckClassFilter==='trainer'){
    h+='<span style="width:1px;background:var(--cb);margin:0 2px;align-self:stretch"></span>';
    for(var si=0;si<TRAINER_SUBTYPES.length;si++){
      var ts=TRAINER_SUBTYPES[si];
      h+='<button class="fchip'+(_deckTrainerFilter===ts.key?' active':'')+'" onclick="setDeckFilter(\'subtype\',\''+ts.key+'\')">'+esc(ts.label)+'</button>';
    }
  }
  $('dbmFilters').innerHTML=h;
}
function setDeckFilter(key,val){
  if(key==='class'){
    _deckClassFilter=val;
    /* 클래스 바뀌면 종속 필터 리셋 */
    if(val!=='pokemon'){_deckStageFilter='all';_deckTypeFilter='all';}
    if(val!=='trainer')_deckTrainerFilter='all';
  }else if(key==='stage'){
    _deckStageFilter=_deckStageFilter===val?'all':val;
  }else if(key==='type'){
    _deckTypeFilter=_deckTypeFilter===val?'all':val;
  }else if(key==='subtype'){
    _deckTrainerFilter=_deckTrainerFilter===val?'all':val;
  }
  renderDbmFilters();
  refreshDeckBuilder();
}

/* ─── 카드 풀 필터링 ─── */
function getDeckBuilderCards(){
  var pool=[];
  if(_deckPool==='collection'){
    /* 컬렉션에 있는 것만 */
    for(var bc in D.collected){
      var c=dbByCode[bc];
      if(c)pool.push(c);
    }
  }else{
    pool=cardsDB;
  }
  /* 클래스 필터 */
  var filtered=[];
  for(var i=0;i<pool.length;i++){
    var c=pool[i];
    if(!c)continue;
    if(_deckClassFilter!=='all'&&c.card_class!==_deckClassFilter)continue;
    if(_deckClassFilter==='pokemon'){
      if(_deckStageFilter!=='all'&&cardStage(c)!==_deckStageFilter)continue;
      if(_deckTypeFilter!=='all'&&c.pokemon_type!==_deckTypeFilter)continue;
    }
    if(_deckClassFilter==='trainer'){
      /* 세션 15: trainerGroup()으로 통합 분류 (도구는 card_type 기반) */
      if(_deckTrainerFilter!=='all'&&trainerGroup(c)!==_deckTrainerFilter)continue;
    }
    if(_deckQuery){
      var nm=c.name_kr||'';
      if(nm.indexOf(_deckQuery)<0)continue;
    }
    filtered.push(c);
  }
  return filtered;
}

/* ─── 빌더 새로고침 (그리드 + 카운터 + 진행바) ─── */
function refreshDeckBuilder(){
  if(_deckBuilderRendering)return;
  _deckBuilderRendering=true;
  try{
    if(!_deckBuilder)return;
    /* 카운터 */
    var counts=deckCounts(_deckBuilder);
    var target=_deckBuilder.format==='half'?30:60;
    $('cntPok').textContent=counts.pok;
    $('cntTrn').textContent=counts.trn;
    $('cntEne').textContent=counts.ene;
    $('cntStd').textContent=counts.std;
    $('dbmCount').textContent=counts.total+'/'+target;
    var pct=Math.min(100,Math.round(counts.total/target*100));
    var prog=$('dbmProg');
    prog.style.width=pct+'%';
    prog.className='progress-bar'+(counts.total>target?' over':'');

    /* 카드 그리드 */
    var cards=getDeckBuilderCards();
    var MAX_SHOW=240;
    var shown=cards.slice(0,MAX_SHOW);
    var grid=$('dbmGrid');
    if(shown.length===0){
      var emptyMsg=_deckPool==='collection'?'내 컬렉션에 카드가 없어요. 도감 모드로 전환해 보세요.':'검색 결과가 없어요';
      grid.innerHTML='<div class="dbm-empty">'+emptyMsg+'</div>';
      _deckBuilderRendering=false;
      return;
    }
    var h='';
    for(var i=0;i<shown.length;i++){
      var c=shown[i];
      var bc=c.bs_code;
      var qty=_deckBuilder.cards[bc]||0;
      var hasIt=qty>0;
      var isHalf2=_deckBuilder.format==='half';
      var strict2=!isHalf2||_deckBuilder.strict!==false;
      var maxPerName=(isHalf2&&strict2)?2:4;
      var basicEne=isBasicEnergy(c);
      /* 같은 이름 누적 (제한 표시용) */
      var sameNameTotal=0;
      if(!basicEne){
        for(var bc2 in _deckBuilder.cards){
          var c2=dbByCode[bc2];
          if(c2&&c2.name_kr===c.name_kr)sameNameTotal+=(_deckBuilder.cards[bc2]||0);
        }
      }
      var over=!basicEne&&sameNameTotal>maxPerName;
      var img=c.image_url||placeholderImg(c.name_kr);
      h+='<div class="db-card'+(hasIt?' has':'')+'" onclick="addToDeck(\''+esc(bc)+'\')">';
      h+='<img src="'+esc(img)+'" loading="lazy" onerror="this.src=\''+placeholderImg(c.name_kr)+'\'">';
      if(hasIt){
        h+='<div class="qty-badge'+(over?' over':'')+'">'+qty+'</div>';
        h+='<div class="qm" onclick="event.stopPropagation();removeFromDeck(\''+esc(bc)+'\')">−</div>';
      }
      h+='<div class="nm">'+esc(c.name_kr||'')+'</div>';
      h+='</div>';
    }
    if(cards.length>MAX_SHOW){
      h+='<div class="dbm-empty">'+cards.length+'장 중 '+MAX_SHOW+'장 표시 중<br><span style="font-size:.7rem">검색·필터로 좁혀주세요</span></div>';
    }
    grid.innerHTML=h;
  }finally{
    _deckBuilderRendering=false;
  }
}

/* ─── 카드 +1 / -1 ─── */
function addToDeck(bs_code){
  if(!_deckBuilder)return;
  var c=dbByCode[bs_code];
  if(!c){toast('카드 정보를 찾을 수 없어요','#e74c3c');return;}
  var isHalf=_deckBuilder.format==='half';
  var strict=!isHalf||_deckBuilder.strict!==false;
  var maxPerName=(isHalf&&strict)?2:4;
  var basicEne=isBasicEnergy(c);
  /* 하프덱 정식 룰: 2진화 차단 / 자유 모드: 허용 */
  if(isHalf&&strict&&cardStage(c)==='stage2'){
    toast('🔒 정식 룰: 하프덱은 2진화 못 넣어요. 🎈로 전환하면 가능','#f39c12');return;
  }
  /* 같은 이름 N장 제한 — 기본 에너지는 예외 */
  if(!basicEne){
    var sameNameTotal=0;
    for(var bc in _deckBuilder.cards){
      var cc=dbByCode[bc];
      if(cc&&cc.name_kr===c.name_kr)sameNameTotal+=(_deckBuilder.cards[bc]||0);
    }
    if(sameNameTotal>=maxPerName){
      toast('"'+c.name_kr+'"는 '+maxPerName+'장까지만 가능해요','#f39c12');return;
    }
  }
  /* 총 매수 차단 — 자유 모드여도 30/60 매수는 유지 */
  var counts=deckCounts(_deckBuilder);
  var target=isHalf?30:60;
  if(counts.total>=target){
    toast('덱이 이미 '+target+'장이에요','#f39c12');return;
  }
  _deckBuilder.cards[bs_code]=(_deckBuilder.cards[bs_code]||0)+1;
  refreshDeckBuilder();
  /* 시트 열려있으면 같이 갱신 */
  if($('dbs').className.indexOf('show')>=0)renderDeckSheet();
}
function removeFromDeck(bs_code){
  if(!_deckBuilder||!_deckBuilder.cards[bs_code])return;
  _deckBuilder.cards[bs_code]--;
  if(_deckBuilder.cards[bs_code]<=0)delete _deckBuilder.cards[bs_code];
  refreshDeckBuilder();
  if($('dbs').className.indexOf('show')>=0)renderDeckSheet();
}

/* ─── 덱 비우기 ─── */
function confirmClearDeck(){
  if(!_deckBuilder)return;
  var counts=deckCounts(_deckBuilder);
  if(counts.total===0){toast('이미 비어있어요');return;}
  if(!confirm('덱의 모든 카드('+counts.total+'장)를 비울까요?'))return;
  _deckBuilder.cards={};
  refreshDeckBuilder();
  if($('dbs').className.indexOf('show')>=0)renderDeckSheet();
}

/* ─── 현재 덱 시트 ─── */
function openDeckSheet(){
  $('dbs').className='dbs show';
  renderDeckSheet();
}
function closeDeckSheet(){$('dbs').className='dbs';}
function renderDeckSheet(){
  if(!_deckBuilder)return;
  /* 카드 종류별 그룹핑 */
  var groups={pokemon:[],trainer:[],energy:[],stadium:[]};
  var labels={pokemon:'🐉 포켓몬',trainer:'🛠️ 트레이너',energy:'⚡ 에너지',stadium:'🏟️ 스타디움'};
  for(var bc in _deckBuilder.cards){
    var qty=_deckBuilder.cards[bc]||0;
    if(qty<=0)continue;
    var c=dbByCode[bc];
    if(!c)continue;
    var grp=c.card_class;
    if(!groups[grp])grp='trainer';
    groups[grp].push({card:c,qty:qty});
  }
  /* 각 그룹 안에서 이름순 */
  for(var g in groups){
    groups[g].sort(function(a,b){return (a.card.name_kr||'').localeCompare(b.card.name_kr||'');});
  }
  var counts=deckCounts(_deckBuilder);
  var target=_deckBuilder.format==='half'?30:60;
  var h='';

  /* 🎲 세션 17: 자동 빌드 직후라면 레시피 카드 표시 — 아이 친화 요약 + 다시 뽑기.
     주인공 카드가 덱에 실제로 남아있을 때만 (수동 편집으로 지웠으면 자동 숨김). */
  if(_lastAutoBuild&&_lastAutoBuild.recipe&&_deckBuilder.cards[_lastAutoBuild.basicBsCode]>0){
    var r=_lastAutoBuild.recipe;
    h+='<div class="recipe-card">';
    h+='<div class="rc-title">🪄 자동 빌드 레시피';
    h+='<button class="rc-reroll" onclick="rerollAutoBuild()" title="다시 뽑기">🎲 다시 뽑기</button>';
    h+='</div>';
    h+='<div class="rc-row"><span class="rc-ic">🌟</span><span class="rc-lbl">주인공</span><span class="rc-val">'+esc(r.protagonist)+'</span><span class="rc-qty">×'+r.protagonistQty+'</span></div>';
    /* 세션 17c: 합계 표시 — 사용자가 한눈에 포켓몬/트레이너/에너지 개수 진단 */
    var pokTarget=(_lastAutoBuild.isHalf?6:12);
    var pokLow=(typeof r.pokQty==='number'&&r.pokQty<pokTarget);
    h+='<div class="rc-row'+(pokLow?' rc-warn':'')+'"><span class="rc-ic">🐉</span><span class="rc-lbl">포켓몬 합계</span><span class="rc-val">'+(r.pokQty||0)+'/'+pokTarget+'장</span></div>';
    /* 세션 17d: 진단 행 — Pokemon이 부족할 때 후보 스캔 결과 노출 (디버그) */
    if(pokLow){
      h+='<div class="rc-row rc-warn"><span class="rc-ic">🔍</span><span class="rc-lbl">진단</span><span class="rc-val">컬렉션 '+r.fillerScanned+'장 스캔 → 같은 타입('+esc(r.energyType||'?')+') Basic '+r.fillerMatched+'장 발견</span></div>';
    }
    if(r.drawName){
      h+='<div class="rc-row"><span class="rc-ic">🎴</span><span class="rc-lbl">카드 뽑기 도우미</span><span class="rc-val">'+esc(r.drawName)+'</span><span class="rc-qty">×'+r.drawQty+'</span></div>';
    }else if(typeof r.trnQty==='number'&&r.trnQty===0){
      /* 세션 17b: 트레이너 0장 경고 행 — 가장 흔한 사각지대 */
      h+='<div class="rc-row rc-warn"><span class="rc-ic">⚠️</span><span class="rc-lbl">트레이너</span><span class="rc-val">카드가 없어요 — 먼저 등록해 봐요!</span></div>';
    }
    if(r.energyName){
      h+='<div class="rc-row"><span class="rc-ic">⚡</span><span class="rc-lbl">에너지</span><span class="rc-val">'+esc(r.energyName)+'</span><span class="rc-qty">×'+r.energyQty+'</span></div>';
    }
    h+='</div>';
  }

  if(counts.total===0){
    h+='<div class="dbm-empty" style="grid-column:none">덱이 비어있어요</div>';
  }else{
    var order=['pokemon','trainer','energy','stadium'];
    for(var k=0;k<order.length;k++){
      var key=order[k];
      var arr=groups[key];
      if(!arr.length)continue;
      var sub=0;for(var x=0;x<arr.length;x++)sub+=arr[x].qty;
      h+='<div class="dbs-cat">'+labels[key]+' ('+sub+')</div>';
      for(var y=0;y<arr.length;y++){
        var item=arr[y];
        var c2=item.card;
        var img2=c2.image_url||placeholderImg(c2.name_kr);
        h+='<div class="dbs-row">';
        h+='<img src="'+esc(img2)+'" loading="lazy" onerror="this.src=\''+placeholderImg(c2.name_kr)+'\'">';
        h+='<div style="flex:1;min-width:0"><div class="nm">'+esc(c2.name_kr||'')+'</div>';
        h+='<div class="ty">'+esc(c2.card_type||c2.card_class||'')+'</div></div>';
        h+='<div class="qctl">';
        h+='<button onclick="removeFromDeck(\''+esc(c2.bs_code)+'\')">−</button>';
        h+='<b>'+item.qty+'</b>';
        h+='<button onclick="addToDeck(\''+esc(c2.bs_code)+'\')">+</button>';
        h+='</div></div>';
      }
    }
    h+='<div style="text-align:center;padding:14px 0 8px;color:var(--text3);font-size:.78rem">합계: '+counts.total+'/'+target+'</div>';
  }
  $('dbsList').innerHTML=h;
}

/* ─── 검증 결과 모달 ─── */
function openValidationModal(){
  if(!_deckBuilder)return;
  /* 임시로 이름 반영 (검증 자체는 이름 무관하지만 일관성) */
  _deckBuilder.name=$('dbmName').value||_deckBuilder.name;
  var v=validateDeck(_deckBuilder);
  var h='<h3>덱 검증 결과</h3>';
  h+='<div class="vr-list">';
  if(v.errors.length===0&&v.warnings.length===0){
    h+='<div class="vr-row ok"><span class="ic">✅</span><span>모든 룰을 통과했어요!</span></div>';
  }
  for(var i=0;i<v.errors.length;i++){
    h+='<div class="vr-row bad"><span class="ic">❌</span><span>'+esc(v.errors[i].msg)+'</span></div>';
  }
  for(var j=0;j<v.warnings.length;j++){
    h+='<div class="vr-row warn"><span class="ic">⚠️</span><span>'+esc(v.warnings[j].msg)+'</span></div>';
  }
  for(var k=0;k<v.info.length;k++){
    var lvl=v.info[k].lvl||'info';
    h+='<div class="vr-row '+lvl+'"><span class="ic">'+(lvl==='ok'?'✓':'ℹ️')+'</span><span>'+esc(v.info[k].msg)+'</span></div>';
  }
  h+='</div>';
  h+='<p style="font-size:.7rem;color:var(--text3);text-align:center;margin-top:8px">⚠️ 경고가 있어도 저장은 가능합니다</p>';
  $('mb').innerHTML=h;
  $('mo').className='mo show';
}

/* ─── 덱 저장 ─── */
function saveCurrentDeck(){
  if(!_deckBuilder)return;
  var name=($('dbmName').value||'').trim();
  if(!name){toast('덱 이름을 입력해주세요','#f39c12');$('dbmName').focus();return;}
  if(name.length>30)name=name.substring(0,30);
  _deckBuilder.name=name;
  _deckBuilder.updatedAt=Date.now();
  /* cards 객체 → 배열로 직렬화 (Firestore 친화적) */
  var cardsArr=[];
  for(var bc in _deckBuilder.cards){
    var qty=_deckBuilder.cards[bc]||0;
    if(qty>0)cardsArr.push({bs_code:bc,qty:qty});
  }
  var saveObj={
    id:_deckBuilder.id,
    name:_deckBuilder.name,
    format:_deckBuilder.format,
    pool:_deckBuilder.pool,
    strict:_deckBuilder.format==='half'?(_deckBuilder.strict!==false):true,
    cards:cardsArr,
    createdAt:_deckBuilder.createdAt,
    updatedAt:_deckBuilder.updatedAt,
    lastAutoBuild:_deckBuilder.lastAutoBuild||null  /* 세션 17e: 레시피도 함께 저장 */
  };
  if(!Array.isArray(D.customDecksV1))D.customDecksV1=[];
  /* upsert */
  var found=false;
  for(var i=0;i<D.customDecksV1.length;i++){
    if(D.customDecksV1[i].id===_deckBuilder.id){
      D.customDecksV1[i]=saveObj;
      found=true;break;
    }
  }
  if(!found)D.customDecksV1.push(saveObj);
  _deckBuilder.isNew=false;
  sv();
  toast('💾 "'+name+'" 저장 완료');
  /* 덱 탭 갱신 */
  $('deck-r').dataset.rendered='';
}

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
var _sonnetRetryBusy=false;       /* Sonnet 재시도 진행 중 (세션 10.4) */

/* ─── 진입/종료 ─── */
function startScan(){
  _scanSessionCount=0;
  updateScanCount();
  $('scanFs').className='scan-fs on';
  setScanModelBadge();
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

/* ─── Sonnet 재시도 (세션 10.4)
   인식 실패 시, 같은 사진을 Sonnet 모델로 다시 호출.
   결과 패널은 그대로 유지하면서 안의 내용만 갱신. */
function retryWithSonnet(){
  if(_sonnetRetryBusy)return;
  if(!_scanShotDataUrl){toast('재시도할 사진이 없습니다','#e74c3c');return;}
  /* Sonnet 모델 찾기 */
  var sonnetModel=null;
  for(var i=0;i<SCAN_MODELS_LIST.length;i++){
    if(SCAN_MODELS_LIST[i].id==='claude-sonnet-4-5'){sonnetModel=SCAN_MODELS_LIST[i];break;}
  }
  if(!sonnetModel){toast('Sonnet 모델 정의 없음','#e74c3c');return;}

  _sonnetRetryBusy=true;
  /* 결과 패널 안의 버튼 즉시 비활성화 표시 */
  renderScanResultBody();

  var b64=_scanShotDataUrl.replace(/^data:image\/jpeg;base64,/,'');
  var prompt=buildScanPrompt();
  var debugAll={model:sonnetModel.label,startedAt:Date.now()};

  callWorkerWithFallback(sonnetModel.id,b64,prompt).then(function(parsed){
    debugAll.attempts=parsed._debug?parsed._debug.attempts:[];
    debugAll.totalMs=Date.now()-debugAll.startedAt;
    var result={
      candidates:parsed.candidates||[],
      provider:sonnetModel.id,
      modelLabel:sonnetModel.label,
      raw:parsed,
      debug:debugAll
    };
    _sonnetRetryBusy=false;
    _scanProvider=sonnetModel.id;
    setScanModelBadge();
    console.log('[Scan][Sonnet retry] success',result.modelLabel,result.debug);
    var matched=matchCandidatesToDB(result.candidates);
    showScanResult(matched,_scanShotDataUrl,result);
    if(matched.length){
      toast('✅ Sonnet 인식 성공','#27ae60');
    }else{
      toast('Sonnet도 인식 못함','#f39c12');
    }
  }).catch(function(err){
    _sonnetRetryBusy=false;
    debugAll.attempts=err.debug?err.debug.attempts:[];
    debugAll.error=err.message;
    debugAll.totalMs=Date.now()-debugAll.startedAt;
    var msg=err&&err.message?err.message:String(err);
    console.error('[Scan][Sonnet retry] FAILED',msg,debugAll);
    toast('❌ Sonnet 재시도 실패','#e74c3c');
    showScanResult([],_scanShotDataUrl,{candidates:[],provider:null,error:msg,debug:debugAll});
  });
}

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
  /* JPEG 품질 0.90 — 글자 디테일 보존을 위해 0.82에서 상향 (세션 10) */
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
    '- pack: 카드 우하단의 팩 한글명 또는 팩 코드(예: "M3", "SV1A", "S11a")\n'+
    '- card_no: 카드 좌하단 또는 우하단의 "001/100" 형식 그대로. **이 필드가 가장 중요함** — 이름이 흐릿해도 번호는 또렷한 경우가 많음. 숫자 한 자리도 틀리지 말 것. 번호가 안 보이면 빈 문자열로.\n'+
    '- 최대 3개 후보를 confidence 높은 순으로 (high/medium/low)\n'+
    '- 카드가 안 보이거나 읽을 수 없으면 candidates를 빈 배열 []로\n'+
    '- 일본판/영문판이면 한글로 가장 가까운 이름으로 추정 + confidence를 low로';
}

/* ─── 후보 → 한글 DB 매칭 (4단계 fallback)
   세션 10.4: 이름 없이 카드번호만 있는 후보도 허용 (프리즘 카드 폴백) */
function matchCandidatesToDB(candidates){
  if(!candidates||!candidates.length)return [];
  var results=[];
  var seen={};
  for(var i=0;i<candidates.length;i++){
    var cand=candidates[i];
    if(!cand)continue;
    if(!cand.name_kr&&!cand.card_no)continue;
    var matches=findCardsInDB(cand);
    for(var j=0;j<matches.length;j++){
      var m=matches[j];
      if(seen[m.bs_code])continue;
      seen[m.bs_code]=true;
      results.push({
        card:m,
        confidence:cand.confidence||'medium',
        candidateName:cand.name_kr||('번호 '+cand.card_no)
      });
      if(results.length>=3)break;
    }
    if(results.length>=3)break;
  }
  return results;
}

/* 카드번호 정규화 — "009/068" / "009" / "9" 등을 모두 비교 가능한 형태로
   결과: {num: "9" (앞 0 제거), full: "009/068" (있으면)} */
function normalizeCardNo(raw){
  if(raw==null)return null;
  var s=String(raw).trim();
  if(!s)return null;
  /* 슬래시 앞부분만 추출, 숫자만 남기고 앞 0 제거 */
  var head=s.split('/')[0].replace(/[^0-9]/g,'').replace(/^0+/,'');
  if(!head)return null;
  return head;
}

function findCardsInDB(cand){
  if(!cardsDB||!cardsDB.length)return [];
  var name=String(cand.name_kr||'').trim();

  /* 1단계: 정확 일치 */
  if(name){
    var exact=cardsDB.filter(function(c){return c.name_kr===name;});
    if(exact.length){
      return narrowByMeta(exact,cand);
    }
  }

  /* 2단계: 부분 일치 (양방향) */
  if(name){
    var partial=cardsDB.filter(function(c){
      if(!c.name_kr)return false;
      return c.name_kr.indexOf(name)>=0||name.indexOf(c.name_kr)>=0;
    });
    if(partial.length){
      return narrowByMeta(partial,cand).slice(0,5);
    }
  }

  /* 3단계: 공백/특수문자 제거 후 부분 일치 */
  if(name){
    var norm=name.replace(/[\s\-·.]/g,'');
    var loose=cardsDB.filter(function(c){
      if(!c.name_kr)return false;
      var n=c.name_kr.replace(/[\s\-·.]/g,'');
      return n.indexOf(norm)>=0||norm.indexOf(n)>=0;
    });
    if(loose.length){
      return narrowByMeta(loose,cand).slice(0,3);
    }
  }

  /* 4단계 (세션 10.4): 이름 매칭 완전 실패 → 카드번호 + 팩 코드로 직접 검색
     프리즘/홀로 카드에서 이름 OCR이 깨져도 번호/팩만 정확하면 잡힘 */
  var cnNorm=normalizeCardNo(cand.card_no);
  if(cnNorm){
    var byNo=cardsDB.filter(function(c){
      var dbNo=normalizeCardNo(c.card_no);
      return dbNo===cnNorm;
    });
    if(byNo.length){
      /* 팩으로 좁히기 (있으면) */
      if(cand.pack&&byNo.length>1){
        var pk=String(cand.pack).toUpperCase();
        var packNarrow=byNo.filter(function(c){
          var code=(c.pack_code||'').toUpperCase();
          var pname=(c.pack_name_kr||'');
          return code===pk||code.indexOf(pk)>=0||pk.indexOf(code)>=0||pname.indexOf(cand.pack)>=0;
        });
        if(packNarrow.length)byNo=packNarrow;
      }
      /* HP로 추가 좁히기 (포켓몬) */
      if(cand.hp!=null&&!isNaN(parseInt(cand.hp,10))&&byNo.length>1){
        var hpVal=parseInt(cand.hp,10);
        var hpNarrow=byNo.filter(function(c){return c.hp===hpVal;});
        if(hpNarrow.length)byNo=hpNarrow;
      }
      return byNo.slice(0,3);
    }
  }

  return [];
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
    var cn=normalizeCardNo(cand.card_no);
    if(cn){
      var noMatch=filtered.filter(function(c){
        return normalizeCardNo(c.card_no)===cn;
      });
      if(noMatch.length)filtered=noMatch;
    }
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
    /* 세션 10.4: 마지막 시도가 Haiku였으면 Sonnet 재시도 버튼 노출
       같은 사진(_scanShotDataUrl)을 Sonnet으로 다시 호출 → 비용 최소, 정확도 확보 */
    var lastModel=(_scanLastError&&_scanLastError.debug&&_scanLastError.debug.model)||'';
    var canRetrySonnet=_scanShotDataUrl&&lastModel.indexOf('Haiku')>=0&&!_sonnetRetryBusy;
    html+='<div class="sr-actions">';
    if(canRetrySonnet){
      html+='<button class="sr-btn premium" onclick="retryWithSonnet()">🔄 Sonnet 4.5로 재시도</button>';
    }
    if(_sonnetRetryBusy){
      html+='<button class="sr-btn premium" disabled>⏳ Sonnet 인식 중...</button>';
    }
    html+='<button class="sr-btn secondary" onclick="retakeScan()">📸 재촬영</button>'+
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
    /* 세션 14: 자동 빌드 데이터 로딩 (병렬, DB 로드 후 백그라운드) */
    loadEvolutionData();
    loadTrainerCategories();
  });
});
