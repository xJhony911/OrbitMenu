/**
 * OrbitMenu - Settings Controller (settings.js)
 * Controlador de la interfaz gráfica de configuración visual en modo oscuro.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elementos de Navegación
  const navTrigger = document.getElementById('nav-btn-trigger');
  const navProfiles = document.getElementById('nav-btn-profiles');
  const tabTrigger = document.getElementById('tab-trigger');
  const tabProfiles = document.getElementById('tab-profiles');

  // Elementos de la Pestaña Disparador
  const radioButtons = document.querySelectorAll('input[name="triggerButton"]');
  const chkRequireAlt = document.getElementById('chk-require-alt');
  const rangeThreshold = document.getElementById('range-threshold');
  const labelThreshold = document.getElementById('label-threshold');
  const rangeSize = document.getElementById('range-size');
  const labelSize = document.getElementById('label-size');
  const txtKeyCombo = document.getElementById('txt-key-combo');
  const chkAutostart = document.getElementById('chk-autostart');
  const btnSaveTrigger = document.getElementById('btn-save-trigger');
  const saveStatus = document.getElementById('save-status');
  const btnQuickTest = document.getElementById('btn-quick-test');

  // Elementos del Editor de Perfiles
  const profileTabsContainer = document.getElementById('profile-tabs-container');
  const profileNameInput = document.getElementById('profile-name-input');
  const profileBadgeInput = document.getElementById('profile-badge-input');
  const profileColorInput = document.getElementById('profile-color-input');
  const profileColorCode = document.getElementById('profile-color-code');
  const executablesTags = document.getElementById('executables-tags');
  const newExeInput = document.getElementById('new-exe-input');
  const btnAddExe = document.getElementById('btn-add-exe');
  const slicesListContainer = document.getElementById('slices-list-container');
  const btnSaveProfiles = document.getElementById('btn-save-profiles');
  const btnOpenJson = document.getElementById('btn-open-json');

  let currentSettings = {};
  let profilesList = [];
  let selectedProfileIndex = 0;

  // 1. Cambio de Pestañas
  navTrigger.addEventListener('click', () => {
    navTrigger.classList.add('active');
    navProfiles.classList.remove('active');
    tabTrigger.classList.add('active');
    tabProfiles.classList.remove('active');
  });

  navProfiles.addEventListener('click', () => {
    navProfiles.classList.add('active');
    navTrigger.classList.remove('active');
    tabProfiles.classList.add('active');
    tabTrigger.classList.remove('active');
  });

  // 2. Sliders en Tiempo Real
  rangeThreshold.addEventListener('input', (e) => {
    labelThreshold.textContent = `${e.target.value} ms`;
  });

  rangeSize.addEventListener('input', (e) => {
    labelSize.textContent = `${e.target.value} px`;
  });

  profileColorInput.addEventListener('input', (e) => {
    profileColorCode.textContent = e.target.value;
  });

  // 3. Cargar Datos del Proceso Principal
  if (window.orbitAPI && window.orbitAPI.getSettingsData) {
    try {
      const data = await window.orbitAPI.getSettingsData();
      currentSettings = data.settings || {};
      profilesList = (data.profiles && data.profiles.profiles) ? data.profiles.profiles : [];

      populateTriggerTab(currentSettings, data.autoStart);
      renderProfileTabs();
      renderActiveProfile();
    } catch (err) {
      console.error('[Settings] Error cargando datos:', err);
    }
  }

  function populateTriggerTab(s, isAutostart) {
    // Botón del mouse
    const btnVal = s.triggerMouseButton || 'middle';
    const radio = document.querySelector(`input[name="triggerButton"][value="${btnVal}"]`);
    if (radio) radio.checked = true;

    // Alt Requerido
    chkRequireAlt.checked = !!s.requireAltModifier;

    // Umbral de tiempo
    const threshold = s.holdThresholdMs || 180;
    rangeThreshold.value = threshold;
    labelThreshold.textContent = `${threshold} ms`;

    // Diámetro
    const size = s.radialSize || 560;
    rangeSize.value = size;
    labelSize.textContent = `${size} px`;

    // Atajo
    txtKeyCombo.value = s.triggerKeyCombo || 'Alt+Space';

    // Iniciar con Windows
    chkAutostart.checked = !!isAutostart;
  }

  // 4. Guardar Ajustes del Disparador
  btnSaveTrigger.addEventListener('click', async () => {
    const selectedRadio = document.querySelector('input[name="triggerButton"]:checked');
    const updatedSettings = {
      ...currentSettings,
      triggerMouseButton: selectedRadio ? selectedRadio.value : 'middle',
      requireAltModifier: chkRequireAlt.checked,
      holdThresholdMs: parseInt(rangeThreshold.value, 10),
      radialSize: parseInt(rangeSize.value, 10),
      triggerKeyCombo: txtKeyCombo.value.trim() || 'Alt+Space',
      autoStartWithWindows: chkAutostart.checked
    };

    saveStatus.textContent = 'Guardando...';
    if (window.orbitAPI && window.orbitAPI.saveSettings) {
      const res = await window.orbitAPI.saveSettings(updatedSettings);
      if (res && res.success) {
        saveStatus.textContent = '✓ Ajustes guardados correctamente';
        setTimeout(() => { saveStatus.textContent = ''; }, 3000);
      } else {
        saveStatus.textContent = 'Error al guardar';
      }
    }
  });

  // Probar Menú Radial
  btnQuickTest.addEventListener('click', () => {
    if (window.orbitAPI && window.orbitAPI.simulateTestMenu) {
      window.orbitAPI.simulateTestMenu();
    }
  });

  // Abrir profiles.json directamente
  btnOpenJson.addEventListener('click', () => {
    if (window.orbitAPI && window.orbitAPI.openProfilesJson) {
      window.orbitAPI.openProfilesJson();
    }
  });

  // ==========================================================================
  // Editor de Perfiles
  // ==========================================================================
  function renderProfileTabs() {
    profileTabsContainer.innerHTML = '';
    profilesList.forEach((profile, idx) => {
      const pill = document.createElement('button');
      pill.className = `profile-tab-pill ${idx === selectedProfileIndex ? 'active' : ''}`;
      pill.textContent = profile.name;
      pill.addEventListener('click', () => {
        saveProfileInMemory();
        selectedProfileIndex = idx;
        renderProfileTabs();
        renderActiveProfile();
      });
      profileTabsContainer.appendChild(pill);
    });
  }

  function renderActiveProfile() {
    const profile = profilesList[selectedProfileIndex];
    if (!profile) return;

    profileNameInput.value = profile.name || '';
    profileBadgeInput.value = profile.badge || profile.name || '';
    profileColorInput.value = profile.color || '#38bdf8';
    profileColorCode.textContent = profile.color || '#38bdf8';

    // Renderizar tags de ejecutables
    renderExeTags(profile.executables || []);

    // Renderizar segmentos de acciones
    renderSlices(profile.items || []);
  }

  function renderExeTags(exes) {
    executablesTags.innerHTML = '';
    if (exes.length === 0) {
      executablesTags.innerHTML = '<span class="card-sub">Sin ejecutables asignados (perfil por defecto global).</span>';
      return;
    }

    exes.forEach((exe, i) => {
      const tag = document.createElement('div');
      tag.className = 'exe-tag';
      tag.innerHTML = `<span>${exe}</span><span class="tag-remove" data-index="${i}">×</span>`;
      tag.querySelector('.tag-remove').addEventListener('click', () => {
        exes.splice(i, 1);
        renderExeTags(exes);
      });
      executablesTags.appendChild(tag);
    });
  }

  // Agregar nuevo .exe
  btnAddExe.addEventListener('click', () => {
    const val = newExeInput.value.trim().toLowerCase();
    if (!val) return;
    const profile = profilesList[selectedProfileIndex];
    if (!profile.executables) profile.executables = [];
    const formatted = val.endsWith('.exe') ? val : `${val}.exe`;
    if (!profile.executables.includes(formatted)) {
      profile.executables.push(formatted);
      renderExeTags(profile.executables);
      newExeInput.value = '';
    }
  });

  newExeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnAddExe.click();
  });

  function renderSlices(items) {
    slicesListContainer.innerHTML = '';
    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'slice-row';
      row.innerHTML = `
        <span class="slice-number">#${idx + 1}</span>
        <input type="text" class="input-field slice-label" value="${item.label || ''}" placeholder="Nombre Acción">
        <input type="text" class="input-field slice-sublabel" value="${item.sublabel || ''}" placeholder="Atajo / Sublabel">
        <select class="input-field slice-icon">
          <option value="clipboard" ${item.icon === 'clipboard' ? 'selected' : ''}>📋 Clipboard</option>
          <option value="pin" ${item.icon === 'pin' ? 'selected' : ''}>📌 Pin / Fijar</option>
          <option value="type" ${item.icon === 'type' ? 'selected' : ''}>✍️ Pegar Limpio</option>
          <option value="crop" ${item.icon === 'crop' ? 'selected' : ''}>✂️ Recorte</option>
          <option value="dropper" ${item.icon === 'dropper' ? 'selected' : ''}>💧 Cuentagotas</option>
          <option value="volume-x" ${item.icon === 'volume-x' ? 'selected' : ''}>🔇 Silenciar</option>
          <option value="volume-2" ${item.icon === 'volume-2' ? 'selected' : ''}>🔊 Subir Vol</option>
          <option value="rotate-ccw" ${item.icon === 'rotate-ccw' ? 'selected' : ''}>🔄 Restaurar/Deshacer</option>
          <option value="plus-circle" ${item.icon === 'plus-circle' ? 'selected' : ''}>➕ Nueva Pestaña</option>
          <option value="x-circle" ${item.icon === 'x-circle' ? 'selected' : ''}>❌ Cerrar Pestaña</option>
          <option value="search" ${item.icon === 'search' ? 'selected' : ''}>🔍 Buscar</option>
          <option value="clock" ${item.icon === 'clock' ? 'selected' : ''}>🕒 Historial</option>
          <option value="maximize" ${item.icon === 'maximize' ? 'selected' : ''}>⛶ Pantalla Completa</option>
          <option value="folder-plus" ${item.icon === 'folder-plus' ? 'selected' : ''}>📁 Nueva Carpeta</option>
          <option value="terminal" ${item.icon === 'terminal' ? 'selected' : ''}>💻 Terminal</option>
          <option value="link" ${item.icon === 'link' ? 'selected' : ''}>🔗 Copiar Ruta</option>
          <option value="archive" ${item.icon === 'archive' ? 'selected' : ''}>📦 Comprimir ZIP</option>
          <option value="command" ${item.icon === 'command' ? 'selected' : ''}>⌘ Paleta Comandos</option>
          <option value="code" ${item.icon === 'code' ? 'selected' : ''}>⌨️ Formato Código</option>
          <option value="camera" ${item.icon === 'camera' ? 'selected' : ''}>📷 Captura Juego</option>
          <option value="play-circle" ${item.icon === 'play-circle' ? 'selected' : ''}>▶️ Play / Pausa</option>
          <option value="skip-forward" ${item.icon === 'skip-forward' ? 'selected' : ''}>⏭️ Siguiente</option>
        </select>
      `;

      row.querySelector('.slice-label').addEventListener('input', (e) => {
        item.label = e.target.value;
      });
      row.querySelector('.slice-sublabel').addEventListener('input', (e) => {
        item.sublabel = e.target.value;
      });
      row.querySelector('.slice-icon').addEventListener('change', (e) => {
        item.icon = e.target.value;
      });

      slicesListContainer.appendChild(row);
    });
  }

  function saveProfileInMemory() {
    const profile = profilesList[selectedProfileIndex];
    if (!profile) return;
    profile.name = profileNameInput.value.trim();
    profile.badge = profileBadgeInput.value.trim();
    profile.color = profileColorInput.value;
  }

  // Guardar Cambios en profiles.json
  btnSaveProfiles.addEventListener('click', async () => {
    saveProfileInMemory();
    if (window.orbitAPI && window.orbitAPI.saveProfiles) {
      const res = await window.orbitAPI.saveProfiles({ profiles: profilesList });
      if (res && res.success) {
        alert('¡Perfiles guardados y actualizados en tiempo real!');
        renderProfileTabs();
      } else {
        alert('Error al guardar perfiles.');
      }
    }
  });
});
