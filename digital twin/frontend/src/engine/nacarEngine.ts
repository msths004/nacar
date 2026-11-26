import {
  ControllerSlotOutput,
  DigitalTwinSimulationResult,
  FrontendPercentagesSummary,
  ModuleGeometrySummary,
  ParameterGovernanceReport,
  ReproductiveFeasibilityReport,
  SensitivityItem,
  SimulationTargetsInput,
  SymbioticBiomassDesignReport,
  TimeSeriesPoint,
  VisualDesignInput,
  WaterInitialAndIoTInput,
} from "../types/twin";

// =============================================================================
// CATÁLOGO DE REGIONES (País / Cuenca) Y ESPECIES NATIVAS (Fiel a profiles/*.yaml)
// =============================================================================

export interface RegionProfileData {
  region_id: string;
  colloquial_country: string;
  colloquial_name: string;
  subtitle: string;
  status: string;
  latitude_deg: number;
  water_baseline: {
    temp_c: number;
    ph: number;
    calcium_mg_L: number;
    bicarbonate_mg_L: number;
    par_light_umol_m2_s: number;
    ntu_to_tss_factor: number;
    kLa_reaeration_h: number;
  };
  karst_calcita: {
    k_calc_precip: number;
    y_p_per_ca_coeff: number;
  };
  macrophytes: {
    dominant_species: string;
    rho_root_kg_m2: number;
    mu_SG_N_mg_g_h: number;
    mu_SG_P_mg_g_h: number;
    k_SG_N_mg_L: number;
    k_SG_P_mg_L: number;
    k_light_half_sat: number;
    r_O2_root_mg_kg_h: number;
    k_riz_pat_L_kg_h: number;
  };
  cwm1_bacteria: {
    mu_max_A_25C_h: number;
    f_XA_active: number;
    k_SC_N_mg_L: number;
    K_O_A_mg_L: number;
    nu_N_exudate: number;
    rho_ex_mg_kg: number;
    k_GN_mg_L: number;
    k_uv_par_coeff: number;
    k_d_nat_25C_h: number;
  };
  hydraulics_and_clogging: {
    v_sed_m_h: number;
    phi_0_bed: number;
    beta_ret_tray: number;
    k_hidr_dep_h: number;
    rho_dep_mg_L: number;
    V_poroso_L: number;
    biofilm_clog_rate_h: number;
  };
  evidence_counts: { A: number; B: number; C: number; D: number };
}

export interface SpeciesProfileData {
  species_id: string;
  colloquial_name: string;
  scientific_name: string;
  family: string;
  region_badge: string;
  status: string;
  larval_type: string;
  requires_host_fish_for_recruitment: boolean;
  pending_verifications: string[];
  parameters: Record<string, number>;
  evidence_counts: { A: number; B: number; C: number; D: number };
}

export interface CenotePreset {
  id: string;
  name: string;
  location: string;
  conditionLabel: string;
  description: string;
  region_id: string;
  water: Partial<WaterInitialAndIoTInput>;
  design?: Partial<VisualDesignInput>;
}

export const REGION_PROFILES: Record<string, RegionProfileData> = {
  yucatan_karst: {
    region_id: "yucatan_karst",
    colloquial_country: "México · Yucatán",
    colloquial_name: "Agua de Cenote y Piedra Caliza (Yucatán)",
    subtitle: "Agua rica en calcio natural que ayuda a atrapar el fósforo en el fondo",
    status: "active_phase1",
    latitude_deg: 20.97,
    water_baseline: {
      temp_c: 27.5,
      ph: 7.45,
      calcium_mg_L: 210.0,
      bicarbonate_mg_L: 360.0,
      par_light_umol_m2_s: 180.0,
      ntu_to_tss_factor: 1.45,
      kLa_reaeration_h: 0.085,
    },
    karst_calcita: {
      k_calc_precip: 0.00018,
      y_p_per_ca_coeff: 10.9,
    },
    macrophytes: {
      dominant_species: "Tule y Lirio Acuático Nativo (Typha / Pontederia)",
      rho_root_kg_m2: 0.8,
      mu_SG_N_mg_g_h: 0.00171,
      mu_SG_P_mg_g_h: 0.00024,
      k_SG_N_mg_L: 0.18,
      k_SG_P_mg_L: 0.04,
      k_light_half_sat: 100.0,
      r_O2_root_mg_kg_h: 18.0,
      k_riz_pat_L_kg_h: 21.6,
    },
    cwm1_bacteria: {
      mu_max_A_25C_h: 0.032,
      f_XA_active: 0.0112,
      k_SC_N_mg_L: 3.0,
      K_O_A_mg_L: 0.5,
      nu_N_exudate: 1.85,
      rho_ex_mg_kg: 12.0,
      k_GN_mg_L: 0.002,
      k_uv_par_coeff: 0.0000667,
      k_d_nat_25C_h: 0.0068,
    },
    hydraulics_and_clogging: {
      v_sed_m_h: 0.0045,
      phi_0_bed: 0.85,
      beta_ret_tray: 0.35,
      k_hidr_dep_h: 0.012,
      rho_dep_mg_L: 145000.0,
      V_poroso_L: 250.0,
      biofilm_clog_rate_h: 0.000015,
    },
    evidence_counts: { A: 0, B: 5, C: 18, D: 6 },
  },
  _template_region: {
    region_id: "_template_region",
    colloquial_country: "Otras Regiones · Internacional",
    colloquial_name: "Agua Dulce Normal (Ríos o Lagos sin Piedra Caliza)",
    subtitle: "Agua blanda o templada donde plantas y bacterias hacen el 100% del trabajo",
    status: "pending_research",
    latitude_deg: 19.4,
    water_baseline: {
      temp_c: 22.0,
      ph: 7.0,
      calcium_mg_L: 25.0,
      bicarbonate_mg_L: 60.0,
      par_light_umol_m2_s: 150.0,
      ntu_to_tss_factor: 1.4,
      kLa_reaeration_h: 0.08,
    },
    karst_calcita: {
      k_calc_precip: 0.00018,
      y_p_per_ca_coeff: 10.9,
    },
    macrophytes: {
      dominant_species: "Plantas acuáticas nativas de la región",
      rho_root_kg_m2: 0.8,
      mu_SG_N_mg_g_h: 0.00171,
      mu_SG_P_mg_g_h: 0.00024,
      k_SG_N_mg_L: 0.18,
      k_SG_P_mg_L: 0.04,
      k_light_half_sat: 100.0,
      r_O2_root_mg_kg_h: 18.0,
      k_riz_pat_L_kg_h: 20.0,
    },
    cwm1_bacteria: {
      mu_max_A_25C_h: 0.032,
      f_XA_active: 0.012,
      k_SC_N_mg_L: 3.0,
      K_O_A_mg_L: 0.5,
      nu_N_exudate: 1.85,
      rho_ex_mg_kg: 12.0,
      k_GN_mg_L: 0.002,
      k_uv_par_coeff: 0.0000667,
      k_d_nat_25C_h: 0.0068,
    },
    hydraulics_and_clogging: {
      v_sed_m_h: 0.0045,
      phi_0_bed: 0.85,
      beta_ret_tray: 0.35,
      k_hidr_dep_h: 0.012,
      rho_dep_mg_L: 145000.0,
      V_poroso_L: 250.0,
      biofilm_clog_rate_h: 0.000015,
    },
    evidence_counts: { A: 0, B: 0, C: 0, D: 29 },
  },
};

