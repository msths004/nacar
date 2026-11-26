"""
Implementación explícita de los Bloques Matemáticos 1 a 9 del Gemelo Digital NÁCAR.

Cada función aquí contenida es pura (sin estado mutable), lee sus constantes desde los
cartuchos externos de especie (Theta_sp) y región (Omega_reg), y corresponde exactamente
a las ecuaciones numeradas en `Modelación de Biofiltración en Yucatán.pdf`.
"""

import math
from typing import Any, Dict, Optional

from models import (
    FrontendPercentagesSummary,
    ModuleGeometrySummary,
    ReproductiveFactorBreakdown,
    ReproductiveFeasibilityReport,
    SymbioticBiomassDesignReport,
    VisualDesignInput,
)

# Constantes físicas universales (pesos atómicos IUPAC y relación hexagonal)
_HEX_PACKING_CONST = 0.9523  # sqrt(pi / (2 * sqrt(3)))
_ATOMIC_N_OVER_O = 14.007 / 15.999


def _clip(val: float, low: float, high: float) -> float:
    return max(low, min(high, float(val)))


def saturation_oxygen_mg_L(temp_c: float) -> float:
    """Concentración de saturación de oxígeno disuelto S_O,sat(T) [mg/L] (fórmula APHA dulceacuícola)."""
    t_k = temp_c + 273.15
    ln_c = (
        -139.34411
        + (1.575701e5 / t_k)
        - (6.642308e7 / (t_k ** 2))
        + (1.243800e10 / (t_k ** 3))
        - (8.621949e11 / (t_k ** 4))
    )
    return math.exp(ln_c)


# =============================================================================
# BLOQUE 1: Geometría del módulo tipo linterna e interferencia espacial (Ec. 1.1-1.2)
# =============================================================================

def block1_module_geometry(
    design: VisualDesignInput,
    sp_params: Dict[str, float],
) -> ModuleGeometrySummary:
    """Calcula n, distancia media en bandeja d_almejas, eta_mod y alometría basal CR_max (Ec. 1.1, 1.2, 2.1)."""
    n_total = design.num_modules * design.trays_per_module * design.clams_per_tray
    if design.clam_spacing_override_cm is not None:
        d_clams = design.clam_spacing_override_cm
    elif design.clams_per_tray > 0:
        d_clams = _HEX_PACKING_CONST * design.tray_diameter_cm / math.sqrt(design.clams_per_tray)
    else:
        d_clams = design.tray_diameter_cm

    free_gap = max(0.1, d_clams - design.shell_length_mm / 10.0)
    shell_cm = design.shell_length_mm / 10.0
    l_siphon = max(0.2, sp_params["gamma_sif"] * shell_cm)
    l_jet = max(0.5, sp_params["gamma_jet"] * shell_cm)

    alpha_h = 0.55
    alpha_v = 0.35
    eta_h = 1.0 - alpha_h * math.exp(-d_clams / l_siphon)
    if design.trays_per_module > 1 and design.num_modules > 0 and design.clams_per_tray > 0:
        v_jet = max(0.1, sp_params["v_jet_cm_s"])
        eta_v = 1.0 - alpha_v * (1.0 - 1.0 / design.trays_per_module) * math.exp(
            -design.tray_vertical_spacing_cm * (1.0 + design.crossflow_vel_cm_s / v_jet) / l_jet
        )
    else:
        eta_v = 1.0

    eta_mod = _clip(eta_h * eta_v, 0.05, 1.0)
    depth_m = design.volume_liters / (1000.0 * design.wetland_area_m2)

    w_afdw = sp_params["a_W"] * (design.shell_length_mm ** sp_params["b_W"])
    cr_max = sp_params["a_CR"] * (w_afdw ** sp_params["b_CR"])

    return ModuleGeometrySummary(
        total_bivalves_n=n_total,
        clam_spacing_cm=round(d_clams, 3),
        free_shell_gap_cm=round(free_gap, 3),
        eta_horizontal=round(eta_h, 4),
        eta_vertical=round(eta_v, 4),
        eta_module=round(eta_mod, 4),
        spatial_efficiency_pct=round(eta_mod * 100.0, 2),
        water_depth_m=round(depth_m, 3),
        wetland_volume_L=design.volume_liters,
        shell_afdw_g_ind=round(w_afdw, 4),
        cr_max_L_h_ind=round(cr_max, 4),
    )


# =============================================================================
# BLOQUE 2: Ecofisiología, filtración y excreción de bivalvos (Ec. 2.1-2.5)
# =============================================================================

