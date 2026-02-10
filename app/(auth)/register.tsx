import { View } from "react-native";
import { useRouter } from "expo-router";
import { RegisterForm } from '../../src/components/auth/RegisterForm';

export default function Register() {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <RegisterForm
        onSuccess={() => router.replace("/home")}
        onClose={() => router.replace("/welcome")}
      />
    </View>
  );
}
