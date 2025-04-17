#!/usr/bin/env node

/**
 * Script para aplicar migraciones de base de datos.
 * 
 * Uso:
 * node scripts/apply-migrations.js https://tudominio.com [--apply-foreign-key] [--token=token-secreto]
 * 
 * Este script puede ejecutarse:
 * 1. Después de un despliegue automáticamente desde CI/CD
 * 2. Como parte de un webhook de GitHub/GitLab
 * 3. Manualmente cuando sea necesario
 */

const { URL } = require('url');
const https = require('https');
const http = require('http');

// Capturar argumentos
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Uso: node apply-migrations.js URL [--apply-foreign-key] [--token=tu-token]');
  process.exit(1);
}

const baseUrl = args[0];
const applyForeignKey = args.includes('--apply-foreign-key');
const tokenArg = args.find(arg => arg.startsWith('--token='));
const token = tokenArg ? tokenArg.split('=')[1] : null;

// Validar URL
let url;
try {
  url = new URL(`${baseUrl}/api/db-migrate${applyForeignKey ? '?applyForeignKey=true' : ''}`);
} catch (error) {
  console.error('URL inválida:', baseUrl);
  process.exit(1);
}

// Preparar opciones para la petición
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: `${url.pathname}${url.search}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

// Añadir token si se ha proporcionado
if (token) {
  options.headers['Authorization'] = `Bearer ${token}`;
}

console.log(`Ejecutando migraciones en ${url.href}...`);

// Seleccionar el módulo adecuado según el protocolo
const requestModule = url.protocol === 'https:' ? https : http;

// Ejecutar la petición
const req = requestModule.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const result = JSON.parse(data);
        
        // Mostrar resultado
        console.log(`Migraciones completadas con estado: ${result.status}`);
        
        if (result.steps && result.steps.length > 0) {
          result.steps.forEach(step => {
            if (step.success) {
              console.log(`✅ ${step.name}: ${step.message || 'Completado'}`);
            } else {
              console.error(`❌ ${step.name}: ${step.message || 'Fallido'}`);
            }
          });
        }
        
        // Salir con código de error si hay algún paso fallido
        const hasFailures = result.steps && result.steps.some(step => !step.success);
        process.exit(hasFailures ? 1 : 0);
      } catch (error) {
        console.error('Error al procesar la respuesta:', error);
        console.error('Datos recibidos:', data);
        process.exit(1);
      }
    } else {
      console.error(`Error HTTP ${res.statusCode}: ${res.statusMessage}`);
      console.error('Respuesta:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Error al ejecutar la petición:', error.message);
  process.exit(1);
});

req.end(); 