/**
 * OrbitMenu - Mouse Hook (Optimizado para Cero Lag)
 * Escucha global del mouse con uiohook-napi, control estricto de eventos,
 * throttling de mousemove a 60 FPS y cero operaciones bloqueantes en el hilo del sistema.
 */

const EventEmitter = require('events');

const BUTTON_MAPPING = {
  middle: [3],      // Botón central de la rueda
  back: [4],        // XButton1
  forward: [5],     // XButton2
  right_hold: [2],  // Clic derecho
  alt_left: [1]     // Clic izquierdo con Alt
};

class MouseHook extends EventEmitter {
  constructor(options = {}) {
    super();
    this.holdThresholdMs = options.holdThresholdMs || 180;
    this.triggerMouseButton = options.triggerMouseButton || 'middle';
    this.requireAltModifier = options.requireAltModifier || false;

    this.isPressed = false;
    this.isMenuOpen = false;
    this.pressTimer = null;
    this.origin = { x: 0, y: 0 };
    this.currentPos = { x: 0, y: 0 };
    this.isAltPressed = false;

    this.lastMoveTime = 0;
    this.uiohook = null;
    this.isHookRunning = false;
  }

  updateSettings(settings = {}) {
    if (typeof settings.holdThresholdMs === 'number') {
      this.holdThresholdMs = settings.holdThresholdMs;
    }
    if (typeof settings.triggerMouseButton === 'string') {
      this.triggerMouseButton = settings.triggerMouseButton;
    }
    if (typeof settings.requireAltModifier === 'boolean') {
      this.requireAltModifier = settings.requireAltModifier;
    }
  }

  start() {
    try {
      const { uIOhook, UiohookKey } = require('uiohook-napi');
      this.uiohook = uIOhook;

      this.uiohook.on('keydown', (e) => {
        if (e.keycode === UiohookKey.Alt || e.keycode === UiohookKey.AltRight) {
          this.isAltPressed = true;
        }

        if (e.keycode === UiohookKey.Escape && this.isMenuOpen) {
          this.cancelEmergency();
        }
      });

      this.uiohook.on('keyup', (e) => {
        if (e.keycode === UiohookKey.Alt || e.keycode === UiohookKey.AltRight) {
          this.isAltPressed = false;
        }
      });

      this.uiohook.on('mousedown', (e) => {
        this.handleMouseDown(e);
      });

      // Throttling estricto a 60 FPS (cada 16ms) y SOLO si el menú está abierto
      this.uiohook.on('mousemove', (e) => {
        if (!this.isMenuOpen) return;

        const now = Date.now();
        if (now - this.lastMoveTime < 16) return;
        this.lastMoveTime = now;

        this.handleMouseMove(e);
      });

      this.uiohook.on('mouseup', (e) => {
        this.handleMouseUp(e);
      });

      this.uiohook.start();
      this.isHookRunning = true;
      console.log(`[MouseHook] Escucha global iniciada con uiohook-napi (Disparador: ${this.triggerMouseButton}).`);
    } catch (err) {
      console.error('[MouseHook] Error iniciando uiohook-napi:', err.message);
      this.isHookRunning = false;
    }
  }

  stop() {
    this.clearTimer();
    this.isPressed = false;
    this.isMenuOpen = false;

    if (this.uiohook && this.isHookRunning) {
      try {
        this.uiohook.stop();
        this.isHookRunning = false;
        console.log('[MouseHook] Hook global detenido con éxito.');
      } catch (err) {
        console.error('[MouseHook] Error al detener hook:', err);
      }
    }
  }

  isTriggerButton(buttonCode) {
    const validCodes = BUTTON_MAPPING[this.triggerMouseButton] || BUTTON_MAPPING.middle;
    return validCodes.includes(buttonCode);
  }

  handleMouseDown(e) {
    // Si el menú está abierto y hace clic izquierdo en el centro, cancelar por emergencia
    if (this.isMenuOpen && e.button === 1) {
      this.cancelEmergency();
      return;
    }

    if (!this.isTriggerButton(e.button)) return;
    if (this.requireAltModifier && !this.isAltPressed) return;

    this.isPressed = true;
    this.isMenuOpen = false;
    this.origin = { x: e.x, y: e.y };
    this.currentPos = { x: e.x, y: e.y };

    this.clearTimer();

    // Temporizador de 180 ms en RAM
    this.pressTimer = setTimeout(() => {
      if (this.isPressed) {
        this.isMenuOpen = true;
        this.emit('open', {
          origin: { ...this.origin }
        });
      }
    }, this.holdThresholdMs);
  }

  handleMouseMove(e) {
    this.currentPos = { x: e.x, y: e.y };

    const dx = e.x - this.origin.x;
    const dy = e.y - this.origin.y;
    const distance = Math.hypot(dx, dy);
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;

    this.emit('move', {
      dx,
      dy,
      distance,
      angleRad,
      angleDeg
    });
  }

  handleMouseUp(e) {
    if (!this.isTriggerButton(e.button)) return;

    this.isPressed = false;
    this.clearTimer();

    if (this.isMenuOpen) {
      this.isMenuOpen = false;

      const dx = e.x - this.origin.x;
      const dy = e.y - this.origin.y;
      const distance = Math.hypot(dx, dy);
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;

      this.emit('release', {
        dx,
        dy,
        distance,
        angleRad,
        angleDeg
      });
    } else {
      this.emit('cancel');
    }
  }

  cancelEmergency() {
    this.isPressed = false;
    this.isMenuOpen = false;
    this.clearTimer();
    this.emit('cancel', { emergency: true });
  }

  clearTimer() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }
}

module.exports = MouseHook;
