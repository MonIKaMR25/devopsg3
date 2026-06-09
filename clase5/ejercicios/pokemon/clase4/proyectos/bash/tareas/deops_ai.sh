#!/usr/bin/env bash
# devops_ai.sh
#
# ===== DevOps AI Tool =====
# Menú interactivo:
# 1) Info del sistema
# 2) Crear archivo
# 3) Diagnóstico de error (con IA)
# 4) Generar script con IA
# 5) Salir
#
# Manejo de errores:
# - set -euo pipefail para fallar rápido en errores no controlados.
# - trap ERR para reportar la línea y el comando que falló.
#
# Funciones con IA:
# - Usan OpenAI vía HTTP (curl).
# - Requiere variable de entorno OPENAI_API_KEY.
# - Opcional: OPENAI_MODEL (por defecto gpt-4.1-mini).
#
# Dependencias recomendadas:
# - curl (obligatorio para IA)
# - jq (opcional, para parseo limpio de JSON)
# - python3 (opcional, para escapar JSON de forma robusta; si no existe, se usa fallback)

set -euo pipefail

APP_TITLE="===== DevOps AI Tool ====="
DEFAULT_MODEL="${OPENAI_MODEL:-gpt-4.1-mini}"

# ---------- Manejo de errores ----------
on_err() {
  local ec="$?"
  local line="${1:-?}"
  local cmd="${2:-<desconocido>}"
  printf "\n[devops_ai] ERROR: comando falló (exit=%s) en línea %s\n" "$ec" "$line" >&2
  printf "[devops_ai] Comando: %s\n\n" "$cmd" >&2
  exit "$ec"
}
trap 'on_err $LINENO "$BASH_COMMAND"' ERR

die() { printf "ERROR: %s\n" "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Falta el comando requerido: $1"
}

pause() { read -r -p "Presiona ENTER para continuar..." _; }

hr() { printf "%s\n" "----------------------------------------"; }

prompt_non_empty() {
  local prompt="$1"
  local v=""
  while :; do
    read -r -p "$prompt" v
    [[ -n "${v// /}" ]] && { printf "%s" "$v"; return 0; }
    printf "No puede estar vacío.\n" >&2
  done
}

# ---------- Opción 1: Info del sistema ----------
system_info() {
  hr
  echo "Info del sistema"
  hr

  echo "Usuario:      ${USER:-$(id -un)}"
  echo "Hostname:     $(hostname)"
  echo "Fecha:        $(date)"
  echo "Directorio:   $(pwd)"
  echo "Kernel:       $(uname -srmo 2>/dev/null || uname -a)"

  if command -v uptime >/dev/null 2>&1; then
    echo "Uptime:       $(uptime | sed 's/^ *//')"
  fi

  # CPU cores (Linux / macOS)
  if command -v nproc >/dev/null 2>&1; then
    echo "CPU cores:    $(nproc)"
  elif [[ "${OSTYPE:-}" == darwin* ]] && command -v sysctl >/dev/null 2>&1; then
    echo "CPU cores:    $(sysctl -n hw.ncpu)"
  fi

  echo
  echo "Disco (df -h .):"
  df -h .

  echo
  if command -v ip >/dev/null 2>&1; then
    echo "Red (ip -brief addr):"
    ip -brief addr
  elif command -v ifconfig >/dev/null 2>&1; then
    echo "Red (ifconfig -a):"
    ifconfig -a
  fi

  echo
  if command -v free >/dev/null 2>&1; then
    echo "Memoria (free -h):"
    free -h
  elif [[ "${OSTYPE:-}" == darwin* ]] && command -v vm_stat >/dev/null 2>&1; then
    echo "Memoria (vm_stat):"
    vm_stat
  fi
}

# ---------- Opción 2: Crear archivo ----------
create_file() {
  hr
  echo "Crear archivo"
  hr

  local path
  path="$(prompt_non_empty "Ruta/nombre del archivo a crear: ")"

  if [[ -e "$path" ]]; then
    read -r -p "El archivo ya existe. ¿Sobrescribir? (s/N): " ans
    [[ "${ans,,}" == "s" ]] || { echo "Cancelado."; return 0; }
  fi

  local dir
  dir="$(dirname -- "$path")"
  if [[ ! -d "$dir" ]]; then
    read -r -p "El directorio '$dir' no existe. ¿Crearlo? (s/N): " mk
    [[ "${mk,,}" == "s" ]] || die "No se puede crear el archivo sin directorio."
    mkdir -p -- "$dir"
  fi

  : > "$path"
  echo "Archivo creado: $path"

  read -r -p "¿Deseas escribir contenido ahora? (s/N): " write_now
  if [[ "${write_now,,}" == "s" ]]; then
    echo "Escribe el contenido. Termina con una línea que contenga solo: EOF"
    local line
    while IFS= read -r line; do
      [[ "$line" == "EOF" ]] && break
      printf "%s\n" "$line" >> "$path"
    done
    echo "Contenido guardado."
  fi
}

