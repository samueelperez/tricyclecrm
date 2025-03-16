export interface Proforma {
  id: string;
  id_externo?: string;
  fecha: string;
  cliente_nombre: string;
  monto: number;
  material: string;
}

export type ProformaTab = 'customer' | 'supplier'; 