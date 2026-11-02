// js/productos.js · catálogo de productos habilitados y sus reglas (sin DOM)
import { factorAntiguedad } from './cotizador.js';

const FACTORES_TIPO = {
  urbana: 1.0,
  montana: 1.15,
  ruta: 1.2,
  electrica: 1.35,
};

export const TIPOS_BICICLETA = [
  { id: 'urbana', etiqueta: 'Urbana' },
  { id: 'montana', etiqueta: 'Montaña' },
  { id: 'ruta', etiqueta: 'Ruta' },
  { id: 'electrica', etiqueta: 'Eléctrica' },
];

export const PRODUCTOS = {
  celular: {
    id: 'celular',
    nombre: 'Celular',
    rutaPlanes: 'data/planes.json',
    rango: { min: 100000, max: 2500000 },
    campoFactor: 'antiguedad',
    marcas: ['Samsung', 'Apple', 'Motorola', 'Xiaomi', 'Realme', 'Otra'],
    textos: {
      titulo: 'Contanos sobre tu celular',
      protegido: 'Tu celular ya está protegido',
      placeholderModelo: 'Modelo de tu celular',
      ayudaMarca: 'Marca de tu celular',
    },
  },
  bicicleta: {
    id: 'bicicleta',
    nombre: 'Bicicleta',
    rutaPlanes: 'data/planes-bicicleta.json',
    rango: { min: 50000, max: 3000000 },
    campoFactor: 'tipo',
    marcas: ['Trek', 'Specialized', 'Giant', 'Scott', 'Cannondale', 'Otra'],
    textos: {
      titulo: 'Contanos sobre tu bicicleta',
      protegido: 'Tu bicicleta ya está protegida',
      placeholderModelo: 'Modelo de tu bicicleta',
      ayudaMarca: 'Marca de tu bicicleta',
    },
  },
};

export function productoValido(id) {
  return Object.prototype.hasOwnProperty.call(PRODUCTOS, id);
}

// Factor que multiplica la cuota: antigüedad en el celular, tipo en la bicicleta. null si falta.
export function factorDeEquipo(producto, equipo) {
  if (producto === 'bicicleta') {
    return Object.prototype.hasOwnProperty.call(FACTORES_TIPO, equipo?.tipo)
      ? FACTORES_TIPO[equipo.tipo]
      : null;
  }
  return factorAntiguedad(equipo?.antiguedad);
}