# ---------- Helpers IA ----------
json_escape() {
  # Escapa texto para JSON string.
  # Preferimos python3 por robustez; fallback mínimo si no existe.
  if command -v python3 >/dev/null 2>&1; then
    python3 - <<'PY'
import json,sys
print(json.dumps(sys.stdin.read()))
PY
  else
    # Fallback básico (no perfecto para todos los casos, pero funciona para texto común)
    sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e ':a;N;$!ba;s/\n/\\n/g' | awk '{print "\"" $0 "\""}'
  fi
}

openai_chat() {
  local prompt="$1"

  need_cmd curl
  [[ -n "${OPENAI_API_KEY:-}" ]] || die "Falta OPENAI_API_KEY. Exporta: export OPENAI_API_KEY='...'"
  local model="${DEFAULT_MODEL}"

  local prompt_json
  prompt_json="$(printf "%s" "$prompt" | json_escape)"

  # Llamada a /v1/chat/completions (común). Si tu cuenta usa Responses API, dímelo y lo adapto.
  local resp
  resp="$(curl -sS https://api.openai.com/v1/chat/completions \
    -H "Authorization: Bearer ${OPENAI_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"${model}\",
      \"messages\": [
        {\"role\": \"system\", \"content\": \"Eres un asistente experto en DevOps y Bash. Responde en español, con pasos y comandos cuando aplique.\"},
        {\"role\": \"user\", \"content\": ${prompt_json}}
      ],
      \"temperature\": 0.2
    }")"

  if command -v jq >/dev/null 2>&1; then
    echo "$resp" | jq -r '.choices[0].message.content // empty'
  else
    # Sin jq: mostramos respuesta cruda (y recomendamos instalar jq)
    echo "$resp"
  fi
}

# ---------- Opción 3: Diagnóstico de error (con IA) ----------
ai_diagnose_error() {
  hr
  echo "Diagnóstico de error (con IA)"
  hr

  echo "Pega el error/log a diagnosticar."
  echo "Termina con una línea que contenga solo: EOF"
  local log=""
  local line=""
  while IFS= read -r line; do
    [[ "$line" == "EOF" ]] && break
    log+="$line"$'\n'
  done

  [[ -n "${log// /}" ]] || die "No se proporcionó ningún error/log."

  local prompt
  prompt=$(
    cat <<EOF
Analiza el siguiente error/log y entrega:

1) Causa probable (2-3 hipótesis)
2) Qué verificar primero (checklist)
3) Comandos concretos para diagnosticar
4) Fixes posibles (con riesgos)

LOG:
---
${log}
---
EOF
  )

  echo
  echo "Consultando IA..."
  echo
  local out
  out="$(openai_chat "$prompt" || true)"

  [[ -n "${out// /}" ]] || die "No se obtuvo respuesta de IA (revisa API key, conectividad o instala jq)."
  echo "$out"
}

# ---------- Opción 4: Generar script con IA ----------
ai_generate_script() {
  hr
  echo "Generar script con IA"
  hr

  local desc
  desc="$(prompt_non_empty "Describe el script que quieres generar: ")"

  local prompt
  prompt=$(
    cat <<EOF
Crea un script Bash completo (con #!/usr/bin/env bash) y robusto.
Incluye:
- set -euo pipefail
- funciones
- manejo básico de errores
- comentarios claros
Requisito del usuario:
- ${desc}

Entrega SOLO el contenido del script, sin explicación adicional.
EOF
  )

  echo
  echo "Consultando IA..."
  echo
  local out
  out="$(openai_chat "$prompt" || true)"

  [[ -n "${out// /}" ]] || die "No se obtuvo respuesta de IA (revisa API key, conectividad o instala jq)."
  echo "$out"
  echo

  read -r -p "¿Guardar el script generado en un archivo? (s/N): " save
  if [[ "${save,,}" == "s" ]]; then
    local path
    path="$(prompt_non_empty "Ruta/nombre de salida (ej: generado.sh): ")"
    printf "%s\n" "$out" > "$path"
    chmod +x "$path" || true
    echo "Guardado en: $path"
  fi
}

# ---------- Menú ----------
main_menu() {
  while :; do
    echo
    echo "$APP_TITLE"
    echo "1. Info del sistema"
    echo "2. Crear archivo"
    echo "3. Diagnóstico de error (con IA)"
    echo "4. Generar script con IA"
    echo "5. Salir"
    echo

    read -r -p "Selecciona una opción [1-5]: " opt
    case "${opt:-}" in
      1) system_info; pause ;;
      2) create_file; pause ;;
      3) ai_diagnose_error; pause ;;
      4) ai_generate_script; pause ;;
      5) echo "Saliendo..."; exit 0 ;;
      *) echo "Opción inválida. Intenta de nuevo." ;;
    esac
  done
}

main_menu
