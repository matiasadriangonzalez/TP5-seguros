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

// Lista blanca: nunca se guardan pago.tarjeta, pago.cvv ni pago.vencimiento
export function datosPersistibles(solicitud) {
  const { equipo, titular, pago } = solicitud;
  return {
    paso: solicitud.paso >= 1 && solicitud.paso <= 6 ? Math.min(solicitud.paso, 4) : 0,
    producto: solicitud.producto,
    equipo: { ...equipo },
    plan: solicitud.plan,
    titular: { ...titular },
    pago: { metodo: pago.metodo, titular: pago.titular },
    volverAPago: solicitud.volverAPago === true,
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

// Devuelve una copia de `base` con los datos guardados que tengan el tipo correcto
export function fusionarSolicitud(base, guardado) {
  const resultado = {
    ...base,
    equipo: { ...base.equipo },
    titular: { ...base.titular },
    pago: { ...base.pago },
  };
  if (!guardado || typeof guardado !== 'object') return resultado;

  if (Number.isInteger(guardado.paso) && guardado.paso >= 0 && guardado.paso <= 4) {
    resultado.paso = guardado.paso;
  }
  if (typeof guardado.producto === 'string' && productoValido(guardado.producto)) {
    resultado.producto = guardado.producto;
  }
  if (typeof guardado.plan === 'string') resultado.plan = guardado.plan;
  if (typeof guardado.volverAPago === 'boolean') resultado.volverAPago = guardado.volverAPago;

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
