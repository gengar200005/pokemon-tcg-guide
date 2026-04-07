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

/* ═══ KR2EN Mapping (PokéAPI 1025종 자동 생성) ═══ */
var KR2EN={};
var EN2KR={};
var KR_NAMES=[];
(function(){
  var POKE_DATA={"Bulbasaur":"이상해씨","Ivysaur":"이상해풀","Venusaur":"이상해꽃","Charmander":"파이리","Charmeleon":"리자드","Charizard":"리자몽","Squirtle":"꼬부기","Wartortle":"어니부기","Blastoise":"거북왕","Caterpie":"캐터피","Metapod":"단데기","Butterfree":"버터플","Weedle":"뿔충이","Kakuna":"딱충이","Beedrill":"독침붕","Pidgey":"구구","Pidgeotto":"피죤","Pidgeot":"피죤투","Rattata":"꼬렛","Raticate":"레트라","Spearow":"깨비참","Fearow":"깨비드릴조","Ekans":"아보","Arbok":"아보크","Pikachu":"피카츄","Raichu":"라이츄","Sandshrew":"모래두지","Sandslash":"고지","Nidoran♀":"니드런♀","Nidorina":"니드리나","Nidoqueen":"니드퀸","Nidoran♂":"니드런♂","Nidorino":"니드리노","Nidoking":"니드킹","Clefairy":"삐삐","Clefable":"픽시","Vulpix":"식스테일","Ninetales":"나인테일","Jigglypuff":"푸린","Wigglytuff":"푸크린","Zubat":"주뱃","Golbat":"골뱃","Oddish":"뚜벅쵸","Gloom":"냄새꼬","Vileplume":"라플레시아","Paras":"파라스","Parasect":"파라섹트","Venonat":"콘팡","Venomoth":"도나리","Diglett":"디그다","Dugtrio":"닥트리오","Meowth":"나옹","Persian":"페르시온","Psyduck":"고라파덕","Golduck":"골덕","Mankey":"망키","Primeape":"성원숭","Growlithe":"가디","Arcanine":"윈디","Poliwag":"발챙이","Poliwhirl":"슈륙챙이","Poliwrath":"강챙이","Abra":"캐이시","Kadabra":"윤겔라","Alakazam":"후딘","Machop":"알통몬","Machoke":"근육몬","Machamp":"괴력몬","Bellsprout":"모다피","Weepinbell":"우츠동","Victreebel":"우츠보트","Tentacool":"왕눈해","Tentacruel":"독파리","Geodude":"꼬마돌","Graveler":"데구리","Golem":"딱구리","Ponyta":"포니타","Rapidash":"날쌩마","Slowpoke":"야돈","Slowbro":"야도란","Magnemite":"코일","Magneton":"레어코일","Farfetch’d":"파오리","Doduo":"두두","Dodrio":"두트리오","Seel":"쥬쥬","Dewgong":"쥬레곤","Grimer":"질퍽이","Muk":"질뻐기","Shellder":"셀러","Cloyster":"파르셀","Gastly":"고오스","Haunter":"고우스트","Gengar":"팬텀","Onix":"롱스톤","Drowzee":"슬리프","Hypno":"슬리퍼","Krabby":"크랩","Kingler":"킹크랩","Voltorb":"찌리리공","Electrode":"붐볼","Exeggcute":"아라리","Exeggutor":"나시","Cubone":"탕구리","Marowak":"텅구리","Hitmonlee":"시라소몬","Hitmonchan":"홍수몬","Lickitung":"내루미","Koffing":"또가스","Weezing":"또도가스","Rhyhorn":"뿔카노","Rhydon":"코뿌리","Chansey":"럭키","Tangela":"덩쿠리","Kangaskhan":"캥카","Horsea":"쏘드라","Seadra":"시드라","Goldeen":"콘치","Seaking":"왕콘치","Staryu":"별가사리","Starmie":"아쿠스타","Mr. Mime":"마임맨","Scyther":"스라크","Jynx":"루주라","Electabuzz":"에레브","Magmar":"마그마","Pinsir":"쁘사이저","Tauros":"켄타로스","Magikarp":"잉어킹","Gyarados":"갸라도스","Lapras":"라프라스","Ditto":"메타몽","Eevee":"이브이","Vaporeon":"샤미드","Jolteon":"쥬피썬더","Flareon":"부스터","Porygon":"폴리곤","Omanyte":"암나이트","Omastar":"암스타","Kabuto":"투구","Kabutops":"투구푸스","Aerodactyl":"프테라","Snorlax":"잠만보","Articuno":"프리져","Zapdos":"썬더","Moltres":"파이어","Dratini":"미뇽","Dragonair":"신뇽","Dragonite":"망나뇽","Mewtwo":"뮤츠","Mew":"뮤","Chikorita":"치코리타","Bayleef":"베이리프","Meganium":"메가니움","Cyndaquil":"브케인","Quilava":"마그케인","Typhlosion":"블레이범","Totodile":"리아코","Croconaw":"엘리게이","Feraligatr":"장크로다일","Sentret":"꼬리선","Furret":"다꼬리","Hoothoot":"부우부","Noctowl":"야부엉","Ledyba":"레디바","Ledian":"레디안","Spinarak":"페이검","Ariados":"아리아도스","Crobat":"크로뱃","Chinchou":"초라기","Lanturn":"랜턴","Pichu":"피츄","Cleffa":"삐","Igglybuff":"푸푸린","Togepi":"토게피","Togetic":"토게틱","Natu":"네이티","Xatu":"네이티오","Mareep":"메리프","Flaaffy":"보송송","Ampharos":"전룡","Bellossom":"아르코","Marill":"마릴","Azumarill":"마릴리","Sudowoodo":"꼬지모","Politoed":"왕구리","Hoppip":"통통코","Skiploom":"두코","Jumpluff":"솜솜코","Aipom":"에이팜","Sunkern":"해너츠","Sunflora":"해루미","Yanma":"왕자리","Wooper":"우파","Quagsire":"누오","Espeon":"에브이","Umbreon":"블래키","Murkrow":"니로우","Slowking":"야도킹","Misdreavus":"무우마","Unown":"안농","Wobbuffet":"마자용","Girafarig":"키링키","Pineco":"피콘","Forretress":"쏘콘","Dunsparce":"노고치","Gligar":"글라이거","Steelix":"강철톤","Snubbull":"블루","Granbull":"그랑블루","Qwilfish":"침바루","Scizor":"핫삼","Shuckle":"단단지","Heracross":"헤라크로스","Sneasel":"포푸니","Teddiursa":"깜지곰","Ursaring":"링곰","Slugma":"마그마그","Magcargo":"마그카르고","Swinub":"꾸꾸리","Piloswine":"메꾸리","Corsola":"코산호","Remoraid":"총어","Octillery":"대포무노","Delibird":"딜리버드","Mantine":"만타인","Skarmory":"무장조","Houndour":"델빌","Houndoom":"헬가","Kingdra":"킹드라","Phanpy":"코코리","Donphan":"코리갑","Porygon2":"폴리곤2","Stantler":"노라키","Smeargle":"루브도","Tyrogue":"배루키","Hitmontop":"카포에라","Smoochum":"뽀뽀라","Elekid":"에레키드","Magby":"마그비","Miltank":"밀탱크","Blissey":"해피너스","Raikou":"라이코","Entei":"앤테이","Suicune":"스이쿤","Larvitar":"애버라스","Pupitar":"데기라스","Tyranitar":"마기라스","Lugia":"루기아","Ho-Oh":"칠색조","Celebi":"세레비","Treecko":"나무지기","Grovyle":"나무돌이","Sceptile":"나무킹","Torchic":"아차모","Combusken":"영치코","Blaziken":"번치코","Mudkip":"물짱이","Marshtomp":"늪짱이","Swampert":"대짱이","Poochyena":"포챠나","Mightyena":"그라에나","Zigzagoon":"지그제구리","Linoone":"직구리","Wurmple":"개무소","Silcoon":"실쿤","Beautifly":"뷰티플라이","Cascoon":"카스쿤","Dustox":"독케일","Lotad":"연꽃몬","Lombre":"로토스","Ludicolo":"로파파","Seedot":"도토링","Nuzleaf":"잎새코","Shiftry":"다탱구","Taillow":"테일로","Swellow":"스왈로","Wingull":"갈모매","Pelipper":"패리퍼","Ralts":"랄토스","Kirlia":"킬리아","Gardevoir":"가디안","Surskit":"비구술","Masquerain":"비나방","Shroomish":"버섯꼬","Breloom":"버섯모","Slakoth":"게을로","Vigoroth":"발바로","Slaking":"게을킹","Nincada":"토중몬","Ninjask":"아이스크","Shedinja":"껍질몬","Whismur":"소곤룡","Loudred":"노공룡","Exploud":"폭음룡","Makuhita":"마크탕","Hariyama":"하리뭉","Azurill":"루리리","Nosepass":"코코파스","Skitty":"에나비","Delcatty":"델케티","Sableye":"깜까미","Mawile":"입치트","Aron":"가보리","Lairon":"갱도라","Aggron":"보스로라","Meditite":"요가랑","Medicham":"요가램","Electrike":"썬더라이","Manectric":"썬더볼트","Plusle":"플러시","Minun":"마이농","Volbeat":"볼비트","Illumise":"네오비트","Roselia":"로젤리아","Gulpin":"꼴깍몬","Swalot":"꿀꺽몬","Carvanha":"샤프니아","Sharpedo":"샤크니아","Wailmer":"고래왕자","Wailord":"고래왕","Numel":"둔타","Camerupt":"폭타","Torkoal":"코터스","Spoink":"피그점프","Grumpig":"피그킹","Spinda":"얼루기","Trapinch":"톱치","Vibrava":"비브라바","Flygon":"플라이곤","Cacnea":"선인왕","Cacturne":"밤선인","Swablu":"파비코","Altaria":"파비코리","Zangoose":"쟝고","Seviper":"세비퍼","Lunatone":"루나톤","Solrock":"솔록","Barboach":"미꾸리","Whiscash":"메깅","Corphish":"가재군","Crawdaunt":"가재장군","Baltoy":"오뚝군","Claydol":"점토도리","Lileep":"릴링","Cradily":"릴리요","Anorith":"아노딥스","Armaldo":"아말도","Feebas":"빈티나","Milotic":"밀로틱","Castform":"캐스퐁","Kecleon":"켈리몬","Shuppet":"어둠대신","Banette":"다크펫","Duskull":"해골몽","Dusclops":"미라몽","Tropius":"트로피우스","Chimecho":"치렁","Absol":"앱솔","Wynaut":"마자","Snorunt":"눈꼬마","Glalie":"얼음귀신","Spheal":"대굴레오","Sealeo":"씨레오","Walrein":"씨카이저","Clamperl":"진주몽","Huntail":"헌테일","Gorebyss":"분홍장이","Relicanth":"시라칸","Luvdisc":"사랑동이","Bagon":"아공이","Shelgon":"쉘곤","Salamence":"보만다","Beldum":"메탕","Metang":"메탕구","Metagross":"메타그로스","Regirock":"레지락","Regice":"레지아이스","Registeel":"레지스틸","Latias":"라티아스","Latios":"라티오스","Kyogre":"가이오가","Groudon":"그란돈","Rayquaza":"레쿠쟈","Jirachi":"지라치","Deoxys":"테오키스","Turtwig":"모부기","Grotle":"수풀부기","Torterra":"토대부기","Chimchar":"불꽃숭이","Monferno":"파이숭이","Infernape":"초염몽","Piplup":"팽도리","Prinplup":"팽태자","Empoleon":"엠페르트","Starly":"찌르꼬","Staravia":"찌르버드","Staraptor":"찌르호크","Bidoof":"비버니","Bibarel":"비버통","Kricketot":"귀뚤뚜기","Kricketune":"귀뚤톡크","Shinx":"꼬링크","Luxio":"럭시오","Luxray":"렌트라","Budew":"꼬몽울","Roserade":"로즈레이드","Cranidos":"두개도스","Rampardos":"램펄드","Shieldon":"방패톱스","Bastiodon":"바리톱스","Burmy":"도롱충이","Wormadam":"도롱마담","Mothim":"나메일","Combee":"세꿀버리","Vespiquen":"비퀸","Pachirisu":"파치리스","Buizel":"브이젤","Floatzel":"플로젤","Cherubi":"체리버","Cherrim":"체리꼬","Shellos":"깝질무","Gastrodon":"트리토돈","Ambipom":"겟핸보숭","Drifloon":"흔들풍손","Drifblim":"둥실라이드","Buneary":"이어롤","Lopunny":"이어롭","Mismagius":"무우마직","Honchkrow":"돈크로우","Glameow":"나옹마","Purugly":"몬냥이","Chingling":"랑딸랑","Stunky":"스컹뿡","Skuntank":"스컹탱크","Bronzor":"동미러","Bronzong":"동탁군","Bonsly":"꼬지지","Mime Jr.":"흉내내","Happiny":"핑복","Chatot":"페라페","Spiritomb":"화강돌","Gible":"딥상어동","Gabite":"한바이트","Garchomp":"한카리아스","Munchlax":"먹고자","Riolu":"리오르","Lucario":"루카리오","Hippopotas":"히포포타스","Hippowdon":"하마돈","Skorupi":"스콜피","Drapion":"드래피온","Croagunk":"삐딱구리","Toxicroak":"독개굴","Carnivine":"무스틈니","Finneon":"형광어","Lumineon":"네오라이트","Mantyke":"타만타","Snover":"눈쓰개","Abomasnow":"눈설왕","Weavile":"포푸니라","Magnezone":"자포코일","Lickilicky":"내룸벨트","Rhyperior":"거대코뿌리","Tangrowth":"덩쿠림보","Electivire":"에레키블","Magmortar":"마그마번","Togekiss":"토게키스","Yanmega":"메가자리","Leafeon":"리피아","Glaceon":"글레이시아","Gliscor":"글라이온","Mamoswine":"맘모꾸리","Porygon-Z":"폴리곤Z","Gallade":"엘레이드","Probopass":"대코파스","Dusknoir":"야느와르몽","Froslass":"눈여아","Rotom":"로토무","Uxie":"유크시","Mesprit":"엠라이트","Azelf":"아그놈","Dialga":"디아루가","Palkia":"펄기아","Heatran":"히드런","Regigigas":"레지기가스","Giratina":"기라티나","Cresselia":"크레세리아","Phione":"피오네","Manaphy":"마나피","Darkrai":"다크라이","Shaymin":"쉐이미","Arceus":"아르세우스","Victini":"비크티니","Snivy":"주리비얀","Servine":"샤비","Serperior":"샤로다","Tepig":"뚜꾸리","Pignite":"차오꿀","Emboar":"염무왕","Oshawott":"수댕이","Dewott":"쌍검자비","Samurott":"대검귀","Patrat":"보르쥐","Watchog":"보르그","Lillipup":"요테리","Herdier":"하데리어","Stoutland":"바랜드","Purrloin":"쌔비냥","Liepard":"레파르다스","Pansage":"야나프","Simisage":"야나키","Pansear":"바오프","Simisear":"바오키","Panpour":"앗차프","Simipour":"앗차키","Munna":"몽나","Musharna":"몽얌나","Pidove":"콩둘기","Tranquill":"유토브","Unfezant":"켄호로우","Blitzle":"줄뮤마","Zebstrika":"제브라이카","Roggenrola":"단굴","Boldore":"암트르","Gigalith":"기가이어스","Woobat":"또르박쥐","Swoobat":"맘박쥐","Drilbur":"두더류","Excadrill":"몰드류","Audino":"다부니","Timburr":"으랏차","Gurdurr":"토쇠골","Conkeldurr":"노보청","Tympole":"동챙이","Palpitoad":"두까비","Seismitoad":"두빅굴","Throh":"던지미","Sawk":"타격귀","Sewaddle":"두르보","Swadloon":"두르쿤","Leavanny":"모아머","Venipede":"마디네","Whirlipede":"휠구","Scolipede":"펜드라","Cottonee":"소미안","Whimsicott":"엘풍","Petilil":"치릴리","Lilligant":"드레디어","Basculin":"배쓰나이","Sandile":"깜눈크","Krokorok":"악비르","Krookodile":"악비아르","Darumaka":"달막화","Darmanitan":"불비달마","Maractus":"마라카치","Dwebble":"돌살이","Crustle":"암팰리스","Scraggy":"곤율랭","Scrafty":"곤율거니","Sigilyph":"심보러","Yamask":"데스마스","Cofagrigus":"데스니칸","Tirtouga":"프로토가","Carracosta":"늑골라","Archen":"아켄","Archeops":"아케오스","Trubbish":"깨봉이","Garbodor":"더스트나","Zorua":"조로아","Zoroark":"조로아크","Minccino":"치라미","Cinccino":"치라치노","Gothita":"고디탱","Gothorita":"고디보미","Gothitelle":"고디모아젤","Solosis":"유니란","Duosion":"듀란","Reuniclus":"란쿨루스","Ducklett":"꼬지보리","Swanna":"스완나","Vanillite":"바닐프티","Vanillish":"바닐리치","Vanilluxe":"배바닐라","Deerling":"사철록","Sawsbuck":"바라철록","Emolga":"에몽가","Karrablast":"딱정곤","Escavalier":"슈바르고","Foongus":"깜놀버슬","Amoonguss":"뽀록나","Frillish":"탱그릴","Jellicent":"탱탱겔","Alomomola":"맘복치","Joltik":"파쪼옥","Galvantula":"전툴라","Ferroseed":"철시드","Ferrothorn":"너트령","Klink":"기어르","Klang":"기기어르","Klinklang":"기기기어르","Tynamo":"저리어","Eelektrik":"저리릴","Eelektross":"저리더프","Elgyem":"리그레","Beheeyem":"벰크","Litwick":"불켜미","Lampent":"램프라","Chandelure":"샹델라","Axew":"터검니","Fraxure":"액슨도","Haxorus":"액스라이즈","Cubchoo":"코고미","Beartic":"툰베어","Cryogonal":"프리지오","Shelmet":"쪼마리","Accelgor":"어지리더","Stunfisk":"메더","Mienfoo":"비조푸","Mienshao":"비조도","Druddigon":"크리만","Golett":"골비람","Golurk":"골루그","Pawniard":"자망칼","Bisharp":"절각참","Bouffalant":"버프론","Rufflet":"수리둥보","Braviary":"워글","Vullaby":"벌차이","Mandibuzz":"버랜지나","Heatmor":"앤티골","Durant":"아이앤트","Deino":"모노두","Zweilous":"디헤드","Hydreigon":"삼삼드래","Larvesta":"활화르바","Volcarona":"불카모스","Cobalion":"코바르온","Terrakion":"테라키온","Virizion":"비리디온","Tornadus":"토네로스","Thundurus":"볼트로스","Reshiram":"레시라무","Zekrom":"제크로무","Landorus":"랜드로스","Kyurem":"큐레무","Keldeo":"케르디오","Meloetta":"메로엣타","Genesect":"게노세크트","Chespin":"도치마론","Quilladin":"도치보구","Chesnaught":"브리가론","Fennekin":"푸호꼬","Braixen":"테르나","Delphox":"마폭시","Froakie":"개구마르","Frogadier":"개굴반장","Greninja":"개굴닌자","Bunnelby":"파르빗","Diggersby":"파르토","Fletchling":"화살꼬빈","Fletchinder":"불화살빈","Talonflame":"파이어로","Scatterbug":"분이벌레","Spewpa":"분떠도리","Vivillon":"비비용","Litleo":"레오꼬","Pyroar":"화염레오","Flabébé":"플라베베","Floette":"플라엣테","Florges":"플라제스","Skiddo":"메이클","Gogoat":"고고트","Pancham":"판짱","Pangoro":"부란다","Furfrou":"트리미앙","Espurr":"냐스퍼","Meowstic":"냐오닉스","Honedge":"단칼빙","Doublade":"쌍검킬","Aegislash":"킬가르도","Spritzee":"슈쁘","Aromatisse":"프레프티르","Swirlix":"나룸퍼프","Slurpuff":"나루림","Inkay":"오케이징","Malamar":"칼라마네로","Binacle":"거북손손","Barbaracle":"거북손데스","Skrelp":"수레기","Dragalge":"드래캄","Clauncher":"완철포","Clawitzer":"블로스터","Helioptile":"목도리키텔","Heliolisk":"일레도리자드","Tyrunt":"티고라스","Tyrantrum":"견고라스","Amaura":"아마루스","Aurorus":"아마루르가","Sylveon":"님피아","Hawlucha":"루차불","Dedenne":"데덴네","Carbink":"멜리시","Goomy":"미끄메라","Sliggoo":"미끄네일","Goodra":"미끄래곤","Klefki":"클레피","Phantump":"나목령","Trevenant":"대로트","Pumpkaboo":"호바귀","Gourgeist":"펌킨인","Bergmite":"꽁어름","Avalugg":"크레베이스","Noibat":"음뱃","Noivern":"음번","Xerneas":"제르네아스","Yveltal":"이벨타르","Zygarde":"지가르데","Diancie":"디안시","Hoopa":"후파","Volcanion":"볼케니온","Rowlet":"나몰빼미","Dartrix":"빼미스로우","Decidueye":"모크나이퍼","Litten":"냐오불","Torracat":"냐오히트","Incineroar":"어흥염","Popplio":"누리공","Brionne":"키요공","Primarina":"누리레느","Pikipek":"콕코구리","Trumbeak":"크라파","Toucannon":"왕큰부리","Yungoos":"영구스","Gumshoos":"형사구스","Grubbin":"턱지충이","Charjabug":"전지충이","Vikavolt":"투구뿌논","Crabrawler":"오기지게","Crabominable":"모단단게","Oricorio":"춤추새","Cutiefly":"에블리","Ribombee":"에리본","Rockruff":"암멍이","Lycanroc":"루가루암","Wishiwashi":"약어리","Mareanie":"시마사리","Toxapex":"더시마사리","Mudbray":"머드나기","Mudsdale":"만마드","Dewpider":"물거미","Araquanid":"깨비물거미","Fomantis":"짜랑랑","Lurantis":"라란티스","Morelull":"자마슈","Shiinotic":"마셰이드","Salandit":"야도뇽","Salazzle":"염뉴트","Stufful":"포곰곰","Bewear":"이븐곰","Bounsweet":"달콤아","Steenee":"달무리나","Tsareena":"달코퀸","Comfey":"큐아링","Oranguru":"하랑우탄","Passimian":"내던숭이","Wimpod":"꼬시레","Golisopod":"갑주무사","Sandygast":"모래꿍","Palossand":"모래성이당","Pyukumuku":"해무기","Type: Null":"타입:널","Silvally":"실버디","Minior":"메테노","Komala":"자말라","Turtonator":"폭거북스","Togedemaru":"토게데마루","Mimikyu":"따라큐","Bruxish":"치갈기","Drampa":"할비롱","Dhelmise":"타타륜","Jangmo-o":"짜랑꼬","Hakamo-o":"짜랑고우","Kommo-o":"짜랑고우거","Tapu Koko":"카푸꼬꼬꼭","Tapu Lele":"카푸나비나","Tapu Bulu":"카푸브루루","Tapu Fini":"카푸느지느","Cosmog":"코스모그","Cosmoem":"코스모움","Solgaleo":"솔가레오","Lunala":"루나아라","Nihilego":"텅비드","Buzzwole":"매시붕","Pheromosa":"페로코체","Xurkitree":"전수목","Celesteela":"철화구야","Kartana":"종이신도","Guzzlord":"악식킹","Necrozma":"네크로즈마","Magearna":"마기아나","Marshadow":"마샤도","Poipole":"베베놈","Naganadel":"아고용","Stakataka":"차곡차곡","Blacephalon":"두파팡","Zeraora":"제라오라","Meltan":"멜탄","Melmetal":"멜메탈","Grookey":"흥나숭","Thwackey":"채키몽","Rillaboom":"고릴타","Scorbunny":"염버니","Raboot":"래비풋","Cinderace":"에이스번","Sobble":"울머기","Drizzile":"누겔레온","Inteleon":"인텔리레온","Skwovet":"탐리스","Greedent":"요씽리스","Rookidee":"파라꼬","Corvisquire":"파크로우","Corviknight":"아머까오","Blipbug":"두루지벌레","Dottler":"레돔벌레","Orbeetle":"이올브","Nickit":"훔처우","Thievul":"폭슬라이","Gossifleur":"꼬모카","Eldegoss":"백솜모카","Wooloo":"우르","Dubwool":"배우르","Chewtle":"깨물부기","Drednaw":"갈가부기","Yamper":"멍파치","Boltund":"펄스멍","Rolycoly":"탄동","Carkol":"탄차곤","Coalossal":"석탄산","Applin":"과사삭벌레","Flapple":"애프룡","Appletun":"단지래플","Silicobra":"모래뱀","Sandaconda":"사다이사","Cramorant":"윽우지","Arrokuda":"찌로꼬치","Barraskewda":"꼬치조","Toxel":"일레즌","Toxtricity":"스트린더","Sizzlipede":"태우지네","Centiskorch":"다태우지네","Clobbopus":"때때무노","Grapploct":"케오퍼스","Sinistea":"데인차","Polteageist":"포트데스","Hatenna":"몸지브림","Hattrem":"손지브림","Hatterene":"브리무음","Impidimp":"메롱꿍","Morgrem":"쏘겨모","Grimmsnarl":"오롱털","Obstagoon":"가로막구리","Perrserker":"나이킹","Cursola":"산호르곤","Sirfetch’d":"창파나이트","Mr. Rime":"마임꽁꽁","Runerigus":"데스판","Milcery":"마빌크","Alcremie":"마휘핑","Falinks":"대여르","Pincurchin":"찌르성게","Snom":"누니머기","Frosmoth":"모스노우","Stonjourner":"돌헨진","Eiscue":"빙큐보","Indeedee":"에써르","Morpeko":"모르페코","Cufant":"끼리동","Copperajah":"대왕끼리동","Dracozolt":"파치래곤","Arctozolt":"파치르돈","Dracovish":"어래곤","Arctovish":"어치르돈","Duraludon":"두랄루돈","Dreepy":"드라꼰","Drakloak":"드래런치","Dragapult":"드래펄트","Zacian":"자시안","Zamazenta":"자마젠타","Eternatus":"무한다이노","Kubfu":"치고마","Urshifu":"우라오스","Zarude":"자루도","Regieleki":"레지에레키","Regidrago":"레지드래고","Glastrier":"블리자포스","Spectrier":"레이스포스","Calyrex":"버드렉스","Wyrdeer":"신비록","Kleavor":"사마자르","Ursaluna":"다투곰","Basculegion":"대쓰여너","Sneasler":"포푸니크","Overqwil":"장침바루","Enamorus":"러브로스","Sprigatito":"나오하","Floragato":"나로테","Meowscarada":"마스카나","Fuecoco":"뜨아거","Crocalor":"악뜨거","Skeledirge":"라우드본","Quaxly":"꾸왁스","Quaxwell":"아꾸왁","Quaquaval":"웨이니발","Lechonk":"맛보돈","Oinkologne":"퍼퓨돈","Tarountula":"타랜툴라","Spidops":"트래피더","Nymble":"콩알뚜기","Lokix":"엑스레그","Pawmi":"빠모","Pawmo":"빠모트","Pawmot":"빠르모트","Tandemaus":"두리쥐","Maushold":"파밀리쥐","Fidough":"쫀도기","Dachsbun":"바우첼","Smoliv":"미니브","Dolliv":"올리뇨","Arboliva":"올리르바","Squawkabilly":"시비꼬","Nacli":"베베솔트","Naclstack":"스태솔트","Garganacl":"콜로솔트","Charcadet":"카르본","Armarouge":"카디나르마","Ceruledge":"파라블레이즈","Tadbulb":"빈나두","Bellibolt":"찌리배리","Wattrel":"찌리비","Kilowattrel":"찌리비크","Maschiff":"오라티프","Mabosstiff":"마피티프","Shroodle":"땃쭈르","Grafaiai":"태깅구르","Bramblin":"그푸리","Brambleghast":"공푸리","Toedscool":"들눈해","Toedscruel":"육파리","Klawf":"절벼게","Capsakid":"캡싸이","Scovillain":"스코빌런","Rellor":"구르데","Rabsca":"베라카스","Flittle":"하느라기","Espathra":"클레스퍼트라","Tinkatink":"어리짱","Tinkatuff":"벼리짱","Tinkaton":"두드리짱","Wiglett":"바다그다","Wugtrio":"바닥트리오","Bombirdier":"떨구새","Finizen":"맨돌핀","Palafin":"돌핀맨","Varoom":"부르롱","Revavroom":"부르르룸","Cyclizar":"모토마","Orthworm":"꿈트렁","Glimmet":"초롱순","Glimmora":"킬라플로르","Greavard":"망망이","Houndstone":"묘두기","Flamigo":"꼬이밍고","Cetoddle":"터벅고래","Cetitan":"우락고래","Veluza":"가비루사","Dondozo":"어써러셔","Tatsugiri":"싸리용","Annihilape":"저승갓숭","Clodsire":"토오","Farigiraf":"키키링","Dudunsparce":"노고고치","Kingambit":"대도각참","Great Tusk":"위대한엄니","Scream Tail":"우렁찬꼬리","Brute Bonnet":"사나운버섯","Flutter Mane":"날개치는머리","Slither Wing":"땅을기는날개","Sandy Shocks":"모래털가죽","Iron Treads":"무쇠바퀴","Iron Bundle":"무쇠보따리","Iron Hands":"무쇠손","Iron Jugulis":"무쇠머리","Iron Moth":"무쇠독나방","Iron Thorns":"무쇠가시","Frigibax":"드니차","Arctibax":"드니꽁","Baxcalibur":"드닐레이브","Gimmighoul":"모으령","Gholdengo":"타부자고","Wo-Chien":"총지엔","Chien-Pao":"파오젠","Ting-Lu":"딩루","Chi-Yu":"위유이","Roaring Moon":"고동치는달","Iron Valiant":"무쇠무인","Koraidon":"코라이돈","Miraidon":"미라이돈","Walking Wake":"굽이치는물결","Iron Leaves":"무쇠잎새","Dipplin":"과미르","Poltchageist":"차데스","Sinistcha":"그우린차","Okidogi":"조타구","Munkidori":"이야후","Fezandipiti":"기로치","Ogerpon":"오거폰","Archaludon":"브리두라스","Hydrapple":"과미드라","Gouging Fire":"꿰뚫는화염","Raging Bolt":"날뛰는우레","Iron Boulder":"무쇠암석","Iron Crown":"무쇠감투","Terapagos":"테라파고스","Pecharunt":"복숭악동"};
  for(var en in POKE_DATA){
    if(!POKE_DATA.hasOwnProperty(en))continue;
    var kr=POKE_DATA[en];
    KR2EN[kr]=en;EN2KR[en]=kr;KR_NAMES.push(kr);
  }
  KR_NAMES.sort();
})();
/* ═══ 순수 한글명 추출 — prefix(지역폼) + suffix(ex/V/VMAX 등) 모두 제거 ═══
   포켓몬 카테고리 분류 목적이므로 "Galarian Rapidash ex" → "날쌩마"가 아니라
   맵에 없으면 영문 base("Rapidash")라도 깔끔히 반환. 카드함 표시/정렬 통일용. */
