/* Заявка на консультацію → Google Apps Script (Telegram-бот + лист-підтвердження клієнтові).
 * Адреса веб-застосунку — window.HALE_LEAD_URL (вписується в build.py, LEAD_URL).
 * Поки адреси немає або мережа недоступна, форма відправляється як раніше — через FormSubmit. */
(function () {
  function val(f, n) { var el = f.querySelector('[name="' + n + '"]'); return el ? String(el.value || '').trim() : ''; }
  function source() {
    var u = [];
    try { new URLSearchParams(location.search).forEach(function (v, k) { if (/^utm_|^fbclid|^gclid/.test(k)) u.push(k + '=' + v); }); } catch (e) {}
    return u.length ? u.join('&') : (document.referrer ? 'з ' + document.referrer.split('/')[2] : 'hale.academy');
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
    var payload = {
      name: val(f, 'Імʼя'), email: val(f, 'email'), contact: val(f, 'Контакт'),
      format: val(f, 'Формат консультації'), request: val(f, 'Запит'), source: source()
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
})();
