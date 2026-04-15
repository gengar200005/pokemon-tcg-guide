"""
KOSPI 백테스트: 현재 전략 vs Minervini Trend Template  (yfinance 버전)
- 유니버스: KOSPI 주요 ~100종목 (현재 기준, 생존편향 주의)
- 기간: 2018~2024 (7년)
- 리밸런싱: 월말 기준
- 측정: 4주 / 12주 선행 수익률 vs 코스피

Google Colab 실행 방법:
    !pip install yfinance pandas numpy -q
    !python backtest.py
"""

# Google Colab 셀 첫 줄에 아래 명령어 실행 후 이 파일을 실행하세요:
# !pip install yfinance pandas numpy -q

import os
import time
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime

# ── 설정 ───────────────────────────────────────────
START_DATE = "2018-01-01"
END_DATE   = "2024-12-31"
CACHE_DIR  = "bt_cache"

os.makedirs(CACHE_DIR, exist_ok=True)

# ── 1. 유니버스 (KOSPI 시총 상위 ~100 종목) ────────────
# 현재 기준 하드코딩 — 생존편향 존재
KOSPI_TICKERS = [
    ("005930.KS", "삼성전자"),
    ("000660.KS", "SK하이닉스"),
    ("373220.KS", "LG에너지솔루션"),
    ("207940.KS", "삼성바이오로직스"),
    ("005380.KS", "현대차"),
    ("000270.KS", "기아"),
    ("051910.KS", "LG화학"),
    ("006400.KS", "삼성SDI"),
    ("035420.KS", "NAVER"),
    ("105560.KS", "KB금융"),
    ("055550.KS", "신한지주"),
    ("012330.KS", "현대모비스"),
    ("028260.KS", "삼성물산"),
    ("003550.KS", "LG"),
    ("086790.KS", "하나금융지주"),
    ("034730.KS", "SK"),
    ("096770.KS", "SK이노베이션"),
    ("017670.KS", "SK텔레콤"),
    ("316140.KS", "우리금융지주"),
    ("032830.KS", "삼성생명"),
    ("000810.KS", "삼성화재"),
    ("003670.KS", "포스코홀딩스"),
    ("066570.KS", "LG전자"),
    ("030200.KS", "KT"),
    ("015760.KS", "한국전력"),
    ("035720.KS", "카카오"),
    ("012450.KS", "한화에어로스페이스"),
    ("009150.KS", "삼성전기"),
    ("032640.KS", "LG유플러스"),
    ("090430.KS", "아모레퍼시픽"),
    ("010950.KS", "S-Oil"),
    ("003490.KS", "대한항공"),
    ("011170.KS", "롯데케미칼"),
    ("047810.KS", "한국항공우주"),
    ("042660.KS", "한화오션"),
    ("034020.KS", "두산에너빌리티"),
    ("259960.KS", "크래프톤"),
    ("036570.KS", "엔씨소프트"),
    ("021240.KS", "코웨이"),
    ("128940.KS", "한미약품"),
    ("000100.KS", "유한양행"),
    ("068270.KS", "셀트리온"),
    ("018260.KS", "삼성에스디에스"),
    ("010130.KS", "고려아연"),
    ("004020.KS", "현대제철"),
    ("073240.KS", "금호석유"),
    ("024110.KS", "IBK기업은행"),
    ("000720.KS", "현대건설"),
    ("011070.KS", "LG이노텍"),
    ("004170.KS", "신세계"),
    ("047050.KS", "포스코인터내셔널"),
    ("001450.KS", "현대해상"),
    ("078930.KS", "GS"),
    ("036460.KS", "한국가스공사"),
    ("010140.KS", "삼성중공업"),
    ("033780.KS", "KT&G"),
    ("006800.KS", "미래에셋증권"),
    ("352820.KS", "하이브"),
    ("267250.KS", "HD현대"),
    ("329180.KS", "HD현대중공업"),
    ("241560.KS", "두산밥캣"),
    ("338220.KS", "에코프로비엠"),
    ("247540.KS", "에코프로"),
    ("282330.KS", "BGF리테일"),
    ("007070.KS", "GS리테일"),
    ("003230.KS", "삼양식품"),
    ("271560.KS", "오리온"),
    ("030000.KS", "제일기획"),
    ("000150.KS", "두산"),
    ("006360.KS", "GS건설"),
    ("326030.KS", "SK바이오팜"),
    ("302440.KS", "SK바이오사이언스"),
    ("011790.KS", "SKC"),
    ("029780.KS", "삼성카드"),
    ("005870.KS", "한화생명"),
    ("016360.KS", "삼성증권"),
    ("005830.KS", "DB손해보험"),
    ("000080.KS", "하이트진로"),
    ("161390.KS", "한국타이어앤테크놀로지"),
    ("004990.KS", "롯데지주"),
    ("010060.KS", "OCI"),
    ("042670.KS", "HD현대인프라코어"),
    ("004000.KS", "롯데정밀화학"),
    ("000990.KS", "DB하이텍"),
    ("023530.KS", "롯데쇼핑"),
    ("002790.KS", "아모레퍼시픽그룹"),
    ("009830.KS", "한화솔루션"),
    ("001120.KS", "LX인터내셔널"),
    ("251270.KS", "넷마블"),
    ("041510.KS", "에스엠"),
    ("035900.KS", "JYP엔터테인먼트"),
    ("018880.KS", "한온시스템"),
    ("139480.KS", "이마트"),
    ("011200.KS", "HMM"),
    ("034230.KS", "파라다이스"),
    ("003380.KS", "하림지주"),
    ("088350.KS", "한화생명(구)"),
    ("003800.KS", "에쓰씨엔지니어링"),
]

