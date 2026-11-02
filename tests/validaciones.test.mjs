import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarMarca,
  validarModelo,
  validarValor,
  validarAntiguedad,
  validarNombre,
  validarDni,
  validarNacimiento,
  validarEmail,
  validarCelular,
  validarTerminos,
  validarTarjeta,
  validarVencimiento,
  validarCvv,
  validarTitular,
  erroresEquipo,
  erroresTitular,
  erroresPago,
  esValido,
  erroresDePaso,
  validarTipo,
} from '../js/validaciones.js';

const hoy = new Date(2026, 5, 15); // 15/06/2026

test('marca: obligatoria', () => {
  assert.equal(validarMarca(''), 'Elegí una marca');
  assert.equal(validarMarca('Samsung'), null);
});

test('modelo: 2 a 40 caracteres', () => {
  const msg = 'Ingresá el modelo del equipo';
  assert.equal(validarModelo(''), msg);
  assert.equal(validarModelo('A'), msg);
  assert.equal(validarModelo(' A '), msg);
  assert.equal(validarModelo('A5'), null);
  assert.equal(validarModelo('x'.repeat(40)), null);
  assert.equal(validarModelo('x'.repeat(41)), msg);
});

test('valor: entre 100.000 y 2.500.000 (límites incluidos)', () => {
  const msg = 'El valor debe estar entre $100.000 y $2.500.000';
  assert.equal(validarValor(''), msg);
  assert.equal(validarValor('abc'), msg);
  assert.equal(validarValor(99999), msg);
  assert.equal(validarValor(100000), null);
  assert.equal(validarValor('100.000'), null);
  assert.equal(validarValor('$ 600.000'), null);
  assert.equal(validarValor(2500000), null);
  assert.equal(validarValor('2.500.000'), null);
  assert.equal(validarValor(2500001), msg);
});

test('antigüedad: una opción elegida', () => {
  assert.equal(validarAntiguedad(''), 'Indicá la antigüedad');
  assert.equal(validarAntiguedad('1-2'), null);
});

test('nombre / apellido: mínimo 2 letras', () => {
  assert.equal(validarNombre(''), 'Ingresá tu nombre');
  assert.equal(validarNombre('J'), 'Ingresá tu nombre');
  assert.equal(validarNombre(' J '), 'Ingresá tu nombre');
  assert.equal(validarNombre('12'), 'Ingresá tu nombre');
  assert.equal(validarNombre('Jo'), null);
  assert.equal(validarNombre('Ñu'), null);
  assert.equal(validarNombre('', 'apellido'), 'Ingresá tu apellido');
  assert.equal(validarNombre('Pérez', 'apellido'), null);
});

test('DNI: /^\\d{7,8}$/', () => {
  const msg = 'El DNI debe tener 7 u 8 números';
  assert.equal(validarDni('123456'), msg);
  assert.equal(validarDni('1234567'), null);
  assert.equal(validarDni('12345678'), null);
  assert.equal(validarDni('123456789'), msg);
  assert.equal(validarDni('1234567a'), msg);
  assert.equal(validarDni(''), msg);
});

test('nacimiento: mayor de 18 años', () => {
  const msg = 'Tenés que ser mayor de edad';
  assert.equal(validarNacimiento('', hoy), msg);
  assert.equal(validarNacimiento('no-es-fecha', hoy), msg);
  assert.equal(validarNacimiento('2008-06-15', hoy), null); // cumple 18 hoy
  assert.equal(validarNacimiento('2008-06-16', hoy), msg); // cumple mañana
  assert.equal(validarNacimiento('2020-01-01', hoy), msg);
  assert.equal(validarNacimiento('2027-01-01', hoy), msg);
  assert.equal(validarNacimiento('1990-03-20', hoy), null);
});

