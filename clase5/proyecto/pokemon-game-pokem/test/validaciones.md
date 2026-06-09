# Documentación de Validaciones - Pokémon Game

Este documento describe todas las validaciones implementadas en el proyecto, tanto en el script de despliegue (`monitor.sh`) como en la aplicación web (`pokemon-game-pokem`).

---

## 1. Validaciones del Script de Despliegue (`monitor.sh`)

### 1.1 Validación de Permisos de Root

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `monitor.sh` - función `validar_root()` |
| **Qué valida** | Que el script se ejecute con UID 0 (superusuario) |
| **Por qué** | La instalación de Nginx, creación de directorios en `/var/www` y configuración de sitios requieren `sudo` |
| **Qué observar** | **Éxito**: mensaje verde "Permisos de superusuario confirmados"<br>**Error**: mensaje rojo indicando que debe ejecutarse con `sudo` y el script se detiene |

**Prueba:**
```bash
# Debe fallar:
bash monitor.sh

# Debe funcionar:
sudo bash monitor.sh
```

### 1.2 Validación de Sistema Operativo

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `monitor.sh` - función `validar_os()` |
| **Qué valida** | Que el sistema operativo sea Ubuntu |
| **Por qué** | Los comandos (`apt`, `systemctl`) y rutas están diseñados para Ubuntu/Debian |
| **Qué observar** | **Éxito**: muestra "Sistema operativo: Ubuntu XX.XX"<br>**Error**: muestra "Este script está diseñado para Ubuntu" y se detiene |

### 1.3 Validación de Conexión a Internet

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `monitor.sh` - función `validar_internet()` |
| **Qué valida** | Acceso a internet mediante ping a google.com |
| **Por qué** | Se necesita internet para instalar Nginx y para que la app consuma la PokeAPI |
| **Qué observar** | **Éxito**: "Conexión a internet verificada"<br>**Error**: "Sin conexión a internet" y se detiene |

### 1.4 Validación de Archivos Fuente

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `monitor.sh` - función `validar_archivos()` |
| **Qué valida** | Que exista el directorio `pokemon-game-pokem/` y contenga `index.html` |
| **Por qué** | No tiene sentido continuar si no hay archivos que desplegar |
| **Qué observar** | **Éxito**: "Archivos de aplicación verificados"<br>**Error**: mensaje específico indicando qué falta |

**Prueba:**
```bash
# Renombrar temporalmente para probar:
mv pokemon-game-pokem/index.html pokemon-game-pokem/index.html.bak
sudo bash monitor.sh  # Debe fallar indicando que falta index.html
mv pokemon-game-pokem/index.html.bak pokemon-game-pokem/index.html
```

### 1.5 Validación de Instalación de Nginx

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `monitor.sh` - función `instalar_nginx()` |
| **Qué valida** | Si Nginx está instalado; si no, lo instala vía `apt` |
| **Por qué** | Nginx es el servidor web que servirá la aplicación |
| **Qué observar** | **Ya instalado**: muestra versión de Nginx<br>**No instalado**: muestra progreso de `apt install`<br>**Servicio inactivo**: inicia y habilita Nginx automáticamente |

### 1.6 Validación de Sintaxis de Configuración Nginx

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `monitor.sh` - función `configurar_nginx()` |
| **Qué valida** | Que `nginx -t` pase la validación de sintaxis |
| **Por qué** | Una configuración inválida impediría que Nginx inicie |
| **Qué observar** | **Éxito**: "Configuración válida. Nginx recargado."<br>**Error**: mensaje de error de `nginx -t` y script se detiene |

### 1.7 Verificación Final de Acceso

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `monitor.sh` - función `mostrar_resumen()` |
| **Qué valida** | Muestra las rutas de acceso: localhost y IP local |
| **Qué observar** | Al final del script se imprime un resumen con las URLs |

---

## 2. Validaciones de la Aplicación Web