# 중복 제거 후 상위 100개
seen = set()
KOSPI_UNIVERSE = []
for tk, nm in KOSPI_TICKERS:
    if tk not in seen:
        seen.add(tk)
        KOSPI_UNIVERSE.append((tk, nm))
KOSPI_UNIVERSE = KOSPI_UNIVERSE[:100]


# ── 2. 데이터 다운로드 ──────────────────────────────
def load_stock(ticker):
    safe = ticker.replace(".", "_")
    cache = f"{CACHE_DIR}/{safe}.pkl"
    if os.path.exists(cache):
        return pd.read_pickle(cache)
    try:
        df = yf.Ticker(ticker).history(start=START_DATE, end=END_DATE, auto_adjust=True)
        df.index = df.index.tz_localize(None)  # timezone 제거
        if len(df) >= 200:
            df.to_pickle(cache)
        return df
    except Exception as e:
        return pd.DataFrame()

def load_kospi():
    cache = f"{CACHE_DIR}/kospi.pkl"
    if os.path.exists(cache):
        return pd.read_pickle(cache)
    df = yf.Ticker("^KS11").history(start=START_DATE, end=END_DATE, auto_adjust=True)
    df.index = df.index.tz_localize(None)
    df.to_pickle(cache)
    return df


# ── 3. 전략 조건 ────────────────────────────────────
def check_current(c, v, i):
    """현재 전략: MA20/60/120 정배열 + 거래량 1.5배"""
    if i < 121:
        return False
    cur   = c[i]
    ma20  = c[i-20:i].mean()
    ma60  = c[i-60:i].mean()
    ma120 = c[i-120:i].mean()
    if not (cur > ma20 > ma60 > ma120):
        return False
    vol_avg = v[i-20:i].mean()
    return vol_avg > 0 and v[i] >= vol_avg * 1.5

def check_minervini(c, v, i, rs_pct=None):
    """Minervini Trend Template 8조건 + RS 선택"""
    if i < 222:
        return False
    cur      = c[i]
    ma50     = c[i-50:i].mean()
    ma150    = c[i-150:i].mean()
    ma200    = c[i-200:i].mean()
    ma200_1m = c[i-221:i-21].mean()   # 약 1개월 전 200MA

    hi52 = c[max(0, i-252):i].max()
    lo52 = c[max(0, i-252):i].min()

    conds = [
        cur  > ma50,            # ① 가격 > MA50
        cur  > ma150,           # ② 가격 > MA150
        cur  > ma200,           # ③ 가격 > MA200
        ma50 > ma150,           # ④ MA50 > MA150
        ma150 > ma200,          # ⑤ MA150 > MA200
        ma200 > ma200_1m,       # ⑥ MA200 우상향
        cur  >= lo52 * 1.25,    # ⑦ 52주 저점 대비 +25% 이상
        cur  >= hi52 * 0.75,    # ⑧ 52주 고점 대비 -25% 이내
    ]
    if rs_pct is not None:
        conds.append(rs_pct >= 70)   # ⑨ RS 70 이상

    return all(conds)