test('email: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/', () => {
  const msg = 'Ingresá un email válido';
  assert.equal(validarEmail(''), msg);
  assert.equal(validarEmail('juan.perez@'), msg);
  assert.equal(validarEmail('juan@dominio'), msg);
  assert.equal(validarEmail('ju an@x.com'), msg);
  assert.equal(validarEmail('juan@x.com'), null);
});

test('celular: 10 dígitos sin 0 ni 15, ignorando espacios y guiones', () => {
  const msg = 'Ej.: 11 5555-1234';
  assert.equal(validarCelular(''), msg);
  assert.equal(validarCelular('11 5555-1234'), null);
  assert.equal(validarCelular('1155551234'), null);
  assert.equal(validarCelular('11-5555-1234'), null);
  assert.equal(validarCelular('115555123'), msg); // 9 dígitos
  assert.equal(validarCelular('11555512345'), msg); // 11 dígitos
  assert.equal(validarCelular('011 5555-1234'), msg); // empieza con 0
  assert.equal(validarCelular('0115555123'), msg);
  assert.equal(validarCelular('15 5555-1234'), msg); // empieza con 15
  assert.equal(validarCelular('11 5555-12a4'), msg);
});

test('términos: tildado', () => {
  assert.equal(validarTerminos(false), 'Tenés que aceptar los términos');
  assert.equal(validarTerminos(true), null);
});

test('tarjeta: 16 dígitos ignorando espacios', () => {
  const msg = 'Número de tarjeta inválido';
  assert.equal(validarTarjeta(''), msg);
  assert.equal(validarTarjeta('4111 1111 1111 111'), msg);
  assert.equal(validarTarjeta('4111 1111 1111 11111'), msg);
  assert.equal(validarTarjeta('4111 1111 1111 111a'), msg);
  assert.equal(validarTarjeta('4111 1111 1111 1111'), null);
  assert.equal(validarTarjeta('4000000000000002'), null);
});

test('vencimiento: MM/AA, mes 01–12 y fecha futura', () => {
  const msg = 'Vencimiento inválido';
  assert.equal(validarVencimiento('', hoy), msg);
  assert.equal(validarVencimiento('1230', hoy), msg);
  assert.equal(validarVencimiento('13/30', hoy), msg);
  assert.equal(validarVencimiento('00/30', hoy), msg);
  assert.equal(validarVencimiento('12/2030', hoy), msg);
  assert.equal(validarVencimiento('05/26', hoy), msg); // mes pasado
  assert.equal(validarVencimiento('12/25', hoy), msg); // año pasado
  assert.equal(validarVencimiento('06/26', hoy), null); // vence a fin del mes actual
  assert.equal(validarVencimiento('07/26', hoy), null);
  assert.equal(validarVencimiento('12/30', hoy), null);
});

test('CVV: 3 dígitos', () => {
  const msg = 'CVV inválido';
  assert.equal(validarCvv(''), msg);
  assert.equal(validarCvv('12'), msg);
  assert.equal(validarCvv('1234'), msg);
  assert.equal(validarCvv('12a'), msg);
  assert.equal(validarCvv('123'), null);
});

test('titular de la tarjeta: obligatorio', () => {
  assert.equal(validarTitular(''), 'Ingresá el nombre del titular');
  assert.equal(validarTitular('   '), 'Ingresá el nombre del titular');
  assert.equal(validarTitular('Ana Gómez'), null);
});

