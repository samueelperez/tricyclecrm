// Interfaces para listas de empaque
export interface PackingList {
  id: string
  id_externo: string | null
  fecha: string
  cliente_id: string | null
  cliente_nombre: string
  cliente_direccion: string | null
  peso_total: number
  bales_total: number
  created_at: string
  updated_at: string
}

export interface PackingListItem {
  id: string
  packing_list_id: string
  container: string
  precinto: string
  bales: number
  weight: number
  date: string
  created_at: string
  updated_at: string
}

// Extender Database para incluir las nuevas tablas
export interface Database {
  // ... existing tables ...
  
  public: {
    Tables: {
      // ... other tables ...
      
      packing_lists: {
        Row: PackingList
        Insert: Omit<PackingList, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PackingList, 'id' | 'created_at' | 'updated_at'>>
      }
      
      packing_list_items: {
        Row: PackingListItem
        Insert: Omit<PackingListItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PackingListItem, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
} 