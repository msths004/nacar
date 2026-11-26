"""
Modelos de datos Pydantic v2 para el Backend del Gemelo Digital del Proyecto NÁCAR.

Separa estrictamente:
1. Datos "sacables a vista" de diseño físico y geométrico (VisualDesignInput).
2. Lecturas de sensores IoT / condiciones iniciales del agua (WaterInitialAndIoTInput).
3. Metas sanitarias y horizonte temporal de simulación (SimulationTargetsInput).
4. Estructuras de salida interpretables (porcentajes 0-100%, tiempos restantes,
   factibilidad reproductiva por especie, biomasa crítica de macrófitas, consignas de
   controlador electrónico futuro y gobernanza de niveles de evidencia A/B/C/D).
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class VisualDesignInput(BaseModel):
    """Parámetros geométricos y de arreglo físico 'sacables a vista' en campo."""

    volume_liters: float = Field(12000.0, gt=0.0, description="Volumen total efectivo de agua V [L].")
    wetland_area_m2: float = Field(10.0, gt=0.0, description="Área superficial del espejo de agua A_hum [m^2].")
    inflow_L_h: float = Field(0.0, ge=0.0, description="Caudal volumétrico externo Q_in [L/h] (0 = lote estático).")
    crossflow_vel_cm_s: float = Field(1.5, ge=0.0, description="Velocidad horizontal media del agua v_x [cm/s].")

    # Geometría del módulo tipo linterna de bandejas circulares apiladas
    num_modules: int = Field(2, ge=0, description="Número de columnas suspendidas M_mod [módulos].")
    trays_per_module: int = Field(6, ge=1, description="Número de pisos/bandejas por módulo K_pisos.")
    tray_diameter_cm: float = Field(50.0, gt=0.0, description="Diámetro de cada bandeja circular D_b [cm].")
    tray_vertical_spacing_cm: float = Field(18.0, gt=0.0, description="Altura entre pisos h_piso [cm].")
    clams_per_tray: int = Field(20, ge=0, description="Número de bivalvos por bandeja circular n_b.")
    clam_spacing_override_cm: Optional[float] = Field(
        None,
        gt=0.0,
        description="Distancia media manual entre almejas d_almejas [cm]. Si es None, se estima por Ec. 1.1.",
    )
    shell_length_mm: float = Field(65.0, gt=5.0, le=200.0, description="Longitud media de concha L [mm].")

    # Macrófitas y perfiles intercambiables ("Construir Local, Diseñar Global")
    macrophyte_area_m2: float = Field(4.5, ge=0.0, description="Área superficial plantada A_mac [m^2].")
    macrophyte_root_biomass_override_kg: Optional[float] = Field(
        None,
        ge=0.0,
        description="Biomasa seca activa de raíces m [kg MS]. Si es None, se calcula con Ec. 3.1.",
    )
    species_id: str = Field(
        "anodontites_trapesialis",
        description="Identificador de especie de bivalvo (por defecto: especie focal A. trapesialis).",
    )
    region_id: str = Field(
        "yucatan_karst",
        description="Identificador del perfil hidrogeoquímico regional (Fase 1: yucatan_karst).",
    )
    month_of_year: int = Field(
        4,
        ge=1,
        le=12,
        description="Mes del año (1-12) para sincronía fotoperiódica/reproductiva tau_mes.",
    )


class WaterInitialAndIoTInput(BaseModel):
    """Condiciones iniciales en t=0 o paquete en vivo proveniente de sensores IoT."""

    temp_c: float = Field(27.5, ge=0.0, le=45.0, description="Temperatura del agua T [degC].")
    ph: float = Field(7.45, ge=4.0, le=10.5, description="Potencial de hidrógeno pH.")
    dissolved_oxygen_mg_L: float = Field(6.2, ge=0.0, le=20.0, description="Oxígeno disuelto S_O [mg/L].")
    tss_mg_L: Optional[float] = Field(
        18.0,
        ge=0.0,
        description="Sólidos suspendidos totales TSS [mg/L]. Si es None y hay turbidity_ntu, el Soft-Sensor lo estima.",
    )
    turbidity_ntu: Optional[float] = Field(
        None,
        ge=0.0,
        description="Lectura opcional del sensor nefelométrico de turbidez [NTU].",
    )
    organic_fraction_tss: float = Field(
        0.55, ge=0.0, le=1.0, description="Fracción orgánica particulada f_org = POM / TSS."
    )
    pathogen_ecoli_ufc_100mL: float = Field(
        2400.0, ge=0.0, description="Coliformes fecales / E. coli X_pat [UFC/100mL]."
    )
    ammonia_n_mg_L: float = Field(1.20, ge=0.0, description="Nitrógeno amoniacal total S_NH [mg N/L].")
    nitrate_n_mg_L: float = Field(2.50, ge=0.0, description="Nitrógeno de nitratos y nitritos S_NO [mg N/L].")
    phosphate_p_mg_L: float = Field(0.65, ge=0.0, description="Fósforo reactivo soluble S_PO4 [mg P/L].")
    calcium_mg_L: Optional[float] = Field(
        None, ge=0.0, description="Calcio disuelto S_Ca [mg Ca/L]. None usa línea base regional."
    )
    bicarbonate_mg_L: Optional[float] = Field(
        None, ge=0.0, description="Alcalinidad bicarbonatada S_HCO3 [mg HCO3-/L]. None usa línea base regional."
    )
    par_light_umol_m2_s: Optional[float] = Field(
        None, ge=0.0, description="Radiación fotosintéticamente activa I_PAR [umol/m^2/s]."
    )
    nitrifier_biomass_mg_L: float = Field(
        12.0, ge=0.0, description="Biomasa nitrificante autótrofa efectiva X_A [mg DQO/L]."
    )
    heterotroph_biomass_mg_L: float = Field(
        15.0, ge=0.0, description="Biomasa bacteriana heterótrofa activa X_H [mg DQO/L] (CWM1)."
    )
    fermentable_cod_S_F_mg_L: float = Field(
        6.0, ge=0.0, description="DQO soluble rápidamente fermentable S_F [mg DQO/L] (CWM1)."
    )
    acetate_cod_S_A_mg_L: float = Field(
        3.0, ge=0.0, description="Ácidos grasos volátiles / acetato S_A [mg DQO/L] (CWM1)."
    )
    slowly_biodegradable_X_S_mg_L: float = Field(
        8.0, ge=0.0, description="Sustrato orgánico particulado de hidrólisis lenta X_S [mg DQO/L] (CWM1)."
    )
    basal_food_pom_mg_L: float = Field(
        0.95,
        ge=0.0,
        description="Fitoplancton / seston nutritivo basal natural en agua clarificada [mg POM/L] para sostener reserva DEB.",
    )

    # Valores externos entrantes (si Q_in > 0; por defecto iguales a condición inicial o basal)
    inflow_ecoli_ufc_100mL: Optional[float] = Field(None, ge=0.0)
    inflow_tss_mg_L: Optional[float] = Field(None, ge=0.0)
    inflow_ammonia_n_mg_L: Optional[float] = Field(None, ge=0.0)
    inflow_nitrate_n_mg_L: Optional[float] = Field(None, ge=0.0)
    inflow_phosphate_p_mg_L: Optional[float] = Field(None, ge=0.0)


class SimulationTargetsInput(BaseModel):
    """Metas de calidad de agua y horizonte temporal para predicción de t_meta."""

    target_ecoli_ufc_100mL: float = Field(200.0, gt=0.0, description="Meta sanitaria de E. coli [UFC/100mL].")
    target_tss_mg_L: float = Field(3.0, gt=0.0, description="Meta de claridad / sólidos suspendidos [mg/L].")
    target_ammonia_n_mg_L: float = Field(0.25, gt=0.0, description="Meta segura de amonio S_NH,meta [mg N/L].")
    target_oxygen_mg_L: float = Field(6.0, gt=0.0, description="Consigna mínima deseada de oxígeno [mg/L].")
    horizon_hours: float = Field(72.0, gt=0.0, le=720.0, description="Horizonte temporal de simulación [h].")
    dt_output_hours: float = Field(1.0, gt=0.05, le=24.0, description="Paso de muestreo de salida [h].")


class SimulateRequest(BaseModel):
    design: VisualDesignInput = Field(default_factory=VisualDesignInput)
    water: WaterInitialAndIoTInput = Field(default_factory=WaterInitialAndIoTInput)
    targets: SimulationTargetsInput = Field(default_factory=SimulationTargetsInput)


class IoTAssimilationRequest(BaseModel):
    """Solicitud de asimilación en tiempo real cuando llegan lecturas de sensores IoT."""

    design: VisualDesignInput = Field(default_factory=VisualDesignInput)
    predicted_state: WaterInitialAndIoTInput = Field(
        ..., description="Estado previo predicho por el Gemelo Digital antes de la lectura IoT."
    )
    sensor_reading: WaterInitialAndIoTInput = Field(
        ..., description="Lectura más reciente medida por la sonda multiparamétrica IoT."
    )
    targets: SimulationTargetsInput = Field(default_factory=SimulationTargetsInput)
    kalman_gain: float = Field(
        0.65, ge=0.0, le=1.0, description="Ganancia de corrección tipo Kalman K sobre variables observables."
    )


class ModuleGeometrySummary(BaseModel):
    total_bivalves_n: int
    clam_spacing_cm: float
    free_shell_gap_cm: float
    eta_horizontal: float
    eta_vertical: float
    eta_module: float
    spatial_efficiency_pct: float
    water_depth_m: float
    wetland_volume_L: float
    shell_afdw_g_ind: float
    cr_max_L_h_ind: float


class FrontendPercentagesSummary(BaseModel):
    """Indicadores de 0 a 100% fáciles de interpretar para el usuario del Frontend."""

    overall_water_health_pct: float
    health_semaphore: Literal["VERDE", "AMARILLO", "ROJO"]
    health_label: str
    bacteria_removal_pct: float
    clarity_pct: float
    oxygen_saturation_pct: float
    ammonia_safety_pct: float
    bivalve_pumping_efficiency_pct: float
    module_spatial_efficiency_pct: float
    turbidity_limitation_pct: float
    symbiotic_balance_pct: float
    tray_clogging_pct: float
    permeability_remaining_pct: float
    water_recycled_fraction_pct: float
    estimated_hours_to_ecoli_target: Optional[float]
    estimated_hours_to_ecoli_without_bivalves: Optional[float]
    bivalve_speedup_pct: Optional[float]
    estimated_hours_to_clarity_target: Optional[float]
    estimated_days_to_tray_maintenance: float
    nutrient_sink_shares_pct: Dict[str, Dict[str, float]]


class SymbioticBiomassDesignReport(BaseModel):
    """Resultado de tu ecuación de balance de masa para dimensionar plantas (m*) frente a n bivalvos."""

    installed_root_biomass_kg: float
    installed_macrophyte_area_m2: float
    critical_total_root_biomass_kg: float
    critical_total_macrophyte_area_m2: float
    critical_root_biomass_per_module_kg: float
    critical_area_per_module_m2: float
    ammonia_load_from_bivalves_mg_N_h: float
    external_ammonia_load_mg_N_h: float
    bacteriome_sink_at_target_mg_N_h: float
    macrophyte_specific_rate_at_target_mg_N_kg_h: float
    balance_status: Literal["SUPERAVIT_OPTIMO", "EQUILIBRIO_AJUSTADO", "DEFICIT_AMONIO"]
    recommendation: str


class ReproductiveFactorBreakdown(BaseModel):
    size_maturity: float
    season_synchrony: float
    thermal_window: float
    deb_gonad_energy: float
    marsupial_water_safety: float
    tray_fertilization_proximity: float


class ReproductiveFeasibilityReport(BaseModel):
    """Evaluación específica por especie y época sobre factibilidad de reproducción en las bandejas."""

    species_id: str
    scientific_name: str
    larval_type: str
    requires_host_fish_for_recruitment: bool
    spawning_feasibility_pct: float
    feasibility_category: Literal["ALTA", "MODERADA", "BAJA_O_INHIBIDA"]
    reproductive_stage_note: str
    limiting_factor_key: str
    limiting_factor_label: str
    factors_pct: ReproductiveFactorBreakdown
    facilitating_factors: List[str]
    hindering_factors: List[str]
    recommended_action: str
    recruitment_disclaimer: str


class ControllerSlotOutput(BaseModel):
    """Consignas generadas por el Slot de Controlador Electrónico futuro (Bloque 9)."""

    mode: Literal["DRY_RUN_RECOMMENDATION", "HARDWARE_ACTIVE"]
    pwm_aerator_pct: float
    pwm_recirculation_pump_pct: float
    pwm_thermal_cooling_pct: float
    pwm_microalgae_doser_pct: float
    notes: List[str]


class ParameterGovernanceReport(BaseModel):
    """Transparencia científica sobre el nivel de evidencia A/B/C/D de los parámetros activos."""

    region_id: str
    region_status: str
    species_id: str
    species_status: str
    evidence_counts: Dict[str, int]
    evidence_summary: str
    pending_verifications: List[str]
    disclaimer: str


class TimeSeriesPoint(BaseModel):
    time_h: float
    ecoli_ufc_100mL: float
    tss_mg_L: float
    ammonia_n_mg_L: float
    nitrate_n_mg_L: float
    phosphate_p_mg_L: float
    oxygen_mg_L: float
    cr_eff_L_h_ind: float
    q_biv_total_L_h: float
    permeability_K_ratio: float
    water_health_pct: float
    reproductive_feasibility_pct: float


class SensitivityItem(BaseModel):
    parameter: str
    label: str
    delta_t_meta_pct: float
    delta_m_star_pct: float


class DigitalTwinSimulationResult(BaseModel):
    geometry: ModuleGeometrySummary
    design_balance: SymbioticBiomassDesignReport
    current_percentages: FrontendPercentagesSummary
    final_percentages: FrontendPercentagesSummary
    reproduction_initial: ReproductiveFeasibilityReport
    reproduction_at_target_or_final: ReproductiveFeasibilityReport
    controller_slot: ControllerSlotOutput
    governance: ParameterGovernanceReport
    time_series: List[TimeSeriesPoint]
    sensitivity_ranking: List[SensitivityItem] = Field(default_factory=list)
    solver_backend: str
    compute_time_ms: float
