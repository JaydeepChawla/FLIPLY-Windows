; ============================================================
; FLIPLY — Custom NSIS Script for electron-builder
; Installs FLIPLY.exe, FLIPLY.scr, and Registers Screen Saver
; ============================================================

!macro customInstall
  DetailPrint "Installing FLIPLY Windows Screen Saver..."

  ; Copy FLIPLY.scr to application directory
  IfFileExists "$INSTDIR\resources\FLIPLY.scr" 0 +3
    CopyFiles /SILENT "$INSTDIR\resources\FLIPLY.scr" "$INSTDIR\FLIPLY.scr"
    Goto copyToSystem

  ; Also check build directory root
  IfFileExists "$INSTDIR\FLIPLY.scr" copyToSystem 0
    DetailPrint "FLIPLY.scr ready in application directory."

copyToSystem:
  ; If user has write access to Windows System32, install FLIPLY.scr directly there
  ; so it immediately appears in the Windows Screen Saver drop-down list
  ClearErrors
  CopyFiles /SILENT "$INSTDIR\FLIPLY.scr" "$WINDIR\System32\FLIPLY.scr"
  IfErrors 0 +2
    DetailPrint "Note: Running as standard user. Screen saver installed to application directory."

  ; Register Screen Saver file association so right-clicking FLIPLY.scr offers Install / Test / Configure
  WriteRegStr HKCR "scrfile\shell\config\command" "" '"$INSTDIR\FLIPLY.exe" --screensaver-config'
  WriteRegStr HKCR "scrfile\shell\install\command" "" 'rundll32.exe desk.cpl,InstallScreenSaver %l'
  WriteRegStr HKCR "scrfile\shell\open\command" "" '"$INSTDIR\FLIPLY.exe" --screensaver'

  ; Optionally set FLIPLY as the active screen saver in Current User profile
  WriteRegStr HKCU "Control Panel\Desktop" "SCRNSAVE.EXE" "$INSTDIR\FLIPLY.scr"
  WriteRegStr HKCU "Control Panel\Desktop" "ScreenSaverIsSecure" "0"

  DetailPrint "FLIPLY Screen Saver successfully registered."
!macroend

!macro customUnInstall
  DetailPrint "Uninstalling FLIPLY Windows Screen Saver..."

  ; Remove system copy if exists
  Delete "$WINDIR\System32\FLIPLY.scr"

  ; Clean up Screen Saver registry entry if it pointed to FLIPLY
  ReadRegStr $0 HKCU "Control Panel\Desktop" "SCRNSAVE.EXE"
  StrCmp $0 "$INSTDIR\FLIPLY.scr" 0 +2
    DeleteRegValue HKCU "Control Panel\Desktop" "SCRNSAVE.EXE"

  DetailPrint "FLIPLY Screen Saver removed."
!macroend
