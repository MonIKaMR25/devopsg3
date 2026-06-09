#!/bin/bash
# Script que muestra la información básica del sistema

echo "============================================="
echo "		 INFORMACIÓN DEL SISEMA		   "
echo "============================================="
echo "Usuario		: $(whoami)"
echo "Hostname		: $(hostname)"
echo "Fecha		: $(date)"
echo "Directorio	: $(pwd)"
echo "Shell 		: $SHELL"
echo "Kernel 		: $(uname -r)"
echo "============================================="
