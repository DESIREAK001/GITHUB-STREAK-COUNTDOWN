// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: fire;

/**
 * GitHub Commit Streak & End-of-Year Countdown iOS Widget
 * Author: Antigravity AI
 * 
 * Instructions:
 * 1. Copy this entire script.
 * 2. Open the Scriptable app on your iPhone.
 * 3. Tap the '+' icon in the top right to create a new script.
 * 4. Paste this code and rename the script to "GitHub Streak Countdown".
 * 5. Go to your Home Screen, add a Scriptable widget (Small, Medium, or Large).
 * 6. Long press the widget, tap "Edit Widget".
 * 7. Set Script to "GitHub Streak Countdown".
 * 8. In "Parameter", enter your GitHub username (e.g., 'torvalds').
 */

// --- USER CONFIGURATION ---
const DEFAULT_USERNAME = "octocat"; // Fallback username if parameter is empty
const REFRESHTIME_MINS = 30;         // How often the widget should refresh
// --------------------------

let username = args.widgetParameter ? args.widgetParameter.trim() : DEFAULT_USERNAME;

// Initialize file manager for offline caching
const fm = FileManager.local();
const cacheDir = fm.joinPath(fm.documentsDirectory(), "github-streak-widget");
if (!fm.fileExists(cacheDir)) {
  fm.createDirectory(cacheDir);
}
const cacheFile = fm.joinPath(cacheDir, `${username}-cache.json`);

// Fetch data (Scraper API data + real-time GitHub Event check)
let data = await loadData(username);
let hasRecentActivity = await checkRecentGitHubActivity(username);

// Compute metrics
const metrics = calculateMetrics(data, hasRecentActivity);

// Create Widget
let widget = await createWidget(metrics);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // Preview widget size based on Scriptable App mode
  widget.presentMedium();
}

Script.complete();

// ==========================================
// CORE METRICS & COMPUTATION
// ==========================================

function calculateMetrics(data, hasRecentActivity) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
  
  // 1. Calculate Days Remaining
  const msInDay = 24 * 60 * 60 * 1000;
  const timeDiff = endOfYear.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / msInDay));
  
  // Calculate Year Progress Percentage
  const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0);
  const totalMs = endOfYear.getTime() - startOfYear.getTime();
  const elapsedMs = now.getTime() - startOfYear.getTime();
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

  // Extract contributions
  const contributions = data.contributions || [];
  
  // Format date helper (YYYY-MM-DD)
  const formatDate = (date) => {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  };

  const todayStr = formatDate(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  // Map contributions by date for O(1) lookup
  const contribMap = {};
  let totalCommitsThisYear = 0;
  
  contributions.forEach(c => {
    contribMap[c.date] = c;
    const cYear = new Date(c.date).getFullYear();
    if (cYear === currentYear) {
      totalCommitsThisYear += c.count;
    }
  });

  // Inject today as committed if detected by the live GitHub Events API
  // (Bypasses the 1-hour cache of the scraper API)
  if (hasRecentActivity) {
    if (!contribMap[todayStr] || contribMap[todayStr].count === 0) {
      contribMap[todayStr] = { date: todayStr, count: 1, level: 1 };
      totalCommitsThisYear += 1;
    }
  }

  // Calculate Streak
  let currentStreak = 0;
  let hasCommitsToday = (contribMap[todayStr] && contribMap[todayStr].count > 0);
  let hasCommitsYesterday = (contribMap[yesterdayStr] && contribMap[yesterdayStr].count > 0);

  if (hasCommitsToday || hasCommitsYesterday) {
    // Determine start date for streak calculation
    let checkDate = hasCommitsToday ? now : yesterday;
    let streakDateStr = formatDate(checkDate);

    while (contribMap[streakDateStr] && contribMap[streakDateStr].count > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      streakDateStr = formatDate(checkDate);
    }
  }

  // Calculate Longest Streak in dataset (often past 365 days)
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Sort contributions chronologically to find longest streak
  const sortedContribs = [...contributions].sort((a, b) => a.date.localeCompare(b.date));
  
  // Apply today to the sorted array if it's not already added/active
  const todayIdx = sortedContribs.findIndex(c => c.date === todayStr);
  if (hasRecentActivity && todayIdx === -1) {
    sortedContribs.push({ date: todayStr, count: 1, level: 1 });
  } else if (hasRecentActivity && todayIdx !== -1) {
    sortedContribs[todayIdx] = { date: todayStr, count: Math.max(sortedContribs[todayIdx].count, 1), level: Math.max(sortedContribs[todayIdx].level, 1) };
  }

  sortedContribs.forEach(c => {
    if (c.count > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  });

  // Get last 14 days of contributions (for Medium/Large heatmaps)
  const last14Days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dStr = formatDate(d);
    const dayData = contribMap[dStr] || { date: dStr, count: 0, level: 0 };
    last14Days.push(dayData);
  }

  // Get last 35 days of contributions (for Large heatmap grid, 5 weeks)
  const last35Days = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dStr = formatDate(d);
    const dayData = contribMap[dStr] || { date: dStr, count: 0, level: 0 };
    last35Days.push(dayData);
  }

  return {
    username,
    daysRemaining,
    progressPercent,
    currentStreak,
    longestStreak,
    totalCommitsThisYear,
    last14Days,
    last35Days,
    todayCommitted: hasCommitsToday
  };
}

