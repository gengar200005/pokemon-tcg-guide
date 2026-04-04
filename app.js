/* Pokemon TCG Guide - App Logic */

/* ═══ Tab Switch ═══ */
function switchTab(id,btn){
  var tabs=document.getElementById('tabbar').getElementsByTagName('button');
  for(var i=0;i<tabs.length;i++){tabs[i].className='tab';}
  btn.className='tab on';
  var ids=['rules','dex','coll','scan','deck','rec','battle','rare'];
  for(var j=0;j<ids.length;j++){
    var el=document.getElementById('p-'+ids[j]);
    if(el){el.className=(ids[j]===id)?'pnl on':'pnl';}
  }
  if(id==='coll')try{rColl();}catch(e){}
  if(id==='deck')try{rDecks();}catch(e){}
  if(id==='rare')try{rRare();}catch(e){}
  if(id==='battle')try{rBattleSel();}catch(e){}
}
function togAcc(el){el.classList.toggle('open');el.nextElementSibling.classList.toggle('open');}
function closeM(){document.getElementById('mo').className='mo';}

/* ═══ KR2EN Mapping ═══ */
var KR2EN={};
(function(){
var g=[
'이상해씨:Bulbasaur,이상해풀:Ivysaur,이상해꽃:Venusaur,파이리:Charmander,리자드:Charmeleon,리자몽:Charizard,꼬부기:Squirtle,어니부기:Wartortle,거북왕:Blastoise,캐터피:Caterpie,버터플:Butterfree,피카츄:Pikachu,라이츄:Raichu,니드퀸:Nidoqueen,니드킹:Nidoking,삐삐:Clefairy,픽시:Clefable,식스테일:Vulpix,나인테일:Ninetales,푸린:Jigglypuff,주뱃:Zubat,골뱃:Golbat,뚜벅초:Oddish,라플레시아:Vileplume,디그다:Diglett,나옹:Meowth,고라파덕:Psyduck,골덕:Golduck,가디:Growlithe,윈디:Arcanine,케이시:Abra,후딘:Alakazam,괴력몬:Machamp,야돈:Slowpoke,야도란:Slowbro,코일:Magnemite,레어코일:Magneton,질퍽이:Grimer,팬텀:Gengar,고오스:Gastly,고우스트:Haunter,롱스톤:Onix,슬리퍼:Hypno,마임맨:Mr. Mime,스라크:Scyther,에레브:Electabuzz,마그마:Magmar,잉어킹:Magikarp,갸라도스:Gyarados,라프라스:Lapras,메타몽:Ditto,이브이:Eevee,샤미드:Vaporeon,쥬피썬더:Jolteon,부스터:Flareon,폴리곤:Porygon,프테라:Aerodactyl,잠만보:Snorlax,프리져:Articuno,썬더:Zapdos,파이어:Moltres,미니드래곤:Dratini,망나뇽:Dragonite,뮤츠:Mewtwo,뮤:Mew',
'치코리타:Chikorita,메가니움:Meganium,브케인:Cyndaquil,블레이범:Typhlosion,리아코:Totodile,장크로다일:Feraligatr,피츄:Pichu,토게피:Togepi,토게틱:Togetic,에이팜:Aipom,에브이:Espeon,블래키:Umbreon,마릴:Marill,마릴리:Azumarill,글라이거:Gligar,스틸릭스:Steelix,핫삼:Scizor,헤라크로스:Heracross,델빌:Houndour,헬가:Houndoom,포트데스:Kingdra,해피너스:Blissey,라이코:Raikou,엔테이:Entei,스이쿤:Suicune,요기라스:Larvitar,마기라스:Tyranitar,루기아:Lugia,칠색조:Ho-Oh,세레비:Celebi',
'나무지기:Treecko,나무킹:Sceptile,아차모:Torchic,번치코:Blaziken,물짱이:Mudkip,대짱이:Swampert,랄토스:Ralts,킬리아:Kirlia,가디안:Gardevoir,게을킹:Slaking,플러시:Plusle,마이농:Minun,샤프니아:Sharpedo,밀로틱:Milotic,어둠여우:Absol,다골:Beldum,메탕:Metang,메타그로스:Metagross,타츠:Bagon,쉘곤:Shelgon,보만다:Salamence,레지락:Regirock,레지아이스:Regice,레지스틸:Registeel,라티아스:Latias,라티오스:Latios,가이오가:Kyogre,그란돈:Groudon,레쿠쟈:Rayquaza,지라치:Jirachi,테오키스:Deoxys',
'모부기:Turtwig,토대부기:Torterra,불꽃숭이:Chimchar,초염몽:Infernape,팽도리:Piplup,엠페르트:Empoleon,찌르호크:Staraptor,렌트라:Luxray,로즈레이드:Roserade,루카리오:Lucario,리오루:Riolu,딥상어동:Gible,한카리아스:Gabite,가부리아스:Garchomp,리피아:Leafeon,글레이시아:Glaceon,맘모꾸리:Mamoswine,엘레이드:Gallade,토게키스:Togekiss,폴리곤Z:Porygon-Z,유크시:Uxie,엠라이트:Mesprit,아그놈:Azelf,디아루가:Dialga,펄기아:Palkia,히드런:Heatran,레지기가스:Regigigas,기라티나:Giratina,크레세리아:Cresselia,다크라이:Darkrai,쉐이미:Shaymin,아르세우스:Arceus',
'비크티니:Victini,주리비얀:Snivy,샤로다:Serperior,뚜꾸리:Tepig,염무왕:Emboar,수댕이:Oshawott,대검귀:Samurott,조로아:Zorua,조로아크:Zoroark,치라미:Minccino,모노두:Deino,삼삼드래:Hydreigon,볼켄:Volcarona,코바르온:Cobalion,테라키온:Terrakion,비리디온:Virizion,토네로스:Tornadus,볼트로스:Thundurus,레시라무:Reshiram,제크롬:Zekrom,랜드로스:Landorus,큐레무:Kyurem,켈디오:Keldeo,메로엣타:Meloetta,게노세크트:Genesect',
'도치마론:Chespin,브리가론:Chesnaught,푸호꼬:Fennekin,마폭시:Delphox,개구마르:Froakie,개굴닌자:Greninja,님피아:Sylveon,루차불:Hawlucha,데덴네:Dedenne,미끄래곤:Goodra,제르네아스:Xerneas,이벨타르:Yveltal,지가르데:Zygarde,디안시:Diancie,후파:Hoopa,볼케니온:Volcanion',
'나몰빼미:Rowlet,모크나이퍼:Decidueye,냐오불:Litten,어흥염:Incineroar,누리공:Popplio,누리보스:Primarina,이와늑대:Lycanroc,미믹큐:Mimikyu,큐아르:Togedemaru,솔가레오:Solgaleo,루나아라:Lunala,카푸꼬꼬꼬:Tapu Koko,카푸나비나:Tapu Lele,네크로즈마:Necrozma,마샤도:Marshadow,제라오라:Zeraora',
'흥나숭이:Grookey,고릴타:Rillaboom,염버니:Scorbunny,에이스번:Cinderace,울머기:Sobble,인텔리레온:Inteleon,갈가부기:Corviknight,약어리:Toxel,스트린더:Toxtricity,두랄루돈:Duraludon,드래펄트:Dragapult,자시안:Zacian,자마젠타:Zamazenta,무한다이노:Eternatus,레지에레키:Regieleki,레지드래고:Regidrago,버드렉스:Calyrex,우르프:Urshifu',
'뉴비:Sprigatito,마스카나:Meowscarada,크래피:Fuecoco,라우드보네:Skeledirge,꾸왁스:Quaxly,웨이니발:Quaquaval,파모:Pawmi,파모트:Pawmo,파모트리:Pawmot,가르가나클:Garganacl,팔미기모스:Armarouge,소울블레이즈:Ceruledge,딜클레이스:Tinkaton,깨비드릴조:Kingambit,코라이돈:Koraidon,미라이돈:Miraidon,테라파고스:Terapagos'
];
for(var i=0;i<g.length;i++){
  var pairs=g[i].split(',');
  for(var p=0;p<pairs.length;p++){
    var idx=pairs[p].indexOf(':');
    if(idx>0)KR2EN[pairs[p].substring(0,idx)]=pairs[p].substring(idx+1);
  }
}
})();

