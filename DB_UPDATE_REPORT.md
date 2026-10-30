# 한국어 카드 DB 업데이트 보고서

- 기준일: **2026-10-30**
- 작업 브랜치: `claude/peaceful-goodall-nhbklc` (시작 커밋 `21fba93`, `origin/main`과 같음)
- 결과 요약: **신규 카드 0건, 신규 시판덱 0건, 기존 데이터 수정 0건.** 공식 사이트에 접속할 수 없어서 카드 단위 데이터를 확인하지 못했습니다. 추측으로 카드를 만들지 않는다는 원칙에 따라 카드 DB 5개 파일은 바꾸지 않았습니다. 대신 누락 제품 목록, 검증 도구, 증분 병합 도구, 테스트를 추가했습니다.

## 1. 기존 구조 분석

| 파일 | 형태 | 건수 | 출처 / 갱신일 | 참조 관계 |
|---|---|---|---|---|
| `korean_cards_db.json` | 압축 JSON 배열 | 15,990장 (포켓몬 11,359 / 트레이너 3,625 / 스타디움 285 / 에너지 721), 접두 277개 | pokemoncard.co.kr 카드 검색, 이미지는 `cards.image.pokemonkorea.co.kr` / 2026-04-08~09 커밋 | 기본 키 `bs_code` |
| `evolution_lines.json` | 배열(들여쓰기 2) | 11,359 | 두 출처를 대조함(`source`: agreed·agreed-basic·A-only·B-only·unmatched) / 2026-04-08 | `bs_code` → 카드 DB 포켓몬과 1:1, `evolvesFrom_kr` → 다른 항목의 `base_kr`/`name_kr` |
| `trainer_categories.json` | 배열 | 3,910 | 효과문 기반 분류(`subtype`, `tags` 11종) / 2026-04-08 | `bs_code` → 트레이너+스타디움과 1:1 |
| `korean_decks_catalog.json` | 객체 | 79개 제품 | `pokemoncard.co.kr/card/category/info2`, `scraped_at` 2026-04-08 | 제품 목록만 있고 카드 참조는 없음. 앱이 읽지 않음 |
| `starter_deck_presets.json` | 객체 `version: s17f` | 11개 프리셋(각 60장) | 2026-04-13 | `cards[].bs_code` → 카드 DB |

DB의 마지막 데이터:
- 확장팩: `BS2026002` MEGA 「니힐제로」(M3, 80장)
- 시판덱: `BS2026001` 「스타트 덱 100 배틀컬렉션」(773장)
- 프로모: `MP000000039`

앱(`app.js`)은 GitHub Pages URL로 카드 DB·진화·트레이너·프리셋을 불러와 IndexedDB에 캐시합니다. 사용자의 보유 카드와 저장 덱은 `bs_code`를 키로 Firestore/로컬에 저장됩니다. 그래서 기존 ID를 바꾸거나 지우면 사용자 데이터가 깨집니다.

## 2. 최신 데이터 조사 결과와 차단 사항

**조사 환경의 제약:**
- 이 작업 환경의 네트워크 정책이 `pokemoncard.co.kr`과 `cards.image.pokemonkorea.co.kr`를 차단했습니다(CONNECT 403). 웹 조회 도구에서도 같은 호스트가 DNS 실패로 막혔습니다.
- namu.wiki, pokepolio 등 보조 출처도 모두 차단됐습니다.
- 사용할 수 있었던 것은 웹 검색 결과의 요약뿐입니다. 이것으로는 카드명, HP, 기술, 에너지 비용, 진화 정보 같은 카드 단위 원문을 확인할 수 없습니다.
- robots.txt와 이용약관도 같은 이유로 확인하지 못했습니다. 다음 수집 때 먼저 확인해야 합니다.

**제품 단위로 확인된 누락 후보** (자세한 내용과 출처는 `data/pending_releases.json`):

| 제품 | 국내 발매 | 상태 |
|---|---|---|
| MEGA 확장팩 「니힐제로」(M3) | 2026-03-13 | DB에 001–080만 있음. 시크릿 레어(081 이후)가 누락됐을 수 있음 |
| MEGA 확장팩 「닌자스피너」 | 2026-05-01 (카드샵 선행 04-25) | 공식 페이지 `pokemoncard.co.kr/card/887`에서 발매 확인. 카드 미수집 |
| MEGA 확장팩 「어비스아이」 | 미확인 | 한글판이 유통되는 것만 확인. 날짜·코드 미확인 |
| MEGA 확장팩 「스톰에메랄다」 | 2026-08-21 (보조 출처) | 미확인 |
| MEGA 확장팩 「30th CELEBRATION」 | 2026-09-16 | 포켓몬스토어 페이지에서 확인. 카드 미수집 |
| MEGA 스타터 세트 ex 3종 (이브이 ex / 조로아&조로아크 ex / 나오하&마스카나 ex) | 09-26 또는 09-30 (출처 불일치) | 60장 구성표를 확인하지 못해 프리셋을 만들지 않음 |
| FUTURISTIC BOX | 10-07 또는 10-01 (출처 불일치) | 구성 미확인 |
| MEGA 프로모 MP040 이후 | 미확인 | 조사하지 못함 |

