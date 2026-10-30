"""Parse an official pokemoncard.co.kr card detail page (/cards/detail/<bs_code>)
into a korean_cards_db.json record. Field order and text normalization follow the
existing DB so that re-parsing existing cards reproduces their stored records.

Usage: python3 -I scripts/parse_card_detail.py <bs_code> <detail.html>  -> prints JSON
"""
import html as H
import json
import re
import sys

IMG_HOST = 'https://cards.image.pokemonkorea.co.kr/data/'
CLASS_BY_TYPE = [('스타디움', 'stadium'), ('에너지', 'energy'), ('아이템', 'trainer'), ('서포트', 'trainer'),
                 ('서포터', 'trainer'), ('포켓몬의 도구', 'trainer'), ('복원', 'trainer')]
TRAINER_SUBTYPE = [('아이템', 'item'), ('서포트', 'supporter'), ('서포터', 'supporter'), ('복원', 'fossil')]
RULE_LABELS = ('룰',)


def text(fragment):
    """Inline markup to the DB's plain text, matching the original scrape: any run of
    tags plus the whitespace around it becomes one space (so <b>독</b>으로 -> 독 으로);
    other whitespace, including line breaks, is kept and only the ends are trimmed."""
    s = re.sub(r'\s*(?:<[^>]+>\s*)+', ' ', fragment)
    return H.unescape(s).strip()


def one_decimal(v, unit):
    num = re.match(r'^([\d.]+)\s*' + unit + '$', v.strip())
    return '%.1f %s' % (float(num.group(1)), unit) if num else v.strip()


def first(pattern, s, flags=re.S):
    m = re.search(pattern, s, flags)
    return m.group(1) if m else None


def card_class(card_type, has_hp):
    if has_hp or '포켓몬' in card_type and '도구' not in card_type:
        return 'pokemon'
    for key, cls in CLASS_BY_TYPE:
        if key in card_type:
            return cls
    return 'trainer'


