# 한국어 카드 DB 업데이트 보고서

- 기준일: **2026-10-30**
- 작업 브랜치: `claude/peaceful-goodall-nhbklc` (시작 커밋 `21fba93` = 작업 시작 시점의 `origin/main`)
- 출처: 포켓몬 카드 게임 한국 공식 사이트 `pokemoncard.co.kr`
  - 카드 상세 페이지 `/cards/detail/<bs_code>`
  - 제품 정보 `/card/category/info1·info2·info3`, `/card/<id>`
  - 카드 이미지 `cards.image.pokemonkorea.co.kr`
- 이용 정책: `robots.txt`는 `User-agent: * / Allow: /`(전체 허용)입니다.
  - 요청 사이 간격은 0.4초로 두었고, 수집기임을 밝히는 User-Agent를 썼습니다.
  - 카드 목록 검색 API(`/v2/ajax2_dev2`)는 브라우저가 아닌 요청에 "접근불가"를 응답합니다. 그래서 우회하지 않고 공개 상세 페이지만 사용했습니다.

## 요약

| 항목 | 이전 | 이후 | 추가 |
|---|---:|---:|---:|
| 카드 (`korean_cards_db.json`) | 15,990 | 16,593 | **+603** |
| 진화 정보 (`evolution_lines.json`) | 11,359 | 11,841 | +482 |
| 트레이너 분류 (`trainer_categories.json`) | 3,910 | 4,020 | +110 |
| 시판덱 제품 목록 (`korean_decks_catalog.json`) | 79 | 82 | +3 |
| 시판덱 60장 프리셋 (`starter_deck_presets.json`) | 11 | 14 | +3 |

- 기존 레코드는 수정·삭제 0건입니다. 다섯 파일 모두 기존 배열이 앞부분에 그대로 남아 있고 신규 항목만 뒤에 붙었습니다(프로그램으로 대조함).
- 시판덱 제품 목록만 예외로, 공식 목록 순서(최신순)에 맞춰 신규 3건을 앞에 넣었습니다.
- 기존 데이터의 오류 수정도 0건입니다. 발견한 문제는 §5에 기록만 했습니다.

## 1. 기존 구조

| 파일 | 형태 | 키·참조 관계 |
|---|---|---|
| `korean_cards_db.json` | 압축 JSON 배열 | `bs_code`가 기본 키 |
| `evolution_lines.json` | 배열 (들여쓰기 2) | 포켓몬 카드와 `bs_code`로 1:1 대응. `base_kr`(종 이름)과 `evolvesFrom_kr`(진화 전 종 이름)으로 이름 기반 연결 |
| `trainer_categories.json` | 배열 | 트레이너·스타디움 카드와 `bs_code`로 1:1 대응. `subtype`, `tags` 11종 |
| `korean_decks_catalog.json` | 객체 | 제품 목록(이름·이미지·구매 링크·시리즈). 카드 참조는 없음 |
| `starter_deck_presets.json` | 객체 | 60장 구성표. `cards[].bs_code`가 카드 DB를 참조 |

- 이전 마지막 갱신일은 2026-04-08(카드·진화·분류·제품 목록)과 2026-04-13(프리셋)입니다.
- 앱은 보유 카드와 저장 덱을 `bs_code` 키로 저장합니다.

## 2. 추가한 카드 (603장)

| 접두 | 제품 | 국내 발매 | 장수 | 번호 |
|---|---|---|---:|---|
| BS2026002 | MEGA 확장팩 「니힐제로」 (M3) 누락분 | 2026-03-13 | 36 | 081–116 (기존 DB는 001–080만 있었음) |
| BS2026003 | MEGA 확장팩 「닌자스피너」 (M4) | 2026-05-01 | 120 | 001–120 |
| BS2026004 | MEGA 확장팩 「어비스아이」 (M5) | 2026-06-26 | 118 | 001–118 |
| BS2026005 | MEGA 확장팩 「스톰에메랄다」 (M6) | 2026-08-21 | 110 | 001–113 (072·074·076번 없음, §4) |
| BS2026006 | MEGA 확장팩 「30th CELEBRATION」 (M6a) | 2026-09-16 | 131 | 001–135 (119·128·129·131번 미수록, §4) |
| BS2026007 | MEGA 스타터 세트 ex 「이브이 ex」 | 2026-09-30 | 21 | 001–021 |
| BS2026008 | MEGA 스타터 세트 ex 「조로아&조로아크 ex」 | 2026-09-30 | 21 | 001–021 |
| BS2026009 | MEGA 스타터 세트 ex 「나오하&마스카나 ex」 | 2026-09-30 | 19 | 001–019 |
| MP000000040–069 | 프로모 27장 | — | 27 | ex 스페셜 세트 9, 프로모 팩 제4탄 7·제5탄 7, FUTURISTIC BOX 피카츄 ex 2, 메가페스타 2026 1, 2026 코리안리그 파이널 1 |

