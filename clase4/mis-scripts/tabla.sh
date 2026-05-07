#!/bin/bash

echo "Dame un número entre 1 y 10"
read numero

if [[ numero -lt 1 || numero -gt 10 ]]; then
	echo "Número fuera de rango de 1 a 10"
else
	for ((i=1; i<=10; i++)); do
		resultado=$(( numero * i ))
		echo "${numero} x ${i} = ${resultado}"
	done
fi
