import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';

export function useFilePicker() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick file';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { pickFile, isLoading, error };
}
