# 🌌 OrbitMenu

<p align="center">
  <img src="resources/icon.png" width="96" height="96" alt="OrbitMenu Logo" />
</p>

<p align="center">
  <strong>Menú radial flotante de ultra precisión para Windows con cambio de perfil contextual automático.</strong><br>
  <em>Desarrollado con Electron, Node.js y HTML/CSS/SVG moderno a 60 FPS sin frameworks pesados.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v0.1.0--beta-blue.svg" alt="Versión v0.1.0-beta" />
  <img src="https://img.shields.io/badge/status-active%20development-orange.svg" alt="En desarrollo activo" />
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6.svg" alt="Plataforma Windows" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="Licencia MIT" />
</p>

---

> ⚠️ **Nota de versión:** OrbitMenu se encuentra actualmente en **versión v0.1.0-beta (desarrollo activo)**. Es una primera versión funcional creada para recibir feedback de la comunidad.

---

## ✨ Características Principales

- 🖱️ **Disparador Natural:** Mantén presionado el **clic de la rueda del mouse (Middle Mouse Button)** o el botón lateral durante **180 ms** para desplegar el menú directamente en la posición de tu cursor.
- 🎯 **No-Focus Overlay:** La ventana transparente está configurada con `focusable: false` y nivel `screen-saver`, lo que garantiza que **la aplicación activa nunca pierda el foco** y los atajos simulados se ejecuten con 100% de fiabilidad.
- ⚡ **Rendimiento Cero Lag (0.002 ms en RAM):** Detección de ventana activa mediante Win32 FFI directo en memoria y sondeo asíncrono no bloqueante en segundo plano. Cero llamadas sincrónicas al interactuar con el mouse.
- 🛡️ **Click-Through Total:** Mientras el menú está cerrado, la ventana transparente reenvía todos los eventos de mouse a Windows (`setIgnoreMouseEvents(true, { forward: true })`), asegurando que jamás bloquee clics en la barra de tareas ni en el escritorio.
- 🎨 **Estilo Glassmorphism a 60 FPS:** Animación elástica de apertura en **120 ms**, línea guía magnética con resplandor neón hacia el cursor y renderizado SVG matemático de alta precisión.
- ⚙️ **Ventana de Ajustes Visual (GUI):** Configura el botón del mouse, sliders de sensibilidad y edita los perfiles y atajos sin tocar archivos JSON manualmente.
- 🛑 **Control de Emergencia:** Cancela al instante con la tecla `Escape` o haciendo clic en el círculo central. Salida total de emergencia con **`Ctrl + Shift + Q`**.

---

## 🗂️ Los 10 Perfiles Universales

OrbitMenu detecta automáticamente qué programa tienes en primer plano y adapta sus 6–8 acciones disponibles al instante:

