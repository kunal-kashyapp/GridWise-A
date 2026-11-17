import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/common/Badge';

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string | number;
    isPositiveGood?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  iconVariant?: 'forest' | 'walnut' | 'amber';
  sublabel?: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  delta,
  icon,
  iconVariant = 'forest',
  sublabel,
  className,
}) => {
  const iconBg = {
    forest: 'bg-[#E8F5E3] text-[#2D6A2E] border-[#2D6A2E]/20',
    walnut: 'bg-[#F0E6D3] text-[#7A5C2E] border-[#7A5C2E]/25',
    amber: 'bg-[#FEF6E7] text-[#9A6704] border-[#D4920A]/25',
  };

  const getDeltaBadge = () => {
    if (!delta) return null;
    const deltaNum = typeof delta.value === 'number' ? delta.value : parseFloat(delta.value.toString());
    const isNegative = deltaNum < 0;
    const isGood = delta.isPositiveGood ? !isNegative : isNegative;

    const variant = isGood ? 'forest' : 'amber';
    const displayVal = typeof delta.value === 'number' 
      ? `${deltaNum > 0 ? '+' : ''}${deltaNum.toFixed(1)}%` 
      : delta.value;

    return (
      <Badge variant={variant} size="sm" className="font-mono font-medium">
        {displayVal} {delta.label || ''}
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        'bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl p-5 shadow-warm hover:shadow-warm-md transition-shadow duration-200 flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-[#6B5B4E]">
          {title}
        </span>
        {icon && (
          <div
            className={cn(
              'w-9 h-9 rounded-lg border flex items-center justify-center shrink-0',
              iconBg[iconVariant]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-bold font-mono tracking-tight text-[#2C1810]">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-[#6B5B4E]">{unit}</span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-[#EDE8DC] flex items-center justify-between text-xs">
        {delta ? (
          getDeltaBadge()
        ) : (
          <span className="text-[#6B5B4E]">Status</span>
        )}
        {sublabel && (
          <span className="text-[#6B5B4E] font-medium truncate ml-2">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
