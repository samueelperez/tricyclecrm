'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FiEdit, FiEye, FiTrash2, FiSearch, FiTag } from 'react-icons/fi'
import Link from 'next/link'

interface Material {
  id: number
  nombre: string
  descripcion: string | null
  categoria?: string
}

export default function MaterialesPage() {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadMateriales() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('materiales')
          .select('id, nombre, descripcion, categoria')
          .order('nombre')
        
        if (error) {
          throw error
        }
        
        setMateriales(data || [])
      } catch (error) {
        console.error('Error cargando materiales:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMateriales()
  }, [supabase])

  const filteredMateriales = materiales.filter(material => 
    material.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (material.descripcion && material.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Materiales</h1>
      
      <div className="mb-6 flex">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Link 
          href="/materiales/new"
          className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Añadir Material
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredMateriales.length === 0 ? (
        <div className="text-center py-8">
          {searchQuery ? (
            <p>No se encontraron materiales con "{searchQuery}"</p>
          ) : (
            <p>No hay materiales registrados. ¡Añade tu primer material!</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMateriales.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{material.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center">
                      <FiTag className="text-gray-400 mr-1" />
                      {getCategoriaLabel(material.categoria)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      <Link href={`/materiales/${material.id}`} className="text-blue-500 hover:text-blue-700">
                        <FiEye />
                      </Link>
                      <Link href={`/materiales/${material.id}/edit`} className="text-green-500 hover:text-green-700">
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