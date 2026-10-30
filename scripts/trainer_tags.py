"""Keyword rules for trainer_categories.json `tags`, fitted against the existing file.
Used only for trainer names that have never appeared before; reprints reuse the tags
already stored for the same name. Agreement with the existing file is reported by
`python3 -I scripts/trainer_tags.py --score`.
"""
import re

ORDER = ['draw_support', 'pokemon_search', 'energy_search', 'energy_acceleration', 'recovery',
         'switch', 'gust', 'healing', 'hand_disrupt', 'tool_defensive', 'evolution_accel']

RULE_LINES = re.compile(r'^(아이템은|서포트는|서포터는|스타디움은|포켓몬의 도구는|ACE SPEC 카드는).*$', re.M)

RULES = {
    'draw_support': r'덱을\s*\d*장?\s*(?:까지\s*)?뽑는다|장이 되도록 덱을 뽑|만큼 덱을 뽑',
    'pokemon_search': r'덱에서[^.。]*?포켓몬[^.。]*?(?:패로 가져|벤치로 내보|벤치에 내보)|덱에 있는[^.。]*?포켓몬[^.。]*?(?:패로 가져|벤치로 내보|벤치에 내보)|덱을 위에서부터[^.。]*?포켓몬[^.。]*?패로 가져',
    'energy_search': r'(?:덱에서|덱에 있는)[^.。]*?에너지[^.。]*?패로 가져',
    'energy_acceleration': r'에너지[^.。]*?붙인다|에너지[^.。]*?붙여도 좋다',
    'recovery': r'트래쉬에서[^.。]*?(?:패로 가져|덱으로 되돌|덱에 넣)|트래쉬에 있는[^.。]*?(?:패로 가져|덱으로 되돌)',
    'switch': r'자신의 배틀 포켓몬을 벤치 포켓몬과 교체',
    'gust': r'상대의 벤치 포켓몬을 1마리 선택해서 배틀 포켓몬과 교체|상대의 벤치 포켓몬[^.。]*?배틀 포켓몬과 교체',
    'healing': r'HP를[^.。]*?회복',
    'hand_disrupt': r'상대의 패를|상대는 상대 자신의 패|서로의 플레이어는 각각 (?:자신의 )?패를',
    'tool_defensive': r'받는 기술의 데미지는\s*「-\d+」|데미지는\s*「-\d+」|기술의 데미지를 받지 않는다',
    'evolution_accel': r'진화시킨다|진화할 수 있다|진화시켜도 된다',
}
COMPILED = {k: re.compile(v) for k, v in RULES.items()}


def tags(card):
    body = RULE_LINES.sub('', card.get('effect_text') or '')
    return [k for k in ORDER if COMPILED[k].search(body)]


def subtype(card):
    if card.get('card_class') == 'stadium':
        return None
    return card.get('trainer_subtype')


def category(card, known=None):
    """known: name_kr -> tags list from the existing file (reprints keep their tags)."""
    t = list(known[card['name_kr']]) if known and card['name_kr'] in known else tags(card)
    return {'bs_code': card['bs_code'], 'name_kr': card['name_kr'], 'card_class': card['card_class'],
            'subtype': subtype(card), 'tags': t}


if __name__ == '__main__':
    import collections
    import json
    import os
    import sys
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
    db = {c['bs_code']: c for c in json.load(open(os.path.join(root, 'korean_cards_db.json'), encoding='utf-8'))}
    tc = json.load(open(os.path.join(root, 'trainer_categories.json'), encoding='utf-8'))
    exact, stat = 0, collections.defaultdict(lambda: [0, 0, 0])
    for t in tc:
        p, g = set(tags(db[t['bs_code']])), set(t['tags'])
        exact += p == g
        for x in p | g:
            stat[x][0 if x in p and x in g else 1 if x in p else 2] += 1
    print('exact tag-set agreement %d/%d (%.1f%%)' % (exact, len(tc), 100.0 * exact / len(tc)))
    for k in ORDER:
        tp, fp, fn = stat[k]
        print('%-20s precision %.2f recall %.2f' % (k, tp / max(1, tp + fp), tp / max(1, tp + fn)))
    sys.exit(0)