/* ═══ Firebase Init ═══ */
var auth=null,db=null,currentUser=null,_syncTimeout=null;
try{
  var firebaseConfig={
    apiKey:"AIzaSyADTV_fzwM7ZoaLq95yY-o5ZjCKrI_yJW8",
    authDomain:"pokemon-tcg-268ce.firebaseapp.com",
    projectId:"pokemon-tcg-268ce",
    storageBucket:"pokemon-tcg-268ce.firebasestorage.app",
    messagingSenderId:"542865221638",
    appId:"1:542865221638:web:7184175f4349c010f2bb87"
  };
  firebase.initializeApp(firebaseConfig);
  auth=firebase.auth();
  db=firebase.firestore();
}catch(e){console.warn('Firebase init failed:',e);}

/* ═══ Auth ═══ */
function isMobile(){return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);}

function authAction(){
  if(!auth){alert('Firebase\uAC00 \uB85C\uB4DC\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694.');return;}
  if(currentUser){
    if(confirm('\uB85C\uADF8\uC544\uC6C3 \uD558\uC2DC\uACA0\uC5B4\uC694?'))auth.signOut();
  }else{
    var provider=new firebase.auth.GoogleAuthProvider();
    if(isMobile()){
      auth.signInWithRedirect(provider);
    }else{
      auth.signInWithPopup(provider).catch(function(e){
        if(e.code==='auth/popup-blocked')auth.signInWithRedirect(provider);
      });
    }
  }
}

function updateAuthUI(){
  var user=currentUser||( auth?auth.currentUser:null);
  if(user)currentUser=user;
  var statusEl=document.getElementById('auth-status');
  var labelEl=document.getElementById('auth-label');
  var btnEl=document.getElementById('auth-btn');
  if(!statusEl||!labelEl||!btnEl)return;
  if(user){
    var name=user.displayName||(user.email?user.email.split('@')[0]:'User');
    statusEl.innerHTML='\u2601\uFE0F <strong>'+esc(name)+'</strong>\uB2D8';
    labelEl.textContent='\uB85C\uADF8\uC544\uC6C3';
    btnEl.style.background='#f0f0f0';
    btnEl.style.color='#666';
    btnEl.style.boxShadow='none';
  }else{
    statusEl.textContent='\u2601\uFE0F \uB85C\uADF8\uC778\uD558\uBA74 \uD074\uB77C\uC6B0\uB4DC \uC800\uC7A5!';
    labelEl.textContent='Google \uB85C\uADF8\uC778';
    btnEl.style.background='linear-gradient(135deg,#4285f4,#34a0f4)';
    btnEl.style.color='#fff';
    btnEl.style.boxShadow='0 2px 6px rgba(66,133,244,.3)';
  }
}

