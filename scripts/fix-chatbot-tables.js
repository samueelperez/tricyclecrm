#!/usr/bin/env node

/**
 * Fix Chatbot Tables
 * 
 * Este script actualiza la estructura de las tablas del chatbot,
 * específicamente para agregar la columna thread_id a la tabla chatbot_conversations.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Verificar las variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: No se encontraron las credenciales de Supabase en las variables de entorno');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    console.log('Verificando la estructura de las tablas del chatbot...');
    
    // Paso 1: Verificar si existe la tabla chatbot_conversations
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
    
    if (tablesError) {
      throw new Error(`Error al verificar tablas: ${tablesError.message}`);
    }
    
    const chatbotTablesExist = tables.some(table => table.table_name === 'chatbot_conversations');
    
    if (!chatbotTablesExist) {
      console.log('La tabla chatbot_conversations no existe. Creando tablas del chatbot...');
      
      // Crear las tablas del chatbot
      const createTablesQuery = `
        -- Tabla de conversaciones
        CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          mode TEXT NOT NULL,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          thread_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Tabla de mensajes
        CREATE TABLE IF NOT EXISTS public.chatbot_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Tabla de interacciones (para análisis)
        CREATE TABLE IF NOT EXISTS public.chatbot_interactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          mode TEXT NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Índices para mejorar el rendimiento
        CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON public.chatbot_conversations(user_id);
        CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON public.chatbot_messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_user_id ON public.chatbot_interactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_thread_id ON public.chatbot_conversations(thread_id);
      `;
      
      const { error: createError } = await supabase.rpc('execute_sql', {
        sql: createTablesQuery
      });
      
      if (createError) {
        throw new Error(`Error al crear tablas: ${createError.message}`);
      }
      
      console.log('Tablas del chatbot creadas correctamente.');
    } else {
      console.log('La tabla chatbot_conversations existe. Verificando columna thread_id...');
      
      // Verificar si existe la columna thread_id
      const { data: columns, error: columnsError } = await supabase.rpc('get_columns', {
        table_name_param: 'chatbot_conversations'
      });
      
      if (columnsError) {
        throw new Error(`Error al verificar columnas: ${columnsError.message}`);
      }
      
      const threadIdExists = columns.some(column => column.column_name === 'thread_id');
      
      if (!threadIdExists) {
        console.log('La columna thread_id no existe. Agregando columna...');
        
        // Agregar la columna thread_id
        const addColumnQuery = `
          ALTER TABLE public.chatbot_conversations 
          ADD COLUMN IF NOT EXISTS thread_id TEXT;
          
          CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_thread_id 
          ON public.chatbot_conversations(thread_id);
        `;
        
        const { error: alterError } = await supabase.rpc('execute_sql', {
          sql: addColumnQuery
        });
        
        if (alterError) {
          throw new Error(`Error al agregar columna: ${alterError.message}`);
        }
        
        console.log('Columna thread_id agregada correctamente.');
      } else {
        console.log('La columna thread_id ya existe.');
      }
    }
    
    console.log('Estructura de tablas del chatbot verificada y actualizada correctamente.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main(); 