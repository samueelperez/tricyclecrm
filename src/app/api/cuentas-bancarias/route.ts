import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET - Obtener todas las cuentas bancarias
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener cuentas bancarias
    const { data, error } = await supabase
      .from('cuentas_bancarias')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error al obtener cuentas bancarias:', error);
      return NextResponse.json(
        { error: 'Error al obtener cuentas bancarias' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en el endpoint de cuentas bancarias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva cuenta bancaria
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener datos de la solicitud
    const body = await request.json();
    
    // Validar campos requeridos
    const requiredFields = ['nombre', 'banco', 'iban', 'swift', 'moneda', 'beneficiario', 'descripcion'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }
    
    // Insertar nueva cuenta bancaria
    const { data, error } = await supabase
      .from('cuentas_bancarias')
      .insert([
        {
          nombre: body.nombre,
          banco: body.banco,
          iban: body.iban,
          swift: body.swift,
          moneda: body.moneda,
          beneficiario: body.beneficiario,
          descripcion: body.descripcion
        }
      ])
      .select();
    
    if (error) {
      console.error('Error al crear cuenta bancaria:', error);
      return NextResponse.json(
        { error: 'Error al crear cuenta bancaria' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Error en el endpoint de cuentas bancarias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar una cuenta bancaria existente
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener datos de la solicitud
    const body = await request.json();
    
    // Validar que se proporcionó un ID
    if (!body.id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la cuenta bancaria' },
        { status: 400 }
      );
    }
    
    // Actualizar cuenta bancaria
    const { data, error } = await supabase
      .from('cuentas_bancarias')
      .update({
        nombre: body.nombre,
        banco: body.banco,
        iban: body.iban,
        swift: body.swift,
        moneda: body.moneda,
        beneficiario: body.beneficiario,
        descripcion: body.descripcion,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select();
    
    if (error) {
      console.error('Error al actualizar cuenta bancaria:', error);
      return NextResponse.json(
        { error: 'Error al actualizar cuenta bancaria' },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Cuenta bancaria no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error en el endpoint de cuentas bancarias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una cuenta bancaria
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener ID de la URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la cuenta bancaria' },
        { status: 400 }
      );
    }
    
    // Eliminar cuenta bancaria
    const { error } = await supabase
      .from('cuentas_bancarias')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error al eliminar cuenta bancaria:', error);
      return NextResponse.json(
        { error: 'Error al eliminar cuenta bancaria' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en el endpoint de cuentas bancarias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 