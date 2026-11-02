import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatearTarjeta, formatearVencimiento, posicionCursor } from '../js/mascaras.js';
import { validarTarjeta, validarVencimiento } from '../js/validaciones.js';

test('formatearTarjeta agrupa de a 4 dígitos', () => {
  assert.equal(formatearTarjeta('4111111111111111'), '4111 1111 1111 1111');
  assert.equal(formatearTarjeta('41111'), '4111 1');
  assert.equal(formatearTarjeta('4111'), '4111');
  assert.equal(formatearTarjeta(''), '');
});

test('formatearTarjeta ignora letras y espacios, y corta en 16 dígitos', () => {
  assert.equal(formatearTarjeta('4111-1111 abcd 1111 1111 9999'), '4111 1111 1111 1111');
  assert.equal(formatearTarjeta(undefined), '');
});

test('formatearTarjeta no deja un espacio al final (permite borrar)', () => {
  assert.equal(formatearTarjeta('4111 '), '4111');
});

test('formatearVencimiento agrega la barra después del mes', () => {
  assert.equal(formatearVencimiento('1'), '1');
  assert.equal(formatearVencimiento('12'), '12');
  assert.equal(formatearVencimiento('123'), '12/3');
  assert.equal(formatearVencimiento('1230'), '12/30');
  assert.equal(formatearVencimiento('12/30'), '12/30');
});

test('formatearVencimiento corta en 4 dígitos y borrar la barra no la reinserta', () => {
  assert.equal(formatearVencimiento('12/3099'), '12/30');
  assert.equal(formatearVencimiento('12/'), '12');
  assert.equal(formatearVencimiento('ab'), '');
});

test('posicionCursor mantiene el cursor junto al mismo dígito', () => {
  assert.equal(posicionCursor('4111 1', 5), 6);
  assert.equal(posicionCursor('4111 1111', 4), 4);
  assert.equal(posicionCursor('4111 1111', 5), 6);
  assert.equal(posicionCursor('12/30', 3), 4);
  assert.equal(posicionCursor('12/30', 0), 0);
  assert.equal(posicionCursor('12', 9), 2);
});

test('los valores con máscara siguen pasando las validaciones', () => {
  const hoy = new Date(2026, 5, 15);
  assert.equal(validarTarjeta(formatearTarjeta('4111111111111111')), null);
  assert.equal(validarVencimiento(formatearVencimiento('1230'), hoy), null);
  assert.equal(validarVencimiento(formatearVencimiento('123'), hoy), 'Vencimiento inválido');
});
