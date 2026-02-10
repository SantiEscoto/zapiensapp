import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Link } from "expo-router";
import { useState } from "react";
import { supabase } from '../../services/supabase';
import { FONTS } from '../../services/fonts';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export type LoginFormProps = {
  onSuccess: () => void;
  onClose: () => void;
  isModal?: boolean;
  /** En modal: al pulsar "¿No tienes cuenta?" se cierra login y se abre registro */
  onSwitchToRegister?: () => void;
};

export function LoginForm({ onSuccess, onClose, isModal, onSwitchToRegister }: LoginFormProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
      let email = emailOrUsername.trim().toLowerCase();
      if (!email.includes('@')) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', email)
          .single();
        if (userError || !userData) {
          setError(t('auth.error.usuarioNoEncontrado'));
          setLoading(false);
          return;
        }
        email = userData.email;
      }

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setError(t('auth.error.credencialesInvalidas'));
        } else if (signInError.message === "Email not confirmed") {
          setError(t('auth.error.confirmaEmail'));
        } else {
          setError(t('auth.error.generico'));
        }
        return;
      }

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        if (!profile) {
          const { error: createError } = await supabase.rpc('create_profile_with_generated_fields', {
            p_id: authData.user.id,
            p_email: authData.user.email ?? '',
          });
          if (createError) throw createError;
        }
        onSuccess();
      }
    } catch (err) {
      console.error('Error:', err);
      setError(t('auth.error.generico'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, isModal && styles.containerModal]}>
      <TouchableOpacity style={styles.backButton} onPress={onClose}>
        <Text style={[styles.backArrow, { color: colors.text }]}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }, isModal && styles.titleModal]}>{t('auth.ingresaTusDatos')}</Text>

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, styles.topInput, { backgroundColor: colors.card, color: colors.text, borderBottomColor: colors.border }]}
          placeholder={t('auth.correoOUsuario')}
          placeholderTextColor={colors.textSecondary}
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
          autoCapitalize="none"
          autoComplete="username"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.bottomInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder={t('auth.password')}
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
            <Image source={showPassword ? require('../../../assets/pw1.png') : require('../../../assets/pw0.png')} style={styles.eyeIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.errorContainer}>
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          isFormValid ? { backgroundColor: colors.primary, shadowColor: colors.primary } : { backgroundColor: colors.card, shadowColor: colors.border },
        ]}
        onPress={signInWithEmail}
        disabled={loading || !isFormValid}
      >
        <Text style={[styles.buttonText, { color: isFormValid ? '#FFFFFF' : colors.textSecondary }]}>
          {loading ? "• • •" : t('auth.acceder')}
        </Text>
      </TouchableOpacity>

      <Link href="/forgot-password" asChild>
        <TouchableOpacity style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.restablecerContraseña')}</Text>
        </TouchableOpacity>
      </Link>

      {isModal && onSwitchToRegister ? (
        <TouchableOpacity style={styles.link} onPress={onSwitchToRegister}>
          <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.noTienesCuenta')}</Text>
        </TouchableOpacity>
      ) : (
        <Link href="/register" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.noTienesCuenta')}</Text>
          </TouchableOpacity>
        </Link>
      )}

      <View style={styles.termsContainer}>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>{t('auth.terminosPolitica')}</Text>
        <TouchableOpacity><Text style={[styles.termsLink, { color: colors.primary }]}>{t('auth.terminos')}</Text></TouchableOpacity>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>{t('auth.y')}</Text>
        <TouchableOpacity><Text style={[styles.termsLink, { color: colors.primary }]}>{t('auth.politicas')}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  containerModal: {
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    padding: 10,
  },
  backArrow: {
    fontSize: 28,
    fontFamily: FONTS.title,
  },
  title: {
    fontSize: 16,
    marginTop: 48,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: FONTS.title,
  },
  titleModal: {
    marginTop: 40,
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
    marginBottom: 10,
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  topInput: {
    borderBottomWidth: 2,
    borderRadius: 0,
    marginBottom: 0,
  },
  bottomInput: {
    borderRadius: 0,
    marginBottom: 0,
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
  errorContainer: {
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    textAlign: "center",
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
  link: {
    marginTop: 15,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    fontFamily: FONTS.title,
  },
  termsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 14,
  },
  termsLink: {
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
});
