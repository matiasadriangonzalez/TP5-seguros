import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularCuota,
  factorAntiguedad,
  cuotasPorPlan,
  parsearNumero,
  formatearMoneda,
  formatearNumero,
  cuotasPorPlanConFactor,
} from '../js/cotizador.js';

const planes = [
  { id: 'basico', nombre: 'Básico', tasaAnual: 0.04 },
  { id: 'plus', nombre: 'Plus', tasaAnual: 0.06 },
  { id: 'premium', nombre: 'Premium', tasaAnual: 0.09 },
];

const cuotas = (valor, antiguedad) =>
  planes.map((p) => calcularCuota(valor, p.tasaAnual, factorAntiguedad(antiguedad)));

test('caso 1 · $600.000 menos de 1 año → 2.000 / 3.000 / 4.500', () => {
  assert.deepEqual(cuotas(600000, 'menos-1'), [2000, 3000, 4500]);
});

test('caso 2 · $600.000 de 1 a 2 años → 2.200 / 3.300 / 4.950', () => {
  assert.deepEqual(cuotas(600000, '1-2'), [2200, 3300, 4950]);
});

test('caso 3 · $1.200.000 más de 2 años → 5.000 / 7.500 / 11.250', () => {
  assert.deepEqual(cuotas(1200000, 'mas-2'), [5000, 7500, 11250]);
});

test('factorAntiguedad devuelve 1,00 / 1,10 / 1,25', () => {
  assert.equal(factorAntiguedad('menos-1'), 1);
  assert.equal(factorAntiguedad('1-2'), 1.1);
  assert.equal(factorAntiguedad('mas-2'), 1.25);
});

test('factorAntiguedad con valor desconocido devuelve null', () => {
  assert.equal(factorAntiguedad(''), null);
  assert.equal(factorAntiguedad('otro'), null);
});

test('calcularCuota redondea con Math.round', () => {
  // 100.000 × 0,04 / 12 = 333,33…
  assert.equal(calcularCuota(100000, 0.04, 1), 333);
  // 100.000 × 0,06 / 12 = 500
  assert.equal(calcularCuota(100000, 0.06, 1), 500);
});

test('cuotasPorPlan agrega la cuota a cada plan sin mutar el original', () => {
  const resultado = cuotasPorPlan(planes, 600000, '1-2');
  assert.deepEqual(resultado.map((p) => p.cuota), [2200, 3300, 4950]);
  assert.equal(planes[0].cuota, undefined);
});

test('cuotasPorPlan sin antigüedad válida devuelve cuota null', () => {
  const resultado = cuotasPorPlan(planes, 600000, '');
  assert.deepEqual(resultado.map((p) => p.cuota), [null, null, null]);
});

test('parsearNumero limpia separadores y devuelve Number', () => {
  assert.equal(parsearNumero('600.000'), 600000);
  assert.equal(parsearNumero('$ 1.200.000'), 1200000);
  assert.equal(parsearNumero(850000), 850000);
  assert.equal(parsearNumero(''), 0);
  assert.equal(parsearNumero('abc'), 0);
});

test('formatearMoneda usa es-AR en pesos sin decimales', () => {
  const texto = formatearMoneda(1200000).replace(/\s/g, ' ');
  assert.match(texto, /^\$ ?1\.200\.000$/);
  assert.match(formatearMoneda(3000).replace(/\s/g, ' '), /^\$ ?3\.000$/);
});

test('formatearNumero usa separador de miles es-AR', () => {
  assert.equal(formatearNumero(600000), '600.000');
  assert.equal(formatearNumero(2500000), '2.500.000');
});

test('cuotasPorPlanConFactor equivale a cuotasPorPlan con el factor de la antigüedad', () => {
  const a = cuotasPorPlan(planes, 600000, '1-2').map((p) => p.cuota);
  const b = cuotasPorPlanConFactor(planes, 600000, factorAntiguedad('1-2')).map((p) => p.cuota);
  assert.deepEqual(a, b);
});
