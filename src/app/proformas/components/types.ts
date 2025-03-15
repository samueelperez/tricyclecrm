export interface Proforma {
  id: number;
  id_externo: string;
  fecha: string;
  cliente_nombre: string;
  monto: number;
  material: string;
}

export type ProformaTab = 'customer' | 'supplier'; 