"""
Motor Numérico Offline y Asimilador de Sensores IoT del Gemelo Digital NÁCAR.

Arquitectura "Construir Local, Diseñar Global":
- Lee todos los coeficientes biológicos (Theta_sp) y regionales (Omega_reg) desde cartuchos YAML.
- Expone el historial de niveles de evidencia (A/B/C/D) en cada simulación.
- Integra el sistema acoplado de EDOs con SciPy (Radau/BDF si está instalado) o con
  un solucionador RK4 sub-paso vectorizado en NumPy garantizando positividad y <50 ms.
"""

import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import math
import numpy as np
import yaml

try:
    from scipy.integrate import solve_ivp  # type: ignore
    _HAS_SCIPY = True
except ImportError:  # pragma: no cover
    _HAS_SCIPY = False

from blocks import (
    block1_module_geometry,
    block2_bivalve_ecophysiology,
    block3_macrophyte_bacteriome,
    block4_karst_geochemistry,
    block5_critical_macrophyte_biomass,
    block6_pathogen_and_water_odes,
    block7_kozeny_carman_clogging,
    block8_reproductive_feasibility,
    block9_frontend_percentages,
)
from controller_slot import ActuatorControllerSlot
from models import (
    DigitalTwinSimulationResult,
    IoTAssimilationRequest,
    ParameterGovernanceReport,
    SensitivityItem,
    SimulationTargetsInput,
    TimeSeriesPoint,
    VisualDesignInput,
    WaterInitialAndIoTInput,
)

METHODS_DIR = Path(__file__).resolve().parent
PROFILES_DIR = METHODS_DIR / "profiles"
REGIONS_DIR = PROFILES_DIR / "regions"
SPECIES_DIR = PROFILES_DIR / "species"


def _flatten_section(section: Dict[str, Any]) -> Tuple[Dict[str, float], Dict[str, str]]:
    """Extrae valores numéricos y niveles de evidencia de una sección YAML."""
    values: Dict[str, float] = {}
    evidence: Dict[str, str] = {}
    for key, entry in section.items():
        if isinstance(entry, dict) and "value" in entry:
            values[key] = float(entry["value"])
            evidence[key] = str(entry.get("evidence_level", "D")).upper()
        elif isinstance(entry, (int, float)):
            values[key] = float(entry)
    return values, evidence


def load_region_profile(region_id: str) -> Dict[str, Any]:
    """Carga un cartucho regional YAML junto con sus metadatos de evidencia."""
    yaml_path = REGIONS_DIR / f"{region_id}.yaml"
    if not yaml_path.exists():
        available = [p.stem for p in REGIONS_DIR.glob("*.yaml")]
        raise FileNotFoundError(f"Perfil regional '{region_id}' no encontrado. Disponibles: {available}")

    raw = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
    evidence_all: Dict[str, str] = {}
    parsed: Dict[str, Any] = {
        "region_id": raw.get("region_id", region_id),
        "display_name": raw.get("display_name", region_id),
        "status": raw.get("status", "unknown"),
        "latitude_deg": raw.get("latitude_deg", 20.97),
    }
    for sec in ("water_baseline", "karst_calcita", "macrophytes", "cwm1_bacteria", "hydraulics_and_clogging"):
        vals, ev = _flatten_section(raw.get(sec, {}))
        parsed[sec] = vals
        for k, lvl in ev.items():
            evidence_all[f"{sec}.{k}"] = lvl

    parsed["evidence_map"] = evidence_all
    return parsed


def load_species_profile(species_id: str) -> Dict[str, Any]:
    """Carga un perfil de especie desde profiles/species/<species_id>.yaml o secondary_catalog.yaml."""
    direct_path = SPECIES_DIR / f"{species_id}.yaml"
    if direct_path.exists():
        raw = yaml.safe_load(direct_path.read_text(encoding="utf-8"))
    else:
        cat_path = SPECIES_DIR / "secondary_catalog.yaml"
        if not cat_path.exists():
            raise FileNotFoundError(f"Perfil de especie '{species_id}' no encontrado.")
        cat = yaml.safe_load(cat_path.read_text(encoding="utf-8"))
        species_map = cat.get("species", {})
        if species_id not in species_map:
            raise FileNotFoundError(f"Especie '{species_id}' no encontrada en catálogo.")
        raw = species_map[species_id]
        raw["species_id"] = species_id

    params, ev = _flatten_section(raw.get("parameters", {}))
    return {
        "species_id": raw.get("species_id", species_id),
        "scientific_name": raw.get("scientific_name", species_id),
        "family": raw.get("family", "Unionida"),
        "status": raw.get("status", "unknown"),
        "larval_type": raw.get("larval_type", "lasidium"),
        "requires_host_fish_for_recruitment": raw.get("requires_host_fish_for_recruitment", True),
        "pending_verifications": raw.get("pending_verifications", []),
        "parameters": params,
        "evidence_map": {f"species.{k}": v for k, v in ev.items()},
    }


