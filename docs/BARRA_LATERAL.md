# Norma de integración de barra lateral en TricycleCRM

## Requisito

En todas las secciones de TricycleCRM se debe respetar la visibilidad y funcionalidad de la barra lateral existente para mantener una experiencia de usuario coherente y facilitar la navegación por toda la aplicación.

## Implementación

### Estructura de layout

Todas las secciones deben seguir esta estructura para sus archivos `layout.tsx`:

```typescript
import { /* iconos relevantes */ } from 'react-icons/fi'
import Link from 'next/link'
import MainLayout from "@/components/layout/main-layout"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface SectionLayoutProps {
  children: React.ReactNode
}

export default async function SectionLayout({ children }: SectionLayoutProps) {
  // Verificar si el usuario está autenticado
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.auth.getSession();
  
  // Si el usuario no tiene sesión, redirigir al login
  if (!data?.session) {
    redirect("/login");
  }

  return (
    <MainLayout>
      <div className="flex flex-col">
        {/* Navegación específica de la sección */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex space-x-4">
              {/* Links de navegación específicos */}
            </nav>
          </div>
        </div>
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </MainLayout>
  )
}
```

### Beneficios

1. **Consistencia visual**: Todas las secciones mantienen el mismo diseño y estructura.
2. **Navegación mejorada**: Los usuarios pueden navegar entre secciones sin perder el contexto.
3. **Autenticación integrada**: Todas las secciones verifican la autenticación del usuario.
4. **Reutilización de código**: Aprovecha el componente `MainLayout` existente.

### Actualizaciones necesarias

Al crear nuevas secciones:

1. Añadir el componente `MainLayout` al layout de la sección.
2. Asegurar que la estructura de navegación específica de la sección se mantenga dentro del layout.
3. Implementar la verificación de autenticación.
4. Actualizar `side-bar.tsx` para incluir las nuevas secciones en el menú principal.

### Secciones actualizadas

Se han aplicado estas normas a las siguientes secciones:

- Clientes
- Proveedores
- Materiales
- Facturas de Proveedor
- Albaranes
- Recibos

### Ejemplo de uso

Ver los archivos `layout.tsx` en cualquiera de las secciones mencionadas para un ejemplo práctico de implementación. 