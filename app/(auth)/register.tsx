import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Link } from "expo-router";
import { useState } from "react";
import { supabase } from '../../src/services/supabase';
import { useRouter } from 'expo-router';
import { FONTS } from '../../src/services/fonts';
import { useTheme } from '../../src/context/ThemeContext';

export default function Register() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const isFormValid = email.length > 0 && password.length > 0 && confirmPassword.length > 0;

  async function handleRegister() {
    setSuccessMessage("");
    try {
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }

      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }

      setLoading(true);
      setError("");
      
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setError("Este correo electrónico ya está registrado");
        } else {
          setError(error.message);
        }
        return;
      }

      if (!authData?.user) {
        setError("No se pudo crear la cuenta. Inténtalo de nuevo.");
        return;
      }

      // Solo ir a home si hay sesión activa (registro sin confirmación de email)
      if (authData.session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        if (!profile) {
          const { error: createError } = await supabase.rpc('create_profile_with_generated_fields', {
            p_id: authData.user.id,
            p_email: authData.user.email ?? '',
          });
          if (createError) throw createError;
        }
        router.replace('/home');
        return;
      }

      // Confirmación de email requerida: no redirigir a login, mostrar mensaje
      setSuccessMessage("Revisa tu correo para confirmar tu cuenta. Luego inicia sesión.");
    } catch (error: any) {
      console.error('Error:', error);
      setError(error?.message || 'Ocurrió un error durante el registro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.replace('/welcome')}
      >
        <Text style={[styles.backArrow, { color: colors.text }]}>←</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Crea tu cuenta</Text>
      
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, styles.topInput, { backgroundColor: colors.card, color: colors.text, borderBottomColor: colors.border }]}
          placeholder="Correo electrónico"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.middleInput, { backgroundColor: colors.card, color: colors.text, borderBottomColor: colors.border }]}
            placeholder="Contraseña"
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

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.bottomInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Confirmar contraseña"
            placeholderTextColor={colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Image 
              source={showConfirmPassword ? require('../../assets/pw1.png') : require('../../assets/pw0.png')} 
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.errorContainer}>
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        {successMessage ? <Text style={[styles.success, { color: colors.primary }]}>{successMessage}</Text> : null}
      </View>
      
      <TouchableOpacity 
        style={[
          styles.button,
          isFormValid
            ? { backgroundColor: colors.primary, shadowColor: colors.primary }
            : { backgroundColor: colors.card, shadowColor: colors.border },
        ]}
        onPress={handleRegister}
        disabled={loading || !isFormValid}
      >
        <Text style={[styles.buttonText, { color: isFormValid ? '#FFFFFF' : colors.textSecondary }]}>
          {loading ? "• • •" : "CREAR CUENTA"}
        </Text>
      </TouchableOpacity>

      <Link href="/login" asChild>
        <TouchableOpacity style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>¿Ya tienes una cuenta? Inicia sesión</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#131f24",
  },
  title: {
    fontSize: 16,
    marginTop: 48,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: FONTS.title,
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
    marginBottom: 0,
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  topInput: {
    borderBottomWidth: 2,
    borderBottomColor: "#37464f",
    borderRadius: 0,
  },
  middleInput: {
    borderBottomWidth: 2,
    borderBottomColor: "#37464f",
    borderRadius: 0,
  },
  bottomInput: {
    borderRadius: 0,
  },
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
  link: {
    marginTop: 15,
    alignItems: "center",
  },
  linkText: {
    color: "#1CB0F6",
    fontSize: 14,
    fontFamily: FONTS.title,
  },
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
  success: {
    textAlign: "center",
    fontFamily: FONTS.body,
    paddingHorizontal: 16,
  },
  termsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  termsText: {
    color: "#8E8E93",
    fontSize: 14,
  },
  termsLink: {
    color: "#1CB0F6",
    fontSize: 14,
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
  }
});