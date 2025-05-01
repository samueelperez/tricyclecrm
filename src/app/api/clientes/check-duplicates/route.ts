import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar la sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener los datos del cuerpo de la solicitud
    const clientes = await req.json();
    
    if (!Array.isArray(clientes) || clientes.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron datos de clientes válidos' }, { status: 400 });
    }
    
    // Validar los datos básicos de cada cliente
    const clientesValidados = clientes.map(cliente => {
      // Asegurarnos de que nombre no sea nulo o vacío
      if (!cliente.nombre || String(cliente.nombre).trim() === '') {
        throw new Error('El nombre del cliente es obligatorio');
      }
      
      // Asegurarse de que los campos sean del tipo correcto
      return {
        nombre: String(cliente.nombre || '').trim(),
        id_fiscal: cliente.id_fiscal ? String(cliente.id_fiscal).trim() : null,
        email: cliente.email ? String(cliente.email).trim() : null,
        telefono: cliente.telefono ? String(cliente.telefono).trim() : null,
      };
    });
    
    // Obtener todos los clientes existentes para verificar duplicados
    const { data: clientesExistentes, error: errorConsulta } = await supabase
      .from('clientes')
      .select('id, nombre, id_fiscal, email, telefono');
      
    if (errorConsulta) {
      console.error('Error al consultar clientes existentes:', errorConsulta);
      return NextResponse.json({ error: 'Error al verificar duplicados' }, { status: 500 });
    }
    
    if (!clientesExistentes || clientesExistentes.length === 0) {
      // Si no hay clientes existentes, no puede haber duplicados
      return NextResponse.json({ duplicados: [] });
    }
    
    // Buscar duplicados comparando varios campos
    const duplicados = [];
    
    for (const nuevoCliente of clientesValidados) {
      for (const clienteExistente of clientesExistentes) {
        const coincidencias = [];
        
        // Verificar coincidencia de nombre (ignorando mayúsculas/minúsculas)
        if (nuevoCliente.nombre.toLowerCase() === clienteExistente.nombre.toLowerCase()) {
          coincidencias.push('nombre');
        }
        
        // Verificar coincidencia de ID fiscal (si ambos tienen valor)
        if (nuevoCliente.id_fiscal && 
            clienteExistente.id_fiscal && 
            nuevoCliente.id_fiscal.toLowerCase() === clienteExistente.id_fiscal.toLowerCase()) {
          coincidencias.push('ID fiscal');
        }
        
        // Verificar coincidencia de email (si ambos tienen valor)
        if (nuevoCliente.email && 
            clienteExistente.email && 
            nuevoCliente.email.toLowerCase() === clienteExistente.email.toLowerCase()) {
          coincidencias.push('email');
        }
        
        // Verificar coincidencia de teléfono (si ambos tienen valor)
        if (nuevoCliente.telefono && 
            clienteExistente.telefono && 
            nuevoCliente.telefono.replace(/\s+/g, '') === clienteExistente.telefono.replace(/\s+/g, '')) {
          coincidencias.push('teléfono');
        }
        
        // Si hay al menos una coincidencia, considerar como posible duplicado
        if (coincidencias.length > 0) {
          duplicados.push({
            nuevo: nuevoCliente,
            existente: clienteExistente,
            coincidencias: coincidencias
          });
          // Una vez encontrada la coincidencia, pasar al siguiente cliente nuevo
          break;
        }
      }
    }
    
    return NextResponse.json({ 
      duplicados: duplicados,
      total: duplicados.length
    });
    
  } catch (error: any) {
    console.error('Error al verificar duplicados:', error);
    return NextResponse.json(
      { error: `Error en la verificación: ${error.message || 'Error desconocido'}` }, 
      { status: 500 }
    );
  }
} 