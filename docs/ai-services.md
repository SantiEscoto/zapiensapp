# Documentación de Servicios de IA

## Estructura de Servicios de IA

```
src/services/ai/
├── integration/
│   └── openrouter.ts   # OpenRouter con fallback 3 modelos FREE
└── (utils según necesidad)
```

## Configuración de privacidad OpenRouter (modelos free)

Si ves **"No endpoints found matching your data policy (Free model training)"**:

1. Entra en **https://openrouter.ai/settings/privacy**
2. Activa la opción que permite **model training** para modelos gratuitos (según tu preferencia de privacidad).
3. Sin esto, los endpoints free no coinciden con tu política y la app no puede usar los modelos.

La app muestra un mensaje en español con el enlace cuando ocurre este error.

## Fallback robusto (ZAPIENS IA 100% RESILIENTE)

Todas las llamadas a OpenRouter usan **3 modelos FREE en orden** con timeout 5s por intento:

1. **Primary**: `arcee-ai/trinity-large-preview:free`
2. **Fallback 1**: `stepfun/step-3.5-flash:free`
3. **Fallback 2**: `nvidia/nemotron-3-nano-30b-a3b:free`

- Si un modelo falla ("No endpoints found", 429, timeout), se prueba el siguiente.
- Se loguea en consola el modelo que respondió: `✅ ZAPIENS IA: modelo usado "..."`.
- Constante exportada: `OPENROUTER_FALLBACK_MODELS`. Helper: `callOpenRouterWithFallback(body, { timeoutMs: 5000 })`.

### Funciones que usan fallback

- `generateFlashCards(content, topics, existingCards)` — tarjetas en JSON.
- `generateCollectionInfo(topic, topics)` — nombre + descripción para una colección.
- `generateFolderNotes(collections)` — notas de carpeta.
- `generateLesson(topic)` — lección gamificada (con cache en memoria por topic).

### Ejemplo: generar lección en React Native

```tsx
import { useLessonGenerator } from '../../src/hooks/useLessonGenerator';

// En un componente:
const { content, error, loading, generate, modelUsed } = useLessonGenerator();

const handleGenerate = async () => {
  const result = await generate('Machine Learning básico');
  if (result.error) {
    Alert.alert('Error', result.error);
    return;
  }
  // result.content tiene la lección; result.modelUsed indica qué modelo respondió
};
```

### Test manual

Desde la app: en Home busca "Machine Learning básico" y genera colección (usa `generateCollectionInfo` con fallback). O en una pantalla que use `useLessonGenerator`: llamar `generate('Machine Learning básico')` y revisar consola por el log del modelo usado.

## Servicios Principales

### Generación de Tarjetas
- **Propósito**: Asistencia en la creación de tarjetas de estudio.
- **Funcionalidad**:
  - Generación automática de preguntas y respuestas
  - Extracción de conceptos clave de textos
  - Sugerencias de contenido relacionado

### Optimización de Aprendizaje
- **Propósito**: Mejora la experiencia de aprendizaje del usuario.
- **Funcionalidad**:
  - Análisis de patrones de estudio
  - Recomendaciones personalizadas
  - Adaptación del contenido según el progreso

### Procesamiento de Lenguaje Natural
- **Propósito**: Mejora la interacción con las tarjetas.
- **Funcionalidad**:
  - Análisis de similitud de respuestas
  - Corrección automática
  - Sugerencias de mejora

## Integración con el Sistema de Tarjetas
- Conexión directa con el componente de creación de tarjetas
- Procesamiento en tiempo real durante las sesiones de estudio
- Retroalimentación instantánea sobre respuestas

## Consideraciones Técnicas
- Implementación de rate limiting para llamadas a la API
- Caché de respuestas frecuentes
- Manejo de errores y fallbacks
- Optimización de costos de API

## Seguridad y Privacidad
- Encriptación de datos sensibles
- Cumplimiento con regulaciones de privacidad
- Manejo seguro de tokens de API
- Anonimización de datos de usuario

## Planes Futuros
- Implementación de modelos más avanzados
- Expansión de capacidades multilingües
- Mejora en la precisión de las recomendaciones
- Integración con más proveedores de IA