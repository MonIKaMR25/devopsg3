#!/bin/bash

sumar(){
	echo "suma"
	numeroTS=$((numero1 +numero2))
	echo "La Suma de ambos números es: $numeroTS"
}

restar(){
	echo "resta"
	numeroTR=$((numero1-numero2))
	echo "La Resta de ambos números es: $numeroTR"
}

multiplicar(){
	echo "multiplica"
	numeroTM=$((numero1*numero2))
	echo "La Multiplicación de ambos números es: $numeroTM"
}

dividir(){
	echo "divide"
	numeroTD=$((numero1/numero2))
	echo "La División de ambos números es: $numeroTD"
}

echo "Dame el primer número: "
read numero1

echo "Dame el segundo número: "
read numero2


while true; do
	echo "===== MENÚ ====="
	echo "1) Sumar"
	echo "2) Restar"
	echo "3) Multiplicar"
	echo "4) Dividir"
	echo "5) Salir"
	read -rp "Opción: " opcion

	case $opcion in
		1) sumar ;;
		2) restar ;;
		3) multiplicar ;;
		4) dividir ;;
		5) break ;;
		*) echo "Opción inválida" ;;
	esac
	echo
done

