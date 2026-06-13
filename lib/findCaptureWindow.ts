import { Satellite } from '@/data/satellites';

export interface CaptureWindow {
  timestamp: string;
  elevationDeg: number;
  azimuthDeg: number;
  stabilityDuration: number;
  successRate: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function findCaptureWindow(sat: Satellite): CaptureWindow {
  // 1. stabilityDuration = clamp(60 / sat.spinRate, 20, 120) seconds
  //    (faster spin = shorter capture window, slower = longer)
  const stabilityDuration = Math.round(clamp(60 / sat.spinRate, 20, 120));

  // 2. approachAngle (elevation deg) = sat.tumbleAxis[1] * 90  (0-90 range)
  const elevationDeg = Math.abs(sat.tumbleAxis[1]) * 90;

  // 3. azimuthDeg = ((sat.tumbleAxis[0] * 360) + 360) % 360
  const azimuthDeg = ((sat.tumbleAxis[0] * 360) + 360) % 360;

  // 4. successRate = clamp(0.7 + 0.3 * (1 - sat.spinRate / 5), 0.5, 0.99)
  const successRate = clamp(0.7 + 0.3 * (1 - sat.spinRate / 5), 0.5, 0.99);

  // 5. timestamp calculation:
  //   - base = "Tuesday 03:42 UTC"
  //   - minutes to add: sat.perigee % 60 (since perigee represents the base altitude in our data)
  const minutesToAdd = sat.perigee % 60;
  let timestamp = 'Tuesday 03:42 UTC';
  if (minutesToAdd > 0) {
    timestamp = `Tuesday 03:42 + ${minutesToAdd} min UTC`;
  }

  return {
    timestamp,
    elevationDeg,
    azimuthDeg,
    stabilityDuration,
    successRate,
  };
}