function toKrPureName(enName){
  if(!enName)return'';
  var s=String(enName).trim();
  /* 1. suffix 제거 (대소문자 무관, 여러 개 가능: "Mega Charizard EX" 등) */
  s=s.replace(/\s+(ex|EX|V|VMAX|VSTAR|VUNION|V-UNION|GX|TAG TEAM|BREAK|LV\.X|Prime|LEGEND)$/i,'').trim();
  s=s.replace(/\s+(ex|EX|V|VMAX|VSTAR|GX)$/i,'').trim(); /* 두 번 적용으로 "Pikachu V ex" 같은 케이스 대비 */
  /* 2. prefix 제거 (지역 폼) */
  s=s.replace(/^(Galarian|Alolan|Hisuian|Paldean|Mega)\s+/i,'').trim();
  /* 3. 포켓몬명 뒤 소유격/형태 표기 제거 ("Charizard's", "Origin Forme Dialga" 등 단순 케이스) */
  s=s.replace(/^(Origin Forme|Sky Forme|Therian Forme|Incarnate Forme)\s+/i,'').trim();
  /* 4. EN2KR 조회 — 아포스트로피 두 형태(ASCII ' / 유니코드 ’) 모두 시도 */
  if(EN2KR[s])return EN2KR[s];
  if(s.indexOf("'")>=0){var sU=s.replace(/'/g,'\u2019');if(EN2KR[sU])return EN2KR[sU];}
  if(s.indexOf('\u2019')>=0){var sA=s.replace(/\u2019/g,"'");if(EN2KR[sA])return EN2KR[sA];}
  return s; /* 매핑 없으면 정리된 영문이라도 반환 */
}

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
    /* Safari ITP 호환: popup 우선 시도, 실패 시 redirect 폴백 */
    auth.signInWithPopup(provider)
      .then(function(r){if(r&&r.user){currentUser=r.user;updateAuthUI();loadFromCloud();}})
      .catch(function(e){
        /* popup 차단/미지원 환경 → redirect로 폴백 */
        if(e.code==='auth/popup-blocked'||e.code==='auth/popup-closed-by-user'||e.code==='auth/operation-not-supported-in-this-environment'){
          try{auth.signInWithRedirect(provider);}catch(e2){alert('\uB85C\uADF8\uC778 \uC2E4\uD328: '+e2.message);}
        }else{
          console.error('[Auth Error]',e);
          alert('\uB85C\uADF8\uC778 \uC2E4\uD328: '+(e.message||e.code||'\uC54C \uC218 \uC5C6\uB294 \uC624\uB958'));
        }
      });
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
  auth.getRedirectResult().then(function(r){if(r&&r.user){currentUser=r.user;updateAuthUI();loadFromCloud();}}).catch(function(e){
    /* Safari ITP로 sessionStorage 파티션되어 initial state 못 찾는 경우 */
    if(e&&e.message&&e.message.indexOf('missing initial state')>=0){
      console.warn('[Auth] Redirect state lost (Safari ITP). Clearing stale state.');
      try{sessionStorage.clear();}catch(se){}
    }
  });
  function pollAuth(){if(auth.currentUser&&!currentUser){currentUser=auth.currentUser;updateAuthUI();loadFromCloud();}else if(auth.currentUser)updateAuthUI();}
  setTimeout(pollAuth,500);setTimeout(pollAuth,1500);setTimeout(pollAuth,3000);setTimeout(pollAuth,5000);setTimeout(pollAuth,8000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(pollAuth,300);});
}