if(auth){
  auth.onAuthStateChanged(function(user){
    var wasLoggedOut=!currentUser;
    currentUser=user;
    updateAuthUI();
    if(user&&wasLoggedOut)loadFromCloud();
  });

  // Handle redirect result explicitly for Safari
  auth.getRedirectResult().then(function(result){
    if(result&&result.user){
      currentUser=result.user;
      updateAuthUI();
      loadFromCloud();
    }
  }).catch(function(){});

  // Poll: covers Safari BFCache and slow auth init
  setTimeout(updateAuthUI,500);
  setTimeout(updateAuthUI,1500);
  setTimeout(updateAuthUI,3000);
  setTimeout(updateAuthUI,5000);

  // Safari BFCache: when user navigates back, page is restored from cache
  window.addEventListener('pageshow',function(e){
    if(e.persisted||auth.currentUser){
      currentUser=auth.currentUser;
      updateAuthUI();
    }
  });
}

/* ═══ Data ═══ */
var SK='ptcg-v3',D;
try{D=JSON.parse(localStorage.getItem(SK));}catch(e){}
if(!D||!D.cards)D={cards:[],decks:[]};

function sv(){
  // Save to localStorage always
  try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}
  // Debounced save to Firestore
  if(currentUser){
    if(_syncTimeout)clearTimeout(_syncTimeout);
    _syncTimeout=setTimeout(saveToCloud,1000);
  }
}

function saveToCloud(){
  if(!currentUser||!db)return;
  var ref=db.collection('users').doc(currentUser.uid);
  ref.set({
    cards:D.cards,
    decks:D.decks,
    updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
    displayName:currentUser.displayName||'',
    email:currentUser.email||''
  }).then(function(){
    console.log('Cloud saved');
  }).catch(function(e){
    console.error('Cloud save error:',e);
  });
}

function loadFromCloud(){
  if(!currentUser||!db)return;
  var ref=db.collection('users').doc(currentUser.uid);
  ref.get().then(function(doc){
    if(doc.exists){
      var data=doc.data();
      // Merge: cloud wins if it has data
      if(data.cards&&data.cards.length>0){
        var localCount=D.cards.length;
        var cloudCount=data.cards.length;
        if(cloudCount>=localCount){
          D.cards=data.cards;
          D.decks=data.decks||[];
        }else{
          // Local has more - ask user
          if(confirm('\uD074\uB77C\uC6B0\uB4DC('+cloudCount+'\uC7A5)\uBCF4\uB2E4 \uB85C\uCEEC('+localCount+'\uC7A5)\uC5D0 \uCE74\uB4DC\uAC00 \uB354 \uB9CE\uC544\uC694.\n\uB85C\uCEEC \uB370\uC774\uD130\uB97C \uD074\uB77C\uC6B0\uB4DC\uC5D0 \uC800\uC7A5\uD560\uAE4C\uC694?')){
            saveToCloud();
          }else{
            D.cards=data.cards;
            D.decks=data.decks||[];
          }
        }
      }else if(D.cards.length>0){
        // Cloud empty, local has data - upload
        saveToCloud();
      }
      try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}
      // Refresh current view
      try{rColl();}catch(e){}
      try{rDecks();}catch(e){}
      try{rRare();}catch(e){}
    }else if(D.cards.length>0){
      // No cloud data yet, upload local
      saveToCloud();
    }
  }).catch(function(e){console.error('Cloud load error:',e);});
}
function esc(s){
  if(typeof s!='string')return'';
  var o='',i,c;
  for(i=0;i<s.length;i++){c=s.charCodeAt(i);
    if(c===38)o+='&amp;';else if(c===34)o+='&quot;';else if(c===39)o+='&#39;';else if(c===60)o+='&lt;';else if(c===62)o+='&gt;';else o+=s[i];
  }return o;
}

/* ═══ Dex Search ═══ */
var _dexPage=1,_dexName='',_dexKr='',_dexTotal=0,_dexAllCards=[],_dexFilter='all';

function searchDex(page){
  var q=document.getElementById('dex-q').value.trim();
  if(!q&&!_dexName)return;
  if(q&&q!==_dexKr){_dexPage=1;_dexAllCards=[];_dexFilter='all';_dexKr=q;_dexName=KR2EN[q]||q;}
  if(page)_dexPage=page;
  var dr=document.getElementById('dex-r');
  dr.innerHTML='<div class="loading"><div class="spinner"></div><p>\uCE74\uB4DC\uB97C \uCC3E\uB294 \uC911... (\uD398\uC774\uC9C0 '+_dexPage+')</p></div>';
  var url='https://api.pokemontcg.io/v2/cards?q=name:"'+encodeURIComponent(_dexName)+'"&page='+_dexPage+'&pageSize=250&select=id,name,images,rarity,set,hp,types,supertype';
  fetch(url)
  .then(function(r){return r.json();})
  .then(function(data){
    if(!data.data||!data.data.length){
      if(_dexAllCards.length===0){dr.innerHTML='<div class="empty"><div class="ei">\uD83D\uDE22</div><p>"'+esc(_dexKr)+'" \uBABB \uCC3E\uC558\uC5B4\uC694</p></div>';return;}
    }
    if(data.data)_dexAllCards=_dexAllCards.concat(data.data);
    _dexTotal=data.totalCount||_dexAllCards.length;
    renderDex();
    // Auto-load remaining pages
    if(_dexAllCards.length<_dexTotal&&_dexPage<10){
      _dexPage++;
      setTimeout(function(){searchDex(_dexPage);},300);
    }
  }).catch(function(e){dr.innerHTML='<div class="empty"><div class="ei">\u26A0\uFE0F</div><p>\uAC80\uC0C9 \uC624\uB958: '+e.message+'</p></div>';});
}

