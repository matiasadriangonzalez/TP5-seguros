// js/pago.js · pago simulado, número de póliza y texto descargable (sin DOM)
import { formatearMoneda } from './cotizador.js';

export function simularPago(numero, demora = 1500) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const limpio = String(numero).replace(/\s/g, '');
      resolve(
        limpio === '4000000000000002'
          ? { ok: false, motivo: 'Tarjeta rechazada' }
          : { ok: true },
      );
    }, demora);
  });
}

// Número de póliza: POL-AAAA-NNNNNN
export function generarPoliza(contador, anio = new Date().getFullYear()) {
  return `POL-${anio}-${String(contador).padStart(6, '0')}`;
}

// Texto del archivo "Descargar póliza": usa el nombre del plan (no el id) y la cuota
export function textoPoliza({ solicitud, producto, plan, fecha }) {
  const { titular, equipo } = solicitud;
  return [
    `Póliza ${solicitud.poliza}`,
    `Producto: ${producto}`,
    `Titular: ${titular.nombre} ${titular.apellido}`,
    `Email: ${titular.email}`,
    `Equipo: ${equipo.marca} ${equipo.modelo}`,
    `Plan: ${plan.nombre}`,
    `Cuota mensual: ${plan.cuota === null ? '-' : formatearMoneda(plan.cuota)}`,
    `Vigencia desde: ${fecha}`,
    'Documento de demostración: no tiene validez.',
  ].join('\n');
}
