#!/bin/bash
# =============================================================================
# monitor.sh
# Script de despliegue automático para Pokémon Game
# =============================================================================
# Este script automatiza el despliegue de una aplicación web estilo juego de
# Pokémon en un servidor Ubuntu usando Nginx.
#
# Funcionalidades:
#   - Valida que se ejecute como root
#   - Verifica que el SO sea Ubuntu
#   - Comprueba conexión a internet
#   - Instala Nginx si no está presente
#   - Configura el virtual host
#   - Copia los archivos de la aplicación
#   - Asigna permisos correctos
#   - Muestra resumen de acceso
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Constantes y configuración
# -----------------------------------------------------------------------------
APP_NAME="pokemon-game-pokem"
DEPLOY_DIR="/var/www/html/${APP_NAME}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="${SCRIPT_DIR}/${APP_NAME}"
NGINX_CONFIG_FILE="/etc/nginx/sites-available/${APP_NAME}"
NGINX_ENABLED_FILE="/etc/nginx/sites-enabled/${APP_NAME}"

# Colores para mensajes informativos
ROJO='\033[0;31m'
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
AZUL='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # Sin color

# -----------------------------------------------------------------------------
# Funciones auxiliares de logging
# -----------------------------------------------------------------------------
ok()   { echo -e "${VERDE}[✓]${NC} $1"; }
warn() { echo -e "${AMARILLO}[⚠]${NC} $1"; }
fail() { echo -e "${ROJO}[✗]${NC} $1"; exit 1; }
info() { echo -e "${AZUL}[ℹ]${NC} $1"; }
title(){ echo -e "\n${MAGENTA}══ $1 ══${NC}\n"; }

# =============================================================================
# VALIDACIONES PREVIAS AL DESPLIEGUE
# =============================================================================

# -----------------------------------------------------------------------------
# Validación 1: Permisos de superusuario
# -----------------------------------------------------------------------------
# Qué valida:  Que el script se ejecute con privilegios de root (UID 0).
# Por qué:     La instalación de Nginx, la creación de directorios en /var/www
#              y la configuración de sitios requieren permisos de superusuario.
# Qué observar:
#   - Si se ejecuta sin sudo: mensaje de error y salida del script.
#   - Si se ejecuta con sudo: el script continúa normalmente.
# -----------------------------------------------------------------------------
validar_root() {
    title "Validación: Permisos de root"
    if [[ $EUID -ne 0 ]]; then
        fail "Este script debe ejecutarse con permisos de superusuario (sudo).\n  Ejecute: sudo bash $0"
    fi
    ok "Permisos de superusuario confirmados (UID: $EUID)"
}

# -----------------------------------------------------------------------------
# Validación 2: Sistema operativo Ubuntu
# -----------------------------------------------------------------------------
# Qué valida:  Que el sistema operativo sea Ubuntu (cualquier versión).
# Por qué:     Los comandos (apt, systemctl) y rutas están diseñados para
#              Ubuntu/Debian. En otras distribuciones podrían fallar.
# Qué observar:
#   - Ubuntu: muestra la versión detectada y continúa.
#   - Otra distro (CentOS, Fedora, etc.): mensaje de error y salida.
# -----------------------------------------------------------------------------
validar_os() {
    title "Validación: Sistema operativo"
    if [[ ! -f /etc/os-release ]]; then
        fail "No se pudo detectar el sistema operativo (falta /etc/os-release)"
    fi
    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        fail "Este script está diseñado para Ubuntu. Sistema detectado: $ID ($NAME)"
    fi
    ok "Sistema operativo: $NAME $VERSION_ID"
}

# -----------------------------------------------------------------------------
# Validación 3: Conexión a internet
# -----------------------------------------------------------------------------
# Qué valida:  Que el servidor tenga acceso a internet (contra google.com).
# Por qué:     Se necesita internet para instalar Nginx vía apt y para que
#              la aplicación consuma la PokeAPI (https://pokeapi.co).
# Qué observar:
#   - Con internet: continúa normalmente.
#   - Sin internet: error indicando que no hay conectividad.
# -----------------------------------------------------------------------------
validar_internet() {
    title "Validación: Conexión a internet"
    if ! ping -c 2 -W 3 google.com &>/dev/null; then
        fail "Sin conexión a internet. Verifique la conectividad de red."
    fi
    ok "Conexión a internet verificada"
}

# -----------------------------------------------------------------------------
# Validación 4: Integridad de los archivos fuente
# -----------------------------------------------------------------------------
# Qué valida:  Que exista el directorio con los archivos de la aplicación y
#              que contenga al menos index.html.
# Por qué:     No tiene sentido continuar si no hay archivos que desplegar.
# Qué observar:
#   - Directorio existe con index.html: continúa.
#   - Directorio no existe o falta index.html: error descriptivo.
# -----------------------------------------------------------------------------
validar_archivos() {
    title "Validación: Archivos de la aplicación"
    if [[ ! -d "$SOURCE_DIR" ]]; then
        fail "No se encuentra el directorio fuente: $SOURCE_DIR"
    fi
    if [[ ! -f "$SOURCE_DIR/index.html" ]]; then
        fail "No se encuentra index.html en $SOURCE_DIR"
    fi
    ok "Archivos de aplicación verificados en $SOURCE_DIR"
}