/* ═══ Data ═══ */
var SK='ptcg-v3',D;
try{D=JSON.parse(localStorage.getItem(SK));}catch(e){}
if(!D||!D.cards)D={cards:[],decks:[]};
/* 로컬 dirty flag (cloud보다 새로운 변경 있는지) */
var _localDirty=false,_lastLocalSave=0;

/* ═══ 데이터 마이그레이션 (기존 카드 → 신규 스키마) ═══ */
function migrateCards(){
  var changed=false;
  for(var i=0;i<D.cards.length;i++){
    var c=D.cards[i];
    if(typeof c.quantity!=='number'){c.quantity=1;changed=true;}
    if(!c.source){c.source='manual';changed=true;}
    /* cardId 없는 기존 카드는 fallback id 부여 */
    if(!c.cardId){
      c.cardId='manual-'+((c.name||c.krName||c.id||'unknown').toLowerCase().replace(/\s+/g,'-'));
      changed=true;
    }
    /* 폴더 미설정 → "직접 추가" */
    if(!c.folder){c.folder='\uC9C1\uC811 \uCD94\uAC00';c.folderKey='manual';changed=true;}
    /* krName 정규화 — 항상 순수 한글명으로 통일 (prefix/suffix 제거)
       기존에 "고릴타 VMAX", "Galarian Rapidash" 등으로 저장된 것도 모두 재정리 */
    if(c.name){
      var _pure=toKrPureName(c.name);
      if(_pure&&c.krName!==_pure){c.krName=_pure;changed=true;}
    }
  }
  return changed;
}
if(migrateCards())try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}

function sv(){
  _localDirty=true;_lastLocalSave=Date.now();
  try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}
  if(currentUser){if(_syncTimeout)clearTimeout(_syncTimeout);_syncTimeout=setTimeout(saveToCloud,1000);}
}
function esc(s){if(typeof s!='string')return'';var o='',i,c;for(i=0;i<s.length;i++){c=s.charCodeAt(i);if(c===38)o+='&amp;';else if(c===34)o+='&quot;';else if(c===39)o+='&#39;';else if(c===60)o+='&lt;';else if(c===62)o+='&gt;';else o+=s[i];}return o;}
function saveToCloud(){
  if(!currentUser||!db)return;
  db.collection('users').doc(currentUser.uid).set({
    cards:D.cards,decks:D.decks,
    updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
    localTs:_lastLocalSave,
    displayName:currentUser.displayName||'',email:currentUser.email||''
  }).then(function(){_localDirty=false;}).catch(function(){});
}
function loadFromCloud(){
  if(!currentUser||!db)return;
  db.collection('users').doc(currentUser.uid).get().then(function(doc){
    if(doc.exists){
      var d=doc.data();
      /* 클라우드 데이터 유효한지 + 로컬에 dirty 변경 없는지 확인 */
      var cloudHasData=d.cards&&d.cards.length>0;
      if(cloudHasData&&!_localDirty){
        D.cards=d.cards;D.decks=d.decks||[];
        if(migrateCards())_localDirty=true;
        try{localStorage.setItem(SK,JSON.stringify(D));}catch(e){}
        try{rColl();}catch(e){}try{rDecks();}catch(e){}try{rRare();}catch(e){}
      }else if(D.cards.length>0&&_localDirty){
        /* 로컬에 dirty 변경 있으면 클라우드 덮어쓰기 */
        saveToCloud();
      }
    }else if(D.cards.length>0)saveToCloud();
  }).catch(function(){});
}

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
function addCard(cd){
  /* cardId 기반 매칭으로 중복 검사 */
  var existingIdx=-1;
  var newCardId=cd.cardId||('manual-'+((cd.name||cd.krName||cd.id||'').toLowerCase().replace(/\s+/g,'-')));
  /* 한글명 보장 — 없으면 EN2KR 조회 후 suffix 재조립 */
  var resolvedKr=cd.krName||'';
  if(!resolvedKr||resolvedKr===cd.name){
    resolvedKr=EN2KR[cd.name]||'';
    if(!resolvedKr&&cd.name){
      var _base=(cd.name).replace(/\s+(ex|EX|V|VMAX|VSTAR|GX|Mega|MEGA)$/,'').trim();
      var _bkr=EN2KR[_base]||'';
      if(_bkr){var _sfx=(cd.name).slice(_base.length).trim();resolvedKr=_bkr+(_sfx?' '+_sfx:'');}
    }
  }
  for(var i=0;i<D.cards.length;i++){if(D.cards[i].cardId===newCardId||D.cards[i].id===cd.id){existingIdx=i;break;}}
  if(existingIdx>=0){
    D.cards[existingIdx].quantity=(D.cards[existingIdx].quantity||1)+1;
    if(resolvedKr&&(!D.cards[existingIdx].krName||D.cards[existingIdx].krName===D.cards[existingIdx].name))D.cards[existingIdx].krName=resolvedKr;
  }else{
    D.cards.push({
      id:cd.id,cardId:newCardId,
      name:cd.name,krName:resolvedKr||cd.name,
      rarity:cd.rarity,set:cd.set,hp:cd.hp,types:cd.types,supertype:cd.supertype,image:cd.image,
      source:cd.source||'manual',
      folder:cd.folder||'\uC9C1\uC811 \uCD94\uAC00',
      folderKey:cd.folderKey||'manual',
      quantity:cd.quantity||1,
      updatedAt:Date.now()
    });
  }
  sv();closeM();try{rColl();}catch(e){}
}
function rmCard(id){D.cards=D.cards.filter(function(c){return c.id!==id;});sv();closeM();try{rColl();}catch(e){}}

/* ═══ Collection ═══ */
var _collFolderFilter='all';
var _collSort='recent'; /* recent|dex|name */
var _USD_TO_KRW=1450;

