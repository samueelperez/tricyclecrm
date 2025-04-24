'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiLoader, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

type CompanyProfileFormData = {
  company_name: string;
  industry: string;
  description: string;
  products_services: string;
  target_customers: string;
  competitors: string;
  unique_selling_points: string;
  regions: string[];
};

type CompanyProfileProps = {
  onSave?: (data: CompanyProfileFormData) => void;
};

export default function CompanyProfileForm({ onSave }: CompanyProfileProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [crmInsights, setCrmInsights] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CompanyProfileFormData>();

  // Lista de industrias comunes
  const industries = [
    'Tecnología',
    'Salud',
    'Educación',
    'Finanzas',
    'Retail',
    'Manufactura',
    'Construcción',
    'Alimentación',
    'Logística',
    'Servicios profesionales',
    'Turismo',
    'Otro',
  ];

  // Regiones comunes en España
  const availableRegions = [
    'Andalucía',
    'Aragón',
    'Asturias',
    'Baleares',
    'Canarias',
    'Cantabria',
    'Castilla-La Mancha',
    'Castilla y León',
    'Cataluña',
    'Extremadura',
    'Galicia',
    'La Rioja',
    'Madrid',
    'Murcia',
    'Navarra',
    'País Vasco',
    'Valencia',
  ];

  useEffect(() => {
    // Cargar el perfil existente
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await fetch('/api/company-profile');
        const data = await response.json();

        if (data.profile) {
          // Establecer los valores del formulario
          Object.entries(data.profile).forEach(([key, value]) => {
            if (key in register()) {
              setValue(key as keyof CompanyProfileFormData, value as any);
            }
          });
        }

        if (data.crmInsights) {
          setCrmInsights(data.crmInsights);
        }
      } catch (error) {
        console.error('Error al cargar el perfil:', error);
        setMessage({
          type: 'error',
          text: 'No se pudo cargar el perfil. Inténtalo de nuevo.',
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [setValue, register]);

  const onSubmit = async (data: CompanyProfileFormData) => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/company-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar el perfil');
      }

      setMessage({
        type: 'success',
        text: 'Perfil guardado correctamente',
      });

      // Callback opcional
      if (onSave) {
        onSave(data);
      }
    } catch (error) {
      console.error('Error al guardar el perfil:', error);
      setMessage({
        type: 'error',
        text: 'Error al guardar el perfil. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <FiLoader className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2">Cargando perfil de empresa...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Perfil de Empresa</h2>

      {crmInsights && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Información CRM</h3>
          <div className="text-sm text-blue-700">
            <p className="mb-1">
              <span className="font-medium">Clientes actuales:</span> {crmInsights.customer_insights?.customer_count || 0}
            </p>
            {crmInsights.customer_insights?.industries && (
              <p className="mb-1">
                <span className="font-medium">Sectores principales:</span>{' '}
                {crmInsights.customer_insights.industries.slice(0, 3).join(', ')}
              </p>
            )}
            {crmInsights.deal_insights?.avg_deal_value && (
              <p>
                <span className="font-medium">Valor medio de negocio:</span>{' '}
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(crmInsights.deal_insights.avg_deal_value)}
              </p>
            )}
          </div>
        </div>
      )}

      {message && (
        <div
          className={`mb-4 p-3 rounded-md flex items-center ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <FiCheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <FiAlertCircle className="w-5 h-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la empresa *
            </label>
            <input
              type="text"
              {...register('company_name', { required: 'El nombre de la empresa es obligatorio' })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.company_name && (
              <p className="text-red-500 text-xs mt-1">{errors.company_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industria/Sector *
            </label>
            <select
              {...register('industry', { required: 'La industria es obligatoria' })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona una industria</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="text-red-500 text-xs mt-1">{errors.industry.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regiones objetivo</label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border rounded-md">
              {availableRegions.map((region) => (
                <div key={region} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`region-${region}`}
                    value={region}
                    {...register('regions')}
                    className="mr-2"
                  />
                  <label htmlFor={`region-${region}`} className="text-sm">
                    {region}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción de la empresa *
            </label>
            <textarea
              {...register('description', {
                required: 'La descripción de la empresa es obligatoria',
                minLength: {
                  value: 50,
                  message: 'La descripción debe tener al menos 50 caracteres',
                },
              })}
              rows={3}
              placeholder="Describe a qué se dedica tu empresa, su historia, misión, visión, etc."
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Productos y servicios *
            </label>
            <textarea
              {...register('products_services', {
                required: 'Los productos/servicios son obligatorios',
              })}
              rows={3}
              placeholder="Describe los productos o servicios que ofrece tu empresa"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            {errors.products_services && (
              <p className="text-red-500 text-xs mt-1">{errors.products_services.message}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clientes objetivo *
            </label>
            <textarea
              {...register('target_customers', {
                required: 'La descripción de clientes objetivo es obligatoria',
              })}
              rows={3}
              placeholder="Describe qué tipo de clientes buscas, su perfil demográfico, necesidades, etc."
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            {errors.target_customers && (
              <p className="text-red-500 text-xs mt-1">{errors.target_customers.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competidores</label>
            <textarea
              {...register('competitors')}
              rows={3}
              placeholder="Lista tus principales competidores y sus características"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Propuesta de valor única
            </label>
            <textarea
              {...register('unique_selling_points')}
              rows={3}
              placeholder="¿Qué hace a tu empresa única? ¿Por qué tus clientes te eligen a ti y no a la competencia?"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin w-4 h-4 mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4 mr-2" />
                Guardar perfil
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 