export const SPECIES_PROFILES: Record<string, SpeciesProfileData> = {
  anodontites_trapesialis: {
    species_id: "anodontites_trapesialis",
    colloquial_name: "Almeja Nacarada Nativa (Principal)",
    scientific_name: "Anodontites trapesialis (A. ciconia)",
    family: "Mycetopodidae",
    region_badge: "100% Nativa · Fase 1",
    status: "focal_species_phase1",
    larval_type: "lasidio",
    requires_host_fish_for_recruitment: true,
    pending_verifications: [
      "Confirmar equivalencia de nombre científico (A. ciconia / A. trapesialis) en catálogo malacológico.",
      "Verificar registro local exacto en la cuenca del sitio piloto en Yucatán (CONABIO / GBIF).",
    ],
    parameters: {
      a_W: 1.15e-5,
      b_W: 2.95,
      a_CR: 1.95,
      b_CR: 0.67,
      gamma_sif: 0.45,
      gamma_jet: 1.8,
      v_jet_cm_s: 3.5,
      T_opt_C: 26.5,
      T_crit_C: 31.5,
      dT_tol_C: 6.5,
      gamma_heat: 1.4,
      TSS_50_mg_L: 28.0,
      p_sat: 1.65,
      TPM_crit_mg_L: 8.0,
      PF_max: 0.6,
      k_pf: 0.08,
      K_O_biv_mg_L: 1.5,
      eta_ret_bact: 0.88,
      AE_conover: 0.65,
      O_N_atomic_ratio: 50.0,
      f_basal_O2: 3.1,
      sda_catabolic_fraction: 0.08,
      E_O2_J_mg: 14.06,
      alpha_hidr_N: 0.009,
      alpha_hidr_P: 0.0025,
      L_p_maturity_mm: 48.0,
      kappa_deb: 0.68,
      p_M_vol_J_g_h: 1.15,
      T_A_arrhenius_K: 5800.0,
      mu_POM_J_mg: 20.5,
      c_clean_PsR_J_mg: 1.65,
      K_R_gonad_J_h: 3.2,
      T_rep_opt_C: 27.0,
      dT_rep_C: 3.2,
      tau_peak_month: 5,
      b_basal_season: 0.2,
      K_O_rep_mg_L: 3.2,
      K_NH_rep_mg_L: 1.2,
      d_opt_fert_cm: 9.0,
      L_sperm_cm: 18.0,
      d_min_crowd_cm: 2.5,
    },
    evidence_counts: { A: 0, B: 1, C: 15, D: 25 },
  },
  anodontites_tortolis: {
    species_id: "anodontites_tortolis",
    colloquial_name: "Almeja Dulceacuícola Sureña",
    scientific_name: "Anodontites tortolis",
    family: "Mycetopodidae",
    region_badge: "Plantilla Nativa · Sur",
    status: "template_seed_level_D",
    larval_type: "lasidio",
    requires_host_fish_for_recruitment: true,
    pending_verifications: ["Especie en plantilla para expansión regional; requiere medición en laboratorio."],
    parameters: {
      a_W: 1.08e-5,
      b_W: 2.92,
      a_CR: 1.65,
      b_CR: 0.66,
      gamma_sif: 0.42,
      gamma_jet: 1.7,
      v_jet_cm_s: 3.2,
      T_opt_C: 26.8,
      T_crit_C: 32.0,
      dT_tol_C: 6.8,
      gamma_heat: 1.35,
      TSS_50_mg_L: 32.0,
      p_sat: 1.6,
      TPM_crit_mg_L: 9.5,
      PF_max: 0.62,
      k_pf: 0.08,
      K_O_biv_mg_L: 1.35,
      eta_ret_bact: 0.86,
      AE_conover: 0.63,
      O_N_atomic_ratio: 52.0,
      f_basal_O2: 3.0,
      sda_catabolic_fraction: 0.08,
      E_O2_J_mg: 14.06,
      alpha_hidr_N: 0.012,
      alpha_hidr_P: 0.0025,
      L_p_maturity_mm: 42.0,
      kappa_deb: 0.7,
      p_M_vol_J_g_h: 1.1,
      T_A_arrhenius_K: 5800.0,
      mu_POM_J_mg: 20.5,
      c_clean_PsR_J_mg: 0.45,
      K_R_gonad_J_h: 16.0,
      T_rep_opt_C: 27.2,
      dT_rep_C: 3.4,
      tau_peak_month: 6,
      b_basal_season: 0.22,
      K_O_rep_mg_L: 3.0,
      K_NH_rep_mg_L: 1.4,
      d_opt_fert_cm: 8.5,
      L_sperm_cm: 17.0,
      d_min_crowd_cm: 2.5,
    },
    evidence_counts: { A: 0, B: 0, C: 0, D: 41 },
  },
  psoronaias_semigranosa: {
    species_id: "psoronaias_semigranosa",
    colloquial_name: "Almeja de Río Mesoamericana",
    scientific_name: "Psoronaias semigranosa",
    family: "Unionidae",
    region_badge: "Plantilla Nativa · Cuenca Grijalva-Usumacinta",
    status: "template_seed_level_D",
    larval_type: "gloquidio",
    requires_host_fish_for_recruitment: true,
    pending_verifications: ["Especie en plantilla para expansión regional; requiere medición en laboratorio."],
    parameters: {
      a_W: 1.32e-5,
      b_W: 2.98,
      a_CR: 1.55,
      b_CR: 0.68,
      gamma_sif: 0.4,
      gamma_jet: 1.65,
      v_jet_cm_s: 3.1,
      T_opt_C: 26.0,
      T_crit_C: 31.0,
      dT_tol_C: 6.2,
      gamma_heat: 1.45,
      TSS_50_mg_L: 25.0,
      p_sat: 1.7,
      TPM_crit_mg_L: 7.0,
      PF_max: 0.58,
      k_pf: 0.08,
      K_O_biv_mg_L: 1.65,
      eta_ret_bact: 0.91,
      AE_conover: 0.68,
      O_N_atomic_ratio: 48.0,
      f_basal_O2: 3.2,
      sda_catabolic_fraction: 0.08,
      E_O2_J_mg: 14.06,
      alpha_hidr_N: 0.012,
      alpha_hidr_P: 0.0025,
      L_p_maturity_mm: 45.0,
      kappa_deb: 0.72,
      p_M_vol_J_g_h: 1.2,
      T_A_arrhenius_K: 5800.0,
      mu_POM_J_mg: 20.5,
      c_clean_PsR_J_mg: 0.45,
      K_R_gonad_J_h: 17.5,
      T_rep_opt_C: 26.2,
      dT_rep_C: 3.0,
      tau_peak_month: 4,
      b_basal_season: 0.18,
      K_O_rep_mg_L: 3.5,
      K_NH_rep_mg_L: 1.0,
      d_opt_fert_cm: 8.0,
      L_sperm_cm: 16.0,
      d_min_crowd_cm: 2.5,
    },
    evidence_counts: { A: 0, B: 0, C: 0, D: 41 },
  },
  cyrtonaias_tampicoensis: {
    species_id: "cyrtonaias_tampicoensis",
    colloquial_name: "Almeja Nacarada del Golfo",
    scientific_name: "Cyrtonaias tampicoensis",
    family: "Unionidae",
    region_badge: "Plantilla Nativa · Norte / Golfo",
    status: "template_seed_level_D",
    larval_type: "gloquidio",
    requires_host_fish_for_recruitment: true,
    pending_verifications: ["Especie en plantilla para expansión regional; requiere medición en laboratorio."],
    parameters: {
      a_W: 1.25e-5,
      b_W: 2.96,
      a_CR: 1.75,
      b_CR: 0.67,
      gamma_sif: 0.44,
      gamma_jet: 1.75,
      v_jet_cm_s: 3.4,
      T_opt_C: 25.5,
      T_crit_C: 30.8,
      dT_tol_C: 6.0,
      gamma_heat: 1.45,
      TSS_50_mg_L: 26.0,
      p_sat: 1.65,
      TPM_crit_mg_L: 7.5,
      PF_max: 0.6,
      k_pf: 0.08,
      K_O_biv_mg_L: 1.6,
      eta_ret_bact: 0.9,
      AE_conover: 0.66,
      O_N_atomic_ratio: 49.0,
      f_basal_O2: 3.05,
      sda_catabolic_fraction: 0.08,
      E_O2_J_mg: 14.06,
      alpha_hidr_N: 0.012,
      alpha_hidr_P: 0.0025,
      L_p_maturity_mm: 50.0,
      kappa_deb: 0.66,
      p_M_vol_J_g_h: 1.18,
      T_A_arrhenius_K: 5800.0,
      mu_POM_J_mg: 20.5,
      c_clean_PsR_J_mg: 0.45,
      K_R_gonad_J_h: 19.0,
      T_rep_opt_C: 25.8,
      dT_rep_C: 2.9,
      tau_peak_month: 4,
      b_basal_season: 0.2,
      K_O_rep_mg_L: 3.4,
      K_NH_rep_mg_L: 1.1,
      d_opt_fert_cm: 9.5,
      L_sperm_cm: 18.0,
      d_min_crowd_cm: 2.5,
    },
    evidence_counts: { A: 0, B: 0, C: 0, D: 41 },
  },
};

export const CENOTE_PRESETS: CenotePreset[] = [
  {
    id: "referencia_yucatan",
    name: "Estanque Piloto Yucatán (Referencia)",
    location: "Mérida, Yucatán",
    conditionLabel: "Escenario Validado · 240 almejas",
    description: "Estanque de 12,000 L con 2 canastas de 6 pisos y 4.5 m² de plantas acuáticas.",
    region_id: "yucatan_karst",
    design: {
      volume_liters: 12000,
      wetland_area_m2: 10,
      num_modules: 2,
      trays_per_module: 6,
      clams_per_tray: 20,
      macrophyte_area_m2: 4.5,
      month_of_year: 4,
    },
    water: {
      temp_c: 27.5,
      ph: 7.45,
      dissolved_oxygen_mg_L: 6.2,
      tss_mg_L: 18.0,
      pathogen_ecoli_ufc_100mL: 2400,
      ammonia_n_mg_L: 1.2,
      nitrate_n_mg_L: 2.5,
      phosphate_p_mg_L: 0.65,
      calcium_mg_L: 210,
      bicarbonate_mg_L: 360,
    },
  },
  {
    id: "cenote_yokdzonot",
    name: "Cenote Yokdzonot",
    location: "Yokdzonot, Yucatán",
    conditionLabel: "Agua Alcalina con Amonio",
    description: "Datos reales medidos en Yokdzonot: pH 7.49, 25.4 °C y presencia de compuestos nitrogenados.",
    region_id: "yucatan_karst",
    water: {
      temp_c: 25.4,
      ph: 7.49,
      dissolved_oxygen_mg_L: 5.4,
      tss_mg_L: 14.5,
      pathogen_ecoli_ufc_100mL: 1850,
      ammonia_n_mg_L: 1.65,
      nitrate_n_mg_L: 1.2,
      phosphate_p_mg_L: 0.55,
      calcium_mg_L: 195,
      bicarbonate_mg_L: 340,
    },
  },
  {
    id: "cenote_xbatun",
    name: "Cenote X'batun",
    location: "Valladolid, Yucatán",
    conditionLabel: "Cálido y Alta Mineralización",
    description: "Datos medidos en X'batun: 27.7 °C, pH 6.91, alta dureza mineral y carga orgánica turística.",
    region_id: "yucatan_karst",
    water: {
      temp_c: 27.7,
      ph: 7.25,
      dissolved_oxygen_mg_L: 5.8,
      tss_mg_L: 22.0,
      pathogen_ecoli_ufc_100mL: 2800,
      ammonia_n_mg_L: 1.35,
      nitrate_n_mg_L: 2.1,
      phosphate_p_mg_L: 0.8,
      calcium_mg_L: 230,
      bicarbonate_mg_L: 410,
    },
  },
  {
    id: "cenote_xcanche",
    name: "Cenote X'Canche (Pico de Nitratos)",
    location: "Ek Balam, Yucatán",
    conditionLabel: "Pico de Nitratos (7.5 mg/L)",
    description: "Datos de pico antropogénico en X'Canche: 25.7 °C y pulso fuerte de nutrientes agrícolas/porcícolas.",
    region_id: "yucatan_karst",
    water: {
      temp_c: 25.7,
      ph: 7.32,
      dissolved_oxygen_mg_L: 5.1,
      tss_mg_L: 26.5,
      pathogen_ecoli_ufc_100mL: 3600,
      ammonia_n_mg_L: 2.4,
      nitrate_n_mg_L: 7.52,
      phosphate_p_mg_L: 1.15,
      calcium_mg_L: 205,
      bicarbonate_mg_L: 385,
    },
  },
  {
    id: "cenote_kankirixche",
    name: "Cenote Kankirixche",
    location: "Abalá, Yucatán",
    conditionLabel: "Agua Templada-Cálida",
    description: "Datos medidos en Kankirixche: 27.4 °C, turbidez moderada y condiciones estables.",
    region_id: "yucatan_karst",
    water: {
      temp_c: 27.4,
      ph: 7.35,
      dissolved_oxygen_mg_L: 6.4,
      tss_mg_L: 12.0,
      pathogen_ecoli_ufc_100mL: 1400,
      ammonia_n_mg_L: 0.85,
      nitrate_n_mg_L: 1.5,
      phosphate_p_mg_L: 0.45,
      calcium_mg_L: 215,
      bicarbonate_mg_L: 365,
    },
  },
];

