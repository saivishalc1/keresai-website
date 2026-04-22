/* =============================================================
   Keres AI — main app
   nav, theme, language switcher, scroll-spy, calendar, form,
   modals, reveal-on-scroll
============================================================= */
(function () {
  'use strict';

  const CALENDLY_URL = 'https://calendly.com/ops-keresai/30min';
  const THEME_KEY = 'keres.theme';

  /* ─── Theme ─────────────────────────────────────────── */
  function getTheme() {
    return localStorage.getItem(THEME_KEY)
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark');
      btn.querySelector('.icon-sun').style.display = theme === 'dark' ? 'block' : 'none';
      btn.querySelector('.icon-moon').style.display = theme === 'dark' ? 'none' : 'block';
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getTheme());
    const btn = document.getElementById('theme-toggle');
    btn && btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  });

  /* ─── i18n init + language switcher ─────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    if (window.KeresI18n) window.KeresI18n.init();

    const switcher = document.getElementById('lang-switch');
    const trigger  = document.getElementById('lang-trigger');
    if (!switcher || !trigger) return;

    function closeMenu() { switcher.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-expanded', 'false'); }
    function openMenu()  { switcher.setAttribute('aria-expanded', 'true');  trigger.setAttribute('aria-expanded', 'true'); }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = switcher.getAttribute('aria-expanded') === 'true';
      open ? closeMenu() : openMenu();
    });
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

    document.querySelectorAll('#lang-switch .lang-menu button').forEach(b => {
      b.addEventListener('click', () => {
        window.KeresI18n.apply(b.dataset.lang);
        closeMenu();
      });
    });
  });

  /* ─── Mobile nav (hamburger) ────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const btn  = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    function setOpen(open) {
      btn.setAttribute('aria-expanded', open);
      menu.setAttribute('data-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 768) setOpen(false); });
  });

  /* ─── Scroll-spy (IntersectionObserver-based) ──────── */
  document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

    const linkMap = new Map();
    links.forEach(a => linkMap.set(a.getAttribute('href').slice(1), a));

    const setActive = (id) => {
      links.forEach(a => {
        const active = a.getAttribute('href') === '#' + id;
        a.classList.toggle('active', active);
        active ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
      });
    };

    const io = new IntersectionObserver((entries) => {
      // pick the most-visible section intersecting the viewport
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible && linkMap.has(visible.target.id)) setActive(visible.target.id);
    }, { rootMargin: '-120px 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });

    sections.forEach(s => io.observe(s));
  });

  /* ─── Resource page filter pills ───────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const pills = document.querySelectorAll('.cat-pill');
    const cards = document.querySelectorAll('.res-card[data-category]');
    if (!pills.length || !cards.length) return;

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.dataset.filter;
        cards.forEach(c => {
          c.classList.toggle('hidden', filter !== 'all' && c.dataset.category !== filter);
        });
      });
    });
  });

  /* ─── Reveal-on-scroll ─────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  });

  /* ─── Calendar + Calendly launcher ─────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const elDays  = document.getElementById('calDays');
    const elMonth = document.getElementById('calMonth');
    const elInfo  = document.getElementById('calInfo');
    if (!elDays) return;

    const today = new Date();
    let curY = today.getFullYear(), curM = today.getMonth();
    let selected = null;

    function monthName(m, lang) {
      return new Date(2000, m, 1).toLocaleDateString(lang, { month: 'long' });
    }
    function dayName(d, lang) {
      return d.toLocaleDateString(lang, { weekday: 'long' });
    }

    function render() {
      const lang = (window.KeresI18n && window.KeresI18n.current) || 'en';
      elMonth.textContent = `${monthName(curM, lang)} ${curY}`;

      // localize weekday headers
      const wdRoot = document.getElementById('calWeekdays');
      if (wdRoot) {
        const base = new Date(2024, 11, 1); // Sunday
        wdRoot.innerHTML = '';
        for (let i = 0; i < 7; i++) {
          const d = new Date(base); d.setDate(base.getDate() + i);
          const s = document.createElement('span');
          s.textContent = d.toLocaleDateString(lang, { weekday: 'narrow' });
          wdRoot.appendChild(s);
        }
      }

      elDays.innerHTML = '';
      const first = new Date(curY, curM, 1).getDay();
      const total = new Date(curY, curM + 1, 0).getDate();
      const td = today.getDate(), tm = today.getMonth(), ty = today.getFullYear();

      for (let i = 0; i < first; i++) {
        const el = document.createElement('div');
        el.className = 'cal-day empty';
        elDays.appendChild(el);
      }
      for (let d = 1; d <= total; d++) {
        const dateObj = new Date(curY, curM, d);
        const isToday = d === td && curM === tm && curY === ty;
        const isPast  = dateObj < new Date(ty, tm, td);
        const isWknd  = [0, 6].includes(dateObj.getDay());
        const el = document.createElement('div');
        el.className = 'cal-day'
          + (isToday ? ' today' : '')
          + (isPast || isWknd ? ' past' : '')
          + (d === selected ? ' selected' : '');
        el.textContent = d;
        el.setAttribute('role', 'gridcell');
        if (!isPast && !isWknd) {
          el.tabIndex = 0;
          el.setAttribute('aria-label', `${dayName(dateObj, lang)} ${monthName(curM, lang)} ${d}`);
          const onSelect = () => {
            selected = d;
            render();
            const label = `${dayName(dateObj, lang)}, ${monthName(curM, lang)} ${d}`;
            const opening = (window.KeresI18n && window.KeresI18n.t('contact.cal.opening')) || 'opening booking page…';
            elInfo.innerHTML = `<strong>${label}</strong> — ${opening}`;
            setTimeout(() => window.open(CALENDLY_URL, '_blank', 'noopener'), 450);
          };
          el.addEventListener('click', onSelect);
          el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); }
          });
        }
        elDays.appendChild(el);
      }
    }

    document.getElementById('calPrev').addEventListener('click', () => {
      curM--; if (curM < 0) { curM = 11; curY--; } render();
    });
    document.getElementById('calNext').addEventListener('click', () => {
      curM++; if (curM > 11) { curM = 0; curY++; } render();
    });

    render();
    document.addEventListener('langchange', render);
  });

  /* ─── Contact form (Formspree) ─────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const btn  = document.getElementById('form-btn');
    const okEl = document.getElementById('form-success');
    const erEl = document.getElementById('form-error');

    const t = (k) => (window.KeresI18n ? window.KeresI18n.t(k) : k);

    function validate(input, errId, msgKey) {
      const err = document.getElementById(errId);
      const val = input.value.trim();
      const invalid = !val || (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
      if (invalid) {
        input.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
        err.textContent = t(msgKey);
        return false;
      }
      input.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
      err.textContent = '';
      return true;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const a = validate(document.getElementById('fname'),    'fname-err',    'contact.form.name.err');
      const b = validate(document.getElementById('femail'),   'femail-err',   'contact.form.email.err');
      const c = validate(document.getElementById('fmessage'), 'fmessage-err', 'contact.form.message.err');
      if (!a || !b || !c) return;

      const originalText = btn.textContent;
      btn.textContent = t('contact.form.sending');
      btn.disabled = true;
      erEl.style.display = 'none';

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error('server');
        form.style.display = 'none';
        okEl.style.display = 'block';
        okEl.focus?.();
      } catch {
        erEl.style.display = 'block';
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });

    ['fname', 'femail', 'fmessage'].forEach(id => {
      const el = document.getElementById(id);
      el && el.addEventListener('input', () => {
        el.classList.remove('invalid');
        el.removeAttribute('aria-invalid');
        document.getElementById(id + '-err').textContent = '';
      });
    });
  });

  /* ─── Demo modal ───────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const backdrop = document.getElementById('demo-modal');
    if (!backdrop) return;
    const closeEls = backdrop.querySelectorAll('[data-close]');
    let lastFocus = null;

    function open(ctx) {
      lastFocus = document.activeElement;
      backdrop.setAttribute('data-open', 'true');
      backdrop.setAttribute('aria-hidden', 'false');
      const titleEl = backdrop.querySelector('.modal-title');
      if (titleEl && ctx) titleEl.dataset.service = ctx;
      document.body.style.overflow = 'hidden';
      setTimeout(() => backdrop.querySelector('.modal-close').focus(), 100);
    }
    function close() {
      backdrop.setAttribute('data-open', 'false');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lastFocus && lastFocus.focus();
    }

    document.querySelectorAll('[data-demo]').forEach(btn => {
      btn.addEventListener('click', () => open(btn.dataset.demo));
    });
    closeEls.forEach(el => el.addEventListener('click', close));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.getAttribute('data-open') === 'true') close();
    });
  });

  /* ─── Dynamic year ─────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });

})();
