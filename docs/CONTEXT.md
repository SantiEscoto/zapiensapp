# ZapCards - Memorizar y Aprender

## Planteamiento del Problema
Los usuarios tienen dificultades con la retención de información mientras aprenden nuevas materias. Las soluciones actuales en el mercado presentan varias limitaciones:
- Falta de aplicaciones de tarjetas de memoria gratuitas y sin publicidad
- Características educativas avanzadas limitadas
- Necesidad de un mercado de contenido generado por usuarios
- Herramientas insuficientes para la retención efectiva del aprendizaje

## Visión del Proyecto
ZapCards aspira a ser una aplicación de tarjetas de memoria simple pero poderosa enfocada en tres principios fundamentales:
1. Memorizar
2. Aprender
3. Compartir

## Características Principales

### 1. Gestión de Colecciones
Los usuarios pueden gestionar sus colecciones de tarjetas a través de dos interfaces principales:

#### 1.1 Panel de Colecciones
- **Interfaz de Mazos de Tarjetas**
  - Vista del perfil del creador
  - Detalles individuales de las tarjetas
  - Modo de repaso clásico
    - Pronunciación de audio
    - Mecanismo de volteo de tarjetas
    - Repetición espaciada basada en dificultad
      - Las tarjetas fáciles aparecen con menos frecuencia
      - Las tarjetas difíciles aparecen con más frecuencia
  - Mini-juegos de aprendizaje
    - Repaso rápido
    - Emparejamiento de tarjetas
    - Construcción de pilas
    - Juego Jumpman
  - Comentarios de usuarios
  - Herramientas de gestión de colecciones

#### 1.2 Pestaña de Descubrimiento
- **Búsqueda y Recomendaciones**
  - Vista predeterminada muestra recomendaciones
  - Funcionalidad de búsqueda
  - Opciones de filtrado avanzado
    - Idioma
    - Preferencias de ordenamiento
    - Filtros adicionales

## Recorrido del Usuario
1. Acceder al panel de colecciones o descubrir nuevo contenido
2. Seleccionar un mazo de tarjetas
3. Elegir modo de aprendizaje (repaso clásico o mini-juegos)
4. Practicar y seguir el progreso
5. Interactuar con la comunidad a través de comentarios

## Diferenciadores Clave
- Experiencia limpia, sin publicidad
- Enfoque en simplicidad y efectividad
- Contenido impulsado por la comunidad
- Mecánicas de aprendizaje atractivas

## Stack Tecnológico
### Frontend
- React Native (v0.72+)
- TypeScript para desarrollo con tipos seguros
- Expo SDK para desarrollo multiplataforma
- Expo Router para gestión de navegación
- React Native Paper para componentes UI

### Backend y Base de Datos
- Supabase para servicios backend
  - Base de datos PostgreSQL
  - Servicios de autenticación
  - Suscripciones en tiempo real
  - Gestión de almacenamiento

### Integración de IA
- DeepSeek para procesamiento de IA
  - Comprensión del lenguaje natural
  - Generación de contenido
  - Soporte de traducción de idiomas

## Guías de Desarrollo
### Estilo de Código
- Seguir las mejores prácticas de TypeScript
  - Usar verificación estricta de tipos
  - Implementar interfaces apropiadas
  - Evitar tipo any cuando sea posible
- Usar componentes funcionales con hooks
  - Preferir useState y useEffect
  - Implementar hooks personalizados para lógica reutilizable
- Implementar manejo de errores adecuado
  - Usar bloques try/catch
  - Implementar límites de error
  - Registrar errores apropiadamente
- Escribir comentarios significativos en español
  - Documentar lógica compleja
  - Explicar reglas de negocio
  - Incluir JSDoc para funciones
- Usar convenciones de nomenclatura consistentes
  - PascalCase para componentes
  - camelCase para variables y funciones
  - UPPER_CASE para constantes

### Pruebas
- Escribir pruebas unitarias para utilidades
  - Jest para framework de pruebas
  - React Testing Library para componentes
  - Objetivos de cobertura: 80%+
- Implementar pruebas de componentes
  - Probar interacciones de usuario
  - Verificar renderizado de componentes
  - Comprobar gestión de estado
- Realizar pruebas de integración
  - Probar integraciones de API
  - Verificar flujos de navegación
  - Probar persistencia de datos
- Realizar revisiones de QA regulares
  - Sesiones de pruebas manuales
  - Verificación entre dispositivos
  - Monitoreo de rendimiento

## Proceso de Despliegue
1. Revisión de Código
   - Creación de pull request
   - Verificación de calidad de código
   - Revisión de documentación
   - Análisis de impacto en rendimiento

2. Verificación de Pruebas
   - Ejecutar pruebas automatizadas
   - Lista de verificación de pruebas manuales
   - Verificación multiplataforma
   - Evaluación de rendimiento

3. Despliegue en Staging
   - Desplegar a ambiente de staging
   - Pruebas de integración
   - Pruebas de aceptación de usuario
   - Monitoreo de rendimiento

4. Lanzamiento a Producción
   - Etiquetado de versión
   - Actualización de changelog
   - Despliegue a producción
   - Verificación post-despliegue

## Estructura del Proyecto
```
zapcards/
├── app/                     # Directorio de Expo Router
│   ├── (auth)/             # Rutas de autenticación
│   ├── (tabs)/             # Navegación principal por tabs
│   └── _layout.tsx         # Layout raíz
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── cards/          # Componentes relacionados con tarjetas
│   │   ├── common/         # Componentes UI comunes
│   │   └── games/          # Componentes de mini-juegos
│   ├── hooks/              # Hooks personalizados de React
│   ├── services/           # API y servicios externos
│   │   ├── supabase/       # Cliente y consultas de Supabase
│   │   └── ai/             # Servicios de integración de IA
│   ├── store/              # Gestión de estado global
│   ├── types/              # Definiciones de tipos TypeScript
│   └── utils/              # Funciones auxiliares y constantes
├── assets/                 # Activos estáticos
│   ├── images/
│   └── sounds/
├── docs/                   # Documentación del proyecto
└── config/                 # Archivos de configuración
```

## Guías de Contribución
1. Hacer fork del repositorio
2. Crear rama de feature
3. Seguir guías de estilo de código
4. Enviar pull request
5. Esperar revisión y aprobación