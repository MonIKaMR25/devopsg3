/* ==========================================================================
   components.js - Constructores de HTML para vistas y componentes
   ==========================================================================
   Funciones que generan strings HTML para las diferentes vistas de la app.
   Cada función retorna HTML listo para inyectar en el DOM.

   Validaciones:
     - Datos incompletos → renderiza valores por defecto
     - Imagen no disponible → placeholder de reemplazo
     - Stats fuera de rango → escala a 0-100%
   ========================================================================== */

import { getPokemonId } from './api.js';

// ==========================================================================
// MAPA DE COLORES POR TIPO DE POKÉMON
// ==========================================================================
const TYPE_COLORS = {
  normal:   '#A8A878', fire:     '#F08030', water:    '#6890F0',
  electric: '#F8D030', grass:    '#78C850', ice:      '#98D8D8',
  fighting: '#C03028', poison:   '#A040A0', ground:   '#E0C068',
  flying:   '#A890F0', psychic:  '#F85888', bug:      '#A8B820',
  rock:     '#B8A038', ghost:    '#705898', dragon:   '#7038F8',
  dark:     '#705848', steel:    '#B8B8D0', fairy:    '#EE99AC',
};

const TYPE_ICONS = {
  normal: 'fa-circle', fire: 'fa-fire', water: 'fa-droplet',
  electric: 'fa-bolt', grass: 'fa-leaf', ice: 'fa-snowflake',
  fighting: 'fa-hand-fist', poison: 'fa-skull', ground: 'fa-mountain',
  flying: 'fa-feather-pointed', psychic: 'fa-brain', bug: 'fa-bug',
  rock: 'fa-gem', ghost: 'fa-ghost', dragon: 'fa-dragon',
  dark: 'fa-moon', steel: 'fa-shield', fairy: 'fa-wand-sparkles',
};

const TYPE_GRADIENTS = {
  grass:    'from-green-400 to-emerald-600',
  fire:     'from-orange-400 to-red-600',
  water:    'from-blue-400 to-blue-700',
  electric: 'from-yellow-300 to-yellow-500',
  psychic:  'from-pink-400 to-pink-600',
  ghost:    'from-purple-500 to-indigo-700',
  dark:     'from-gray-700 to-gray-900',
  steel:    'from-gray-300 to-gray-500',
  fairy:    'from-pink-300 to-pink-500',
};

const STAT_LABELS = {
  hp: 'HP', attack: 'Ataque', defense: 'Defensa',
  'special-attack': 'At. Esp.', 'special-defense': 'Def. Esp.',
  speed: 'Velocidad',
};

const STAT_COLORS = {
  hp: 'bg-red-500', attack: 'bg-orange-500', defense: 'bg-blue-500',
  'special-attack': 'bg-purple-500', 'special-defense': 'bg-green-500',
  speed: 'bg-pink-500',
};

// ==========================================================================
// FUNCIONES AUXILIARES
// ==========================================================================

