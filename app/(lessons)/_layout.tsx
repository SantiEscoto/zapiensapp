import { Stack } from "expo-router";

export default function LessonsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="flashcard" options={{ headerShown: false }} />
      <Stack.Screen name="match" options={{ headerShown: false }} />
      <Stack.Screen name="spinning" options={{ headerShown: false }} />
      <Stack.Screen name="quiz" options={{ headerShown: false }} />
      <Stack.Screen name="wordsearch" options={{ headerShown: false }} />
      <Stack.Screen name="crossword" options={{ headerShown: false }} />
    </Stack>
  );
} 