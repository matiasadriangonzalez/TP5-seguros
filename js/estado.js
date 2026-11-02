// js/estado.js · único objeto de estado + funciones para modificarlo
import { render } from './render.js';
import { PRODUCTOS } from './productos.js';
import { fusionarSolicitud } from './persistencia.js';

function crearSolicitud() {
  return {
    paso: 0, // 0 = inicio, 1..4 = checkout, 5 = éxito, 6 = error
    equipo: { marca: '', modelo: '', valor: 0, antiguedad: '', tipo: '' },
    plan: 'plus',
    titular: {
      nombre: '', apellido: '', dni: '', nacimiento: '',
      email: '', celular: '', terminos: false,
    },
    pago: { metodo: 'credito', tarjeta: '', vencimiento: '', cvv: '', titular: '' },
    poliza: null,
    // Claves agregadas al estado (también viven en el único objeto)
    producto: 'celular', // 'celular' | 'bicicleta'; en equipo, `tipo` reemplaza a `antiguedad` en la bicicleta
    errores: {},         // { 'equipo.marca': 'mensaje' | null }
    procesando: false,   // pago en curso
    motivoError: '',     // motivo del rechazo
    errorPlanes: false,  // falló el fetch del JSON de planes
    volverAPago: false,  // true al editar desde el resumen: "Continuar" vuelve directo al pago
  };
}

export const solicitud = crearSolicitud();

// Planes ya cargados por producto: { celular: [...], bicicleta: [...] }
export const catalogo = { porProducto: {} };

export function planesDelProducto() {
  return catalogo.porProducto[solicitud.producto] ?? [];
}

let contadorPolizas = 0;

export function siguienteContador() {
  contadorPolizas += 1;
  return contadorPolizas;
}

export function irAPaso(n) {
  solicitud.paso = n;
  if (n === 4) solicitud.volverAPago = false;
  render(); // siempre después de cambiar el estado
}

// "grupo.campo" → solicitud[grupo][campo]
export function leerCampo(ruta) {
  return ruta.split('.').reduce((obj, clave) => obj?.[clave], solicitud);
}

export function escribirCampo(ruta, valor) {
  const claves = ruta.split('.');
  const ultima = claves.pop();
  const destino = claves.reduce((obj, clave) => obj[clave], solicitud);
  destino[ultima] = valor;
}

export function reiniciarSolicitud() {
  Object.assign(solicitud, crearSolicitud());
}

// Cambiar de producto descarta los datos del equipo y del plan del producto anterior
export function elegirProducto(id) {
  if (solicitud.producto === id) return;
  const nueva = crearSolicitud();
  solicitud.producto = id;
  solicitud.equipo = nueva.equipo;
  solicitud.plan = nueva.plan;
  solicitud.errores = {};
  solicitud.errorPlanes = false;
}

// Aplica una solicitud guardada (ya sin datos sensibles) sobre el estado actual
export function restaurarSolicitud(guardado) {
  Object.assign(solicitud, fusionarSolicitud(solicitud, guardado));
}

// fetch del JSON: requiere servidor local (no funciona abriendo el archivo con file://)
export async function cargarPlanes(producto = solicitud.producto) {
  if (catalogo.porProducto[producto]?.length > 0) return;
  const respuesta = await fetch(PRODUCTOS[producto].rutaPlanes);
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  catalogo.porProducto[producto] = await respuesta.json();
}
