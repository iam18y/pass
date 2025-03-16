document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const recoveryIdInput = document.getElementById('recoveryId');
  const setupBtn = document.getElementById('setupBtn');
  const errorMessageElement = document.getElementById('errorMessage');
  
  console.log('Setup page loaded');
  
  // Check if already initialized
  chrome.runtime.sendMessage({action: 'getStatus'}, function(response) {
    console.log('Status check response:', response);
    
    if (response && response.isInitialized) {
      // Already initialized, redirect based on lock status
      if (response.isLocked) {
        window.location.href = chrome.runtime.getURL("lock.html");
      } else {
        // Use chrome.tabs API instead of direct navigation
        chrome.tabs.update({url: "chrome://newtab/"});
      }
    }
  });
  
  // Setup button click handler
  setupBtn.addEventListener('click', function() {
    console.log('Setup button clicked');
    
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const recoveryId = recoveryIdInput.value.trim();
    
    // Basic validation
    if (!password) {
      showError("Please enter a password");
      return;
    }
    
    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }
    
    if (!recoveryId) {
      showError("Please enter a recovery identifier");
      return;
    }
    
    // Send setup data to background script
    console.log('Sending setup credentials to background script');
    chrome.runtime.sendMessage({
      action: 'setupCredentials',
      password: password,
      recoveryIdentifier: recoveryId
    }, function(response) {
      console.log('Setup response:', response);
      
      if (response && response.success) {
        // Setup successful
        console.log('Setup successful, redirecting');
        
        // Use chrome.tabs API instead of direct navigation
        chrome.tabs.getCurrent(function(tab) {
          if (tab) {
            chrome.tabs.update(tab.id, {url: "chrome://newtab/"});
          } else {
            // Fallback if we can't get the current tab
            chrome.tabs.create({url: "chrome://newtab/"});
          }
        });
      } else {
        showError("Failed to set up credentials");
      }
    });
  });
  
  // Helper to show error messages
  function showError(message) {
    console.log('Error:', message);
    errorMessageElement.textContent = message;
    errorMessageElement.style.display = 'block';
  }
  
  // Enter key handler
  function handleEnterKey(event) {
    if (event.key === 'Enter') {
      setupBtn.click();
    }
  }
  
  passwordInput.addEventListener('keypress', handleEnterKey);
  confirmPasswordInput.addEventListener('keypress', handleEnterKey);
  recoveryIdInput.addEventListener('keypress', handleEnterKey);
});
