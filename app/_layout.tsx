import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../src/components/ErrorBoundary';
import { ErrorHandler } from '../src/utils/errorHandler';

// Setup global error handler
ErrorHandler.setup();

export default function RootLayout() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo);
        ErrorHandler.logError(error);
      }}
      onReset={() => {
        console.log('Resetting app state...');
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen 
            name="index" 
            options={{ 
              title: 'WhatsApp Chat Parser',
              headerStyle: { backgroundColor: '#128C7E' },
              headerTintColor: '#fff',
            }} 
          />
          <Stack.Screen 
            name="chat-detail" 
            options={{ 
              title: 'Chat',
              headerStyle: { backgroundColor: '#128C7E' },
              headerTintColor: '#fff',
            }} 
          />
        </Stack>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
