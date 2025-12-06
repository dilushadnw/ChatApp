// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCLaGO8p3BKySI6p8GDab7C98SmFQ9BtRY",
  authDomain: "chat-app-123f9.firebaseapp.com",
  projectId: "chat-app-123f9",
  storageBucket: "chat-app-123f9.appspot.com",
  messagingSenderId: "331187252178",
  appId: "1:331187252178:web:9af555cb3c234bf680b60b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper: validate username
function isValidUsername(username) {
  return /^[a-zA-Z0-9_]+$/.test(username);
}

// ===== REGISTER =====
window.register = async function () {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return alert("Enter username and password");
  if (!isValidUsername(username)) return alert("Username can only contain letters, numbers, underscores");

  const email = username + "@chatapp.com";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Save user info in Firestore
    await setDoc(doc(db, "users", uid), { username, uid });

    alert("Account Created ✅");
    window.location.href = "index.html";
  } catch (error) {
    alert(error.message);
  }
};

// ===== LOGIN =====
window.login = async function () {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return alert("Enter username and password");
  if (!isValidUsername(username)) return alert("Username can only contain letters, numbers, underscores");

  const email = username + "@chatapp.com";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "chat.html";
  } catch (error) {
    alert(error.message);
  }
};

// ===== LOGOUT =====
window.logout = function() {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

// ===== SEARCH USERS =====
window.searchUser = async function () {
  if (!auth.currentUser) return alert("Not logged in");

  const searchInput = document.getElementById("searchUser").value.trim().toLowerCase();
  const userList = document.getElementById("userList");
  userList.innerHTML = ""; // clear previous results

  if (!searchInput) return;

  const querySnapshot = await getDocs(collection(db, "users"));
  querySnapshot.forEach(doc => {
    const user = doc.data();
    if (user.username.toLowerCase().includes(searchInput) && user.uid !== auth.currentUser.uid) {
      const li = document.createElement("li");
      li.textContent = user.username;
      li.style.cursor = "pointer";
      li.onclick = () => openChat(user.uid, user.username);
      userList.appendChild(li);
    }
  });
};

// ===== OPEN CHAT =====
window.currentChatUid = null;
window.currentChatId = null;
window.unsubscribe = null;

function openChat(otherUid, otherUsername) {
  if (!auth.currentUser) return alert("Not logged in");

  window.currentChatUid = otherUid;
  window.currentChatId = [auth.currentUser.uid, otherUid].sort().join("_");

  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = `
    <h3>Chat with ${otherUsername}</h3>
    <div id="messages" style="border:1px solid #ccc;height:200px;overflow-y:auto;margin-bottom:10px;"></div>
    <input type="text" id="msgInput" placeholder="Type message">
    <button onclick="sendMessage()">Send</button>
  `;

  const chatDocRef = doc(db, "chats", window.currentChatId);

  // Real-time listener
  if (window.unsubscribe) window.unsubscribe();
  window.unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = "";
    if (docSnap.exists()) {
      const msgs = docSnap.data().messages || [];
      msgs.sort((a,b)=>a.timestamp-b.timestamp);
      msgs.forEach(m => {
        const p = document.createElement("p");
        p.textContent = `${m.sender === auth.currentUser.uid ? "You" : otherUsername}: ${m.text}`;
        messagesDiv.appendChild(p);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  });
}

// ===== SEND MESSAGE =====
window.sendMessage = async function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  const msg = { sender: auth.currentUser.uid, text, timestamp: Date.now() };
  const chatDocRef = doc(db, "chats", window.currentChatId);

  try {
    await updateDoc(chatDocRef, { messages: arrayUnion(msg) });
  } catch {
    await setDoc(chatDocRef, { messages: [msg] });
  }

  input.value = "";
};