| # | Categoría | Ejecutables Detectados | Acciones Principales |
|---|---|---|---|
| **1** | **Global / Escritorio** | `default` (Escritorio o cualquier app) | Historial de Portapapeles, Fijar Ventana (*Always on Top*), Pegado Limpio sin formato, Recorte de Pantalla (`Win+Shift+S`), Cuentagotas Hex, Silenciar Volumen. |
| **2** | **Navegadores Web** | `chrome`, `msedge`, `firefox`, `brave`, `opera`, `arc` | Restaurar pestaña (`Ctrl+Shift+T`), Nueva pestaña (`Ctrl+T`), Cerrar pestaña (`Ctrl+W`), Buscar en página (`Ctrl+F`), Historial (`Ctrl+H`), Pantalla completa (`F11`). |
| **3** | **Explorador de Archivos** | `explorer`, `totalcmd`, `directoryopus` | Nueva carpeta (`Ctrl+Shift+N`), Abrir Terminal Aquí, Copiar ruta (`Ctrl+Shift+C`), Comprimir en ZIP, Propiedades (`Alt+Enter`), Vista previa (`Alt+P`). |
| **4** | **Editores de Código** | `code`, `devenv`, `cursor`, `idea64`, `pycharm64` | Paleta de comandos (`Ctrl+Shift+P`), Terminal integrada (``Ctrl+` ``), Formatear código (`Shift+Alt+F`), Buscar en archivos (`Ctrl+Shift+F`), Comentar línea (`Ctrl+/`), Dividir editor. |
| **5** | **Ofimática y Documentos**| `winword`, `excel`, `powerpnt`, `notion`, `acrord32` | Pegar sin formato (`Ctrl+Shift+V`), Buscar y reemplazar (`Ctrl+H`), Insertar fecha y hora actual, Exportar/Imprimir (`Ctrl+P`), Zoom +, Zoom -. |
| **6** | **Comunicación y Chat** | `discord`, `zoom`, `ms-teams`, `slack`, `telegram` | Silenciar micrófono (`Ctrl+Shift+M`), Ensordecer audio (`Ctrl+Shift+D`), Compartir pantalla (`Ctrl+Shift+S`), Buscar conversación (`Ctrl+K`), Marcar como leído (`Esc`), Captura. |
| **7** | **Diseño y Multimedia** | `figma`, `photoshop`, `afterfx`, `premiere`, `canva` | Cuentagotas Hex (`I`), Agrupar (`Ctrl+G`), Desagrupar (`Ctrl+Shift+G`), Exportar rápido (`Ctrl+Shift+E`), Zoom 100% (`Ctrl+0`), Deshacer (`Ctrl+Z`). |
| **8** | **Terminales y Consolas** | `windowsterminal`, `powershell`, `cmd`, `mintty`, `bash` | Limpiar consola (`Ctrl+L`), Dividir panel (`Alt+Shift+D`), Nueva pestaña (`Ctrl+Shift+T`), Detener proceso (`Ctrl+C`), Pegar clipboard, Buscar comando (`Ctrl+R`). |
| **9** | **Reproductores de Audio** | `spotify`, `vlc`, `wmplayer`, `foobar2000`, `musicbee` | Play/Pausa (`MediaPlayPause`), Siguiente pista, Pista anterior, Subir volumen, Bajar volumen, Silenciar. |
| **10** | **Gaming y Pantalla Completa** | `steam`, `riotclientservices`, `cs2`, `valorant` | Captura de pantalla (`F12`), Grabar clip (`Win+Alt+G`), Barra Xbox (`Win+G`), Silenciar audio, Siguiente canción, Minimizar al escritorio (`Win+D`). |

---

## 🛠️ Requisitos del Sistema

- **Sistema Operativo:** Windows 10 o Windows 11 (64 bits).
- **Entorno de Ejecución:** Node.js v18.0.0 o superior.

---

## 🚀 Instalación y Uso Rápido

1. **Clonar el repositorio:**
   ```powershell
   git clone https://github.com/xJhony911/OrbitMenu.git
   cd OrbitMenu
   ```

2. **Instalar dependencias:**
   ```powershell
   npm install
   ```
   *(En entornos PowerShell con directivas de scripts restringidas, ejecuta `npm.cmd install`)*.

3. **Iniciar la aplicación:**
   ```powershell
   npm start
   ```

4. **Probar el Menú Radial:**
   - Mantén presionado el **clic de la rueda del ratón** (o pulsa `Alt + Espacio`).
   - Desliza hacia cualquier acción y suelta el botón.
   - En el centro del menú verás en tiempo real el diagnóstico del ejecutable activo, por ejemplo: `Navegadores (chrome)`.

---

## ⌨️ Atajos Útiles

| Atajo | Acción |
|---|---|
| **Clic Rueda Sostenido (>180ms)** | Abrir menú radial centrado en el cursor. |
| **Alt + Espacio** | Atajo de teclado alternativo para abrir el menú (ideal para laptops). |
| **Escape** o **Clic Central** | Cancelar el menú radial sin ejecutar acción. |
| **Ctrl + Shift + Q** | Salida total de emergencia (cierra OrbitMenu y libera todos los hooks). |
| **Ctrl + Alt + O** | Disparador de simulación rápida. |

---

## ⚙️ Configuración y Personalización

Haz clic derecho o doble clic en el icono orbital en el **Área de Notificaciones (System Tray)** junto al reloj de Windows para abrir la ventana de ajustes:
- Modifica el botón disparador (rueda, botón atrás, botón adelante o clic derecho).
- Ajusta el tiempo de pulsación (100–400 ms) y el diámetro de la rueda.
- Activa el inicio automático con Windows.
- Agrega tus propios programas `.exe` o edita los atajos de teclado asignados.

---

## 📦 Compilación para Distribución

Para generar el instalador de Windows (`.exe` con NSIS) y la versión portable:

```powershell
npm run dist
```

Los binarios empaquetados se generarán en la carpeta `dist/`:
- `OrbitMenu Setup 0.1.0.exe` (Instalador NSIS para usuario final).
- `OrbitMenu 0.1.0.exe` (Versión portable).

---

## 🗺️ Hoja de Ruta (Roadmap)

- [ ] Soporte para gestos de trackpad en laptops.
- [ ] Submenús anidados en anillo exterior interactivo para más de 12 acciones por perfil.
- [ ] Temas de color personalizables por el usuario y sincronización con acento de Windows.
- [ ] Exportación e importación de perfiles comunitarios en formato `.orbit`.

---

## 📄 Licencia

Distribuido bajo la Licencia **MIT**. Consulta `LICENSE` para más información. Código abierto y libre para modificar y distribuir.
