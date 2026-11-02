// js/tema-inicial.js · script clásico (no módulo) que corre antes de pintar.
// Aplica la clase .dark según la preferencia guardada o prefers-color-scheme.
// La misma regla está en js/tema.js (resolverTema), que es la versión probada con tests.
(function () {
  var guardado = null;
  try {
    guardado = localStorage.getItem('cubri-seguros:tema');
  } catch (e) {
    guardado = null;
  }
  var prefiereOscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var oscuro = guardado === 'dark' || (guardado !== 'light' && prefiereOscuro);
  document.documentElement.classList.toggle('dark', oscuro);
})();
