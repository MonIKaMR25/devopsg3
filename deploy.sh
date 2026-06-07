#!/bin/bash
set -e

#VARIABLES
APP_NAME="nombre"
APP_DIR="/var/www/html/${APP_NAME}"
NGINX_DIR="/etc/nginx/sites-available/${APP_NAME}"
##colores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

###funciones de logger error
log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}
log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}
log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

#1- primer paso validar nginx
##validar instalacion de nginx
if ! command -v nginx &> /dev/null
then
    log_error "Nginx no está instalado. "
    log_info "Instalando nginx"
    sudo apt update
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
    log_success "Nginx instalado y en ejecución."
else
    log_success "Nginx ya está instalado."
fi

#2- crear directorio de la aplicacion
# validar si el directorio ya existe
if [ -d "${APP_DIR}" ]; then
    log_warning "El directorio ${APP_DIR} ya existe. Se sobrescribirá su contenido."
else
    log_info "Creando directorio ${APP_DIR}..."
    mkdir -p ${APP_DIR}
fi

#3- copiar archivos de la aplicacion al directorio
cp -r ./* ${APP_DIR}
log_success "Archivos de la aplicación copiados a ${APP_DIR}"

#3-permisos de los archivos en la ruta de la aplicacion
sudo chown -R www-data:www-data ${APP_DIR}
sudo chmod -R 755 ${APP_DIR}

#4- configurar nginx para servir la aplicacion
sudo tee ${NGINX_DIR} > /dev/null <<EOL
server {
    listen 80;
    server_name ${APP_NAME};

    root ${APP_DIR};
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOL

#5- validar configuracion de nginx
log_info "Validando configuración de nginx..."
sudo nginx -t

#6- reiniciar nginx para aplicar cambios
log_info "Reiniciando nginx..."
sudo systemctl restart nginx

#7- mensaje de exito
log_success "La aplicación ${APP_NAME} ha sido desplegada exitosamente y está disponible en http://${APP_NAME}"