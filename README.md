# TricycleCRM

Sistema de gestión para negocios de importación/exportación y compraventa de materiales.

## Características

- Gestión de clientes y proveedores
- Seguimiento de negocios y oportunidades
- Gestión de facturas y albaranes
- Generación de proformas
- Seguimiento de pagos

## Requisitos previos

- Node.js 18 o superior
- Cuenta de Supabase
- Git

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/tricyclecrm.git
   cd tricyclecrm
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` con tus credenciales de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
   SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Configuración de la base de datos

Debido a limitaciones en algunas instalaciones de Supabase, ofrecemos múltiples opciones para la configuración de la base de datos:

### Opción 1: Configuración automática (Recomendada)

```bash
npm run db:admin-migrate
```

Este comando utiliza la API de administración de Supabase para aplicar las migraciones directamente sin intervención manual. Requiere que las siguientes variables de entorno estén correctamente configuradas:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_ID`

### Opción 2: Configuración automática (Alternativa)

```bash
npx tricycle-db setup
```

Este comando verifica tus credenciales de Supabase, aplica las migraciones necesarias y verifica la integridad de la base de datos. Si este comando falla, considera usar la Opción 1 o la Opción 3.

### Opción 3: Configuración manual

Si las opciones anteriores encuentran problemas, sigue nuestra [guía de migración manual](docs/MANUAL_MIGRATION.md).

Después de la configuración, verifica la integridad de la base de datos:

```bash
npm run db:full-check
```

Esta verificación completa comprobará:
- Las tablas existentes en la base de datos
- Las migraciones aplicadas
- Las relaciones entre tablas
- La coherencia entre la base de datos y la estructura del proyecto

Si necesitas realizar verificaciones más específicas, también puedes utilizar:

```bash
# Verificar solo las tablas existentes
npm run db:check-tables

# Verificar solo las migraciones aplicadas
npm run db:check-migrations

# Verificar las relaciones entre tablas
npm run db:check-relationships

# Verificar la coherencia con la estructura del proyecto
npm run db:check-consistency

# Verificar la estructura de una tabla específica
node scripts/check-table-structure.js nombre_tabla
```

5. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Estructura del proyecto

```
tricyclecrm/
├── app/                  # Componentes y páginas de la aplicación
├── components/           # Componentes reutilizables
├── lib/                  # Utilidades y configuraciones
├── public/               # Archivos estáticos
├── scripts/              # Scripts de utilidad
├── styles/               # Estilos globales
└── supabase/             # Configuración de Supabase y migraciones
```

## Desarrollo

### Comandos útiles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run start`: Inicia la aplicación en modo producción

### Gestión de la base de datos

TricycleCRM incluye una herramienta de línea de comandos para gestionar la base de datos fácilmente:

```bash
npx tricycle-db <comando>
```

Comandos disponibles:
- `setup`: Configura la base de datos completa (verifica credenciales, aplica migraciones, comprueba integridad)
- `apply`: Aplica todas las migraciones pendientes
- `check`: Verifica la integridad de la base de datos
- `sync`: Sincroniza el esquema y genera una nueva migración
- `migrate`: Genera una nueva migración manualmente
- `watch`: Observa cambios en el esquema y genera migraciones automáticamente

Ejemplos:
```bash
# Configuración inicial
npx tricycle-db setup

# Verificar integridad
npx tricycle-db check

# Aplicar migraciones
npx tricycle-db apply

# Ver todos los comandos disponibles
npx tricycle-db help
```

> **Nota**: Si encuentras problemas con las herramientas automáticas, consulta la [guía de migración manual](docs/MANUAL_MIGRATION.md).

### Flujo de trabajo para cambios en la base de datos

1. Realiza cambios en el esquema de la base de datos modificando el archivo `.cursor/simplifiedDbManager.js`
2. Ejecuta `npx tricycle-db sync` para generar una migración con tus cambios
3. Verifica la migración generada en `supabase/migrations/`
4. Aplica la migración con `npx tricycle-db apply`
5. Verifica la integridad con `npx tricycle-db check`

## Solución de problemas

### Error con las migraciones

Si encuentras errores al aplicar las migraciones, asegúrate de que:

1. Tus credenciales de Supabase en el archivo `.env` son correctas
2. Tienes los permisos necesarios para ejecutar migraciones en tu proyecto Supabase
3. La conexión a Supabase es estable

Para más detalle, ejecuta `npx tricycle-db check` y revisa los mensajes de error específicos.

Si continúas teniendo problemas, sigue la [guía de migración manual](docs/MANUAL_MIGRATION.md) para ejecutar las migraciones directamente en la interfaz de Supabase.

## Licencia

Este proyecto está licenciado bajo la licencia MIT - ver el archivo LICENSE.md para más detalles. 