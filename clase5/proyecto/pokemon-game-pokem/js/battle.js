/* ==========================================================================
   battle.js - Lógica del modo batalla
   ==========================================================================
   Simulación de batalla por turnos entre dos Pokémon.
   El jugador selecciona su Pokémon y el rival se elige aleatoriamente.

   Validaciones:
     - Sin Pokémon capturados → no permite batallar
     - Pokémon con 0 HP → no puede pelear
     - Ataque crítico: 10% de probabilidad de daño doble
   ========================================================================== */

import { getPokemonDetail } from './api.js';
import { getCaptured } from './pokedex.js';

/**
 * Estado interno de la batalla
 */
const state = {
  player: null,       // { id, name, hp, maxHp, stats, image, attacks }
  rival: null,        // { id, name, hp, maxHp, stats, image, attacks }
  isRunning: false,
  turn: 'player',     // 'player' | 'rival'
  battleLog: [],
};

/**
 * Ataques predefinidos basados en tipos
 */
const MOVES = {
  normal:   ['Placaje', 'Golpe cuerpo', 'Megapatada'],
  fire:     ['Lanzallamas', 'Ascuas', 'Giro fuego'],
  water:    ['Pistola agua', 'Hidrobomba', 'Surf'],
  electric: ['Impactrueno', 'Rayo', 'Trueno'],
  grass:    ['Látigo cepa', 'Hoja afilada', 'Rayo solar'],
  ice:      ['Rayo hielo', 'Ventisca', 'Golpe hielo'],
  fighting: ['Golpe kárate', 'Sumisión', 'Patada salto'],
  poison:   ['Ataque ácido', 'Residuos', 'Tóxico'],
  ground:   ['Terremoto', 'Hueso palo', 'Excavar'],
  flying:   ['Ataque ala', 'Pájaro osado', 'Tajo aéreo'],
  psychic:  ['Psicorrayo', 'Cabezazo zen', 'Psíquico'],
  bug:      ['Tijera X', 'Picadura', 'Zumbido'],
  rock:     ['Lanzarrocas', 'Avalancha', 'Roca afilada'],
  ghost:    ['Lengüetazo', 'Bola sombra', 'Puño sombra'],
  dragon:   ['Garra dragón', 'Cola dragón', 'Enfado'],
  dark:     ['Mordisco', 'Pulso umbrío', 'Golpe bajo'],
  steel:    ['Puño metal', 'Cabeza metal', 'Garra metal'],
  fairy:    ['Carantoña', 'Brillo mágico', 'Voz arrulladora'],
};

const DEFAULT_ATTACKS = ['Placaje', 'Golpe', 'Megapatada'];

/**
 * Obtiene ataques para un tipo de Pokémon.
 * @param {string} type
 * @returns {string[]}
 */
function getMovesForType(type) {
  return MOVES[type] || DEFAULT_ATTACKS;
}

/**
 * Calcula el daño basado en estadísticas y un factor aleatorio.
 * @param {Object} attacker - Pokémon atacante { stats }
 * @param {Object} defender - Pokémon defensor { stats }
 * @param {string} moveName - Nombre del ataque (solo para mostrar)
 * @returns {{ damage: number, isCritical: boolean, move: string }}
 */
function calculateDamage(attacker, defender) {
  const atkStat = attacker.stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
  const defStat = defender.stats.find(s => s.stat.name === 'defense')?.base_stat || 50;

  // Fórmula simplificada: (atk * 2 / def + 5) * random(0.85-1.0)
  const base = (atkStat * 2) / Math.max(defStat, 1) + 5;
  const randomFactor = 0.85 + Math.random() * 0.15;
  const isCritical = Math.random() < 0.1; // 10% crítico
  const critMultiplier = isCritical ? 2 : 1;

  const damage = Math.max(1, Math.round(base * randomFactor * critMultiplier));
  const move = getMovesForType(
    (attacker.types?.[0]?.type?.name || 'normal')
  )[Math.floor(Math.random() * 3)];

  return { damage, isCritical, move };
}

/**
 * Inicia una batalla con el Pokémon seleccionado.
 * @param {number} pokemonId - ID del Pokémon del jugador
 * @returns {Promise<Object>} Datos del rival generado
 */
