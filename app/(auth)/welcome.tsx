import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform, Modal, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { FONTS } from '../../src/services/fonts';
import { useTheme } from '../../src/context/ThemeContext';
import { FinisherHeaderBackground } from '../../src/components/common/FinisherHeaderBackground';
import { LoginForm } from '../../src/components/auth/LoginForm';
import { RegisterForm } from '../../src/components/auth/RegisterForm';

export default function Welcome() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const [backgroundKey, setBackgroundKey] = useState(0);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  useFocusEffect(
    useCallback(() => {
      setBackgroundKey((k) => k + 1);
    }, [])
  );

  const handleAuthSuccess = useCallback(() => {
    setAuthModal(null);
    router.replace('/home');
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          ONE APP TO{"\n"}LEARN IT ALL
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Join us and be part{"\n"}of this revolution
        </Text>
      </View>

      <View style={[styles.buttonContainer, styles.contentAboveBackground]}>
        <TouchableOpacity
          style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
          onPress={() => setAuthModal('register')}
          activeOpacity={0.85}
        >
          <Text style={styles.getStartedText}>GET STARTED</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, { borderColor: colors.primary }]}
          onPress={() => setAuthModal('login')}
          activeOpacity={0.85}
        >
          <Text style={[styles.loginText, { color: colors.primary }]}>
            I ALREADY HAVE AN ACCOUNT
          </Text>
        </TouchableOpacity>
      </View>

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
});
