import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverTema } from '../js/tema.js';

test('la preferencia guardada manda sobre el sistema', () => {
  assert.equal(resolverTema('dark', false), 'dark');
  assert.equal(resolverTema('light', true), 'light');
});

test('sin preferencia guardada se usa prefers-color-scheme', () => {
  assert.equal(resolverTema(null, true), 'dark');
  assert.equal(resolverTema(null, false), 'light');
  assert.equal(resolverTema('otro', true), 'dark');
  assert.equal(resolverTema(undefined, false), 'light');
});
