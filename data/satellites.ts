export interface Satellite {
  id: string;
  name: string;
  designation: string;   // NORAD catalog number
  type: string;
  origin: string;
  owner: string;
  mass: number;          // kg
  inclination: number;   // degrees
  apogee: number;        // km
  perigee: number;       // km
  decayRate: number;     // km/year
  spinRate: number;      // RPM
  status: 'stable' | 'tumbling' | 'decaying' | 'removed';
  color: string;         // hex color for UI dot
  lightCurve: number[];  // 100 data points
  shape: 'Rectangular' | 'Cylindrical' | 'Fragment' | 'Scattered' | 'Box-shaped';
  tumbleAxis: [number, number, number]; // normalised tumble axis vector
  launchYear: number;
  isroContext: string;   // one-line ISRO relevance note
}

// Deterministic seeded PRNG — avoids hydration mismatch from Math.random()
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateLightCurve(
  seed: number,
  base: number,
  amplitude: number,
  noise: number
): number[] {
  const rng = seededRandom(seed);
  const curve: number[] = [];
  for (let i = 0; i < 100; i++) {
    const t = i / 100;
    const value =
      base +
      amplitude * Math.sin(t * Math.PI * 4) +
      (rng() - 0.5) * noise;
    curve.push(Math.round(value * 100) / 100);
  }
  return curve;
}

export const satellites: Satellite[] = [
  {
    id: 'risat-2',
    name: 'RISAT-2',
    designation: '36498',
    type: 'Radar Imaging Satellite',
    origin: 'India',
    owner: 'ISRO',
    mass: 300,
    inclination: 41.2,
    apogee: 556,
    perigee: 540,
    decayRate: 0.12,
    spinRate: 3.20,
    status: 'tumbling',
    color: '#00E5FF',
    lightCurve: generateLightCurve(42, 0.6, 0.3, 0.1),
    shape: 'Rectangular',
    tumbleAxis: [0.6, 0.8, 0.0],
    launchYear: 2009,
    isroContext: 'India\'s first radar imaging satellite, used for defence surveillance. Declared non-operational in 2013. High-priority ISRO debris removal candidate.',
  },
  {
    id: 'megha-tropiques',
    name: 'Megha-Tropiques',
    designation: '37838',
    type: 'Climate Research',
    origin: 'India / France',
    owner: 'ISRO / CNES',
    mass: 1000,
    inclination: 20.0,
    apogee: 867,
    perigee: 850,
    decayRate: 0.05,
    spinRate: 0.80,
    status: 'stable',
    color: '#FF006E',
    lightCurve: generateLightCurve(137, 0.8, 0.15, 0.05),
    shape: 'Cylindrical',
    tumbleAxis: [0.0, 1.0, 0.0],
    launchYear: 2011,
    isroContext: 'Joint ISRO–CNES mission to study tropical atmosphere and water cycle. De-orbited in 2023 via controlled reentry. Model for future responsible disposal.',
  },
  {
    id: 'envisat',
    name: 'Envisat',
    designation: '27386',
    type: 'Environmental Monitoring',
    origin: 'Europe',
    owner: 'ESA',
    mass: 8211,
    inclination: 98.3,
    apogee: 773,
    perigee: 764,
    decayRate: 0.02,
    spinRate: 2.50,
    status: 'tumbling',
    color: '#00FF88',
    lightCurve: generateLightCurve(256, 0.5, 0.4, 0.15),
    shape: 'Rectangular',
    tumbleAxis: [0.45, 0.55, 0.7],
    launchYear: 2002,
    isroContext: 'World\'s largest Earth observation satellite. Lost contact in 2012, now tumbling in sun-synchronous orbit. Poses debris collision risk for Indian remote sensing birds.',
  },
  {
    id: 'noaa-17',
    name: 'NOAA-17',
    designation: '27453',
    type: 'Weather Observation',
    origin: 'United States',
    owner: 'NOAA / NASA',
    mass: 1457,
    inclination: 98.7,
    apogee: 822,
    perigee: 808,
    decayRate: 0.08,
    spinRate: 1.10,
    status: 'decaying',
    color: '#FFB800',
    lightCurve: generateLightCurve(389, 0.7, 0.2, 0.08),
    shape: 'Box-shaped',
    tumbleAxis: [0.3, 0.7, 0.6],
    launchYear: 2002,
    isroContext: 'Retired US weather satellite sharing orbital altitude band with ISRO\'s Oceansat-3. Its slow decay trajectory crosses multiple active Indian satellite orbits.',
  },
  {
    id: 'cosmos-1408',
    name: 'Cosmos 1408',
    designation: '13552',
    type: 'ELINT / Signals Intelligence',
    origin: 'Russia',
    owner: 'MoD Russia',
    mass: 2200,
    inclination: 82.6,
    apogee: 485,
    perigee: 465,
    decayRate: 1.50,
    spinRate: 5.70,
    status: 'tumbling',
    color: '#E040FB',
    lightCurve: generateLightCurve(512, 0.4, 0.5, 0.2),
    shape: 'Scattered',
    tumbleAxis: [0.7, 0.4, 0.58],
    launchYear: 1982,
    isroContext: 'Destroyed by Russian ASAT test in Nov 2021, generating 1,500+ trackable fragments. Debris cloud directly threatened ISS and China\'s Tiangong station. Highest-risk field in LEO.',
  },
];
