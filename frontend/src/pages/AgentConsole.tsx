import React, { useState, useMemo } from 'react';
import {
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  Sparkles,
  Server,
  Layers,
  History,
  TrendingDown,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RecommendationCard } from '@/components/agent/RecommendationCard';
import { ActionHistory } from '@/components/agent/ActionHistory';
import { AgentChat, ReasoningStep } from '@/components/agent/AgentChat';
import {
  useAgentActions,
  useRequestRecommendation,
  useOverrideAction,
  ProposedAction,
  ValidationReport,
} from '@/api/useAgent';

export const AgentConsole: React.FC = () => {
  // Query actions from SQLite via backend
  const {
    data: actions = [],
    isLoading: isActionsLoading,
    refetch: refetchActions,
  } = useAgentActions(50);

  // Mutations
  const recommendMutation = useRequestRecommendation();
  const overrideMutation = useOverrideAction();

  // Local state for the latest live recommendation generated in session
  const [liveRecommendation, setLiveRecommendation] = useState<{
    action: ProposedAction;
    validation: ValidationReport;
    actionId?: number | null;
    statusText?: string;
  } | null>(null);

  // Fallback: If no live recommendation generated this session, pick the most recent action from DB
  const activeAction: ProposedAction | null = useMemo(() => {
    if (liveRecommendation) return liveRecommendation.action;
    if (actions.length > 0) {
      const latest = actions[0];
      return {
        action_type: latest.action_type,
        zone_id: latest.zone_id,
        parameters: latest.parameters,
        reasoning: latest.reasoning,
        expected_savings_kw: (latest.parameters as any)?.expected_savings_kw ?? 12.5,
        timestamp: latest.timestamp,
      };
    }
    return null;
  }, [liveRecommendation, actions]);

  const activeValidation: ValidationReport | null = useMemo(() => {
    if (liveRecommendation) return liveRecommendation.validation;
    if (actions.length > 0) {
      const latest = actions[0];
      return {
        valid: Boolean(latest.validated),
        reason: latest.validated ? 'Deterministic rules passed' : 'Safety constraint flagged',
        violations: latest.validated ? [] : ['Comfort safety bound verification required'],
      };
    }
    return null;
  }, [liveRecommendation, actions]);

  const activeActionId: number | null = useMemo(() => {
    if (liveRecommendation?.actionId != null) return liveRecommendation.actionId;
    if (actions.length > 0) return actions[0].id;
    return null;
  }, [liveRecommendation, actions]);

  // Handle manual trigger
  const handleTriggerCycle = async () => {
    try {
      const result = await recommendMutation.mutateAsync();
      setLiveRecommendation({
        action: result.action,
        validation: result.validation,
        actionId: null,
        statusText: 'Fresh Inference',
      });
      refetchActions();
    } catch (err) {
      console.error('Failed to trigger recommendation:', err);
    }
  };

  // Handle approval
  const handleApprove = async () => {
    if (activeActionId != null) {
      await overrideMutation.mutateAsync({
        actionId: activeActionId,
        approved: true,
      });
      if (liveRecommendation) {
        setLiveRecommendation((prev) => (prev ? { ...prev, statusText: 'Approved' } : null));
      }
    }
  };

  // Handle rejection
  const handleReject = async () => {
    if (activeActionId != null) {
      await overrideMutation.mutateAsync({
        actionId: activeActionId,
        approved: false,
      });
      if (liveRecommendation) {
        setLiveRecommendation((prev) => (prev ? { ...prev, statusText: 'Overridden' } : null));
      }
    }
  };

  // Handle audit log quick action
  const handleAuditOverride = async (actionId: number, approved: boolean) => {
    await overrideMutation.mutateAsync({ actionId, approved });
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = actions.length;
    const approvedCount = actions.filter(
      (a) => (a.outcome || '').toLowerCase() === 'approved' || Boolean(a.applied)
    ).length;
    const validatedCount = actions.filter((a) => Boolean(a.validated)).length;
    const complianceRate = total > 0 ? ((validatedCount / total) * 100).toFixed(0) : '100';

    return {
      total,
      approvedCount,
      complianceRate,
    };
  }, [actions]);

  return (
    <div className="space-y-6">
      {/* Page Title & System Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D4C9B5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[#2C1810] tracking-tight">
              AI Agent Console
            </h1>
            <Badge variant="forest" size="md" dot>
              Connected / Ready
            </Badge>
          </div>
          <p className="text-sm text-[#6B5B4E]">
            Edge-autonomous HVAC optimization engine backed by local Ollama LLM and deterministic comfort guards.
          </p>
        </div>

        {/* Model info badge & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FFFBF4] px-3 py-2 rounded-lg border border-[#D4C9B5] shadow-sm">
            <Cpu className="w-4 h-4 text-[#2D6A2E]" />
            <div className="text-xs">
              <span className="text-[#6B5B4E] block">Model Provider</span>
              <span className="font-mono font-bold text-[#2C1810]">
                Ollama llama3 (Local Edge)
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchActions()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#7A5C2E]" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl p-4 shadow-warm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B5B4E] block mb-1">
              Safety Compliance Rate
            </span>
            <div className="text-2xl font-bold text-[#2D6A2E] font-mono">
              {stats.complianceRate}%
            </div>
            <span className="text-[11px] text-[#6B5B4E] block mt-0.5">
              Strict [20°C - 26°C] bounds
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#E8F5E3] flex items-center justify-center text-[#2D6A2E]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl p-4 shadow-warm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B5B4E] block mb-1">
              Executed Actions
            </span>
            <div className="text-2xl font-bold text-[#2C1810] font-mono">
              {stats.approvedCount}
            </div>
            <span className="text-[11px] text-[#6B5B4E] block mt-0.5">
              Operator authorized
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#F0E6D3] flex items-center justify-center text-[#7A5C2E]">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl p-4 shadow-warm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B5B4E] block mb-1">
              Total Decisions Audited
            </span>
            <div className="text-2xl font-bold text-[#2C1810] font-mono">
              {stats.total}
            </div>
            <span className="text-[11px] text-[#6B5B4E] block mt-0.5">
              Logged in SQLite DB
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#EDE8DC] flex items-center justify-center text-[#2C1810]">
            <History className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl p-4 shadow-warm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B5B4E] block mb-1">
              Edge Inference Mode
            </span>
            <div className="text-sm font-bold text-[#2D6A2E] font-mono mt-1">
              Zero Cloud Egress
            </div>
            <span className="text-[11px] text-[#6B5B4E] block mt-0.5">
              100% on-premises privacy
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#E8F5E3] flex items-center justify-center text-[#2D6A2E]">
            <Server className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Recommendation + Reasoning Trace */}
        <div className="lg:col-span-6 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#2C1810] flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-[#2D6A2E]" />
                Current Recommendation Candidate
              </h2>
            </div>
            <RecommendationCard
              action={activeAction}
              validation={activeValidation}
              isLoading={recommendMutation.isPending}
              onApprove={handleApprove}
              onReject={handleReject}
              actionId={activeActionId}
              statusText={liveRecommendation?.statusText}
            />
          </section>

          <section>
            <AgentChat
              isTriggering={recommendMutation.isPending}
              onTriggerCycle={handleTriggerCycle}
              modelName="llama3"
            />
          </section>
        </div>

        {/* Right Column: Full Action History & Audit Log */}
        <div className="lg:col-span-6">
          <ActionHistory
            actions={actions}
            isLoading={isActionsLoading}
            onOverride={handleAuditOverride}
            isOverriding={overrideMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentConsole;
