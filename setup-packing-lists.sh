#!/bin/bash

# Script simplificado para aplicar la migración de listas de empaque en Supabase

echo "=== Iniciando configuración de listas de empaque ==="

# Asegurarse de que el directorio de migraciones existe
mkdir -p supabase/migrations

# Aplicar la migración para crear las tablas de listas de empaque
echo "Aplicando migración para crear tablas de listas de empaque..."
npx supabase db push supabase/migrations/20230701000000_create_packing_lists.sql

echo "=== Configuración completada ====" 