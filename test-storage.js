// Script para probar la funcionalidad de Supabase Storage
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY no definidas');
  console.log('Por favor configura estas variables en tu entorno antes de ejecutar este script');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testStorage() {
  console.log('=== Test de Supabase Storage ===');
  console.log(`URL de Supabase: ${SUPABASE_URL}`);
  
  try {
    // Listar buckets
    console.log('\nListando buckets disponibles...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Error al listar buckets: ${bucketsError.message}`);
    }
    
    if (buckets.length === 0) {
      console.log('No se encontraron buckets. Por favor crea uno en la interfaz de Supabase.');
    } else {
      console.log(`Buckets encontrados (${buckets.length}):`);
      buckets.forEach((bucket, index) => {
        console.log(`${index+1}. ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
      });
      
      // Verificar si existe el bucket 'documentos'
      const documentosBucket = buckets.find(b => b.name === 'documentos');
      if (documentosBucket) {
        console.log('\nBucket "documentos" encontrado.');
        console.log(`Es ${documentosBucket.public ? 'público' : 'privado'}`);
        
        // Listar archivos en el bucket 'documentos'
        console.log('\nListando archivos en el bucket "documentos"...');
        const { data: files, error: filesError } = await supabase
          .storage
          .from('documentos')
          .list();
          
        if (filesError) {
          console.error(`Error al listar archivos: ${filesError.message}`);
        } else if (files.length === 0) {
          console.log('No hay archivos en el bucket "documentos"');
        } else {
          console.log(`Archivos encontrados (${files.length}):`);
          files.forEach((file, index) => {
            console.log(`${index+1}. ${file.name} (${Math.round(file.metadata.size / 1024)} KB)`);
          });
        }
      } else {
        console.log('\nEl bucket "documentos" NO existe. Por favor créalo desde la interfaz de Supabase.');
      }
    }
    
    console.log('\nPrueba completada con éxito');
  } catch (error) {
    console.error('\nError al realizar la prueba:');
    console.error(error);
  }
}

// Ejecutar la función de prueba
testStorage(); 