def parse(bs_code, page):
    top = page[page.find('id="heaer_top"'):page.find('id="detail_card_wrap"')]
    if 'card-hp title' not in top:
        return None
    rec = {'bs_code': bs_code}
    img = first(r'<img src="[^"]*?/data/(wmimages/[^"?]+)[^"]*" class="feature_image"', top)
    if img:
        rec['image_url'] = IMG_HOST + img
        parts = img.split('/')
        rec['series_code'] = parts[1]
        rec['pack_code'] = parts[2]
        fname = parts[-1].rsplit('.', 1)[0]
        pack_file, _, num = fname.rpartition('_')
        rec['pack_file'] = pack_file
        if num.isdigit():
            rec['card_no'] = int(num)
    pnum = re.search(r'<span class="p_num">([^<]*)<span id="no_wrap_by_admin">([^<]*)<', top)
    display = None
    if pnum and not pnum.group(2).strip():
        display = re.match(r'^\s*(\d+)/(\d+)\s*$', pnum.group(1))
    if display:
        rec['card_no_display'] = display.group(1)
        rec['set_total'] = int(display.group(2))
    ill = first(r'<p class="illustrator">일러스트<br />(.*?)</p>', top)
    if ill is not None:
        rec['illustrator'] = text(ill)
    # the original scrape dropped padding runs inside names (텔레패스 초   에너지 -> 텔레패스 초에너지)
    rec['name_kr'] = re.sub(r'\s{2,}', '', text(first(r'<span class="card-hp title">(.*?)</span>', top)))
    ctype = first(r'<div class="pokemon-info">\s*카드 종류 :(.*?)</div>', top)
    rec['card_type'] = H.unescape(re.sub(r'<[^>]+>', '', ctype or '')).strip()
    pack_full = first(r'class="search_href">(.*?)</a>', top)
    if pack_full:
        pack_full = H.unescape(pack_full).strip()  # may contain literal <...> in product names
        m = re.match(r'^(.*?)\s*「(.*?)」', pack_full)
        if m:
            if m.group(1):
                rec['series_name_kr'] = m.group(1)
            rec['pack_name_kr'] = m.group(2)
        else:
            rec['pack_name_kr'] = pack_full
        rec['pack_full_kr'] = pack_full
    hp = first(r'<span class="hp_num">HP\s*(\d+)</span>', top)
    rec['card_class'] = card_class(rec['card_type'], hp is not None)

    abil = first(r'<div class="pokemon-abilities">(.*?)<div class="clearfix"></div>', top) or ''
    blocks = re.split(r'<div class="ability[^"]*">', abil)[1:]

    if rec['card_class'] == 'pokemon':
        if hp:
            rec['hp'] = int(hp)
        ptype = first(r'<span class="hp_num">.*?title="([^"]+)"', top)
        if ptype:
            rec['pokemon_type'] = ptype
        detail = top[top.rfind('<div class="pokemon-detail txt_centre">'):]
        h = first(r'키 : ([^<]+?)\s*<br', detail)
        w = first(r'몸무게 : ([^<]+?)\s*</div>', detail)
        if h:
            rec['height'] = one_decimal(h, 'm')
        if w:
            rec['weight'] = one_decimal(w, 'kg')
        no = first(r'<!--No\. (\d+)-->', detail)
        if no:
            rec['pokedex_no'] = int(no)
        flav = first(r'colsit">\s*<p>(.*?)</p>', detail)
        if flav and text(flav):
            rec['flavor_text'] = text(flav)
        stats = top[top.find('<div class="pokemon-stats">'):]
        weak = first(r'<h4>약점</h4>(.*?)</div>', stats)
        if weak:
            t = first(r'title="([^"]+)"', weak)
            mult = first(r'<span>\s*×\s*(\d+)\s*</span>', weak)
            if t:
                rec['weakness_type'] = t
            if mult:
                rec['weakness_mult'] = int(mult)
        res = first(r'<h4>저항력</h4>(.*?)</div>', stats)
        if res:
            t = first(r'title="([^"]+)"', res)
            v = first(r'<span>\s*([-−]\s*\d+)\s*</span>', res)
            if t:
                rec['resist_type'] = t
            if v:
                rec['resist_value'] = abs(int(v.replace('−', '-').replace(' ', '')))
        retreat = first(r'title="후퇴 : (\d+)"', stats)
        if retreat is not None:
            rec['retreat'] = int(retreat)
        skills = []
        for b in blocks:
            head = first(r'<div class="area-parent">(.*?)</div>', b) or ''
            name = first(r'<span class="skil_name">(.*?)</span>\s', head + ' ')
            if name is None:
                name = first(r'<h4[^>]*>(.*?)</h4>', b) or ''
            sk = {'name': text(name)}
            dmg = first(r'<span class="plus">(.*?)</span>', head)
            if dmg is not None and text(dmg):
                sk['damage'] = text(dmg)
            costs = re.findall(r'<img[^>]*class="type_b"[^>]*title="([^"]+)"', head)
            if costs:
                sk['cost'] = costs
            body = first(r'<p>(.*?)</p>', b)
            if body is not None and text(body):
                sk['text'] = text(body)
            skills.append(sk)
        rec['skills'] = skills
    else:
        parts = []
        for b in blocks:
            body = first(r'<p>(.*?)</p>', b)
            if body is not None and text(body):
                parts.append(text(body))
        if parts:
            rec['effect_text'] = '\n'.join(parts)
        if rec['card_class'] == 'trainer':
            for key, sub in TRAINER_SUBTYPE:
                if rec['card_type'].startswith(key):
                    rec['trainer_subtype'] = sub
                    break
    return rec


if __name__ == '__main__':
    print(json.dumps(parse(sys.argv[1], open(sys.argv[2], encoding='utf-8').read()), ensure_ascii=False))