def block2_bivalve_ecophysiology(
    temp_c: float,
    tss_mg_L: float,
    oxygen_mg_L: float,
    f_org: float,
    geom: ModuleGeometrySummary,
    sp_params: Dict[str, float],
    basal_food_pom_mg_L: float = 1.5,
) -> Dict[str, float]:
    """Evalúa CR_ef, Q_biv, pseudoheces PsR, heces ER, respiración OCR y excreción E_N, E_P (Ec. 2.1-2.5)."""
    tss = max(0.0, tss_mg_L)
    s_o = max(0.0, oxygen_mg_L)

    f_t_gauss = math.exp(-(((temp_c - sp_params["T_opt_C"]) / sp_params["dT_tol_C"]) ** 2))
    f_t_heat = 1.0 / (1.0 + math.exp(_clip(sp_params["gamma_heat"] * (temp_c - sp_params["T_crit_C"]), -40.0, 40.0)))
    f_t = f_t_gauss * f_t_heat

    f_tss = 1.0 / (1.0 + (tss / max(1e-6, sp_params["TSS_50_mg_L"])) ** sp_params["p_sat"])
    f_do = s_o / (s_o + max(1e-6, sp_params["K_O_biv_mg_L"]))

    cr_eff = geom.cr_max_L_h_ind * f_t * f_tss * f_do * geom.eta_module
    q_biv_total = geom.total_bivalves_n * cr_eff

    fr = cr_eff * tss
    tpm_crit = sp_params["TPM_crit_mg_L"]
    if tss <= tpm_crit:
        pf = 0.0
    else:
        pf = sp_params["PF_max"] * (1.0 - math.exp(-sp_params["k_pf"] * (tss - tpm_crit)))

    psr = fr * pf
    ir = fr * (1.0 - pf)
    ae = sp_params["AE_conover"]
    # Incluye el seston/fitoplancton basal natural cuando el agua se clarifica (evita ayuno artificial a TSS -> 0)
    pom_ingested = max(f_org * ir, cr_eff * max(0.0, basal_food_pom_mg_L))
    ar = pom_ingested * ae
    er = ir * (1.0 - f_org * ae)
    bd_ind = psr + er

    # Ec. 2.5 exacta del PDF: OCR = (0.6 * AR * mu_POM + f_basal(T) * W_AFDW^0.75) / E_O2
    e_o2 = max(1e-6, sp_params["E_O2_J_mg"])
    f_basal_j = sp_params["f_basal_O2"] * (1.07 ** (temp_c - 25.0)) * (geom.shell_afdw_g_ind ** 0.75)
    sda_j = sp_params["sda_catabolic_fraction"] * ar * sp_params["mu_POM_J_mg"]
    ocr = (sda_j + f_basal_j) / e_o2

    aer = ocr * _ATOMIC_N_OVER_O / max(1.0, sp_params["O_N_atomic_ratio"])
    e_n_tot = aer + sp_params["alpha_hidr_N"] * f_org * bd_ind
    e_p_tot = sp_params["alpha_hidr_P"] * f_org * bd_ind

    return {
        "f_T": f_t,
        "f_TSS": f_tss,
        "f_DO": f_do,
        "CR_eff_L_h_ind": cr_eff,
        "Q_biv_L_h": q_biv_total,
        "FR_mg_h_ind": fr,
        "PF_frac": pf,
        "PsR_mg_h_ind": psr,
        "IR_mg_h_ind": ir,
        "AR_mg_h_ind": ar,
        "ER_mg_h_ind": er,
        "BD_ind_mg_h": bd_ind,
        "OCR_mg_O2_h_ind": ocr,
        "AER_mg_N_h_ind": aer,
        "E_N_tot_mg_N_h_ind": e_n_tot,
        "E_P_tot_mg_P_h_ind": e_p_tot,
    }


# =============================================================================
# BLOQUE 3: Sinergia macrófitas - bacterias CWM1 en rizosfera (Ec. 3.1-3.3)
# =============================================================================

