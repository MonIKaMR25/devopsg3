/* ==========================================================================
   pokedex.js - Gestión de la Pokédex local (localStorage)
   ==========================================================================
   Permite capturar, liberar y consultar Pokémon almacenados en el
   navegador mediante localStorage.

   Validaciones:
     - Pokédex vacía → lista vacía, no error
     - Capturar duplicado → se ignora (no se puede capturar 2 veces)
     - Liberar Pokémon inexistente → se ignora
     - Límite de almacenamiento (5MB) → se captura error y se notifica
   ========================================================================== */

const STORAGE_KEY = 'pokemon_game_pokedex';

/**
 * Obtiene todos los Pokémon capturados desde localStorage.
 * @returns {Array} Lista de objetos Pokémon guardados
 */
export function getCaptured() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('[Pokédex] Error al leer localStorage:', err.message);
    return [];
  }
}

/**
 * Verifica si un Pokémon ya está capturado.
 * @param {number} id - ID del Pokémon
 * @returns {boolean}
 */
export function isCaptured(id) {
  return getCaptured().some(p => p.id === id);
}

/**
 * Captura un Pokémon (lo agrega a localStorage).
 * @param {Object} pokemon - Datos del Pokémon { id, name, types, image, stats, abilities }
 * @returns {{ success: boolean, message: string }}
 */
export function capture(pokemon) {
  try {
    const list = getCaptured();

    // Validación: no duplicados
    if (list.some(p => p.id === pokemon.id)) {
      return { success: false, message: `${pokemon.name} ya está en tu Pokédex.` };
    }

    // Validación: almacenar solo datos esenciales
    const entry = {
      id: pokemon.id,
      name: pokemon.name,
      types: pokemon.types,
      image: pokemon.image,
      sprite: pokemon.sprite,
      capturedAt: new Date().toISOString(),
    };

    list.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return { success: true, message: `¡${pokemon.name} capturado!` };
  } catch (err) {
    // Posible error: cuota de localStorage excedida
    console.error('[Pokédex] Error al capturar:', err);
    return { success: false, message: 'Error al guardar. Posiblemente el almacenamiento esté lleno.' };
  }
}

/**
 * Libera un Pokémon (lo elimina de localStorage).
 * @param {number} id - ID del Pokémon
 * @returns {{ success: boolean, message: string }}
 */
export function release(id) {
  try {
    const list = getCaptured();
    const idx = list.findIndex(p => p.id === id);

    if (idx === -1) {
      return { success: false, message: 'Pokémon no encontrado en la Pokédex.' };
    }

    const name = list[idx].name;
    list.splice(idx, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return { success: true, message: `${name} ha sido liberado.` };
  } catch (err) {
    console.error('[Pokédex] Error al liberar:', err);
    return { success: false, message: 'Error al liberar Pokémon.' };
  }
}

/**
 * Obtiene el conteo de Pokémon capturados.
 * @returns {number}
 */
export function getCount() {
  return getCaptured().length;
}
