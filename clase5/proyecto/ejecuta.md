# Pasos para ejecutar el proyecto Pokémon Game

## Ejecución en localhost

### Requisitos previos
- Python 3 (viene instalado en la mayoría de sistemas)
- Navegador web moderno (Chrome, Firefox, Edge)
- Conexión a internet (para cargar TailwindCSS, Font Awesome y PokeAPI)

### Pasos

1. Abrir una terminal y situarse en la carpeta del proyecto:

```bash
cd ~/cursos/codigofacilito/devopsg3/clase5/proyecto/pokemon-game-pokem
```

2. Iniciar un servidor HTTP (elige una opción):

```bash
# Opción 1 - Python
python3 -m http.server 8000

# Opción 2 - Node.js (si tienes Node instalado)
npx serve .

# Opción 3 - PHP (si tienes PHP instalado)
php -S localhost:8000
```

3. Abrir el navegador en: [http://localhost:8000](http://localhost:8000)

> **Nota importante**: No abrir `index.html` directamente con `file://`. El proyecto usa módulos ES (`type="module"`) y requiere un servidor HTTP para funcionar correctamente.

---

## Ejecución en producción (Ubuntu + Nginx)

### Requisitos previos
- Sistema operativo Ubuntu/Debian
- Acceso `sudo` o `root`
- Conexión a internet

### Pasos

1. Ejecutar el script de despliegue automatizado:

```bash
cd ~/cursos/codigofacilito/devopsg3/clase5/proyecto
sudo bash monitor.sh
```

2. El script `monitor.sh` realiza automáticamente:
   - Verifica que el sistema sea Ubuntu
   - Verifica conectividad a internet
   - Instala Nginx si no está presente
   - Copia los archivos del proyecto a `/var/www/html/pokemon-game-pokem/`
   - Configura un virtual host en Nginx
   - Habilita el sitio, recarga Nginx y muestra un resumen

3. Acceder al proyecto desde:
   - Local: [http://localhost](http://localhost) o [http://127.0.0.1](http://127.0.0.1)
   - Red local: `http://<IP-DEL-SERVIDOR>` (la IP la muestra el script al finalizar)

---

## Notas adicionales

- El proyecto no requiere `npm install`, `pip install` ni ningún gestor de paquetes
- Las dependencias (TailwindCSS, Font Awesome, PokeAPI) se cargan desde CDN
- Los Pokémon capturados se guardan en el `localStorage` del navegador
- Para hacer cambios, solo editar los archivos dentro de `pokemon-game-pokem/` y refrescar el navegador

El archivo ejecuta.md se generó en clase5/proyecto/ejecuta.md con las instrucciones para:
- 
Localhost: usar python3 -m http.server 8000 (u otras alternativas como npx serve o php -S)
- 
Producción: ejecutar sudo bash monitor.sh (despliegue automatizado con Nginx en Ubuntu)