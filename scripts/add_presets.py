"""Append retail-deck presets transcribed from the official 60-card deck lists.
Each row is matched to a bs_code by printed number inside the product's set prefix, and the
printed name must equal the DB card name; the basic-energy row is matched by name inside the
prefix. Anything that does not match exactly, or a deck that does not total 60, aborts.
Existing presets and catalog entries are never modified; duplicates abort.
With --replace, each listed id must already exist and only its `cards` are replaced
(id, name, series and set_prefix stay); a `reason` per deck is required and stored as `note`.

Usage: python3 -I scripts/add_presets.py <decklists.json> [--replace] [--write]
decklists.json: {"decks": [{"id", "name_kr", "prefix", "product_url", "catalog": {...},
                            "rows": [[number|"energy", name, qty], ...]}]}
"""
import json
import os
import re
import sys

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')


def path(name):
    return os.path.join(DATA, name)


def same_name(a, b):
    # Some DB names carry padding runs ("기본 악   에너지"); compare words only.
    return re.sub(r'\s+', ' ', a).strip() == re.sub(r'\s+', ' ', b).strip()


def build(decks, db, presets, catalog, replace=False):
    problems, new_presets, new_catalog = [], [], []
    ids = {p['id'] for p in presets['presets']}
    names = {d['name'] for d in catalog['decks']}
    for d in decks:
        cards, total = [], 0
        in_set = [c for c in db if c['bs_code'].startswith(d['prefix'])]
        for num, name, qty in d['rows']:
            if num == 'energy':
                hit = [c for c in in_set if c['card_class'] == 'energy' and same_name(c['name_kr'], name)]
            else:
                hit = [c for c in in_set if c.get('card_no') == num]
            if len(hit) != 1 or not same_name(hit[0]['name_kr'], name):
                problems.append('%s row %s %s -> %s' % (d['id'], num, name, [(c['bs_code'], c['name_kr']) for c in hit]))
                continue
            cards.append({'bs_code': hit[0]['bs_code'], 'qty': qty})
            total += qty
        if total != 60:
            problems.append('%s totals %d' % (d['id'], total))
        if replace:
            old = next((p for p in presets['presets'] if p['id'] == d['id']), None)
            if not old or not d.get('reason') or old.get('set_prefix') != d['prefix']:
                problems.append('%s: replace needs an existing id with the same set_prefix and a reason' % d['id'])
                continue
            new_presets.append(dict(old, cards=cards, note='공식 구성표로 수정 (%s): %s' % (d.get('verified_at', ''), d['reason'])))
            continue
        if d['id'] in ids:
            problems.append('%s already exists' % d['id'])
        new_presets.append({'id': d['id'], 'name_kr': d['name_kr'], 'series': 'MEGA', 'set_prefix': d['prefix'], 'cards': cards})
        cat = d.get('catalog')
        if cat:
            if cat['name'] in names:
                problems.append('catalog %s already exists' % cat['name'])
            new_catalog.append(cat)
    return problems, new_presets, new_catalog


def main():
    doc = json.load(open(sys.argv[1], encoding='utf-8'))
    decks = [dict(d, verified_at=d.get('verified_at', doc.get('verified_at'))) for d in doc['decks']]
    replace = '--replace' in sys.argv
    db = json.load(open(path('korean_cards_db.json'), encoding='utf-8'))
    presets = json.load(open(path('starter_deck_presets.json'), encoding='utf-8'))
    catalog = json.load(open(path('korean_decks_catalog.json'), encoding='utf-8'))
    problems, new_presets, new_catalog = build(decks, db, presets, catalog, replace)
    if problems:
        print('\n'.join(problems))
        sys.exit(1)
    print(json.dumps({'presets': [p['id'] for p in new_presets], 'catalog': [c['name'] for c in new_catalog]}, ensure_ascii=False))
    if '--write' in sys.argv and replace:
        fixed = {p['id']: p for p in new_presets}
        presets['presets'] = [fixed.get(p['id'], p) for p in presets['presets']]
        with open(path('starter_deck_presets.json'), 'w', encoding='utf-8') as f:
            f.write(json.dumps(presets, ensure_ascii=False, indent=2))
    elif '--write' in sys.argv:
        presets['presets'].extend(sorted(new_presets, key=lambda p: p['set_prefix']))
        # newest products first, matching the official listing order the catalog was scraped in
        catalog['decks'] = new_catalog + catalog['decks']
        catalog['count'] = len(catalog['decks'])
        catalog['updated_at'] = decks[0].get('verified_at', catalog.get('scraped_at'))
        for name, obj in (('starter_deck_presets.json', presets), ('korean_decks_catalog.json', catalog)):
            with open(path(name), 'w', encoding='utf-8') as f:
                f.write(json.dumps(obj, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