function renderDex(){
  var dr=document.getElementById('dex-r');
  var cards=_dexAllCards;
  // Collect rarities for filter
  var rarities={};
  cards.forEach(function(c){var r=c.rarity||'Unknown';rarities[r]=(rarities[r]||0)+1;});
  // Apply filter
  var filtered=cards;
  if(_dexFilter!=='all'){
    filtered=cards.filter(function(c){return(c.rarity||'Unknown')===_dexFilter;});
  }
  var own={};D.cards.forEach(function(c){own[c.id]=1;});
  // Header with count + filters
  var h='<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:10px">';
  h+='<span style="font-family:var(--ft);font-size:.85rem;color:var(--accent)">"'+esc(_dexKr)+'" \uCD1D '+_dexTotal+'\uC885 \uCE74\uB4DC</span>';
  h+='<span style="font-size:.72rem;color:var(--text3)">(\uB85C\uB4DC '+_dexAllCards.length+'\uC7A5)</span>';
  h+='</div>';
  // Rarity filter chips
  h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">';
  h+='<button class="rbtn'+((_dexFilter==='all')?' active':'')+'" onclick="_dexFilter=\'all\';renderDex()">\uC804\uCCB4 ('+cards.length+')</button>';
  var rarityOrder=['Common','Uncommon','Rare','Rare Holo','Rare Holo V','Rare Ultra','Rare Holo VMAX','Rare Holo VSTAR','Illustration Rare','Special Art Rare','Rare Secret','Rare Rainbow','Promo'];
  var shown={};
  rarityOrder.forEach(function(r){
    if(rarities[r]){
      h+='<button class="rbtn'+((_dexFilter===r)?' active':'')+'" onclick="_dexFilter=\''+r+'\';renderDex()">'+esc(r)+' ('+rarities[r]+')</button>';
      shown[r]=1;
    }
  });
  Object.keys(rarities).forEach(function(r){
    if(!shown[r]&&r!=='Unknown'){
      h+='<button class="rbtn'+((_dexFilter===r)?' active':'')+'" onclick="_dexFilter=\''+r+'\';renderDex()">'+esc(r)+' ('+rarities[r]+')</button>';
    }
  });
  h+='</div>';
  // Grid
  h+='<div class="dgrid">';
  filtered.forEach(function(c,ci){
    var o=own[c.id];var img=(c.images&&c.images.small)||'';
    var setName=(c.set&&c.set.name)||'';
    h+='<div class="dc '+(o?'owned':'unowned')+'" data-gidx="'+ci+'">';
    h+='<div class="ob">'+(o?'\u2713':'\uFF0B')+'</div>';
    h+='<img src="'+img+'" alt="'+esc(c.name)+'" loading="lazy">';
    h+='<div class="nm">'+esc(c.rarity||'')+' \xB7 '+esc(setName)+'</div></div>';
  });
  h+='</div>';
  // Pagination status
  if(_dexAllCards.length<_dexTotal){
    h+='<div style="text-align:center;margin-top:14px">';
    h+='<div class="loading"><div class="spinner"></div><p>\uB098\uBA38\uC9C0 \uCE74\uB4DC \uBD88\uB7EC\uC624\uB294 \uC911... ('+_dexAllCards.length+'/'+_dexTotal+')</p></div>';
    h+='</div>';
  }else if(_dexAllCards.length>0){
    h+='<p style="text-align:center;font-size:.72rem;color:var(--text3);margin-top:10px">\uBAA8\uB4E0 \uCE74\uB4DC\uB97C \uBD88\uB7EC\uC654\uC5B4\uC694! ('+_dexAllCards.length+'\uC7A5)</p>';
  }
  dr.innerHTML=h;
  // Store filtered data for click handlers
  window._dexFiltered=filtered;
  window._dexKrName=_dexKr;
  var cardEls=dr.querySelectorAll('.dc');
  for(var i=0;i<cardEls.length;i++){
    cardEls[i].addEventListener('click',(function(idx){return function(){showModal(window._dexFiltered[idx],window._dexKrName);};})(i));
  }
}

