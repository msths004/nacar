export interface VisualDesignInput {
  volume_liters: number;
  wetland_area_m2: number;
  inflow_L_h: number;
  crossflow_vel_cm_s: number;
  num_modules: number;
  trays_per_module: number;
  tray_diameter_cm: number;
  tray_vertical_spacing_cm: number;
  clams_per_tray: number;
  clam_spacing_override_cm: number | null;
  shell_length_mm: number;
  macrophyte_area_m2: number;
  macrophyte_root_biomass_override_kg: number | null;
  species_id: string;
  region_id: string;
  month_of_year: number;
}

export interface WaterInitialAndIoTInput {
  temp_c: number;
  ph: number;
  dissolved_oxygen_mg_L: number;
  tss_mg_L: number | null;
  turbidity_ntu: number | null;
  organic_fraction_tss: number;
  pathogen_ecoli_ufc_100mL: number;
  ammonia_n_mg_L: number;
  nitrate_n_mg_L: number;
  phosphate_p_mg_L: number;
  calcium_mg_L: number | null;
  bicarbonate_mg_L: number | null;
  par_light_umol_m2_s: number | null;
  nitrifier_biomass_mg_L: number;
  heterotroph_biomass_mg_L?: number;
  fermentable_cod_S_F_mg_L?: number;
  acetate_cod_S_A_mg_L?: number;
  slowly_biodegradable_X_S_mg_L?: number;
  basal_food_pom_mg_L?: number;
  inflow_ecoli_ufc_100mL?: number | null;
  inflow_tss_mg_L?: number | null;
  inflow_ammonia_n_mg_L?: number | null;
  inflow_nitrate_n_mg_L?: number | null;
  inflow_phosphate_p_mg_L?: number | null;
}

export interface SimulationTargetsInput {
  target_ecoli_ufc_100mL: number;
  target_tss_mg_L: number;
  target_ammonia_n_mg_L: number;
  target_oxygen_mg_L: number;
  horizon_hours: number;
  dt_output_hours: number;
}

export interface ModuleGeometrySummary {
  total_bivalves_n: number;
  clam_spacing_cm: number;
  free_shell_gap_cm: number;
  eta_horizontal: number;
  eta_vertical: number;
  eta_module: number;
  spatial_efficiency_pct: number;
  water_depth_m: number;
  wetland_volume_L: number;
  shell_afdw_g_ind: number;
  cr_max_L_h_ind: number;
}

export interface FrontendPercentagesSummary {
  overall_water_health_pct: number;
  health_semaphore: "VERDE" | "AMARILLO" | "ROJO";
  health_label: string;
  bacteria_removal_pct: number;
  clarity_pct: number;
  oxygen_saturation_pct: number;
  ammonia_safety_pct: number;
  bivalve_pumping_efficiency_pct: number;
  module_spatial_efficiency_pct: number;
  turbidity_limitation_pct: number;
  symbiotic_balance_pct: number;
  tray_clogging_pct: number;
  permeability_remaining_pct: number;
  water_recycled_fraction_pct: number;
  estimated_hours_to_ecoli_target: number | null;
  estimated_hours_to_ecoli_without_bivalves: number | null;
  bivalve_speedup_pct: number | null;
  estimated_hours_to_clarity_target: number | null;
  estimated_days_to_tray_maintenance: number;
  nutrient_sink_shares_pct: {
    ammonia: { bacteria_cwm1_pct: number; macrophytes_pct: number };
    phosphorus: { karst_calcite_pct: number; macrophytes_pct: number };
  };
}

export interface SymbioticBiomassDesignReport {
  installed_root_biomass_kg: number;
  installed_macrophyte_area_m2: number;
  critical_total_root_biomass_kg: number;
  critical_total_macrophyte_area_m2: number;
  critical_root_biomass_per_module_kg: number;
  critical_area_per_module_m2: number;
  ammonia_load_from_bivalves_mg_N_h: number;
  external_ammonia_load_mg_N_h: number;
  bacteriome_sink_at_target_mg_N_h: number;
  macrophyte_specific_rate_at_target_mg_N_kg_h: number;
  balance_status: "SUPERAVIT_OPTIMO" | "EQUILIBRIO_AJUSTADO" | "DEFICIT_AMONIO";
  recommendation: string;
}

export interface ReproductiveFactorBreakdown {
  size_maturity: number;
  season_synchrony: number;
  thermal_window: number;
  deb_gonad_energy: number;
  marsupial_water_safety: number;
  tray_fertilization_proximity: number;
}

export interface ReproductiveFeasibilityReport {
  species_id: string;
  scientific_name: string;
  larval_type: string;
  requires_host_fish_for_recruitment: boolean;
  spawning_feasibility_pct: number;
  feasibility_category: "ALTA" | "MODERADA" | "BAJA_O_INHIBIDA";
  reproductive_stage_note: string;
  limiting_factor_key: string;
  limiting_factor_label: string;
  factors_pct: ReproductiveFactorBreakdown;
  facilitating_factors: string[];
  hindering_factors: string[];
  recommended_action: string;
  recruitment_disclaimer: string;
}

export interface ControllerSlotOutput {
  mode: "DRY_RUN_RECOMMENDATION" | "HARDWARE_ACTIVE";
  pwm_aerator_pct: number;
  pwm_recirculation_pump_pct: number;
  pwm_thermal_cooling_pct: number;
  pwm_microalgae_doser_pct: number;
  notes: string[];
}

export interface ParameterGovernanceReport {
  region_id: string;
  region_status: string;
  species_id: string;
  species_status: string;
  evidence_counts: { A: number; B: number; C: number; D: number };
  evidence_summary: string;
  pending_verifications: string[];
  disclaimer: string;
}

export interface TimeSeriesPoint {
  time_h: number;
  ecoli_ufc_100mL: number;
  tss_mg_L: number;
  ammonia_n_mg_L: number;
  nitrate_n_mg_L: number;
  phosphate_p_mg_L: number;
  oxygen_mg_L: number;
  cr_eff_L_h_ind: number;
  q_biv_total_L_h: number;
  permeability_K_ratio: number;
  water_health_pct: number;
  reproductive_feasibility_pct: number;
}

export interface SensitivityItem {
  parameter: string;
  label: string;
  delta_t_meta_pct: number;
  delta_m_star_pct: number;
}

export interface DigitalTwinSimulationResult {
  geometry: ModuleGeometrySummary;
  design_balance: SymbioticBiomassDesignReport;
  current_percentages: FrontendPercentagesSummary;
  final_percentages: FrontendPercentagesSummary;
  reproduction_initial: ReproductiveFeasibilityReport;
  reproduction_at_target_or_final: ReproductiveFeasibilityReport;
  controller_slot: ControllerSlotOutput;
  governance: ParameterGovernanceReport;
  time_series: TimeSeriesPoint[];
  sensitivity_ranking: SensitivityItem[];
  solver_backend: string;
  compute_time_ms: number;
}
