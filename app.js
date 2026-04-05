/* Pokemon TCG Guide v2 - App Logic */

/* ═══ Tab Switch ═══ */
function switchTab(id,btn){
  var tabs=document.getElementById('tabbar').getElementsByTagName('button');
  for(var i=0;i<tabs.length;i++){tabs[i].className='tab';}
  btn.className='tab on';
  var ids=['rules','dex','coll','quick','deck','rec','battle','rare'];
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
var EN2KR={};
var KR_NAMES=[];
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
'뉴비:Sprigatito,마스카나:Meowscarada,크래피:Fuecoco,라우드보네:Skeledirge,꾸왁스:Quaxly,웨이니발:Quaquaval,파모:Pawmi,파모트:Pawmo,파모트리:Pawmot,가르가나클:Garganacl,팔미기모스:Armarouge,소울블레이즈:Ceruledge,딜클레이스:Tinkaton,깨비드릴조:Kingambit,코라이돈:Koraidon,미라이돈:Miraidon,테라파고스:Terapagos,피죤투:Pidgeot,꼬몽울:Munkidori,오거폰:Ogerpon,철가시:Iron Thorns,파오젠:Chien-Pao,디아루가:Dialga,피죤:Pidgeotto'
];
for(var i=0;i<g.length;i++){
  var pairs=g[i].split(',');
  for(var p=0;p<pairs.length;p++){
    var idx=pairs[p].indexOf(':');
    if(idx>0){
      var kr=pairs[p].substring(0,idx),en=pairs[p].substring(idx+1);
      KR2EN[kr]=en;EN2KR[en]=kr;KR_NAMES.push(kr);
    }
  }
}
KR_NAMES.sort();
})();

/* ═══ Trainer/Energy Presets — {kr, en} 형태 ═══ */
var TRAINERS={
  '서포트':[
    {kr:'박사의 연구',en:"Professor's Research"},{kr:'보스의 지령',en:"Boss's Orders"},{kr:'나나카마도 박사',en:"Professor Laventon"},{kr:'페퍼',en:"Pepper"},{kr:'네모',en:"Nemona"},
    {kr:'오모다카',en:"Geeta"},{kr:'치리',en:"Tulip"},{kr:'핸섬',en:"Looker"},{kr:'자두',en:"Jacq"},{kr:'봉선',en:"Gardenia's Vigor"},
    {kr:'시리스',en:"Cyrus"},{kr:'벼전',en:"Colress"},{kr:'아크로마',en:"Colress's Experiment"},{kr:'미모사',en:"Clavell"},
    {kr:'비트',en:"Bede"},{kr:'내리',en:"Melony"},{kr:'지니아',en:"Sada"},{kr:'그룹',en:"Judge"},{kr:'챔피언 로드',en:"Champion's Festival"},
    {kr:'데드레퍼',en:"Iono"},{kr:'카르네',en:"Diantha"},{kr:'아카기 박사',en:"Professor Birch"},{kr:'홍의 연구',en:"Arven"},
    {kr:'투투',en:"Worker"},{kr:'우르프의 스승',en:"Mustard"},{kr:'리치아',en:"Irida"},{kr:'아오키',en:"Larry"},
    {kr:'클라벨',en:"Director Clavell"},{kr:'바이오레트',en:"Violet"},{kr:'이사하 선장',en:"Captain Pikachu"},{kr:'현명한 술사',en:"Briar"}
  ],
  '아이템':[
    {kr:'하이퍼볼',en:'Ultra Ball'},{kr:'네스트볼',en:'Nest Ball'},{kr:'울트라볼',en:'Ultra Ball'},{kr:'프라이멈볼',en:'Prime Ball'},
    {kr:'교체',en:'Switch'},{kr:'낚싯꾼',en:'Super Rod'},{kr:'탐험가의 선도',en:"Explorer's Guidance"},{kr:'밤의 들것',en:'Rescue Stretcher'},
    {kr:'포켓몬 통신',en:"Pok\u00e9mon Communication"},{kr:'대단한 낚싯대',en:'Great Ball'},{kr:'카운터캐쳐',en:'Counter Catcher'},
    {kr:'이상한사탕',en:'Rare Candy'},{kr:'포켓몬 회수 사이클론',en:"Pok\u00e9mon Catcher"},
    {kr:'배틀 VIP 패스',en:'Battle VIP Pass'},{kr:'개조된 방함',en:'Heavy Ball'},{kr:'포션',en:'Potion'},{kr:'슈퍼 포션',en:'Super Potion'},
    {kr:'에너지 회수',en:'Energy Retrieval'},{kr:'에너지 전환기',en:'Energy Switch'},{kr:'베어링',en:"Buddy-Buddy Poffin"},
    {kr:'레드카드',en:'Red Card'},{kr:'프리미엄볼',en:'Level Ball'},{kr:'트레커볼',en:'Timer Ball'},
    {kr:'페이드볼',en:'Feather Ball'},{kr:'미스터리볼',en:'Mysterious Treasure'},{kr:'이보브인성',en:'Earthen Vessel'},
    {kr:'베르의 미루',en:"Ciphermaniac's Codebreaking"},{kr:'트라이머',en:'Pal Pad'},{kr:'파워태블릿',en:'Power Tablet'},
    {kr:'재활용 에너지',en:'Recycler'},{kr:'수페리어 에너지 회수',en:'Superior Energy Retrieval'},
    {kr:'에이스 스펙 (마스터볼)',en:'Master Ball'},{kr:'에이스 스펙 (프라임캐쳐)',en:'Prime Catcher'},
    {kr:'에이스 스펙 (맥스벨트)',en:'Maximum Belt'},{kr:'에이스 스펙 (맵스코프)',en:'Map Scope'},
    {kr:'스치로기어',en:'Techno Radar'},{kr:'빅판라스',en:'Night Stretcher'},{kr:'로스트스웨퍼',en:'Lost Sweeper'},
    {kr:'로스트바큐엄',en:'Lost Vacuum'}
  ],
  '포켓몬의 도구':[
    {kr:'기합의 머리띠',en:'Focus Band'},{kr:'구명 망토',en:'Rescue Board'},{kr:'숨의 봉인석',en:"Forest Seal Stone"},
    {kr:'학습 장치',en:'Exp. Share'},{kr:'원시의 마스크',en:'Defiance Band'},{kr:'테크늄 바이저',en:'Technical Machine Evolution'},
    {kr:'후다트린',en:'Bravery Charm'},{kr:'원시의 투구',en:'Rocky Helmet'},{kr:'베스트',en:'Leftovers'},
    {kr:'해운의 가면',en:"Hero's Cape"},{kr:'그라운드 클로크',en:'Vitality Band'},
    {kr:'방호 몬스터볼',en:'Vengeful Punch'},{kr:'데비루버리',en:'Choice Belt'},{kr:'쿨민이 타입',en:'Defiance Vest'}
  ],
  '스타디움':[
    {kr:'포켓몬리그 본부',en:"Pok\u00e9mon League Headquarters"},{kr:'정글',en:'Temple of Sinnoh'},{kr:'태엽산',en:'Magma Basin'},
    {kr:'밤의 탑',en:'Tower of Darkness'},{kr:'잠든 숲의 제단',en:'Path to the Peak'},{kr:'위대한 거목',en:'Great Tree'},
    {kr:'타운 스토어',en:'Artazon'},{kr:'박투장',en:'Mesagoza'},{kr:'피어교실',en:'Training Court'},
    {kr:'불꽃 방송국',en:'Charizard Lounge'},{kr:'제로의 대공동',en:"Area Zero Underdepths"},
    {kr:'수련장',en:'Beach Court'},{kr:'템페스트 랜스',en:'Collapsed Stadium'},{kr:'와이드스쿼어',en:'Grand Tree'}
  ]
};

