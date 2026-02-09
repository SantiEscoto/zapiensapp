import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Cargamos supabase solo al montar para no romper el bundle inicial en web (polyfills/React 19)
export default function Index() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    import('../src/services/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setHasSession(!!session);
      });
    });
  }, []);

  useEffect(() => {
    if (hasSession === null) return;
    if (hasSession) {
      router.replace('/(main)/home');
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [hasSession, router]);

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});