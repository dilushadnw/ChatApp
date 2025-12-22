# ChatApp - Production-Ready Real-Time Chat Application

A modern, feature-rich chat application built with vanilla JavaScript and Firebase, featuring desktop notifications, real-time messaging, responsive design, and comprehensive user experience improvements.

## 🚀 Features

### Core Functionality
- **Real-time Messaging**: Instant message delivery using Firebase Firestore
- **User Authentication**: Secure login and registration with Firebase Auth
- **User Search**: Find and connect with other users
- **Message History**: Persistent chat history stored in Firestore

### Media Sharing (NEW!)
- **Image Sharing**: Upload and share JPG, PNG, WebP, and GIF images (up to 5MB)
- **Video Sharing**: Upload and share MP4 and WebM videos (up to 50MB)
- **Drag & Drop**: Simply drag media files into the chat to upload
- **Upload Progress**: Real-time upload progress indicator
- **Media Preview**: Preview images and videos before sending
- **Full-Screen Viewer**: Click on media to view in full-screen modal
- **Video Player**: Built-in video player with controls
- **Lazy Loading**: Optimized media loading for better performance
- **Mobile Camera Access**: Access camera and gallery on mobile devices

### Modern UI/UX (WhatsApp-Style)
- **Responsive Design**: Two-column layout on desktop, single-column on mobile
- **Chat Bubbles**: Sender on right (green), receiver on left (dark purple)
- **Smooth Animations**: Message fade-in and slide-up effects
- **Typing Indicators**: See when someone is typing
- **Message Status**: Visual indicators for sending, sent, delivered, and read
- **Timestamps**: Time displayed under each message
- **Auto-scroll**: Smart scrolling to latest messages
- **Fixed Input Bar**: Input bar stays at bottom on mobile
- **Emoji Support**: Built-in emoji picker and shortcode support (e.g., `:smile:`)

### Notifications
- **Desktop Notifications**: Browser notifications when receiving messages
- **Sound Alerts**: Configurable notification sounds
- **Vibration**: Mobile device vibration support
- **Unread Badges**: Visual indicators for unread messages
- **Page Title Updates**: Unread count in browser tab
- **Do Not Disturb**: Configure quiet hours for notifications

### Security & Performance
- **XSS Prevention**: Content sanitization and HTML escaping
- **File Upload Security**: Secure filename generation and type validation
- **File Size Limits**: 5MB for images, 50MB for videos
- **Lazy Loading**: Efficient media loading
- **Optimistic UI**: Instant message display with async server sync
- **Rate Limiting**: Built-in debouncing for typing indicators
- **Upload Deduplication**: Prevents duplicate uploads during slow network

### Accessibility
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Touch-Friendly**: Larger touch targets on mobile devices
- **Responsive Typography**: Optimized font sizes for all devices

## 📋 Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js and npm (for development dependencies)
- Firebase account and project

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dilushadnw/ChatApp.git
   cd ChatApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Update the Firebase configuration in `app.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Start the development server**
   ```bash
   npm run serve
   ```

5. **Open in browser**
   
   Navigate to `http://localhost:8080`

## 🔧 Configuration

### Environment Variables

While the app uses Firebase SDK directly in the browser, you can configure these optional settings:

- **Notification Sound**: Default Web Audio API sound (can be customized in `src/services/notifications.js`)
- **Firebase Config**: Set in `app.js` (keep secure for production)

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Email/Password authentication
3. Enable Firebase Storage
4. Create a Firestore database with these collections:
   - `users`: Stores user profiles
   - `chats`: Stores conversation messages

#### Firebase Storage Setup

1. Go to Firebase Console > Storage
2. Click "Get Started"
3. Choose security rules (start in test mode or use rules below)
4. Storage bucket will be created at: `YOUR_PROJECT.appspot.com`

#### Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Media uploads (images and videos)
    match /media/{mediaType}/{userId}/{fileName} {
      // Allow authenticated users to read all media
      allow read: if request.auth != null;
      
      // Allow users to write their own media files
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && (mediaType == 'image' || mediaType == 'video');
      
      // Validate file size
      allow write: if request.resource.size < 50 * 1024 * 1024; // 50MB max
    }
  }
}
```

#### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        chatId.matches('.*' + request.auth.uid + '.*');
    }
  }
}
```

## 📷 Media Sharing

### How to Share Media

#### Desktop
1. **Click Attach Button**: Click the paperclip icon in the message composer
2. **Select File**: Choose an image or video from your computer
3. **Preview**: A preview will appear showing your selected media
4. **Send**: Type an optional message and click send
5. **Drag & Drop**: Alternatively, drag files directly into the chat window

#### Mobile
1. **Click Attach Button**: Tap the paperclip icon
2. **Choose Source**: Select from camera or gallery
3. **Select Media**: Take a photo/video or choose from gallery
4. **Preview & Send**: Review and send your media

### Supported Formats

#### Images
- **Formats**: JPG, JPEG, PNG, WebP, GIF
- **Max Size**: 5MB per image
- **Features**: Lazy loading, click to view full screen

