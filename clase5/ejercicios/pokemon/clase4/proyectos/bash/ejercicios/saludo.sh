#!/bin/bash

read -rp "Captura tu nombre: " NOMBRE

read -rp "¿En qué ciudad vives?: " CIUDAD

echo "¡Hola, ${NOMBRE}! Bienvenido a la clase desde ${CIUDAD}"

echo "Fecha2 $(date)"

echo "Carpeta: ${PWD}"
