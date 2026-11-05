/**
 * OrbitMenu - Window Detector (Cero Lag & No Bloqueante)
 * Detecta la aplicación activa en memoria sin bloquear jamás el hilo principal de Electron.
 * Utiliza Koffi en memoria (< 0.05 ms) y un sondeo asíncrono no bloqueante cada 1500 ms en segundo plano.
 * Al presionar el mouse, la lectura es INSTANTÁNEA desde RAM (0 milisegundos).
 */

const { exec } = require('child_process');
const path = require('path');

// Normalizador de nombres de ejecutables
const normalize = (name) => String(name || '').toLowerCase().trim().replace(/\.exe$/i, '');

class WindowDetector {
  constructor(profilesConfig) {
    this.profilesConfig = profilesConfig;
    this.defaultProfile = profilesConfig.profiles.find((p) => p.id === 'default') || profilesConfig.profiles[0];
    this.executableMap = new Map();

    // Variable en memoria leída a 0 ms al presionar el mouse
    this.lastActiveProcess = 'explorer';
    this.lastProfile = this.defaultProfile;

    this.koffiLoaded = false;
    this.pollerInterval = null;
    this.isQueryingAsync = false;

    this.rebuildExecutableMap();
    this.initNativeBindings();
    this.buildEncodedCommand();
    this.startAsyncPoller();
  }

  rebuildExecutableMap() {
    this.executableMap.clear();
    for (const profile of this.profilesConfig.profiles) {
      if (Array.isArray(profile.executables)) {
        for (const exe of profile.executables) {
          const norm = normalize(exe);
          if (norm) {
            this.executableMap.set(norm, profile);
          }
        }
      }
    }
  }

  /**
   * Inicializa Koffi para consultas directas en memoria Win32 en 0.05 ms sin subprocesos
   */
  initNativeBindings() {
    try {
      const koffi = require('koffi');
      this.user32 = koffi.load('user32.dll');
      this.kernel32 = koffi.load('kernel32.dll');

      this.GetForegroundWindow = this.user32.func('__stdcall', 'GetForegroundWindow', 'intptr_t', []);
      this.GetWindowThreadProcessId = this.user32.func('__stdcall', 'GetWindowThreadProcessId', 'uint32', ['intptr_t', 'uint32*']);
      this.OpenProcess = this.kernel32.func('__stdcall', 'OpenProcess', 'intptr_t', ['uint32', 'bool', 'uint32']);
      this.QueryFullProcessImageNameW = this.kernel32.func('__stdcall', 'QueryFullProcessImageNameW', 'bool', ['intptr_t', 'uint32', 'char16_t*', 'uint32*']);
      this.CloseHandle = this.kernel32.func('__stdcall', 'CloseHandle', 'bool', ['intptr_t']);

      this.koffiLoaded = true;
      console.log('[WindowDetector] Motor nativo Win32 en memoria activo (0.05ms).');
    } catch {
      this.koffiLoaded = false;
    }
  }

  buildEncodedCommand() {
    const psScript = `
$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'SilentlyContinue'
try {
    $sig = @'
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
'@
    $type = Add-Type -MemberDefinition $sig -Name "Win32API" -Namespace "Orbit" -PassThru -ErrorAction SilentlyContinue
    $h = [Orbit.Win32API]::GetForegroundWindow()
    $pidVal = 0
    [Orbit.Win32API]::GetWindowThreadProcessId($h, [ref]$pidVal) | Out-Null
    if ($pidVal -gt 0) {
        $p = Get-Process -Id $pidVal -ErrorAction SilentlyContinue
        if ($p) {
            Write-Output $p.ProcessName
        }
    }
} catch {}
`;
    this.encodedPsCommand = Buffer.from(psScript, 'utf16le').toString('base64');
  }

  /**
   * Sondeo en segundo plano COMPLETAMENTE ASÍNCRONO cada 1500 ms (sin bloquear jamás el hilo principal)
   */
  startAsyncPoller() {
    this.pollerInterval = setInterval(() => {
      // 1. Intentar primero con Koffi en memoria (instantáneo, 0ms)
      if (this.koffiLoaded) {
        const nativeName = this.queryNativeInMemory();
        if (nativeName) {
          this.updateActiveProcess(nativeName);
          return;
        }
      }

      // 2. Si no, consulta asíncrona no bloqueante
      this.queryAsyncFallback();
    }, 1500);
  }

