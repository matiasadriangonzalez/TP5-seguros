// js/app.js · arranque, eventos y navegación
import {
  solicitud,
  irAPaso,
  escribirCampo,
  reiniciarSolicitud,
  elegirProducto,
  restaurarSolicitud,
  cargarPlanes,
  siguienteContador,
} from './estado.js';
import { render, planActual } from './render.js';
import {
  validarMarca,
  validarModelo,
  validarValor,
  validarAntiguedad,
  validarTipo,
  validarNombre,
  validarDni,
  validarNacimiento,
  validarEmail,
  validarCelular,
  validarTerminos,
  validarTarjeta,
  validarVencimiento,
  validarCvv,
  validarTitular,
  erroresDePaso,
  esValido,
} from './validaciones.js';
import { parsearNumero } from './cotizador.js';
import { simularPago, generarPoliza, textoPoliza } from './pago.js';
import { PRODUCTOS } from './productos.js';
import { formatearTarjeta, formatearVencimiento, posicionCursor } from './mascaras.js';
import { cargarSolicitud, borrarSolicitud } from './persistencia.js';
import { iniciarTema, alternarTema } from './tema.js';

// campo → función pura que valida su valor actual (pago.metodo no se valida: siempre tiene opción elegida)
const VALIDADORES = {
  'equipo.marca': () => validarMarca(solicitud.equipo.marca),
  'equipo.modelo': () => validarModelo(solicitud.equipo.modelo),
  'equipo.valor': () => validarValor(solicitud.equipo.valor, PRODUCTOS[solicitud.producto].rango),
  'equipo.antiguedad': () => validarAntiguedad(solicitud.equipo.antiguedad),
  'equipo.tipo': () => validarTipo(solicitud.equipo.tipo),
  'titular.nombre': () => validarNombre(solicitud.titular.nombre, 'nombre'),
  'titular.apellido': () => validarNombre(solicitud.titular.apellido, 'apellido'),
  'titular.dni': () => validarDni(solicitud.titular.dni),
  'titular.nacimiento': () => validarNacimiento(solicitud.titular.nacimiento),
  'titular.email': () => validarEmail(solicitud.titular.email),
  'titular.celular': () => validarCelular(solicitud.titular.celular),
  'titular.terminos': () => validarTerminos(solicitud.titular.terminos),
  'pago.tarjeta': () => validarTarjeta(solicitud.pago.tarjeta),
  'pago.vencimiento': () => validarVencimiento(solicitud.pago.vencimiento),
  'pago.cvv': () => validarCvv(solicitud.pago.cvv),
  'pago.titular': () => validarTitular(solicitud.pago.titular),
};

// Máscaras de entrada: el estado guarda el texto ya formateado
const MASCARAS = {
  'pago.tarjeta': formatearTarjeta,
  'pago.vencimiento': formatearVencimiento,
};

const PASO_INICIO = 0;
const PASO_PAGO = 4;
const PASO_EXITO = 5;
const PASO_ERROR = 6;

function leerValor(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.dataset.campo === 'equipo.valor') return parsearNumero(el.value);
  return el.value;
}

// Aplica la máscara conservando la posición del cursor (cuenta dígitos antes del cursor)
function aplicarMascara(el, mascara) {
  const posicion = el.selectionStart ?? el.value.length;
  const digitosAntes = el.value.slice(0, posicion).replace(/\D/g, '').length;
  const formateado = mascara(el.value);
  if (el.value !== formateado) {
    el.value = formateado;
    const nueva = posicionCursor(formateado, digitosAntes);
    el.setSelectionRange(nueva, nueva);
  }
  return formateado;
}

// Cada cambio modifica el estado y después llama a render()
function alCambiar(evento) {
  const el = evento.target.closest('[data-campo]');
  if (!el) return;
  const campo = el.dataset.campo;
  const mascara = MASCARAS[campo];
  escribirCampo(campo, mascara ? aplicarMascara(el, mascara) : leerValor(el));
  // Si el campo ya mostraba un error, se revalida mientras se corrige
  if (solicitud.errores[campo] && VALIDADORES[campo]) solicitud.errores[campo] = VALIDADORES[campo]();
  render();
}

// Valida al salir del campo (blur no burbujea: se escucha en fase de captura)
function alSalirDelCampo(evento) {
  const el = evento.target.closest?.('[data-campo]');
  if (!el) return;
  const grupo = el.closest('[data-grupo]');
  if (grupo && grupo.contains(evento.relatedTarget)) return; // sigue dentro del mismo grupo
  const campo = el.dataset.campo;
  if (!VALIDADORES[campo]) return;
  solicitud.errores[campo] = VALIDADORES[campo]();
  render({ forzar: true });
}

function enfocarPrimerError(errores) {
  const campo = Object.keys(errores).find((c) => errores[c] !== null);
  if (!campo) return;
  document.querySelector(`[data-campo="${campo}"]`)?.focus();
}