var ENERGY=[
  {n:'\uD480 \uC5D0\uB108\uC9C0 \uD83C\uDF3F',t:'Grass',en:'Grass Energy'},
  {n:'\uBD88 \uC5D0\uB108\uC9C0 \uD83D\uDD25',t:'Fire',en:'Fire Energy'},
  {n:'\uBB3C \uC5D0\uB108\uC9C0 \uD83D\uDCA7',t:'Water',en:'Water Energy'},
  {n:'\uBC88\uAC1C \uC5D0\uB108\uC9C0 \u26A1',t:'Lightning',en:'Lightning Energy'},
  {n:'\uCD08 \uC5D0\uB108\uC9C0 \uD83D\uDD2E',t:'Psychic',en:'Psychic Energy'},
  {n:'\uACA9\uD22C \uC5D0\uB108\uC9C0 \uD83D\uDC4A',t:'Fighting',en:'Fighting Energy'},
  {n:'\uC545 \uC5D0\uB108\uC9C0 \uD83C\uDF19',t:'Darkness',en:'Darkness Energy'},
  {n:'\uAC15\uCCA0 \uC5D0\uB108\uC9C0 \u2699\uFE0F',t:'Metal',en:'Metal Energy'},
  {n:'\uBB34\uC0C9 \uC5D0\uB108\uC9C0',t:'Colorless',en:'Colorless Energy'}
];

var SP_ENERGY=[
  {kr:'\uB354\uBE14 \uD130\uBCF4 \uC5D0\uB108\uC9C0',en:'Double Turbo Energy'},
  {kr:'\uC81C\uD2B8 \uC5D0\uB108\uC9C0',en:'Jet Energy'},
  {kr:'\uB9AC\uBC84\uC15C \uC5D0\uB108\uC9C0',en:'Reversal Energy'},
  {kr:'\uD14C\uB77C\uD30C\uACE0\uC2A4\uC758 \uBE5B',en:'Luminous Energy'},
  {kr:'\uB808\uAC70\uC2DC \uC5D0\uB108\uC9C0',en:'Legacy Energy'},
  {kr:'\uB8E8\uBBF8\uB108\uC2A4 \uC5D0\uB108\uC9C0',en:'Luminous Energy'}
];