function getTypeColor(type) {
  return TYPE_COLORS[type] || '#A8A878';
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function padId(id) {
  return String(id).padStart(3, '0');
}

function getOfficialArtwork(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function getSprite(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

function getTypeGradient(types) {
  if (!types || types.length === 0) return 'from-blue-400 to-purple-600';
  const primary = types[0].type?.name || types[0].name || 'normal';
  return TYPE_GRADIENTS[primary] || 'from-blue-400 to-purple-600';
}

// ==========================================================================
// PANTALLA DE CARGA
// ==========================================================================

export function renderLoading(mensaje = 'Cargando...') {
  return `
    <div class="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500 dark:text-gray-400 text-lg">${mensaje}</p>
    </div>
  `;
}

// ==========================================================================
// VISTA HOME - Lista de Pokémon
// ==========================================================================

export function renderHomePage() {
  return `
    <div class="animate-fade-in">
      <div class="text-center mb-8">
        <h1 class="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-green-500 bg-clip-text text-transparent">
          Pokédex
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">Selecciona tu Pokémon inicial</p>
      </div>

      <!-- Barra de búsqueda y filtros -->
      <div class="flex flex-col sm:flex-row gap-3 mb-8">
        <div class="relative flex-1">
          <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="searchInput"
                 class="search-input pl-12"
                 placeholder="Buscar Pokémon por nombre..."
                 autocomplete="off">
        </div>
        <select id="typeFilter" class="filter-select">
          <option value="">Todos los tipos</option>
        </select>
      </div>

      <!-- Grid de Pokémon -->
      <div id="pokemonGrid"
           class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      </div>

      <!-- Mensaje sin resultados -->
      <div id="emptyMessage" class="hidden text-center py-16">
        <i class="fas fa-search text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <p class="text-xl text-gray-400">No se encontraron Pokémon</p>
        <p class="text-gray-500 mt-1">Intenta con otro nombre o filtro</p>
      </div>
    </div>
  `;
}

export function renderPokemonCard(pokemon) {
  const id = pokemon.id || getPokemonId(pokemon);
  const name = capitalize(pokemon.name);
  const image = getOfficialArtwork(id);
  const types = pokemon.types || [];

  const typeBadges = types.map(t => {
    const typeName = t.type?.name || t.name || 'normal';
    return `<span class="type-badge" style="background:${getTypeColor(typeName)}">
      <i class="fas ${TYPE_ICONS[typeName] || 'fa-circle'} text-xs"></i>
      ${typeName}
    </span>`;
  }).join('');

  return `
    <a href="#/pokemon/${id}"
       class="pokemon-card group animate-fade-in"
       style="animation-delay: ${(id % 20) * 30}ms">
      <div class="relative bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-3 overflow-hidden">
        <img src="${image}"
             alt="${name}"
             loading="lazy"
             class="w-full h-36 sm:h-40 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
             onerror="this.src='${getSprite(id)}'; this.onerror='';">
        <span class="absolute top-2 right-2 text-xs font-mono text-gray-400 dark:text-gray-500">
          #${padId(id)}
        </span>
      </div>
      <div class="text-center">
        <h3 class="font-semibold text-sm sm:text-base truncate">${name}</h3>
        <div class="flex flex-wrap justify-center gap-1 mt-2">
          ${typeBadges}
        </div>
      </div>
    </a>
  `;
}

export function renderError(message) {
  return `
    <div class="flex flex-col items-center justify-center py-20 animate-fade-in">
      <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
      <p class="text-xl text-gray-600 dark:text-gray-300 mb-2">Error</p>
      <p class="text-gray-500 dark:text-gray-400">${message}</p>
      <button onclick="window.location.hash='/'" class="mt-6 px-6 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">
        Volver al inicio
      </button>
    </div>
  `;
}

// ==========================================================================
// VISTA DETALLE - Pokémon individual
// ==========================================================================

export function renderDetailPage(pokemon, species, isCaptured) {
  const id = pokemon.id;
  const name = capitalize(pokemon.name);
  const image = getOfficialArtwork(id);
  const types = pokemon.types || [];
  const stats = pokemon.stats || [];
  const abilities = pokemon.abilities || [];
  const gradient = getTypeGradient(types);

  const typeBadges = types.map(t => {
    const tn = t.type?.name || 'normal';
    return `<span class="type-badge" style="background:${getTypeColor(tn)}">
      <i class="fas ${TYPE_ICONS[tn] || 'fa-circle'}"></i> ${tn}
    </span>`;
  }).join('');

  const statBars = stats.map(s => {
    const label = STAT_LABELS[s.stat.name] || s.stat.name;
    const value = Math.min(s.base_stat, 255);
    const pct = Math.round((value / 255) * 100);
    const color = STAT_COLORS[s.stat.name] || 'bg-blue-500';
    return `
      <div class="mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span class="text-gray-500 dark:text-gray-400">${label}</span>
          <span class="font-mono font-bold">${value}</span>
        </div>
        <div class="stat-bar">
          <div class="stat-bar-fill ${color}" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  const abilityList = abilities.map(a => {
    const an = capitalize(a.ability.name.replace(/-/g, ' '));
    return `<span class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm capitalize">
      ${an} ${a.is_hidden ? '<span class="text-xs text-yellow-500">(oculta)</span>' : ''}
    </span>`;
  }).join('');

  const flavorText = species?.flavor_text_entries
    ?.find(e => e.language.name === 'es')
    ?.flavor_text
    ?.replace(/[\n\f]/g, ' ')
    ?.replace('POKéMON', 'Pokémon')
    || species?.flavor_text_entries
    ?.find(e => e.language.name === 'en')
    ?.flavor_text
    ?.replace(/[\n\f]/g, ' ')
    ?.replace('POKéMON', 'Pokémon')
    || 'No hay descripción disponible.';

  const generation = species?.generation?.name?.replace('generation-', 'Gen ') || '';

  return `
    <div class="animate-fade-in max-w-4xl mx-auto">
      <!-- Breadcrumb / Volver -->
      <a href="#/" class="inline-flex items-center gap-2 text-gray-500 hover:text-primary-500 mb-6 transition-colors">
        <i class="fas fa-arrow-left"></i> Volver
      </a>

      <!-- Tarjeta principal -->
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
        <!-- Cabecera con gradiente -->
        <div class="bg-gradient-to-br ${gradient} p-6 sm:p-10 text-white text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-black/10"></div>
          <span class="relative text-6xl sm:text-8xl font-black opacity-20 select-none" style="position:absolute;right:20px;top:-10px">#${padId(id)}</span>
          <div class="relative z-10">
            <img src="${image}"
                 alt="${name}"
                 class="w-48 h-48 sm:w-64 sm:h-64 mx-auto object-contain drop-shadow-2xl
                        hover:scale-105 transition-transform duration-500
                        ${isCaptured ? 'animate-bounce-slow' : ''}"
                 onerror="this.src='${getSprite(id)}'">
            <h1 class="text-3xl sm:text-5xl font-bold mt-4 drop-shadow-lg">${name}</h1>
            <div class="flex justify-center gap-2 mt-3">${typeBadges}</div>
            ${generation ? `<p class="text-sm mt-2 opacity-75">${generation}</p>` : ''}
          </div>
        </div>

        <!-- Cuerpo -->
        <div class="p-6 sm:p-8">
          <!-- Descripción -->
          <p class="text-gray-600 dark:text-gray-300 italic mb-8 text-center text-lg">"${flavorText}"</p>

          <!-- Stats -->
          <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
            <i class="fas fa-chart-bar text-primary-500"></i> Estadísticas base
          </h2>
          <div class="mb-8">${statBars}</div>

          <!-- Habilidades -->
          <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
            <i class="fas fa-star text-yellow-500"></i> Habilidades
          </h2>
          <div class="flex flex-wrap gap-2 mb-8">${abilityList}</div>

          <!-- Botón de captura -->
          <div class="text-center pt-4 border-t border-gray-100 dark:border-gray-700">
            <button id="captureBtn" data-id="${id}" data-name="${name}"
                    class="capture-btn ${isCaptured ? 'opacity-60 cursor-not-allowed' : ''}"
                    ${isCaptured ? 'disabled' : ''}>
              <i class="fas ${isCaptured ? 'fa-check-circle' : 'fa-pokeball'} mr-2"></i>
              ${isCaptured ? '¡Capturado!' : '¡Capturar Pokémon!'}
            </button>
            <p class="text-sm text-gray-400 mt-2">
              ${isCaptured ? 'Este Pokémon ya está en tu Pokédex' : 'Haz clic para agregarlo a tu colección'}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// VISTA BATALLA
// ==========================================================================

export function renderBattlePage() {
  return `
    <div class="animate-fade-in max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          <i class="fas fa-crosshairs"></i> Modo Batalla
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">Selecciona tu Pokémon y lucha contra un rival aleatorio</p>
      </div>

      <div id="battleArena" class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 sm:p-8">
        <!-- Selección de Pokémon -->
        <div id="battleSelection">
          <h2 class="text-xl font-bold mb-4 text-center">Selecciona tu Pokémon</h2>
          <div id="battlePokemonList" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-2">
            <!-- Se llena dinámicamente -->
          </div>
          <div id="noPokemonBattle" class="hidden text-center py-8">
            <i class="fas fa-pokeball text-5xl text-gray-300 dark:text-gray-600 mb-3"></i>
            <p class="text-gray-500">No tienes Pokémon capturados.</p>
            <p class="text-gray-400 text-sm">¡Ve a cazar algunos primero!</p>
            <a href="#/" class="inline-block mt-4 px-6 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">
              Ir a la Pokédex
            </a>
          </div>
        </div>

        <!-- Arena de batalla -->
        <div id="battleArenaContent" class="hidden">
          <!-- Contadores de HP -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span id="playerName" class="font-bold capitalize"></span>
                <span id="playerHpText" class="font-mono"></span>
              </div>
              <div class="stat-bar h-4">
                <div id="playerHpBar" class="h-full rounded-full bg-green-500 transition-all duration-500"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span id="rivalName" class="font-bold capitalize"></span>
                <span id="rivalHpText" class="font-mono"></span>
              </div>
              <div class="stat-bar h-4">
                <div id="rivalHpBar" class="h-full rounded-full bg-green-500 transition-all duration-500"></div>
              </div>
            </div>
          </div>

          <!-- Sprites de batalla -->
          <div class="relative flex justify-between items-center py-8 px-4 min-h-[250px]">
            <div id="playerSprite" class="battle-enter w-32 sm:w-40">
              <img id="playerImg" class="w-full object-contain drop-shadow-lg" alt="Tu Pokémon">
            </div>
            <div class="text-center">
              <div id="battleLog" class="text-lg font-bold text-gray-700 dark:text-gray-200 min-h-[60px] flex items-center justify-center"></div>
            </div>
            <div id="rivalSprite" class="battle-enter-rival w-32 sm:w-40">
              <img id="rivalImg" class="w-full object-contain drop-shadow-lg" alt="Rival">
            </div>
          </div>

          <!-- Botones de acción -->
          <div id="battleActions" class="flex flex-wrap justify-center gap-3 mt-4">
            <button id="attackBtn" class="px-8 py-3 rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all active:scale-95">
              <i class="fas fa-bolt mr-2"></i> Atacar
            </button>
            <button id="fleeBtn" class="px-8 py-3 rounded-2xl font-bold bg-gray-400 hover:bg-gray-500 text-white shadow-lg transition-all active:scale-95">
              <i class="fas fa-running mr-2"></i> Huir
            </button>
            <button id="resetBattleBtn" class="hidden px-8 py-3 rounded-2xl font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all">
              <i class="fas fa-redo mr-2"></i> Nueva Batalla
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderBattlePokemonOption(pokemon) {
  return `
    <button data-id="${pokemon.id}"
            class="battle-poke-option p-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 border-2 border-transparent hover:border-primary-500 transition-all text-center cursor-pointer">
      <img src="${pokemon.image}" alt="${pokemon.name}" class="w-16 h-16 mx-auto object-contain">
      <p class="text-sm font-semibold capitalize mt-1">${pokemon.name}</p>
    </button>
  `;
}

// ==========================================================================
// VISTA POKÉDEX (capturados)
// ==========================================================================

export function renderPokedexPage() {
  return `
    <div class="animate-fade-in max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-yellow-500 bg-clip-text text-transparent">
          <i class="fas fa-book"></i> Mi Pokédex
        </h1>
        <p id="pokedexCount" class="text-gray-500 dark:text-gray-400 mt-2"></p>
      </div>

      <!-- Stats rápidas -->
      <div id="pokedexStats" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"></div>

      <!-- Botón liberar todos -->
      <div id="pokedexActions" class="text-center mb-6 hidden">
        <button id="releaseAllBtn" class="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm">
          <i class="fas fa-trash mr-1"></i> Liberar todos
        </button>
      </div>

      <!-- Grid de capturados -->
      <div id="capturedGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      </div>

      <!-- Vacía -->
      <div id="emptyPokedex" class="hidden text-center py-16">
        <i class="fas fa-pokebox text-7xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <p class="text-2xl text-gray-400">Tu Pokédex está vacía</p>
        <p class="text-gray-500 mt-1">¡Explora y captura Pokémon!</p>
        <a href="#/" class="inline-block mt-6 px-6 py-3 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 transition-colors">
          <i class="fas fa-search mr-2"></i> Explorar Pokémon
        </a>
      </div>
    </div>
  `;
}

export function renderCapturedCard(pokemon) {
  const types = pokemon.types || [];
  const typeBadges = types.map(t => {
    const tn = t.type?.name || t.name || 'normal';
    return `<span class="type-badge text-[10px]" style="background:${getTypeColor(tn)}">${tn}</span>`;
  }).join('');

  return `
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border border-gray-100 dark:border-gray-700 animate-fade-in group relative">
      <div class="relative">
        <img src="${pokemon.image}"
             alt="${pokemon.name}"
             class="w-full h-28 sm:h-32 object-contain mb-2 group-hover:scale-105 transition-transform"
             loading="lazy">
        <button data-id="${pokemon.id}"
                class="release-btn absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Liberar">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="text-center">
        <span class="text-xs text-gray-400">#${padId(pokemon.id)}</span>
        <h3 class="font-semibold text-sm capitalize">${pokemon.name}</h3>
        <div class="flex justify-center gap-1 mt-1">${typeBadges}</div>
        <p class="text-[10px] text-gray-400 mt-1">
          <i class="far fa-calendar-alt"></i> ${new Date(pokemon.capturedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  `;
}

export function renderPokedexStats(count, types) {
  const typeCounts = {};
  types.forEach(t => {
    const tn = t.type?.name || t.name || 'normal';
    typeCounts[tn] = (typeCounts[tn] || 0) + 1;
  });

  const typeEntries = Object.entries(typeCounts).slice(0, 4);
  const typeHtml = typeEntries.map(([t, c]) => `
    <div class="text-center p-2 rounded-lg" style="background:${getTypeColor(t)}22">
      <span class="type-badge text-[10px]" style="background:${getTypeColor(t)}">
        <i class="fas ${TYPE_ICONS[t] || 'fa-circle'}"></i>
      </span>
      <p class="text-xs mt-1 font-bold">${c}</p>
    </div>
  `).join('');

  return `
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow text-center">
      <p class="text-3xl font-bold text-primary-500">${count}</p>
      <p class="text-xs text-gray-400">Capturados</p>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow text-center">
      <p class="text-3xl font-bold text-green-500">${Math.round((count / 151) * 100)}%</p>
      <p class="text-xs text-gray-400">Completado</p>
    </div>
    ${typeHtml.length ? typeHtml : `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow text-center col-span-2">
        <p class="text-sm text-gray-400">Sin tipos registrados</p>
      </div>
    `}
  `;
}

// ==========================================================================
// TOAST
// ==========================================================================

export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==========================================================================
// SKELETON LOADING
// ==========================================================================

export function renderSkeleton(count = 6) {
  return Array.from({ length: count }, (_, i) => `
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md animate-pulse">
      <div class="skeleton h-32 mb-3"></div>
      <div class="skeleton h-4 w-3/4 mx-auto mb-2"></div>
      <div class="skeleton h-3 w-1/2 mx-auto"></div>
    </div>
  `).join('');
}
