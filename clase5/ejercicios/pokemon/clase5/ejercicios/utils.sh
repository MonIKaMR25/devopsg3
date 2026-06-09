#!usr/bin/env bash

# --- Función para mostrar mensaje con estilo ---
log_ok() 	{ echo " 	[OK] 	$*"; }
log_error() 	{ echo " 	[ERROR] $*"; }
log_info() 	{ echo "¡ 	[INFO]	$*"; }

# --- Función para verificar si existe un comando ---
requiere_comando() {
	local CMD="${1}"
	if ! command -v "${CMD}" &>/dev/null; then
		log_error "El comando ${CMD} no está instalado"
		exit 1
	fi
	log_ok "${CMD} está disponible"
}

# --- Uso ---
requiere_comando "curl"
requiere_comando "git"
log_info "Todo listo para emprezar"
