import { useState } from 'react';
import { Chat } from '../types';
import { ZipParser } from '../services/zipParser';
import { StorageService } from '../services/storage';

export function useChatParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const parseChat = async (uri: string): Promise<Chat | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress(0);

      const chat = await ZipParser.parseZipFile(uri);
      
      // Save to storage
      await StorageService.saveChat(chat);
      
      setProgress(100);
      return chat;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse chat';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { parseChat, isLoading, error, progress };
}
