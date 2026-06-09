#!/usr/bin/bash/env bash

# La función recibe parámetros con $1, $2, etc.
saludar_persona() {
	local NOMBRE="${1}"	# Primer parámetro
	local CIUDAD="${2}"	# Segundo parámtro
	echo "¡Hola, ${NOMBRE}! Saludos dede ${CIUDAD}."
}

# Llamar la función CON parámetros
saludar_persona "Mónica" "CDMX"
saludar_persona "Roxs" "Buenos Aires"
saludar_persona "Juan" "Córdoba"

# Salida:
# ¡Hola, Mónica! Saludos desde CDMX.
# ¡Hola, Roxs! Saludos desde Buenos Aires.
# ¡Hola, Juan! Saludos desde Córdoba

