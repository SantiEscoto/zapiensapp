import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Link } from "expo-router";
import { useState } from "react";
import { supabase } from '../../src/services/supabase';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { FONTS, FONT_ASSETS } from '../../src/services/fonts';

export default function Register() {
  const router = useRouter();
  const [loaded] = useFonts(FONT_ASSETS);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isFormValid = email.length > 0 && password.length > 0 && confirmPassword.length > 0;

  if (!loaded) {
    return null;
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      setError("Error al registrarse con Google");
    }
    setLoading(false);
  }

  async function handleRegister() {
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

      // Navigate to login screen after successful registration
      router.replace('/login');

    } catch (error: any) {
      console.error('Error:', error);
      setError(error?.message || 'Ocurrió un error durante el registro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.replace('/welcome')}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      
      <Image
        source={require('../../assets/welcome1.png')}
        style={styles.welcomeImage}
      />
      <Text style={styles.title}>Crea tu cuenta</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.topInput]}
          placeholder="Correo electrónico"
          placeholderTextColor="#8E8E93"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.middleInput]}
            placeholder="Contraseña"
            placeholderTextColor="#8E8E93"
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
            style={[styles.input, styles.bottomInput]}
            placeholder="Confirmar contraseña"
            placeholderTextColor="#8E8E93"
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
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      
      <TouchableOpacity 
        style={[styles.button, !isFormValid && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading || !isFormValid}
      >
        <Text style={[styles.buttonText, !isFormValid && styles.buttonTextDisabled]}>
          {loading ? "• • •" : "CREAR CUENTA"}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity 
        style={styles.socialButton}
        onPress={signInWithGoogle}
        disabled={loading}
      >
        <Image source={require('../../assets/google-icon.png')} style={styles.socialIcon} />
        <Text style={styles.socialButtonText}>
          {loading ? "• • •" : "REGISTRARSE CON GOOGLE"}
        </Text>
      </TouchableOpacity>

      <Link href="/login" asChild>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkText}>¿Ya tienes una cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </Link>

      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>Al registrarse en ZapCards, usted acepta nuestros </Text>
        <TouchableOpacity>
          <Text style={styles.termsLink}>Términos</Text>
        </TouchableOpacity>
        <Text style={styles.termsText}> y </Text>
        <TouchableOpacity>
          <Text style={styles.termsLink}>Políticas de Privacidad</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#131f24",
  },
  title: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 40,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "DINNextRoundedLTPro-Bold",
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
    fontFamily: "DINNextRoundedLTPro-Regular",
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
    fontFamily: "DINNextRoundedLTPro-Bold",
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
    fontFamily: "DINNextRoundedLTPro-Bold",
  },
  errorContainer: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: "#FF3B30",
    textAlign: "center",
    fontFamily: "DINNextRoundedLTPro-Regular",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#2C3444",
  },
  dividerText: {
    color: "#8E8E93",
    paddingHorizontal: 10,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#202f36",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#37464f",
    shadowColor: "#37464f",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "DINNextRoundedLTPro-Bold",
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
    fontWeight: "bold",
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
    fontWeight: 'bold',
  }
});