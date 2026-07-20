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

    const add = el('button', 'mt-5 w-full h-11 rounded-full bg-primary text-on-primary font-label-md text-label-md tracking-wide transition-transform hover:scale-[1.01] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2', 'В корзину');
    add.type = 'button';
    add.addEventListener('click', function () {
      addToCart(item);
    });
    card.appendChild(add);
    return card;
  }

  var ACCORDION_MS = 440;
  var SHEET_MS = 460;
  var MOTION_EASE = 'cubic-bezier(.22, 1, .36, 1)';

  function reducedMotion() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function resetPanelStyles(panel) {
    panel.style.height = '';
    panel.style.opacity = '';
    panel.style.transform = '';
    panel.style.overflow = '';
    panel.style.transition = '';
    panel.style.willChange = '';
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
    panel.style.transition = 'height ' + ACCORDION_MS + 'ms ' + MOTION_EASE + ', opacity ' + ACCORDION_MS + 'ms ' + MOTION_EASE + ', transform ' + ACCORDION_MS + 'ms ' + MOTION_EASE;
    panel.style.willChange = 'height, opacity, transform';
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
      icon.style.transition = reducedMotion() ? '' : 'transform ' + ACCORDION_MS + 'ms ' + MOTION_EASE;
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

  var cart = [];
  var shop = null;

  function itemPrice(item) {
    if (typeof item.price === 'number') return item.price;
    if (Array.isArray(item.prices) && item.prices.length) return item.prices[0];
    return 0;
  }

  function cartTotal() {
    return cart.reduce(function (sum, entry) { return sum + entry.price * entry.quantity; }, 0);
  }

  function addToCart(item) {
    var price = itemPrice(item);
    var entry = cart.find(function (x) { return x.name === item.name && x.price === price; });
    if (entry) entry.quantity += 1;
    else cart.push({ name: item.name, price: price, quantity: 1 });
    renderCart();
  }

  function createButton(label, classes) {
    var button = el('button', classes, label);
    button.type = 'button';
    return button;
  }

  function createShopShell(filters, catalog, extras) {
    var menu = document.getElementById('menu');
    var inner = menu.querySelector('.max-w-container-max');
    var launcher = el('div', 'mt-10 rounded-2xl border border-outline-variant/40 bg-surface px-6 py-7 md:px-10 md:py-9 ambient-shadow flex flex-col md:flex-row md:items-center justify-between gap-6');
    var copy = el('div', '');
    copy.appendChild(el('p', 'font-label-sm text-label-sm text-secondary uppercase tracking-[0.18em] mb-2', '79 позиций · собирайте свой заказ'));
    copy.appendChild(el('p', 'font-body-lg text-body-lg text-on-surface-variant', 'Каталог открывается в отдельном спокойном пространстве — без длинной ленты.'));
    var open = createButton('Открыть меню', 'h-12 px-7 rounded-full bg-primary text-on-primary font-label-md text-label-md tracking-wide whitespace-nowrap transition-transform hover:scale-[1.02] active:scale-[0.98]');
    launcher.appendChild(copy); launcher.appendChild(open);
    inner.appendChild(launcher);

    var overlay = el('div', 'fixed inset-0 z-[80] hidden opacity-0 bg-scrim/50 backdrop-blur-sm p-0 md:p-8');
    overlay.style.transition = 'opacity ' + SHEET_MS + 'ms ' + MOTION_EASE;
    overlay.style.willChange = 'opacity';
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Меню кофейни');
    var panel = el('div', 'absolute inset-x-0 bottom-0 max-h-[92svh] overflow-hidden rounded-t-3xl bg-surface shadow-2xl translate-y-full md:relative md:inset-auto md:mx-auto md:max-w-6xl md:max-h-full md:h-full md:rounded-3xl');
    panel.style.transition = 'transform ' + SHEET_MS + 'ms ' + MOTION_EASE;
    panel.style.willChange = 'transform';
    var top = el('div', 'flex items-center justify-between gap-4 px-5 py-5 md:px-8 border-b border-outline-variant/35');
    var title = el('div', ''); title.appendChild(el('p', 'font-label-sm text-label-sm text-secondary uppercase tracking-[0.18em]', 'Свет. кофейня')); title.appendChild(el('h2', 'font-headline-md text-headline-md text-primary', 'Выберите позиции'));
    var close = createButton('close', 'material-symbols-outlined w-11 h-11 rounded-full bg-surface-container-high text-primary grid place-items-center'); close.setAttribute('aria-label', 'Закрыть меню'); top.appendChild(title); top.appendChild(close); panel.appendChild(top);
    var content = el('div', 'overflow-y-auto max-h-[calc(92svh-84px)] p-5 pb-32 md:p-8 md:pb-32');
    filters.className = 'flex overflow-x-auto whitespace-nowrap md:flex-wrap md:whitespace-normal md:overflow-visible gap-2 mb-7 pb-2';
    content.appendChild(filters); content.appendChild(catalog); content.appendChild(extras); panel.appendChild(content); overlay.appendChild(panel); document.body.appendChild(overlay);

    var cartButton = createButton('', 'fixed z-[81] bottom-5 right-5 h-14 px-5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-xl hidden items-center gap-2');
    cartButton.setAttribute('aria-label', 'Открыть корзину'); document.body.appendChild(cartButton);
    var cartPanel = el('aside', 'fixed z-[90] inset-x-4 bottom-4 hidden rounded-2xl bg-surface shadow-2xl border border-outline-variant/35 p-5 md:left-auto md:w-[420px]');
    cartPanel.style.transition = 'opacity 320ms ' + MOTION_EASE + ', transform 320ms ' + MOTION_EASE;
    cartPanel.style.willChange = 'opacity, transform';
    document.body.appendChild(cartPanel);

    function setCartPanel(opened) {
      if (opened) {
        cartPanel.classList.remove('hidden');
        cartPanel.style.opacity = '0'; cartPanel.style.transform = 'translate3d(0, 14px, 0)'; cartPanel.style.pointerEvents = 'none';
        requestAnimationFrame(function () { cartPanel.style.opacity = '1'; cartPanel.style.transform = 'translate3d(0, 0, 0)'; cartPanel.style.pointerEvents = ''; });
      } else {
        cartPanel.style.opacity = '0'; cartPanel.style.transform = 'translate3d(0, 14px, 0)'; cartPanel.style.pointerEvents = 'none';
        setTimeout(function () { cartPanel.classList.add('hidden'); }, 320);
      }
    }

    function setOverlay(opened) {
      if (opened) { overlay.classList.remove('hidden'); requestAnimationFrame(function () { overlay.classList.remove('opacity-0'); panel.classList.remove('translate-y-full'); }); document.body.style.overflow = 'hidden'; close.focus(); }
      else { overlay.classList.add('opacity-0'); panel.classList.add('translate-y-full'); setCartPanel(false); document.body.style.overflow = ''; setTimeout(function () { overlay.classList.add('hidden'); }, SHEET_MS); }
    }
    open.addEventListener('click', function () { setOverlay(true); }); close.addEventListener('click', function () { setOverlay(false); });
    overlay.addEventListener('click', function (event) { if (event.target === overlay) setOverlay(false); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { setOverlay(false); setCartPanel(false); } });
    cartButton.addEventListener('click', function () { setCartPanel(cartPanel.classList.contains('hidden')); renderCart(); });
    shop = { overlay: overlay, panel: panel, cartButton: cartButton, cartPanel: cartPanel, setOverlay: setOverlay, setCartPanel: setCartPanel };
  }

  function renderCart() {
    if (!shop) return;
    var count = cart.reduce(function (sum, x) { return sum + x.quantity; }, 0);
    shop.cartButton.classList.toggle('hidden', count === 0);
    shop.cartButton.classList.toggle('flex', count > 0);
    shop.cartButton.textContent = 'shopping_bag  Корзина · ' + count + ' · ' + formatPrice(cartTotal());
    clear(shop.cartPanel);
    shop.cartPanel.appendChild(el('h3', 'font-headline-md text-headline-md text-primary mb-4', 'Ваш заказ'));
    if (!cart.length) { shop.cartPanel.appendChild(el('p', 'font-body-md text-body-md text-on-surface-variant', 'Корзина пока пуста.')); return; }
    var list = el('div', 'flex flex-col gap-3 max-h-64 overflow-y-auto');
    cart.forEach(function (entry) {
      var row = el('div', 'flex items-center justify-between gap-3 border-b border-outline-variant/30 pb-3');
      row.appendChild(el('span', 'font-body-md text-body-md text-on-surface flex-1', entry.name));
      var controls = el('div', 'flex items-center gap-2');
      var minus = createButton('−', 'w-8 h-8 rounded-full bg-surface-container-high text-primary');
      minus.addEventListener('click', function () { entry.quantity -= 1; if (entry.quantity < 1) cart.splice(cart.indexOf(entry), 1); renderCart(); });
      controls.appendChild(minus); controls.appendChild(el('span', 'font-label-md text-label-md w-4 text-center', String(entry.quantity)));
      var plus = createButton('+', 'w-8 h-8 rounded-full bg-surface-container-high text-primary'); plus.addEventListener('click', function () { entry.quantity += 1; renderCart(); }); controls.appendChild(plus); row.appendChild(controls); list.appendChild(row);
    });
    shop.cartPanel.appendChild(list); shop.cartPanel.appendChild(el('p', 'mt-5 font-headline-md text-headline-md text-primary', 'Итого · ' + formatPrice(cartTotal())));
    var checkout = createButton('Оформить заказ', 'mt-5 w-full h-12 rounded-full bg-primary text-on-primary font-label-md text-label-md'); checkout.addEventListener('click', openCheckout); shop.cartPanel.appendChild(checkout);
  }

  function openCheckout() {
    if (!shop || !cart.length) return;
    shop.setCartPanel(false);
    var modal = el('div', 'fixed inset-0 z-[95] bg-scrim/50 p-4 grid place-items-end md:place-items-center');
    modal.style.opacity = '0'; modal.style.transition = 'opacity 320ms ' + MOTION_EASE; modal.style.willChange = 'opacity';
    var form = el('form', 'w-full max-w-xl rounded-3xl bg-surface p-6 md:p-8'); form.noValidate = true;
    form.style.opacity = '0'; form.style.transform = 'translate3d(0, 18px, 0)'; form.style.transition = 'opacity 360ms ' + MOTION_EASE + ', transform 360ms ' + MOTION_EASE; form.style.willChange = 'opacity, transform';
    var formTop = el('div', 'flex items-start justify-between gap-4 mb-6');
    var formTitle = el('div', ''); formTitle.appendChild(el('h2', 'font-headline-lg text-headline-lg text-primary mb-2', 'Оформление заказа')); formTitle.appendChild(el('p', 'font-body-md text-body-md text-on-surface-variant', 'Проверьте контакты — состав корзины уже добавлен.'));
    var closeCheckout = createButton('close', 'material-symbols-outlined w-11 h-11 shrink-0 rounded-full bg-surface-container-high text-primary grid place-items-center'); closeCheckout.setAttribute('aria-label', 'Закрыть оформление'); closeCheckout.addEventListener('click', function () { modal.style.opacity = '0'; form.style.opacity = '0'; form.style.transform = 'translate3d(0, 18px, 0)'; setTimeout(function () { modal.remove(); }, 360); });
    formTop.appendChild(formTitle); formTop.appendChild(closeCheckout); form.appendChild(formTop);
    [['name','Имя','Ваше имя'],['phone','Телефон','+7 900 000-00-00'],['address','Адрес','Город, улица, дом, квартира'],['comment','Комментарий','Подъезд, домофон или пожелания']].forEach(function (field) { var label=el('label','block mb-4'); label.appendChild(el('span','block font-label-md text-label-md text-primary mb-2',field[1])); var input=document.createElement(field[0] === 'comment' ? 'textarea' : 'input'); input.name=field[0]; input.placeholder=field[2]; input.className='w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 font-body-md text-body-md'; if(field[0] !== 'comment') input.required=true; label.appendChild(input); form.appendChild(label); });
    var status = el('p', 'min-h-5 font-body-sm text-body-sm text-secondary mb-3'); form.appendChild(status);
    var submit=createButton('Отправить заказ','w-full h-12 rounded-full bg-primary text-on-primary font-label-md text-label-md'); form.appendChild(submit); modal.appendChild(form); document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.style.opacity = '1'; form.style.opacity = '1'; form.style.transform = 'translate3d(0, 0, 0)'; });
    form.addEventListener('submit', function (event) { event.preventDefault(); submitOrder(form, status, submit); });
  }

  function submitOrder(form, status, submit) {
    var data = new FormData(form); var customer = {name:String(data.get('name')||'').trim(), phone:String(data.get('phone')||'').trim(), address:String(data.get('address')||'').trim(), comment:String(data.get('comment')||'').trim()};
    if (customer.name.length < 2 || !customer.phone || !customer.address) { status.textContent='Заполните имя, телефон и адрес.'; status.className='min-h-5 font-body-sm text-body-sm text-error mb-3'; return; }
    if (!window.SVET_ORDER_ENDPOINT) { status.textContent='Отправка в Telegram ещё не подключена. Заказ не был отправлен.'; status.className='min-h-5 font-body-sm text-body-sm text-secondary mb-3'; return; }
    submit.disabled=true; submit.textContent='Отправляем…';
    fetch(window.SVET_ORDER_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer:customer,items:cart.map(function(x){return {name:x.name,quantity:x.quantity,unitPrice:x.price};}),total:cartTotal()})}).then(function(res){if(!res.ok)throw new Error('order'); cart=[]; renderCart(); status.textContent='Заказ отправлен. Мы скоро уточним детали.';}).catch(function(){status.textContent='Не удалось отправить заказ. Попробуйте позже.';}).finally(function(){submit.disabled=false;submit.textContent='Отправить заказ';});
  }

  function init() {
    const status = ensureContainer('menuStatus', 'font-body-md text-body-md text-secondary text-center mb-6');
    const filters = ensureContainer('menuCategoryFilters', 'flex flex-wrap gap-2 mb-10');
    const catalog = ensureContainer('menuCatalog', '');
    const extras = ensureContainer('menuExtras', 'mt-12');
    const contest = ensureContainer('contestContent', 'mt-12');
    createShopShell(filters, catalog, extras);

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
