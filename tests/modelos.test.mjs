import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modelosDeMarca, MODELOS } from '../js/modelos.js';
import { PRODUCTOS } from '../js/productos.js';

test('modelosDeMarca devuelve modelos reales de cada marca de celular', () => {
  assert.ok(modelosDeMarca('Samsung').includes('Galaxy S24'));
  assert.ok(modelosDeMarca('Apple').includes('iPhone 17 Pro'));
  assert.ok(modelosDeMarca('Motorola').length > 0);
});

test('modelosDeMarca ignora mayúsculas y espacios en la marca', () => {
  assert.deepEqual(modelosDeMarca(' apple '), modelosDeMarca('Apple'));
});

test('modelosDeMarca devuelve [] para marca vacía, "Otra" o desconocida', () => {
  assert.deepEqual(modelosDeMarca(''), []);
  assert.deepEqual(modelosDeMarca('Otra'), []);
  assert.deepEqual(modelosDeMarca('Marca inventada'), []);
  assert.deepEqual(modelosDeMarca(undefined), []);
});

test('modelosDeMarca distingue el producto', () => {
  assert.ok(modelosDeMarca('Trek', 'bicicleta').includes('Marlin 5'));
  assert.deepEqual(modelosDeMarca('Trek', 'celular'), []);
  assert.deepEqual(modelosDeMarca('Apple', 'bicicleta'), []);
});

test('modelosDeMarca devuelve una copia que no altera el catálogo', () => {
  const lista = modelosDeMarca('Samsung');
  lista.push('Modelo falso');
  assert.ok(!modelosDeMarca('Samsung').includes('Modelo falso'));
});

test('cada marca del select tiene modelos (salvo "Otra") y viceversa', () => {
  for (const producto of Object.keys(PRODUCTOS)) {
    const marcas = PRODUCTOS[producto].marcas.filter((m) => m !== 'Otra');
    assert.deepEqual(Object.keys(MODELOS[producto]).sort(), [...marcas].sort());
    for (const marca of marcas) assert.ok(modelosDeMarca(marca, producto).length > 0, marca);
  }
});
