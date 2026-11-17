import React from 'react';
import { AlertTriangle, AlertCircle, Info, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/common/Badge';
import type { AnomalyItem } from '@/api/client';

export interface AlertCardProps {
  alert: AnomalyItem;
  onDismiss?: (id: number) => void;
  className?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onDismiss, className }) => {
  const isHighOrCritical = alert.severity === 'critical' || alert.severity === 'high';

  const severityBadge = () => {
    switch (alert.severity) {
      case 'critical':
      case 'high':
        return (
          <Badge variant="red" size="sm" dot>
            {alert.severity.toUpperCase()}
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="amber" size="sm" dot>
            MEDIUM
          </Badge>
        );
      default:
        return (
          <Badge variant="walnut" size="sm">
            {alert.severity.toUpperCase()}
          </Badge>
        );
    }
  };

  const formattedTime = alert.timestamp 
    ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <div
      className={cn(
        'p-3.5 rounded-lg border transition-all duration-150 bg-[#FFFBF4]',
        isHighOrCritical 
          ? 'border-[#B8372D]/30 hover:border-[#B8372D]/50' 
          : 'border-[#D4920A]/30 hover:border-[#D4920A]/50',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isHighOrCritical ? (
            <AlertCircle className="w-4 h-4 text-[#B8372D] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#D4920A] shrink-0" />
          )}
          <span className="font-semibold text-xs text-[#2C1810]">
            Zone: <span className="capitalize">{alert.zone_id.replace('_', ' ')}</span>
          </span>
        </div>
        {severityBadge()}
      </div>

      <div className="mt-2 text-xs text-[#6B5B4E] leading-relaxed">
        <span className="font-medium text-[#2C1810]">{alert.metric}:</span> observed value{' '}
        <span className="font-mono font-semibold text-[#2C1810]">
          {typeof alert.value === 'number' ? alert.value.toFixed(1) : alert.value}
        </span>{' '}
        exceeds threshold of{' '}
        <span className="font-mono text-[#6B5B4E]">
          {typeof alert.threshold === 'number' ? alert.threshold.toFixed(1) : alert.threshold}
        </span>
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#EDE8DC] flex items-center justify-between text-[11px] text-[#6B5B4E]">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#6B5B4E]" />
          <span className="font-mono">{formattedTime}</span>
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="text-[11px] font-medium text-[#2D6A2E] hover:text-[#1E4D1F] flex items-center gap-1 hover:underline"
          >
            <CheckCircle className="w-3 h-3" />
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
};