/* ═══ Preset Decks ═══ */
var PRESET_DECKS=[
  {name:'\uD14C\uB77C\uC2A4\uD0C8 \uB9AC\uC790\uBAAD ex \uBC30\uD2C0\uB9C8\uC2A4\uD130\uB371',type:'\uD83D\uDD25',cards:[
    {n:'\uD30C\uC774\uB9AC',q:2},{n:'\uB9AC\uC790\uB4DC',q:2},{n:'\uB9AC\uC790\uBAAD ex',q:2},
    {n:'\uD53C\uC8E4',q:2},{n:'\uD53C\uC8E4\uD22C ex',q:2},{n:'\uD30C\uBAA8',q:1},{n:'\uD30C\uBAA8\uD2B8',q:1},{n:'\uD30C\uBAA8\uD2B8\uB9AC',q:1},
    {n:'\uBC15\uC0AC\uC758 \uC5F0\uAD6C',q:2},{n:'\uBCF4\uC2A4\uC758 \uC9C0\uB839',q:2},{n:'\uB124\uBAA8',q:2},
    {n:'\uD558\uC774\uD37C\uBCFC',q:4},{n:'\uB124\uC2A4\uD2B8\uBCFC',q:2},{n:'\uC6B8\uD2B8\uB77C\uBCFC',q:2},
    {n:'\uC774\uC0C1\uD55C\uC0AC\uD0D5',q:4},{n:'\uAD50\uCCB4',q:2},{n:'\uBC24\uC758 \uB4E4\uAC83',q:2},
    {n:'\uAE30\uD569\uC758 \uBA38\uB9AC\uB744',q:2},{n:'\uD0D0\uD5D8\uAC00\uC758 \uC120\uB3C4',q:2},
    {n:'\uBD88 \uC5D0\uB108\uC9C0 \uD83D\uDD25',q:10},{n:'\uBB34\uC0C9 \uC5D0\uB108\uC9C0',q:4},
    {n:'\uB354\uBE14 \uD130\uBCF4 \uC5D0\uB108\uC9C0',q:2},{n:'\uC81C\uD2B8 \uC5D0\uB108\uC9C0',q:2}
  ]},
  {name:'\uD30C\uC624\uC824 ex \uBC30\uD2C0\uB9C8\uC2A4\uD130\uB371',type:'\uD83E\uDDCA',cards:[
    {n:'\uD30C\uC624\uC824 ex',q:2},{n:'\uC2A4\uC774\uCFE4 ex',q:1},{n:'\uBA54\uB9AC\uD504',q:2},{n:'\uB9C8\uB9B4',q:2},{n:'\uB9C8\uB9B4\uB9AC',q:2},
    {n:'\uBC15\uC0AC\uC758 \uC5F0\uAD6C',q:2},{n:'\uBCF4\uC2A4\uC758 \uC9C0\uB839',q:2},{n:'\uB124\uBAA8',q:2},
    {n:'\uD558\uC774\uD37C\uBCFC',q:4},{n:'\uB124\uC2A4\uD2B8\uBCFC',q:2},{n:'\uC6B8\uD2B8\uB77C\uBCFC',q:2},
    {n:'\uAD50\uCCB4',q:2},{n:'\uBC24\uC758 \uB4E4\uAC83',q:2},{n:'\uCE74\uC6B4\uD130\uCE90\uCCB4',q:2},
    {n:'\uBB3C \uC5D0\uB108\uC9C0 \uD83D\uDCA7',q:10},{n:'\uC545 \uC5D0\uB108\uC9C0 \uD83C\uDF19',q:6},
    {n:'\uB354\uBE14 \uD130\uBCF4 \uC5D0\uB108\uC9C0',q:2},{n:'\uC81C\uD2B8 \uC5D0\uB108\uC9C0',q:2}
  ]},
  {name:'\uD14C\uB77C\uC2A4\uD0C8 \uBBA4\uCE20 ex \uC2A4\uD0C0\uD130',type:'\uD83D\uDD2E',cards:[
    {n:'\uBBA4\uCE20 ex',q:2},{n:'\uB784\uD1A0\uC2A4',q:2},{n:'\uD0AC\uB9AC\uC544',q:2},{n:'\uAC00\uB514\uC548 ex',q:2},
    {n:'\uBC15\uC0AC\uC758 \uC5F0\uAD6C',q:2},{n:'\uBCF4\uC2A4\uC758 \uC9C0\uB839',q:1},{n:'\uB124\uBAA8',q:2},
    {n:'\uD558\uC774\uD37C\uBCFC',q:4},{n:'\uB124\uC2A4\uD2B8\uBCFC',q:2},{n:'\uAD50\uCCB4',q:2},
    {n:'\uCD08 \uC5D0\uB108\uC9C0 \uD83D\uDD2E',q:12},{n:'\uBB34\uC0C9 \uC5D0\uB108\uC9C0',q:4},
    {n:'\uB354\uBE14 \uD130\uBCF4 \uC5D0\uB108\uC9C0',q:2}
  ]},
  {name:'\uCF54\uB77C\uC774\uB3C8 ex \uC2A4\uD0C0\uD130',type:'\uD83E\uDD95',cards:[
    {n:'\uCF54\uB77C\uC774\uB3C8 ex',q:2},{n:'\uB8E8\uCE74\uB9AC\uC624',q:2},{n:'\uB9AC\uC624\uB8E8',q:2},
    {n:'\uBC15\uC0AC\uC758 \uC5F0\uAD6C',q:2},{n:'\uB124\uBAA8',q:2},
    {n:'\uD558\uC774\uD37C\uBCFC',q:4},{n:'\uB124\uC2A4\uD2B8\uBCFC',q:2},{n:'\uAD50\uCCB4',q:2},
    {n:'\uACA9\uD22C \uC5D0\uB108\uC9C0 \uD83D\uDC4A',q:12},{n:'\uBB34\uC0C9 \uC5D0\uB108\uC9C0',q:4}
  ]},
  {name:'\uBBF8\uB77C\uC774\uB3C8 ex \uC2A4\uD0C0\uD130',type:'\u26A1',cards:[
    {n:'\uBBF8\uB77C\uC774\uB3C8 ex',q:2},{n:'\uB808\uC9C0\uC5D0\uB808\uD0A4',q:2},{n:'\uD30C\uBAA8\uD2B8\uB9AC',q:1},
    {n:'\uBC15\uC0AC\uC758 \uC5F0\uAD6C',q:2},{n:'\uB124\uBAA8',q:2},
    {n:'\uD558\uC774\uD37C\uBCFC',q:4},{n:'\uB124\uC2A4\uD2B8\uBCFC',q:2},{n:'\uAD50\uCCB4',q:2},
    {n:'\uBC88\uAC1C \uC5D0\uB108\uC9C0 \u26A1',q:12},{n:'\uBB34\uC0C9 \uC5D0\uB108\uC9C0',q:4}
  ]},
  {name:'\uB2D8\uD53C\uC544 ex \uC2A4\uD0C0\uD130',type:'\uD83C\uDF80',cards:[
    {n:'\uB2D8\uD53C\uC544 ex',q:2},{n:'\uC774\uBE0C\uC774',q:3},
    {n:'\uBC15\uC0AC\uC758 \uC5F0\uAD6C',q:2},{n:'\uB124\uBAA8',q:2},
    {n:'\uD558\uC774\uD37C\uBCFC',q:4},{n:'\uB124\uC2A4\uD2B8\uBCFC',q:2},{n:'\uAD50\uCCB4',q:2},
    {n:'\uCD08 \uC5D0\uB108\uC9C0 \uD83D\uDD2E',q:12},{n:'\uBB34\uC0C9 \uC5D0\uB108\uC9C0',q:4}
  ]}
];

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
function isStandalone(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;}
function authAction(){
  if(!auth)return;
  if(currentUser){if(confirm('\uB85C\uADF8\uC544\uC6C3 \uD558\uC2DC\uACA0\uC5B4\uC694?'))auth.signOut();}
  else{
    var provider=new firebase.auth.GoogleAuthProvider();
    if(isStandalone()){auth.signInWithRedirect(provider);}
    else{auth.signInWithPopup(provider).then(function(r){if(r&&r.user){currentUser=r.user;updateAuthUI();loadFromCloud();}}).catch(function(e){if(e.code==='auth/popup-blocked')auth.signInWithRedirect(provider);});}
  }
}
function updateAuthUI(){
  var user=currentUser||(auth?auth.currentUser:null);if(user)currentUser=user;
  var s=document.getElementById('auth-status'),l=document.getElementById('auth-label'),b=document.getElementById('auth-btn');
  if(!s||!l||!b)return;
  if(user){s.innerHTML='\u2601\uFE0F <strong>'+esc(user.displayName||(user.email?user.email.split('@')[0]:'User'))+'</strong>';l.textContent='\uB85C\uADF8\uC544\uC6C3';b.style.background='#f0f0f0';b.style.color='#666';b.style.boxShadow='none';}
  else{s.textContent='\u2601\uFE0F \uB85C\uADF8\uC778\uD558\uBA74 \uD074\uB77C\uC6B0\uB4DC \uC800\uC7A5!';l.textContent='Google \uB85C\uADF8\uC778';b.style.background='linear-gradient(135deg,#4285f4,#34a0f4)';b.style.color='#fff';b.style.boxShadow='0 2px 6px rgba(66,133,244,.3)';}
}
if(auth){
  auth.onAuthStateChanged(function(u){var w=!currentUser;currentUser=u;updateAuthUI();if(u&&w)loadFromCloud();});
  auth.getRedirectResult().then(function(r){if(r&&r.user){currentUser=r.user;updateAuthUI();loadFromCloud();}}).catch(function(){});
  function pollAuth(){if(auth.currentUser&&!currentUser){currentUser=auth.currentUser;updateAuthUI();loadFromCloud();}else if(auth.currentUser)updateAuthUI();}
  setTimeout(pollAuth,500);setTimeout(pollAuth,1500);setTimeout(pollAuth,3000);setTimeout(pollAuth,5000);setTimeout(pollAuth,8000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(pollAuth,300);});
}

/* ═══ Data ═══ */
var SK='ptcg-v3',D;
try{D=JSON.parse(localStorage.getItem(SK));}catch(e){}
if(!D||!D.cards)D={cards:[],decks:[]};
function sv(){try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}if(currentUser){if(_syncTimeout)clearTimeout(_syncTimeout);_syncTimeout=setTimeout(saveToCloud,1000);}}
function esc(s){if(typeof s!='string')return'';var o='',i,c;for(i=0;i<s.length;i++){c=s.charCodeAt(i);if(c===38)o+='&amp;';else if(c===34)o+='&quot;';else if(c===39)o+='&#39;';else if(c===60)o+='&lt;';else if(c===62)o+='&gt;';else o+=s[i];}return o;}
function saveToCloud(){if(!currentUser||!db)return;db.collection('users').doc(currentUser.uid).set({cards:D.cards,decks:D.decks,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),displayName:currentUser.displayName||'',email:currentUser.email||''}).catch(function(){});}
function loadFromCloud(){if(!currentUser||!db)return;db.collection('users').doc(currentUser.uid).get().then(function(doc){if(doc.exists){var d=doc.data();if(d.cards&&d.cards.length>=D.cards.length){D.cards=d.cards;D.decks=d.decks||[];}else if(D.cards.length>0)saveToCloud();try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}try{rColl();}catch(e){}try{rDecks();}catch(e){}try{rRare();}catch(e){}}else if(D.cards.length>0)saveToCloud();}).catch(function(){});}

/* ═══════════════════════════════════════════════
   TODO #1: 도감 → 포켓몬 전용 검색
   - supertype:"Pokémon" 쿼리 강제
   - supertype 필터 칩 제거
   ═══════════════════════════════════════════════ */
