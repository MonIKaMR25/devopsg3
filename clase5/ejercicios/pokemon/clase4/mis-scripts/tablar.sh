#!/bin/bash

echo "Ingresa un numero entre 1 y 10"
read numero

if [[ $numero -lt 1 || $numero -gt 10 ]]; then
	echo "ERROR: numero debe ser entre 1 y 10"
fi

echo "========	Tabla del $numero  ========"

for n in {1..10}
do
	resultado=$(( numero * n ))
		echo "$numero x $n = $resultado"
done

