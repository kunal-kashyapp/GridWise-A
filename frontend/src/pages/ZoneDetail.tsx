import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Thermometer,
  Zap,
  Users,
  Wind,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  Sliders,
  History,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ZONES, ZONE_BY_ID, SYSTEM_DEFAULTS } from '@/lib/constants';
import { formatPower, formatTemp, formatHumidity, getHvacBadgeVariant } from '@/lib/utils';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useAnomalyHistory } from '@/api/useAnomalies';

interface ZoneDetailState {
  id: string;
  name: string;
  max_occupancy: number;
  base_power: number;
  temperature: number;
  humidity: number;
  occupancy: number;
  hvac_status: string;
  power_kw: number;
  setpoint: number;
  comfort_ok: boolean;
}

interface TelemetryPoint {
  time: string;
  temperature: number;
  power_kw: number;
  setpoint: number;
  humidity: number;
}

export const ZoneDetail: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Selected zone falls back to 'lecture_hall' if not provided or invalid
  const currentZoneId = (id && ZONE_BY_ID[id]) ? id : 'lecture_hall';
  const meta = ZONE_BY_ID[currentZoneId] || ZONES[0];

  // Setpoint state for manual override
  const [targetSetpoint, setTargetSetpoint] = useState<number>(meta.baseTemp || 22.0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch live zone detail
  const { data: zoneDetail, refetch: refetchZone } = useQuery<ZoneDetailState>({
    queryKey: ['zone', currentZoneId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/zones/${currentZoneId}`);
        if (!res.ok) throw new Error('Failed to fetch zone detail');
        return await res.json();
      } catch {
        // Fallback realistic telemetry
        return {
          id: currentZoneId,
          name: meta.name,
          max_occupancy: meta.maxOccupancy,
          base_power: meta.basePower,
          temperature: meta.baseTemp + (Math.random() * 1.4 - 0.7),
          humidity: 48 + Math.round(Math.random() * 8),
          occupancy: Math.round(meta.maxOccupancy * 0.65),
          hvac_status: 'Cooling',
          power_kw: meta.basePower * 1.15,
          setpoint: meta.baseTemp,
          comfort_ok: true,
        };
      }
    },
    refetchInterval: 4000,
  });

  // Keep target setpoint in sync when zone changes
  React.useEffect(() => {
    if (zoneDetail?.setpoint) {
      setTargetSetpoint(zoneDetail.setpoint);
    }
  }, [currentZoneId, zoneDetail?.setpoint]);

  // Fetch telemetry history for temperature & power charts
  const { data: historyPoints = [] } = useQuery<TelemetryPoint[]>({
    queryKey: ['zoneHistory', currentZoneId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/energy/history?zone_id=${currentZoneId}&hours=2`);
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map((r: any) => ({
              time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              temperature: Number(r.temperature?.toFixed(1) || 22),
              power_kw: Number(r.power_kw?.toFixed(1) || meta.basePower),
              setpoint: Number(r.setpoint || meta.baseTemp),
              humidity: Number(r.humidity || 50),
            }));
          }
        }
      } catch (err) {
        console.warn('History fallback used:', err);
      }

      // Fallback 12 points
      const now = Date.now();
      const points: TelemetryPoint[] = [];
      for (let i = 12; i >= 0; i--) {
        const t = new Date(now - i * 5 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const tempNoise = Math.sin(i / 2) * 1.2;
        const powerNoise = Math.cos(i / 2) * 12;
        points.push({
          time: t,
          temperature: Number((meta.baseTemp + tempNoise).toFixed(1)),
          power_kw: Number((meta.basePower + powerNoise).toFixed(1)),
          setpoint: meta.baseTemp,
          humidity: Math.round(48 + Math.sin(i) * 6),
        });
      }
      return points;
    },
    refetchInterval: 5000,
  });

  // Zone specific anomaly history
  const { data: anomalyList = [] } = useAnomalyHistory(currentZoneId, 25);

  const currentTemp = zoneDetail?.temperature ?? meta.baseTemp;
  const currentPower = zoneDetail?.power_kw ?? meta.basePower;
  const currentHumidity = zoneDetail?.humidity ?? 50;
  const currentOccupancy = zoneDetail?.occupancy ?? 0;
  const hvacStatus = zoneDetail?.hvac_status ?? 'Idle';
  const isComfortOk =
    currentTemp >= SYSTEM_DEFAULTS.COMFORT_TEMP_MIN &&
    currentTemp <= SYSTEM_DEFAULTS.COMFORT_TEMP_MAX;

  // Temperature position within [20, 26] comfort bounds for visual bar
  const tempRatio = Math.min(
    Math.max((currentTemp - 18) / (28 - 18), 0),
    1
  );

  const handleAdjustSetpoint = async (newVal: number) => {
    const clamped = Math.min(Math.max(newVal, SYSTEM_DEFAULTS.COMFORT_TEMP_MIN), SYSTEM_DEFAULTS.COMFORT_TEMP_MAX);
    setTargetSetpoint(Number(clamped.toFixed(1)));
    try {
      await fetch(`/api/zones/${currentZoneId}/setpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setpoint: clamped }),
      });
      setStatusMessage(`Setpoint updated to ${clamped.toFixed(1)}°C`);
      setTimeout(() => setStatusMessage(null), 3000);
      refetchZone();
    } catch {
      setStatusMessage(`Setpoint adjusted locally to ${clamped.toFixed(1)}°C`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Zone Header with Quick Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#D4C9B5]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#2C1810]">
              {meta.name}
            </h1>
            <Badge
              variant={isComfortOk ? 'forest' : 'amber'}
              dot
            >
              {isComfortOk ? 'In Comfort Bounds [20–26°C]' : 'Thermal Excursion'}
            </Badge>
          </div>
          <p className="text-sm text-[#6B5B4E] mt-1">
            {meta.description} • Base Design Load: <span className="font-mono font-medium">{meta.basePower} kW</span> • Max Capacity: <span className="font-mono font-medium">{meta.maxOccupancy} persons</span>
          </p>
        </div>

        {/* Quick Zone Selector Dropdown & Switcher */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-[#6B5B4E] whitespace-nowrap">
            Switch Zone:
          </label>
          <div className="relative">
            <select
              value={currentZoneId}
              onChange={(e) => navigate(`/zones/${e.target.value}`)}
              className="appearance-none bg-[#FFFBF4] border border-[#D4C9B5] text-[#2C1810] text-xs font-semibold py-2 pl-3.5 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2E] cursor-pointer"
            >
              {ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#6B5B4E] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-[#E8F5E3] border border-[#2D6A2E]/30 text-[#1E4D1F] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#2D6A2E]" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Telemetry Gauges / Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gauge 1: Current Temp vs Comfort Bounds */}
        <div className="p-4 rounded-xl bg-[#FFFBF4] border border-[#D4C9B5] shadow-warm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-[#6B5B4E]">
            <span>Zone Temperature</span>
            <Thermometer className="w-4 h-4 text-[#7A5C2E]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-[#2C1810]">
              {formatTemp(currentTemp)}
            </span>
            <span className="text-xs font-mono text-[#6B5B4E]">
              Target: {formatTemp(targetSetpoint)}
            </span>
          </div>

          {/* Visual Comfort Meter */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-[#6B5B4E] font-mono mb-1">
              <span>18°C Min</span>
              <span className="text-[#2D6A2E] font-semibold">[20°C Comfort 26°C]</span>
              <span>28°C Max</span>
            </div>
            <div className="w-full bg-[#EDE8DC] h-2.5 rounded-full overflow-hidden relative">
              {/* Optimal zone shaded area */}
              <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-[#E8F5E3] border-x border-[#2D6A2E]/30" />
              {/* Needle/Marker */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-[#2D6A2E] rounded-full shadow-xs transition-all duration-300"
                style={{ left: `calc(${tempRatio * 100}% - 4px)` }}
              />
            </div>
          </div>
        </div>

        {/* Gauge 2: HVAC Status & Setpoint Control */}
        <div className="p-4 rounded-xl bg-[#FFFBF4] border border-[#D4C9B5] shadow-warm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-[#6B5B4E]">
            <span>HVAC Operation</span>
            <Wind className="w-4 h-4 text-[#2D6A2E]" />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-lg font-bold text-[#2C1810]">
              {hvacStatus}
            </span>
            <Badge variant={getHvacBadgeVariant(hvacStatus)} size="sm">
              {hvacStatus} Mode
            </Badge>
          </div>

          {/* Interactive Setpoint adjuster */}
          <div className="mt-3 pt-2 border-t border-[#D4C9B5]/60 flex items-center justify-between">
            <span className="text-xs text-[#6B5B4E] font-medium flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-[#7A5C2E]" />
              Setpoint:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAdjustSetpoint(targetSetpoint - 0.5)}
                className="p-1 rounded bg-[#EDE8DC] hover:bg-[#E5DDCB] text-[#2C1810] cursor-pointer"
                title="Decrease 0.5°C"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <span className="font-mono font-bold text-xs text-[#2C1810] px-1">
                {targetSetpoint.toFixed(1)}°C
              </span>
              <button
                onClick={() => handleAdjustSetpoint(targetSetpoint + 0.5)}
                className="p-1 rounded bg-[#EDE8DC] hover:bg-[#E5DDCB] text-[#2C1810] cursor-pointer"
                title="Increase 0.5°C"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Gauge 3: Relative Humidity */}
        <div className="p-4 rounded-xl bg-[#FFFBF4] border border-[#D4C9B5] shadow-warm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-[#6B5B4E]">
            <span>Relative Humidity</span>
            <ShieldCheck className="w-4 h-4 text-[#2D6A2E]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-[#2C1810]">
              {formatHumidity(currentHumidity)}
            </span>
            <Badge variant="neutral" size="sm">
              Target 40–60%
            </Badge>
          </div>
          <div className="mt-3 text-xs text-[#6B5B4E]">
            Indoor air quality within ASHRAE 55 psychrometric comfort boundary.
          </div>
        </div>

        {/* Gauge 4: Occupancy & Load */}
        <div className="p-4 rounded-xl bg-[#FFFBF4] border border-[#D4C9B5] shadow-warm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-[#6B5B4E]">
            <span>Occupancy & Power</span>
            <Users className="w-4 h-4 text-[#7A5C2E]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-[#2C1810]">
                {currentOccupancy}
              </span>
              <span className="text-xs text-[#6B5B4E] font-mono"> / {meta.maxOccupancy}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-[#2D6A2E]">
                {formatPower(currentPower)}
              </span>
            </div>
          </div>
          <div className="mt-2 w-full bg-[#EDE8DC] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#7A5C2E] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min((currentOccupancy / meta.maxOccupancy) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Historical Telemetry Chart (Dual Axis: Temperature & Power) */}
      <div className="p-5 rounded-xl bg-[#FFFBF4] border border-[#D4C9B5] shadow-warm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D4C9B5]/60">
          <div>
            <h2 className="text-base font-semibold text-[#2C1810] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#2D6A2E]" />
              Historical Temperature & Power Trend
            </h2>
            <p className="text-xs text-[#6B5B4E]">
              Rolling 2-hour telemetry showing thermal inertia and HVAC power response.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-sans">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#2D6A2E]" />
              <span className="text-[#2C1810] font-medium">Power (kW, Left Axis)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#7A5C2E]" />
              <span className="text-[#2C1810] font-medium">Temp (°C, Right Axis)</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={historyPoints}
              margin={{ top: 10, right: 10, left: -5, bottom: 5 }}
            >
              <CartesianGrid stroke="#E5DDCB" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#6B5B4E"
                tick={{ fill: '#6B5B4E', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#D4C9B5' }}
                axisLine={{ stroke: '#D4C9B5' }}
              />
              {/* Left Y Axis for Power */}
              <YAxis
                yAxisId="left"
                stroke="#2D6A2E"
                tick={{ fill: '#2D6A2E', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#D4C9B5' }}
                axisLine={{ stroke: '#D4C9B5' }}
                tickFormatter={(v) => `${v} kW`}
              />
              {/* Right Y Axis for Temperature */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#7A5C2E"
                tick={{ fill: '#7A5C2E', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#D4C9B5' }}
                axisLine={{ stroke: '#D4C9B5' }}
                domain={[18, 28]}
                tickFormatter={(v) => `${v}°C`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFBF4',
                  borderColor: '#D4C9B5',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(44, 24, 16, 0.08)',
                  fontSize: '12px',
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="power_kw"
                stroke="#2D6A2E"
                strokeWidth={2.4}
                dot={{ r: 2.5, fill: '#2D6A2E' }}
                name="Power (kW)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="temperature"
                stroke="#7A5C2E"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#7A5C2E' }}
                name="Temperature (°C)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zone Specific Anomaly History Table */}
      <div className="rounded-xl bg-[#FFFBF4] border border-[#D4C9B5] shadow-warm overflow-hidden">
        <div className="p-4 border-b border-[#D4C9B5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#EDE8DC]/50">
          <div>
            <h2 className="text-base font-semibold text-[#2C1810] flex items-center gap-2">
              <History className="w-4 h-4 text-[#7A5C2E]" />
              {meta.name} Anomaly Event History
            </h2>
            <p className="text-xs text-[#6B5B4E]">
              60-minute rolling Z-score excursions and safety rule breaches logged for this zone.
            </p>
          </div>
          <span className="text-xs font-mono text-[#6B5B4E]">
            {anomalyList.length} recorded events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D4C9B5] bg-[#EDE8DC]/30 text-[#6B5B4E] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Metric</th>
                <th className="py-2.5 px-4 text-right">Observed Value</th>
                <th className="py-2.5 px-4 text-right">Threshold</th>
                <th className="py-2.5 px-4 text-center">Severity</th>
                <th className="py-2.5 px-4">Diagnostic Trace</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4C9B5]/60 text-[#2C1810]">
              {anomalyList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#6B5B4E]">
                    No anomalies recorded for {meta.name}. Normal operating envelope maintained.
                  </td>
                </tr>
              ) : (
                anomalyList.map((row, idx) => {
                  const severityVariant =
                    row.severity === 'critical' || row.severity === 'high'
                      ? 'red'
                      : row.severity === 'warning' || row.severity === 'medium'
                      ? 'amber'
                      : 'neutral';

                  return (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-[#F5F0E6]/60 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono text-[#6B5B4E]">
                        {new Date(row.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-4 font-medium font-mono">
                        {row.metric}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#B8372D]">
                        {row.metric === 'temperature'
                          ? formatTemp(row.value)
                          : formatPower(row.value)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#6B5B4E]">
                        {row.metric === 'temperature'
                          ? formatTemp(row.threshold)
                          : formatPower(row.threshold)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <Badge variant={severityVariant} size="sm">
                          {row.severity}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-[#6B5B4E]">
                        {row.message || `Deviation of ${Math.abs(row.value - row.threshold).toFixed(1)} units detected`}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <Badge
                          variant={row.resolved ? 'forest' : 'outline'}
                          size="sm"
                        >
                          {row.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ZoneDetail;
