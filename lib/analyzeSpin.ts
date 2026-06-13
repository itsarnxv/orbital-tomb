/**
 * analyzeSpin — deterministic spin analysis from a light curve.
 * No Math.random(). Same input always produces the same output.
 */

export interface SpinAnalysisResult {
  peaks: number[];         // indices of detected peaks
  periodSamples: number;   // average sample spacing between peaks
  periodSeconds: number;   // 1 sample = 1 s for this demo
  frequencyHz: number;     // 1 / periodSeconds
  peakAmplitude: number;   // max − min of the curve
  mean: number;            // average value
  confidence: number;      // 0.70 – 1.00
}

export function analyzeSpin(lightCurve: number[]): SpinAnalysisResult {
  const n = lightCurve.length;

  // 1. Find peaks: value > neighbours AND value > 0.5
  const peaks: number[] = [];
  for (let i = 1; i < n - 1; i++) {
    if (
      lightCurve[i] > lightCurve[i - 1] &&
      lightCurve[i] > lightCurve[i + 1] &&
      lightCurve[i] > 0.5
    ) {
      peaks.push(i);
    }
  }

  // 2. Average spacing between consecutive peaks
  let periodSamples = 0;
  if (peaks.length >= 2) {
    let totalSpacing = 0;
    for (let j = 1; j < peaks.length; j++) {
      totalSpacing += peaks[j] - peaks[j - 1];
    }
    periodSamples = totalSpacing / (peaks.length - 1);
  } else {
    // Fallback: use full length as single period
    periodSamples = n;
  }

  // 3. 1 sample = 1 second
  const periodSeconds = periodSamples * 1.0;
  const frequencyHz = periodSeconds > 0 ? 1 / periodSeconds : 0;

  // 4. Stats
  let maxVal = -Infinity;
  let minVal = Infinity;
  let sum = 0;
  for (const v of lightCurve) {
    if (v > maxVal) maxVal = v;
    if (v < minVal) minVal = v;
    sum += v;
  }
  const peakAmplitude = maxVal - minVal;
  const mean = sum / n;

  // 5. Confidence: higher amplitude relative to mean → higher confidence
  const rawConf = 0.7 + 0.3 * (mean > 0 ? peakAmplitude / mean : 0);
  const confidence = Math.min(1.0, Math.max(0.7, rawConf));

  return {
    peaks,
    periodSamples,
    periodSeconds,
    frequencyHz,
    peakAmplitude,
    mean,
    confidence,
  };
}
