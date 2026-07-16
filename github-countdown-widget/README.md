# GitHub Commit Streak & End-of-Year Countdown Widget

A premium, interactive iOS Home Screen widget built using **Scriptable** that keeps you motivated by tracking your **GitHub Commit Streak** alongside a live countdown of **Days Remaining** until the end of the year.

This repository also contains a companion **Web Dashboard & iOS Simulator** built in React + TypeScript, allowing you to preview the widget in all sizes (Small, Medium, Large), customize your contribution data in a sandbox editor, and copy the configured code for your iPhone in one click.

---

## ✨ Features

- **Automated Streak Tracking:** Fetches your public contribution history (no GitHub API key or personal access token required!).
- **Dynamic Countdown:** Live countdown of days remaining in the year, including a circular progress bar.
- **Home Screen Heatmap:** Medium and Large widget layouts feature a colored grid representing your daily activity logs, matching GitHub's contribution levels.
- **iCloud Caching:** Caches activity logs locally on the iPhone so the widget loads instantly, updating in the background when an internet connection is available.
- **Interactive Simulator:** A local web dashboard where you can edit simulated commits on a grid and see how the widget reacts, breaks streaks, and recalculates totals.

---

## 📱 How to Install the Widget on Your iPhone

1. **Install Scriptable:** Download the free [Scriptable App](https://apps.apple.com/app/scriptable/id1405459188) from the App Store.
2. **Copy the Script:** Open [ios/github_streak_widget.js](ios/github_streak_widget.js) and copy the entire JavaScript code.
3. **Paste in Scriptable:** 
   - Open Scriptable on your iPhone.
   - Tap the **`+`** icon in the top right.
   - Paste the copied code into the editor.
   - Rename the script to **"GitHub Streak"** and tap **Done**.
4. **Add to Home Screen:** 
   - Go to your iPhone Home Screen and long-press to enter jiggle mode.
   - Tap the **`+`** in the top left, search for **Scriptable**, and add a widget (Small, Medium, or Large).
   - Long-press the newly added widget and select **Edit Widget**.
   - Set **Script** to `GitHub Streak`.
   - Set **Parameter** to your GitHub Username (e.g. `torvalds` or your own username).
5. **Toggling Streaks:** The widget refreshes automatically every 30 minutes.

---

## 💻 Web Dashboard & Simulator Setup

To run the local simulator dashboard on your PC:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your system.

### Installation
Navigate to the project directory and install dependencies:
```bash
npm install
```

### Running the App
Start the local Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser to explore the dashboard.

---

## 📁 Repository Structure

```
github-countdown-widget/
├── ios/
│   └── github_streak_widget.js        # JavaScript widget to copy into iOS Scriptable
├── src/
│   ├── components/
│   │   ├── WidgetSimulator.tsx        # Simulates Small, Medium, and Large widgets
│   │   ├── Dashboard.tsx              # Analytics dashboard & interactive contribution grid
│   │   └── CodeExporter.tsx           # Copier utilities and iPhone setup guides
│   ├── App.tsx                        # Main state and API integration logic
│   ├── index.css                      # Styling tokens, phone shells, and glassmorphism styling
│   └── main.tsx
├── package.json
└── tsconfig.json
```

---

## 🛡️ License

This project is open-source and available to anyone.
