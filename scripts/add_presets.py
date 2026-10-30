"""Append retail-deck presets transcribed from the official 60-card deck lists.
Each row is matched to a bs_code by printed number inside the product's set prefix, and the
printed name must equal the DB card name; the basic-energy row is matched by name inside the
prefix. Anything that does not match exactly, or a deck that does not total 60, aborts.
Existing presets and catalog entries are never modified; duplicates abort.

Usage: python3 -I scripts/add_presets.py <decklists.json> [--write]
decklists.json: {"decks": [{"id", "name_kr", "prefix", "product_url", "catalog": {...},
                            "rows": [[number|"energy", name, qty], ...]}]}
"""
import json
import os
import sys

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')


def path(name):
    return os.path.join(DATA, name)


def build(decks, db, presets, catalog):
    problems, new_presets, new_catalog = [], [], []
    ids = {p['id'] for p in presets['presets']}
    names = {d['name'] for d in catalog['decks']}
    for d in decks:
        cards, total = [], 0
        in_set = [c for c in db if c['bs_code'].startswith(d['prefix'])]
        for num, name, qty in d['rows']:
            if num == 'energy':
                hit = [c for c in in_set if c['card_class'] == 'energy' and c['name_kr'] == name]
            else:
                hit = [c for c in in_set if c.get('card_no') == num]
            if len(hit) != 1 or hit[0]['name_kr'] != name:
                problems.append('%s row %s %s -> %s' % (d['id'], num, name, [(c['bs_code'], c['name_kr']) for c in hit]))
                continue
            cards.append({'bs_code': hit[0]['bs_code'], 'qty': qty})
            total += qty
        if total != 60:
            problems.append('%s totals %d' % (d['id'], total))
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
    decks = json.load(open(sys.argv[1], encoding='utf-8'))['decks']
    db = json.load(open(path('korean_cards_db.json'), encoding='utf-8'))
    presets = json.load(open(path('starter_deck_presets.json'), encoding='utf-8'))
    catalog = json.load(open(path('korean_decks_catalog.json'), encoding='utf-8'))
    problems, new_presets, new_catalog = build(decks, db, presets, catalog)
    if problems:
        print('\n'.join(problems))
        sys.exit(1)
    print(json.dumps({'presets': [p['id'] for p in new_presets], 'catalog': [c['name'] for c in new_catalog]}, ensure_ascii=False))
    if '--write' in sys.argv:
        presets['presets'].extend(new_presets)
        # newest products first, matching the official listing order the catalog was scraped in
        catalog['decks'] = new_catalog + catalog['decks']
        catalog['count'] = len(catalog['decks'])
        catalog['updated_at'] = decks[0].get('verified_at', catalog.get('scraped_at'))
        for name, obj in (('starter_deck_presets.json', presets), ('korean_decks_catalog.json', catalog)):
            with open(path(name), 'w', encoding='utf-8') as f:
                f.write(json.dumps(obj, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
