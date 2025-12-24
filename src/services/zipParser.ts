import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import { Chat } from '../types';
import { MessageParser } from './messageParser';
import { Validators } from '../utils/validators';
import { Config } from '../constants/config';

/**
 * Service for parsing WhatsApp ZIP exports
 */
export class ZipParser {
  /**
   * Parse WhatsApp chat ZIP file
   */
  static async parseZipFile(zipUri: string): Promise<Chat> {
    try {
      // Validate file
      if (!Validators.isValidZipFile(zipUri)) {
        throw new Error('Invalid file type. Please select a ZIP file.');
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(zipUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Check file size
      const fileSize = fileInfo.size || 0;
      if (!Validators.isValidFileSize(fileSize)) {
        throw new Error(`File too large. Maximum size is ${Config.maxFileSize / 1024 / 1024}MB`);
      }

      if (fileSize > 50 * 1024 * 1024) {
        console.warn('Large file detected, processing may take longer');
      }

      // Create extraction directory
      const extractPath = `${FileSystem.cacheDirectory}chat_${Date.now()}`;
      await FileSystem.makeDirectoryAsync(extractPath, { intermediates: true });

      try {
        // Extract ZIP
        const extractedPath = await this.extractZip(zipUri, extractPath);
        
        // Find chat file
        const chatFilePath = await this.findChatFile(extractedPath);
        if (!chatFilePath) {
          throw new Error('No chat file found in ZIP. Expected _chat.txt or .txt file.');
        }

        // Read chat content
        const content = await FileSystem.readAsStringAsync(chatFilePath, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (!content || content.trim().length === 0) {
          throw new Error('Chat file is empty');
        }

        // Parse messages
        const parsed = MessageParser.parseChat(content);

        // Find media files
        const mediaFiles = await this.findMediaFiles(extractedPath);

        // Map media files to messages
        this.mapMediaToMessages(parsed.messages, mediaFiles, extractedPath);

        // Create chat object
        const chat: Chat = {
          id: `chat_${Date.now()}`,
          name: this.extractChatName(chatFilePath) || 'Imported Chat',
          isGroupChat: MessageParser.isGroupChat(parsed.senders),
          messages: parsed.messages,
          senders: parsed.senders,
          zipPath: zipUri,
          extractedPath,
          mediaFiles,
          senderColorMap: parsed.senderColorMap,
          createdAt: new Date(),
        };

        return chat;
      } catch (error) {
        // Cleanup on error
        try {
          await FileSystem.deleteAsync(extractPath, { idempotent: true });
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error parsing ZIP file:', error);
      throw error;
    }
  }

  /**
   * Extract ZIP file
   */
  private static async extractZip(zipUri: string, extractPath: string): Promise<string> {
    try {
      // Read ZIP file as base64
      const zipContent = await FileSystem.readAsStringAsync(zipUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Load ZIP
      const zip = await JSZip.loadAsync(zipContent, { base64: true });

      // Extract all files
      const promises: Promise<void>[] = [];
      
      zip.forEach((relativePath, file) => {
        if (file.dir) {
          // Create directory
          const promise = FileSystem.makeDirectoryAsync(
            `${extractPath}/${relativePath}`,
            { intermediates: true }
          ).catch(() => {
            // Ignore directory creation errors
          });
          promises.push(promise);
        } else {
          // Extract file
          const promise = file.async('base64').then(async (content) => {
            const filePath = `${extractPath}/${relativePath}`;
            const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
            
            // Ensure directory exists
            await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true })
              .catch(() => {}); // Ignore if already exists
            
            // Write file
            await FileSystem.writeAsStringAsync(filePath, content, {
              encoding: FileSystem.EncodingType.Base64,
            });
          });
          promises.push(promise);
        }
      });

      await Promise.all(promises);
      
      return extractPath;
    } catch (error) {
      console.error('Error extracting ZIP:', error);
      throw error instanceof Error ? error : new Error('Failed to extract ZIP file');
    }
  }

  /**
   * Find chat text file in extracted directory
   */
  private static async findChatFile(dirPath: string): Promise<string | null> {
    try {
      const files = await FileSystem.readDirectoryAsync(dirPath);
      
      // Look for _chat.txt (iOS) or .txt files (Android)
      const chatFile = files.find(
        (file) => file.endsWith('_chat.txt') || file.endsWith('.txt')
      );

      if (chatFile) {
        return `${dirPath}/${chatFile}`;
      }

      // Search subdirectories
      for (const file of files) {
        const filePath = `${dirPath}/${file}`;
        const info = await FileSystem.getInfoAsync(filePath);
        
        if (info.isDirectory) {
          const subResult = await this.findChatFile(filePath);
          if (subResult) return subResult;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding chat file:', error);
      return null;
    }
  }

  /**
   * Find media files in extracted directory
   */
  private static async findMediaFiles(dirPath: string): Promise<string[]> {
    try {
      const mediaFiles: string[] = [];
      const files = await FileSystem.readDirectoryAsync(dirPath);

      for (const file of files) {
        const filePath = `${dirPath}/${file}`;
        const info = await FileSystem.getInfoAsync(filePath);

        if (info.isDirectory) {
          const subFiles = await this.findMediaFiles(filePath);
          mediaFiles.push(...subFiles);
        } else if (Validators.getMediaType(file)) {
          mediaFiles.push(filePath);
        }
      }

      return mediaFiles;
    } catch (error) {
      console.error('Error finding media files:', error);
      return [];
    }
  }

  /**
   * Map media files to messages based on filename
   */
  private static mapMediaToMessages(
    messages: any[],
    mediaFiles: string[],
    basePath: string
  ): void {
    for (const message of messages) {
      if (!message.attachmentName) continue;

      // Find matching media file
      const mediaFile = mediaFiles.find((file) =>
        file.includes(message.attachmentName)
      );

      if (mediaFile) {
        message.attachmentPath = mediaFile;
      }
    }
  }

  /**
   * Extract chat name from file path
   */
  private static extractChatName(filePath: string): string | null {
    try {
      const fileName = filePath.split('/').pop();
      if (!fileName) return null;

      // Remove extension and _chat suffix
      return fileName
        .replace('_chat.txt', '')
        .replace('.txt', '')
        .replace(/_/g, ' ')
        .trim();
    } catch {
      return null;
    }
  }

  /**
   * Delete chat and cleanup files
   */
  static async deleteChat(chat: Chat): Promise<void> {
    try {
      if (chat.extractedPath) {
        await FileSystem.deleteAsync(chat.extractedPath, { idempotent: true });
      }
    } catch (error) {
      console.error('Error deleting chat files:', error);
      throw error;
    }
  }
}
