/* ==========================================================================
   api.js - Consumo de la PokeAPI (https://pokeapi.co)
   ==========================================================================
   Funciones asíncronas para obtener datos de Pokémon desde la PokeAPI v2.
   Incluye manejo de errores y timeouts básicos.

   Validaciones:
     - Error de red → lanza excepción con mensaje descriptivo
     - Pokémon no encontrado (404) → lanza 'POKEMON_NOT_FOUND'
     - Límite de resultados configurable (default: 151 = 1ra generación)
   ========================================================================== */

const BASE_URL = 'https://pokeapi.co/api/v2';
const TIMEOUT_MS = 10000;

/**
 * Fetch con timeout.
 * @param {string} url
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Obtiene la lista básica de Pokémon (nombre y URL).
 * @param {number} limit - Cantidad de Pokémon (default: 151)
 * @param {number} offset - Desde dónde empezar (default: 0)
 * @returns {Promise<Array<{name: string, url: string}>>}
 */
export async function getPokemonList(limit = 151, offset = 0) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data.results;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La solicitud a la PokeAPI tardó demasiado. Verifique su conexión.');
    }
    throw new Error(`Error al obtener lista Pokémon: ${err.message}`);
  }
}

/**
 * Obtiene el detalle completo de un Pokémon por nombre o ID.
 * @param {string|number} nameOrId
 * @returns {Promise<Object>} Datos completos del Pokémon
 */
export async function getPokemonDetail(nameOrId) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/pokemon/${nameOrId}`);
    if (res.status === 404) {
      throw new Error('POKEMON_NOT_FOUND');
    }
    if (!res.ok) throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data;
  } catch (err) {
    if (err.message === 'POKEMON_NOT_FOUND') {
      throw new Error(`Pokémon "${nameOrId}" no encontrado.`);
    }
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Verifique su conexión.');
    }
    throw new Error(`Error al obtener detalle: ${err.message}`);
  }
}

/**
 * Obtiene la especie de un Pokémon (texto descriptivo, generación, etc.).
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function getPokemonSpecies(id) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/pokemon-species/${id}`);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado.');
    }
    throw new Error(`Error al obtener especie: ${err.message}`);
  }
}

/**
 * Obtiene todos los Pokémon de un tipo específico.
 * @param {string} type - Nombre del tipo (ej: 'fire', 'water')
 * @returns {Promise<Array<{name: string, url: string}>>}
 */
export async function getPokemonByType(type) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/type/${type}`);
    if (res.status === 404) {
      throw new Error(`Tipo "${type}" no encontrado.`);
    }
    if (!res.ok) throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data.pokemon.map(p => p.pokemon);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado.');
    }
    throw new Error(`Error al filtrar por tipo: ${err.message}`);
  }
}

/**
 * Obtiene la lista completa de tipos de Pokémon.
 * @returns {Promise<Array<{name: string, url: string}>>}
 */
export async function getTypeList() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/type`);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data.results.filter(t =>
      !['shadow', 'unknown', 'stellar'].includes(t.name)
    );
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado.');
    }
    throw new Error(`Error al obtener tipos: ${err.message}`);
  }
}

/**
 * Extrae el ID numérico de la URL de un Pokémon.
 * @param {Object} pokemon - Objeto con propiedad 'url'
 * @returns {number}
 */
export function getPokemonId(pokemon) {
  if (pokemon.id) return pokemon.id;
  const parts = pokemon.url.split('/').filter(Boolean);
  return parseInt(parts[parts.length - 1], 10);
}
