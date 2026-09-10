# FLIPLY — Minimalist Realistic Flip Clock

A minimalist, high-fidelity mechanical split-flap flip clock engineered as a **Web Application**, **Windows Desktop Application (Electron)**, and **Native Windows Screen Saver (`.scr`)**.

![FLIPLY Clock](public/icons/icon-512.png)

---

## Key Highlights

- **Physical Split-Flap Mechanics**: Authentic 3D CSS perspective transforms, upper and lower card flaps, center groove divider, hinge pins, and realistic ambient lighting.
- **Micro-Optimized Animation**: Digits flip **only** when their specific value changes.
- **Genuine Battery Indicator**: Reads real-time hardware battery information (`level`, `charging`) via `navigator.getBattery()` on Web and Windows CIM/WMI IPC on Electron. Never fabricates fake metrics.
- **Windows Screen Saver Integration (`FLIPLY.scr`)**: Supports standard Windows Screen Saver switches (`/s`, `/c`, `/p <HWND>`), multi-monitor display coverage, and mouse activity threshold detection.
- **10 Minimalist Themes**: Pure Dark, Dark, Light, Green, Blue, Red, Orange, Yellow, Purple, Pink, plus custom color overrides.
- **Zero Distractions**: No hero banners, ads, promotional clutter, or social footers. The clock is the product.

---

## Three Operational Modes

### 1. Mode A — Web Application
Runs in any modern web browser. Supports Fullscreen API, Screen Wake Lock API (`navigator.wakeLock`), and Web Battery Status API.

### 2. Mode B — Windows Desktop Application
Runs as a standalone desktop window powered by Electron with context isolation, secure preload IPC, Windows system tray menu, and optional auto-start with Windows.

### 3. Mode C — Windows Screen Saver (`FLIPLY.scr`)
Installs into Windows Screen Saver Settings (`desk.cpl`). Starts borderless fullscreen on user idle, hides the cursor, and exits immediately upon intentional mouse movement (>8px) or keyboard press.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| <kbd>F11</kbd> | Toggle Fullscreen mode |
| <kbd>S</kbd> | Toggle Seconds display (ON / OFF) |
| <kbd>D</kbd> | Toggle Date display (ON / OFF) |
| <kbd>T</kbd> | Cycle through the 10 Themes |
| <kbd>Space</kbd> | Open / Close Settings panel |
| <kbd>Esc</kbd> | Exit Fullscreen or dismiss active modal |

---

## Development Setup

### Prerequisites
- Node.js 18+ (Node.js 20 LTS recommended)
- npm 9+

### Installation
```bash
git clone https://github.com/your-repo/fliply.git
cd fliply
npm install
```

### Running Web Development Server
```bash
npm run dev
```
Serves the web application at `http://localhost:3000`.

### Running Electron Desktop Development
```bash
npm run electron
```

### Running the Test Suite
```bash
npm test
```
Executes automated test assertions for 12H/24H format conversion, midnight/noon edge cases, and battery status formatting.

---

## Building for Windows

The project produces four distinct Windows targets:
1. `FLIPLY.exe` — Standalone unpacked executable.
2. `FLIPLY.scr` — Native Windows Screen Saver executable.
3. `FLIPLY-Setup.exe` — Full NSIS setup installer that registers the screen saver.
4. `FLIPLY-Portable.exe` — Single portable executable.

### 1. Compile the Screen Saver (`FLIPLY.scr`)
Run the compilation script on Windows:
```cmd
npm run screensaver
```
This compiles `electron/screensaver/FLIPLY_ScreenSaver.cs` using Windows built-in C# compiler (`csc.exe`) into `build/FLIPLY.scr`.

### 2. Package Windows Installers
```cmd
npm run dist:win
```
This runs `electron-builder` and generates:
- `dist-electron/FLIPLY-Setup.exe`
- `dist-electron/FLIPLY-Portable.exe`
- `dist-electron/win-unpacked/FLIPLY.exe`
- Bundled `FLIPLY.scr`

---

## Windows Screen Saver (`.scr`) Details

Windows passes command-line arguments when invoking screen savers:

| Argument | Windows Meaning | FLIPLY Action |
|---|---|---|
| `FLIPLY.scr /s` | Start screen saver | Launches fullscreen clock across all displays. |
| `FLIPLY.scr /c` | Configure | Launches FLIPLY settings modal. |
| `FLIPLY.scr /p <HWND>` | Mini-preview | Renders live preview inside the Windows Screen Saver Settings monitor box. |

