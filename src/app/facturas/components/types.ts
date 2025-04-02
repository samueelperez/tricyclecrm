export interface Factura {
  id: string;
  id_externo?: string;
  numero_factura?: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cliente_id?: number | null;
  proveedor_id?: number | null;
  cliente?: string;
  total: number;
  estado: string;
  divisa: string;
  condiciones_pago?: string;
  ref_proforma?: string | null;
  proforma_id?: number | null;
  notas?: string | null;
  tipo?: 'cliente' | 'proveedor';
}

export type FacturaTab = 'customer' | 'supplier'; 