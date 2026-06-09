/* ==========================================================================
   router.js - Sistema de enrutamiento por hash (#)
   ==========================================================================
   SPA Router con soporte para parámetros en la URL (ej: #/pokemon/25).
   Escucha cambios en window.location.hash y ejecuta el handler
   correspondiente.

   Validaciones:
     - Ruta no encontrada → redirige a home (#/)
     - Parámetros extraídos automáticamente de patrones :param
   ========================================================================== */

export class Router {
  /**
   * @param {Object} routes - Mapa de rutas: { '/:path/:param': handlerFn }
   *   Los handlers reciben { params: { param: valor } }
   */
  constructor(routes) {
    this.routes = routes;
    this.currentHandler = null;

    // Escuchar cambios en el hash de la URL
    window.addEventListener('hashchange', () => this.resolve());
  }

  /**
   * Resuelve la ruta actual y ejecuta el handler correspondiente.
   * Convierte patrones como '/pokemon/:id' en regex.
   */
  resolve() {
    // Obtener el hash sin el '#' inicial, o '/' por defecto
    let hash = window.location.hash.replace(/^#/, '') || '/';

    // Recorrer rutas para encontrar coincidencia
    for (const [pattern, handler] of Object.entries(this.routes)) {
      // Convertir ':param' en grupos de captura regex
      const paramNames = [];
      const regexStr = pattern.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      });
      const regex = new RegExp(`^${regexStr}$`);
      const match = hash.match(regex);

      if (match) {
        // Construir objeto de parámetros
        const params = {};
        paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });

        // Llamar al handler con los parámetros
        this.currentHandler = handler;
        handler({ params });
        return;
      }
    }

    // Fallback: redirigir a home
    console.warn(`[Router] Ruta no encontrada: "${hash}" → redirigiendo a /`);
    this.currentHandler = this.routes['/'];
    if (this.currentHandler) {
      this.currentHandler({ params: {} });
    }
  }

  /**
   * Navega a una ruta programáticamente.
   * @param {string} path - Ruta sin hash (ej: '/pokemon/25')
   */
  navigate(path) {
    window.location.hash = path;
  }

  /**
   * Obtiene el hash actual.
   * @returns {string}
   */
  getCurrentHash() {
    return window.location.hash.replace(/^#/, '') || '/';
  }

  /**
   * Inicializa el router resolviendo la ruta inicial.
   */
  init() {
    this.resolve();
  }
}
