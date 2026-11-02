// js/persistencia.js · guarda la solicitud en localStorage SIN datos sensibles de la tarjeta
import { productoValido } from './productos.js';

export const CLAVE = 'cubri-seguros:solicitud';

function almacenamientoPorDefecto() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // el acceso puede lanzar en ventanas privadas o con datos bloqueados
  }
}

// Solo datos (no el paso): al recargar la página se vuelve siempre al inicio.
// Lista blanca: nunca se guardan pago.tarjeta, pago.cvv ni pago.vencimiento
export function datosPersistibles(solicitud) {
  const { equipo, titular, pago } = solicitud;
  return {
    producto: solicitud.producto,
    equipo: { ...equipo },
    plan: solicitud.plan,
    titular: { ...titular },
    pago: { metodo: pago.metodo, titular: pago.titular },
  };
}

function fusionarGrupo(base, guardado, tipos) {
  const resultado = { ...base };
  if (!guardado || typeof guardado !== 'object') return resultado;
  for (const [clave, tipo] of Object.entries(tipos)) {
    if (typeof guardado[clave] === tipo) resultado[clave] = guardado[clave];
  }
  return resultado;
}

// Devuelve una copia de `base` con los datos guardados que tengan el tipo correcto.
// El paso queda como en `base` (inicio) y la edición pendiente ("Editar") siempre apagada.
export function fusionarSolicitud(base, guardado) {
  const resultado = {
    ...base,
    equipo: { ...base.equipo },
    titular: { ...base.titular },
    pago: { ...base.pago },
  };
  if (!guardado || typeof guardado !== 'object') return resultado;

  if (typeof guardado.producto === 'string' && productoValido(guardado.producto)) {
    resultado.producto = guardado.producto;
  }
  if (typeof guardado.plan === 'string') resultado.plan = guardado.plan;
  resultado.volverAPago = false;

  resultado.equipo = fusionarGrupo(base.equipo, guardado.equipo, {
    marca: 'string', modelo: 'string', valor: 'number', antiguedad: 'string', tipo: 'string',
  });
  resultado.titular = fusionarGrupo(base.titular, guardado.titular, {
    nombre: 'string', apellido: 'string', dni: 'string', nacimiento: 'string',
    email: 'string', celular: 'string', terminos: 'boolean',
  });
  resultado.pago = fusionarGrupo(base.pago, guardado.pago, { metodo: 'string', titular: 'string' });
  return resultado;
}

export function guardarSolicitud(solicitud, almacen = almacenamientoPorDefecto()) {
  try {
    almacen.setItem(CLAVE, JSON.stringify(datosPersistibles(solicitud)));
    return true;
  } catch {
    return false;
  }
}

export function cargarSolicitud(almacen = almacenamientoPorDefecto()) {
  try {
    const texto = almacen.getItem(CLAVE);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

export function borrarSolicitud(almacen = almacenamientoPorDefecto()) {
  try {
    almacen.removeItem(CLAVE);
  } catch {
    // nada que borrar si no hay almacenamiento
  }
}