`korean_decks_catalog.json`도 2026-04-08 이후 제품이 빠져 있습니다. 이미지와 구매 URL을 공식 페이지에서 확인할 수 없어서 항목을 추가하지 않았습니다.

## 3. 증분 업데이트

- 카드, 진화, 트레이너 분류, 시판덱 목록, 프리셋 모두 **추가 0건**입니다.
- 5개 데이터 파일의 SHA-256이 작업 전후로 같습니다.
- 다음 작업자를 위해 `scripts/merge-cards.js`를 추가했습니다. 이 도구는 기존 데이터에 덧붙이기만 합니다.
  - 기존 `bs_code`가 들어오면, 내용이 같을 때는 건너뛰고 다를 때는 병합을 거부합니다. 수정 사항은 이 보고서에 따로 기록해야 합니다.
  - 신규 포켓몬에 진화 항목이 없으면 거부합니다. 신규 트레이너에 분류 항목이 없어도 거부합니다.
  - 신규 진화 항목의 `evolvesFrom_kr`가 어떤 카드와도 이어지지 않으면 거부합니다.
  - 출처 URL과 확인일(`source`, `verified_at`)이 없으면 거부합니다.
  - 병합 결과는 임시 복사본에서 검증합니다. 통과해야만 `--write`로 기록합니다. 직렬화 형식은 기존 파일과 바이트 단위로 같아서 diff에는 추가된 내용만 나타납니다.

## 4. 기존 데이터 오류 (수정하지 않고 기록만 함)

`node scripts/validate-data.js` 결과입니다. 차단 오류는 0건이고 경고는 아래와 같습니다.

| 검사 | 건수 | 내용 |
|---|---|---|
| `set_number_ordinal` | 305 | `bs_code` 끝 3자리와 `card_no`가 다름(S10a·S9a·SM5+·SML_·S11 등). 공식 사이트의 고유 번호 체계로 보이며 오류가 아닐 수 있음 |
| `set_total` | 55 | 표시 번호가 세트 총수보다 큼. 시크릿 레어로 보이며 정상일 가능성이 높음 |
| `attack_cost_legacy_token` | 236 | 비용이 `0코스트`·`플러스`·`-`. 엔진은 미지원 비용으로 보고 이 기술을 제외함(§7) |
| `pokemon_without_skills` | 6 | V-UNION 조각 5장, 그리고 `BS2018003066` 모부기(기술 누락으로 의심) |
| `attack_damage_without_cost` | 16 | 데미지는 있는데 `cost`가 없음(예: `BS2023017001`, `SP000000186`). 원본에서 빠진 것으로 의심 |
| `evolution_unresolved` | 44 | `evolvesFrom_kr`가 "불비달마 V"처럼 DB 표기("가라르 불비달마 V")와 다름. 모두 B-only |
| `evolution_stage_without_from` | 68 | 1·2진화인데 진화 전 이름이 없음(agreed-basic 46, unmatched 22) |
| 트레이너 분류 | 2 | M3 「오래된 지느러미화석」·「오래된 턱화석」이 `subtype: item`으로 분류됨. 기존 화석 3장은 `fossil`. 「오래된 턱화석」의 `tool_defensive` 태그도 효과(기본 포켓몬처럼 필드에 냄)와 맞지 않음 |

## 5. 검증

| 항목 | 결과 |
|---|---|
| 카드 ID 중복 / 형식 | ✅ 0건 |
| 카드명(누락·공백) / card_class | ✅ 0건 |
| 세트 번호 | ✅ 차단 오류 0건, 경고는 §4 |
| 진화 참조 무결성 (1:1 대응, 고아 0, 이름 일치, stage/source 값) | ✅ (미해결 이름 44건은 경고) |
| 기술 에너지 형식 (배열, 허용 타입) | ✅ (기존 토큰 236건은 경고) |
| 트레이너 분류 1:1 대응·태그 값 | ✅ |
| 프리셋 11종 60장, 모든 `bs_code` 존재 | ✅ |
| 기존 보유 카드·저장 덱 호환성 | ✅ 기존 ID 변경·삭제 0건. `test_autobuild.js`의 보유 카드 ID가 모두 DB에서 찾아짐 |
| 전후 건수 비교 | 카드 15,990 → 15,990 / 진화 11,359 → 11,359 / 트레이너 3,910 → 3,910 / 제품 79 → 79 / 프리셋 11 → 11 |

