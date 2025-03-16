# PassForB - Chrome Password Lock Extension

A 100% secure Chrome extension that adds comprehensive password protection to your entire Chrome browser.

## Features

- **Complete Browser Locking**: Locks ALL tabs and windows, not just individual tabs
- **Persistent Security**: Remembers your password between Chrome sessions
- **Completely Local**: No external database, no external hosting, and no Chrome sync
- **Two Lock Modes**:
  - **Startup Lock**: Automatically locks Chrome when it starts up
  - **Manual Lock**: Toolbar button to manually lock the session
- **Forgot Password Recovery**: After 3 wrong attempts, shows a recovery option using your personal identifier
- **Secure Storage**: All sensitive data is securely stored in Chrome's local storage

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked" and select the `passforgo` folder
4. The extension should now be installed and active
5. You'll be automatically prompted to create a password and recovery identifier

## Troubleshooting Installation

If you encounter any issues during installation:

1. **Disable any ad blockers or other security extensions** temporarily
2. In `chrome://extensions/`, click on "Errors" next to PassForB to see any error messages
3. Right-click on the setup page and select "Inspect" to open DevTools, then check the Console tab for errors
4. Try removing the extension completely and re-installing it from scratch
5. Make sure all the extension files are in the correct location with the proper names
6. Restart Chrome and try again

## Usage

### Manual Lock/Unlock
- Click the PassForB extension icon in the toolbar:
  - If unlocked: This will lock Chrome
  - If locked: This will show the password prompt

### Password Recovery
- If you enter the wrong password 3 times, a "Forgot your password?" option appears
- Click this option and enter your recovery identifier
- Enter a new password to reset and unlock Chrome

### Changing Credentials
- Click the PassForB extension icon in the toolbar when unlocked
- In the popup, enter your new password and/or recovery identifier
- Click "Update Credentials" to save changes

## Security Notes

- The extension enforces a comprehensive lock that prevents access to ANY tab in Chrome
- If Chrome is locked and you try to navigate away from the lock screen, Chrome will enforce the lock
- Credentials are saved securely using Chrome's local storage API
- Multiple layers of security ensure 100% protection

## Advanced Security Features

- **Navigation Prevention**: Blocks keyboard shortcuts and navigation attempts
- **Tab Creation Monitoring**: Automatically locks any new tabs
- **Window Focus Detection**: Ensures security when switching between windows
- **Periodic Security Checks**: Runs constant verification to ensure all tabs remain locked
