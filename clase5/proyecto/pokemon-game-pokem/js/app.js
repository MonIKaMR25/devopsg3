/* ==========================================================================
   app.js - Punto de entrada principal de la aplicación
   ==========================================================================
   Inicializa el router, configura las rutas, maneja el modo oscuro,
   y coordina todas las vistas de la SPA.

   Validaciones:
     - API offline → muestra pantalla de error con opción de reintentar
     - Búsqueda sin resultados → mensaje "no encontrado"
     - localStorage no disponible → Pokédex readonly
   ========================================================================== */

import { Router } from './router.js';
import {
  getPokemonList, getPokemonDetail, getPokemonSpecies,
  getPokemonByType, getTypeList, getPokemonId,
} from './api.js';
import { capture, release, getCaptured, isCaptured, getCount } from './pokedex.js';
import { startBattle, playerAttack, rivalAttack, resetBattle } from './battle.js';
import {
  renderLoading, renderHomePage, renderPokemonCard, renderError,
  renderDetailPage, renderBattlePage, renderBattlePokemonOption,
  renderPokedexPage, renderCapturedCard, renderPokedexStats,
  renderSkeleton, showToast,
} from './components.js';

// ==========================================================================
// ESTADO GLOBAL
// ==========================================================================

const state = {
  allPokemon: [],      // Lista completa (151)
  filteredList: [],    // Lista después de filtros
  pokemonTypes: [],    // Lista de tipos disponibles
  currentFilter: '',   // Tipo seleccionado
  currentSearch: '',   // Texto de búsqueda
  darkMode: true,      // Modo oscuro activo por defecto
};

// ==========================================================================
// DOM READY - Inicialización
// ==========================================================================

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Inicializar modo oscuro
  initDarkMode();

  // Definir rutas
  const router = new Router({
    '/':               homeView,
    '/pokemon/:id':    detailView,
    '/battle':         battleView,
    '/pokedex':        pokedexView,
  });

  router.init();
}

// ==========================================================================
// MODO OSCURO
// ==========================================================================

function initDarkMode() {
  const saved = localStorage.getItem('pokemon_dark_mode');
  state.darkMode = saved !== null ? saved === 'true' : true;

  applyDarkMode(state.darkMode);

  const toggle = document.getElementById('darkToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('pokemon_dark_mode', state.darkMode);
      applyDarkMode(state.darkMode);
    });
  }
}

function applyDarkMode(isDark) {
  const html = document.documentElement;
  const icon = document.getElementById('darkIcon');

  if (isDark) {
    html.classList.add('dark');
    if (icon) { icon.className = 'fas fa-sun text-lg'; }
  } else {
    html.classList.remove('dark');
    if (icon) { icon.className = 'fas fa-moon text-lg'; }
  }
}

// ==========================================================================
// MANEJO DE NAVEGACIÓN ACTIVA
// ==========================================================================

function updateActiveNav(hash) {
  document.querySelectorAll('[data-nav]').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === hash || (href === '#/' && hash === '/'));
  });
}

// ==========================================================================
// RENDERIZADO DE VISTAS
// ==========================================================================

function render(html) {
  const app = document.getElementById('app');
  if (app) app.innerHTML = html;
}

// ==========================================================================
// VISTA: HOME (Lista de Pokémon)
// ==========================================================================

async function homeView() {
  updateActiveNav('/');
  render(renderHomePage());

  // Cargar tipos en el selector
  loadTypeFilter();

  // Cargar Pokémon
  await loadPokemonList();

  // Configurar eventos de filtro
  setupFilterEvents();
}

async function loadTypeFilter() {
  try {
    state.pokemonTypes = await getTypeList();
    const select = document.getElementById('typeFilter');
    if (!select) return;

    state.pokemonTypes.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.name;
      opt.textContent = t.name.charAt(0).toUpperCase() + t.name.slice(1);
      select.appendChild(opt);
    });
  } catch (err) {
    console.warn('[Types] Error al cargar tipos:', err.message);
  }
}

async function loadPokemonList() {
  const grid = document.getElementById('pokemonGrid');
  if (!grid) return;

  // Mostrar skeleton mientras carga
  grid.innerHTML = renderSkeleton(12);

  try {
    state.allPokemon = await getPokemonList(151, 0);
    state.filteredList = [...state.allPokemon];
    renderPokemonGrid();
  } catch (err) {
    console.error('[Home] Error:', err.message);
    grid.innerHTML = `
      <div class="col-span-full text-center py-10">
        <i class="fas fa-exclamation-circle text-5xl text-red-400 mb-4"></i>
        <p class="text-lg text-gray-500">${err.message}</p>
        <button onclick="window.location.reload()" class="mt-4 px-6 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">
          Reintentar
        </button>
      </div>
    `;
  }
}

