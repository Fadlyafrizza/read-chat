import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chat } from '../types';

const CHATS_KEY = '@read_chat:chats';

export class StorageService {
  static async saveChat(chat: Chat): Promise<void> {
    try {
      const chatsJson = await AsyncStorage.getItem(CHATS_KEY);
      const chats: Chat[] = chatsJson ? JSON.parse(chatsJson) : [];
      
      // Check if chat already exists
      const existingIndex = chats.findIndex(c => c.id === chat.id);
      if (existingIndex >= 0) {
        chats[existingIndex] = chat;
      } else {
        chats.push(chat);
      }
      
      await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chat:', error);
      throw error;
    }
  }

  static async getChats(): Promise<Chat[]> {
    try {
      const chatsJson = await AsyncStorage.getItem(CHATS_KEY);
      if (!chatsJson) return [];
      
      const chats = JSON.parse(chatsJson);
      
      // Convert date strings back to Date objects
      return chats.map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          date: new Date(msg.date),
        })),
      }));
    } catch (error) {
      console.error('Error getting chats:', error);
      return [];
    }
  }

  static async deleteChat(chatId: string): Promise<void> {
    try {
      const chatsJson = await AsyncStorage.getItem(CHATS_KEY);
      const chats: Chat[] = chatsJson ? JSON.parse(chatsJson) : [];
      const filtered = chats.filter(c => c.id !== chatId);
      await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CHATS_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}
