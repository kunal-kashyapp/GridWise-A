import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ProposedAction {
  action_type: 'adjust_setpoint' | 'set_hvac_mode' | 'no_action' | string;
  zone_id: string | null;
  parameters: Record<string, any>;
  reasoning: string;
  expected_savings_kw?: number;
  timestamp?: string;
}

export interface ValidationReport {
  valid: boolean;
  reason?: string;
  violations?: string[];
}

export interface RecommendationResponse {
  action: ProposedAction;
  validation: ValidationReport;
}

export interface AgentActionItem {
  id: number;
  timestamp: string;
  zone_id: string | null;
  action_type: string;
  parameters: Record<string, any>;
  reasoning: string;
  validated: boolean | number;
  applied: boolean | number;
  outcome?: string;
}

export interface OverrideParams {
  actionId: number;
  approved: boolean;
}

/**
 * Normalizes raw action row from DB, parsing parameters if stored as JSON string.
 */
function normalizeActionItem(raw: any): AgentActionItem {
  let params: Record<string, any> = {};
  if (typeof raw.parameters === 'string') {
    try {
      params = JSON.parse(raw.parameters);
    } catch {
      params = {};
    }
  } else if (raw.parameters && typeof raw.parameters === 'object') {
    params = raw.parameters;
  }

  return {
    id: raw.id,
    timestamp: raw.timestamp,
    zone_id: raw.zone_id ?? null,
    action_type: raw.action_type || 'no_action',
    parameters: params,
    reasoning: raw.reasoning || '',
    validated: Boolean(raw.validated),
    applied: Boolean(raw.applied),
    outcome: raw.outcome || '',
  };
}

/**
 * Fetch list of recent agent actions from the database.
 */
export function useAgentActions(limit: number = 50) {
  return useQuery<AgentActionItem[]>({
    queryKey: ['agent', 'actions', limit],
    queryFn: async () => {
      const res = await fetch(`/api/agent/actions?limit=${limit}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch agent actions: ${res.statusText}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map(normalizeActionItem);
    },
    refetchInterval: 5000,
  });
}

/**
 * Request a fresh AI recommendation via local Ollama llama3.
 */
export function useRequestRecommendation() {
  const queryClient = useQueryClient();

  return useMutation<RecommendationResponse, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/agent/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText);
        throw new Error(`Recommendation failed [${res.status}]: ${errorText}`);
      }
      return (await res.json()) as RecommendationResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'actions'] });
    },
  });
}

/**
 * Override or approve an agent recommendation.
 */
export function useOverrideAction() {
  const queryClient = useQueryClient();

  return useMutation<{ status: string; applied: boolean }, Error, OverrideParams>({
    mutationFn: async ({ actionId, approved }) => {
      const url = `/api/agent/override?action_id=${encodeURIComponent(actionId)}&approved=${encodeURIComponent(approved)}`;
      const res = await fetch(url, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText);
        throw new Error(`Override failed [${res.status}]: ${errorText}`);
      }
      return (await res.json()) as { status: string; applied: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'actions'] });
    },
  });
}
