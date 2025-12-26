export const Config = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  chunkSize: 1024 * 1024, // 1MB
  supportedFormats: ['.zip'],
  operationTimeout: 300000, // 5 minutes
  mediaExtensions: {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic'],
    video: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
    audio: ['.mp3', '.wav', '.ogg', '.m4a', '.opus', '.aac'],
    document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
  },
};
