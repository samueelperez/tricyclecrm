export interface Proforma {
  id: string;
  id_externo?: string;
  fecha: string;
  cliente_id?: number | null;
  monto: number;
  notas?: string;
  puerto?: string;
  origen?: string;
}

export type ProformaTab = 'customer' | 'supplier'; 