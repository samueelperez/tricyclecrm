'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FiEdit, FiEye, FiTrash2, FiSearch, FiFilter, FiPaperclip, FiFile, FiExternalLink } from 'react-icons/fi'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface FacturaProveedor {
  id: number
  numero_factura: string
  fecha_emision: string
  fecha_vencimiento: string
  importe_total: number
  importe: number
  estado: string
  id_proveedor: number
  nombre_archivo: string | null
  url_adjunto: string | null
  proveedor: {
    nombre: string
  }
}

export default function FacturasProveedorPage() {
  const [facturas, setFacturas] = useState<FacturaProveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadFacturas() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('facturas_proveedor')
          .select('*, proveedor:proveedor_id(nombre)')
          .order('fecha', { ascending: false })
        
        if (error) {
          throw error
        }
        
        setFacturas(data || [])
      } catch (error) {
        console.error('Error cargando facturas de proveedores:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFacturas()
  }, [supabase])

  const filteredFacturas = facturas.filter(factura => {
    const matchesSearch = 
      factura.numero_factura?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      factura.proveedor?.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesEstado = filtroEstado === 'todos' || factura.estado === filtroEstado
    
    return matchesSearch && matchesEstado
  })

  // Formatea fecha de YYYY-MM-DD a DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES')
  }

  // Función para obtener URL del archivo
  const getFileUrl = async (factura: FacturaProveedor) => {
    // Si ya tiene una URL externa, usarla directamente
    if (factura.url_adjunto) {
      window.open(factura.url_adjunto, '_blank')
      return
    }
    
    // Si tiene un archivo adjunto pero no URL externa, generar URL firmada
    if (factura.nombre_archivo) {
      try {
        const fileExt = factura.nombre_archivo.split('.').pop()
        const filePath = `facturas-proveedor/${factura.id}.${fileExt}`
        
        const { data: urlData, error } = await supabase
          .storage
          .from('documentos')
          .createSignedUrl(filePath, 3600)
        
        if (error) throw error
        
        if (urlData?.signedUrl) {
          window.open(urlData.signedUrl, '_blank')
        }
      } catch (err) {
        console.error('Error al obtener URL del archivo:', err)
        toast.error('No se pudo acceder al archivo')
      }
    } else {
      toast.error('Esta factura no tiene documento adjunto')
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Facturas de Proveedores</h1>
      
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
          href="/facturas-proveedor/new"
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
            <p>No hay facturas de proveedores registradas.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Factura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFacturas.map((factura) => (
                <tr key={factura.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{factura.numero_factura}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{factura.proveedor?.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(factura.fecha_emision)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">€{(factura.importe_total || factura.importe || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(factura.nombre_archivo || factura.url_adjunto) ? (
                      <button 
                        onClick={() => getFileUrl(factura)}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                        title={factura.nombre_archivo || "Ver documento"}
                      >
                        {factura.url_adjunto ? (
                          <><FiExternalLink className="mr-1" /> Enlace externo</>
                        ) : (
                          <><FiFile className="mr-1" /> {factura.nombre_archivo?.split('.').pop()?.toUpperCase()}</>
                        )}
                      </button>
                    ) : (
                      <span className="text-gray-400">Sin documento</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${factura.estado === 'pagada' ? 'bg-green-100 text-green-800' : 
                        factura.estado === 'vencida' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}
                    >
                      {factura.estado ? (factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)) : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      <Link href={`/facturas-proveedor/edit/${factura.id}`} className="text-green-500 hover:text-green-700">
                        <FiEdit />
                      </Link>
                      <Link href={`/facturas-proveedor/edit/${factura.id}`} className="text-blue-500 hover:text-blue-700">
                        <FiEye />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 