// "Intentar avanzar": revalida todo el paso, muestra los errores y enfoca el primero
async function intentarAvanzar() {
  const { paso } = solicitud;
  if (solicitud.procesando || paso < 1 || paso > 4) return;
  // Al editar desde el resumen, "Continuar" vuelve directo al pago
  const siguiente = solicitud.volverAPago ? PASO_PAGO : paso + 1;

  if (paso === 2) {
    irAPaso(siguiente);
    return;
  }

  const errores = erroresDePaso(paso, solicitud);
  Object.assign(solicitud.errores, errores);
  if (!esValido(errores)) {
    render({ forzar: true });
    enfocarPrimerError(errores);
    return;
  }

  if (paso === 1) {
    try {
      await cargarPlanes();
      solicitud.errorPlanes = false;
    } catch {
      solicitud.errorPlanes = true;
      render();
      return;
    }
    irAPaso(siguiente);
  } else if (paso === 3) {
    irAPaso(siguiente);
  } else if (paso === PASO_PAGO) {
    await pagar();
  }
}

function mostrarToast(config) {
  // toast.js (Basecoat) agrega la función `toast` al elemento #toaster; si el CDN no cargó, se omite
  document.querySelector('#toaster')?.toast?.(config);
}

async function pagar() {
  solicitud.procesando = true; // evita el doble click: el botón queda deshabilitado
  render();
  const resultado = await simularPago(solicitud.pago.tarjeta);
  if (resultado.ok) {
    solicitud.procesando = false;
    solicitud.poliza = generarPoliza(siguienteContador());
    irAPaso(PASO_EXITO); // render() borra la solicitud guardada al terminar la contratación
    mostrarToast({
      category: 'success',
      title: '¡Pago aprobado!',
      description: `Tu póliza ${solicitud.poliza} ya está activa.`,
      duration: 5000,
    });
  } else {
    solicitud.procesando = false; // se habilita de nuevo solo si el pago falla
    solicitud.motivoError = resultado.motivo;
    irAPaso(PASO_ERROR);
  }
}

function volver() {
  if (solicitud.procesando) return;
  if (solicitud.volverAPago) irAPaso(PASO_PAGO); // cancela la edición y vuelve al pago
  else if (solicitud.paso > 1) irAPaso(solicitud.paso - 1);
  else irAPaso(PASO_INICIO);
}

function descargarPoliza() {
  const plan = planActual();
  if (!solicitud.poliza || !plan) return;
  const texto = textoPoliza({
    solicitud,
    producto: PRODUCTOS[solicitud.producto].nombre,
    plan,
    fecha: new Date().toLocaleDateString('es-AR'),
  });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([texto], { type: 'text/plain' }));
  enlace.download = `${solicitud.poliza}.txt`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

const ACCIONES = {
  cotizar: (boton) => {
    elegirProducto(boton.dataset.producto ?? 'celular');
    irAPaso(1);
  },
  volver,
  avanzar: intentarAvanzar,
  intento: intentarAvanzar,
  // "Editar" en el resumen: lleva al paso que corresponde y, al continuar, vuelve al pago
  editar: (boton) => {
    solicitud.volverAPago = true;
    irAPaso(Number(boton.dataset.irPaso));
  },
  reintentar: () => {
    irAPaso(PASO_PAGO);
    document.querySelector('[data-accion="avanzar"]')?.focus();
  },
  'cambiar-medio': () => {
    irAPaso(PASO_PAGO);
    const tarjeta = document.querySelector('[data-campo="pago.tarjeta"]');
    tarjeta?.focus();
    tarjeta?.select();
  },
  reiniciar: () => {
    reiniciarSolicitud();
    borrarSolicitud();
    irAPaso(PASO_INICIO);
  },
  descargar: descargarPoliza,
  tema: alternarTema,
};

function iniciarEventos() {
  document.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton || boton.disabled) return;
    ACCIONES[boton.dataset.accion]?.(boton);
  });

  document.addEventListener('input', alCambiar);
  document.addEventListener('change', alCambiar);
  document.addEventListener('blur', alSalirDelCampo, true);

  document.querySelector('#lista-planes').addEventListener('change', (evento) => {
    if (evento.target.name !== 'plan') return;
    solicitud.plan = evento.target.value;
    render();
  });

  document.querySelectorAll('form').forEach((formulario) => {
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      intentarAvanzar();
    });
    // Enter dentro de un campo equivale a intentar avanzar
    formulario.addEventListener('keydown', (evento) => {
      const campo = evento.target;
      if (evento.key !== 'Enter' || !campo.matches('input:not([type="checkbox"]):not([type="radio"])')) return;
      evento.preventDefault();
      intentarAvanzar();
    });
  });
}

function iniciarFechaMaxima() {
  const hoy = new Date();
  const dos = (n) => String(n).padStart(2, '0');
  const campo = document.querySelector('[data-campo="titular.nacimiento"]');
  campo.max = `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`;
  campo.min = '1900-01-01';
}

// Restaura lo guardado (sin datos de la tarjeta) y vuelve al paso donde quedó la persona
async function restaurar() {
  const guardado = cargarSolicitud();
  if (!guardado) return;
  restaurarSolicitud(guardado);
  if (solicitud.paso >= 2) {
    try {
      await cargarPlanes();
    } catch {
      solicitud.paso = 1;
      solicitud.errorPlanes = true;
    }
  }
}

async function iniciar() {
  iniciarTema();
  iniciarFechaMaxima();
  iniciarEventos();
  await restaurar();
  render();
}

iniciar();

// Ayuda para depurar desde la consola: console.table(solicitud)
window.solicitud = solicitud;
