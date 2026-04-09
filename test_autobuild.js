// ═══════════════════════════════════════════════════════════
// 🧪 세션 14 자동 빌드 테스트 데이터 주입 스크립트
// 사용법: 브라우저 콘솔(F12)에 통째로 붙여넣고 엔터
// ═══════════════════════════════════════════════════════════

// 1. 현재 컬렉션 백업 (복원용)
window.__backupCollected = JSON.parse(JSON.stringify(D.collected));
console.log('✅ 현재 컬렉션 백업 완료 —', Object.keys(window.__backupCollected).length, '종');

// 2. 테스트용 컬렉션 주입
// (파이리 라인 풀 + 이브이 라인 풀 + 미라이돈 ex + 주요 트레이너 + 기본 에너지)
D.collected = {};

// ─── 포켓몬 ───
// 파이리 라인 (단일 진화 테스트용 — 파이리 → 리자드 → 리자몽 ex/일반)
D.collected['BS2016003003'] = {qty: 4, collectedAt: Date.now()}; // 파이리
D.collected['BS2016003004'] = {qty: 3, collectedAt: Date.now()}; // 리자드
D.collected['BS2023014006'] = {qty: 2, collectedAt: Date.now()}; // 리자몽 ex
D.collected['BS2016003005'] = {qty: 2, collectedAt: Date.now()}; // 리자몽 (일반, 폴백)

// 이브이 라인 (다중 진화 테스트용)
D.collected['BS2017001044'] = {qty: 4, collectedAt: Date.now()}; // 이브이
D.collected['BS201707016']  = {qty: 2, collectedAt: Date.now()}; // 샤미드
D.collected['BS201707031']  = {qty: 2, collectedAt: Date.now()}; // 쥬피썬더

// 미라이돈 ex (진화 없음 테스트용)
D.collected['BS2023007037'] = {qty: 4, collectedAt: Date.now()}; // 미라이돈 ex

// ─── 트레이너 ───
D.collected['BS2026001648'] = {qty: 4, collectedAt: Date.now()}; // 언페어 스탬프 (draw_support)
D.collected['BS2026001633'] = {qty: 4, collectedAt: Date.now()}; // 곤충채집세트 (pokemon_search + energy_search)
D.collected['BS2026001666'] = {qty: 4, collectedAt: Date.now()}; // 포켓몬 캐처 (gust)
D.collected['BS2026001644'] = {qty: 4, collectedAt: Date.now()}; // 벌레회피스프레이 (switch)
D.collected['BS2026002076'] = {qty: 4, collectedAt: Date.now()}; // 타라곤 (recovery)
D.collected['BS2026001656'] = {qty: 4, collectedAt: Date.now()}; // 이상한사탕 (evolution_accel)

// ─── 기본 에너지 ───
// 기본 에너지는 cardsDB에서 찾아서 자동으로 추가
var basicEnergies = cardsDB.filter(function(c){
  return c && c.card_class === 'energy' && c.name_kr && c.name_kr.indexOf('기본') >= 0;
});
console.log('발견된 기본 에너지:', basicEnergies.length, '종');
basicEnergies.forEach(function(c){
  D.collected[c.bs_code] = {qty: 20, collectedAt: Date.now()};
  console.log('  +', c.name_kr, c.bs_code);
});
// 폴백: "기본" 안 들어간 버전도 시도
if (basicEnergies.length === 0) {
  var anyEnergies = cardsDB.filter(function(c){
    return c && c.card_class === 'energy' && c.name_kr && 
           (c.name_kr.indexOf('풀 에너지') >= 0 || c.name_kr.indexOf('불 에너지') >= 0 || 
            c.name_kr.indexOf('물 에너지') >= 0 || c.name_kr.indexOf('번개 에너지') >= 0 ||
            c.name_kr.indexOf('초 에너지') >= 0);
  });
  console.log('폴백: "특수" 없는 에너지:', anyEnergies.length, '종');
  anyEnergies.slice(0, 10).forEach(function(c){
    D.collected[c.bs_code] = {qty: 20, collectedAt: Date.now()};
    console.log('  +', c.name_kr, c.bs_code);
  });
}

console.log('');
console.log('🧪 테스트 컬렉션 주입 완료');
console.log('   총 카드 종류:', Object.keys(D.collected).length);
console.log('');
console.log('📋 테스트 시나리오:');
console.log('   1. 새 풀덱 만들기 → 🪄 버튼 → "파이리" 선택');
console.log('      예상: 파이리 4 + 리자드 3(또는 4) + 리자몽 ex 2(+일반 2) + 트레이너 ~25 + 불 에너지 채움');
console.log('   2. 새 풀덱 → 🪄 → "이브이" 선택 → 경로 모달 (샤미드/쥬피썬더) → 하나 선택');
console.log('   3. 새 풀덱 → 🪄 → "미라이돈 ex" 선택');
console.log('      예상: 미라이돈 ex 4장만 (진화 없음) + 트레이너 ~25 + 번개 에너지 채움');
console.log('   4. 하프덱(strict)으로도 1~3 반복 → 30장 목표, 카테고리당 2장');
console.log('');
console.log('🔄 복원 명령어:');
console.log('   D.collected = window.__backupCollected; sv(); console.log("복원 완료");');