def block3_macrophyte_bacteriome(
    design: VisualDesignInput,
    temp_c: float,
    par_light: float,
    s_nh: float,
    s_no: float,
    s_po4: float,
    s_o: float,
    x_a: float,
    mac_params: Dict[str, float],
    cwm1_params: Dict[str, float],
) -> Dict[str, float]:
    """Calcula absorción radicular directa R_mac y nitrificación bacteriana amplificada R_bact."""
    m_kg = (
        design.macrophyte_root_biomass_override_kg
        if design.macrophyte_root_biomass_override_kg is not None
        else mac_params["rho_root_kg_m2"] * design.macrophyte_area_m2
    )
    m_g = m_kg * 1000.0

    f_light = 0.25 + 0.75 * (par_light / (par_light + mac_params["k_light_half_sat"])) if par_light >= 0 else 0.25
    theta_mac = 1.05 ** (temp_c - 25.0)
    nh = max(0.0, s_nh)
    no = max(0.0, s_no)
    po4 = max(0.0, s_po4)
    oxy = max(0.0, s_o)

    monod_mac_nh = nh / (nh + mac_params["k_SG_N_mg_L"])
    monod_mac_no = (no / (no + mac_params["k_SG_N_mg_L"])) * (mac_params["k_SG_N_mg_L"] / (nh + mac_params["k_SG_N_mg_L"]))
    monod_mac_p = po4 / (po4 + mac_params["k_SG_P_mg_L"])

    spec_mac_nh = mac_params["mu_SG_N_mg_g_h"] * 1000.0 * f_light * theta_mac * monod_mac_nh
    r_mac_nh = m_kg * spec_mac_nh
    r_mac_no = m_g * mac_params["mu_SG_N_mg_g_h"] * f_light * theta_mac * monod_mac_no
    r_mac_p = m_g * mac_params["mu_SG_P_mg_g_h"] * f_light * theta_mac * monod_mac_p

    # Amplificación rizosférica por exudación radicular de carbono lábil (Ec. 3.3)
    ex_conc = cwm1_params["rho_ex_mg_kg"] * (m_kg / design.volume_liters)
    phi_riz = 1.0 + (cwm1_params["nu_N_exudate"] * ex_conc) / (ex_conc + cwm1_params["k_GN_mg_L"])

    mu_max_a_t = cwm1_params["mu_max_A_25C_h"] * (1.072 ** (temp_c - 25.0))
    monod_bact_nh = (nh / (nh + cwm1_params["k_SC_N_mg_L"])) * (oxy / (oxy + cwm1_params["K_O_A_mg_L"]))
    x_a_eff = max(0.0, x_a) * cwm1_params["f_XA_active"]
    r_bact_nh = design.volume_liters * mu_max_a_t * x_a_eff * monod_bact_nh * phi_riz

    return {
        "m_root_kg": m_kg,
        "f_light": f_light,
        "theta_mac": theta_mac,
        "phi_rizosfera": phi_riz,
        "spec_mac_NH_mg_kg_h": spec_mac_nh,
        "R_mac_NH_mg_h": r_mac_nh,
        "R_mac_NO_mg_h": r_mac_no,
        "R_mac_P_mg_h": r_mac_p,
        "R_bact_NH_mg_h": r_bact_nh,
    }


# =============================================================================
# BLOQUE 4: Geoquímica kárstica y coprecipitación calcita-fósforo (Ec. 4.1)
# =============================================================================

def block4_karst_geochemistry(
    volume_L: float,
    temp_c: float,
    ph: float,
    ca_mg_L: float,
    hco3_mg_L: float,
    s_po4_mg_L: float,
    karst_params: Dict[str, float],
) -> Dict[str, float]:
    """
    Calcula SI_c y R_calcita_P.
    Regla de escalabilidad global: si el agua no está sobresaturada en calcita (SI_c <= 0),
    r_Ca y R_calcita_P se anulan exactamente (0.0), transfiriendo la remoción de P a plantas y bacterias.
    """
    ca_safe = max(0.1, ca_mg_L)
    hco3_safe = max(0.1, hco3_mg_L)

    # Aproximación Langelier modificada para sistemas bicarbonatados dulces (20-35 degC)
    p_ca = 4.60 - math.log10(ca_safe)
    p_alk = 4.78 - math.log10(hco3_safe)
    c_temp = 2.15 - 0.014 * temp_c
    ph_sat = p_ca + p_alk + c_temp

    si_c = ph - ph_sat
    if si_c <= 0.0:
        r_ca = 0.0
        r_calcita_p = 0.0
    else:
        r_ca = karst_params["k_calc_precip"] * (10.0 ** min(si_c, 1.5) - 1.0)
        r_calcita_p = volume_L * r_ca * (karst_params["y_p_per_ca_coeff"] * max(0.0, s_po4_mg_L))

    return {
        "ph_sat": ph_sat,
        "SI_c": si_c,
        "r_Ca_g_L_h": r_ca,
        "R_calcita_P_mg_h": r_calcita_p,
    }


# =============================================================================
# BLOQUE 5: Balance de masa para biomasa crítica de macrófitas m* (Ec. 5.1-5.2)
# =============================================================================

