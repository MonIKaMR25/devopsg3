#!/bin/bash

### variables globales
RED="\033[0;31m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
NC="\033[0m"


# ES IMPORTANE LIMPIA UN COLOR ANTES DE USARLO


### info, error, ok

### funciónde log error

log_error() {
	echo -e "${RED}[ERROR]${NC} $1"
}

### función de log info

log_info() {
	echo -e "${GREEN}[INFO]${MC} $1"
}

### función de log ok

log_ok() {
	echo -e "${BLUE}[OK]${NC} $1"
}

### función de warning
log_warning(){
	echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_info "Iniciando instalación de apps"
log_ok "Configuración finalizada"
log_error "No se puede copiar la aplicación"
log_warning "exiten algunos errores, favor de revisar"
