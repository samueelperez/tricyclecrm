import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '../database.types';

type Cliente = Database['public']['Tables']['clientes']['Row'];

/**
 * Obtener todos los clientes con paginación
 * @param page Número de página (1-indexed)
 * @param pageSize Cantidad de elementos por página
 * @returns Lista de clientes paginada con metadatos de paginación
 */
export async function getAllClientes(page = 1, pageSize = 10) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  // Calcular rango para paginación
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  try {
    const { data, error, count } = await supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('nombre', { ascending: true });
      
    if (error) throw error;
    
    // Los datos están tipados correctamente como Cliente[]
    return { 
      data, 
      pagination: {
        currentPage: page,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
        totalItems: count || 0,
        pageSize
      } 
    };
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
}

/**
 * Obtener un cliente por su ID
 * @param id ID del cliente
 * @returns Datos del cliente
 */
export async function getClienteById(id: number) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    // data está tipado como Cliente
    return data;
  } catch (error) {
    console.error(`Error al obtener cliente con ID ${id}:`, error);
    throw error;
  }
}

/**
 * Crear un nuevo cliente
 * @param clienteData Datos del cliente a crear
 * @returns El cliente creado
 */
export async function createCliente(clienteData: Omit<Database['public']['Tables']['clientes']['Insert'], 'id'>) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        ...clienteData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
}

/**
 * Actualizar un cliente existente
 * @param id ID del cliente a actualizar
 * @param clienteData Datos actualizados del cliente
 * @returns El cliente actualizado
 */
export async function updateCliente(id: number, clienteData: Partial<Database['public']['Tables']['clientes']['Update']>) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        ...clienteData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error al actualizar cliente con ID ${id}:`, error);
    throw error;
  }
}

/**
 * Eliminar un cliente
 * @param id ID del cliente a eliminar
 * @returns true si se eliminó correctamente
 */
export async function deleteCliente(id: number) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error al eliminar cliente con ID ${id}:`, error);
    throw error;
  }
} 