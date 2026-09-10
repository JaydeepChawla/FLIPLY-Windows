@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo FLIPLY - Windows Screen Saver (.scr) Build Script
echo ===================================================

if not exist "%~dp0..\build" mkdir "%~dp0..\build"
if not exist "%~dp0..\dist-screensaver" mkdir "%~dp0..\dist-screensaver"

set CSC_PATH=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe

if not exist "!CSC_PATH!" (
    set CSC_PATH=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe
)

if not exist "!CSC_PATH!" (
    echo [ERROR] csc.exe not found at standard .NET Framework locations.
    exit /b 1
)

echo Using compiler: !CSC_PATH!
"!CSC_PATH!" /target:winexe /optimize+ /platform:anycpu /out:"%~dp0..\build\FLIPLY.scr" "%~dp0..\electron\screensaver\FLIPLY_ScreenSaver.cs" /reference:System.Windows.Forms.dll,System.Drawing.dll

if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] FLIPLY.scr compiled successfully to build\FLIPLY.scr
    copy /Y "%~dp0..\build\FLIPLY.scr" "%~dp0..\dist-screensaver\FLIPLY.scr"
) else (
    echo [FAILED] Compilation failed with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
