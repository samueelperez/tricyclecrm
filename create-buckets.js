// Script para crear y configurar buckets en Supabase Storage
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Obtener credenciales de las variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usamos la clave de servicio para tener permisos administrativos

// Verificar si tenemos las variables necesarias
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: No se encontraron las variables de entorno necesarias.');
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

// Crear cliente de Supabase con clave de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Función para crear un bucket si no existe
 */
async function createBucketIfNotExists(bucketName, isPublic = false) {
  console.log(`\n=== Verificando bucket: ${bucketName} ===`);
  
  try {
    // Verificar si el bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Error al listar buckets: ${bucketsError.message}`);
    }
    
    // Buscar el bucket por nombre
    const bucketExists = buckets.some(b => b.name === bucketName);
    
    // Si no existe, crearlo
    if (!bucketExists) {
      console.log(`Bucket "${bucketName}" no existe. Creando...`);
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        throw new Error(`Error al crear bucket: ${createError.message}`);
      }
      
      console.log(`✅ Bucket "${bucketName}" creado correctamente.`);
    } else {
      console.log(`✅ Bucket "${bucketName}" ya existe.`);
      
      // Actualizar la configuración del bucket
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (updateError) {
        throw new Error(`Error al actualizar configuración del bucket: ${updateError.message}`);
      }
      
      console.log(`✅ Configuración del bucket "${bucketName}" actualizada.`);
    }
    
    // Crear directorios dentro de buckets
    if (bucketName === 'documentos') {
      await createDirectoryIfNotExists(bucketName, 'facturas-logistica');
      await createDirectoryIfNotExists(bucketName, 'facturas-proveedor');
      await createDirectoryIfNotExists(bucketName, 'proveedores');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error con bucket "${bucketName}":`, error.message);
    return false;
  }
}

/**
 * Función para crear un directorio dentro de un bucket
 */
async function createDirectoryIfNotExists(bucketName, dirPath) {
  try {
    console.log(`\n> Verificando directorio: ${dirPath} en bucket ${bucketName}`);
    
    // Crear un archivo vacío como marcador de carpeta (Supabase no tiene directorios como tal)
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(`${dirPath}/.keep`, new Uint8Array(0), {
        upsert: true,
        contentType: 'text/plain'
      });
    
    if (uploadError && !uploadError.message.includes('already exists')) {
      throw new Error(`Error al crear directorio: ${uploadError.message}`);
    }
    
    console.log(`✅ Directorio "${dirPath}" verificado/creado correctamente.`);
    return true;
  } catch (error) {
    console.error(`❌ Error al crear directorio "${dirPath}":`, error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('=== Configuración de Supabase Storage ===');
  console.log(`URL de Supabase: ${SUPABASE_URL}`);
  
  try {
    // Crear el bucket documentos (público)
    await createBucketIfNotExists('documentos', true);
    
    console.log('\n✅ Configuración completada con éxito.');
  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error.message);
    process.exit(1);
  }
}

// Ejecutar la función principal
main(); 