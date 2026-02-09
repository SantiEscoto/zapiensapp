import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useTheme } from '../../src/context/ThemeContext';
import { supabase } from '../../src/services/supabase';

export default function MainLayout() {
  const { theme } = useTheme();
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  useEffect(() => {
    if (hasSession === null) return;
    if (!hasSession) {
      router.replace('/(auth)/welcome');
    }
  }, [hasSession, router]);

  if (hasSession === null) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!hasSession) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Tabs screenOptions={{
      // Color settings for the tab icons and text
      tabBarActiveTintColor: theme.colors.primary,    // Color when tab is selected
      tabBarInactiveTintColor: theme.colors.textSecondary,  // Color when tab is not selected

      headerShown: false,     // Hide the top header bar
      tabBarShowLabel: false,  // Show the text labels under icons

      // Styling for the entire tab bar container
      tabBarStyle: {
        backgroundColor: theme.colors.card,  // Dark background color
        height: 120,                 // Increased height of the tab bar
        paddingBottom: 0,          // More padding at the bottom to move icons down
        paddingTop: 40,            // Adjusted top padding
        borderTopWidth: 2,          // Top border thickness
        borderTopColor: theme.colors.border
      },

      // Styling for the tab labels
      tabBarLabelStyle: {
        fontSize: 12,  // Size of the label text
      }
    }}>
      {/* Home Tab - You can customize with:
          - tabBarIcon: for custom icon
          - tabBarBadge: for notification badges
          - tabBarAccessibilityLabel: for accessibility
      */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <View style={[
              styles.iconContainer,
              focused && { 
                borderColor: theme.colors.primary,
                backgroundColor: `${theme.colors.primary}20`
              }
            ]}>
              <Image 
                source={focused ? require('../../assets/icons/homeopen.png') : require('../../assets/icons/home.png')}
                style={styles.tabIcon}
              />
            </View>
          ),
        }}
      />

      {/* Study Tab - Same customization options available */}
      <Tabs.Screen
        name="rankings"
        options={{
          title: "Rankings",
          tabBarIcon: ({ focused, color }) => (
            <View style={[
              styles.iconContainer,
              focused && { 
                borderColor: theme.colors.primary,
                backgroundColor: `${theme.colors.primary}20`
              }
            ]}>
              <Image 
                source={focused ? require('../../assets/icons/rankopen.png') : require('../../assets/icons/rank.png')}
                style={styles.tabIcon}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <View style={[
              styles.iconContainer,
              focused && { 
                borderColor: theme.colors.primary,
                backgroundColor: `${theme.colors.primary}20`
              }
            ]}>
              <Image 
                source={focused ? require('../../assets/icons/profileopen.png') : require('../../assets/icons/profile.png')}
                style={styles.tabIcon}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain'
  },
  iconContainer: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent'
  }
});