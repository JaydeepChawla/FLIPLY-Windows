# FLIPLY Windows Screen Saver (.scr) Architecture

## Overview

In Windows, a screen saver (`.scr`) is a standard Win32 PE executable named with a `.scr` extension located in `%SystemRoot%\System32` or `%SystemRoot%\SysWOW64` or registered in `HKEY_CURRENT_USER\Control Panel\Desktop`.

Windows invokes screen savers with command-line switches:

| Flag | Description | FLIPLY Implementation |
|---|---|---|
| `/s` | **Start**: Run fullscreen screen saver | Launches borderless fullscreen flip clock across all active monitors, hides mouse cursor, monitors mouse delta (>8px) and keypresses to exit |
| `/c` or `/c:<HWND>` | **Configure**: Show settings modal | Launches FLIPLY with `--screensaver-config` displaying the minimalist customization panel |
| `/p <HWND>` | **Preview**: Mini-preview inside Windows dialog | Parses parent `HWND` and renders real-time split-flap clock into the mini preview window using Win32 `SetParent` |

---

## Native Wrapper Components

FLIPLY provides two production wrappers:

1. **`FLIPLY_ScreenSaver.cs` (C# .NET / Roslyn)**:
   - Primary wrapper compiled with `csc.exe` (included in all Windows installations at `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`).
   - Forwards `/s` to `FLIPLY.exe --screensaver`.
   - Embeds Win32 GDI+ canvas into `HWND` for `/p`.
   - Opens settings for `/c`.

2. **`wrapper.cpp` (C++ Win32 API)**:
   - Alternative raw Win32 implementation for zero-dependency builds using MSVC (`cl.exe`) or GCC MinGW (`x86_64-w64-mingw32-g++`).

---

## Compilation Instructions

### Using C# (Built into Windows):
```cmd
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /out:FLIPLY.scr FLIPLY_ScreenSaver.cs
```

### Using C++ (MSVC):
```cmd
cl.exe /O2 /Fe:FLIPLY.scr wrapper.cpp user32.lib gdi32.lib shell32.lib
```

### Using MinGW on Linux / Windows:
```bash
x86_64-w64-mingw32-g++ -O2 -mwindows -o FLIPLY.scr wrapper.cpp -luser32 -lgdi32 -lshell32
```

---

## Manual Testing in Windows

1. **Test Fullscreen Mode**:
   ```cmd
   FLIPLY.scr /s
   ```
   *Move mouse or press any key to exit.*

2. **Test Settings Mode**:
   ```cmd
   FLIPLY.scr /c
   ```

3. **Install as Windows Default Screen Saver**:
   - Right-click `FLIPLY.scr` in Windows Explorer and click **Install**.
   - Or open **Windows Settings** → **Personalization** → **Lock screen** → **Screen saver settings**, choose **FLIPLY**, and adjust the wait time.
