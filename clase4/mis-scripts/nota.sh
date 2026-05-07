#!/bin/bash

echo "¿Cuál es tu nombre? "
read nombre

echo "¿Cuál es tu nota (número del 1 al 10)"
read nota

if [[ $nota -lt 1 || $nota -gt 10 ]]; then
	echo "? Nota inválida"
elif [[ $nota -ge 7 ]]; then
	echo "$nombre aprobó con $nota"
elif [[ $nota -ge 4 && $nota -le 6 ]]; then
	echo "$nombre está en recuperatorio"
elif [[ $nota -lt 4 ]]; then
	echo "$nombre reprobó con $nota"
fi
