import { Suspense } from 'react';
import CompanyProfileForm from '@/components/company/company-profile-form';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function CompanyProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración de la Empresa</h1>
        <p className="text-gray-600">
          Esta información se utilizará para personalizar el asistente AI y mejorar los resultados de búsqueda.
        </p>
      </div>
      
      <Suspense fallback={<LoadingSpinner />}>
        <CompanyProfileForm />
      </Suspense>
    </div>
  );
} 