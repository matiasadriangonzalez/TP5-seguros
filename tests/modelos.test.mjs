import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  modelosDeMarca,
  MODELOS,
  normalizarTexto,
  filtrarModelos,
  esModeloConocido,
} from '../js/modelos.js';
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

test('normalizarTexto ignora mayúsculas, acentos y espacios', () => {
  assert.equal(normalizarTexto('  iPhone 17  PRO '), 'iphone17pro');
  assert.equal(normalizarTexto('Montaña Élite'), 'montanaelite');
  assert.equal(normalizarTexto(undefined), '');
});

test('filtrarModelos sin texto devuelve todos los modelos de la marca', () => {
  assert.deepEqual(filtrarModelos('Apple', ''), modelosDeMarca('Apple'));
  assert.deepEqual(filtrarModelos('Apple', '   '), modelosDeMarca('Apple'));
});

test('filtrarModelos filtra por lo escrito sin importar mayúsculas, acentos ni espacios', () => {
  assert.deepEqual(filtrarModelos('Apple', '17 pro'), ['iPhone 17 Pro', 'iPhone 17 Pro Max']);
  assert.deepEqual(filtrarModelos('Apple', 'IPHONE17PRO'), ['iPhone 17 Pro', 'iPhone 17 Pro Max']);
  assert.deepEqual(filtrarModelos('Samsung', 'flip'), ['Galaxy Z Flip6']);
  assert.deepEqual(filtrarModelos('Samsung', 'zzz'), []);
});

test('filtrarModelos devuelve [] sin marca o con marca sin sugerencias', () => {
  assert.deepEqual(filtrarModelos('', 'a'), []);
  assert.deepEqual(filtrarModelos('Otra', 'a'), []);
});

test('filtrarModelos distingue el producto', () => {
  assert.deepEqual(filtrarModelos('Trek', 'marlin', 'bicicleta'), ['Marlin 5']);
  assert.deepEqual(filtrarModelos('Trek', 'marlin', 'celular'), []);
});

test('esModeloConocido compara contra los modelos de la marca elegida', () => {
  assert.equal(esModeloConocido('Samsung', 'Galaxy S24'), true);
  assert.equal(esModeloConocido('Samsung', ' galaxy  s24 '), true);
  assert.equal(esModeloConocido('Samsung', 'apple 17 pro'), false);
  assert.equal(esModeloConocido('Apple', 'iphone 17 pro'), true);
  assert.equal(esModeloConocido('Apple', 'iPhone 17 Pro Maxx'), false);
  assert.equal(esModeloConocido('Trek', 'marlin 5', 'bicicleta'), true);
  assert.equal(esModeloConocido('Trek', 'marlin 5', 'celular'), false);
});

test('esModeloConocido es false sin marca, sin sugerencias o con texto vacío', () => {
  assert.equal(esModeloConocido('', 'Galaxy S24'), false);
  assert.equal(esModeloConocido('Otra', 'Lo que sea'), false);
  assert.equal(esModeloConocido('Samsung', ''), false);
});
