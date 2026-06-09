#!/bin/bash

PS3="Elige una opción: "

opciones=("Ver fecha" "Ver usuario" "Salir")

select opcion in "${opciones[@]}"; do
  case $REPLY in
    1)
      date
      ;;
    2)
      whoami
      ;;
    3)
      echo "Saliendo..."
      break
      ;;
    *)
      echo "Opción no válida"
      ;;
  esac
done
