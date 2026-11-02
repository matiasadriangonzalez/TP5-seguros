// js/validaciones.js · funciones puras: reciben un valor y devuelven un mensaje de error o null

import { parsearNumero, formatearNumero } from './cotizador.js';
import { PRODUCTOS } from './productos.js';

const RANGO_CELULAR = PRODUCTOS.celular.rango;

const soloTexto = (v) => String(v ?? '').trim();

export function validarMarca(valor) {
  return soloTexto(valor) === '' ? 'Elegí una marca' : null;
}

export function validarModelo(valor) {
  const largo = soloTexto(valor).length;
  return largo >= 2 && largo <= 40 ? null : 'Ingresá el modelo del equipo';
}

// El rango por defecto es el del celular; la bicicleta pasa el suyo
export function validarValor(valor, rango = RANGO_CELULAR) {
  const n = parsearNumero(valor);
  return n >= rango.min && n <= rango.max
    ? null
    : `El valor debe estar entre $${formatearNumero(rango.min)} y $${formatearNumero(rango.max)}`;
}

export function validarTipo(valor) {
  return soloTexto(valor) === '' ? 'Elegí el tipo de bicicleta' : null;
}

export function validarAntiguedad(valor) {
  return soloTexto(valor) === '' ? 'Indicá la antigüedad' : null;
}

// campo: 'nombre' | 'apellido'
export function validarNombre(valor, campo = 'nombre') {
  const letras = (soloTexto(valor).match(/\p{L}/gu) ?? []).length;
  return letras >= 2 ? null : `Ingresá tu ${campo}`;
}

export function validarDni(valor) {
  return /^\d{7,8}$/.test(soloTexto(valor)) ? null : 'El DNI debe tener 7 u 8 números';
}

// valor en formato AAAA-MM-DD (input type="date"); mayor de 18 años a la fecha "hoy"
export function validarNacimiento(valor, hoy = new Date()) {
  const msg = 'Tenés que ser mayor de edad';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(soloTexto(valor));
  if (!m) return msg;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return msg;
  }
  const limite = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
  return fecha <= limite ? null : msg;
}

export function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(soloTexto(valor)) ? null : 'Ingresá un email válido';
}

// 10 dígitos, sin 0 ni 15 al inicio; se ignoran espacios y guiones
export function validarCelular(valor) {
  const limpio = soloTexto(valor).replace(/[\s-]/g, '');
  const ok = /^\d{10}$/.test(limpio) && !limpio.startsWith('0') && !limpio.startsWith('15');
  return ok ? null : 'Ej.: 11 5555-1234';
}

export function validarTerminos(valor) {
  return valor === true ? null : 'Tenés que aceptar los términos';
}

export function validarTarjeta(valor) {
  return /^\d{16}$/.test(String(valor ?? '').replace(/\s/g, ''))
    ? null
    : 'Número de tarjeta inválido';
}

// MM/AA, mes 01–12; la tarjeta vale hasta el último día del mes indicado
export function validarVencimiento(valor, hoy = new Date()) {
  const msg = 'Vencimiento inválido';
  const m = /^(\d{2})\/(\d{2})$/.exec(soloTexto(valor));
  if (!m) return msg;
  const mes = Number(m[1]);
  const anio = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return msg;
  const finDeMes = new Date(anio, mes, 0, 23, 59, 59, 999);
  return finDeMes >= hoy ? null : msg;
}

export function validarCvv(valor) {
  return /^\d{3}$/.test(soloTexto(valor)) ? null : 'CVV inválido';
}

export function validarTitular(valor) {
  return soloTexto(valor) === '' ? 'Ingresá el nombre del titular' : null;
}

// Agrupadores por paso: devuelven { campo: mensaje | null }
export function erroresEquipo(equipo, producto = 'celular') {
  const comunes = {
    marca: validarMarca(equipo.marca),
    modelo: validarModelo(equipo.modelo),
    valor: validarValor(equipo.valor, PRODUCTOS[producto]?.rango ?? RANGO_CELULAR),
  };
  return producto === 'bicicleta'
    ? { ...comunes, tipo: validarTipo(equipo.tipo) }
    : { ...comunes, antiguedad: validarAntiguedad(equipo.antiguedad) };
}

export function erroresTitular(titular, hoy = new Date()) {
  return {
    nombre: validarNombre(titular.nombre, 'nombre'),
    apellido: validarNombre(titular.apellido, 'apellido'),
    dni: validarDni(titular.dni),
    nacimiento: validarNacimiento(titular.nacimiento, hoy),
    email: validarEmail(titular.email),
    celular: validarCelular(titular.celular),
    terminos: validarTerminos(titular.terminos),
  };
}

export function erroresPago(pago, hoy = new Date()) {
  return {
    tarjeta: validarTarjeta(pago.tarjeta),
    vencimiento: validarVencimiento(pago.vencimiento, hoy),
    cvv: validarCvv(pago.cvv),
    titular: validarTitular(pago.titular),
  };
}

// Errores de un paso del checkout, con claves "grupo.campo". El paso 2 (plan) no tiene campos.
export function erroresDePaso(paso, solicitud, hoy = new Date()) {
  const prefijar = (grupo, errores) =>
    Object.fromEntries(Object.entries(errores).map(([campo, msg]) => [`${grupo}.${campo}`, msg]));
  if (paso === 1) {
    return prefijar('equipo', erroresEquipo(solicitud.equipo, solicitud.producto ?? 'celular'));
  }
  if (paso === 3) return prefijar('titular', erroresTitular(solicitud.titular, hoy));
  if (paso === 4) return prefijar('pago', erroresPago(solicitud.pago, hoy));
  return {};
}

export function esValido(errores) {
  return Object.values(errores).every((e) => e === null);
}
