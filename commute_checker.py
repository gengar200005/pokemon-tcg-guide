"""
이촌동 → 58개 생활권 출근 소요시간 계산기
- 카카오 Mobility Directions API 사용
- 평일 오전 7:30 출발 기준 (8시 도착 목표)
- 결과를 Notion DB '출근소요시간(분)' 컬럼에 자동 저장

사용법:
  1. NOTION_TOKEN 설정 (아래 안내 참고)
  2. pip install requests
  3. python commute_checker.py

[Notion 토큰 발급 방법]
  1. https://www.notion.so/my-integrations 접속
  2. '새 API 통합 만들기' 클릭 → 이름 입력(예: 개원입지분석) → 저장
  3. 'Internal Integration Token' 복사
  4. 본인의 Notion DB 페이지 우측 상단 '...' → '연결' → 위에서 만든 통합 추가
  5. 아래 NOTION_TOKEN에 붙여넣기
"""

import requests
import time
from datetime import datetime, timedelta

# ── 설정 ──────────────────────────────────────────────────────────────
KAKAO_API_KEY = "addaa3e64ad60350f7d5eabace148cd4"
NOTION_TOKEN  = "YOUR_NOTION_INTEGRATION_TOKEN"   # ← 여기에 입력
DATABASE_ID   = "a3499e3f034f4111beed0201cca446ad"

# 출발지: 이촌1동 주민센터 (경도, 위도)
ORIGIN_X = 126.9718
ORIGIN_Y = 37.5224

# 출발 시각: 다음 평일(화요일) 오전 7:30
def next_tuesday_730am() -> str:
    today = datetime.now()
    days_ahead = (1 - today.weekday()) % 7   # 1 = 화요일
    if days_ahead == 0:
        days_ahead = 7
    dt = today.replace(hour=7, minute=30, second=0, microsecond=0) + timedelta(days=days_ahead)
    return dt.strftime("%Y%m%d%H%M%S")

