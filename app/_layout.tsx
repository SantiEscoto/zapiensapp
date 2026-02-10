// Polyfills for Node.js modules (required by Supabase/ws)
import 'react-native-get-random-values'; // Must be imported first for crypto
const g = global as Record<string, unknown>;
if (typeof g.stream === 'undefined') g.stream = require('stream-browserify');
if (typeof g.http === 'undefined') g.http = require('stream-http');
if (typeof g.https === 'undefined') g.https = require('https-browserify');
if (typeof g.url === 'undefined') g.url = require('url');
if (typeof g.crypto === 'undefined') g.crypto = require('crypto-browserify');

// Importaciones necesarias para la navegación y temas
import { Stack } from "expo-router";
import { useFonts } from 'expo-font';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import { RootErrorBoundary } from '../src/components/common/RootErrorBoundary';
import { CollectionsProvider } from '../src/context/CollectionsContext';
import { FONT_ASSETS } from '../src/services/fonts';

// RootErrorBoundary captura "(0,d.default) is not a function" y muestra fallback en lugar de pantalla en blanco.
// CollectionsProvider en raíz para que (subtabs)/lessons tenga contexto al abrir una colección desde Home.
function RootLayoutContent() {
  const { theme } = useTheme();
  const [fontsLoaded] = useFonts(FONT_ASSETS);
  if (!fontsLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(main)" options={{ headerShown: false }} />
            <Stack.Screen name="(lessons)" options={{ headerShown: false }} />
            <Stack.Screen name="(subtabs)" options={{ headerShown: false }} />
          </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <ThemeProvider>
        <PaperProvider>
          <CollectionsProvider>
            <RootLayoutContent />
          </CollectionsProvider>
        </PaperProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  );
}