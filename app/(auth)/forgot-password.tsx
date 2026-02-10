import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "../../src/services/supabase";
import { FONTS } from '../../src/services/fonts';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';

export default function ForgotPassword() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { colors } = theme;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isFormValid = email.trim() !== "";

  async function handleResetPassword() {
    if (!isFormValid) {
      setError(t('forgotPassword.error.enterEmail'));
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (!user) {
        setError(t('forgotPassword.error.noAccount'));
        return;
      }
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
      setMessage(t('forgotPassword.success'));
    } catch (e: any) {
      if (e?.message === "Invalid email format") {
        setError(t('forgotPassword.error.invalidEmail'));
      } else {
        setError(t('forgotPassword.error.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => router.replace("/login")}
      >
        <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
      </TouchableOpacity>
    
      <Text style={[styles.title, { color: colors.text }]}>{t('forgotPassword.title')}</Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('forgotPassword.subtitle')}
      </Text>
      
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder={t('forgotPassword.placeholder')}
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
    
      <View style={styles.errorContainer}>
        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : message ? (
          <Text style={[styles.message, { color: colors.primary }]}>{message}</Text>
        ) : null}
      </View>
      
      <TouchableOpacity 
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          !isFormValid && { backgroundColor: colors.card },
        ]}
        onPress={handleResetPassword}
        disabled={loading || !isFormValid}
      >
        <Text style={[styles.buttonText, { color: isFormValid ? '#FFFFFF' : colors.textSecondary }]}>
          {loading ? "• • •" : t('forgotPassword.next')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.phoneButton}>
        <Text style={[styles.phoneButtonText, { color: colors.primary }]}>{t('forgotPassword.requestByPhone')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    fontFamily: FONTS.title,
  },
  title: {
    fontSize: 32,
    marginTop: 100,
    marginBottom: 10,
    fontFamily: FONTS.title,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    fontFamily: FONTS.body,
  },
  inputContainer: {
    marginBottom: 20,
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
  },
  input: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 0,
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  button: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: FONTS.title,
  },
  phoneButton: {
    marginTop: 20,
    alignItems: "center",
  },
  phoneButtonText: {
    fontSize: 14,
    fontFamily: FONTS.title,
  },
  errorContainer: {
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    textAlign: "center",
    fontFamily: FONTS.body,
  },
  message: {
    marginBottom: 15,
    textAlign: "center",
    fontFamily: FONTS.body,
  }
});