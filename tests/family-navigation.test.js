'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const app=fs.readFileSync(require.resolve('../app.js'),'utf8'),html=fs.readFileSync(require.resolve('../index.html'),'utf8');
test('home shortcuts preserve six existing panel routes and never change inventory or decks',()=>{
 const ids=['home','rules','dex','coll','scan','deck'],panels=Object.fromEntries(ids.map(x=>['p-'+x,{className:'pnl'}])),buttons=ids.map(id=>({className:'tab',getAttribute:()=>"switchTab('"+id+"',this)"}));let renders=[];
 const D={collected:{one:{qty:2}},customDecksV1:[{id:'saved',cards:[{bs_code:'one',qty:2}]}]},before=JSON.stringify(D);
 const ctx={D,$:id=>id==='tabbar'?{getElementsByTagName:()=>buttons}:panels[id],renderDex:()=>renders.push('dex'),renderColl:()=>renders.push('coll'),renderDeckTab:()=>renders.push('deck')};vm.createContext(ctx);
 vm.runInContext(app.slice(app.indexOf("var _currentTab='home'"),app.indexOf('function togAcc(')),ctx);
 for(const id of ids){ctx.familyNavigate(id);assert.equal(ctx._currentTab,id);for(const x of ids)assert.equal(panels['p-'+x].className,x===id?'pnl on':'pnl');}
 assert.deepEqual(renders,['dex','coll','deck']);assert.equal(JSON.stringify(D),before);
});
test('home keeps direct access to scans, saved decks, retail decks and both deck formats',()=>{
 for(const id of ['p-home','p-rules','p-dex','p-coll','p-scan','p-deck','deck-r','dbm','dbs','abFs'])assert(html.includes('id="'+id+'"'),id);
 for(const action of ["familyNavigate('dex')","familyNavigate('coll')","familyNavigate('scan')","familyNavigate('deck')","familyNavigate('rules')","openBulkDeck()","newDeck('full')"])assert(html.includes(action),action);
 for(const action of ['viewDeckDetail','editDeck','confirmDeleteDeck','openBulkDeck','newDeck','runAutoBuildTypes','showDeckSimulation','saveCurrentDeck'])assert(app.includes('function '+action+'('),action);
 assert(app.includes("newDeck(\\'half\\')"));
});
test('full-deck learning guide keeps accessible parent details, live rules sources and turn distinctions',()=>{
 const guide=html.slice(html.indexOf('class="play-guide"'),html.indexOf('<!-- 📚 도감 탭 -->'));
 for(const term of ['60장 풀덱','프라이즈 6장','기본 포켓몬','멀리건','선공 첫 차례에도','후공','메가진화 ex는 3장','화상','혼란','차례 시작','네스트볼','하이퍼볼','이상한사탕','부모와 함께 확인'])assert(guide.includes(term),term);
 assert(guide.includes('<details>'));assert(guide.includes('<caption>'));assert(guide.includes('https://pokemoncard.co.kr/card/play'));assert(!guide.includes('풀→'));
});
