import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import DeckDetailScreen from '../screens/DeckDetailScreen';
import DecksScreen from '../screens/DecksScreen';
import ListenScreen from '../screens/ListenScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WordFormScreen from '../screens/WordFormScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Decks" component={DecksScreen} />
        <Stack.Screen name="DeckDetail" component={DeckDetailScreen} />
        <Stack.Screen name="WordForm" component={WordFormScreen} />
        <Stack.Screen name="Listen" component={ListenScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