var _dexPage=1,_dexName='',_dexKr='',_dexTotal=0,_dexAllCards=[],_dexFilter='all';
function searchDex(page){
  var q=document.getElementById('dex-q').value.trim();
  if(!q&&!_dexName)return;
  if(q&&q!==_dexKr){_dexPage=1;_dexAllCards=[];_dexFilter='all';_dexKr=q;_dexName=KR2EN[q]||q;}
  if(page)_dexPage=page;
  var dr=document.getElementById('dex-r');
  dr.innerHTML='<div class="loading"><div class="spinner"></div><p>\uCE74\uB4DC \uAC80\uC0C9 \uC911... (\uD398\uC774\uC9C0 '+_dexPage+')</p></div>';
  /* 포켓몬만 검색: supertype:Pokémon 추가 */
  fetch('https://api.pokemontcg.io/v2/cards?q=name:"'+encodeURIComponent(_dexName)+'" supertype:Pok%C3%A9mon&page='+_dexPage+'&pageSize=250&select=id,name,images,rarity,set,hp,types,supertype,subtypes,attacks,abilities,rules,weaknesses,resistances,retreatCost')
  .then(function(r){return r.json();}).then(function(data){
    if(!data.data||!data.data.length){if(!_dexAllCards.length){dr.innerHTML='<div class="empty"><div class="ei">\uD83D\uDE22</div><p>"'+esc(_dexKr)+'" \uAC80\uC0C9 \uACB0\uACFC \uC5C6\uC74C</p></div>';return;}}
    if(data.data)_dexAllCards=_dexAllCards.concat(data.data);
    _dexTotal=data.totalCount||_dexAllCards.length;
    renderDex();
    if(_dexAllCards.length<_dexTotal&&_dexPage<10){_dexPage++;setTimeout(function(){searchDex(_dexPage);},300);}
  }).catch(function(e){dr.innerHTML='<div class="empty"><div class="ei">\u26A0\uFE0F</div><p>\uAC80\uC0C9 \uC624\uB958: '+esc(e.message||'')+'</p></div>';});
}
function renderDex(){
  var dr=document.getElementById('dex-r'),cards=_dexAllCards;
  /* 희소도 필터만 (supertype 필터 제거) */
  var rarities={};cards.forEach(function(c){var r=c.rarity||'Unknown';rarities[r]=(rarities[r]||0)+1;});
  var filtered=_dexFilter==='all'?cards:cards.filter(function(c){return(c.rarity||'Unknown')===_dexFilter;});
  var own={};D.cards.forEach(function(c){own[c.id]=1;});
  var h='<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:10px"><span style="font-family:var(--ft);font-size:.85rem;color:var(--accent)">"'+esc(_dexKr)+'" \uCD1D '+_dexTotal+'\uC885</span><span style="font-size:.72rem;color:var(--text3)">(\uB85C\uB4DC '+_dexAllCards.length+')</span></div>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">';
  h+='<button class="rbtn'+(_dexFilter==='all'?' active':'')+'" onclick="_dexFilter=\'all\';renderDex()">\uC804\uCCB4 ('+cards.length+')</button>';
  var ro=['Common','Uncommon','Rare','Rare Holo','Rare Holo V','Rare Ultra','Illustration Rare','Special Art Rare','Rare Secret'];
  var shown={};ro.forEach(function(r){if(rarities[r]){h+='<button class="rbtn'+(_dexFilter===r?' active':'')+'" onclick="_dexFilter=\''+r+'\';renderDex()">'+esc(r)+' ('+rarities[r]+')</button>';shown[r]=1;}});
  Object.keys(rarities).forEach(function(r){if(!shown[r]&&r!=='Unknown'){h+='<button class="rbtn'+(_dexFilter===r?' active':'')+'" onclick="_dexFilter=\''+r+'\';renderDex()">'+esc(r)+' ('+rarities[r]+')</button>';}});
  h+='</div><div class="dgrid">';
  filtered.forEach(function(c,ci){var o=own[c.id];var img=(c.images&&c.images.small)||'';var sn=(c.set&&c.set.name)||'';
    h+='<div class="dc '+(o?'owned':'unowned')+'" data-gidx="'+ci+'"><div class="ob">'+(o?'\u2713':'\uFF0B')+'</div><img src="'+img+'" alt="'+esc(c.name)+'" loading="lazy"><div class="nm">'+esc(c.rarity||'')+' \xB7 '+esc(sn)+'</div></div>';
  });
  h+='</div>';
  if(_dexAllCards.length<_dexTotal)h+='<div style="text-align:center;margin-top:14px"><div class="loading"><div class="spinner"></div><p>\uB098\uBA38\uC9C0 \uBD88\uB7EC\uC624\uB294 \uC911... ('+_dexAllCards.length+'/'+_dexTotal+')</p></div></div>';
  else if(_dexAllCards.length>0)h+='<p style="text-align:center;font-size:.72rem;color:var(--text3);margin-top:10px">\uBAA8\uB4E0 \uCE74\uB4DC \uB85C\uB4DC \uC644\uB8CC! ('+_dexAllCards.length+')</p>';
  dr.innerHTML=h;
  window._dexFiltered=filtered;window._dexKrName=_dexKr;
  var els=dr.querySelectorAll('.dc');for(var i=0;i<els.length;i++){els[i].addEventListener('click',(function(idx){return function(){showModal(window._dexFiltered[idx],window._dexKrName);};})(i));}
}

