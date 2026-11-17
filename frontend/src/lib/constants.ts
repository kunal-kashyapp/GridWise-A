export interface ZoneMeta {
  id: string;
  name: string;
  basePower: number;
  maxOccupancy: number;
  baseTemp: number;
  description: string;
}

export const ZONES: ZoneMeta[] = [
  {
    id: 'lecture_hall',
    name: 'Lecture Hall',
    basePower: 85,
    maxOccupancy: 120,
    baseTemp: 22.0,
    description: 'Tiered auditorium with high occupancy variability',
  },
  {
    id: 'computer_lab',
    name: 'Computer Lab',
    basePower: 110,
    maxOccupancy: 60,
    baseTemp: 21.5,
    description: 'High-density workstation clusters with elevated thermal load',
  },
  {
    id: 'library',
    name: 'Library',
    basePower: 55,
    maxOccupancy: 80,
    baseTemp: 23.0,
    description: 'Quiet study zones with strict acoustic and comfort requirements',
  },
  {
    id: 'common_area',
    name: 'Common Area',
    basePower: 45,
    maxOccupancy: 40,
    baseTemp: 22.5,
    description: 'Central atrium and circulation hubs with outdoor air transitions',
  },
];

export const ZONE_BY_ID = ZONES.reduce<Record<string, ZoneMeta>>((acc, zone) => {
  acc[zone.id] = zone;
  return acc;
}, {});

export const SYSTEM_DEFAULTS = {
  COMFORT_TEMP_MIN: 20.0,
  COMFORT_TEMP_MAX: 26.0,
  PEAK_DEMAND_THRESHOLD_KW: 500.0,
  SIMULATION_INTERVAL_SEC: 5.0,
  OLLAMA_MODEL: 'llama3',
};

export const COLOR_TOKENS = {
  canvas: '#F5F0E6',
  card: '#FFFBF4',
  cardAlt: '#EDE8DC',
  borderWarm: '#D4C9B5',
  espresso: '#2C1810',
  espressoMuted: '#6B5B4E',
  forest: '#2D6A2E',
  forestLight: '#E8F5E3',
  forestDark: '#1E4D1F',
  walnut: '#7A5C2E',
  walnutLight: '#F0E6D3',
  alertRed: '#B8372D',
  alertAmber: '#D4920A',
};
