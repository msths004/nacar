"""
Script de demostración del escenario de referencia del Proyecto NÁCAR (Fase 1: Yucatán).

Ejecuta el motor numérico completo sobre:
  - V = 12,000 L (10 m^2, profundidad 1.2 m)
  - 2 columnas tipo linterna x 6 pisos x 20 almejas/piso = 240 bivalvos A. trapesialis (L = 65 mm)
  - 4.5 m^2 de macrófitas (3.60 kg MS de raíces) en el mes de Abril
Imprime indicadores en porcentajes 0-100%, balance simbiótico m vs m*, factibilidad reproductiva,
consignas del Slot de Controlador Electrónico, sensibilidad y exporta `demo_output_yucatan.json`.
"""

import json
from pathlib import Path

from engine import NacarDigitalTwinEngine
from models import SimulationTargetsInput, VisualDesignInput, WaterInitialAndIoTInput


def main() -> None:
    engine = NacarDigitalTwinEngine()
    design = VisualDesignInput()
    water = WaterInitialAndIoTInput()
    targets = SimulationTargetsInput()

    res = engine.run_simulation(design, water, targets, include_sensitivity=True)

    print("=" * 78)
    print(" GEMELO DIGITAL NÁCAR (BACKEND TENTATIVO OFFLINE) - ESCENARIO YUCATÁN")
    print("=" * 78)
    print(f"Solver utilizado: {res.solver_backend} | Tiempo de cómputo: {res.compute_time_ms} ms")
    print(f"Gobernanza de parámetros: {res.governance.evidence_summary}")
    print("-" * 78)
    print(
        f"[1. GEOMETRÍA LINTERNA] n = {res.geometry.total_bivalves_n} bivalvos | "
        f"d_almejas = {res.geometry.clam_spacing_cm} cm | "
        f"Eficiencia espacial eta_mod = {res.geometry.spatial_efficiency_pct}%"
    )
    print(
        f"[2. BALANCE PLANTAS/ALMEJAS] Instalado: {res.design_balance.installed_root_biomass_kg} kg MS "
        f"({res.design_balance.installed_macrophyte_area_m2} m^2) | "
        f"Crítico m*: {res.design_balance.critical_total_root_biomass_kg} kg MS "
        f"({res.design_balance.critical_total_macrophyte_area_m2} m^2) | "
        f"Por módulo: {res.design_balance.critical_root_biomass_per_module_kg} kg/módulo"
    )
    print(f"    Estado: {res.design_balance.balance_status} -> {res.design_balance.recommendation}")
    print("-" * 78)
    p0 = res.current_percentages
    pf = res.final_percentages
    print("[3. TABLERO DE PORCENTAJES INTERPRETABLES (0-100%)]")
    print(f"  t = 0 h   -> Salud Global: {p0.overall_water_health_pct}% [{p0.health_semaphore}] | "
          f"Bombeo bivalvo: {p0.bivalve_pumping_efficiency_pct}% (penalización turbidez: -{p0.turbidity_limitation_pct}%)")
    print(f"  t = {targets.horizon_hours:.0f} h -> Salud Global: {pf.overall_water_health_pct}% [{pf.health_semaphore}] | "
          f"Bacterias removidas: {pf.bacteria_removal_pct}% | Claridad: {pf.clarity_pct}% | "
          f"OD sat: {pf.oxygen_saturation_pct}%")
    print(f"  Tiempo estimado meta E. coli (<={targets.target_ecoli_ufc_100mL:.0f} UFC/100mL): "
          f"{p0.estimated_hours_to_ecoli_target} h "
          f"(sin bivalvos: {p0.estimated_hours_to_ecoli_without_bivalves} h | "
          f"aceleración por bivalvos: +{p0.bivalve_speedup_pct}%)")
    print(f"  Tiempo estimado meta claridad (<={targets.target_tss_mg_L:.1f} mg/L TSS): "
          f"{p0.estimated_hours_to_clarity_target} h")
    print(f"  Equilibrio simbiótico: {pf.symbiotic_balance_pct}% | "
          f"Colmatación bandejas en {targets.horizon_hours:.0f}h: {pf.tray_clogging_pct}% "
          f"(próxima limpieza preventiva: {pf.estimated_days_to_tray_maintenance} días)")
    print(f"  Reparto nutrientes (final): Amonio = {pf.nutrient_sink_shares_pct['ammonia']} | "
          f"Fósforo = {pf.nutrient_sink_shares_pct['phosphorus']}")
    print("-" * 78)
    r0, rf = res.reproduction_initial, res.reproduction_at_target_or_final
    print(f"[4. REPRODUCCIÓN POR ESPECIE: {r0.scientific_name}]")
    print(f"  t = 0 h   -> Factibilidad desove: {r0.spawning_feasibility_pct}% ({r0.feasibility_category}) | "
          f"Limitante: {r0.limiting_factor_label}")
    print(f"  t = {targets.horizon_hours:.0f} h -> Factibilidad desove: {rf.spawning_feasibility_pct}% ({rf.feasibility_category}) | "
          f"Acción: {rf.recommended_action}")
    print(f"  Nota larval: {rf.recruitment_disclaimer}")
    print("-" * 78)
    cs = res.controller_slot
    print(f"[5. SLOT CONTROLADOR FUTURO ({cs.mode})]")
    print(f"  PWM Aireador={cs.pwm_aerator_pct}% | Bomba={cs.pwm_recirculation_pump_pct}% | "
          f"Enfriamiento={cs.pwm_thermal_cooling_pct}% | Dosificador Algal={cs.pwm_microalgae_doser_pct}%")
    print("-" * 78)
    print("[6. TOP SENSIBILIDAD (+10% perturbación -> impacto en t_meta y m*)]")
    for s in res.sensitivity_ranking[:5]:
        print(f"  - {s.label}: delta_t_meta = {s.delta_t_meta_pct:+.2f}% | delta_m* = {s.delta_m_star_pct:+.2f}%")
    print("-" * 78)
    print("[7. SERIE TEMPORAL RESUMIDA]")
    print("  t(h)   | E.coli(UFC) | TSS(mg/L) | NH4(mg/L) | PO4(mg/L) | OD(mg/L) | Qbiv(L/h) | Salud(%) | Repr(%)")
    sample_hours = {0.0, 6.0, 12.0, 24.0, 36.0, 48.0, 72.0}
    for pt in res.time_series:
        if pt.time_h in sample_hours or pt == res.time_series[-1]:
            print(
                f"  {pt.time_h:5.1f}  | {pt.ecoli_ufc_100mL:11.1f} | {pt.tss_mg_L:9.2f} | "
                f"{pt.ammonia_n_mg_L:9.3f} | {pt.phosphate_p_mg_L:9.3f} | {pt.oxygen_mg_L:8.2f} | "
                f"{pt.q_biv_total_L_h:9.1f} | {pt.water_health_pct:8.1f} | {pt.reproductive_feasibility_pct:7.1f}"
            )

    out_path = Path(__file__).resolve().parent / "demo_output_yucatan.json"
    out_path.write_text(json.dumps(res.model_dump(), indent=2, ensure_ascii=False), encoding="utf-8")
    print("=" * 78)
    print(f"JSON exportado en: {out_path}")


if __name__ == "__main__":
    main()
