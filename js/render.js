// js/render.js · pinta cada paso a partir del estado (el DOM nunca es fuente de datos)
import { solicitud, planesDelProducto, leerCampo } from './estado.js';
import {
  cuotasPorPlanConFactor,
  formatearMoneda,
  formatearNumero,
} from './cotizador.js';
import { erroresDePaso, esValido } from './validaciones.js';
import { PRODUCTOS, factorDeEquipo } from './productos.js';
import { modelosDeMarca } from './modelos.js';
import { guardarSolicitud, borrarSolicitud } from './persistencia.js';

export const ETIQUETAS_PASO = ['Cotizar', 'Plan', 'Datos', 'Pago'];

const TITULOS = {
  1: { barra: 'Cotizá tu seguro' },
  2: { barra: 'Elegí tu plan', titulo: 'Elegí tu plan' },
  3: { barra: 'Tus datos', titulo: 'Tus datos' },
  4: { barra: 'Pago', titulo: 'Pago' },
};

const ETIQUETAS_BOTON = {
  1: 'Ver planes',
  2: 'Continuar',
  3: 'Continuar al pago',
  4: 'Pagar y contratar',
};

const NOMBRE_CAMPO = {
  'equipo.marca': 'marca',
  'equipo.modelo': 'modelo',
  'equipo.valor': 'valor del equipo',
  'equipo.antiguedad': 'antigüedad',
  'equipo.tipo': 'tipo de bicicleta',
  'titular.nombre': 'nombre',
  'titular.apellido': 'apellido',
  'titular.dni': 'DNI',
  'titular.nacimiento': 'fecha de nacimiento',
  'titular.email': 'email',
  'titular.celular': 'celular',
  'titular.terminos': 'aceptar los términos',
  'pago.tarjeta': 'número de tarjeta',
  'pago.vencimiento': 'vencimiento',
  'pago.cvv': 'CVV',
  'pago.titular': 'titular de la tarjeta',
};

const SVG_CHECK =
  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const SVG_CHECK_PLAN =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0"><path d="M20 6 9 17l-5-5"/></svg>';

let pasoAnterior = null;

const $ = (selector, raiz = document) => raiz.querySelector(selector);
const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

function producto() {
  return PRODUCTOS[solicitud.producto];
}

function nombreCompleto() {
  return `${solicitud.titular.nombre} ${solicitud.titular.apellido}`.trim();
}

function equipoTexto() {
  const { marca, modelo } = solicitud.equipo;
  return `${marca} ${modelo}`.trim();
}

function planesConCuota() {
  const factor = factorDeEquipo(solicitud.producto, solicitud.equipo);
  return cuotasPorPlanConFactor(planesDelProducto(), solicitud.equipo.valor, factor);
}

// Plan elegido con su cuota (cuota null mientras falten datos); null si no hay planes cargados
export function planActual() {
  return planesConCuota().find((p) => p.id === solicitud.plan) ?? null;
}

