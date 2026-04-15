"""
================================================================
  코스피 추세추종 전략 v6 — 검증 스크립트
  (Claude Code가 지적한 버그 영향도 측정용)
================================================================

실행 방법:
    pip install finance-datareader pandas numpy
    python v6_verify.py

출력:
    1. ORIGINAL (원본 코드 그대로) — 재현값
    2. 각 버그 개별 수정 시 → 영향도 분리
    3. REALISTIC (모든 수정 적용) — 현실적 성과
    4. 부트스트랩 신뢰구간 (PF, 승률)
    5. CSV: verify_original_trades.csv, verify_realistic_trades.csv

핵심 질문:
    - 원본 PF 2.78이 어디서 왔고
    - 현실 보정 후 얼마로 떨어지는가
    - 전략이 "여전히 쓸 만한가"를 PF 2.0 기준으로 판정
================================================================
"""

import FinanceDataReader as fdr
import pandas as pd
import numpy as np
from datetime import datetime
from dataclasses import dataclass, field
import warnings
warnings.filterwarnings('ignore')

# ══════════════════════════════════════════════════════════════
# 설정
# ══════════════════════════════════════════════════════════════
START = '2020-01-01'
END   = datetime.today().strftime('%Y-%m-%d')

UNIVERSE = {
    # 반도체 — KODEX 반도체 (091160)
    '005930': ('삼성전자',       '091160'),
    '000660': ('SK하이닉스',     '091160'),
    '042700': ('한미반도체',      '091160'),
    '009150': ('삼성전기',       '091160'),
    # 금융 — KODEX 금융 (139270)
    '105560': ('KB금융',        '139270'),
    '055550': ('신한지주',       '139270'),
    '086790': ('하나금융지주',    '139270'),
    '138040': ('메리츠금융지주',  '139270'),
    # 자동차 — KODEX 자동차 (091180)
    '005380': ('현대차',         '091180'),
    '012330': ('현대모비스',     '091180'),
    # 2차전지 — KODEX 2차전지산업 (305720)
    '006400': ('삼성SDI',       '305720'),
    '373220': ('LG에너지솔루션',  '305720'),
    # 미디어 — TIGER 미디어컨텐츠 (091220)
    '035420': ('NAVER',         '091220'),
    '035720': ('카카오',         '091220'),
    '259960': ('크래프톤',       '091220'),
    # 방산 — KODEX K-방산 (473010) [2023-08 상장]
    '047810': ('한국항공우주',    '473010'),
    '079550': ('LIG넥스원',      '473010'),
    '064350': ('현대로템',        '473010'),
    # 조선 — ETF 없음
    '009540': ('HD한국조선해양',  None),
    '010140': ('삼성중공업',      None),
}

ETF_NAMES = {
    '091160': 'KODEX 반도체',
    '305720': 'KODEX 2차전지산업',
    '139270': 'KODEX 금융',
    '091180': 'KODEX 자동차',
    '091220': 'TIGER 미디어컨텐츠',
    '473010': 'KODEX K-방산',
    None:     '조선(ETF없음)',
}

STOP_LOSS   = -0.07
TAKE_PROFIT =  0.18


# ══════════════════════════════════════════════════════════════
# 버그 수정 토글
# ══════════════════════════════════════════════════════════════
@dataclass
class Config:
    """각 버그 수정을 on/off로 토글해서 영향도 분리 측정."""
    name: str = "ORIGINAL"

    # BUG1: 손절/익절 체결가를 threshold 고정값 대신 실제 OHLC로
    #   False = 원본 (exit = entry × 0.93 / 1.18 정확)
    #   True  = 현실 (갭 고려: low <= stop 이면 min(open, stop) / 단순화는 close)
    fix_exit_price: bool = False

    # BUG2: 거래비용 반영 (왕복 0.28%)
    fix_costs: bool = False
    roundtrip_cost: float = 0.0028  # 0.18% tax + 0.03% commission + 0.07% slip

    # BUG3: 조선(ETF없음) 필터 비대칭 해결
    #   False = 원본 (c6 = True 무조건 통과)
    #   True  = 코스피 20MA 위 조건 추가
    fix_ship_filter: bool = False

    # BUG4: 거래량 기준 = 전일 1일 → 20일 이평
    fix_volume_baseline: bool = False
    vol_ratio: float = 2.0

    # BUG5: 청산 시점 = 당일 종가 → 익일 시가 (진입과 대칭)
    fix_exit_timing: bool = False


