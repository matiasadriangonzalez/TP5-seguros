import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simularPago, generarPoliza, textoPoliza } from '../js/pago.js';

test('simularPago rechaza 4000 0000 0000 0002', async () => {
  const r = await simularPago('4000 0000 0000 0002', 0);
  assert.deepEqual(r, { ok: false, motivo: 'Tarjeta rechazada' });
});

test('simularPago aprueba 4111 1111 1111 1111', async () => {
  const r = await simularPago('4111 1111 1111 1111', 0);
  assert.deepEqual(r, { ok: true });
});

test('simularPago aprueba cualquier otro número válido', async () => {
  const r = await simularPago('5555555555554444', 0);
  assert.equal(r.ok, true);
});

test('simularPago ignora espacios al comparar', async () => {
  assert.equal((await simularPago('4000000000000002', 0)).ok, false);
});

test('simularPago demora 1,5 s por defecto', async () => {
  const t0 = Date.now();
  await simularPago('4111111111111111');
  const ms = Date.now() - t0;
  assert.ok(ms >= 1400, `demoró ${ms} ms`);
});

test('generarPoliza respeta el formato POL-AAAA-NNNNNN', () => {
  assert.match(generarPoliza(1), /^POL-\d{4}-\d{6}$/);
  assert.equal(generarPoliza(123, 2026), 'POL-2026-000123');
  assert.equal(generarPoliza(1, 2030), 'POL-2030-000001');
  assert.equal(generarPoliza(999999, 2026), 'POL-2026-999999');
});

test('generarPoliza usa el año actual por defecto', () => {
  const anio = new Date().getFullYear();
  assert.equal(generarPoliza(7), `POL-${anio}-000007`);
});

test('textoPoliza imprime el nombre del plan (no el id), la cuota y el producto', () => {
  const texto = textoPoliza({
    solicitud: {
      poliza: 'POL-2026-000007',
      titular: { nombre: 'Ana', apellido: 'Gómez', email: 'ana@correo.com' },
      equipo: { marca: 'Samsung', modelo: 'Galaxy S24' },
      plan: 'premium',
    },
    producto: 'Celular',
    plan: { id: 'premium', nombre: 'Premium', cuota: 4950 },
    fecha: '28/10/2026',
  });
  assert.match(texto, /Póliza POL-2026-000007/);
  assert.match(texto, /Producto: Celular/);
  assert.match(texto, /Titular: Ana Gómez/);
  assert.match(texto, /Equipo: Samsung Galaxy S24/);
  assert.match(texto, /Plan: Premium/);
  assert.doesNotMatch(texto, /Plan: premium/);
  assert.match(texto, /Cuota mensual: \$\s?4\.950/);
  assert.match(texto, /Vigencia desde: 28\/10\/2026/);
});