/* ═══ Modal ═══ */
function showModal(c,kr){
  var img=(c.images&&c.images.large)||(c.images&&c.images.small)||'';
  var o=false;for(var i=0;i<D.cards.length;i++){if(D.cards[i].id===c.id){o=true;break;}}
  var r=c.rarity||'Unknown',s=c.set?c.set.name:'-',hp=c.hp||'-',ty=c.types?c.types.join(', '):'-',st=c.supertype||'-';
  var h='';
  if(img)h+='<img src="'+img+'">';
  h+='<h3>'+esc(kr||c.name)+'</h3>';
  h+='<div class="dr"><span class="dl">\uC601\uBB38\uBA85</span><span>'+esc(c.name)+'</span></div>';
  h+='<div class="dr"><span class="dl">\uCE74\uB4DC\uD0C0\uC785</span><span>'+esc(st)+'</span></div>';
  h+='<div class="dr"><span class="dl">\uD0C0\uC785</span><span>'+esc(ty)+'</span></div>';
  h+='<div class="dr"><span class="dl">HP</span><span>'+esc(hp)+'</span></div>';
  h+='<div class="dr"><span class="dl">\uC138\uD2B8</span><span>'+esc(s)+'</span></div>';
  h+='<div class="dr"><span class="dl">\uD76C\uC18C\uB3C4</span><span>'+esc(r)+'</span></div>';
  h+='<div class="acts">';
  // Store card data globally for button handlers
  window._modalCard={id:c.id,name:c.name,krName:kr,rarity:r,set:s,hp:hp,types:ty,supertype:st,image:(c.images&&c.images.small)||''};
  if(o){h+='<button class="btn btn-d" onclick="rmCard(window._modalCard.id)">\uC81C\uAC70</button>';}
  else{h+='<button class="btn btn-p" onclick="addCard(window._modalCard)">\uCE74\uB4DC\uD568\uC5D0 \uCD94\uAC00</button>';}
  h+='</div>';
  document.getElementById('mb').innerHTML=h;
  document.getElementById('mo').className='mo show';
}
function addCard(cd){
  var dup=false;for(var i=0;i<D.cards.length;i++){if(D.cards[i].id===cd.id){dup=true;break;}}
  if(!dup){D.cards.push({id:cd.id,name:cd.name,krName:cd.krName,rarity:cd.rarity,set:cd.set,hp:cd.hp,types:cd.types,supertype:cd.supertype,image:cd.image});sv();}
  closeM();searchDex();
}
function rmCard(id){D.cards=D.cards.filter(function(c){return c.id!==id;});sv();closeM();searchDex();rColl();}

/* ═══ Collection ═══ */
function rColl(){
  var f=document.getElementById('cf').value;var cards=D.cards;
  if(f==='Ultra')cards=cards.filter(function(c){var r=(c.rarity||'').toLowerCase();return r.indexOf('ultra')>=0||r.indexOf('secret')>=0||r.indexOf('vmax')>=0||r.indexOf('vstar')>=0||r.indexOf('illustration')>=0;});
  else if(f!=='all')cards=cards.filter(function(c){return(c.rarity||'')===f;});
  document.getElementById('cc').textContent='\uCD1D '+cards.length+'\uC7A5';
  if(!cards.length){document.getElementById('cg').innerHTML='';document.getElementById('ce').style.display='block';return;}
  document.getElementById('ce').style.display='none';
  var h='';cards.forEach(function(c){
    h+='<div class="cc"><button class="x" onclick="event.stopPropagation();rmCard(\''+c.id+'\')">&times;</button>';
    if(c.image)h+='<img src="'+esc(c.image)+'" loading="lazy">';
    h+='<div class="n">'+esc(c.krName||c.name)+'</div><div class="m">'+esc(c.rarity||'')+'</div></div>';
  });document.getElementById('cg').innerHTML=h;
}

/* ═══ Decks ═══ */
function createDeck(){var n=document.getElementById('dk-n').value.trim();if(!n)return;D.decks.push({id:Date.now()+'',name:n,cards:[]});sv();document.getElementById('dk-n').value='';rDecks();}
function rDecks(){
  if(!D.decks.length){document.getElementById('dk-l').innerHTML='';document.getElementById('dk-e').style.display='block';return;}
  document.getElementById('dk-e').style.display='none';var h='';
  D.decks.forEach(function(dk,i){
    h+='<div class="di"><div><div class="dn">'+esc(dk.name)+'</div><div class="dc2">'+dk.cards.length+'/60</div></div>';
    h+='<div style="display:flex;gap:4px;flex-wrap:wrap"><button class="btn btn-s btn-g" onclick="deckAdd('+i+')">+\uCE74\uB4DC</button>';
    h+='<button class="btn btn-s btn-g" onclick="deckTog('+i+')">\uBCF4\uAE30</button>';
    h+='<button class="btn btn-s btn-d" onclick="deckDel('+i+')">\uC0AD\uC81C</button></div></div>';
    h+='<div class="dd" id="dd-'+i+'" style="display:none"></div>';
  });document.getElementById('dk-l').innerHTML=h;
}
function deckTog(i){
  var el=document.getElementById('dd-'+i);if(!el)return;
  if(el.style.display==='none'){
    var dk=D.decks[i];
    if(!dk.cards.length){el.innerHTML='<p style="color:var(--text3);font-size:.8rem">\uCE74\uB4DC \uC5C6\uC74C</p>';}
    else{var h='';dk.cards.forEach(function(c,ci){
      h+='<div class="ce">';if(c.image)h+='<img src="'+esc(c.image)+'">';
      h+='<span style="flex:1;font-size:.8rem">'+esc(c.krName||c.name)+'</span>';
      h+='<button class="btn btn-s btn-d" onclick="deckRm('+i+','+ci+')">\u2715</button></div>';
    });el.innerHTML=h;}
    el.style.display='block';
  }else{el.style.display='none';}
}
function deckAdd(di){
  if(!D.cards.length){alert('\uCE74\uB4DC\uD568\uC5D0 \uCE74\uB4DC\uAC00 \uC5C6\uC5B4\uC694!');return;}
  window._deckAddIdx=di;
  var h='<h3 style="font-family:var(--ft);margin-bottom:10px">\uB371\uC5D0 \uCD94\uAC00</h3>';
  D.cards.forEach(function(c,i){
    h+='<div style="display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid var(--cb);cursor:pointer" onclick="deckIns('+i+')">';
    if(c.image)h+='<img src="'+esc(c.image)+'" style="width:32px;border-radius:3px">';
    h+='<span style="flex:1;font-size:.8rem">'+esc(c.krName||c.name)+'</span></div>';
  });
  document.getElementById('mb').innerHTML=h;
  document.getElementById('mo').className='mo show';
}
function deckIns(cardIdx){
  var di=window._deckAddIdx;var dk=D.decks[di];if(!dk)return;
  if(dk.cards.length>=60){alert('\uCD5C\uB300 60\uC7A5!');return;}
  var c=D.cards[cardIdx];
  var cnt=0;for(var i=0;i<dk.cards.length;i++){if(dk.cards[i].id===c.id)cnt++;}
  if(cnt>=4){alert('\uAC19\uC740 \uCE74\uB4DC \uCD5C\uB300 4\uC7A5!');return;}
  dk.cards.push(JSON.parse(JSON.stringify(c)));sv();closeM();rDecks();
}
function deckRm(di,ci){D.decks[di].cards.splice(ci,1);sv();rDecks();deckTog(di);}
function deckDel(i){if(!confirm('"'+D.decks[i].name+'" \uC0AD\uC81C?'))return;D.decks.splice(i,1);sv();rDecks();}

