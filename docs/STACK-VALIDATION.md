# Validación del stack: prototipo y escalado

Análisis basado en información actual (2024-2025) para validar si las herramientas del proyecto son las más adecuadas para el **prototipo** y para **escalar** a producción.

---

## Resumen ejecutivo

| Herramienta        | Prototipo | Escalado | Veredicto |
|--------------------|-----------|----------|-----------|
| **Expo (React Native)** | ✅ Excelente | ✅ Sólido | **Mantener** — Ideal para MVP y soportado para empresa. |
| **Supabase**       | ✅ Excelente | ✅ Muy bueno | **Mantener** — PostgreSQL, precio predecible, poco vendor lock-in. |
| **OpenRouter**     | ✅ Excelente | ✅ Flexible | **Mantener** — Un solo API, muchos modelos, control de coste. |
| **React Native Paper** | ✅ Muy bueno | ⚠️ Aceptable | **Mantener por ahora** — Estable; valorar Tamagui si priorizas web/nativo idéntico. |
| **Next.js (Zapiens)**   | ✅ Muy bueno | ⚠️ Opcional | **Opcional cambio** — Para landing estática, Astro puede dar mejor rendimiento/SEO. |

**Conclusión:** El stack actual es **muy adecuado** para el prototipo y para escalar. No hace falta cambiar nada por obligación; los únicos ajustes recomendados son opcionales (UI library a medio plazo, landing con Astro si priorizas SEO/performance estático).

---

## 1. Expo (React Native)

### Uso en el proyecto
- App principal: iOS, Android y **web** con un solo código.
- Expo Router para navegación basada en archivos.
- EAS (referenciado en `app.json`) para builds.

### Para el prototipo
- **Muy adecuado.** React Native/Expo suelen considerarse **mejores que Flutter para prototipar y salir al mercado rápido** cuando el equipo ya sabe React/JS: ecosistema grande, hot reload, Expo “batteries-included”.
- Un solo código para móvil y web encaja con el objetivo de “abrir la app desde tu dominio”.

### Para escalar
- **Sólido.** Expo se presenta como stack enterprise para React Native (recomendado por Meta, SOC 2 Type 2, EAS Build para stores).
- Nueva Arquitectura de React Native (Fabric/TurboModules) ya por defecto en SDK 52+ y será obligatoria más adelante; mejora rendimiento y prepara el futuro.
- Flutter puede dar ventaja en animaciones complejas y consistencia pixel-perfect; React Native gana en velocidad de iteración y reutilización de skills React.

### Alternativas consideradas
- **Flutter:** Mejor rendimiento predecible y menos mantenimiento a muy largo plazo en apps muy animadas; requiere Dart y otro ecosistema. **No recomendado cambiar** salvo que el equipo apueste fuerte por Flutter.
- **PWA puro (sin RN):** Más simple para “solo web”, pero pierdes una sola codebase móvil + web y las capacidades nativas que ya usas.

### Recomendación
**Mantener Expo.** Es una de las mejores opciones para prototipo y para escalar con React Native; no hay motivo técnico fuerte para cambiar.

---

## 2. Supabase

### Uso en el proyecto
- Auth (incl. OAuth), PostgreSQL, Realtime, Storage.
- Migraciones en `supabase/migrations/`.

### Para el prototipo
- **Muy adecuado.** Backend listo en minutos (auth, DB, API automática, dashboard). Menos boilerplate que montar un backend propio.
- PostgreSQL desde el inicio permite relaciones (colecciones, carpetas, perfiles, XP) sin los límites de un NoSQL para consultas complejas.

### Para escalar
- **Muy bueno.** Plan Pro (~25 USD/mes) con coste predecible y “unlimited” API requests; después se paga por MAU, disco, egress y storage. Mejor para previsibilidad que Firebase (pago por lecturas/escrituras).
- PostgreSQL escala hasta instancias grandes (varios núcleos, muchas conexiones). Límites típicos: conexiones según plan, disco y egress; suficiente para crecer mucho antes de plantearse algo custom.
- **Ventaja importante:** Supabase es **open-source y self-hostable** (Docker, tu propia infra). Reduce vendor lock-in frente a Firebase (propietario, sin self-hosting).
- Para compliance (SOC 2, HIPAA) existe plan Team/Enterprise.

### Alternativas consideradas
- **Firebase:** Mejor para prototipos muy rápidos con datos poco relacionales; peor para datos relacionales complejos y para predecir costes al escalar; mayor lock-in.
- **Backend propio (Node + Postgres, etc.):** Más control y escalado “a medida”, pero mucho más esfuerzo; solo tiene sentido cuando Supabase se quede corto (muy alto volumen o requisitos muy específicos).

### Recomendación
**Mantener Supabase.** Encaja muy bien con prototipo y con escalado; la base SQL y la opción de self-hosting son ventajas claras a medio y largo plazo.

---

