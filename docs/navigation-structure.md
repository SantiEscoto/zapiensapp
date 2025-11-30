# Estructura de Navegación

## Organización General
La aplicación utiliza Expo Router para la navegación y está organizada en grupos principales:

### Rutas Principales

#### (auth)
Gestión de autenticación de usuarios:
- `_layout.tsx`: Configuración del layout de autenticación
- `login.tsx`: Pantalla de inicio de sesión
- `register.tsx`: Pantalla de registro de usuario
- `forgot-password.tsx`: Recuperación de contraseña

#### (main)
Pantallas principales de la aplicación:
- `_layout.tsx`: Layout principal de la aplicación
- `home.tsx`: Pantalla de inicio/dashboard
- `profile.tsx`: Perfil del usuario
- `rankings.tsx`: Clasificaciones y logros

#### subtabs
Pestañas secundarias y funcionalidades adicionales:
- `_layout.tsx`: Layout para subtabs
- `create.tsx`: Creación de nuevos elementos

### Archivos de Configuración
- `_layout.tsx` (raíz): Configuración global de la aplicación
- `index.tsx`: Punto de entrada principal

## Flujos de Navegación

### Flujo de Autenticación
1. El usuario inicia en index.tsx
2. Si no está autenticado, se redirige a (auth)/login.tsx
3. Puede navegar a registro o recuperación de contraseña
4. Tras autenticación exitosa, se redirige a (main)/home.tsx

### Flujo Principal
1. Navegación entre home, profile y rankings
2. Acceso a subtabs para creación de contenido
3. Gestión de sesión desde el perfil

## Consideraciones de Diseño
- Uso de grupos de rutas con paréntesis para mejor organización
- Layouts específicos para cada sección principal
- Navegación anidada para mejor experiencia de usuario
- Separación clara entre flujos autenticados y no autenticados