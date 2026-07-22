(function () {
  'use strict';

  var config = window.SVET_CONFIG || {};
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = Boolean(navigator.connection && navigator.connection.saveData);
  var formatMoney = new Intl.NumberFormat('ru-RU');
  var CART_STORAGE_KEY = 'svet-cart-session-v10';
  var COOKIE_CONSENT_KEY = 'svet-cookie-consent-v2';
  var toastTimer = null;
  var menuData = null;
  var activeGroupIndex = 0;
  var syrupPickerId = 0;
  clearLegacyCart();
  var cart = readCart();

  var groups = [
    {
      id: 'drinks',
      title: 'Лимонады',
      eyebrow: 'Свежесть · ягоды · чай',
      description: 'Лимонады, bubble tea, чай и напитки без кофе',
      image: 'assets/menu-lemonade.webp',
      categoryIds: ['lemonades', 'bubble-tea', 'cold-drinks', 'tea', 'not-coffee']
    },
    {
      id: 'coffee',
      title: 'Кофе',
      eyebrow: 'Эспрессо · молоко · лёд',
      description: 'Классика, авторские вкусы и холодный кофе',
      image: 'assets/menu-coffee.webp',
      categoryIds: ['coffee-classics', 'signature-coffee', 'cold-coffee']
    },
    {
      id: 'food',
      title: 'Еда',
      eyebrow: 'Весь день · сытно · тепло',
      description: 'Завтраки, несладкие вафли, салаты и сэндвичи',
      image: 'assets/menu-food-v2.webp',
      categoryIds: ['breakfasts', 'savory-waffles', 'salads', 'pizza-snacks']
    },
    {
      id: 'sweet',
      title: 'Сладкое',
      eyebrow: 'Вафли · ягоды · крем',
      description: 'Тёплые вафли и сладкие сочетания',
      image: 'assets/menu-dessert-v2.webp',
      categoryIds: ['sweet-waffles']
    },
    {
      id: 'season',
      title: 'Сезонное',
      eyebrow: 'Лето в городе',
      description: 'Напитки, которые хочется взять с собой',
      image: 'assets/menu-seasonal-v2.webp',
      categoryIds: ['summer-coffee', 'summer-lemonades']
    }
  ];

  var dom = {
    siteIntro: document.querySelector('[data-site-intro]'),
    header: document.querySelector('[data-site-header]'),
    heroImage: document.querySelector('[data-hero-image]'),
    heroSlider: document.querySelector('[data-hero-slider]'),
    heroSlideName: document.querySelector('[data-hero-slide-name]'),
    heroSlidePrice: document.querySelector('[data-hero-slide-price]'),
    rail: document.querySelector('[data-menu-rail]'),
    railStatus: document.querySelector('[data-menu-status]'),
    railProgress: document.querySelector('[data-rail-progress]'),
    burgerButton: document.querySelector('[data-open-nav]'),
    navDialog: document.getElementById('navDialog'),
    menuDialog: document.getElementById('menuDialog'),
    menuImage: document.querySelector('[data-dialog-image]'),
    menuEyebrow: document.querySelector('[data-dialog-eyebrow]'),
    menuTitle: document.querySelector('[data-dialog-title]'),
    menuDescription: document.querySelector('[data-dialog-description]'),
    categoryTabs: document.querySelector('[data-category-tabs]'),
    productList: document.querySelector('[data-product-list]'),
    menuExtras: document.querySelector('[data-menu-extras]'),
    menuDialogProgress: document.querySelector('[data-menu-dialog-progress]'),
    contestDialog: document.getElementById('contestDialog'),
    contestProducts: document.querySelector('[data-contest-products]'),
    cartDialog: document.getElementById('cartDialog'),
    cartList: document.querySelector('[data-cart-list]'),
    cartSummary: document.querySelector('[data-cart-summary]'),
    cartTotal: document.querySelector('[data-cart-total]'),
    cartView: document.querySelector('[data-cart-view]'),
    checkoutForm: document.querySelector('[data-checkout-form]'),
    checkoutLabel: document.querySelector('[data-checkout-label]'),
    checkoutStatus: document.querySelector('[data-checkout-status]'),
    cartFab: document.querySelector('[data-cart-fab]'),
    cartFabTotal: document.querySelector('[data-cart-fab-total]'),
    menuCart: document.querySelector('[data-menu-cart]'),
    menuCartTotal: document.querySelector('[data-menu-cart-total]'),
    quickForm: document.querySelector('[data-quick-form]'),
    successDialog: document.getElementById('successDialog'),
    successTitle: document.getElementById('successTitle'),
    successText: document.querySelector('[data-success-text]'),
    successOrder: document.querySelector('[data-success-order]'),
    successPhone: document.querySelector('[data-success-phone]'),
    cookieNotice: document.querySelector('[data-cookie-notice]'),
    toast: document.querySelector('[data-toast]')
  };

  function create(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function icon(id) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function money(value) {
    return formatMoney.format(value) + ' ₽';
  }

  function plural(value, one, few, many) {
    var mod10 = value % 10;
    var mod100 = value % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function readCart() {
    try {
      var stored = JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY) || '[]');
      return Array.isArray(stored) ? stored.filter(function (entry) {
        return entry && entry.name && Number.isFinite(entry.price) && Number.isFinite(entry.quantity);
      }) : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      // The cart still works for the current session when storage is unavailable.
    }
  }

  function clearLegacyCart() {
    try {
      ['svet-cart-v5', 'svet-cart-v6', 'svet-cart-v7', 'svet-cart-session-v8'].forEach(function (key) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (error) {}
  }

  function cartCount() {
    return cart.reduce(function (sum, entry) { return sum + entry.quantity; }, 0);
  }

  function cartPrice() {
    return cart.reduce(function (sum, entry) { return sum + entry.price * entry.quantity; }, 0);
  }

  function syncBodyLock() {
    var dialogOpen = Array.prototype.some.call(document.querySelectorAll('dialog'), function (dialog) {
      return dialog.open;
    });
    document.body.classList.toggle('is-locked', dialogOpen);
  }

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    if (dialog._closeTimer) window.clearTimeout(dialog._closeTimer);
    dialog._closeTimer = null;
    dialog.classList.remove('is-closing');
    dialog.showModal();
    syncBodyLock();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        dialog.classList.add('is-visible');
      });
    });
  }

  function closeDialog(dialog, duration) {
    if (!dialog || !dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    dialog.classList.remove('is-visible');
    if (dialog === dom.menuDialog && dom.menuCart) dom.menuCart.hidden = true;
    dialog._closeTimer = window.setTimeout(function () {
      dialog.close();
      dialog.classList.remove('is-closing');
      dialog._closeTimer = null;
      syncBodyLock();
      if (dialog === dom.menuDialog || dialog === dom.cartDialog) updateCartUI();
    }, reducedMotion ? 10 : (duration || 380));
  }

  function attachDialogCancel(dialog, duration) {
    if (!dialog) return;
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeDialog(dialog, duration);
    });
  }

  function attachBackdropClose(dialog, duration) {
    if (!dialog) return;
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeDialog(dialog, duration);
    });
  }

  function initSiteIntro() {
    if (!dom.siteIntro) {
      document.documentElement.classList.remove('intro-pending');
      return;
    }
    if (reducedMotion) {
      dom.siteIntro.hidden = true;
      document.documentElement.classList.remove('intro-pending');
      return;
    }
    window.setTimeout(function () {
      dom.siteIntro.classList.add('is-leaving');
    }, 640);
    window.setTimeout(function () {
      document.documentElement.classList.remove('intro-pending');
    }, 1980);
    window.setTimeout(function () {
      dom.siteIntro.hidden = true;
    }, 2580);
  }

  function showToast(message) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      dom.toast.classList.remove('is-visible');
    }, 2100);
  }

  function initHeader() {
    var ticking = false;
    function update() {
      if (dom.header) dom.header.classList.toggle('is-scrolled', window.scrollY > 42);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function initReveal() {
    var elements = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reducedMotion) {
      elements.forEach(function (element) { element.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });
    elements.forEach(function (element) { observer.observe(element); });
  }

  function initScrollMedia() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.media-reveal'));
    if (!items.length) return;
    if (reducedMotion) {
      items.forEach(function (item) {
        item.classList.add('is-visible');
        item.style.setProperty('--reveal-cover-y', '-104%');
        item.style.setProperty('--media-y', '0px');
      });
      return;
    }
    var states = items.map(function (item) {
      return { item: item, current: 0, target: 0 };
    });
    var animationFrame = 0;
    function calculateTargets() {
      var viewport = window.innerHeight;
      var start = viewport * .96;
      var end = viewport * .28;
      var distance = Math.max(1, start - end);
      states.forEach(function (state) {
        var rect = state.item.getBoundingClientRect();
        var progress = Math.max(0, Math.min(1, (start - rect.top) / distance));
        state.target = progress * progress * (3 - 2 * progress);
        state.item.classList.toggle('is-visible', progress > .01);
      });
    }
    function animate() {
      var moving = false;
      states.forEach(function (state) {
        var difference = state.target - state.current;
        state.current += difference * .14;
        if (Math.abs(difference) < .001) state.current = state.target;
        else moving = true;
        state.item.style.setProperty('--reveal-cover-y', (-104 * state.current).toFixed(2) + '%');
        state.item.style.setProperty('--media-y', ((1 - state.current) * 18).toFixed(1) + 'px');
      });
      animationFrame = moving ? requestAnimationFrame(animate) : 0;
    }
    function requestUpdate() {
      calculateTargets();
      if (!animationFrame) animationFrame = requestAnimationFrame(animate);
    }
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    calculateTargets();
    states.forEach(function (state) { state.current = state.target; });
    animate();
  }

  function initHeroMotion() {
    if (!dom.heroImage || reducedMotion || saveData) return;
    var ticking = false;
    function update() {
      var limit = window.innerHeight * 1.12;
      if (window.scrollY <= limit) {
        var strength = window.innerWidth < 768 ? .072 : .095;
        var maximum = window.innerWidth < 768 ? 58 : 82;
        dom.heroImage.style.setProperty('--hero-y', Math.min(window.scrollY * strength, maximum).toFixed(1) + 'px');
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function initHeroSlider() {
    if (!dom.heroSlider) return;
    var slides = Array.prototype.slice.call(dom.heroSlider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var previousButton = document.querySelector('[data-hero-prev]');
    var nextButton = document.querySelector('[data-hero-next]');
    var details = [
      { name: 'Лимонад персик — маракуйя', price: '260 ₽' },
      { name: 'Малиново-фисташковый латте', price: '330 ₽' },
      { name: 'Бабл черничный чизкейк', price: '400 ₽' }
    ];
    var active = 0;
    var timer = 0;
    var pointerStart = null;
    var suppressSlideClick = false;

    function show(index, userInitiated) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        var selected = slideIndex === active;
        slide.classList.toggle('is-active', selected);
        slide.setAttribute('aria-hidden', selected ? 'false' : 'true');
        slide.tabIndex = selected ? 0 : -1;
      });
      dots.forEach(function (dot, dotIndex) {
        var selected = dotIndex === active;
        dot.classList.toggle('is-active', selected);
        if (selected) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (dom.heroSlideName) dom.heroSlideName.textContent = details[active].name;
      if (dom.heroSlidePrice) dom.heroSlidePrice.textContent = details[active].price;
      if (userInitiated) restart();
    }

    function restart() {
      if (timer) window.clearInterval(timer);
      timer = 0;
      if (!reducedMotion && !saveData && document.visibilityState !== 'hidden') {
        timer = window.setInterval(function () { show(active + 1, false); }, 5600);
      }
    }

    if (previousButton) previousButton.addEventListener('click', function () { show(active - 1, true); });
    if (nextButton) nextButton.addEventListener('click', function () { show(active + 1, true); });
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () { show(index, true); });
    });
    slides.forEach(function (slide) {
      slide.addEventListener('click', openContestDialog);
    });

    dom.heroSlider.addEventListener('pointerdown', function (event) {
      pointerStart = { x: event.clientX, y: event.clientY };
    }, { passive: true });
    dom.heroSlider.addEventListener('pointerup', function (event) {
      if (!pointerStart) return;
      var distanceX = event.clientX - pointerStart.x;
      var distanceY = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(distanceX) < 42 || Math.abs(distanceX) < Math.abs(distanceY)) return;
      suppressSlideClick = true;
      show(active + (distanceX < 0 ? 1 : -1), true);
      window.setTimeout(function () { suppressSlideClick = false; }, 80);
    }, { passive: true });
    dom.heroSlider.addEventListener('pointercancel', function () { pointerStart = null; }, { passive: true });
    dom.heroSlider.addEventListener('click', function (event) {
      if (!suppressSlideClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    dom.heroSlider.addEventListener('mouseenter', function () {
      if (timer) window.clearInterval(timer);
      timer = 0;
    });
    dom.heroSlider.addEventListener('mouseleave', restart);
    document.addEventListener('visibilitychange', restart);
    show(0, false);
    restart();
  }

  function initParallax() {
    var desktopFinePointer = window.matchMedia('(min-width: 56rem) and (pointer: fine)').matches;
    if (reducedMotion || saveData || !desktopFinePointer || !('IntersectionObserver' in window)) return;
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    var visible = new Set();
    var ticking = false;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
    }, { rootMargin: '18% 0px 18%' });
    items.forEach(function (item) { observer.observe(item); });

    function update() {
      var viewport = window.innerHeight;
      visible.forEach(function (item) {
        var rect = item.parentElement.getBoundingClientRect();
        var strength = Number(item.dataset.parallax || .05);
        var offset = (viewport * .5 - (rect.top + rect.height * .5)) * strength;
        item.style.setProperty('--parallax-y', offset.toFixed(1) + 'px');
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function initNavigation() {
    var closeButton = document.querySelector('[data-close-nav]');
    if (dom.burgerButton) dom.burgerButton.addEventListener('click', function () {
      dom.burgerButton.classList.add('is-animating');
      openDialog(dom.navDialog);
      window.setTimeout(function () { dom.burgerButton.classList.remove('is-animating'); }, reducedMotion ? 10 : 820);
    });
    if (closeButton) closeButton.addEventListener('click', function () { closeDialog(dom.navDialog, 1220); });
    if (dom.navDialog) {
      attachDialogCancel(dom.navDialog, 1220);
      dom.navDialog.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function () { closeDialog(dom.navDialog, 1220); });
      });
    }
  }

  function renderMenuRail() {
    if (!dom.rail) return;
    dom.rail.replaceChildren();
    var repeatedGroups = groups.concat(groups, groups);
    var initialLogicalIndex = groups.findIndex(function (group) { return group.id === 'coffee'; });
    var initialIndex = groups.length + Math.max(0, initialLogicalIndex);
    repeatedGroups.forEach(function (group, index) {
      var logicalIndex = index % groups.length;
      var card = create('button', 'menu-card');
      card.type = 'button';
      card.dataset.groupId = group.id;
      card.dataset.logicalIndex = String(logicalIndex);
      card.dataset.active = index === initialIndex ? 'true' : 'false';
      card.setAttribute('aria-label', 'Открыть категорию «' + group.title + '»');

      var image = create('img', 'menu-card__image');
      image.src = group.image;
      image.alt = '';
      image.width = 1024;
      image.height = 1536;
      image.loading = index >= groups.length && index < groups.length * 2 ? 'eager' : 'lazy';
      image.decoding = 'async';
      card.appendChild(image);
      card.appendChild(create('span', 'menu-card__shade'));

      var glass = create('span', 'menu-card__glass');
      glass.appendChild(create('span', 'menu-card__title', group.title));
      var hint = create('span', 'menu-card__hint', 'Открыть');
      hint.appendChild(icon('icon-arrow-up-right'));
      glass.appendChild(hint);
      card.appendChild(glass);
      card.addEventListener('click', function () { openMenuGroup(logicalIndex); });
      dom.rail.appendChild(card);
    });
    syncRailInsets();
    function placeInitialCoffee() {
      activeGroupIndex = initialIndex;
      var card = dom.rail.children[initialIndex];
      if (card) {
        var previousBehavior = dom.rail.style.scrollBehavior;
        dom.rail.style.scrollBehavior = 'auto';
        dom.rail.scrollLeft = card.offsetLeft - (dom.rail.clientWidth - card.offsetWidth) / 2;
        dom.rail.style.scrollBehavior = previousBehavior;
      }
      updateRailState();
    }
    placeInitialCoffee();
    window.requestAnimationFrame(placeInitialCoffee);
  }

  function syncRailInsets() {
    if (!dom.rail || !dom.rail.firstElementChild) return;
    var cardWidth = dom.rail.firstElementChild.getBoundingClientRect().width;
    var inset = Math.max(20, (dom.rail.clientWidth - cardWidth) / 2);
    dom.rail.style.paddingLeft = inset + 'px';
    dom.rail.style.paddingRight = inset + 'px';
    dom.rail.style.scrollPaddingInline = inset + 'px';
  }

  function updateRailState() {
    if (!dom.rail) return;
    var cards = Array.prototype.slice.call(dom.rail.children);
    if (!cards.length) return;
    var center = dom.rail.scrollLeft + dom.rail.clientWidth / 2;
    var nearestDistance = Infinity;
    var nearestIndex = 0;
    cards.forEach(function (card, index) {
      var cardCenter = card.offsetLeft + card.offsetWidth / 2;
      var distance = Math.abs(center - cardCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    if (cards.length === groups.length * 3) {
      var cycleWidth = cards[groups.length].offsetLeft - cards[0].offsetLeft;
      if (nearestIndex < groups.length) {
        dom.rail.scrollLeft += cycleWidth;
        nearestIndex += groups.length;
      } else if (nearestIndex >= groups.length * 2) {
        dom.rail.scrollLeft -= cycleWidth;
        nearestIndex -= groups.length;
      }
    }
    activeGroupIndex = nearestIndex;
    cards.forEach(function (card, index) {
      card.dataset.active = index === nearestIndex ? 'true' : 'false';
    });
    if (dom.railProgress) {
      var maxScroll = Math.max(1, dom.rail.scrollWidth - dom.rail.clientWidth);
      dom.railProgress.style.setProperty('--rail-progress', Math.max(.08, dom.rail.scrollLeft / maxScroll).toFixed(3));
    }
  }

  function scrollToGroup(index, behavior) {
    if (!dom.rail) return;
    var cards = dom.rail.children;
    var normalized = (index + cards.length) % cards.length;
    var card = cards[normalized];
    if (!card) return;
    var left = card.offsetLeft - (dom.rail.clientWidth - card.offsetWidth) / 2;
    dom.rail.scrollTo({ left: left, behavior: behavior || (reducedMotion ? 'auto' : 'smooth') });
  }

  function initRailControls() {
    if (!dom.rail) return;
    var ticking = false;
    var pointerId = null;
    var startX = 0;
    var startScroll = 0;
    var dragged = false;
    var suppressClick = false;
    dom.rail.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          updateRailState();
          ticking = false;
        });
      }
    }, { passive: true });
    dom.rail.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        scrollToGroup(activeGroupIndex + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    dom.rail.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = dom.rail.scrollLeft;
      dragged = false;
    });
    dom.rail.addEventListener('pointermove', function (event) {
      if (event.pointerId !== pointerId) return;
      var delta = event.clientX - startX;
      if (!dragged && Math.abs(delta) <= 8) return;
      if (!dragged) {
        dragged = true;
        dom.rail.classList.add('is-dragging');
        dom.rail.setPointerCapture(pointerId);
      }
      dom.rail.scrollLeft = startScroll - delta;
      event.preventDefault();
    });
    function finishDrag(event) {
      if (event.pointerId !== pointerId) return;
      if (dom.rail.hasPointerCapture(pointerId)) dom.rail.releasePointerCapture(pointerId);
      pointerId = null;
      dom.rail.classList.remove('is-dragging');
      if (dragged) {
        suppressClick = true;
        updateRailState();
        scrollToGroup(activeGroupIndex);
        window.setTimeout(function () { suppressClick = false; }, 0);
      }
    }
    dom.rail.addEventListener('pointerup', finishDrag);
    dom.rail.addEventListener('pointercancel', finishDrag);
    dom.rail.addEventListener('click', function (event) {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
    window.addEventListener('resize', function () {
      syncRailInsets();
      scrollToGroup(activeGroupIndex);
    }, { passive: true });
  }

  function getCategoriesForGroup(group) {
    if (!menuData) return [];
    return group.categoryIds.map(function (id) {
      return menuData.categories.find(function (category) { return category.id === id; });
    }).filter(Boolean);
  }

  function renderBadges(item) {
    var wrap = create('div', 'product-card__badges');
    if (item.isNew) wrap.appendChild(create('span', 'product-badge', 'Новинка'));
    if (item.isSignature) wrap.appendChild(create('span', 'product-badge', 'Фирменный'));
    if (item.isSeasonal) wrap.appendChild(create('span', 'product-badge', 'Сезонный'));
    return wrap;
  }

  function itemOptions(item, category) {
    if (Array.isArray(item.prices) && item.prices.length) {
      return item.prices.map(function (price, index) {
        var label = category.sizeGuide && category.sizeGuide[index] ? category.sizeGuide[index] : 'Вариант ' + (index + 1);
        return { label: label, price: price };
      });
    }
    return [{
      label: item.size || item.volume || category.volume || '',
      price: Number(item.price || 0)
    }];
  }

  function syrupPrice() {
    if (!menuData || !Array.isArray(menuData.extras)) return 0;
    var syrup = menuData.extras.find(function (extra) {
      return String(extra.name || '').toLowerCase().indexOf('сироп') !== -1;
    });
    return syrup ? Number(syrup.price || 0) : 0;
  }

  function syrupOptions() {
    if (!menuData || !Array.isArray(menuData.extras)) return [];
    var syrup = menuData.extras.find(function (extra) {
      return String(extra.name || '').toLowerCase().indexOf('сироп') !== -1;
    });
    return syrup && Array.isArray(syrup.options) ? syrup.options.slice() : [];
  }

  function allowsSyrup(category) {
    return category.id === 'coffee-classics';
  }

  function closeSyrupPickers(except) {
    document.querySelectorAll('.syrup-picker.is-open').forEach(function (picker) {
      if (picker === except) return;
      picker.classList.remove('is-open');
      var toggle = picker.querySelector('.extra-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  }

  function positionSyrupPicker(picker) {
    var toggle = picker.querySelector('.extra-toggle');
    if (!toggle) return;
    var rect = toggle.getBoundingClientRect();
    var margin = 18;
    var spaceAbove = Math.max(128, rect.top - margin);
    var spaceBelow = Math.max(128, window.innerHeight - rect.bottom - margin);
    var opensDown = spaceBelow > spaceAbove;
    picker.classList.toggle('opens-down', opensDown);
    picker.style.setProperty('--syrup-panel-space', Math.floor(opensDown ? spaceBelow : spaceAbove) + 'px');
  }

  function cartEntryId(name, variant, price) {
    return [name, variant || '', price].join('|');
  }

  function cartQuantity(id) {
    var entry = cart.find(function (item) { return item.id === id; });
    return entry ? entry.quantity : 0;
  }

  function createInlineQuantity(name, getSelection) {
    var control = create('div', 'inline-quantity');
    var minus = create('button');
    var value = create('span', 'inline-quantity__value', '0');
    var plus = create('button');
    minus.type = 'button';
    plus.type = 'button';
    minus.appendChild(icon('icon-minus'));
    plus.appendChild(icon('icon-plus'));
    minus.setAttribute('aria-label', 'Убрать один: ' + name);
    plus.setAttribute('aria-label', 'Добавить: ' + name);
    value.setAttribute('aria-live', 'polite');

    control._syncQuantity = function () {
      var selected = getSelection();
      var id = cartEntryId(name, selected.label, selected.price);
      var quantity = cartQuantity(id);
      control.dataset.cartId = id;
      value.textContent = String(quantity);
      minus.disabled = quantity === 0;
      control.classList.toggle('has-items', quantity > 0);
      control.setAttribute('aria-label', name + ': ' + quantity + ' в корзине');
    };

    minus.addEventListener('click', function () {
      var selected = getSelection();
      changeQuantity(cartEntryId(name, selected.label, selected.price), -1);
    });
    plus.addEventListener('click', function () {
      var selected = getSelection();
      addToCart(name, selected.label, selected.price);
    });
    control.appendChild(minus);
    control.appendChild(value);
    control.appendChild(plus);
    control._syncQuantity();
    return control;
  }

  function syncInlineQuantities() {
    document.querySelectorAll('.inline-quantity').forEach(function (control) {
      if (typeof control._syncQuantity === 'function') control._syncQuantity();
    });
  }

  function renderProduct(item, category) {
    var card = create('article', 'product-card');
    var info = create('div', 'product-card__info');
    info.appendChild(create('h4', '', item.name));
    if (item.description) info.appendChild(create('p', '', item.description));
    var badges = renderBadges(item);
    if (badges.children.length) info.appendChild(badges);
    card.appendChild(info);

    var action = create('div', 'product-card__action');
    var options = itemOptions(item, category);
    var selectedIndex = 0;
    var selectedSyrup = '';
    var extraPrice = allowsSyrup(category) ? syrupPrice() : 0;
    var price = create('span', 'product-card__price', money(options[0].price));
    action.appendChild(price);
    var quantity = null;

    function currentSelection() {
      var selected = options[selectedIndex];
      return {
        label: [selected.label, selectedSyrup ? 'сироп: ' + selectedSyrup : ''].filter(Boolean).join(' · '),
        price: selected.price + (selectedSyrup ? extraPrice : 0)
      };
    }

    function updateSelection() {
      price.textContent = money(currentSelection().price);
      if (quantity) quantity._syncQuantity();
    }

    function migrateSelection(previous) {
      var next = currentSelection();
      price.textContent = money(next.price);
      var previousId = cartEntryId(item.name, previous.label, previous.price);
      var nextId = cartEntryId(item.name, next.label, next.price);
      if (previousId !== nextId) {
        var previousEntry = cart.find(function (entry) { return entry.id === previousId; });
        if (previousEntry) {
          var nextEntry = cart.find(function (entry) { return entry.id === nextId; });
          if (nextEntry) nextEntry.quantity += previousEntry.quantity;
          else cart.push({ id: nextId, name: item.name, variant: next.label || '', price: next.price, quantity: previousEntry.quantity });
          cart = cart.filter(function (entry) { return entry.id !== previousId; });
          saveCart();
          updateCartUI();
          return;
        }
      }
      updateSelection();
    }

    if (options.length > 1) {
      var sizePicker = create('div', 'size-picker');
      sizePicker.setAttribute('role', 'group');
      sizePicker.setAttribute('aria-label', 'Выбрать объём для ' + item.name);
      options.forEach(function (option, index) {
        var button = create('button', 'size-picker__option', option.label.replace(' мл', ''));
        button.type = 'button';
        button.dataset.selected = index === 0 ? 'true' : 'false';
        button.setAttribute('aria-label', option.label + ', ' + money(option.price));
        button.addEventListener('click', function () {
          var previous = currentSelection();
          selectedIndex = index;
          sizePicker.querySelectorAll('button').forEach(function (node, buttonIndex) {
            node.dataset.selected = buttonIndex === index ? 'true' : 'false';
          });
          migrateSelection(previous);
        });
        sizePicker.appendChild(button);
      });
      sizePicker.appendChild(create('span', 'size-picker__unit', 'мл'));
      action.appendChild(sizePicker);
    } else if (options[0].label) {
      action.appendChild(create('span', 'product-card__meta', options[0].label));
    }

    if (extraPrice > 0 && syrupOptions().length) {
      var picker = create('div', 'syrup-picker');
      var syrup = create('button', 'extra-toggle');
      syrup.type = 'button';
      syrupPickerId += 1;
      var panelId = 'syrup-options-' + syrupPickerId;
      syrup.setAttribute('aria-expanded', 'false');
      syrup.setAttribute('aria-controls', panelId);
      var syrupLabel = create('span', '', '+ Сироп');
      syrup.appendChild(syrupLabel);
      syrup.appendChild(create('small', '', money(extraPrice)));
      var panel = create('div', 'syrup-picker__panel');
      panel.id = panelId;
      panel.setAttribute('role', 'listbox');
      panel.setAttribute('aria-label', 'Выберите сироп для ' + item.name);

      function selectSyrup(name) {
        var previous = currentSelection();
        selectedSyrup = name;
        syrupLabel.textContent = name || '+ Сироп';
        syrup.classList.toggle('is-selected', Boolean(name));
        panel.querySelectorAll('button').forEach(function (choice) {
          choice.dataset.selected = choice.dataset.value === name ? 'true' : 'false';
        });
        picker.classList.remove('is-open');
        syrup.setAttribute('aria-expanded', 'false');
        migrateSelection(previous);
      }

      [''].concat(syrupOptions()).forEach(function (name) {
        var choice = create('button', '', name || 'Без сиропа');
        choice.type = 'button';
        choice.dataset.value = name;
        choice.dataset.selected = name === selectedSyrup ? 'true' : 'false';
        choice.setAttribute('role', 'option');
        choice.addEventListener('click', function () { selectSyrup(name); });
        panel.appendChild(choice);
      });
      syrup.addEventListener('click', function () {
        var open = !picker.classList.contains('is-open');
        closeSyrupPickers(picker);
        if (open) positionSyrupPicker(picker);
        picker.classList.toggle('is-open', open);
        syrup.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      picker.appendChild(syrup);
      picker.appendChild(panel);
      action.appendChild(picker);
    }

    quantity = createInlineQuantity(item.name, currentSelection);
    action.appendChild(quantity);
    card.appendChild(action);
    return card;
  }

  function renderCategory(category) {
    var section = create('section', 'product-section');
    section.id = 'dialog-' + category.id;
    var head = create('div', 'product-section__head');
    head.appendChild(create('h3', '', category.name));
    head.appendChild(create('span', '', category.items.length + ' ' + plural(category.items.length, 'позиция', 'позиции', 'позиций')));
    section.appendChild(head);
    var grid = create('div', 'product-grid');
    category.items.forEach(function (item) { grid.appendChild(renderProduct(item, category)); });
    section.appendChild(grid);
    return section;
  }

  function renderExtras(group) {
    dom.menuExtras.replaceChildren();
    dom.menuExtras.hidden = true;
    if (!menuData || !Array.isArray(menuData.extras) || !menuData.extras.length) return;
    var extras = group && group.id === 'coffee' ? menuData.extras.filter(function (extra) {
      return String(extra.name || '').toLowerCase().indexOf('сироп') === -1;
    }) : [];
    if (!extras.length) return;
    dom.menuExtras.hidden = false;
    dom.menuExtras.appendChild(create('h3', '', 'Дополнительно'));
    extras.forEach(function (extra) {
      var row = create('div', 'extras-row');
      row.appendChild(create('span', '', extra.name));
      row.appendChild(create('strong', '', money(extra.price)));
      dom.menuExtras.appendChild(row);
    });
  }

  function setActiveCategoryTab(id) {
    dom.categoryTabs.querySelectorAll('.category-tab').forEach(function (tab) {
      tab.setAttribute('aria-selected', tab.dataset.target === id ? 'true' : 'false');
    });
  }

  function renderMenuGroup(group) {
    var categories = getCategoriesForGroup(group);
    dom.menuImage.src = group.image;
    dom.menuImage.alt = group.title;
    dom.menuEyebrow.textContent = group.eyebrow;
    dom.menuTitle.textContent = group.title;
    dom.menuDescription.textContent = group.description;
    dom.categoryTabs.replaceChildren();
    dom.productList.replaceChildren();

    categories.forEach(function (category, index) {
      var tab = create('button', 'category-tab', category.name);
      tab.type = 'button';
      tab.dataset.target = category.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      tab.addEventListener('click', function () {
        var target = document.getElementById('dialog-' + category.id);
        setActiveCategoryTab(category.id);
        if (target) target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
      dom.categoryTabs.appendChild(tab);
      dom.productList.appendChild(renderCategory(category));
    });
    renderExtras(group);
    var surface = dom.menuDialog.querySelector('.menu-dialog__surface');
    if (surface) surface.scrollTop = 0;
    var body = dom.menuDialog.querySelector('.menu-dialog__body');
    if (body) body.scrollTop = 0;
    updateMenuDialogProgress();
  }

  function openMenuGroup(index) {
    if (!menuData) {
      showToast('Меню ещё загружается');
      return;
    }
    var group = groups[index];
    if (!group) return;
    renderMenuGroup(group);
    openDialog(dom.menuDialog);
    window.requestAnimationFrame(updateCartUI);
  }

  function initMenuDialog() {
    var closeButton = document.querySelector('[data-close-menu-dialog]');
    if (closeButton) closeButton.addEventListener('click', function () { closeDialog(dom.menuDialog, 720); });
    attachDialogCancel(dom.menuDialog, 720);
    attachBackdropClose(dom.menuDialog, 720);
    var surface = dom.menuDialog.querySelector('.menu-dialog__surface');
    var body = dom.menuDialog.querySelector('.menu-dialog__body');
    if (surface) surface.addEventListener('scroll', updateMenuDialogProgress, { passive: true });
    if (body) body.addEventListener('scroll', updateMenuDialogProgress, { passive: true });
    if (surface) initMenuSwipeClose(surface, body);
    window.addEventListener('resize', updateMenuDialogProgress, { passive: true });
  }

  function initMenuSwipeClose(surface, body) {
    var startY = 0;
    var distance = 0;
    var tracking = false;
    var pointerId = null;
    surface.addEventListener('pointerdown', function (event) {
      if (!window.matchMedia('(max-width: 47.99rem)').matches) return;
      if (surface.scrollTop > 1 || (body && body.scrollTop > 1)) return;
      if (event.target.closest('button, input, textarea, a')) return;
      startY = event.clientY;
      distance = 0;
      tracking = true;
      pointerId = event.pointerId;
      surface.setPointerCapture(pointerId);
    });
    surface.addEventListener('pointermove', function (event) {
      if (!tracking || event.pointerId !== pointerId) return;
      distance = Math.max(0, event.clientY - startY);
      if (distance < 8) return;
      event.preventDefault();
      dom.menuDialog.classList.add('is-swiping');
      dom.menuDialog.style.setProperty('--swipe-y', Math.min(distance, 280) + 'px');
    });
    surface.addEventListener('pointerup', function (event) {
      if (!tracking || event.pointerId !== pointerId) return;
      tracking = false;
      pointerId = null;
      dom.menuDialog.classList.remove('is-swiping');
      dom.menuDialog.style.removeProperty('--swipe-y');
      if (distance > 105) closeDialog(dom.menuDialog, 540);
      distance = 0;
    });
    surface.addEventListener('pointercancel', function () {
      tracking = false;
      pointerId = null;
      distance = 0;
      dom.menuDialog.classList.remove('is-swiping');
      dom.menuDialog.style.removeProperty('--swipe-y');
    });
  }

  function updateMenuDialogProgress() {
    if (!dom.menuDialog || !dom.menuDialogProgress) return;
    var surface = dom.menuDialog.querySelector('.menu-dialog__surface');
    var body = dom.menuDialog.querySelector('.menu-dialog__body');
    var scroller = body && body.scrollHeight > body.clientHeight + 2 ? body : surface;
    if (!scroller) return;
    var maximum = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    var progress = Math.max(.06, Math.min(1, scroller.scrollTop / maximum));
    dom.menuDialogProgress.style.setProperty('--dialog-progress', progress.toFixed(3));
  }

  function renderContestProducts() {
    if (!dom.contestProducts || !menuData || !menuData.contest) return;
    var images = [
      'assets/contest-blueberry.webp',
      'assets/contest-raspberry-pistachio.webp',
      'assets/contest-peach-passionfruit.webp'
    ];
    dom.contestProducts.replaceChildren();
    menuData.contest.items.forEach(function (item, index) {
      var card = create('article', 'contest-product');
      var image = create('img');
      image.src = images[index];
      image.alt = item.name;
      image.width = 1086;
      image.height = 1448;
      image.loading = index === 0 ? 'eager' : 'lazy';
      image.decoding = 'async';
      card.appendChild(image);
      var body = create('div', 'contest-product__body');
      var info = create('div');
      info.appendChild(create('h3', '', item.name));
      info.appendChild(create('p', 'contest-product__price', money(item.price)));
      body.appendChild(info);
      body.appendChild(createInlineQuantity(item.name, function () {
        return { label: 'Специальное меню', price: item.price };
      }));
      card.appendChild(body);
      dom.contestProducts.appendChild(card);
    });
  }

  function openContestDialog() {
    if (!menuData || !menuData.contest) {
      showToast('Меню ещё загружается');
      return;
    }
    renderContestProducts();
    openDialog(dom.contestDialog);
  }

  function initContestDialog() {
    var openButtons = document.querySelectorAll('[data-open-contest]:not([data-hero-slide])');
    var closeButton = document.querySelector('[data-close-contest]');
    openButtons.forEach(function (openButton) {
      openButton.addEventListener('click', openContestDialog);
    });
    if (closeButton) closeButton.addEventListener('click', function () { closeDialog(dom.contestDialog, 680); });
    attachDialogCancel(dom.contestDialog, 680);
    attachBackdropClose(dom.contestDialog, 680);
  }

  function loadMenu() {
    fetch('data/menu.json', { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.categories)) throw new Error('Некорректное меню');
        menuData = data;
        dom.railStatus.textContent = '';
        dom.railStatus.classList.add('is-ready');
      })
      .catch(function () {
        dom.railStatus.textContent = 'Не удалось загрузить меню. Обновите страницу или проверьте соединение.';
      });
  }

  function addToCart(name, variant, price) {
    var id = cartEntryId(name, variant, price);
    var existing = cart.find(function (entry) { return entry.id === id; });
    if (existing) existing.quantity += 1;
    else cart.push({ id: id, name: name, variant: variant || '', price: price, quantity: 1 });
    saveCart();
    updateCartUI();
    showToast(name + ' — в корзине');
  }

  function changeQuantity(id, delta) {
    var entry = cart.find(function (item) { return item.id === id; });
    if (!entry) return;
    entry.quantity += delta;
    if (entry.quantity <= 0) cart = cart.filter(function (item) { return item.id !== id; });
    saveCart();
    updateCartUI();
  }

  function renderCart() {
    dom.cartList.replaceChildren();
    if (!cart.length) {
      var empty = create('div', 'cart-empty');
      var center = create('div');
      var mark = create('div', 'cart-empty__icon');
      mark.appendChild(icon('icon-bag'));
      center.appendChild(mark);
      center.appendChild(create('h3', '', 'Пока ничего'));
      center.appendChild(create('p', '', 'Откройте меню и добавьте то, что хочется сегодня.'));
      var chooseButton = create('button', 'cart-empty__menu-button', 'Перейти к выбору');
      chooseButton.type = 'button';
      chooseButton.addEventListener('click', function () {
        closeDialog(dom.cartDialog, 480);
        window.setTimeout(function () {
          var menuSection = document.getElementById('menu');
          if (menuSection) menuSection.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        }, reducedMotion ? 20 : 500);
      });
      center.appendChild(chooseButton);
      empty.appendChild(center);
      dom.cartList.appendChild(empty);
      dom.cartSummary.hidden = true;
      return;
    }

    cart.forEach(function (entry) {
      var row = create('article', 'cart-item');
      var info = create('div');
      info.appendChild(create('h3', '', entry.name));
      info.appendChild(create('p', '', [entry.variant, money(entry.price)].filter(Boolean).join(' · ')));
      row.appendChild(info);
      var controls = create('div', 'quantity-control');
      var minus = create('button');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Уменьшить количество ' + entry.name);
      minus.appendChild(icon('icon-minus'));
      minus.addEventListener('click', function () { changeQuantity(entry.id, -1); });
      var plus = create('button');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Увеличить количество ' + entry.name);
      plus.appendChild(icon('icon-plus'));
      plus.addEventListener('click', function () { changeQuantity(entry.id, 1); });
      controls.appendChild(minus);
      controls.appendChild(create('span', '', String(entry.quantity)));
      controls.appendChild(plus);
      row.appendChild(controls);
      dom.cartList.appendChild(row);
    });
    dom.cartTotal.textContent = money(cartPrice());
    dom.cartSummary.hidden = false;
  }

  function updateCartUI() {
    var count = cartCount();
    document.querySelectorAll('[data-cart-count]').forEach(function (node) {
      node.textContent = String(count);
      node.hidden = count === 0 && node.classList.contains('header-order__count');
    });
    var menuOpen = Boolean(dom.menuDialog && dom.menuDialog.open && !dom.menuDialog.classList.contains('is-closing'));
    var cartOpen = Boolean(dom.cartDialog && dom.cartDialog.open && !dom.cartDialog.classList.contains('is-closing'));
    dom.cartFab.hidden = count === 0 || menuOpen || cartOpen;
    if (dom.menuCart) dom.menuCart.hidden = count === 0 || !menuOpen;
    if (dom.menuCartTotal) dom.menuCartTotal.textContent = money(cartPrice());
    if (dom.cartFabTotal) {
      dom.cartFabTotal.textContent = count
        ? count + ' ' + plural(count, 'позиция', 'позиции', 'позиций') + ' · ' + money(cartPrice())
        : 'Открыть заказ';
    }
    renderCart();
    syncInlineQuantities();
    if (dom.checkoutLabel) dom.checkoutLabel.textContent = 'Оформить · ' + money(cartPrice());
  }

  function openCart() {
    if (dom.menuDialog && dom.menuDialog.open) {
      dom.menuDialog.close();
      dom.menuDialog.classList.remove('is-visible', 'is-closing', 'is-swiping');
    }
    dom.cartView.hidden = false;
    dom.checkoutForm.hidden = true;
    dom.checkoutStatus.textContent = '';
    renderCart();
    openDialog(dom.cartDialog);
    window.requestAnimationFrame(updateCartUI);
  }

  function setCheckoutView(opened) {
    if (opened && !cart.length) return;
    dom.cartView.hidden = opened;
    dom.checkoutForm.hidden = !opened;
    if (opened) {
      dom.checkoutLabel.textContent = 'Оформить · ' + money(cartPrice());
      var firstInput = dom.checkoutForm.querySelector('input[name="name"]');
      window.setTimeout(function () { if (firstInput) firstInput.focus(); }, reducedMotion ? 0 : 320);
    }
  }

  function initCart() {
    document.querySelectorAll('[data-open-cart]').forEach(function (button) {
      button.addEventListener('click', openCart);
    });
    document.querySelector('[data-close-cart]').addEventListener('click', function () { closeDialog(dom.cartDialog, 660); });
    document.querySelector('[data-start-checkout]').addEventListener('click', function () { setCheckoutView(true); });
    document.querySelector('[data-back-to-cart]').addEventListener('click', function () { setCheckoutView(false); });
    attachDialogCancel(dom.cartDialog, 660);
    attachBackdropClose(dom.cartDialog, 660);
    updateCartUI();
  }

  function markValidation(form) {
    var valid = true;
    form.querySelectorAll('input, textarea').forEach(function (field) {
      field.setCustomValidity('');
      var value = field.value.trim();
      if (field.required && !value) field.setCustomValidity('Заполните это поле');
      if (field.name === 'name' && value && value.length < 2) field.setCustomValidity('Введите имя полностью');
      if (field.name === 'phone' && value.replace(/\D/g, '').length < 10) field.setCustomValidity('Проверьте номер телефона');
      if (!field.checkValidity()) valid = false;
      var label = field.closest('.field');
      if (label) label.classList.toggle('is-invalid', !field.checkValidity());
    });
    if (!valid) form.reportValidity();
    return valid;
  }

  function readCustomer(form) {
    var data = new FormData(form);
    return {
      name: String(data.get('name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      address: String(data.get('address') || '').trim(),
      comment: String(data.get('comment') || '').trim()
    };
  }

  function submitPayload(payload) {
    if (!config.orderEndpoint) {
      return new Promise(function (resolve) {
        window.setTimeout(function () { resolve({ sent: false }); }, reducedMotion ? 20 : 720);
      });
    }
    return fetch(config.orderEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Svet-Client': 'web-v1' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok || !data.ok) throw new Error(data.error || 'order');
        return { sent: true, orderId: data.orderId || '' };
      });
    });
  }

  function renderSuccessOrder(payload) {
    dom.successOrder.replaceChildren();
    if (!payload || !payload.items || !payload.items.length) {
      dom.successOrder.hidden = true;
      return;
    }
    payload.items.forEach(function (entry) {
      var row = create('div');
      row.appendChild(create('span', '', entry.quantity + ' × ' + entry.name + (entry.variant ? ' · ' + entry.variant : '')));
      row.appendChild(create('strong', '', money(entry.unitPrice * entry.quantity)));
      dom.successOrder.appendChild(row);
    });
    var total = create('div');
    total.appendChild(create('span', '', 'Итого'));
    total.appendChild(create('strong', '', money(payload.total)));
    dom.successOrder.appendChild(total);
    dom.successOrder.hidden = false;
  }

  function showSuccess(result, payload) {
    var sent = result.sent;
    dom.successTitle.textContent = sent
      ? 'Заказ' + (result.orderId ? ' №' + result.orderId : '') + ' отправлен.'
      : 'Заявка собрана.';
    dom.successText.textContent = sent
      ? (payload.paymentMethod === 'online'
        ? 'Заказ создан и ожидает онлайн-оплату. Сотрудник подтвердит наличие и отправит ссылку на оплату.'
        : 'Мы свяжемся с вами по указанному номеру, чтобы подтвердить детали.')
      : 'Форма работает в демонстрационном режиме: отправка на сервер ещё не подключена.';
    renderSuccessOrder(payload);
    if (config.contactPhoneLabel && config.contactPhoneHref) {
      dom.successPhone.hidden = false;
      dom.successPhone.href = config.contactPhoneHref;
      dom.successPhone.textContent = 'Связаться: ' + config.contactPhoneLabel;
    } else {
      dom.successPhone.hidden = true;
    }
    openDialog(dom.successDialog);
  }

  function submitForm(form, statusNode, source, action, submitButton) {
    if (!markValidation(form)) return;
    var button = submitButton || form.querySelector('button[type="submit"]');
    var submitButtons = Array.prototype.slice.call(form.querySelectorAll('button[type="submit"]'));
    var originalLabel = button.querySelector('span') ? button.querySelector('span').textContent : button.textContent;
    var customer = readCustomer(form);
    var isCart = source === 'cart';
    var formData = new FormData(form);
    var payload = {
      source: source,
      fulfillment: isCart ? String(formData.get('fulfillment') || 'pickup') : 'callback',
      paymentMethod: isCart && action === 'pay' ? 'online' : 'on_receipt',
      customer: customer,
      items: isCart ? cart.map(function (entry) {
        return { name: entry.name, variant: entry.variant, unitPrice: entry.price, quantity: entry.quantity };
      }) : [],
      total: isCart ? cartPrice() : 0,
      createdAt: new Date().toISOString()
    };
    submitButtons.forEach(function (node) { node.disabled = true; });
    if (button.querySelector('span')) button.querySelector('span').textContent = 'Отправляем…';
    statusNode.textContent = '';
    submitPayload(payload)
      .then(function (result) {
        if (result.sent && isCart) {
          cart = [];
          saveCart();
          updateCartUI();
        }
        form.reset();
        if (dom.cartDialog.open) {
          dom.cartDialog.close();
          dom.cartDialog.classList.remove('is-visible', 'is-closing');
        }
        syncBodyLock();
        showSuccess(result, payload);
      })
      .catch(function () {
        statusNode.textContent = 'Не удалось отправить. Проверьте соединение и попробуйте ещё раз.';
      })
      .finally(function () {
        submitButtons.forEach(function (node) { node.disabled = false; });
        if (button.querySelector('span')) button.querySelector('span').textContent = originalLabel;
      });
  }

  function initForms() {
    document.querySelectorAll('input, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        field.setCustomValidity('');
        var label = field.closest('.field');
        if (label) label.classList.remove('is-invalid');
      });
    });
    dom.quickForm.addEventListener('submit', function (event) {
      event.preventDefault();
      submitForm(dom.quickForm, dom.quickForm.querySelector('[data-form-status]'), 'quick-request', 'order', event.submitter);
    });
    dom.checkoutForm.addEventListener('submit', function (event) {
      event.preventDefault();
      submitForm(dom.checkoutForm, dom.checkoutStatus, 'cart', event.submitter ? event.submitter.value : 'order', event.submitter);
    });
    var deliveryField = dom.checkoutForm.querySelector('[data-delivery-field]');
    var addressField = deliveryField ? deliveryField.querySelector('input[name="address"]') : null;
    dom.checkoutForm.querySelectorAll('input[name="fulfillment"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var delivery = radio.value === 'delivery' && radio.checked;
        if (!radio.checked || !deliveryField || !addressField) return;
        deliveryField.hidden = !delivery;
        addressField.required = delivery;
        if (!delivery) {
          addressField.value = '';
          addressField.setCustomValidity('');
        }
      });
    });
    dom.checkoutForm.addEventListener('reset', function () {
      window.setTimeout(function () {
        if (deliveryField && addressField) {
          deliveryField.hidden = true;
          addressField.required = false;
        }
      }, 0);
    });
    document.querySelector('[data-close-success]').addEventListener('click', function () { closeDialog(dom.successDialog, 560); });
    attachDialogCancel(dom.successDialog, 560);
    attachBackdropClose(dom.successDialog, 560);
  }

  function initConfig() {
    var contactLinks = document.querySelectorAll('[data-contact-link]');
    contactLinks.forEach(function (link) {
      if (config.contactPhoneLabel && config.contactPhoneHref) {
        link.textContent = config.contactPhoneLabel;
        link.href = config.contactPhoneHref;
      } else {
        link.removeAttribute('href');
      }
    });
  }

  function initCookieNotice() {
    if (!dom.cookieNotice) return;
    var accepted = false;
    try { accepted = localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted'; } catch (error) {}
    dom.cookieNotice.hidden = accepted;
    var button = dom.cookieNotice.querySelector('[data-cookie-accept]');
    if (!button) return;
    button.addEventListener('click', function () {
      try { localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted'); } catch (error) {}
      dom.cookieNotice.hidden = true;
    });
  }

  function init() {
    initSiteIntro();
    initHeader();
    initReveal();
    initScrollMedia();
    initHeroSlider();
    initHeroMotion();
    initParallax();
    initNavigation();
    renderMenuRail();
    initRailControls();
    initMenuDialog();
    initContestDialog();
    initCart();
    initForms();
    initConfig();
    initCookieNotice();
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.syrup-picker')) closeSyrupPickers();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeSyrupPickers();
    });
    loadMenu();
  }

  init();
})();