카드 종류별로는 포켓몬 482, 트레이너 100, 스타디움 10, 에너지 11장입니다.

**수집 방식과 정확도**
- `scripts/parse_card_detail.py`는 상세 페이지를 기존 DB와 같은 필드 순서·텍스트 형식으로 변환합니다.
- 기존 카드 160장을 무작위로 뽑아 다시 파싱했더니 **159장이 기존 레코드와 완전히 같았습니다.**
  - 나머지 1장은 기존 DB 쪽 오류입니다(§5).

## 3. 진화 정보, 트레이너 분류, 시판덱

**진화 정보 (482건)**
- 공식 상세 페이지에는 "무엇에서 진화하는지"가 나오지 않습니다. 그래서 기존 진화 데이터에서 같은 이름이나 같은 종의 기록을 찾아 이어 붙였고, 근거를 `source`에 따로 표시했습니다.

| source | 건수 | 근거 |
|---|---:|---|
| `derived-name` | 405 | 같은 카드명이 기존 데이터에 있음 → `base_kr`·`evolvesFrom_kr`를 그대로 사용 |
| `derived-species` | 44 | 같은 종(`base_kr`)의 기존 진화 기록이 있음 (주로 신규 메가진화 ex) |
| `derived-basic` | 33 | 카드 종류가 기본 포켓몬이라 진화 전이 없음 |
| `unmatched` | 0 | — |

- 규칙 정확도를 기존 데이터에 대입해 측정했습니다.
  - `stage` 판정: 10,948 / 10,948 (100%)
  - `base_kr` 판정: 10,934 / 10,948 (99.9%). 틀린 14건은 모두 XY 시대 "M○○ EX" 표기라 이번 신규 카드와 무관합니다.
- 새 `source` 값 3종(`derived-*`)을 검증 스크립트에 추가했습니다. 앱과 덱 엔진은 `source`를 읽지 않습니다.

**트레이너 분류 (110건)**
- 기존에 있던 이름의 재수록 55건: 기존 태그를 그대로 썼습니다.
- 처음 나온 이름 55건: 효과문 키워드 규칙(`scripts/trainer_tags.py`)으로 태그를 붙였습니다.
  - 이 규칙을 기존 데이터에 대입하면 태그 묶음이 완전히 같은 비율이 80.5%입니다.
  - 일치하지 않는 부분은 기존 태그 자체의 불일치가 큽니다(§5).

**시판덱 (3종)**
- 제품 목록과 60장 구성표를 따로 관리했습니다.
- 제품 목록(`korean_decks_catalog.json`)에는 공식 구축덱 페이지의 이름과 이미지 URL로 3건을 추가했습니다.
  - 구매 링크는 공식 페이지에 없어서 `buy_url: null`로 두었습니다.
- 60장 구성표(`starter_deck_presets.json`)는 공식 제품 상세 이미지의 「덱 리스트 총 60장」 표를 옮겨 적었습니다.
  - 원본 표기는 `docs/decklists/2026-09_mega_starter_ex.json`에 출처와 함께 보관했습니다.
  - 61행 모두 인쇄 번호와 카드명이 DB와 동시에 일치했고, 세 덱 모두 합계 60장입니다.
  - 추정치나 보정한 수량은 없습니다.

## 4. 미확인·누락 데이터