def block5_critical_macrophyte_biomass(
    design: VisualDesignInput,
    geom: ModuleGeometrySummary,
    biv_at_clean_tss: Dict[str, float],
    temp_c: float,
    par_light: float,
    s_o: float,
    x_a: float,
    target_nh4_mg_L: float,
    inflow_nh4_mg_L: float,
    mac_params: Dict[str, float],
    cwm1_params: Dict[str, float],
) -> SymbioticBiomassDesignReport:
    """
    Implementa el despeje explícito de tu ecuación de balance de masa evaluado en S_NH,meta,
    tanto por módulo tipo linterna individual como para el humedal completo.
    """
    bio_eval = block3_macrophyte_bacteriome(
        design=design,
        temp_c=temp_c,
        par_light=par_light,
        s_nh=target_nh4_mg_L,
        s_no=0.0,
        s_po4=0.0,
        s_o=s_o,
        x_a=x_a,
        mac_params=mac_params,
        cwm1_params=cwm1_params,
    )

    m_installed = bio_eval["m_root_kg"]
    area_installed = design.macrophyte_area_m2
    rho_root = max(0.05, mac_params["rho_root_kg_m2"])
    spec_mac_rate = max(1e-6, bio_eval["spec_mac_NH_mg_kg_h"])
    r_bact_at_target = bio_eval["R_bact_NH_mg_h"]

    biv_nh4_load = geom.total_bivalves_n * biv_at_clean_tss["E_N_tot_mg_N_h_ind"]
    ext_nh4_load = design.inflow_L_h * inflow_nh4_mg_L
    net_needed_for_plants = max(0.0, ext_nh4_load + biv_nh4_load - r_bact_at_target)

    m_star_total = net_needed_for_plants / spec_mac_rate
    area_star_total = m_star_total / rho_root

    # Balance por un solo módulo tipo linterna (sin dilución de carga externa; fracción proporcional de rizosfera)
    clams_per_module = design.trays_per_module * design.clams_per_tray
    module_nh4_load = clams_per_module * biv_at_clean_tss["E_N_tot_mg_N_h_ind"]
    bact_per_module_share = r_bact_at_target / max(1, design.num_modules)
    m_star_module = max(0.0, module_nh4_load - bact_per_module_share) / spec_mac_rate
    area_star_module = m_star_module / rho_root

    if m_star_total <= 1e-9:
        ratio = 1.50
    else:
        ratio = m_installed / m_star_total

    if ratio >= 1.10:
        status = "SUPERAVIT_OPTIMO"
        rec = (
            f"Equilibrio seguro (+{round((ratio - 1.0) * 100.0, 1)}% de margen): las raíces y biopelícula "
            f"absorben toda la secreción de los {geom.total_bivalves_n} bivalvos."
        )
    elif ratio >= 0.95:
        status = "EQUILIBRIO_AJUSTADO"
        rec = (
            "Sistema en el límite de equilibrio: conviene añadir ~10-15% extra de área vegetal "
            "para amortiguar picos nocturnos sin fotosíntesis."
        )
    else:
        deficit_kg = max(0.0, m_star_total - m_installed)
        deficit_m2 = deficit_kg / rho_root
        status = "DEFICIT_AMONIO"
        rec = (
            f"Déficit de macrófitas: faltan al menos {deficit_kg:.2f} kg MS de raíces "
            f"({deficit_m2:.2f} m^2) para evitar acumulación de amonio secretado por las almejas."
        )

    return SymbioticBiomassDesignReport(
        installed_root_biomass_kg=round(m_installed, 3),
        installed_macrophyte_area_m2=round(area_installed, 3),
        critical_total_root_biomass_kg=round(m_star_total, 3),
        critical_total_macrophyte_area_m2=round(area_star_total, 3),
        critical_root_biomass_per_module_kg=round(m_star_module, 3),
        critical_area_per_module_m2=round(area_star_module, 3),
        ammonia_load_from_bivalves_mg_N_h=round(biv_nh4_load, 3),
        external_ammonia_load_mg_N_h=round(ext_nh4_load, 3),
        bacteriome_sink_at_target_mg_N_h=round(r_bact_at_target, 3),
        macrophyte_specific_rate_at_target_mg_N_kg_h=round(spec_mac_rate, 3),
        balance_status=status,
        recommendation=rec,
    )


# =============================================================================
# BLOQUE 6: EDOs de calidad del agua, patógenos y tiempo a meta (Ec. 6.1-6.5)
# =============================================================================

