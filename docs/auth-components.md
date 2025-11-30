# Documentación de Componentes de Autenticación

## Estructura de Autenticación
La carpeta `(auth)` contiene los componentes relacionados con la autenticación de usuarios.

### Login (login.tsx)

#### Descripción General
El componente de inicio de sesión (`login.tsx`) maneja la autenticación de usuarios existentes.

#### Características Principales
- Integración con Supabase para autenticación
- Manejo de estado de sesión automático
- Validación de formularios
- Gestión de errores en español
- Interfaz de usuario personalizada con fuentes personalizadas

#### Funcionalidades
1. **Auto-refresh de Sesión**
   - Implementa un listener para el estado de la aplicación
   - Maneja la actualización automática de la sesión

2. **Gestión de Estado**
   ```typescript
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   ```

3. **Validación de Formularios**
   - Verificación de campos requeridos
   - Mensajes de error personalizados en español

### Registro (register.tsx)

#### Descripción General
El componente de registro (`register.tsx`) maneja la creación de nuevas cuentas de usuario.

#### Características Principales
- Formulario de registro con validación
- Integración con Supabase Auth
- Manejo de errores
- Confirmación de contraseña

#### Funcionalidades
1. **Validación de Registro**
   - Verificación de coincidencia de contraseñas
   - Validación de formato de email

2. **Proceso de Registro**
   ```typescript
   const { error } = await supabase.auth.signUp({
     email,
     password,
   });
   ```

## Flujo de Navegación
1. Los usuarios no autenticados son redirigidos a la pantalla de login
2. Después del login exitoso, se redirige a la pantalla principal (/home)
3. El registro exitoso muestra un mensaje de confirmación

## Consideraciones de Seguridad
- Implementación de validación en el cliente
- Manejo seguro de contraseñas
- Protección contra ataques de fuerza bruta
- Mensajes de error genéricos para prevenir enumeración de usuarios