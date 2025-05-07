'use client';

import { useState, useRef, forwardRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiLoader, FiDownload, FiEye } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Definir la interfaz para el tipo de factura proveedor
interface FacturaProveedor {
  id: number;
  numero_factura?: string;
  fecha_emision?: string;
  created_at?: string;
  descripcion?: string;
  importe?: number;
  proveedor_id?: number;
  metodo_pago?: string;
  notas?: string;
  nombre_archivo?: string;
  ruta_archivo?: string;
  id_fiscal?: string | null;
  cliente_id_fiscal?: string | null;
  proveedor?: {
    id?: number;
    nombre?: string;
    direccion?: string;
    ciudad?: string;
    codigo_postal?: string;
    pais?: string;
    id_fiscal?: string;
  };
  cliente?: {
    id?: number;
    nombre?: string;
    direccion?: string;
    id_fiscal?: string;
  };
  cliente_direccion?: string;
  cliente_id_fiscal?: string;
}

// ... existing code ...