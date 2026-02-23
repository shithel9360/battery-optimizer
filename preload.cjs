const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getBatteryInfo: () => ipcRenderer.invoke('get-battery-info'),
    getDetailedBattery: () => ipcRenderer.invoke('get-detailed-battery'),
    getAiState: () => ipcRenderer.invoke('get-ai-state'),
    toggleAutoMode: (enabled) => ipcRenderer.invoke('toggle-auto-mode', enabled),
    setProfile: (profile) => ipcRenderer.invoke('set-profile', profile),
    getLoginSettings: () => ipcRenderer.invoke('get-login-settings'),
    toggleLoginSettings: (enabled) => ipcRenderer.invoke('toggle-login-settings', enabled),
    systemOptimize: (action) => ipcRenderer.invoke('system-optimize', action),
    onAiUpdate: (callback) => ipcRenderer.on('ai-state-update', (_event, value) => callback(value)),
});
