# Documentación de Componentes

## Estructura de Componentes
La estructura de componentes está organizada en tres categorías principales:

```
src/components/
├── cards/         # Componentes relacionados con tarjetas y colecciones
├── common/        # Componentes UI comunes y reutilizables
└── games/         # Componentes relacionados con juegos y actividades
```

## Componentes de Tarjetas (cards/)

### CollectionsTab.tsx
- **Propósito**: Gestiona y muestra las colecciones de tarjetas del usuario.
- **Funcionalidad**:
  - Recupera las colecciones del usuario desde Supabase
  - Muestra un indicador de carga durante la obtención de datos
  - Maneja estados vacíos mostrando un mensaje apropiado
  - Utiliza TypeScript para tipado seguro con interface Collection

### SearchTab.tsx
- **Propósito**: Permite buscar colecciones de tarjetas.
- **Funcionalidad**:
  - Implementa búsqueda con debounce para optimizar las consultas
  - Muestra todas las colecciones cuando no hay término de búsqueda
  - Integración con Supabase para búsqueda en tiempo real
  - Manejo de estados de carga y resultados

## Componentes Comunes (common/)

### CustomSurface.tsx
- **Propósito**: Componente de superficie personalizado basado en react-native-paper.
- **Funcionalidad**:
  - Extiende el componente Surface de react-native-paper
  - Proporciona estilos consistentes para superficies en la aplicación
  - Permite personalización a través de props de estilo

### Login.jsx
- **Propósito**: Formulario de inicio de sesión reutilizable.
- **Funcionalidad**:
  - Campos para email y contraseña
  - Manejo de estado del formulario
  - Estructura basada en tabla para alineación consistente

## Mejores Prácticas
- Los componentes utilizan TypeScript para mejor seguridad de tipos
- Implementación de manejo de errores y estados de carga
- Uso de interfaces para definir tipos de datos
- Componentes modulares y reutilizables

## Dependencias Principales
- react-native-paper: Para componentes UI
- lodash: Para funciones de utilidad (debounce)
- supabase: Para interacción con la base de datos

## Componentes de Juegos (games/)
- **Estado Actual**: El directorio de juegos está preparado para futuros componentes interactivos.
- **Propósito**: Albergará componentes relacionados con la gamificación y actividades de aprendizaje.
- **Funcionalidades Planificadas**:
  - Mini-juegos de memoria
  - Ejercicios de práctica
  - Actividades de repaso interactivas
  - Sistemas de puntuación y recompensas