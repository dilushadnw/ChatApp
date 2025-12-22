import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDocs, onSnapshot, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";
import { notificationService } from './src/services/notifications.js';
import { ConversationList } from './src/components/ConversationList.js';
import { ChatWindow } from './src/components/ChatWindow.js';
import { Settings } from './src/components/Settings.js';
import { imageModal } from './src/components/ImageModal.js';
import { TypingIndicator } from './src/utils/typing.js';
import { uploadMedia, getMediaType } from './src/services/mediaUpload.js';

const firebaseConfig = {
  apiKey: "AIzaSyCLaGO8p3BKySI6p8GDab7C98SmFQ9BtRY",
  authDomain: "chat-app-123f9.firebaseapp.com",
  projectId: "chat-app-123f9",
  storageBucket: "chat-app-123f9.appspot.com",
  messagingSenderId: "331187252178",
  appId: "1:331187252178:web:9af555cb3c234bf680b60b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Global app state
let conversationList = null;
let chatWindow = null;
let settings = null;
let typingIndicator = null;
let currentOtherUsername = null;

function isValidUsername(username) { return /^[a-zA-Z0-9_]+$/.test(username); }

// REGISTER
window.register = async function () {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return alert("Enter username and password");
  if (!isValidUsername(username)) return alert("Username can only contain letters, numbers, underscores");
  const email = username + "@chatapp.com";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", userCredential.user.uid), { username, uid: userCredential.user.uid });
    alert("Account Created ✅");
    window.location.href = "index.html";
  } catch (error) { alert(error.message); }
};

// LOGIN
window.login = async function () {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return alert("Enter username and password");
  if (!isValidUsername(username)) return alert("Username can only contain letters, numbers, underscores");
  const email = username + "@chatapp.com";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "chat.html";
  } catch (error) { alert(error.message); }
};

// LOGOUT
window.logout = function() {
  signOut(auth).then(() => { window.location.href = "index.html"; });
};

// SEARCH USERS
window.searchUser = async function () {
  if (!auth.currentUser) return alert("Not logged in");
  const searchInput = document.getElementById("searchUser").value.trim().toLowerCase();
  const userList = document.getElementById("userList");
  userList.innerHTML = "";
  if (!searchInput) return;

  const querySnapshot = await getDocs(collection(db, "users"));
  querySnapshot.forEach(docSnap => {
    const user = docSnap.data();
    if (user.username.toLowerCase().includes(searchInput) && user.uid !== auth.currentUser.uid) {
      const li = document.createElement("li");
      li.textContent = user.username;
      li.onclick = () => openChat(user.uid, user.username);
      userList.appendChild(li);
    }
  });
};

// CHAT
window.currentChatUid = null;
window.currentChatId = null;
window.unsubscribe = null;

function openChat(otherUid, otherUsername) {
  if (!auth.currentUser) return alert("Not logged in");
  window.currentChatUid = otherUid;
  window.currentChatId = [auth.currentUser.uid, otherUid].sort().join("_");
  currentOtherUsername = otherUsername;

  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = `
    <h3>Chat with ${otherUsername}</h3>
    <div id="messages" style="border:1px solid #ccc;height:200px;overflow-y:auto;margin-bottom:10px;"></div>
    <div class="chat-input-row">
      <input type="text" id="msgInput" placeholder="Type message">
      <button id="sendBtn">Send</button>
    </div>
  `;

  const chatDocRef = doc(db, "chats", window.currentChatId);
  if (window.unsubscribe) window.unsubscribe();
  
  // Track previous message count for notifications
  let previousMessageCount = 0;
  
  window.unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = "";
    if (docSnap.exists()) {
      const msgs = docSnap.data().messages || [];
      msgs.sort((a,b)=>a.timestamp-b.timestamp);
      
      // Check for new messages from other user
      if (msgs.length > previousMessageCount) {
        const newMessages = msgs.slice(previousMessageCount);
        newMessages.forEach(m => {
          if (m.sender !== auth.currentUser.uid) {
            // Show notification for new message from other user
            notificationService.notifyNewMessage(otherUsername, m.text, window.currentChatId);
          }
        });
      }
      previousMessageCount = msgs.length;
      
      msgs.forEach(m => {
        const div = document.createElement("div");
        div.classList.add("message");
        const bubble = document.createElement("div");
        bubble.classList.add("bubble");
        if (m.sender === auth.currentUser.uid) {
          bubble.classList.add("you");
          bubble.innerHTML = `<span class="sender">You</span>${m.text}<span class="time">${new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>`;
        } else {
          bubble.classList.add("other");
          bubble.innerHTML = `<span class="sender">${otherUsername}</span>${m.text}<span class="time">${new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>`;
        }
        div.appendChild(bubble);
        messagesDiv.appendChild(div);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  });

  // Send message
  const inputField = document.getElementById("msgInput");
  inputField.addEventListener("keypress", e => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } });
  document.getElementById("sendBtn").onclick = sendMessage;
}