# ══════════════════════════════════════════════════════════════
# 데이터 수집 (1회만)
# ══════════════════════════════════════════════════════════════
def fetch_all():
    print(f"\n[데이터] KOSPI + ETF {6}개 + 종목 {len(UNIVERSE)}개 수집 중...")
    kospi = fdr.DataReader('KS11', START, END)[['Close']].copy()
    kospi.columns = ['kospi']
    kospi.index = pd.to_datetime(kospi.index).normalize()
    kospi['ma20']  = kospi['kospi'].rolling(20).mean()
    kospi['ma60'] = kospi['kospi'].rolling(60).mean()
    kospi['ret20'] = kospi['kospi'].pct_change(20)

    etf_tickers = list(set(v[1] for v in UNIVERSE.values() if v[1] is not None))
    etf_data = {}
    for etf in etf_tickers:
        try:
            df = fdr.DataReader(etf, START, END)[['Close']].copy()
            df.index = pd.to_datetime(df.index).normalize()
            df.columns = ['close']
            df['ma60'] = df['close'].rolling(60).mean()
            etf_data[etf] = df
        except Exception as e:
            print(f"  ✗ ETF {etf}: {e}")

    price_data = {}
    for ticker, (name, _) in UNIVERSE.items():
        try:
            df = fdr.DataReader(ticker, START, END)
            df.index = pd.to_datetime(df.index).normalize()
            col_map = {}
            for c in df.columns:
                cl = c.lower()
                if cl in ('open','시가'):       col_map[c] = 'open'
                elif cl in ('high','고가'):     col_map[c] = 'high'
                elif cl in ('low','저가'):      col_map[c] = 'low'
                elif cl in ('close','종가'):    col_map[c] = 'close'
                elif cl in ('volume','거래량'): col_map[c] = 'volume'
            df = df.rename(columns=col_map)[['open','high','low','close','volume']]
            df['ma20']     = df['close'].rolling(20).mean()
            df['ma60']     = df['close'].rolling(60).mean()
            df['ma120']    = df['close'].rolling(120).mean()
            df['vol_prev'] = df['volume'].shift(1)
            df['vol_ma20'] = df['volume'].rolling(20).mean().shift(1)  # shift로 look-ahead 방지
            price_data[ticker] = df
        except Exception as e:
            print(f"  ✗ {name}: {e}")

    print(f"  완료: KOSPI {len(kospi)}일, ETF {len(etf_data)}개, 종목 {len(price_data)}개")
    return kospi, etf_data, price_data