// =============================================================================
// IMPLEMENTACIÓN FIEL DE LOS 9 BLOQUES MATEMÁTICOS EN TYPESCRIPT (OFFLINE ENGINE)
// =============================================================================

const HEX_PACKING_CONST = 0.9523;
const ATOMIC_N_OVER_O = 14.007 / 15.999;

function clip(val: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, val));
}

function round(val: number, digits = 2): number {
  const f = Math.pow(10, digits);
  return Math.round(val * f) / f;
}

export function saturationOxygenMgL(tempC: number): number {
  const tk = tempC + 273.15;
  const lnC =
    -139.34411 +
    1.575701e5 / tk -
    6.642308e7 / (tk * tk) +
    1.2438e10 / (tk * tk * tk) -
    8.621949e11 / (tk * tk * tk * tk);
  return Math.exp(lnC);
}

export function block1ModuleGeometry(
  design: VisualDesignInput,
  spParams: Record<string, number>
): ModuleGeometrySummary {
  const nTotal = design.num_modules * design.trays_per_module * design.clams_per_tray;
  let dClams = design.tray_diameter_cm;
  if (design.clam_spacing_override_cm !== null && design.clam_spacing_override_cm > 0) {
    dClams = design.clam_spacing_override_cm;
  } else if (design.clams_per_tray > 0) {
    dClams = (HEX_PACKING_CONST * design.tray_diameter_cm) / Math.sqrt(design.clams_per_tray);
  }

  const freeGap = Math.max(0.1, dClams - design.shell_length_mm / 10.0);
  const shellCm = design.shell_length_mm / 10.0;
  const lSiphon = Math.max(0.2, spParams.gamma_sif * shellCm);
  const lJet = Math.max(0.5, spParams.gamma_jet * shellCm);

  const etaH = 1.0 - 0.55 * Math.exp(-dClams / lSiphon);
  let etaV = 1.0;
  if (design.trays_per_module > 1 && design.num_modules > 0 && design.clams_per_tray > 0) {
    const vJet = Math.max(0.1, spParams.v_jet_cm_s);
    etaV =
      1.0 -
      0.35 *
        (1.0 - 1.0 / design.trays_per_module) *
        Math.exp((-design.tray_vertical_spacing_cm * (1.0 + design.crossflow_vel_cm_s / vJet)) / lJet);
  }

  const etaMod = clip(etaH * etaV, 0.05, 1.0);
  const depthM = design.volume_liters / (1000.0 * Math.max(0.1, design.wetland_area_m2));
  const wAfdw = spParams.a_W * Math.pow(design.shell_length_mm, spParams.b_W);
  const crMax = spParams.a_CR * Math.pow(wAfdw, spParams.b_CR);

  return {
    total_bivalves_n: nTotal,
    clam_spacing_cm: round(dClams, 3),
    free_shell_gap_cm: round(freeGap, 3),
    eta_horizontal: round(etaH, 4),
    eta_vertical: round(etaV, 4),
    eta_module: round(etaMod, 4),
    spatial_efficiency_pct: round(etaMod * 100.0, 2),
    water_depth_m: round(depthM, 3),
    wetland_volume_L: design.volume_liters,
    shell_afdw_g_ind: round(wAfdw, 4),
    cr_max_L_h_ind: round(crMax, 4),
  };
}

function block2BivalveEcophysiology(
  tempC: number,
  tssMgL: number,
  oxygenMgL: number,
  fOrg: number,
  geom: ModuleGeometrySummary,
  spParams: Record<string, number>,
  basalFoodPomMgL = 0.95
) {
  const tss = Math.max(0.0, tssMgL);
  const sO = Math.max(0.0, oxygenMgL);

  const fTGauss = Math.exp(-Math.pow((tempC - spParams.T_opt_C) / spParams.dT_tol_C, 2));
  const fTHeat = 1.0 / (1.0 + Math.exp(clip(spParams.gamma_heat * (tempC - spParams.T_crit_C), -40.0, 40.0)));
  const fT = fTGauss * fTHeat;

  const fTss = 1.0 / (1.0 + Math.pow(tss / Math.max(1e-6, spParams.TSS_50_mg_L), spParams.p_sat));
  const fDo = sO / (sO + Math.max(1e-6, spParams.K_O_biv_mg_L));

  const crEff = geom.cr_max_L_h_ind * fT * fTss * fDo * geom.eta_module;
  const qBivTotal = geom.total_bivalves_n * crEff;

  const fr = crEff * tss;
  const tpmCrit = spParams.TPM_crit_mg_L;
  const pf = tss <= tpmCrit ? 0.0 : spParams.PF_max * (1.0 - Math.exp(-spParams.k_pf * (tss - tpmCrit)));

  const psr = fr * pf;
  const ir = fr * (1.0 - pf);
  const ae = spParams.AE_conover;
  const pomIngested = Math.max(fOrg * ir, crEff * Math.max(0.0, basalFoodPomMgL));
  const ar = pomIngested * ae;
  const er = ir * (1.0 - fOrg * ae);
  const bdInd = psr + er;

  const eO2 = Math.max(1e-6, spParams.E_O2_J_mg);
  const fBasalJ = spParams.f_basal_O2 * Math.pow(1.07, tempC - 25.0) * Math.pow(geom.shell_afdw_g_ind, 0.75);
  const sdaJ = spParams.sda_catabolic_fraction * ar * spParams.mu_POM_J_mg;
  const ocr = (sdaJ + fBasalJ) / eO2;

  const aer = (ocr * ATOMIC_N_OVER_O) / Math.max(1.0, spParams.O_N_atomic_ratio);
  const eNTot = aer + spParams.alpha_hidr_N * fOrg * bdInd;
  const ePTot = spParams.alpha_hidr_P * fOrg * bdInd;

  return {
    f_T: fT,
    f_TSS: fTss,
    f_DO: fDo,
    CR_eff_L_h_ind: crEff,
    Q_biv_L_h: qBivTotal,
    FR_mg_h_ind: fr,
    PF_frac: pf,
    PsR_mg_h_ind: psr,
    IR_mg_h_ind: ir,
    AR_mg_h_ind: ar,
    ER_mg_h_ind: er,
    BD_ind_mg_h: bdInd,
    OCR_mg_O2_h_ind: ocr,
    AER_mg_N_h_ind: aer,
    E_N_tot_mg_N_h_ind: eNTot,
    E_P_tot_mg_P_h_ind: ePTot,
  };
}

function block3MacrophyteBacteriome(
  design: VisualDesignInput,
  tempC: number,
  parLight: number,
  sNh: number,
  sNo: number,
  sPo4: number,
  sO: number,
  xA: number,
  macParams: RegionProfileData["macrophytes"],
  cwm1Params: RegionProfileData["cwm1_bacteria"]
) {
  const mKg =
    design.macrophyte_root_biomass_override_kg !== null
      ? design.macrophyte_root_biomass_override_kg
      : macParams.rho_root_kg_m2 * design.macrophyte_area_m2;
  const mG = mKg * 1000.0;

  const fLight = parLight >= 0 ? 0.25 + 0.75 * (parLight / (parLight + macParams.k_light_half_sat)) : 0.25;
  const thetaMac = Math.pow(1.05, tempC - 25.0);
  const nh = Math.max(0.0, sNh);
  const no = Math.max(0.0, sNo);
  const po4 = Math.max(0.0, sPo4);
  const oxy = Math.max(0.0, sO);

  const monodMacNh = nh / (nh + macParams.k_SG_N_mg_L);
  const monodMacNo = (no / (no + macParams.k_SG_N_mg_L)) * (macParams.k_SG_N_mg_L / (nh + macParams.k_SG_N_mg_L));
  const monodMacP = po4 / (po4 + macParams.k_SG_P_mg_L);

  const specMacNh = macParams.mu_SG_N_mg_g_h * 1000.0 * fLight * thetaMac * monodMacNh;
  const rMacNh = mKg * specMacNh;
  const rMacNo = mG * macParams.mu_SG_N_mg_g_h * fLight * thetaMac * monodMacNo;
  const rMacP = mG * macParams.mu_SG_P_mg_g_h * fLight * thetaMac * monodMacP;

  const exConc = cwm1Params.rho_ex_mg_kg * (mKg / design.volume_liters);
  const phiRiz = 1.0 + (cwm1Params.nu_N_exudate * exConc) / (exConc + cwm1Params.k_GN_mg_L);

  const muMaxAT = cwm1Params.mu_max_A_25C_h * Math.pow(1.072, tempC - 25.0);
  const monodBactNh = (nh / (nh + cwm1Params.k_SC_N_mg_L)) * (oxy / (oxy + cwm1Params.K_O_A_mg_L));
  const xAEff = Math.max(0.0, xA) * cwm1Params.f_XA_active;
  const rBactNh = design.volume_liters * muMaxAT * xAEff * monodBactNh * phiRiz;

  return {
    m_root_kg: mKg,
    f_light: fLight,
    theta_mac: thetaMac,
    phi_rizosfera: phiRiz,
    spec_mac_NH_mg_kg_h: specMacNh,
    R_mac_NH_mg_h: rMacNh,
    R_mac_NO_mg_h: rMacNo,
    R_mac_P_mg_h: rMacP,
    R_bact_NH_mg_h: rBactNh,
  };
}

