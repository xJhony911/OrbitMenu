/**
 * OrbitMenu - Action Dispatcher (Fase 2)
 * Despachador de acciones con micro-utilidades nativas reales:
 * 1. Monitor de Historial de Portapapeles (últimos 6 ítems).
 * 2. Pegado Limpio (Clean Paste sin formato enriquecido).
 * 3. Always on Top nativo Win32 (SetWindowPos HWND_TOPMOST).
 * 4. Cuentagotas de Color nativo (Win32 GDI GetPixel + Notificación + Clipboard).
 * 5. Simulación de atajos a 0 ms mediante user32.dll keybd_event.
 */

const { exec, spawn } = require('child_process');
const { clipboard, Notification } = require('electron');

// Códigos Virtual-Key de Windows
const VK = {
  VK_SHIFT: 0x10,
  VK_CONTROL: 0x11,
  VK_MENU: 0x12, // Alt
  VK_LWIN: 0x5b,
  VK_RWIN: 0x5c,
  VK_BACK: 0x08,
  VK_TAB: 0x09,
  VK_RETURN: 0x0d,
  VK_ESCAPE: 0x1b,
  VK_SPACE: 0x20,
  VK_DELETE: 0x2e,
  VK_OEM_1: 0xba,
  VK_OEM_PLUS: 0xbb,
  VK_OEM_COMMA: 0xbc,
  VK_OEM_MINUS: 0xbd,
  VK_OEM_PERIOD: 0xbe,
  VK_OEM_2: 0xbf,
  VK_OEM_3: 0xc0,
  VK_OEM_4: 0xdb,
  VK_OEM_5: 0xdc,
  VK_OEM_6: 0xdd,
  VK_VOLUME_MUTE: 0xad,
  VK_VOLUME_DOWN: 0xae,
  VK_VOLUME_UP: 0xaf,
  VK_MEDIA_NEXT_TRACK: 0xb0,
  VK_MEDIA_PREV_TRACK: 0xb1,
  VK_MEDIA_STOP: 0xb2,
  VK_MEDIA_PLAY_PAUSE: 0xb3,
  VK_F1: 0x70,
  VK_F2: 0x71,
  VK_F3: 0x72,
  VK_F4: 0x73,
  VK_F5: 0x74,
  VK_F6: 0x75,
  VK_F7: 0x76,
  VK_F8: 0x77,
  VK_F9: 0x78,
  VK_F10: 0x79,
  VK_F11: 0x7a,
  VK_F12: 0x7b
};

class ActionDispatcher {
  constructor() {
    this.koffiLoaded = false;
    this.topmostWindows = new Set();
    this.clipboardHistory = [];
    this.lastClipboardText = '';

    this.initNativeBindings();
    this.startClipboardMonitor();
  }

  /**
   * Inicializa las APIs Win32 (user32.dll y gdi32.dll)
   */
  initNativeBindings() {
    try {
      const koffi = require('koffi');
      this.user32 = koffi.load('user32.dll');
      this.gdi32 = koffi.load('gdi32.dll');

      // Simulación de teclado
      this.keybd_event = this.user32.func('__stdcall', 'keybd_event', 'void', ['uint8', 'uint8', 'uint32', 'size_t']);

      // Fijar ventanas Always on Top
      this.SetWindowPos = this.user32.func('__stdcall', 'SetWindowPos', 'bool', [
        'void*', 'void*', 'int', 'int', 'int', 'int', 'uint32'
      ]);

      // Captura de píxel de color en pantalla (EyeDropper)
      this.GetDC = this.user32.func('__stdcall', 'GetDC', 'void*', ['void*']);
      this.ReleaseDC = this.user32.func('__stdcall', 'ReleaseDC', 'int', ['void*', 'void*']);
      this.GetPixel = this.gdi32.func('__stdcall', 'GetPixel', 'uint32', ['void*', 'int', 'int']);

      this.koffiLoaded = true;
      console.log('[ActionDispatcher] Win32 nativo (Koffi: user32 + gdi32) listo.');
    } catch (err) {
      console.warn('[ActionDispatcher] Koffi no disponible, usando modo híbrido:', err.message);
      this.koffiLoaded = false;
    }
  }

