# Pasos para crear la carpeta `proyecto` y subirla a GitHub

## 1. Crear la carpeta proyecto

```bash
# Situarse en la carpeta clase5
cd ~/cursos/codigofacilito/devopsg3/clase5

# Crear la carpeta proyecto
mkdir proyecto

# Ingresar a la carpeta y crear archivos de ejemplo
cd proyecto
touch README.md
```

## 2. Agregar contenido a la carpeta

```bash
# Ejemplo: crear archivos dentro de proyecto
echo "# Mi Proyecto" > README.md
```

## 3. Agregar los cambios al área de staging

```bash
# Desde la raíz del repositorio
cd ~/cursos/codigofacilito/devopsg3

# Agregar la carpeta proyecto al staging
git add clase5/proyecto/
```

## 4. Crear un commit

```bash
git commit -m "Agrega carpeta proyecto con contenido inicial"
```

## 5. Subir los cambios a GitHub

```bash
git push origin main
```

## Resumen de comandos

```bash
cd ~/cursos/codigofacilito/devopsg3/clase5
mkdir proyecto
# (agrega tus archivos dentro de proyecto)
cd ~/cursos/codigofacilito/devopsg3
git add clase5/proyecto/
git commit -m "Agrega carpeta proyecto"
git push origin main
```