function block4KarstGeochemistry(
  volumeL: number,
  tempC: number,
  ph: number,
  caMgL: number,
  hco3MgL: number,
  sPo4MgL: number,
  karstParams: RegionProfileData["karst_calcita"]
) {
  const caSafe = Math.max(0.1, caMgL);
  const hco3Safe = Math.max(0.1, hco3MgL);

  const pCa = 4.6 - Math.log10(caSafe);
  const pAlk = 4.78 - Math.log10(hco3Safe);
  const cTemp = 2.15 - 0.014 * tempC;
  const phSat = pCa + pAlk + cTemp;

  const siC = ph - phSat;
  let rCa = 0.0;
  let rCalcitaP = 0.0;
  if (siC > 0.0) {
    rCa = karstParams.k_calc_precip * (Math.pow(10.0, Math.min(siC, 1.5)) - 1.0);
    rCalcitaP = volumeL * rCa * (karstParams.y_p_per_ca_coeff * Math.max(0.0, sPo4MgL));
  }

  return {
    ph_sat: phSat,
    SI_c: siC,
    r_Ca_g_L_h: rCa,
    R_calcita_P_mg_h: rCalcitaP,
  };
}

function block5CriticalMacrophyteBiomass(
  design: VisualDesignInput,
  geom: ModuleGeometrySummary,
  bivAtCleanTss: ReturnType<typeof block2BivalveEcophysiology>,
  tempC: number,
  parLight: number,
  sO: number,
  xA: number,
  targetNh4MgL: number,
  inflowNh4MgL: number,
  macParams: RegionProfileData["macrophytes"],
  cwm1Params: RegionProfileData["cwm1_bacteria"]
): SymbioticBiomassDesignReport {
  const bioEval = block3MacrophyteBacteriome(
    design,
    tempC,
    parLight,
    targetNh4MgL,
    0.0,
    0.0,
    sO,
    xA,
    macParams,
    cwm1Params
  );

  const mInstalled = bioEval.m_root_kg;
  const areaInstalled = design.macrophyte_area_m2;
  const rhoRoot = Math.max(0.05, macParams.rho_root_kg_m2);
  const specMacRate = Math.max(1e-6, bioEval.spec_mac_NH_mg_kg_h);
  const rBactAtTarget = bioEval.R_bact_NH_mg_h;

  const bivNh4Load = geom.total_bivalves_n * bivAtCleanTss.E_N_tot_mg_N_h_ind;
  const extNh4Load = design.inflow_L_h * inflowNh4MgL;
  const netNeededForPlants = Math.max(0.0, extNh4Load + bivNh4Load - rBactAtTarget);

  const mStarTotal = netNeededForPlants / specMacRate;
  const areaStarTotal = mStarTotal / rhoRoot;

  const clamsPerModule = design.trays_per_module * design.clams_per_tray;
  const moduleNh4Load = clamsPerModule * bivAtCleanTss.E_N_tot_mg_N_h_ind;
  const bactPerModuleShare = rBactAtTarget / Math.max(1, design.num_modules);
  const mStarModule = Math.max(0.0, moduleNh4Load - bactPerModuleShare) / specMacRate;
  const areaStarModule = mStarModule / rhoRoot;

  const ratio = mStarTotal <= 1e-9 ? 1.5 : mInstalled / mStarTotal;

  let status: SymbioticBiomassDesignReport["balance_status"] = "SUPERAVIT_OPTIMO";
  let rec = "";
  if (ratio >= 1.1) {
    status = "SUPERAVIT_OPTIMO";
    rec = `Equilibrio seguro (+${round((ratio - 1.0) * 100.0, 1)}% de margen): las plantas y bacterias benéficas absorben sin problema lo que producen las ${geom.total_bivalves_n} almejas.`;
  } else if (ratio >= 0.95) {
    status = "EQUILIBRIO_AJUSTADO";
    rec =
      "Equilibrio justo en el límite: conviene agregar un 10-15% extra de plantas acuáticas para respaldar al estanque durante la noche.";
  } else {
    const deficitKg = Math.max(0.0, mStarTotal - mInstalled);
    const deficitM2 = deficitKg / rhoRoot;
    status = "DEFICIT_AMONIO";
    rec = `Faltan plantas: se recomienda agregar al menos ${deficitM2.toFixed(1)} m² de plantas (${deficitKg.toFixed(2)} kg de raíz) para absorber los nutrientes que liberan las almejas.`;
  }

  return {
    installed_root_biomass_kg: round(mInstalled, 3),
    installed_macrophyte_area_m2: round(areaInstalled, 3),
    critical_total_root_biomass_kg: round(mStarTotal, 3),
    critical_total_macrophyte_area_m2: round(areaStarTotal, 3),
    critical_root_biomass_per_module_kg: round(mStarModule, 3),
    critical_area_per_module_m2: round(areaStarModule, 3),
    ammonia_load_from_bivalves_mg_N_h: round(bivNh4Load, 3),
    external_ammonia_load_mg_N_h: round(extNh4Load, 3),
    bacteriome_sink_at_target_mg_N_h: round(rBactAtTarget, 3),
    macrophyte_specific_rate_at_target_mg_N_kg_h: round(specMacRate, 3),
    balance_status: status,
    recommendation: rec,
  };
}

function block6PathogenAndWaterOdes(
  state: { ecoli: number; tss: number; nh4: number; no3: number; po4: number; oxygen: number },
  design: VisualDesignInput,
  geom: ModuleGeometrySummary,
  biv: ReturnType<typeof block2BivalveEcophysiology>,
  bio: ReturnType<typeof block3MacrophyteBacteriome>,
  karst: ReturnType<typeof block4KarstGeochemistry>,
  inflowConc: { ecoli: number; tss: number; nh4: number; no3: number; po4: number },
  tempC: number,
  parLight: number,
  macParams: RegionProfileData["macrophytes"],
  cwm1Params: RegionProfileData["cwm1_bacteria"],
  hydroParams: RegionProfileData["hydraulics_and_clogging"],
  spParams: Record<string, number>,
  kLaH: number,
  xHMgL = 15.0,
  sFMgL = 6.0,
  sAMgL = 3.0,
  xSMgL = 8.0
) {
  const vL = design.volume_liters;
  const qIn = design.inflow_L_h;
  const nTot = geom.total_bivalves_n;
  const mKg = bio.m_root_kg;

  const xPat = Math.max(0.0, state.ecoli);
  const tss = Math.max(0.0, state.tss);
  const sNh = Math.max(0.0, state.nh4);
  const sNo = Math.max(0.0, state.no3);
  const sPo4 = Math.max(0.0, state.po4);
  const sO = Math.max(0.0, state.oxygen);

  const kBivBact = (spParams.eta_ret_bact * biv.Q_biv_L_h) / vL;
  const kUv = cwm1Params.k_uv_par_coeff * Math.max(0.0, parLight);
  const kRizBact = macParams.k_riz_pat_L_kg_h * (mKg / vL);
  const kDNat = cwm1Params.k_d_nat_25C_h * Math.pow(1.04, tempC - 25.0);
  const kTotalBact = kBivBact + kUv + kRizBact + kDNat;
  const dEcoli = (qIn / vL) * (inflowConc.ecoli - xPat) - kTotalBact * xPat;

  const kTssBiv = biv.Q_biv_L_h / vL;
  const kTssSed = hydroParams.v_sed_m_h / Math.max(0.1, geom.water_depth_m);
  const dTss = (qIn / vL) * (inflowConc.tss - tss) - (kTssBiv + kTssSed) * tss;

  const dNh4 =
    (qIn / vL) * (inflowConc.nh4 - sNh) +
    (nTot * biv.E_N_tot_mg_N_h_ind) / vL -
    (bio.R_mac_NH_mg_h + bio.R_bact_NH_mg_h) / vL;

  const codLabile = Math.max(0.0, sFMgL) + Math.max(0.0, sAMgL) + 0.15 * Math.max(0.0, xSMgL);
  const monodCod = codLabile / (codLabile + 4.0);
  const xHFactor = Math.max(0.1, xHMgL / 15.0);
  const kDenit = 0.008 * bio.phi_rizosfera * xHFactor * monodCod * (0.2 / (0.2 + sO * 0.15));
  const dNo3 =
    (qIn / vL) * (inflowConc.no3 - sNo) + (bio.R_bact_NH_mg_h - bio.R_mac_NO_mg_h) / vL - kDenit * sNo;

  const dPo4 =
    (qIn / vL) * (inflowConc.po4 - sPo4) +
    (nTot * biv.E_P_tot_mg_P_h_ind) / vL -
    (bio.R_mac_P_mg_h + karst.R_calcita_P_mg_h) / vL;

  const o2Sat = saturationOxygenMgL(tempC);
  const o2Photo = macParams.r_O2_root_mg_kg_h * mKg * bio.f_light;
  const o2BivResp = nTot * biv.OCR_mg_O2_h_ind;
  const o2Nitrif = 4.57 * bio.R_bact_NH_mg_h;
  const rRespHetCwm1 = vL * 0.0022 * Math.max(0.0, xHMgL) * monodCod * (sO / (sO + 0.2));
  const o2Benthic = 0.15 * nTot * biv.E_N_tot_mg_N_h_ind * 4.57;
  const dO2 = kLaH * (o2Sat - sO) + (o2Photo - o2BivResp - o2Nitrif - rRespHetCwm1 - o2Benthic) / vL;

  return {
    d_ecoli: dEcoli,
    d_tss: dTss,
    d_nh4: dNh4,
    d_no3: dNo3,
    d_po4: dPo4,
    d_oxygen: dO2,
    k_total_bact_h: kTotalBact,
    k_no_clams_bact_h: kUv + kRizBact + kDNat,
  };
}

