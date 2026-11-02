// js/sugerencias.js · lista de sugerencias de modelos (combobox accesible, funciona con tacto)
// Solo ayuda a escribir: el campo sigue siendo texto libre de 2 a 40 caracteres.
import { solicitud, escribirCampo } from './estado.js';
import { render } from './render.js';
import { filtrarModelos, normalizarTexto } from './modelos.js';
import { validarModelo } from './validaciones.js';

const CLASES_OPCION =
  'flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-base text-slate-900 ' +
  'hover:bg-indigo-50 data-[activo=true]:bg-indigo-50 data-[activo=true]:font-semibold';

export function iniciarSugerencias() {
  const input = document.querySelector('#equipo-modelo');
  const lista = document.querySelector('#modelos-lista');
  const marca = document.querySelector('#equipo-marca');
  let opciones = [];
  let activo = -1;
  let ultimoPuntero = 'mouse';
  let temporizador = null;

  const abierta = () => !lista.hidden;

  function cerrar() {
    lista.hidden = true;
    lista.replaceChildren();
    opciones = [];
    activo = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function marcarActivo(indice) {
    activo = indice;
    [...lista.children].forEach((opcion, i) => {
      const esActiva = i === indice;
      opcion.dataset.activo = String(esActiva);
      opcion.setAttribute('aria-selected', String(esActiva));
      if (esActiva) {
        input.setAttribute('aria-activedescendant', opcion.id);
        opcion.scrollIntoView({ block: 'nearest' });
      }
    });
    if (indice < 0) input.removeAttribute('aria-activedescendant');
  }

  // Muestra las sugerencias de la marca elegida filtradas por lo escrito; sin marca no muestra nada
  function abrir() {
    const encontradas = filtrarModelos(marca.value, input.value, solicitud.producto);
    const unicaIgual = encontradas.length === 1
      && normalizarTexto(encontradas[0]) === normalizarTexto(input.value);
    if (!marca.value || encontradas.length === 0 || unicaIgual) {
      cerrar();
      return;
    }
    opciones = encontradas;
    lista.replaceChildren(...opciones.map((modelo, i) => {
      const opcion = document.createElement('li');
      opcion.id = `modelo-opcion-${i}`;
      opcion.setAttribute('role', 'option');
      opcion.setAttribute('aria-selected', 'false');
      opcion.className = CLASES_OPCION;
      opcion.textContent = modelo;
      return opcion;
    }));
    lista.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    marcarActivo(-1);
    requestAnimationFrame(asegurarVisible);
  }

  // En mobile la lista queda en el flujo de la página: se desplaza lo justo para que no la tape
  // la barra fija de abajo ni el teclado (visualViewport), sin sacar el campo de la pantalla.
  function asegurarVisible() {
    if (!window.matchMedia('(max-width: 1023px)').matches || lista.hidden) return;
    const vv = window.visualViewport;
    const finViewport = vv ? vv.offsetTop + vv.height : window.innerHeight;
    const barra = document.querySelector('#barra-inferior');
    const inicioBarra = barra && getComputedStyle(barra).display !== 'contents'
      ? barra.getBoundingClientRect().top
      : Infinity;
    const limite = Math.min(finViewport, inicioBarra) - 8;
    const exceso = lista.getBoundingClientRect().bottom - limite;
    const margenCampo = input.getBoundingClientRect().top - 8;
    if (exceso > 0) window.scrollBy(0, Math.max(0, Math.min(exceso, margenCampo)));
  }

  function elegir(modelo) {
    escribirCampo('equipo.modelo', modelo);
    if (solicitud.errores['equipo.modelo']) solicitud.errores['equipo.modelo'] = validarModelo(modelo);
    cerrar();
    render({ forzar: true });
    // En pantallas táctiles se baja el teclado; con mouse el foco queda en el campo
    if (ultimoPuntero === 'touch') input.blur();
  }

  // Un toque en una opción no debe quitarle el foco al campo antes de registrarse.
  // Se elige en pointerup (si no hubo desplazamiento): en iOS, cancelar pointerdown evita que
  // se genere el click. El click queda como respaldo para tecnologías de apoyo, que no envían punteros.
  let inicio = null;
  let eligioPuntero = false;
  const indiceDe = (nodo) => {
    const opcion = nodo.closest('[role="option"]');
    return opcion ? [...lista.children].indexOf(opcion) : -1;
  };
  lista.addEventListener('pointerdown', (evento) => {
    evento.preventDefault();
    ultimoPuntero = evento.pointerType || 'mouse';
    eligioPuntero = false;
    inicio = { x: evento.clientX, y: evento.clientY, indice: indiceDe(evento.target) };
  });
  lista.addEventListener('pointerup', (evento) => {
    const indice = indiceDe(evento.target);
    const movido = inicio && Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y) > 10;
    if (inicio && !movido && indice >= 0 && indice === inicio.indice) {
      eligioPuntero = true;
      elegir(opciones[indice]);
    }
    inicio = null;
  });
  lista.addEventListener('pointercancel', () => { inicio = null; });
  lista.addEventListener('mousedown', (evento) => evento.preventDefault());
  lista.addEventListener('click', (evento) => {
    if (eligioPuntero) {
      eligioPuntero = false;
      return;
    }
    const indice = indiceDe(evento.target);
    if (indice >= 0) elegir(opciones[indice]);
  });

  input.addEventListener('focus', () => {
    clearTimeout(temporizador);
    abrir();
  });
  input.addEventListener('click', abrir);
  input.addEventListener('input', abrir);
  // Respaldo por si el navegador igual mueve el foco: se cierra con una pequeña demora
  input.addEventListener('blur', () => {
    temporizador = setTimeout(cerrar, 150);
  });
  marca.addEventListener('change', cerrar);

  input.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      if (!abierta()) abrir();
      if (opciones.length === 0) return;
      evento.preventDefault();
      const paso = evento.key === 'ArrowDown' ? 1 : -1;
      marcarActivo((activo + paso + opciones.length) % opciones.length);
    } else if (evento.key === 'Enter' && abierta() && activo >= 0) {
      evento.preventDefault();
      evento.stopPropagation(); // no debe contar como "intentar avanzar"
      elegir(opciones[activo]);
    } else if (evento.key === 'Escape' && abierta()) {
      evento.preventDefault();
      cerrar();
    }
  });
}
