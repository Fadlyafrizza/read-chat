import * as FileSystem from 'expo-file-system';
import { Chat, Message } from '../types';
import { formatDate } from '../utils/dateParser';

/**
 * Service for rendering chat to HTML
 */
export class HtmlRenderer {
  /**
   * Render chat to HTML string
   */
  static renderChatToHtml(chat: Chat): string {
    const styles = this.getStyles();
    const messagesHtml = this.renderMessages(chat);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${chat.name}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    <h1 class="chat-title">${chat.name}</h1>
    <p class="chat-info">
      ${chat.messages.length} messages • 
      ${chat.isGroupChat ? 'Group Chat' : 'Private Chat'}
    </p>
    <div class="messages">
      ${messagesHtml}
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get CSS styles
   */
  private static getStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background-color: #ECE5DD;
        padding: 20px;
        line-height: 1.4;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .chat-title {
        color: #128C7E;
        margin-bottom: 10px;
        font-size: 24px;
      }
      
      .chat-info {
        color: #667781;
        margin-bottom: 20px;
        font-size: 14px;
      }
      
      .messages {
        background-color: #ECE5DD;
        border-radius: 8px;
        padding: 20px;
        min-height: 400px;
      }
      
      .date-separator {
        text-align: center;
        margin: 20px 0;
        position: relative;
      }
      
      .date-separator span {
        background-color: #E0E0E0;
        padding: 5px 12px;
        border-radius: 8px;
        font-size: 12px;
        color: #667781;
        display: inline-block;
      }
      
      .message {
        margin-bottom: 10px;
        display: flex;
        flex-direction: column;
        max-width: 70%;
      }
      
      .message.own {
        align-self: flex-end;
        margin-left: auto;
      }
      
      .message.received {
        align-self: flex-start;
        margin-right: auto;
      }
      
      .sender {
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 3px;
        padding-left: 8px;
      }
      
      .bubble {
        padding: 8px 12px;
        border-radius: 8px;
        word-wrap: break-word;
        position: relative;
      }
      
      .message.own .bubble {
        background-color: #DCF8C6;
        border-bottom-right-radius: 2px;
      }
      
      .message.received .bubble {
        background-color: white;
        border-bottom-left-radius: 2px;
      }
      
      .message-content {
        margin-bottom: 4px;
        white-space: pre-wrap;
        word-break: break-word;
      }
      
      .message-time {
        font-size: 11px;
        color: #667781;
        text-align: right;
        margin-top: 4px;
      }
      
      .attachment {
        margin-top: 8px;
        padding: 8px;
        background-color: rgba(0,0,0,0.05);
        border-radius: 4px;
        font-size: 12px;
        font-style: italic;
        color: #667781;
      }
      
      .media-preview {
        max-width: 100%;
        border-radius: 8px;
        margin-top: 8px;
      }
    `;
  }

  /**
   * Render messages to HTML
   */
  private static renderMessages(chat: Chat): string {
    let html = '';
    let lastDate = '';

    for (const message of chat.messages) {
      const messageDate = formatDate(message.date);
      
      // Add date separator if date changed
      if (messageDate !== lastDate) {
        html += `<div class="date-separator"><span>${messageDate}</span></div>`;
        lastDate = messageDate;
      }

      html += this.renderMessage(message, chat);
    }

    return html;
  }

  /**
   * Render single message
   */
  private static renderMessage(message: Message, chat: Chat): string {
    const className = message.isOwn ? 'own' : 'received';
    const senderColor = chat.senderColorMap[message.sender] || '#000000';
    const time = message.date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let attachmentHtml = '';
    if (message.attachmentName) {
      attachmentHtml = `<div class="attachment">📎 ${this.escapeHtml(message.attachmentName)}</div>`;
    }

    return `
      <div class="message ${className}">
        ${!message.isOwn && chat.isGroupChat ? `<div class="sender" style="color: ${senderColor}">${this.escapeHtml(message.sender)}</div>` : ''}
        <div class="bubble">
          <div class="message-content">${this.escapeHtml(message.content)}</div>
          ${attachmentHtml}
          <div class="message-time">${time}</div>
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Export chat to HTML file
   */
  static async exportToHtml(chat: Chat): Promise<string> {
    try {
      const html = this.renderChatToHtml(chat);
      const fileName = `${chat.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.html`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, html, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return filePath;
    } catch (error) {
      console.error('Error exporting to HTML:', error);
      throw new Error('Failed to export chat to HTML');
    }
  }
}
