import React from 'react';
import { Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn, formatPower } from '@/lib/utils';
import { Badge } from '@/components/common/Badge';

export interface PeakDemandBarProps {
  currentPowerKw: number;
  thresholdKw?: number;
  className?: string;
}

export const PeakDemandBar: React.FC<PeakDemandBarProps> = ({
  currentPowerKw,
  thresholdKw = 500,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (currentPowerKw / thresholdKw) * 100));
  const headroomKw = Math.max(0, thresholdKw - currentPowerKw);
  const headroomPct = Math.max(0, 100 - percentage);

  const isWarning = percentage >= 80 && percentage < 90;
  const isCritical = percentage >= 90;

  const barColor = isCritical
    ? 'bg-[#B8372D]'
    : isWarning
    ? 'bg-[#D4920A]'
    : 'bg-[#2D6A2E]';

  return (
    <div
      className={cn(
        'bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl p-5 shadow-warm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E8F5E3] border border-[#2D6A2E]/20 flex items-center justify-center text-[#2D6A2E]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#2C1810]">Peak Demand Limiter</h4>
            <p className="text-xs text-[#6B5B4E]">Threshold: {thresholdKw} kW</p>
          </div>
        </div>

        <div>
          {isCritical ? (
            <Badge variant="red" size="sm" dot>
              CRITICAL NEAR PEAK
            </Badge>
          ) : isWarning ? (
            <Badge variant="amber" size="sm" dot>
              PEAK WARNING (&gt;80%)
            </Badge>
          ) : (
            <Badge variant="forest" size="sm" dot>
              SAFE HEADROOM
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-4 bg-[#EDE8DC] rounded-full overflow-hidden border border-[#D4C9B5]/80 my-3">
        {/* Fill */}
        <div
          className={cn('h-full transition-all duration-500 rounded-full', barColor)}
          style={{ width: `${percentage}%` }}
        />
        {/* 80% Warning Marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#D4920A] opacity-80"
          style={{ left: '80%' }}
          title="80% Warning Threshold"
        />
        {/* 90% Critical Marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#B8372D] opacity-90"
          style={{ left: '90%' }}
          title="90% Critical Threshold"
        />
      </div>

      {/* Metric details */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EDE8DC] text-xs">
        <div>
          <span className="text-[#6B5B4E] block">Current Load</span>
          <span className="font-mono font-bold text-sm text-[#2C1810]">
            {formatPower(currentPowerKw)}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[#6B5B4E] block">Utilization</span>
          <span className="font-mono font-bold text-sm text-[#2C1810]">
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className="text-right">
          <span className="text-[#6B5B4E] block">Headroom</span>
          <span className="font-mono font-bold text-sm text-[#2D6A2E]">
            +{formatPower(headroomKw)} ({headroomPct.toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
};
