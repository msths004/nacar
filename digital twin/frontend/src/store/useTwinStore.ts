import { create } from "zustand";
import {
  CENOTE_PRESETS,
  REGION_PROFILES,
  runHybridSimulation,
  runLocalSimulation,
} from "../engine/nacarEngine";
import {
  DigitalTwinSimulationResult,
  SimulationTargetsInput,
  TimeSeriesPoint,
  VisualDesignInput,
  WaterInitialAndIoTInput,
} from "../types/twin";

export type ActiveTabView = "overview" | "water" | "symbiosis" | "reproduction" | "sensors";
export type ControlPanelTab = "space" | "water" | "targets";
export type TwinUiStyle = "nacar_capsule" | "plant_viewer" | "spectra_hud" | "spectra_analytics";
export type TwinColorTheme = "blue_purple" | "cad_slate" | "copper_gold" | "cenote_emerald";

export interface TwinPaletteColors {
  id: TwinColorTheme;
  top: string;
  mid: string;
  bot: string;
  text: string;
  light: string;
  bg: string;
  cardTop: string;
  cardBot: string;
  subcard: string;
  well: string;
  border: string;
}

export const TWIN_PALETTES: Record<TwinColorTheme, TwinPaletteColors> = {
  blue_purple: {
    id: "blue_purple",
    top: "#4F70F2",
    mid: "#5859DE",
    bot: "#6245C8",
    text: "#818CF8",
    light: "#A5B4FC",
    bg: "#0B0E16",
    cardTop: "#151A28",
    cardBot: "#111522",
    subcard: "#101420",
    well: "#0C0F19",
    border: "#252E45",
  },
  copper_gold: {
    id: "copper_gold",
    top: "#D98A3C",
    mid: "#C4732B",
    bot: "#A6591E",
    text: "#E7B06B",
    light: "#F3D7A4",
    bg: "#090807",
    cardTop: "#1A1613",
    cardBot: "#120F0D",
    subcard: "#14110E",
    well: "#0B0908",
    border: "#332920",
  },
  cad_slate: {
    id: "cad_slate",
    top: "#3B82F6",
    mid: "#2C6DE8",
    bot: "#1D4ED8",
    text: "#60A5FA",
    light: "#93C5FD",
    bg: "#0A1018",
    cardTop: "#15202E",
    cardBot: "#101925",
    subcard: "#0E1621",
    well: "#090F17",
    border: "#23354B",
  },
  cenote_emerald: {
    id: "cenote_emerald",
    top: "#14B8A6",
    mid: "#0D9488",
    bot: "#0F766E",
    text: "#2DD4BF",
    light: "#99F6E4",
    bg: "#061114",
    cardTop: "#10242A",
    cardBot: "#0B1A1F",
    subcard: "#0C1D22",
    well: "#071215",
    border: "#1E3F49",
  },
};

function readStoredValue<T extends string>(key: string, fallback: T): T {
  try {
    const v = window.localStorage.getItem(key);
    return (v as T) || fallback;
  } catch {
    return fallback;
  }
}

function writeStoredValue(key: string, val: string): void {
  try {
    window.localStorage.setItem(key, val);
  } catch {
    // ignore storage errors on restricted file:// contexts
  }
}

interface TwinStoreState {
  activeView: ActiveTabView;
  controlTab: ControlPanelTab;
  uiStyle: TwinUiStyle;
  colorTheme: TwinColorTheme;
  selectedPresetId: string;
  inspectSingleBasket: boolean;
  selectedHour: number;
  isPlayingTimeline: boolean;
  isBackendOnline: boolean;
  useNtuMode: boolean;
  iotSensorReading: WaterInitialAndIoTInput;
  kalmanGain: number;

  design: VisualDesignInput;
  water: WaterInitialAndIoTInput;
  targets: SimulationTargetsInput;
  result: DigitalTwinSimulationResult;

  setActiveView: (v: ActiveTabView) => void;
  setControlTab: (t: ControlPanelTab) => void;
  setUiStyle: (style: TwinUiStyle, syncDefaultPalette?: boolean) => void;
  setColorTheme: (theme: TwinColorTheme) => void;
  setInspectSingleBasket: (b: boolean) => void;
  setSelectedHour: (h: number) => void;
  setIsPlayingTimeline: (p: boolean) => void;
  setUseNtuMode: (b: boolean) => void;
  setKalmanGain: (g: number) => void;

  updateDesign: (patch: Partial<VisualDesignInput>) => void;
  updateWater: (patch: Partial<WaterInitialAndIoTInput>) => void;
  updateTargets: (patch: Partial<SimulationTargetsInput>) => void;
  updateIotReading: (patch: Partial<WaterInitialAndIoTInput>) => void;

  applyCenotePreset: (presetId: string) => void;
  autoSizeMacrophytes: () => void;
  assimilateIotWithKalman: () => void;
  refreshSimulation: () => Promise<void>;
  getCurrentTimePoint: () => TimeSeriesPoint;
}