function block7KozenyCarmanClogging(
  mDepMg: number,
  nTotal: number,
  bdIndMgH: number,
  rCaGLH: number,
  hydroParams: RegionProfileData["hydraulics_and_clogging"],
  tHours: number,
  xBioTotalMgL = 27.0
) {
  const dMDep = hydroParams.beta_ret_tray * nTotal * bdIndMgH - hydroParams.k_hidr_dep_h * Math.max(0.0, mDepMg);
  const phi0 = hydroParams.phi_0_bed;
  const vPor = Math.max(1.0, hydroParams.V_poroso_L);
  const rhoDep = Math.max(1.0, hydroParams.rho_dep_mg_L);

  const deltaNBio = Math.min(
    0.08 * phi0,
    (hydroParams.biofilm_clog_rate_h ?? 0.000015) * (Math.max(0.0, xBioTotalMgL) / 27.0) * Math.max(0.0, tHours)
  );
  const deltaNChem = 0.000025 * rCaGLH * 1000.0 * Math.max(0.0, tHours);
  const deltaNDep = Math.max(0.0, mDepMg) / (rhoDep * vPor);
  const phiT = clip(phi0 - deltaNBio - deltaNChem - deltaNDep, 0.12 * phi0, phi0);

  const kRatio = Math.pow(phiT / phi0, 3) * Math.pow((1.0 - phi0) / Math.max(1e-4, 1.0 - phiT), 2);
  return {
    d_m_dep_mg_h: dMDep,
    phi_t: phiT,
    K_ratio: clip(kRatio, 0.0, 1.0),
  };
}

function block8ReproductiveFeasibility(
  species: SpeciesProfileData,
  spParams: Record<string, number>,
  geom: ModuleGeometrySummary,
  bivRates: ReturnType<typeof block2BivalveEcophysiology>,
  design: VisualDesignInput,
  tempC: number,
  oxygenMgL: number,
  ammoniaNMgL: number,
  latitudeDeg = 20.97
): ReproductiveFeasibilityReport {
  const pA = spParams.mu_POM_J_mg * bivRates.AR_mg_h_ind;
  const tK = tempC + 273.15;
  const arrh = Math.exp(spParams.T_A_arrhenius_K / 293.15 - spParams.T_A_arrhenius_K / tK);
  const pM = spParams.p_M_vol_J_g_h * geom.shell_afdw_g_ind * arrh;
  const kappa = spParams.kappa_deb;
  const pR = Math.max(
    0.0,
    (1.0 - kappa) * pA - ((1.0 - kappa) / kappa) * pM - spParams.c_clean_PsR_J_mg * bivRates.PsR_mg_h_ind
  );
  const fDebRep = pR / (pR + Math.max(1e-6, spParams.K_R_gonad_J_h));

  const fTalla =
    1.0 / (1.0 + Math.exp(clip(-0.35 * (design.shell_length_mm - spParams.L_p_maturity_mm), -30.0, 30.0)));
  const hemiShift = latitudeDeg < 0 ? 6.0 : 0.0;
  const effPeak = ((spParams.tau_peak_month - 1.0 + hemiShift) % 12.0) + 1.0;
  let phaseDiff = Math.abs(design.month_of_year - effPeak);
  phaseDiff = Math.min(phaseDiff, 12.0 - phaseDiff);
  const bBasal = spParams.b_basal_season;
  // Ec. 8.2 exacta del PDF: cos^2(pi * (tau_mes - tau_pico) / 12)
  const fEpoca = bBasal + (1.0 - bBasal) * Math.pow(Math.cos((Math.PI * phaseDiff) / 12.0), 2);

  const fTRep = Math.exp(-Math.pow((tempC - spParams.T_rep_opt_C) / Math.max(0.5, spParams.dT_rep_C), 4));

  const sO = Math.max(0.0, oxygenMgL);
  const sNh = Math.max(0.0, ammoniaNMgL);
  const fQuimRep =
    ((sO * sO) / (sO * sO + spParams.K_O_rep_mg_L * spParams.K_O_rep_mg_L)) *
    (spParams.K_NH_rep_mg_L / (sNh + spParams.K_NH_rep_mg_L));

  let fFert = 0.0;
  if (geom.total_bivalves_n >= 2) {
    const vX = Math.max(0.0, design.crossflow_vel_cm_s);
    const flowMod = (1.0 + 0.22 * Math.min(vX, 3.0)) / (1.0 + 0.12 * Math.pow(Math.max(0.0, vX - 3.0), 1.5));
    const lSpermVx = Math.max(1.0, spParams.L_sperm_cm * flowMod);
    const dExcess = Math.max(0.0, geom.clam_spacing_cm - spParams.d_opt_fert_cm);
    fFert =
      Math.exp(-Math.pow(dExcess / lSpermVx, 2)) *
      (1.0 - Math.exp(-geom.clam_spacing_cm / Math.max(0.2, spParams.d_min_crowd_cm)));
  }

  const factors = {
    size_maturity: fTalla,
    season_synchrony: fEpoca,
    thermal_window: fTRep,
    deb_gonad_energy: fDebRep,
    marsupial_water_safety: fQuimRep,
    tray_fertilization_proximity: fFert,
  };

  const minVal = Math.min(...Object.values(factors));
  const product = Math.max(1e-12, fTalla * fEpoca * fTRep * fDebRep * fQuimRep * fFert);
  const feasibilityPct = minVal <= 1e-6 ? 0.0 : clip(100.0 * Math.pow(product, 0.45), 0.0, 100.0);

  const labels: Record<string, string> = {
    size_maturity: `Tamaño adulto (${design.shell_length_mm.toFixed(0)} mm vs ${spParams.L_p_maturity_mm.toFixed(0)} mm mínimo)`,
    season_synchrony: `Época del año (Mes ${design.month_of_year})`,
    thermal_window: `Temperatura ideal del agua (${tempC.toFixed(1)} °C)`,
    deb_gonad_energy: "Reserva de energía de la almeja (menor cuando el agua está muy turbia)",
    marsupial_water_safety: `Calidad del agua para incubar (Oxígeno ${sO.toFixed(1)} mg/L, Amonio ${sNh.toFixed(2)} mg/L)`,
    tray_fertilization_proximity: `Cercanía en la bandeja (${geom.clam_spacing_cm.toFixed(1)} cm entre almejas)`,
  };

  let limitingKey = "marsupial_water_safety";
  let lowest = Infinity;
  for (const [k, v] of Object.entries(factors)) {
    if (v < lowest) {
      lowest = v;
      limitingKey = k;
    }
  }

  const actions: Record<string, string> = {
    size_maturity: `Usar almejas adultas de al menos ${spParams.L_p_maturity_mm.toFixed(0)} mm.`,
    season_synchrony: `El mes más fuerte de desove es el mes ${spParams.tau_peak_month}; fuera de temporada la actividad baja naturalmente.`,
    thermal_window: `Mantener la temperatura cerca de ${spParams.T_rep_opt_C.toFixed(1)} °C con sombra o circulación.`,
    deb_gonad_energy: "Esperar a que las almejas aclaren la turbidez para que no gasten energía limpiando sus branquias.",
    marsupial_water_safety: "Mejorar la oxigenación o añadir más plantas para bajar el amonio antes de buscar reproducción.",
    tray_fertilization_proximity: `Acomodar las almejas a unos ${spParams.d_opt_fert_cm.toFixed(0)} cm de distancia dentro de cada piso.`,
  };

  const facilitating = Object.entries(factors)
    .filter(([, v]) => v >= 0.78)
    .map(([k, v]) => `${labels[k]}: ${(v * 100).toFixed(0)}%`);
  const hindering = Object.entries(factors)
    .filter(([, v]) => v < 0.7)
    .map(([k, v]) => `${labels[k]}: ${(v * 100).toFixed(0)}%`);

  let cat: ReproductiveFeasibilityReport["feasibility_category"] = "BAJA_O_INHIBIDA";
  let stage = "Condiciones difíciles o ejemplares muy jóvenes para desovar en este momento.";
  if (feasibilityPct >= 75.0) {
    cat = "ALTA";
    stage = "Condiciones excelentes para el desove y la fecundación dentro de las canastas.";
  } else if (feasibilityPct >= 45.0) {
    cat = "MODERADA";
    stage = "Reproducción posible pero frenada parcialmente por un factor del agua o la época.";
  }

  const recrNote = species.requires_host_fish_for_recruitment
    ? `Este porcentaje mide el desove y la incubación de larvas (${species.larval_type}) dentro de la canasta. Para que esas larvas se conviertan en almejas jóvenes nuevas dentro del estanque, se necesita la presencia de peces nativos hospederos.`
    : "Desarrollo directo sin requerir peces hospederos.";

  return {
    species_id: species.species_id,
    scientific_name: species.scientific_name,
    larval_type: species.larval_type,
    requires_host_fish_for_recruitment: species.requires_host_fish_for_recruitment,
    spawning_feasibility_pct: round(feasibilityPct, 1),
    feasibility_category: cat,
    reproductive_stage_note: stage,
    limiting_factor_key: limitingKey,
    limiting_factor_label: labels[limitingKey],
    factors_pct: {
      size_maturity: round(fTalla * 100, 1),
      season_synchrony: round(fEpoca * 100, 1),
      thermal_window: round(fTRep * 100, 1),
      deb_gonad_energy: round(fDebRep * 100, 1),
      marsupial_water_safety: round(fQuimRep * 100, 1),
      tray_fertilization_proximity: round(fFert * 100, 1),
    },
    facilitating_factors: facilitating,
    hindering_factors: hindering,
    recommended_action: lowest < 0.8 ? actions[limitingKey] : "Condiciones óptimas; mantener oxigenación estable.",
    recruitment_disclaimer: recrNote,
  };
}

