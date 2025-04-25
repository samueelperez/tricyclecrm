export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chatbot_conversations: {
        Row: {
          id: string
          title: string
          mode: string
          user_id: string
          thread_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          mode: string
          user_id: string
          thread_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          mode?: string
          user_id?: string
          thread_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chatbot_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chatbot_conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      albaran_items: {
        Row: {
          cantidad: number
          created_at: string | null
          descripcion: string
          id: number
          id_albaran: number | null
          precio_unitario: number
          total: number
        }
        Insert: {
          cantidad?: number
          created_at?: string | null
          descripcion: string
          id?: number
          id_albaran?: number | null
          precio_unitario?: number
          total?: number
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          descripcion?: string
          id?: number
          id_albaran?: number | null
          precio_unitario?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "albaran_items_id_albaran_fkey"
            columns: ["id_albaran"]
            isOneToOne: false
            referencedRelation: "albaranes"
            referencedColumns: ["id"]
          },
        ]
      }
      albaranes: {
        Row: {
          created_at: string | null
          destino: string | null
          estado: string | null
          fecha: string
          id: number
          id_cliente: number | null
          id_externo: string
          id_proveedor: number | null
          instrucciones: string | null
          material: string | null
          metodo_envio: string | null
          monto: number
          negocio_id: number | null
          notas: string | null
          numero_albaran: string | null
          origen: string | null
          peso_total: number | null
          tipo_contenedor: string | null
          total: number | null
          tracking_number: string | null
          transportista: string
          updated_at: string | null
          valor_declarado: number | null
        }
        Insert: {
          created_at?: string | null
          destino?: string | null
          estado?: string | null
          fecha: string
          id?: number
          id_cliente?: number | null
          id_externo: string
          id_proveedor?: number | null
          instrucciones?: string | null
          material?: string | null
          metodo_envio?: string | null
          monto: number
          negocio_id?: number | null
          notas?: string | null
          numero_albaran?: string | null
          origen?: string | null
          peso_total?: number | null
          tipo_contenedor?: string | null
          total?: number | null
          tracking_number?: string | null
          transportista: string
          updated_at?: string | null
          valor_declarado?: number | null
        }
        Update: {
          created_at?: string | null
          destino?: string | null
          estado?: string | null
          fecha?: string
          id?: number
          id_cliente?: number | null
          id_externo?: string
          id_proveedor?: number | null
          instrucciones?: string | null
          material?: string | null
          metodo_envio?: string | null
          monto?: number
          negocio_id?: number | null
          notas?: string | null
          numero_albaran?: string | null
          origen?: string | null
          peso_total?: number | null
          tipo_contenedor?: string | null
          total?: number | null
          tracking_number?: string | null
          transportista?: string
          updated_at?: string | null
          valor_declarado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "albaranes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      archivos: {
        Row: {
          carpeta_id: string | null
          creado_por: string
          created_at: string | null
          id: string
          mimetype: string | null
          nombre: string
          path: string
          tamaño: number | null
        }
        Insert: {
          carpeta_id?: string | null
          creado_por: string
          created_at?: string | null
          id?: string
          mimetype?: string | null
          nombre: string
          path: string
          tamaño?: number | null
        }
        Update: {
          carpeta_id?: string | null
          creado_por?: string
          created_at?: string | null
          id?: string
          mimetype?: string | null
          nombre?: string
          path?: string
          tamaño?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "archivos_carpeta_id_fkey"
            columns: ["carpeta_id"]
            isOneToOne: false
            referencedRelation: "carpetas"
            referencedColumns: ["id"]
          },
        ]
      }
      archivos_tareas: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          ruta: string
          tamano: number | null
          tarea_id: string
          tipo: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          ruta: string
          tamano?: number | null
          tarea_id: string
          tipo?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          ruta?: string
          tamano?: number | null
          tarea_id?: string
          tipo?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tarea"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      carpetas: {
        Row: {
          carpeta_padre: string | null
          creado_por: string
          created_at: string | null
          id: string
          nombre: string
        }
        Insert: {
          carpeta_padre?: string | null
          creado_por: string
          created_at?: string | null
          id?: string
          nombre: string
        }
        Update: {
          carpeta_padre?: string | null
          creado_por?: string
          created_at?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "carpetas_carpeta_padre_fkey"
            columns: ["carpeta_padre"]
            isOneToOne: false
            referencedRelation: "carpetas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_tareas: {
        Row: {
          color: string
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          ciudad: string | null
          codigo_postal: string | null
          contacto_nombre: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          id: number
          id_fiscal: string | null
          nombre: string
          pais: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          ciudad?: string | null
          codigo_postal?: string | null
          contacto_nombre?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          id_fiscal?: string | null
          nombre: string
          pais?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          ciudad?: string | null
          codigo_postal?: string | null
          contacto_nombre?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          id_fiscal?: string | null
          nombre?: string
          pais?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      columnas_tablero: {
        Row: {
          color: string | null
          created_at: string | null
          descripcion: string | null
          icon: string | null
          id: string
          nombre: string
          orden: number
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          icon?: string | null
          id?: string
          nombre: string
          orden: number
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          icon?: string | null
          id?: string
          nombre?: string
          orden?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      comentarios_tareas: {
        Row: {
          contenido: string
          created_at: string | null
          id: string
          tarea_id: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          contenido: string
          created_at?: string | null
          id?: string
          tarea_id: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          contenido?: string
          created_at?: string | null
          id?: string
          tarea_id?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tarea"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      envios: {
        Row: {
          cliente: string
          created_at: string | null
          destino: string
          estado: string | null
          fecha_envio: string | null
          id: number
          num_paquetes: number | null
          numero_envio: string
          peso_total: number | null
          transportista: string
          updated_at: string | null
        }
        Insert: {
          cliente: string
          created_at?: string | null
          destino: string
          estado?: string | null
          fecha_envio?: string | null
          id?: number
          num_paquetes?: number | null
          numero_envio: string
          peso_total?: number | null
          transportista: string
          updated_at?: string | null
        }
        Update: {
          cliente?: string
          created_at?: string | null
          destino?: string
          estado?: string | null
          fecha_envio?: string | null
          id?: number
          num_paquetes?: number | null
          numero_envio?: string
          peso_total?: number | null
          transportista?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      etiquetas_tareas: {
        Row: {
          color: string
          created_at: string | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      facturas_cliente: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha: string
          id: number
          id_externo: string
          material: string | null
          monto: number
          negocio_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha: string
          id?: number
          id_externo: string
          material?: string | null
          monto: number
          negocio_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha?: string
          id?: number
          id_externo?: string
          material?: string | null
          monto?: number
          negocio_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_cliente_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas_proveedor: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha: string
          id: number
          id_externo: string
          material: string | null
          monto: number
          negocio_id: number | null
          proveedor_id: number | null
          proveedor_nombre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha: string
          id?: number
          id_externo: string
          material?: string | null
          monto: number
          negocio_id?: number | null
          proveedor_id?: number | null
          proveedor_nombre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha?: string
          id?: number
          id_externo?: string
          material?: string | null
          monto?: number
          negocio_id?: number | null
          proveedor_id?: number | null
          proveedor_nombre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_proveedor_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_proveedor_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_tareas: {
        Row: {
          created_at: string | null
          id: string
          tarea_id: string
          tipo_cambio: string
          usuario_id: string | null
          valor_anterior: Json | null
          valor_nuevo: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          tarea_id: string
          tipo_cambio: string
          usuario_id?: string | null
          valor_anterior?: Json | null
          valor_nuevo?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          tarea_id?: string
          tipo_cambio?: string
          usuario_id?: string | null
          valor_anterior?: Json | null
          valor_nuevo?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tarea"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      materiales: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: number
          nombre: string
          unidad_medida: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre: string
          unidad_medida?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre?: string
          unidad_medida?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          applied_at: string
          id: number
          name: string
        }
        Insert: {
          applied_at?: string
          id?: number
          name: string
        }
        Update: {
          applied_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      negocios: {
        Row: {
          cliente_id: number | null
          cliente_nombre: string
          created_at: string | null
          estado: string | null
          fecha_creacion: string
          fecha_entrega: string | null
          fecha_envio: string | null
          fecha_estimada_finalizacion: string | null
          fecha_estimada_llegada: string | null
          id: number
          id_externo: string
          notas: string | null
          progreso: number | null
          total_gastos: number | null
          total_ingresos: number | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: number | null
          cliente_nombre: string
          created_at?: string | null
          estado?: string | null
          fecha_creacion: string
          fecha_entrega?: string | null
          fecha_envio?: string | null
          fecha_estimada_finalizacion?: string | null
          fecha_estimada_llegada?: string | null
          id?: number
          id_externo: string
          notas?: string | null
          progreso?: number | null
          total_gastos?: number | null
          total_ingresos?: number | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: number | null
          cliente_nombre?: string
          created_at?: string | null
          estado?: string | null
          fecha_creacion?: string
          fecha_entrega?: string | null
          fecha_envio?: string | null
          fecha_estimada_finalizacion?: string | null
          fecha_estimada_llegada?: string | null
          id?: number
          id_externo?: string
          notas?: string | null
          progreso?: number | null
          total_gastos?: number | null
          total_ingresos?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negocios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios_materiales: {
        Row: {
          cantidad: number | null
          created_at: string | null
          id: number
          material_id: number | null
          material_nombre: string
          negocio_id: number | null
        }
        Insert: {
          cantidad?: number | null
          created_at?: string | null
          id?: number
          material_id?: number | null
          material_nombre: string
          negocio_id?: number | null
        }
        Update: {
          cantidad?: number | null
          created_at?: string | null
          id?: number
          material_id?: number | null
          material_nombre?: string
          negocio_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "negocios_materiales_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_materiales_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios_proveedores: {
        Row: {
          created_at: string | null
          id: number
          negocio_id: number | null
          proveedor_id: number | null
          proveedor_nombre: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          negocio_id?: number | null
          proveedor_id?: number | null
          proveedor_nombre: string
        }
        Update: {
          created_at?: string | null
          id?: number
          negocio_id?: number | null
          proveedor_id?: number | null
          proveedor_nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocios_proveedores_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_proveedores_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          cargo: string | null
          created_at: string | null
          id: string
          nombre: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          id: string
          nombre?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          id?: string
          nombre?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permisos_archivos: {
        Row: {
          archivo_id: string | null
          carpeta_id: string | null
          created_at: string | null
          id: string
          nivel_permiso: string
          usuario_id: string
        }
        Insert: {
          archivo_id?: string | null
          carpeta_id?: string | null
          created_at?: string | null
          id?: string
          nivel_permiso: string
          usuario_id: string
        }
        Update: {
          archivo_id?: string | null
          carpeta_id?: string | null
          created_at?: string | null
          id?: string
          nivel_permiso?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permisos_archivos_archivo_id_fkey"
            columns: ["archivo_id"]
            isOneToOne: false
            referencedRelation: "archivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permisos_archivos_carpeta_id_fkey"
            columns: ["carpeta_id"]
            isOneToOne: false
            referencedRelation: "carpetas"
            referencedColumns: ["id"]
          },
        ]
      }
      proformas: {
        Row: {
          cantidad_contenedores: number | null
          cliente_id: number | null
          created_at: string | null
          cuenta_bancaria: string | null
          fecha: string
          id: number
          id_externo: string
          id_fiscal: string | null
          monto: number
          negocio_id: number | null
          notas: string | null
          origen: string | null
          peso_total: number | null
          puerto: string | null
          terminos_entrega: string | null
          terminos_pago: string | null
          updated_at: string | null
        }
        Insert: {
          cantidad_contenedores?: number | null
          cliente_id?: number | null
          created_at?: string | null
          cuenta_bancaria?: string | null
          fecha: string
          id?: number
          id_externo: string
          id_fiscal?: string | null
          monto: number
          negocio_id?: number | null
          notas?: string | null
          origen?: string | null
          peso_total?: number | null
          puerto?: string | null
          terminos_entrega?: string | null
          terminos_pago?: string | null
          updated_at?: string | null
        }
        Update: {
          cantidad_contenedores?: number | null
          cliente_id?: number | null
          created_at?: string | null
          cuenta_bancaria?: string | null
          fecha?: string
          id?: number
          id_externo?: string
          id_fiscal?: string | null
          monto?: number
          negocio_id?: number | null
          notas?: string | null
          origen?: string | null
          peso_total?: number | null
          puerto?: string | null
          terminos_entrega?: string | null
          terminos_pago?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proformas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proformas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      proformas_productos: {
        Row: {
          cantidad: number
          created_at: string | null
          descripcion: string
          id: number
          peso: number | null
          precio_unitario: number
          proforma_id: number | null
          tipo_empaque: string | null
          valor_total: number | null
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          descripcion: string
          id?: number
          peso?: number | null
          precio_unitario: number
          proforma_id?: number | null
          tipo_empaque?: string | null
          valor_total?: number | null
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          descripcion?: string
          id?: number
          peso?: number | null
          precio_unitario?: number
          proforma_id?: number | null
          tipo_empaque?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proformas_productos_proforma_id_fkey"
            columns: ["proforma_id"]
            isOneToOne: false
            referencedRelation: "proformas"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          ciudad: string | null
          codigo_postal: string | null
          contacto_nombre: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          id: number
          id_fiscal: string | null
          nombre: string
          pais: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          ciudad?: string | null
          codigo_postal?: string | null
          contacto_nombre?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          id_fiscal?: string | null
          nombre: string
          pais?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          ciudad?: string | null
          codigo_postal?: string | null
          contacto_nombre?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          id_fiscal?: string | null
          nombre?: string
          pais?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recibos: {
        Row: {
          archivo_adjunto: string | null
          created_at: string | null
          fecha_factura: string
          id: number
          monto_total: number
          negocio_id: number | null
          notas: string | null
          proveedor: string
          updated_at: string | null
        }
        Insert: {
          archivo_adjunto?: string | null
          created_at?: string | null
          fecha_factura: string
          id?: number
          monto_total: number
          negocio_id?: number | null
          notas?: string | null
          proveedor: string
          updated_at?: string | null
        }
        Update: {
          archivo_adjunto?: string | null
          created_at?: string | null
          fecha_factura?: string
          id?: number
          monto_total?: number
          negocio_id?: number | null
          notas?: string | null
          proveedor?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recibos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas: {
        Row: {
          asignado_a: string | null
          categoria_id: string | null
          columna_id: string
          completado: boolean | null
          created_at: string | null
          descripcion: string | null
          estimacion_horas: number | null
          fecha_inicio: string | null
          fecha_limite: string | null
          horas_trabajadas: number | null
          id: string
          porcentaje_completado: number | null
          prioridad: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          asignado_a?: string | null
          categoria_id?: string | null
          columna_id: string
          completado?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          estimacion_horas?: number | null
          fecha_inicio?: string | null
          fecha_limite?: string | null
          horas_trabajadas?: number | null
          id?: string
          porcentaje_completado?: number | null
          prioridad?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          asignado_a?: string | null
          categoria_id?: string | null
          columna_id?: string
          completado?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          estimacion_horas?: number | null
          fecha_inicio?: string | null
          fecha_limite?: string | null
          horas_trabajadas?: number | null
          id?: string
          porcentaje_completado?: number | null
          prioridad?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_categoria"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_tareas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_columna"
            columns: ["columna_id"]
            isOneToOne: false
            referencedRelation: "columnas_tablero"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tareas_asignado_a"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_etiquetas: {
        Row: {
          created_at: string | null
          etiqueta_id: string
          tarea_id: string
        }
        Insert: {
          created_at?: string | null
          etiqueta_id: string
          tarea_id: string
        }
        Update: {
          created_at?: string | null
          etiqueta_id?: string
          tarea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_etiqueta"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "etiquetas_tareas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tarea"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: {
          sql: string
        }
        Returns: undefined
      }
      get_columns: {
        Args: {
          table_name: string
        }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: string
          column_default: string
          constraint_type: string
        }[]
      }
      get_indexes: {
        Args: {
          table_name: string
        }
        Returns: {
          index_name: string
          column_name: string
        }[]
      }
      get_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      table_exists: {
        Args: {
          table_name: string
        }
        Returns: boolean
      }
      update_negocio_totals: {
        Args: {
          negocio_id_param: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
