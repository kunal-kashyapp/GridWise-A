import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  History,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { AgentActionItem } from '@/api/useAgent';
import { ZONE_BY_ID, ZONES } from '@/lib/constants';

export interface ActionHistoryProps {
  actions: AgentActionItem[];
  isLoading?: boolean;
  onOverride?: (actionId: number, approved: boolean) => void;
  isOverriding?: boolean;
}

export const ActionHistory: React.FC<ActionHistoryProps> = ({
  actions,
  isLoading = false,
  onOverride,
  isOverriding = false,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      // Filter by zone
      if (selectedZone !== 'all' && action.zone_id !== selectedZone) {
        return false;
      }

      // Filter by status: 'approved', 'rejected', 'flagged' / 'pending'
      if (selectedStatus !== 'all') {
        const outcome = (action.outcome || '').toLowerCase();
        const applied = Boolean(action.applied);

        if (selectedStatus === 'approved') {
          if (outcome !== 'approved' && !applied) return false;
        } else if (selectedStatus === 'rejected') {
          if (outcome !== 'rejected') return false;
        } else if (selectedStatus === 'flagged') {
          // Flagged or invalid
          if (Boolean(action.validated) && outcome !== '') return false;
        }
      }

      return true;
    });
  }, [actions, selectedZone, selectedStatus]);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatParamString = (params: Record<string, any>) => {
    if (!params || Object.keys(params).length === 0) return 'No parameters';
    return Object.entries(params)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  };

  return (
    <div className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-xl shadow-warm flex flex-col h-full">
      {/* Header & Filters */}
      <div className="p-4 border-b border-[#D4C9B5]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#F0E6D3] text-[#7A5C2E]">
              <History className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#2C1810]">
                Autonomous Action Audit Log
              </h3>
              <p className="text-xs text-[#6B5B4E]">
                Chronological record of Ollama proposals, deterministic validations, and operator overrides
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-[#6B5B4E] bg-[#EDE8DC] px-2.5 py-1 rounded border border-[#D4C9B5]">
            Total Logged: <span className="font-semibold text-[#2C1810]">{actions.length}</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-[#6B5B4E]">
            <Filter className="w-3.5 h-3.5 text-[#7A5C2E]" />
            <span className="font-medium">Filter:</span>
          </div>

          {/* Zone Selector */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-md px-2 py-1 text-xs text-[#2C1810] focus:outline-none focus:ring-1 focus:ring-[#2D6A2E] cursor-pointer"
          >
            <option value="all">All Zones ({actions.length})</option>
            {ZONES.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#FFFBF4] border border-[#D4C9B5] rounded-md px-2 py-1 text-xs text-[#2C1810] focus:outline-none focus:ring-1 focus:ring-[#2D6A2E] cursor-pointer"
          >
            <option value="all">All Outcomes</option>
            <option value="approved">Approved &amp; Executed</option>
            <option value="rejected">Rejected / Overridden</option>
            <option value="flagged">Pending / Flagged</option>
          </select>

          {(selectedZone !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSelectedZone('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-[#7A5C2E] hover:underline ml-auto font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Content Table / List */}
      <div className="flex-1 overflow-y-auto max-h-[580px] p-2">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#6B5B4E] flex flex-col items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#2D6A2E] animate-spin mb-2" />
            Loading audit history...
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6B5B4E] flex flex-col items-center justify-center">
            <Sliders className="w-5 h-5 text-[#7A5C2E] mb-2 opacity-50" />
            No actions match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-[#D4C9B5]/60">
            {filteredActions.map((item) => {
              const isExpanded = expandedId === item.id;
              const zoneName = item.zone_id && ZONE_BY_ID[item.zone_id]
                ? ZONE_BY_ID[item.zone_id].name
                : (item.zone_id || 'System-wide');
              const isValidated = Boolean(item.validated);
              const isApproved = (item.outcome || '').toLowerCase() === 'approved' || Boolean(item.applied);
              const isRejected = (item.outcome || '').toLowerCase() === 'rejected';
              const isPending = !isApproved && !isRejected;

              return (
                <div
                  key={item.id}
                  className="p-3 transition-colors hover:bg-[#EDE8DC]/40 rounded-lg my-1"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Indicator & Main Info */}
                    <div
                      className="flex items-start gap-2.5 flex-1 cursor-pointer select-none"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-[#7A5C2E] hover:text-[#2C1810]"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-xs text-[#2C1810]">
                            {zoneName}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EDE8DC] text-[#2C1810] border border-[#D4C9B5]">
                            {item.action_type.replace(/_/g, ' ')}
                          </span>

                          {/* Deterministic Validation Badge */}
                          <Badge
                            variant={isValidated ? 'forest' : 'red'}
                            size="sm"
                            dot
                            className="text-[10px] py-0"
                          >
                            {isValidated ? 'Passed Rules' : 'Rule Violation'}
                          </Badge>

                          {/* Outcome Status Pill */}
                          {isApproved && (
                            <Badge variant="forest" size="sm" className="text-[10px] py-0">
                              <CheckCircle2 className="w-3 h-3 mr-0.5 inline" />
                              Approved
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge variant="red" size="sm" className="text-[10px] py-0">
                              <XCircle className="w-3 h-3 mr-0.5 inline" />
                              Overridden / Rejected
                            </Badge>
                          )}
                          {isPending && (
                            <Badge variant="walnut" size="sm" className="text-[10px] py-0">
                              <Clock className="w-3 h-3 mr-0.5 inline" />
                              Pending Review
                            </Badge>
                          )}
                        </div>

                        {/* Brief summary line */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B5B4E]">
                          <span className="font-mono text-[11px] text-[#7A5C2E]">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                          <span className="font-mono text-[11px] truncate max-w-xs sm:max-w-md">
                            Params: {formatParamString(item.parameters)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Override Controls */}
                    {onOverride && (
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <Button
                          variant={isApproved ? 'secondary' : 'outline'}
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          disabled={isOverriding || isApproved}
                          onClick={() => onOverride(item.id, true)}
                          title="Approve and execute recommendation"
                        >
                          <Check className="w-3 h-3 mr-1 text-[#2D6A2E]" />
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-[#B8372D] hover:bg-[#FDECEA]"
                          disabled={isOverriding || isRejected}
                          onClick={() => onOverride(item.id, false)}
                          title="Override or reject recommendation"
                        >
                          <X className="w-3 h-3 mr-1 text-[#B8372D]" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#D4C9B5]/70 pl-7 text-xs">
                      {/* LLM Reasoning */}
                      <div className="mb-2.5">
                        <span className="font-semibold text-[#2C1810] block mb-1">
                          Synthesized Reasoning (Ollama):
                        </span>
                        <p className="p-2.5 bg-[#FFFBF4] rounded border border-[#D4C9B5] text-[#2C1810] italic leading-relaxed">
                          &ldquo;{item.reasoning || 'No explanation recorded.'}&rdquo;
                        </p>
                      </div>

                      {/* Raw Parameters breakdown */}
                      <div className="p-2.5 bg-[#EDE8DC] rounded border border-[#D4C9B5] flex flex-wrap items-center gap-4 text-[11px] font-mono">
                        <div>
                          <span className="text-[#6B5B4E]">Action ID:</span>{' '}
                          <span className="font-bold text-[#2C1810]">#{item.id}</span>
                        </div>
                        <div>
                          <span className="text-[#6B5B4E]">Exact Timestamp:</span>{' '}
                          <span className="text-[#2C1810]">{item.timestamp}</span>
                        </div>
                        <div>
                          <span className="text-[#6B5B4E]">Safety Guard:</span>{' '}
                          <span className={isValidated ? 'text-[#2D6A2E] font-bold' : 'text-[#B8372D] font-bold'}>
                            {isValidated ? 'Passed all bounds [20-26°C]' : 'Safety bounds violation'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6B5B4E]">Parameters:</span>{' '}
                          <span className="text-[#2C1810]">{JSON.stringify(item.parameters)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
