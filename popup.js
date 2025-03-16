document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const toggleLockBtn = document.getElementById('toggleLockBtn');
  const updateCredentialsBtn = document.getElementById('updateCredentialsBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const statusMessage = document.getElementById('statusMessage');
  const newPasswordInput = document.getElementById('newPassword');
  const newRecoveryIdInput = document.getElementById('newRecoveryId');
  
  // Check lock status
  checkLockStatus();
  
  // Toggle lock button
  toggleLockBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({action: 'getStatus'}, function(response) {
      if (response.isLocked) {
        // If locked, show password prompt
        chrome.tabs.create({ url: chrome.runtime.getURL("lock.html") });
        window.close();
      } else {
        // If unlocked, lock browser
        chrome.runtime.sendMessage({action: 'lock'}, function(response) {
          if (response && response.success) {
            // Close the popup when locking
            window.close();
          }
        });
      }
    });
  });
  
  // Update credentials button
  updateCredentialsBtn.addEventListener('click', function() {
    const newPassword = newPasswordInput.value.trim();
    const newRecoveryId = newRecoveryIdInput.value.trim();
    
    if (!newPassword && !newRecoveryId) {
      showMessage('Please enter at least one new credential', 'error');
      return;
    }
    
    const updateData = {action: 'updateCredentials'};
    if (newPassword) updateData.password = newPassword;
    if (newRecoveryId) updateData.recoveryIdentifier = newRecoveryId;
    
    chrome.runtime.sendMessage(updateData, function(response) {
      if (response && response.success) {
        showMessage('Credentials updated and saved successfully', 'success');
        newPasswordInput.value = '';
        newRecoveryIdInput.value = '';
      } else {
        showMessage(response.error || 'Failed to update credentials', 'error');
      }
    });
  });
  
  // Helper function to check lock status
  function checkLockStatus() {
    chrome.runtime.sendMessage({action: 'getStatus'}, function(response) {
      updateLockUI(response && response.isLocked);
    });
  }
  
  // Helper function to update the UI based on lock status
  function updateLockUI(isLocked) {
    if (isLocked) {
      statusDot.className = 'status-dot locked';
      statusText.textContent = 'Chrome is locked';
      toggleLockBtn.textContent = 'Unlock Chrome';
      toggleLockBtn.className = 'action-button primary';
    } else {
      statusDot.className = 'status-dot unlocked';
      statusText.textContent = 'Chrome is unlocked';
      toggleLockBtn.textContent = 'Lock Chrome';
      toggleLockBtn.className = 'action-button danger';
    }
  }
  
  // Helper function to show status messages
  function showMessage(msg, type) {
    statusMessage.textContent = msg;
    statusMessage.className = `message ${type}`;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }
});
