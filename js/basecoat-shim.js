// js/basecoat-shim.js · mínimo necesario para usar SOLO toast.js de Basecoat.
// toast.js se registra con window.basecoat.register(nombre, selector, init), que normalmente
// provee el núcleo basecoat.js. Acá lo reemplazamos por una versión mínima que inicializa
// los elementos que ya existen en el DOM (el #toaster) cuando se ejecuta toast.js.
window.basecoat = {
  register: function (nombre, selector, inicializar) {
    document.querySelectorAll(selector).forEach(function (elemento) {
      inicializar(elemento);
    });
  },
};
