// Session data - initially empty, will load from storage
let sessionData = {
  password: null,
  recoveryIdentifier: null,
  isLocked: false,
  isInitialized: false,
  failedAttempts: 0
};

console.log('PassForGo extension loaded');

// Load session data from storage when extension starts
function loadSessionData() {
  chrome.storage.local.get(['passwordData'], function(result) {
    if (result.passwordData) {
      console.log('Loaded credentials from storage');
      sessionData.password = result.passwordData.password;
      sessionData.recoveryIdentifier = result.passwordData.recoveryIdentifier;
      sessionData.isInitialized = true;
      
      // Always start in locked state if credentials exist
      sessionData.isLocked = true;
      
      // Lock all tabs immediately if initialized
      if (sessionData.isInitialized) {
        lockBrowser();
      }
    } else {
      console.log('No saved credentials found');
    }
  });
}

// Save session data to storage
function saveSessionData() {
  const dataToSave = {
    password: sessionData.password,
    recoveryIdentifier: sessionData.recoveryIdentifier
  };
  
  chrome.storage.local.set({passwordData: dataToSave}, function() {
    console.log('Credentials saved to storage');
  });
}

// Load data when extension loads
loadSessionData();

// Show setup page on first install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed, showing setup page');
  chrome.tabs.create({ url: chrome.runtime.getURL("setup.html") });
});

// Also listen for browser startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started');
  loadSessionData(); // Reload data on browser startup
});

// Create an interval that constantly checks and enforces the lock
setInterval(() => {
  if (sessionData.isLocked && sessionData.isInitialized) {
    enforceAllTabsLocked();
  }
}, 1000); // Check every second

// Handle tab updates to enforce the lock
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (sessionData.isLocked && sessionData.isInitialized) {
    // Don't redirect our own extension pages
    if (tab.url && !tab.url.startsWith(chrome.runtime.getURL(""))) {
      console.log('Locking tab:', tabId);
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL("lock.html") });
    }
  }
});

// Prevent creating new tabs when locked
chrome.tabs.onCreated.addListener((tab) => {
  if (sessionData.isLocked && sessionData.isInitialized) {
    console.log('New tab created while locked, updating to lock page');
    chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lock.html") });
  }
});

// Listen for window creation events
chrome.windows.onCreated.addListener((window) => {
  if (sessionData.isLocked && sessionData.isInitialized) {
    console.log('New window created while locked, enforcing lock');
    // Query for tabs in the new window
    chrome.tabs.query({ windowId: window.id }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lock.html") });
      });
    });
  }
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (sessionData.isLocked && sessionData.isInitialized && windowId !== chrome.windows.WINDOW_ID_NONE) {
    // When a window is focused, make sure all its tabs are locked
    chrome.tabs.query({ windowId: windowId }, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && !tab.url.startsWith(chrome.runtime.getURL(""))) {
          chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lock.html") });
        }
      });
    });
  }
});

// Handle messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message.action);
  
  if (message.action === 'setupCredentials') {
    // Handle setup
    sessionData.password = message.password;
    sessionData.recoveryIdentifier = message.recoveryIdentifier;
    sessionData.isInitialized = true;
    sessionData.isLocked = false;
    
    // Save credentials to storage
    saveSessionData();
    
    console.log('Credentials set up successfully');
    sendResponse({ success: true });
  }
  else if (message.action === 'getStatus') {
    // Return current status
    console.log('Sending status:', { 
      isLocked: sessionData.isLocked, 
      isInitialized: sessionData.isInitialized 
    });
    sendResponse({ 
      isLocked: sessionData.isLocked, 
      isInitialized: sessionData.isInitialized 
    });
  }
  else if (message.action === 'verifyPassword') {
    // Verify password
    const isCorrect = message.password === sessionData.password;
    if (isCorrect) {
      unlockBrowser();
      sessionData.failedAttempts = 0;
      sendResponse({ success: true });
    } else {
      sessionData.failedAttempts++;
      sendResponse({ 
        success: false, 
        remainingAttempts: 3 - sessionData.failedAttempts,
        showRecovery: sessionData.failedAttempts >= 3 
      });
    }
  }
  else if (message.action === 'verifyRecovery') {
    // Verify recovery identifier
    const isCorrect = message.recoveryIdentifier === sessionData.recoveryIdentifier;
    sendResponse({ success: isCorrect });
  }
  else if (message.action === 'resetPassword') {
    // Reset password
    sessionData.password = message.newPassword;
    // Save updated password to storage
    saveSessionData();
    
    unlockBrowser();
    sessionData.failedAttempts = 0;
    sendResponse({ success: true });
  }
  else if (message.action === 'updateCredentials') {
    // Update credentials
    let updated = false;
    
    if (message.password) {
      sessionData.password = message.password;
      updated = true;
    }
    
    if (message.recoveryIdentifier) {
      sessionData.recoveryIdentifier = message.recoveryIdentifier;
      updated = true;
    }
    
    if (updated) {
      // Save updated credentials to storage
      saveSessionData();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No credentials provided' });
    }
  }
  else if (message.action === 'lock') {
    // Lock browser
    lockBrowser();
    sendResponse({ success: true });
  }
  else if (message.action === 'closeChrome') {
    // Close Chrome (for security)
    closeAllTabs();
    sendResponse({ success: true });
  }
  
  return true; // Keep the message channel open for async response
});

// Function to thoroughly enforce all tabs are locked
function enforceAllTabsLocked() {
  chrome.tabs.query({}, (tabs) => {
    let foundUnlockedTab = false;
    
    // Check all tabs and lock any that aren't our lock page
    for (const tab of tabs) {
      if (tab.url && !tab.url.startsWith(chrome.runtime.getURL(""))) {
        foundUnlockedTab = true;
        chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lock.html") });
      }
    }
    
    if (foundUnlockedTab) {
      console.log('Found and locked unlocked tabs during periodic check');
    }
  });
}

// Function to lock all browser tabs
function lockBrowser() {
  console.log('Locking all browser tabs');
  sessionData.isLocked = true;
  
  // First bring all existing windows to the foreground to lock them
  chrome.windows.getAll({ populate: true }, (windows) => {
    windows.forEach(window => {
      // Focus this window
      chrome.windows.update(window.id, { focused: true }, () => {
        // Then update all tabs in this window
        window.tabs.forEach(tab => {
          if (tab.url && !tab.url.startsWith(chrome.runtime.getURL(""))) {
            chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lock.html") });
          }
        });
      });
    });
  });
}

// Function to unlock the browser
function unlockBrowser() {
  console.log('Unlocking browser');
  sessionData.isLocked = false;
  
  chrome.tabs.query({}, (tabs) => {
    // Redirect all lock pages to new tab page
    tabs.forEach(tab => {
      if (tab.url === chrome.runtime.getURL("lock.html")) {
        chrome.tabs.update(tab.id, { url: "chrome://newtab/" });
      }
    });
  });
}

// Function to force-close all tabs (security measure)
function closeAllTabs() {
  console.log('Closing all tabs to protect security');
  chrome.windows.getAll({}, (windows) => {
    windows.forEach(window => {
      chrome.windows.remove(window.id);
    });
  });
}
