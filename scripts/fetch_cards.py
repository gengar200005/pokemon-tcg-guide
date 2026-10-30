"""Polite fetcher for official card detail pages (robots.txt: Allow /).
Walks <prefix>001, 002, ... and stops after `--misses` consecutive empty pages.
Pages are cached so re-runs only fetch what is missing.

Usage: python3 -I scripts/fetch_cards.py --cache DIR [--delay 0.4] [--misses 5] [--start N] PREFIX...
  PREFIX: 9-char set prefix such as BS2026003 (3-digit numbers) or MP0000000 (promo, 2-digit)
Prints one JSON line per parsed card to stdout.
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parse_card_detail import parse  # noqa: E402

URL = 'https://pokemoncard.co.kr/cards/detail/'
UA = 'pokemon-tcg-guide data maintenance (+https://github.com/gengar200005/pokemon-tcg-guide)'


def get(code, cache, delay):
    path = os.path.join(cache, code + '.html')
    if os.path.exists(path) and os.path.getsize(path):
        return open(path, encoding='utf-8').read()
    for attempt in range(4):
        try:
            req = urllib.request.Request(URL + code, headers={'User-Agent': UA})
            body = urllib.request.urlopen(req, timeout=30).read().decode('utf-8')
            break
        except urllib.error.HTTPError as e:
            if e.code in (404, 500):  # the site answers 500 for card numbers that do not exist
                body = ''
                break
            if attempt == 3:
                raise
            time.sleep(2 ** (attempt + 1))
        except Exception as e:  # network hiccup: back off, then give up loudly
            if attempt == 3:
                raise
            time.sleep(2 ** (attempt + 1))
            print('retry', code, e, file=sys.stderr)
    if body:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(body)
    time.sleep(delay)
    return body


def walk(prefix, cache, delay, misses, start):
    width = 12 - len(prefix) if prefix.startswith('BS') else 11 - len(prefix)
    n, miss = start, 0
    while miss < misses:
        code = prefix + str(n).zfill(width)
        page = get(code, cache, delay)
        rec = parse(code, page) if page else None
        if rec:
            miss = 0
            yield rec
        else:
            miss += 1
        n += 1


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', required=True)
    ap.add_argument('--delay', type=float, default=0.4)
    ap.add_argument('--misses', type=int, default=5)
    ap.add_argument('--start', type=int, default=1)
    ap.add_argument('prefix', nargs='+')
    a = ap.parse_args()
    os.makedirs(a.cache, exist_ok=True)
    for p in a.prefix:
        for rec in walk(p, a.cache, a.delay, a.misses, a.start):
            print(json.dumps(rec, ensure_ascii=False), flush=True)