// ==========================================
// DATA ACQUISITION & CACHING
// ==========================================

async function loadData(username) {
  const url = `https://github-contributions-api.jogruber.de/v4/${username}`;
  try {
    const req = new Request(url);
    req.timeoutInterval = 10; // Timeout after 10s
    const data = await req.loadJSON();
    
    // Cache the successful fetch
    fm.writeString(cacheFile, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn(`Fetch failed for GitHub username '${username}': ${err.message}. Using cache.`);
    
    // Check if cache exists
    if (fm.fileExists(cacheFile)) {
      try {
        const cacheContent = fm.readString(cacheFile);
        return JSON.parse(cacheContent);
      } catch (cacheErr) {
        console.error("Failed to parse cache: " + cacheErr.message);
      }
    }
    
    // Return empty mock structure if offline and no cache
    return {
      total: { [new Date().getFullYear()]: 0 },
      contributions: []
    };
  }
}

// Checks official GitHub API to see if the user made commits today.
// (Bypasses the 1-hour cache of the scraper API)
async function checkRecentGitHubActivity(username) {
  const url = `https://api.github.com/users/${username}/events`;
  try {
    const req = new Request(url);
    req.headers = { "User-Agent": "Scriptable-GitHub-Streak-Widget" };
    req.timeoutInterval = 8;
    const events = await req.loadJSON();
    
    if (events && Array.isArray(events)) {
      // Get today's local date in YYYY-MM-DD
      const now = new Date();
      const formatDate = (date) => {
        let d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        return [year, month, day].join('-');
      };
      
      const todayStr = formatDate(now);
      const contribTypes = ["PushEvent", "PullRequestEvent", "IssuesEvent", "CommitCommentEvent"];
      
      // Look for any contribution event created on today's local date
      const hasTodayEvent = events.some(event => {
        if (!contribTypes.includes(event.type)) return false;
        
        // Convert the event created_at (UTC) to a local date string
        const eventDateStr = formatDate(new Date(event.created_at));
        return eventDateStr === todayStr;
      });
      
      return hasTodayEvent;
    }
  } catch (err) {
    console.warn("Failed to fetch real-time events from GitHub API: " + err.message);
  }
  return false;
}

// ==========================================
// WIDGET RENDERING (SWIFTUI-LIKE STYLING)
// ==========================================

async function createWidget(metrics) {
  const widget = new ListWidget();
  
  // Premium glassmorphic gradient background
  const bgGradient = new LinearGradient();
  bgGradient.colors = [new Color("#0b0e14"), new Color("#161b22")];
  bgGradient.locations = [0.0, 1.0];
  widget.backgroundGradient = bgGradient;
  
  // Set refresh interval
  const nextRefresh = new Date();
  nextRefresh.setMinutes(nextRefresh.getMinutes() + REFRESHTIME_MINS);
  widget.refreshAfterDate = nextRefresh;

  // Render layouts
  const family = config.widgetFamily || "medium";
  
  if (family === "small") {
    renderSmallWidget(widget, metrics);
  } else if (family === "large") {
    renderLargeWidget(widget, metrics);
  } else {
    renderMediumWidget(widget, metrics);
  }

  return widget;
}

// --- SMALL WIDGET LAYOUT ---
function renderSmallWidget(widget, metrics) {
  widget.setPadding(12, 12, 12, 12);
  
  // Top: User Details / GitHub Header
  const headerStack = widget.addStack();
  headerStack.centerAlignContent();
  
  const ghIcon = headerStack.addImage(SFSymbol.named("terminal.fill").image);
  ghIcon.imageSize = new Size(12, 12);
  ghIcon.tintColor = new Color("#30a14e");
  
  headerStack.addSpacer(4);
  
  const userText = headerStack.addText(`@${metrics.username}`);
  userText.font = Font.semiboldSystemFont(10);
  userText.textColor = new Color("#8b949e");
  userText.lineLimit = 1;

  widget.addSpacer(8);
  
  // Middle: Big Countdown
  const cdStack = widget.addStack();
  cdStack.layoutVertically();
  
  const countText = cdStack.addText(`${metrics.daysRemaining}`);
  countText.font = Font.boldRoundedSystemFont(32);
  countText.textColor = new Color("#ffffff");
  
  const labelText = cdStack.addText("DAYS LEFT IN YEAR");
  labelText.font = Font.semiboldSystemFont(9);
  labelText.textColor = new Color("#8b949e");
  
  widget.addSpacer();
  
  // Bottom: Streak Status
  const streakStack = widget.addStack();
  streakStack.centerAlignContent();
  
  const flameSymbol = SFSymbol.named("flame.fill");
  const flameImage = streakStack.addImage(flameSymbol.image);
  flameImage.imageSize = new Size(14, 14);
  flameImage.tintColor = metrics.todayCommitted ? new Color("#f78166") : new Color("#8b949e");
  
  streakStack.addSpacer(4);
  
  const streakText = streakStack.addText(`${metrics.currentStreak} day streak`);
  streakText.font = Font.boldSystemFont(12);
  streakText.textColor = metrics.todayCommitted ? new Color("#30a14e") : new Color("#ffffff");
}

// --- MEDIUM WIDGET LAYOUT ---
function renderMediumWidget(widget, metrics) {
  widget.setPadding(14, 14, 14, 14);
  
  const mainStack = widget.addStack();
  mainStack.layoutHorizontally();
  
  // Left Column: Stats & Countdown
  const leftCol = mainStack.addStack();
  leftCol.layoutVertically();
  leftCol.size = new Size(130, 0);
  
  // Username Header
  const headerStack = leftCol.addStack();
  headerStack.centerAlignContent();
  const ghIcon = headerStack.addImage(SFSymbol.named("terminal.fill").image);
  ghIcon.imageSize = new Size(10, 10);
  ghIcon.tintColor = new Color("#30a14e");
  headerStack.addSpacer(4);
  const userText = headerStack.addText(`@${metrics.username}`);
  userText.font = Font.semiboldSystemFont(10);
  userText.textColor = new Color("#8b949e");
  
  leftCol.addSpacer(4);
  
  // Countdown
  const countText = leftCol.addText(`${metrics.daysRemaining}`);
  countText.font = Font.boldRoundedSystemFont(28);
  countText.textColor = new Color("#ffffff");
  
  const labelText = leftCol.addText("days remaining");
  labelText.font = Font.mediumSystemFont(9);
  labelText.textColor = new Color("#8b949e");
  
  leftCol.addSpacer();
  
  // Commit Count
  const commitsText = leftCol.addText(`${metrics.totalCommitsThisYear} commits in ${new Date().getFullYear()}`);
  commitsText.font = Font.regularSystemFont(10);
  commitsText.textColor = new Color("#8b949e");
  
  mainStack.addSpacer();
  
  // Right Column: Streak & Heatmap
  const rightCol = mainStack.addStack();
  rightCol.layoutVertically();
  
  // Streak Header
  const streakHeader = rightCol.addStack();
  streakHeader.centerAlignContent();
  
  const flameSymbol = SFSymbol.named("flame.fill");
  const flameImage = streakHeader.addImage(flameSymbol.image);
  flameImage.imageSize = new Size(16, 16);
  flameImage.tintColor = metrics.todayCommitted ? new Color("#f78166") : new Color("#8b949e");
  
  streakHeader.addSpacer(4);
  
  const streakVal = streakHeader.addText(`${metrics.currentStreak}`);
  streakVal.font = Font.boldRoundedSystemFont(18);
  streakVal.textColor = new Color("#ffffff");
  
  streakHeader.addSpacer(4);
  
  const streakUnitText = streakHeader.addText("day streak");
  streakUnitText.font = Font.semiboldSystemFont(11);
  streakUnitText.textColor = metrics.todayCommitted ? new Color("#30a14e") : new Color("#8b949e");
  
  rightCol.addSpacer(8);
  
  // Subtitle: Today's Status
  const statusText = rightCol.addText(metrics.todayCommitted ? "Committed today! 🔥" : "No commits logged today");
  statusText.font = Font.mediumSystemFont(9);
  statusText.textColor = metrics.todayCommitted ? new Color("#30a14e") : new Color("#f78166");
  
  rightCol.addSpacer();
  
  // GitHub contributions row (Last 14 days)
  const gridTitle = rightCol.addText("RECENT ACTIVITY");
  gridTitle.font = Font.boldSystemFont(8);
  gridTitle.textColor = new Color("#58a6ff");
  
  rightCol.addSpacer(4);
  
  const gridRow = rightCol.addStack();
  gridRow.layoutHorizontally();
  gridRow.centerAlignContent();
  
  const colors = [
    new Color("#21262d"), // Level 0: empty
    new Color("#0e4429"), // Level 1: light green
    new Color("#006d32"), // Level 2: medium green
    new Color("#26a641"), // Level 3: bright green
    new Color("#39d353")  // Level 4: neon green
  ];
  
  metrics.last14Days.forEach((day, index) => {
    const square = gridRow.addStack();
    square.size = new Size(10, 10);
    square.cornerRadius = 2;
    square.backgroundColor = colors[day.level] || colors[0];
    
    if (index < 13) {
      gridRow.addSpacer(3);
    }
  });
}

// --- LARGE WIDGET LAYOUT ---
function renderLargeWidget(widget, metrics) {
  widget.setPadding(16, 16, 16, 16);
  
  // Row 1: Header
  const headerStack = widget.addStack();
  headerStack.centerAlignContent();
  
  const ghIcon = headerStack.addImage(SFSymbol.named("terminal.fill").image);
  ghIcon.imageSize = new Size(14, 14);
  ghIcon.tintColor = new Color("#30a14e");
  headerStack.addSpacer(6);
  
  const titleText = headerStack.addText(`GitHub Commit Tracker • @${metrics.username}`);
  titleText.font = Font.boldSystemFont(12);
  titleText.textColor = new Color("#ffffff");
  
  widget.addSpacer(12);
  
  // Row 2: Countdown & Streak Side-by-Side
  const statsStack = widget.addStack();
  statsStack.layoutHorizontally();
  
  // Days left
  const daysLeftCol = statsStack.addStack();
  daysLeftCol.layoutVertically();
  const daysNum = daysLeftCol.addText(`${metrics.daysRemaining}`);
  daysNum.font = Font.boldRoundedSystemFont(32);
  daysNum.textColor = new Color("#ffffff");
  const daysLbl = daysLeftCol.addText("days left in year");
  daysLbl.font = Font.semiboldSystemFont(9);
  daysLbl.textColor = new Color("#8b949e");
  
  statsStack.addSpacer();
  
  // Current streak
  const streakCol = statsStack.addStack();
  streakCol.layoutVertically();
  const streakNumStack = streakCol.addStack();
  streakNumStack.centerAlignContent();
  const flameImg = streakNumStack.addImage(SFSymbol.named("flame.fill").image);
  flameImg.imageSize = new Size(18, 18);
  flameImg.tintColor = metrics.todayCommitted ? new Color("#f78166") : new Color("#8b949e");
  streakNumStack.addSpacer(4);
  const streakNum = streakNumStack.addText(`${metrics.currentStreak}`);
  streakNum.font = Font.boldRoundedSystemFont(32);
  streakNum.textColor = new Color("#ffffff");
  
  const streakLbl = streakCol.addText("current commit streak");
  streakLbl.font = Font.semiboldSystemFont(9);
  streakLbl.textColor = metrics.todayCommitted ? new Color("#30a14e") : new Color("#8b949e");
  
  widget.addSpacer(12);
  
  // Row 3: Progress Bar
  const progStack = widget.addStack();
  progStack.layoutVertically();
  const progLabelStack = progStack.addStack();
  const progText = progLabelStack.addText("YEAR ELAPSED PROGRESS");
  progText.font = Font.boldSystemFont(8);
  progText.textColor = new Color("#8b949e");
  progLabelStack.addSpacer();
  const progVal = progLabelStack.addText(`${metrics.progressPercent}%`);
  progVal.font = Font.boldSystemFont(8);
  progVal.textColor = new Color("#ffffff");
  
  progStack.addSpacer(4);
  
  const barBg = progStack.addStack();
  barBg.size = new Size(0, 6);
  barBg.cornerRadius = 3;
  barBg.backgroundColor = new Color("#21262d");
  
  // Fill is simulated using padding/flexible spacers inside parent stack
  const barStack = progStack.addStack();
  barStack.layoutHorizontally();
  
  const filledBar = barStack.addStack();
  filledBar.size = new Size(290 * (metrics.progressPercent / 100), 6);
  filledBar.cornerRadius = 3;
  filledBar.backgroundColor = new Color("#30a14e");
  
  widget.addSpacer(14);
  
  // Row 4: Summary Metrics
  const summaryStack = widget.addStack();
  summaryStack.layoutHorizontally();
  
  const metric1 = summaryStack.addStack();
  metric1.layoutVertically();
  const m1Val = metric1.addText(`${metrics.longestStreak} days`);
  m1Val.font = Font.boldSystemFont(14);
  m1Val.textColor = new Color("#ffffff");
  const m1Lbl = metric1.addText("Longest Streak");
  m1Lbl.font = Font.regularSystemFont(9);
  m1Lbl.textColor = new Color("#8b949e");
  
  summaryStack.addSpacer();
  
  const metric2 = summaryStack.addStack();
  metric2.layoutVertically();
  const m2Val = metric2.addText(`${metrics.totalCommitsThisYear}`);
  m2Val.font = Font.boldSystemFont(14);
  m2Val.textColor = new Color("#ffffff");
  const m2Lbl = metric2.addText("Commits This Year");
  m2Lbl.font = Font.regularSystemFont(9);
  m2Lbl.textColor = new Color("#8b949e");
  
  summaryStack.addSpacer();
  
  const metric3 = summaryStack.addStack();
  metric3.layoutVertically();
  const m3Val = metric3.addText(metrics.todayCommitted ? "Done! 🔥" : "Pending ⏳");
  m3Val.font = Font.boldSystemFont(14);
  m3Val.textColor = metrics.todayCommitted ? new Color("#30a14e") : new Color("#f78166");
  const m3Lbl = metric3.addText("Today's Commit");
  m3Lbl.font = Font.regularSystemFont(9);
  m3Lbl.textColor = new Color("#8b949e");

  widget.addSpacer(14);

  // Row 5: Heatmap Grid (Last 35 days)
  const gridTitleStack = widget.addStack();
  const gridTitle = gridTitleStack.addText("HEATMAP (PAST 5 WEEKS)");
  gridTitle.font = Font.boldSystemFont(8);
  gridTitle.textColor = new Color("#58a6ff");
  
  widget.addSpacer(4);
  
  const heatmapRow = widget.addStack();
  heatmapRow.layoutHorizontally();
  
  const colors = [
    new Color("#21262d"),
    new Color("#0e4429"),
    new Color("#006d32"),
    new Color("#26a641"),
    new Color("#39d353")
  ];
  
  for (let w = 0; w < 5; w++) {
    const col = heatmapRow.addStack();
    col.layoutVertically();
    
    for (let d = 0; d < 7; d++) {
      const idx = w * 7 + d;
      const day = metrics.last35Days[idx];
      const square = col.addStack();
      square.size = new Size(10, 10);
      square.cornerRadius = 2;
      square.backgroundColor = day ? (colors[day.level] || colors[0]) : colors[0];
      
      if (d < 6) col.addSpacer(3);
    }
    
    if (w < 4) heatmapRow.addSpacer(3);
  }
}
