// Importaciones necesarias para la navegación y temas
import { Stack } from "expo-router";
import { ThemeProvider } from '../src/context/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import { CollectionsProvider } from '../src/context/CollectionsContext';

// Componente principal que define la estructura de navegación de la aplicación
export default function RootLayout() {
  return (
    <ThemeProvider>
      <CollectionsProvider>
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(main)" options={{ headerShown: false }} />
            <Stack.Screen name="(lessons)" options={{ headerShown: false }} />
            <Stack.Screen name="(subtabs)" options={{ headerShown: false }} />
          </Stack>
        </PaperProvider>
      </CollectionsProvider>
    </ThemeProvider>
  );
}