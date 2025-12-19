import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDocs, onSnapshot, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { notificationService } from './src/services/notifications.js';
import { ConversationList } from './src/components/ConversationList.js';
import { ChatWindow } from './src/components/ChatWindow.js';
import { Settings } from './src/components/Settings.js';
import { imageModal } from './src/components/ImageModal.js';
import { videoModal } from './src/components/VideoModal.js';
import { TypingIndicator } from './src/utils/typing.js';

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

// SEND MESSAGE
window.sendMessage = async function (messageData) {
  const input = document.getElementById("msgInput");
  const text = messageData?.text || input?.value.trim();
  const file = messageData?.file;
  
  if (!text && !file) return;
  
  const msg = { 
    sender: auth.currentUser.uid, 
    text: text || '', 
    timestamp: Date.now(), 
    status: 'sending' 
  };
  
  const chatDocRef = doc(db, "chats", window.currentChatId);
  
  // Optimistic UI - add message immediately
  if (chatWindow && window.currentChatId) {
    chatWindow.addMessage(msg, true, 'You', true);
  }
  
  try {
    // Upload file if present
    if (file) {
      const fileUrl = await uploadFile(file, msg.timestamp);
      const { isVideoFile } = await import('./src/utils/sanitize.js');
      const isVideo = isVideoFile(file);
      if (isVideo) {
        msg.videoUrl = fileUrl;
        msg.videoType = file.type;
      } else {
        msg.imageUrl = fileUrl;
      }
    }
    
    await updateDoc(chatDocRef, { messages: arrayUnion(msg) }); 
    // Update status to sent
    if (chatWindow) {
      chatWindow.updateMessageStatus(msg.timestamp, 'sent');
    }
  }
  catch { 
    await setDoc(chatDocRef, { messages: [msg] }); 
    if (chatWindow) {
      chatWindow.updateMessageStatus(msg.timestamp, 'sent');
    }
  }
  
  if (input) input.value = "";
};

// UPLOAD FILE TO STORAGE
async function uploadFile(file, timestamp) {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${auth.currentUser.uid}_${timestamp}.${fileExtension}`;
  const storageRef = ref(storage, `chat-media/${fileName}`);
  
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

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
