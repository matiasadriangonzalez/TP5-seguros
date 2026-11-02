// js/modelos.js · sugerencias de modelos por marca (solo ayuda: el campo sigue siendo texto libre)

export const MODELOS = {
  celular: {
    Samsung: [
      'Galaxy A15', 'Galaxy A25', 'Galaxy A35', 'Galaxy A55', 'Galaxy S23', 'Galaxy S24',
      'Galaxy S24 Ultra', 'Galaxy S25', 'Galaxy S25 Ultra', 'Galaxy Z Flip6', 'Galaxy Z Fold6',
    ],
    Apple: [
      'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 15 Pro', 'iPhone 16', 'iPhone 16 Pro',
      'iPhone 16 Pro Max', 'iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max', 'iPhone Air',
    ],
    Motorola: [
      'Moto G24', 'Moto G54', 'Moto G84', 'Edge 40', 'Edge 50 Pro', 'Razr 50',
    ],
    Xiaomi: [
      'Redmi 13C', 'Redmi Note 13', 'Redmi Note 13 Pro', 'Poco X6 Pro', 'Xiaomi 14', 'Xiaomi 14T',
    ],
    Realme: [
      'Realme C55', 'Realme 11 Pro', 'Realme 12 Pro', 'Realme GT 6', 'Realme Note 50',
    ],
  },
  bicicleta: {
    Trek: ['Marlin 5', 'FX 2', 'Domane AL 2'],
    Specialized: ['Rockhopper', 'Sirrus 2.0', 'Allez'],
    Giant: ['Talon 3', 'Escape 3', 'Contend AR 3'],
    Scott: ['Aspect 950', 'Speedster 40'],
    Cannondale: ['Trail 7', 'Quick 4'],
  },
};

// Devuelve una copia de la lista de modelos de la marca (vacía si no hay sugerencias)
export function modelosDeMarca(marca, producto = 'celular') {
  const clave = String(marca ?? '').trim().toLowerCase();
  const catalogo = MODELOS[producto] ?? {};
  const nombre = Object.keys(catalogo).find((m) => m.toLowerCase() === clave);
  return nombre ? [...catalogo[nombre]] : [];
}
