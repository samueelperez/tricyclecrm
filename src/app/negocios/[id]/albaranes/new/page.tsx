'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiChevronDown, 
  FiPlus, 
  FiTrash2,
  FiPackage,
  FiTruck,
  FiMapPin,
  FiFileText,
  FiDownload
} from 'react-icons/fi';

export default function NuevoAlbaran({ params }: { params: { id: string } }) {
  const router = useRouter();
  const negocioId = params.id;
  
  // Obtener la fecha actual en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  
  // Calcular fecha estimada de llegada (20 días después)
  const etaDate = new Date();
  etaDate.setDate(etaDate.getDate() + 20);
  const etaDateStr = etaDate.toISOString().split('T')[0];

  const handleCancel = () => {
    router.back();
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar los cambios
    
    // Redirigir de vuelta a la pestaña de albaranes
    router.push(`/negocios/${negocioId}?tab=shipping`);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Cabecera */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={handleCancel}
                className="mr-3 text-gray-600 hover:text-gray-800"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-medium text-gray-800">
                Nuevo Albarán
              </h1>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h1a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7a2 2 0 012-2h1v5.586l-1.293-1.293z" />
                  <path d="M9 4a1 1 0 012 0v2H9V4z" />
                </svg>
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido del formulario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Detalles del Albarán */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles del Albarán</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Externo</label>
              <input 
                type="text" 
                placeholder="ej. SH-10023"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Interno</label>
              <input 
                type="text" 
                placeholder="ej. INV002"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Envío</label>
              <div className="relative">
                <input 
                  type="date" 
                  defaultValue={today}
                  className="w-full p-2 border rounded-md pr-10"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiCalendar className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <div className="relative">
                <select className="w-full p-2 border rounded-md appearance-none">
                  <option value="pending">Pendiente</option>
                  <option value="in_transit">En Tránsito</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Tracking</label>
              <input 
                type="text" 
                placeholder="ej. TRACK-1234567890"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Envío</label>
              <div className="relative">
                <select className="w-full p-2 border rounded-md appearance-none">
                  <option value="sea">Marítimo</option>
                  <option value="road">Terrestre</option>
                  <option value="air">Aéreo</option>
                  <option value="rail">Ferroviario</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detalles del Transportista */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Información del Transportista</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Transportista</label>
              <div className="relative">
                <select className="w-full p-2 border rounded-md appearance-none">
                  <option value="">Seleccionar transportista</option>
                  <option value="fr_meyer">FR MEYER</option>
                  <option value="msc">MSC</option>
                  <option value="maersk">Maersk</option>
                  <option value="cma_cgm">CMA CGM</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Persona de Contacto</label>
              <input 
                type="text" 
                placeholder="ej. Juan Pérez"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                placeholder="ej. contacto@transportista.com"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input 
                type="tel" 
                placeholder="ej. +34 612 345 678"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Origen y Destino */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Origen y Destino</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Origen</label>
              <div className="flex items-center mb-2">
                <FiMapPin className="text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">Dirección de recogida</span>
              </div>
              <textarea 
                placeholder="ej. Valencia, España"
                className="w-full p-2 border rounded-md h-24"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Destino</label>
              <div className="flex items-center mb-2">
                <FiMapPin className="text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">Dirección de entrega</span>
              </div>
              <textarea 
                placeholder="ej. TEMA PORT - GHANA"
                className="w-full p-2 border rounded-md h-24"
              ></textarea>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Estimada de Llegada</label>
              <div className="relative">
                <input 
                  type="date" 
                  defaultValue={etaDateStr}
                  className="w-full p-2 border rounded-md pr-10"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiCalendar className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo Estimado de Tránsito</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  defaultValue="20"
                  min="1"
                  className="w-full p-2 border rounded-md"
                />
                <span className="text-gray-500 whitespace-nowrap">días</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incoterm</label>
              <div className="relative">
                <select className="w-full p-2 border rounded-md appearance-none">
                  <option value="CIF">CIF</option>
                  <option value="FOB">FOB</option>
                  <option value="EXW">EXW</option>
                  <option value="DDP">DDP</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Relación con Negocio */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Relación con Negocio</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relacionar con Negocio</label>
              <div className="relative">
                <select className="w-full p-2 border rounded-md appearance-none" disabled>
                  <option value={negocioId}>{negocioId}</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Este albarán está relacionado con el negocio actual.</p>
            </div>
          </div>
        </div>
        
        {/* Detalles del Embarque */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Detalles del Embarque</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <input 
                type="text" 
                placeholder="ej. PP JUMBO BAGS"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Contenedores</label>
              <input 
                type="number" 
                defaultValue="1"
                min="1"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso Total</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  placeholder="ej. 24.5"
                  step="0.1"
                  min="0"
                  className="w-full p-2 border rounded-md"
                />
                <span className="text-gray-500 whitespace-nowrap">MT</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contenedor</label>
              <div className="relative">
                <select className="w-full p-2 border rounded-md appearance-none">
                  <option value="40ft_standard">40ft Standard</option>
                  <option value="20ft_standard">20ft Standard</option>
                  <option value="40ft_high_cube">40ft High Cube</option>
                  <option value="40ft_refrigerated">40ft Refrigerated</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Declarado</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ej. 25000.00"
                  className="w-full p-2 border rounded-md pl-8"
                />
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <span>€</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Precinto</label>
              <input 
                type="text" 
                placeholder="ej. SEAL-123456"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones de Envío</label>
            <textarea 
              placeholder="ej. Entregar en horario comercial. Contactar con el destinatario 24h antes de la entrega."
              className="w-full p-2 border rounded-md h-24"
            ></textarea>
          </div>
        </div>
        
        {/* Documentos */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Documentos</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
            <div className="text-center">
              <FiPlus className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-1 text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Haz clic para subir
                </span> o arrastra y suelta
              </p>
              <p className="text-xs text-gray-500">PDF, PNG, JPG (máx. 10MB)</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.png,.jpg,.jpeg"
            />
            <button className="mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Seleccionar archivo
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Documentos recomendados:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Bill of Lading</li>
              <li>Packing List</li>
              <li>Certificado de Origen</li>
              <li>Documentos de Inspección</li>
            </ul>
          </div>
        </div>
        
        {/* Notas */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Notas Adicionales</h3>
          
          <div>
            <textarea 
              placeholder="Añadir notas o comentarios relevantes..."
              className="w-full p-2 border rounded-md h-24"
            ></textarea>
          </div>
        </div>
        
        {/* Pie con botones */}
        <div className="flex justify-end space-x-3 mt-6">
          <button 
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h1a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7a2 2 0 012-2h1v5.586l-1.293-1.293z" />
              <path d="M9 4a1 1 0 012 0v2H9V4z" />
            </svg>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
} 