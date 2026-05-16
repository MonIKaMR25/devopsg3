#!/bin/bash

### info, error, ok

### funciónde log error

log_error() {
	echo "[ERROR] $1"
}

### función de log info

log_info() {
	echo "[INFO] $1"
}

### función de log ok

log_ok() {
	echo "[OK] $1"
}

log_info "Iniciando instalación de apps"
log_ok "Configuración finalizada"
log_error "No se puede copiar la aplicación"
