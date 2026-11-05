/**
 * OrbitMenu - Main Process (Arquitectura Cero Lag & Salida Segura)
 * 1. Prohibido ejecutar PowerShell al presionar el mouse (lectura instantánea de RAM).
 * 2. setIgnoreMouseEvents(true, { forward: true }) mientras el menú está cerrado para no interferir con Windows.
 * 3. Atajo de emergencia Ctrl+Shift+Q y cierre limpio desde barra de tareas y System Tray.
 * 4. Limpieza segura de uiohook y procesos hijos al salir.
 */

const { app, BrowserWindow, screen, Tray, Menu, nativeImage, shell, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const WindowDetector = require('./window-detector');
const MouseHook = require('./mouse-hook');
const ActionDispatcher = require('./action-dispatcher');

const SETTINGS_PATH = path.join(__dirname, '../config/settings.json');
const PROFILES_PATH = path.join(__dirname, '../config/profiles.json');
const MENU_SIZE = 420;

// Icono PNG 16x16 Base64 de respaldo garantizado para el System Tray
const FALLBACK_TRAY_BASE64 = 
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGxSURBVDhPrZJNTxNBFId/M9NuS4slLQVroRREjUZ' +
  'ixAvh0j/gA/gDCB9A34yJ8eILwYP3xoUbo8YYjSFeECGgYIxUqLXQpbbd2e54p6dtW+hGY+JJPvfM/c15594xOI6DLMuQ' +
  'ZdmyWpIkfPtzh2o0imvXrqFYKOD55zF41h6yLMMwDEiSBF3XYVlWg9f7u3uwDQP5fB5KNgtrcQlqMoVvszX0n+zBsqwGL' +
  'wD7u7twbRuFfB5KLo/E7Ryk3qdw/w80eAEEq9UqHNuGP5+HPz2H1Os83LEF9Jw8xPPK2yYvALVqFfv7+xBCwHQyD6VnAm' +
  'k9C2dyAXKqhG++/80LQDFVwtTUFHzXhTf8Fp5zBNvII3l5iFRuCplMpsELwPFtB5Nzc/AcB9a3H43/5iH8n3+g3B9FvlB' +
  'o8AI42a9B1zSUiiVkMhmMvP4N3zRh7v3EwV4V6XT6G+f/A1A6G8KdWob/sA13fxv6k11I3VfhjBbhj0wgeGcCwb4iut/V' +
  'G/9V5/c0aJqGZrMJvV5v2c1ms+DxeOByuT4zfxU/AJvVwX+Nl/nOAAAAAElFTkSuQmCC';

class OrbitApp {
  constructor() {
    this.overlayWindow = null;
    this.settingsWindow = null;
    this.tray = null;

    this.settings = null;
    this.profilesConfig = null;
    this.windowDetector = null;
    this.mouseHook = null;
    this.actionDispatcher = null;

    this.anchorPoint = { x: 0, y: 0 };
    this.trackingInterval = null;
    this.currentContext = null;
    this.currentProfile = null;

    this.isMenuVisible = false;
    this.isPaused = false;
    this.isQuitting = false;
  }

  init() {
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      console.warn('[OrbitMenu] Instancia ya en ejecución. Saliendo.');
      app.exit(0);
      return;
    }

    app.commandLine.appendSwitch('disable-renderer-backgrounding');
    app.commandLine.appendSwitch('enable-transparent-visuals');

    app.whenReady().then(() => {
      this.loadConfigurations();
      this.initModules();
      this.createOverlayWindow();
      this.createSystemTray();
      this.registerShortcuts();
      this.setupIPCHandlers();
      this.startMouseHook();

      console.log('========================================================');
      console.log('        🌌 OrbitMenu v0.1.0-beta - Lanzamiento Inicial   ');
      console.log('  Atajo de Emergencia para Salir: [Ctrl + Shift + Q]   ');
      console.log('========================================================');
    });

    // Control de cierre de ventanas
    app.on('window-all-closed', () => {
      // Si el usuario pidió salir, cerrar
      if (this.isQuitting) {
        this.cleanupAndExit();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    app.on('will-quit', () => {
      this.cleanup();
    });

    process.on('SIGINT', () => this.cleanupAndExit());
    process.on('SIGTERM', () => this.cleanupAndExit());
  }

  loadConfigurations() {
    try {
      if (fs.existsSync(SETTINGS_PATH)) {
        this.settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
      }
    } catch {
      this.settings = null;
    }

    if (!this.settings) {
      this.settings = {
        triggerMouseButton: 'middle',
        triggerKeyCombo: 'Alt+Space',
        holdThresholdMs: 180,
        requireAltModifier: false,
        autoStartWithWindows: false,
        radialSize: MENU_SIZE,
        deadzoneRadius: 30
      };
    }

    try {
      this.profilesConfig = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
    } catch {
      this.profilesConfig = {
        settings: { holdThresholdMs: 180, deadzoneRadius: 30 },
        profiles: [{ id: 'default', name: 'Global', color: '#38bdf8', items: [] }]
      };
    }
  }

  initModules() {
    this.windowDetector = new WindowDetector(this.profilesConfig);
    this.actionDispatcher = new ActionDispatcher();
    this.mouseHook = new MouseHook({
      holdThresholdMs: this.settings.holdThresholdMs || 180,
      triggerMouseButton: this.settings.triggerMouseButton || 'middle',
      requireAltModifier: !!this.settings.requireAltModifier
    });
  }

  /**
   * Crea la ventana overlay transparente.
   * Por defecto con ignoreMouseEvents(true, { forward: true }) para no interferir NUNCA con Windows.
   */
  createOverlayWindow() {
    this.overlayWindow = new BrowserWindow({
      width: MENU_SIZE,
      height: MENU_SIZE,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false, // CRÍTICO: No roba el foco de la ventana activa
      hasShadow: false,
      show: false,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');

    // REGLA CRÍTICA: Mientras no esté activa, reenviar todos los clics a Windows
    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true });

    this.overlayWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
    });
  }

  openSettingsWindow() {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.show();
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 980,
      height: 680,
      minWidth: 840,
      minHeight: 560,
      backgroundColor: '#0b0f19',
      title: 'OrbitMenu - Configuración',
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.settingsWindow.loadFile(path.join(__dirname, '../renderer/settings.html'));

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }

  createSystemTray() {
    const iconPath = path.join(__dirname, '../../resources/icon.png');
    let trayImage;

    try {
      if (fs.existsSync(iconPath)) {
        trayImage = nativeImage.createFromPath(iconPath);
      } else {
        trayImage = nativeImage.createFromDataURL(FALLBACK_TRAY_BASE64);
      }
    } catch {
      trayImage = nativeImage.createFromDataURL(FALLBACK_TRAY_BASE64);
    }

    this.tray = new Tray(trayImage);
    this.tray.setToolTip('OrbitMenu - Radial Pie Menu (Activo)');

    this.updateTrayMenu();
    this.tray.on('double-click', () => this.openSettingsWindow());
  }

  updateTrayMenu() {
    const contextMenu = Menu.buildFromTemplate([
      { label: `OrbitMenu v0.1.0-beta ${this.isPaused ? '(Pausado)' : '(Activo)'}`, enabled: false },
      { type: 'separator' },
      {
        label: '⚙️ Abrir Configuración',
        click: () => this.openSettingsWindow()
      },
      {
        label: this.isPaused ? '▶️ Reanudar OrbitMenu' : '⏸️ Pausar OrbitMenu',
        click: () => {
          this.isPaused = !this.isPaused;
          if (this.isPaused) {
            this.mouseHook.stop();
            console.log('[OrbitMenu] Pausado temporalmente por el usuario.');
          } else {
            this.mouseHook.start();
            console.log('[OrbitMenu] Reanudado.');
          }
          this.updateTrayMenu();
        }
      },
      {
        label: '⚡ Probar Menú Radial',
        accelerator: 'CmdOrCtrl+Alt+O',
        click: () => this.simulateMenuOpen()
      },
      { type: 'separator' },
      {
        label: '🛑 Cerrar OrbitMenu por completo',
        accelerator: 'CmdOrCtrl+Shift+Q',
        click: () => this.cleanupAndExit()
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Atajos globales: incluye atajo de emergencia Ctrl+Shift+Q
   */
  registerShortcuts() {
    globalShortcut.unregisterAll();

    // 1. ATAJO DE EMERGENCIA GLOBAL (Ctrl + Shift + Q) para salir instantáneamente
    try {
      globalShortcut.register('CommandOrControl+Shift+Q', () => {
        console.log('[OrbitMenu] Salida de emergencia activada por Ctrl+Shift+Q.');
        this.cleanupAndExit();
      });
    } catch (e) {
      console.warn('[OrbitMenu] Error registrando atajo de emergencia:', e);
    }

    // 2. Atajo configurable para abrir menú
    if (this.settings.triggerKeyCombo) {
      try {
        globalShortcut.register(this.settings.triggerKeyCombo, () => {
          if (!this.isPaused) this.simulateMenuOpen();
        });
      } catch (err) {
        console.warn(`[OrbitMenu] No se pudo registrar atajo ${this.settings.triggerKeyCombo}:`, err.message);
      }
    }

    // 3. Atajo de prueba
    try {
      globalShortcut.register('CmdOrCtrl+Alt+O', () => {
        if (!this.isPaused) this.simulateMenuOpen();
      });
    } catch {}
  }

  setupIPCHandlers() {
    ipcMain.handle('settings:get-data', () => {
      const loginSettings = app.getLoginItemSettings();
      return {
        settings: this.settings,
        profiles: this.profilesConfig,
        autoStart: loginSettings.openAtLogin
      };
    });

    ipcMain.handle('settings:save', (_event, newSettings) => {
      try {
        this.settings = { ...this.settings, ...newSettings };
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(this.settings, null, 2), 'utf8');

        this.mouseHook.updateSettings(this.settings);

        if (typeof newSettings.autoStartWithWindows === 'boolean') {
          app.setLoginItemSettings({
            openAtLogin: newSettings.autoStartWithWindows,
            path: process.execPath
          });
        }

        this.registerShortcuts();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle('profiles:save', (_event, newProfilesData) => {
      try {
        this.profilesConfig = {
          ...this.profilesConfig,
          profiles: newProfilesData.profiles
        };
        fs.writeFileSync(PROFILES_PATH, JSON.stringify(this.profilesConfig, null, 2), 'utf8');

        if (this.windowDetector) this.windowDetector.stop();
        this.windowDetector = new WindowDetector(this.profilesConfig);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.on('orbit:cancel-emergency', () => {
      this.closeMenuOverlay();
    });

    ipcMain.on('orbit:simulate-test', () => {
      this.simulateMenuOpen();
    });

    ipcMain.on('settings:open-profiles-json', () => {
      shell.openPath(PROFILES_PATH);
    });
  }

  startMouseHook() {
    this.mouseHook.on('open', () => {
      if (!this.isPaused) this.handleMenuOpen();
    });

    // Throttling de mousemove recibido del hook: solo enviar si el menú está visible
    this.mouseHook.on('move', (data) => {
      if (!this.isMenuVisible) return;
      if (this.overlayWindow && !this.overlayWindow.isDestroyed() && this.overlayWindow.isVisible()) {
        this.overlayWindow.webContents.send('orbit:move', data);
      }
    });

    this.mouseHook.on('release', () => {
      if (!this.isPaused) this.handleMenuRelease();
    });

    this.mouseHook.on('cancel', () => {
      this.closeMenuOverlay();
    });

    this.mouseHook.start();
  }

  /**
   * Al abrir el menú: lectura a 0 ms de RAM, activar ventana y recibir mouse events
   */
  handleMenuOpen() {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      this.createOverlayWindow();
    }

    // 1. Coordenadas lógicas del cursor
    const cursor = screen.getCursorScreenPoint();
    this.anchorPoint = { x: cursor.x, y: cursor.y };

    // 2. Detección instantánea en memoria (0 ms, CERO llamadas a PowerShell)
    this.currentContext = this.windowDetector.getActiveWindow();
    this.currentProfile = this.currentContext.profile;
    this.currentContext.cursor = this.anchorPoint;

    // 3. Posicionar ventana centrada exactamente en el cursor
    const half = Math.round(MENU_SIZE / 2);
    this.overlayWindow.setBounds({
      x: Math.round(cursor.x - half),
      y: Math.round(cursor.y - half),
      width: MENU_SIZE,
      height: MENU_SIZE
    });

    // 4. Activar recepción de eventos de mouse y mostrar sin robar foco
    this.isMenuVisible = true;
    this.overlayWindow.setIgnoreMouseEvents(false);
    this.overlayWindow.showInactive();

    // 5. Enviar datos al renderer
    this.overlayWindow.webContents.send('orbit:open', {
      profile: this.currentProfile,
      activeExe: this.currentContext.exeName,
      displayName: this.currentContext.displayName,
      settings: {
        deadzoneRadius: 30
      }
    });

    this.startCursorTracking();
  }

  startCursorTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    // Bucle de tracking a 60 FPS (cada 16ms) usando coordenadas lógicas
    this.trackingInterval = setInterval(() => {
      if (!this.isMenuVisible || !this.overlayWindow || !this.overlayWindow.isVisible()) {
        clearInterval(this.trackingInterval);
        return;
      }

      const currentCursor = screen.getCursorScreenPoint();
      const dx = currentCursor.x - this.anchorPoint.x;
      const dy = currentCursor.y - this.anchorPoint.y;
      const distance = Math.hypot(dx, dy);
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;

      this.overlayWindow.webContents.send('orbit:move', {
        dx,
        dy,
        distance,
        angleRad,
        angleDeg
      });
    }, 16);
  }

  handleMenuRelease() {
    if (!this.isMenuVisible || !this.overlayWindow || !this.overlayWindow.isVisible()) return;

    const finalCursor = screen.getCursorScreenPoint();
    const dx = finalCursor.x - this.anchorPoint.x;
    const dy = finalCursor.y - this.anchorPoint.y;
    const distance = Math.hypot(dx, dy);
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;

    // Ocultar y devolver inmediatamente los clics a Windows
    this.closeMenuOverlay();

    const deadzoneRadius = 30;
    if (distance < deadzoneRadius) {
      return;
    }

    if (!this.currentProfile || !Array.isArray(this.currentProfile.items)) return;

    const items = this.currentProfile.items;
    const count = items.length;
    if (count === 0) return;

    const sliceAngle = 360 / count;
    const normalized = (angleDeg + 90 + sliceAngle / 2) % 360;
    const selectedIndex = Math.floor(normalized / sliceAngle) % count;

    const selectedItem = items[selectedIndex];
    if (selectedItem && selectedItem.action) {
      console.log(`[OrbitMenu] Acción ejecutada: "${selectedItem.label}" [${selectedItem.sublabel}] sobre "${this.currentContext.exeName}"`);
      this.actionDispatcher.dispatch(selectedItem.action, this.currentContext);
    }
  }

  /**
   * REGLA CRÍTICA: setIgnoreMouseEvents(true, { forward: true }) ANTES de ocultar
   */
  closeMenuOverlay() {
    this.isMenuVisible = false;

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      // Devolver inmediatamente todos los eventos de mouse a Windows
      this.overlayWindow.setIgnoreMouseEvents(true, { forward: true });
      this.overlayWindow.hide();
      this.overlayWindow.webContents.send('orbit:close', {});
    }
  }

  simulateMenuOpen() {
    this.handleMenuOpen();
  }

  cleanup() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    if (this.mouseHook) {
      this.mouseHook.stop();
    }
    if (this.windowDetector) {
      this.windowDetector.stop();
    }
    globalShortcut.unregisterAll();
  }

  cleanupAndExit() {
    this.isQuitting = true;
    console.log('[OrbitMenu] Cerrando aplicación limpiamente...');
    this.cleanup();

    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.destroy();
    }
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.destroy();
    }
    if (this.tray && !this.tray.isDestroyed()) {
      this.tray.destroy();
    }

    app.exit(0);
  }
}

const orbitApp = new OrbitApp();
orbitApp.init();
