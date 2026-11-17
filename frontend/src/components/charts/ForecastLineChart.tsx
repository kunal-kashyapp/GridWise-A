import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatPower } from '@/lib/utils';

export interface ChartDataPoint {
  time: string;
  actual_kw?: number;
  predicted_kw: number;
  confidence_low: number;
  confidence_high: number;
  ci: [number, number]; // Tuple for Recharts Area range
  baseline_kw?: number;
}

export interface ForecastLineChartProps {
  data: ChartDataPoint[];
  height?: number;
  showBaseline?: boolean;
  modelName?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-lg shadow-warm p-3 text-xs font-sans">
      <div className="font-semibold text-[#2C1810] mb-1.5 pb-1 border-b border-[#D4C9B5]/60">
        Time: <span className="font-mono text-[#6B5B4E]">{label}</span>
      </div>
      <div className="space-y-1">
        {payload.map((item, idx) => {
          if (item.dataKey === 'ci') {
            const range = item.value as [number, number];
            if (!range || !Array.isArray(range)) return null;
            return (
              <div key={idx} className="flex items-center justify-between gap-4 text-[#7A5C2E]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#F0E6D3] border border-[#7A5C2E]/40" />
                  95% Confidence Band:
                </span>
                <span className="font-mono font-medium">
                  {formatPower(range[0])} – {formatPower(range[1])}
                </span>
              </div>
            );
          }
          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#6B5B4E]">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </span>
              <span className="font-mono font-semibold text-[#2C1810]">
                {formatPower(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ForecastLineChart: React.FC<ForecastLineChartProps> = ({
  data,
  height = 360,
  showBaseline = true,
  modelName = 'GradientBoostingRegressor / Persistence Baseline',
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl text-espresso-muted text-sm font-sans"
        style={{ height }}
      >
        Waiting for telemetry & forecast samples...
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#2C1810]">Model Pipeline:</span>
          <span className="px-2 py-0.5 rounded-full bg-[#E8F5E3] text-[#1E4D1F] border border-[#2D6A2E]/20 font-mono text-[11px] font-semibold">
            {modelName}
          </span>
        </div>
        <div className="text-[#6B5B4E] hidden sm:block">
          Shaded band indicates 95% confidence interval
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 20, left: -5, bottom: 5 }}
          >
            <CartesianGrid stroke="#E5DDCB" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#6B5B4E"
              tick={{ fill: '#6B5B4E', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#D4C9B5' }}
              axisLine={{ stroke: '#D4C9B5' }}
            />
            <YAxis
              stroke="#6B5B4E"
              tick={{ fill: '#6B5B4E', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#D4C9B5' }}
              axisLine={{ stroke: '#D4C9B5' }}
              tickFormatter={(v) => `${v} kW`}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: 12, fontFamily: 'sans-serif' }}
              formatter={(value) => (
                <span className="text-[#2C1810] font-medium text-xs mr-2">{value}</span>
              )}
            />

            {/* Confidence Interval Band */}
            <Area
              type="monotone"
              dataKey="ci"
              stroke="none"
              fill="#F0E6D3"
              fillOpacity={0.7}
              name="Confidence Interval (95%)"
              isAnimationActive={false}
            />

            {/* Persistence Baseline (if toggled) */}
            {showBaseline && (
              <Line
                type="stepAfter"
                dataKey="baseline_kw"
                stroke="#A68B5B"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                name="Persistence Baseline (kW)"
                isAnimationActive={false}
              />
            )}

            {/* Predicted Power (Walnut dashed line) */}
            <Line
              type="monotone"
              dataKey="predicted_kw"
              stroke="#7A5C2E"
              strokeWidth={2.2}
              strokeDasharray="5 5"
              dot={{ r: 2.5, fill: '#7A5C2E' }}
              activeDot={{ r: 5, fill: '#7A5C2E' }}
              name="Predicted Power (kW)"
            />

            {/* Actual Power (Forest green solid line) */}
            <Line
              type="monotone"
              dataKey="actual_kw"
              stroke="#2D6A2E"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#2D6A2E' }}
              activeDot={{ r: 6, fill: '#2D6A2E' }}
              name="Actual Power (kW)"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ForecastLineChart;