def block6_pathogen_and_water_odes(
    state: Dict[str, float],
    design: VisualDesignInput,
    geom: ModuleGeometrySummary,
    biv: Dict[str, float],
    bio: Dict[str, float],
    karst: Dict[str, float],
    inflow_conc: Dict[str, float],
    temp_c: float,
    par_light: float,
    mac_params: Dict[str, float],
    cwm1_params: Dict[str, float],
    hydro_params: Dict[str, float],
    sp_params: Dict[str, float],
    kLa_h: float,
    x_h_mg_L: float = 15.0,
    s_f_mg_L: float = 6.0,
    s_a_mg_L: float = 3.0,
    x_s_mg_L: float = 8.0,
) -> Dict[str, float]:
    """
    Evalúa el vector de derivadas temporales [dX_pat/dt, dTSS/dt, dS_NH/dt, dS_NO/dt, dS_PO4/dt, dS_O/dt]
    y la tasa instantánea k_total,bact para abatimiento de coliformes / E. coli (Ec. 6.1-6.5).
    """
    v_L = design.volume_liters
    q_in = design.inflow_L_h
    n_tot = geom.total_bivalves_n
    m_kg = bio["m_root_kg"]

    x_pat = max(0.0, state["ecoli"])
    tss = max(0.0, state["tss"])
    s_nh = max(0.0, state["nh4"])
    s_no = max(0.0, state["no3"])
    s_po4 = max(0.0, state["po4"])
    s_o = max(0.0, state["oxygen"])

    # Ec. 6.1: Bacterias patógenas (salida terminal dependiente de Q_biv y rizosfera)
    k_biv_bact = (sp_params["eta_ret_bact"] * biv["Q_biv_L_h"]) / v_L
    k_uv = cwm1_params["k_uv_par_coeff"] * max(0.0, par_light)
    k_riz_bact = mac_params["k_riz_pat_L_kg_h"] * (m_kg / v_L)
    k_d_nat = cwm1_params["k_d_nat_25C_h"] * (1.04 ** (temp_c - 25.0))
    k_total_bact = k_biv_bact + k_uv + k_riz_bact + k_d_nat
    d_ecoli = (q_in / v_L) * (inflow_conc["ecoli"] - x_pat) - k_total_bact * x_pat

    # Ec. 6.2: Turbidez / TSS (bombeo de bivalvos + sedimentación abiótica)
    k_tss_biv = biv["Q_biv_L_h"] / v_L
    k_tss_sed = hydro_params["v_sed_m_h"] / max(0.1, geom.water_depth_m)
    d_tss = (q_in / v_L) * (inflow_conc["tss"] - tss) - (k_tss_biv + k_tss_sed) * tss

    # Ec. 6.3: Amonio S_NH y Nitratos S_NO (acoplamiento bivalvo <-> macrófita <-> nitrificación/desnitrificación CWM1)
    d_nh4 = (
        (q_in / v_L) * (inflow_conc["nh4"] - s_nh)
        + (n_tot * biv["E_N_tot_mg_N_h_ind"]) / v_L
        - (bio["R_mac_NH_mg_h"] + bio["R_bact_NH_mg_h"]) / v_L
    )
    # Sustrato lábil disponible CWM1 (S_F + S_A + hidrólisis lenta de X_S) y biomasa heterótrofa X_H
    cod_labile = max(0.0, s_f_mg_L) + max(0.0, s_a_mg_L) + 0.15 * max(0.0, x_s_mg_L)
    monod_cod = cod_labile / (cod_labile + 4.0)
    x_h_factor = max(0.1, x_h_mg_L / 15.0)
    k_denit = 0.008 * bio["phi_rizosfera"] * x_h_factor * monod_cod * (0.2 / (0.2 + max(0.0, s_o) * 0.15))
    d_no3 = (
        (q_in / v_L) * (inflow_conc["no3"] - s_no)
        + (bio["R_bact_NH_mg_h"] - bio["R_mac_NO_mg_h"]) / v_L
        - k_denit * s_no
    )

    # Ec. 6.4: Ortofosfatos S_PO4 (excreción vs plantas + coprecipitación kárstica calcita-P)
    d_po4 = (
        (q_in / v_L) * (inflow_conc["po4"] - s_po4)
        + (n_tot * biv["E_P_tot_mg_P_h_ind"]) / v_L
        - (bio["R_mac_P_mg_h"] + karst["R_calcita_P_mg_h"]) / v_L
    )

    # Ec. 6.5: Oxígeno disuelto S_O con respiración heterótrofa R_resp,het dependiente de X_H y S_F/S_A/X_S
    o2_sat = saturation_oxygen_mg_L(temp_c)
    o2_photo = mac_params["r_O2_root_mg_kg_h"] * m_kg * bio["f_light"]
    o2_biv_resp = n_tot * biv["OCR_mg_O2_h_ind"]
    o2_nitrif = 4.57 * bio["R_bact_NH_mg_h"]
    monod_o2_het = s_o / (s_o + 0.2)
    r_resp_het_cwm1 = v_L * 0.0022 * max(0.0, x_h_mg_L) * monod_cod * monod_o2_het
    o2_benthic = 0.15 * n_tot * biv["E_N_tot_mg_N_h_ind"] * 4.57
    r_resp_het = r_resp_het_cwm1 + o2_benthic
    d_o2 = kLa_h * (o2_sat - s_o) + (o2_photo - o2_biv_resp - o2_nitrif - r_resp_het) / v_L

    return {
        "d_ecoli": d_ecoli,
        "d_tss": d_tss,
        "d_nh4": d_nh4,
        "d_no3": d_no3,
        "d_po4": d_po4,
        "d_oxygen": d_o2,
        "k_total_bact_h": k_total_bact,
        "k_no_clams_bact_h": k_uv + k_riz_bact + k_d_nat,
    }


# =============================================================================
# BLOQUE 7: Acumulación en bandejas y colmatación Kozeny-Carman (Ec. 7.1)
# =============================================================================

