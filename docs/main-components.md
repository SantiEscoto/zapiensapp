# Documentación de Componentes Principales

## Estructura Principal
La carpeta `(main)` contiene los componentes principales de la aplicación después de la autenticación.

### Home (home.tsx)

#### Descripción General
El componente principal (`home.tsx`) es la pantalla inicial después del inicio de sesión.

#### Características Principales
- Vista general de mazos de tarjetas
- Acceso rápido a las últimas sesiones de estudio
- Estadísticas de progreso del usuario
- Navegación a otras funciones principales

### Ranking (ranking.tsx)

#### Descripción General
El componente de ranking (`ranking.tsx`) permite ver la posición del usuario y de otros en diferentes ligas basadas en la frecuencia de estudio.

#### Características Principales
- Clasificación de usuarios en ligas según su nivel de frecuencia de estudio
- Posibilidad de avanzar o retroceder de liga semanalmente en función del rendimiento
- Sistema de puntos de experiencia (XP) acumulados al estudiar lecciones propias o compartidas por otros usuarios
- Visualización de usuarios con niveles de experiencia similares

### Perfil (profile.tsx)

#### Descripción General
El componente de perfil (`profile.tsx`) gestiona la información personal, conexiones y configuración del usuario.

#### Características Principales
- Visualización de fotografía de perfil y lista de amigos agregados
- Botón para agregar amigos
- Botón para editar perfil
- Opciones dentro de la edición de perfil:
  - Configuración de nombre
  - Actualización de fotografía de perfil
  - Cambio de contraseña
  - Administración de vínculos con redes sociales (Google, Facebook, etc.)
- Botón para cerrar sesión y permitir el cambio entre cuentas

## Layout Principal (_layout.tsx)

#### Descripción General
El componente de layout (`_layout.tsx`) define la estructura común para todas las pantallas principales.

#### Características
- Barra de navegación inferior
- Gestión de estado global
- Enrutamiento entre componentes principales
- Elementos de UI compartidos

## Flujo de Navegación
1. La pantalla Home es el punto de entrada principal
2. Navegación fluida entre Home, Ranking y Perfil
3. Acceso contextual a funciones específicas desde cada pantalla

## Consideraciones de Diseño
- Interfaz intuitiva y fácil de usar
- Consistencia visual en todos los componentes
- Optimización para diferentes tamaños de pantalla
- Transiciones suaves entre pantallas


## Componentes de Estudio (study/)

### Panel de Estudio (index.tsx)

#### Descripción General
El componente de panel de estudio (`index.tsx`) es el punto central para iniciar y gestionar las sesiones de estudio.

#### Características Principales
- Vista general de sesiones de estudio disponibles
- Estadísticas de rendimiento actual
- Opciones de configuración de sesión
- Acceso a mazos favoritos y recientes

### Sesión de Estudio (session/[id].tsx)

#### Descripción General
El componente de sesión de estudio gestiona la interacción con las flashcards durante una sesión activa.

#### Características Principales
- Presentación de tarjetas en orden optimizado
- Sistema de calificación de respuestas (1-5)
- Temporizador de sesión
- Indicadores de progreso
- Opciones de navegación entre tarjetas

### Resultados de Sesión (session/results.tsx)

#### Descripción General
Muestra el resumen y análisis después de completar una sesión de estudio.

#### Características Principales
- Resumen de rendimiento
- Estadísticas detalladas por tarjeta
- Recomendaciones para próximas sesiones
- Opción de revisar tarjetas problemáticas

## Gestión de Mazos (deck/)

### Vista de Mazo ([id].tsx)

#### Descripción General
Permite ver y gestionar un mazo específico de flashcards.

#### Características Principales
- Lista de tarjetas en el mazo
- Estadísticas del mazo
- Opciones de compartir
- Botones de edición y eliminación

### Creación de Mazo (create.tsx)

#### Descripción General
Interfaz para crear nuevos mazos de flashcards.

#### Características Principales
- Formulario de creación de mazo
- Editor de tarjetas
- Opciones de categorización
- Configuración de privacidad

### Edición de Mazo (edit/[id].tsx)

#### Descripción General
Permite modificar mazos existentes y sus tarjetas.

#### Características Principales
- Edición de información del mazo
- Gestión de tarjetas individuales
- Reordenamiento de tarjetas
- Opciones de importación/exportación