## 6. 테스트 결과

```
node --test tests/deck-engine.test.js     # 28 pass / 0 fail (기존 회귀 테스트, 작업 전후 같음)
node --test tests/data-integrity.test.js  # 7 pass / 0 fail (신규)
node tests/simulate-owned.js              # total 60, errors []
node scripts/validate-data.js             # OK: no blocking errors
```

## 7. 덱 생성 엔진에서 따로 대응할 사항 (엔진은 수정하지 않음)

1. **`0코스트` 기술**: 엔진은 `cost` 토큰이 에너지 타입이나 `무색`일 때만 공격으로 인정합니다. 그래서 `['0코스트']` 기술 126건이 공격 후보에서 빠집니다. 공격 후보로 쓰려면 `0코스트`를 빈 비용으로 해석해야 합니다. `플러스`(103건)와 `-`(7건)도 해석 규칙을 정해야 합니다.
2. **화석 아이템(M3 「오래된 ○○화석」)**: 효과상 HP60 무색 기본 포켓몬처럼 필드에 냅니다. 엔진의 `basic()`은 `card_class==='pokemon'`만 기본 포켓몬으로 셉니다. 이 카드를 시작 포켓몬 확률 계산에 넣을지 정해야 합니다. 트레이너 분류는 `fossil`로 맞추는 것을 권장합니다.
3. **도구(`포켓몬의 도구`)·스타디움의 subtype이 `null`**: 별도 `tool`/`stadium` subtype이 없습니다. 엔진이 card_type 문자열로 구분하고 있는지 확인해야 합니다.
4. **룰 박스가 skills에 섞여 있음**: "메가진화 ex 룰" 같은 텍스트가 cost 없는 skill로 저장돼 있습니다. 엔진은 cost가 없는 항목을 무시하므로 지금은 문제없습니다. 특성 판별 로직을 추가하면 이 둘을 구분해야 합니다.
5. **신규 세트(닌자스피너 이후)의 새 메커니즘**: 카드 원문을 확인하지 못해서 새 규칙(예: 새 룰 박스나 카드 구분)이 있는지 판단할 수 없습니다. 카드를 수집할 때 `card_type` 문자열에 새 값이 나오면 `basic()`의 `/^기본/` 판별과 진화 단계 매핑을 다시 점검해야 합니다.

## 8. 변경 파일

- `DB_UPDATE_REPORT.md` (신규): 이 보고서
- `data/pending_releases.json` (신규): 누락 제품을 제품 단위로 추적. 카드 데이터 없음, 앱이 읽지 않음
- `scripts/validate-data.js` (신규): 읽기 전용 무결성 검사
- `scripts/merge-cards.js` (신규): 덧붙이기만 하는 증분 병합(기본은 dry-run)
- `tests/data-integrity.test.js` (신규): 데이터 무결성과 병합 회귀 테스트
- `app.js`, `deck-engine.js`, `index.html`, 기존 `data/*.json` 5개: **변경 없음**

## 9. 향후 자동 업데이트

자동화는 가능합니다. 다만 수집 경로를 먼저 열어야 합니다.

1. 실행 환경의 네트워크 허용 목록에 `pokemoncard.co.kr`, `cards.image.pokemonkorea.co.kr`, `data1.pokemonkorea.co.kr`를 추가하고, robots.txt와 이용약관을 확인합니다.
2. 수집기는 카드 검색 결과를 `merge-cards.js` 입력 형식(`source`, `verified_at`, `cards`, `evolution`, `trainer_categories`)으로 바꿉니다. 진화와 트레이너 분류는 기존 규칙을 쓰고, 분류가 불확실한 카드는 `source: "unmatched"`나 빈 `tags`로 둡니다.
3. 정기 실행(예: 매주) 순서: dry-run → `validate-data.js` → `node --test` → 사람이 검토하는 PR. main에 자동으로 병합하지 않습니다.
4. 시판덱 프리셋은 공식 구성표(60장 리스트)를 사람이 확인해야만 추가합니다. 자동으로 만들지 않습니다.
