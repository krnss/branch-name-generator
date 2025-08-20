# 🪴 Branch Name Generator for Azure DevOps (Chrome Extension)

This Chrome extension helps you **generate consistent Git branch names** and **copy default commit messages** directly from Azure DevOps work items.

No more manual typing — one click gives you a clean, readable branch name and commit message, tailored to the task.

---

## ✨ Features

- 🧠 Parses Azure DevOps task type, ID, and title
- 🏷 Generates a branch name like:  
  `feat/TP-1234-fix-login-bug`
- 📝 One-click commit message generator:
  `feat: fix login bug
  
  Implements: #1234
  `
- ⚙️ **NEW: Extension Settings Popup**
  - Click the extension icon in Chrome's toolbar to open settings
  - On/Off toggle to enable/disable the generator
  - Customizable branch name structure using variables
  - Real-time preview of your custom format
  - Settings saved automatically to localStorage
- 📋 Copy buttons with auto-feedback
- 💾 Remembers last generated branch name using `localStorage`
- ♻️ Regenerate and update at any time
- 💅 Fully integrated into the Azure DevOps UI

---

## 📦 Installation

> Follow these steps to build and run the extension locally in Chrome.

1. 📥 Clone the Repository
git clone https://github.com/your-username/branch-name-generator.git
cd branch-name-generator

2. 🔧 Install Dependencies
npm install

3. 🛠 Build the Extension
This will also automatically increment the version in manifest.json.

npm run build
The built extension will be available in the dist/ folder.

4. 🧩 Load into Chrome
Open chrome://extensions/

Enable Developer mode (top right)

Click Load unpacked

Select the dist/ folder from this project

## Done! 🎉

## 💡 Usage
Open a task in Azure DevOps (e.g. a bug, feature, or epic)

Click "Generate Branch Name"

✅ The branch name appears inline

📋 Use the copy, regenerate, or delete buttons

📝 Click "Copy Commit Msg" to generate a commit message like:

  fix: broken button styles

  Fixes: #2231

⚙️ **Access Settings**
- Click the extension icon (🧩) in Chrome's toolbar to open the settings popup
- Toggle the generator on/off
- Customize your branch name structure using variables:
  - `${prefix}` - Task type (feat, fix, task, etc.)
  - `${id}` - Task ID number
  - `${slug}` - URL-friendly task title
- See real-time preview of your custom format

🧠 How It Works
The extension:

Extracts the task ID, type, and title from the Azure DevOps DOM

Converts the title to kebab-case

Detects task type to choose a prefix (feat, fix, task, etc.)

Saves the result in localStorage

Observes DOM changes so it works even on dynamic page loads

## 🚀 Built With
Vite — fast modern frontend tooling

Chrome Extensions API

✨ Vanilla JS and DOM APIs — no frameworks

## 📈 Auto Versioning
Each time you run npm run build, the version in manifest.json is incremented automatically by a prebuild script.

## 🖤 Author
Made with love for clean branches and less typing
by Oleg Khai

Contributions, feedback, donate, and stars are always welcome!