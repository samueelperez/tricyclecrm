import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientComponent from "@/components/client-init";
import { supabase } from '@/lib/supabase';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tricycle CRM",
  description: "CRM para gestión de negocios, proveedores, clientes y logística",
};

// Función para verificar y crear el bucket de documentos si no existe
const ensureDocumentsBucket = async () => {
  try {
    // Solo verificamos en desarrollo para no hacer esto en cada renderizado de producción
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Verificando el bucket de documentos en Supabase...');
      
      // Listar buckets existentes
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Error al listar buckets:', bucketsError.message);
        return;
      }
      
      // Verificar si el bucket 'documentos' existe
      const documentosBucket = buckets.find(b => b.name === 'documentos');
      
      if (!documentosBucket) {
        console.log('⚠️ El bucket "documentos" no existe. Intentando crearlo...');
        
        // Crear el bucket si no existe
        const { data, error } = await supabase.storage.createBucket('documentos', {
          public: true, // Hacer el bucket público
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (error) {
          console.error('❌ Error al crear el bucket "documentos":', error.message);
        } else {
          console.log('✅ Bucket "documentos" creado correctamente');
        }
      } else {
        console.log('✅ Bucket "documentos" ya existe.');
      }
    }
  } catch (error) {
    console.error('❌ Error al verificar/crear el bucket:', error);
  }
};

// Ejecutar la función al cargar la aplicación en el lado del cliente
if (typeof window !== 'undefined') {
  ensureDocumentsBucket();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  );
} 