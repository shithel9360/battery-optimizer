const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
let aiState = {
  isAutoEnabled: true,
  currentMode: 'Balanced',
  targetLimit: 80,
  isDischarging: false,
  lastReport: 'Analyzing battery patterns...',
  history: [],
  carbonImpact: {
    saved: 1.2, // kg of CO2
    efficiency: 94
  },
  powerHogs: [
    { name: 'Chrome Renderer', impact: 'High', suggestion: 'Suspend background tabs' },
    { name: 'VS Code', impact: 'Medium', suggestion: 'Disable unused extensions' },
    { name: 'Slack', impact: 'Medium', suggestion: 'Clear cache' }
  ],
  activeProfile: 'longevity' // longevity, travel, performance
};

// Simulation of AI Brain logic
function runAIEngine() {
  exec('pmset -g batt', (error, stdout) => {
    if (error) return;

    const percMatch = stdout.match(/(\d+)%/);
    const charging = stdout.includes('charging');
    const onAC = stdout.includes('AC Power');
    const percentage = percMatch ? parseInt(percMatch[1]) : 0;

    if (!aiState.isAutoEnabled) {
      aiState.lastReport = 'Neural Core is in Standby mode. Manual management active.';
      aiState.currentMode = 'Standby';
      aiState.isDischarging = false;
    } else {
      // Profile-based AI Logic
      if (aiState.activeProfile === 'longevity') {
        if (onAC && percentage > 80) {
          report = 'Charge exceeds 80% Longevity threshold. Triggering Auto-Discharge to prevent cell degradation.';
          aiState.currentMode = 'Preservation';
          aiState.isDischarging = true;
          // Here is where actual SMC bypass command would execute:
          // exec('sudo smc -k CH0C -w 00');
        } else if (onAC && percentage < 80) {
          report = 'Charging efficiently towards 80% Longevity cap.';
          aiState.currentMode = 'Charging';
          aiState.isDischarging = false;
        } else {
          report = 'On Battery. Optimizing power flow for Longevity.';
          aiState.currentMode = 'Balanced';
          aiState.isDischarging = false;
        }
      } else if (aiState.activeProfile === 'travel') {
        if (onAC && percentage < 100) {
          report = 'Travel Protocol Active. Trickle charging to 100% capacity.';
          aiState.currentMode = 'Charging';
          aiState.isDischarging = false;
        } else if (onAC && percentage >= 100) {
          report = 'Battery at 100%. Maintaining full charge for upcoming travel.';
          aiState.currentMode = 'Max Capacity';
          aiState.isDischarging = false;
        } else {
          report = 'On Battery. Travel protocol standby.';
          aiState.currentMode = 'Balanced';
          aiState.isDischarging = false;
        }
      } else if (aiState.activeProfile === 'performance') {
        report = 'High-Performance Mode. Battery wear limits disabled for maximum hardware yield.';
        aiState.currentMode = 'Performance';
        aiState.isDischarging = false;
      }

      if (!onAC && percentage <= 20) {
        report = 'CRITICAL: Battery low. Engage Recovery Mode.';
        aiState.currentMode = 'Emergency Recovery';
        aiState.isDischarging = false;
      }

      aiState.lastReport = report;
    }

    // Simulate dynamic updates to history
    aiState.history.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), level: percentage, mode: aiState.currentMode });
    if (aiState.history.length > 20) aiState.history.shift();

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ai-state-update', aiState);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'dist-vite', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }
}

app.whenReady().then(() => {
  createWindow();

  // Start AI Engine loop
  setInterval(runAIEngine, 5000); // Check every 5s for demo responsiveness

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-battery-info', async () => {
  return new Promise((resolve, reject) => {
    exec('pmset -g batt', (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
        return;
      }
      resolve(stdout);
    });
  });
});

ipcMain.handle('get-detailed-battery', async () => {
  return new Promise((resolve, reject) => {
    exec('ioreg -rw0 -c AppleSmartBattery', (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
        return;
      }
      resolve(stdout);
    });
  });
});

ipcMain.handle('get-ai-state', () => aiState);

ipcMain.handle('toggle-auto-mode', (event, enabled) => {
  aiState.isAutoEnabled = enabled;
  runAIEngine(); // Force immediate evaluation
  return aiState;
});

ipcMain.handle('set-profile', (event, profile) => {
  aiState.activeProfile = profile;
  runAIEngine(); // Force immediate evaluation with new logic
  return aiState;
});

ipcMain.handle('system-optimize', async (event, action) => {
  console.log('Optimizing system:', action);
  return { status: 'success', message: 'AI Optimization applied' };
});

ipcMain.handle('get-login-settings', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('toggle-login-settings', (event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true
  });
  return enabled;
});
