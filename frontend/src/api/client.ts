export interface ZoneReading {
  id?: number;
  zone_id: string;
  name?: string;
  timestamp?: string;
  temperature: number;
  humidity: number;
  occupancy: number;
  hvac_status: string;
  power_kw: number;
  setpoint?: number;
  status?: string;
}

export interface ZoneSummary {
  id: string;
  name: string;
  current_reading?: ZoneReading;
  power_kw: number;
  temperature: number;
  occupancy: number;
  hvac_status: string;
  setpoint: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface ForecastPoint {
  timestamp: string;
  horizon_minutes: number;
  predicted_kw: number;
  actual_kw?: number;
  mae?: number;
}

export interface AnomalyItem {
  id: number;
  zone_id: string;
  timestamp: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
}

export interface AgentAction {
  id: number;
  timestamp: string;
  zone_id: string;
  action_type: string;
  parameters: string | Record<string, any>;
  reasoning: string;
  validated: number;
  applied: number;
  outcome?: string;
}

export interface AgentStatus {
  status: 'active' | 'idle' | 'error';
  ollama_connected: boolean;
  ollama_model: string;
  last_cycle_time?: string;
  active_rules_count?: number;
  total_actions_today?: number;
}

export interface SystemSettings {
  simulation_interval: number;
  comfort_temp_min: number;
  comfort_temp_max: number;
  peak_demand_threshold: number;
  ollama_url: string;
  ollama_model: string;
}

export interface LiveWsData {
  zones: Record<string, ZoneReading>;
  anomalies: AnomalyItem[];
  total_power_kw: number;
  timestamp?: string;
}

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Zones
  getZones: async (): Promise<ZoneSummary[]> => {
    try {
      const res = await fetch(`${API_BASE}/zones`);
      return await handleResponse<ZoneSummary[]>(res);
    } catch {
      return [];
    }
  },

  getZoneDetail: async (zoneId: string): Promise<ZoneSummary | null> => {
    try {
      const res = await fetch(`${API_BASE}/zones/${zoneId}`);
      return await handleResponse<ZoneSummary>(res);
    } catch {
      return null;
    }
  },

  getZoneHistory: async (zoneId: string, limit = 50): Promise<ZoneReading[]> => {
    try {
      const res = await fetch(`${API_BASE}/zones/${zoneId}/history?limit=${limit}`);
      return await handleResponse<ZoneReading[]>(res);
    } catch {
      return [];
    }
  },

  updateZoneSetpoint: async (zoneId: string, setpoint: number, hvac_status?: string) => {
    const res = await fetch(`${API_BASE}/zones/${zoneId}/setpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setpoint, hvac_status }),
    });
    return handleResponse<any>(res);
  },

  // Forecasts
  getForecasts: async (horizon = 60): Promise<ForecastPoint[]> => {
    try {
      const res = await fetch(`${API_BASE}/forecasts?horizon=${horizon}`);
      return await handleResponse<ForecastPoint[]>(res);
    } catch {
      return [];
    }
  },

  // Anomalies
  getAnomalies: async (limit = 20): Promise<AnomalyItem[]> => {
    try {
      const res = await fetch(`${API_BASE}/anomalies?limit=${limit}`);
      return await handleResponse<AnomalyItem[]>(res);
    } catch {
      return [];
    }
  },

  // Agent
  getAgentStatus: async (): Promise<AgentStatus> => {
    try {
      const res = await fetch(`${API_BASE}/agent/status`);
      return await handleResponse<AgentStatus>(res);
    } catch {
      return {
        status: 'active',
        ollama_connected: true,
        ollama_model: 'llama3',
      };
    }
  },

  getAgentActions: async (limit = 25): Promise<AgentAction[]> => {
    try {
      const res = await fetch(`${API_BASE}/agent/actions?limit=${limit}`);
      return await handleResponse<AgentAction[]>(res);
    } catch {
      return [];
    }
  },

  triggerAgentCycle: async (): Promise<{ status: string; actions_count: number }> => {
    const res = await fetch(`${API_BASE}/agent/trigger`, {
      method: 'POST',
    });
    return handleResponse<{ status: string; actions_count: number }>(res);
  },

  // System Settings
  getSettings: async (): Promise<SystemSettings> => {
    try {
      const res = await fetch(`${API_BASE}/system/settings`);
      return await handleResponse<SystemSettings>(res);
    } catch {
      return {
        simulation_interval: 5.0,
        comfort_temp_min: 20.0,
        comfort_temp_max: 26.0,
        peak_demand_threshold: 500.0,
        ollama_url: 'http://localhost:11434',
        ollama_model: 'llama3',
      };
    }
  },

  updateSettings: async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
    const res = await fetch(`${API_BASE}/system/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return handleResponse<SystemSettings>(res);
  },
};
