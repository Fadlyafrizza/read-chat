import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Chat } from '../src/types';
import { StorageService } from '../src/services/storage';
import { HtmlRenderer } from '../src/services/htmlRenderer';
import { ChatMessage } from '../src/components/ChatMessage';
import { Colors } from '../src/constants/colors';
import { formatDate } from '../src/utils/dateParser';

export default function ChatDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadChat();
  }, [params.chatId]);

  const loadChat = async () => {
    try {
      const chatId = params.chatId as string;
      const chats = await StorageService.getChats();
      const foundChat = chats.find(c => c.id === chatId);
      
      if (!foundChat) {
        Alert.alert('Error', 'Chat not found');
        router.back();
        return;
      }

      setChat(foundChat);
    } catch (error) {
      console.error('Error loading chat:', error);
      Alert.alert('Error', 'Failed to load chat');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!chat) return;

    try {
      setIsExporting(true);
      const htmlPath = await HtmlRenderer.exportToHtml(chat);
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(htmlPath, {
          mimeType: 'text/html',
          dialogTitle: 'Export Chat',
          UTI: 'public.html',
        });
      } else {
        Alert.alert('Success', `Chat exported to: ${htmlPath}`);
      }
    } catch (error) {
      console.error('Error exporting chat:', error);
      Alert.alert('Error', 'Failed to export chat');
    } finally {
      setIsExporting(false);
    }
  };

  const renderMessages = () => {
    if (!chat) return null;

    let lastDate = '';
    const elements: JSX.Element[] = [];

    chat.messages.forEach((message, index) => {
      const messageDate = formatDate(message.date);
      
      // Add date separator if date changed
      if (messageDate !== lastDate) {
        elements.push(
          <View key={`date-${index}`} style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{messageDate}</Text>
          </View>
        );
        lastDate = messageDate;
      }

      elements.push(
        <ChatMessage
          key={message.id}
          message={message}
          senderColor={chat.senderColorMap[message.sender]}
          showSender={chat.isGroupChat}
        />
      );
    });

    return elements;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  if (!chat) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Chat not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.chatName}>{chat.name}</Text>
        <Text style={styles.chatInfo}>
          {chat.messages.length} messages • {chat.isGroupChat ? 'Group Chat' : 'Private Chat'}
        </Text>
      </View>

      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {renderMessages()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <ActivityIndicator color={Colors.white} style={styles.buttonLoader} />
              <Text style={styles.exportButtonText}>Exporting...</Text>
            </>
          ) : (
            <>
              <Text style={styles.exportIcon}>📤</Text>
              <Text style={styles.exportButtonText}>Export to HTML</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chatName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  chatInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesContent: {
    padding: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    backgroundColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  exportButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  exportButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLoader: {
    marginRight: 8,
  },
});