# ── 58개 생활권 데이터 ─────────────────────────────────────────────────
ZONES = [
    # 서울 (25개 구)
    {"name": "서울 종로구",    "page_id": "34214f343a5681d9be97e679fea9a80f", "query": "종로구청"},
    {"name": "서울 중구",      "page_id": "34214f343a56812a9118e523bf53c305", "query": "서울 중구청"},
    {"name": "서울 용산구",    "page_id": "34214f343a56813c9afdf2fb7239904e", "query": "용산구청"},
    {"name": "서울 성동구",    "page_id": "34214f343a5681c2aeb4e6f1764df9df", "query": "성동구청"},
    {"name": "서울 광진구",    "page_id": "34214f343a568156baadd1dab2a71ef2", "query": "광진구청"},
    {"name": "서울 동대문구",  "page_id": "34214f343a5681398128cacc1b7a5b28", "query": "동대문구청"},
    {"name": "서울 중랑구",    "page_id": "34214f343a5681f2bd8ef11912c4ff0a", "query": "중랑구청"},
    {"name": "서울 성북구",    "page_id": "34214f343a568149b43cea1f88e534c8", "query": "성북구청"},
    {"name": "서울 강북구",    "page_id": "34214f343a568186b990cc3a324fc0ed", "query": "강북구청"},
    {"name": "서울 도봉구",    "page_id": "34214f343a5681de8f71f093b16f5f01", "query": "도봉구청"},
    {"name": "서울 노원구",    "page_id": "34214f343a56812fb405c059518d4b28", "query": "노원구청"},
    {"name": "서울 은평구",    "page_id": "34214f343a56819a976cc62d38aab51e", "query": "은평구청"},
    {"name": "서울 서대문구",  "page_id": "34214f343a568118ade1c25401f8c45f", "query": "서대문구청"},
    {"name": "서울 마포구",    "page_id": "34214f343a5681fab394d8eea0e1a849", "query": "마포구청"},
    {"name": "서울 양천구",    "page_id": "34214f343a5681ac94f5d531a5b119d9", "query": "양천구청"},
    {"name": "서울 강서구",    "page_id": "34214f343a5681588adef51aabbeca32", "query": "강서구청"},
    {"name": "서울 구로구",    "page_id": "34214f343a5681a5ae1cf60619e0508e", "query": "구로구청"},
    {"name": "서울 금천구",    "page_id": "34214f343a56813abf96f7c0c06a4371", "query": "금천구청"},
    {"name": "서울 영등포구",  "page_id": "34214f343a568185a8f8e0e6217eac3e", "query": "영등포구청"},
    {"name": "서울 동작구",    "page_id": "34214f343a5681e798bfc284b5b696c6", "query": "동작구청"},
    {"name": "서울 관악구",    "page_id": "34214f343a56812b8cc6d489ab7d8ea5", "query": "관악구청"},
    {"name": "서울 서초구",    "page_id": "34214f343a5681f2874bd35b17539e23", "query": "서초구청"},
    {"name": "서울 강남구",    "page_id": "34214f343a56816f8909c4612d41f5b8", "query": "강남구청"},
    {"name": "서울 송파구",    "page_id": "34214f343a56812ab927d4d48b4a59bc", "query": "송파구청"},
    {"name": "서울 강동구",    "page_id": "34214f343a568126b452f15ba77e50bc", "query": "강동구청"},
    # 경기 (구 단위, 11개)
    {"name": "경기 고양시 덕양구",   "page_id": "34214f343a5681fcbd38e6a9fa362434", "query": "덕양구청"},
    {"name": "경기 고양시 일산동구", "page_id": "34214f343a56813bb322f48b6b2dfc43", "query": "일산동구청"},
    {"name": "경기 고양시 일산서구", "page_id": "34214f343a5681fcacaef56306ba9454", "query": "일산서구청"},
    {"name": "경기 부천시 원미구",   "page_id": "34214f343a5681138026f1315ff3fb11", "query": "부천시 원미구청"},
    {"name": "경기 부천시 소사구",   "page_id": "34214f343a568132900ae6e1ee9e4c0c", "query": "부천시 소사구청"},
    {"name": "경기 부천시 오정구",   "page_id": "34214f343a5681f0bd7cd39f958fc42d", "query": "부천시 오정구청"},
    {"name": "경기 안양시 만안구",   "page_id": "34214f343a56816c8ccae6824cb672f4", "query": "안양시 만안구청"},
    {"name": "경기 안양시 동안구",   "page_id": "34214f343a5681759e7dcae96292b8de", "query": "안양시 동안구청"},
    {"name": "경기 성남시 수정구",   "page_id": "34214f343a568103a885f79522a4c316", "query": "성남시 수정구청"},
    {"name": "경기 성남시 중원구",   "page_id": "34214f343a56819d93d8ee81605f58af", "query": "성남시 중원구청"},
    {"name": "경기 성남시 분당구",   "page_id": "34214f343a5681fbab55ca9354542262", "query": "성남시 분당구청"},
    # 경기 생활권 (20개)
    {"name": "광명 광명·하안·소하 생활권", "page_id": "34214f343a56812b9b05f60fac734f25", "query": "광명시청"},
    {"name": "광명 철산·일직 생활권",      "page_id": "34214f343a5681e9b433c0f18f1b0a1b", "query": "광명시 철산동"},
    {"name": "과천 과천시 전체",            "page_id": "34214f343a56812a81dff63b79972557", "query": "과천시청"},
    {"name": "군포 산본 생활권",            "page_id": "34214f343a5681a98989cdef8768b097", "query": "군포시 산본동"},
    {"name": "군포 당동·당정 생활권",      "page_id": "34214f343a568148813af01507dfa987", "query": "군포시 당동"},
    {"name": "의왕 내손·청계 생활권",      "page_id": "34214f343a56812b81dfe0ffdffd9f5f", "query": "의왕시 내손동"},
    {"name": "의왕 오전·부곡 생활권",      "page_id": "34214f343a5681438e28ec5d8a43f621", "query": "의왕시 오전동"},
    {"name": "구리 교문·수택 생활권",      "page_id": "34214f343a568130b952e833e4729120", "query": "구리시청"},
    {"name": "구리 갈매·인창 생활권",      "page_id": "34214f343a568191a645f34db1845d72", "query": "구리시 갈매동"},
    {"name": "하남 미사·감일 생활권",      "page_id": "34214f343a56817d8cb8e4cf7ddf98bd", "query": "하남시 미사동"},
    {"name": "하남 하남구도심 생활권",     "page_id": "34214f343a5681019aabdbb3cd501f14", "query": "하남시청"},
    {"name": "남양주 다산·별내 생활권",    "page_id": "34214f343a5681a69cc0e6f3462aeb39", "query": "남양주시 다산동"},
    {"name": "남양주 호평·평내 생활권",    "page_id": "34214f343a5681a68bc0f9fda6d9418c", "query": "남양주시 호평동"},
    {"name": "남양주 진접·오남 생활권",    "page_id": "34214f343a5681bdb960e789c7658c35", "query": "남양주시 진접읍"},
    {"name": "남양주 와부·화도 생활권",    "page_id": "34214f343a5681faa93ff4c12371a491", "query": "남양주시 와부읍"},
    {"name": "광주 경안 시내권",            "page_id": "34214f343a56812196a1d44ace0a54f5", "query": "광주시청 경기"},
    {"name": "광주 오포·태전 생활권",      "page_id": "34214f343a56814ebe84f4f4edda54a3", "query": "광주시 오포읍"},
    {"name": "광주 초월·곤지암 생활권",    "page_id": "34214f343a5681f19e5bd67ff7ba3e0d", "query": "광주시 초월읍"},
    {"name": "김포 한강신도시 생활권",     "page_id": "34214f343a56819da5eef104c8203941", "query": "김포 한강신도시"},
    {"name": "김포 김포구도심 생활권",     "page_id": "34214f343a5681a2a4fcd228ee11bf10", "query": "김포시청"},
    {"name": "김포 고촌·양촌 생활권",     "page_id": "34214f343a5681c88055f599560f1b79", "query": "김포시 고촌읍"},
    {"name": "김포 통진·외곽 생활권",     "page_id": "34214f343a5681ca96a2c223130d7938", "query": "김포시 통진읍"},
]