# ══════════════════════════════════════════════════════════════
# 백테스트 엔진 (Config 기반)
# ══════════════════════════════════════════════════════════════
def backtest(cfg: Config, kospi, etf_data, price_data):
    trades = []
    all_dates = sorted(kospi.index)

    for ticker, (name, etf_ticker) in UNIVERSE.items():
        if ticker not in price_data:
            continue
        df = price_data[ticker]
        in_trade = False
        entry_price = entry_date = None

        for i, date in enumerate(all_dates):
            if date not in df.index:
                continue
            row = df.loc[date]

            # ──────────── 청산 ────────────
            if in_trade:
                pnl = (row['close'] - entry_price) / entry_price
                exit_reason = None
                exit_price = None
                exit_date = date  # 매 거래마다 초기화 (이전 거래 값 누출 방지)

                # --- 손절 ---
                if cfg.fix_exit_price:
                    stop_price = entry_price * (1 + STOP_LOSS)
                    if pd.notna(row['low']) and row['low'] <= stop_price:
                        exit_reason = '손절(-7%)'
                        # 갭다운으로 시가가 이미 손절선 아래면 시가 체결(더 나쁨)
                        exit_price = row['open'] if row['open'] <= stop_price else stop_price
                else:
                    if pnl <= STOP_LOSS:
                        exit_reason = '손절(-7%)'
                        exit_price = entry_price * (1 + STOP_LOSS)

                # --- 60MA 이탈 ---
                if exit_reason is None:
                    if pd.notna(row['ma60']) and row['close'] < row['ma60']:
                        exit_reason = '60MA이탈'
                        if cfg.fix_exit_timing:
                            nxt = next((d for d in all_dates[i+1:] if d in df.index), None)
                            if nxt is not None:
                                exit_price = df.loc[nxt, 'open']
                                exit_date = nxt
                            else:
                                exit_price = row['close']
                        else:
                            exit_price = row['close']

                # --- 익절 ---
                if exit_reason is None:
                    if cfg.fix_exit_price:
                        tp_price = entry_price * (1 + TAKE_PROFIT)
                        if pd.notna(row['high']) and row['high'] >= tp_price:
                            exit_reason = '익절(+18%)'
                            # 갭업으로 시가가 이미 익절선 이상이면 시가 체결(더 좋음)
                            exit_price = row['open'] if row['open'] >= tp_price else tp_price
                    else:
                        if pnl >= TAKE_PROFIT:
                            exit_reason = '익절(+18%)'
                            exit_price = entry_price * (1 + TAKE_PROFIT)

                if exit_reason:
                    gross_pnl = (exit_price - entry_price) / entry_price
                    net_pnl = gross_pnl - cfg.roundtrip_cost if cfg.fix_costs else gross_pnl
                    trades.append({
                        '종목명': name, '섹터': ETF_NAMES.get(etf_ticker),
                        '티커': ticker,
                        '진입일': entry_date, '청산일': exit_date,
                        '보유일수': (exit_date - entry_date).days,
                        '진입가': round(entry_price), '청산가': round(exit_price),
                        '수익률_gross': round(gross_pnl * 100, 2),
                        '수익률': round(net_pnl * 100, 2),
                        '청산사유': exit_reason,
                    })
                    in_trade = False
                    entry_price = entry_date = None
                    continue

            # ──────────── 진입 ────────────
            if not in_trade:
                if date not in kospi.index:
                    continue
                k = kospi.loc[date]

                c1 = pd.notna(k['ma60']) and k['kospi'] > k['ma60']
                c2 = pd.notna(k['ret20']) and k['ret20'] > 0
                c3 = (pd.notna(row['ma20']) and pd.notna(row['ma60']) and
                      pd.notna(row['ma120']) and
                      row['ma20'] > row['ma60'] > row['ma120'])

                # BUG4: 거래량 기준
                if cfg.fix_volume_baseline:
                    c4 = (pd.notna(row['vol_ma20']) and row['vol_ma20'] > 0 and
                          row['volume'] >= cfg.vol_ratio * row['vol_ma20'])
                else:
                    c4 = (pd.notna(row['vol_prev']) and row['vol_prev'] > 0 and
                          row['volume'] >= cfg.vol_ratio * row['vol_prev'])

                # c5: 5일 중 4일 양봉
                idx_pos = df.index.get_loc(date)
                c5 = False
                if idx_pos >= 5:
                    recent5 = df.iloc[idx_pos-4: idx_pos+1]
                    c5 = (recent5['close'] > recent5['open']).sum() >= 4

                # c6: 섹터 ETF 필터
                if etf_ticker is not None:
                    c6 = False
                    if etf_ticker in etf_data:
                        edf = etf_data[etf_ticker]
                        if date in edf.index:
                            er = edf.loc[date]
                            c6 = pd.notna(er['ma60']) and er['close'] > er['ma60']
                else:
                    # BUG3: 조선 필터
                    if cfg.fix_ship_filter:
                        # 대체 필터: 코스피 20MA 위 추가 (c1/c2만으로는 약함)
                        c6 = pd.notna(k['ma20']) and k['kospi'] > k['ma20']
                    else:
                        c6 = True

                if c1 and c2 and c3 and c4 and c5 and c6:
                    nxt = next((d for d in all_dates[i+1:] if d in df.index), None)
                    if nxt is not None:
                        entry_price = df.loc[nxt, 'open']
                        entry_date = nxt
                        in_trade = True

    return pd.DataFrame(trades)


