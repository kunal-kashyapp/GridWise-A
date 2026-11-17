import { useQuery } from '@tanstack/react-query';

export interface EnergySummary {
  total_power_kw: number;
  avg_temperature: number;
  baseline_diff_pct: number;
  active_alerts: number;
}

export interface EnergyReading {
  id?: number;
  zone_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  occupancy: number;
  hvac_status: string;
  power_kw: number;
}

export function useEnergySummary(options?: { refetchInterval?: number }) {
  return useQuery<EnergySummary>({
    queryKey: ['energy', 'summary'],
    queryFn: async () => {
      const res = await fetch('/api/energy/summary');
      if (!res.ok) {
        throw new Error(`Failed to fetch energy summary: ${res.statusText}`);
      }
      return res.json();
    },
    refetchInterval: options?.refetchInterval ?? 5000,
    staleTime: 3000,
  });
}

export function useEnergyHistory(zoneId?: string, hours = 4) {
  return useQuery<EnergyReading[]>({
    queryKey: ['energy', 'history', zoneId ?? 'all', hours],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (zoneId) params.append('zone_id', zoneId);
      params.append('hours', hours.toString());

      const res = await fetch(`/api/energy/history?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch energy history: ${res.statusText}`);
      }
      return res.json();
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
