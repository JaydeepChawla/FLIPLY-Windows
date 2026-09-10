/**
 * FLIPLY — Windows Real Battery Provider (Electron Main Process)
 * Reads genuine Windows battery status using Windows CIM / WMI.
 * Does NOT generate fake data.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { WindowsBatteryInfo } from './types';

const execAsync = promisify(exec);

let cachedBattery: WindowsBatteryInfo | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 8000; // Cache for 8 seconds to prevent excessive process spawns

export async function getWindowsBatteryInfo(): Promise<WindowsBatteryInfo> {
  const now = Date.now();
  if (cachedBattery && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedBattery;
  }

  // Query macOS status
  if (process.platform === 'darwin') {
    try {
      const { stdout: battOut } = await execAsync('pmset -g batt', { timeout: 3000 });
      const hasBattery =
        battOut.includes('InternalBattery') ||
        battOut.includes("drawing from 'Battery Power'");

      let lowPower = false;
      try {
        const { stdout: pmOut } = await execAsync('pmset -g | grep -i lowpowermode', {
          timeout: 2000,
        });
        lowPower = pmOut.includes('1');
      } catch {
        // ignore
      }

      if (!hasBattery) {
        // Desktop Mac without battery (iMac, Mac mini, Mac Studio, Mac Pro)
        cachedBattery = {
          available: true,
          hasBattery: false,
          platform: 'macos',
          level: null,
          charging: false,
          powerSaving: lowPower,
          powerSavingLabel: 'Low Power Mode',
          status: 'not-charging',
          statusText: 'AC Power',
        };
        lastFetchTime = now;
        return cachedBattery;
      }

      const matchPct = battOut.match(/(\d+)%/);
      const level = matchPct ? parseInt(matchPct[1], 10) : 100;
      const isCharging =
        battOut.toLowerCase().includes('charging') &&
        !battOut.toLowerCase().includes('not charging');

      cachedBattery = {
        available: true,
        hasBattery: true,
        platform: 'macos',
        level,
        charging: isCharging,
        powerSaving: lowPower,
        powerSavingLabel: 'Low Power Mode',
        status: isCharging ? 'charging' : 'not-charging',
        statusText: isCharging ? 'Charging' : 'Not Charging',
      };
      lastFetchTime = now;
      return cachedBattery;
    } catch {
      cachedBattery = {
        available: false,
        hasBattery: false,
        platform: 'macos',
        level: null,
        charging: false,
        powerSaving: false,
      };
      lastFetchTime = now;
      return cachedBattery;
    }
  }

  // Only run Windows commands on win32 platforms
  if (process.platform !== 'win32') {
    return {
      available: false,
      hasBattery: false,
      platform: 'other',
      level: null,
      charging: false,
      status: 'not-charging',
      statusText: 'Not Charging',
    };
  }

  try {
    // Query Windows CIM for Battery information + Windows 10/11 Energy Saver status
    const command =
      'powershell.exe -NoProfile -Command "$batt = Get-CimInstance -ClassName Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1; $hasBatt = ($null -ne $batt); $saver = $false; try { [void][Windows.System.Power.PowerManager, Windows.System.Power, ContentType = WindowsRuntime]; $saver = ([Windows.System.Power.PowerManager]::EnergySaverStatus -eq \'On\'); } catch {} $label = if (-not $hasBatt) { \'Energy Saver\' } else { \'Battery Saver\' }; [PSCustomObject]@{ HasBattery = $hasBatt; EstimatedChargeRemaining = if ($hasBatt) { $batt.EstimatedChargeRemaining } else { $null }; BatteryStatus = if ($hasBatt) { $batt.BatteryStatus } else { $null }; PowerSaving = $saver; PowerSavingLabel = $label; } | ConvertTo-Json -Compress"';
    const { stdout } = await execAsync(command, { timeout: 4000 });

    if (!stdout || stdout.trim() === '') {
      // Desktop PC with no battery
      cachedBattery = {
        available: true,
        hasBattery: false,
        platform: 'windows',
        level: null,
        charging: false,
        powerSaving: false,
        powerSavingLabel: 'Energy Saver',
      };
      lastFetchTime = now;
      return cachedBattery;
    }

    const data = JSON.parse(stdout.trim());
    const batteryObj = Array.isArray(data) ? data[0] : data;

    if (!batteryObj) {
      cachedBattery = {
        available: true,
        hasBattery: false,
        platform: 'windows',
        level: null,
        charging: false,
        powerSaving: false,
        powerSavingLabel: 'Energy Saver',
      };
      lastFetchTime = now;
      return cachedBattery;
    }

    const hasBattery = Boolean(batteryObj.HasBattery);
    const powerSaving = Boolean(batteryObj.PowerSaving);
    const powerSavingLabel = batteryObj.PowerSavingLabel || (hasBattery ? 'Battery Saver' : 'Energy Saver');

    if (!hasBattery) {
      // Desktop PC without battery
      cachedBattery = {
        available: true,
        hasBattery: false,
        platform: 'windows',
        level: null,
        charging: false,
        powerSaving,
        powerSavingLabel,
        status: 'not-charging',
        statusText: 'Desktop AC',
      };
      lastFetchTime = now;
      return cachedBattery;
    }

    const level = Number(batteryObj.EstimatedChargeRemaining);
    const status = Number(batteryObj.BatteryStatus);

    const isCharging = [6, 7, 8, 9].includes(status);
    const clampedLevel = Math.max(0, Math.min(100, level));
    const isFull = status === 3 || clampedLevel >= 100;

    let statusType: 'charging' | 'fully-charged' | 'not-charging' = 'not-charging';
    let statusText = 'Not Charging';

    if (isFull) {
      statusType = 'fully-charged';
      statusText = 'Fully Charged';
    } else if (isCharging) {
      statusType = 'charging';
      statusText = 'Charging';
    }

    cachedBattery = {
      available: true,
      hasBattery: true,
      platform: 'windows',
      level: clampedLevel,
      charging: isCharging,
      powerSaving,
      powerSavingLabel,
      status: statusType,
      statusText,
    };
    lastFetchTime = now;
    return cachedBattery;
  } catch {
    // Fallback: try WMIC if PowerShell is restricted
    try {
      const { stdout } = await execAsync('wmic path Win32_Battery get EstimatedChargeRemaining, BatteryStatus /format:csv', { timeout: 3000 });
      const lines = stdout.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length > 1) {
        const parts = lines[1].split(',');
        if (parts.length >= 3) {
          const status = parseInt(parts[1], 10);
          const level = parseInt(parts[2], 10);
          if (!isNaN(level)) {
            const isCharging = [6, 7, 8, 9].includes(status);
            const clampedLevel = Math.max(0, Math.min(100, level));
            const isFull = status === 3 || clampedLevel >= 100;

            let statusType: 'charging' | 'fully-charged' | 'not-charging' = 'not-charging';
            let statusText = 'Not Charging';

            if (isFull) {
              statusType = 'fully-charged';
              statusText = 'Fully Charged';
            } else if (isCharging) {
              statusType = 'charging';
              statusText = 'Charging';
            }

            cachedBattery = {
              available: true,
              hasBattery: true,
              platform: 'windows',
              level: clampedLevel,
              charging: isCharging,
              status: statusType,
              statusText,
            };
            lastFetchTime = now;
            return cachedBattery;
          }
        }
      }
    } catch {
      // Both queries failed, battery hardware does not exist or access denied
    }

    cachedBattery = {
      available: false,
      hasBattery: false,
      platform: 'windows',
      level: null,
      charging: false,
      status: 'not-charging',
      statusText: 'Not Charging',
    };
    lastFetchTime = now;
    return cachedBattery;
  }
}
