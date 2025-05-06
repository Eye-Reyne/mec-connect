// lib/db/provider.tsx
import { SQLiteProvider } from 'expo-sqlite';
import React from 'react';
import { migrateDatabase } from './init';

interface DatabaseProviderProps {
  children: React.ReactNode;
}

/**
 * Database provider component for the application
 * Uses SQLiteProvider from expo-sqlite to provide database context
 */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  return (
    <SQLiteProvider
      databaseName="mec_connect_app.db"
      onInit={migrateDatabase}
      useSuspense
    >
      {children}
    </SQLiteProvider>
  );
}