def list_available_profiles() -> Dict[str, Any]:
    """Lista todas las regiones y especies disponibles en los cartuchos YAML."""
    regions = []
    for p in sorted(REGIONS_DIR.glob("*.yaml")):
        raw = yaml.safe_load(p.read_text(encoding="utf-8"))
        regions.append({
            "region_id": p.stem,
            "display_name": raw.get("display_name", p.stem),
            "status": raw.get("status", "unknown"),
        })

    species = []
    for p in sorted(SPECIES_DIR.glob("*.yaml")):
        raw = yaml.safe_load(p.read_text(encoding="utf-8"))
        if p.stem == "secondary_catalog":
            for sid, sdata in raw.get("species", {}).items():
                species.append({
                    "species_id": sid,
                    "scientific_name": sdata.get("scientific_name", sid),
                    "status": sdata.get("status", "template_seed_level_D"),
                })
        else:
            species.append({
                "species_id": p.stem,
                "scientific_name": raw.get("scientific_name", p.stem),
                "status": raw.get("status", "focal_species_phase1"),
            })

    return {"regions": regions, "species": species}


class SoftSensorKarstMapper:
    """Completa variables no medidas con la línea base del cartucho regional y convierte NTU -> TSS."""

    @staticmethod
    def resolve_water_inputs(
        water: WaterInitialAndIoTInput,
        region_profile: Dict[str, Any],
    ) -> Dict[str, Any]:
        base = region_profile["water_baseline"]
        if water.tss_mg_L is not None:
            tss_val = float(water.tss_mg_L)
        elif water.turbidity_ntu is not None:
            tss_val = float(water.turbidity_ntu) * base["ntu_to_tss_factor"]
        else:
            tss_val = 15.0

        ca_val = float(water.calcium_mg_L) if water.calcium_mg_L is not None else base["calcium_mg_L"]
        hco3_val = float(water.bicarbonate_mg_L) if water.bicarbonate_mg_L is not None else base["bicarbonate_mg_L"]
        par_val = float(water.par_light_umol_m2_s) if water.par_light_umol_m2_s is not None else base["par_light_umol_m2_s"]

        inflow = {
            "ecoli": float(water.inflow_ecoli_ufc_100mL) if water.inflow_ecoli_ufc_100mL is not None else float(water.pathogen_ecoli_ufc_100mL),
            "tss": float(water.inflow_tss_mg_L) if water.inflow_tss_mg_L is not None else tss_val,
            "nh4": float(water.inflow_ammonia_n_mg_L) if water.inflow_ammonia_n_mg_L is not None else float(water.ammonia_n_mg_L),
            "no3": float(water.inflow_nitrate_n_mg_L) if water.inflow_nitrate_n_mg_L is not None else float(water.nitrate_n_mg_L),
            "po4": float(water.inflow_phosphate_p_mg_L) if water.inflow_phosphate_p_mg_L is not None else float(water.phosphate_p_mg_L),
        }

        return {
            "temp_c": float(water.temp_c),
            "ph": float(water.ph),
            "oxygen": float(water.dissolved_oxygen_mg_L),
            "tss": tss_val,
            "f_org": float(water.organic_fraction_tss),
            "ecoli": float(water.pathogen_ecoli_ufc_100mL),
            "nh4": float(water.ammonia_n_mg_L),
            "no3": float(water.nitrate_n_mg_L),
            "po4": float(water.phosphate_p_mg_L),
            "calcium": ca_val,
            "bicarbonate": hco3_val,
            "par_light": par_val,
            "nitrifier_x_a": float(water.nitrifier_biomass_mg_L),
            "heterotroph_x_h": float(water.heterotroph_biomass_mg_L),
            "cod_s_f": float(water.fermentable_cod_S_F_mg_L),
            "cod_s_a": float(water.acetate_cod_S_A_mg_L),
            "cod_x_s": float(water.slowly_biodegradable_X_S_mg_L),
            "basal_food_pom": float(water.basal_food_pom_mg_L),
            "kLa_h": base["kLa_reaeration_h"],
            "inflow": inflow,
        }


