/**
 * OrbitMenu - Preload Script (Fase 2)
 * Expone un puente IPC seguro para el menú radial flotante y la ventana de configuración visual.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('orbitAPI', {
  // Eventos del Menú Radial
  onMenuOpen: (callback) => {
    ipcRenderer.on('orbit:open', (_event, data) => callback(data));
  },
  onMouseMove: (callback) => {
    ipcRenderer.on('orbit:move', (_event, data) => callback(data));
  },
  onMenuClose: (callback) => {
    ipcRenderer.on('orbit:close', (_event, data) => callback(data));
  },
  cancelEmergency: () => {
    ipcRenderer.send('orbit:cancel-emergency');
  },
  dispatchAction: (action) => {
    ipcRenderer.send('orbit:dispatch-action', action);
  },

  // APIs de la Ventana de Configuración (Settings GUI)
  getSettingsData: () => ipcRenderer.invoke('settings:get-data'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  saveProfiles: (profilesData) => ipcRenderer.invoke('profiles:save', profilesData),
  openProfilesJson: () => ipcRenderer.send('settings:open-profiles-json'),
  simulateTestMenu: () => ipcRenderer.send('orbit:simulate-test')
});