  /**
   * 1. Monitor de Historial de Portapapeles (guarda los últimos 6 textos únicos)
   */
  startClipboardMonitor() {
    setInterval(() => {
      try {
        const currentText = clipboard.readText();
        if (currentText && currentText.trim() && currentText !== this.lastClipboardText) {
          this.lastClipboardText = currentText;

          // Evitar duplicados consecutivos
          this.clipboardHistory = this.clipboardHistory.filter((item) => item.text !== currentText);

          // Guardar en buffer circular de 6 elementos
          const preview = currentText.length > 35 ? currentText.substring(0, 32) + '...' : currentText;
          this.clipboardHistory.unshift({
            text: currentText,
            preview: preview.replace(/\r?\n/g, ' '),
            timestamp: Date.now()
          });

          if (this.clipboardHistory.length > 6) {
            this.clipboardHistory.pop();
          }
        }
      } catch {
        // Ignorar excepciones temporales de lectura de portapapeles
      }
    }, 500);
  }

  getClipboardHistory() {
    return this.clipboardHistory;
  }

  pasteClipboardItem(index = 0) {
    if (this.clipboardHistory[index]) {
      const text = this.clipboardHistory[index].text;
      clipboard.writeText(text);
      this.sendShortcut(['Control', 'V']);
    }
  }

  /**
   * Despacha la acción recibida del menú radial
   */
  async dispatch(action, windowContext = {}) {
    if (!action) return;

    console.log('[ActionDispatcher] Ejecutando acción:', action);

    try {
      switch (action.type) {
        case 'shortcut':
          await this.sendShortcut(action.keys);
          break;

        case 'system':
          await this.executeSystemAction(action.systemAction, windowContext);
          break;

        case 'command':
          if (action.command) {
            exec(action.command, (err) => {
              if (err) console.error('[ActionDispatcher] Error en comando:', err);
            });
          }
          break;

        case 'clipboard':
          if (action.text) {
            clipboard.writeText(action.text);
            await this.sendShortcut(['Control', 'V']);
          }
          break;

        default:
          console.warn('[ActionDispatcher] Tipo de acción no reconocido:', action.type);
      }
    } catch (err) {
      console.error('[ActionDispatcher] Error en ejecución:', err);
    }
  }

  /**
   * Ejecuta micro-utilidades del sistema
   */
  async executeSystemAction(actionName, context = {}) {
    switch (actionName) {
      case 'toggle_always_on_top':
        this.toggleAlwaysOnTop(context.hwnd);
        break;

      case 'clean_paste':
        await this.cleanPaste();
        break;

      case 'eyedropper':
        this.captureScreenPixelColor(context.cursor);
        break;

      case 'clipboard_history':
        this.pasteClipboardItem(0);
        break;

      case 'insert_datetime':
        await this.insertDateTime();
        break;

      case 'open_terminal_here':
        this.openTerminal();
        break;

      case 'compress_zip':
        await this.sendShortcut(['Alt', 'Enter']);
        break;

      default:
        console.warn('[ActionDispatcher] Acción de sistema no implementada:', actionName);
    }
  }

  /**
   * 2. Pegado Limpio (Clean Paste): Remueve formato y caracteres innecesarios
   */
  async cleanPaste() {
    const raw = clipboard.readText();
    if (!raw) return;

    // Normalizar texto: eliminar saltos de línea excesivos y espacios dobles
    const cleaned = raw
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    clipboard.writeText(cleaned);
    await this.sendShortcut(['Control', 'V']);
    console.log('[ActionDispatcher] Pegado limpio ejecutado.');
  }

  /**
   * 3. Always on Top (Fijar ventana activa con HWND_TOPMOST)
   */
  toggleAlwaysOnTop(hwnd) {
    const HWND_TOPMOST = -1;
    const HWND_NOTOPMOST = -2;
    const SWP_NOMOVE = 0x0002;
    const SWP_NOSIZE = 0x0001;
    const flags = SWP_NOMOVE | SWP_NOSIZE;

    if (hwnd && this.koffiLoaded) {
      const isTop = this.topmostWindows.has(hwnd);
      const target = isTop ? HWND_NOTOPMOST : HWND_TOPMOST;

      try {
        this.SetWindowPos(hwnd, target, 0, 0, 0, 0, flags);
        if (isTop) {
          this.topmostWindows.delete(hwnd);
          this.notify('OrbitMenu', 'Ventana desfijada (Modo normal)');
        } else {
          this.topmostWindows.add(hwnd);
          this.notify('OrbitMenu', '📌 Ventana fijada (Always on Top)');
        }
        return;
      } catch (err) {
        console.error('[ActionDispatcher] Error fijando ventana con Koffi:', err);
      }
    }

    // Fallback con PowerShell
    this.toggleAlwaysOnTopPowerShell();
  }

