'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiEdit, FiMail, FiPhone, FiMap, FiUser, FiFileText } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

interface Cliente {
  id: number;
  nombre: string;
  id_fiscal: string | null;
  direccion: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  pais: string | null;
  contacto_nombre: string | null;
  email: string | null;
  telefono: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function ClienteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const clienteId = parseInt(params.id);

  useEffect(() => {
    const fetchCliente = async () => {
      if (isNaN(clienteId)) {
        setError('ID de cliente inválido');
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        
        // Consultar cliente por ID
        const { data, error: fetchError } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', clienteId)
          .single();
        
        if (fetchError) {
          throw new Error(`Error al cargar el cliente: ${fetchError.message}`);
        }
        
        if (!data) {
          throw new Error('Cliente no encontrado');
        }
        
        setCliente(data);
        
      } catch (err) {
        console.error('Error al cargar cliente:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCliente();
  }, [clienteId]);

  // Formatear fecha para mejor visualización
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || 'Cliente no encontrado'}</p>
            </div>
          </div>
        </div>
        <Link href="/clientes" className="text-blue-600 hover:text-blue-800">
          ← Volver a la lista de clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/clientes" className="mr-4 text-gray-500 hover:text-gray-700">
            <FiArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{cliente.nombre}</h1>
        </div>
        <Link
          href={`/clientes/edit/${cliente.id}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <FiEdit className="mr-2 -ml-1 h-5 w-5" />
          Editar Cliente
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Información del Cliente
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Detalles personales y de contacto del cliente.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Cliente #{cliente.id}
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiUser className="mr-2" /> Nombre
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {cliente.nombre}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiFileText className="mr-2" /> ID Fiscal
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {cliente.id_fiscal || 'No especificado'}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiUser className="mr-2" /> Contacto
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {cliente.contacto_nombre || 'No especificado'}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiMail className="mr-2" /> Email
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {cliente.email ? (
                  <a href={`mailto:${cliente.email}`} className="text-blue-600 hover:text-blue-800">
                    {cliente.email}
                  </a>
                ) : (
                  'No especificado'
                )}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiPhone className="mr-2" /> Teléfono
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {cliente.telefono ? (
                  <a href={`tel:${cliente.telefono}`} className="text-blue-600 hover:text-blue-800">
                    {cliente.telefono}
                  </a>
                ) : (
                  'No especificado'
                )}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiMap className="mr-2" /> Dirección
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {cliente.direccion ? (
                  <div>
                    <p>{cliente.direccion}</p>
                    <p>
                      {[
                        cliente.ciudad,
                        cliente.codigo_postal,
                        cliente.pais
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                ) : (
                  'No especificada'
                )}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Fecha de registro
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(cliente.created_at)}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Última actualización
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(cliente.updated_at)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Sección futura para mostrar negocios asociados */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Negocios relacionados</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <p className="text-gray-500">
            La integración con negocios se implementará proximamente.
          </p>
        </div>
      </div>
      
      {/* Sección futura para mostrar facturas asociadas */}
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Facturas asociadas</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <p className="text-gray-500">
            La integración con facturas se implementará proximamente.
          </p>
        </div>
      </div>
    </div>
  );
} 