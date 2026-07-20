#!/usr/bin/env python3
"""Validate the Svet Coffee menu site: data/menu.json, index.html, assets/menu.js.

No external dependencies. Run: python3 scripts/validate_menu_site.py
Exits 0 with VALIDATION_OK on success, 1 on any failure.
"""
import json
import os
import sys
import re


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
MENU_PATH = os.path.join(ROOT, "data", "menu.json")
INDEX_PATH = os.path.join(ROOT, "index.html")
JS_PATH = os.path.join(ROOT, "assets", "menu.js")


def fail(msg):
    print("FAIL: " + msg)
    print("VALIDATION_FAILED")
    sys.exit(1)


def read_text(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def is_positive_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0


def check_positive_prices(prices, context):
    if not isinstance(prices, list):
        fail("%s: prices must be a list" % context)
    if not prices:
        fail("%s: prices list must not be empty" % context)
    for p in prices:
        if not is_positive_number(p):
            fail("%s: price %r is not a positive number" % (context, p))


def validate_menu_json(data):
    if not isinstance(data, dict):
        fail("menu.json root must be an object")

    categories = data.get("categories")
    if not isinstance(categories, list):
        fail("menu.json: 'categories' must be a list")
    if len(categories) != 15:
        fail("menu.json: expected 15 categories, got %d" % len(categories))
    print("PASS: 15 categories present")

    total_items = 0
    seen_ids = set()
    for i, cat in enumerate(categories):
        if not isinstance(cat, dict):
            fail("menu.json: category #%d must be an object" % i)
        cid = cat.get("id")
        if not isinstance(cid, str) or not cid:
            fail("menu.json: category #%d missing 'id'" % i)
        if cid in seen_ids:
            fail("menu.json: duplicate category id %r" % cid)
        seen_ids.add(cid)
        if not isinstance(cat.get("name"), str) or not cat.get("name"):
            fail("menu.json: category %r missing 'name'" % cid)
        items = cat.get("items")
        if not isinstance(items, list):
            fail("menu.json: category %r 'items' must be a list" % cid)
        for j, item in enumerate(items):
            if not isinstance(item, dict):
                fail("menu.json: category %r item #%d must be an object" % (cid, j))
            name = item.get("name")
            if not isinstance(name, str) or not name:
                fail("menu.json: category %r item #%d missing 'name'" % (cid, j))
            has_price = "price" in item
            has_prices = "prices" in item
            if has_price and has_prices:
                fail("menu.json: category %r item #%d has both 'price' and 'prices'" % (cid, j))
            if not has_price and not has_prices:
                fail("menu.json: category %r item #%d needs 'price' or 'prices'" % (cid, j))
            if has_price:
                if not is_positive_number(item["price"]):
                    fail("menu.json: category %r item #%d 'price' must be positive number" % (cid, j))
            if has_prices:
                check_positive_prices(item["prices"], "menu.json: category %r item #%d" % (cid, j))
        total_items += len(items)
    print("PASS: category ids unique")

    if total_items != 79:
        fail("menu.json: expected 79 category items, got %d" % total_items)
    print("PASS: 79 category items present")

    extras = data.get("extras")
    if not isinstance(extras, list):
        fail("menu.json: 'extras' must be a list")
    if len(extras) != 2:
        fail("menu.json: expected 2 extras, got %d" % len(extras))
    for k, ex in enumerate(extras):
        if not isinstance(ex, dict):
            fail("menu.json: extras #%d must be an object" % k)
        if not isinstance(ex.get("name"), str) or not ex.get("name"):
            fail("menu.json: extras #%d missing 'name'" % k)
        if not is_positive_number(ex.get("price")):
            fail("menu.json: extras #%d 'price' must be a positive number" % k)
    print("PASS: 2 extras present")

    contest = data.get("contest")
    if not isinstance(contest, dict):
        fail("menu.json: 'contest' must be an object")
    citems = contest.get("items")
    if not isinstance(citems, list):
        fail("menu.json: 'contest.items' must be a list")
    if len(citems) != 3:
        fail("menu.json: expected 3 contest items, got %d" % len(citems))
    for k, it in enumerate(citems):
        if not isinstance(it, dict):
            fail("menu.json: contest item #%d must be an object" % k)
        if not isinstance(it.get("name"), str) or not it.get("name"):
            fail("menu.json: contest item #%d missing 'name'" % k)
        if not is_positive_number(it.get("price")):
            fail("menu.json: contest item #%d 'price' must be a positive number" % k)
    print("PASS: 3 contest items present")


def validate_index_html(html):
    required_ids = ["menuStatus", "menuCategoryFilters", "menuCatalog",
                    "menuExtras", "contest", "contestContent", "orderSubmit"]
    for eid in required_ids:
        pattern = r'id="%s"' % re.escape(eid)
        if not re.search(pattern, html):
            fail("index.html: missing element #%s" % eid)
    print("PASS: index.html has all required ids")

    if not re.search(r'src=["\']assets/menu\.js(\?[^"\']*)?["\']', html):
        fail("index.html: missing <script src=\"assets/menu.js\">")
    print("PASS: index.html links assets/menu.js")

    m = re.search(r'<button[^>]*id="orderSubmit"[^>]*>', html, re.DOTALL)
    if not m:
        m = re.search(r'<[^>]*id="orderSubmit"[^>]*>', html, re.DOTALL)
    if not m:
        fail("index.html: #orderSubmit button not found")
    tag = m.group(0)
    if "disabled" not in tag:
        fail("index.html: #orderSubmit must be disabled")
    print("PASS: #orderSubmit is disabled")

    forbidden = ["€3.50", "Flat White", "View Full Menu"]
    for token in forbidden:
        if token in html:
            fail("index.html: forbidden text %r present" % token)
    print("PASS: index.html free of forbidden tokens")


def validate_menu_js(js):
    if not re.search(r'fetch\s*\(\s*["\']data/menu\.json["\']', js):
        if "data/menu.json" not in js:
            fail("assets/menu.js: missing fetch('data/menu.json') or equivalent")
    print("PASS: assets/menu.js fetches data/menu.json")

    if "aria-pressed" not in js:
        fail("assets/menu.js: missing aria-pressed handler")
    print("PASS: assets/menu.js handles aria-pressed")

    if "Все" not in js:
        fail("assets/menu.js: missing 'Все' filter")
    print("PASS: assets/menu.js has 'Все' filter")

    if not (re.search(r'\.catch\s*\(', js) or re.search(r'try\s*\{', js) or "throw" in js):
        fail("assets/menu.js: missing error handling (.catch / try / throw)")
    print("PASS: assets/menu.js has error handling")

    if "document.createElement" not in js and "createElement" not in js:
        fail("assets/menu.js: missing document.createElement usage")
    if ".textContent" not in js:
        fail("assets/menu.js: missing .textContent usage")
    print("PASS: assets/menu.js uses createElement and textContent")

    if re.search(r'\.innerHTML\s*=', js):
        fail("assets/menu.js: assignment to .innerHTML is forbidden")
    print("PASS: assets/menu.js does not assign innerHTML")


def main():
    if not os.path.exists(MENU_PATH):
        fail("data/menu.json not found at %s" % MENU_PATH)
    try:
        with open(MENU_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        fail("data/menu.json is not valid JSON: %s" % e)
    validate_menu_json(data)

    if not os.path.exists(INDEX_PATH):
        fail("index.html not found at %s" % INDEX_PATH)
    html = read_text(INDEX_PATH)
    validate_index_html(html)

    if not os.path.exists(JS_PATH):
        fail("assets/menu.js not found at %s" % JS_PATH)
    js = read_text(JS_PATH)
    validate_menu_js(js)

    print("VALIDATION_OK")


if __name__ == "__main__":
    main()
