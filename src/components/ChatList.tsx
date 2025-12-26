import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Chat } from '../types';
import { Colors } from '../constants/colors';

interface ChatListProps {
  chats: Chat[];
  onChatPress: (chat: Chat) => void;
  onDeleteChat: (chatId: string) => void;
}

export function ChatList({ chats, onChatPress, onDeleteChat }: ChatListProps) {
  const handleDelete = (chatId: string, chatName: string) => {
    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete "${chatName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteChat(chatId),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => onChatPress(item)}
      onLongPress={() => handleDelete(item.id, item.name)}
    >
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.chatDetails}>
          {item.messages.length} messages • {item.isGroupChat ? 'Group' : 'Private'}
        </Text>
        <Text style={styles.chatDate}>
          {item.createdAt.toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.chevron}>
        <Text style={styles.chevronText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  if (chats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No chats imported yet</Text>
        <Text style={styles.emptySubtext}>
          Tap "Import Chat" to get started
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={chats}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  chatItem: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  chatDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  chatDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chevron: {
    marginLeft: 8,
  },
  chevronText: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