# ── 4. 백테스트 엔진 ────────────────────────────────
def run(all_dates, stock_arr, kospi_arr, strategy):
    """
    stock_arr: dict {ticker: (closes_array, volumes_array)}
    Returns DataFrame of signals with forward returns
    """
    # 월말 인덱스 추출
    monthly = []
    prev_ym = None
    for i, d in enumerate(all_dates):
        ym = (d.year, d.month)
        if prev_ym and ym != prev_ym:
            monthly.append((i - 1, all_dates[i - 1]))
        prev_ym = ym
    if monthly and all_dates[-1] != monthly[-1][1]:
        monthly.append((len(all_dates) - 1, all_dates[-1]))

    records = []
    for date_i, date in monthly:
        # RS 계산 (Minervini용)
        rs_map = {}
        if strategy == "minervini" and date_i >= 252:
            rets = {}
            for tk, (c, _) in stock_arr.items():
                if date_i < len(c) and c[date_i] > 0 and c[date_i - 252] > 0:
                    rets[tk] = c[date_i] / c[date_i - 252] - 1
            if rets:
                vals = sorted(rets.values())
                n = len(vals)
                rs_map = {t: sum(1 for v in vals if v <= r) / n * 100
                          for t, r in rets.items()}

        for ticker, (c, v) in stock_arr.items():
            if date_i >= len(c) or c[date_i] <= 0:
                continue
            try:
                if strategy == "current":
                    passed = check_current(c, v, date_i)
                else:
                    passed = check_minervini(c, v, date_i, rs_map.get(ticker))

                if not passed:
                    continue

                entry = c[date_i]
                i4    = min(date_i + 20, len(c) - 1)
                i12   = min(date_i + 60, len(c) - 1)
                ki4   = min(date_i + 20, len(kospi_arr) - 1)
                ki12  = min(date_i + 60, len(kospi_arr) - 1)

                ret4   = (c[i4]  / entry - 1) * 100
                ret12  = (c[i12] / entry - 1) * 100
                k_ent  = kospi_arr[date_i]
                kret4  = (kospi_arr[ki4]  / k_ent - 1) * 100 if k_ent > 0 else 0
                kret12 = (kospi_arr[ki12] / k_ent - 1) * 100 if k_ent > 0 else 0

                records.append({
                    "date":      date,
                    "ticker":    ticker,
                    "ret4w":     round(ret4,  2),
                    "ret12w":    round(ret12, 2),
                    "excess4w":  round(ret4  - kret4,  2),
                    "excess12w": round(ret12 - kret12, 2),
                })
            except:
                pass

    return pd.DataFrame(records)


# ── 5. 결과 출력 ────────────────────────────────────
def print_result(df, label):
    print(f"\n{'━'*52}")
    print(f"  {label}")
    print(f"{'━'*52}")
    if df.empty:
        print("  신호 없음")
        return
    n_months = df["date"].nunique()
    n_sig    = len(df)
    print(f"  신호 총계:        {n_sig}건 / {n_months}개월")
    print(f"  월평균 신호:      {n_sig/n_months:.1f}건")

    for lbl_w, col_r, col_e in [("4주",  "ret4w",  "excess4w"),
                                  ("12주", "ret12w", "excess12w")]:
        r = df[col_r]
        e = df[col_e]
        print(f"\n  ── {lbl_w} 선행 성과 ──")
        print(f"  평균 수익률:      {r.mean():+.2f}%")
        print(f"  중앙값:           {r.median():+.2f}%")
        print(f"  승률:             {(r > 0).mean()*100:.1f}%")
        print(f"  코스피 초과:      {e.mean():+.2f}%  (초과 승률 {(e>0).mean()*100:.1f}%)")
        print(f"  최대: {r.max():+.2f}%   최소: {r.min():+.2f}%")

    print(f"\n  ── 연도별 12주 평균 ──")
    df["year"] = df["date"].dt.year
    for yr, g in df.groupby("year"):
        bar = "▲" if g["ret12w"].mean() > 0 else "▼"
        print(f"  {yr}: {bar} {g['ret12w'].mean():+.2f}%  (n={len(g)}, 승률 {(g['ret12w']>0).mean()*100:.0f}%)")