def block7_kozeny_carman_clogging(
    m_dep_mg: float,
    n_total: int,
    bd_ind_mg_h: float,
    r_ca_g_L_h: float,
    hydro_params: Dict[str, float],
    t_hours: float,
    x_bio_total_mg_L: float = 27.0,
) -> Dict[str, float]:
    """Calcula dM_dep/dt en bandejas, los 3 términos de pérdida de porosidad (bio, chem, dep) y K(t)/K_0 (Ec. 7.1)."""
    d_m_dep = (
        hydro_params["beta_ret_tray"] * n_total * bd_ind_mg_h
        - hydro_params["k_hidr_dep_h"] * max(0.0, m_dep_mg)
    )
    phi_0 = hydro_params["phi_0_bed"]
    v_por = max(1.0, hydro_params["V_poroso_L"])
    rho_dep = max(1.0, hydro_params["rho_dep_mg_L"])

    # Ec. 7.1 explícita del PDF: phi(t) = phi_0 - Delta_n_bio(t) - Delta_n_chem(t) - M_dep(t)/(rho_dep * V_poroso)
    bio_rate = hydro_params.get("biofilm_clog_rate_h", 0.00008)
    delta_n_bio = min(0.08 * phi_0, bio_rate * (max(0.0, x_bio_total_mg_L) / 27.0) * max(0.0, t_hours))
    delta_n_chem = 0.000025 * r_ca_g_L_h * 1000.0 * max(0.0, t_hours)
    delta_n_dep = max(0.0, m_dep_mg) / (rho_dep * v_por)
    phi_t = _clip(phi_0 - delta_n_bio - delta_n_chem - delta_n_dep, 0.12 * phi_0, phi_0)

    k_ratio = ((phi_t / phi_0) ** 3) * (((1.0 - phi_0) / max(1e-4, 1.0 - phi_t)) ** 2)
    return {
        "d_m_dep_mg_h": d_m_dep,
        "delta_n_bio": delta_n_bio,
        "delta_n_chem": delta_n_chem,
        "delta_n_dep": delta_n_dep,
        "phi_t": phi_t,
        "K_ratio": _clip(k_ratio, 0.0, 1.0),
    }


# =============================================================================
# BLOQUE 8: Especie y Factibilidad de Reproducción DEB (Ec. 8.1-8.4)
# =============================================================================