function rColl(){
  ensureCollHeader();
  var _ss=document.getElementById('coll-sort-sel');if(_ss&&_ss.value!==_collSort)_ss.value=_collSort;
  var rf=document.getElementById('cf');
  var f=rf?rf.value:'all';
  var fc=f==='all'?D.cards:f==='Ultra'?D.cards.filter(function(c){var r=(c.rarity||'').toLowerCase();return r.indexOf('ultra')>=0||r.indexOf('secret')>=0||r.indexOf('vmax')>=0||r.indexOf('vstar')>=0||r.indexOf('illustration')>=0;}):D.cards.filter(function(c){return(c.rarity||'').indexOf(f)>=0;});
  if(_collFolderFilter!=='all'){
    fc=fc.filter(function(c){return(c.folderKey||'manual')===_collFolderFilter;});
  }
  /* 정렬 — _collSort: recent(최신등록순) | dex(포켓몬 번호순) | name(가나다순) */
  (function(){
    var DEX_ORDER={};
    /* KR_NAMES는 가나다 정렬이라 포켓몬 번호 불가 — EN2KR 매핑 배열 순서 사용 */
    var _dexList=["이상해씨","이상해풀","이상해꽃","파이리","리자드","리자몽","꼬부기","어니부기","거북왕","캐터피","단데기","버터플","뿔충이","딱충이","독침붕","구구","피죤","피죤투","꼬렛","레트라","깨비참","깨비드릴조","아보","아보크","피카츄","라이츄","모래두지","고지","니드런♀","니드리나","니드퀸","니드런♂","니드리노","니드킹","삐삐","픽시","식스테일","나인테일","푸린","푸크린","주뱃","골뱃","뚜벅쵸","냄새꼬","라플레시아","파라스","파라섹트","콘팡","도나리","디그다","닥트리오","나옹","페르시온","고라파덕","골덕","망키","성원숭","가디","윈디","발챙이","슈륙챙이","강챙이","캐이시","윤겔라","후딘","알통몬","근육몬","괴력몬","모다피","우츠동","우츠보트","왕눈해","독파리","꼬마돌","데구리","딱구리","포니타","날쌩마","야돈","야도란","코일","레어코일","파오리","두두","두트리오","쥬쥬","쥬레곤","질퍽이","질뻐기","셀러","파르셀","고오스","고우스트","팬텀","롱스톤","슬리프","슬리퍼","크랩","킹크랩","찌리리공","붐볼","아라리","나시","탕구리","텅구리","시라소몬","홍수몬","내루미","또가스","또도가스","뿔카노","코뿌리","럭키","덩쿠리","캥카","쏘드라","시드라","콘치","왕콘치","별가사리","아쿠스타","마임맨","스라크","루주라","에레브","마그마","쁘사이저","켄타로스","잉어킹","갸라도스","라프라스","메타몽","이브이","샤미드","쥬피썬더","부스터","폴리곤","암나이트","암스타","투구","투구푸스","프테라","잠만보","프리져","썬더","파이어","미뇽","신뇽","망나뇽","뮤츠","뮤","치코리타","베이리프","메가니움","브케인","마그케인","블레이범","리아코","엘리게이","장크로다일","꼬리선","다꼬리","부우부","야부엉","레디바","레디안","페이검","아리아도스","크로뱃","초라기","랜턴","피츄","삐","푸푸린","토게피","토게틱","네이티","네이티오","메리프","보송송","전룡","아르코","마릴","마릴리","꼬지모","왕구리","통통코","두코","솜솜코","에이팜","해너츠","해루미","왕자리","우파","누오","에브이","블래키","니로우","야도킹","무우마","안농","마자용","키링키","피콘","쏘콘","노고치","글라이거","강철톤","블루","그랑블루","침바루","핫삼","단단지","헤라크로스","포푸니","깜지곰","링곰","마그마그","마그카르고","꾸꾸리","메꾸리","코산호","총어","대포무노","딜리버드","만타인","무장조","델빌","헬가","킹드라","코코리","코리갑","폴리곤2","노라키","루브도","배루키","카포에라","뽀뽀라","에레키드","마그비","밀탱크","해피너스","라이코","앤테이","스이쿤","애버라스","데기라스","마기라스","루기아","칠색조","세레비","나무지기","나무돌이","나무킹","아차모","영치코","번치코","물짱이","늪짱이","대짱이","포챠나","그라에나","지그제구리","직구리","개무소","실쿤","뷰티플라이","카스쿤","독케일","연꽃몬","로토스","로파파","도토링","잎새코","다탱구","테일로","스왈로","갈모매","패리퍼","랄토스","킬리아","가디안","비구술","비나방","버섯꼬","버섯모","게을로","발바로","게을킹","토중몬","아이스크","껍질몬","소곤룡","노공룡","폭음룡","마크탕","하리뭉","루리리","코코파스","에나비","델케티","깜까미","입치트","가보리","갱도라","보스로라","요가랑","요가램","썬더라이","썬더볼트","플러시","마이농","볼비트","네오비트","로젤리아","꼴깍몬","꿀꺽몬","샤프니아","샤크니아","고래왕자","고래왕","둔타","폭타","코터스","피그점프","피그킹","얼루기","톱치","비브라바","플라이곤","선인왕","밤선인","파비코","파비코리","쟝고","세비퍼","루나톤","솔록","미꾸리","메깅","가재군","가재장군","오뚝군","점토도리","릴링","릴리요","아노딥스","아말도","빈티나","밀로틱","캐스퐁","켈리몬","어둠대신","다크펫","해골몽","미라몽","트로피우스","치렁","앱솔","마자","눈꼬마","얼음귀신","대굴레오","씨레오","씨카이저","진주몽","헌테일","분홍장이","시라칸","사랑동이","아공이","쉘곤","보만다","메탕","메탕구","메타그로스","레지락","레지아이스","레지스틸","라티아스","라티오스","가이오가","그란돈","레쿠쟈","지라치","테오키스","모부기","수풀부기","토대부기","불꽃숭이","파이숭이","초염몽","팽도리","팽태자","엠페르트","찌르꼬","찌르버드","찌르호크","비버니","비버통","귀뚤뚜기","귀뚤톡크","꼬링크","럭시오","렌트라","꼬몽울","로즈레이드","두개도스","램펄드","방패톱스","바리톱스","도롱충이","도롱마담","나메일","세꿀버리","비퀸","파치리스","브이젤","플로젤","체리버","체리꼬","깝질무","트리토돈","겟핸보숭","흔들풍손","둥실라이드","이어롤","이어롭","무우마직","돈크로우","나옹마","몬냥이","랑딸랑","스컹뿡","스컹탱크","동미러","동탁군","꼬지지","흉내내","핑복","페라페","화강돌","딥상어동","한바이트","한카리아스","먹고자","리오르","루카리오","히포포타스","하마돈","스콜피","드래피온","삐딱구리","독개굴","무스틈니","형광어","네오라이트","타만타","눈쓰개","눈설왕","포푸니라","자포코일","내룸벨트","거대코뿌리","덩쿠림보","에레키블","마그마번","토게키스","메가자리","리피아","글레이시아","글라이온","맘모꾸리","폴리곤Z","엘레이드","대코파스","야느와르몽","눈여아","로토무","유크시","엠라이트","아그놈","디아루가","펄기아","히드런","레지기가스","기라티나","크레세리아","피오네","마나피","다크라이","쉐이미","아르세우스","비크티니","주리비얀","샤비","샤로다","뚜꾸리","차오꿀","염무왕","수댕이","쌍검자비","대검귀","보르쥐","보르그","요테리","하데리어","바랜드","쌔비냥","레파르다스","야나프","야나키","바오프","바오키","앗차프","앗차키","몽나","몽얌나","콩둘기","유토브","켄호로우","줄뮤마","제브라이카","단굴","암트르","기가이어스","또르박쥐","맘박쥐","두더류","몰드류","다부니","으랏차","토쇠골","노보청","동챙이","두까비","두빅굴","던지미","타격귀","두르보","두르쿤","모아머","마디네","휠구","펜드라","소미안","엘풍","치릴리","드레디어","배쓰나이","깜눈크","악비르","악비아르","달막화","불비달마","마라카치","돌살이","암팰리스","곤율랭","곤율거니","심보러","데스마스","데스니칸","프로토가","늑골라","아켄","아케오스","깨봉이","더스트나","조로아","조로아크","치라미","치라치노","고디탱","고디보미","고디모아젤","유니란","듀란","란쿨루스","꼬지보리","스완나","바닐프티","바닐리치","배바닐라","사철록","바라철록","에몽가","딱정곤","슈바르고","깜놀버슬","뽀록나","탱그릴","탱탱겔","맘복치","파쪼옥","전툴라","철시드","너트령","기어르","기기어르","기기기어르","저리어","저리릴","저리더프","리그레","벰크","불켜미","램프라","샹델라","터검니","액슨도","액스라이즈","코고미","툰베어","프리지오","쪼마리","어지리더","메더","비조푸","비조도","크리만","골비람","골루그","자망칼","절각참","버프론","수리둥보","워글","벌차이","버랜지나","앤티골","아이앤트","모노두","디헤드","삼삼드래","활화르바","불카모스","코바르온","테라키온","비리디온","토네로스","볼트로스","레시라무","제크로무","랜드로스","큐레무","케르디오","메로엣타","게노세크트","도치마론","도치보구","브리가론","푸호꼬","테르나","마폭시","개구마르","개굴반장","개굴닌자","파르빗","파르토","화살꼬빈","불화살빈","파이어로","분이벌레","분떠도리","비비용","레오꼬","화염레오","플라베베","플라엣테","플라제스","메이클","고고트","판짱","부란다","트리미앙","냐스퍼","냐오닉스","단칼빙","쌍검킬","킬가르도","슈쁘","프레프티르","나룸퍼프","나루림","오케이징","칼라마네로","거북손손","거북손데스","수레기","드래캄","완철포","블로스터","목도리키텔","일레도리자드","티고라스","견고라스","아마루스","아마루르가","님피아","루차불","데덴네","멜리시","미끄메라","미끄네일","미끄래곤","클레피","나목령","대로트","호바귀","펌킨인","꽁어름","크레베이스","음뱃","음번","제르네아스","이벨타르","지가르데","디안시","후파","볼케니온","나몰빼미","빼미스로우","모크나이퍼","냐오불","냐오히트","어흥염","누리공","키요공","누리레느","콕코구리","크라파","왕큰부리","영구스","형사구스","턱지충이","전지충이","투구뿌논","오기지게","모단단게","춤추새","에블리","에리본","암멍이","루가루암","약어리","시마사리","더시마사리","머드나기","만마드","물거미","깨비물거미","짜랑랑","라란티스","자마슈","마셰이드","야도뇽","염뉴트","포곰곰","이븐곰","달콤아","달무리나","달코퀸","큐아링","하랑우탄","내던숭이","꼬시레","갑주무사","모래꿍","모래성이당","해무기","타입:널","실버디","메테노","자말라","폭거북스","토게데마루","따라큐","치갈기","할비롱","타타륜","짜랑꼬","짜랑고우","짜랑고우거","카푸꼬꼬꼭","카푸나비나","카푸브루루","카푸느지느","코스모그","코스모움","솔가레오","루나아라","텅비드","매시붕","페로코체","전수목","철화구야","종이신도","악식킹","네크로즈마","마기아나","마샤도","베베놈","아고용","차곡차곡","두파팡","제라오라","멜탄","멜메탈","흥나숭","채키몽","고릴타","염버니","래비풋","에이스번","울머기","누겔레온","인텔리레온","탐리스","요씽리스","파라꼬","파크로우","아머까오","두루지벌레","레돔벌레","이올브","훔처우","폭슬라이","꼬모카","백솜모카","우르","배우르","깨물부기","갈가부기","멍파치","펄스멍","탄동","탄차곤","석탄산","과사삭벌레","애프룡","단지래플","모래뱀","사다이사","윽우지","찌로꼬치","꼬치조","일레즌","스트린더","태우지네","다태우지네","때때무노","케오퍼스","데인차","포트데스","몸지브림","손지브림","브리무음","메롱꿍","쏘겨모","오롱털","가로막구리","나이킹","산호르곤","창파나이트","마임꽁꽁","데스판","마빌크","마휘핑","대여르","찌르성게","누니머기","모스노우","돌헨진","빙큐보","에써르","모르페코","끼리동","대왕끼리동","파치래곤","파치르돈","어래곤","어치르돈","두랄루돈","드라꼰","드래런치","드래펄트","자시안","자마젠타","무한다이노","치고마","우라오스","자루도","레지에레키","레지드래고","블리자포스","레이스포스","버드렉스","신비록","사마자르","다투곰","대쓰여너","포푸니크","장침바루","러브로스","나오하","나로테","마스카나","뜨아거","악뜨거","라우드본","꾸왁스","아꾸왁","웨이니발","맛보돈","퍼퓨돈","타랜툴라","트래피더","콩알뚜기","엑스레그","빠모","빠모트","빠르모트","두리쥐","파밀리쥐","쫀도기","바우첼","미니브","올리뇨","올리르바","시비꼬","베베솔트","스태솔트","콜로솔트","카르본","카디나르마","파라블레이즈","빈나두","찌리배리","찌리비","찌리비크","오라티프","마피티프","땃쭈르","태깅구르","그푸리","공푸리","들눈해","육파리","절벼게","캡싸이","스코빌런","구르데","베라카스","하느라기","클레스퍼트라","어리짱","벼리짱","두드리짱","바다그다","바닥트리오","떨구새","맨돌핀","돌핀맨","부르롱","부르르룸","모토마","꿈트렁","초롱순","킬라플로르","망망이","묘두기","꼬이밍고","터벅고래","우락고래","가비루사","어써러셔","싸리용","저승갓숭","토오","키키링","노고고치","대도각참","위대한엄니","우렁찬꼬리","사나운버섯","날개치는머리","땅을기는날개","모래털가죽","무쇠바퀴","무쇠보따리","무쇠손","무쇠머리","무쇠독나방","무쇠가시","드니차","드니꽁","드닐레이브","모으령","타부자고","총지엔","파오젠","딩루","위유이","고동치는달","무쇠무인","코라이돈","미라이돈","굽이치는물결","무쇠잎새","과미르","차데스","그우린차","조타구","이야후","기로치","오거폰","브리두라스","과미드라","꿰뚫는화염","날뛰는우레","무쇠암석","무쇠감투","테라파고스","복숭악동"];
    for(var _di=0;_di<_dexList.length;_di++){DEX_ORDER[_dexList[_di]]=_di;}
    function getDexIdx(c){
      /* 마이그레이션 후엔 krName이 이미 순수형이지만, 안전을 위해 영문명에서도 한 번 더 시도 */
      var kr=c.krName||'';
      var idx=DEX_ORDER[kr];
      if(idx===undefined&&c.name){
        var pure=toKrPureName(c.name);
        idx=DEX_ORDER[pure];
      }
      if(idx===undefined){
        /* 옛 데이터: "고릴타 VMAX" 같은 형태가 남아있을 경우 suffix 제거 */
        var base=kr.replace(/\s+(ex|EX|V|VMAX|VSTAR|GX|Mega|MEGA).*$/,'').trim();
        idx=DEX_ORDER[base];
      }
      return (idx===undefined)?9999:idx;
    }
    if(_collSort==='recent'){
      fc=fc.slice().sort(function(a,b){return (b.updatedAt||0)-(a.updatedAt||0);});
    }else if(_collSort==='dex'){
      fc=fc.slice().sort(function(a,b){
        var da=getDexIdx(a),db2=getDexIdx(b);
        if(da!==db2)return da-db2;
        /* 같은 포켓몬끼리는 최신등록순 */
        return (b.updatedAt||0)-(a.updatedAt||0);
      });
    }else if(_collSort==='name'){
      fc=fc.slice().sort(function(a,b){
        var na=a.krName||(a.name?toKrPureName(a.name):'')||'';
        var nb=b.krName||(b.name?toKrPureName(b.name):'')||'';
        if(na===nb)return (b.updatedAt||0)-(a.updatedAt||0);
        return na.localeCompare(nb,'ko');
      });
    }
  })();
  var totalQty=0;D.cards.forEach(function(c){totalQty+=(c.quantity||1);});
  var filteredQty=0;fc.forEach(function(c){filteredQty+=(c.quantity||1);});
  var ccEl=document.getElementById('cc');
  if(ccEl)ccEl.textContent=filteredQty+'/'+totalQty+'\uC7A5';
  updateCollValue();
  renderFolderChips();
  if(!fc.length){
    var cg=document.getElementById('cg');if(cg)cg.innerHTML='';
    var ce=document.getElementById('ce');if(ce)ce.style.display='block';
    return;
  }
  var ce2=document.getElementById('ce');if(ce2)ce2.style.display='none';
  var h='';fc.forEach(function(c,idx){
    var qty=c.quantity||1;
    var srcBadge='';
    if(c.source==='dragon_shield')srcBadge='<span class="src-bd ds" title="Dragon Shield">\uD83D\uDCE4</span>';
    else if(c.source==='claude_scan')srcBadge='<span class="src-bd cs" title="Scan">\uD83D\uDCF8</span>';
    else srcBadge='<span class="src-bd mn" title="\uC9C1\uC811 \uCD94\uAC00">\u270B</span>';
    var qtyBadge=qty>1?'<span class="qty-bd">x'+qty+'</span>':'';
    h+='<div class="cc" data-coll-idx="'+idx+'" style="cursor:pointer">';
    if(c.image)h+='<img src="'+esc(c.image)+'" loading="lazy">';
    h+=srcBadge+qtyBadge;
    h+='<div class="n">'+esc(c.krName||c.name)+'</div><div class="m">'+esc(c.rarity||'')+'</div>';
    h+='<button class="x" onclick="event.stopPropagation();rmCard(\''+esc(c.id)+'\')">\xD7</button></div>';
  });
  var cg2=document.getElementById('cg');
  if(cg2){
    cg2.innerHTML=h;
    /* 카드 클릭 → 상세 모달 */
    window._collFiltered=fc;
    var els=cg2.querySelectorAll('.cc');
    for(var i=0;i<els.length;i++){
      els[i].addEventListener('click',(function(idx){return function(){
        showCollCardDetail(window._collFiltered[idx]);
      };})(i));
    }
  }
}

/* 카드함 카드 상세 모달 (큰 이미지 + 정보) */
function showCollCardDetail(c){
  if(!c)return;
  var mb=document.getElementById('mb'),mo=document.getElementById('mo');
  if(!mb||!mo)return;
  var qty=c.quantity||1;
  var imgUrl=c.imageHires||c.image||'';
  var srcLabel='';
  if(c.source==='dragon_shield')srcLabel='\uD83D\uDCE4 Dragon Shield';
  else if(c.source==='claude_scan')srcLabel='\uD83D\uDCF8 \uCE74\uBA54\uB77C \uC2A4\uCE94';
  else srcLabel='\u270B \uC9C1\uC811 \uCD94\uAC00';
  var h='';
  if(imgUrl)h+='<img src="'+esc(imgUrl)+'" style="width:100%;max-width:340px;display:block;margin:0 auto 12px;border-radius:8px">';
  h+='<h3 style="margin:0 0 8px;text-align:center">'+esc(c.krName||c.name||'-')+'</h3>';
  if(c.krName&&c.name&&c.krName!==c.name){
    h+='<div style="text-align:center;font-size:.78rem;color:var(--text3);margin-bottom:10px">'+esc(c.name)+'</div>';
  }
  h+='<div class="dr"><span class="dl">\uCD9C\uCC98</span><span>'+srcLabel+'</span></div>';
  if(qty>1)h+='<div class="dr"><span class="dl">\uC218\uB7C9</span><span style="color:var(--accent);font-family:var(--ft)">'+qty+'\uC7A5</span></div>';
  if(c.folder)h+='<div class="dr"><span class="dl">\uD3F4\uB354</span><span>'+esc(c.folder)+'</span></div>';
  if(c.rarity)h+='<div class="dr"><span class="dl">\uD76C\uC18C\uB3C4</span><span>'+esc(c.rarity)+'</span></div>';
  if(c.set)h+='<div class="dr"><span class="dl">\uC138\uD2B8</span><span>'+esc(c.set)+'</span></div>';
  else if(c.setName)h+='<div class="dr"><span class="dl">\uC138\uD2B8</span><span>'+esc(c.setName)+'</span></div>';
  if(c.cardNumber)h+='<div class="dr"><span class="dl">\uC138\uD2B8 \uBC88\uD638</span><span>'+esc(c.cardNumber)+'</span></div>';
  if(c.hp&&c.hp!=='-')h+='<div class="dr"><span class="dl">HP</span><span>'+esc(c.hp)+'</span></div>';
  if(c.types){
    var ty=Array.isArray(c.types)?c.types.join(', '):c.types;
    if(ty&&ty!=='-')h+='<div class="dr"><span class="dl">\uD0C0\uC785</span><span>'+esc(ty)+'</span></div>';
  }
  /* 가격 정보 (dragon_shield 카드만) */
  if(c.priceMarket||c.priceMid||c.priceBought){
    var price=parseFloat(c.priceMarket||c.priceMid||c.priceBought||0)||0;
    if(price>0){
      var krw=Math.round(price*_USD_TO_KRW*qty);
      var label=qty>1?'\uCCB4 \uAC00\uCE58 ('+qty+'\uC7A5)':'\uC2DC\uC138';
      h+='<div class="dr"><span class="dl">'+label+'</span><span style="color:var(--accent);font-family:var(--ft)">$'+(price*qty).toFixed(2)+' (\uC57D '+krw.toLocaleString('ko-KR')+'\uC6D0)</span></div>';
    }
  }
  h+='<div class="acts" style="margin-top:14px;gap:8px">';
  h+='<button class="btn btn-d" onclick="rmCardFromColl(\''+esc(c.id)+'\')" style="flex:1">\uC81C\uAC70</button>';
  h+='<button class="btn btn-g" onclick="closeM()" style="flex:1">\uB2EB\uAE30</button>';
  h+='</div>';
  mb.innerHTML=h;
  mo.className='mo show';
}

