import { useQuery } from '@tanstack/react-query';

export interface ZoneItem {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  occupancy: number;
  hvac_status: string;
  power_kw: number;
  comfort_ok: boolean;
  setpoint: number;
  max_occupancy?: number;
  base_power?: number;
}

export function useZones(options?: { refetchInterval?: number }) {
  return useQuery<ZoneItem[]>({
    queryKey: ['zones', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/zones');
      if (!res.ok) {
        throw new Error(`Failed to fetch zones: ${res.statusText}`);
      }
      return res.json();
    },
    refetchInterval: options?.refetchInterval ?? 5000,
    staleTime: 3000,
  });
}

export function useZone(zoneId: string) {
  return useQuery<ZoneItem>({
    queryKey: ['zones', 'detail', zoneId],
    queryFn: async () => {
      const res = await fetch(`/api/zones/${zoneId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch zone ${zoneId}: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: Boolean(zoneId),
    refetchInterval: 5000,
    staleTime: 3000,
  });
}
