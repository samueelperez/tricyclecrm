'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Metadata } from 'next';
import UsuariosManager from './usuarios-manager';
import AdminGuard from '@/components/admin/admin-guard';

export default function UsuariosAdminPage() {
  return (
    <AdminGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Administración de Usuarios</h1>
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <UsuariosManager />
        </Suspense>
      </div>
    </AdminGuard>
  );
} 