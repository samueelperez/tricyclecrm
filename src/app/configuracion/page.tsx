"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiSettings, 
  FiUsers, 
  FiMail, 
  FiServer, 
  FiDatabase, 
  FiGlobe, 
  FiDollarSign, 
  FiTruck, 
  FiLock, 
  FiCreditCard, 
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiEdit,
  FiBookmark,
  FiX
} from "react-icons/fi";
import { getSupabaseClient, ejecutarMigracionConfiguracion } from "@/lib/supabase";

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState({
    dbStatus: "conectada",
    storage: "70% disponible",
    lastBackup: "Hace 7 días",
    version: "v1.0.0"
  });

  useEffect(() => {
    inicializarConfiguracion();
  }, []);

  const inicializarConfiguracion = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      
      // Ejecutar migración para asegurar que la tabla existe
      console.log('Ejecutando migración de configuración...');
      const resultadoMigracion = await ejecutarMigracionConfiguracion();
      
      if (!resultadoMigracion.success) {
        console.error('Error en la migración de configuración:', resultadoMigracion.error);
        setError('Error inicializando la tabla de configuración: ' + resultadoMigracion.message);
        setLoading(false);
        return;
      }
      
      // Obtener información del sistema desde la tabla de configuración
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .in('clave', ['version']);
      
      if (error) {
        console.error('Error cargando configuración:', error);
        setError('Error al cargar configuración: ' + error.message);
      } else if (data && data.length > 0) {
        // Procesar datos de configuración
        const versionConfig = data.find(item => item.clave === 'version');
        if (versionConfig) {
          setSystemInfo(prev => ({
            ...prev,
            version: versionConfig.valor
          }));
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError('Error al cargar la configuración del sistema');
    } finally {
      setLoading(false);
    }
  };

  // Definimos las diferentes secciones de configuración
  const seccionesPrincipales = [
    { id: "general", label: "General", icon: <FiSettings className="h-5 w-5" /> },
    { id: "usuarios", label: "Usuarios", icon: <FiUsers className="h-5 w-5" /> },
    { id: "notificaciones", label: "Notificaciones", icon: <FiMail className="h-5 w-5" /> },
    { id: "avanzado", label: "Avanzado", icon: <FiServer className="h-5 w-5" /> },
  ];

  // Configuraciones agrupadas por categoría
  const configuraciones = {
    general: [
      { 
        id: "empresa", 
        titulo: "Datos de la empresa", 
        descripcion: "Configura los datos generales de tu empresa, logo y detalles de contacto", 
        icon: <FiBookmark className="h-7 w-7 text-blue-500" />,
        ruta: "/configuracion/empresa" 
      },
      { 
        id: "moneda", 
        titulo: "Moneda y formato", 
        descripcion: "Configura la moneda predeterminada y formatos numéricos", 
        icon: <FiDollarSign className="h-7 w-7 text-green-500" />,
        ruta: "/configuracion/moneda" 
      },
      { 
        id: "idioma", 
        titulo: "Idioma y ubicación", 
        descripcion: "Configura el idioma predeterminado y zona horaria", 
        icon: <FiGlobe className="h-7 w-7 text-purple-500" />,
        ruta: "/configuracion/idioma" 
      }
    ],
    usuarios: [
      { 
        id: "perfiles", 
        titulo: "Perfiles de usuario", 
        descripcion: "Administra perfiles y permisos de usuarios del sistema", 
        icon: <FiUsers className="h-7 w-7 text-indigo-500" />,
        ruta: "/configuracion/usuarios" 
      },
      { 
        id: "seguridad", 
        titulo: "Seguridad", 
        descripcion: "Políticas de contraseñas y métodos de autenticación", 
        icon: <FiLock className="h-7 w-7 text-red-500" />,
        ruta: "/configuracion/seguridad" 
      }
    ],
    notificaciones: [
      { 
        id: "email", 
        titulo: "Correo electrónico", 
        descripcion: "Configura los correos electrónicos de notificación y plantillas", 
        icon: <FiMail className="h-7 w-7 text-yellow-500" />,
        ruta: "/configuracion/email" 
      },
      { 
        id: "alertas", 
        titulo: "Alertas", 
        descripcion: "Configura cuando y cómo recibir alertas del sistema", 
        icon: <FiAlertCircle className="h-7 w-7 text-orange-500" />,
        ruta: "/configuracion/alertas" 
      }
    ],
    avanzado: [
      { 
        id: "basedatos", 
        titulo: "Base de datos", 
        descripcion: "Administración y respaldo de la base de datos", 
        icon: <FiDatabase className="h-7 w-7 text-teal-500" />,
        ruta: "/configuracion/basedatos" 
      },
      { 
        id: "logistica", 
        titulo: "Logística", 
        descripcion: "Configuración de transportistas y métodos de envío", 
        icon: <FiTruck className="h-7 w-7 text-blue-500" />,
        ruta: "/configuracion/logistica" 
      },
      { 
        id: "pagos", 
        titulo: "Métodos de pago", 
        descripcion: "Configura los métodos de pago aceptados", 
        icon: <FiCreditCard className="h-7 w-7 text-green-500" />,
        ruta: "/configuracion/pagos" 
      },
      { 
        id: "integraciones", 
        titulo: "Integraciones", 
        descripcion: "Conecta con servicios externos y APIs", 
        icon: <FiServer className="h-7 w-7 text-purple-500" />,
        ruta: "/configuracion/integraciones" 
      },
      { 
        id: "catalogo", 
        titulo: "Catálogo de productos", 
        descripcion: "Configuración de productos, categorías y atributos", 
        icon: <FiPackage className="h-7 w-7 text-indigo-500" />,
        ruta: "/configuracion/catalogo" 
      }
    ]
  };

  return (
    <div className="py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Configuración
          </h1>
          <p className="mt-2 text-gray-500">
            Configura y personaliza tu sistema CRM según tus necesidades
          </p>
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
        
        {/* Pestañas */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            {seccionesPrincipales.map((seccion) => (
              <button
                key={seccion.id}
                onClick={() => setActiveTab(seccion.id)}
                className={`pb-4 px-1 flex items-center space-x-2 text-sm font-medium transition-colors duration-150 ${
                  activeTab === seccion.id
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {seccion.icon}
                <span>{seccion.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Tarjetas de configuración */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configuraciones[activeTab as keyof typeof configuraciones].map((config) => (
            <Link
              key={config.id}
              href={config.ruta}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="mb-4">
                  {config.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{config.titulo}</h3>
                <p className="text-gray-600 text-sm mb-4">{config.descripcion}</p>
                <div className="flex items-center text-indigo-600">
                  <FiEdit className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Configurar</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Estado del sistema */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del sistema</h3>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Base de datos</span>
              <span className="flex items-center text-green-500">
                <FiCheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">{systemInfo.dbStatus}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Almacenamiento</span>
              <span className="flex items-center text-green-500">
                <FiCheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">{systemInfo.storage}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Última copia de seguridad</span>
              <span className="flex items-center text-yellow-500">
                <FiAlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">{systemInfo.lastBackup}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Versión</span>
              <span className="text-sm text-gray-800">TricycleCRM {systemInfo.version}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 