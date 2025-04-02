"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiFolder, FiFile, FiUpload, FiTrash2, FiEye, 
  FiDownload, FiPlus, FiUsers, FiFolderPlus, FiSearch,
  FiCloud, FiX, FiArrowLeft
} from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionAlmacenamiento } from "@/lib/supabase";

type Carpeta = {
  id: string;
  nombre: string;
  carpeta_padre: string | null;
  creado_por: string;
  created_at: string;
};

type Archivo = {
  id: string;
  nombre: string;
  path: string;
  mimetype: string;
  tamaño: number;
  carpeta_id: string | null;
  creado_por: string;
  created_at: string;
};

type Usuario = {
  id: string;
  email: string;
  nombre?: string;
};

type Permiso = {
  id: string;
  archivo_id: string | null;
  carpeta_id: string | null;
  usuario_id: string;
  nivel_permiso: 'lectura' | 'escritura' | 'administrador';
  usuario?: Usuario;
};

export default function ArchivosPage() {
  const [carpetaActual, setCarpetaActual] = useState<string | null>('00000000-0000-0000-0000-000000000000');
  const [carpetas, setCarpetas] = useState<Carpeta[]>([]);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [rutaCarpetas, setRutaCarpetas] = useState<Carpeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarModalSubida, setMostrarModalSubida] = useState(false);
  const [mostrarModalNuevaCarpeta, setMostrarModalNuevaCarpeta] = useState(false);
  const [mostrarModalPermisos, setMostrarModalPermisos] = useState(false);
  const [elementoSeleccionado, setElementoSeleccionado] = useState<any>(null);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [nuevoPermiso, setNuevoPermiso] = useState({
    usuario_id: "",
    nivel_permiso: "lectura" as 'lectura' | 'escritura' | 'administrador'
  });
  const [usuarioActual, setUsuarioActual] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    inicializarYCargarDatos();
  }, []);

  const inicializarYCargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = getSupabaseClient();
      
      // Obtener información del usuario actual
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUsuarioActual(session.user.id);
        
        // Para la demo, simplemente usaremos al usuario actual para la gestión de permisos
        setUsuarios([{
          id: session.user.id,
          email: session.user.email || 'Usuario actual'
        }]);
      }
      
      // Ejecutar la migración para crear las tablas si no existen
      console.log('Iniciando migración de almacenamiento...');
      const resultadoMigracion = await ejecutarMigracionAlmacenamiento();
      
      if (!resultadoMigracion.success) {
        console.error("Error en migración:", resultadoMigracion);
        
        // Mensaje con instrucciones para crear tablas manualmente
        const mensajeSql = `
Error inicializando el sistema de archivos: ${resultadoMigracion.message}

Es posible que necesites crear las tablas manualmente desde el Panel SQL de Supabase:

1. Accede al Panel de Supabase y ve a la sección SQL Editor
2. Crea la tabla carpetas:
   CREATE TABLE IF NOT EXISTS carpetas (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     nombre TEXT NOT NULL,
     carpeta_padre UUID REFERENCES carpetas(id),
     creado_por UUID NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

3. Crea la tabla archivos:
   CREATE TABLE IF NOT EXISTS archivos (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     nombre TEXT NOT NULL,
     path TEXT NOT NULL,
     mimetype TEXT,
     tamaño BIGINT,
     carpeta_id UUID REFERENCES carpetas(id),
     creado_por UUID NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

4. Crea la tabla permisos:
   CREATE TABLE IF NOT EXISTS permisos_archivos (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     archivo_id UUID REFERENCES archivos(id) ON DELETE CASCADE,
     carpeta_id UUID REFERENCES carpetas(id) ON DELETE CASCADE,
     usuario_id UUID NOT NULL,
     nivel_permiso TEXT NOT NULL CHECK (nivel_permiso IN ('lectura', 'escritura', 'administrador')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     CONSTRAINT check_target_type CHECK (
       (archivo_id IS NULL AND carpeta_id IS NOT NULL) OR
       (archivo_id IS NOT NULL AND carpeta_id IS NULL)
     )
   );

5. Crea un bucket llamado 'archivos' en la sección Storage
`;
        
        setError(mensajeSql);
        setLoading(false);
        return;
      }
      
      console.log('Migración completada, cargando carpeta raíz...');
      
      // Cargar contenido de la carpeta raíz
      await cargarContenidoCarpeta('00000000-0000-0000-0000-000000000000');
      
    } catch (error: any) {
      console.error("Error:", error);
      setError(`Error desconocido al inicializar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cargarContenidoCarpeta = async (carpetaId: string | null) => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = getSupabaseClient();
      
      // Establecer la carpeta actual
      setCarpetaActual(carpetaId);
      
      // Cargar carpetas dentro de la carpeta actual
      const { data: datosCarpetas, error: errorCarpetas } = await supabase
        .from('carpetas')
        .select('*')
        .eq('carpeta_padre', carpetaId)
        .order('nombre');
        
      if (errorCarpetas) {
        setError(`Error cargando carpetas: ${errorCarpetas.message}`);
      } else {
        setCarpetas(datosCarpetas || []);
      }
      
      // Cargar archivos dentro de la carpeta actual
      const { data: datosArchivos, error: errorArchivos } = await supabase
        .from('archivos')
        .select('*')
        .eq('carpeta_id', carpetaId)
        .order('nombre');
        
      if (errorArchivos) {
        setError(`Error cargando archivos: ${errorArchivos.message}`);
      } else {
        setArchivos(datosArchivos || []);
      }
      
      // Actualizar ruta de navegación
      if (carpetaId) {
        await actualizarRutaCarpetas(carpetaId);
      }
      
    } catch (error: any) {
      console.error("Error:", error);
      setError(`Error desconocido al cargar contenido: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const actualizarRutaCarpetas = async (carpetaId: string) => {
    try {
      const supabase = getSupabaseClient();
      const ruta: Carpeta[] = [];
      
      if (carpetaId === '00000000-0000-0000-0000-000000000000') {
        const { data: carpetaRaiz } = await supabase
          .from('carpetas')
          .select('*')
          .eq('id', carpetaId)
          .single();
          
        if (carpetaRaiz) {
          setRutaCarpetas([carpetaRaiz]);
        }
        return;
      }
      
      // Construir ruta desde la carpeta actual hasta la raíz
      let actualId = carpetaId;
      
      while (actualId) {
        const { data: carpeta, error } = await supabase
          .from('carpetas')
          .select('*')
          .eq('id', actualId)
          .single();
          
        if (error) break;
        
        ruta.unshift(carpeta);
        
        if (carpeta.carpeta_padre === null) break;
        actualId = carpeta.carpeta_padre;
      }
      
      // Si la raíz no está en la ruta, añadirla al principio
      if (ruta.length > 0 && ruta[0].id !== '00000000-0000-0000-0000-000000000000') {
        const { data: carpetaRaiz } = await supabase
          .from('carpetas')
          .select('*')
          .eq('id', '00000000-0000-0000-0000-000000000000')
          .single();
          
        if (carpetaRaiz) {
          ruta.unshift(carpetaRaiz);
        }
      }
      
      setRutaCarpetas(ruta);
    } catch (error) {
      console.error("Error al actualizar ruta:", error);
    }
  };

  const crearCarpeta = async () => {
    if (!nombreNuevaCarpeta.trim()) {
      setError("El nombre de la carpeta no puede estar vacío");
      return;
    }
    
    try {
      const supabase = getSupabaseClient();
      
      const { data: nuevaCarpeta, error } = await supabase
        .from('carpetas')
        .insert({
          nombre: nombreNuevaCarpeta.trim(),
          carpeta_padre: carpetaActual,
          creado_por: usuarioActual
        })
        .select()
        .single();
        
      if (error) {
        setError(`Error al crear carpeta: ${error.message}`);
        return;
      }
      
      // Actualizar lista de carpetas
      setCarpetas([...carpetas, nuevaCarpeta]);
      
      // Limpiar y cerrar modal
      setNombreNuevaCarpeta("");
      setMostrarModalNuevaCarpeta(false);
      
    } catch (error: any) {
      console.error("Error al crear carpeta:", error);
      setError(`Error al crear carpeta: ${error.message}`);
    }
  };

  const subirArchivo = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    if (!evento.target.files || evento.target.files.length === 0) {
      return;
    }
    
    try {
      const file = evento.target.files[0];
      const supabase = getSupabaseClient();
      
      // Generar nombre único para el archivo
      const extension = file.name.split('.').pop();
      const nombreArchivo = `${Date.now()}_${file.name}`;
      const rutaArchivo = carpetaActual ? `${carpetaActual}/${nombreArchivo}` : nombreArchivo;
      
      // Subir archivo a Storage
      const { data: archivoSubido, error: errorStorage } = await supabase.storage
        .from('archivos')
        .upload(rutaArchivo, file);
        
      if (errorStorage) {
        setError(`Error al subir archivo: ${errorStorage.message}`);
        return;
      }
      
      // Crear registro en la tabla de archivos
      const { data: nuevoArchivo, error: errorDB } = await supabase
        .from('archivos')
        .insert({
          nombre: file.name,
          path: archivoSubido.path,
          mimetype: file.type,
          tamaño: file.size,
          carpeta_id: carpetaActual,
          creado_por: usuarioActual
        })
        .select()
        .single();
        
      if (errorDB) {
        setError(`Error al registrar archivo: ${errorDB.message}`);
        return;
      }
      
      // Actualizar lista de archivos
      setArchivos([...archivos, nuevoArchivo]);
      
      // Cerrar modal
      setMostrarModalSubida(false);
      
    } catch (error: any) {
      console.error("Error al subir archivo:", error);
      setError(`Error al subir archivo: ${error.message}`);
    }
  };

  const eliminarElemento = async (id: string, tipo: 'archivo' | 'carpeta') => {
    if (!confirm(`¿Está seguro de que desea eliminar ${tipo === 'archivo' ? 'este archivo' : 'esta carpeta'}? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      const supabase = getSupabaseClient();
      
      if (tipo === 'archivo') {
        // Obtener ruta del archivo para eliminarlo de Storage
        const { data: archivo, error: errorConsulta } = await supabase
          .from('archivos')
          .select('path')
          .eq('id', id)
          .single();
          
        if (errorConsulta) {
          setError(`Error al buscar archivo: ${errorConsulta.message}`);
          return;
        }
        
        // Eliminar archivo de Storage
        const { error: errorStorage } = await supabase.storage
          .from('archivos')
          .remove([archivo.path]);
          
        if (errorStorage) {
          setError(`Error al eliminar archivo de almacenamiento: ${errorStorage.message}`);
          return;
        }
        
        // Eliminar registro de la base de datos
        const { error: errorDB } = await supabase
          .from('archivos')
          .delete()
          .eq('id', id);
          
        if (errorDB) {
          setError(`Error al eliminar registro: ${errorDB.message}`);
          return;
        }
        
        // Actualizar lista de archivos
        setArchivos(archivos.filter(a => a.id !== id));
        
      } else { // Carpeta
        // Comprobar si la carpeta contiene elementos
        const { count: countArchivos } = await supabase
          .from('archivos')
          .select('id', { count: 'exact', head: true })
          .eq('carpeta_id', id);
          
        const { count: countCarpetas } = await supabase
          .from('carpetas')
          .select('id', { count: 'exact', head: true })
          .eq('carpeta_padre', id);
          
        if ((countArchivos || 0) > 0 || (countCarpetas || 0) > 0) {
          if (!confirm('Esta carpeta contiene elementos. ¿Está seguro de que desea eliminarla y todo su contenido?')) {
            return;
          }
          
          // Implementar eliminación recursiva (simplificada para la demo)
          // En una implementación real, se haría de forma recursiva
          
          // Eliminar archivos de la carpeta
          const { data: archivosEnCarpeta } = await supabase
            .from('archivos')
            .select('path')
            .eq('carpeta_id', id);
            
          if (archivosEnCarpeta && archivosEnCarpeta.length > 0) {
            const rutasArchivos = archivosEnCarpeta.map(a => a.path);
            
            // Eliminar archivos de Storage
            await supabase.storage
              .from('archivos')
              .remove(rutasArchivos);
              
            // Eliminar registros de archivos
            await supabase
              .from('archivos')
              .delete()
              .eq('carpeta_id', id);
          }
          
          // Eliminar subcarpetas (solo nivel 1 por simplicidad)
          await supabase
            .from('carpetas')
            .delete()
            .eq('carpeta_padre', id);
        }
        
        // Eliminar la carpeta
        const { error: errorDB } = await supabase
          .from('carpetas')
          .delete()
          .eq('id', id);
          
        if (errorDB) {
          setError(`Error al eliminar carpeta: ${errorDB.message}`);
          return;
        }
        
        // Actualizar lista de carpetas
        setCarpetas(carpetas.filter(c => c.id !== id));
      }
      
    } catch (error: any) {
      console.error(`Error al eliminar ${tipo}:`, error);
      setError(`Error al eliminar ${tipo}: ${error.message}`);
    }
  };

  const gestionarPermisos = (elemento: any, tipo: 'archivo' | 'carpeta') => {
    setElementoSeleccionado({ ...elemento, tipo });
    cargarPermisosElemento(elemento.id, tipo);
    setMostrarModalPermisos(true);
  };

  const cargarPermisosElemento = async (id: string, tipo: 'archivo' | 'carpeta') => {
    try {
      const supabase = getSupabaseClient();
      
      const { data: permisosElemento, error } = await supabase
        .from('permisos_archivos')
        .select(`
          *,
          usuario:usuario_id (
            id,
            email
          )
        `)
        .eq(tipo === 'archivo' ? 'archivo_id' : 'carpeta_id', id);
        
      if (error) {
        console.error("Error al cargar permisos:", error);
        return;
      }
      
      setPermisos(permisosElemento || []);
      
    } catch (error) {
      console.error("Error al cargar permisos:", error);
    }
  };

  const agregarPermiso = async () => {
    if (!elementoSeleccionado || !nuevoPermiso.usuario_id) {
      setError("Selecciona un usuario para asignar permisos");
      return;
    }
    
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('permisos_archivos')
        .insert({
          [elementoSeleccionado.tipo === 'archivo' ? 'archivo_id' : 'carpeta_id']: elementoSeleccionado.id,
          usuario_id: nuevoPermiso.usuario_id,
          nivel_permiso: nuevoPermiso.nivel_permiso
        });
        
      if (error) {
        setError(`Error al asignar permiso: ${error.message}`);
        return;
      }
      
      // Recargar permisos
      cargarPermisosElemento(
        elementoSeleccionado.id, 
        elementoSeleccionado.tipo
      );
      
      // Limpiar formulario
      setNuevoPermiso({
        usuario_id: "",
        nivel_permiso: "lectura"
      });
      
    } catch (error: any) {
      console.error("Error al asignar permiso:", error);
      setError(`Error al asignar permiso: ${error.message}`);
    }
  };

  const eliminarPermiso = async (permisoId: string) => {
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('permisos_archivos')
        .delete()
        .eq('id', permisoId);
        
      if (error) {
        setError(`Error al eliminar permiso: ${error.message}`);
        return;
      }
      
      // Actualizar lista de permisos
      setPermisos(permisos.filter(p => p.id !== permisoId));
      
    } catch (error: any) {
      console.error("Error al eliminar permiso:", error);
      setError(`Error al eliminar permiso: ${error.message}`);
    }
  };

  const descargarArchivo = async (archivo: Archivo) => {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase.storage
        .from('archivos')
        .download(archivo.path);
        
      if (error) {
        setError(`Error al descargar archivo: ${error.message}`);
        return;
      }
      
      // Crear enlace de descarga
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = archivo.nombre;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error: any) {
      console.error("Error al descargar archivo:", error);
      setError(`Error al descargar archivo: ${error.message}`);
    }
  };

  // Filtrar elementos según búsqueda
  const elementosFiltrados = {
    carpetas: carpetas.filter(c => 
      c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    ),
    archivos: archivos.filter(a => 
      a.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
  };

  // Formatear tamaño de archivo
  const formatearTamaño = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 sm:mb-0">
            Almacenamiento en la Nube
          </h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setMostrarModalSubida(true)}
              className="inline-flex justify-center items-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <FiUpload className="mr-2 -ml-1 h-5 w-5" /> Subir Archivo
            </button>
            <button
              onClick={() => setMostrarModalNuevaCarpeta(true)}
              className="inline-flex justify-center items-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <FiFolderPlus className="mr-2 -ml-1 h-5 w-5" /> Nueva Carpeta
            </button>
          </div>
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0 text-red-500">
                <FiX className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navegación de carpetas (breadcrumb) */}
        <div className="mb-6 flex flex-wrap items-center space-x-2 bg-white p-3 rounded-lg shadow-sm">
          {rutaCarpetas.map((carpeta, index) => (
            <div key={carpeta.id} className="flex items-center">
              {index > 0 && <span className="mx-2 text-gray-400">/</span>}
              <button
                onClick={() => cargarContenidoCarpeta(carpeta.id)}
                className="text-indigo-600 hover:text-indigo-900 font-medium"
              >
                {index === 0 ? 'Inicio' : carpeta.nombre}
              </button>
            </div>
          ))}
        </div>
        
        {/* Búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Buscar archivos o carpetas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 pr-4 py-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>
        
        {/* Contenido principal */}
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Cargando contenido...</p>
          </div>
        ) : elementosFiltrados.carpetas.length === 0 && elementosFiltrados.archivos.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-10 text-center">
            <div className="flex justify-center mb-4">
              <FiCloud className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg mb-4">
              {busqueda ? 'No se encontraron elementos con la búsqueda actual' : 'Esta carpeta está vacía'}
            </p>
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')}
                className="text-indigo-500 hover:text-indigo-700 hover:underline focus:outline-none"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* Carpetas */}
            {elementosFiltrados.carpetas.map(carpeta => (
              <div key={carpeta.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => cargarContenidoCarpeta(carpeta.id)}
                    >
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <FiFolder className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">{carpeta.nombre}</h3>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => gestionarPermisos(carpeta, 'carpeta')}
                        className="text-gray-500 hover:text-indigo-600 transition-colors duration-150"
                        title="Gestionar permisos"
                      >
                        <FiUsers className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarElemento(carpeta.id, 'carpeta')}
                        className="text-gray-500 hover:text-red-600 transition-colors duration-150"
                        title="Eliminar carpeta"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Archivos */}
            {elementosFiltrados.archivos.map(archivo => (
              <div key={archivo.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiFile className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">{archivo.nombre}</h3>
                        <p className="text-xs text-gray-500">{formatearTamaño(archivo.tamaño)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => descargarArchivo(archivo)}
                      className="text-gray-500 hover:text-green-600 transition-colors duration-150"
                      title="Descargar archivo"
                    >
                      <FiDownload className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => gestionarPermisos(archivo, 'archivo')}
                      className="text-gray-500 hover:text-indigo-600 transition-colors duration-150"
                      title="Gestionar permisos"
                    >
                      <FiUsers className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => eliminarElemento(archivo.id, 'archivo')}
                      className="text-gray-500 hover:text-red-600 transition-colors duration-150"
                      title="Eliminar archivo"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal de subida de archivos */}
      {mostrarModalSubida && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Subir Archivo
                    </h3>
                    <div className="mt-2">
                      <input
                        type="file"
                        onChange={subirArchivo}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setMostrarModalSubida(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de nueva carpeta */}
      {mostrarModalNuevaCarpeta && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Nueva Carpeta
                    </h3>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Nombre de la carpeta"
                        value={nombreNuevaCarpeta}
                        onChange={(e) => setNombreNuevaCarpeta(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={crearCarpeta}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevaCarpeta(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de gestión de permisos */}
      {mostrarModalPermisos && elementoSeleccionado && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Gestionar Permisos - {elementoSeleccionado.nombre}
                    </h3>
                    
                    {/* Lista de permisos actuales */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700">Permisos actuales</h4>
                      {permisos.length === 0 ? (
                        <p className="text-sm text-gray-500 mt-2">No hay permisos asignados</p>
                      ) : (
                        <ul className="mt-2 divide-y divide-gray-200">
                          {permisos.map(permiso => (
                            <li key={permiso.id} className="py-2 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {permiso.usuario?.email || 'Usuario'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {permiso.nivel_permiso.charAt(0).toUpperCase() + permiso.nivel_permiso.slice(1)}
                                </p>
                              </div>
                              <button
                                onClick={() => eliminarPermiso(permiso.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    {/* Formulario para añadir nuevo permiso */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700">Añadir permiso</h4>
                      <div className="mt-2 space-y-3">
                        <div>
                          <label htmlFor="usuario" className="block text-xs font-medium text-gray-700">
                            Usuario
                          </label>
                          <select
                            id="usuario"
                            value={nuevoPermiso.usuario_id}
                            onChange={(e) => setNuevoPermiso({...nuevoPermiso, usuario_id: e.target.value})}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                            <option value="">Seleccionar usuario</option>
                            {usuarios.map(usuario => (
                              <option key={usuario.id} value={usuario.id}>
                                {usuario.email}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="nivel-permiso" className="block text-xs font-medium text-gray-700">
                            Nivel de permiso
                          </label>
                          <select
                            id="nivel-permiso"
                            value={nuevoPermiso.nivel_permiso}
                            onChange={(e) => setNuevoPermiso({...nuevoPermiso, nivel_permiso: e.target.value as 'lectura' | 'escritura' | 'administrador'})}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                            <option value="lectura">Lectura</option>
                            <option value="escritura">Escritura</option>
                            <option value="administrador">Administrador</option>
                          </select>
                        </div>
                        
                        <button
                          type="button"
                          onClick={agregarPermiso}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        >
                          Añadir Permiso
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setMostrarModalPermisos(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 