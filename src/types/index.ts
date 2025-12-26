export interface Message {
  id: string;
  timestamp: string;
  date: Date;
  sender: string;
  content: string;
  isOwn: boolean;
  attachmentName?: string;
  attachmentPath?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
}

export interface Chat {
  id: string;
  name: string;
  isGroupChat: boolean;
  messages: Message[];
  senders: string[];
  zipPath: string;
  extractedPath?: string;
  mediaFiles: string[];
  senderColorMap: { [sender: string]: string };
  createdAt: Date;
}

export interface ParsedChat {
  messages: Message[];
  senders: string[];
  senderColorMap: { [sender: string]: string };
  dateFormat: string;
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface ParserOptions {
  ownName?: string;
  dateRange?: DateRange;
}
