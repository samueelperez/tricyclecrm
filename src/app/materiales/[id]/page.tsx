'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiEdit,
  FiPackage,
  FiFileText,
  FiInfo,
  FiHash,
  FiBarcode,
  FiTag
} from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

interface Material {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria?: string;
}

interface MaterialPageProps {
  params: {
    id: string;
  };
}

export default function MaterialDetailPage({ params }: MaterialPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState<Material | null>(null);
  const [error, setError] = useState<string | null>(null);
  const materialId = params.id;
  const supabase = getSupabaseClient();
  
  // Obtener detalles del material desde Supabase
  useEffect(() => {
    const fetchMaterial = async () => {
      setLoading(true);
      try {
        const { data: material, error } = await supabase
          .from('materiales')
          .select('id, nombre, descripcion, categoria')
          .eq('id', params.id)
          .single();

        if (error) {
          throw error;
        }

        if (material) {
          setMaterial(material);
        } else {
          setError('Material no encontrado');
        }
      } catch (error) {
        console.error('Error fetching material:', error);
        setError('Error al cargar el material');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [params.id, supabase]);

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-gray-700">Cargando datos del material...</p>
      </div>
    );
  }

  // Mostrar error si ocurrió alguno
  if (error || !material) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
          <p className="text-red-700">
            {error || 'No se pudo cargar el material'}
          </p>
          <Link href="/materiales" className="text-blue-500 hover:underline mt-2 inline-block">
            ← Volver a materiales
          </Link>
        </div>
      </div>
    );
  }

  // Función para obtener el nombre legible de la categoría
  const getCategoriaLabel = (categoria?: string): string => {
    switch (categoria) {
      case 'plastico':
        return 'Plástico';
      case 'metal':
        return 'Metal';
      case 'papel':
        return 'Papel';
      default:
        return 'No especificada';
    }
  };

  // Tarjeta de información del material
  const renderMaterialInfo = () => (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-md border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
          <FiInfo className="mr-2 text-indigo-500" />
          Información Detallada
        </h3>
      </div>
      <div className="p-6 bg-white">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <FiHash className="mr-1 text-indigo-400" /> ID
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{material.id}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <FiTag className="mr-1 text-indigo-400" /> Categoría
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{getCategoriaLabel(material.categoria)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <FiPackage className="mr-1 text-indigo-400" /> Nombre
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{material.nombre}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <FiFileText className="mr-1 text-indigo-400" /> Descripción
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {material.descripcion || 'Sin descripción'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="bg-white shadow-md rounded-lg px-6 py-5 mb-8 flex items-center justify-between transition-all duration-300 ease-in-out transform hover:shadow-lg border-l-4 border-indigo-500">
          <div className="flex items-center">
            <Link href="/materiales" className="mr-4 text-gray-500 hover:text-indigo-600 transition-colors duration-200">
              <FiArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              {material.nombre}
            </h1>
          </div>
          <div className="flex items-center">
            <Link 
              href={`/materiales/${material.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiEdit className="mr-2 -ml-1 h-4 w-4" />
              Editar
            </Link>
          </div>
        </div>
        
        {/* Contenido principal */}
        <div className="grid grid-cols-1 gap-6">
          {renderMaterialInfo()}
        </div>
      </div>
    </div>
  );
} 