### 2.1 Conexión a la PokeAPI

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `js/api.js` |
| **Qué valida** | Timeout de 10s, errores HTTP, 404 |
| **Qué observar** | **Sin internet**: aparece mensaje "La solicitud a la PokeAPI tardó demasiado"<br>**Pokémon no existe**: "Pokémon X no encontrado"<br>**Éxito**: datos cargados normalmente |

**Prueba:** Desconectar el internet, recargar la página → debe aparecer el mensaje de error.

### 2.2 Búsqueda por Nombre

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `js/app.js` - función `applyFilters()` |
| **Qué valida** | Coincidencia parcial del nombre (case insensitive) |
| **Qué observar** | **Encontrado**: filtra la lista en tiempo real<br>**No encontrado**: muestra "No se encontraron Pokémon" con icono de búsqueda |

**Prueba:** Escribir "pikachu" en el buscador → solo debe mostrar Pikachu. Escribir "zzzz" → debe mostrar el mensaje vacío.

### 2.3 Filtro por Tipo

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `js/api.js` + `js/app.js` |
| **Qué valida** | Llamada a `getPokemonByType()` y filtrado local |
| **Qué observar** | **Seleccionar tipo**: la grid se actualiza mostrando solo Pokémon de ese tipo<br>**Seleccionar "Todos"**: vuelve a mostrar la lista completa |

**Prueba:** Seleccionar "fire" → deben aparecer Charmander, Vulpix, Growlithe, etc.

### 2.4 Detalle de Pokémon

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `js/components.js` - `renderDetailPage()` |
| **Qué valida** | Datos completos: stats, habilidades, descripción |
| **Qué observar** | Al hacer clic en un Pokémon: debe mostrar imagen grande, barras de stats, habilidades, descripción, botón de captura |

### 2.5 Captura de Pokémon

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `js/pokedex.js` - función `capture()` |
| **Qué valida** | - No capturar duplicados<br>- Almacenamiento en localStorage<br>- Límite de cuota |
| **Qué observar** | **Primera captura**: aparece toast verde "¡X capturado!"<br>**Duplicado**: toast amarillo "X ya está en tu Pokédex"<br>**Pokédex**: el Pokémon aparece en "Mi Pokédex" |

**Prueba:** Ir al detalle de Pikachu → click "Capturar" → debe mostrar toast y deshabilitar el botón. Click otra vez → debe mostrar que ya está capturado.

### 2.6 Pokédex Local (localStorage)

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `js/pokedex.js` + `js/app.js` - `pokedexView()` |
| **Qué valida** | Persistencia, conteo, liberar, estadísticas |
| **Qué observar** | **Datos**: muestra todos los Pokémon capturados con su tipo y fecha<br>**Contador**: "X Pokémon capturados de 151"<br>**Liberar**: hover sobre tarjeta → aparece botón rojo "X"<br>**Liberar todos**: botón rojo "Liberar todos" con confirmación |

**Prueba:** Capturar 2-3 Pokémon → navegar a "Mi Pokédex" → deben aparecer. Cerrar y reabrir navegador → los datos deben persistir.

### 2.7 Modo Batalla

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `js/battle.js` |
| **Qué valida** | - Selección de Pokémon capturado<br>- Generación de rival aleatorio<br>- Turnos alternados<br>- Cálculo de daño<br>- Golpe crítico (10%)<br>- Fin de batalla (ganador/perdedor) |
| **Qué observar** | **Sin Pokémon**: mensaje "No tienes Pokémon capturados"<br>**Seleccionar**: se inicia la batalla con dos sprites<br>**Atacar**: animación de golpe y reducción de HP<br>**Ganar**: mensaje verde "¡Ganaste la batalla!"<br>**Perder**: mensaje rojo "¡Perdiste la batalla!"<br>**Huir**: mensaje "Has huido" |

**Prueba:** Capturar al menos 1 Pokémon → ir a Batalla → seleccionar → click "Atacar" varias veces hasta que termine.

