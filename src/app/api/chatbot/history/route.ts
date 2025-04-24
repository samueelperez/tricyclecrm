import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    
    // Obtener las conversaciones del usuario
    const { data: conversations, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error al obtener conversaciones:', error);
      return NextResponse.json(
        { error: 'Error al obtener conversaciones' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error en el endpoint de historial:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Ruta para obtener los mensajes de una conversación específica
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { conversationId } = await request.json();
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'ID de conversación requerido' },
        { status: 400 }
      );
    }
    
    // Obtener el ID del usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar que la conversación pertenece al usuario
    const { data: conversation, error: conversationError } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();
    
    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada o no autorizada' },
        { status: 404 }
      );
    }
    
    // Obtener los mensajes de la conversación
    const { data: messages, error: messagesError } = await supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error('Error al obtener mensajes:', messagesError);
      return NextResponse.json(
        { error: 'Error al obtener mensajes' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      conversation, 
      messages 
    });
  } catch (error) {
    console.error('Error en el endpoint de mensajes de conversación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 