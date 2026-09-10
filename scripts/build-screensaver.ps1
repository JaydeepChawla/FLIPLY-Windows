# PowerShell Build Script for FLIPLY.scr
# Runs on Windows or GitHub Actions runner

$ErrorActionPreference = "Stop"

Write-Host "Building FLIPLY Windows Screen Saver (.scr)..." -ForegroundColor Cyan

$sourceCs = Join-Path $PSScriptRoot "..\electron\screensaver\FLIPLY_ScreenSaver.cs"
$outDir = Join-Path $PSScriptRoot "..\dist-screensaver"
$outScr = Join-Path $outDir "FLIPLY.scr"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

# Locate csc.exe in standard .NET framework paths
$cscCandidates = @(
    "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
    "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe",
    "csc.exe"
)

$cscPath = $null
foreach ($cand in $cscCandidates) {
    if (Get-Command $cand -ErrorAction SilentlyContinue) {
        $cscPath = $cand
        break
    } elseif (Test-Path $cand) {
        $cscPath = $cand
        break
    }
}

if ($cscPath) {
    Write-Host "Compiling with C# Compiler ($cscPath)..." -ForegroundColor Green
    & $cscPath /target:winexe /optimize+ /platform:anycpu "/out:$outScr" $sourceCs /reference:System.Windows.Forms.dll,System.Drawing.dll
    
    if (Test-Path $outScr) {
        Write-Host "Success! Created: $outScr" -ForegroundColor Green
        # Copy to electron-builder extraResources folder
        $buildDir = Join-Path $PSScriptRoot "..\build"
        if (-not (Test-Path $buildDir)) { New-Item -ItemType Directory -Path $buildDir -Force | Out-Null }
        Copy-Item -Path $outScr -Destination (Join-Path $buildDir "FLIPLY.scr") -Force
    } else {
        Write-Error "Compilation completed but $outScr was not found."
    }
} else {
    Write-Warning "csc.exe not found. If on Linux/Mac, compilation will be performed in GitHub Actions Windows runner."
}