# ── API 함수 ──────────────────────────────────────────────────────────
def geocode(query: str):
    """카카오 키워드 검색으로 좌표 반환 (x=경도, y=위도)"""
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    res = requests.get(url, headers=headers, params={"query": query, "size": 1}, timeout=10)
    docs = res.json().get("documents", [])
    if docs:
        return float(docs[0]["x"]), float(docs[0]["y"])
    return None, None


def get_driving_minutes(dest_x: float, dest_y: float, departure_time: str) -> int | None:
    """카카오 Mobility Directions API로 자차 소요시간(분) 반환"""
    url = "https://apis-navi.kakaomobility.com/v1/directions"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    params = {
        "origin":         f"{ORIGIN_X},{ORIGIN_Y}",
        "destination":    f"{dest_x},{dest_y}",
        "departure_time": departure_time,
        "priority":       "TIME",
    }
    res = requests.get(url, headers=headers, params=params, timeout=10)
    routes = res.json().get("routes", [])
    if routes and routes[0].get("result_code") == 0:
        secs = routes[0]["summary"]["duration"]
        return round(secs / 60)
    return None


def add_notion_column():
    """Notion DB에 '출근소요시간(분)' 숫자 컬럼 추가"""
    url = f"https://api.notion.com/v1/databases/{DATABASE_ID}"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    }
    body = {"properties": {"출근소요시간(분)": {"number": {"format": "number"}}}}
    res = requests.patch(url, headers=headers, json=body, timeout=10)
    if res.status_code == 200:
        print("✅ Notion 컬럼 추가 완료")
    else:
        print(f"⚠️  컬럼 추가 실패: {res.status_code} {res.text[:200]}")


def update_notion_page(page_id: str, minutes: int):
    """Notion 페이지 출근소요시간(분) 업데이트"""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    }
    body = {"properties": {"출근소요시간(분)": {"number": minutes}}}
    res = requests.patch(url, headers=headers, json=body, timeout=10)
    return res.status_code == 200


# ── 메인 ──────────────────────────────────────────────────────────────
def main():
    if NOTION_TOKEN == "YOUR_NOTION_INTEGRATION_TOKEN":
        print("❌ NOTION_TOKEN을 설정해 주세요 (스크립트 상단 주석 참고)")
        return

    departure = next_tuesday_730am()
    print(f"출발 기준 시각: {departure[:4]}년 {departure[4:6]}월 {departure[6:8]}일 "
          f"{departure[8:10]}:{departure[10:12]} (이촌동 출발)\n")

    add_notion_column()
    print()

    results = []
    for i, zone in enumerate(ZONES, 1):
        x, y = geocode(zone["query"])
        if x is None:
            print(f"[{i:02d}/58] ⚠️  좌표 조회 실패: {zone['name']}")
            results.append((zone["name"], None))
            time.sleep(0.3)
            continue

        mins = get_driving_minutes(x, y, departure)
        if mins is None:
            print(f"[{i:02d}/58] ⚠️  경로 조회 실패: {zone['name']}")
            results.append((zone["name"], None))
            time.sleep(0.3)
            continue

        ok = update_notion_page(zone["page_id"], mins)
        status = "✅" if ok else "⚠️ Notion 업데이트 실패"
        print(f"[{i:02d}/58] {status}  {zone['name']}: {mins}분")
        results.append((zone["name"], mins))
        time.sleep(0.3)  # API rate limit 방지

    # 결과 요약
    print("\n" + "="*50)
    print("▶ 소요시간 순위 (오름차순)")
    print("="*50)
    sorted_results = sorted([(n, m) for n, m in results if m is not None], key=lambda x: x[1])
    for rank, (name, mins) in enumerate(sorted_results, 1):
        bar = "█" * (mins // 5)
        print(f"{rank:2d}위  {name:<24} {mins:3d}분  {bar}")


if __name__ == "__main__":
    main()
