#!usr/bin/env bash

# Función que calcula y "devuelve" el resultado
doble() {
	local NUMERO="${1}"
	local RESULTADO=$(( NUMERO * 2 ))
	echo "${RESULTADO}"				# devolver con echo
}

# Capturar el resultado con $()
MI_NUMERO=7
RESULTADO=$(doble "${MI_NUMERO}")

echo "${MI_NUMERO} * 2 = ${RESULTADO}"
# -> 7 x 2 = 14

# Otro ejemplo: función que da la fecha formateada
fecha_hoy() {
	echo "$(date +"%d/%m/%Y")"
}

HOY=$(fecha_hoy)
echo "Hoy es: ${HOY}"