/* ═══ Modal ═══ */
function showModal(c,kr){
  var img=(c.images&&c.images.large)||(c.images&&c.images.small)||'';
  var o=false;for(var i=0;i<D.cards.length;i++){if(D.cards[i].id===c.id){o=true;break;}}
  var r=c.rarity||'Unknown',s=c.set?c.set.name:'-',hp=c.hp||'-',ty=c.types?c.types.join(', '):'-',st=c.supertype||'-';
  var sub=c.subtypes?c.subtypes.join(', '):'';
  var h='';if(img)h+='<img src="'+img+'">';
  h+='<h3>'+esc(kr||c.name)+'</h3>';
  h+='<div class="dr"><span class="dl">\uC601\uBB38\uBA85</span><span>'+esc(c.name)+'</span></div>';
  h+='<div class="dr"><span class="dl">\uCE74\uB4DC\uD0C0\uC785</span><span>'+esc(st)+(sub?' \xB7 '+esc(sub):'')+'</span></div>';
  if(st==='Pok\u00e9mon'){
    h+='<div class="dr"><span class="dl">\uD0C0\uC785</span><span>'+esc(ty)+'</span></div>';
    h+='<div class="dr"><span class="dl">HP</span><span>'+esc(hp)+'</span></div>';
  }
  h+='<div class="dr"><span class="dl">\uC138\uD2B8</span><span>'+esc(s)+'</span></div>';
  h+='<div class="dr"><span class="dl">\uD76C\uC18C\uB3C4</span><span>'+esc(r)+'</span></div>';
  if(c.abilities&&c.abilities.length){
    h+='<div style="margin-top:10px;padding:8px;background:rgba(61,192,236,.06);border-radius:10px">';
    c.abilities.forEach(function(a){h+='<div style="margin-bottom:6px"><span style="font-family:var(--ft);font-size:.85rem;color:var(--accent)">\u2728 '+esc(a.name)+'</span> <span style="font-size:.65rem;color:var(--text3)">['+esc(a.type)+']</span><p style="font-size:.75rem;color:var(--text2);margin-top:2px">'+esc(a.text||'')+'</p></div>';});
    h+='</div>';
  }
  if(c.attacks&&c.attacks.length){
    h+='<div style="margin-top:10px">';
    c.attacks.forEach(function(a){
      var cost=a.cost?a.cost.join(''):'';
      var ci2=cost.replace(/Grass/g,'\uD83C\uDF3F').replace(/Fire/g,'\uD83D\uDD25').replace(/Water/g,'\uD83D\uDCA7').replace(/Lightning/g,'\u26A1').replace(/Psychic/g,'\uD83D\uDD2E').replace(/Fighting/g,'\uD83D\uDC4A').replace(/Darkness/g,'\uD83C\uDF19').replace(/Metal/g,'\u2699\uFE0F').replace(/Colorless/g,'\u26AA');
      h+='<div style="padding:8px;background:var(--card);border:1px solid var(--cb);border-radius:8px;margin-bottom:6px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:var(--ft);font-size:.85rem">'+esc(ci2)+' '+esc(a.name)+'</span>';
      if(a.damage)h+='<span style="font-family:var(--ft);font-size:1rem;color:var(--red)">'+esc(a.damage)+'</span>';
      h+='</div>';if(a.text)h+='<p style="font-size:.72rem;color:var(--text2);margin-top:4px">'+esc(a.text)+'</p>';h+='</div>';
    });
    h+='</div>';
  }
  if(c.rules&&c.rules.length){
    h+='<div style="margin-top:10px;padding:8px;background:rgba(255,203,5,.08);border-radius:10px">';
    c.rules.forEach(function(r){h+='<p style="font-size:.75rem;color:var(--text2);margin-bottom:4px">'+esc(r)+'</p>';});
    h+='</div>';
  }
  if(st==='Pok\u00e9mon'){
    var wk=c.weaknesses?c.weaknesses.map(function(w){return w.type+' '+w.value;}).join(', '):'-';
    var rs=c.resistances?c.resistances.map(function(r){return r.type+' '+r.value;}).join(', '):'-';
    var rc=c.retreatCost?c.retreatCost.length:0;
    h+='<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;font-size:.75rem;color:var(--text2)"><span>\uC57D\uC810: '+esc(wk)+'</span><span>\uC800\uD56D: '+esc(rs)+'</span><span>\uD6C4\uD1F4: '+rc+'</span></div>';
  }
  window._modalCard={id:c.id,name:c.name,krName:kr,rarity:r,set:s,hp:hp,types:ty,supertype:st,image:(c.images&&c.images.small)||''};
  h+='<div class="acts" style="margin-top:12px">';
  if(o)h+='<button class="btn btn-d" onclick="rmCard(window._modalCard.id)">\uC81C\uAC70</button>';
  else h+='<button class="btn btn-p" onclick="addCard(window._modalCard)">\uCE74\uB4DC\uD568\uC5D0 \uCD94\uAC00</button>';
  h+='</div>';
  document.getElementById('mb').innerHTML=h;document.getElementById('mo').className='mo show';
}
function addCard(cd){var dup=false;for(var i=0;i<D.cards.length;i++){if(D.cards[i].id===cd.id){dup=true;break;}}if(!dup){D.cards.push({id:cd.id,name:cd.name,krName:cd.krName,rarity:cd.rarity,set:cd.set,hp:cd.hp,types:cd.types,supertype:cd.supertype,image:cd.image});sv();}closeM();}
function rmCard(id){D.cards=D.cards.filter(function(c){return c.id!==id;});sv();closeM();try{rColl();}catch(e){}}

/* ═══ Collection ═══ */
function rColl(){
  var f=document.getElementById('cf').value;
  var fc=f==='all'?D.cards:f==='Ultra'?D.cards.filter(function(c){var r=(c.rarity||'').toLowerCase();return r.indexOf('ultra')>=0||r.indexOf('secret')>=0||r.indexOf('vmax')>=0||r.indexOf('vstar')>=0||r.indexOf('illustration')>=0;}):D.cards.filter(function(c){return(c.rarity||'').indexOf(f)>=0;});
  document.getElementById('cc').textContent=fc.length+'/'+D.cards.length+'\uC7A5';
  if(!fc.length){document.getElementById('cg').innerHTML='';document.getElementById('ce').style.display='block';return;}
  document.getElementById('ce').style.display='none';
  var h='';fc.forEach(function(c){h+='<div class="cc">';if(c.image)h+='<img src="'+esc(c.image)+'" loading="lazy">';h+='<div class="n">'+esc(c.krName||c.name)+'</div><div class="m">'+esc(c.rarity||'')+'</div><button class="x" onclick="rmCard(\''+esc(c.id)+'\')">\xD7</button></div>';});
  document.getElementById('cg').innerHTML=h;
}

/* ═══ Quick Add ═══ */
function quickSearch(){
  var q=document.getElementById('quick-q').value.trim();if(!q)return;
  var r=document.getElementById('quick-r');
  var matches=KR_NAMES.filter(function(n){return n.indexOf(q)>=0;}).slice(0,20);
  if(!matches.length){r.innerHTML='<p style="color:var(--text3);font-size:.82rem">"'+esc(q)+'" \uC77C\uCE58\uD558\uB294 \uD3EC\uCF13\uBAAC\uC774 \uC5C6\uC5B4\uC694</p>';return;}
  var h='<div style="display:flex;flex-wrap:wrap;gap:6px">';
  matches.forEach(function(m){h+='<button class="btn btn-p btn-s" onclick="quickGo(\''+esc(m)+'\')">'+esc(m)+'</button>';});
  h+='</div>';r.innerHTML=h;
}
function quickGo(kr){
  document.getElementById('dex-q').value=kr;
  var tabs=document.getElementById('tabbar').getElementsByTagName('button');
  for(var i=0;i<tabs.length;i++){if(tabs[i].textContent.indexOf('\uB3C4\uAC10')>=0){switchTab('dex',tabs[i]);break;}}
  _dexAllCards=[];_dexPage=1;_dexFilter='all';searchDex();
}

/* ═══ Decks ═══ */
function createDeck(){var n=document.getElementById('dk-n').value.trim();if(!n)return;D.decks.push({name:n,cards:[]});sv();document.getElementById('dk-n').value='';rDecks();}
function deleteDeck(i){if(confirm('\uC815\uB9D0 \uC0AD\uC81C?')){D.decks.splice(i,1);sv();rDecks();}}
function rDecks(){
  if(!D.decks.length){document.getElementById('dk-l').innerHTML='';document.getElementById('dk-e').style.display='block';rBattleSel();return;}
  document.getElementById('dk-e').style.display='none';
  var h='';
  D.decks.forEach(function(d,di){
    var cnt=0;d.cards.forEach(function(c){cnt+=c.q||1;});
    h+='<div class="di"><div><div class="dn">'+esc(d.name)+'</div><div class="dc2">'+cnt+'/60\uC7A5</div></div><div style="display:flex;gap:4px">';
    h+='<button class="btn btn-s btn-p" onclick="showDeckDetail('+di+')">\uBCF4\uAE30</button>';
    h+='<button class="btn btn-s btn-g" onclick="showAddToDeck('+di+')">\uCD94\uAC00</button>';
    h+='<button class="btn btn-s btn-d" onclick="deleteDeck('+di+')">\uC0AD\uC81C</button></div></div>';
  });
  document.getElementById('dk-l').innerHTML=h;rBattleSel();
}

/* ═══════════════════════════════════════════════
   TODO #3: 모의덱 카드 목록에 이미지 표시
   ═══════════════════════════════════════════════ */