# =============================================================================
# INSTALACIÓN Y CONFIGURACIÓN DE NGINX
# =============================================================================

# -----------------------------------------------------------------------------
# Paso 1: Instalar Nginx si no está presente
# -----------------------------------------------------------------------------
# Qué valida:  Verifica si Nginx está instalado. Si no, lo instala.
#              Luego verifica que el servicio esté activo.
# Por qué:     Nginx es el servidor web que servirá la aplicación estática.
# Qué observar:
#   - Ya instalado: muestra la versión y continúa.
#   - No instalado: muestra el progreso de instalación.
#   - Si systemctl no muestra el servicio activo: lo inicia y habilita.
# -----------------------------------------------------------------------------
instalar_nginx() {
    title "Nginx: Instalación y verificación"

    if command -v nginx &>/dev/null; then
        local version
        version=$(nginx -v 2>&1)
        ok "Nginx ya está instalado: $version"
    else
        info "Actualizando repositorios..."
        apt update -y
        info "Instalando Nginx..."
        apt install -y nginx
        ok "Nginx instalado correctamente"
    fi

    if systemctl is-active --quiet nginx; then
        ok "Nginx está en ejecución"
    else
        warn "Nginx no está activo. Iniciando servicio..."
        systemctl start nginx
        systemctl enable nginx
        if systemctl is-active --quiet nginx; then
            ok "Nginx iniciado y habilitado para inicio automático"
        else
            fail "No se pudo iniciar Nginx. Revise los logs: journalctl -u nginx"
        fi
    fi
}

# -----------------------------------------------------------------------------
# Paso 2: Preparar directorio de despliegue
# -----------------------------------------------------------------------------
crear_directorio() {
    title "Despliegue: Preparando directorio"
    mkdir -p "$DEPLOY_DIR"
    ok "Directorio creado/verificado: $DEPLOY_DIR"
}

# -----------------------------------------------------------------------------
# Paso 3: Copiar archivos al directorio de publicación
# -----------------------------------------------------------------------------
copiar_archivos() {
    title "Despliegue: Copiando archivos"
    cp -r "${SOURCE_DIR}"/* "$DEPLOY_DIR/"
    chown -R www-data:www-data "$DEPLOY_DIR"
    chmod -R 755 "$DEPLOY_DIR"
    ok "Archivos copiados y permisos asignados (www-data, 755)"
}

# -----------------------------------------------------------------------------
# Paso 4: Configurar virtual host de Nginx
# -----------------------------------------------------------------------------
configurar_nginx() {
    title "Nginx: Configuración del sitio"

    cat > "$NGINX_CONFIG_FILE" << 'NGINX_CONF'
server {
    listen 80;
    server_name _;

    root /var/www/html/pokemon-game-pokem;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires max;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(json)$ {
        expires 1d;
        add_header Cache-Control "public";
    }

    gzip on;
    gzip_types text/html text/css application/javascript image/svg+xml;
    gzip_min_length 256;
}
NGINX_CONF

    # Deshabilitar sitio default si existe
    if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
        rm "/etc/nginx/sites-enabled/default"
        ok "Sitio default de Nginx deshabilitado"
    fi

    # Habilitar nuestro sitio si no lo está
    if [[ ! -f "$NGINX_ENABLED_FILE" ]]; then
        ln -sf "$NGINX_CONFIG_FILE" "$NGINX_ENABLED_FILE"
        ok "Sitio $APP_NAME habilitado en Nginx"
    fi

    # Validar sintaxis y recargar
    info "Validando configuración de Nginx..."
    if nginx -t; then
        systemctl reload nginx
        ok "Configuración válida. Nginx recargado."
    else
        fail "Error en la configuración de Nginx. Revise: $NGINX_CONFIG_FILE"
    fi
}

# =============================================================================
# RESUMEN FINAL
# =============================================================================
mostrar_resumen() {
    local ip
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    [[ -z "$ip" ]] && ip="NO_DISPONIBLE"

    local dominio="localhost"

    echo ""
    echo -e "${MAGENTA}══════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}       DESPLIEGUE COMPLETADO CON ÉXITO       ${NC}"
    echo -e "${MAGENTA}══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${AZUL}Aplicación:${NC}  $APP_NAME"
    echo -e "  ${AZUL}Ruta:${NC}        $DEPLOY_DIR"
    echo -e "  ${AZUL}Local:${NC}       http://$dominio"
    echo -e "  ${AZUL}Red local:${NC}   http://$ip"
    echo ""
    echo -e "  ${AMARILLO}Nota:${NC} Si no ve la página, verifique que"
    echo -e "        el puerto 80 esté abierto en el firewall:"
    echo -e "        sudo ufw allow 80/tcp"
    echo ""
}

# =============================================================================
# FUNCIÓN PRINCIPAL
# =============================================================================
main() {
    echo ""
    echo -e "${MAGENTA}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║   🎮  POKÉMON GAME - Despliegue Automático   ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════╝${NC}"

    validar_root
    validar_os
    validar_internet
    validar_archivos
    instalar_nginx
    crear_directorio
    copiar_archivos
    configurar_nginx
    mostrar_resumen
}

main "$@"