function block9FrontendPercentages(params: {
  ecoliNow: number;
  ecoliInit: number;
  ecoliTarget: number;
  tssNow: number;
  tssInit: number;
  tssTarget: number;
  ammoniaNow: number;
  ammoniaMaxRef: number;
  ammoniaTarget: number;
  oxygenNow: number;
  tempC: number;
  crEff: number;
  crMax: number;
  fTss: number;
  etaModule: number;
  mInstalledKg: number;
  mStarKg: number;
  kRatio: number;
  cumulativeFilteredL: number;
  volumeL: number;
  hoursToEcoli: number | null;
  hoursToEcoliNoClams: number | null;
  hoursToTss: number | null;
  daysToMaintenance: number;
  sinkShares: FrontendPercentagesSummary["nutrient_sink_shares_pct"];
}): FrontendPercentagesSummary {
  const pBact =
    params.ecoliNow <= params.ecoliTarget
      ? 100.0
      : clip(
          ((params.ecoliInit - params.ecoliNow) / Math.max(1e-6, params.ecoliInit - params.ecoliTarget)) * 100.0,
          0.0,
          100.0
        );
  const pClar =
    params.tssNow <= params.tssTarget
      ? 100.0
      : clip(((params.tssInit - params.tssNow) / Math.max(1e-6, params.tssInit - params.tssTarget)) * 100.0, 0.0, 100.0);
  const o2Sat = saturationOxygenMgL(params.tempC);
  const pO2 = clip((params.oxygenNow / Math.max(1e-6, o2Sat)) * 100.0, 0.0, 100.0);
  const pNh4 =
    params.ammoniaNow <= params.ammoniaTarget
      ? 100.0
      : clip(
          ((params.ammoniaMaxRef - params.ammoniaNow) / Math.max(1e-6, params.ammoniaMaxRef - params.ammoniaTarget)) *
            100.0,
          0.0,
          100.0
        );

  const health = clip(0.3 * pBact + 0.25 * pClar + 0.25 * pO2 + 0.2 * pNh4, 0.0, 100.0);
  let sem: FrontendPercentagesSummary["health_semaphore"] = "ROJO";
  let lbl = "Agua por limpiar";
  if (health >= 75.0) {
    sem = "VERDE";
    lbl = "Agua Óptima";
  } else if (health >= 45.0) {
    sem = "AMARILLO";
    lbl = "En Limpieza";
  }

  const pPump = clip((params.crEff / Math.max(1e-6, params.crMax)) * 100.0, 0.0, 100.0);
  const pTurbLoss = clip((1.0 - params.fTss) * 100.0, 0.0, 100.0);
  const pSimb = params.mStarKg <= 1e-6 ? 150.0 : clip((params.mInstalledKg / params.mStarKg) * 100.0, 0.0, 150.0);
  const pPerm = clip(params.kRatio * 100.0, 0.0, 100.0);
  const pClog = clip(100.0 - pPerm, 0.0, 100.0);
  const pRecycled = (params.cumulativeFilteredL / Math.max(1.0, params.volumeL)) * 100.0;

  let speedup: number | null = null;
  if (params.hoursToEcoli !== null && params.hoursToEcoliNoClams !== null && params.hoursToEcoliNoClams > 0) {
    speedup = round(Math.max(0.0, (1.0 - params.hoursToEcoli / params.hoursToEcoliNoClams) * 100.0), 1);
  }

  return {
    overall_water_health_pct: round(health, 1),
    health_semaphore: sem,
    health_label: lbl,
    bacteria_removal_pct: round(pBact, 1),
    clarity_pct: round(pClar, 1),
    oxygen_saturation_pct: round(pO2, 1),
    ammonia_safety_pct: round(pNh4, 1),
    bivalve_pumping_efficiency_pct: round(pPump, 1),
    module_spatial_efficiency_pct: round(params.etaModule * 100.0, 1),
    turbidity_limitation_pct: round(pTurbLoss, 1),
    symbiotic_balance_pct: round(pSimb, 1),
    tray_clogging_pct: round(pClog, 1),
    permeability_remaining_pct: round(pPerm, 1),
    water_recycled_fraction_pct: round(pRecycled, 1),
    estimated_hours_to_ecoli_target: params.hoursToEcoli === null ? null : round(params.hoursToEcoli, 1),
    estimated_hours_to_ecoli_without_bivalves:
      params.hoursToEcoliNoClams === null ? null : round(params.hoursToEcoliNoClams, 1),
    bivalve_speedup_pct: speedup,
    estimated_hours_to_clarity_target: params.hoursToTss === null ? null : round(params.hoursToTss, 1),
    estimated_days_to_tray_maintenance: round(params.daysToMaintenance, 1),
    nutrient_sink_shares_pct: params.sinkShares,
  };
}

function findCrossingTime(
  times: number[],
  values: number[],
  target: number,
  effRateEnd?: number
): number | null {
  if (!values.length) return null;
  if (values[0] <= target) return 0.0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] <= target) {
      const v0 = values[i - 1];
      const v1 = values[i];
      const t0 = times[i - 1];
      const t1 = times[i];
      const frac = (v0 - target) / Math.max(1e-12, v0 - v1);
      return t0 + frac * (t1 - t0);
    }
  }
  if (effRateEnd && effRateEnd > 1e-6 && values[values.length - 1] > target) {
    return times[times.length - 1] + Math.log(values[values.length - 1] / target) / effRateEnd;
  }
  return null;
}

function estimateDaysToClogging(
  mDepNow: number,
  tNowH: number,
  nTotal: number,
  bdIndMgH: number,
  rCaGLH: number,
  hydroParams: RegionProfileData["hydraulics_and_clogging"]
): number {
  if (nTotal === 0 && rCaGLH <= 1e-9) return 365.0;
  let mDep = mDepNow;
  let tH = tNowH;
  const dtH = 6.0;
  const maxH = 365.0 * 24.0;
  while (tH < maxH) {
    const res = block7KozenyCarmanClogging(mDep, nTotal, bdIndMgH, rCaGLH, hydroParams, tH);
    if (res.K_ratio <= 0.45) {
      return Math.max(0.0, (tH - tNowH) / 24.0);
    }
    mDep = Math.max(0.0, mDep + dtH * res.d_m_dep_mg_h);
    tH += dtH;
  }
  return 365.0;
}

