#!/bin/bash

# Colores para la salida
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔄 Actualizando tipos de Supabase..."

# Obtener el ID del proyecto desde una variable de entorno o configuración
PROJECT_ID=$(grep NEXT_PUBLIC_SUPABASE_PROJECT_ID .env.local 2>/dev/null | cut -d '=' -f2)

# Si no se encuentra en .env.local, intentar obtenerlo de .env
if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(grep NEXT_PUBLIC_SUPABASE_PROJECT_ID .env 2>/dev/null | cut -d '=' -f2)
fi

# Verificar si se encontró el ID del proyecto
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No se encontró el ID del proyecto en .env.local o .env${NC}"
    echo "Por favor, proporciona el ID del proyecto como argumento:"
    echo "  ./scripts/update-supabase-types.sh TU_ID_DE_PROYECTO"
    
    # Verificar si se pasó el ID como argumento
    if [ -n "$1" ]; then
        PROJECT_ID=$1
        echo "Usando ID de proyecto proporcionado: $PROJECT_ID"
    else
        exit 1
    fi
fi

# Crear directorio para tipos si no existe
mkdir -p src/lib/supabase

# Generar tipos TypeScript
echo "Generando tipos para el proyecto: $PROJECT_ID"
supabase gen types typescript --project-id "$PROJECT_ID" --schema public > src/lib/supabase/database.types.ts

# Verificar si la generación fue exitosa
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tipos de Supabase actualizados correctamente${NC}"
    echo "Archivo generado: src/lib/supabase/database.types.ts"
    
    # Si estamos en un entorno Git, añadir el archivo al staging
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        git add src/lib/supabase/database.types.ts
        echo "Archivo añadido al staging de Git"
    fi
    
    exit 0
else
    echo -e "${RED}❌ Error al actualizar los tipos de Supabase${NC}"
    echo "Verifica que:"
    echo "  1. La CLI de Supabase esté instalada correctamente"
    echo "  2. Hayas iniciado sesión con 'supabase login'"
    echo "  3. El ID del proyecto sea correcto"
    exit 1
fi 