# ══════════════════════════════════════════════════════════════
# 지표 계산
# ══════════════════════════════════════════════════════════════
def metrics(t: pd.DataFrame) -> dict:
    if len(t) == 0:
        return dict(n=0, win_rate=0, pf=0, ev=0, avg_win=0, avg_loss=0,
                    stop_pct=0, tp_pct=0, ma_pct=0)
    wins = (t['수익률'] > 0).sum()
    total = len(t)
    win_rate = wins / total * 100
    avg_win = t[t['수익률'] > 0]['수익률'].mean() if wins else 0
    avg_loss = t[t['수익률'] <= 0]['수익률'].mean() if total - wins else 0
    gw = t[t['수익률'] > 0]['수익률'].sum()
    gl = abs(t[t['수익률'] <= 0]['수익률'].sum())
    pf = gw / gl if gl > 0 else float('inf')
    ev = t['수익률'].mean()
    ed = t['청산사유'].value_counts()
    return dict(
        n=total, win_rate=win_rate, pf=pf, ev=ev,
        avg_win=avg_win, avg_loss=avg_loss,
        stop_pct=ed.get('손절(-7%)', 0) / total * 100,
        tp_pct=ed.get('익절(+18%)', 0) / total * 100,
        ma_pct=ed.get('60MA이탈', 0) / total * 100,
    )


def bootstrap_ci(t: pd.DataFrame, n_boot: int = 2000, seed: int = 42) -> dict:
    """PF와 승률의 95% 부트스트랩 신뢰구간."""
    if len(t) < 5:
        return {}
    rng = np.random.default_rng(seed)
    returns = t['수익률'].values
    pfs, wrs, evs = [], [], []
    for _ in range(n_boot):
        sample = rng.choice(returns, size=len(returns), replace=True)
        wins = (sample > 0).sum()
        wr = wins / len(sample) * 100
        gw = sample[sample > 0].sum()
        gl = abs(sample[sample <= 0].sum())
        pf = gw / gl if gl > 0 else np.nan
        pfs.append(pf); wrs.append(wr); evs.append(sample.mean())
    pfs = [p for p in pfs if not np.isnan(p)]
    return dict(
        pf_ci=(np.percentile(pfs, 2.5), np.percentile(pfs, 97.5)),
        wr_ci=(np.percentile(wrs, 2.5), np.percentile(wrs, 97.5)),
        ev_ci=(np.percentile(evs, 2.5), np.percentile(evs, 97.5)),
    )


# ══════════════════════════════════════════════════════════════
# 출력
# ══════════════════════════════════════════════════════════════
def row_fmt(m: dict, label: str) -> str:
    if m['n'] == 0:
        return f"  {label:28s} 거래없음"
    return (f"  {label:28s} n={m['n']:3d}  "
            f"승률={m['win_rate']:5.1f}%  "
            f"PF={m['pf']:5.2f}  "
            f"EV={m['ev']:+5.2f}%  "
            f"(승{m['avg_win']:+5.1f}/패{m['avg_loss']:+5.1f})  "
            f"[손{m['stop_pct']:.0f}/MA{m['ma_pct']:.0f}/익{m['tp_pct']:.0f}]")


