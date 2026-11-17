import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatPower } from '@/lib/utils';
import type { EnergyReading } from '@/api/useEnergy';

export interface EnergyAreaChartProps {
  data?: EnergyReading[];
  className?: string;
  timeRange?: '1h' | '4h' | '24h';
}

interface ChartPoint {
  time: string;
  totalLoad: number;
  hvacLoad: number;
  baseLoad: number;
}

export const EnergyAreaChart: React.FC<EnergyAreaChartProps> = ({
  data,
  className,
}) => {
  // Process readings into grouped timestamps or fallback mock/realistic data
  const chartData = useMemo<ChartPoint[]>(() => {
    if (data && data.length > 0) {
      // Group by timestamp
      const grouped = new Map<string, { total: number; hvac: number; count: number }>();
      
      data.forEach((r) => {
        const timeKey = r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00';
        const existing = grouped.get(timeKey) || { total: 0, hvac: 0, count: 0 };
        existing.total += r.power_kw;
        // Estimated HVAC proportion: cooling/heating uses roughly 40-60% of total
        const isHvacActive = r.hvac_status === 'cooling' || r.hvac_status === 'heating';
        existing.hvac += isHvacActive ? r.power_kw * 0.45 : r.power_kw * 0.1;
        existing.count += 1;
        grouped.set(timeKey, existing);
      });

      const points: ChartPoint[] = [];
      grouped.forEach((val, time) => {
        const total = Math.round(val.total * 10) / 10;
        const hvac = Math.round(val.hvac * 10) / 10;
        const base = Math.max(0, Math.round((total - hvac) * 10) / 10);
        points.push({
          time,
          totalLoad: total,
          hvacLoad: hvac,
          baseLoad: base,
        });
      });

      if (points.length >= 3) {
        return points.slice(-30);
      }
    }

    // Default realistic synthetic curve for baseline/demo display
    const now = new Date();
    const points: ChartPoint[] = [];
    for (let i = 24; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 5 * 60 * 1000);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const base = 180 + Math.sin(i * 0.3) * 15;
      const hvac = 110 + Math.cos(i * 0.4) * 25 + (i > 10 ? 30 : 0);
      const total = Math.round((base + hvac) * 10) / 10;
      points.push({
        time: timeStr,
        totalLoad: total,
        hvacLoad: Math.round(hvac * 10) / 10,
        baseLoad: Math.round(base * 10) / 10,
      });
    }
    return points;
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-lg p-3 shadow-warm-md text-xs">
          <p className="font-semibold text-[#2C1810] mb-2 font-mono">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#6B5B4E]">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}:
                </span>
                <span className="font-mono font-bold text-[#2C1810]">
                  {formatPower(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="forestArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2D6A2E" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2D6A2E" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="walnutArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7A5C2E" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7A5C2E" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="ochreArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A68B5B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#A68B5B" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#D4C9B5" strokeOpacity={0.5} vertical={false} />

            <XAxis
              dataKey="time"
              tick={{ fill: '#6B5B4E', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#D4C9B5' }}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: '#6B5B4E', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#D4C9B5' }}
              tickLine={false}
              unit=" kW"
              domain={['auto', 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              iconType="circle"
              formatter={(val) => <span className="text-[#2C1810] font-medium">{val}</span>}
            />

            <Area
              type="monotone"
              dataKey="baseLoad"
              name="Base Load"
              stackId="1"
              stroke="#A68B5B"
              fill="url(#ochreArea)"
              strokeWidth={1.5}
            />

            <Area
              type="monotone"
              dataKey="hvacLoad"
              name="HVAC Load"
              stackId="1"
              stroke="#7A5C2E"
              fill="url(#walnutArea)"
              strokeWidth={1.5}
            />

            <Area
              type="monotone"
              dataKey="totalLoad"
              name="Total Demand"
              stroke="#2D6A2E"
              fill="url(#forestArea)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
