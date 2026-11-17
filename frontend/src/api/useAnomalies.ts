import { useQuery } from '@tanstack/react-query';

export interface AnomalyItem {
  id?: number | string;
  zone_id: string;
  timestamp: string;
  metric: string;
  value: number;
  threshold: number;
  z_score?: number;
  severity: 'info' | 'warning' | 'critical' | 'low' | 'medium' | 'high';
  message?: string;
  resolved?: boolean;
}

function generateMockAnomalies(zoneId?: string): AnomalyItem[] {
  const zones = zoneId ? [zoneId] : ['lecture_hall', 'computer_lab', 'library', 'common_area'];
  const now = Date.now();
  const list: AnomalyItem[] = [];

  const candidates: Array<{
    zid: string;
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'critical' | 'info';
    message: string;
    minsAgo: number;
  }> = [
    {
      zid: 'computer_lab',
      metric: 'power_kw',
      value: 138.4,
      threshold: 115.0,
      severity: 'critical',
      message: 'Sudden high power surge +20.3% above 60-min moving average',
      minsAgo: 4,
    },
    {
      zid: 'lecture_hall',
      metric: 'temperature',
      value: 26.8,
      threshold: 26.0,
      severity: 'warning',
      message: 'Zone thermal excursion above upper comfort limit (26.0°C)',
      minsAgo: 16,
    },
    {
      zid: 'common_area',
      metric: 'power_kw',
      value: 62.1,
      threshold: 52.0,
      severity: 'warning',
      message: 'HVAC continuous load spike during low occupancy',
      minsAgo: 35,
    },
    {
      zid: 'library',
      metric: 'humidity',
      value: 68.0,
      threshold: 65.0,
      severity: 'info',
      message: 'Relative humidity drift above optimal reading range',
      minsAgo: 52,
    },
  ];

  candidates
    .filter((c) => !zoneId || c.zid === zoneId)
    .forEach((c, idx) => {
      list.push({
        id: `mock-anomaly-${c.zid}-${idx}`,
        zone_id: c.zid,
        timestamp: new Date(now - c.minsAgo * 60 * 1000).toISOString(),
        metric: c.metric,
        value: c.value,
        threshold: c.threshold,
        z_score: 2.85,
        severity: c.severity,
        message: c.message,
        resolved: c.minsAgo > 30,
      });
    });

  return list;
}

export function useActiveAnomalies() {
  return useQuery<AnomalyItem[]>({
    queryKey: ['anomalies', 'active'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/anomalies/active');
        if (!res.ok) throw new Error('Failed to fetch active anomalies');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Active anomalies fallback used:', err);
      }
      return generateMockAnomalies().filter((a) => !a.resolved);
    },
    refetchInterval: 5000,
  });
}

export function useAnomalyHistory(zoneId?: string, limit = 50) {
  return useQuery<AnomalyItem[]>({
    queryKey: ['anomalies', 'history', zoneId, limit],
    queryFn: async () => {
      try {
        const url = zoneId
          ? `/api/anomalies/history?zone_id=${encodeURIComponent(zoneId)}&limit=${limit}`
          : `/api/anomalies/history?limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch anomaly history');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Anomaly history fallback used:', err);
      }
      return generateMockAnomalies(zoneId);
    },
    refetchInterval: 5000,
  });
}
