import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Obtener el perfil de la empresa
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Obtener el ID del usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    // Obtener el perfil de la empresa
    const { data: profile, error } = await supabase
      .from('company_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 es el código para "No se encontraron resultados"
      throw error;
    }
    
    // Obtener insights del CRM si el perfil existe
    let crmInsights = null;
    if (profile) {
      const { data: insights, error: insightsError } = await supabase
        .rpc('get_crm_insights');
      
      if (!insightsError) {
        crmInsights = insights;
      }
    }
    
    return NextResponse.json({
      profile: profile || null,
      crmInsights
    });
  } catch (error) {
    console.error('Error al obtener el perfil de la empresa:', error);
    return NextResponse.json(
      { error: 'Error al obtener el perfil de la empresa' },
      { status: 500 }
    );
  }
}

// Crear o actualizar el perfil de la empresa
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const profileData = await request.json();
    
    // Obtener el ID del usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar si ya existe un perfil para este usuario
    const { data: existingProfile } = await supabase
      .from('company_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    let result;
    if (existingProfile) {
      // Actualizar perfil existente
      const { data, error } = await supabase
        .from('company_profile')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Crear nuevo perfil
      const { data, error } = await supabase
        .from('company_profile')
        .insert({
          ...profileData,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al guardar el perfil de la empresa:', error);
    return NextResponse.json(
      { error: 'Error al guardar el perfil de la empresa' },
      { status: 500 }
    );
  }
} 