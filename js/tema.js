// js/tema.js · modo claro/oscuro (clase .dark en <html>, variables de Basecoat)

export const CLAVE_TEMA = 'cubri-seguros:tema';

// La preferencia guardada manda; si no hay, se usa prefers-color-scheme
export function resolverTema(guardado, prefiereOscuro) {
  if (guardado === 'dark' || guardado === 'light') return guardado;
  return prefiereOscuro ? 'dark' : 'light';
}

function leerGuardado() {
  try {
    return localStorage.getItem(CLAVE_TEMA);
  } catch {
    return null;
  }
}

function guardar(tema) {
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // sin almacenamiento disponible: la preferencia solo vale para esta visita
  }
}

export function aplicarTema(tema) {
  const oscuro = tema === 'dark';
  document.documentElement.classList.toggle('dark', oscuro);
  document.querySelectorAll('[data-accion="tema"]').forEach((boton) => {
    boton.setAttribute('aria-pressed', String(oscuro));
    boton.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  });
}

export function temaActual() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function alternarTema() {
  const nuevo = temaActual() === 'dark' ? 'light' : 'dark';
  aplicarTema(nuevo);
  guardar(nuevo);
}

export function iniciarTema() {
  const prefiere = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  aplicarTema(resolverTema(leerGuardado(), prefiere));
}
