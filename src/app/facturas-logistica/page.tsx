'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FiEdit, FiEye, FiTrash2, FiSearch, FiFilter, FiX, FiDownload, FiFile } from 'react-icons/fi'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface FacturaLogistica {
  id: number
  numero_factura: string
  fecha: string
  descripcion?: string
  importe: number
  estado: string
  proveedor_id: number
  proveedor: {
    nombre: string
  }
  nombre_archivo?: string
  archivo_path?: string
}

export default function FacturasLogisticaPage() {
  const [facturas, setFacturas] = useState<FacturaLogistica[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const supabase = createClientComponentClient()
  const [filePreview, setFilePreview] = useState<{url: string, nombre: string} | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)

  useEffect(() => {
    async function loadFacturas() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('facturas_logistica')
          .select('*, proveedor:proveedor_id(nombre)')
          .order('fecha', { ascending: false })
        
        if (error) {
          throw error
        }
        
        setFacturas(data || [])
      } catch (error) {
        console.error('Error cargando facturas de logística:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFacturas()
  }, [supabase])

  const filteredFacturas = facturas.filter(factura => {
    const matchesSearch = 
      factura.numero_factura.toLowerCase().includes(searchQuery.toLowerCase()) ||
      factura.proveedor.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesEstado = filtroEstado === 'todos' || factura.estado === filtroEstado
    
    return matchesSearch && matchesEstado
  })

  // Formatea fecha de YYYY-MM-DD a DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES')
  }

  const handlePreviewFile = async (factura: FacturaLogistica) => {
    if (!factura.nombre_archivo) {
      return;
    }

    try {
      // Usar el campo archivo_path si está disponible
      const filePath = factura.archivo_path || `facturas-logistica/${factura.id}.${factura.nombre_archivo.split('.').pop()}`;
      
      const { data, error } = await supabase
        .storage
        .from('documentos')
        .createSignedUrl(filePath, 60);
        
      if (error) throw error;
      
      setFilePreview({
        url: data.signedUrl,
        nombre: factura.nombre_archivo
      });
      
    } catch (error) {
      console.error('Error al generar vista previa:', error);
      toast.error('No se pudo cargar el archivo para la vista previa');
    }
  };
  
  const closePreview = () => {
    setFilePreview(null);
  };

  const handleViewFile = async (factura: any) => {
    try {
      setLoading(true);
      const supabase = createClientComponentClient();
      
      // Usar el campo archivo_path si está disponible
      const filePath = factura.archivo_path || `facturas-logistica/${factura.id}.${factura.nombre_archivo?.split('.').pop()}`;
      
      const { data, error } = await supabase
        .storage
        .from('documentos')
        .createSignedUrl(filePath, 60);
        
      if (error) throw error;
      
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Error al obtener el archivo:', err);
      toast.error('No se pudo abrir el archivo adjunto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
      return;
    }
    
    setDeleteLoading(id);
    
    try {
      // Eliminar archivo si existe
      const { data: facturaData } = await supabase
        .from('facturas_logistica')
        .select('nombre_archivo')
        .eq('id', id)
        .single();
        
      if (facturaData?.nombre_archivo) {
        const fileExt = facturaData.nombre_archivo.split('.').pop();
        const filePath = `facturas-logistica/${id}.${fileExt}`;
        
        await supabase
          .storage
          .from('documentos')
          .remove([filePath]);
      }
      
      // Eliminar factura
      const { error } = await supabase
        .from('facturas_logistica')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Actualizar la lista de facturas
      setFacturas(prev => prev.filter(f => f.id !== id));
      toast.success('Factura eliminada con éxito');
    } catch (err) {
      console.error('Error al eliminar la factura:', err);
      toast.error('Error al eliminar la factura');
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Facturas de Logística</h1>
      
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Buscar por número o proveedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="relative min-w-[200px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiFilter className="text-gray-400" />
          </span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option>
            <option value="vencida">Vencida</option>
          </select>
        </div>
        
        <Link 
          href="/facturas-logistica/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Nueva Factura
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredFacturas.length === 0 ? (
        <div className="text-center py-8">
          {searchQuery || filtroEstado !== 'todos' ? (
            <p>No se encontraron facturas con los filtros seleccionados</p>
          ) : (
            <p>No hay facturas de logística registradas.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Factura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Emisión</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFacturas.map((factura) => (
                <tr key={factura.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{factura.numero_factura}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{factura.proveedor.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(factura.fecha)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{factura.descripcion || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">€{factura.importe.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${factura.estado === 'pagada' ? 'bg-green-100 text-green-800' : 
                        factura.estado === 'vencida' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}
                    >
                      {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      <Link href={`/facturas-logistica/${factura.id}`} className="text-blue-500 hover:text-blue-700">
                        <FiEye />
                      </Link>
                      <Link href={`/facturas-logistica/edit/${factura.id}`} className="text-green-500 hover:text-green-700">
                        <FiEdit />
                      </Link>
                      <button 
                        onClick={() => handleDelete(factura.id)}
                        disabled={deleteLoading === factura.id}
                        className="text-red-500 hover:text-red-700"
                      >
                        {deleteLoading === factura.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                        ) : (
                          <FiTrash2 />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de vista previa del archivo */}
      {filePreview && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-70" onClick={closePreview}>
          <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {filePreview.nombre}
              </h3>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-500">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              {filePreview.nombre.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={filePreview.url} 
                  className="w-full h-full min-h-[70vh]" 
                  title="Vista previa del PDF"
                />
              ) : filePreview.nombre.toLowerCase().match(/\.(jpe?g|png|gif)$/i) ? (
                <div className="flex justify-center">
                  <img 
                    src={filePreview.url} 
                    alt="Vista previa" 
                    className="max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <FiFile className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No se puede mostrar la vista previa para este tipo de archivo
                    </p>
                    <a
                      href={filePreview.url}
                      download={filePreview.nombre}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Descargar archivo
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <a
                href={filePreview.url}
                download={filePreview.nombre}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FiDownload className="mr-2 -ml-1 h-5 w-5" />
                Descargar
              </a>
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                onClick={closePreview}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 