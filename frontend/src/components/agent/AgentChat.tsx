import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  RotateCw,
  CheckCircle2,
  Clock,
  Sparkles,
  Server,
  Activity,
  Cpu,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

export interface ReasoningStep {
  step: number;
  title: string;
  detail: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp?: string;
  rawPayload?: Record<string, any> | string;
}

export interface AgentChatProps {
  isTriggering?: boolean;
  onTriggerCycle: () => void;
  latestTrace?: ReasoningStep[];
  modelName?: string;
}

const DEFAULT_STEPS: ReasoningStep[] = [
  {
    step: 1,
    title: 'Ingesting Multi-Zone Telemetry',
    detail: 'Polling real-time temperature, occupancy, humidity, and HVAC states across Lecture Hall, Computer Lab, Library, and Common Area.',
    status: 'completed',
    rawPayload: {
      zones_scanned: 4,
      total_load_kw: 284.6,
      avg_temp_c: 22.8,
      occupancy_total: 148,
    },
  },
  {
    step: 2,
    title: 'Evaluating GBR Short-Term Forecast',
    detail: 'Running scikit-learn GradientBoostingRegressor with hour-of-day, day-of-week, lag_1h, and lag_24h features to predict 30-min horizon.',
    status: 'completed',
    rawPayload: {
      model: 'GradientBoostingRegressor',
      horizon: '30m',
      predicted_peak_kw: 312.4,
      confidence_interval: '[298.1 - 326.8] kW',
    },
  },
  {
    step: 3,
    title: 'Running Anomaly Detection Checks',
    detail: 'Evaluating rolling 60-point Z-score detectors for rapid thermal drift, power spikes, or abnormal occupancy.',
    status: 'completed',
    rawPayload: {
      active_anomalies: 0,
      threshold_sigma: 2.5,
      system_health: 'NORMAL',
    },
  },
  {
    step: 4,
    title: 'Prompting Local Ollama (llama3)',
    detail: 'Synthesizing building context into structured prompt. Generating constrained HVAC setpoint adjustment at edge.',
    status: 'completed',
    rawPayload: {
      endpoint: 'http://localhost:11434/api/chat',
      model: 'llama3',
      temperature_sampling: 0.2,
      latency_ms: 1240,
    },
  },
  {
    step: 5,
    title: 'Passing Proposal Through Deterministic Safety Validator',
    detail: 'Hard rule gate checking comfort limits [20.0°C - 26.0°C], occupied zone shutdowns, and peak threshold bounds (500 kW).',
    status: 'completed',
    rawPayload: {
      validator: 'DeterministicSafetyGate_v1',
      comfort_bounds: '[20.0°C - 26.0°C]',
      result: 'PASS',
      status: 'Ready for Operator Action',
    },
  },
];

export const AgentChat: React.FC<AgentChatProps> = ({
  isTriggering = false,
  onTriggerCycle,
  latestTrace = DEFAULT_STEPS,
  modelName = 'llama3',
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(latestTrace.length);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // Animate steps during trigger
  useEffect(() => {
    if (isTriggering) {
      setActiveStepIndex(1);
      const timer1 = setTimeout(() => setActiveStepIndex(2), 600);
      const timer2 = setTimeout(() => setActiveStepIndex(3), 1200);
      const timer3 = setTimeout(() => setActiveStepIndex(4), 1800);
      const timer4 = setTimeout(() => setActiveStepIndex(5), 2400);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    } else {
      setActiveStepIndex(latestTrace.length);
    }
  }, [isTriggering, latestTrace.length]);

  return (
    <div className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl shadow-warm flex flex-col overflow-hidden">
      {/* Terminal Title Bar */}
      <div className="bg-[#2C1810] text-[#FFFBF4] px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#2C1810]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#E8F5E3]" />
          <span className="font-mono text-xs font-semibold tracking-wide">
            EDGE AGENT REASONING STREAM
          </span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#3D261C] text-[#E8F5E3] border border-[#4D3225]">
            model: {modelName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#D4C9B5]">
            <span className="w-2 h-2 rounded-full bg-[#2D6A2E] animate-pulse" />
            Edge Loop Online
          </span>

          <Button
            variant="primary"
            size="sm"
            onClick={onTriggerCycle}
            disabled={isTriggering}
            isLoading={isTriggering}
            leftIcon={
              isTriggering ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )
            }
            className="h-7 text-xs bg-[#2D6A2E] border-[#2D6A2E] hover:bg-[#245525]"
          >
            Run Edge Cycle
          </Button>
        </div>
      </div>

      {/* Reasoning Steps Feed */}
      <div className="p-4 space-y-3 bg-[#FAF6EE] max-h-[460px] overflow-y-auto">
        {latestTrace.map((item, index) => {
          const stepNum = index + 1;
          const isCurrentRunning = isTriggering && activeStepIndex === stepNum;
          const isPastDone = !isTriggering || activeStepIndex > stepNum;
          const isUpcoming = isTriggering && activeStepIndex < stepNum;
          const isExpanded = expandedStep === item.step;

          return (
            <div
              key={item.step}
              className={`rounded-lg border transition-all ${
                isCurrentRunning
                  ? 'bg-[#FFFBF4] border-[#2D6A2E] shadow-sm'
                  : isPastDone
                  ? 'bg-[#FFFBF4] border-[#D4C9B5]'
                  : 'bg-[#EDE8DC]/50 border-dashed border-[#D4C9B5] opacity-60'
              }`}
            >
              <div
                className="p-3 flex items-start gap-3 cursor-pointer select-none"
                onClick={() => setExpandedStep(isExpanded ? null : item.step)}
              >
                {/* Step Number Circle */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                    isCurrentRunning
                      ? 'bg-[#2D6A2E] text-white animate-pulse'
                      : isPastDone
                      ? 'bg-[#E8F5E3] text-[#1E4D1F] border border-[#2D6A2E]/30'
                      : 'bg-[#EDE8DC] text-[#6B5B4E]'
                  }`}
                >
                  {isPastDone && !isCurrentRunning ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A2E]" />
                  ) : (
                    item.step
                  )}
                </div>

                {/* Step Main Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-0.5">
                    <h4 className="text-xs font-bold text-[#2C1810]">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      {isCurrentRunning && (
                        <span className="text-[10px] font-mono text-[#2D6A2E] animate-pulse font-semibold">
                          PROCESSING...
                        </span>
                      )}
                      {isPastDone && !isCurrentRunning && (
                        <span className="text-[10px] font-mono text-[#2D6A2E] font-medium">
                          OK
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="text-[10px] font-mono text-[#6B5B4E]">
                          WAITING
                        </span>
                      )}
                      <button
                        type="button"
                        className="text-[#7A5C2E] hover:text-[#2C1810]"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#6B5B4E] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>

              {/* Collapsible raw telemetry / step data */}
              {isExpanded && item.rawPayload && (
                <div className="px-3 pb-3 pt-1 border-t border-[#D4C9B5]/60 mt-1">
                  <div className="bg-[#EDE8DC] p-2.5 rounded font-mono text-[11px] text-[#2C1810] overflow-x-auto">
                    {typeof item.rawPayload === 'string'
                      ? item.rawPayload
                      : JSON.stringify(item.rawPayload, null, 2)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal Footer Bar */}
      <div className="bg-[#FFFBF4] px-4 py-2 border-t border-[#D4C9B5] text-[11px] text-[#6B5B4E] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A2E]" />
          Zero-hallucination constraint checker active on all proposals
        </span>
        <span className="font-mono text-[#7A5C2E]">Tick: 5.0s</span>
      </div>
    </div>
  );
};
