# Guía de Contribución

## Proceso de Desarrollo

### 1. Configuración del Entorno
- Clonar el repositorio
- Instalar dependencias con `npm install`
- Configurar variables de entorno para Supabase
- Verificar que las pruebas pasen localmente

### 2. Flujo de Trabajo
1. Crear una nueva rama desde `main`
   - Usar formato: `feature/nombre-caracteristica` o `fix/nombre-bug`
2. Desarrollar cambios
   - Seguir guías de estilo de código
   - Mantener cambios enfocados y concisos
3. Escribir pruebas
   - Cubrir nuevas funcionalidades
   - Verificar casos límite
4. Documentar cambios
   - Actualizar documentación relevante
   - Agregar comentarios de código cuando sea necesario

### 3. Proceso de Pull Request
1. Actualizar rama con `main`
2. Ejecutar pruebas localmente
3. Crear Pull Request con:
   - Descripción clara del cambio
   - Referencias a issues relacionados
   - Lista de cambios principales
4. Esperar revisión de código
5. Realizar ajustes según feedback

## Estándares de Código

### TypeScript
- Usar tipos explícitos
- Evitar `any`
- Documentar interfaces y tipos

### React Native
- Usar componentes funcionales
- Implementar hooks personalizados para lógica reutilizable
- Mantener componentes pequeños y enfocados

### Pruebas
- Escribir pruebas unitarias para nueva lógica
- Mantener pruebas de integración actualizadas
- Documentar casos de prueba complejos

## Convenciones de Commit

### Formato
```
tipo(alcance): descripción corta

Descripción detallada si es necesaria
```

### Tipos de Commit
- feat: Nueva característica
- fix: Corrección de bug
- docs: Cambios en documentación
- style: Cambios de formato
- refactor: Refactorización de código
- test: Agregar o modificar pruebas
- chore: Tareas de mantenimiento

## Recursos Adicionales
- [Documentación de API](./api-flows.md)
- [Estructura de la Aplicación](./app-structure.md)
- [Guía de Pruebas](./api-flows.md#estrategias-de-pruebas)

## Soporte
- Crear un issue para reportar bugs
- Usar discusiones para preguntas generales
- Revisar issues existentes antes de crear uno nuevo

## Licencia
Asegúrate de entender y aceptar la licencia del proyecto antes de contribuir.