export function runLocalSimulation(
  design: VisualDesignInput,
  water: WaterInitialAndIoTInput,
  targets: SimulationTargetsInput,
  includeSensitivity = true,
  regionOverride?: RegionProfileData,
  speciesOverride?: SpeciesProfileData
): DigitalTwinSimulationResult {
  const t0Perf = performance.now();
  const region = regionOverride || REGION_PROFILES[design.region_id] || REGION_PROFILES.yucatan_karst;
  const species = speciesOverride || SPECIES_PROFILES[design.species_id] || SPECIES_PROFILES.anodontites_trapesialis;
  const spParams = { ...species.parameters };
  const base = region.water_baseline;

  const tssVal =
    water.tss_mg_L !== null
      ? water.tss_mg_L
      : water.turbidity_ntu !== null
      ? water.turbidity_ntu * base.ntu_to_tss_factor
      : 15.0;
  const caVal = water.calcium_mg_L !== null ? water.calcium_mg_L : base.calcium_mg_L;
  const hco3Val = water.bicarbonate_mg_L !== null ? water.bicarbonate_mg_L : base.bicarbonate_mg_L;
  const parVal = water.par_light_umol_m2_s !== null ? water.par_light_umol_m2_s : base.par_light_umol_m2_s;

  const inflow = {
    ecoli: water.inflow_ecoli_ufc_100mL ?? water.pathogen_ecoli_ufc_100mL,
    tss: water.inflow_tss_mg_L ?? tssVal,
    nh4: water.inflow_ammonia_n_mg_L ?? water.ammonia_n_mg_L,
    no3: water.inflow_nitrate_n_mg_L ?? water.nitrate_n_mg_L,
    po4: water.inflow_phosphate_p_mg_L ?? water.phosphate_p_mg_L,
  };

  const geom = block1ModuleGeometry(design, spParams);
  const cleanRefTss = Math.min(tssVal, Math.max(targets.target_tss_mg_L, 4.0));
  const bivClean = block2BivalveEcophysiology(
    water.temp_c,
    cleanRefTss,
    water.dissolved_oxygen_mg_L,
    water.organic_fraction_tss,
    geom,
    spParams
  );
  const designBalance = block5CriticalMacrophyteBiomass(
    design,
    geom,
    bivClean,
    water.temp_c,
    parVal,
    water.dissolved_oxygen_mg_L,
    water.nitrifier_biomass_mg_L,
    targets.target_ammonia_n_mg_L,
    inflow.nh4,
    region.macrophytes,
    region.cwm1_bacteria
  );

  // RK4 Sub-paso (idéntico al motor Python)
  const y0 = [
    water.pathogen_ecoli_ufc_100mL,
    tssVal,
    water.ammonia_n_mg_L,
    water.nitrate_n_mg_L,
    water.phosphate_p_mg_L,
    water.dissolved_oxygen_mg_L,
    0.0,
    0.0,
  ];

  const rhs = (tH: number, y: number[]): number[] => {
    const ecoliV = Math.max(0.0, y[0]);
    const tssV = Math.max(0.0, y[1]);
    const nh4V = Math.max(0.0, y[2]);
    const no3V = Math.max(0.0, y[3]);
    const po4V = Math.max(0.0, y[4]);
    const oxyV = Math.min(18.0, Math.max(0.0, y[5]));
    const mDepV = Math.max(0.0, y[6]);

    const biv = block2BivalveEcophysiology(
      water.temp_c,
      tssV,
      oxyV,
      water.organic_fraction_tss,
      geom,
      spParams
    );
    const bio = block3MacrophyteBacteriome(
      design,
      water.temp_c,
      parVal,
      nh4V,
      no3V,
      po4V,
      oxyV,
      water.nitrifier_biomass_mg_L,
      region.macrophytes,
      region.cwm1_bacteria
    );
    const karst = block4KarstGeochemistry(
      design.volume_liters,
      water.temp_c,
      water.ph,
      caVal,
      hco3Val,
      po4V,
      region.karst_calcita
    );
    const odes = block6PathogenAndWaterOdes(
      { ecoli: ecoliV, tss: tssV, nh4: nh4V, no3: no3V, po4: po4V, oxygen: oxyV },
      design,
      geom,
      biv,
      bio,
      karst,
      inflow,
      water.temp_c,
      parVal,
      region.macrophytes,
      region.cwm1_bacteria,
      region.hydraulics_and_clogging,
      spParams,
      base.kLa_reaeration_h
    );
    const clog = block7KozenyCarmanClogging(
      mDepV,
      geom.total_bivalves_n,
      biv.BD_ind_mg_h,
      karst.r_Ca_g_L_h,
      region.hydraulics_and_clogging,
      tH
    );

    return [
      odes.d_ecoli,
      odes.d_tss,
      odes.d_nh4,
      odes.d_no3,
      odes.d_po4,
      odes.d_oxygen,
      clog.d_m_dep_mg_h,
      biv.Q_biv_L_h,
    ];
  };

  const times: number[] = [];
  for (let t = 0; t <= targets.horizon_hours + 1e-9; t += targets.dt_output_hours) {
    times.push(round(t, 2));
  }
  if (times[times.length - 1] < targets.horizon_hours - 1e-6) {
    times.push(targets.horizon_hours);
  }

  const history: number[][] = [y0.slice()];
  let yCur = y0.slice();
  for (let idx = 1; idx < times.length; idx++) {
    const tCur = times[idx - 1];
    const tNext = times[idx];
    const sub = Math.max(1, Math.ceil((tNext - tCur) / 0.1));
    const h = (tNext - tCur) / sub;
    for (let s = 0; s < sub; s++) {
      const tc = tCur + s * h;
      const k1 = rhs(tc, yCur);
      const y2 = yCur.map((v, i) => Math.max(0.0, v + 0.5 * h * k1[i]));
      const k2 = rhs(tc + 0.5 * h, y2);
      const y3 = yCur.map((v, i) => Math.max(0.0, v + 0.5 * h * k2[i]));
      const k3 = rhs(tc + 0.5 * h, y3);
      const y4 = yCur.map((v, i) => Math.max(0.0, v + h * k3[i]));
      const k4 = rhs(tc + h, y4);
      yCur = yCur.map((v, i) => Math.max(0.0, v + (h / 6.0) * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i])));
    }
    history.push(yCur.slice());
  }

  const ecoliSeries = history.map((r) => r[0]);
  const tssSeries = history.map((r) => r[1]);
  const nh4Series = history.map((r) => r[2]);
  const no3Series = history.map((r) => r[3]);
  const po4Series = history.map((r) => r[4]);
  const oxySeries = history.map((r) => r[5]);
  const mdepSeries = history.map((r) => r[6]);
  const cumqSeries = history.map((r) => r[7]);

  const initBiv = block2BivalveEcophysiology(
    water.temp_c,
    tssSeries[0],
    oxySeries[0],
    water.organic_fraction_tss,
    geom,
    spParams
  );
  const initBio = block3MacrophyteBacteriome(
    design,
    water.temp_c,
    parVal,
    nh4Series[0],
    no3Series[0],
    po4Series[0],
    oxySeries[0],
    water.nitrifier_biomass_mg_L,
    region.macrophytes,
    region.cwm1_bacteria
  );
  const initKarst = block4KarstGeochemistry(
    design.volume_liters,
    water.temp_c,
    water.ph,
    caVal,
    hco3Val,
    po4Series[0],
    region.karst_calcita
  );
  const initOdes = block6PathogenAndWaterOdes(
    {
      ecoli: ecoliSeries[0],
      tss: tssSeries[0],
      nh4: nh4Series[0],
      no3: no3Series[0],
      po4: po4Series[0],
      oxygen: oxySeries[0],
    },
    design,
    geom,
    initBiv,
    initBio,
    initKarst,
    inflow,
    water.temp_c,
    parVal,
    region.macrophytes,
    region.cwm1_bacteria,
    region.hydraulics_and_clogging,
    spParams,
    base.kLa_reaeration_h
  );

  const lastIdx = times.length - 1;
  const finalBiv = block2BivalveEcophysiology(
    water.temp_c,
    tssSeries[lastIdx],
    oxySeries[lastIdx],
    water.organic_fraction_tss,
    geom,
    spParams
  );
  const finalBio = block3MacrophyteBacteriome(
    design,
    water.temp_c,
    parVal,
    nh4Series[lastIdx],
    no3Series[lastIdx],
    po4Series[lastIdx],
    oxySeries[lastIdx],
    water.nitrifier_biomass_mg_L,
    region.macrophytes,
    region.cwm1_bacteria
  );
  const finalKarst = block4KarstGeochemistry(
    design.volume_liters,
    water.temp_c,
    water.ph,
    caVal,
    hco3Val,
    po4Series[lastIdx],
    region.karst_calcita
  );
  const finalOdes = block6PathogenAndWaterOdes(
    {
      ecoli: ecoliSeries[lastIdx],
      tss: tssSeries[lastIdx],
      nh4: nh4Series[lastIdx],
      no3: no3Series[lastIdx],
      po4: po4Series[lastIdx],
      oxygen: oxySeries[lastIdx],
    },
    design,
    geom,
    finalBiv,
    finalBio,
    finalKarst,
    inflow,
    water.temp_c,
    parVal,
    region.macrophytes,
    region.cwm1_bacteria,
    region.hydraulics_and_clogging,
    spParams,
    base.kLa_reaeration_h
  );

  const tMetaEcoli = findCrossingTime(times, ecoliSeries, targets.target_ecoli_ufc_100mL, finalOdes.k_total_bact_h);
  const kTssEnd =
    finalBiv.Q_biv_L_h / design.volume_liters +
    region.hydraulics_and_clogging.v_sed_m_h / Math.max(0.1, geom.water_depth_m);
  const tMetaTss = findCrossingTime(times, tssSeries, targets.target_tss_mg_L, kTssEnd);

  const kNoClams = initOdes.k_no_clams_bact_h;
  const tMetaEcoliNoClams =
    ecoliSeries[0] > targets.target_ecoli_ufc_100mL && kNoClams > 1e-6
      ? Math.log(Math.max(ecoliSeries[0], targets.target_ecoli_ufc_100mL) / targets.target_ecoli_ufc_100mL) / kNoClams
      : 0.0;

  const daysMaint = estimateDaysToClogging(
    mdepSeries[lastIdx],
    times[lastIdx],
    geom.total_bivalves_n,
    finalBiv.BD_ind_mg_h,
    finalKarst.r_Ca_g_L_h,
    region.hydraulics_and_clogging
  );

  const ammoniaMaxRef = Math.max(water.ammonia_n_mg_L, targets.target_ammonia_n_mg_L * 2.0, 1.2);

  const buildSinkShares = (
    bioD: ReturnType<typeof block3MacrophyteBacteriome>,
    karstD: ReturnType<typeof block4KarstGeochemistry>
  ) => {
    const nTot = bioD.R_bact_NH_mg_h + bioD.R_mac_NH_mg_h;
    const pTot = karstD.R_calcita_P_mg_h + bioD.R_mac_P_mg_h;
    return {
      ammonia: {
        bacteria_cwm1_pct: nTot > 1e-9 ? round((bioD.R_bact_NH_mg_h / nTot) * 100.0, 1) : 0.0,
        macrophytes_pct: nTot > 1e-9 ? round((bioD.R_mac_NH_mg_h / nTot) * 100.0, 1) : 0.0,
      },
      phosphorus: {
        karst_calcite_pct: pTot > 1e-9 ? round((karstD.R_calcita_P_mg_h / pTot) * 100.0, 1) : 0.0,
        macrophytes_pct: pTot > 1e-9 ? round((bioD.R_mac_P_mg_h / pTot) * 100.0, 1) : 0.0,
      },
    };
  };

  const initClog = block7KozenyCarmanClogging(
    mdepSeries[0],
    geom.total_bivalves_n,
    initBiv.BD_ind_mg_h,
    initKarst.r_Ca_g_L_h,
    region.hydraulics_and_clogging,
    times[0]
  );
  const finalClog = block7KozenyCarmanClogging(
    mdepSeries[lastIdx],
    geom.total_bivalves_n,
    finalBiv.BD_ind_mg_h,
    finalKarst.r_Ca_g_L_h,
    region.hydraulics_and_clogging,
    times[lastIdx]
  );

  const currentPct = block9FrontendPercentages({
    ecoliNow: ecoliSeries[0],
    ecoliInit: ecoliSeries[0],
    ecoliTarget: targets.target_ecoli_ufc_100mL,
    tssNow: tssSeries[0],
    tssInit: tssSeries[0],
    tssTarget: targets.target_tss_mg_L,
    ammoniaNow: nh4Series[0],
    ammoniaMaxRef,
    ammoniaTarget: targets.target_ammonia_n_mg_L,
    oxygenNow: oxySeries[0],
    tempC: water.temp_c,
    crEff: initBiv.CR_eff_L_h_ind,
    crMax: geom.cr_max_L_h_ind,
    fTss: initBiv.f_TSS,
    etaModule: geom.eta_module,
    mInstalledKg: designBalance.installed_root_biomass_kg,
    mStarKg: designBalance.critical_total_root_biomass_kg,
    kRatio: initClog.K_ratio,
    cumulativeFilteredL: 0.0,
    volumeL: design.volume_liters,
    hoursToEcoli: tMetaEcoli,
    hoursToEcoliNoClams: tMetaEcoliNoClams,
    hoursToTss: tMetaTss,
    daysToMaintenance: daysMaint,
    sinkShares: buildSinkShares(initBio, initKarst),
  });

  const remEcoli = tMetaEcoli !== null ? Math.max(0.0, tMetaEcoli - times[lastIdx]) : null;
  const remTss = tMetaTss !== null ? Math.max(0.0, tMetaTss - times[lastIdx]) : null;

  const finalPct = block9FrontendPercentages({
    ecoliNow: ecoliSeries[lastIdx],
    ecoliInit: ecoliSeries[0],
    ecoliTarget: targets.target_ecoli_ufc_100mL,
    tssNow: tssSeries[lastIdx],
    tssInit: tssSeries[0],
    tssTarget: targets.target_tss_mg_L,
    ammoniaNow: nh4Series[lastIdx],
    ammoniaMaxRef,
    ammoniaTarget: targets.target_ammonia_n_mg_L,
    oxygenNow: oxySeries[lastIdx],
    tempC: water.temp_c,
    crEff: finalBiv.CR_eff_L_h_ind,
    crMax: geom.cr_max_L_h_ind,
    fTss: finalBiv.f_TSS,
    etaModule: geom.eta_module,
    mInstalledKg: designBalance.installed_root_biomass_kg,
    mStarKg: designBalance.critical_total_root_biomass_kg,
    kRatio: finalClog.K_ratio,
    cumulativeFilteredL: cumqSeries[lastIdx],
    volumeL: design.volume_liters,
    hoursToEcoli: remEcoli,
    hoursToEcoliNoClams: tMetaEcoliNoClams,
    hoursToTss: remTss,
    daysToMaintenance: daysMaint,
    sinkShares: buildSinkShares(finalBio, finalKarst),
  });

  const reproInit = block8ReproductiveFeasibility(
    species,
    spParams,
    geom,
    initBiv,
    design,
    water.temp_c,
    oxySeries[0],
    nh4Series[0],
    region.latitude_deg
  );
  const reproFinal = block8ReproductiveFeasibility(
    species,
    spParams,
    geom,
    finalBiv,
    design,
    water.temp_c,
    oxySeries[lastIdx],
    nh4Series[lastIdx],
    region.latitude_deg
  );

  // Controlador electrónico (Bloque 9)
  const fDebRep0 = reproInit.factors_pct.deb_gonad_energy / 100.0;
  const spawningActive = reproInit.spawning_feasibility_pct >= 75.0;
  const uAire = clip(28.0 * (targets.target_oxygen_mg_L - oxySeries[0]), 0.0, 100.0);
  const uFlujo = clip(
    40.0 + 2.5 * (tssSeries[0] - targets.target_tss_mg_L) - (spawningActive ? 20.0 : 0.0),
    15.0,
    100.0
  );
  const uTerm = clip(22.0 * (water.temp_c - spParams.T_rep_opt_C), 0.0, 100.0);
  const uAlim = clip(120.0 * (0.75 - fDebRep0), 0.0, 100.0);
  const ctrlNotes: string[] = [];
  if (uAire > 10.0)
    ctrlNotes.push(
      `Oxigenador recomendado al ${uAire.toFixed(0)}% para subir el oxígeno hacia ${targets.target_oxygen_mg_L.toFixed(1)} mg/L.`
    );
  if (uTerm > 15.0)
    ctrlNotes.push(`Sombra o enfriamiento al ${uTerm.toFixed(0)}% para acercar el agua a ${spParams.T_rep_opt_C} °C.`);
  if (uAlim > 10.0)
    ctrlNotes.push(`Suplemento de microalgas sugerido al ${uAlim.toFixed(0)}% si se busca estimular reproducción.`);
  if (!ctrlNotes.length) ctrlNotes.push("Equipos en flujo suave de mantenimiento.");

  const controllerSlot: ControllerSlotOutput = {
    mode: "DRY_RUN_RECOMMENDATION",
    pwm_aerator_pct: round(uAire, 1),
    pwm_recirculation_pump_pct: round(uFlujo, 1),
    pwm_thermal_cooling_pct: round(uTerm, 1),
    pwm_microalgae_doser_pct: round(uAlim, 1),
    notes: ctrlNotes,
  };

  const tsPoints: TimeSeriesPoint[] = times.map((tVal, idx) => {
    const bivI = block2BivalveEcophysiology(
      water.temp_c,
      tssSeries[idx],
      oxySeries[idx],
      water.organic_fraction_tss,
      geom,
      spParams
    );
    const clogI = block7KozenyCarmanClogging(
      mdepSeries[idx],
      geom.total_bivalves_n,
      bivI.BD_ind_mg_h,
      finalKarst.r_Ca_g_L_h,
      region.hydraulics_and_clogging,
      tVal
    );
    const pctI = block9FrontendPercentages({
      ecoliNow: ecoliSeries[idx],
      ecoliInit: ecoliSeries[0],
      ecoliTarget: targets.target_ecoli_ufc_100mL,
      tssNow: tssSeries[idx],
      tssInit: tssSeries[0],
      tssTarget: targets.target_tss_mg_L,
      ammoniaNow: nh4Series[idx],
      ammoniaMaxRef,
      ammoniaTarget: targets.target_ammonia_n_mg_L,
      oxygenNow: oxySeries[idx],
      tempC: water.temp_c,
      crEff: bivI.CR_eff_L_h_ind,
      crMax: geom.cr_max_L_h_ind,
      fTss: bivI.f_TSS,
      etaModule: geom.eta_module,
      mInstalledKg: designBalance.installed_root_biomass_kg,
      mStarKg: designBalance.critical_total_root_biomass_kg,
      kRatio: clogI.K_ratio,
      cumulativeFilteredL: cumqSeries[idx],
      volumeL: design.volume_liters,
      hoursToEcoli: null,
      hoursToEcoliNoClams: null,
      hoursToTss: null,
      daysToMaintenance: daysMaint,
      sinkShares: {
        ammonia: { bacteria_cwm1_pct: 88, macrophytes_pct: 12 },
        phosphorus: { karst_calcite_pct: 98, macrophytes_pct: 2 },
      },
    });
    const repI = block8ReproductiveFeasibility(
      species,
      spParams,
      geom,
      bivI,
      design,
      water.temp_c,
      oxySeries[idx],
      nh4Series[idx],
      region.latitude_deg
    );

    return {
      time_h: tVal,
      ecoli_ufc_100mL: round(ecoliSeries[idx], 1),
      tss_mg_L: round(tssSeries[idx], 3),
      ammonia_n_mg_L: round(nh4Series[idx], 4),
      nitrate_n_mg_L: round(no3Series[idx], 4),
      phosphate_p_mg_L: round(po4Series[idx], 4),
      oxygen_mg_L: round(oxySeries[idx], 3),
      cr_eff_L_h_ind: round(bivI.CR_eff_L_h_ind, 4),
      q_biv_total_L_h: round(bivI.Q_biv_L_h, 2),
      permeability_K_ratio: round(clogI.K_ratio, 4),
      water_health_pct: pctI.overall_water_health_pct,
      reproductive_feasibility_pct: repI.spawning_feasibility_pct,
    };
  });

  const evCounts = {
    A: region.evidence_counts.A + species.evidence_counts.A,
    B: region.evidence_counts.B + species.evidence_counts.B,
    C: region.evidence_counts.C + species.evidence_counts.C,
    D: region.evidence_counts.D + species.evidence_counts.D,
  };
  const totalParams = evCounts.A + evCounts.B + evCounts.C + evCounts.D;
  const governance: ParameterGovernanceReport = {
    region_id: region.region_id,
    region_status: region.status,
    species_id: species.species_id,
    species_status: species.status,
    evidence_counts: evCounts,
    evidence_summary: `${totalParams} datos científicos activos (${evCounts.B} medidos en cenotes/especie, ${evCounts.C} de literatura científica y ${evCounts.D} valores semilla por confirmar en laboratorio).`,
    pending_verifications: species.pending_verifications,
    disclaimer:
      "Los valores marcados como semilla permiten simular escenarios completos hoy y se actualizan conforme avanzan las mediciones en campo.",
  };

  let sensitivityRanking: SensitivityItem[] = [];
  if (includeSensitivity) {
    const baseT = currentPct.estimated_hours_to_ecoli_target || targets.horizon_hours;
    const baseM = Math.max(0.01, designBalance.critical_total_root_biomass_kg);
    const candidates: Array<{ group: "species" | "cwm1" | "mac"; key: string; label: string }> = [
      { group: "species", key: "a_CR", label: "Capacidad de bombeo de la almeja" },
      { group: "species", key: "TSS_50_mg_L", label: "Resistencia de la almeja al agua turbia" },
      { group: "species", key: "alpha_hidr_N", label: "Nutrientes liberados por las almejas" },
      { group: "species", key: "eta_ret_bact", label: "Retención de bacterias al filtrar" },
      { group: "cwm1", key: "f_XA_active", label: "Bacterias benéficas en las raíces" },
      { group: "mac", key: "mu_SG_N_mg_g_h", label: "Velocidad de absorción de las plantas" },
    ];
    sensitivityRanking = candidates
      .map((c) => {
        const regClone: RegionProfileData = JSON.parse(JSON.stringify(region));
        const spClone: SpeciesProfileData = JSON.parse(JSON.stringify(species));
        if (c.group === "species") spClone.parameters[c.key] *= 1.1;
        else if (c.group === "cwm1") (regClone.cwm1_bacteria as Record<string, number>)[c.key] *= 1.1;
        else (regClone.macrophytes as Record<string, number>)[c.key] *= 1.1;

        const pert = runLocalSimulation(design, water, targets, false, regClone, spClone);
        const pertT = pert.current_percentages.estimated_hours_to_ecoli_target || targets.horizon_hours;
        const pertM = pert.design_balance.critical_total_root_biomass_kg;
        return {
          parameter: c.key,
          label: c.label,
          delta_t_meta_pct: round(((pertT - baseT) / Math.max(0.01, baseT)) * 100.0, 2),
          delta_m_star_pct: round(((pertM - baseM) / baseM) * 100.0, 2),
        };
      })
      .sort((a, b) => Math.abs(b.delta_t_meta_pct) + Math.abs(b.delta_m_star_pct) - (Math.abs(a.delta_t_meta_pct) + Math.abs(a.delta_m_star_pct)));
  }

  return {
    geometry: geom,
    design_balance: designBalance,
    current_percentages: currentPct,
    final_percentages: finalPct,
    reproduction_initial: reproInit,
    reproduction_at_target_or_final: reproFinal,
    controller_slot: controllerSlot,
    governance,
    time_series: tsPoints,
    sensitivity_ranking: sensitivityRanking,
    solver_backend: "Motor Local TS (RK4)",
    compute_time_ms: round(performance.now() - t0Perf, 2),
  };
}

// Cliente Híbrido: intenta conectar con FastAPI (localhost:8000) y si no está activo usa el motor local TS
const API_BASE = "http://localhost:8000";

export async function runHybridSimulation(
  design: VisualDesignInput,
  water: WaterInitialAndIoTInput,
  targets: SimulationTargetsInput
): Promise<{ result: DigitalTwinSimulationResult; isBackendOnline: boolean }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 650);
    const resp = await fetch(`${API_BASE}/simulate?include_sensitivity=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ design, water, targets }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (resp.ok) {
      const data = (await resp.json()) as DigitalTwinSimulationResult;
      return { result: data, isBackendOnline: true };
    }
  } catch {
    // Fallback instantáneo al motor local TS
  }
  const localResult = runLocalSimulation(design, water, targets, true);
  return { result: localResult, isBackendOnline: false };
}
