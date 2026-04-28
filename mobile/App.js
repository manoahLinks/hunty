import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ReactQueryProvider from './providers/ReactQueryProvider';
import RootLayout from './app/_layout';

export default function App() {
  return (
    <ReactQueryProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <RootLayout />
      </SafeAreaProvider>
    </ReactQueryProvider>
  );
}
