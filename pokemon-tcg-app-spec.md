# 포켓몬 TCG 가이드 앱 — 개선 스펙 문서

**작성일**: 2026-04-06
**대상 앱**: `gengar200005.github.io/pokemon-tcg-guide/`
**목적**: Dragon Shield CSV 연동 + 덱빌더 핵심 개선 작업의 확정 스펙 정리

---

## 📌 문서 구조

1. [배경 및 의사결정 과정](#1-배경-및-의사결정-과정)
2. [앱 정체성 및 역할 재정의](#2-앱-정체성-및-역할-재정의)
3. [CSV Import 기능 확정 스펙](#3-csv-import-기능-확정-스펙)
4. [덱빌더 개선 — 이번 작업 범위](#4-덱빌더-개선--이번-작업-범위)
5. [덱빌더 개선 — 전체 아이디어 목록](#5-덱빌더-개선--전체-아이디어-목록)
6. [작업 견적 및 일정](#6-작업-견적-및-일정)
7. [미결정/보류 사항](#7-미결정보류-사항)
8. [부록: 참고 데이터](#8-부록-참고-데이터)

---

## 1. 배경 및 의사결정 과정

### 1.1 시작점

마스터 앱은 원래 Gemini Vision API를 직접 호출해서 카드 스캔 기능을 제공했다. API 키가 프론트엔드(`app.js`)에 노출되는 문제를 해결하기 위해 Cloudflare Worker 프록시 도입 작업을 시작함.

### 1.2 작업 과정에서 발견된 이슈들

| 이슈 | 원인 | 해결 |
|---|---|---|
| API 키 프론트엔드 노출 | 설계 문제 | Cloudflare Worker 프록시 도입 ✅ |
| `gemini-2.0-flash` Deprecation | 2026년 3월 Google 공식 폐기 | `gemini-2.5-flash-lite`로 전환 ✅ |
| Gemini 무료 티어 분당 한도 | 10 RPM 제한 | 모델 변경 + 재시도 로직 ✅ |
| **"User location is not supported" 400 에러** | **Cloudflare가 한국→홍콩(HKG) 엣지로 라우팅 + Gemini가 HKG 차단** | **미해결, 구조적 문제** ⚠️ |
| 카드 스캔 속도 (6초) | 모델 + 프롬프트 + 이미지 | 프롬프트 간소화, Flash-Lite 고정 (부분 해결) |
| 인식률 | Gemini의 한국어/일본어 카드 OCR 한계 | 근본 해결 불가 |

### 1.3 핵심 전환점

- **HKG 엣지 차단 문제는 Worker 재시도/Smart Placement로도 완전 해결 불가**
- Cloudflare 한국 트래픽의 일정 비율이 HKG로 라우팅되는 것이 구조적 문제
- Gemini API는 HKG에서 온 요청을 거부하는 정책
- 해결책 검토: Vertex AI 전환 (복잡), 다른 AI로 전환 (Claude/OpenAI), **기존 카드 스캔 앱(Dragon Shield) 활용** 등

### 1.4 최종 결정

**Dragon Shield Poké TCG Scanner** (ARCANE TINMEN APS 제작, 무료 앱)를 주력 카드 등록 도구로 활용하고, 마스터 앱은 그 데이터를 받아서 **뷰어 + 덱빌더** 역할에 집중하는 것으로 방향 전환.

이유:
- Dragon Shield의 이미지 해싱 기반 스캔은 **로컬 DB 매칭 방식**으로 LLM 방식보다 10배 이상 빠르고 정확함
- Dragon Shield가 **CSV Export 기능**을 공식 제공 (Folder, Set, Number, Price 등 15개 필드)
- 마스터 앱이 "스캔" 기능으로 Dragon Shield와 경쟁할 실익 없음
- 개원 준비로 바쁜 상황에서 유지보수 부담 최소화가 중요

### 1.5 보존할 것

- Cloudflare Worker 인프라 (다른 AI 기능으로 재활용 가능)
- 카드 스캔 탭 (단, Claude Haiku로 전환하여 "긴급 단일 카드 추가" 용도로만 유지)
- 기존 덱빌더, 프리셋 덱, Firebase 동기화 등 모든 기능

---

## 2. 앱 정체성 및 역할 재정의

### 2.1 새로운 정체성

> **"가족용 포켓몬 TCG 컬렉션 뷰어 + 덱빌더"**
>
> 아이와 함께 보는 한국어 UI의 포켓몬 카드 관리 및 덱 구성 도구

### 2.2 기능별 주력 도구

| 기능 | 주력 도구 | 마스터 앱 역할 |
|---|---|---|
| **대량 카드 등록** | Dragon Shield Scanner | CSV 받아서 표시 |
| **긴급 단일 카드 추가** | 마스터 앱 (Claude Haiku) | 직접 스캔 (보조 기능) |
| **컬렉션 조회/탐색** | 마스터 앱 | 주력 기능, 한국어 UI |
| **덱 빌더** | 마스터 앱 | 주력 기능, 가족 맞춤 |
| **카드 가격 추적** | Dragon Shield | 마스터 앱은 시점 스냅샷만 |
| **시세 그래프** | Dragon Shield | 구현하지 않음 (중복) |

### 2.3 Dragon Shield와의 차별점 (마스터 앱이 제공할 가치)

1. **한국어 UI**: 아이가 한국어로 모든 기능 사용 가능
2. **한국어 카드 이름**: 리자몽 ↔ Charizard 자동 매핑
3. **덱빌더 특화**: Dragon Shield보다 풍부한 덱 구성 기능
4. **가족 맞춤**: 폴더 기반으로 가족 구성원별 관리
5. **아이 친화적 뷰**: 크고 시각적인 카드 표시, 도감 탐색 등
6. **Firebase 클라우드 동기화**: 여러 기기에서 접근

---

## 3. CSV Import 기능 확정 스펙

### 3.1 전체 워크플로우

```
Dragon Shield 앱
    ↓ (CSV Export)
CSV 파일 (gaon.csv 등)
    ↓ (사용자가 마스터 앱에 업로드)
마스터 앱 CSV Parser
    ↓ (파싱 + 검증)
pokemontcg.io API 조회
    ↓ (이미지, 타입, HP 등 보강)
pokeapi.co API 조회
    ↓ (한국어 이름 매핑)
Firestore 저장
    ↓ (병합 로직)
UI 업데이트 (컬렉션 뷰 + 덱빌더 연동)
```

### 3.2 결정된 스펙

| # | 항목 | 결정 | 구현 방향 |
|---|---|---|---|
| 1 | **카드 스캔 탭** | Claude Haiku로 전환하여 유지 | 기존 UI 유지, Worker/API만 교체 |
| 2 | **CSV Import 방식** | 병합 (merge), 수량 덮어쓰기 | [3.3~3.5](#33-같은-카드-처리-정책--확정) 상세 참조 |
| 2-1 | **CSV에 없는 카드** | 유지 (삭제 안 함) | 안전한 방향 |
| 3 | **기존 카드 6장 처리** | 보존, 섞기 | 폴더 필드로 구분 |
| 4 | **폴더명 한국어 매핑** | 적용 | `gaon` → `가온이 카드` |
| 5 | **pokemontcg.io 조회** | 모든 카드 보강 | 이미지, 타입, HP 등 |
| 6 | **한국어 이름 표시** | pokeapi.co 매핑 | 기본 포켓몬만, 접미사(ex, V 등)는 영어 유지 |
| 7 | **중복 import 감지** | 파일 해시 + 카드 단위 병합 | SHA-256 해시로 파일 식별 |
| 8 | **가격 데이터** | 저장 + 총 가치 표시 | MARKET 필드 사용 |
| 9 | **통화 표시** | 달러 + 원화 병기 | `$6.81 (약 9,800원)` |
| 10 | **덱 카드 표시** | "사용 중" 태그 | 차감 없음 |
| 11 | **Quantity 저장** | 단일 레코드 + quantity 필드 | 표준 설계 |
| 12 | **오프라인 지원** | Firestore 캐시 활성화 | 설정만 추가 |
| 13 | **가족 공유** | 현재 1인, 확장 가능 | 마스터 계정 단독 |
| 14 | **신규 세트 대응** | 자동 (하드코딩 없음) | pokemontcg.io 의존 |
| 추가 | **환율** | 고정값 | 1,450원/USD |
| 추가 | **대상 사용자** | 가온이만 | 현재는 1인 |

### 3.3 같은 카드 처리 정책 ✅ 확정

**결정**: **수량 반영 덮어쓰기 병합**

**배경**: 포켓몬 TCG는 같은 카드를 덱에 최대 4장까지 넣을 수 있으므로 수량 정보가 필수. 덱 완성도 계산(기능 1)의 정확도를 위해 Dragon Shield의 수량을 그대로 반영해야 함.

**규칙**:

| 상황 | 동작 |
|---|---|
| CSV에 있고 앱에도 있는 카드 | **Dragon Shield 수량으로 덮어쓰기** |
| CSV에 있고 앱에는 없는 카드 | 새로 추가 |
| CSV에 없고 앱에만 있는 카드 | 그대로 유지 (삭제 안 함) |

**핵심 원칙**:
- **Dragon Shield가 "진실의 소스"**: 현재 실제 소유 수량은 Dragon Shield 값을 신뢰
- **합산이 아닌 덮어쓰기**: 같은 CSV를 재 import해도 수량 부풀리지 않음
- **수동 등록 카드 보존**: CSV에 없는 기존 카드는 그대로 유지 (안전)

### 3.4 카드 매칭 기준

"같은 카드"를 판단하는 기준. **카드 ID 기반 매칭** 채택.

```javascript
function getCardId(card) {
  // Set Code + Card Number (분모 제거)
  // 예: "SV1-050", "MEW-027"
  const num = card.cardNumber.split('/')[0].trim();
  return `${card.setCode}-${num}`;
}
```

**매칭 우선순위**:
1. **1순위**: `setCode + cardNumber` 조합 (가장 정확)
2. **Fallback**: 수동 등록 카드가 Set 정보가 없으면 **이름 매칭** (`nameKr` 또는 `nameEn`)
3. **그래도 실패**: 새 카드로 취급

**이유**:
- 같은 "리자몽 ex"라도 세트가 다르면 다른 카드 (SV1 vs 151)
- pokemontcg.io API ID 형식과 호환
- 포켓몬 TCG의 "동일 카드 ID 4장 제한" 규칙과 일치

### 3.5 병합 로직 의사코드

```javascript
function mergeCsvImport(existingCards, csvCards) {
  // 기존 카드 인덱싱 (카드 ID 기준)
  const existing = {};
  existingCards.forEach(c => {
    const id = c.cardId || `manual-${(c.nameEn || c.nameKr || '').toLowerCase()}`;
    existing[id] = c;
  });

  const results = {
    added: [],       // 새로 추가된 카드
    updated: [],     // 수량이 변경된 카드
    untouched: [],   // 같은 상태 유지
  };

  csvCards.forEach(csvCard => {
    const id = getCardId(csvCard);
    const existingCard = existing[id];

    if (existingCard) {
      const oldQty = existingCard.quantity || 0;
      const newQty = parseInt(csvCard.quantity) || 0;
      
      if (oldQty !== newQty) {
        results.updated.push({
          cardId: id,
          name: existingCard.nameKr || existingCard.nameEn,
          oldQty,
          newQty,
        });
        existingCard.quantity = newQty;
        existingCard.source = 'dragon_shield';
        existingCard.previouslyManual = existingCard.source === 'manual';
        existingCard.updatedAt = Date.now();
      } else {
        results.untouched.push(id);
      }
    } else {
      // 새 카드 → pokemontcg.io 조회 후 추가
      results.added.push(buildNewCard(csvCard));
    }
  });

  // CSV에 없는 기존 카드는 그대로 유지 (아무 동작 없음)
  
  return results;
}
```

### 3.6 Import 결과 UI

사용자에게 보여줄 요약 화면:

```
📤 Dragon Shield 가져오기 완료

✅ 새로 추가: 5장
🔄 수량 업데이트: 2장
   - 리자몽 ex: 1장 → 3장
   - 피카츄: 2장 → 4장
📌 그대로: 0장
⚠️  조회 실패: 0장

💰 총 컬렉션 가치: $17.21 (약 25,000원)

[확인]
```

### 3.7 데이터 스키마

**Firestore `cards` 컬렉션** 각 카드 레코드:

```javascript
{
  // 식별자
  id: "sv1-050",                    // pokemontcg.io ID 또는 fallback
  source: "dragon_shield",          // "dragon_shield" | "manual" | "claude_scan"

  // CSV 원본 필드
  folder: "가온이 카드",             // 한국어 매핑 적용
  folderKey: "gaon",                // 원본 폴더명 (매핑 키)
  quantity: 1,                      // Dragon Shield Quantity (정책에 따라 사용 여부 결정)
  tradeQuantity: 0,
  nameEn: "Clawitzer",
  nameKr: "블로스터포스",             // pokeapi.co에서 조회
  setCode: "SV1",
  setName: "Scarlet & Violet",
  cardNumber: "050",
  condition: "NearMint",
  printing: "Normal",
  language: "English",

  // 가격 (달러 기준)
  priceBought: 0.10,
  dateBought: "2026-04-06",
  priceLow: 0.01,
  priceMid: 0.15,
  priceMarket: 0.10,

  // pokemontcg.io에서 보강
  imageUrl: "https://...",
  imageUrlHires: "https://...",
  types: ["Water"],
  hp: "120",
  rarity: "Common",
  supertype: "Pokémon",
  subtypes: ["Stage 1"],

  // 메타데이터
  importedAt: <timestamp>,          // 첫 import 시각
  updatedAt: <timestamp>,
  csvFileHash: "a3f5b1...",         // 어느 CSV에서 왔는지
}
```

**Firestore `imports` 컬렉션** (import 이력):

```javascript
{
  id: "<hash>",
  fileHash: "a3f5b1...",
  fileName: "gaon.csv",
  importedAt: <timestamp>,
  cardCount: 7,
  added: 5,                         // 새로 추가
  updated: 2,                       // 기존 카드 업데이트
  failed: 0                         // 조회 실패
}
```

### 3.8 UI 요구사항

**1. CSV 업로드 화면**
- 새 탭 또는 컬렉션 화면 상단에 **"📤 Dragon Shield 가져오기"** 버튼
- 버튼 클릭 → 파일 선택 대화상자
- 선택 후 → 미리보기 화면:
  - 총 카드 수
  - 새 카드 / 기존 카드 / 실패 구분
  - 파일 해시 표시 (중복 감지 시 경고)
- **"가져오기"** / **"취소"** 버튼
- 가져오기 진행 중 프로그레스 바 표시 (`3/7 카드 처리 중...`)

**2. 컬렉션 화면 개선**
- 상단에 **폴더 필터** (예: `전체 / 가온이 카드 / 직접 추가`)
- 총 가치 표시: `총 $17.21 (약 25,000원)`
- 각 카드 카드에 **source 뱃지** (`📤 Dragon Shield`, `✋ 직접 추가`, `📸 스캔`)

**3. 에러 처리**
- pokemontcg.io 조회 실패 카드: 기본 정보만 저장 + 경고 표시
- CSV 파싱 실패: 구체적 에러 메시지 (몇 번째 줄, 어떤 필드)
- 네트워크 에러: 재시도 버튼

### 3.9 외부 API 의존

| API | 용도 | 제한 | 대응 |
|---|---|---|---|
| **pokemontcg.io** | 카드 이미지, 메타데이터 | 하루 1,000 req (무료) | 결과 localStorage 캐시 |
| **pokeapi.co** | 한국어 포켓몬 이름 | Rate limit 관대 | 기본 포켓몬 751종 매핑 캐시 |

---

## 4. 덱빌더 개선 — 이번 작업 범위

마스터가 선택한 5가지 개선 기능. **CSV Import 작업과 함께 진행**.

### 4.1 [기능 1] 컬렉션 기반 덱 완성도 표시 ⭐⭐⭐

**목적**: 가온이가 가진 카드로 실제 만들 수 있는 덱을 한눈에 확인

**동작**:
- 덱 목록에서 각 덱 카드 옆에 **프로그레스 바** 표시
- 예: `리자몽 ex 배틀마스터덱 — 58/60장 (97%)`
- 미완성 덱 클릭 시 **"부족한 카드 보기"** 버튼 → 모달에 빠진 카드 리스트
- 부족한 카드는 **세트 정보 + 힌트** 표시 (예: "SV1 세트에서 구할 수 있어요")

**핵심 로직**:
```javascript
// 의사코드
function calculateDeckCompletion(deck, collection) {
  const required = deck.cards;  // [{n: "리자몽 ex", q: 2}, ...]
  const owned = collection.reduce((acc, card) => {
    acc[card.nameKr || card.nameEn] = (acc[card.nameKr || card.nameEn] || 0) + card.quantity;
    return acc;
  }, {});

  let total = 0, have = 0, missing = [];
  required.forEach(req => {
    total += req.q;
    const ownedCount = owned[req.n] || 0;
    have += Math.min(ownedCount, req.q);
    if (ownedCount < req.q) {
      missing.push({ name: req.n, need: req.q - ownedCount });
    }
  });

  return { total, have, pct: (have / total * 100), missing };
}
```

**도전 과제**:
- 덱 카드명(한국어) ↔ 컬렉션 카드명(영어/한국어 혼재) 매칭
- 에너지 카드 매칭 (`불 에너지 🔥` ↔ `Fire Energy`)
- 접미사 처리 (`리자몽 ex` ↔ `Charizard ex`)

**작업량**: 1시간

### 4.2 [기능 2] 덱 카드 이미지 그리드 ⭐⭐⭐

**목적**: 현재 텍스트 리스트인 덱 내용을 시각적 이미지 그리드로 표시

**동작**:
- 덱 상세 보기(`showDeckDetail`) 화면의 레이아웃 변경
- 카드 리스트를 **반응형 그리드** (모바일 3열, 태블릿 4~5열)로 표시
- 각 카드 = **실제 카드 이미지** + **수량 뱃지** (우상단 `x2`, `x4` 등)
- 이미지 탭 → 기존 카드 상세 모달 열기
- 이미지 없는 카드 (매칭 실패) → **기본 일러스트 + 카드명 텍스트**

**디자인 참고**:
```
┌────────────────────────┐
│  리자몽 ex 덱 (60장)    │
├────────────────────────┤
│  [img]  [img]  [img]   │
│  x2     x2     x2      │
│                        │
│  [img]  [img]  [img]   │
│  x4     x2     x2      │
│                        │
│  ... (스크롤)          │
└────────────────────────┘
```

**데이터 요구**:
- 각 카드의 `imageUrl` 필드 필요 → **pokemontcg.io 조회 결과 사용**
- CSV Import로 가져온 카드는 이미 있음
- 프리셋 덱 카드는 **한국어 이름으로 pokemontcg.io 검색** → 이미지 캐시
- 첫 로드 시 느릴 수 있음 → 백그라운드 로딩 + 스켈레톤 UI

**작업량**: 1시간

### 4.3 [기능 3] 덱 에너지 밸런스 시각화 ⭐⭐

**목적**: 덱 구성을 카테고리별 차트로 요약 표시

**표시 내용**:
- **카테고리 분포 도넛 차트**: 포켓몬 / 트레이너 / 에너지 (각 카테고리 수량)
- **포켓몬 타입 분포**: 불 🔥, 물 💧, 풀 🌿, 전기 ⚡ 등
- **에너지 카드 비율**: 기본 에너지 / 특수 에너지
- **총 장수 검증**: 60장 미만/초과 경고

**UI 위치**: 덱 상세 화면 상단 (이미지 그리드 위)

**구현 방법**:
- SVG로 직접 그리기 (외부 차트 라이브러리 불필요)
- 또는 간단한 CSS 바 차트
- 포켓몬/트레이너/에너지 구분은 카드 **`supertype`** 필드 활용 (pokemontcg.io 제공)

**작업량**: 40분

### 4.4 [기능 4] "오늘의 덱 챌린지" 미니게임 ⭐⭐⭐

**목적**: 아이에게 재미있는 덱 빌딩 퀘스트 제공 (교육 + 재미)

**챌린지 예시** (랜덤 또는 요일별):
- 🔥 **불 타입 마스터**: 불 타입 포켓몬 10마리로 덱 만들기
- 💧 **수중 탐험**: 물 타입만 사용해서 40장 덱 완성
- 🎴 **진화의 길**: 완전한 진화 라인 3세트 포함한 덱
- 🌟 **레어 콜렉터**: 희귀도 Rare 이상 카드 5장 포함
- ⚡ **스피드스터**: 기본 포켓몬(Stage 0)만으로 덱 만들기
- 🛡️ **HP 챔피언**: 평균 HP 100 이상
- 🧪 **트레이너 마니아**: 트레이너 카드 25장 이상

**동작**:
- 덱빌더 탭 상단에 **배너 UI**: "🎯 오늘의 챌린지: 불 타입 마스터"
- 조건 설명 + 예상 소요 시간 + 진행률
- **"시작하기"** 버튼 → 가이드 모드로 덱 빌드
- 완성 시 **축하 애니메이션 + 뱃지 획득**
- 획득한 뱃지는 프로필/컬렉션 화면에 표시

**데이터 구조** (Firestore):
```javascript
challenges: {
  "2026-04-06": {
    challengeId: "fire_master",
    completed: true,
    completedAt: <timestamp>,
    deckId: "리자몽 챌린지덱"
  },
  // ...
}
badges: ["fire_master", "water_champion", ...]
```

**작업량**: 2시간

**솔직 평가**: 재미 요소 강하지만 작업량이 제일 많음. 여유 있으면 진행.

### 4.5 [기능 5] 카드 → 덱 역조회 ⭐⭐

**목적**: 특정 카드가 **어느 덱에 쓰이는지** 카드 상세에서 확인

**동작**:
- 카드 상세 모달 하단에 **"사용 중인 덱"** 섹션 추가
- 예시:
  ```
  📦 사용 중인 덱 (2):
  - 리자몽 ex 배틀마스터덱 (x2)
  - 불 스타터덱 (x1)
  ```
- 덱 이름 클릭 → 해당 덱 상세로 이동

**구현**:
```javascript
function findDecksUsingCard(cardName, decks) {
  return decks
    .map(deck => {
      const card = deck.cards.find(c => c.n === cardName);
      return card ? { name: deck.name, quantity: card.q } : null;
    })
    .filter(Boolean);
}
```

**시너지**: 기능 1(컬렉션 기반 덱 완성도)와 함께 "내가 가진 카드 → 만들 수 있는 덱" ↔ "카드 → 덱" 양방향 탐색 가능

**작업량**: 20분

---

## 5. 덱빌더 개선 — 전체 아이디어 목록

이번에 선택되지 않았지만 **나중에 참고용**으로 제안된 모든 아이디어 기록.

### 5.1 Tier 1 — 필수 개선

| # | 기능 | 작업량 | 이번 작업 | 설명 |
|---|---|---|---|---|
| 1 | 컬렉션 기반 덱 완성도 | 1h | ✅ | 내가 가진 카드로 만들 수 있는 덱 표시 |
| 2 | 덱 카드 이미지 그리드 | 1h | ✅ | 텍스트 → 이미지 시각화 |
| 12 | 카드 → 덱 역조회 | 20m | ✅ | 카드가 어느 덱에 쓰이는지 |

### 5.2 Tier 2 — 재미있는 추가

| # | 기능 | 작업량 | 이번 작업 | 설명 |
|---|---|---|---|---|
| 3 | 덱 에너지 밸런스 차트 | 40m | ✅ | 포켓몬/트레이너/에너지 분포 |
| 4 | 오늘의 덱 챌린지 | 2h | ✅ | 매일 퀘스트 + 뱃지 |
| 6 | AI 덱 vs 덱 분석 | 30m | ❌ | 두 덱의 강약점 Claude AI로 분석 |
| 11 | 타입 상성 차트 | 40m | ❌ | "이 덱은 풀 타입에 강해요" |

### 5.3 Tier 3 — 장기/선택적

| # | 기능 | 작업량 | 이번 작업 | 설명 |
|---|---|---|---|---|
| 5 | 덱 강함 점수 | 1h | ❌ | 룰 기반 또는 AI 기반 점수 산출 |
| 7 | 덱 쇼케이스 이미지 | 1h | ❌ | SNS 공유용 이미지 생성 |
| 8 | AI 덱 코칭 | 1h | ❌ | Claude Haiku가 덱 개선 조언 |
| 9 | 덱 히스토리/버전 관리 | 1h | ❌ | 수정 이력 저장 |
| 10 | 덱 PDF 인쇄 | 1h | ❌ | 대회용 덱 리스트 인쇄 |

### 5.4 추후 검토할 만한 것들 (기록용)

- **덱 합본 관리**: 여러 덱을 "덱북"으로 묶어서 관리 (예: 가온이의 덱북, 여름 대회 덱북)
- **카드 위시리스트**: "갖고 싶은 카드" 목록 관리, Dragon Shield에서 트레이드 시 참고
- **부스터팩 시뮬레이터**: 실제 세트 확률 기반으로 가상 팩 개봉 (재미 요소)
- **가족 간 트레이드 기록**: 다른 아이(미래)와 카드 교환 기록
- **포켓몬 도감 연동 강화**: 카드가 아닌 **포켓몬 종류별** 탐색
- **학습 카드 게임**: 영어 이름 맞추기, 타입 맞추기 등 교육 게임

---

## 6. 작업 견적 및 일정

### 6.1 이번 작업 범위 예상 시간

| 작업 | 예상 시간 | 비고 |
|---|---|---|
| **CSV Import 기능** | | |
| CSV Parser + UI | 30m | 파싱, 업로드 UI, 미리보기 |
| pokemontcg.io API 조회 + 캐시 | 30m | 이미지, 메타데이터 보강 |
| pokeapi.co 한국어 이름 매핑 | 30m | 기본 751종 매핑 테이블 |
| Firestore 병합 + diff 로직 | 20m | 중복 감지, 병합 처리 |
| 가격 집계 + 원화 환산 | 20m | 고정 환율 기반 |
| 폴더 관리 + 한국어 매핑 UI | 20m | 설정 화면 |
| **덱빌더 개선 (5가지)** | | |
| [1] 덱 완성도 표시 | 1h | 카드명 매칭 포함 |
| [2] 덱 카드 이미지 그리드 | 1h | 반응형 그리드 |
| [3] 에너지 밸런스 차트 | 40m | SVG 직접 그리기 |
| [4] 오늘의 덱 챌린지 | 2h | 가장 오래 걸림 |
| [12] 카드 → 덱 역조회 | 20m | |
| **기타** | | |
| 카드 스캔 Claude Haiku 전환 | 30m | Worker + app.js 수정 |
| 테스트 및 버그 수정 | 45m | |
| **총합** | **약 8시간** | |

### 6.2 작업 분할 제안

한 번에 하기엔 길어서 **2~3회 세션**으로 분할 권장.

**세션 1** (약 3시간) — **핵심 인프라**
- CSV Import 전체 기능 (2h)
- 카드 스캔 Claude Haiku 전환 (30m)
- 기본 테스트 (30m)

**세션 2** (약 3시간) — **덱빌더 핵심 개선**
- 기능 1: 덱 완성도 (1h)
- 기능 2: 덱 이미지 그리드 (1h)
- 기능 12: 카드 → 덱 역조회 (20m)
- 기능 3: 에너지 밸런스 차트 (40m)

**세션 3** (약 2시간) — **재미 기능**
- 기능 4: 오늘의 덱 챌린지 (2h)
- 최종 통합 테스트

### 6.3 일정 옵션

**옵션 A**: 주말 집중 작업 (토/일 중 하루 5~6시간)
- 장점: 몰입 가능, 빠른 완성
- 단점: 피로 누적, 가족 시간 줄어듦

**옵션 B**: 평일 저녁 분할 (세션당 2~3시간 × 3회)
- 장점: 각 세션 후 검증 시간 있음, 가족 시간 유지
- 단점: 세션 간 맥락 복구 비용

**옵션 C**: 점진적 배포 (세션 완료 시마다 바로 배포)
- 장점: 빠른 피드백, 가온이가 단계별로 체감
- 단점: 중간 상태가 어색할 수 있음

**추천**: **옵션 B + C 조합** — 평일 저녁 세션 1 (CSV) → 주말 세션 2 (덱빌더 핵심) → 그 다음 여유 있을 때 세션 3 (챌린지)

---

## 7. 미결정/보류 사항

구현 착수 전 확정 필요한 항목들.

### 7.1 모든 핵심 결정 확정 ✅

이전에 보류였던 **"같은 카드 처리 정책"**이 2026-04-06 최종 확정됨:
- **수량 덮어쓰기 병합** 방식 채택 ([섹션 3.3](#33-같은-카드-처리-정책--확정) 참조)
- Dragon Shield가 현재 소유 수량의 "진실의 소스"
- 카드 ID(`setCode-cardNumber`) 기반 매칭

**현재 모든 핵심 스펙이 확정 상태**. 구현 착수 가능.

### 7.2 나중에 결정해도 됨

| # | 항목 | 고려사항 |
|---|---|---|
| 1 | **Claude API 키 발급 시점** | 카드 스캔 탭 전환 작업 직전에 |
| 2 | **Cloudflare Worker의 Gemini → Anthropic 전환** | Secret 교체, 엔드포인트 변경 |
| 3 | **환율 업데이트 주기** | 고정값이지만 주기적으로 수정 (예: 월 1회) |
| 4 | **한국어 매핑 범위** | 기본 포켓몬만? 고대/패러독스 폼까지? |
| 5 | **오늘의 덱 챌린지 풀** | 몇 개 챌린지로 시작할지 (5개? 10개?) |

### 7.3 구현 중 발견될 수 있는 이슈

**pokemontcg.io API 한계**:
- 한국판 카드 이미지는 제공 안 될 가능성
- Dragon Shield CSV에 있는 특수 번호 (`012VL` 등)가 매칭 안 될 수 있음
- API 조회 실패 시 대응 전략 필요

**pokeapi.co 한국어 매핑 한계**:
- 기본 포켓몬(751마리)은 매핑 가능
- Paldean/Hisuian 폼, 메가 진화, Tera 타입 등은 매핑 공백
- 접미사(`ex`, `V`, `VMAX`) 처리 필요

**Dragon Shield CSV 포맷 변경 가능성**:
- 앱 업데이트로 필드가 바뀌거나 추가될 수 있음
- 방어적 파싱 필요 (필드 누락 허용)

---

## 8. 부록: 참고 데이터

### 8.1 샘플 CSV 데이터 (gaon.csv, 7장)

```csv
"sep=,"
Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,LOW,MID,MARKET
gaon,1,0,Clawitzer,SV1,Scarlet & Violet,050,NearMint,Normal,English,0.10,2026-04-06,0.01,0.15,0.10
gaon,1,0,Clefable,S2,Rebellion Crash,040 / 096,NearMint,Normal,English,2.00,2026-04-06,1.49,1.49,2.00
gaon,1,0,Giratina V,PPS,Pokémon Prize Pack Series,130,NearMint,Normal,English,6.81,2026-04-06,5.50,7.71,6.81
gaon,1,0,Hitmonchan,CLA,Pokémon Trading Card Game Classic,012VL,NearMint,Normal,English,6.15,2026-04-06,6.00,7.46,6.15
gaon,1,0,Primeape,S5I,Single Strike Master,029 / 070,NearMint,Normal,English,0.00,2026-04-06,0.10,0.13,
gaon,1,0,Sandshrew,MEW,151,027,NearMint,Normal,English,0.13,2026-04-06,0.01,0.15,0.13
gaon,1,0,Toxtricity,S4A,Shiny Star V,241 / 190,NearMint,Normal,English,2.02,2026-04-06,1.98,2.00,2.02
```

**컬렉션 총 가치**: $17.21 (약 24,955원)

### 8.2 현재 프리셋 덱 목록

1. **테라스탈 리자몽 ex 배틀마스터덱** 🔥 (60장)
2. **파오젤 ex 배틀마스터덱** 🦦 (60장)
3. **테라스탈 뮤츠 ex 스타터** 🔮 (60장)
4. **코라이돈 ex 스타터** 🦕 (60장)
5. **미라이돈 ex 스타터** ⚡ (60장)
6. **님피아 ex 스타터** 🎀 (60장)

### 8.3 외부 API 엔드포인트

| 서비스 | Base URL | 용도 |
|---|---|---|
| pokemontcg.io | `https://api.pokemontcg.io/v2` | 카드 이미지/메타데이터 |
| pokeapi.co | `https://pokeapi.co/api/v2` | 한국어 포켓몬 이름 |
| Cloudflare Worker | `https://pokemon-tcg-proxy.sieun8475.workers.dev` | AI 프록시 (Gemini → Anthropic 전환 예정) |

### 8.4 Cloudflare Worker 설정 (현재 상태)

```javascript
const ALLOWED_ORIGINS = [
  'https://gengar200005.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
];

const BLOCKED_COLOS = ['HKG'];  // HKG 엣지 사전 차단 (향후 Haiku 전환 시 제거 가능)

// 현재: Gemini 2.5 Flash-Lite
// 예정: Anthropic Claude Haiku 4.5
```

### 8.5 Anthropic Claude Haiku 4.5 비용

| 항목 | 단가 |
|---|---|
| 입력 토큰 | $1.00 / 1M tokens |
| 출력 토큰 | $5.00 / 1M tokens |
| 이미지 입력 (카드 1장) | 약 1,400 tokens |
| 응답 JSON | 약 200 tokens |
| **카드 1장 스캔 비용** | **약 $0.0024 (3.3원)** |
| 월 100장 사용 시 | 약 **$0.24 (350원)** |

**무료 크레딧**: 신규 가입 시 $5 (카드 약 2,100장 무료)

---

## 📝 버전 이력

| 버전 | 날짜 | 변경 사항 |
|---|---|---|
| 1.0 | 2026-04-06 | 초안 작성 (CSV Import + 덱빌더 개선 5종) |
| 1.1 | 2026-04-06 | "같은 카드 처리 정책" 확정 (수량 덮어쓰기 병합), 카드 매칭 기준 명시, 병합 로직 의사코드 추가 |

---

**현재 상태**: 모든 핵심 스펙 확정 완료. 구현 착수 가능 ✅

**다음 단계**: 세션 1 시작 — CSV Import 기능 + Claude Haiku 전환 (약 3시간)
