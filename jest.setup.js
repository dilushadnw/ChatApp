// Jest setup file
// Mock Web Audio API
class MockAudioContext {
  constructor() {
    this.destination = {};
    this.currentTime = 0;
  }
  
  createOscillator() {
    return {
      connect: () => {},
      frequency: { value: 0 },
      type: 'sine',
      start: () => {},
      stop: () => {},
    };
  }
  
  createGain() {
    return {
      connect: () => {},
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
    };
  }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// Mock Notification API
global.Notification = class Notification {
  constructor(title, options) {
    this.title = title;
    this.options = options;
    this.onclick = null;
  }
  
  close() {}
  
  static permission = 'default';
  
  static requestPermission() {
    return Promise.resolve('granted');
  }
};

// Mock navigator.vibrate
if (!global.navigator.vibrate) {
  global.navigator.vibrate = () => true;
}

// Mock localStorage
const localStorageMock = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
};
global.localStorage = localStorageMock;

// Mock document.hasFocus
if (!global.document.hasFocus) {
  global.document.hasFocus = () => true;
}
