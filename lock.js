document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const passwordForm = document.getElementById('passwordForm');
  const recoveryForm = document.getElementById('recoveryForm');
  const passwordInput = document.getElementById('password');
  const unlockBtn = document.getElementById('unlockBtn');
  const errorMessage = document.getElementById('errorMessage');
  const attemptsLeft = document.getElementById('attemptsLeft');
  const forgotPassword = document.getElementById('forgotPassword');
  const recoveryIdInput = document.getElementById('recoveryId');
  const newPasswordInput = document.getElementById('newPassword');
  const resetPasswordBtn = document.getElementById('resetPasswordBtn');
  const recoveryErrorMessage = document.getElementById('recoveryErrorMessage');
  const backToPasswordBtn = document.getElementById('backToPasswordBtn');
  
  console.log('Lock page loaded');
  
  // Check initialization status
  chrome.runtime.sendMessage({action: 'getStatus'}, function(response) {
    if (!response || !response.isInitialized) {
      // Not initialized, redirect to setup
      window.location.href = chrome.runtime.getURL("setup.html");
    }
  });
  
  // Handle unlock button click
  unlockBtn.addEventListener('click', function() {
    const password = passwordInput.value.trim();
    
    if (!password) {
      errorMessage.textContent = "Please enter your password";
      return;
    }
    
    chrome.runtime.sendMessage({
      action: 'verifyPassword',
      password: password
    }, function(response) {
      if (response && response.success) {
        // Password correct, redirect to newtab
        chrome.tabs.getCurrent(function(tab) {
          if (tab) {
            chrome.tabs.update(tab.id, {url: "chrome://newtab/"});
          } else {
            // Fallback
            chrome.tabs.create({url: "chrome://newtab/"});
          }
        });
      } else {
        // Password incorrect
        passwordInput.value = '';
        errorMessage.textContent = "Incorrect password";
        
        if (response && response.remainingAttempts > 0) {
          attemptsLeft.textContent = `${response.remainingAttempts} attempts remaining`;
        } else {
          attemptsLeft.textContent = "No attempts left";
          forgotPassword.style.display = 'block';
        }
        
        if (response && response.showRecovery) {
          forgotPassword.style.display = 'block';
        }
      }
    });
  });
  
  // Handle forgot password link
  forgotPassword.addEventListener('click', function() {
    passwordForm.style.display = 'none';
    recoveryForm.style.display = 'block';
  });
  
  // Handle back to password link
  backToPasswordBtn.addEventListener('click', function() {
    passwordForm.style.display = 'block';
    recoveryForm.style.display = 'none';
  });
  
  // Handle password reset
  resetPasswordBtn.addEventListener('click', function() {
    const recoveryId = recoveryIdInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    
    if (!recoveryId) {
      recoveryErrorMessage.textContent = "Please enter your recovery identifier";
      return;
    }
    
    if (!newPassword) {
      recoveryErrorMessage.textContent = "Please enter a new password";
      return;
    }
    
    // First verify recovery identifier
    chrome.runtime.sendMessage({
      action: 'verifyRecovery',
      recoveryIdentifier: recoveryId
    }, function(response) {
      if (response && response.success) {
        // Recovery identifier correct, reset password
        chrome.runtime.sendMessage({
          action: 'resetPassword',
          newPassword: newPassword
        }, function(resetResponse) {
          if (resetResponse && resetResponse.success) {
            // Password reset, redirect to newtab
            chrome.tabs.getCurrent(function(tab) {
              if (tab) {
                chrome.tabs.update(tab.id, {url: "chrome://newtab/"});
              } else {
                // Fallback
                chrome.tabs.create({url: "chrome://newtab/"});
              }
            });
          } else {
            recoveryErrorMessage.textContent = "Failed to reset password";
          }
        });
      } else {
        recoveryErrorMessage.textContent = "Incorrect recovery identifier";
        recoveryIdInput.value = '';
      }
    });
  });
  
  // Enter key handlers
  passwordInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      unlockBtn.click();
    }
  });
  
  recoveryIdInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && newPasswordInput.value.trim()) {
      resetPasswordBtn.click();
    }
  });
  
  newPasswordInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && recoveryIdInput.value.trim()) {
      resetPasswordBtn.click();
    }
  });
  
  // Security feature: Close Chrome if user tries to navigate away from lock page
  window.addEventListener('beforeunload', function(e) {
    // Check if we're still locked before closing
    chrome.runtime.sendMessage({action: 'getStatus'}, function(response) {
      if (response && response.isLocked) {
        // We're locked, so closing this page is a security risk
        chrome.runtime.sendMessage({action: 'closeChrome'});
      }
    });
    
    // Show a confirmation dialog (this may not work in all browsers)
    e.preventDefault();
    e.returnValue = '';
  });
  
  // Prevent navigation keys
  document.addEventListener('keydown', function(event) {
    // Prevent Alt+Left/Right (history navigation)
    if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
    }
    
    // Prevent F5 (refresh)
    if (event.key === 'F5') {
      event.preventDefault();
    }
    
    // Prevent Ctrl+N (new window)
    if (event.ctrlKey && event.key === 'n') {
      event.preventDefault();
    }
  });
  
  // Focus on password field
  passwordInput.focus();
});