class NacarDigitalTwinEngine:
    """Núcleo de simulación offline, cálculo de diseño simbiótico y asimilación IoT."""

    def __init__(self) -> None:
        self.controller = ActuatorControllerSlot()

    @staticmethod
    def _build_governance_report(
        region: Dict[str, Any],
        species: Dict[str, Any],
    ) -> ParameterGovernanceReport:
        combined: Dict[str, str] = {}
        combined.update(region["evidence_map"])
        combined.update(species["evidence_map"])
        counts = {"A": 0, "B": 0, "C": 0, "D": 0}
        for lvl in combined.values():
            key = lvl if lvl in counts else "D"
            counts[key] += 1

        total = sum(counts.values())
        summary = (
            f"{total} parámetros activos cargados de perfiles externos: "
            f"Nivel A={counts['A']} (local), Nivel B={counts['B']} (especie), "
            f"Nivel C={counts['C']} (extrapolado), Nivel D={counts['D']} (semilla provisional)."
        )
        return ParameterGovernanceReport(
            region_id=region["region_id"],
            region_status=region["status"],
            species_id=species["species_id"],
            species_status=species["status"],
            evidence_counts=counts,
            evidence_summary=summary,
            pending_verifications=list(species.get("pending_verifications", [])),
            disclaimer=(
                "Los parámetros Nivel D son semillas provisionales para operatividad del modelo y "
                "deben sustituirse con los resultados de la investigación profunda y bioensayos locales."
            ),
        )

    @staticmethod
    def _find_crossing_time(times: List[float], values: List[float], target: float, eff_rate_end: Optional[float] = None) -> Optional[float]:
        """Encuentra el primer instante donde `values <= target` (interpolado o proyectado si aún decrece)."""
        if not values:
            return None
        if values[0] <= target:
            return 0.0
        for i in range(1, len(values)):
            if values[i] <= target:
                v0, v1 = values[i - 1], values[i]
                t0, t1 = times[i - 1], times[i]
                frac = (v0 - target) / max(1e-12, v0 - v1)
                return t0 + frac * (t1 - t0)
        if eff_rate_end is not None and eff_rate_end > 1e-6 and values[-1] > target:
            return times[-1] + math.log(values[-1] / target) / eff_rate_end
        return None

    def run_simulation(
        self,
        design: VisualDesignInput,
        water: WaterInitialAndIoTInput,
        targets: SimulationTargetsInput,
        include_sensitivity: bool = False,
    ) -> DigitalTwinSimulationResult:
        """Ejecuta el flujo completo de los 9 bloques desde t=0 hasta t=horizon_hours."""
        region = load_region_profile(design.region_id)
        species = load_species_profile(design.species_id)
        return self._run_with_profiles(design, water, targets, region, species, include_sensitivity)

    def _run_with_profiles(
        self,
        design: VisualDesignInput,
        water: WaterInitialAndIoTInput,
        targets: SimulationTargetsInput,
        region: Dict[str, Any],
        species: Dict[str, Any],
        include_sensitivity: bool = False,
    ) -> DigitalTwinSimulationResult:
        """Núcleo compartido parametrizado con diccionarios de región y especie ya cargados."""
        t_start = time.perf_counter()
        resolved = SoftSensorKarstMapper.resolve_water_inputs(water, region)

        sp_params = species["parameters"]
        mac_params = region["macrophytes"]
        cwm1_params = region["cwm1_bacteria"]
        karst_params = region["karst_calcita"]
        hydro_params = region["hydraulics_and_clogging"]

        # Bloque 1: Geometría modular e interferencia (constante en toda la corrida)
        geom = block1_module_geometry(design, sp_params)

        # Bloque 5: Diseño simbiótico m* evaluado en agua clarificada (TSS objetivo o basal) y S_NH,meta
        clean_ref_tss = min(resolved["tss"], max(targets.target_tss_mg_L, 4.0))
        biv_clean = block2_bivalve_ecophysiology(
            temp_c=resolved["temp_c"],
            tss_mg_L=clean_ref_tss,
            oxygen_mg_L=resolved["oxygen"],
            f_org=resolved["f_org"],
            geom=geom,
            sp_params=sp_params,
            basal_food_pom_mg_L=resolved["basal_food_pom"],
        )
        design_balance = block5_critical_macrophyte_biomass(
            design=design,
            geom=geom,
            biv_at_clean_tss=biv_clean,
            temp_c=resolved["temp_c"],
            par_light=resolved["par_light"],
            s_o=resolved["oxygen"],
            x_a=resolved["nitrifier_x_a"],
            target_nh4_mg_L=targets.target_ammonia_n_mg_L,
            inflow_nh4_mg_L=resolved["inflow"]["nh4"],
            mac_params=mac_params,
            cwm1_params=cwm1_params,
        )

        # Integración de EDOs acopladas (Bloques 2, 3, 4, 6 y 7): y = [ecoli, tss, nh4, no3, po4, oxygen, m_dep, cum_Q_L]
        y0 = np.array([
            resolved["ecoli"],
            resolved["tss"],
            resolved["nh4"],
            resolved["no3"],
            resolved["po4"],
            resolved["oxygen"],
            0.0,
            0.0,
        ], dtype=float)

        def rhs(t_h: float, y: np.ndarray) -> np.ndarray:
            ecoli_v, tss_v, nh4_v, no3_v, po4_v, oxy_v, m_dep_v, _ = [max(0.0, float(v)) for v in y]
            oxy_v = min(oxy_v, 18.0)

            biv = block2_bivalve_ecophysiology(
                temp_c=resolved["temp_c"],
                tss_mg_L=tss_v,
                oxygen_mg_L=oxy_v,
                f_org=resolved["f_org"],
                geom=geom,
                sp_params=sp_params,
                basal_food_pom_mg_L=resolved["basal_food_pom"],
            )
            bio = block3_macrophyte_bacteriome(
                design=design,
                temp_c=resolved["temp_c"],
                par_light=resolved["par_light"],
                s_nh=nh4_v,
                s_no=no3_v,
                s_po4=po4_v,
                s_o=oxy_v,
                x_a=resolved["nitrifier_x_a"],
                mac_params=mac_params,
                cwm1_params=cwm1_params,
            )
            karst = block4_karst_geochemistry(
                volume_L=design.volume_liters,
                temp_c=resolved["temp_c"],
                ph=resolved["ph"],
                ca_mg_L=resolved["calcium"],
                hco3_mg_L=resolved["bicarbonate"],
                s_po4_mg_L=po4_v,
                karst_params=karst_params,
            )
            odes = block6_pathogen_and_water_odes(
                state={"ecoli": ecoli_v, "tss": tss_v, "nh4": nh4_v, "no3": no3_v, "po4": po4_v, "oxygen": oxy_v},
                design=design,
                geom=geom,
                biv=biv,
                bio=bio,
                karst=karst,
                inflow_conc=resolved["inflow"],
                temp_c=resolved["temp_c"],
                par_light=resolved["par_light"],
                mac_params=mac_params,
                cwm1_params=cwm1_params,
                hydro_params=hydro_params,
                sp_params=sp_params,
                kLa_h=resolved["kLa_h"],
                x_h_mg_L=resolved["heterotroph_x_h"],
                s_f_mg_L=resolved["cod_s_f"],
                s_a_mg_L=resolved["cod_s_a"],
                x_s_mg_L=resolved["cod_x_s"],
            )
            clog = block7_kozeny_carman_clogging(
                m_dep_mg=m_dep_v,
                n_total=geom.total_bivalves_n,
                bd_ind_mg_h=biv["BD_ind_mg_h"],
                r_ca_g_L_h=karst["r_Ca_g_L_h"],
                hydro_params=hydro_params,
                t_hours=t_h,
                x_bio_total_mg_L=resolved["nitrifier_x_a"] + resolved["heterotroph_x_h"],
            )
            return np.array([
                odes["d_ecoli"],
                odes["d_tss"],
                odes["d_nh4"],
                odes["d_no3"],
                odes["d_po4"],
                odes["d_oxygen"],
                clog["d_m_dep_mg_h"],
                biv["Q_biv_L_h"],
            ], dtype=float)

        t_eval = np.arange(0.0, targets.horizon_hours + 1e-9, targets.dt_output_hours)
        if t_eval[-1] < targets.horizon_hours - 1e-6:
            t_eval = np.append(t_eval, targets.horizon_hours)

        if _HAS_SCIPY:
            sol = solve_ivp(rhs, (0.0, targets.horizon_hours), y0, method="Radau", t_eval=t_eval, rtol=1e-5, atol=1e-7)
            y_out = np.maximum(0.0, sol.y)
            solver_name = "SciPy-Radau"
        else:
            y_out = self._integrate_rk4(rhs, y0, t_eval)
            solver_name = "NumPy-RK4-Substep"

        # Recorrer puntos de salida para construir series temporales y métricas derivadas
        times = [float(t) for t in t_eval]
        ecoli_series = [float(v) for v in y_out[0]]
        tss_series = [float(v) for v in y_out[1]]
        nh4_series = [float(v) for v in y_out[2]]
        no3_series = [float(v) for v in y_out[3]]
        po4_series = [float(v) for v in y_out[4]]
        oxy_series = [float(v) for v in y_out[5]]
        mdep_series = [float(v) for v in y_out[6]]
        cumq_series = [float(v) for v in y_out[7]]

        lat_deg = region.get("latitude_deg", 20.97)
        x_bio_tot = resolved["nitrifier_x_a"] + resolved["heterotroph_x_h"]

        # Cálculo de tiempos meta con y sin bivalvos (solo para comparación con diseño actual)
        init_biv = block2_bivalve_ecophysiology(
            resolved["temp_c"], tss_series[0], oxy_series[0], resolved["f_org"], geom, sp_params, resolved["basal_food_pom"]
        )
        init_bio = block3_macrophyte_bacteriome(
            design, resolved["temp_c"], resolved["par_light"], nh4_series[0], no3_series[0], po4_series[0], oxy_series[0],
            resolved["nitrifier_x_a"], mac_params, cwm1_params
        )
        init_karst = block4_karst_geochemistry(
            design.volume_liters, resolved["temp_c"], resolved["ph"], resolved["calcium"], resolved["bicarbonate"],
            po4_series[0], karst_params
        )
        init_odes = block6_pathogen_and_water_odes(
            {"ecoli": ecoli_series[0], "tss": tss_series[0], "nh4": nh4_series[0], "no3": no3_series[0], "po4": po4_series[0], "oxygen": oxy_series[0]},
            design, geom, init_biv, init_bio, init_karst, resolved["inflow"],
            resolved["temp_c"], resolved["par_light"], mac_params, cwm1_params, hydro_params, sp_params, resolved["kLa_h"],
            resolved["heterotroph_x_h"], resolved["cod_s_f"], resolved["cod_s_a"], resolved["cod_x_s"],
        )

        final_biv = block2_bivalve_ecophysiology(
            resolved["temp_c"], tss_series[-1], oxy_series[-1], resolved["f_org"], geom, sp_params, resolved["basal_food_pom"]
        )
        final_bio = block3_macrophyte_bacteriome(
            design, resolved["temp_c"], resolved["par_light"], nh4_series[-1], no3_series[-1], po4_series[-1], oxy_series[-1],
            resolved["nitrifier_x_a"], mac_params, cwm1_params
        )
        final_karst = block4_karst_geochemistry(
            design.volume_liters, resolved["temp_c"], resolved["ph"], resolved["calcium"], resolved["bicarbonate"],
            po4_series[-1], karst_params
        )
        final_odes = block6_pathogen_and_water_odes(
            {"ecoli": ecoli_series[-1], "tss": tss_series[-1], "nh4": nh4_series[-1], "no3": no3_series[-1], "po4": po4_series[-1], "oxygen": oxy_series[-1]},
            design, geom, final_biv, final_bio, final_karst, resolved["inflow"],
            resolved["temp_c"], resolved["par_light"], mac_params, cwm1_params, hydro_params, sp_params, resolved["kLa_h"],
            resolved["heterotroph_x_h"], resolved["cod_s_f"], resolved["cod_s_a"], resolved["cod_x_s"],
        )

        t_meta_ecoli = self._find_crossing_time(times, ecoli_series, targets.target_ecoli_ufc_100mL, final_odes["k_total_bact_h"])
        k_tss_end = final_biv["Q_biv_L_h"] / design.volume_liters + hydro_params["v_sed_m_h"] / max(0.1, geom.water_depth_m)
        t_meta_tss = self._find_crossing_time(times, tss_series, targets.target_tss_mg_L, k_tss_end)

        k_no_clams = init_odes["k_no_clams_bact_h"]
        t_meta_ecoli_no_clams = (
            math.log(max(ecoli_series[0], targets.target_ecoli_ufc_100mL) / targets.target_ecoli_ufc_100mL) / k_no_clams
            if ecoli_series[0] > targets.target_ecoli_ufc_100mL and k_no_clams > 1e-6
            else 0.0
        )

        # Proyección de días hasta mantenimiento de bandejas (K/K0 <= 0.45)
        days_maint = self._estimate_days_to_clogging(
            mdep_series[-1], times[-1], geom.total_bivalves_n, final_biv["BD_ind_mg_h"], final_karst["r_Ca_g_L_h"], hydro_params
        )

        ammonia_max_ref = max(resolved["nh4"], targets.target_ammonia_n_mg_L * 2.0, 1.2)

        def build_sink_shares(bio_d: Dict[str, float], karst_d: Dict[str, float]) -> Dict[str, Dict[str, float]]:
            n_tot = bio_d["R_bact_NH_mg_h"] + bio_d["R_mac_NH_mg_h"]
            p_tot = karst_d["R_calcita_P_mg_h"] + bio_d["R_mac_P_mg_h"]
            n_bact_pct = (bio_d["R_bact_NH_mg_h"] / n_tot * 100.0) if n_tot > 1e-9 else 0.0
            n_mac_pct = (bio_d["R_mac_NH_mg_h"] / n_tot * 100.0) if n_tot > 1e-9 else 0.0
            p_cal_pct = (karst_d["R_calcita_P_mg_h"] / p_tot * 100.0) if p_tot > 1e-9 else 0.0
            p_mac_pct = (bio_d["R_mac_P_mg_h"] / p_tot * 100.0) if p_tot > 1e-9 else 0.0
            return {
                "ammonia": {"bacteria_cwm1_pct": round(n_bact_pct, 1), "macrophytes_pct": round(n_mac_pct, 1)},
                "phosphorus": {"karst_calcite_pct": round(p_cal_pct, 1), "macrophytes_pct": round(p_mac_pct, 1)},
            }

        init_clog = block7_kozeny_carman_clogging(
            mdep_series[0], geom.total_bivalves_n, init_biv["BD_ind_mg_h"], init_karst["r_Ca_g_L_h"], hydro_params, times[0], x_bio_tot
        )
        final_clog = block7_kozeny_carman_clogging(
            mdep_series[-1], geom.total_bivalves_n, final_biv["BD_ind_mg_h"], final_karst["r_Ca_g_L_h"], hydro_params, times[-1], x_bio_tot
        )

        current_pct = block9_frontend_percentages(
            ecoli_now=ecoli_series[0], ecoli_init=ecoli_series[0], ecoli_target=targets.target_ecoli_ufc_100mL,
            tss_now=tss_series[0], tss_init=tss_series[0], tss_target=targets.target_tss_mg_L,
            ammonia_now=nh4_series[0], ammonia_max_ref=ammonia_max_ref, ammonia_target=targets.target_ammonia_n_mg_L,
            oxygen_now=oxy_series[0], temp_c=resolved["temp_c"],
            cr_eff=init_biv["CR_eff_L_h_ind"], cr_max=geom.cr_max_L_h_ind, f_tss=init_biv["f_TSS"],
            eta_module=geom.eta_module, m_installed_kg=design_balance.installed_root_biomass_kg,
            m_star_kg=design_balance.critical_total_root_biomass_kg, k_ratio=init_clog["K_ratio"],
            cumulative_filtered_L=0.0, volume_L=design.volume_liters,
            hours_to_ecoli=t_meta_ecoli, hours_to_ecoli_no_clams=t_meta_ecoli_no_clams,
            hours_to_tss=t_meta_tss, days_to_maintenance=days_maint,
            sink_shares=build_sink_shares(init_bio, init_karst),
        )

        rem_ecoli = max(0.0, t_meta_ecoli - times[-1]) if t_meta_ecoli is not None else None
        rem_tss = max(0.0, t_meta_tss - times[-1]) if t_meta_tss is not None else None
        final_pct = block9_frontend_percentages(
            ecoli_now=ecoli_series[-1], ecoli_init=ecoli_series[0], ecoli_target=targets.target_ecoli_ufc_100mL,
            tss_now=tss_series[-1], tss_init=tss_series[0], tss_target=targets.target_tss_mg_L,
            ammonia_now=nh4_series[-1], ammonia_max_ref=ammonia_max_ref, ammonia_target=targets.target_ammonia_n_mg_L,
            oxygen_now=oxy_series[-1], temp_c=resolved["temp_c"],
            cr_eff=final_biv["CR_eff_L_h_ind"], cr_max=geom.cr_max_L_h_ind, f_tss=final_biv["f_TSS"],
            eta_module=geom.eta_module, m_installed_kg=design_balance.installed_root_biomass_kg,
            m_star_kg=design_balance.critical_total_root_biomass_kg, k_ratio=final_clog["K_ratio"],
            cumulative_filtered_L=cumq_series[-1], volume_L=design.volume_liters,
            hours_to_ecoli=rem_ecoli, hours_to_ecoli_no_clams=t_meta_ecoli_no_clams,
            hours_to_tss=rem_tss, days_to_maintenance=days_maint,
            sink_shares=build_sink_shares(final_bio, final_karst),
        )

        # Bloque 8: Reproducción inicial vs final/meta (incluyendo latitud regional para ajuste de hemisferio)
        repro_init = block8_reproductive_feasibility(
            species["species_id"], species, sp_params, geom, init_biv, design, resolved["temp_c"], oxy_series[0], nh4_series[0], lat_deg
        )
        repro_final = block8_reproductive_feasibility(
            species["species_id"], species, sp_params, geom, final_biv, design, resolved["temp_c"], oxy_series[-1], nh4_series[-1], lat_deg
        )

        # Slot de controlador electrónico
        ctrl_out = self.controller.compute_setpoints(
            temp_c=resolved["temp_c"],
            oxygen_mg_L=oxy_series[0],
            tss_mg_L=tss_series[0],
            f_deb_rep=repro_init.factors_pct.deb_gonad_energy / 100.0,
            sp_params=sp_params,
            target_oxygen_mg_L=targets.target_oxygen_mg_L,
            target_tss_mg_L=targets.target_tss_mg_L,
            spawning_mode_active=(repro_init.spawning_feasibility_pct >= 75.0),
        )

        # Construcción de serie temporal compacta
        ts_points: List[TimeSeriesPoint] = []
        for idx, t_val in enumerate(times):
            biv_i = block2_bivalve_ecophysiology(
                resolved["temp_c"], tss_series[idx], oxy_series[idx], resolved["f_org"], geom, sp_params, resolved["basal_food_pom"]
            )
            clog_i = block7_kozeny_carman_clogging(
                mdep_series[idx], geom.total_bivalves_n, biv_i["BD_ind_mg_h"], final_karst["r_Ca_g_L_h"], hydro_params, t_val, x_bio_tot
            )
            pct_i = block9_frontend_percentages(
                ecoli_now=ecoli_series[idx], ecoli_init=ecoli_series[0], ecoli_target=targets.target_ecoli_ufc_100mL,
                tss_now=tss_series[idx], tss_init=tss_series[0], tss_target=targets.target_tss_mg_L,
                ammonia_now=nh4_series[idx], ammonia_max_ref=ammonia_max_ref, ammonia_target=targets.target_ammonia_n_mg_L,
                oxygen_now=oxy_series[idx], temp_c=resolved["temp_c"],
                cr_eff=biv_i["CR_eff_L_h_ind"], cr_max=geom.cr_max_L_h_ind, f_tss=biv_i["f_TSS"],
                eta_module=geom.eta_module, m_installed_kg=design_balance.installed_root_biomass_kg,
                m_star_kg=design_balance.critical_total_root_biomass_kg, k_ratio=clog_i["K_ratio"],
                cumulative_filtered_L=cumq_series[idx], volume_L=design.volume_liters,
                hours_to_ecoli=None, hours_to_ecoli_no_clams=None, hours_to_tss=None, days_to_maintenance=days_maint,
                sink_shares={"ammonia": {}, "phosphorus": {}},
            )
            rep_i = block8_reproductive_feasibility(
                species["species_id"], species, sp_params, geom, biv_i, design, resolved["temp_c"], oxy_series[idx], nh4_series[idx], lat_deg
            )
            ts_points.append(
                TimeSeriesPoint(
                    time_h=round(t_val, 2),
                    ecoli_ufc_100mL=round(ecoli_series[idx], 1),
                    tss_mg_L=round(tss_series[idx], 3),
                    ammonia_n_mg_L=round(nh4_series[idx], 4),
                    nitrate_n_mg_L=round(no3_series[idx], 4),
                    phosphate_p_mg_L=round(po4_series[idx], 4),
                    oxygen_mg_L=round(oxy_series[idx], 3),
                    cr_eff_L_h_ind=round(biv_i["CR_eff_L_h_ind"], 4),
                    q_biv_total_L_h=round(biv_i["Q_biv_L_h"], 2),
                    permeability_K_ratio=round(clog_i["K_ratio"], 4),
                    water_health_pct=pct_i.overall_water_health_pct,
                    reproductive_feasibility_pct=rep_i.spawning_feasibility_pct,
                )
            )

        sensitivity: List[SensitivityItem] = []
        if include_sensitivity:
            sensitivity = self.run_sensitivity_ranking(design, water, targets)

        elapsed_ms = (time.perf_counter() - t_start) * 1000.0
        return DigitalTwinSimulationResult(
            geometry=geom,
            design_balance=design_balance,
            current_percentages=current_pct,
            final_percentages=final_pct,
            reproduction_initial=repro_init,
            reproduction_at_target_or_final=repro_final,
            controller_slot=ctrl_out,
            governance=self._build_governance_report(region, species),
            time_series=ts_points,
            sensitivity_ranking=sensitivity,
            solver_backend=solver_name,
            compute_time_ms=round(elapsed_ms, 2),
        )

    @staticmethod
    def _integrate_rk4(rhs, y0: np.ndarray, t_eval: np.ndarray) -> np.ndarray:
        """Integrador RK4 sub-paso (dt_max <= 0.1 h) con preservación estricta de positividad."""
        n_steps = len(t_eval)
        out = np.zeros((len(y0), n_steps), dtype=float)
        y = np.maximum(0.0, y0.copy())
        out[:, 0] = y
        for idx in range(1, n_steps):
            t_cur = float(t_eval[idx - 1])
            t_next = float(t_eval[idx])
            sub = max(1, int(math.ceil((t_next - t_cur) / 0.1)))
            h = (t_next - t_cur) / sub
            for s in range(sub):
                tc = t_cur + s * h
                k1 = rhs(tc, y)
                k2 = rhs(tc + 0.5 * h, np.maximum(0.0, y + 0.5 * h * k1))
                k3 = rhs(tc + 0.5 * h, np.maximum(0.0, y + 0.5 * h * k2))
                k4 = rhs(tc + h, np.maximum(0.0, y + h * k3))
                y = np.maximum(0.0, y + (h / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4))
            out[:, idx] = y
        return out

    @staticmethod
    def _estimate_days_to_clogging(
        m_dep_now: float,
        t_now_h: float,
        n_total: int,
        bd_ind_mg_h: float,
        r_ca_g_L_h: float,
        hydro_params: Dict[str, float],
    ) -> float:
        """Proyecta en cuántos días K(t)/K_0 caerá por debajo de 0.45 (umbral de mantenimiento)."""
        if n_total == 0 and r_ca_g_L_h <= 1e-9:
            return 365.0
        m_dep = m_dep_now
        t_h = t_now_h
        dt_h = 6.0
        max_h = 365.0 * 24.0
        while t_h < max_h:
            res = block7_kozeny_carman_clogging(m_dep, n_total, bd_ind_mg_h, r_ca_g_L_h, hydro_params, t_h)
            if res["K_ratio"] <= 0.45:
                return max(0.0, (t_h - t_now_h) / 24.0)
            m_dep = max(0.0, m_dep + dt_h * res["d_m_dep_mg_h"])
            t_h += dt_h
        return 365.0

    def assimilate_iot_reading(self, req: IoTAssimilationRequest) -> DigitalTwinSimulationResult:
        """
        Paso de asimilación tipo Kalman (x_est = x_pred + K*(x_obs - x_pred)) sobre las lecturas IoT,
        seguido de una proyección futura para entregar porcentajes actualizados de todo el cuerpo de agua.
        """
        region = load_region_profile(req.design.region_id)
        pred = SoftSensorKarstMapper.resolve_water_inputs(req.predicted_state, region)
        obs = SoftSensorKarstMapper.resolve_water_inputs(req.sensor_reading, region)
        k_gain = req.kalman_gain

        def fuse(key: str) -> float:
            return pred[key] + k_gain * (obs[key] - pred[key])

        assimilated_water = WaterInitialAndIoTInput(
            temp_c=fuse("temp_c"),
            ph=fuse("ph"),
            dissolved_oxygen_mg_L=fuse("oxygen"),
            tss_mg_L=fuse("tss"),
            organic_fraction_tss=req.sensor_reading.organic_fraction_tss,
            pathogen_ecoli_ufc_100mL=fuse("ecoli"),
            ammonia_n_mg_L=fuse("nh4"),
            nitrate_n_mg_L=fuse("no3"),
            phosphate_p_mg_L=fuse("po4"),
            calcium_mg_L=fuse("calcium"),
            bicarbonate_mg_L=fuse("bicarbonate"),
            par_light_umol_m2_s=fuse("par_light"),
            nitrifier_biomass_mg_L=req.sensor_reading.nitrifier_biomass_mg_L,
        )
        return self.run_simulation(req.design, assimilated_water, req.targets, include_sensitivity=False)

    def run_sensitivity_ranking(
        self,
        design: VisualDesignInput,
        water: WaterInitialAndIoTInput,
        targets: SimulationTargetsInput,
    ) -> List[SensitivityItem]:
        """Análisis de sensibilidad local (+10%) sobre el solucionador real para priorizar bioensayos."""
        region = load_region_profile(design.region_id)
        species = load_species_profile(design.species_id)
        base_res = self._run_with_profiles(design, water, targets, region, species, include_sensitivity=False)
        base_t = base_res.current_percentages.estimated_hours_to_ecoli_target or targets.horizon_hours
        base_m = max(0.01, base_res.design_balance.critical_total_root_biomass_kg)

        candidates = [
            ("species", "a_CR", "Tasa máxima de aclaramiento (a_CR)"),
            ("species", "TSS_50_mg_L", "Tolerancia branquial a turbidez (TSS_50)"),
            ("species", "alpha_hidr_N", "Fracción de amonio por hidrólisis de biodepósitos"),
            ("species", "O_N_atomic_ratio", "Relación atómica excreción (O:N)"),
            ("species", "eta_ret_bact", "Eficiencia de retención bacteriana (eta_ret)"),
            ("cwm1_bacteria", "f_XA_active", "Fracción activa nitrificante CWM1 (f_XA)"),
            ("macrophytes", "mu_SG_N_mg_g_h", "Tasa específica absorción radicular (mu_SG)"),
        ]

        ranking: List[SensitivityItem] = []
        for group, key, label in candidates:
            reg_mod = {k: (dict(v) if isinstance(v, dict) else v) for k, v in region.items()}
            sp_mod_profile = {k: (dict(v) if isinstance(v, dict) else v) for k, v in species.items()}

            if group == "species":
                sp_mod_profile["parameters"][key] *= 1.10
            else:
                reg_mod[group][key] *= 1.10

            pert_res = self._run_with_profiles(design, water, targets, reg_mod, sp_mod_profile, include_sensitivity=False)
            pert_t = pert_res.current_percentages.estimated_hours_to_ecoli_target or targets.horizon_hours
            pert_m = pert_res.design_balance.critical_total_root_biomass_kg

            delta_t = ((pert_t - base_t) / max(0.01, base_t)) * 100.0
            delta_m = ((pert_m - base_m) / base_m) * 100.0
            ranking.append(
                SensitivityItem(
                    parameter=key,
                    label=label,
                    delta_t_meta_pct=round(delta_t, 2),
                    delta_m_star_pct=round(delta_m, 2),
                )
            )

        ranking.sort(key=lambda x: abs(x.delta_t_meta_pct) + abs(x.delta_m_star_pct), reverse=True)
        return ranking