/* ═══ 한글→영문 역매핑 (트레이너스/에너지용) ═══ */
var _KR2EN_PRESET={};
(function(){
  var cats=Object.keys(TRAINERS);
  for(var i=0;i<cats.length;i++){
    var arr=TRAINERS[cats[i]];
    for(var j=0;j<arr.length;j++) _KR2EN_PRESET[arr[j].kr]=arr[j].en;
  }
  for(var k=0;k<ENERGY.length;k++) _KR2EN_PRESET[ENERGY[k].n]=ENERGY[k].en;
  for(var m=0;m<SP_ENERGY.length;m++) _KR2EN_PRESET[SP_ENERGY[m].kr]=SP_ENERGY[m].en;
})();

var _deckDetailItems=[], _deckDetailIdx=-1;
function _dcd(ci){
  var item=_deckDetailItems[ci];if(!item)return;
  showDeckCardDetail(item.n,item.img,_deckDetailIdx);
}
function showDeckDetail(di){
  _deckDetailIdx=di;_deckDetailItems=[];
  var d=D.decks[di];if(!d)return;
  var h='<h3>'+esc(d.name)+'</h3>';
  if(!d.cards.length){h+='<p style="color:var(--text3)">\uCE74\uB4DC\uAC00 \uC5C6\uC5B4\uC694</p>';}
  else{h+='<div class="dd">';d.cards.forEach(function(c,ci){
    _deckDetailItems.push({n:c.n,img:c.img||''});
    h+='<div class="ce" style="cursor:pointer">';
    if(c.img)h+='<img src="'+esc(c.img)+'" onclick="_dcd('+ci+')" style="width:36px;height:50px;object-fit:contain;border-radius:4px;flex-shrink:0">';
    h+='<span style="font-size:.82rem;flex:1" onclick="_dcd('+ci+')">'+esc(c.n)+'</span>';
    h+='<span style="font-size:.72rem;color:var(--text3);white-space:nowrap">\xD7'+(c.q||1)+'</span>';
    h+='<button class="btn btn-s btn-d" onclick="event.stopPropagation();rmFromDeck('+di+','+ci+')" style="padding:2px 8px;font-size:.65rem">\uC0AD\uC81C</button></div>';
  });h+='</div>';}
  document.getElementById('mb').innerHTML=h;document.getElementById('mo').className='mo show';
}

/* 덱 카드 상세 보기 — API에서 풀 데이터 조회 */
function showDeckCardDetail(krName,imgUrl,deckIdx){
  var mb=document.getElementById('mb');
  /* 영문명 찾기: KR2EN(포켓몬) → _KR2EN_PRESET(트레이너스/에너지) */
  var enName=KR2EN[krName]||_KR2EN_PRESET[krName]||krName;
  /* 로딩 표시 */
  mb.innerHTML='<div class="loading"><div class="spinner"></div><p>'+esc(krName)+' 정보 불러오는 중...</p></div>';
  /* API 검색 */
  fetch('https://api.pokemontcg.io/v2/cards?q=name:"'+encodeURIComponent(enName)+'"&pageSize=1&select=id,name,images,rarity,set,hp,types,supertype,subtypes,attacks,abilities,rules,weaknesses,resistances,retreatCost')
  .then(function(r){return r.json();}).then(function(data){
    if(data.data&&data.data.length){
      var c=data.data[0];
      var img=(c.images&&c.images.large)||(c.images&&c.images.small)||imgUrl||'';
      var r=c.rarity||'',s=c.set?c.set.name:'-',hp=c.hp||'-',ty=c.types?c.types.join(', '):'-',st=c.supertype||'-';
      var sub=c.subtypes?c.subtypes.join(', '):'';
      var h='';
      if(img)h+='<img src="'+esc(img)+'" style="max-width:220px;display:block;margin:0 auto 10px;border-radius:12px">';
      h+='<h3 style="text-align:center;font-family:var(--ft);color:var(--accent)">'+esc(krName)+'</h3>';
      h+='<div class="dr"><span class="dl">\uC601\uBB38\uBA85</span><span>'+esc(c.name)+'</span></div>';
      h+='<div class="dr"><span class="dl">\uCE74\uB4DC\uD0C0\uC785</span><span>'+esc(st)+(sub?' \xB7 '+esc(sub):'')+'</span></div>';
      if(st==='Pok\u00e9mon'){
        h+='<div class="dr"><span class="dl">\uD0C0\uC785</span><span>'+esc(ty)+'</span></div>';
        h+='<div class="dr"><span class="dl">HP</span><span>'+esc(hp)+'</span></div>';
      }
      h+='<div class="dr"><span class="dl">\uC138\uD2B8</span><span>'+esc(s)+'</span></div>';
      if(r)h+='<div class="dr"><span class="dl">\uD76C\uC18C\uB3C4</span><span>'+esc(r)+'</span></div>';
      /* 특성 */
      if(c.abilities&&c.abilities.length){
        h+='<div style="margin-top:10px;padding:8px;background:rgba(61,192,236,.06);border-radius:10px">';
        c.abilities.forEach(function(a){h+='<div style="margin-bottom:6px"><span style="font-family:var(--ft);font-size:.85rem;color:var(--accent)">\u2728 '+esc(a.name)+'</span> <span style="font-size:.65rem;color:var(--text3)">['+esc(a.type)+']</span><p style="font-size:.75rem;color:var(--text2);margin-top:2px">'+esc(a.text||'')+'</p></div>';});
        h+='</div>';
      }
      /* 기술 */
      if(c.attacks&&c.attacks.length){
        h+='<div style="margin-top:10px">';
        c.attacks.forEach(function(a){
          var cost=a.cost?a.cost.join(''):'';
          var ci2=cost.replace(/Grass/g,'\uD83C\uDF3F').replace(/Fire/g,'\uD83D\uDD25').replace(/Water/g,'\uD83D\uDCA7').replace(/Lightning/g,'\u26A1').replace(/Psychic/g,'\uD83D\uDD2E').replace(/Fighting/g,'\uD83D\uDC4A').replace(/Darkness/g,'\uD83C\uDF19').replace(/Metal/g,'\u2699\uFE0F').replace(/Colorless/g,'\u26AA');
          h+='<div style="padding:8px;background:var(--card);border:1px solid var(--cb);border-radius:8px;margin-bottom:6px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:var(--ft);font-size:.85rem">'+esc(ci2)+' '+esc(a.name)+'</span>';
          if(a.damage)h+='<span style="font-family:var(--ft);font-size:1rem;color:var(--red)">'+esc(a.damage)+'</span>';
          h+='</div>';if(a.text)h+='<p style="font-size:.72rem;color:var(--text2);margin-top:4px">'+esc(a.text)+'</p>';h+='</div>';
        });
        h+='</div>';
      }
      /* 효과 텍스트 (트레이너스/에너지) */
      if(c.rules&&c.rules.length){
        h+='<div style="margin-top:10px;padding:8px;background:rgba(255,203,5,.08);border-radius:10px">';
        c.rules.forEach(function(r){h+='<p style="font-size:.75rem;color:var(--text2);margin-bottom:4px">'+esc(r)+'</p>';});
        h+='</div>';
      }
      /* 약점/저항력/후퇴 */
      if(st==='Pok\u00e9mon'){
        var wk=c.weaknesses?c.weaknesses.map(function(w){return w.type+' '+w.value;}).join(', '):'-';
        var rs=c.resistances?c.resistances.map(function(r){return r.type+' '+r.value;}).join(', '):'-';
        var rc=c.retreatCost?c.retreatCost.length:0;
        h+='<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;font-size:.75rem;color:var(--text2)"><span>\uC57D\uC810: '+esc(wk)+'</span><span>\uC800\uD56D: '+esc(rs)+'</span><span>\uD6C4\uD1F4: '+rc+'</span></div>';
      }
      h+='<button class="btn btn-g" onclick="showDeckDetail('+deckIdx+')" style="margin-top:14px;width:100%">\u2190 \uB371 \uBAA9\uB85D\uC73C\uB85C</button>';
      mb.innerHTML=h;
    }else{
      /* API 결과 없음 — 이미지라도 표시 */
      var h2='';
      if(imgUrl)h2+='<img src="'+esc(imgUrl)+'" style="max-width:220px;display:block;margin:0 auto 10px;border-radius:12px">';
      h2+='<h3 style="text-align:center;font-family:var(--ft);color:var(--accent)">'+esc(krName)+'</h3>';
      h2+='<p style="text-align:center;font-size:.78rem;color:var(--text3);margin-top:8px">\uC0C1\uC138 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694</p>';
      h2+='<button class="btn btn-g" onclick="showDeckDetail('+deckIdx+')" style="margin-top:14px;width:100%">\u2190 \uB371 \uBAA9\uB85D\uC73C\uB85C</button>';
      mb.innerHTML=h2;
    }
  }).catch(function(){
    var h3='';
    if(imgUrl)h3+='<img src="'+esc(imgUrl)+'" style="max-width:220px;display:block;margin:0 auto 10px;border-radius:12px">';
    h3+='<h3 style="text-align:center;font-family:var(--ft);color:var(--accent)">'+esc(krName)+'</h3>';
    h3+='<p style="text-align:center;font-size:.78rem;color:var(--text3);margin-top:8px">\uB124\uD2B8\uC6CC\uD06C \uC624\uB958</p>';
    h3+='<button class="btn btn-g" onclick="showDeckDetail('+deckIdx+')" style="margin-top:14px;width:100%">\u2190 \uB371 \uBAA9\uB85D\uC73C\uB85C</button>';
    mb.innerHTML=h3;
  });
}
function rmFromDeck(di,ci){
  var c=D.decks[di].cards[ci];
  if(c&&c.q>1){c.q--;} else {D.decks[di].cards.splice(ci,1);}
  sv();showDeckDetail(di);
}

