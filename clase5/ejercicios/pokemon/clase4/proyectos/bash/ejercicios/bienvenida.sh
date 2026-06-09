#!/usr/bin/env bash
# bienvenida.sh
# Script de bienvenida: saluda al usuario y muestra información básica del sistema.
# Requisitos:
#  - Saludo al usuario
#  - Fecha actual
#  - Directorio de trabajo actual
#  - Espacio disponible en disco

set -euo pipefail

# Obtener un nombre de usuario “amigable”.
# $USER suele estar disponible en shells interactivos; si no, usamos id -un como fallback.
usuario="${USER:-$(id -un)}"

echo "Hola, ${usuario}."
echo

# Mostrar la fecha y hora actuales (según la configuración regional del sistema).
echo "Fecha y hora: $(date)"
echo

# Mostrar el directorio actual (directorio de trabajo).
echo "Directorio actual: $(pwd)"
echo

# Mostrar espacio disponible en disco.
# -h: formato legible (KB/MB/GB)
# --output=...: limita columnas para que sea más claro
# Nota: En macOS, df no soporta --output; abajo damos un fallback automático.
if df --output=avail -h . >/dev/null 2>&1; then
  # Linux / GNU coreutils
  disponible="$(df --output=avail -h . | tail -n 1 | tr -d '[:space:]')"
  echo "Espacio disponible en el disco (para este directorio): ${disponible}"
else
  # Fallback para macOS/BSD
  # Mostramos la fila correspondiente al filesystem que contiene el directorio actual.
  df -h .
fi
