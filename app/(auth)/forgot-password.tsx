import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "../../src/services/supabase";
import { useFonts } from 'expo-font';

export default function ForgotPassword() {
  const router = useRouter();
  const [loaded] = useFonts({
    'DINNextRoundedLTPro-Bold': require('../../assets/fonts/DINNextRoundedLTPro-Bold.otf'),
    'DINNextRoundedLTPro-Regular': require('../../assets/fonts/DINNextRoundedLTPro-Regular.otf'),
  });

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!loaded) {
    return null;
  }

  const isFormValid = email.trim() !== "";

  async function handleResetPassword() {
    if (!isFormValid) {
      setError("Por favor, introduce tu correo electrónico");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      
      // First check if user exists
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (!user) {
        setError("No existe ninguna cuenta asociada a este correo electrónico");
        return;
      }
      
      // If user exists, proceed with password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;
      setMessage("Si el correo está registrado, recibirá las instrucciones para restablecer la contraseña a su correo electrónico.");
    } catch (e: any) {
      if (e?.message === "Invalid email format") {
        setError("Formato de correo electrónico inválido");
      } else {
        setError("Ha ocurrido un error al restablecer la contraseña");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    
      <Text style={styles.title}>¿Olvidó su contraseña?</Text>
      
      <Text style={styles.subtitle}>
        Introduzca su correo electrónico para recibir un link para reiniciar su contraseña
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#8E8E93"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
    
      <View style={styles.errorContainer}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : message ? (
          <Text style={styles.message}>{message}</Text>
        ) : null}
      </View>
      
      <TouchableOpacity 
        style={[styles.button, !isFormValid && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading || !isFormValid}
      >
        <Text style={[styles.buttonText, !isFormValid && styles.buttonTextDisabled]}>
          {loading ? "• • •" : "SIGUIENTE"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.phoneButton}>
        <Text style={styles.phoneButtonText}>SOLICITAR POR NÚMERO EN SU LUGAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#131f24",
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "DINNextRoundedLTPro-Bold",
  },
  title: {
    fontSize: 32,
    color: "#FFFFFF",
    marginTop: 100,
    marginBottom: 10,
    fontFamily: "DINNextRoundedLTPro-Bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 30,
    fontFamily: "DINNextRoundedLTPro-Regular",
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
  phoneButton: {
    marginTop: 20,
    alignItems: "center",
  },
  phoneButtonText: {
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
  message: {
    color: "#34C759",
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "DINNextRoundedLTPro-Regular",
  }
});