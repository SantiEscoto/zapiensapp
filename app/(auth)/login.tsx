import { View } from "react-native";
import { useRouter } from "expo-router";
import { LoginForm } from '../../src/components/auth/LoginForm';

export default function Login() {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <LoginForm
        onSuccess={() => router.replace("/home")}
        onClose={() => router.replace("/welcome")}
      />
    </View>
  );
}
