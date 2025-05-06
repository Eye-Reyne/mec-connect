import { DatabaseProvider } from '@/lib/db/provider';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';


import { useColorScheme } from '@/hooks/useColorScheme';

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0066cc" />
      <Text style={styles.loadingText}>Loading database...</Text>
    </View>
  );
}


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    ExtraBold: require('../assets/fonts/Montserrat-ExtraBold.ttf'),
    Bold: require('../assets/fonts/Montserrat-Bold.ttf'),
    SemiBold: require('../assets/fonts/Montserrat-SemiBold.ttf'),
    Medium: require('../assets/fonts/Montserrat-Medium.ttf'),
    Regular: require('../assets/fonts/Montserrat-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <DatabaseProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(admin)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
      </ThemeProvider>
      </DatabaseProvider>
    </Suspense>
  );
}


const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
});