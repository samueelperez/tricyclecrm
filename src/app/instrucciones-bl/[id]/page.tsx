'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiEdit, FiDownload, FiTrash2, FiCalendar, FiUser, FiAnchor, FiMapPin, FiPackage, FiGlobe, FiFileText } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

type InstruccionBL = {
  id: number;
  numero_instruccion: string;
  fecha_creacion: string;
  fecha_estimada_embarque: string;
  cliente: string;
  cliente_id: number;
  envio_id: number | null;
  numero_envio: string | null;
  estado: string;
  consignatario: string;
  puerto_carga: string;
  puerto_descarga: string;
  tipo_carga: string;
  incoterm: string;
  notas: string | null;
  created_at: string;
};

export default function VerInstruccionBL() {
  const params = useParams();
  const router = useRouter();
  const [instruccion, setInstruccion] = useState<InstruccionBL | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    cargarInstruccion();
  }, [params.id]);

  const cargarInstruccion = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('instrucciones_bl')
        .select(`
          *,
          clientes(nombre),
          envios(numero_envio)
        `)
        .eq('id', params.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setInstruccion({
          ...data,
          cliente: data.clientes?.nombre || data.cliente,
          numero_envio: data.envios?.numero_envio || data.numero_envio
        });
      } else {
        setError('No se encontró la instrucción BL solicitada');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError('Error al cargar la instrucción BL');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea eliminar esta instrucción BL? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('instrucciones_bl')
        .delete()
        .eq('id', params.id);

      if (error) throw error;

      router.push('/instrucciones-bl');
    } catch (error: any) {
      console.error('Error:', error);
      setError('Error al eliminar la instrucción BL');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !instruccion) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiFileText className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error || 'No se encontró la instrucción BL'}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/instrucciones-bl"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
            >
              <FiArrowLeft className="mr-2" /> Volver a la lista
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/instrucciones-bl"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-900 mb-4"
              >
                <FiArrowLeft className="mr-2" /> Volver a la lista
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Instrucción BL: {instruccion.numero_instruccion}
              </h1>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/instrucciones-bl/edit/${instruccion.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <FiEdit className="mr-2" /> Editar
              </Link>
              <Link
                href={`/instrucciones-bl/${instruccion.id}/pdf`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <FiDownload className="mr-2" /> Descargar PDF
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiTrash2 className="mr-2" /> Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Detalles */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Información de la Instrucción BL
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Detalles completos de la instrucción de embarque.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiCalendar className="mr-2" /> Fecha de Creación
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(instruccion.fecha_creacion).toLocaleDateString()}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiUser className="mr-2" /> Cliente
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {instruccion.cliente}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiAnchor className="mr-2" /> Puerto de Carga
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {instruccion.puerto_carga}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiMapPin className="mr-2" /> Puerto de Descarga
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {instruccion.puerto_descarga}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiPackage className="mr-2" /> Tipo de Carga
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {instruccion.tipo_carga}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiGlobe className="mr-2" /> Incoterm
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {instruccion.incoterm}
                </dd>
              </div>
              {instruccion.notas && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FiFileText className="mr-2" /> Notas
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {instruccion.notas}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
} 