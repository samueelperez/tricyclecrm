#!/usr/bin/env node

/**
 * Setup OpenAI Assistant
 * 
 * Este script crea un asistente de OpenAI para TricycleCRM si no existe
 * y muestra el ID que se debe configurar en las variables de entorno.
 */

require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

if (!OPENAI_API_KEY) {
  console.error('Error: No se encontró OPENAI_API_KEY en las variables de entorno');
  process.exit(1);
}

// Verificar si la API key comienza con el formato correcto
if (!OPENAI_API_KEY.startsWith('sk-')) {
  console.error('Error: La OPENAI_API_KEY no tiene el formato correcto');
  process.exit(1);
}

async function main() {
  try {
    console.log('Verificando asistente de OpenAI...');
    
    // Si ya existe un ID de asistente, verificarlo
    if (OPENAI_ASSISTANT_ID && OPENAI_ASSISTANT_ID !== 'asst_abc123456789' && !OPENAI_ASSISTANT_ID.includes('tu_id_de_asistente_aqui')) {
      console.log('Verificando asistente existente con ID:', OPENAI_ASSISTANT_ID);
      
      const assistantResponse = await fetch(`https://api.openai.com/v1/assistants/${OPENAI_ASSISTANT_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          'Content-Type': 'application/json',
        },
      });
      
      if (assistantResponse.ok) {
        const assistant = await assistantResponse.json();
        console.log('✅ Asistente existente encontrado:');
        console.log('ID:', assistant.id);
        console.log('Nombre:', assistant.name);
        console.log('Modelo:', assistant.model);
        console.log('Configuración correcta en .env.local ✓');
        return;
      } else {
        console.log('❌ El asistente configurado no existe o no es accesible');
        console.log('Creando un nuevo asistente...');
      }
    } else {
      console.log('No se encontró un ID de asistente válido configurado');
      console.log('Creando un nuevo asistente...');
    }
    
    // Crear un nuevo asistente
    const createResponse = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'TricycleCRM Assistant',
        description: 'Asistente para TricycleCRM que ayuda con la gestión de clientes, ventas y soporte',
        model: 'gpt-4o',
        instructions: `Eres un asistente de ventas y gestión para TricycleCRM. 
Tu función es ayudar a los usuarios a gestionar sus contactos, negocios y tareas de manera efectiva.
Debes ser profesional, conciso y útil.
Proporciona consejos prácticos para mejorar la relación con los clientes y optimizar procesos de venta.
Cuando no tengas información específica sobre el sistema o procedimientos de la empresa, sugiere mejores prácticas generales del sector.`
      }),
    });
    
    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      console.error('Error al crear asistente:', errorData);
      process.exit(1);
    }
    
    const newAssistant = await createResponse.json();
    
    console.log('\n✅ ¡Asistente creado exitosamente!');
    console.log('ID del asistente:', newAssistant.id);
    console.log('Nombre:', newAssistant.name);
    console.log('Modelo:', newAssistant.model);
    
    console.log('\n📝 Configura este ID en tu archivo .env.local:');
    console.log(`OPENAI_ASSISTANT_ID=${newAssistant.id}`);
    
  } catch (error) {
    console.error('Error:', error.message || error);
    process.exit(1);
  }
}

main(); 