#!/bin/bash
set -e

#VARIABLES
APP_NAME="pokemonMX"
APP_DIR="/var/www/html/${APP_NAME}" # RUTA DONDE SE GUARDARÁ LA APLICACIÓN EN EL SERVIDOR
NGINX_DIR="/etc/nginx/sites-available/${APP_NAME}" # INDICA QUE EN LA RUTA CONTENDRÁ LA CONFIGURACIÓN DE NGINX. SE LLENARÁ A MEDIDA QUE ESTEMOS DESARROLLANDO EL SCRIPT

##colores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

###funciones de logger error
log_error() {    
    echo -e "${RED}ERROR: $1${NC}" 
}   
log_warning() {    
    echo -e "${YELLOW}ADVERTENCIA: $1${NC}" 
}
log_success() {    
    echo -e "${GREEN}ÉXITO: $1${NC}"
}
log_info() {    
    echo -e "${BLUE}INFO: $1${NC}"
}

#1- PRIMER PASO VALIDAR NGINX
## VALIDAR INSTALACIÓN DE NGINX
if ! command -v nginx &> /dev/null
then
    log_error "NGINX no está instalado."
    log_info "INSTALANDO NGINX..."
    sudo apt update
    sudo apt install nginx -y  
    sudo systemctl start nginx
    sudo systemctl enable nginx
    log_success "NGINX INSTALADO Y EN EJECUCIÓN."
else
   log_success "NGINX YA ESTÁ INSTALADO."
fi

#2-CREAR DIRECTORIO DE LA APLICACIÓN
if [ -d "${APP_DIR}" ]; then
    log_warning "El directorio ${APP_DIR} ya existe.Se  sobreescribirá su contenido."
else 
    log_info "Creando el directorio ${APP_DIR}..."
    sudo mkdir -p ${APP_DIR}
fi

#3- COPIAR ARCHIVOS DE LA APLICACIÓN AL DIRECTORIO
sudo cp -r ./* ${APP_DIR}/
log_success "ARCHIVOS DE LA APLICACIÓN COPIADOS A ${APP_DIR}."

#3- PERMISOS DE LOS ARCHIVOS EN LA RUTA DE LA APLICACIÓN
sudo chown -R www-data:www-data ${APP_DIR}
sudo chmod -R 755 ${APP_DIR}

#4- CONFIGURAR NGINX PARA SERVIR LA APLICACIÓN
sudo tee ${NGINX_DIR} > /dev/null <<EOL
server {
    listen 80;
    server_name ${APP_NAME};

    root ${APP_DIR};
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
EOL


### echo "================================"
#5-ACTIVAR LA CONFIGURACIÓN DE NGINX

#5 VALIDAR LA CONFIGURACIÓN DE NGINX
log_info "Validando la configuración de NGINX..."
sudo nginx -t

#6REINICIAR NGINX PARA APLICAR LOS CAMBIOS
log_info "Reiniciando NGINX para aplicar los cambios..."
sudo systemctl restart nginx

#7 MENSAJE DE ÉXITO
log_success "La aplicación ${APP_NAME} ha sido desplegada exitosamente y está disponible en http://localhost/${APP_NAME}"
