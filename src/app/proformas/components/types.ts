export interface Proforma {
  id: string;
  id_externo?: string;
  fecha: string;
  cliente_id?: number | null;
  clientes?: { 
    id: number;
    nombre: string;
  } | null;
  material?: string;
  producto?: string;
  monto: number;
  notas?: string;
  puerto?: string;
  origen?: string;
}

export type ProformaTab = 'customer' | 'supplier'; 