# Documentación de Flujos de Navegación

## Jerarquía de Layouts

### Layout Raíz (_layout.tsx)
- Gestiona el tema de la aplicación (claro/oscuro)
- Define la estructura principal de navegación usando Stack Navigator
- Controla la visibilidad de pantallas a través de opciones headerShown
- Rutas principales:
  - index (pantalla inicial)
  - grupo (auth)
  - grupo (main)
  - grupo subtabs

### Layout Principal ((main)/_layout.tsx)
- Implementa navegación basada en pestañas
- Barra de pestañas personalizada con:
  - Colores para tema oscuro
  - Altura y padding personalizados
  - Navegación basada en iconos
  - Estados activo/inactivo
- Pestañas principales:
  - Inicio (Dashboard)
  - Perfil
  - Rankings

### Layout de Subpestañas (subtabs/_layout.tsx)
- Navegación basada en Stack para pantallas secundarias
- Actualmente incluye:
  - pantalla de creación
- Mantiene consistencia en diseño sin encabezados

## Flujos de Navegación

### Flujo Principal
1. Entrada a la Aplicación
   - Pantalla inicial (index)
   - Verificación de autenticación
   - Redirección al grupo apropiado

2. Navegación Principal
   - Navegación entre pantallas principales mediante pestañas
   - Cambio fluido entre Inicio, Perfil y Rankings
   - Iconos personalizados para claridad visual

3. Navegación Secundaria
   - Acceso a subpestañas para funciones específicas
   - Creación de nuevo contenido a través de subtabs/create
   - Mantiene patrón de navegación consistente

## Consideraciones de Diseño

### Integración de Temas
- Soporta modos claro/oscuro a nivel de sistema
- Esquemas de colores personalizados para ambos temas
- Jerarquía visual consistente

### Experiencia de Usuario
- Encabezados ocultos para interfaz más limpia
- Navegación basada en iconos para uso intuitivo
- Retroalimentación visual mediante estados activo/inactivo

### Accesibilidad
- Estructura de navegación clara
- Indicadores visuales de ubicación actual
- Patrones de interacción consistentes

## Implementación Técnica

### Bibliotecas de Navegación
- Expo Router para navegación principal
- Navegadores Stack y Tabs para diferentes niveles
- Estilizado personalizado para elementos de navegación

### Gestión de Estado
- Estado del tema gestionado a nivel raíz
- Estado de navegación manejado por Expo Router
- Estados específicos de pantalla mantenidos localmente