| 대상 | 상태 | 조치 |
|---|---|---|
| 30th CELEBRATION 119·128·129·131 (짜랑고우거 AR, 뮤츠 ex·뮤 ex·팬텀 ex SAR) | 카드 이미지는 공식 서버에 있지만 상세 페이지가 HTTP 500을 냄 | **추가하지 않음.** 기술·비용 원문을 확인할 수 없어서 공식 페이지가 고쳐지면 다시 수집 |
| 스톰에메랄다 072·074·076, 프로모 MP060–062 | 상세 페이지와 이미지 모두 없음 | 공식 사이트에 없는 번호로 판단 |
| 30th CELEBRATION 동봉 기본 에너지 | 제품 설명에 "기본 에너지 1장 포함"이라고 되어 있으나 135번까지 에너지 카드가 없음 | 별도 번호 체계일 수 있음. 미확인 |
| 신규 시판덱 3종의 구매 링크 | 공식 페이지에 없음 | `null` |

## 5. 기존 데이터 문제 (수정하지 않고 기록만 함)

`node scripts/validate-data.js` 결과입니다. 차단 오류는 0건입니다.

| 검사 | 건수 | 내용 |
|---|---:|---|
| 일러스트레이터 | 1 | `MP000000013`: 공식 표기는 "0313"인데 DB에는 "313"(숫자로 변환되면서 0이 빠진 것으로 보임) |
| `evolution_unresolved` | 44 | 진화 전 이름 "불비달마 V"가 DB 표기 "가라르 불비달마 V"와 다름. 모두 B-only 항목 |
| `evolution_stage_without_from` | 68 (신규 3건은 화석 포켓몬이라 정상) | 1·2진화인데 진화 전 정보가 없음 |
| `attack_damage_without_cost` | 16 | 데미지는 있는데 에너지 비용이 비어 있음 (예: `SP000000186`) |
| `pokemon_without_skills` | 6 | V-UNION 조각 5장, 그리고 `BS2018003066` 모부기(기술 누락 의심) |
| `set_number_ordinal` | 305 | `bs_code` 끝 번호와 `card_no`가 다름(하이클래스팩 등 공식 번호 체계) |
| 트레이너 태그 불일치 | 다수 | 예: 「투로박사의 시나리오」는 드로우 효과가 없는데 `draw_support`, 「서퍼」·「이노」는 드로우 카드인데 태그 없음 |
| 기존 프리셋 3종 | 3 | 커밋 `0e7ddd4` 기록상 테라스탈 뮤츠 ex·메가팬텀 ex·메가디안시 ex는 일부 수량이 추정이고 에너지로 60장을 맞춤. 공식 구성표 이미지로 재확인 권장 |

## 6. 검증과 테스트

| 항목 | 결과 |
|---|---|
| 카드 ID 중복·형식 | ✅ 0건 |
| 카드명·세트 번호 | ✅ 신규 603장 모두 상세 페이지의 이름과 인쇄 번호에서 가져옴 |
| 진화 참조 무결성 | ✅ 신규 482건 모두 `evolvesFrom_kr`가 실제 종과 이어짐. 미해결 0건 |
| 기술 에너지 형식 | ✅ 표준 타입만 사용. `0코스트` 5건은 기존 표기와 같음 |
| 트레이너 분류 1:1 대응 | ✅ |
| 프리셋 14종 60장, 모든 `bs_code` 존재 | ✅ |
| 기존 보유 카드·저장 덱 호환성 | ✅ 기존 ID 변경 0건. 기존 레코드 바이트 동일 |
| 덱 엔진으로 신규 프리셋 검증 | ✅ 세 덱 모두 `inspect` 통과, `compareReference` 결과는 `unchanged` |

실행한 명령과 결과:
- `node --test tests/deck-engine.test.js tests/data-integrity.test.js`: 35 pass / 0 fail
- `node tests/simulate-owned.js`: total 60, errors []
- `node scripts/validate-data.js`: OK, no blocking errors

## 7. 앱·덱 엔진에서 따로 대응할 사항 (이번 작업에서는 수정하지 않음)

1. **캐시 버전 (반영함)**: `app.js`는 카드·진화·트레이너 데이터를 IndexedDB에 버전 키로 캐시합니다. 사용자 승인을 받아 다음 값을 올렸습니다.
   - `DB_VERSION` `v4-1`→`v4-2`, `EVOLUTION_VERSION`·`TRAINER_CAT_VERSION` `s14-1`→`s14-2`
   - `index.html`의 `app.js?v=studio2`→`studio3`
   - 이제 기존 사용자도 다음 접속 때 새 데이터를 받습니다. 보유 카드·저장 덱 키(`SK='ptcg-v4'`)는 바꾸지 않았습니다.
   - 이전 버전 캐시(`cards-v4-1` 등)는 IndexedDB에 남습니다. 정리 로직은 없습니다.