### 2.8 Modo Oscuro

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `js/app.js` - `initDarkMode()` |
| **Qué valida** | Persistencia en localStorage, toggle, icono |
| **Qué observar** | **Click en 🌙/☀️**: cambia todo el tema de la app<br>**Persistencia**: al recargar se mantiene la preferencia |

### 2.9 Enrutamiento SPA (Hash Routing)

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `js/router.js` |
| **Qué valida** | - Navegación entre vistas<br>- Parámetros en URL<br>- Ruta no encontrada redirige a home |
| **Qué observar** | **`#/`**: home con lista<br>**`#/pokemon/25`**: detalle de Pikachu<br>**`#/battle`**: modo batalla<br>**`#/pokedex`**: Pokédex<br>**`#/ruta-invalida`**: redirige a home |

### 2.10 Lazy Loading de Imágenes

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | `js/components.js` - atributo `loading="lazy"` en `<img>` |
| **Qué valida** | Las imágenes se cargan solo cuando entran en el viewport |
| **Qué observar** | Al abrir la página, solo se cargan las imágenes visibles. Al hacer scroll, las nuevas imágenes aparecen progresivamente |

### 2.11 Diseño Responsive

| Campo        | Detalle |
|--------------|---------|
| **Archivo**  | Todos los componentes usan clases responsive de Tailwind |
| **Qué valida** | Adaptación a diferentes tamaños de pantalla |
| **Qué observar** | **Desktop (≥1024px)**: 6 columnas de Pokémon<br>**Tablet (768px)**: 3-4 columnas<br>**Móvil (<640px)**: 2 columnas, navegación simplificada |

---

## 3. Resumen de Archivos y Responsabilidades

| Archivo | Responsabilidad | Validaciones clave |
|---------|-----------------|-------------------|
| `monitor.sh` | Despliegue automático en Ubuntu + Nginx | Root, SO, internet, archivos, Nginx |
| `index.html` | Estructura HTML, TailwindCDN, módulos JS | - |
| `css/style.css` | Animaciones, estilos personalizados | Microinteracciones, hover, responsive |
| `js/router.js` | Enrutamiento por hash (#) | Rutas válidas, parámetros, fallback a home |
| `js/api.js` | Consumo de PokeAPI | Timeout 10s, errores HTTP, 404 |
| `js/components.js` | Constructores de HTML para vistas | Datos incompletos, imágenes fallback |
| `js/pokedex.js` | Gestión de Pokédex en localStorage | Duplicados, cuota, datos corruptos |
| `js/battle.js` | Lógica de batalla por turnos | Sin Pokémon, crítico 10%, game over |
| `js/app.js` | Controlador principal, router, eventos | API offline, búsqueda vacía |

---

## 4. Prueba Integral Recomendada

```bash
# 1. Verificar que el proyecto tiene todos los archivos
ls -la pokemon-game-pokem/
ls -la pokemon-game-pokem/js/
ls -la pokemon-game-pokem/css/

# 2. Ejecutar el despliegue
sudo bash monitor.sh

# 3. Verificar que Nginx está sirviendo
curl -s http://localhost | head -5

# 4. Verificar que se devuelve HTML (no 404)
curl -o /dev/null -w "%{http_code}" http://localhost

# 5. Verificar que los JS modulares se cargan
curl -s http://localhost/js/app.js | head -3
curl -s http://localhost/js/router.js | head -3
curl -s http://localhost/js/api.js | head -3
curl -s http://localhost/js/components.js | head -3
curl -s http://localhost/js/pokedex.js | head -3
curl -s http://localhost/js/battle.js | head -3

# 6. Verificar CSS
curl -s http://localhost/css/style.css | head -3

# 7. Probar en navegador
# Abrir http://localhost
# - Verificar carga de 151 Pokémon
# - Probar búsqueda por nombre
# - Probar filtro por tipo
# - Hacer clic en un Pokémon
# - Capturarlo
# - Ir a Mi Pokédex (verificar que aparece)
# - Ir a Batalla (seleccionar y pelear)
# - Probar modo oscuro
# - Verificar responsive (reducir tamaño de ventana)
```