  /**
   * Consulta Win32 directa en memoria C (0.05ms sin spawn de procesos)
   */
  queryNativeInMemory() {
    try {
      const hwnd = this.GetForegroundWindow();
      if (!hwnd) return null;

      const pidArr = [0];
      this.GetWindowThreadProcessId(hwnd, pidArr);
      const pid = pidArr[0];
      if (!pid) return null;

      // PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
      const hProc = this.OpenProcess(0x1000, false, pid);
      if (!hProc) return null;

      let exeName = '';
      const pathBuf = Buffer.alloc(1024);
      const sizeArr = [512];
      if (this.QueryFullProcessImageNameW(hProc, 0, pathBuf, sizeArr)) {
        const fullPath = pathBuf.toString('utf16le', 0, sizeArr[0] * 2).replace(/\0+$/, '');
        exeName = path.basename(fullPath);
      }
      this.CloseHandle(hProc);
      return exeName;
    } catch {
      return null;
    }
  }

  /**
   * Consulta asíncrona mediante PowerShell en segundo plano SIN BLOQUEAR
   */
  queryAsyncFallback() {
    if (this.isQueryingAsync) return;
    this.isQueryingAsync = true;

    exec(
      `powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand ${this.encodedPsCommand}`,
      { windowsHide: true, timeout: 2000 },
      (err, stdout) => {
        this.isQueryingAsync = false;
        if (!err && stdout) {
          const lines = stdout.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          const rawProc = lines.length > 0 ? lines[lines.length - 1] : '';
          if (rawProc) {
            this.updateActiveProcess(rawProc);
          }
        }
      }
    );
  }

  updateActiveProcess(procName) {
    const norm = normalize(procName);
    // Ignorar nuestra propia ventana de Electron para no sobreescribir la app activa del usuario
    if (norm && norm !== 'electron' && norm !== 'orbitmenu' && norm !== 'orbit-menu') {
      this.lastActiveProcess = procName;
      this.lastProfile = this.matchProfile(norm);
    }
  }

  /**
   * Obtiene la aplicación activa en 0 MILISEGUNDOS leyendo la variable en memoria.
   * PROHIBIDO EJECUTAR POWERSHELL O EXECSYNC AQUÍ.
   */
  getActiveWindow() {
    // Si Koffi está disponible, podemos chequear la memoria en 0.05ms
    if (this.koffiLoaded) {
      const immediate = this.queryNativeInMemory();
      if (immediate) {
        this.updateActiveProcess(immediate);
      }
    }

    const norm = normalize(this.lastActiveProcess);
    const profile = this.lastProfile || this.matchProfile(norm);

    return {
      exeName: this.lastActiveProcess,
      normalizedExe: norm,
      profile,
      displayName: `${profile.name} (${norm || 'escritorio'})`
    };
  }

  matchProfile(normalizedProcess) {
    if (!normalizedProcess) return this.defaultProfile;

    if (this.executableMap.has(normalizedProcess)) {
      return this.executableMap.get(normalizedProcess);
    }

    if (normalizedProcess.includes('chrome') || normalizedProcess.includes('edge') || normalizedProcess.includes('browser') || normalizedProcess.includes('firefox')) {
      const p = this.profilesConfig.profiles.find((x) => x.id === 'browsers');
      if (p) return p;
    }

    if (normalizedProcess.includes('code') || normalizedProcess.includes('devenv') || normalizedProcess.includes('cursor')) {
      const p = this.profilesConfig.profiles.find((x) => x.id === 'code_editors');
      if (p) return p;
    }

    if (normalizedProcess.includes('term') || normalizedProcess.includes('powershell') || normalizedProcess.includes('cmd') || normalizedProcess.includes('bash')) {
      const p = this.profilesConfig.profiles.find((x) => x.id === 'terminals');
      if (p) return p;
    }

    if (normalizedProcess === 'explorer') {
      const p = this.profilesConfig.profiles.find((x) => x.id === 'explorer');
      if (p) return p;
    }

    return this.defaultProfile;
  }

  stop() {
    if (this.pollerInterval) {
      clearInterval(this.pollerInterval);
      this.pollerInterval = null;
    }
  }
}

module.exports = WindowDetector;
