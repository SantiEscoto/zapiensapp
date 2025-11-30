// Importación del componente de redirección de Expo Router
import { Redirect } from 'expo-router';

// Componente principal que actúa como punto de entrada de la aplicación
// Redirige automáticamente al usuario a la pantalla principal de inicio
export default function Index() {
  return <Redirect href="/(main)/home" />;
}