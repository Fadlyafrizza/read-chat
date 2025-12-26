import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Chat } from '../src/types';
import { StorageService } from '../src/services/storage';
import { ZipParser } from '../src/services/zipParser';
import { ChatList } from '../src/components/ChatList';
import { useFilePicker } from '../src/hooks/useFilePicker';
import { useChatParser } from '../src/hooks/useChatParser';
import { Colors } from '../src/constants/colors';

export default function IndexScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { pickFile } = useFilePicker();
  const { parseChat, isLoading: isParsing } = useChatParser();

  const loadChats = useCallback(async () => {
    try {
      const loadedChats = await StorageService.getChats();
      setChats(loadedChats.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      ));
    } catch (error) {
      console.error('Error loading chats:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleImportChat = async () => {
    try {
      const uri = await pickFile();
      if (!uri) return;

      const chat = await parseChat(uri);
      if (chat) {
        Alert.alert('Success', 'Chat imported successfully!');
        await loadChats();
      } else {
        Alert.alert('Error', 'Failed to parse chat. Please check the file format.');
      }
    } catch (error) {
      console.error('Error importing chat:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to import chat'
      );
    }
  };

  const handleChatPress = (chat: Chat) => {
    router.push({
      pathname: '/chat-detail',
      params: { chatId: chat.id },
    });
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        await ZipParser.deleteChat(chat);
      }
      await StorageService.deleteChat(chatId);
      await loadChats();
      Alert.alert('Success', 'Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      Alert.alert('Error', 'Failed to delete chat');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ChatList
          chats={chats}
          onChatPress={handleChatPress}
          onDeleteChat={handleDeleteChat}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.importButton, isParsing && styles.importButtonDisabled]}
          onPress={handleImportChat}
          disabled={isParsing}
        >
          {isParsing ? (
            <>
              <ActivityIndicator color={Colors.white} style={styles.buttonLoader} />
              <Text style={styles.importButtonText}>Importing...</Text>
            </>
          ) : (
            <Text style={styles.importButtonText}>Import Chat</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  importButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLoader: {
    marginRight: 8,
  },
});
