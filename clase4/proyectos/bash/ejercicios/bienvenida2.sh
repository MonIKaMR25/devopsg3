#!/usr/bin/env bash
# bienvenida2.sh
# Objetivo:
#   Mostrar un saludo al usuario y un pequeño “panel” con:
#   - Fecha/hora actual
#   - Directorio de trabajo actual
#   - Espacio disponible en disco para el filesystem del directorio actual
#
# Notas de robustez:
#   - set -e: aborta ante error (salvo en condicionales)
#   - set -u: error si se usa una variable no definida
#   - set -o pipefail: propaga errores en pipes

set -euo pipefail

# Determinar el usuario de forma fiable:
# - $USER suele existir en entornos interactivos.
# - id -un funciona incluso si $USER no está.
user="${USER:-$(id -un)}"

# Obtener “ahora” en formato legible (respeta locale/zone del sistema).
now="$(date)"

# Directorio actual (directorio de trabajo).
cwd="$(pwd)"

# Espacio disponible en disco para el punto de montaje que contiene "$cwd".
# Preferimos GNU df (Linux) por su salida “selectiva” con --output.
# En macOS/BSD, usamos df -k y parseamos el valor "Available" (4ª columna).
get_disk_avail() {
  if df -h --output=avail . >/dev/null 2>&1; then
    # GNU df: 2ª línea contiene el valor de 'avail'
    df -h --output=avail . | awk 'NR==2 {gsub(/[[:space:]]+/, "", $0); print $0}'
  else
    # BSD df (p.ej. macOS):
    # df -k . -> Available (KB) está en la 4ª columna de la 2ª línea
    # Convertimos KB a formato humano básico.
    local kb
    kb="$(df -k . | awk 'NR==2 {print $4}')"
    awk -v kb="$kb" 'BEGIN {
      split("KB MB GB TB PB", u, " ");
      v = kb;
      i = 1;
      while (v >= 1024 && i < 5) { v /= 1024; i++ }
      printf "%.1f %s\n", v, u[i]
    }'
  fi
}

avail="$(get_disk_avail)"

# Salida principal
cat <<EOF
Hola, $user.

Fecha y hora: $now
Directorio actual: $cwd
Espacio disponible (en este filesystem): $avail
EOF