export async function startBattle(pokemonId) {
  try {
    const playerDetail = await getPokemonDetail(pokemonId);

    // Elegir rival aleatorio (evitar el mismo Pokémon)
    const available = getCaptured().filter(p => p.id !== pokemonId);
    let rivalId;
    if (available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      rivalId = available[randomIndex].id;
    } else {
      // Si solo tiene 1 Pokémon, rival aleatorio de la lista completa
      rivalId = Math.floor(Math.random() * 151) + 1;
      if (rivalId === pokemonId) rivalId = (rivalId % 151) + 1;
    }

    const rivalDetail = await getPokemonDetail(rivalId);

    // Inicializar estado
    state.player = {
      id: playerDetail.id,
      name: playerDetail.name,
      maxHp: playerDetail.stats.find(s => s.stat.name === 'hp')?.base_stat || 100,
      hp: playerDetail.stats.find(s => s.stat.name === 'hp')?.base_stat || 100,
      stats: playerDetail.stats,
      types: playerDetail.types,
      image: playerDetail.sprites?.other?.['official-artwork']?.front_default
             || playerDetail.sprites?.front_default,
      sprites: playerDetail.sprites,
    };

    state.rival = {
      id: rivalDetail.id,
      name: rivalDetail.name,
      maxHp: rivalDetail.stats.find(s => s.stat.name === 'hp')?.base_stat || 100,
      hp: rivalDetail.stats.find(s => s.stat.name === 'hp')?.base_stat || 100,
      stats: rivalDetail.stats,
      types: rivalDetail.types,
      image: rivalDetail.sprites?.other?.['official-artwork']?.front_default
             || rivalDetail.sprites?.front_default,
      sprites: rivalDetail.sprites,
    };

    state.isRunning = true;
    state.turn = 'player';
    state.battleLog = [];
    state.battleLog.push(`¡${capitalize(state.player.name)} vs ${capitalize(state.rival.name)}!`);

    return {
      player: state.player,
      rival: state.rival,
      log: state.battleLog,
    };
  } catch (err) {
    console.error('[Battle] Error al iniciar batalla:', err);
    throw err;
  }
}

/**
 * Ejecuta un turno de ataque del jugador.
 * @returns {Promise<Object>} Resultado del turno
 */
export async function playerAttack() {
  if (!state.isRunning || state.turn !== 'player') {
    return { error: 'No es tu turno' };
  }

  const result = executeTurn(state.player, state.rival, 'player');
  state.rival.hp = Math.max(0, state.rival.hp - result.damage);
  state.battleLog.push(result.logMessage);
  state.turn = 'rival';

  if (state.rival.hp <= 0) {
    state.isRunning = false;
    state.battleLog.push(`¡${capitalize(state.player.name)} gana la batalla!`);
    return { ...result, winner: 'player', hp: { player: state.player.hp, rival: 0 }, gameOver: true };
  }

  return { ...result, winner: null, hp: { player: state.player.hp, rival: state.rival.hp } };
}

/**
 * Ejecuta el turno del rival (automático).
 * @returns {Promise<Object>} Resultado del turno
 */
export async function rivalAttack() {
  if (!state.isRunning || state.turn !== 'rival') {
    return { error: 'No es el turno del rival' };
  }

  // Pequeña pausa para efecto dramático
  await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

  const result = executeTurn(state.rival, state.player, 'rival');
  state.player.hp = Math.max(0, state.player.hp - result.damage);
  state.battleLog.push(result.logMessage);
  state.turn = 'player';

  if (state.player.hp <= 0) {
    state.isRunning = false;
    state.battleLog.push(`¡${capitalize(state.rival.name)} gana la batalla!`);
    return { ...result, winner: 'rival', hp: { player: 0, rival: state.rival.hp }, gameOver: true };
  }

  return { ...result, winner: null, hp: { player: state.player.hp, rival: state.rival.hp } };
}

/**
 * Lógica interna de un turno de ataque.
 */
function executeTurn(attacker, defender, side) {
  const { damage, isCritical, move } = calculateDamage(attacker, defender);
  const attackerName = capitalize(attacker.name);
  const defenderName = capitalize(defender.name);

  let logMessage = `${attackerName} usó ${move}`;
  if (isCritical) logMessage += ' ¡Golpe crítico!';
  logMessage += ` (${damage} daño)`;

  return { damage, isCritical, move, logMessage, side };
}

/**
 * Finaliza la batalla y reinicia el estado.
 */
export function resetBattle() {
  state.player = null;
  state.rival = null;
  state.isRunning = false;
  state.turn = 'player';
  state.battleLog = [];
}

/**
 * Obtiene el estado actual de la batalla.
 */
export function getBattleState() {
  return { ...state };
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
