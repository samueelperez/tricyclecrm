#!/usr/bin/env node

/**
 * Script para ejecutar migraciones automáticas durante el desarrollo
 * 
 * Este script se ejecuta en segundo plano durante el desarrollo y
 * verifica periódicamente si hay migraciones pendientes para aplicarlas.
 */

const http = require('http');
const https = require('https');

// Configuración
const CONFIG = {
  // Intervalo de verificación en milisegundos (por defecto cada 30 segundos)
  checkInterval: process.env.AUTO_MIGRATE_INTERVAL || 30000,
  // URL base donde se está ejecutando el servidor de desarrollo
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  // Endpoint para ejecutar migraciones
  endpoint: '/api/db-migrate',
  // Si se debe aplicar clave foránea automáticamente
  applyForeignKey: false
};

/**
 * Ejecuta las migraciones automáticamente
 */
async function runMigrations() {
  const url = new URL(`${CONFIG.baseUrl}${CONFIG.endpoint}`);
  if (CONFIG.applyForeignKey) {
    url.searchParams.append('applyForeignKey', 'true');
  }

  console.log(`[${new Date().toISOString()}] Verificando migraciones pendientes...`);

  // Seleccionar el módulo adecuado según el protocolo
  const client = url.protocol === 'https:' ? https : http;
  
  // Opciones para la petición
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: `${url.pathname}${url.search}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            console.log(`[${new Date().toISOString()}] Resultado de migraciones:`, 
              result.status === 'success' 
                ? '✅ Todas las migraciones aplicadas correctamente' 
                : '⚠️ Algunas migraciones fallaron');
            
            if (result.steps) {
              result.steps.forEach(step => {
                if (!step.success) {
                  console.warn(`  ❌ ${step.name}: ${step.message || 'Error desconocido'}`);
                }
              });
            }
            
            resolve(result);
          } catch (error) {
            console.error('Error al procesar la respuesta:', error);
            reject(error);
          }
        } else {
          console.error(`Error HTTP ${res.statusCode}: ${res.statusText || 'Error desconocido'}`);
          reject(new Error(`Error HTTP ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      // No mostrar error si es por conexión rechazada (servidor no iniciado aún)
      if (error.code === 'ECONNREFUSED') {
        console.log('⏳ Esperando a que el servidor de desarrollo esté disponible...');
      } else {
        console.error('Error al ejecutar la petición:', error.message);
      }
      resolve({ status: 'pending', message: 'Servidor no disponible aún' });
    });
    
    req.end();
  });
}

/**
 * Función principal que ejecuta el bucle de verificación
 */
async function main() {
  console.log('🔄 Iniciando sistema de migración automática en desarrollo');
  console.log(`📡 URL base: ${CONFIG.baseUrl}`);
  console.log(`⏱️ Intervalo de verificación: ${CONFIG.checkInterval}ms`);
  
  // Ejecutar inmediatamente al inicio
  try {
    await runMigrations();
  } catch (error) {
    console.error('Error en la ejecución inicial:', error);
  }
  
  // Configurar verificación periódica
  setInterval(async () => {
    try {
      await runMigrations();
    } catch (error) {
      // Evitar que errores detengan el proceso
      console.error('Error en verificación programada:', error);
    }
  }, CONFIG.checkInterval);
}

// Ejecutar el programa
main().catch(console.error); 