import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FONTS } from '../../services/fonts';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Captura errores de render (ej. "d.default is not a function" en web con React 19)
 * y muestra una pantalla de fallback con enlace a la app en lugar de pantalla en blanco.
 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('RootErrorBoundary:', error, errorInfo);
    }
  }

  handleRetry = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/';
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.message}>
            Recarga la página o entra de nuevo desde el enlace.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Volver a cargar</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => {
                if (typeof window !== 'undefined') window.location.href = '/welcome';
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonTextSecondary}>Ir a inicio</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#131f24',
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.title,
    color: '#fff',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#1CB0F6',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1CB0F6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
  buttonTextSecondary: {
    color: '#1CB0F6',
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
});