/* 카드함에서 카드 제거 (모달 닫고 rColl 호출) */
function rmCardFromColl(id){
  if(!confirm('\uC774 \uCE74\uB4DC\uB97C \uCE74\uB4DC\uD568\uC5D0\uC11C \uC81C\uAC70\uD560\uAE4C\uC694?'))return;
  D.cards=D.cards.filter(function(c){return c.id!==id;});
  sv();
  closeM();
  rColl();
}

function ensureCollHeader(){
  if(document.getElementById('coll-header-ext'))return;
  var panel=document.getElementById('p-coll');
  if(!panel)return;
  var ext=document.createElement('div');
  ext.id='coll-header-ext';
  ext.style.cssText='margin-bottom:12px';
  /* CSV import 기능은 한국판 카드 매칭 정확도 문제로 일시 비활성화됨.
     관련 코드는 모두 보존되어 있음 (handleCsvFileSelect, runCsvImport 등).
     다시 활성화하려면 아래 input/button을 주석 해제하면 됨. */
  ext.innerHTML=
    '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px">'+
      '<span id="coll-value" style="font-size:.78rem;color:var(--accent);font-family:var(--ft)"></span>'+
      '<select id="coll-sort-sel" style="font-size:.75rem;padding:3px 8px;border:1px solid var(--cb);border-radius:8px;background:var(--card);color:var(--text1);cursor:pointer;font-family:var(--ft)" onchange="_collSort=this.value;rColl()">'+
        '<option value="recent">🕐 최신 등록순</option>'+
        '<option value="dex">🔢 포켓몬 번호순</option>'+
        '<option value="name">가나다순</option>'+
      '</select>'+
    '</div>'+
    '<div id="folder-chips" style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px"></div>'+
    '<style>'+
      '.cc{position:relative}'+
      '.src-bd{position:absolute;top:4px;left:4px;background:rgba(0,0,0,.65);color:#fff;border-radius:4px;padding:1px 4px;font-size:.62rem;z-index:2}'+
      '.src-bd.ds{background:rgba(255,128,0,.85)}'+
      '.src-bd.cs{background:rgba(0,150,136,.85)}'+
      '.qty-bd{position:absolute;top:4px;right:24px;background:#3dc0ec;color:#fff;border-radius:4px;padding:1px 5px;font-size:.65rem;font-family:var(--ft);z-index:2}'+
      '.fchip{padding:4px 10px;font-size:.72rem;border-radius:14px;border:1px solid var(--cb);background:transparent;color:var(--text2);cursor:pointer;font-family:var(--ft)}'+
      '.fchip.active{background:var(--accent);color:#fff;border-color:var(--accent)}'+
    '</style>';
  panel.insertBefore(ext,panel.firstChild);
}

function renderFolderChips(){
  var el=document.getElementById('folder-chips');
  if(!el)return;
  var folderMap={};
  D.cards.forEach(function(c){
    var k=c.folderKey||'manual';
    var label=c.folder||(k==='manual'?'\uC9C1\uC811 \uCD94\uAC00':k);
    if(!folderMap[k])folderMap[k]={label:label,count:0};
    folderMap[k].count+=(c.quantity||1);
  });
  var keys=Object.keys(folderMap);
  if(keys.length<=1){el.innerHTML='';return;}
  var totalQty=0;D.cards.forEach(function(c){totalQty+=(c.quantity||1);});
  var h='<button class="fchip'+(_collFolderFilter==='all'?' active':'')+'" onclick="setFolderFilter(\'all\')">\uC804\uCCB4 ('+totalQty+')</button>';
  keys.sort().forEach(function(k){
    var f=folderMap[k];
    h+='<button class="fchip'+(_collFolderFilter===k?' active':'')+'" onclick="setFolderFilter(\''+esc(k)+'\')">'+esc(f.label)+' ('+f.count+')</button>';
  });
  el.innerHTML=h;
}
function setFolderFilter(k){_collFolderFilter=k;rColl();}

function updateCollValue(){
  var el=document.getElementById('coll-value');
  if(!el)return;
  var totalUsd=0;
  D.cards.forEach(function(c){
    var p=parseFloat(c.priceMarket||c.priceMid||c.priceBought||0)||0;
    totalUsd+=p*(c.quantity||1);
  });
  if(totalUsd<=0){el.textContent='';return;}
  var krw=Math.round(totalUsd*_USD_TO_KRW);
  el.textContent='\uCD1D $'+totalUsd.toFixed(2)+' (\uC57D '+krw.toLocaleString('ko-KR')+'\uC6D0)';
}

/* ═══════════════════════════════════════════════
   📤 CSV Import Module — Dragon Shield → 마스터 앱
   ═══════════════════════════════════════════════ */

/* 폴더명 한국어 매핑 (확장 가능: localStorage에 추가 매핑 저장) */
var FOLDER_LABEL_MAP={'gaon':'\uAC00\uC628\uC774 \uCE74\uB4DC'};
(function(){
  try{
    var extra=localStorage.getItem('folder-map-v1');
    if(extra){var p=JSON.parse(extra);for(var k in p)FOLDER_LABEL_MAP[k]=p[k];}
  }catch(e){}
})();
function getFolderLabel(key){return FOLDER_LABEL_MAP[key]||key||'\uC9C1\uC811 \uCD94\uAC00';}

/* pokemontcg.io 응답 캐시 (localStorage) */
var PTCG_CACHE_KEY='ptcgio-cache-v1';
var _ptcgCache={};
try{_ptcgCache=JSON.parse(localStorage.getItem(PTCG_CACHE_KEY)||'{}');}catch(e){_ptcgCache={};}
function savePtcgCache(){try{localStorage.setItem(PTCG_CACHE_KEY,JSON.stringify(_ptcgCache));}catch(e){}}

/* pokeapi.co 한국어 이름 캐시 */
var POKEAPI_CACHE_KEY='pokeapi-kr-cache-v1';
var _pokeapiCache={};
try{_pokeapiCache=JSON.parse(localStorage.getItem(POKEAPI_CACHE_KEY)||'{}');}catch(e){_pokeapiCache={};}
function savePokeapiCache(){try{localStorage.setItem(POKEAPI_CACHE_KEY,JSON.stringify(_pokeapiCache));}catch(e){}}

/* SHA-256 해시 (SubtleCrypto) */
function sha256Hex(str){
  if(!window.crypto||!window.crypto.subtle)return Promise.resolve('nohash-'+Date.now());
  var buf=new TextEncoder().encode(str);
  return crypto.subtle.digest('SHA-256',buf).then(function(h){
    var arr=Array.from(new Uint8Array(h));
    return arr.map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  });
}

/* CSV 파서 — Dragon Shield 포맷 전용 (RFC 4180 호환) */
function parseDragonShieldCsv(text){
  /* UTF-8 BOM 제거 */
  if(text.charCodeAt(0)===0xFEFF)text=text.substring(1);
  /* "sep=," 라인 스킵 */
  text=text.replace(/^\s*"?sep=,?"?\s*\r?\n/,'');
  var lines=text.split(/\r?\n/);
  if(lines.length<2)throw new Error('CSV \uD30C\uC77C\uC774 \uBE44\uC5B4\uC788\uC5B4\uC694');
  /* 헤더 파싱 */
  var headers=parseCsvLine(lines[0]);
  var rows=[];
  for(var i=1;i<lines.length;i++){
    if(!lines[i].trim())continue;
    var fields=parseCsvLine(lines[i]);
    var row={};
    for(var j=0;j<headers.length;j++)row[headers[j]]=(fields[j]||'').trim();
    rows.push(row);
  }
  return rows;
}

/* CSV 한 줄 파싱 (따옴표 + 쉼표 처리) */
function parseCsvLine(line){
  var out=[],cur='',inQ=false;
  for(var i=0;i<line.length;i++){
    var ch=line[i];
    if(inQ){
      if(ch==='"'){
        if(line[i+1]==='"'){cur+='"';i++;}
        else inQ=false;
      }else cur+=ch;
    }else{
      if(ch===','){out.push(cur);cur='';}
      else if(ch==='"')inQ=true;
      else cur+=ch;
    }
  }
  out.push(cur);
  return out;
}

/* Dragon Shield row → 정규화된 카드 객체 */
function normalizeCsvRow(row){
  var num=(row['Card Number']||'').split('/')[0].trim();
  var setCode=(row['Set Code']||'').trim();
  var folderKey=(row['Folder Name']||'').trim()||'manual';
  return {
    folderKey:folderKey,
    folder:getFolderLabel(folderKey),
    quantity:parseInt(row['Quantity']||'1',10)||1,
    nameEn:(row['Card Name']||'').trim(),
    setCode:setCode,
    setName:(row['Set Name']||'').trim(),
    cardNumber:num,
    cardNumberRaw:(row['Card Number']||'').trim(),
    condition:row['Condition']||'',
    printing:row['Printing']||'',
    language:row['Language']||'',
    priceBought:parseFloat(row['Price Bought']||'0')||0,
    dateBought:row['Date Bought']||'',
    priceLow:parseFloat(row['LOW']||'0')||0,
    priceMid:parseFloat(row['MID']||'0')||0,
    priceMarket:parseFloat(row['MARKET']||'0')||0,
    cardId:setCode&&num?(setCode+'-'+num):null
  };
}

/* pokemontcg.io 카드 조회 — 3단계 fallback
   1단계: set.id + number 정확 매칭 (가장 정확)
   2단계: 이름 검색 → 카드 번호로 우선순위
   3단계: 첫 번째 후보 (대부분 가장 인기있는 카드)
*/
function fetchPokemonTcgIo(setCode,cardNumber,cardName){
  /* pokemontcg.io는 number를 0 패딩 없이 저장 ("50", not "050")
     단, "012VL" 같은 알파벳 포함 번호는 패딩 제거하면 안 됨 */
  var num=cardNumber;
  if(/^\d+$/.test(num))num=String(parseInt(num,10));  /* 순수 숫자만 0 제거 */
  var key=setCode.toLowerCase()+'-'+num;
  if(_ptcgCache[key])return Promise.resolve(_ptcgCache[key]);

  /* 1단계: set.id + number 정확 매칭 */
  var q1='set.id:'+setCode.toLowerCase()+' number:'+num;
  var url1='https://api.pokemontcg.io/v2/cards?q='+encodeURIComponent(q1)+'&pageSize=1&select=id,name,images,types,hp,rarity,supertype,subtypes,set,number';
  return fetch(url1).then(function(r){return r.json();}).then(function(data){
    if(data&&data.data&&data.data.length>0){
      return finalizePtcgResult(key,data.data[0],'exact');
    }
    /* 2단계: 카드 이름으로 검색 (cardName이 있을 때만) */
    if(!cardName)return finalizePtcgFailed(key);
    var cleanName=cardName.replace(/[^A-Za-z0-9\s\-\.]/g,'').trim();
    if(!cleanName)return finalizePtcgFailed(key);
    var q2='name:"'+cleanName+'"';
    var url2='https://api.pokemontcg.io/v2/cards?q='+encodeURIComponent(q2)+'&pageSize=20&select=id,name,images,types,hp,rarity,supertype,subtypes,set,number';
    return fetch(url2).then(function(r){return r.json();}).then(function(data2){
      if(!data2||!data2.data||data2.data.length===0)return finalizePtcgFailed(key);
      var candidates=data2.data;
      /* 3단계 우선순위: 카드 번호 일치하는 것 우선 */
      var numTarget=parseInt(num,10);
      var byNumber=[];
      var others=[];
      candidates.forEach(function(c){
        var cn=parseInt(c.number||'0',10);
        if(!isNaN(numTarget)&&cn===numTarget)byNumber.push(c);
        else others.push(c);
      });
      var picked=byNumber.length>0?byNumber[0]:candidates[0];
      return finalizePtcgResult(key,picked,byNumber.length>0?'name+number':'name');
    }).catch(function(){return finalizePtcgFailed(key);});
  }).catch(function(){return finalizePtcgFailed(key);});
}

/* 검색 결과를 표준 형식으로 정규화 + 캐시 저장 */
function finalizePtcgResult(key,c,matchType){
  var result={
    id:c.id,name:c.name,
    image:(c.images&&(c.images.small||c.images.large))||'',
    imageHires:(c.images&&c.images.large)||'',
    types:c.types||[],hp:c.hp||'',rarity:c.rarity||'',
    supertype:c.supertype||'',subtypes:c.subtypes||[],
    setName:(c.set&&c.set.name)||'',
    matchType:matchType||'exact'  /* 매칭 신뢰도 표시용 */
  };
  _ptcgCache[key]=result;savePtcgCache();
  return result;
}
function finalizePtcgFailed(key){
  _ptcgCache[key]={_failed:true};savePtcgCache();
  return {_failed:true};
}

/* pokeapi.co 한국어 이름 조회 (영문 포켓몬 이름 → 한국어) */
function fetchPokemonKrName(englishName){
  /* 1. 내장 EN2KR 먼저 (가장 빠름) */
  if(EN2KR[englishName])return Promise.resolve(EN2KR[englishName]);
  /* 2. 캐시 */
  var key=englishName.toLowerCase();
  if(_pokeapiCache[key]!==undefined)return Promise.resolve(_pokeapiCache[key]||null);
  /* 3. 접미사 분리: "Charizard ex" → "Charizard" */
  var base=englishName.replace(/\s*(ex|EX|V|VMAX|VSTAR|GX|Mega|MEGA|LV\.?\s?X)$/,'').trim();
  if(EN2KR[base])return Promise.resolve(EN2KR[base]);
  /* 4. pokeapi 조회 (소문자, 스페이스→하이픈) */
  var slug=base.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  if(!slug){_pokeapiCache[key]=null;savePokeapiCache();return Promise.resolve(null);}
  return fetch('https://pokeapi.co/api/v2/pokemon-species/'+slug).then(function(r){
    if(!r.ok)throw new Error('not found');
    return r.json();
  }).then(function(data){
    var krName=null;
    if(data.names){
      for(var i=0;i<data.names.length;i++){
        if(data.names[i].language&&data.names[i].language.name==='ko'){krName=data.names[i].name;break;}
      }
    }
    _pokeapiCache[key]=krName||null;savePokeapiCache();
    return krName;
  }).catch(function(){_pokeapiCache[key]=null;savePokeapiCache();return null;});
}

