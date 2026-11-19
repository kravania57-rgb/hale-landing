/* Заявка на консультацію → Google Apps Script (Telegram-бот + лист-підтвердження клієнтові).
 * Адреса веб-застосунку — window.HALE_LEAD_URL (вписується в build.py, LEAD_URL).
 * Поки адреси немає або мережа недоступна, форма відправляється як раніше — через FormSubmit.
 * Також: плашка «Оздоровча програма» до 30.11, подія для запису через бота. */
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

  // «Передзапис» на курс / навчання: обирає формат у формі заявки і веде до неї
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[data-format]');
    if (!a) return;
    var sel = document.querySelector('form[data-lead] select[name="Формат консультації"]');
    if (!sel) return;
    sel.value = a.getAttribute('data-format');
    try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (x) {}
    var q = document.querySelector('form[data-lead] textarea');
    setTimeout(function () { var n = document.querySelector('form[data-lead] input[name="Імʼя"]'); if (n) n.focus({ preventScroll: true }); }, 700);
  });

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
      // біля форми заявки плашку ховаємо, щоб не закривала кнопку
      var ap = document.getElementById('apply');
      if (ap && window.IntersectionObserver) new IntersectionObserver(function (en) {
        b.style.display = en[0].isIntersecting ? 'none' : 'flex';
      }).observe(ap);
    };
    setTimeout(show, 2500);
  }
})();
