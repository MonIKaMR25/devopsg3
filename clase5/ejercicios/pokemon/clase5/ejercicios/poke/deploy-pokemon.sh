#!/bin/bash
set -e

#VARIABLES
APP_NAME="pokemonMX"
APP_DIR="/var/www/html/${APP_NAME}" # RUTA DONDE SE GUARDARÁ LA APLICACIÓN EN EL SERVIDOR
NGINX_DIR="/etc/nginx/sites-available/${APP_NAME}" # INDICA QUE EN LA RUTA CONTENDRÁ LA CONFIGURACIÓN DE NGINX. SE LLENARÁ A MEDIDA QUE ESTEMOS DESARROLLANDO EL SCRIPT

#1- PRIMER PASO VALIDAR NGINX
## VALIDAR INSTALACIÓN DE NGINX
if ! command -v nginx &> /dev/null
then
    echo "NGINX no está instalado. Por favor, instálalo antes de ejecutar este script."
    exit 1
else
    echo "INSTALANDO NGINX..."
    sudo apt update
    sudo apt install nginx -y  
    sudo systemctl start nginx
    sudo systemctl enable nginx
    echo "NGINX INSTALADO Y EN EJECUCIÓN."
fi

#2-CREAR DIRECTORIO DE LA APLICACIÓN

sudo mkdir -p ${APP_DIR}
#sudo chown -R $USER:$USER ${APP_DIR}

#3- COPIAR ARCHIVOS DE LA APLICACIÓN AL DIRECTORIO
sudo cp -r ./* ${APP_DIR}/
#rsync -a ./ "$APP_DIR/"

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

# sudo rm /etc/nginx/sites-enabled/${APP_NAME}

### echo "================================"
#5-ACTIVAR LA CONFIGURACIÓN DE NGINX
# sudo ln -s ${NGINX_DIR} /etc/nginx/sites-enabled

#6- VALIDAR LA CONFIGURACIÓN DE NGINX
sudo nginx -t

#7 REINICIAR NGINX PARA APLICAR LOS CAMBIOS
sudo systemctl restart nginx

#8- MENSAJE DE ÉXITO
echo "La aplicación ${APP_NAME} ha sido desplegada exitosamente y está disponible en http://localhost/${APP_NAME}"