# ── 메인 ────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 52)
    print("  KOSPI 백테스트: 현재 전략 vs Minervini")
    print(f"  기간: {START_DATE} ~ {END_DATE}")
    print(f"  유니버스: KOSPI 주요 {len(KOSPI_UNIVERSE)}종목 (yfinance)")
    print("=" * 52)

    # 주가 데이터 다운로드
    print(f"\n[1/3] 주가 데이터 로드 (총 {len(KOSPI_UNIVERSE)}종목)...")
    print("      첫 실행 시 약 5~10분 소요 (이후 캐시 사용)")
    stock_data = {}
    for i, (tk, name) in enumerate(KOSPI_UNIVERSE):
        df = load_stock(tk)
        if len(df) >= 200:
            stock_data[tk] = df
        if (i + 1) % 10 == 0:
            print(f"  {i+1}/{len(KOSPI_UNIVERSE)} 완료  (유효 {len(stock_data)}종목)")
        time.sleep(0.1)   # yfinance 요청 간격
    print(f"  유효 종목: {len(stock_data)}개 (200일 이상 데이터 보유)")

    # 코스피 지수
    print("\n[2/3] 코스피 지수(^KS11) 로드...")
    kospi_df = load_kospi()
    if kospi_df.empty:
        print("  ❌ 코스피 지수 데이터 없음. 인터넷 연결 확인 후 재실행하세요.")
        exit(1)

    # 공통 날짜 인덱스 (KOSPI 기준)
    all_dates = sorted(kospi_df.index.normalize())      # 날짜만 추출

    kospi_arr = kospi_df["Close"].reindex(
        pd.DatetimeIndex(all_dates)
    ).ffill().values.astype(float)

    # 종목별 배열 정렬
    stock_arr = {}
    for tk, df in stock_data.items():
        c = df["Close"].reindex(pd.DatetimeIndex(all_dates)).ffill().fillna(0).values.astype(float)
        v = df["Volume"].reindex(pd.DatetimeIndex(all_dates)).ffill().fillna(0).values.astype(float)
        stock_arr[tk] = (c, v)

    # 벤치마크
    valid_k = kospi_arr[kospi_arr > 0]
    total_k = (valid_k[-1] / valid_k[0] - 1) * 100
    years_k = (kospi_df.index[-1] - kospi_df.index[0]).days / 365
    ann_k   = ((1 + total_k / 100) ** (1 / years_k) - 1) * 100
    print(f"\n  코스피 벤치마크: 총 {total_k:+.1f}%  /  연환산 {ann_k:+.1f}%")

    # 백테스트 실행
    print("\n[3/3] 백테스트 실행...")
    print("\n  ▶ 현재 전략 (MA20/60/120 정배열 + 거래량 1.5배)...")
    df_cur = run(all_dates, stock_arr, kospi_arr, "current")

    print("\n  ▶ Minervini Trend Template (MA50/150/200 + RS70+ + 52주조건)...")
    df_min = run(all_dates, stock_arr, kospi_arr, "minervini")

    # 결과 출력
    print_result(df_cur, "현재 전략  (MA정배열 + 거래량1.5배)")
    print_result(df_min, "Minervini  (MA50/150/200 + RS70+ + 52주조건)")

    print(f"\n{'='*52}")
    print("  ※ 생존 편향: 현재 상장 종목 기준 (상장폐지 제외)")
    print("  ※ 거래비용·슬리피지 미반영")
    print("  ※ 월말 신호 → 다음 거래일 진입 가정")
    print(f"{'='*52}")