test('erroresEquipo / erroresTitular / erroresPago agrupan por campo', () => {
  const vacio = erroresEquipo({ marca: '', modelo: '', valor: 0, antiguedad: '' });
  assert.deepEqual(Object.keys(vacio), ['marca', 'modelo', 'valor', 'antiguedad']);
  assert.equal(esValido(vacio), false);

  const ok = erroresEquipo({ marca: 'Samsung', modelo: 'A55', valor: 600000, antiguedad: '1-2' });
  assert.equal(esValido(ok), true);

  const t = erroresTitular(
    { nombre: 'Ana', apellido: 'G', dni: '1234567', nacimiento: '1990-01-01', email: 'a@b.co', celular: '1155551234', terminos: false },
    hoy,
  );
  assert.equal(t.apellido, 'Ingresá tu apellido');
  assert.equal(t.terminos, 'Tenés que aceptar los términos');
  assert.equal(esValido(t), false);

  const p = erroresPago(
    { metodo: 'credito', tarjeta: '4111 1111 1111 1111', vencimiento: '12/30', cvv: '123', titular: 'Ana Gómez' },
    hoy,
  );
  assert.equal(esValido(p), true);
});

test('erroresDePaso devuelve claves con prefijo y respeta el orden de los campos', () => {
  const solicitud = {
    equipo: { marca: '', modelo: '', valor: 0, antiguedad: '' },
    titular: { nombre: '', apellido: '', dni: '', nacimiento: '', email: '', celular: '', terminos: false },
    pago: { metodo: 'credito', tarjeta: '', vencimiento: '', cvv: '', titular: '' },
  };
  assert.deepEqual(Object.keys(erroresDePaso(1, solicitud, hoy)), [
    'equipo.marca', 'equipo.modelo', 'equipo.valor', 'equipo.antiguedad',
  ]);
  assert.deepEqual(Object.keys(erroresDePaso(3, solicitud, hoy)), [
    'titular.nombre', 'titular.apellido', 'titular.dni', 'titular.nacimiento',
    'titular.email', 'titular.celular', 'titular.terminos',
  ]);
  assert.deepEqual(Object.keys(erroresDePaso(4, solicitud, hoy)), [
    'pago.tarjeta', 'pago.vencimiento', 'pago.cvv', 'pago.titular',
  ]);
  assert.deepEqual(erroresDePaso(2, solicitud, hoy), {});
  assert.equal(esValido(erroresDePaso(2, solicitud, hoy)), true);
});

test('validarValor acepta un rango propio (bicicleta) con el mensaje correspondiente', () => {
  const rango = { min: 50000, max: 3000000 };
  const msg = 'El valor debe estar entre $50.000 y $3.000.000';
  assert.equal(validarValor(49999, rango), msg);
  assert.equal(validarValor(50000, rango), null);
  assert.equal(validarValor(3000000, rango), null);
  assert.equal(validarValor(3000001, rango), msg);
  assert.equal(validarValor(99999), 'El valor debe estar entre $100.000 y $2.500.000');
});

test('validarTipo: obligatorio', () => {
  assert.equal(validarTipo(''), 'Elegí el tipo de bicicleta');
  assert.equal(validarTipo('ruta'), null);
});

test('erroresEquipo de bicicleta valida tipo en lugar de antigüedad', () => {
  const vacio = erroresEquipo({ marca: '', modelo: '', valor: 0, antiguedad: '', tipo: '' }, 'bicicleta');
  assert.deepEqual(Object.keys(vacio), ['marca', 'modelo', 'valor', 'tipo']);
  const ok = erroresEquipo({ marca: 'Trek', modelo: 'Marlin 5', valor: 60000, antiguedad: '', tipo: 'montana' }, 'bicicleta');
  assert.equal(esValido(ok), true);
  const celular = erroresEquipo({ marca: 'Samsung', modelo: 'A5', valor: 60000, antiguedad: '1-2' });
  assert.equal(celular.valor, 'El valor debe estar entre $100.000 y $2.500.000');
});

test('erroresDePaso usa el producto de la solicitud', () => {
  const solicitud = {
    producto: 'bicicleta',
    equipo: { marca: '', modelo: '', valor: 0, antiguedad: '', tipo: '' },
  };
  assert.deepEqual(Object.keys(erroresDePaso(1, solicitud, hoy)), [
    'equipo.marca', 'equipo.modelo', 'equipo.valor', 'equipo.tipo',
  ]);
});
