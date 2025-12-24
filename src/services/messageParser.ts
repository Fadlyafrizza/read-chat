import { Message, ParsedChat, ParserOptions } from '../types';
import { parseWhatsAppDate } from '../utils/dateParser';
import { Validators } from '../utils/validators';

/**
 * Service for parsing WhatsApp chat messages
 */
export class MessageParser {
  /**
   * Parse chat text file into structured messages
   */
  static parseChat(
    content: string,
    options: ParserOptions = {}
  ): ParsedChat {
    try {
      if (!content || content.trim().length === 0) {
        throw new Error('Chat content is empty');
      }

      const lines = content.split('\n');
      const messages: Message[] = [];
      const senders = new Set<string>();
      
      // Detect date format from first message
      const dateFormat = this.detectDateFormat(lines);
      if (!dateFormat) {
        throw new Error('Could not detect date format');
      }

      let currentMessage: Partial<Message> | null = null;

      for (const line of lines) {
        if (!line.trim()) continue;

        // Try to parse as new message
        const parsed = this.parseMessageLine(line, dateFormat);

        if (parsed) {
          // Save previous message if exists
          if (currentMessage && currentMessage.content) {
            messages.push(this.finalizeMessage(currentMessage, options));
            if (currentMessage.sender) {
              senders.add(currentMessage.sender);
            }
          }

          // Start new message
          currentMessage = parsed;
        } else if (currentMessage) {
          // Continuation of previous message
          currentMessage.content = (currentMessage.content || '') + '\n' + line;
        }
      }

      // Add last message
      if (currentMessage && currentMessage.content) {
        messages.push(this.finalizeMessage(currentMessage, options));
        if (currentMessage.sender) {
          senders.add(currentMessage.sender);
        }
      }

      const sendersArray = Array.from(senders);
      const senderColorMap = this.generateSenderColors(sendersArray);

      return {
        messages,
        senders: sendersArray,
        senderColorMap,
        dateFormat,
      };
    } catch (error) {
      console.error('Error parsing chat:', error);
      throw error;
    }
  }

  /**
   * Detect date format from chat content
   */
  private static detectDateFormat(lines: string[]): string | null {
    const formats = ['DD/MM/YY', 'MM/DD/YY', 'YYYY/MM/DD', 'DD.MM.YY', 'MM.DD.YY'];
    
    for (const line of lines.slice(0, 50)) {
      for (const format of formats) {
        if (this.testDateFormat(line, format)) {
          return format;
        }
      }
    }
    
    return null;
  }

  /**
   * Test if line matches given date format
   */
  private static testDateFormat(line: string, format: string): boolean {
    try {
      const delimiter = format.includes('.') ? '\\.' : '/';
      const datePattern = format
        .replace(/DD/g, '\\d{1,2}')
        .replace(/MM/g, '\\d{1,2}')
        .replace(/YY/g, '\\d{2,4}')
        .replace(/YYYY/g, '\\d{4}');
      
      const regex = new RegExp(
        `^\\[?(${datePattern}[${delimiter}])?,\\s*\\d{1,2}[:.]\\d{2}(?:[:.]\\d{2})?\\s*(?:AM|PM)?\\]?\\s*-\\s*.+:.+`,
        'i'
      );
      
      return regex.test(line);
    } catch {
      return false;
    }
  }

  /**
   * Parse a single message line
   */
  private static parseMessageLine(
    line: string,
    dateFormat: string
  ): Partial<Message> | null {
    try {
      // WhatsApp message format: [date, time] - sender: message
      // or: date, time - sender: message
      const regex = /^\[?([^\]]+)\]?\s*-\s*([^:]+):\s*(.+)$/;
      const match = line.match(regex);

      if (!match) return null;

      const dateTimeStr = match[1].trim();
      const sender = Validators.sanitizeString(match[2]);
      const content = match[3].trim();

      if (!sender || !content) return null;

      const date = parseWhatsAppDate(dateTimeStr, dateFormat);
      if (!date) return null;

      // Check for attachment
      const attachmentInfo = this.extractAttachment(content);

      return {
        id: `${date.getTime()}-${Math.random()}`,
        timestamp: dateTimeStr,
        date,
        sender,
        content: attachmentInfo.content,
        attachmentName: attachmentInfo.attachmentName,
        mediaType: attachmentInfo.mediaType,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract attachment information from message content
   */
  private static extractAttachment(content: string): {
    content: string;
    attachmentName?: string;
    mediaType?: 'image' | 'video' | 'audio' | 'document';
  } {
    // Check for attachment patterns
    const attachmentPatterns = [
      /<attached: (.+)>/i,
      /\(file attached\)/i,
      /image omitted/i,
      /video omitted/i,
      /audio omitted/i,
      /document omitted/i,
      /(.+\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mp3|wav|ogg|pdf|doc|docx))/i,
    ];

    for (const pattern of attachmentPatterns) {
      const match = content.match(pattern);
      if (match) {
        const attachmentName = match[1] || match[0];
        const mediaType = Validators.getMediaType(attachmentName);
        
        return {
          content,
          attachmentName,
          mediaType: mediaType || undefined,
        };
      }
    }

    return { content };
  }

  /**
   * Finalize message with additional processing
   */
  private static finalizeMessage(
    message: Partial<Message>,
    options: ParserOptions
  ): Message {
    const isOwn = options.ownName
      ? message.sender === options.ownName
      : false;

    return {
      id: message.id || `${Date.now()}-${Math.random()}`,
      timestamp: message.timestamp || '',
      date: message.date || new Date(),
      sender: message.sender || 'Unknown',
      content: message.content || '',
      isOwn,
      attachmentName: message.attachmentName,
      attachmentPath: message.attachmentPath,
      mediaType: message.mediaType,
    };
  }

  /**
   * Generate color map for senders
   */
  private static generateSenderColors(senders: string[]): { [sender: string]: string } {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
    ];

    const colorMap: { [sender: string]: string } = {};
    senders.forEach((sender, index) => {
      colorMap[sender] = colors[index % colors.length];
    });

    return colorMap;
  }

  /**
   * Check if chat is group chat
   */
  static isGroupChat(senders: string[]): boolean {
    return senders.length > 2;
  }
}