function crear(etiqueta, clases, texto) {
  const nodo = document.createElement(etiqueta);
  if (clases) nodo.className = clases;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

export function render(opciones = {}) {
  const { paso } = solicitud;

  document.querySelectorAll('[data-paso]').forEach((s) => {
    s.hidden = Number(s.dataset.paso) !== paso;
  });
  const enCheckout = paso >= 1 && paso <= 4;
  $('#checkout').hidden = !enCheckout;
  $('#encabezado').dataset.ocultoMovil = String(enCheckout);

  renderProducto();
  renderCampos(opciones.forzar === true);
  renderErrores();
  renderStepper();
  renderTitulos();
  renderPlanes();
  renderResumen();
  renderAcciones();
  renderSalidas();

  if (pasoAnterior !== null && pasoAnterior !== paso) {
    // El toast de "Pago aprobado" pertenece a la pantalla de éxito: no debe pasar a otro flujo
    if (pasoAnterior === 5) descartarToasts();
    window.scrollTo(0, 0);
    enfocarTitulo();
  }
  pasoAnterior = paso;
  persistir();
}

function descartarToasts() {
  document.querySelectorAll('#toaster .toast').forEach((toast) => toast.remove());
}

// Persistencia: el éxito la borra; el resto se guarda sin datos sensibles (ver persistencia.js)
function persistir() {
  if (solicitud.paso === 0) return;
  if (solicitud.paso === 5) borrarSolicitud();
  else guardarSolicitud(solicitud);
}

// Textos, marcas y campos que dependen del producto elegido
function renderProducto() {
  const p = producto();
  const { textos } = p;

  $$('[data-texto]').forEach((el) => {
    el.textContent = textos[el.dataset.texto] ?? '';
  });
  $$('[data-producto-nombre]').forEach((el) => {
    el.textContent = p.nombre;
  });
  $$('[data-solo-producto]').forEach((el) => {
    el.hidden = el.dataset.soloProducto !== p.id;
  });

  const marca = $('#equipo-marca');
  if (marca.dataset.producto !== p.id) {
    marca.replaceChildren(
      new Option('Elegí una marca', ''),
      ...p.marcas.map((m) => new Option(m, m)),
    );
    marca.dataset.producto = p.id;
  }
  $('#equipo-modelo').placeholder = textos.placeholderModelo;
  $('#equipo-valor-ayuda').textContent =
    `Entre $${formatearNumero(p.rango.min)} y $${formatearNumero(p.rango.max)}`;

  // Sugerencias de modelos de la marca elegida (el campo sigue siendo texto libre)
  const lista = $('#modelos-lista');
  const clave = `${p.id}|${solicitud.equipo.marca}`;
  if (lista.dataset.clave !== clave) {
    lista.replaceChildren(
      ...modelosDeMarca(solicitud.equipo.marca, p.id).map((m) => new Option(m, m)),
    );
    lista.dataset.clave = clave;
  }
}

// Rellena inputs desde el estado (así "Volver" y "Reintentar pago" conservan los datos)
function renderCampos(forzar) {
  $$('[data-campo]').forEach((el) => {
    const valor = leerCampo(el.dataset.campo);
    if (el.type === 'radio') {
      el.checked = el.value === valor;
    } else if (el.type === 'checkbox') {
      el.checked = valor === true;
    } else if (forzar || el !== document.activeElement) {
      el.value = el.dataset.campo === 'equipo.valor'
        ? (valor ? formatearNumero(valor) : '')
        : String(valor ?? '');
    }
    el.disabled = solicitud.procesando;
  });
}

function renderErrores() {
  $$('[data-grupo]').forEach((grupo) => {
    const mensaje = solicitud.errores[grupo.dataset.grupo] ?? null;
    const field = grupo.querySelector('.field') ?? grupo;
    const error = $('[data-error]', grupo);
    const ayuda = $('[data-ayuda]', grupo);

    field.toggleAttribute('data-invalid', Boolean(mensaje));
    if (error) {
      error.hidden = !mensaje;
      error.textContent = mensaje ?? '';
    }
    if (ayuda) ayuda.hidden = Boolean(mensaje);

    const descripcion = mensaje ? error?.id : ayuda?.id;
    $$('[data-campo]', grupo).forEach((control) => {
      if (mensaje) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');
      if (descripcion) control.setAttribute('aria-describedby', descripcion);
      else control.removeAttribute('aria-describedby');
    });
  });
}

export function renderStepper() {
  const { paso } = solicitud;
  const cont = $('#stepper');
  if (!cont) return;
  const actual = paso >= 1 && paso <= 4 ? paso : 0;
  cont.innerHTML = ETIQUETAS_PASO.map((etiqueta, i) => {
    const n = i + 1;
    const estado = n < actual ? 'completo' : n === actual ? 'activo' : 'pendiente';
    const punto = {
      completo: 'border-emerald-600 bg-emerald-600 text-white',
      activo: 'border-indigo-600 bg-indigo-600 text-white',
      pendiente: 'border-slate-200 bg-surface text-slate-500',
    }[estado];
    const texto = {
      completo: 'text-emerald-600',
      activo: 'text-indigo-600',
      pendiente: 'text-slate-500',
    }[estado];
    const barra = i < ETIQUETAS_PASO.length - 1
      ? `<li aria-hidden="true" class="h-0.5 min-w-px flex-1 ${estado === 'completo' ? 'bg-emerald-600' : 'bg-slate-200'}"></li>`
      : '';
    return `<li data-estado="${estado}" ${estado === 'activo' ? 'aria-current="step"' : ''} class="flex shrink-0 items-center gap-1.5">
      <span class="punto-paso grid size-[22px] shrink-0 place-items-center rounded-full border-2 text-[11px] font-bold ${punto}">${estado === 'completo' ? SVG_CHECK : n}</span>
      <span class="text-xs font-semibold ${texto}">${etiqueta}${estado === 'completo' ? '<span class="sr-only"> (completo)</span>' : ''}</span>
    </li>${barra}`;
  }).join('');
}

function renderTitulos() {
  const t = TITULOS[solicitud.paso];
  if (!t) return;
  $('#topbar-titulo').textContent = t.barra;
  $('#titulo-checkout').textContent = t.titulo ?? producto().textos.titulo;
}

// Cards de plan: se construyen una vez por producto desde su JSON y luego solo se actualizan
function renderPlanes() {
  const lista = $('#lista-planes');
  const planes = planesDelProducto();
  if (lista.dataset.producto !== solicitud.producto || (planes.length > 0 && lista.childElementCount === 0)) {
    lista.replaceChildren(...planes.map(crearCardPlan));
    lista.dataset.producto = solicitud.producto;
  }
  planesConCuota().forEach((plan) => {
    const card = $(`[data-plan="${plan.id}"]`, lista);
    if (!card) return;
    $('input', card).checked = plan.id === solicitud.plan;
    $('[data-cuota]', card).textContent = plan.cuota === null ? '—' : formatearMoneda(plan.cuota);
  });
  $('#alerta-planes').hidden = !solicitud.errorPlanes;
}

function crearCardPlan(plan) {
  const card = crear(
    'label',
    'card relative flex cursor-pointer flex-col gap-2.5 rounded-2xl border border-slate-200 bg-surface p-4 lg:p-5 ' +
      'has-checked:border-indigo-600 has-checked:shadow-[inset_0_0_0_1px_#4f46e5,0_0_0_4px_rgba(79,70,229,0.15)] ' +
      'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-600',
  );
  card.dataset.plan = plan.id;

  const radio = crear('input', 'peer sr-only');
  radio.type = 'radio';
  radio.name = 'plan';
  radio.value = plan.id;

  const cabecera = crear('div', 'flex items-center justify-between gap-2');
  const nombre = crear('span', 'flex items-center gap-2');
  nombre.append(crear('span', 'text-[17px] font-extrabold text-slate-900', plan.nombre));
  if (plan.recomendado) nombre.append(crear('span', 'badge', 'Recomendado'));
  const indicador = crear(
    'span',
    'size-[22px] shrink-0 rounded-full border-2 border-slate-200 bg-surface ' +
      'peer-checked:border-[7px] peer-checked:border-indigo-600',
  );
  // el radio debe ser hermano anterior del indicador para usar peer-checked
  cabecera.append(nombre, radio, indicador);

  const precio = crear('p', 'flex items-end gap-1.5 text-slate-900');
  precio.append(
    crear('span', 'text-[26px] font-extrabold leading-tight'),
    crear('span', 'pb-0.5 text-sm font-medium text-slate-500', '/ mes'),
  );
  precio.firstChild.dataset.cuota = '';

  const coberturas = crear('ul', 'flex flex-col gap-1.5');
  plan.coberturas.forEach((c) => {
    const item = crear('li', 'flex items-center gap-2 text-[13px] text-slate-900');
    item.insertAdjacentHTML('afterbegin', SVG_CHECK_PLAN);
    item.append(crear('span', '', c));
    coberturas.append(item);
  });

  card.append(cabecera, precio, coberturas);
  return card;
}

// Fila del resumen; `editarPaso` agrega el enlace "Editar" que lleva al paso correspondiente
function fila([etiqueta, valor, editarPaso, deshabilitado]) {
  const nodo = crear('div', 'flex items-start justify-between gap-4 text-sm');
  const dd = crear('dd', 'flex items-baseline justify-end gap-2 text-right font-semibold text-slate-900');
  dd.append(crear('span', '', valor));
  if (editarPaso) {
    const boton = crear('button', 'editar-resumen text-xs font-semibold text-indigo-600 underline underline-offset-2', 'Editar');
    boton.type = 'button';
    boton.dataset.accion = 'editar';
    boton.dataset.irPaso = String(editarPaso);
    boton.disabled = deshabilitado;
    boton.setAttribute('aria-label', `Editar ${etiqueta.toLowerCase()}`);
    dd.append(boton);
  }
  nodo.append(crear('dt', 'text-slate-500', etiqueta), dd);
  return nodo;
}

// Único resumen del checkout: la barra mobile y la card desktop son el mismo elemento.
// En el paso 4 es el resumen final (seguro, equipo, plan, titular, total) también en mobile.
export function renderResumen() {
  const { paso, equipo } = solicitud;
  const resumen = $('#resumen');
  const plan = planActual();
  const verPlan = paso >= 2 && plan !== null;
  const total = verPlan && plan.cuota !== null ? plan.cuota : null;
  const final = paso === 4;
  const bloqueado = solicitud.procesando;

  const datos = [['Seguro', producto().nombre]];
  if (equipoTexto()) datos.push(['Equipo', equipoTexto(), final ? 1 : 0, bloqueado]);
  if (equipo.valor > 0 && paso === 1) datos.push(['Valor', formatearMoneda(equipo.valor)]);
  if (verPlan) datos.push(['Plan', plan.nombre, final ? 2 : 0, bloqueado]);
  if (final && nombreCompleto()) datos.push(['Titular', nombreCompleto(), 3, bloqueado]);

  // Solo se vuelve a armar si cambió algo: así un botón "Editar" no desaparece entre mousedown y click
  const filas = $('#resumen-filas');
  const firma = JSON.stringify(datos);
  if (filas.dataset.firma !== firma) {
    filas.replaceChildren(...datos.map(fila));
    filas.dataset.firma = firma;
  }

  $('#resumen-total').hidden = total === null;
  $('#resumen-total-valor').textContent = total === null ? '' : formatearMoneda(total);
  $('#resumen-ayuda').hidden = total !== null;

  const modelo = equipo.modelo.trim() || equipo.marca;
  $('#resumen-barra-detalle').textContent = verPlan
    ? `Plan ${plan.nombre}${modelo ? ` · ${modelo}` : ''}`
    : '';
  $('#resumen-barra-total').textContent = total === null ? '' : `${formatearMoneda(total)}/mes`;

  // Mobile: barra compacta desde el paso 2; en el paso 4 se muestra el resumen completo
  resumen.dataset.ocultoMovil = String(total === null && !final);
  resumen.dataset.completo = String(final);
  $('#checkout-grid').dataset.completo = String(final);
  $('#barra-inferior').dataset.completo = String(final);
}

// Botones del footer: habilitados según la validez del paso, con explicación visible
export function renderAcciones() {
  const { paso, procesando } = solicitud;
  if (paso < 1 || paso > 4) return;
  const errores = erroresDePaso(paso, solicitud);
  const valido = esValido(errores);
  const avanzar = $('[data-accion="avanzar"]');
  const ayuda = $('#acciones-ayuda');

  const editando = solicitud.volverAPago && paso < 4;
  avanzar.textContent = procesando
    ? 'Procesando…'
    : editando ? 'Guardar y volver al pago' : ETIQUETAS_BOTON[paso];
  avanzar.disabled = !valido || procesando;
  $('[data-accion="intento"]').hidden = valido || procesando;
  $$('[data-accion="volver"]').forEach((b) => { b.disabled = procesando; });

  if (procesando) {
    ayuda.textContent = 'Estamos procesando tu pago…';
    ayuda.hidden = false;
  } else if (!valido) {
    const faltan = Object.entries(errores)
      .filter(([, mensaje]) => mensaje !== null)
      .map(([campo]) => NOMBRE_CAMPO[campo]);
    const lista = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' }).format(faltan);
    ayuda.textContent = `Para continuar completá: ${lista}.`;
    ayuda.hidden = false;
  } else {
    ayuda.textContent = '';
    ayuda.hidden = true;
  }
}

// Datos de las pantallas de éxito y error, siempre desde el estado
function renderSalidas() {
  const plan = planActual();
  const salidas = {
    nombre: solicitud.titular.nombre,
    email: solicitud.titular.email,
    poliza: solicitud.poliza ?? '',
    equipo: equipoTexto(),
    plan: plan?.nombre ?? '',
    cuota: plan?.cuota != null ? formatearMoneda(plan.cuota) : '',
    vigencia: new Date().toLocaleDateString('es-AR'),
    motivo: solicitud.motivoError,
  };
  $$('[data-salida]').forEach((el) => {
    el.textContent = salidas[el.dataset.salida] ?? '';
  });
}

function enfocarTitulo() {
  const { paso } = solicitud;
  const candidatos = paso >= 1 && paso <= 4
    ? ['#titulo-checkout', '#topbar-titulo']
    : [`[data-paso="${paso}"] [data-titulo]`];
  for (const selector of candidatos) {
    const el = $(selector);
    if (el && el.offsetParent !== null) {
      el.focus({ preventScroll: true });
      return;
    }
  }
}