// SEND MESSAGE (with media support)
window.sendMessage = async function (messageData = null) {
  let text, file;
  
  // Check if called from Composer component or old way
  if (messageData && typeof messageData === 'object') {
    text = messageData.text || '';
    file = messageData.file || null;
  } else {
    // Old way - from input field
    const input = document.getElementById("msgInput");
    text = input?.value.trim() || '';
    file = null;
  }
  
  if (!text && !file) return;
  
  const chatDocRef = doc(db, "chats", window.currentChatId);
  const timestamp = Date.now();
  
  // Prepare base message
  let msg = {
    sender: auth.currentUser.uid,
    text,
    timestamp,
    status: 'sending'
  };
  
  try {
    // If there's a file, upload it first
    if (file) {
      // Show uploading state in composer
      const composerEvent = new CustomEvent('setUploadingState', { detail: { uploading: true } });
      window.dispatchEvent(composerEvent);
      
      // Optimistic UI - add message with loading state
      if (chatWindow && window.currentChatId) {
        const tempMsg = { ...msg, text: text || 'Sending media...' };
        chatWindow.addMessage(tempMsg, true, 'You', true);
      }
      
      // Upload media file
      await new Promise((resolve, reject) => {
        uploadMedia(
          file,
          auth.currentUser.uid,
          // Progress callback
          (progress) => {
            const progressEvent = new CustomEvent('uploadProgress', { detail: { progress } });
            window.dispatchEvent(progressEvent);
          },
          // Complete callback
          (mediaData) => {
            // Add media URL to message based on type
            if (mediaData.type === 'image') {
              msg.imageUrl = mediaData.url;
            } else if (mediaData.type === 'video') {
              msg.videoUrl = mediaData.url;
            }
            msg.mediaType = mediaData.type;
            msg.mediaSize = mediaData.size;
            resolve();
          },
          // Error callback
          (error) => {
            console.error('Upload error:', error);
            alert('Failed to upload media. Please try again.');
            reject(error);
          }
        );
      });
      
      // Hide uploading state
      const hideUploadEvent = new CustomEvent('setUploadingState', { detail: { uploading: false } });
      window.dispatchEvent(hideUploadEvent);
      const hideProgressEvent = new CustomEvent('hideUploadProgress');
      window.dispatchEvent(hideProgressEvent);
    }
    
    // Update message status
    msg.status = 'sent';
    
    // Save message to Firestore
    try {
      await updateDoc(chatDocRef, { messages: arrayUnion(msg) });
    } catch (error) {
      // If chat doesn't exist, create it
      await setDoc(chatDocRef, { messages: [msg] });
    }
    
    // Update status in UI
    if (chatWindow) {
      chatWindow.updateMessageStatus(msg.timestamp, 'sent');
    }
    
    // Clear input if from old input field
    const input = document.getElementById("msgInput");
    if (input && !messageData) {
      input.value = "";
    }
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Hide uploading state on error
    const hideUploadEvent = new CustomEvent('setUploadingState', { detail: { uploading: false } });
    window.dispatchEvent(hideUploadEvent);
    const hideProgressEvent = new CustomEvent('hideUploadProgress');
    window.dispatchEvent(hideProgressEvent);
    
    // Show error to user
    if (file) {
      alert('Failed to send message with media. Please try again.');
    }
  }
};

// Initialize components on chat.html page
if (window.location.pathname.includes('chat.html')) {
  // Wait for page load
  document.addEventListener('DOMContentLoaded', async () => {
    // Request notification permission
    await notificationService.requestPermission();
    
    // Initialize settings
    settings = new Settings(notificationService);
    
    // Listen for settings button click
    window.addEventListener('openSettings', () => {
      settings.show();
    });
    
    // Listen for sendMessage event from ChatWindow/Composer
    window.addEventListener('sendMessage', (e) => {
      if (e.detail) {
        window.sendMessage(e.detail);
      }
    });
    
    // Track unread count
    window.addEventListener('focus', () => {
      notificationService.clearUnreadCount();
    });
    
    // Listen for visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        notificationService.clearUnreadCount();
      }
    });
    
    // Initialize typing indicator if user is logged in
    auth.onAuthStateChanged((user) => {
      if (user && !typingIndicator) {
        typingIndicator = new TypingIndicator(db, user.uid);
      }
    });
    
    // Listen for typing events
    window.addEventListener('userTyping', (e) => {
      if (typingIndicator && e.detail.conversationId) {
        typingIndicator.startTyping(e.detail.conversationId);
      }
    });
  });
}
