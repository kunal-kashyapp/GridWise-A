from dataclasses import dataclass


@dataclass
class ValidationResult:
    valid: bool
    action: dict
    reason: str = ""
    violations: list[str] = None

    def __post_init__(self):
        if self.violations is None:
            self.violations = []


class ActionValidator:
    def __init__(
        self,
        comfort_min: float = 20.0,
        comfort_max: float = 26.0,
        peak_threshold: float = 500.0,
    ):
        self.comfort_min = comfort_min
        self.comfort_max = comfort_max
        self.peak_threshold = peak_threshold
        self.VALID_ACTIONS = [
            "adjust_setpoint",
            "set_hvac_mode",
            "adjust_schedule",
            "no_action",
        ]
        self.VALID_HVAC_MODES = ["cooling", "heating", "idle", "off"]

    def validate(self, action: dict, zone_state: dict) -> ValidationResult:
        violations = []
        action_type = action.get("action_type", "")

        if action_type not in self.VALID_ACTIONS:
            return ValidationResult(
                valid=False,
                action=action,
                reason=f"Unknown action type: {action_type}",
                violations=[f"Invalid action type '{action_type}'"],
            )

        if action_type == "no_action":
            return ValidationResult(
                valid=True, action=action, reason="No action required"
            )

        if action_type == "adjust_setpoint":
            new_setpoint = action.get("parameters", {}).get("setpoint")
            if new_setpoint is None:
                violations.append("Missing setpoint parameter")
            elif not (self.comfort_min <= new_setpoint <= self.comfort_max):
                violations.append(
                    f"Setpoint {new_setpoint}°C outside comfort bounds "
                    f"[{self.comfort_min}, {self.comfort_max}]°C"
                )

        if action_type == "set_hvac_mode":
            mode = action.get("parameters", {}).get("mode")
            if mode not in self.VALID_HVAC_MODES:
                violations.append(f"Invalid HVAC mode: {mode}")
            if mode == "off" and zone_state.get("occupancy", 0) > 0:
                violations.append("Cannot turn HVAC off while zone is occupied")

        if violations:
            return ValidationResult(
                valid=False,
                action=action,
                reason="; ".join(violations),
                violations=violations,
            )
        return ValidationResult(
            valid=True, action=action, reason="All constraints satisfied"
        )