def main():
    kospi, etf_data, price_data = fetch_all()

    # 1) 원본 재현
    print("\n" + "=" * 90)
    print("  [1] 원본 재현 (버그 수정 없음) — PF 2.78 나오는지 확인")
    print("=" * 90)
    cfg_orig = Config(name="ORIGINAL")
    t_orig = backtest(cfg_orig, kospi, etf_data, price_data)
    m_orig = metrics(t_orig)
    print(row_fmt(m_orig, "ORIGINAL (원본)"))
    t_orig.to_csv('verify_original_trades.csv', index=False, encoding='utf-8-sig')

    # 2) 개별 버그 수정 영향도
    print("\n" + "=" * 90)
    print("  [2] 개별 버그 수정 영향도 (원본 대비 단일 수정)")
    print("=" * 90)

    cases = [
        ("BUG1 체결가 현실화",        dict(fix_exit_price=True)),
        ("BUG2 거래비용 0.28%",        dict(fix_costs=True)),
        ("BUG3 조선 필터 평등화",      dict(fix_ship_filter=True)),
        ("BUG4 거래량 20MA 기준",     dict(fix_volume_baseline=True)),
        ("BUG5 청산 익일시가",         dict(fix_exit_timing=True)),
    ]
    for lbl, overrides in cases:
        cfg = Config(name=lbl, **overrides)
        t = backtest(cfg, kospi, etf_data, price_data)
        m = metrics(t)
        print(row_fmt(m, lbl))

    # 3) 전체 수정
    print("\n" + "=" * 90)
    print("  [3] REALISTIC — 5개 버그 모두 수정")
    print("=" * 90)
    cfg_real = Config(
        name="REALISTIC",
        fix_exit_price=True, fix_costs=True, fix_ship_filter=True,
        fix_volume_baseline=True, fix_exit_timing=True,
    )
    t_real = backtest(cfg_real, kospi, etf_data, price_data)
    m_real = metrics(t_real)
    print(row_fmt(m_real, "REALISTIC (전체 수정)"))
    t_real.to_csv('verify_realistic_trades.csv', index=False, encoding='utf-8-sig')

    # 4) 부트스트랩 신뢰구간
    print("\n" + "=" * 90)
    print("  [4] 부트스트랩 95% 신뢰구간 (2,000회 리샘플링)")
    print("=" * 90)
    for label, t in [("ORIGINAL", t_orig), ("REALISTIC", t_real)]:
        ci = bootstrap_ci(t)
        if not ci: continue
        print(f"\n  {label}  (n={len(t)})")
        print(f"    PF   95% CI: [{ci['pf_ci'][0]:.2f}, {ci['pf_ci'][1]:.2f}]")
        print(f"    승률 95% CI: [{ci['wr_ci'][0]:.1f}%, {ci['wr_ci'][1]:.1f}%]")
        print(f"    EV   95% CI: [{ci['ev_ci'][0]:+.2f}%, {ci['ev_ci'][1]:+.2f}%]")

    # 5) 워크포워드 (동일 규칙 그대로)
    print("\n" + "=" * 90)
    print("  [5] 워크포워드: REALISTIC 전략을 구간별로 쪼개서 본다")
    print("=" * 90)
    if len(t_real):
        t_real['진입일'] = pd.to_datetime(t_real['진입일'])
        periods = [
            ("학습  2020-01~2022-12", '2020-01-01', '2022-12-31'),
            ("검증  2023-01~2024-12", '2023-01-01', '2024-12-31'),
            ("실전  2025-01~현재",    '2025-01-01', END),
        ]
        for lbl, s, e in periods:
            sub = t_real[(t_real['진입일'] >= s) & (t_real['진입일'] <= e)]
            m = metrics(sub)
            print(row_fmt(m, lbl))

    # 6) 섹터별 (REALISTIC)
    print("\n" + "=" * 90)
    print("  [6] REALISTIC 섹터별 성과")
    print("=" * 90)
    if len(t_real):
        for sec, sub in t_real.groupby('섹터'):
            m = metrics(sub)
            print(row_fmt(m, sec))

    # 7) 판정
    print("\n" + "=" * 90)
    print("  [7] 판정")
    print("=" * 90)
    print(f"  원본      PF {m_orig['pf']:.2f}  EV {m_orig['ev']:+.2f}%  n={m_orig['n']}")
    print(f"  현실      PF {m_real['pf']:.2f}  EV {m_real['ev']:+.2f}%  n={m_real['n']}")
    delta_pf = m_real['pf'] - m_orig['pf']
    delta_ev = m_real['ev'] - m_orig['ev']
    print(f"  차이      ΔPF {delta_pf:+.2f}   ΔEV {delta_ev:+.2f}%p")
    print()
    verdict = "통과" if m_real['pf'] >= 2.0 and m_real['ev'] > 1.0 else "재검토 필요"
    print(f"  전략 채택 기준 (PF≥2.0 & EV>+1%): {verdict}")
    print()
    print("  생성된 CSV:")
    print("    verify_original_trades.csv")
    print("    verify_realistic_trades.csv")
    print("=" * 90)


if __name__ == '__main__':
    main()