/* ═══ Recommend ═══ */
function genRec(){
  var rr=document.getElementById('rec-r');
  if(D.cards.length<3){rr.innerHTML='<div class="empty"><div class="ei">\uD83D\uDCE6</div><p>\uCE74\uB4DC\uD568\uC5D0 \uCD5C\uC18C 3\uC7A5!</p></div>';return;}
  var tm={};D.cards.forEach(function(c){var ts=(c.types||'').split(',');if(!ts[0])ts=['Colorless'];ts.forEach(function(t){t=t.trim();if(!tm[t])tm[t]=[];tm[t].push(c);});});
  var tc={Fire:'#f08030',Water:'#6890f0',Grass:'#78c850',Lightning:'#f8d030',Psychic:'#f85888',Fighting:'#c03028',Darkness:'#705848',Metal:'#b8b8d0',Dragon:'#7038f8',Colorless:'#a8a878'};
  var sorted=Object.keys(tm).sort(function(a,b){return tm[b].length-tm[a].length;});
  var h='';sorted.forEach(function(type){
    var cards=tm[type];if(cards.length<2)return;
    var color=tc[type]||'#888';var pwr=0;
    cards.forEach(function(c){pwr+=parseInt(c.hp)||60;});
    h+='<div class="rec-card"><h3><span class="type-badge" style="background:'+color+';color:#fff">'+esc(type)+'</span> '+esc(type)+' \uB371</h3>';
    h+='<p style="font-size:.78rem;color:var(--text2)">'+cards.length+'\uC7A5 \xB7 \uD30C\uC6CC '+pwr+'</p><div class="card-list">';
    cards.slice(0,8).forEach(function(c){h+='<span>'+esc(c.krName||c.name)+'</span>';});
    h+='</div></div>';
  });
  if(!h)h='<div class="empty"><p>\uCE74\uB4DC\uB97C \uB354 \uBAA8\uC544\uBCF4\uC138\uC694!</p></div>';
  rr.innerHTML=h;
}

/* ═══ Battle ═══ */
function rBattleSel(){
  var a=document.getElementById('bt-a'),b=document.getElementById('bt-b');
  var o='<option value="">\uB371 \uC120\uD0DD</option>';
  D.decks.forEach(function(dk,i){o+='<option value="'+i+'">'+esc(dk.name)+'</option>';});
  a.innerHTML=o;b.innerHTML=o;
}
function runBattle(){
  var ai=parseInt(document.getElementById('bt-a').value),bi=parseInt(document.getElementById('bt-b').value);
  if(isNaN(ai)||isNaN(bi)){alert('\uB450 \uB371\uC744 \uC120\uD0DD!');return;}
  if(ai===bi){alert('\uB2E4\uB978 \uB371\uC744 \uC120\uD0DD!');return;}
  var dA=D.decks[ai],dB=D.decks[bi];
  var pA=dA.cards.filter(function(c){return c.supertype==='Pok\u00e9mon'||c.supertype==='Pokemon';});
  var pB=dB.cards.filter(function(c){return c.supertype==='Pok\u00e9mon'||c.supertype==='Pokemon';});
  if(!pA.length||!pB.length){alert('\uC591\uCABD\uC5D0 \uD3EC\uCF13\uBAAC \uCE74\uB4DC \uD544\uC694!');return;}
  var TA={Fire:['Grass','Metal'],Water:['Fire'],Grass:['Water'],Lightning:['Water'],Psychic:['Fighting'],Fighting:['Colorless','Darkness'],Darkness:['Psychic'],Metal:['Fairy'],Dragon:['Dragon']};
  function gHP(c){return parseInt(c.hp)||60;}
  function gT(c){return(c.types||'').split(',')[0].trim()||'Colorless';}
  function dmg(a,d){var b=20+Math.floor(gHP(a)/10);var at=gT(a),dt=gT(d);if(TA[at]&&TA[at].indexOf(dt)>=0)b=Math.floor(b*1.5);b+=Math.floor(Math.random()*20)-10;return Math.max(10,b);}
  var tA=pA.slice(0,6).map(function(c){return{n:c.krName||c.name,hp:gHP(c),cur:gHP(c),t:c.types};}),
      tB=pB.slice(0,6).map(function(c){return{n:c.krName||c.name,hp:gHP(c),cur:gHP(c),t:c.types};});
  var br=document.getElementById('bt-r');
  var h='<div class="vs-display"><div class="vs-team"><div class="name">'+esc(dA.name)+'</div><div class="cnt2">'+pA.length+'\uB9C8\uB9AC</div></div>';
  h+='<div class="vs-label">\u2694\uFE0F</div>';
  h+='<div class="vs-team"><div class="name">'+esc(dB.name)+'</div><div class="cnt2">'+pB.length+'\uB9C8\uB9AC</div></div></div>';
  h+='<div class="battle-log">';
  var pzA=0,pzB=0,turn=0;
  while(pzA<6&&pzB<6&&tA.length&&tB.length&&turn<30){
    turn++;h+='<div class="turn"><strong>\uD134 '+turn+'</strong><br>';
    var d1=dmg(pA[0],pB[0]);tB[0].cur-=d1;
    h+=esc(tA[0].n)+' \u2192 '+esc(tB[0].n)+' <span class="dmg">-'+d1+'</span> (HP:'+Math.max(0,tB[0].cur)+')<br>';
    if(tB[0].cur<=0){h+='<span class="ko">\uD83D\uDCA5 '+esc(tB[0].n)+' \uAE30\uC808!</span><br>';tB.shift();pzA++;if(pzA>=6||!tB.length){h+='</div>';break;}}
    if(tB.length){
      var d2=dmg(pB[0],pA[0]);tA[0].cur-=d2;
      h+=esc(tB[0].n)+' \u2192 '+esc(tA[0].n)+' <span class="dmg">-'+d2+'</span> (HP:'+Math.max(0,tA[0].cur)+')<br>';
      if(tA[0].cur<=0){h+='<span class="ko">\uD83D\uDCA5 '+esc(tA[0].n)+' \uAE30\uC808!</span>';tA.shift();pzB++;}
    }
    h+='</div>';
  }
  var w=pzA>=6||!tB.length?dA.name:(pzB>=6||!tA.length?dB.name:'\uBB34\uC2B9\uBD80');
  h+='<div class="win">\uD83C\uDFC6 '+esc(w)+'!</div></div>';
  br.innerHTML=h;
}

