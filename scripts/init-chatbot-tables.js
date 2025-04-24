#!/usr/bin/env node

/**
 * Script para inicializar las tablas del chatbot en Supabase
 * Ejecutar con: node scripts/init-chatbot-tables.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en el archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initTables() {
  console.log('Inicializando tablas del chatbot...');

  try {
    // Verificar si las tablas existen
    const { data: tables, error } = await supabase.rpc('get_tables');
    
    if (error) {
      throw new Error(`Error al verificar tablas: ${error.message}`);
    }

    const existingTables = tables || [];
    console.log('Tablas existentes:', existingTables);

    // Crear tabla chatbot_conversations si no existe
    if (!existingTables.includes('chatbot_conversations')) {
      console.log('Creando tabla chatbot_conversations...');
      
      const { error: createTableError } = await supabase.rpc('create_chatbot_tables');
      
      if (createTableError) {
        throw new Error(`Error al crear tablas: ${createTableError.message}`);
      }
      
      console.log('Tablas del chatbot creadas correctamente');
    } else {
      console.log('Las tablas del chatbot ya existen');
    }

    // Configurar y verificar el asistente
    console.log('Verificando configuración del asistente...');
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!assistantId) {
      console.warn('ADVERTENCIA: OPENAI_ASSISTANT_ID no está configurado en el archivo .env');
    } else {
      console.log('ID del Asistente configurado:', assistantId);
    }

    if (!openaiKey || openaiKey.includes('tu_clave_api_aqui') || openaiKey.includes('placeholder')) {
      console.warn('ADVERTENCIA: OPENAI_API_KEY no está configurada correctamente en el archivo .env');
    } else {
      console.log('API Key de OpenAI configurada correctamente');
    }
    
    console.log('Inicialización completada');
  } catch (error) {
    console.error('Error durante la inicialización:', error.message);
    process.exit(1);
  }
}

// Función para crear la función SQL create_chatbot_tables
async function createSqlFunction() {
  console.log('Creando función SQL create_chatbot_tables...');
  
  const createFunctionSQL = `
  CREATE OR REPLACE FUNCTION create_chatbot_tables()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    -- Tabla de conversaciones
    CREATE TABLE IF NOT EXISTS chatbot_conversations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      mode TEXT NOT NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      thread_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla de mensajes
    CREATE TABLE IF NOT EXISTS chatbot_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla de interacciones (para análisis)
    CREATE TABLE IF NOT EXISTS chatbot_interactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      mode TEXT NOT NULL,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Índices para mejorar el rendimiento
    CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_user_id ON chatbot_interactions(user_id);
  END;
  $$;
  `;

  const createGetTablesSQL = `
  CREATE OR REPLACE FUNCTION get_tables()
  RETURNS TABLE(table_name TEXT)
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    RETURN QUERY
    SELECT t.table_name::TEXT
    FROM information_schema.tables t
    WHERE t.table_schema = 'public';
  END;
  $$;
  `;

  try {
    // Crear función get_tables
    const { error: getTablesError } = await supabase.rpc('get_tables').single();
    
    if (getTablesError && getTablesError.code !== 'PGRST116') {
      console.log('Creando función get_tables...');
      const { error } = await supabase.rpc('exec_sql', { sql: createGetTablesSQL });
      if (error) throw new Error(`Error al crear get_tables: ${error.message}`);
    }

    // Crear función create_chatbot_tables
    const { error: rpcError } = await supabase.rpc('create_chatbot_tables');
    
    if (rpcError && rpcError.code !== 'PGRST116') {
      console.log('Creando función create_chatbot_tables...');
      const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
      if (error) throw new Error(`Error al crear create_chatbot_tables: ${error.message}`);
    }
    
    console.log('Funciones SQL creadas correctamente');
  } catch (error) {
    console.error('Error al crear funciones SQL:', error.message);
    
    // Crear función exec_sql si no existe
    console.log('Intentando crear función exec_sql...');
    
    const createExecSqlSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
    `;
    
    try {
      // Ejecutar SQL directamente usando el cliente REST
      const { error: execSqlError } = await supabase
        .from('_exec_sql')
        .insert({ sql: createExecSqlSQL });
        
      console.log('Resultado de crear exec_sql:', execSqlError ? `Error: ${execSqlError.message}` : 'Éxito');
      
      console.error('No se pudieron crear las funciones SQL automáticamente.');
      console.log('Por favor, crea manualmente las tablas usando el siguiente SQL en la consola de Supabase:');
      console.log(`
      -- Tabla de conversaciones
      CREATE TABLE IF NOT EXISTS chatbot_conversations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        mode TEXT NOT NULL,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        thread_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Tabla de mensajes
      CREATE TABLE IF NOT EXISTS chatbot_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Tabla de interacciones (para análisis)
      CREATE TABLE IF NOT EXISTS chatbot_interactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        mode TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Índices para mejorar el rendimiento
      CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_chatbot_interactions_user_id ON chatbot_interactions(user_id);
      `);
    } catch (execError) {
      console.error('Error al crear exec_sql:', execError.message);
    }
  }
}

async function main() {
  try {
    await createSqlFunction();
    await initTables();
  } catch (error) {
    console.error('Error en la inicialización:', error.message);
  }
}

main(); 