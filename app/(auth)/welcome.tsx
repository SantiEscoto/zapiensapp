import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform, Modal, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FONTS } from '../../src/services/fonts';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { FinisherHeaderBackground } from '../../src/components/common/FinisherHeaderBackground';
import { LoginForm } from '../../src/components/auth/LoginForm';
import { RegisterForm } from '../../src/components/auth/RegisterForm';
import { languages } from '../../src/services/languages';
import type { Locale } from '../../src/services/translations';

const FLAG_IMAGES: Record<Locale, number> = {
  en: require('../../assets/flags/en.png'),
  es: require('../../assets/flags/es.png'),
  fr: require('../../assets/flags/fr.png'),
  de: require('../../assets/flags/de.png'),
  it: require('../../assets/flags/it.png'),
  pt: require('../../assets/flags/pt.png'),
  ja: require('../../assets/flags/ja.png'),
  zh: require('../../assets/flags/zh.png'),
  ko: require('../../assets/flags/ko.png'),
  ru: require('../../assets/flags/ru.png'),
};

export default function Welcome() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, setLocale } = useLanguage();
  const { colors } = theme;
  const [backgroundKey, setBackgroundKey] = useState(0);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setBackgroundKey((k) => k + 1);
    }, [])
  );

  const handleAuthSuccess = useCallback(() => {
    setAuthModal(null);
    router.replace('/home');
  }, [router]);

  const handleSelectLocale = useCallback((code: Locale) => {
    setLocale(code);
    setLanguageModalVisible(false);
  }, [setLocale]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.languageButton, { backgroundColor: colors.card }]}
        onPress={() => setLanguageModalVisible(true)}
        accessibilityLabel={t('settings.idioma')}
      >
        <Ionicons name="language" size={26} color={colors.primary} />
      </TouchableOpacity>

      {Platform.OS === 'web' && <FinisherHeaderBackground key={backgroundKey} />}
      <View style={[styles.contentContainer, styles.contentAboveBackground]}>
        <Image
          source={require('../../assets/logo.png')}
          style={[styles.logo, { tintColor: colors.text }]}
          resizeMode="contain"
          accessibilityLabel="Zapiens logo"
        />
        <Image
          source={require('../../assets/full_logo.png')}
          style={[styles.fullLogo, { tintColor: colors.text }]}
          resizeMode="contain"
          accessibilityLabel="Zapiens"
        />
        <Text style={[styles.heroTitle, { color: colors.text }]}>
          {t('welcome.heroTitle')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          {t('welcome.heroSubtitle')}
        </Text>
      </View>

      <View style={[styles.buttonContainer, styles.contentAboveBackground]}>
        <TouchableOpacity
          style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
          onPress={() => setAuthModal('register')}
          activeOpacity={0.85}
        >
          <Text style={styles.getStartedText}>{t('welcome.getStarted')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, { borderColor: colors.primary }]}
          onPress={() => setAuthModal('login')}
          activeOpacity={0.85}
        >
          <Text style={[styles.loginText, { color: colors.primary }]}>
            {t('welcome.login')}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.languageModalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={[styles.languageModalContent, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.languageModalTitle, { color: colors.text }]}>{t('settings.idioma')}</Text>
            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.languageRow, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectLocale(lang.code as Locale)}
                  activeOpacity={0.7}
                >
                  <Image source={FLAG_IMAGES[lang.code as Locale]} style={styles.flagIcon} resizeMode="contain" />
                  <Text style={[styles.languageName, { color: colors.text }]}>{lang.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={authModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setAuthModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {authModal === 'login' && (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onClose={() => setAuthModal(null)}
                  onSwitchToRegister={() => setAuthModal('register')}
                  isModal
                />
              )}
              {authModal === 'register' && (
                <RegisterForm
                  onSuccess={handleAuthSuccess}
                  onClose={() => setAuthModal(null)}
                  onSwitchToLogin={() => setAuthModal('login')}
                  isModal
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentAboveBackground: {
    zIndex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 0,
  },
  fullLogo: {
    width: 200,
    height: 56,
    marginBottom: 40,
  },
  heroTitle: {
    fontFamily: FONTS.title,
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 32,
    marginTop: 40,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingBottom: 40,
  },
  getStartedButton: {
    borderRadius: 50,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  getStartedText: {
    color: '#FFFFFF', // texto sobre primary (contraste por tema)
    fontSize: 16,
    fontFamily: FONTS.title,
    letterSpacing: 1,
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderRadius: 50,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  loginText: {
    fontSize: 16,
    fontFamily: FONTS.title,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalScroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  languageButton: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  languageModalContent: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  languageModalTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  languageList: {
    maxHeight: 400,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  flagIcon: {
    width: 28,
    height: 20,
    marginRight: 12,
  },
  languageName: {
    fontFamily: FONTS.body,
    fontSize: 16,
  },
});
