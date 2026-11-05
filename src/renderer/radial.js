/**
 * OrbitMenu - Radial Menu Renderer (Corrección Centrado y Diagnóstico)
 * Centro geométrico en (210, 210), cálculo trigonométrico exacto,
 * guía magnética de precisión y diagnóstico visual del ejecutable en el centro.
 */

// Catálogo de iconos SVG vectoriales inline (24x24)
const ICON_SVG_MAP = {
  'clipboard': '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>',
  'pin': '<line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>',
  'type': '<polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line>',
  'crop': '<path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path>',
  'dropper': '<path d="m14 7 3 3m-9 9 7.5-7.5a2.121 2.121 0 0 0 0-3l-2.5-2.5a2.121 2.121 0 0 0-3 0L2.5 13.5a1.5 1.5 0 0 0 0 2.12l.88.88m0 0L2 22l5.5-1.38m-4.12-4.12 1.38-5.5"></path>',
  'volume-x': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>',
  'volume-1': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>',
  'volume-2': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>',
  'rotate-ccw': '<polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>',
  'plus-circle': '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line>',
  'x-circle': '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
  'search': '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
  'clock': '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
  'maximize': '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>',
  'maximize-2': '<polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line>',
  'folder-plus': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line>',
  'terminal': '<polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>',
  'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>',
  'archive': '<polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line>',
  'info': '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
  'layout': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line>',
  'command': '<path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>',
  'code': '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>',
  'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
  'columns': '<path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"></path>',
  'repeat': '<polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path>',
  'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
  'printer': '<polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect>',
  'zoom-in': '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line>',
  'zoom-out': '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line>',
  'mic-off': '<line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>',
  'headphones': '<path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>',
  'airplay': '<path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"></path><polygon points="12 15 17 21 7 21 12 15"></polygon>',
  'message-circle': '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
  'camera': '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>',
  'layers': '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>',
  'grid': '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
  'share': '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>',
  'trash-2': '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>',
  'plus': '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
  'stop-circle': '<circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect>',
  'play-circle': '<circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon>',
  'skip-forward': '<polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line>',
  'skip-back': '<polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line>',
  'video': '<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>',
  'activity': '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
  'monitor': '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>'
};

class RadialMenuRenderer {
  constructor() {
    this.container = document.getElementById('radial-container');
    this.svg = document.getElementById('radial-svg');
    this.slicesGroup = document.getElementById('slices-group');
    this.iconsGroup = document.getElementById('icons-group');

    this.pointerGuide = document.getElementById('pointer-guide');
    this.pointerLine = document.getElementById('pointer-line');
    this.pointerDot = document.getElementById('pointer-dot');
    this.deadzoneCircle = document.querySelector('.deadzone-circle');
    this.deadzoneRing = document.querySelector('.deadzone-ring');

    this.centerHub = document.getElementById('center-hub');
    this.hubIdleState = document.getElementById('hub-idle-state');
    this.hubActiveState = document.getElementById('hub-active-state');
    this.profileBadge = document.getElementById('profile-badge');
    this.activeAppName = document.getElementById('active-app-name');
    this.actionLabel = document.getElementById('action-label');
    this.actionShortcutPill = document.getElementById('action-shortcut-pill');

    // Centro geométrico exacto de 420x420
    this.cx = 210;
    this.cy = 210;
    this.deadzoneRadius = 30;
    this.outerRadius = 175;

    this.currentProfile = null;
    this.slices = [];
    this.activeSliceIndex = -1;

    this.initEvents();
    this.initIPC();
  }

