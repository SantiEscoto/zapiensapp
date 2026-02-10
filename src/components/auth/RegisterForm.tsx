import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { Link } from "expo-router";
import { useState } from "react";
import { supabase } from '../../services/supabase';
import { FONTS } from '../../services/fonts';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export type RegisterFormProps = {
  onSuccess: () => void;
  onClose: () => void;
  /** Si true, se muestra dentro del modal en welcome */
  isModal?: boolean;
  /** En modal: al pulsar "¿Ya tienes cuenta?" se cierra registro y se abre login */
  onSwitchToLogin?: () => void;
};

export function RegisterForm({ onSuccess, onClose, isModal, onSwitchToLogin }: RegisterFormProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
        setError(t('auth.error.contraseñasNoCoinciden'));
        return;
      }
      if (password.length < 6) {
        setError(t('auth.error.contraseñaMinimo'));
        return;
      }

      setLoading(true);
      setError("");
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError(t('auth.error.emailYaRegistrado'));
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (!authData?.user) {
        setError(t('auth.error.noSePudoCrearCuenta'));
        return;
      }

      if (authData.session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
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
        return;
      }

      setSuccessMessage(t('auth.success.confirmaEmail'));
    } catch (err: any) {
      console.error('Error:', err);
      setError(err?.message || t('auth.error.generico'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, isModal && styles.containerModal]}>
      <TouchableOpacity style={styles.backButton} onPress={onClose}>
        <Text style={[styles.backArrow, { color: colors.text }]}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }, isModal && styles.titleModal]}>{t('auth.creaTuCuenta')}</Text>

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, styles.topInput, { backgroundColor: colors.card, color: colors.text, borderBottomColor: colors.border }]}
          placeholder={t('auth.correoElectronico')}
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.middleInput, { backgroundColor: colors.card, color: colors.text, borderBottomColor: colors.border }]}
            placeholder={t('auth.contraseña')}
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={24} color={colors.textSecondary} /> : <Eye size={24} color={colors.textSecondary} />}
          </TouchableOpacity>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.bottomInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder={t('auth.confirmPassword')}
            placeholderTextColor={colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? <EyeOff size={24} color={colors.textSecondary} /> : <Eye size={24} color={colors.textSecondary} />}
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
          isFormValid ? { backgroundColor: colors.primary, shadowColor: colors.primary } : { backgroundColor: colors.card, shadowColor: colors.border },
        ]}
        onPress={handleRegister}
        disabled={loading || !isFormValid}
      >
        <Text style={[styles.buttonText, { color: isFormValid ? '#FFFFFF' : colors.textSecondary }]}>
          {loading ? "• • •" : t('auth.crearCuenta')}
        </Text>
      </TouchableOpacity>

      {isModal && onSwitchToLogin ? (
        <TouchableOpacity style={styles.link} onPress={onSwitchToLogin}>
          <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.yaTienesCuenta')}</Text>
        </TouchableOpacity>
      ) : (
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.yaTienesCuenta')}</Text>
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
    marginBottom: 0,
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  topInput: {
    borderBottomWidth: 2,
    borderRadius: 0,
  },
  middleInput: {
    borderBottomWidth: 2,
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
  errorContainer: {
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    textAlign: "center",
    fontFamily: FONTS.body,
  },
  success: {
    textAlign: "center",
    fontFamily: FONTS.body,
    paddingHorizontal: 16,
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