/* ═══ Rare ═══ */
function rRare(){
  var rc=D.cards.filter(function(c){var r=(c.rarity||'').toLowerCase();return r.indexOf('rare')>=0||r.indexOf('ultra')>=0||r.indexOf('secret')>=0||r.indexOf('holo')>=0||r.indexOf('vmax')>=0||r.indexOf('vstar')>=0;});
  if(!rc.length){document.getElementById('rare-l').innerHTML='';document.getElementById('rare-e').style.display='block';return;}
  document.getElementById('rare-e').style.display='none';
  var h='<div class="cgrid">';
  rc.forEach(function(c){h+='<div class="cc">';if(c.image)h+='<img src="'+esc(c.image)+'" loading="lazy">';h+='<div class="n">'+esc(c.krName||c.name)+'</div><div class="m">'+esc(c.rarity||'')+'</div></div>';});
  h+='</div>';document.getElementById('rare-l').innerHTML=h;
}

/* ═══ Init ═══ */
document.getElementById('dex-q').addEventListener('keydown',function(e){if(e.key==='Enter'){_dexAllCards=[];_dexPage=1;_dexFilter='all';searchDex();}});

/* ═══ Card Scanner (Tesseract.js OCR) ═══ */
var _tesseractLoaded=false;
var _tesseractWorker=null;

function loadTesseract(cb){
  if(_tesseractLoaded){cb();return;}
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  s.onload=function(){_tesseractLoaded=true;cb();};
  s.onerror=function(){
    document.getElementById('scan-result').innerHTML='<div class="empty"><div class="ei">\u26A0\uFE0F</div><p>OCR \uB77C\uC774\uBE0C\uB7EC\uB9AC \uB85C\uB4DC \uC2E4\uD328. \uC778\uD130\uB137\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.</p></div>';
  };
  document.head.appendChild(s);
}

function handleScanFile(input){
  if(!input.files||!input.files[0])return;
  var file=input.files[0];
  var reader=new FileReader();
  reader.onload=function(e){
    // Show preview
    var preview=document.getElementById('scan-preview');
    preview.innerHTML='<img src="'+e.target.result+'" style="width:100%;max-width:300px;border-radius:12px;margin:0 auto;display:block">';
    // Start OCR
    startOCR(e.target.result);
  };
  reader.readAsDataURL(file);
}

function startOCR(imageData){
  var resultEl=document.getElementById('scan-result');
  resultEl.innerHTML='<div class="loading"><div class="spinner"></div><p>\uCE74\uB4DC\uB97C \uC778\uC2DD\uD558\uB294 \uC911... (\uCC98\uC74C\uC740 30\uCD08 \uC815\uB3C4 \uAC78\uB9B4 \uC218 \uC788\uC5B4\uC694)</p></div>';
  
  loadTesseract(function(){
    Tesseract.recognize(imageData,'eng',{
      logger:function(m){
        if(m.status==='recognizing text'&&m.progress){
          var pct=Math.round(m.progress*100);
          var prog=document.getElementById('scan-progress');
          if(prog)prog.style.width=pct+'%';
        }
      }
    }).then(function(result){
      var text=result.data.text||'';
      processOCRResult(text);
    }).catch(function(err){
      resultEl.innerHTML='<div class="empty"><div class="ei">\u26A0\uFE0F</div><p>OCR \uC2E4\uD328: '+esc(err.message||'')+'</p></div>';
    });
  });
}