const DEFAULT_DESIGN: VisualDesignInput = {
  volume_liters: 12000,
  wetland_area_m2: 10.0,
  inflow_L_h: 0.0,
  crossflow_vel_cm_s: 1.5,
  num_modules: 2,
  trays_per_module: 6,
  tray_diameter_cm: 50.0,
  tray_vertical_spacing_cm: 18.0,
  clams_per_tray: 20,
  clam_spacing_override_cm: null,
  shell_length_mm: 65.0,
  macrophyte_area_m2: 4.5,
  macrophyte_root_biomass_override_kg: null,
  species_id: "anodontites_trapesialis",
  region_id: "yucatan_karst",
  month_of_year: 4,
};

const DEFAULT_WATER: WaterInitialAndIoTInput = {
  temp_c: 27.5,
  ph: 7.45,
  dissolved_oxygen_mg_L: 6.2,
  tss_mg_L: 18.0,
  turbidity_ntu: 12.4,
  organic_fraction_tss: 0.55,
  pathogen_ecoli_ufc_100mL: 2400.0,
  ammonia_n_mg_L: 1.2,
  nitrate_n_mg_L: 2.5,
  phosphate_p_mg_L: 0.65,
  calcium_mg_L: 210.0,
  bicarbonate_mg_L: 360.0,
  par_light_umol_m2_s: 180.0,
  nitrifier_biomass_mg_L: 12.0,
};

const DEFAULT_TARGETS: SimulationTargetsInput = {
  target_ecoli_ufc_100mL: 200.0,
  target_tss_mg_L: 3.0,
  target_ammonia_n_mg_L: 0.25,
  target_oxygen_mg_L: 6.0,
  horizon_hours: 72.0,
  dt_output_hours: 1.0,
};

const initialResult = runLocalSimulation(DEFAULT_DESIGN, DEFAULT_WATER, DEFAULT_TARGETS, true);

