import httpx
import json
from datetime import datetime
from typing import Optional

SYSTEM_PROMPT = """You are GridWise, an AI energy management agent for a university building.
You analyze zone data and recommend HVAC actions to optimize energy while maintaining comfort.

Available actions (respond in JSON):
1. {"action_type": "adjust_setpoint", "zone_id": "<id>", "parameters": {"setpoint": <float 20-26>}, "reasoning": "<why>", "expected_savings_kw": <float>}
2. {"action_type": "set_hvac_mode", "zone_id": "<id>", "parameters": {"mode": "<cooling|heating|idle|off>"}, "reasoning": "<why>", "expected_savings_kw": <float>}
3. {"action_type": "no_action", "zone_id": null, "parameters": {}, "reasoning": "<why>", "expected_savings_kw": 0}

Rules:
- Never set temperature outside 20-26°C
- Never turn HVAC off in occupied zones
- Prioritize comfort, then energy savings
- Always explain your reasoning clearly
- Respond ONLY with valid JSON, no markdown"""


class AgentOrchestrator:
    def __init__(
        self,
        ollama_url: str = "http://localhost:11434",
        model: str = "llama3",
    ):
        self.ollama_url = ollama_url
        self.model = model
        self.conversation_history: list[dict] = []

    def _build_context(
        self,
        zone_states: dict,
        forecasts: list[dict],
        anomalies: list[dict],
    ) -> str:
        lines = [
            "CURRENT BUILDING STATE:",
            f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "",
        ]
        for zid, state in zone_states.items():
            lines.append(f"Zone: {state.get('name', zid)}")
            lines.append(
                f"  Temperature: {state.get('temperature', 'N/A')}°C "
                f"(setpoint: {state.get('setpoint', 'N/A')}°C)"
            )
            lines.append(f"  Humidity: {state.get('humidity', 'N/A')}%")
            lines.append(f"  Occupancy: {state.get('occupancy', 0)} people")
            lines.append(f"  HVAC: {state.get('hvac_status', 'unknown')}")
            lines.append(f"  Power: {state.get('power_kw', 0):.1f} kW")
            lines.append("")

        if forecasts:
            lines.append("FORECASTS:")
            for f in forecasts:
                lines.append(
                    f"  {f.get('zone_id', '?')}: predicted {f.get('predicted_kw', '?')} kW "
                    f"(confidence: {f.get('confidence_low', '?')}-{f.get('confidence_high', '?')} kW)"
                )
            lines.append("")

        if anomalies:
            lines.append("ACTIVE ANOMALIES:")
            for a in anomalies:
                lines.append(
                    f"  ⚠ {a.get('zone_id', '?')}: {a.get('message', 'unknown anomaly')} "
                    f"[{a.get('severity', '?')}]"
                )

        return "\n".join(lines)

    async def get_recommendation(
        self,
        zone_states: dict,
        forecasts: list[dict],
        anomalies: list[dict],
    ) -> dict:
        context = self._build_context(zone_states, forecasts, anomalies)
        user_msg = (
            f"{context}\n\nBased on this data, what action do you recommend? "
            "Respond with a single JSON object."
        )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_msg},
                        ],
                        "stream": False,
                        "format": "json",
                    },
                )
                response.raise_for_status()
                result = response.json()
                content = result.get("message", {}).get("content", "{}")
                try:
                    action = json.loads(content)
                except json.JSONDecodeError:
                    action = {
                        "action_type": "no_action",
                        "zone_id": None,
                        "parameters": {},
                        "reasoning": f"Failed to parse LLM response: {content[:200]}",
                        "expected_savings_kw": 0,
                    }
        except Exception as e:
            action = {
                "action_type": "no_action",
                "zone_id": None,
                "parameters": {},
                "reasoning": f"Agent unavailable: {str(e)}",
                "expected_savings_kw": 0,
            }

        action["timestamp"] = datetime.now().isoformat()
        self.conversation_history.append({"role": "user", "content": user_msg})
        self.conversation_history.append(
            {"role": "assistant", "content": json.dumps(action)}
        )
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]
        return action


# Module-level instance
agent: Optional[AgentOrchestrator] = None


def get_agent(
    ollama_url: str = "http://localhost:11434",
    model: str = "llama3",
) -> AgentOrchestrator:
    global agent
    if agent is None:
        agent = AgentOrchestrator(ollama_url, model)
    return agent