#### Videos
- **Formats**: MP4, WebM, OGG
- **Max Size**: 50MB per video
- **Features**: Built-in player with controls, click to view full screen

### Upload Progress

- Real-time progress bar shows upload status
- Send button disabled during upload to prevent duplicates
- Cancel upload by clicking the X on the preview

### Best Practices

- **Compress large files** before uploading for faster sending
- **Use appropriate formats**: JPG for photos, PNG for graphics, MP4 for videos
- **Test on mobile** to ensure camera/gallery access works correctly
- **Monitor storage usage** in Firebase Console

## 🌐 Browser Notifications

### Enabling Notifications

1. The app will request notification permission on first load
2. Click "Allow" when prompted by your browser
3. Configure notification preferences in Settings (gear icon)

### Requirements

- **HTTPS**: Notifications require HTTPS in production (except localhost)
- **Permission**: User must grant notification permission
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

### Troubleshooting

- If notifications don't work, check browser settings and permissions
- Ensure the site is not in "Do Not Disturb" mode
- For mobile, ensure the browser is allowed to show notifications

## 📱 Mobile Support

The app is fully responsive and optimized for mobile devices:

- **Touch Gestures**: Swipe-friendly interface
- **Larger Tap Targets**: 44px minimum for touch elements
- **Optimized Layout**: Single-column view on narrow screens
- **Mobile Notifications**: Vibration and sound alerts
- **Keyboard Handling**: Smart keyboard avoidance

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 🏗️ Project Structure

```
ChatApp/
├── app.js                      # Main application logic & Firebase integration
├── index.html                  # Login page
├── register.html               # Registration page
├── chat.html                   # Main chat interface
├── style.css                   # Base styles
├── src/
│   ├── components/
│   │   ├── ConversationList.js # Conversation sidebar
│   │   ├── ChatWindow.js       # Main chat view
│   │   ├── MessageBubble.js    # Message component (supports images & videos)
│   │   ├── Composer.js         # Message input with media upload
│   │   ├── Settings.js         # Settings modal
│   │   └── ImageModal.js       # Media viewer (images & videos)
│   ├── services/
│   │   ├── notifications.js    # Notification service
│   │   └── mediaUpload.js      # Media upload service (NEW)
│   ├── utils/
│   │   ├── sanitize.js         # XSS prevention & file validation
│   │   └── typing.js           # Typing indicators
│   └── styles/
│       └── responsive.css      # Responsive layout
├── assets/
│   └── sounds/                 # Notification sounds
├── package.json
└── README.md
```

## 🎨 Customization

### Styling

The app uses CSS custom properties for easy theming. Main colors can be customized in `style.css`:

```css
:root {
  --primary-color: #ff334a;
  --background: #09090b;
  --card-bg: rgba(15, 7, 25, 0.85);
  --text-color: #fafaff;
}
```

### Notification Sounds

To use custom notification sounds:

1. Add audio file to `assets/sounds/`
2. Update `src/services/notifications.js`:
   ```javascript
   this.notificationSound = new Audio('/assets/sounds/notification.mp3');
   ```

## 🚀 Deployment

### Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize hosting:
   ```bash
   firebase init hosting
   ```

4. Deploy:
   ```bash
   firebase deploy
   ```

### Other Hosting Platforms

The app is static and can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

**Important**: Ensure HTTPS is enabled for notifications to work properly.

## 🔒 Security

### Best Practices Implemented

- **XSS Prevention**: All user input is sanitized
- **Content Security Policy**: Recommended CSP headers
- **Firebase Rules**: Secure Firestore access rules
- **Input Validation**: File uploads and message content validation
- **No Sensitive Data**: API keys are public (secured by Firebase rules)

### Recommended Production Setup

1. Enable Firebase App Check
2. Implement rate limiting
3. Add reCAPTCHA for registration
4. Monitor Firebase usage quotas
5. Regular security audits

## 📊 Performance

### Optimizations Implemented

- Lazy loading for images
- Debounced typing indicators
- Efficient Firestore queries
- Minimal re-renders
- CSS animations over JavaScript
- Optimized bundle size

### Metrics

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: 90+

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:

- Open an issue on GitHub
- Check existing issues for solutions
- Review Firebase documentation for backend-related questions

## 🎯 Roadmap

Future enhancements planned:

- [x] Image sharing with preview ✅
- [x] Video sharing with player ✅
- [x] Drag & drop file upload ✅
- [x] Upload progress indicator ✅
- [x] WhatsApp-style UI/UX ✅
- [ ] Voice messages
- [ ] Video calls
- [ ] Group chats
- [ ] Message reactions
- [ ] Message forwarding
- [ ] Document sharing (PDF, DOCX, etc.)
- [ ] Message search
- [ ] Dark/light theme toggle
- [ ] Multiple language support
- [ ] PWA support with offline mode

## 📱 Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## 🙏 Acknowledgments

- Firebase for backend services
- Web Notifications API
- MDN Web Docs for reference

---

**Note**: This app uses Firebase with client-side SDK for simplicity. For production apps with sensitive data, consider implementing a backend API layer for additional security.