def block8_reproductive_feasibility(
    species_id: str,
    species_meta: Dict[str, Any],
    sp_params: Dict[str, float],
    geom: ModuleGeometrySummary,
    biv_rates: Dict[str, float],
    design: VisualDesignInput,
    temp_c: float,
    oxygen_mg_L: float,
    ammonia_n_mg_L: float,
    latitude_deg: float = 20.97,
) -> ReproductiveFeasibilityReport:
    """Evalúa factibilidad de maduración, desove y fertilización (0-100%) y factor limitante (Ec. 8.1-8.4)."""
    # 1. Energía gonadal DEB bajo regla-kappa (Ec. 8.1)
    p_a = sp_params["mu_POM_J_mg"] * biv_rates["AR_mg_h_ind"]
    t_k = temp_c + 273.15
    arrh = math.exp((sp_params["T_A_arrhenius_K"] / 293.15) - (sp_params["T_A_arrhenius_K"] / t_k))
    p_m = sp_params["p_M_vol_J_g_h"] * geom.shell_afdw_g_ind * arrh
    kappa = sp_params["kappa_deb"]
    p_r = max(0.0, (1.0 - kappa) * p_a - ((1.0 - kappa) / kappa) * p_m - sp_params["c_clean_PsR_J_mg"] * biv_rates["PsR_mg_h_ind"])
    f_deb_rep = p_r / (p_r + max(1e-6, sp_params["K_R_gonad_J_h"]))

    # 2. Talla, época anual (Ec. 8.2 exacta con divisor 12 y ajuste de hemisferio sur) y ventana térmica
    f_talla = 1.0 / (1.0 + math.exp(_clip(-0.35 * (design.shell_length_mm - sp_params["L_p_maturity_mm"]), -30.0, 30.0)))
    hemisphere_shift = 6.0 if (latitude_deg is not None and latitude_deg < 0.0) else 0.0
    effective_peak = ((sp_params["tau_peak_month"] - 1.0 + hemisphere_shift) % 12.0) + 1.0
    phase_diff = abs(design.month_of_year - effective_peak)
    phase_diff = min(phase_diff, 12.0 - phase_diff)
    b_basal = sp_params["b_basal_season"]
    # Ec. 8.2 exacta del PDF: cos^2(pi * (tau_mes - tau_pico) / 12)
    f_epoca = b_basal + (1.0 - b_basal) * (math.cos(math.pi * phase_diff / 12.0) ** 2)

    f_t_rep = math.exp(-(((temp_c - sp_params["T_rep_opt_C"]) / max(0.5, sp_params["dT_rep_C"])) ** 4))

    # 3. Seguridad química del marsupio branquial grávido (Ec. 8.2)
    s_o = max(0.0, oxygen_mg_L)
    s_nh = max(0.0, ammonia_n_mg_L)
    f_quim_rep = (s_o ** 2 / (s_o ** 2 + sp_params["K_O_rep_mg_L"] ** 2)) * (
        sp_params["K_NH_rep_mg_L"] / (s_nh + sp_params["K_NH_rep_mg_L"])
    )

    # 4. Proximidad espermática en bandeja modulada por corriente cruzada v_x: L_esperma(v_x) (Ec. 8.3)
    if geom.total_bivalves_n < 2:
        f_fert = 0.0
    else:
        v_x = max(0.0, design.crossflow_vel_cm_s)
        # Flujo suave extiende la pluma espermática; exceso de corriente (>4 cm/s) la diluye/barre
        flow_mod = (1.0 + 0.22 * min(v_x, 3.0)) / (1.0 + 0.12 * max(0.0, v_x - 3.0) ** 1.5)
        l_sperm_vx = max(1.0, sp_params["L_sperm_cm"] * flow_mod)
        d_excess = max(0.0, geom.clam_spacing_cm - sp_params["d_opt_fert_cm"])
        f_fert = math.exp(-((d_excess / l_sperm_vx) ** 2)) * (
            1.0 - math.exp(-geom.clam_spacing_cm / max(0.2, sp_params["d_min_crowd_cm"]))
        )

    factors = {
        "size_maturity": f_talla,
        "season_synchrony": f_epoca,
        "thermal_window": f_t_rep,
        "deb_gonad_energy": f_deb_rep,
        "marsupial_water_safety": f_quim_rep,
        "tray_fertilization_proximity": f_fert,
    }
    product = max(1e-12, f_talla * f_epoca * f_t_rep * f_deb_rep * f_quim_rep * f_fert)
    feasibility_pct = 0.0 if min(factors.values()) <= 1e-6 else _clip(100.0 * (product ** 0.45), 0.0, 100.0)

    labels = {
        "size_maturity": f"Madurez por talla (L={design.shell_length_mm:.0f} mm vs Lp={sp_params['L_p_maturity_mm']:.0f} mm)",
        "season_synchrony": f"Sincronía con época del año (mes {design.month_of_year})",
        "thermal_window": f"Ventana térmica reproductiva (T={temp_c:.1f} °C)",
        "deb_gonad_energy": "Energía gonadal DEB (descontando gasto de pseudoheces por turbidez)",
        "marsupial_water_safety": f"Seguridad del marsupio branquial (OD={s_o:.1f} mg/L, Amonio={s_nh:.2f} mg/L)",
        "tray_fertilization_proximity": f"Proximidad de fecundación en bandeja (d={geom.clam_spacing_cm:.1f} cm)",
    }

    limiting_key = min(factors, key=lambda k: factors[k])
    actions = {
        "size_maturity": f"Introducir ejemplares adultos >= {sp_params['L_p_maturity_mm']:.0f} mm de concha.",
        "season_synchrony": f"Mes pico natural de la especie: mes {int(sp_params['tau_peak_month'])}; esperar temporada o simular fotoperiodo.",
        "thermal_window": f"Regular temperatura hacia el óptimo reproductivo ({sp_params['T_rep_opt_C']:.1f} °C) con sombra o enfriamiento.",
        "deb_gonad_energy": "Esperar a que los módulos abatan la turbidez (TSS) o suplementar microalgas para elevar energía gonadal.",
        "marsupial_water_safety": "Incrementar aireación (OD >= 5.5 mg/L) o reforzar macrófitas para abatir amonio antes de inducir desove.",
        "tray_fertilization_proximity": f"Ajustar separación en la bandeja circular cerca de {sp_params['d_opt_fert_cm']:.1f} cm y asegurar >= 2 individuos.",
    }

    facilitating = [f"{labels[k]}: {v * 100.0:.0f}%" for k, v in factors.items() if v >= 0.78]
    hindering = [f"{labels[k]}: {v * 100.0:.0f}%" for k, v in factors.items() if v < 0.70]

    if feasibility_pct >= 75.0:
        cat = "ALTA"
        stage = "Condición favorable para gametogénesis, fecundación en bandeja e incubación marsupial."
    elif feasibility_pct >= 45.0:
        cat = "MODERADA"
        stage = "Reproducción parcialmente restringida; conviene corregir el factor limitante antes de inducir desove."
    else:
        cat = "BAJA_O_INHIBIDA"
        stage = "Condiciones adversas o individuos inmaduros: baja probabilidad de desove o riesgo de aborto branquial."

    if species_meta.get("requires_host_fish_for_recruitment", True):
        recr_note = (
            f"Este porcentaje mide el éxito de desove, fecundación e incubación larval ({species_meta.get('larval_type', 'lasidio')}) "
            "dentro de las bandejas. El reclutamiento de nuevos juveniles tras la liberación requiere peces hospederos nativos "
            "compatibles en el cuerpo de agua o cultivo larval asistido."
        )
    else:
        recr_note = "Desarrollo directo sin requerimiento obligatorio de pez hospedero."

    return ReproductiveFeasibilityReport(
        species_id=species_id,
        scientific_name=species_meta.get("scientific_name", species_id),
        larval_type=str(species_meta.get("larval_type", "lasidium")),
        requires_host_fish_for_recruitment=bool(species_meta.get("requires_host_fish_for_recruitment", True)),
        spawning_feasibility_pct=round(feasibility_pct, 1),
        feasibility_category=cat,
        reproductive_stage_note=stage,
        limiting_factor_key=limiting_key,
        limiting_factor_label=labels[limiting_key],
        factors_pct=ReproductiveFactorBreakdown(**{k: round(v * 100.0, 1) for k, v in factors.items()}),
        facilitating_factors=facilitating,
        hindering_factors=hindering,
        recommended_action=actions[limiting_key] if factors[limiting_key] < 0.80 else "Condiciones óptimas; mantener monitoreo de OD.",
        recruitment_disclaimer=recr_note,
    )


