import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, AppState } from "react-native";
import { Link } from "expo-router";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from '../../src/services/supabase';
import { FONTS } from '../../src/services/fonts';
import { useTheme } from '../../src/context/ThemeContext';

// Configure auto-refresh for authentication session
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// Definición del componente principal de la pantalla de Login
export default function Login() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isFormValid = emailOrUsername.length > 0 && password.length > 0;

  async function signInWithEmail() {
    setLoading(true);
    setError("");
    try {
      let email = emailOrUsername.trim().toLowerCase(); // Convertir a minúsculas
      
      // Si no es un email, buscar por username
      if (!email.includes('@')) {
        console.log('Buscando usuario:', email); // Para debug
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', email) // Usar ilike para búsqueda case-insensitive
          .single();
      
        console.log('Resultado búsqueda:', userData, userError); // Para debug
      
        if (userError || !userData) {
          setError("Usuario no encontrado");
          setLoading(false);
          return;
        }
        
        email = userData.email;
      }
    
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setError("Usuario o contraseña incorrectos");
        } else if (signInError.message === "Email not confirmed") {
          setError("Por favor, verifica tu cuenta a través del enlace enviado a tu correo electrónico antes de iniciar sesión.");
        } else {
          setError("Ha ocurrido un error. Por favor, inténtelo de nuevo.");
        }
        return;
      }

      if (authData.user) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // If profile doesn't exist, create one (username y full_name generados por RPC)
        if (!profile) {
          const { error: createError } = await supabase.rpc('create_profile_with_generated_fields', {
            p_id: authData.user.id,
            p_email: authData.user.email ?? '',
          });
          if (createError) throw createError;
        }

        router.replace("/home");
      }
    } catch (error) {
      console.error('Error:', error);
      setError("Ha ocurrido un error. Por favor, inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // Renderizado de la interfaz del formulario de login
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.replace('/welcome')}
      >
        <Text style={[styles.backArrow, { color: colors.text }]}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Ingresa tus datos</Text>
      
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, styles.topInput, { backgroundColor: colors.card, color: colors.text, borderBottomColor: colors.border }]}
          placeholder="Correo electrónico o nombre de usuario"
          placeholderTextColor={colors.textSecondary}
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
          autoCapitalize="none"
          autoComplete="username"
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.bottomInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Image 
              source={showPassword ? require('../../assets/pw1.png') : require('../../assets/pw0.png')} 
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.errorContainer}>
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      </View>
      
      <TouchableOpacity 
        style={[
          styles.button,
          isFormValid
            ? { backgroundColor: colors.primary, shadowColor: colors.primary }
            : { backgroundColor: colors.card, shadowColor: colors.border },
        ]}
        onPress={signInWithEmail}
        disabled={loading || !isFormValid}
      >
        <Text style={[styles.buttonText, { color: isFormValid ? '#FFFFFF' : colors.textSecondary }]}>
          {loading ? "• • •" : "ACCEDER"}
        </Text>
      </TouchableOpacity>

      <Link href="/forgot-password" asChild>
        <TouchableOpacity style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>RESTABLECER CONTRASEÑA</Text>
        </TouchableOpacity>
      </Link>

      <View style={styles.termsContainer}>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>Al registrarse en Zapiens, usted acepta nuestros </Text>
        <TouchableOpacity>
          <Text style={[styles.termsLink, { color: colors.primary }]}>Términos</Text>
        </TouchableOpacity>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}> y </Text>
        <TouchableOpacity>
          <Text style={[styles.termsLink, { color: colors.primary }]}>Políticas de Privacidad</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Estilos para los componentes de la pantalla de login
const styles = StyleSheet.create({
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '32%',
    transform: [{ translateY: -12 }],
    padding: 8,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 16,
    marginTop: 48,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: FONTS.title,
  },
  // Contenedor principal de la pantalla
  container: {
    flex: 1, // Ocupa todo el espacio disponible
    padding: 20, // Espaciado interno
    backgroundColor: "#131f24", // Color de fondo oscuro
  },
  inputContainer: {
    marginBottom: 20,
    width: "100%",
    backgroundColor: "#202f36",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#37464f"
  },
  input: {
    backgroundColor: "#202f36",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  topInput: {
    borderBottomWidth: 2,
    borderBottomColor: "#37464f",
    borderRadius: 0,
    marginBottom: 0,
  },
  bottomInput: {
    borderRadius: 0,
    marginBottom: 0,
  },
  // Texto de los enlaces
  linkText: {
    color: "#1CB0F6", // Color azul claro
    fontSize: 14, // Tamaño del texto
    fontFamily: FONTS.title, // Fuente personalizada
  },
  // Estilo del botón principal
  button: {
    backgroundColor: "#1CB0F6",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#1999d6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#202f36",
    shadowColor: "#37464f",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: FONTS.title,
  },
  buttonTextDisabled: {
    color: "#8E8E93",
  },
  // Estilo adicional para el texto del botón
  buttonTextStyle: {
    color: "#FFFFFF", // Texto en blanco
    fontSize: 14, // Tamaño del texto
    fontFamily: FONTS.bodyBold,
  },
  // Estilo del contenedor de enlaces
  link: {
    marginTop: 15, // Margen superior
    alignItems: "center", // Alineación centrada
  },
  // Texto del enlace para restablecer contraseña
  resetPasswordLinkText: {
    color: "#1CB0F6",
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  // Estilo del mensaje de error
  errorContainer: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: "#FF3B30",
    textAlign: "center",
    fontFamily: FONTS.body,
  },
  errorBetween: {
    marginVertical: 10,
    minHeight: 20,
  },
  termsContainer: {
    flexDirection: "row", // Elementos alineados horizontalmente
    flexWrap: "wrap", // Permite que los elementos pasen a la siguiente línea si no caben
    justifyContent: "center", // Alineación horizontal centrada
    marginTop: 20, // Margen superior
    paddingHorizontal: 20, // Espaciado horizontal
  },
  // Texto de los términos y condiciones
  termsText: {
    color: "#8E8E93", // Color gris claro
    fontSize: 14, // Tamaño del texto
  },
  // Enlace a términos y políticas
  termsLink: {
    color: "#1CB0F6", // Color azul claro
    fontSize: 14, // Tamaño del texto
    fontFamily: FONTS.bodyBold,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: FONTS.title,
  },
});
