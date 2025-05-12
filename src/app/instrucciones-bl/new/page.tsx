'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiX } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

type Cliente = {
  id: number;
  nombre: string;
};

type NuevaInstruccionBL = {
  numero_instruccion: string;
  fecha_creacion: string;
  fecha_estimada_embarque: string;
  cliente_id: number;
  estado: string;
  consignatario: string;
  puerto_carga: string;
  puerto_descarga: string;
  tipo_carga: string;
  incoterm: string;
  notas: string | null;
};

export default function NuevaInstruccionBL() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instruccion, setInstruccion] = useState<NuevaInstruccionBL>({
    numero_instruccion: '',
    fecha_creacion: new Date().toISOString().split('T')[0],
    fecha_estimada_embarque: '',
    cliente_id: 0,
    estado: 'borrador',
    consignatario: '',
    puerto_carga: '',
    puerto_descarga: '',
    tipo_carga: 'FCL (Full Container Load)',
    incoterm: 'FOB',
    notas: null
  });

  // Estados para instrucciones BL
  const estadosInstruccion = [
    { value: "borrador", label: "Borrador" },
    { value: "pendiente", label: "Pendiente" },
    { value: "aprobada", label: "Aprobada" },
    { value: "enviada", label: "Enviada" },
    { value: "rechazada", label: "Rechazada" },
    { value: "completada", label: "Completada" },
  ];

  // Tipos de carga
  const tiposCarga = [
    "FCL (Full Container Load)",
    "LCL (Less Container Load)",
    "Granel",
    "Break Bulk",
    "Ro-Ro",
    "Carga Refrigerada"
  ];

  // Incoterms comunes
  const incoterms = [
    "EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"
  ];

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;

      if (data) {
        setClientes(data);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('instrucciones_bl')
        .insert([instruccion])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        router.push(`/instrucciones-bl/${data.id}`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError('Error al crear la instrucción BL');
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8">
          <Link
            href="/instrucciones-bl"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-900 mb-4"
          >
            <FiArrowLeft className="mr-2" /> Volver a la lista
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Nueva Instrucción BL
          </h1>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiX className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Número de Instrucción */}
                <div className="sm:col-span-3">
                  <label htmlFor="numero_instruccion" className="block text-sm font-medium text-gray-700">
                    Número de Instrucción
                  </label>
                  <input
                    type="text"
                    name="numero_instruccion"
                    id="numero_instruccion"
                    value={instruccion.numero_instruccion}
                    onChange={(e) => setInstruccion({ ...instruccion, numero_instruccion: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                {/* Fecha Estimada de Embarque */}
                <div className="sm:col-span-3">
                  <label htmlFor="fecha_estimada_embarque" className="block text-sm font-medium text-gray-700">
                    Fecha Estimada de Embarque
                  </label>
                  <input
                    type="date"
                    name="fecha_estimada_embarque"
                    id="fecha_estimada_embarque"
                    value={instruccion.fecha_estimada_embarque}
                    onChange={(e) => setInstruccion({ ...instruccion, fecha_estimada_embarque: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                {/* Cliente */}
                <div className="sm:col-span-3">
                  <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700">
                    Cliente
                  </label>
                  <select
                    id="cliente_id"
                    name="cliente_id"
                    value={instruccion.cliente_id}
                    onChange={(e) => setInstruccion({ ...instruccion, cliente_id: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div className="sm:col-span-3">
                  <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <select
                    id="estado"
                    name="estado"
                    value={instruccion.estado}
                    onChange={(e) => setInstruccion({ ...instruccion, estado: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                    {estadosInstruccion.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Consignatario */}
                <div className="sm:col-span-6">
                  <label htmlFor="consignatario" className="block text-sm font-medium text-gray-700">
                    Consignatario
                  </label>
                  <input
                    type="text"
                    name="consignatario"
                    id="consignatario"
                    value={instruccion.consignatario}
                    onChange={(e) => setInstruccion({ ...instruccion, consignatario: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                {/* Puerto de Carga */}
                <div className="sm:col-span-3">
                  <label htmlFor="puerto_carga" className="block text-sm font-medium text-gray-700">
                    Puerto de Carga
                  </label>
                  <input
                    type="text"
                    name="puerto_carga"
                    id="puerto_carga"
                    value={instruccion.puerto_carga}
                    onChange={(e) => setInstruccion({ ...instruccion, puerto_carga: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                {/* Puerto de Descarga */}
                <div className="sm:col-span-3">
                  <label htmlFor="puerto_descarga" className="block text-sm font-medium text-gray-700">
                    Puerto de Descarga
                  </label>
                  <input
                    type="text"
                    name="puerto_descarga"
                    id="puerto_descarga"
                    value={instruccion.puerto_descarga}
                    onChange={(e) => setInstruccion({ ...instruccion, puerto_descarga: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                {/* Tipo de Carga */}
                <div className="sm:col-span-3">
                  <label htmlFor="tipo_carga" className="block text-sm font-medium text-gray-700">
                    Tipo de Carga
                  </label>
                  <select
                    id="tipo_carga"
                    name="tipo_carga"
                    value={instruccion.tipo_carga}
                    onChange={(e) => setInstruccion({ ...instruccion, tipo_carga: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                    {tiposCarga.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Incoterm */}
                <div className="sm:col-span-3">
                  <label htmlFor="incoterm" className="block text-sm font-medium text-gray-700">
                    Incoterm
                  </label>
                  <select
                    id="incoterm"
                    name="incoterm"
                    value={instruccion.incoterm}
                    onChange={(e) => setInstruccion({ ...instruccion, incoterm: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                    {incoterms.map((incoterm) => (
                      <option key={incoterm} value={incoterm}>
                        {incoterm}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notas */}
                <div className="sm:col-span-6">
                  <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
                    Notas
                  </label>
                  <textarea
                    id="notas"
                    name="notas"
                    rows={3}
                    value={instruccion.notas || ''}
                    onChange={(e) => setInstruccion({ ...instruccion, notas: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiSave className="mr-2" /> Crear Instrucción
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 