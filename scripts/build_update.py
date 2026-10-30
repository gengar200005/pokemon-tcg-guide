"""Turn parsed new cards (JSON lines from fetch_cards.py) into an update file for
scripts/merge-cards.js, deriving evolution_lines and trainer_categories entries from
the existing data only (the official detail pages do not list the pre-evolution).

Usage: python3 -I scripts/build_update.py <new_cards.jsonl> <out_update.json> --source URL --verified-at YYYY-MM-DD

Evolution `source` values written for new entries:
  derived-name     same printed name already in evolution_lines.json; base/parent copied (majority)
  derived-species  species (base_kr) known; parent copied from that species' existing entries
  derived-basic    printed card type is a basic Pokemon (no parent)
  unmatched        stage 1/2 whose species has no existing entry; evolvesFrom_kr left null
"""
import argparse
import collections
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import trainer_tags  # noqa: E402

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
SUFFIXES = [' ex', ' EX', ' V', ' VMAX', ' VSTAR', ' GX', ' BREAK']
REGIONS = ['가라르 ', '알로라', '히스이 ', '팔데아 ']


def load(name):
    return json.load(open(os.path.join(DATA, name), encoding='utf-8'))


def majority(values):
    return collections.Counter(values).most_common(1)[0][0] if values else None


def stage_of(card_type):
    head = card_type.split('|')[0].strip()
    if head.startswith('기본'):
        return 'mega' if '메가진화' in card_type else 'basic'
    if head.startswith('1진화'):
        return 'stage1'
    if head.startswith('2진화'):
        return 'stage2'
    if head.startswith('V진화'):
        return 'v-evolution'
    if head.startswith('M진화'):
        return 'mega'
    if head.startswith('BREAK'):
        return 'break'
    return 'other'


class Evolution:
    def __init__(self, evo):
        good = [e for e in evo if e['source'] in ('agreed', 'agreed-basic')]
        self.by_name = collections.defaultdict(list)
        self.parent = collections.defaultdict(list)
        for e in good:
            self.by_name[e['name_kr']].append(e)
            if e['stage'] in ('stage1', 'stage2'):
                self.parent[e['base_kr']].append(e['evolvesFrom_kr'])
        # single-source entries (A-only/B-only) only fill species the agreed entries do not cover
        for e in evo:
            if e['source'] in ('A-only', 'B-only') and e['stage'] in ('stage1', 'stage2') and e['evolvesFrom_kr'] \
                    and not any(x['stage'] in ('stage1', 'stage2') for x in good if x['base_kr'] == e['base_kr']):
                self.parent[e['base_kr']].append(e['evolvesFrom_kr'])
        self.species = {e['base_kr'] for e in evo}
        # owner prefixes such as "로켓단의 ", taken from existing name/base pairs
        self.owners = {e['name_kr'][:e['name_kr'].index(e['base_kr'])] for e in evo
                       if e['base_kr'] in e['name_kr'] and re.match(r'^\S+의 ', e['name_kr'])}

    def base(self, name, card_type):
        s = name
        for o in sorted(self.owners, key=len, reverse=True):
            if s.startswith(o):
                s = s[len(o):]
                break
        for suf in SUFFIXES:
            if s.endswith(suf):
                s = s[:-len(suf)]
                break
        if '메가진화' in card_type and s.startswith('메가') and s[2:] in self.species:
            s = s[2:]
        for r in REGIONS:
            if s.startswith(r) and s[len(r):] in self.species:
                s = s[len(r):]
        if s not in self.species:
            # forms such as "오거폰 벽록의 가면", "연격 우라오스", "찬란한 리자몽": keep the one known species word
            known = [w for w in s.split(' ') if w in self.species]
            if len(known) == 1:
                s = known[0]
        return s

    def entry(self, card):
        stage = stage_of(card['card_type'])
        same = self.by_name.get(card['name_kr'])
        if same:
            base = majority([e['base_kr'] for e in same])
            parents = [e['evolvesFrom_kr'] for e in same if e['stage'] == stage] or [e['evolvesFrom_kr'] for e in same]
            parent, src = majority(parents), 'derived-name'
        else:
            base = self.base(card['name_kr'], card['card_type'])
            if stage in ('stage1', 'stage2'):
                parent, src = (majority(self.parent[base]), 'derived-species') if base in self.parent else (None, 'unmatched')
            elif stage in ('basic', 'mega'):
                parent, src = None, 'derived-basic'
            else:
                parent, src = None, 'unmatched'
        if stage == 'basic':
            parent = None
        return {'bs_code': card['bs_code'], 'name_kr': card['name_kr'], 'base_kr': base,
                'card_type': card['card_type'], 'stage': stage, 'evolvesFrom_kr': parent, 'source': src}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cards')
    ap.add_argument('out')
    ap.add_argument('--source', required=True)
    ap.add_argument('--verified-at', required=True)
    a = ap.parse_args()
    cards = [json.loads(l) for l in open(a.cards, encoding='utf-8') if l.strip()]
    cards.sort(key=lambda c: c['bs_code'])
    known = {c['bs_code'] for c in load('korean_cards_db.json')}
    cards = [c for c in cards if c['bs_code'] not in known]
    ev = Evolution(load('evolution_lines.json'))
    tc_known = collections.defaultdict(list)
    for t in load('trainer_categories.json'):
        tc_known[t['name_kr']].append(tuple(t['tags']))
    tc_known = {k: list(majority(v)) for k, v in tc_known.items()}
    evolution = [ev.entry(c) for c in cards if c['card_class'] == 'pokemon']
    # species introduced in this update can serve as parents for later cards of the same update
    names = ev.species | {e['base_kr'] for e in evolution}
    for e in evolution:
        if e['source'] == 'unmatched':
            continue
        if e['evolvesFrom_kr'] and e['evolvesFrom_kr'] not in names:
            e['evolvesFrom_kr'], e['source'] = None, 'unmatched'
    trainers = [trainer_tags.category(c, tc_known) for c in cards if c['card_class'] in ('trainer', 'stadium')]
    out = {'source': a.source, 'verified_at': a.verified_at, 'cards': cards,
           'evolution': evolution, 'trainer_categories': trainers}
    with open(a.out, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    stats = collections.Counter(e['source'] for e in evolution)
    print(json.dumps({'cards': len(cards), 'evolution': len(evolution), 'evolution_sources': stats,
                      'trainer_categories': len(trainers),
                      'trainer_new_names': sum(1 for c in cards if c['card_class'] in ('trainer', 'stadium') and c['name_kr'] not in tc_known)},
                     ensure_ascii=False))


if __name__ == '__main__':
    main()
