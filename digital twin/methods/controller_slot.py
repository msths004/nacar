"""
Slot modular reservado para el futuro Controlador Electrónico en lazo cerrado (Bloque 9, Ec. 9.3).

Actualmente opera en modo `DRY_RUN_RECOMMENDATION`: calcula las consignas PWM exactas [0-100%]
para aireación, bombeo de recirculación, control térmico y dosificación algal basándose en la
especie seleccionada y el estado estimado del cuerpo de agua, sin requerir hardware conectado.

En la Fase 4 (control activo con ESP32 / Arduino / PLC vía MQTT o puerto Serial), solo se deberá
registrar un callback físico con `register_hardware_driver(driver_fn)` sin modificar el núcleo
matemático del Gemelo Digital.
"""

from typing import Callable, List, Optional

from models import ControllerSlotOutput


def _clip(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, float(v)))


class ActuatorControllerSlot:
    """Interfaz modular de control proporcional para actuadores de acuacultura / humedal."""

    def __init__(self) -> None:
        self._hardware_driver: Optional[Callable[[ControllerSlotOutput], None]] = None

    def register_hardware_driver(self, driver_fn: Callable[[ControllerSlotOutput], None]) -> None:
        """Registra un controlador físico externo (MQTT/ESP32/PLC) para activar lazo cerrado."""
        self._hardware_driver = driver_fn

    def compute_setpoints(
        self,
        temp_c: float,
        oxygen_mg_L: float,
        tss_mg_L: float,
        f_deb_rep: float,
        sp_params: dict,
        target_oxygen_mg_L: float = 6.0,
        target_tss_mg_L: float = 3.0,
        spawning_mode_active: bool = False,
    ) -> ControllerSlotOutput:
        """Calcula las consignas u_ctrl = [u_aire, u_flujo, u_term, u_alim] según Ec. 9.3."""
        kp_o2 = 28.0
        kp_q = 2.5
        kp_t = 22.0
        kp_deb = 120.0
        u_base_pump = 40.0
        delta_spawning = 20.0 if spawning_mode_active else 0.0

        u_aire = _clip(kp_o2 * (target_oxygen_mg_L - oxygen_mg_L), 0.0, 100.0)
        u_flujo = _clip(u_base_pump + kp_q * (tss_mg_L - target_tss_mg_L) - delta_spawning, 15.0, 100.0)
        u_term = _clip(kp_t * (temp_c - sp_params["T_rep_opt_C"]), 0.0, 100.0)
        u_alim = _clip(kp_deb * (0.75 - f_deb_rep), 0.0, 100.0)

        notes: List[str] = []
        if u_aire > 10.0:
            notes.append(f"Activar aireación/oxigenación al {u_aire:.0f}% (OD actual {oxygen_mg_L:.2f} < {target_oxygen_mg_L:.1f} mg/L).")
        if u_term > 15.0:
            notes.append(f"Activar sombreo o enfriamiento al {u_term:.0f}% (T={temp_c:.1f} °C > óptimo reproductivo {sp_params['T_rep_opt_C']:.1f} °C).")
        if u_alim > 10.0:
            notes.append(f"Energía gonadal DEB baja; dosificación algal sugerida al {u_alim:.0f}% si se busca inducir desove.")
        if spawning_mode_active:
            notes.append("Modo ventana de desove activo: flujo de recirculación moderado para evitar barrido espermático.")
        if not notes:
            notes.append("Condiciones nominales: actuadores en espera / flujo base de mantenimiento.")

        mode = "HARDWARE_ACTIVE" if self._hardware_driver is not None else "DRY_RUN_RECOMMENDATION"
        output = ControllerSlotOutput(
            mode=mode,
            pwm_aerator_pct=round(u_aire, 1),
            pwm_recirculation_pump_pct=round(u_flujo, 1),
            pwm_thermal_cooling_pct=round(u_term, 1),
            pwm_microalgae_doser_pct=round(u_alim, 1),
            notes=notes,
        )

        if self._hardware_driver is not None:
            self._hardware_driver(output)

        return output
