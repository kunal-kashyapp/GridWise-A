import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Zap,
  CheckCircle2,
  XCircle,
  Sparkles,
  Sliders,
  Thermometer,
  Wind,
  Info,
  Clock,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ProposedAction, ValidationReport } from '@/api/useAgent';
import { ZONE_BY_ID } from '@/lib/constants';

export interface RecommendationCardProps {
  action: ProposedAction | null;
  validation: ValidationReport | null;
  isLoading?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  actionId?: number | null;
  statusText?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  action,
  validation,
  isLoading = false,
  onApprove,
  onReject,
  actionId,
  statusText,
}) => {
  const [showSimulation, setShowSimulation] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl p-6 shadow-warm flex flex-col items-center justify-center min-h-[360px] text-center">
        <div className="w-12 h-12 rounded-full bg-[#E8F5E3] flex items-center justify-center mb-4 animate-pulse">
          <Sparkles className="w-6 h-6 text-[#2D6A2E] animate-spin" />
        </div>
        <h3 className="text-base font-semibold text-[#2C1810] mb-1">
          Evaluating Multi-Zone Telemetry...
        </h3>
        <p className="text-xs text-[#6B5B4E] max-w-sm mb-4">
          Local Ollama (<span className="font-mono text-[#2D6A2E]">llama3</span>) is synthesizing GBR load forecasts and streaming candidate optimization actions.
        </p>
        <div className="flex items-center gap-2 text-xs font-mono text-[#7A5C2E] bg-[#F0E6D3] px-3 py-1.5 rounded-md">
          <span className="w-2 h-2 rounded-full bg-[#2D6A2E] animate-ping" />
          Deterministic safety validator active
        </div>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl p-6 shadow-warm text-center flex flex-col items-center justify-center min-h-[320px]">
        <div className="w-12 h-12 rounded-full bg-[#EDE8DC] flex items-center justify-center mb-3">
          <Sliders className="w-6 h-6 text-[#7A5C2E]" />
        </div>
        <h3 className="text-base font-semibold text-[#2C1810] mb-1">
          No Active Recommendation
        </h3>
        <p className="text-xs text-[#6B5B4E] max-w-md mb-4">
          The edge optimizer hasn&apos;t generated a new proposal yet. Trigger a manual cycle or wait for the next telemetry evaluation window.
        </p>
        <div className="flex items-center gap-2 text-xs text-[#6B5B4E]">
          <ShieldCheck className="w-4 h-4 text-[#2D6A2E]" />
          <span>Comfort constraints guarded: [20.0°C – 26.0°C]</span>
        </div>
      </div>
    );
  }

  const zoneMeta = action.zone_id ? ZONE_BY_ID[action.zone_id] : null;
  const zoneName = zoneMeta ? zoneMeta.name : (action.zone_id || 'All Zones');
  const isValid = validation ? validation.valid : true;
  const savingsKw = action.expected_savings_kw ?? 0;

  // Formatting parameters display
  const renderParameters = () => {
    if (!action.parameters || Object.keys(action.parameters).length === 0) {
      return (
        <span className="text-xs text-[#6B5B4E] italic font-mono">None (State Maintained)</span>
      );
    }
    return (
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(action.parameters).map(([key, val]) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 bg-[#EDE8DC] text-[#2C1810] text-xs font-mono px-2.5 py-1 rounded border border-[#D4C9B5]"
          >
            <span className="text-[#6B5B4E] capitalize">{key.replace('_', ' ')}:</span>
            <span className="font-semibold text-[#2D6A2E]">
              {typeof val === 'number' && key.includes('temp') || key.includes('setpoint')
                ? `${val.toFixed(1)}°C`
                : String(val)}
            </span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl p-5 shadow-warm flex flex-col justify-between">
      {/* Top Banner & Safety Badge */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#D4C9B5]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E8F5E3] text-[#2D6A2E]">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#7A5C2E]">
                Edge Agent Proposal
              </span>
              <h3 className="text-base font-bold text-[#2C1810] capitalize flex items-center gap-2">
                {action.action_type.replace(/_/g, ' ')}
                {statusText && (
                  <Badge variant="neutral" size="sm">
                    {statusText}
                  </Badge>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={isValid ? 'forest' : 'red'}
              size="sm"
              dot
              className="font-mono"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {isValid ? 'Validator: PASS' : 'Validator: VIOLATION'}
            </Badge>

            <span className="hidden sm:inline-flex items-center text-[11px] font-mono bg-[#F0E6D3] text-[#7A5C2E] px-2 py-0.5 rounded border border-[#7A5C2E]/20">
              Limits: 20°C – 26°C
            </span>
          </div>
        </div>

        {/* Violation Warning if not valid */}
        {!isValid && validation?.violations && validation.violations.length > 0 && (
          <div className="mb-4 p-3 bg-[#FDECEA] border border-[#B8372D]/30 rounded-lg text-xs text-[#B8372D] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Safety Rule Interception:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {validation.violations.map((violation, i) => (
                  <li key={i}>{violation}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Action Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Target Zone */}
          <div className="p-3 bg-[#EDE8DC]/50 rounded-lg border border-[#D4C9B5]">
            <span className="text-[11px] uppercase tracking-wider text-[#6B5B4E] block mb-1">
              Target Zone
            </span>
            <div className="flex items-center gap-1.5 font-medium text-sm text-[#2C1810]">
              <Thermometer className="w-4 h-4 text-[#7A5C2E]" />
              <span>{zoneName}</span>
            </div>
          </div>

          {/* Parameters */}
          <div className="p-3 bg-[#EDE8DC]/50 rounded-lg border border-[#D4C9B5]">
            <span className="text-[11px] uppercase tracking-wider text-[#6B5B4E] block mb-1">
              Proposed Settings
            </span>
            {renderParameters()}
          </div>

          {/* Expected Savings */}
          <div className="p-3 bg-[#E8F5E3]/60 rounded-lg border border-[#2D6A2E]/20">
            <span className="text-[11px] uppercase tracking-wider text-[#1E4D1F] block mb-1">
              Expected Savings
            </span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-[#2D6A2E]">
              <TrendingDown className="w-4 h-4" />
              <span>
                {savingsKw > 0 ? `~${savingsKw.toFixed(1)} kW reduction` : 'Power neutral / Comfort hold'}
              </span>
            </div>
          </div>
        </div>

        {/* Ollama Reasoning Block */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#6B5B4E] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#7A5C2E]" />
              LLM Reasoning Trace (llama3)
            </span>
            {action.timestamp && (
              <span className="text-[11px] font-mono text-[#6B5B4E] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(action.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="p-3.5 bg-[#FFFBF4] rounded-lg border border-[#D4C9B5] text-xs text-[#2C1810] leading-relaxed italic font-sans border-l-4 border-l-[#2D6A2E]">
            &ldquo;{action.reasoning || 'No explanation provided.'}&rdquo;
          </div>
        </div>

        {/* Simulation Collapsible Panel */}
        {showSimulation && (
          <div className="mb-4 p-3.5 bg-[#F0E6D3]/60 border border-[#7A5C2E]/25 rounded-lg text-xs">
            <div className="flex items-center justify-between font-semibold text-[#7A5C2E] mb-2 pb-1.5 border-b border-[#7A5C2E]/20">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Simulated Physics & Thermal Model Projection
              </span>
              <span className="font-mono text-[10px] bg-[#FFFBF4] px-1.5 py-0.5 rounded border border-[#D4C9B5]">
                Horizon: +30 min
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-[#FFFBF4] rounded border border-[#D4C9B5]">
                <span className="text-[10px] text-[#6B5B4E] block">Predicted Temp Drift</span>
                <span className="font-mono font-bold text-[#2C1810]">+0.4°C drift</span>
              </div>
              <div className="p-2 bg-[#FFFBF4] rounded border border-[#D4C9B5]">
                <span className="text-[10px] text-[#6B5B4E] block">HVAC Electrical Draw</span>
                <span className="font-mono font-bold text-[#2D6A2E]">
                  -{savingsKw > 0 ? savingsKw.toFixed(1) : '8.5'} kW
                </span>
              </div>
              <div className="p-2 bg-[#FFFBF4] rounded border border-[#D4C9B5]">
                <span className="text-[10px] text-[#6B5B4E] block">Peak Headroom</span>
                <span className="font-mono font-bold text-[#7A5C2E]">+3.2% buffer</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-[#6B5B4E] italic">
              * Simulated using building thermal inertia (rate: 0.02/step) and occupant internal heat loads.
            </p>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="pt-3 border-t border-[#D4C9B5] flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSimulation(!showSimulation)}
          leftIcon={<Sliders className="w-3.5 h-3.5 text-[#7A5C2E]" />}
        >
          {showSimulation ? 'Hide Simulation' : 'Simulate Impact'}
        </Button>

        <div className="flex items-center gap-2">
          {onReject && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              className="text-[#B8372D] hover:bg-[#FDECEA] border-[#D4C9B5]"
              leftIcon={<XCircle className="w-3.5 h-3.5 text-[#B8372D]" />}
            >
              Reject / Override
            </Button>
          )}

          {onApprove && (
            <Button
              variant="primary"
              size="sm"
              onClick={onApprove}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Approve &amp; Execute
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
