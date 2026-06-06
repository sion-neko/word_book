import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { initDatabase } from './src/db/database';
import Navigation from './src/navigation';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDatabase();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Navigation />
    </>
  );
}