/* CSV 파일 선택 → import 워크플로우 시작 */
function handleCsvFileSelect(input){
  var f=input.files&&input.files[0];
  if(!f)return;
  var reader=new FileReader();
  reader.onload=function(e){
    var text=e.target.result;
    /* 파일 선택 input 리셋 (같은 파일 재선택 가능) */
    input.value='';
    startCsvImport(text,f.name);
  };
  reader.onerror=function(){alert('\uD30C\uC77C \uC77D\uAE30 \uC2E4\uD328');input.value='';};
  reader.readAsText(f,'UTF-8');
}

/* Import 메인 워크플로우 */
function startCsvImport(text,fileName){
  var rows;
  try{rows=parseDragonShieldCsv(text);}
  catch(e){alert('CSV \uD30C\uC2F1 \uC2E4\uD328: '+e.message);return;}
  if(!rows.length){alert('CSV\uC5D0 \uCE74\uB4DC\uAC00 \uC5C6\uC5B4\uC694');return;}

  /* 파일 해시 + 중복 import 감지 */
  sha256Hex(text).then(function(hash){
    /* Firestore imports 컬렉션에서 동일 해시 확인 */
    checkPriorImport(hash).then(function(prior){
      var proceed=true;
      if(prior){
        proceed=confirm('\u26A0\uFE0F \uC774 \uD30C\uC77C\uC740 \uC774\uBBF8 '+formatRelativeTime(prior.importedAt)+'\uC5D0 \uAC00\uC838\uC654\uC5B4\uC694.\n('+(prior.fileName||'')+', '+(prior.cardCount||0)+'\uC7A5)\n\n\uB2E4\uC2DC \uAC00\uC838\uC62C\uAE4C\uC694? (\uC218\uB7C9\uC740 \uB36E\uC5B4\uC4F0\uAE30 \uB429\uB2C8\uB2E4)');
      }
      if(!proceed)return;
      runCsvImport(rows,hash,fileName);
    });
  });
}

/* Firestore imports 컬렉션에서 동일 해시 import 검색 */
function checkPriorImport(hash){
  if(!currentUser||!db)return Promise.resolve(null);
  return db.collection('users').doc(currentUser.uid).collection('imports').doc(hash).get()
    .then(function(doc){return doc.exists?doc.data():null;})
    .catch(function(){return null;});
}

/* 진행 모달 표시 */
function showImportProgress(msg,pct){
  var mb=document.getElementById('mb'),mo=document.getElementById('mo');
  if(!mb||!mo)return;
  var bar=pct!=null?'<div style="background:var(--cb);border-radius:8px;height:8px;overflow:hidden;margin-top:10px"><div style="background:var(--accent);height:100%;width:'+pct+'%;transition:width .2s"></div></div>':'';
  mb.innerHTML='<h3 style="margin:0 0 10px">\uD83D\uDCE4 Dragon Shield \uAC00\uC838\uC624\uAE30</h3><p style="font-size:.85rem;color:var(--text2)">'+esc(msg)+'</p>'+bar;
  mo.className='mo show';
}

/* 실제 import 실행 */
function runCsvImport(rows,fileHash,fileName){
  showImportProgress('CSV \uD30C\uC2F1 \uC644\uB8CC. '+rows.length+'\uC7A5 \uCC98\uB9AC \uC2DC\uC791...',5);
  var normalized=rows.map(normalizeCsvRow);

  /* 1. 기존 카드 인덱싱 (cardId 기준) */
  var existingByCardId={};
  D.cards.forEach(function(c,idx){
    if(c.cardId)existingByCardId[c.cardId]=idx;
  });

  var results={added:[],updated:[],untouched:[],failed:[]};
  var i=0;

  function processNext(){
    if(i>=normalized.length){
      /* 완료 */
      finishCsvImport(results,fileHash,fileName,normalized.length);
      return;
    }
    var csvCard=normalized[i];
    var pct=Math.round(((i+1)/normalized.length)*90)+5;
    showImportProgress((i+1)+'/'+normalized.length+' \uCC98\uB9AC \uC911... ('+esc(csvCard.nameEn)+')',pct);

    if(!csvCard.cardId){
      results.failed.push({name:csvCard.nameEn,reason:'\uC138\uD2B8/\uBC88\uD638 \uC5C6\uC74C'});
      i++;processNext();return;
    }

    var existIdx=existingByCardId[csvCard.cardId];
    if(existIdx!==undefined){
      /* 이미 있음 → 수량 덮어쓰기 */
      var ec=D.cards[existIdx];
      var oldQty=ec.quantity||1;
      var newQty=csvCard.quantity;
      /* 가격/source/folder 업데이트 */
      ec.quantity=newQty;
      ec.priceMarket=csvCard.priceMarket;
      ec.priceLow=csvCard.priceLow;
      ec.priceMid=csvCard.priceMid;
      ec.priceBought=csvCard.priceBought;
      ec.dateBought=csvCard.dateBought;
      ec.folder=csvCard.folder;
      ec.folderKey=csvCard.folderKey;
      ec.source='dragon_shield';
      ec.csvFileHash=fileHash;
      ec.updatedAt=Date.now();
      if(oldQty!==newQty){
        results.updated.push({name:ec.krName||ec.name,oldQty:oldQty,newQty:newQty});
      }else{
        results.untouched.push(csvCard.cardId);
      }
      i++;setTimeout(processNext,5);
    }else{
      /* 신규 카드 → pokemontcg.io 조회 */
      fetchPokemonTcgIo(csvCard.setCode,csvCard.cardNumber,csvCard.nameEn).then(function(meta){
        if(meta&&!meta._failed){
          /* 한국어 이름 조회 (포켓몬만) */
          var enrichKr=meta.supertype==='Pok\u00e9mon'?fetchPokemonKrName(csvCard.nameEn):Promise.resolve(null);
          enrichKr.then(function(krName){
            var newCard={
              id:meta.id,
              cardId:csvCard.cardId,
              name:meta.name||csvCard.nameEn,
              krName:krName||null,
              rarity:meta.rarity||'',
              set:meta.setName||csvCard.setName,
              hp:meta.hp||'',
              types:meta.types||[],
              supertype:meta.supertype||'',
              image:meta.image||'',
              imageHires:meta.imageHires||'',
              source:'dragon_shield',
              folder:csvCard.folder,
              folderKey:csvCard.folderKey,
              quantity:csvCard.quantity,
              setCode:csvCard.setCode,
              setName:csvCard.setName,
              cardNumber:csvCard.cardNumber,
              priceLow:csvCard.priceLow,
              priceMid:csvCard.priceMid,
              priceMarket:csvCard.priceMarket,
              priceBought:csvCard.priceBought,
              dateBought:csvCard.dateBought,
              importedAt:Date.now(),
              updatedAt:Date.now(),
              csvFileHash:fileHash
            };
            D.cards.push(newCard);
            existingByCardId[csvCard.cardId]=D.cards.length-1;
            results.added.push({name:krName||csvCard.nameEn,cardId:csvCard.cardId});
            i++;setTimeout(processNext,30); /* API rate limit 완화 */
          });
        }else{
          /* 조회 실패 → 기본 정보만 저장 */
          var fallback={
            id:'csv-'+csvCard.cardId,
            cardId:csvCard.cardId,
            name:csvCard.nameEn,
            krName:null,
            rarity:'',set:csvCard.setName,hp:'',types:[],supertype:'',image:'',
            source:'dragon_shield',
            folder:csvCard.folder,folderKey:csvCard.folderKey,
            quantity:csvCard.quantity,
            setCode:csvCard.setCode,setName:csvCard.setName,cardNumber:csvCard.cardNumber,
            priceLow:csvCard.priceLow,priceMid:csvCard.priceMid,priceMarket:csvCard.priceMarket,
            priceBought:csvCard.priceBought,dateBought:csvCard.dateBought,
            importedAt:Date.now(),updatedAt:Date.now(),csvFileHash:fileHash,
            _lookupFailed:true
          };
          D.cards.push(fallback);
          existingByCardId[csvCard.cardId]=D.cards.length-1;
          results.added.push({name:csvCard.nameEn,cardId:csvCard.cardId,failed:true});
          results.failed.push({name:csvCard.nameEn,reason:'pokemontcg.io \uC870\uD68C \uC2E4\uD328'});
          i++;setTimeout(processNext,30);
        }
      });
    }
  }
  processNext();
}

/* Import 완료 처리 */
function finishCsvImport(results,fileHash,fileName,total){
  /* 저장 */
  sv();
  /* Firestore imports 컬렉션 기록 */
  if(currentUser&&db){
    db.collection('users').doc(currentUser.uid).collection('imports').doc(fileHash).set({
      fileHash:fileHash,
      fileName:fileName||'unknown.csv',
      importedAt:firebase.firestore.FieldValue.serverTimestamp(),
      cardCount:total,
      added:results.added.length,
      updated:results.updated.length,
      untouched:results.untouched.length,
      failed:results.failed.length
    }).catch(function(){});
  }
  /* 결과 모달 */
  var totalUsd=0;
  D.cards.forEach(function(c){
    var p=parseFloat(c.priceMarket||c.priceMid||c.priceBought||0)||0;
    totalUsd+=p*(c.quantity||1);
  });
  var krw=Math.round(totalUsd*_USD_TO_KRW);

  var mb=document.getElementById('mb');
  if(mb){
    var h='<h3 style="margin:0 0 12px">\uD83D\uDCE4 \uAC00\uC838\uC624\uAE30 \uC644\uB8CC</h3>';
    h+='<div style="font-size:.88rem;line-height:1.8">';
    h+='<div>\u2705 \uC0C8\uB85C \uCD94\uAC00: <strong>'+results.added.length+'\uC7A5</strong></div>';
    h+='<div>\uD83D\uDD04 \uC218\uB7C9 \uC5C5\uB370\uC774\uD2B8: <strong>'+results.updated.length+'\uC7A5</strong></div>';
    if(results.updated.length>0&&results.updated.length<=10){
      h+='<div style="margin-left:18px;font-size:.78rem;color:var(--text2)">';
      results.updated.forEach(function(u){
        h+='&nbsp;\u00B7 '+esc(u.name)+': '+u.oldQty+'\uC7A5 \u2192 '+u.newQty+'\uC7A5<br>';
      });
      h+='</div>';
    }
    h+='<div>\uD83D\uDCCC \uADF8\uB300\uB85C: <strong>'+results.untouched.length+'\uC7A5</strong></div>';
    if(results.failed.length>0){
      h+='<div>\u26A0\uFE0F \uC870\uD68C \uC2E4\uD328: <strong>'+results.failed.length+'\uC7A5</strong> <span style="font-size:.7rem;color:var(--text3)">(\uAE30\uBCF8 \uC815\uBCF4\uB85C \uC800\uC7A5\uB428)</span></div>';
    }
    h+='</div>';
    h+='<div style="margin-top:14px;padding:10px;background:rgba(61,192,236,.08);border-radius:10px;font-family:var(--ft);font-size:.92rem;color:var(--accent)">';
    h+='\uD83D\uDCB0 \uCD1D \uCEEC\uB809\uC158 \uAC00\uCE58: $'+totalUsd.toFixed(2)+' (\uC57D '+krw.toLocaleString('ko-KR')+'\uC6D0)';
    h+='</div>';
    h+='<div class="acts" style="margin-top:14px"><button class="btn btn-p" onclick="closeM();rColl();">\uD655\uC778</button></div>';
    mb.innerHTML=h;
  }
  toast('\uAC00\uC838\uC624\uAE30 \uC644\uB8CC: \u2795'+results.added.length+' / \uD83D\uDD04'+results.updated.length,'#3dc0ec');
}

/* 상대 시간 표시 */
function formatRelativeTime(ts){
  if(!ts)return '\uC774\uC804';
  var d=ts.toDate?ts.toDate():new Date(ts);
  var diff=Date.now()-d.getTime();
  var min=Math.floor(diff/60000);
  if(min<1)return '\uBC29\uAE08 \uC804';
  if(min<60)return min+'\uBD84 \uC804';
  var hr=Math.floor(min/60);
  if(hr<24)return hr+'\uC2DC\uAC04 \uC804';
  var day=Math.floor(hr/24);
  if(day<30)return day+'\uC77C \uC804';
  return d.toLocaleDateString('ko-KR');
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

/* ═══════════════════════════════════════════════
   📸 Scan Module — Dragon Shield Style
   Claude Haiku Vision API → pokemontcg.io
   ═══════════════════════════════════════════════ */
var WORKER_URL='https://pokemon-tcg-proxy.sieun8475.workers.dev'; /* Cloudflare Worker 프록시 (API 키는 서버에 보관) */
/* Claude 비전 모델 (단일) */
var CLAUDE_MODELS=[
  {id:'claude-haiku-4-5',label:'Claude Haiku 4.5',desc:'\u26A1 \uBE60\uB984 \xB7 \uACE0\uC815\uD655 \xB7 \uC9C0\uC5ED \uC81C\uD55C \uC5C6\uC74C'}
];
/* 호환을 위해 GEMINI_MODELS alias 유지 (다른 함수에서 참조 가능성) */
var GEMINI_MODELS=CLAUDE_MODELS;
var _scanModel=(function(){
  try{
    var saved=localStorage.getItem('ptcg-scan-model');
    if(saved){
      for(var i=0;i<CLAUDE_MODELS.length;i++){
        if(CLAUDE_MODELS[i].id===saved)return saved;
      }
      try{localStorage.removeItem('ptcg-scan-model');}catch(e){}
    }
    return CLAUDE_MODELS[0].id;
  }catch(e){return CLAUDE_MODELS[0].id;}
})();
var _scanStream=null,_scanFacing='environment',_scanCount=0,_scanCandidates=[],_scanSelectedIdx=-1,_scanShotDataUrl='';

function setScanModel(m){_scanModel=m;try{localStorage.setItem('ptcg-scan-model',m);}catch(e){}renderModelPicker();}

function renderModelPicker(){
  var el=document.getElementById('scanModelBadge');if(!el)return;
  var cur=null;for(var i=0;i<GEMINI_MODELS.length;i++){if(GEMINI_MODELS[i].id===_scanModel){cur=GEMINI_MODELS[i];break;}}
  el.textContent='🤖 '+(cur?cur.label:_scanModel);
}

function toggleModelMenu(){
  var menu=document.getElementById('scanModelMenu');
  if(menu.style.display==='block'){menu.style.display='none';return;}
  var h='';
  GEMINI_MODELS.forEach(function(m){
    var sel=(m.id===_scanModel);
    h+='<div class="mm-item'+(sel?' sel':'')+'" onclick="setScanModel(\''+m.id+'\');toggleModelMenu()">';
    h+='<div class="mm-l">'+esc(m.label)+(sel?' ✓':'')+'</div>';
    h+='<div class="mm-d">'+esc(m.desc)+'</div>';
    h+='</div>';
  });
  menu.innerHTML=h;menu.style.display='block';
}

function startScan(){
  if(!currentUser){toast('☁️ 먼저 Google 로그인이 필요해요!','#e74c3c');return;}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('이 브라우저는 카메라를 지원하지 않아요','#e74c3c');return;}
  document.getElementById('scanFs').classList.add('on');
  _scanCount=0;updateScanCount();
  renderModelPicker();
  openCamera();
}

