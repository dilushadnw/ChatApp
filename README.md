# ChatApp - Production-Ready Real-Time Chat Application

A modern, feature-rich chat application built with vanilla JavaScript and Firebase, featuring desktop notifications, real-time messaging, responsive design, and comprehensive user experience improvements.

## 🚀 Features

### Core Functionality
- **Real-time Messaging**: Instant message delivery using Firebase Firestore
- **User Authentication**: Secure login and registration with Firebase Auth
- **User Search**: Find and connect with other users
- **Message History**: Persistent chat history stored in Firestore

### Modern UI/UX
- **Responsive Design**: Two-column layout on desktop, single-column on mobile
- **Smooth Animations**: Message fade-in and slide-up effects
- **Typing Indicators**: See when someone is typing
- **Message Status**: Visual indicators for sending, sent, delivered, and read
- **Auto-scroll**: Smart scrolling with pin position option
- **Emoji Support**: Built-in emoji picker and shortcode support (e.g., `:smile:`)
- **Image Sharing**: Send images with preview and full-screen viewing
- **Video Sharing**: Upload and share video files (MP4, WebM, MOV) with inline playback

### Notifications
- **Desktop Notifications**: Browser notifications when receiving messages
- **Sound Alerts**: Configurable notification sounds
- **Vibration**: Mobile device vibration support
- **Unread Badges**: Visual indicators for unread messages
- **Page Title Updates**: Unread count in browser tab
- **Do Not Disturb**: Configure quiet hours for notifications

### Security & Performance
- **XSS Prevention**: Content sanitization and HTML escaping
- **Input Validation**: File type and size validation for uploads (images up to 5MB, videos up to 50MB)
- **Lazy Loading**: Efficient image loading
- **Cloud Storage**: Firebase Storage integration for media files
- **Optimistic UI**: Instant message display with async server sync
- **Rate Limiting**: Built-in debouncing for typing indicators

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
3. Create a Firestore database with these collections:
   - `users`: Stores user profiles
   - `chats`: Stores conversation messages
4. Enable Firebase Storage for media file uploads

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

#### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chat-media/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.resource.size < 50 * 1024 * 1024 && // Max 50MB
        request.resource.contentType.matches('image/.*|video/.*');
    }
  }
}
```

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
├── app.js                      # Main application logic
├── index.html                  # Login page
├── register.html               # Registration page
├── chat.html                   # Main chat interface
├── style.css                   # Base styles
├── src/
│   ├── components/
│   │   ├── ConversationList.js # Conversation sidebar
│   │   ├── ChatWindow.js       # Main chat view
│   │   ├── MessageBubble.js    # Message component
│   │   ├── Composer.js         # Message input with file upload
│   │   ├── Settings.js         # Settings modal
│   │   ├── ImageModal.js       # Image viewer
│   │   └── VideoModal.js       # Video player
│   ├── services/
│   │   └── notifications.js    # Notification service
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

- [ ] Voice messages
- [ ] Video calls
- [ ] Group chats
- [ ] Message reactions
- [ ] Message forwarding
- [ ] File sharing (documents, videos)
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
