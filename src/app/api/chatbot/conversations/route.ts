import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Manejar la creación de una nueva conversación
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { title, mode, thread_id } = await request.json();
    
    if (!title || !mode) {
      return NextResponse.json(
        { error: 'Título y modo son requeridos' },
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

    // Crear la conversación
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .insert({
        title,
        mode,
        user_id: user.id,
        thread_id: thread_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error al crear conversación:', error);
      return NextResponse.json(
        { error: 'Error al crear la conversación' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en el endpoint de creación de conversación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Manejar la actualización de una conversación
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { id, title, mode, thread_id } = await request.json();
    
    if (!id) {
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
    const { data: conversation, error: fetchError } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Preparar los campos a actualizar
    const updateFields: any = {
      updated_at: new Date().toISOString()
    };
    
    if (title !== undefined) updateFields.title = title;
    if (mode !== undefined) updateFields.mode = mode;
    if (thread_id !== undefined) updateFields.thread_id = thread_id;

    // Actualizar la conversación
    const { error: updateError } = await supabase
      .from('chatbot_conversations')
      .update(updateFields)
      .eq('id', id);
    
    if (updateError) {
      console.error('Error al actualizar conversación:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la conversación' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error en el endpoint de actualización de conversación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Manejar la eliminación de una conversación
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';
    
    // Obtener el ID del usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    // Eliminar todas las conversaciones del usuario
    if (deleteAll) {
      console.log('Eliminando todas las conversaciones del usuario:', user.id);
      
      // Primero, obtenemos todas las conversaciones del usuario
      const { data: userConversations, error: fetchError } = await supabase
        .from('chatbot_conversations')
        .select('id')
        .eq('user_id', user.id);
      
      if (fetchError) {
        console.error('Error al obtener las conversaciones del usuario:', fetchError);
        return NextResponse.json(
          { error: 'Error al obtener las conversaciones del usuario' },
          { status: 500 }
        );
      }
      
      // Si el usuario tiene conversaciones, eliminamos los mensajes asociados
      if (userConversations && userConversations.length > 0) {
        const conversationIds = userConversations.map(conv => conv.id);
        
        // Eliminar todos los mensajes de todas las conversaciones del usuario
        const { error: messagesError } = await supabase
          .from('chatbot_messages')
          .delete()
          .in('conversation_id', conversationIds);
        
        if (messagesError) {
          console.error('Error al eliminar mensajes de las conversaciones:', messagesError);
          // Continuamos para intentar eliminar las conversaciones de todas formas
        }
        
        // Eliminar todas las conversaciones del usuario
        const { error: deleteError } = await supabase
          .from('chatbot_conversations')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteError) {
          console.error('Error al eliminar todas las conversaciones:', deleteError);
          return NextResponse.json(
            { error: 'Error al eliminar todas las conversaciones' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Todas las conversaciones eliminadas correctamente',
          count: userConversations.length
        });
      } else {
        return NextResponse.json({ 
          success: true, 
          message: 'No hay conversaciones para eliminar',
          count: 0
        });
      }
    }
    
    // Eliminar una sola conversación
    if (!id) {
      return NextResponse.json(
        { error: 'ID de conversación requerido' },
        { status: 400 }
      );
    }

    // Verificar que la conversación pertenece al usuario
    const { data: conversation, error: fetchError } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Eliminar mensajes asociados a la conversación
    const { error: messagesError } = await supabase
      .from('chatbot_messages')
      .delete()
      .eq('conversation_id', id);
    
    if (messagesError) {
      console.error('Error al eliminar mensajes de la conversación:', messagesError);
      // Continuamos para intentar eliminar la conversación de todas formas
    }

    // Eliminar la conversación
    const { error: deleteError } = await supabase
      .from('chatbot_conversations')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error al eliminar conversación:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar la conversación' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en el endpoint de eliminación de conversación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 