function openCamera(){
  if(_scanStream){_scanStream.getTracks().forEach(function(t){t.stop();});_scanStream=null;}
  var constraints={video:{facingMode:{ideal:_scanFacing},width:{ideal:1920},height:{ideal:1080}},audio:false};
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
    _scanStream=stream;
    var v=document.getElementById('scanVideo');
    v.srcObject=stream;
    v.play().catch(function(){});
  }).catch(function(e){
    /* Fallback: 후면 카메라 없으면 전면으로 재시도 */
    if(_scanFacing==='environment'){
      _scanFacing='user';
      navigator.mediaDevices.getUserMedia({video:true,audio:false}).then(function(s){
        _scanStream=s;document.getElementById('scanVideo').srcObject=s;
      }).catch(function(e2){
        toast('카메라 접근 실패: '+(e2.message||e2.name||''),'#e74c3c');stopScan();
      });
    }else{
      toast('카메라 접근 실패: '+(e.message||e.name||''),'#e74c3c');stopScan();
    }
  });
}

function flipCamera(){
  _scanFacing=(_scanFacing==='environment')?'user':'environment';
  openCamera();
}

function stopScan(){
  if(_scanStream){_scanStream.getTracks().forEach(function(t){t.stop();});_scanStream=null;}
  document.getElementById('scanFs').classList.remove('on');
  document.getElementById('scanResult').classList.remove('on');
  document.getElementById('scanResultActions').style.display='none';
  _scanCandidates=[];_scanSelectedIdx=-1;_scanShotDataUrl='';
  if(_scanCount>0)try{rColl();}catch(e){}
}

function captureCard(){
  var v=document.getElementById('scanVideo');
  if(!v.videoWidth){toast('카메라가 준비중이에요','#f39c12');return;}
  var btn=document.getElementById('scanShutter');btn.disabled=true;

  /* 화면상 프레임 위치 계산 → 비디오 좌표로 변환 */
  var frame=document.querySelector('#scanFs .scan-frame');
  var wrap=document.querySelector('#scanFs .scan-video-wrap');
  var fr=frame.getBoundingClientRect(),wr=wrap.getBoundingClientRect();
  /* object-fit:cover 계산 */
  var vW=v.videoWidth,vH=v.videoHeight,dW=wr.width,dH=wr.height;
  var scale=Math.max(dW/vW,dH/vH);
  var sW=vW*scale,sH=vH*scale;
  var offX=(dW-sW)/2,offY=(dH-sH)/2;
  /* frame(screen) → video(px) */
  var cx=(fr.left-wr.left-offX)/scale;
  var cy=(fr.top-wr.top-offY)/scale;
  var cw=fr.width/scale,ch=fr.height/scale;
  /* 경계 보정 */
  cx=Math.max(0,Math.min(vW,cx));cy=Math.max(0,Math.min(vH,cy));
  cw=Math.max(10,Math.min(vW-cx,cw));ch=Math.max(10,Math.min(vH-cy,ch));

  var canvas=document.getElementById('scanCanvas');
  /* 이미지 크기 최적화: OCR 최적 해상도 확보 
     - 최소 720px 너비 보장 (작으면 업스케일)
     - 최대 1280px 제한 (크면 다운사이즈, 토큰 절약) */
  var targetW=Math.round(cw),targetH=Math.round(ch);
  var MIN_W=720,MAX_W=1280;
  if(targetW<MIN_W){
    var upScale=MIN_W/targetW;
    targetW=MIN_W;targetH=Math.round(ch*upScale);
  }else if(targetW>MAX_W){
    var downScale=MAX_W/targetW;
    targetW=MAX_W;targetH=Math.round(ch*downScale);
  }
  canvas.width=targetW;canvas.height=targetH;
  var ctx=canvas.getContext('2d');
  /* 고품질 보간 */
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.drawImage(v,cx,cy,cw,ch,0,0,targetW,targetH);
  /* JPEG 품질 0.92 — OCR에 충분하면서 파일 크기 합리적 */
  var dataUrl=canvas.toDataURL('image/jpeg',0.92);
  _scanShotDataUrl=dataUrl;

  /* 결과 패널 오픈 + 로딩 */
  showScanResultLoading(dataUrl,'Gemini AI가 카드를 분석중...');

  /* Gemini Vision 호출 */
  recognizeCard(dataUrl).then(function(info){
    return searchPokemonTcgIo(info);
  }).then(function(results){
    _scanCandidates=results;_scanSelectedIdx=0;
    renderScanCandidates();
  }).catch(function(err){
    showScanResultError(err.message||String(err));
  }).then(function(){btn.disabled=false;});
}

function showScanResultLoading(shotUrl,msg){
  var rb=document.getElementById('scanResultBody');
  rb.innerHTML='<img class="sr-shot" src="'+shotUrl+'"><div class="scan-status"><div class="spinner"></div><p>'+esc(msg)+'</p></div>';
  document.getElementById('scanResult').classList.add('on');
  document.getElementById('scanResultActions').style.display='none';
}

function showScanResultError(msg){
  var rb=document.getElementById('scanResultBody');
  var isQuota=msg.indexOf('429')>=0||msg.indexOf('쿼터')>=0;
  var h='<img class="sr-shot" src="'+_scanShotDataUrl+'">';
  /* 에러 전문 표시 - 스크롤 가능, 복사 가능 */
  h+='<div style="background:rgba(255,100,100,.1);border:1px solid rgba(255,100,100,.3);border-radius:8px;padding:12px;margin:0 0 12px;max-height:220px;overflow-y:auto">';
  h+='<div style="font-size:.82rem;color:#ff9a9a;font-family:var(--ft);margin-bottom:6px">⚠️ 오류 발생</div>';
  h+='<div style="color:#ffcccc;font-size:.75rem;line-height:1.5;word-break:break-word;white-space:pre-wrap;user-select:text;-webkit-user-select:text">'+esc(msg)+'</div>';
  h+='</div>';
  /* 디버그 정보 복사 버튼 */
  h+='<div style="display:flex;gap:6px;margin-bottom:12px">';
  h+='<button class="btn btn-s btn-g" style="flex:1;background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.2)" onclick="copyDebugInfo()">📋 디버그 정보 복사</button>';
  h+='<button class="btn btn-s btn-g" style="flex:1;background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.2)" onclick="showFullDebug()">🔍 전체 응답 보기</button>';
  h+='</div>';
  if(isQuota){
    h+='<div><div style="font-size:.78rem;color:rgba(255,255,255,.7);margin-bottom:8px">🔄 다른 모델로 전환:</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:6px">';
    GEMINI_MODELS.forEach(function(m){
      var sel=(m.id===_scanModel);
      h+='<button class="rbtn'+(sel?' active':'')+'" style="background:'+(sel?'var(--accent)':'rgba(255,255,255,.08)')+';color:#fff;border-color:rgba(255,255,255,.2)" onclick="setScanModel(\''+m.id+'\');retakeScan()">'+esc(m.label)+'</button>';
    });
    h+='</div></div>';
  }
  rb.innerHTML=h;
}

function copyDebugInfo(){
  var info=window._lastClaudeError||window._lastGeminiError||{note:'\uB514\uBC84\uADF8 \uC815\uBCF4 \uC5C6\uC74C'};
  var keyDiag=window._keyDiagnostic||{note:'\uD0A4 \uC9C4\uB2E8 \uC5C6\uC74C'};
  var text='=== Claude \uB514\uBC84\uADF8 \uC815\uBCF4 ===\n'+
    'Status: '+(info.status||'?')+'\n'+
    'Model: '+(info.model||'?')+'\n'+
    'URL: '+(info.url||'?')+'\n'+
    'Error Message: '+(info.errorMessage||'?')+'\n'+
    '--- Raw Body ---\n'+(info.rawBody||JSON.stringify(info.rawData||info,null,2))+'\n'+
    '--- Key Diagnostic ---\n'+JSON.stringify(keyDiag,null,2)+'\n'+
    '--- Browser ---\n'+
    'UA: '+navigator.userAgent+'\n'+
    'Location: '+location.href;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){toast('\u2705 \uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uB428','#27ae60');}).catch(function(){fallbackCopy(text);});
  }else fallbackCopy(text);
}

function fallbackCopy(text){
  var ta=document.createElement('textarea');
  ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');toast('\u2705 \uBCF5\uC0AC\uB428','#27ae60');}
  catch(e){toast('\uBCF5\uC0AC \uC2E4\uD328 - \uC218\uB3D9 \uD655\uC778\uD558\uC138\uC694','#e74c3c');}
  ta.remove();
}

function showFullDebug(){
  var info=window._lastClaudeError||window._lastGeminiError||{note:'\uB514\uBC84\uADF8 \uC815\uBCF4 \uC5C6\uC74C'};
  var rb=document.getElementById('scanResultBody');
  var h='<img class="sr-shot" src="'+_scanShotDataUrl+'">';
  h+='<div style="background:#1a1a1a;border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:12px;margin-bottom:12px;max-height:400px;overflow-y:auto">';
  h+='<div style="color:#ffcb05;font-size:.78rem;font-family:var(--ft);margin-bottom:8px">\uD83D\uDD0D \uC804\uCCB4 \uB514\uBC84\uADF8 \uC815\uBCF4</div>';
  h+='<pre style="color:#ccc;font-size:.68rem;line-height:1.4;white-space:pre-wrap;word-break:break-all;font-family:monospace;margin:0;user-select:text;-webkit-user-select:text">'+esc(JSON.stringify(info,null,2))+'</pre>';
  h+='</div>';
  h+='<button class="btn btn-s btn-p" style="width:100%;margin-bottom:8px" onclick="copyDebugInfo()">\uD83D\uDCCB \uC774 \uC815\uBCF4 \uBCF5\uC0AC\uD558\uAE30</button>';
  h+='<button class="btn btn-s btn-g" style="width:100%;background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.2)" onclick="retakeScan()">\u2190 \uB3CC\uC544\uAC00\uAE30</button>';
  rb.innerHTML=h;
}

function recognizeCard(dataUrl){
  var b64=dataUrl.split(',')[1];
  /* Anthropic Messages API 포맷 — 강화된 프롬프트 (HP + 첫 기술 데미지 추가)
     세션 2: 한국판 카드 매칭 정확도 95%+ 목표.
     name 외 hp/damage가 매칭 단계에서 결정적 필터로 작동. */
  var prompt='You are identifying a Pokemon TCG card. The card may be in Korean (한국어), Japanese, or English.\n\n'+
    'Return ONLY valid JSON (no markdown, no code fences, no explanation):\n'+
    '{"candidates":[{"name":"...","hp":123,"damage":30,"set":"...","number":"...","confidence":"high|medium|low"}]}\n\n'+
    'Field rules:\n'+
    '- name: ALWAYS English Pokemon name (e.g. "Charizard", NOT "리자몽" or "リザードン"). Translate from Korean/Japanese if needed.\n'+
    '- name suffix: include variant suffix exactly as shown — "ex", "EX", "V", "VMAX", "VSTAR", "GX", "Mega". E.g. "Charizard ex", "Pikachu V", "Rillaboom VMAX".\n'+
    '- name prefix: KEEP regional prefix if present — "Galarian", "Alolan", "Hisuian", "Paldean". E.g. "Galarian Rapidash". (Our matcher will normalize this; you just report what you see.)\n'+
    '- hp: integer from the "HP" number top-right (e.g. 100, 220, 330). null if not visible.\n'+
    '- damage: integer from the FIRST attack\'s damage number (right side of attack row). For "30+" or "30×" return 30. null if no attack or no damage shown.\n'+
    '- set: set name or symbol code as visible (often bottom-left). Empty string if unclear.\n'+
    '- number: collector number like "022/060" or "022". Empty string if unclear.\n'+
    '- confidence: "high" only if name AND hp are both clearly visible. "medium" if name clear but hp unsure. "low" otherwise.\n\n'+
    'Output: up to 3 candidates, most likely first. If completely unreadable, return {"candidates":[]}.\n\n'+
    'Example for a Korean Galarian Rapidash card showing "가라르 날쌩마", "HP 100", attack "사이코키네시스 30+":\n'+
    '{"candidates":[{"name":"Galarian Rapidash","hp":100,"damage":30,"set":"s1H","number":"022/060","confidence":"high"}]}';
  var body={
    model:_scanModel,
    max_tokens:512,
    messages:[{
      role:'user',
      content:[
        {type:'image',source:{type:'base64',media_type:'image/jpeg',data:b64}},
        {type:'text',text:prompt}
      ]
    }]
  };
  return callClaudeWithRetry(body);
}

