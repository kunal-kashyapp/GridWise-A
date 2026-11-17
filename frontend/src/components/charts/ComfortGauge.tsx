import React from 'react';
import { ShieldCheck, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/common/Badge';

export interface ComfortGaugeProps {
  complianceRate: number; // 0 to 100
  totalZones?: number;
  compliantZones?: number;
  className?: string;
}

export const ComfortGauge: React.FC<ComfortGaugeProps> = ({
  complianceRate,
  totalZones = 4,
  compliantZones = 4,
  className,
}) => {
  const clampedRate = Math.min(100, Math.max(0, complianceRate));
  
  // Circumference for r=38
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedRate / 100) * circumference;

  const isOptimal = clampedRate >= 90;
  const isModerate = clampedRate >= 70 && clampedRate < 90;

  const strokeColor = isOptimal
    ? '#2D6A2E' // Forest green
    : isModerate
    ? '#7A5C2E' // Walnut brown
    : '#D4920A'; // Amber alert

  return (
    <div
      className={cn(
        'bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl p-5 shadow-warm flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F0E6D3] border border-[#7A5C2E]/20 flex items-center justify-center text-[#7A5C2E]">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#2C1810]">Thermal Comfort</h4>
            <p className="text-xs text-[#6B5B4E]">Standard: 20°C - 26°C</p>
          </div>
        </div>
        <Badge
          variant={isOptimal ? 'forest' : isModerate ? 'walnut' : 'amber'}
          size="sm"
          dot
        >
          {isOptimal ? 'Optimal' : isModerate ? 'Acceptable' : 'Attention'}
        </Badge>
      </div>

      <div className="flex items-center justify-around my-2">
        {/* Circular Progress Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="#EDE8DC"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke={strokeColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold font-mono text-[#2C1810]">
              {clampedRate.toFixed(0)}%
            </span>
            <span className="text-[10px] uppercase font-semibold text-[#6B5B4E] tracking-wider">
              Compliance
            </span>
          </div>
        </div>

        {/* Breakdown notes */}
        <div className="text-xs space-y-2">
          <div className="p-2 rounded-lg bg-[#F5F0E6] border border-[#D4C9B5]/50">
            <span className="text-[#6B5B4E] block text-[11px]">Compliant Zones</span>
            <span className="font-mono font-bold text-sm text-[#2C1810]">
              {compliantZones} / {totalZones} Active
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#2D6A2E]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ASHRAE 55 Boundary</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-[#EDE8DC] text-center text-xs text-[#6B5B4E]">
        Thermal satisfaction baseline target: <span className="font-mono font-medium text-[#2C1810]">&gt;85%</span>
      </div>
    </div>
  );
};