function renderPokemonGrid() {
  const grid = document.getElementById('pokemonGrid');
  const empty = document.getElementById('emptyMessage');
  if (!grid) return;

  if (state.filteredList.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');
  grid.innerHTML = state.filteredList.map(p => renderPokemonCard(p)).join('');
}

function setupFilterEvents() {
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');

  if (searchInput) {
    // Debounce para evitar llamadas excesivas
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.currentSearch = searchInput.value.toLowerCase().trim();
        applyFilters();
      }, 300);
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener('change', () => {
      state.currentFilter = typeFilter.value;
      applyFilters();
    });
  }
}

async function applyFilters() {
  const grid = document.getElementById('pokemonGrid');
  if (!grid) return;

  grid.innerHTML = renderSkeleton(6);

  try {
    let list = [...state.allPokemon];

    // Filtro por tipo
    if (state.currentFilter) {
      const typeList = await getPokemonByType(state.currentFilter);
      const typeNames = new Set(typeList.map(p => p.name));
      list = list.filter(p => typeNames.has(p.name));
    }

    // Filtro por búsqueda de nombre
    if (state.currentSearch) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(state.currentSearch)
      );
    }

    state.filteredList = list;
    renderPokemonGrid();
  } catch (err) {
    console.error('[Filter] Error:', err.message);
    grid.innerHTML = `
      <div class="col-span-full text-center py-10">
        <p class="text-red-400">Error al filtrar: ${err.message}</p>
      </div>
    `;
  }
}

// ==========================================================================
// VISTA: DETALLE DE POKÉMON
// ==========================================================================

async function detailView({ params }) {
  updateActiveNav('');
  render(renderLoading('Cargando Pokémon...'));

  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id) || id < 1 || id > 10000) {
      render(renderError('ID de Pokémon inválido.'));
      return;
    }

    const [pokemon, species] = await Promise.all([
      getPokemonDetail(id),
      getPokemonSpecies(id).catch(() => null),
    ]);

    const captured = isCaptured(id);
    render(renderDetailPage(pokemon, species, captured));

    // Configurar botón de captura
    setupCaptureButton(pokemon);
  } catch (err) {
    render(renderError(err.message));
  }
}

function setupCaptureButton(pokemon) {
  const btn = document.getElementById('captureBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (btn.disabled) return;

    const result = capture({
      id: pokemon.id,
      name: pokemon.name,
      types: pokemon.types,
      image: pokemon.sprites?.other?.['official-artwork']?.front_default
             || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
      sprite: pokemon.sprites?.front_default,
    });

    if (result.success) {
      btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> ¡Capturado!';
      btn.disabled = true;
      btn.classList.add('opacity-60', 'cursor-not-allowed');
      showToast(result.message, 'success');
      // Agregar animación de captura
      createCaptureParticles(pokemon.name);
    } else {
      showToast(result.message, 'error');
    }
  });
}

function createCaptureParticles(name) {
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'captured-particle';
    particle.textContent = ['⭐', '✨', '⚡', '🌟'][i % 4];
    particle.style.left = (30 + Math.random() * 40) + '%';
    particle.style.top = (30 + Math.random() * 40) + '%';
    particle.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
}

// ==========================================================================
// VISTA: BATALLA
// ==========================================================================

async function battleView() {
  updateActiveNav('#/battle');
  render(renderBattlePage());

  await loadBattlePokemonSelection();
}

async function loadBattlePokemonSelection() {
  const list = getCaptured();
  const container = document.getElementById('battlePokemonList');
  const noPokemon = document.getElementById('noPokemonBattle');

  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = '';
    if (noPokemon) noPokemon.classList.remove('hidden');
    return;
  }

  // Mostrar los Pokémon capturados para seleccionar
  container.innerHTML = list.map(p => renderBattlePokemonOption(p)).join('');

  // Eventos de selección
  container.querySelectorAll('.battle-poke-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id, 10);
      await initBattle(id);
    });
  });
}

async function initBattle(pokemonId) {
  const selection = document.getElementById('battleSelection');
  const arena = document.getElementById('battleArenaContent');

  if (selection) selection.classList.add('hidden');
  if (arena) arena.classList.remove('hidden');

  const log = document.getElementById('battleLog');
  if (log) log.textContent = 'Iniciando batalla...';

  try {
    const { player, rival } = await startBattle(pokemonId);
    updateBattleUI(player, rival);
    showToast(`¡Batalla iniciada! ${capitalize(player.name)} vs ${capitalize(rival.name)}`, 'info');
  } catch (err) {
    showToast('Error al iniciar batalla: ' + err.message, 'error');
  }
}

