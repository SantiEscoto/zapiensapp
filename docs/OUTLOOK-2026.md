# Perspectiva 2026: stack y tendencias

Investigación actualizada para **2026**: roadmap de las herramientas del proyecto, tendencias del mercado y qué implica para ZapCards.

---

## 1. Expo y React Native en 2026

### SDK 55 (enero 2026)
- **Expo SDK 55** está en beta (enero 2026): **Nueva Arquitectura obligatoria**; se elimina por completo la Legacy Architecture.
- Incluye **React Native 0.83.1** y **React 19.2.0**.
- **Hermes v1** disponible como opt-in (mejor rendimiento y soporte de JS moderno).
- Nueva plantilla por defecto: **Native Tabs API** (tabs nativos) y estructura de proyecto con carpeta `/src`.

### Qué significa para ZapCards
- Tu proyecto ya usa **Expo 54** con `newArchEnabled: true` en `app.json`, así que estás alineado con la dirección 2026.
- **Acción recomendada:** Planear la **actualización a SDK 55** cuando salga estable (tras la beta de ~2 semanas). Comprobar que todas las dependencias (React Native Paper, navegación, etc.) soporten la Nueva Arquitectura sin Legacy.
- Expo en 2026 se consolida como opción para **time-to-market rápido**, **OTA updates**, **EAS Build** y **una codebase para iOS, Android y web**; tu stack encaja con esa dirección.

### Mercado cross-platform 2026
- **~78%** de las apps móviles usan alguna forma de cross-platform (sube desde ~42% en 2022).
- **Flutter** tiene la mayor cuota entre frameworks (~46%); **React Native** sigue muy usado, sobre todo donde ya hay equipo JavaScript, con **85–95% de código compartido**.
- La pregunta deja de ser “¿se puede hacer con una codebase?” y pasa a “¿esa codebase puede sentirse nativa, escalar y mantenerse 3–4 años?”. Expo + Nueva Arquitectura responde bien a eso.

---

## 2. Supabase y BaaS en 2026

### Tendencias del sector
- **Vuelta a SQL y datos relacionales:** muchas apps “AI-first” (chats, sesiones, embeddings, filtros entre entidades) encajan mejor con modelos relacionales que con NoSQL puro.
- **Supabase vs Firebase en 2026:** se consolida la preferencia por **PostgreSQL, precio predecible y menos vendor lock-in** frente a Firebase (pago por operación, propietario, sin self-hosting).
- **Supabase Enterprise:** oferta enterprise con casos de uso a gran escala (ej. 100x tráfico, millones de usuarios, reducciones de coste importantes). Empresas como GitHub, Mozilla, 1Password, LangChain usan Supabase en producción.

### Qué significa para ZapCards
- Tu elección de **Supabase + PostgreSQL** está alineada con la tendencia 2026 (relacional, predecible, self-hostable).
- Para escalar: seguir **maturity model** de Supabase (migraciones, entornos staging/prod, PITR si aplica, restricciones de red). No hace falta cambiar de BaaS por tendencia; sí revisar buenas prácticas de producción.

---

## 3. IA en apps en 2026

### Dos caminos claros
1. **APIs en la nube (OpenAI, OpenRouter, etc.):** modelos más capaces, integración sencilla, pago por uso. Sigue siendo la opción natural para generación de contenido (como tus colecciones con OpenRouter).
2. **IA on-device / edge:** modelos más pequeños en el dispositivo, **privacidad** (datos no salen del dispositivo), **menor latencia** y **menor coste** por solicitud. En 2026 ya es viable con compresión, cuantización (4-bit, QLoRA) y formatos como GGUF.

### Qué significa para ZapCards
- **Mantener OpenRouter** para generación de contenido en la nube (colecciones, etc.) tiene sentido en 2026.
- **Opcional a futuro:** valorar **on-device** para funciones que no requieran modelos grandes (p. ej. sugerencias o correcciones locales) si priorizas privacidad o coste a gran escala. No es urgente; el cloud sigue siendo la opción más práctica para tu caso de uso actual.

---

## 4. PWA y “app desde el dominio” en 2026

### Estado de las PWA
- En 2026 las PWA se consideran **estándar preferido** para muchas experiencias tipo app en web: instalables, notificaciones, offline, una codebase.
- Navegadores (Chrome, Safari, Edge, Firefox) soportan bien las capacidades PWA; el rendimiento de JS y WebAssembly sigue mejorando.
- Ventajas de negocio: **evitar fricción de tiendas**, **una sola codebase web** y **alcance amplio** sin builds nativos separados.

### Qué significa para ZapCards
- Tu objetivo de **“abrir la app desde mi dominio”** (Expo web desplegado en tu dominio) encaja con la tendencia 2026.
- **Expo ya soporta PWA** (manifest, íconos, etc.); al desplegar el build web en un subdominio (p. ej. `app.tudominio.com`) estás ofreciendo una experiencia tipo app en el navegador. Opcional: afinar configuración PWA (offline, install prompt) según prioridad de producto.

---

## 5. Resumen: checklist 2026 para ZapCards

| Área | Estado actual | Acción 2026 |
|------|----------------|-------------|
| **Expo** | SDK 54, Nueva Arquitectura activa | Planear upgrade a **SDK 55** cuando sea estable; revisar compatibilidad de deps. |
| **Supabase** | PostgreSQL, auth, realtime | Mantener; aplicar **production checklist** y **maturity model** al escalar. |
| **OpenRouter** | Un API, varios modelos | Mantener para generación en la nube; valorar on-device solo si priorizas privacidad/coste en casos concretos. |
| **App desde dominio** | Objetivo definido | Desplegar build web Expo en subdominio; opcional: afinar PWA (offline, install). |
| **React Native Paper** | Estable | Mantener; solo valorar Tamagui u otra UI si más adelante priorizas paridad web/nativo o bundle size. |

---

## 6. Fuentes y referencias (2026)

- Expo SDK 55 beta, changelog y guía Nueva Arquitectura (docs.expo.dev).
- Comparativas cross-platform 2026 (market share Flutter / React Native, código compartido).
- Supabase Enterprise, maturity model y production checklist (supabase.com).
- Tendencias BaaS 2026: Supabase vs Firebase (SQL vs NoSQL, lock-in, precios).
- IA en móvil 2026: cloud APIs vs on-device LLMs (artículos y guías 2026).
- PWA 2026: guías web.dev, Mobiloud, Lomatechnology.

Documento creado para orientar decisiones técnicas con perspectiva **2026**; conviene revisar roadmap oficial de Expo y Supabase cada trimestre.