function processOCRResult(text){
  var resultEl=document.getElementById('scan-result');
  // Clean up OCR text
  var lines=text.split('\n').map(function(l){return l.trim();}).filter(function(l){return l.length>1;});
  
  // Try to find pokemon name - usually the largest/most prominent text
  // Also look for set number pattern like "025/165" or "SV1 025"
  var pokemonName='';
  var setNumber='';
  var hp='';
  
  // Pattern: HP number
  var hpMatch=text.match(/(\d{2,3})\s*HP/i)||text.match(/HP\s*(\d{2,3})/i);
  if(hpMatch)hp=hpMatch[1];
  
  // Pattern: set number like "025/165", "RC25/RC32", "SV025"
  var setMatch=text.match(/\b(\d{1,3})\s*\/\s*(\d{1,3})\b/)||text.match(/\b([A-Z]{1,4}\d{1,4})\b/);
  if(setMatch)setNumber=setMatch[0];
  
  // Try to extract pokemon name - first meaningful line that looks like a name
  // Pokemon names are usually English, capitalized, near the top
  var namePatterns=[
    /\b(Pikachu|Charizard|Mewtwo|Eevee|Snorlax|Gengar|Dragonite|Lucario|Gardevoir|Rayquaza|Arceus|Dialga|Palkia|Giratina|Reshiram|Zekrom|Greninja|Mimikyu|Dragapult|Zacian|Zamazenta|Koraidon|Miraidon)\b/i,
    /^([A-Z][a-z]{2,15}(?:\s(?:ex|EX|V|VMAX|VSTAR|GX))?)\s/m
  ];
  
  for(var p=0;p<namePatterns.length;p++){
    var nm=text.match(namePatterns[p]);
    if(nm){pokemonName=nm[1]||nm[0];break;}
  }
  
  // If no pattern matched, try first capitalized word with 3+ chars
  if(!pokemonName){
    for(var i=0;i<lines.length;i++){
      var wordMatch=lines[i].match(/^([A-Z][a-zA-Z]{2,20})/);
      if(wordMatch&&wordMatch[1]!=='HP'&&wordMatch[1]!=='Weakness'&&wordMatch[1]!=='Resistance'&&wordMatch[1]!=='Retreat'){
        pokemonName=wordMatch[1];break;
      }
    }
  }
  
  // Also check for Korean names
  if(!pokemonName){
    for(var i=0;i<lines.length;i++){
      var krMatch=lines[i].match(/^([\uAC00-\uD7AF]{2,10})/);
      if(krMatch){
        var krName=krMatch[1];
        if(KR2EN[krName]){pokemonName=KR2EN[krName];break;}
      }
    }
  }
  
  // Build result UI
  var h='<div class="box" style="margin-bottom:12px">';
  h+='<h3>\uD83D\uDD0D OCR \uC778\uC2DD \uACB0\uACFC</h3>';
  h+='<p style="font-size:.78rem;color:var(--text2);margin-bottom:8px;word-break:break-all">'+esc(text.substring(0,200))+(text.length>200?'...':'')+'</p>';
  
  if(pokemonName){
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px">';
    h+='<span style="font-family:var(--ft);font-size:1rem;color:var(--accent)">\uD3EC\uCF13\uBAAC: '+esc(pokemonName)+'</span>';
    if(hp)h+='<span style="font-size:.78rem;color:var(--text3)">HP '+esc(hp)+'</span>';
    if(setNumber)h+='<span style="font-size:.78rem;color:var(--text3)">#'+esc(setNumber)+'</span>';
    h+='</div>';
    h+='<button class="btn btn-p" onclick="scanSearchAndAdd(\''+esc(pokemonName).replace(/'/g,"\\'")+'\')" style="width:100%">\uD83D\uDD0E "'+esc(pokemonName)+'" \uCE74\uB4DC \uAC80\uC0C9 \u2192 \uCE74\uB4DC\uD568\uC5D0 \uCD94\uAC00</button>';
  }else{
    h+='<p style="color:var(--red);font-size:.85rem">\u274C \uD3EC\uCF13\uBAAC \uC774\uB984\uC744 \uC778\uC2DD\uD558\uC9C0 \uBABB\uD588\uC5B4\uC694</p>';
    h+='<p style="font-size:.75rem;color:var(--text3);margin-top:4px">\uD301: \uCE74\uB4DC \uC774\uB984 \uBD80\uBD84\uC774 \uC798 \uBCF4\uC774\uB3C4\uB85D \uCC0D\uC5B4\uC8FC\uC138\uC694!</p>';
  }
  h+='</div>';
  
  // Manual search fallback
  h+='<div class="box">';
  h+='<h3>\u270D\uFE0F \uC9C1\uC811 \uC785\uB825\uC73C\uB85C \uAC80\uC0C9</h3>';
  h+='<div class="srch"><input type="text" id="scan-manual" placeholder="\uD3EC\uCF13\uBAAC \uC774\uB984 \uC785\uB825" value="'+esc(pokemonName)+'">';
  h+='<button class="btn btn-p" onclick="scanSearchAndAdd(document.getElementById(\'scan-manual\').value)">\uAC80\uC0C9</button></div>';
  h+='</div>';
  
  resultEl.innerHTML=h;
}

function scanSearchAndAdd(name){
  if(!name)return;
  // Switch to dex tab and search
  document.getElementById('dex-q').value=name;
  // Find and click dex tab
  var tabs=document.getElementById('tabbar').getElementsByTagName('button');
  for(var i=0;i<tabs.length;i++){
    if(tabs[i].textContent.indexOf('\uB3C4\uAC10')>=0){
      switchTab('dex',tabs[i]);
      break;
    }
  }
  _dexAllCards=[];_dexPage=1;_dexFilter='all';
  searchDex();
}

console.log('TCG Guide loaded. KR2EN:',Object.keys(KR2EN).length);
