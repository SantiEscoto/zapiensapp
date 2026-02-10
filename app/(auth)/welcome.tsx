import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { FONTS } from '../../src/services/fonts';
import { useTheme } from '../../src/context/ThemeContext';
import { CharacterWavesBackground } from '../../src/components/common/CharacterWavesBackground';

export default function Welcome() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CharacterWavesBackground color={colors.textSecondary} />
      <View style={styles.contentContainer}>
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
          accessibilityLabel="ZapCards"
        />
        <Text style={[styles.heroTitle, { color: colors.text }]}>
          ONE APP TO{"\n"}LEARN IT ALL
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Join us and be part{"\n"}of this revolution
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/register')}
          activeOpacity={0.85}
        >
          <Text style={styles.getStartedText}>GET STARTED</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, { borderColor: colors.primary }]}
          onPress={() => router.push('/login')}
          activeOpacity={0.85}
        >
          <Text style={[styles.loginText, { color: colors.primary }]}>
            I ALREADY HAVE AN ACCOUNT
          </Text>
        </TouchableOpacity>
      </View>
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
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
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
    fontFamily: FONTS.bodyBold,
    letterSpacing: 0.5,
  },
});