function callClaudeWithRetry(body,retry){
  if(!retry)retry=0;
  var MAX_RETRY=2;
  var model=body.model||_scanModel;
  var url=WORKER_URL;
  /* 로딩 메시지 + 경과 시간 카운터 */
  var startT=Date.now();
  var timer=setInterval(function(){
    var el=document.querySelector('#scanResultBody .scan-status p');
    if(!el){clearInterval(timer);return;}
    var sec=((Date.now()-startT)/1000).toFixed(1);
    var suffix=retry>0?' (\uC7AC\uC2DC\uB3C4 '+retry+'/'+MAX_RETRY+')':'';
    el.textContent='Claude Haiku \uBD84\uC11D\uC911... ('+sec+'\uCD08)'+suffix;
  },100);
  var statusEl=document.querySelector('#scanResultBody .scan-status p');
  if(statusEl)statusEl.textContent='Claude Haiku \uBD84\uC11D\uC911... (0.0\uCD08)';

  return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){
      clearInterval(timer);
      if(r.ok)return r.json();
      return r.text().then(function(t){
        var code=r.status,em='',rawJson=null;
        try{rawJson=JSON.parse(t);em=(rawJson.error&&(rawJson.error.message||rawJson.error))||rawJson.error||'';}catch(e){em=t;}
        if(typeof em==='object')em=JSON.stringify(em);
        window._lastClaudeError={status:code,model:model,rawBody:t,errorMessage:em,parsed:rawJson,url:url};
        console.error('[Claude Error]',window._lastClaudeError);
        /* 5xx 일시적 오류 → 재시도 */
        if((code===500||code===503||code===529)&&retry<MAX_RETRY){
          console.warn('['+code+'] \uC7AC\uC2DC\uB3C4 '+(retry+1)+'/'+MAX_RETRY);
          return new Promise(function(resolve){
            setTimeout(function(){resolve(callClaudeWithRetry(body,retry+1));},500+retry*500);
          });
        }
        var msg;
        if(code===401)msg='[401 \uC778\uC99D \uC2E4\uD328] Worker\uC758 ANTHROPIC_API_KEY Secret\uC744 \uD655\uC778\uD558\uC138\uC694.\n\n\uC6D0\uBCF8: '+em;
        else if(code===429)msg='[429 \uC2A4\uB85C\uD2C0] \uC694\uCCAD\uC774 \uB108\uBB34 \uB9CE\uC544\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.\n\n\uC6D0\uBCF8: '+em;
        else if(code===400)msg='[400 \uC798\uBABB\uB41C \uC694\uCCAD] '+em;
        else if(code===403)msg='[403 \uAD8C\uD55C \uAC70\uBD80] '+em;
        else if(code===404)msg='[404 \uC5D4\uB4DC\uD3EC\uC778\uD2B8 \uC5C6\uC74C] Worker URL\uC744 \uD655\uC778\uD558\uC138\uC694.';
        else if(code>=500)msg='[\uC11C\uBC84 \uC624\uB958 '+code+'] Anthropic API \uC77C\uC2DC \uC624\uB958. \uC7A0\uC2DC \uD6C4 \uC7AC\uC2DC\uB3C4.\n\n\uC6D0\uBCF8: '+em;
        else msg='['+code+'] '+em;
        throw new Error(msg);
      });
    })
    .then(function(data){
      if(!data)return null;
      /* Anthropic 응답: data.content[0].text */
      var txt='';
      try{
        if(data.content&&data.content.length){
          for(var i=0;i<data.content.length;i++){
            if(data.content[i].type==='text'){txt=data.content[i].text;break;}
          }
        }
      }catch(e){}
      if(!txt){
        window._lastClaudeError={status:'empty_response',model:model,rawData:data};
        console.error('[Claude Empty Response]',data);
        throw new Error('[\uBE48 \uC751\uB2F5] content[].text \uC5C6\uC74C\n\n\uC751\uB2F5: '+JSON.stringify(data).substring(0,200));
      }
      txt=txt.replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```\s*$/,'').trim();
      var parsed;try{parsed=JSON.parse(txt);}catch(e){throw new Error('[JSON \uD30C\uC2F1 \uC2E4\uD328]\n\n\uC751\uB2F5: '+txt.substring(0,150));}
      if(!parsed.candidates||!parsed.candidates.length)throw new Error('\uCE74\uB4DC\uB97C \uC778\uC2DD\uD558\uC9C0 \uBABB\uD588\uC5B4\uC694 (\uB354 \uAC00\uAE4C\uC774, \uBC1D\uC740 \uACF3\uC5D0\uC11C \uB2E4\uC2DC \uC2DC\uB3C4)');
      return parsed.candidates;
    });
}

/* 호환: 옛 함수명을 호출하는 코드가 있으면 그대로 동작 */
function callGeminiWithRetry(body){return callClaudeWithRetry(body);}

function friendlyQuotaMsg(rawMsg){
  /* Google 에러 메시지에서 쿼터 종류 파악 */
  var m=rawMsg.toLowerCase();
  if(m.indexOf('per day')>=0||m.indexOf('rpd')>=0)return '일일 한도 소진. 내일 재설정되거나 다른 모델을 시도하세요.';
  if(m.indexOf('per minute')>=0||m.indexOf('rpm')>=0)return '분당 한도 초과. 1분 후 다시 시도하세요.';
  if(m.indexOf('free')>=0||m.indexOf('billing')>=0)return '무료 쿼터 소진. Flash-Lite로 전환하거나 결제 계정을 연결하세요.';
  return '쿼터 초과. 다른 모델로 전환해보세요.';
}

function searchPokemonTcgIo(geminiCandidates){
  /* 세션 2 강화: HP + 첫 기술 데미지 기반 3단계 필터 매칭.
     1. name 검색 (prefix 정규화: "Galarian Rapidash" → "Rapidash"로 검색해서 갈라르 폼 포함)
     2. HP 일치 필터 (정확도 결정 요인 1)
     3. 첫 기술 데미지 일치 필터 (정확도 결정 요인 2)
     각 후보에 matchTier 부여: 'exact'(HP+damage) / 'hp_only' / 'name_only' */
  var top=geminiCandidates[0];
  if(!top||!top.name)return Promise.reject(new Error('영문명 없음'));
  /* prefix 제거 후 base name으로 검색 — pokemontcg.io는 갈라르 폼도 같은 base로 검색됨 */
  var rawName=top.name;
  var searchName=rawName
    .replace(/^(Galarian|Alolan|Hisuian|Paldean|Mega)\s+/i,'')
    .replace(/\s+(ex|EX|V|VMAX|VSTAR|VUNION|V-UNION|GX|BREAK|LV\.X|Prime|LEGEND)$/i,'')
    .trim();
  var cleanName=searchName.replace(/[^A-Za-z0-9\s\-\.]/g,'').trim();
  if(!cleanName)return Promise.reject(new Error('영문명 정리 실패'));
  var q='name:"'+cleanName+'"';
  var url='https://api.pokemontcg.io/v2/cards?q='+encodeURIComponent(q)+'&pageSize=20&select=id,name,images,rarity,set,hp,types,supertype,subtypes,number,attacks,abilities,rules,weaknesses,resistances,retreatCost';
  return fetch(url).then(function(r){return r.json();}).then(function(data){
    if(!data.data||!data.data.length)throw new Error('"'+cleanName+'" DB 카드 없음');
    var all=data.data;
    /* OCR 정보 */
    var targetHp=top.hp?parseInt(top.hp,10):null;
    var targetDmg=top.damage?parseInt(top.damage,10):null;
    /* prefix 일치(갈라르/알로라 등) — 카드 subtypes에 "Galarian"이 들어 있으면 가산 */
    var prefixMatch=null;
    var pm=rawName.match(/^(Galarian|Alolan|Hisuian|Paldean)\s+/i);
    if(pm)prefixMatch=pm[1].toLowerCase();
    /* 각 후보 점수화 + matchTier 결정 */
    var scored=all.map(function(c){
      var score=0,tier='name_only';
      var hpOk=false,dmgOk=false,prefixOk=false;
      /* HP 일치 (가장 강력) */
      var cHp=c.hp?parseInt(c.hp,10):null;
      if(targetHp!==null&&cHp!==null&&cHp===targetHp){
        hpOk=true;score+=100;
      }
      /* 첫 기술 데미지 일치 — 카드의 어떤 기술과도 매칭되면 OK (OCR이 1번 기술이라 했지만 실제 카드 순서와 다를 수 있음) */
      if(targetDmg!==null&&c.attacks&&c.attacks.length){
        for(var ai=0;ai<c.attacks.length;ai++){
          var ad=c.attacks[ai].damage;
          if(!ad)continue;
          var adNum=parseInt(String(ad).replace(/[^0-9]/g,''),10);
          if(!isNaN(adNum)&&adNum===targetDmg){dmgOk=true;score+=80;break;}
        }
      }
      /* prefix 일치 (갈라르 폼이면 카드 이름이나 subtypes에 표시) */
      if(prefixMatch){
        var cN=(c.name||'').toLowerCase();
        var cSubs=(c.subtypes||[]).map(function(s){return String(s).toLowerCase();});
        if(cN.indexOf(prefixMatch)>=0||cSubs.indexOf(prefixMatch)>=0){
          prefixOk=true;score+=60;
        }
      }
      /* 세트 부분 일치 */
      if(top.set&&c.set&&c.set.name){
        var sL=String(top.set).toLowerCase(),cL=c.set.name.toLowerCase();
        if(cL.indexOf(sL)>=0||sL.indexOf(cL)>=0)score+=30;
      }
      /* 카드 번호 일치 */
      if(top.number&&c.number){
        var n1=String(top.number).split('/')[0].replace(/^0+/,'');
        var n2=String(c.number).replace(/^0+/,'');
        if(n1===n2)score+=25;
      }
      /* 최신 세트 미세 가산점 */
      if(c.set&&c.set.releaseDate){score+=parseInt(c.set.releaseDate.split('-')[0],10)/100;}
      /* matchTier 결정 — 사용자에게 보여줄 신뢰도 라벨 */
      if(hpOk&&dmgOk)tier='exact';        /* 🎯 정확 — HP + 데미지 둘 다 일치 */
      else if(hpOk)tier='hp_only';         /* ✅ 추정 — HP만 일치 */
      else tier='name_only';               /* ⚠️ 불확실 — 이름만 일치 (가짜 매칭 위험) */
      c._matchTier=tier;
      c._matchScore=score;
      c._matchFlags={hp:hpOk,dmg:dmgOk,prefix:prefixOk};
      return {c:c,score:score,tier:tier};
    });
    /* 정렬: tier 우선(exact > hp_only > name_only), 같은 tier 안에서는 score 높은 순 */
    var tierRank={exact:3,hp_only:2,name_only:1};
    scored.sort(function(a,b){
      var tr=tierRank[b.tier]-tierRank[a.tier];
      if(tr!==0)return tr;
      return b.score-a.score;
    });
    /* 상위 3장 반환 */
    var result=scored.slice(0,3).map(function(x){return x.c;});
    /* OCR 메타도 첨부 (사용자에게 "OCR이 인식한 것" 표시용) */
    if(result.length){
      result[0]._ocrMeta={hp:targetHp,damage:targetDmg,name:rawName};
    }
    return result;
  });
}

function renderScanCandidates(){
  var rb=document.getElementById('scanResultBody');
  var h='<img class="sr-shot" src="'+_scanShotDataUrl+'">';
  /* OCR이 인식한 것 표시 (디버깅 + 사용자 신뢰) */
  var top=_scanCandidates[0];
  if(top&&top._ocrMeta){
    var m=top._ocrMeta;
    var ocrLine='AI 인식: <b>'+esc(m.name||'?')+'</b>';
    if(m.hp)ocrLine+=' · HP '+m.hp;
    if(m.damage)ocrLine+=' · 데미지 '+m.damage;
    h+='<div class="sr-ocr-meta">'+ocrLine+'</div>';
  }
  /* 매칭 신뢰도 헤드라인 — 첫 후보의 tier 기반 */
  var tier=(top&&top._matchTier)||'name_only';
  var tierMsg='';
  if(tier==='exact')tierMsg='🎯 정확 매칭 — HP와 기술 데미지 모두 일치';
  else if(tier==='hp_only')tierMsg='✅ 추정 매칭 — HP 일치 (데미지 미확인)';
  else tierMsg='⚠️ 불확실 — 이름만 일치, 카드를 직접 확인하세요';
  h+='<div class="sr-label sr-tier-'+tier+'">'+tierMsg+'</div>';
  h+='<div class="scan-cands">';
  _scanCandidates.forEach(function(c,i){
    var img=(c.images&&c.images.small)||'';
    var sn=(c.set&&c.set.name)||'';
    var sel=(i===_scanSelectedIdx)?' sel':'';
    /* 카드별 미니 신뢰도 배지 */
    var t=c._matchTier||'name_only';
    var badge='';
    if(t==='exact')badge='<span class="cand-badge be">🎯</span>';
    else if(t==='hp_only')badge='<span class="cand-badge bh">✅</span>';
    else badge='<span class="cand-badge bn">⚠️</span>';
    h+='<div class="scan-cand'+sel+'" data-i="'+i+'" onclick="selectScanCand('+i+')">';
    if(img)h+='<img src="'+esc(img)+'" loading="lazy">';
    h+=badge;
    /* 한글명 우선 표시 */
    var kr=toKrPureName(c.name);
    h+='<div class="cn2">'+esc(kr)+'</div>';
    h+='<div class="cs">'+esc(sn)+(c.hp?' · HP '+c.hp:'')+'</div>';
    h+='</div>';
  });
  h+='</div>';
  /* 인라인 스타일 1회 inject (CSS 파일 손대지 않기 위함) */
  if(!document.getElementById('scan-tier-style')){
    var st=document.createElement('style');
    st.id='scan-tier-style';
    st.textContent='.sr-ocr-meta{font-size:.72rem;color:rgba(255,255,255,.7);background:rgba(255,255,255,.05);padding:6px 10px;border-radius:8px;margin:8px 0 6px;border:1px solid rgba(255,255,255,.08)}'+
      '.sr-tier-exact{color:#3dc06c!important;font-weight:600}'+
      '.sr-tier-hp_only{color:#5fb3e0!important;font-weight:600}'+
      '.sr-tier-name_only{color:#f39c12!important;font-weight:600}'+
      '.scan-cand{position:relative}'+
      '.cand-badge{position:absolute;top:4px;right:4px;background:rgba(0,0,0,.7);border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:.7rem;z-index:2}';
    document.head.appendChild(st);
  }
  rb.innerHTML=h;
  document.getElementById('scanResultActions').style.display='flex';
  /* 선택된 카드 한글명 반영 */
  var c0=_scanCandidates[_scanSelectedIdx];
  if(c0){
    var btn=document.getElementById('scanConfirmBtn');
    var kr=toKrPureName(c0.name);
    btn.textContent=kr+' 추가';
  }
}

function selectScanCand(i){
  _scanSelectedIdx=i;
  var cands=document.querySelectorAll('#scanResultBody .scan-cand');
  for(var k=0;k<cands.length;k++)cands[k].className=(k===i)?'scan-cand sel':'scan-cand';
  var c=_scanCandidates[i],btn=document.getElementById('scanConfirmBtn');
  var kr=toKrPureName(c.name);
  btn.textContent=kr+' 추가';
}

function confirmScanCard(){
  var c=_scanCandidates[_scanSelectedIdx];if(!c)return;
  /* 순수 한글명으로 통일 — prefix/suffix 모두 제거 */
  var kr=toKrPureName(c.name);
  /* set.id + number 조합으로 cardId 생성 (pokemontcg.io 형식과 일치) */
  var setCode=(c.set&&(c.set.id||c.set.code)||'').toUpperCase();
  var cardNum=c.number||'';
  var newCardId=setCode&&cardNum?(setCode+'-'+cardNum):('scan-'+(c.id||Date.now()));
  var cd={
    id:c.id||newCardId,
    cardId:newCardId,
    name:c.name,krName:kr,
    rarity:c.rarity||'Unknown',
    set:c.set?c.set.name:'-',
    hp:c.hp||'-',types:c.types?c.types.join(', '):'-',
    supertype:c.supertype||'Pok\u00e9mon',
    image:(c.images&&c.images.small)||'',
    source:'claude_scan',
    folder:'\uC9C1\uC811 \uCD94\uAC00',
    folderKey:'manual',
    quantity:1,
    setCode:setCode,
    cardNumber:cardNum,
    updatedAt:Date.now()
  };
  /* addCard에 위임 (중복 시 수량 +1) */
  var existingIdx=-1;
  for(var i=0;i<D.cards.length;i++){if(D.cards[i].cardId===newCardId||D.cards[i].id===cd.id){existingIdx=i;break;}}
  if(existingIdx>=0){
    D.cards[existingIdx].quantity=(D.cards[existingIdx].quantity||1)+1;
    sv();_scanCount++;updateScanCount();
    toast('\u2795 '+(kr||c.name)+' (x'+D.cards[existingIdx].quantity+')','#3498db');
  }else{
    D.cards.push(cd);
    sv();_scanCount++;updateScanCount();
    toast('\u2705 '+(kr||c.name)+' \uCD94\uAC00!','#27ae60');
  }
  retakeScan();
}

function retakeScan(){
  document.getElementById('scanResult').classList.remove('on');
  document.getElementById('scanResultActions').style.display='none';
  _scanCandidates=[];_scanSelectedIdx=-1;_scanShotDataUrl='';
}

function updateScanCount(){
  var el=document.getElementById('scanCount');
  if(el){
    var costKrw=Math.round(_scanCount*3.3);
    el.textContent=_scanCount+'\uC7A5'+(_scanCount>0?' (\uC57D '+costKrw+'\uC6D0)':'');
  }
}

function toast(msg,bg){
  var t=document.createElement('div');
  t.className='scan-toast';t.textContent=msg;
  if(bg)t.style.background=bg;
  document.body.appendChild(t);
  setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove();},300);},1800);
}

/* ═══ Init ═══ */
document.getElementById('dex-q').addEventListener('keydown',function(e){if(e.key==='Enter'){_dexAllCards=[];_dexPage=1;_dexFilter='all';searchDex();}});
document.getElementById('quick-q').addEventListener('input',function(){quickSearch();});
document.getElementById('quick-q').addEventListener('keydown',function(e){if(e.key==='Enter')quickSearch();});
console.log('TCG Guide v2 loaded. KR2EN:',Object.keys(KR2EN).length);