  toggleAlwaysOnTopPowerShell() {
    const psScript = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
          [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
          [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
        }
"@
      $h = [Win32]::GetForegroundWindow()
      [Win32]::SetWindowPos($h, [IntPtr](-1), 0, 0, 0, 0, 0x0003)
    `.replace(/\r?\n\s*/g, ' ');

    exec(`powershell -NoProfile -Command "${psScript}"`, (err) => {
      if (!err) this.notify('OrbitMenu', '📌 Ventana fijada (Always on Top)');
    });
  }

  /**
   * 4. Cuentagotas de Color Nativo (EyeDropper)
   * Captura el color exacto del píxel en pantalla con GDI GetPixel, lo convierte a HEX y lo copia al portapapeles.
   */
  captureScreenPixelColor(cursorPos = null) {
    let x = 0;
    let y = 0;

    if (cursorPos && typeof cursorPos.x === 'number') {
      x = cursorPos.x;
      y = cursorPos.y;
    } else {
      const { screen } = require('electron');
      const pt = screen.getCursorScreenPoint();
      x = pt.x;
      y = pt.y;
    }

    if (this.koffiLoaded) {
      try {
        const hdc = this.GetDC(null);
        if (hdc) {
          const colorRef = this.GetPixel(hdc, x, y);
          this.ReleaseDC(null, hdc);

          // En Windows COLORREF es 0x00BBGGRR
          const r = colorRef & 0xff;
          const g = (colorRef >> 8) & 0xff;
          const b = (colorRef >> 16) & 0xff;

          const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
          const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

          clipboard.writeText(hex);
          console.log(`[ActionDispatcher] Cuentagotas: Color capturado en (${x}, ${y}): ${hex}`);
          this.notify('OrbitMenu Cuentagotas', `Color capturado: ${hex} (Copiado al portapapeles)`);
          return;
        }
      } catch (err) {
        console.error('[ActionDispatcher] Error en EyeDropper nativo:', err);
      }
    }

    // Fallback con PowerShell
    const psColor = `
      Add-Type -AssemblyName System.Drawing
      $bmp = New-Object System.Drawing.Bitmap 1, 1
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.CopyFromScreen(${x}, ${y}, 0, 0, (New-Object System.Drawing.Size 1, 1))
      $c = $bmp.GetPixel(0, 0)
      "#{0:X2}{1:X2}{2:X2}" -f $c.R, $c.G, $c.B
    `.replace(/\r?\n\s*/g, ' ');

    exec(`powershell -NoProfile -Command "${psColor}"`, (_err, stdout) => {
      const hex = stdout.trim();
      if (hex && hex.startsWith('#')) {
        clipboard.writeText(hex);
        this.notify('OrbitMenu Cuentagotas', `Color capturado: ${hex} (Copiado al portapapeles)`);
      }
    });
  }

  notify(title, body) {
    try {
      if (Notification.isSupported()) {
        new Notification({ title, body, silent: true }).show();
      }
    } catch {
      // Ignorar si las notificaciones de Windows están restringidas
    }
  }

  /**
   * Simula el envío de pulsaciones de teclado a la ventana activa
   */
  async sendShortcut(keys) {
    if (!Array.isArray(keys) || keys.length === 0) return;

    if (this.koffiLoaded) {
      this.sendShortcutNative(keys);
    } else {
      await this.sendShortcutPowerShell(keys);
    }
  }

  sendShortcutNative(keys) {
    const KEYEVENTF_KEYUP = 0x0002;
    const KEYEVENTF_EXTENDEDKEY = 0x0001;

    const vkCodes = keys.map((k) => this.resolveVkCode(k)).filter(Boolean);
    if (vkCodes.length === 0) return;

    for (const code of vkCodes) {
      const flags = this.isExtendedKey(code) ? KEYEVENTF_EXTENDEDKEY : 0;
      this.keybd_event(code, 0, flags, 0);
    }

    for (let i = vkCodes.length - 1; i >= 0; i--) {
      const code = vkCodes[i];
      const flags = KEYEVENTF_KEYUP | (this.isExtendedKey(code) ? KEYEVENTF_EXTENDEDKEY : 0);
      this.keybd_event(code, 0, flags, 0);
    }
  }

  isExtendedKey(vk) {
    return (
      vk === VK.VK_LWIN ||
      vk === VK.VK_RWIN ||
      vk === VK.VK_VOLUME_MUTE ||
      vk === VK.VK_VOLUME_DOWN ||
      vk === VK.VK_VOLUME_UP ||
      vk === VK.VK_MEDIA_NEXT_TRACK ||
      vk === VK.VK_MEDIA_PREV_TRACK ||
      vk === VK.VK_MEDIA_STOP ||
      vk === VK.VK_MEDIA_PLAY_PAUSE
    );
  }

  resolveVkCode(keyName) {
    if (typeof keyName !== 'string') return 0;
    const upper = keyName.toUpperCase();

    if (upper === 'CONTROL' || upper === 'CTRL') return VK.VK_CONTROL;
    if (upper === 'SHIFT') return VK.VK_SHIFT;
    if (upper === 'ALT') return VK.VK_MENU;
    if (upper === 'META' || upper === 'WIN' || upper === 'SUPER') return VK.VK_LWIN;

    if (/^[A-Z]$/.test(upper)) return upper.charCodeAt(0);
    if (/^[0-9]$/.test(upper)) return upper.charCodeAt(0);

    if (/^F([1-9]|1[0-2])$/.test(upper)) {
      const num = parseInt(upper.replace('F', ''), 10);
      return VK.VK_F1 + (num - 1);
    }

    switch (upper) {
      case 'ENTER':
      case 'RETURN':
        return VK.VK_RETURN;
      case 'ESCAPE':
      case 'ESC':
        return VK.VK_ESCAPE;
      case 'TAB':
        return VK.VK_TAB;
      case 'SPACE':
        return VK.VK_SPACE;
      case 'BACKSPACE':
      case 'BACK':
        return VK.VK_BACK;
      case 'DELETE':
      case 'DEL':
        return VK.VK_DELETE;
      case '`':
      case 'BACKQUOTE':
      case 'TILDE':
        return VK.VK_OEM_3;
      case '/':
      case 'SLASH':
        return VK.VK_OEM_2;
      case '\\':
      case 'BACKSLASH':
        return VK.VK_OEM_5;
      case '=':
      case '+':
      case 'PLUS':
        return VK.VK_OEM_PLUS;
      case '-':
      case 'MINUS':
        return VK.VK_OEM_MINUS;
      case 'AUDIOVOLUMEMUTE':
      case 'VOLUMEMUTE':
        return VK.VK_VOLUME_MUTE;
      case 'AUDIOVOLUMEDOWN':
      case 'VOLUMEDOWN':
        return VK.VK_VOLUME_DOWN;
      case 'AUDIOVOLUMEUP':
      case 'VOLUMEUP':
        return VK.VK_VOLUME_UP;
      case 'MEDIAPLAYPAUSE':
        return VK.VK_MEDIA_PLAY_PAUSE;
      case 'MEDIANEXTTRACK':
        return VK.VK_MEDIA_NEXT_TRACK;
      case 'MEDIAPREVIOUSTRACK':
        return VK.VK_MEDIA_PREV_TRACK;
      default:
        return 0;
    }
  }

  async sendShortcutPowerShell(keys) {
    const vkList = keys.map((k) => this.resolveVkCode(k)).filter(Boolean);
    if (vkList.length === 0) return;

    const pressLines = vkList.map((vk) => `[W]::keybd_event(${vk}, 0, 0, 0)`).join('; ');
    const releaseLines = [...vkList].reverse().map((vk) => `[W]::keybd_event(${vk}, 0, 2, 0)`).join('; ');

    const script = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class W {
          [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
        }
"@
      ${pressLines}
      Start-Sleep -Milliseconds 15
      ${releaseLines}
    `.replace(/\r?\n\s*/g, ' ');

    exec(`powershell -NoProfile -Command "${script}"`);
  }

  async insertDateTime() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    clipboard.writeText(formatted);
    await this.sendShortcut(['Control', 'V']);
  }

  openTerminal() {
    exec('wt.exe -d .', (err) => {
      if (err) {
        spawn('powershell.exe', ['-NoExit'], { detached: true, stdio: 'ignore' });
      }
    });
  }
}

module.exports = ActionDispatcher;