## 3. OpenRouter (IA)

### Uso en el proyecto
- Generación de contenido para colecciones (integración en `src/services/ai/integration/openrouter.ts`).
- Documentación menciona DeepSeek; en código se usa OpenRouter como capa unificada.

### Para el prototipo
- **Muy adecuado.** Una sola API para probar muchos modelos (400+ modelos, 60+ proveedores). Cambias de modelo sin reescribir integraciones.
- Plan gratuito (límite de solicitudes/día) permite validar sin gasto inicial.
- Pay-as-you-go sin mínimo; solo pagas por uso real.

### Para escalar
- **Flexible.** No marcan up sobre el precio del proveedor; pagas por tokens según el modelo elegido. Presupuestos y controles de gasto ayudan a no pasarse.
- Fallbacks y auto-routing mejoran disponibilidad sin duplicar lógica.
- Enterprise para alto volumen y facturación a medida.

### Alternativas consideradas
- **OpenAI directo:** Más simple si solo quieres GPT; pierdes flexibilidad de cambiar a modelos más baratos o especializados (p. ej. Claude, Llama, DeepSeek) sin tocar código.
- **Vercel AI SDK / LangChain:** Útiles para orquestar flujos; pueden usarse **encima** de OpenRouter (por ejemplo con el provider de OpenRouter), no sustituyen la decisión de “un API para muchos modelos”.

### Recomendación
**Mantener OpenRouter.** Ideal para prototipo (un API, muchos modelos, bajo riesgo de coste) y para escalar (control de coste, flexibilidad de proveedor).

---

## 4. React Native Paper

### Uso en el proyecto
- Componentes UI (Modal, Portal, botones, etc.) en pantallas principales.
- Material Design.

### Para el prototipo
- **Muy bueno.** Componentes listos, documentación clara, uso muy extendido; acelera desarrollo.
- Encaja con el look actual de la app.

### Para escalar
- **Aceptable.** Biblioteca estable y mantenida; no es la más activa del ecosistema. Para una app que ya funciona, no es un cuello de botella.
- Si en el futuro se prioriza **paridad total web/nativo** y optimización de bundle (menos JS en web), **Tamagui** es una alternativa fuerte (compilador, misma UI en web y nativo, más actividad reciente). Implica refactor de UI.
- **NativeWind** (Tailwind en RN) es útil si prefieres utilidades; no da un kit de componentes completo como Paper.

### Recomendación
**Mantener React Native Paper** a corto y medio plazo. Solo plantear migración a Tamagui (o similar) si más adelante priorizas máxima paridad web/nativo o reducción agresiva de bundle en web.

---

## 5. Next.js (sitio Zapiens / marketing)

### Uso en el proyecto
- Sitio en `website/zapiens/`: landing, FAQ, ayuda, términos, i18n (es/en, etc.).

### Para el prototipo
- **Muy bueno.** Next.js es estándar, bien documentado, y el equipo puede reutilizar conocimiento React. Rápido de iterar.

### Para escalar (landing / contenido estático)
- Para páginas **principalmente estáticas** (texto, imágenes, pocas interacciones), **Astro** suele dar mejor rendimiento y SEO: menos JavaScript enviado, mejor Core Web Vitals en muchos casos.
- Next.js sigue siendo una opción válida; el “costo” es más JS y algo más de complejidad que no necesariamente necesitas para una landing.

### Recomendación
**Mantener Next.js** por ahora si el sitio ya está estable y no es la prioridad. Si en el futuro priorizas SEO y rendimiento máximo en la landing, valorar **migrar solo el sitio marketing a Astro** (la app Expo no se toca).

---

## 6. Otros elementos del stack

- **Expo Router:** Estándar recomendado para Expo; encaja con “una app, varias plataformas”. Mantener.
- **TypeScript:** Buena práctica para mantenibilidad y escalado. Mantener.
- **Expo (web):** Documentación oficial cubre PWA, export estático (`expo export -p web`) y despliegue (EAS Hosting, Netlify, etc.). Adecuado para “app desde tu dominio”. Mantener.

---

## Resumen de acciones sugeridas

| Prioridad | Acción |
|-----------|--------|
| **Ahora** | No cambiar stack; seguir con Expo, Supabase, OpenRouter, Paper, Next (zapiens). |
| **Corto plazo** | Asegurar Node 20+, env, Supabase y dominio para el objetivo “app desde tu dominio” (ver CHECKLIST.md). |
| **Medio plazo** | Si el sitio Zapiens se vuelve crítico para SEO/performance, valorar migrar solo ese sitio a Astro. |
| **Opcional (más adelante)** | Si priorizas paridad web/nativo y tamaño de bundle, evaluar Tamagui u otra UI library; no urgente. |

En conjunto, las herramientas que usamos **sí son de las mejores opciones** para este prototipo y para escalarlo; no se identifican cambios obligatorios, solo optimizaciones opcionales a futuro.