export const useTwinStore = create<TwinStoreState>((set, get) => ({
  activeView: "overview",
  controlTab: "space",
  uiStyle: readStoredValue<TwinUiStyle>("nacar_dt_ui_style", "spectra_hud"),
  colorTheme: readStoredValue<TwinColorTheme>("nacar_dt_color_theme", "copper_gold"),
  selectedPresetId: "referencia_yucatan",
  inspectSingleBasket: false,
  selectedHour: 38,
  isPlayingTimeline: false,
  isBackendOnline: false,
  useNtuMode: false,
  iotSensorReading: {
    ...DEFAULT_WATER,
    temp_c: 28.4,
    dissolved_oxygen_mg_L: 5.5,
    tss_mg_L: 14.0,
    pathogen_ecoli_ufc_100mL: 1650,
    ammonia_n_mg_L: 1.05,
  },
  kalmanGain: 0.65,

  design: DEFAULT_DESIGN,
  water: DEFAULT_WATER,
  targets: DEFAULT_TARGETS,
  result: initialResult,

  setActiveView: (activeView) => set({ activeView }),
  setControlTab: (controlTab) => set({ controlTab }),
  setUiStyle: (uiStyle, syncDefaultPalette = true) => {
    writeStoredValue("nacar_dt_ui_style", uiStyle);
    if (!syncDefaultPalette) {
      set({ uiStyle });
      return;
    }
    const defaultThemeMap: Record<TwinUiStyle, TwinColorTheme> = {
      nacar_capsule: "blue_purple",
      plant_viewer: "cad_slate",
      spectra_hud: "copper_gold",
      spectra_analytics: "copper_gold",
    };
    const nextColor = defaultThemeMap[uiStyle];
    writeStoredValue("nacar_dt_color_theme", nextColor);
    set({ uiStyle, colorTheme: nextColor });
  },
  setColorTheme: (colorTheme) => {
    writeStoredValue("nacar_dt_color_theme", colorTheme);
    set({ colorTheme });
  },
  setInspectSingleBasket: (inspectSingleBasket) => set({ inspectSingleBasket }),
  setSelectedHour: (selectedHour) => set({ selectedHour }),
  setIsPlayingTimeline: (isPlayingTimeline) => set({ isPlayingTimeline }),
  setUseNtuMode: (useNtuMode) => set({ useNtuMode }),
  setKalmanGain: (kalmanGain) => set({ kalmanGain }),

  updateDesign: (patch) => {
    const prev = get().design;
    const nextDesign = { ...prev, ...patch };
    let nextWater = get().water;

    // Si cambia la región (ej. Yucatán -> Otra región aguas blandas), actualizar calcio/bicarbonato basal
    if (patch.region_id && patch.region_id !== prev.region_id) {
      const reg = REGION_PROFILES[patch.region_id] || REGION_PROFILES.yucatan_karst;
      nextWater = {
        ...nextWater,
        calcium_mg_L: reg.water_baseline.calcium_mg_L,
        bicarbonate_mg_L: reg.water_baseline.bicarbonate_mg_L,
        ph: reg.water_baseline.ph,
      };
    }

    const immediate = runLocalSimulation(nextDesign, nextWater, get().targets, true);
    set({ design: nextDesign, water: nextWater, result: immediate });
    void get().refreshSimulation();
  },

  updateWater: (patch) => {
    const nextWater = { ...get().water, ...patch };
    const immediate = runLocalSimulation(get().design, nextWater, get().targets, true);
    set({ water: nextWater, result: immediate, selectedPresetId: "custom" });
    void get().refreshSimulation();
  },

  updateTargets: (patch) => {
    const nextTargets = { ...get().targets, ...patch };
    const immediate = runLocalSimulation(get().design, get().water, nextTargets, true);
    const clampedHour = Math.min(get().selectedHour, nextTargets.horizon_hours);
    set({ targets: nextTargets, result: immediate, selectedHour: clampedHour });
    void get().refreshSimulation();
  },

  updateIotReading: (patch) => {
    set({ iotSensorReading: { ...get().iotSensorReading, ...patch } });
  },

  applyCenotePreset: (presetId) => {
    const preset = CENOTE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const nextDesign = {
      ...get().design,
      region_id: preset.region_id,
      ...(preset.design || {}),
    };
    const nextWater = {
      ...get().water,
      ...preset.water,
    };
    const immediate = runLocalSimulation(nextDesign, nextWater, get().targets, true);
    set({
      selectedPresetId: presetId,
      design: nextDesign,
      water: nextWater,
      result: immediate,
    });
    void get().refreshSimulation();
  },

  autoSizeMacrophytes: () => {
    const { result, design, water, targets } = get();
    // Añade un 12% de margen seguro sobre el área mínima crítica m*
    const recommendedArea = Math.max(
      0.5,
      Math.round(result.design_balance.critical_total_macrophyte_area_m2 * 1.12 * 10) / 10
    );
    const nextDesign = {
      ...design,
      macrophyte_area_m2: recommendedArea,
      macrophyte_root_biomass_override_kg: null,
    };
    const immediate = runLocalSimulation(nextDesign, water, targets, true);
    set({ design: nextDesign, result: immediate });
    void get().refreshSimulation();
  },

  assimilateIotWithKalman: () => {
    const { water, iotSensorReading, kalmanGain, design, targets } = get();
    const fuse = (pred: number, obs: number) => Math.round((pred + kalmanGain * (obs - pred)) * 100) / 100;
    const fusedWater: WaterInitialAndIoTInput = {
      ...water,
      temp_c: fuse(water.temp_c, iotSensorReading.temp_c),
      ph: fuse(water.ph, iotSensorReading.ph),
      dissolved_oxygen_mg_L: fuse(water.dissolved_oxygen_mg_L, iotSensorReading.dissolved_oxygen_mg_L),
      tss_mg_L: fuse(water.tss_mg_L ?? 18, iotSensorReading.tss_mg_L ?? 14),
      pathogen_ecoli_ufc_100mL: Math.round(
        fuse(water.pathogen_ecoli_ufc_100mL, iotSensorReading.pathogen_ecoli_ufc_100mL)
      ),
      ammonia_n_mg_L: fuse(water.ammonia_n_mg_L, iotSensorReading.ammonia_n_mg_L),
      nitrate_n_mg_L: fuse(water.nitrate_n_mg_L, iotSensorReading.nitrate_n_mg_L),
      phosphate_p_mg_L: fuse(water.phosphate_p_mg_L, iotSensorReading.phosphate_p_mg_L),
    };
    const immediate = runLocalSimulation(design, fusedWater, targets, true);
    set({ water: fusedWater, result: immediate, selectedHour: 0 });
    void get().refreshSimulation();
  },

  refreshSimulation: async () => {
    const { design, water, targets } = get();
    const { result, isBackendOnline } = await runHybridSimulation(design, water, targets);
    set({ result, isBackendOnline });
  },

  getCurrentTimePoint: () => {
    const { result, selectedHour } = get();
    const series = result.time_series;
    if (!series.length) {
      return {
        time_h: 0,
        ecoli_ufc_100mL: 2400,
        tss_mg_L: 18,
        ammonia_n_mg_L: 1.2,
        nitrate_n_mg_L: 2.5,
        phosphate_p_mg_L: 0.65,
        oxygen_mg_L: 6.2,
        cr_eff_L_h_ind: 1.85,
        q_biv_total_L_h: 443,
        permeability_K_ratio: 1,
        water_health_pct: 20,
        reproductive_feasibility_pct: 64,
      };
    }
    let best = series[0];
    let minDiff = Math.abs(series[0].time_h - selectedHour);
    for (const pt of series) {
      const d = Math.abs(pt.time_h - selectedHour);
      if (d < minDiff) {
        minDiff = d;
        best = pt;
      }
    }
    return best;
  },
}));
