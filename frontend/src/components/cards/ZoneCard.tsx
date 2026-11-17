import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Thermometer, Droplets, Users, Zap, ArrowRight, Activity } from 'lucide-react';
import { cn, formatTemp, formatHumidity, formatPower } from '@/lib/utils';
import { Badge } from '@/components/common/Badge';

export interface ZoneCardData {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  occupancy: number;
  hvac_status: string;
  power_kw: number;
  comfort_ok?: boolean;
  setpoint?: number;
  max_occupancy?: number;
}

export interface ZoneCardProps {
  zone: ZoneCardData;
  className?: string;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({ zone, className }) => {
  const navigate = useNavigate();

  const isComfortOk = zone.comfort_ok ?? (zone.temperature >= 20.0 && zone.temperature <= 26.0);

  const getHvacBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'cooling' || s === 'cool') {
      return (
        <Badge variant="forest" size="sm" dot>
          Cooling
        </Badge>
      );
    }
    if (s === 'heating' || s === 'heat') {
      return (
        <Badge variant="amber" size="sm" dot>
          Heating
        </Badge>
      );
    }
    if (s === 'idle' || s === 'fan') {
      return (
        <Badge variant="walnut" size="sm" dot>
          Idle
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="sm">
        {status || 'Off'}
      </Badge>
    );
  };

  return (
    <div
      onClick={() => navigate(`/zones/${zone.id}`)}
      className={cn(
        'group bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl p-5 shadow-warm hover:shadow-warm-md hover:border-[#7A5C2E]/50 transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden',
        className
      )}
    >
      {/* Top row: Name & HVAC badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2D6A2E] group-hover:scale-125 transition-transform" />
            <h3 className="font-semibold text-base text-[#2C1810] group-hover:text-[#2D6A2E] transition-colors">
              {zone.name}
            </h3>
          </div>
          {getHvacBadge(zone.hvac_status)}
        </div>

        {/* Temperature & Comfort Badge */}
        <div className="bg-[#F5F0E6] rounded-lg p-3 border border-[#D4C9B5]/60 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-[#7A5C2E]" />
              <span className="text-2xl font-bold font-mono text-[#2C1810]">
                {formatTemp(zone.temperature)}
              </span>
            </div>
            {isComfortOk ? (
              <Badge variant="forest" size="sm">
                In Comfort [20-26°C]
              </Badge>
            ) : (
              <Badge variant="amber" size="sm">
                Comfort Deviation
              </Badge>
            )}
          </div>
          {zone.setpoint !== undefined && (
            <div className="mt-1 flex items-center justify-between text-xs text-[#6B5B4E]">
              <span>Target Setpoint:</span>
              <span className="font-mono font-medium">{formatTemp(zone.setpoint)}</span>
            </div>
          )}
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Humidity */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#EDE8DC]/50 border border-[#D4C9B5]/40">
            <Droplets className="w-3.5 h-3.5 text-[#2D6A2E]" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-[#6B5B4E] font-medium">Humidity</span>
              <span className="font-mono font-semibold text-[#2C1810]">
                {formatHumidity(zone.humidity)}
              </span>
            </div>
          </div>

          {/* Occupancy */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#EDE8DC]/50 border border-[#D4C9B5]/40">
            <Users className="w-3.5 h-3.5 text-[#7A5C2E]" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-[#6B5B4E] font-medium">Occupancy</span>
              <span className="font-mono font-semibold text-[#2C1810]">
                {zone.occupancy} {zone.max_occupancy ? `/ ${zone.max_occupancy}` : 'people'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Power & Navigation prompt */}
      <div className="mt-4 pt-3 border-t border-[#EDE8DC] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#2D6A2E]" />
          <span className="text-[#6B5B4E]">Load:</span>
          <span className="font-mono font-bold text-[#2C1810]">
            {formatPower(zone.power_kw)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#2D6A2E] font-medium opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
