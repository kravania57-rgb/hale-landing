/* Заявка на консультацію → Google Apps Script (Telegram-бот + лист-підтвердження клієнтові).
 * Адреса веб-застосунку — window.HALE_LEAD_URL (вписується в build.py, LEAD_URL).
 * Поки адреси немає або мережа недоступна, форма відправляється як раніше — через FormSubmit.
 * Також: підбір формату, відео у вікні, кнопка «Записатись» на телефоні, плашка «Оздоровча програма» до 30.11. */
(function () {
  function val(f, n) { var el = f.querySelector('[name="' + n + '"]'); return el ? String(el.value || '').trim() : ''; }
  function cookie(n) { var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; }
  function source() {
    var u = [];
    try { new URLSearchParams(location.search).forEach(function (v, k) { if (/^utm_|^fbclid|^gclid/.test(k)) u.push(k + '=' + v); }); } catch (e) {}
    return u.length ? u.join('&') : (document.referrer ? 'з ' + document.referrer.split('/')[2] : 'hale.academy');
  }
  function fbc() {
    var c = cookie('_fbc'); if (c) return c;
    try { var id = new URLSearchParams(location.search).get('fbclid'); if (id) return 'fb.1.' + Date.now() + '.' + id; } catch (e) {}
    return '';
  }

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.matches || !f.matches('form[data-lead]')) return;
    var url = window.HALE_LEAD_URL;
    if (!url || f.dataset.fallback === '1') return;           // FormSubmit як раніше
    e.preventDefault();
    if (val(f, '_honey')) return;
    if (f.dataset.sending === '1') return;
    f.dataset.sending = '1';
    var btn = f.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Надсилаємо…'; }
    var eid = 'lead-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    try { sessionStorage.setItem('hale_eid', eid); } catch (x) {}
    var payload = {
      name: val(f, 'Імʼя'), email: val(f, 'email'), contact: val(f, 'Контакт'),
      format: val(f, 'Формат консультації'), request: val(f, 'Запит'), source: source(),
      event_id: eid, fbp: cookie('_fbp'), fbc: fbc(), ua: navigator.userAgent, page: location.href.split('#')[0]
    };
    try { if (window.gtag) window.gtag('event', 'generate_lead', { form: 'consultation', format: payload.format }); } catch (x) {}
    try { if (window.fbq) window.fbq('track', 'SubmitApplication', { content_name: 'Консультація' }); } catch (x) {}
    fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true,
                 headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function () { location.href = '/thanks.html'; })
      .catch(function () {                                    // мережа/скрипт недоступні → резервний шлях
        f.dataset.sending = ''; f.dataset.fallback = '1';
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || btn.textContent; }
        HTMLFormElement.prototype.submit.call(f);
      });
  });

  // кнопки з data-format: обирають формат у формі заявки і ведуть до неї
  function pick(fmt, scroll) {
    var sel = document.querySelector('form[data-lead] select[name="Формат консультації"]');
    if (sel && fmt) { sel.value = fmt; try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (x) {} }
    var ap = document.getElementById('apply');
    if (scroll && ap) setTimeout(function () { window.scrollTo({ top: ap.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); }, 60);
    var wait = scroll ? 1100 : 700;
    setTimeout(function () { var n = document.querySelector('form[data-lead] input[name="Імʼя"]'); if (n) n.focus({ preventScroll: true }); }, wait);
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[data-format]');
    if (a) pick(a.getAttribute('data-format'), false);
  });

  var INK = '#042c29', PAPER = '#f4f3ed', FONT = 'Eastman,system-ui,sans-serif';
  function overlay(inner, label) {
    var o = document.createElement('div');
    o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', label);
    o.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(4,44,41,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;font-family:' + FONT;
    o.appendChild(inner);
    function close() { o.remove(); document.removeEventListener('keydown', esc); document.documentElement.style.overflow = ''; }
    function esc(ev) { if (ev.key === 'Escape') close(); }
    o.addEventListener('click', function (ev) { if (ev.target === o || (ev.target.closest && ev.target.closest('[data-close]'))) close(); });
    document.addEventListener('keydown', esc);
    document.documentElement.style.overflow = 'hidden';
    document.body.appendChild(o);
    return close;
  }
  function closeBtn(color) {
    return '<button type="button" data-close="1" aria-label="Закрити" style="position:absolute;top:12px;right:12px;border:0;background:transparent;color:' + color + ';width:36px;height:36px;font-size:22px;cursor:pointer;line-height:1">×</button>';
  }

  // підбір формату за 3 питання → обраний формат у формі заявки
  var RES = {
    club: { t: 'Клуб сімейного здоровʼя', p: 'від 38 $ на місяць', d: 'Щомісяця нова тема для дорослих і дітей, прямі ефіри та підтримка Юлії в чаті. Одна оплата — для всієї сімʼї.', f: 'Клуб сімейного здоровʼя' },
    lead: { t: 'Ведення · супровід 4 тижні', p: '500 $', d: 'Первинна консультація, індивідуальний план на 3 місяці та звʼязок із Юлією пн–пт, щоб коригувати кроки по ходу.', f: 'Ведення (супровід 4 тижні)' },
    urgent: { t: 'Термінова консультація', p: '200 $', d: 'Пріоритетний запис: аналіз анкети й обстежень, письмовий план оздоровлення та відео-дзвінок найближчим часом.', f: 'Термінова' },
    basic: { t: 'Базова консультація', p: '170 $', d: 'Аналіз анкети й обстежень, відео-дзвінок близько години та письмовий план на 4–6 тижнів.', f: 'Базова (разовий план)' }
  };
  var QS = [
    { q: 'Що для вас зараз головне?', o: [['problem', 'Розібратися з конкретним станом чи симптомами'], ['complex', 'Комплексно відновитися під наглядом фахівця'], ['family', 'Щоденні звички здоровʼя для всієї сімʼї']] },
    { q: 'Який формат вам ближчий?', o: [['self', 'Отримати план і рухатися самостійно'], ['support', 'Регулярний звʼязок і корекції по ходу']] },
    { q: 'Наскільки це терміново?', o: [['urgent', 'Потрібно якнайшвидше'], ['calm', 'Можу дочекатися звичайного запису']] }
  ];
  function quiz() {
    var box = document.createElement('div');
    box.style.cssText = 'position:relative;width:100%;max-width:480px;max-height:calc(100vh - 32px);overflow:auto;background:' + PAPER + ';color:' + INK + ';border-radius:22px;padding:30px 26px 26px;box-shadow:0 40px 80px -30px rgba(0,0,0,.45)';
    var ans = [], close = overlay(box, 'Підбір формату');
    var btnCss = 'display:block;width:100%;text-align:left;cursor:pointer;background:#fff;border:1px solid #042c2920;border-radius:14px;padding:15px 18px;font:inherit;font-size:15px;color:' + INK + ';margin-top:10px;transition:border-color .2s,background .2s';
    function head(n) { return closeBtn(INK) + '<div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8a9280;margin-bottom:10px">' + n + '</div>'; }
    function step(i) {
      var Q = QS[i];
      box.innerHTML = head('Питання ' + (i + 1) + ' з 3') +
        '<div style="height:3px;background:#042c2914;border-radius:3px;margin-bottom:18px"><div style="height:3px;width:' + ((i + 1) / 3 * 100) + '%;background:' + INK + ';border-radius:3px"></div></div>' +
        '<div style="font-family:Calvino,serif;font-size:24px;line-height:1.2;margin-bottom:6px">' + Q.q + '</div>' +
        Q.o.map(function (o) { return '<button type="button" data-a="' + o[0] + '" style="' + btnCss + '">' + o[1] + '</button>'; }).join('') +
        (i ? '<button type="button" data-back="1" style="margin-top:14px;border:0;background:none;color:#5c6353;cursor:pointer;font:inherit;font-size:13.5px">← Назад</button>' : '');
      box.querySelectorAll('[data-a]').forEach(function (b) {
        b.onmouseenter = function () { b.style.borderColor = INK; }; b.onmouseleave = function () { b.style.borderColor = '#042c2920'; };
        b.onclick = function () {
          ans[i] = b.getAttribute('data-a'); ans.length = i + 1;
          if (ans[0] === 'family') return result('club');
          if (i < 2) return step(i + 1);
          result(ans[1] === 'support' || ans[0] === 'complex' ? 'lead' : ans[2] === 'urgent' ? 'urgent' : 'basic');
        };
      });
      var bk = box.querySelector('[data-back]'); if (bk) bk.onclick = function () { step(i - 1); };
      var f = box.querySelector('[data-a]'); if (f) f.focus({ preventScroll: true });
    }
    function result(k) {
      var R = RES[k];
      try { if (window.gtag) window.gtag('event', 'quiz_result', { format: R.f }); } catch (x) {}
      box.innerHTML = head('Вам підійде') +
        '<div style="font-family:Calvino,serif;font-size:28px;line-height:1.15">' + R.t + '</div>' +
        '<div style="font-family:Calvino,serif;font-size:20px;color:#494224;margin:8px 0 12px">' + R.p + '</div>' +
        '<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#3a4034">' + R.d + '</p>' +
        '<button type="button" data-go="1" style="width:100%;cursor:pointer;border:0;background:' + INK + ';color:#fff;border-radius:999px;padding:15px;font:inherit;font-size:14px;text-transform:uppercase;letter-spacing:.05em">Залишити заявку</button>' +
        (k === 'club' ? '<a href="https://halecare.club/?utm_source=hale.academy&utm_medium=quiz" target="_blank" rel="noopener" style="display:block;text-align:center;margin-top:12px;color:' + INK + ';font-size:14px">Перейти на сайт клубу →</a>' : '') +
        '<button type="button" data-again="1" style="display:block;margin:14px auto 0;border:0;background:none;color:#5c6353;cursor:pointer;font:inherit;font-size:13.5px">Пройти ще раз</button>' +
        '<p style="margin:14px 0 0;font-size:12.5px;line-height:1.55;color:#8a9280">Це лише орієнтир — остаточний формат менеджер підбере разом із вами після заявки.</p>';
      box.querySelector('[data-go]').onclick = function () { close(); pick(R.f, true); };
      box.querySelector('[data-again]').onclick = function () { ans = []; step(0); };
    }
    try { if (window.gtag) window.gtag('event', 'quiz_open'); } catch (x) {}
    step(0);
  }
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('[data-quiz]')) { e.preventDefault(); quiz(); }
  });

  // відео з YouTube відкривається тут же, у вікні (плеєр вантажиться лише після натискання)
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('#free a[href*="youtube.com/watch"]');
    if (!a || e.metaKey || e.ctrlKey) return;
    var u; try { u = new URL(a.href); } catch (x) { return; }
    var id = u.searchParams.get('v'); if (!id) return;
    e.preventDefault();
    var st = parseInt(u.searchParams.get('t') || '0', 10) || 0;
    var box = document.createElement('div');
    box.style.cssText = 'position:relative;width:100%;max-width:960px;aspect-ratio:16/9;background:#000;border-radius:16px;overflow:hidden';
    box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&start=' + st + '" title="Відео Юлії Кравченко" ' +
      'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>' +
      closeBtn('#fff').replace('top:12px;right:12px', 'top:6px;right:6px;z-index:1;background:rgba(0,0,0,.45);border-radius:999px');
    overlay(box, 'Відео');
    try { if (window.gtag) window.gtag('event', 'video_open', { video: id }); } catch (x) {}
  });

  // кнопка «Записатись» внизу екрана на телефоні (ховається на першому екрані й біля форми)
  var mob = window.matchMedia('(max-width: 767px)');
  var cta = null, nearApply = false;
  function ctaUpdate() {
    if (!cta) return;
    var on = mob.matches && window.scrollY > 650 && !nearApply;
    cta.style.transform = on ? 'translateY(0)' : 'translateY(130%)';
    var bar = document.getElementById('hale-bar');
    if (bar) bar.style.bottom = on ? '84px' : '16px';
  }
  function ctaInit() {
    cta = document.createElement('div');
    cta.id = 'hale-cta';
    cta.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:59;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:rgba(244,243,237,.92);' +
      'backdrop-filter:blur(12px);border-top:1px solid #042c2914;transform:translateY(130%);transition:transform .3s ease;font-family:' + FONT;
    cta.innerHTML = '<a href="#apply" style="display:block;text-align:center;background:' + INK + ';color:#fff;border-radius:999px;padding:15px;font-size:14px;text-transform:uppercase;letter-spacing:.05em;text-decoration:none">Записатись на консультацію</a>';
    cta.querySelector('a').addEventListener('click', function () { try { if (window.gtag) window.gtag('event', 'sticky_cta_click'); } catch (x) {} });
    document.body.appendChild(cta);
    var ap = document.getElementById('apply');
    if (ap && window.IntersectionObserver) new IntersectionObserver(function (en) { nearApply = en[0].isIntersecting; ctaUpdate(); }).observe(ap);
    window.addEventListener('scroll', ctaUpdate, { passive: true });
    if (mob.addEventListener) mob.addEventListener('change', ctaUpdate);
    ctaUpdate();
  }
  (function waitApply(n) { if (document.getElementById('apply') || n > 40) ctaInit(); else setTimeout(function () { waitApply(n + 1); }, 250); })(0);

  // плашка «Оздоровча програма · старт 30 листопада» — сама зникає після 30.11.2026
  var END = Date.UTC(2026, 10, 30, 22, 0);                     // 1 грудня 00:00 за Києвом
  var closed = false;
  try { closed = sessionStorage.getItem('hale_bar') === '0'; } catch (x) {}
  if (Date.now() < END && !closed) {
    var show = function () {
      if (document.getElementById('hale-bar')) return;
      var b = document.createElement('div');
      b.id = 'hale-bar';
      b.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:6px;' +
        'max-width:calc(100% - 32px);background:#042c29;color:#f4f3ed;border-radius:999px;padding:6px 6px 6px 18px;' +
        'box-shadow:0 18px 40px -18px rgba(4,44,41,.6);font-size:14px;line-height:1.3;white-space:nowrap;font-family:Eastman,system-ui,sans-serif';
      b.innerHTML = '<a href="https://halecare.club/antiparasit/?utm_source=hale.academy&utm_medium=bar" target="_blank" rel="noopener" ' +
        'style="color:inherit;text-decoration:none;padding:6px 0">🌿 <b style="font-weight:500">Оздоровча програма</b> · ' + (innerWidth < 480 ? 'старт 30.11' : 'старт 30 листопада') + ' <span style="color:#cfdca8">→</span></a>' +
        '<button type="button" aria-label="Закрити" style="flex:none;border:0;background:#ffffff1a;color:#f4f3ed;width:30px;height:30px;border-radius:999px;cursor:pointer;font-size:16px;line-height:1">×</button>';
      b.querySelector('button').onclick = function () { b.remove(); try { sessionStorage.setItem('hale_bar', '0'); } catch (x) {} };
      b.querySelector('a').addEventListener('click', function () { try { if (window.gtag) window.gtag('event', 'program_bar_click'); } catch (x) {} });
      document.body.appendChild(b);
      ctaUpdate();
      // біля форми заявки плашку ховаємо, щоб не закривала кнопку
      var ap = document.getElementById('apply');
      if (ap && window.IntersectionObserver) new IntersectionObserver(function (en) {
        b.style.display = en[0].isIntersecting ? 'none' : 'flex';
      }).observe(ap);
    };
    setTimeout(show, 2500);
  }
})();
