import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLAVE,
  datosPersistibles,
  fusionarSolicitud,
  guardarSolicitud,
  cargarSolicitud,
  borrarSolicitud,
} from '../js/persistencia.js';

const base = () => ({
  paso: 0,
  producto: 'celular',
  equipo: { marca: '', modelo: '', valor: 0, antiguedad: '', tipo: '' },
  plan: 'plus',
  titular: { nombre: '', apellido: '', dni: '', nacimiento: '', email: '', celular: '', terminos: false },
  pago: { metodo: 'credito', tarjeta: '', vencimiento: '', cvv: '', titular: '' },
  poliza: null,
  errores: {},
  procesando: false,
  motivoError: '',
  errorPlanes: false,
  volverAPago: false,
});

const completa = () => {
  const s = base();
  s.paso = 4;
  s.equipo = { marca: 'Samsung', modelo: 'Galaxy S24', valor: 900000, antiguedad: '1-2', tipo: '' };
  s.plan = 'premium';
  s.titular = { nombre: 'Ana', apellido: 'Gómez', dni: '30123456', nacimiento: '1990-05-20', email: 'ana@correo.com', celular: '1155551234', terminos: true };
  s.pago = { metodo: 'debito', tarjeta: '4111 1111 1111 1111', vencimiento: '12/30', cvv: '123', titular: 'Ana Gómez' };
  return s;
};

const almacenFalso = () => {
  const datos = new Map();
  return {
    datos,
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, String(v)),
    removeItem: (k) => datos.delete(k),
  };
};

const almacenRoto = {
  getItem() { throw new Error('bloqueado'); },
  setItem() { throw new Error('bloqueado'); },
  removeItem() { throw new Error('bloqueado'); },
};

test('datosPersistibles nunca incluye tarjeta, CVV ni vencimiento', () => {
  const texto = JSON.stringify(datosPersistibles(completa()));
  assert.ok(!texto.includes('4111'));
  assert.ok(!texto.includes('"cvv"'));
  assert.ok(!texto.includes('123"'.slice(0, 3) + '"'));
  assert.ok(!texto.includes('12/30'));
  assert.ok(!texto.includes('tarjeta'));
  assert.ok(!texto.includes('vencimiento'));
});

test('datosPersistibles conserva los datos no sensibles', () => {
  const datos = datosPersistibles(completa());
  assert.equal(datos.equipo.modelo, 'Galaxy S24');
  assert.equal(datos.plan, 'premium');
  assert.equal(datos.titular.email, 'ana@correo.com');
  assert.equal(datos.pago.metodo, 'debito');
  assert.equal(datos.pago.titular, 'Ana Gómez');
});

test('datosPersistibles guarda solo datos: ni paso, ni edición pendiente, ni póliza, ni estado de interfaz', () => {
  const s = completa();
  s.paso = 6;
  s.poliza = 'POL-2026-000001';
  s.volverAPago = true;
  s.errores = { 'equipo.marca': 'x' };
  const datos = datosPersistibles(s);
  for (const clave of ['paso', 'volverAPago', 'poliza', 'errores', 'procesando', 'motivoError', 'errorPlanes']) {
    assert.ok(!(clave in datos), clave);
  }
  assert.equal(datos.producto, 'celular');
});

test('fusionarSolicitud restaura los campos válidos sobre el estado base', () => {
  const guardado = JSON.parse(JSON.stringify(datosPersistibles(completa())));
  const restaurada = fusionarSolicitud(base(), guardado);
  assert.equal(restaurada.paso, 0);
  assert.equal(restaurada.volverAPago, false);
  assert.equal(restaurada.equipo.valor, 900000);
  assert.equal(restaurada.titular.terminos, true);
  assert.equal(restaurada.pago.tarjeta, '');
  assert.equal(restaurada.pago.cvv, '');
  assert.equal(restaurada.pago.vencimiento, '');
  assert.equal(restaurada.pago.titular, 'Ana Gómez');
});

test('fusionarSolicitud descarta tipos incorrectos y claves desconocidas', () => {
  const restaurada = fusionarSolicitud(base(), {
    paso: 99,
    producto: 'auto',
    equipo: { marca: 5, modelo: 'ok', valor: 'x', hack: 1 },
    pago: { tarjeta: '4111 1111 1111 1111', cvv: '123' },
    extra: true,
  });
  assert.equal(restaurada.paso, 0);
  assert.equal(restaurada.producto, 'celular');
  assert.equal(restaurada.equipo.marca, '');
  assert.equal(restaurada.equipo.modelo, 'ok');
  assert.equal(restaurada.equipo.valor, 0);
  assert.ok(!('hack' in restaurada.equipo));
  assert.equal(restaurada.pago.tarjeta, '');
  assert.equal(restaurada.pago.cvv, '');
  assert.ok(!('extra' in restaurada));
});

test('fusionarSolicitud acepta null o basura sin romper', () => {
  assert.deepEqual(fusionarSolicitud(base(), null), base());
  assert.deepEqual(fusionarSolicitud(base(), 'texto'), base());
});

test('guardar / cargar / borrar funcionan con un almacenamiento', () => {
  const almacen = almacenFalso();
  assert.equal(guardarSolicitud(completa(), almacen), true);
  assert.ok(almacen.datos.has(CLAVE));
  assert.ok(!almacen.datos.get(CLAVE).includes('4111'));
  assert.equal(cargarSolicitud(almacen).equipo.marca, 'Samsung');
  borrarSolicitud(almacen);
  assert.equal(cargarSolicitud(almacen), null);
});

test('si el almacenamiento falla o no existe, nada lanza', () => {
  assert.equal(guardarSolicitud(completa(), almacenRoto), false);
  assert.equal(cargarSolicitud(almacenRoto), null);
  assert.doesNotThrow(() => borrarSolicitud(almacenRoto));
  assert.equal(guardarSolicitud(completa(), null), false);
  assert.equal(cargarSolicitud(null), null);
});

test('un JSON corrupto se ignora', () => {
  const almacen = almacenFalso();
  almacen.setItem(CLAVE, '{no es json');
  assert.equal(cargarSolicitud(almacen), null);
});

test('fusionarSolicitud siempre deja el paso del estado base (inicio) y la edición apagada', () => {
  const anterior = { ...JSON.parse(JSON.stringify(datosPersistibles(completa()))), paso: 4, volverAPago: true };
  const restaurada = fusionarSolicitud(base(), anterior);
  assert.equal(restaurada.paso, 0);
  assert.equal(restaurada.volverAPago, false);
  assert.equal(restaurada.equipo.modelo, 'Galaxy S24');
  assert.equal(restaurada.producto, 'celular');
});