2. **`0코스트` 기술**: 엔진은 이 기술을 공격 후보에서 뺍니다. 기존 126건에 신규 5건이 더해졌습니다(루리리, 알로라 나옹, 푸푸린).
3. **화석 아이템**: 신규 「오래된 두개의화석」「오래된 방패의화석」은 아이템이지만 HP60 기본 포켓몬처럼 필드에 냅니다. 엔진은 이를 기본 포켓몬으로 세지 않습니다.
4. **새 카드 종류 표기 `기본 포켓몬 |  ex`**: FUTURISTIC BOX 피카츄 ex 2장에 쓰였습니다. 기존 `포켓몬 ex`와 표기가 다르므로, ex 판별을 문자열 일치로 한다면 확인이 필요합니다. `basic()`의 `/^기본/` 판별은 그대로 동작합니다.
5. **기술을 주는 도구 「메가레쿠쟈캡」**: 붙인 포켓몬이 이 카드에 적힌 기술을 쓸 수 있게 합니다(기술머신과 같은 방식). 엔진은 도구에 적힌 기술을 공격 후보로 보지 않습니다.
6. **엔진의 보수적 구성**: 공식 스타터 덱 60장을 보유했다고 가정하고 자동 구성하면 37~41장 덱이 나옵니다(주력 포켓몬은 로토무·샤크니아·쉐이미). 데이터 문제는 아니지만, 시판덱 기준 추천 품질은 별도로 점검할 만합니다.

## 8. 변경 파일

| 파일 | 변경 |
|---|---|
| `data/korean_cards_db.json` | +603 (덧붙이기만 함) |
| `data/evolution_lines.json` | +482 (덧붙이기만 함) |
| `data/trainer_categories.json` | +110 (덧붙이기만 함) |
| `data/korean_decks_catalog.json` | 제품 +3, `count` 82, `updated_at` 추가 (`scraped_at`은 원래 값 유지) |
| `data/starter_deck_presets.json` | 프리셋 +3 |
| `docs/decklists/2026-09_mega_starter_ex.json` | 공식 구성표 원본 표기와 출처 |
| `scripts/parse_card_detail.py`, `fetch_cards.py`, `build_update.py`, `trainer_tags.py`, `add_presets.py` | 수집·변환 도구 |
| `scripts/validate-data.js`, `scripts/merge-cards.js` | 검증, 덧붙이기만 하는 병합 |
| `tests/data-integrity.test.js` | 무결성·병합 테스트, 건수 기준선 갱신 |
| `.gitignore` | `__pycache__/` |
| `app.js`, `index.html` | 캐시 버전 문자열 4곳만 변경 (사용자 승인) |
| `deck-engine.js` | 변경 없음 |

## 9. 향후 자동 업데이트

같은 절차를 정기적으로 실행할 수 있습니다.

```bash
python3 -I scripts/fetch_cards.py --cache .cache/cards BS2026010 MP0000000 --start 1 > new.jsonl
```

```bash
python3 -I scripts/build_update.py new.jsonl update.json --source https://pokemoncard.co.kr/cards/detail/ --verified-at YYYY-MM-DD
```

```bash
node scripts/merge-cards.js update.json
```

```bash
node scripts/merge-cards.js update.json --write
```

```bash
node scripts/validate-data.js && node --test tests/data-integrity.test.js tests/deck-engine.test.js
```

- 새 확장팩은 다음 접두(`BS2026010`부터)에서 001번이 존재하는지로 감지합니다. 프로모는 `--start`로 마지막 번호 다음부터 수집합니다.
- 결과는 사람이 검토하는 PR로 올리고, main에 자동으로 병합하지 않습니다.
- 사람이 해야 하는 일은 두 가지입니다.
  - 시판덱 60장 구성표: 공식 이미지를 옮겨 적은 뒤 `add_presets.py`가 번호·이름을 대조합니다.
  - `app.js` 캐시 버전과 `index.html`의 `app.js?v=` 올리기.
- 공식 상세 페이지가 HTTP 500을 내는 카드(§4)는 다음 실행 때 자동으로 다시 시도합니다(캐시에 저장하지 않음).