/* ═══════════════════════════════════════════════
   TODO #2+3: 모의덱 카드 추가 — 영문명 기반 API 이미지
   ═══════════════════════════════════════════════ */
/* 전역: 덱 추가 데이터 */
var _addDeckIdx=-1, _addItems=[];
function _adi(idx){
  console.log('_adi called:',idx,_addItems[idx]);
  var item=_addItems[idx];if(!item)return;
  if(item.type==='direct') addToDeck(_addDeckIdx,item.kr,item.img);
  else addToDeckWithImage(_addDeckIdx,item.kr,item.en);
}
function _adCustom(){
  var inp=document.getElementById('deck-custom-input');
  var v=inp?inp.value.trim():'';
  if(v){addToDeck(_addDeckIdx,v,'');inp.value='';}
}
function showAddToDeck(di){
  _addDeckIdx=di;_addItems=[];
  var d=D.decks[di];
  var h='<h3>"'+esc(d.name)+'" \uCE74\uB4DC \uCD94\uAC00</h3>';
  /* 내 카드함 포켓몬 */
  h+='<div style="margin:10px 0"><strong>\uD83D\uDC32 \uB0B4 \uCE74\uB4DC\uD568\uC5D0\uC11C</strong></div>';
  if(D.cards.length){h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">';D.cards.forEach(function(c){
    var ai=_addItems.length;_addItems.push({kr:c.krName||c.name,img:c.image||'',type:'direct'});
    h+='<button class="btn btn-s btn-g" onclick="_adi('+ai+')">'+esc(c.krName||c.name)+'</button>';
  });h+='</div>';}
  else h+='<p style="font-size:.78rem;color:var(--text3);margin-bottom:12px">\uCE74\uB4DC\uD568\uC774 \uBE44\uC5B4\uC788\uC5B4\uC694</p>';
  /* 트레이너스 */
  var cats=Object.keys(TRAINERS);
  cats.forEach(function(cat){
    h+='<div style="margin:10px 0"><strong>\uD83C\uDCCF '+esc(cat)+'</strong></div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">';
    TRAINERS[cat].forEach(function(t){
      var ai=_addItems.length;_addItems.push({kr:t.kr,en:t.en,type:'api'});
      h+='<button class="btn btn-s btn-g" onclick="_adi('+ai+')">'+esc(t.kr)+'</button>';
    });
    h+='</div>';
  });
  /* 기본 에너지 */
  h+='<div style="margin:10px 0"><strong>\u26A1 \uAE30\uBCF8 \uC5D0\uB108\uC9C0</strong></div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">';
  ENERGY.forEach(function(e){
    var ai=_addItems.length;_addItems.push({kr:e.n,en:e.en,type:'api'});
    h+='<button class="btn btn-s btn-g" onclick="_adi('+ai+')">'+esc(e.n)+'</button>';
  });
  h+='</div>';
  /* 특수 에너지 */
  h+='<div style="margin:10px 0"><strong>\uD83C\uDF00 \uD2B9\uC218 \uC5D0\uB108\uC9C0</strong></div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">';
  SP_ENERGY.forEach(function(e){
    var ai=_addItems.length;_addItems.push({kr:e.kr,en:e.en,type:'api'});
    h+='<button class="btn btn-s btn-g" onclick="_adi('+ai+')">'+esc(e.kr)+'</button>';
  });
  h+='</div>';
  /* 직접 입력 */
  h+='<div style="margin:12px 0;border-top:1px solid var(--cb);padding-top:12px"><strong>\u270D\uFE0F \uC9C1\uC811 \uC785\uB825 (\uBAA9\uB85D\uC5D0 \uC5C6\uB294 \uCE74\uB4DC)</strong></div>';
  h+='<div class="srch" style="margin-bottom:0"><input type="text" id="deck-custom-input" placeholder="\uCE74\uB4DC \uC774\uB984 \uC785\uB825"><button class="btn btn-p" onclick="_adCustom()">\uCD94\uAC00</button></div>';
  document.getElementById('mb').innerHTML=h;document.getElementById('mo').className='mo show';
}

/* 카드 추가 (이미지 URL 직접 전달) */
function addToDeck(di,name,imgUrl){
  var d=D.decks[di];
  for(var i=0;i<d.cards.length;i++){if(d.cards[i].n===name){d.cards[i].q=(d.cards[i].q||1)+1;sv();showAddToDeck(di);return;}}
  d.cards.push({n:name,q:1,img:imgUrl||''});
  sv();showAddToDeck(di);
}

