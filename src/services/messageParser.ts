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
    // Common WhatsApp date formats in order of prevalence
    const formats = [
      'DD/MM/YY',   // 31/12/23 (most common internationally)
      'MM/DD/YY',   // 12/31/23 (US format)
      'DD/MM/YYYY', // 31/12/2023 (full year)
      'MM/DD/YYYY', // 12/31/2023 (US full year)
      'YYYY/MM/DD', // 2023/12/31 (ISO-like)
      'DD.MM.YY',   // 31.12.23 (European)
      'MM.DD.YY',   // 12.31.23 (US with dots)
      'DD.MM.YYYY', // 31.12.2023 (European full)
      'DD-MM-YY',   // 31-12-23 (with dashes)
      'MM-DD-YY',   // 12-31-23 (US with dashes)
      'DD-MM-YYYY', // 31-12-2023 (with dashes full)
      'YYYY-MM-DD', // 2023-12-31 (ISO format)
    ];
    
    // Check first 100 lines to find a matching format
    for (const line of lines.slice(0, 100)) {
      if (!line.trim()) continue;
      
      for (const format of formats) {
        if (this.testDateFormat(line, format)) {
          console.log(`Detected date format: ${format} from line: ${line.substring(0, 50)}`);
          return format;
        }
      }
    }
    
    // Log first few lines for debugging if no format found
    console.error('Could not detect date format. First lines:');
    lines.slice(0, 5).forEach((line, i) => {
      console.error(`Line ${i + 1}: ${line.substring(0, 100)}`);
    });
    
    return null;
  }

  /**
   * Test if line matches given date format
   * Builds a regex pattern to match WhatsApp message format:
   * [DD/MM/YY, HH:MM:SS AM/PM] - Sender: Message
   * Supports various date separators (/, ., -) and optional seconds
   */
  private static testDateFormat(line: string, format: string): boolean {
    try {
      // Determine delimiter from format
      let delimiter = '/';
      let escapedDelimiter = '/';
      if (format.includes('.')) {
        delimiter = '.';
        escapedDelimiter = '\\.';
      } else if (format.includes('-')) {
        delimiter = '-';
        escapedDelimiter = '-';
      }
      
      const datePattern = format
        .replace(/DD/g, '\\d{1,2}')
        .replace(/MM/g, '\\d{1,2}')
        .replace(/YY/g, '\\d{2,4}')
        .replace(/YYYY/g, '\\d{4}')
        .replace(/\//g, escapedDelimiter)
        .replace(/\./g, escapedDelimiter)
        .replace(/-/g, escapedDelimiter);
      
      // Pattern breakdown:
      // ^\[? - Optional opening bracket
      // (${datePattern}) - Date part with format-specific pattern (REQUIRED)
      // ,\s* - Comma and optional whitespace
      // \d{1,2}[:.]\\d{2}(?:[:.]\\d{2})? - Time (HH:MM or HH:MM:SS)
      // \s*(?:AM|PM)? - Optional AM/PM
      // \]? - Optional closing bracket
      // \s*-\s* - Separator dash with whitespace
      // [^:]+:.+ - Sender (no colons) then colon then message
      const regex = new RegExp(
        `^\\[?(${datePattern}),\\s*\\d{1,2}[:.]\\d{2}(?:[:.]\\d{2})?\\s*(?:AM|PM)?\\]?\\s*-\\s*[^:]+:.+`,
        'i'
      );
      
      return regex.test(line);
    } catch (error) {
      console.error(`Error testing date format ${format}:`, error);
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