  initEvents() {
    const triggerEmergency = () => {
      this.handleClose();
      if (window.orbitAPI && window.orbitAPI.cancelEmergency) {
        window.orbitAPI.cancelEmergency();
      }
    };

    if (this.centerHub) {
      this.centerHub.addEventListener('click', triggerEmergency);
    }
    if (this.deadzoneCircle) {
      this.deadzoneCircle.addEventListener('click', triggerEmergency);
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        triggerEmergency();
      }
    });
  }

  initIPC() {
    if (!window.orbitAPI) return;

    window.orbitAPI.onMenuOpen((data) => {
      this.handleOpen(data);
    });

    window.orbitAPI.onMouseMove((data) => {
      this.handleMove(data);
    });

    window.orbitAPI.onMenuClose(() => {
      this.handleClose();
    });
  }

  handleOpen(data) {
    this.currentProfile = data.profile;
    const settings = data.settings || {};
    this.deadzoneRadius = settings.deadzoneRadius || 30;

    const accent = this.currentProfile.color || '#38bdf8';
    document.documentElement.style.setProperty('--accent-color', accent);
    document.documentElement.style.setProperty('--accent-glow', `${accent}55`);

    // Insignia del perfil
    this.profileBadge.textContent = this.currentProfile.badge || this.currentProfile.name;
    this.profileBadge.style.color = accent;
    this.profileBadge.style.borderColor = `${accent}40`;
    this.profileBadge.style.background = `${accent}18`;

    // Diagnóstico visual en el centro: ej "Navegadores (chrome)" o "Código (code)"
    const displayLabel = data.displayName || `${this.currentProfile.name} (${data.activeExe || 'escritorio'})`;
    this.activeAppName.textContent = displayLabel;
    this.activeAppName.title = displayLabel;

    this.setHubState(false);
    this.buildRadialSlices();
    this.updatePointer(0, 0);

    // Animación elástica de apertura en 120ms
    this.container.classList.remove('hidden');
    this.container.classList.add('visible');
  }

  buildRadialSlices() {
    this.slicesGroup.innerHTML = '';
    this.iconsGroup.innerHTML = '';
    this.slices = [];
    this.activeSliceIndex = -1;

    const items = this.currentProfile.items || [];
    const count = items.length;
    if (count === 0) return;

    const sliceAngle = 360 / count;
    const gapDeg = 2.2;

    const rIn = 58;
    const rOut = 168;
    const startAngleOffset = -90 - sliceAngle / 2;

    items.forEach((item, index) => {
      const aStartDeg = startAngleOffset + index * sliceAngle + gapDeg / 2;
      const aEndDeg = startAngleOffset + (index + 1) * sliceAngle - gapDeg / 2;

      const pathData = this.createSectorPath(this.cx, this.cy, rIn, rOut, aStartDeg, aEndDeg);

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', pathData);
      pathEl.setAttribute('class', 'radial-slice');
      pathEl.setAttribute('data-index', index);
      this.slicesGroup.appendChild(pathEl);

      const midAngleDeg = (aStartDeg + aEndDeg) / 2;
      const midAngleRad = (midAngleDeg * Math.PI) / 180;
      const rMid = (rIn + rOut) / 2;

      const iconX = this.cx + rMid * Math.cos(midAngleRad) - 11;
      const iconY = this.cy + rMid * Math.sin(midAngleRad) - 11;

      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('x', iconX);
      iconSvg.setAttribute('y', iconY);
      iconSvg.setAttribute('width', '22');
      iconSvg.setAttribute('height', '22');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('class', 'slice-icon');
      iconSvg.innerHTML = ICON_SVG_MAP[item.icon] || ICON_SVG_MAP['info'];
      this.iconsGroup.appendChild(iconSvg);

      this.slices.push({
        index,
        item,
        pathEl,
        iconEl: iconSvg,
        midAngleDeg
      });
    });
  }

  createSectorPath(cx, cy, rIn, rOut, startDeg, endDeg) {
    const toRad = Math.PI / 180;
    const radStart = startDeg * toRad;
    const radEnd = endDeg * toRad;

    const x1 = cx + rOut * Math.cos(radStart);
    const y1 = cy + rOut * Math.sin(radStart);
    const x2 = cx + rOut * Math.cos(radEnd);
    const y2 = cy + rOut * Math.sin(radEnd);

    const x3 = cx + rIn * Math.cos(radEnd);
    const y3 = cy + rIn * Math.sin(radEnd);
    const x4 = cx + rIn * Math.cos(radStart);
    const y4 = cy + rIn * Math.sin(radStart);

    const largeArc = endDeg - startDeg <= 180 ? 0 : 1;

    return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }

  handleMove(data) {
    const { dx, dy, distance, angleDeg } = data;

    this.updatePointer(dx, dy);

    if (distance < this.deadzoneRadius) {
      if (this.activeSliceIndex !== -1) {
        this.clearActiveSlice();
      }
      this.setHubState(false);
      return;
    }

    const count = this.slices.length;
    if (count === 0) return;

    const sliceAngle = 360 / count;
    const normalized = (angleDeg + 90 + sliceAngle / 2) % 360;
    const targetIndex = Math.floor(normalized / sliceAngle) % count;

    if (targetIndex !== this.activeSliceIndex) {
      this.setActiveSlice(targetIndex);
    }
  }

  setActiveSlice(index) {
    this.clearActiveSlice();
    this.activeSliceIndex = index;

    const slice = this.slices[index];
    if (!slice) return;

    slice.pathEl.classList.add('active');
    slice.iconEl.classList.add('active');

    this.actionLabel.textContent = slice.item.label;
    this.actionShortcutPill.textContent = slice.item.sublabel || 'Acción';
    this.setHubState(true);
  }

  clearActiveSlice() {
    if (this.activeSliceIndex !== -1 && this.slices[this.activeSliceIndex]) {
      this.slices[this.activeSliceIndex].pathEl.classList.remove('active');
      this.slices[this.activeSliceIndex].iconEl.classList.remove('active');
    }
    this.activeSliceIndex = -1;
  }

  setHubState(isActive) {
    if (isActive) {
      this.hubIdleState.classList.remove('active');
      this.hubActiveState.classList.add('active');
      this.centerHub.classList.add('active');
      this.deadzoneRing.classList.add('active-zone');
    } else {
      this.hubActiveState.classList.remove('active');
      this.hubIdleState.classList.add('active');
      this.centerHub.classList.remove('active');
      this.deadzoneRing.classList.remove('active-zone');
    }
  }

  updatePointer(dx, dy) {
    const dist = Math.hypot(dx, dy);
    const maxRadius = this.outerRadius;
    const clampedDist = Math.min(dist, maxRadius);
    const factor = dist > 0 ? clampedDist / dist : 0;

    const targetX = this.cx + dx * factor;
    const targetY = this.cy + dy * factor;

    this.pointerLine.setAttribute('x2', targetX);
    this.pointerLine.setAttribute('y2', targetY);
    this.pointerDot.setAttribute('cx', targetX);
    this.pointerDot.setAttribute('cy', targetY);

    if (dist < 6) {
      this.pointerGuide.style.opacity = '0';
    } else {
      this.pointerGuide.style.opacity = '1';
    }
  }

  handleClose() {
    this.clearActiveSlice();
    this.setHubState(false);
    this.container.classList.remove('visible');
    this.container.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RadialMenuRenderer();
});