# =============================================================================
# BLOQUE 9: Indicadores en porcentaje (0-100%) fáciles de interpretar
# =============================================================================

def block9_frontend_percentages(
    ecoli_now: float,
    ecoli_init: float,
    ecoli_target: float,
    tss_now: float,
    tss_init: float,
    tss_target: float,
    ammonia_now: float,
    ammonia_max_ref: float,
    ammonia_target: float,
    oxygen_now: float,
    temp_c: float,
    cr_eff: float,
    cr_max: float,
    f_tss: float,
    eta_module: float,
    m_installed_kg: float,
    m_star_kg: float,
    k_ratio: float,
    cumulative_filtered_L: float,
    volume_L: float,
    hours_to_ecoli: Optional[float],
    hours_to_ecoli_no_clams: Optional[float],
    hours_to_tss: Optional[float],
    days_to_maintenance: float,
    sink_shares: Dict[str, Dict[str, float]],
) -> FrontendPercentagesSummary:
    """Convierte las concentraciones físicas y tasas de los Bloques 1-7 en porcentajes claros (0-100%)."""
    p_bact = (
        100.0
        if ecoli_now <= ecoli_target
        else _clip((ecoli_init - ecoli_now) / max(1e-6, ecoli_init - ecoli_target) * 100.0, 0.0, 100.0)
    )
    p_clar = (
        100.0
        if tss_now <= tss_target
        else _clip((tss_init - tss_now) / max(1e-6, tss_init - tss_target) * 100.0, 0.0, 100.0)
    )
    o2_sat = saturation_oxygen_mg_L(temp_c)
    p_o2 = _clip((oxygen_now / max(1e-6, o2_sat)) * 100.0, 0.0, 100.0)
    p_nh4 = (
        100.0
        if ammonia_now <= ammonia_target
        else _clip((ammonia_max_ref - ammonia_now) / max(1e-6, ammonia_max_ref - ammonia_target) * 100.0, 0.0, 100.0)
    )

    health = _clip(0.30 * p_bact + 0.25 * p_clar + 0.25 * p_o2 + 0.20 * p_nh4, 0.0, 100.0)
    if health >= 75.0:
        sem, lbl = "VERDE", "Agua en Buen Estado / En Meta"
    elif health >= 45.0:
        sem, lbl = "AMARILLO", "Depuración Activa / Precaución"
    else:
        sem, lbl = "ROJO", "Carga Contaminante Alta / Riesgo"

    p_pump = _clip((cr_eff / max(1e-6, cr_max)) * 100.0, 0.0, 100.0)
    p_turb_loss = _clip((1.0 - f_tss) * 100.0, 0.0, 100.0)
    p_simb = 150.0 if m_star_kg <= 1e-6 else _clip((m_installed_kg / m_star_kg) * 100.0, 0.0, 150.0)
    p_perm = _clip(k_ratio * 100.0, 0.0, 100.0)
    p_clog = _clip(100.0 - p_perm, 0.0, 100.0)
    p_recycled = (cumulative_filtered_L / max(1.0, volume_L)) * 100.0

    speedup = None
    if hours_to_ecoli is not None and hours_to_ecoli_no_clams is not None and hours_to_ecoli_no_clams > 0:
        speedup = round(max(0.0, (1.0 - hours_to_ecoli / hours_to_ecoli_no_clams) * 100.0), 1)

    return FrontendPercentagesSummary(
        overall_water_health_pct=round(health, 1),
        health_semaphore=sem,
        health_label=lbl,
        bacteria_removal_pct=round(p_bact, 1),
        clarity_pct=round(p_clar, 1),
        oxygen_saturation_pct=round(p_o2, 1),
        ammonia_safety_pct=round(p_nh4, 1),
        bivalve_pumping_efficiency_pct=round(p_pump, 1),
        module_spatial_efficiency_pct=round(eta_module * 100.0, 1),
        turbidity_limitation_pct=round(p_turb_loss, 1),
        symbiotic_balance_pct=round(p_simb, 1),
        tray_clogging_pct=round(p_clog, 1),
        permeability_remaining_pct=round(p_perm, 1),
        water_recycled_fraction_pct=round(p_recycled, 1),
        estimated_hours_to_ecoli_target=None if hours_to_ecoli is None else round(hours_to_ecoli, 1),
        estimated_hours_to_ecoli_without_bivalves=(
            None if hours_to_ecoli_no_clams is None else round(hours_to_ecoli_no_clams, 1)
        ),
        bivalve_speedup_pct=speedup,
        estimated_hours_to_clarity_target=None if hours_to_tss is None else round(hours_to_tss, 1),
        estimated_days_to_tray_maintenance=round(days_to_maintenance, 1),
        nutrient_sink_shares_pct=sink_shares,
    )
