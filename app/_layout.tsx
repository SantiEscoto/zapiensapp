// Polyfills for Node.js modules (required by Supabase/ws)
import 'react-native-get-random-values'; // Must be imported first for crypto
if (typeof global.stream === 'undefined') {
  global.stream = require('stream-browserify');
}
if (typeof global.http === 'undefined') {
  global.http = require('stream-http');
}
if (typeof global.https === 'undefined') {
  global.https = require('https-browserify');
}
if (typeof global.url === 'undefined') {
  global.url = require('url');
}
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto-browserify');
}

// Importaciones necesarias para la navegación y temas
import { Stack } from "expo-router";
import { ThemeProvider } from '../src/context/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import { RootErrorBoundary } from '../src/components/common/RootErrorBoundary';

// RootErrorBoundary captura "(0,d.default) is not a function" y muestra fallback en lugar de pantalla en blanco.
export default function RootLayout() {
  return (
    <RootErrorBoundary>
    <ThemeProvider>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
          <Stack.Screen name="(lessons)" options={{ headerShown: false }} />
          <Stack.Screen name="(subtabs)" options={{ headerShown: false }} />
        </Stack>
      </PaperProvider>
    </ThemeProvider>
    </RootErrorBoundary>
  );
}