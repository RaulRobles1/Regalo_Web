/* Aplica js/config.local.js (creado por editor.html) por encima de js/config.js.
   Los objetos se fusionan campo a campo; las listas (recuerdos, vales, razones…) se sustituyen enteras. */
(function () {
  const L = window.CONFIG_LOCAL;
  if (!L || typeof L !== 'object') return;
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  (function merge(t, s) {
    Object.keys(s).forEach(k => { if (isObj(s[k]) && isObj(t[k])) merge(t[k], s[k]); else t[k] = s[k]; });
  })(CONFIG, L);
})();
