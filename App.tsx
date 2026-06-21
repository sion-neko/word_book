import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import {
  ZenKakuGothicNew_400Regular,
  ZenKakuGothicNew_500Medium,
  ZenKakuGothicNew_700Bold,
  ZenKakuGothicNew_900Black,
} from '@expo-google-fonts/zen-kaku-gothic-new';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { initDatabase } from './src/db/database';
import Navigation from './src/navigation';
import { ThemeProvider } from './src/theme/ThemeContext';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [fontsLoaded] = useFonts({
    ZenKakuGothicNew_400Regular,
    ZenKakuGothicNew_500Medium,
    ZenKakuGothicNew_700Bold,
    ZenKakuGothicNew_900Black,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  useEffect(() => {
    initDatabase();
    setDbReady(true);
  }, []);

  if (!dbReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1EEE8' }}>
        <ActivityIndicator size="large" color="#5B63D3" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Navigation />
    </ThemeProvider>
  );
}
