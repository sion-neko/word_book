import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AudioModeScreen from '../screens/AudioModeScreen';
import EditCardScreen from '../screens/EditCardScreen';
import FolderScreen from '../screens/FolderScreen';
import HomeScreen from '../screens/HomeScreen';
import PronunciationDictScreen from '../screens/PronunciationDictScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StudyScreen from '../screens/StudyScreen';
import { useThemeSettings } from '../theme/ThemeContext';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  const { theme: t, dark } = useThemeSettings();
  const navTheme = dark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: t.bg } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: t.bg } };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Folder" component={FolderScreen} />
        <Stack.Screen name="EditCard" component={EditCardScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="PronunciationDict" component={PronunciationDictScreen} />
        <Stack.Screen name="Study" component={StudyScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="AudioMode" component={AudioModeScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
