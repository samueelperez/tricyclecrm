'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FiEdit, FiEye, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi'
import Link from 'next/link'

interface FacturaProveedor {
  id: number
  numero_factura: string
  fecha_emision: string
  fecha_vencimiento: string
  importe_total: number
  estado: string
  id_proveedor: number
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
          .select('*, proveedor:id_proveedor(nombre)')
          .order('fecha_emision', { ascending: false })
        
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Emisión</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
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
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(factura.fecha_emision)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(factura.fecha_vencimiento)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">€{factura.importe_total.toFixed(2)}</td>
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
                      <Link href={`/facturas-proveedor/${factura.id}`} className="text-blue-500 hover:text-blue-700">
                        <FiEye />
                      </Link>
                      <Link href={`/facturas-proveedor/${factura.id}/edit`} className="text-green-500 hover:text-green-700">
                        <FiEdit />
                      </Link>
                      <button className="text-red-500 hover:text-red-700">
                        <FiTrash2 />
                      </button>
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