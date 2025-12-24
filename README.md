# WhatsApp Chat Parser

A React Native mobile application for parsing and viewing WhatsApp chat exports.

## 🌟 Features

- 📱 Import WhatsApp chat ZIP exports
- 💬 View messages in WhatsApp-style interface
- 🖼️ Media attachment support (images, videos, audio)
- 📄 Export to HTML
- 🌍 Support for iOS and Android export formats
- 🎨 Group chat with colored sender names
- 📅 Date-based message grouping
- 🛡️ Comprehensive error handling
- 💾 Local storage with AsyncStorage

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/Fadlyafrizza/read-chat.git
cd read-chat

# Install dependencies
npm install

# Start development server
npx expo start
```

## 🚀 Usage

1. Tap "Import Chat" button on home screen
2. Select WhatsApp export ZIP file from device
3. Wait for parsing to complete
4. View messages in chat interface
5. Export to HTML if needed using share button

## 🏗️ Architecture

```
read-chat/
├── app/              # Expo Router screens
├── src/
│   ├── components/  # Reusable UI components
│   ├── services/    # Business logic
│   ├── utils/       # Helper functions
│   ├── types/       # TypeScript definitions
│   ├── hooks/       # Custom React hooks
│   └── constants/   # App-wide constants
└── assets/          # Static assets
```

## 🛡️ Error Handling

The app includes comprehensive error handling:
- Global error boundary
- Safe native module access
- Input validation
- File existence checks
- Memory management for large files
- Timeout handling for long operations

## 🔧 Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Expo Router** - File-based navigation
- **React Native Blob Util** - File operations
- **AsyncStorage** - Local persistence

## 📱 Supported Formats

- WhatsApp iOS exports (_chat.txt)
- WhatsApp Android exports (.txt)
- Date formats: DD/MM/YY, MM/DD/YY, YYYY/MM/DD
- Media: Images, Videos, Audio, Documents

## 🧪 Testing

```bash
# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## 📝 License

MIT

## 👨‍💻 Author

Fadly Afriza (@Fadlyafrizza)