/* 카드 추가 + API에서 이미지 자동 조회 */
function addToDeckWithImage(di,krName,enName){
  var d=D.decks[di];
  for(var i=0;i<d.cards.length;i++){if(d.cards[i].n===krName){d.cards[i].q=(d.cards[i].q||1)+1;sv();showAddToDeck(di);return;}}
  if(enName){
    fetch('https://api.pokemontcg.io/v2/cards?q=name:"'+encodeURIComponent(enName)+'"&pageSize=1&select=id,name,images')
    .then(function(r){return r.json();}).then(function(data){
      var img='';
      if(data.data&&data.data.length&&data.data[0].images)img=data.data[0].images.small||'';
      d.cards.push({n:krName,q:1,img:img});sv();showAddToDeck(di);
    }).catch(function(){d.cards.push({n:krName,q:1,img:''});sv();showAddToDeck(di);});
  }else{d.cards.push({n:krName,q:1,img:''});sv();showAddToDeck(di);}
}

/* ═══ Preset Deck Loader ═══ */
function loadPresetDeck(idx){
  var p=PRESET_DECKS[idx];if(!p)return;
  var name=p.name;
  for(var i=0;i<D.decks.length;i++){if(D.decks[i].name===name){alert('\uC774\uBBF8 "'+name+'" \uB371\uC774 \uC788\uC5B4\uC694!');return;}}
  D.decks.push({name:name,cards:p.cards.map(function(c){return{n:c.n,q:c.q,img:''};})});
  sv();rDecks();alert('"'+name+'" \uB371\uC744 \uBD88\uB7EC\uC654\uC5B4\uC694! ('+p.cards.reduce(function(a,c){return a+c.q;},0)+'\uC7A5)');
}

/* ═══ Recommend ═══ */
function genRec(){
  var rr=document.getElementById('rec-r');
  if(!D.cards.length){rr.innerHTML='<div class="empty"><div class="ei">\uD83D\uDE22</div><p>\uCE74\uB4DC\uD568\uC5D0 \uCE74\uB4DC\uB97C \uBA3C\uC800 \uCD94\uAC00\uD574\uC8FC\uC138\uC694</p></div>';return;}
  var types={};D.cards.forEach(function(c){var t=c.types||'';if(typeof t==='string')t.split(',').forEach(function(x){x=x.trim();if(x)types[x]=(types[x]||0)+1;});});
  var sorted=Object.keys(types).sort(function(a,b){return types[b]-types[a];});
  var h='';sorted.forEach(function(t){
    var tc=D.cards.filter(function(c){return(c.types||'').indexOf(t)>=0;});
    h+='<div class="rec-card"><h3>'+esc(t)+' \uD0C0\uC785 \uB371 ('+tc.length+'\uC7A5)</h3><div class="card-list">';tc.forEach(function(c){h+='<span>'+esc(c.krName||c.name)+'</span>';});h+='</div></div>';
  });
  rr.innerHTML=h;
}

/* ═══ Battle ═══ */
function rBattleSel(){
  var a=document.getElementById('bt-a'),b=document.getElementById('bt-b');if(!a||!b)return;
  var h='';D.decks.forEach(function(d,i){h+='<option value="'+i+'">'+esc(d.name)+'</option>';});
  a.innerHTML=h;b.innerHTML=h;
}
function runBattle(){
  var ai=parseInt(document.getElementById('bt-a').value),bi=parseInt(document.getElementById('bt-b').value);
  var dA=D.decks[ai],dB=D.decks[bi],br=document.getElementById('bt-r');
  if(!dA||!dB||!dA.cards.length||!dB.cards.length){br.innerHTML='<p style="color:var(--text3)">\uB371\uC5D0 \uCE74\uB4DC\uAC00 \uD544\uC694\uD574\uC694!</p>';return;}
  var filterRe=/\uC5D0\uB108\uC9C0|\uBCFC|\uAD50\uCCB4|\uBC15\uC0AC|\uBCF4\uC2A4|\uB124\uBAA8|\uBA38\uB9AC\uB744|\uB9DD\uD1A0|\uC0AC\uD0D5|\uB4E4\uAC83|\uCE90\uCCB4|\uC120\uB3C4|\uD1B5\uC2E0|\uD398\uD37C|\uCE58\uB9AC|\uD578\uC12C|\uC790\uB450|\uBD09\uC120|\uC815\uAE00|\uD0D5|\uBCF8\uBD80|\uBC15\uD22C|\uBCF4\uD5D8|\uD328\uC2A4|\uBC29\uD568|\uD130\uBCF4|\uC81C\uD2B8|\uB9AC\uBC84\uC15C|\uBE5B|\uB808\uAC70\uC2DC|\uB8E8\uBBF8/;
  var tA=dA.cards.filter(function(c){return!c.n.match(filterRe);}).map(function(c){return{n:c.n,hp:120+Math.floor(Math.random()*80),atk:30+Math.floor(Math.random()*60),cur:0};});
  var tB=dB.cards.filter(function(c){return!c.n.match(filterRe);}).map(function(c){return{n:c.n,hp:120+Math.floor(Math.random()*80),atk:30+Math.floor(Math.random()*60),cur:0};});
  if(!tA.length||!tB.length){br.innerHTML='<p style="color:var(--text3)">\uD3EC\uCF13\uBAAC \uCE74\uB4DC\uAC00 \uD544\uC694\uD574\uC694!</p>';return;}
  tA.forEach(function(p){p.cur=p.hp;});tB.forEach(function(p){p.cur=p.hp;});
  var h='<div class="vs-display"><div class="vs-team"><div class="name">'+esc(dA.name)+'</div><div class="cnt2">'+tA.length+'\uB9C8\uB9AC</div></div><div class="vs-label">VS</div><div class="vs-team"><div class="name">'+esc(dB.name)+'</div><div class="cnt2">'+tB.length+'\uB9C8\uB9AC</div></div></div>';
  h+='<div class="battle-log">';var pzA=0,pzB=0;
  for(var turn=1;turn<=30&&tA.length&&tB.length;turn++){
    h+='<div class="turn">\uD134 '+turn+': ';
    var d1=tA[0].atk+Math.floor(Math.random()*20)-10;d1=Math.max(10,d1);tB[0].cur-=d1;
    h+=esc(tA[0].n)+' \u2192 '+esc(tB[0].n)+' <span class="dmg">-'+d1+'</span> (HP:'+Math.max(0,tB[0].cur)+')<br>';
    if(tB[0].cur<=0){h+='<span class="ko">\uD83D\uDCA5 '+esc(tB[0].n)+' \uAE30\uC808!</span>';tB.shift();pzA++;}
    if(!tB.length)break;
    var d2=tB[0].atk+Math.floor(Math.random()*20)-10;d2=Math.max(10,d2);tA[0].cur-=d2;
    h+=esc(tB[0].n)+' \u2192 '+esc(tA[0].n)+' <span class="dmg">-'+d2+'</span> (HP:'+Math.max(0,tA[0].cur)+')<br>';
    if(tA[0].cur<=0){h+='<span class="ko">\uD83D\uDCA5 '+esc(tA[0].n)+' \uAE30\uC808!</span>';tA.shift();pzB++;}
    h+='</div>';
  }
  var w=pzA>=6||!tB.length?dA.name:(pzB>=6||!tA.length?dB.name:'\uBB34\uC2B9\uBD80');
  h+='<div class="win">\uD83C\uDFC6 '+esc(w)+'!</div></div>';br.innerHTML=h;
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
document.getElementById('quick-q').addEventListener('input',function(){quickSearch();});
document.getElementById('quick-q').addEventListener('keydown',function(e){if(e.key==='Enter')quickSearch();});
console.log('TCG Guide v2 loaded. KR2EN:',Object.keys(KR2EN).length);
