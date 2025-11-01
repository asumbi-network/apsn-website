// Client-side analytics (static/analytics.js)
// Include with: <script src="/static/analytics.js" async></script>
(function () {
  const COLLECTOR_URL = window.COLLECTOR_URL || 'https://YOUR_COLLECTOR_URL/collect'; // set by site or replace directly
  const API_KEY = window.ANALYTICS_API_KEY || ''; // optional simple auth token (do not rely on client-only secrets)
  const SITE = window.location.hostname;
  const BATCH_SIZE = 8;
  const FLUSH_INTERVAL_MS = 5000;

  let sessionStart = Date.now();
  let events = [];

  function now() { return Date.now(); }

  function sendBatch() {
    if (!events.length) return;
    const payload = {
      site: SITE,
      ts: new Date().toISOString(),
      events: events.slice()
    };
    events = [];
    try {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(COLLECTOR_URL, body);
      } else {
        fetch(COLLECTOR_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(API_KEY ? { 'X-Analytics-Key': API_KEY } : {})
          },
          body,
          keepalive: true,
        }).catch(()=>{});
      }
    } catch (e) {
      // ignore
    }
  }

  // record initial pageview
  events.push({
    type: 'pageview',
    url: location.pathname + location.search,
    title: document.title || '',
    ts: now()
  });

  // click capture
  document.addEventListener('click', function (e) {
    const t = e.target;
    const nearest = t.closest ? t.closest('[data-analytics-label]') : null;
    const label = nearest ? nearest.getAttribute('data-analytics-label') :
      (t.id ? `#${t.id}` : t.tagName.toLowerCase() + (t.className ? '.' + t.className.split(' ').join('.') : ''));
    events.push({
      type: 'click',
      label: label || 'unknown',
      xpath: getXPath(t),
      ts: now()
    });
    if (events.length >= BATCH_SIZE) sendBatch();
  }, true);

  // session end / duration
  function flushSession() {
    const duration_ms = Date.now() - sessionStart;
    events.push({type: 'session_end', duration_ms, ts: now()});
    sendBatch();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flushSession();
  });
  window.addEventListener('beforeunload', flushSession);

  // periodic flush
  setInterval(sendBatch, FLUSH_INTERVAL_MS);

  // helper: simple XPath
  function getXPath(el) {
    if (!el) return '';
    let parts = [];
    while (el && el.nodeType === Node.ELEMENT_NODE && el !== document.body) {
      let name = el.tagName.toLowerCase();
      if (el.id) { name += `[@id="${el.id}"]`; parts.unshift(name); break; }
      let ix = 1, sib = el.previousSibling;
      while (sib) { if (sib.nodeType === 1 && sib.nodeName === el.nodeName) ix++; sib = sib.previousSibling; }
      if (ix > 1) name += `[${ix}]`;
      parts.unshift(name);
      el = el.parentNode;
    }
    return '/' + parts.join('/');
  }

  // expose for debugging (optional)
  window.__apsn_analytics = { sendBatch, eventsCount: () => events.length };
})();