function updateBattleUI(player, rival) {
  const pImg = document.getElementById('playerImg');
  const rImg = document.getElementById('rivalImg');
  const pName = document.getElementById('playerName');
  const rName = document.getElementById('rivalName');
  const pHpBar = document.getElementById('playerHpBar');
  const rHpBar = document.getElementById('rivalHpBar');
  const pHpText = document.getElementById('playerHpText');
  const rHpText = document.getElementById('rivalHpText');
  const log = document.getElementById('battleLog');
  const attackBtn = document.getElementById('attackBtn');
  const fleeBtn = document.getElementById('fleeBtn');
  const resetBtn = document.getElementById('resetBattleBtn');
  const pSprite = document.getElementById('playerSprite');
  const rSprite = document.getElementById('rivalSprite');

  if (pImg) pImg.src = player.image;
  if (rImg) rImg.src = rival.image;
  if (pName) pName.textContent = capitalize(player.name);
  if (rName) rName.textContent = capitalize(rival.name);
  if (pHpBar) {
    const pct = (player.hp / player.maxHp) * 100;
    pHpBar.style.width = pct + '%';
    pHpBar.className = `h-full rounded-full transition-all duration-500 ${pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`;
  }
  if (rHpBar) {
    const pct = (rival.hp / rival.maxHp) * 100;
    rHpBar.style.width = pct + '%';
    rHpBar.className = `h-full rounded-full transition-all duration-500 ${pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`;
  }
  if (pHpText) pHpText.textContent = `${player.hp}/${player.maxHp}`;
  if (rHpText) rHpText.textContent = `${rival.hp}/${rival.maxHp}`;
  if (log) log.textContent = '¡Selecciona una acción!';

  // Remover animaciones previas
  if (pSprite) { pSprite.classList.remove('attack-animation', 'damage-flash'); }
  if (rSprite) { rSprite.classList.remove('attack-animation-rival', 'damage-flash'); }

  // Configurar botones
  if (attackBtn) {
    attackBtn.onclick = handlePlayerAttack;
    attackBtn.disabled = false;
    attackBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
  if (fleeBtn) {
    fleeBtn.onclick = handleFlee;
    fleeBtn.disabled = false;
    fleeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
  if (resetBtn) resetBtn.classList.add('hidden');
}

async function handlePlayerAttack() {
  const attackBtn = document.getElementById('attackBtn');
  const fleeBtn = document.getElementById('fleeBtn');
  const log = document.getElementById('battleLog');
  const pSprite = document.getElementById('playerSprite');
  const rSprite = document.getElementById('rivalSprite');

  // Deshabilitar botones durante el turno
  if (attackBtn) { attackBtn.disabled = true; attackBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
  if (fleeBtn) { fleeBtn.disabled = true; fleeBtn.classList.add('opacity-50', 'cursor-not-allowed'); }

  try {
    // Turno del jugador
    const result = await playerAttack();

    if (result.error) {
      showToast(result.error, 'error');
      return;
    }

    if (log) log.textContent = result.logMessage;

    // Animación de ataque
    if (rSprite) {
      rSprite.classList.add('attack-animation');
      setTimeout(() => rSprite.classList.remove('attack-animation'), 500);
    }

    // Actualizar UI
    updateHpAfterTurn(result.hp);

    if (result.gameOver) {
      handleBattleEnd(result.winner);
      return;
    }

    // Pequeña pausa antes del turno rival
    await new Promise(r => setTimeout(r, 600));

    // Turno del rival
    const rivalResult = await rivalAttack();

    if (log) log.textContent = rivalResult.logMessage;

    // Animación rival
    if (pSprite) {
      pSprite.classList.add('attack-animation-rival');
      setTimeout(() => pSprite.classList.remove('attack-animation-rival'), 500);
    }

    updateHpAfterTurn(rivalResult.hp);

    if (rivalResult.gameOver) {
      handleBattleEnd(rivalResult.winner);
      return;
    }

    // Reactivar botones
    if (attackBtn) { attackBtn.disabled = false; attackBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
    if (fleeBtn) { fleeBtn.disabled = false; fleeBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
  } catch (err) {
    showToast('Error en batalla: ' + err.message, 'error');
    if (attackBtn) { attackBtn.disabled = false; attackBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
    if (fleeBtn) { fleeBtn.disabled = false; fleeBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
  }
}

function updateHpAfterTurn(hp) {
  const pHpBar = document.getElementById('playerHpBar');
  const rHpBar = document.getElementById('rivalHpBar');
  const pHpText = document.getElementById('playerHpText');
  const rHpText = document.getElementById('rivalHpText');

  if (hp.player !== undefined) {
    if (pHpBar) {
      const pct = (hp.player / (parseInt(pHpText?.textContent?.split('/')[1] || 100))) * 100;
      pHpBar.style.width = pct + '%';
      pHpBar.className = `h-full rounded-full transition-all duration-500 ${pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`;
    }
    if (pHpText) {
      const max = pHpText.textContent.split('/')[1] || 100;
      pHpText.textContent = `${hp.player}/${max}`;
    }
  }
  if (hp.rival !== undefined) {
    if (rHpBar) {
      const pct = (hp.rival / (parseInt(rHpText?.textContent?.split('/')[1] || 100))) * 100;
      rHpBar.style.width = pct + '%';
      rHpBar.className = `h-full rounded-full transition-all duration-500 ${pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`;
    }
    if (rHpText) {
      const max = rHpText.textContent.split('/')[1] || 100;
      rHpText.textContent = `${hp.rival}/${max}`;
    }
  }
}

function handleBattleEnd(winner) {
  const log = document.getElementById('battleLog');
  const attackBtn = document.getElementById('attackBtn');
  const fleeBtn = document.getElementById('fleeBtn');
  const resetBtn = document.getElementById('resetBattleBtn');

  if (log) {
    if (winner === 'player') {
      log.innerHTML = '<span class="text-green-500">🎉 ¡Ganaste la batalla!</span>';
    } else {
      log.innerHTML = '<span class="text-red-500">💔 ¡Perdiste la batalla!</span>';
    }
  }

  if (attackBtn) { attackBtn.classList.add('hidden'); }
  if (fleeBtn) { fleeBtn.classList.add('hidden'); }
  if (resetBtn) {
    resetBtn.classList.remove('hidden');
    resetBtn.onclick = () => {
      resetBattle();
      render(renderBattlePage());
      loadBattlePokemonSelection();
    };
  }

  showToast(winner === 'player' ? '¡Victoria!' : '¡Derrota!', winner === 'player' ? 'success' : 'error');
}

function handleFlee() {
  const log = document.getElementById('battleLog');
  const attackBtn = document.getElementById('attackBtn');
  const fleeBtn = document.getElementById('fleeBtn');
  const resetBtn = document.getElementById('resetBattleBtn');

  if (log) log.textContent = '🏃 ¡Has huido de la batalla!';
  if (attackBtn) attackBtn.classList.add('hidden');
  if (fleeBtn) fleeBtn.classList.add('hidden');
  if (resetBtn) {
    resetBtn.classList.remove('hidden');
    resetBtn.onclick = () => {
      resetBattle();
      render(renderBattlePage());
      loadBattlePokemonSelection();
    };
  }

  resetBattle();
  showToast('Has huido', 'info');
}

// ==========================================================================
// VISTA: MI POKÉDEX
// ==========================================================================

function pokedexView() {
  updateActiveNav('#/pokedex');
  render(renderPokedexPage());

  renderCapturedList();

  // Botón liberar todos
  const releaseAllBtn = document.getElementById('releaseAllBtn');
  if (releaseAllBtn) {
    releaseAllBtn.addEventListener('click', () => {
      const captured = getCaptured();
      if (captured.length === 0) return;

      if (confirm('¿Estás seguro de liberar todos tus Pokémon?')) {
        captured.forEach(p => release(p.id));
        renderCapturedList();
        showToast('Todos los Pokémon han sido liberados.', 'info');
      }
    });
  }
}

function renderCapturedList() {
  const captured = getCaptured();
  const grid = document.getElementById('capturedGrid');
  const empty = document.getElementById('emptyPokedex');
  const count = document.getElementById('pokedexCount');
  const stats = document.getElementById('pokedexStats');
  const actions = document.getElementById('pokedexActions');

  if (count) {
    count.textContent = `${captured.length} Pokémon capturados de 151`;
  }

  if (stats) {
    stats.innerHTML = renderPokedexStats(captured.length, captured);
  }

  if (captured.length === 0) {
    if (grid) grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    if (actions) actions.classList.add('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');
  if (actions) actions.classList.remove('hidden');

  if (grid) {
    grid.innerHTML = captured.map(p => renderCapturedCard(p)).join('');

    // Eventos para botones de liberar
    grid.querySelectorAll('.release-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        const result = release(id);
        if (result.success) {
          renderCapturedList();
          showToast(result.message, 'info');
        } else {
          showToast(result.message, 'error');
        }
      });
    });
  }
}

// ==========================================================================
// UTILIDADES
// ==========================================================================

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
