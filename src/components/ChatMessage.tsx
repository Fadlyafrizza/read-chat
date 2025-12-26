import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';
import { Colors } from '../constants/colors';

interface ChatMessageProps {
  message: Message;
  senderColor?: string;
  showSender?: boolean;
}

export function ChatMessage({ message, senderColor, showSender }: ChatMessageProps) {
  const bubbleStyle = message.isOwn ? styles.ownBubble : styles.receivedBubble;
  const containerStyle = message.isOwn ? styles.ownContainer : styles.receivedContainer;

  const time = message.date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.messageContainer, containerStyle]}>
      {showSender && !message.isOwn && (
        <Text style={[styles.sender, { color: senderColor }]}>
          {message.sender}
        </Text>
      )}
      <View style={[styles.bubble, bubbleStyle]}>
        <Text style={styles.content}>{message.content}</Text>
        {message.attachmentName && (
          <Text style={styles.attachment}>📎 {message.attachmentName}</Text>
        )}
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
  },
  sender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 8,
  },
  bubble: {
    padding: 10,
    borderRadius: 8,
  },
  ownBubble: {
    backgroundColor: Colors.sentMessage,
    borderBottomRightRadius: 2,
  },
  receivedBubble: {
    backgroundColor: Colors.receivedMessage,
    borderBottomLeftRadius: 2,
  },
  content: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  attachment: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
});
