// js/mascaras.js · máscaras de entrada (funciones puras)

const soloDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

// "4111111111111111" → "4111 1111 1111 1111" (hasta 16 dígitos, sin espacio final)
export function formatearTarjeta(valor) {
  return soloDigitos(valor).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

// "1230" → "12/30". La barra aparece recién con el tercer dígito para poder borrarla.
export function formatearVencimiento(valor) {
  const digitos = soloDigitos(valor).slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}

// Posición del cursor en el texto formateado, justo después del dígito número `digitosAntes`
export function posicionCursor(formateado, digitosAntes) {
  if (digitosAntes <= 0) return 0;
  let cuenta = 0;
  for (let i = 0; i < formateado.length; i += 1) {
    if (/\d/.test(formateado[i])) cuenta += 1;
    if (cuenta === digitosAntes) return i + 1;
  }
  return formateado.length;
}
