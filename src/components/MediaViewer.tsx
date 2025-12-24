import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface MediaViewerProps {
  uri: string;
  type: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
}

export function MediaViewer({ uri, type, fileName }: MediaViewerProps) {
  if (type === 'image') {
    return (
      <TouchableOpacity style={styles.container}>
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.mediaPlaceholder}>
      <Text style={styles.mediaIcon}>
        {type === 'video' ? '🎥' : type === 'audio' ? '🎵' : '📄'}
      </Text>
      <Text style={styles.mediaText}>{fileName || `${type} file`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  mediaPlaceholder: {
    padding: 16,
    backgroundColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  mediaIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mediaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