### Installing the Screen Saver Manually
1. Copy `FLIPLY.scr` to `C:\Windows\System32\` (requires Administrator privileges).
2. Open **Windows Settings** → **Personalization** → **Lock screen** → **Screen saver settings**.
3. Select **FLIPLY** in the drop-down list and configure your desired wait timeout.

Alternatively, right-click `FLIPLY.scr` in Windows Explorer and click **Install**.

---

## Automated GitHub Actions Windows CI

You do not need to compile Windows binaries on a local machine. An automated GitHub Actions workflow (`.github/workflows/windows-build.yml`) runs on `windows-latest`:
1. Compiles the React application.
2. Compiles `FLIPLY_ScreenSaver.cs` into `FLIPLY.scr`.
3. Packages `FLIPLY-Setup.exe` and `FLIPLY-Portable.exe`.
4. Uploads all Windows release artifacts automatically.

---

## Security & Code Signing Note

Windows SmartScreen may display a warning (*"Windows protected your PC"*) for freshly compiled, unsigned binaries. This is standard behavior for open-source executables without an Extended Validation (EV) code signing certificate.

To bypass this warning during testing, click **More info** → **Run anyway**. For enterprise deployment, configure an EV code signing certificate in `electron-builder.yml` (`certificateFile` and `certificatePassword`).

---

## Architecture & File Structure

```
FLIPLY/
├── .github/
│   └── workflows/
│       └── windows-build.yml       # Windows CI automation
├── electron/
│   ├── battery.ts                  # Real Windows battery status via CIM/WMI
│   ├── main.ts                     # Main process with /s, /c, /p CLI parser
│   ├── preload.ts                  # Context isolation bridge
│   ├── startup.ts                  # Windows Registry auto-startup
│   ├── tray.ts                     # Windows System Tray
│   ├── types.ts                    # Electron TypeScript types
│   └── screensaver/
│       ├── FLIPLY_ScreenSaver.cs   # Native C# screen saver wrapper
│       ├── wrapper.cpp             # Alternative native Win32 C++ wrapper
│       ├── installer.nsh           # NSIS registration script
│       └── README.md               # Screen saver reference
├── public/
│   └── icons/
│       ├── icon.svg                # Minimalist vector icon
│       ├── icon-32.png             # System Tray icon
│       ├── icon-512.png            # Window & Taskbar icon
│       └── icon-512.ico            # Windows executable icon
├── scripts/
│   ├── build-screensaver.bat       # CMD screen saver compilation
│   ├── build-screensaver.ps1       # PowerShell compilation
│   ├── generate-png-icons.js       # Pure Node PNG/ICO generator
│   └── test-clock.js               # Clock test suite
├── src/
│   ├── components/
│   │   ├── BatteryIndicator.tsx    # Hardware battery status
│   │   ├── Controls.tsx            # Fullscreen, Theme, Settings buttons
│   │   ├── DateDisplay.tsx         # Date display
│   │   ├── FlipClock.tsx           # Split-flap clock layout
│   │   ├── FlipDigit.tsx           # Mechanical 3D flip card
│   │   ├── SettingsPanel.tsx       # Minimalist settings modal
│   │   └── ThemeSelector.tsx       # Quick theme switcher
│   ├── hooks/
│   │   ├── useBattery.ts           # Hardware battery hook
│   │   ├── useClock.ts             # Precision second-boundary timer
│   │   ├── useMouseActivity.ts     # Idle fade & screensaver exit
│   │   ├── useSettings.ts          # Persistence hook
│   │   └── useWakeLock.ts          # Display wake lock hook
│   ├── styles/
│   │   ├── app.css                 # Layout & screensaver styles
│   │   ├── clock.css               # 3D split-flap physics & keyframes
│   │   ├── settings.css            # Modal & toggle switches
│   │   └── themes.css              # 10 theme color schemes
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── utils/
│   │   └── clockUtils.ts           # Pure formatting and theme definitions
│   ├── App.tsx                     # Main application
│   ├── index.css                   # Tailwind imports
│   └── main.tsx                    # React DOM entry point
├── electron-builder.yml            # Windows packaging configuration
├── index.html                      # Entry HTML with typography
├── metadata.json                   # Application metadata
├── package.json                    # Project configuration & scripts
└── tsconfig.json                   # TypeScript compiler options
```

---

## License

MIT License. Designed with craftsmanship for timekeeping.
