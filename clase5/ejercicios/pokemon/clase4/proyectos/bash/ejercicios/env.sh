#!/usr/bin/env bash

# Variables que el sistema ya tiene definidas
echo "Usuario: ${USER}"
echo "Mi home: ${HOME}"
echo "Mi shell: ${SHELL}"
echo "Computadora: ${HOSTNAME}"
echo "Carpeta: ${PWD}"

printenv

printenv HOME
