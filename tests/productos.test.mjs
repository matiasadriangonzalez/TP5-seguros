import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRODUCTOS, factorDeEquipo, productoValido } from '../js/productos.js';
import { calcularCuota, cuotasPorPlanConFactor } from '../js/cotizador.js';

const planes = (archivo) =>
  JSON.parse(readFileSync(new URL(`../data/${archivo}`, import.meta.url), 'utf8'));

test('el catálogo tiene celular y bicicleta, cada uno con su archivo de planes', () => {
  assert.deepEqual(Object.keys(PRODUCTOS), ['celular', 'bicicleta']);
  assert.equal(PRODUCTOS.celular.rutaPlanes, 'data/planes.json');
  assert.equal(PRODUCTOS.bicicleta.rutaPlanes, 'data/planes-bicicleta.json');
  assert.equal(productoValido('bicicleta'), true);
  assert.equal(productoValido('auto'), false);
});

test('factorDeEquipo en celular usa la antigüedad (1,00 / 1,10 / 1,25)', () => {
  assert.equal(factorDeEquipo('celular', { antiguedad: 'menos-1' }), 1);
  assert.equal(factorDeEquipo('celular', { antiguedad: '1-2' }), 1.1);
  assert.equal(factorDeEquipo('celular', { antiguedad: 'mas-2' }), 1.25);
  assert.equal(factorDeEquipo('celular', { antiguedad: '' }), null);
});

test('factorDeEquipo en bicicleta usa el tipo', () => {
  assert.equal(factorDeEquipo('bicicleta', { tipo: 'urbana' }), 1);
  assert.equal(factorDeEquipo('bicicleta', { tipo: 'montana' }), 1.15);
  assert.equal(factorDeEquipo('bicicleta', { tipo: 'ruta' }), 1.2);
  assert.equal(factorDeEquipo('bicicleta', { tipo: 'electrica' }), 1.35);
  assert.equal(factorDeEquipo('bicicleta', { tipo: '' }), null);
});

test('planes.json del celular conserva las tasas del enunciado', () => {
  const tasas = planes('planes.json').map((p) => [p.id, p.tasaAnual]);
  assert.deepEqual(tasas, [['basico', 0.04], ['plus', 0.06], ['premium', 0.09]]);
});

test('los 3 casos del celular siguen dando exactamente lo esperado con el factor genérico', () => {
  const p = planes('planes.json');
  const cuotas = (valor, antiguedad) =>
    cuotasPorPlanConFactor(p, valor, factorDeEquipo('celular', { antiguedad })).map((x) => x.cuota);
  assert.deepEqual(cuotas(600000, 'menos-1'), [2000, 3000, 4500]);
  assert.deepEqual(cuotas(600000, '1-2'), [2200, 3300, 4950]);
  assert.deepEqual(cuotas(1200000, 'mas-2'), [5000, 7500, 11250]);
});

test('la bicicleta tiene su propia tabla de tasas (3 %, 5 %, 8 %) y cotiza con calcularCuota', () => {
  const p = planes('planes-bicicleta.json');
  assert.deepEqual(p.map((x) => [x.id, x.tasaAnual]), [['basico', 0.03], ['plus', 0.05], ['premium', 0.08]]);
  assert.equal(p.filter((x) => x.recomendado).length, 1);
  const cuotas = (valor, tipo) =>
    cuotasPorPlanConFactor(p, valor, factorDeEquipo('bicicleta', { tipo })).map((x) => x.cuota);
  assert.deepEqual(cuotas(600000, 'urbana'), [1500, 2500, 4000]);
  assert.deepEqual(cuotas(600000, 'montana'), [1725, 2875, 4600]);
  assert.deepEqual(cuotas(600000, 'ruta'), [1800, 3000, 4800]);
  assert.deepEqual(cuotas(600000, 'electrica'), [2025, 3375, 5400]);
  assert.equal(calcularCuota(600000, 0.05, 1), 2500);
});

test('cuotasPorPlanConFactor devuelve cuota null sin factor o sin valor', () => {
  const p = planes('planes.json');
  assert.deepEqual(cuotasPorPlanConFactor(p, 600000, null).map((x) => x.cuota), [null, null, null]);
  assert.deepEqual(cuotasPorPlanConFactor(p, 0, 1).map((x) => x.cuota), [null, null, null]);
});

test('cada producto declara rango de valor y marcas', () => {
  assert.deepEqual(PRODUCTOS.celular.rango, { min: 100000, max: 2500000 });
  assert.deepEqual(PRODUCTOS.bicicleta.rango, { min: 50000, max: 3000000 });
  for (const p of Object.values(PRODUCTOS)) {
    assert.ok(p.marcas.length > 1);
    assert.ok(p.marcas.includes('Otra'));
  }
});
