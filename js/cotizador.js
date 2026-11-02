// js/cotizador.js · funciones puras de cotización y formato (sin DOM)

const FACTORES = {
  'menos-1': 1.0,
  '1-2': 1.1,
  'mas-2': 1.25,
};

export const ANTIGUEDADES = [
  { id: 'menos-1', etiqueta: 'Menos de 1 año' },
  { id: '1-2', etiqueta: '1 a 2 años' },
  { id: 'mas-2', etiqueta: 'Más de 2 años' },
];

const formatoMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

// "600.000" / "$ 600.000" → 600000. Sin dígitos devuelve 0.
export function parsearNumero(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  const limpio = String(valor ?? '').replace(/\D/g, '');
  return limpio === '' ? 0 : Number(limpio);
}

export function formatearMoneda(n) {
  return formatoMoneda.format(n);
}

// 600000 → "600.000" (para mostrar el valor dentro del input)
export function formatearNumero(n) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n);
}

export function factorAntiguedad(antiguedad) {
  return Object.prototype.hasOwnProperty.call(FACTORES, antiguedad) ? FACTORES[antiguedad] : null;
}

export function etiquetaAntiguedad(antiguedad) {
  return ANTIGUEDADES.find((a) => a.id === antiguedad)?.etiqueta ?? '';
}

// cuota = Math.round(valor × tasaAnual / 12 × factorAntiguedad)
export function calcularCuota(valor, tasaAnual, factor) {
  return Math.round((valor * tasaAnual) / 12 * factor);
}

// Copia de cada plan con su cuota; el factor depende del producto (null si falta factor o valor)
export function cuotasPorPlanConFactor(planes, valor, factor) {
  return planes.map((plan) => ({
    ...plan,
    cuota: factor === null || !valor ? null : calcularCuota(valor, plan.tasaAnual, factor),
  }));
}

// Celular: el factor sale de la antigüedad
export function cuotasPorPlan(planes, valor, antiguedad) {
  return cuotasPorPlanConFactor(planes, valor, factorAntiguedad(antiguedad));
}
