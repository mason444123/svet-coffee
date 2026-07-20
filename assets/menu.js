(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function ensureContainer(id, wrapperClass) {
    let node = document.getElementById(id);
    if (!node) {
      node = el('div', wrapperClass || '');
      node.id = id;
      const menu = document.getElementById('menu');
      const inner = menu ? menu.querySelector('.max-w-container-max') : null;
      (inner || menu || document.body).appendChild(node);
    }
    return node;
  }

  function setStatus(text, isError) {
    const status = document.getElementById('menuStatus');
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('text-error', !!isError);
    status.classList.toggle('text-secondary', !isError);
  }

  function formatPrice(n) {
    return n + ' ₽';
  }

  const CHIP_FOCUS = ' focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
  const CHIP_ACTIVE = 'px-4 py-2 rounded-full font-label-md text-label-md bg-primary text-on-primary transition-colors whitespace-nowrap' + CHIP_FOCUS;
  const CHIP_IDLE = 'px-4 py-2 rounded-full font-label-md text-label-md bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors whitespace-nowrap' + CHIP_FOCUS;

  function badge(label, variant) {
    return el('span', 'inline-block px-2 py-0.5 rounded-full font-label-sm text-label-sm ' + variant, label);
  }

  function appendBadges(node, item) {
    if (item.isNew) node.appendChild(badge('Новинка', 'bg-primary-fixed text-on-primary-fixed'));
    if (item.isSignature) node.appendChild(badge('Фирменный', 'bg-tertiary-fixed text-on-tertiary-fixed-variant'));
    if (item.isSeasonal) node.appendChild(badge('Сезонный', 'bg-secondary-fixed text-on-secondary-fixed-variant'));
  }

  function appendPrice(node, item, sizeGuide) {
    const pill = 'font-label-md text-label-md text-on-surface bg-surface-container-high px-3 py-1 rounded-full whitespace-nowrap';
    if (Array.isArray(item.prices) && item.prices.length) {
      if (item.prices.length === 1) {
        node.appendChild(el('span', pill, formatPrice(item.prices[0])));
      } else if (sizeGuide && sizeGuide.length === item.prices.length) {
        const wrap = el('div', 'flex flex-col items-end gap-0.5');
        for (let i = 0; i < item.prices.length; i++) {
          wrap.appendChild(el('span', 'font-label-md text-label-md text-on-surface-variant whitespace-nowrap', sizeGuide[i] + ' — ' + formatPrice(item.prices[i])));
        }
        node.appendChild(wrap);
      } else {
        node.appendChild(el('span', pill, item.prices.map(formatPrice).join(' / ')));
      }
    } else if (typeof item.price === 'number') {
      node.appendChild(el('span', pill, formatPrice(item.price)));
    }
  }

  function renderItem(item, sizeGuide, categoryVolume) {
    const card = el('div', 'bg-surface rounded-xl p-6 border border-outline-variant/30 ambient-shadow flex flex-col');
    const head = el('div', 'flex justify-between items-start gap-4 mb-3');
    head.appendChild(el('h4', 'font-headline-md text-headline-md text-primary', item.name));
    const priceWrap = el('div', 'flex flex-col items-end gap-1 shrink-0');
    appendPrice(priceWrap, item, sizeGuide);
    if (priceWrap.childNodes.length) head.appendChild(priceWrap);
    card.appendChild(head);

    if (item.description) {
      card.appendChild(el('p', 'font-body-md text-body-md text-on-surface-variant mb-3', item.description));
    }

    const meta = [];
    if (item.size) meta.push(item.size);
    if (item.volume) meta.push(item.volume);
    else if (categoryVolume && !item.size) meta.push(categoryVolume);
    if (meta.length) {
      card.appendChild(el('p', 'font-label-sm text-label-sm text-on-surface-variant mb-3', meta.join(' · ')));
    }

    const badges = el('div', 'flex flex-wrap gap-2 mt-auto');
    appendBadges(badges, item);
    if (badges.childNodes.length) card.appendChild(badges);
    return card;
  }

  var ACCORDION_MS = 340;

  function reducedMotion() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function resetPanelStyles(panel) {
    panel.style.height = '';
    panel.style.opacity = '';
    panel.style.transform = '';
    panel.style.overflow = '';
    panel.style.transition = '';
  }

  function animatePanel(panel, expand) {
    if (panel._accordionTimer) {
      clearTimeout(panel._accordionTimer);
      panel._accordionTimer = null;
    }
    if (reducedMotion()) {
      resetPanelStyles(panel);
      panel.hidden = !expand;
      return;
    }
    panel.style.overflow = 'hidden';
    panel.style.transition = 'height ' + ACCORDION_MS + 'ms ease, opacity ' + ACCORDION_MS + 'ms ease, transform ' + ACCORDION_MS + 'ms ease';
    if (expand) {
      panel.hidden = false;
      panel.style.height = '0px';
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(-4px)';
      void panel.offsetHeight;
      panel.style.height = panel.scrollHeight + 'px';
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
    } else {
      panel.style.height = panel.scrollHeight + 'px';
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
      void panel.offsetHeight;
      panel.style.height = '0px';
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(-4px)';
    }
    panel._accordionTimer = setTimeout(function () {
      panel._accordionTimer = null;
      resetPanelStyles(panel);
      panel.hidden = !expand;
    }, ACCORDION_MS);
  }

  function setCategoryOpen(section, open, animate) {
    var btn = section.querySelector('[data-category-toggle]');
    var panel = section.querySelector('[data-category-panel]');
    if (!btn || !panel) return;
    if ((btn.getAttribute('aria-expanded') === 'true') === open) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    var icon = btn.querySelector('[data-category-icon]');
    if (icon) {
      icon.style.transition = reducedMotion() ? '' : 'transform ' + ACCORDION_MS + 'ms ease';
      icon.style.transform = open ? 'rotate(180deg)' : '';
    }
    if (animate) {
      animatePanel(panel, open);
    } else {
      if (panel._accordionTimer) {
        clearTimeout(panel._accordionTimer);
        panel._accordionTimer = null;
      }
      resetPanelStyles(panel);
      panel.hidden = !open;
    }
  }

  function renderCategory(cat) {
    var section = el('section', 'py-8');
    section.setAttribute('data-category-id', cat.id);

    var panelId = 'category-panel-' + cat.id;

    var btn = el('button', 'w-full flex items-start justify-between gap-3 mb-5 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', panelId);
    btn.setAttribute('data-category-toggle', '');

    var titleWrap = el('span', 'flex items-center gap-3 flex-wrap');
    titleWrap.appendChild(el('span', 'font-headline-md text-headline-md md:text-headline-lg text-primary', cat.name));
    if (cat.isSeasonal) {
      titleWrap.appendChild(badge('Сезонное меню', 'bg-secondary-fixed text-on-secondary-fixed-variant'));
    }
    btn.appendChild(titleWrap);

    var metaWrap = el('span', 'flex items-center gap-2 shrink-0');
    metaWrap.appendChild(el('span', 'font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest whitespace-nowrap', cat.items.length + ' ' + pluralPositions(cat.items.length)));
    var icon = el('span', 'material-symbols-outlined text-on-surface-variant', 'expand_more');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('data-category-icon', '');
    metaWrap.appendChild(icon);
    btn.appendChild(metaWrap);

    btn.addEventListener('click', function () {
      setCategoryOpen(section, btn.getAttribute('aria-expanded') !== 'true', true);
    });
    section.appendChild(btn);

    var panel = el('div', '');
    panel.id = panelId;
    panel.setAttribute('data-category-panel', '');
    panel.hidden = true;

    if (cat.sizeGuide && cat.sizeGuide.length) {
      panel.appendChild(el('p', 'font-label-sm text-label-sm text-on-surface-variant mb-4', 'Размеры: ' + cat.sizeGuide.join(' / ')));
    }

    var grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-4');
    for (var i = 0; i < cat.items.length; i++) {
      grid.appendChild(renderItem(cat.items[i], cat.sizeGuide, cat.volume));
    }
    panel.appendChild(grid);
    section.appendChild(panel);
    return section;
  }

  function pluralPositions(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'позиция';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'позиции';
    return 'позиций';
  }

  function renderFilters(categories, filtersEl) {
    clear(filtersEl);
    const all = el('button', CHIP_ACTIVE, 'Все');
    all.type = 'button';
    all.setAttribute('aria-pressed', 'true');
    all.dataset.filter = 'all';
    filtersEl.appendChild(all);

    categories.forEach(function (cat) {
      const btn = el('button', CHIP_IDLE, cat.name);
      btn.type = 'button';
      btn.setAttribute('aria-pressed', 'false');
      btn.dataset.filter = cat.id;
      filtersEl.appendChild(btn);
    });

    filtersEl.addEventListener('click', function (e) {
      const target = e.target.closest('button[data-filter]');
      if (!target || target.dataset.filter === undefined) return;
      const filterId = target.dataset.filter;
      const buttons = filtersEl.querySelectorAll('button[data-filter]');
      buttons.forEach(function (b) {
        const active = b === target;
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
        b.className = active ? CHIP_ACTIVE : CHIP_IDLE;
      });
      const sections = document.querySelectorAll('#menuCatalog [data-category-id]');
      sections.forEach(function (s) {
        const match = filterId === 'all' || s.getAttribute('data-category-id') === filterId;
        s.style.display = match ? '' : 'none';
        if (match && filterId !== 'all') setCategoryOpen(s, true, true);
      });
    });
  }

  function renderCatalog(categories, catalogEl) {
    clear(catalogEl);
    categories.forEach(function (cat) {
      catalogEl.appendChild(renderCategory(cat));
    });
  }

  function renderExtras(extras, extrasEl) {
    clear(extrasEl);
    extrasEl.appendChild(el('h3', 'font-headline-md text-headline-md text-primary mb-4', 'Дополнительно'));
    const grid = el('div', 'grid grid-cols-1 md:grid-cols-2 gap-4');
    extras.forEach(function (ex) {
      const card = el('div', 'bg-surface rounded-xl p-5 border border-outline-variant/30 flex items-center justify-between gap-4');
      card.appendChild(el('span', 'font-body-md text-body-md text-on-surface', ex.name));
      card.appendChild(el('span', 'font-label-md text-label-md text-on-surface bg-surface-container-high px-3 py-1 rounded-full whitespace-nowrap', formatPrice(ex.price)));
      grid.appendChild(card);
    });
    extrasEl.appendChild(grid);
  }

  function renderContest(contest, contestEl) {
    clear(contestEl);
    const wrap = el('div', 'bg-surface rounded-xl border border-outline-variant/30 ambient-shadow overflow-hidden flex flex-col md:flex-row');

    if (contest.image) {
      const img = el('img', 'w-full md:w-1/2 object-cover');
      img.src = contest.image;
      img.alt = contest.title || '';
      img.loading = 'lazy';
      wrap.appendChild(img);
    }

    const body = el('div', 'p-6 md:p-8 flex flex-col gap-3 flex-1 md:justify-center');
    if (Array.isArray(contest.brands) && contest.brands.length) {
      body.appendChild(el('p', 'font-label-sm text-label-sm text-secondary uppercase tracking-widest', contest.brands.join(' · ')));
    }
    if (contest.title) body.appendChild(el('h3', 'font-headline-lg text-headline-lg text-primary', contest.title));
    if (contest.subtitle) body.appendChild(el('p', 'font-body-lg text-body-lg text-on-surface-variant', contest.subtitle));

    if (Array.isArray(contest.items) && contest.items.length) {
      const list = el('ul', 'flex flex-col gap-2 mt-2');
      contest.items.forEach(function (it) {
        const li = el('li', 'flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-2 last:border-0');
        li.appendChild(el('span', 'font-body-md text-body-md text-on-surface', it.name));
        const priceNode = el('span', 'font-label-md text-label-md text-on-surface bg-surface-container-high px-3 py-1 rounded-full whitespace-nowrap');
        if (typeof it.price === 'number') priceNode.textContent = formatPrice(it.price);
        else if (Array.isArray(it.prices) && it.prices.length) priceNode.textContent = it.prices.map(formatPrice).join(' / ');
        li.appendChild(priceNode);
        list.appendChild(li);
      });
      body.appendChild(list);
    }

    wrap.appendChild(body);
    contestEl.appendChild(wrap);
  }

  function init() {
    const status = ensureContainer('menuStatus', 'font-body-md text-body-md text-secondary text-center mb-6');
    const filters = ensureContainer('menuCategoryFilters', 'flex flex-wrap gap-2 mb-10');
    const catalog = ensureContainer('menuCatalog', '');
    const extras = ensureContainer('menuExtras', 'mt-12');
    const contest = ensureContainer('contestContent', 'mt-12');

    status.textContent = 'Меню загружается…';
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', 'Фильтры по категориям');

    fetch('data/menu.json', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.categories)) {
          throw new Error('Структура меню некорректна');
        }
        renderFilters(data.categories, filters);
        renderCatalog(data.categories, catalog);
        if (Array.isArray(data.extras)) renderExtras(data.extras, extras);
        if (data.contest) renderContest(data.contest, contest);
        setStatus('Меню загружено: ' + data.categories.length + ' ' + pluralCategories(data.categories.length) + '.', false);
        status.classList.add('sr-only');
      })
      .catch(function (err) {
        status.classList.remove('sr-only');
        setStatus('Не удалось загрузить меню. Проверьте подключение к сети или наличие файла data/menu.json. (' + (err && err.message ? err.message : 'неизвестная ошибка') + ')', true);
      });
  }

  function pluralCategories(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'категория';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'категории';
    return 'категорий';
  }

  ready(init);
})();
