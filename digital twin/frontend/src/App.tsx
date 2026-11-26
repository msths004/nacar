import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  Droplets,
  Fish,
  Globe2,
  Info,
  Layers,
  Lock,
  MapPin,
  Palette,
  Pause,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Sprout,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";
import { Pond3DViewport } from "./components/canvas3d/Pond3DViewport";
import { LeftControlPanel } from "./components/controls/LeftControlPanel";
import { ReproductionFactorsRadar, WaterEvolutionChart } from "./components/analytics/TwinCharts";
import { NacarScrollContainer } from "./components/common/NacarScrollContainer";
import {
  PlantViewerCadLayout,
  SpectraAnalyticsMatrixLayout,
  SpectraHud3DLayout,
} from "./components/views/AlternateStyleViews";
import { CENOTE_PRESETS, REGION_PROFILES, SPECIES_PROFILES } from "./engine/nacarEngine";
import {
  ActiveTabView,
  TwinColorTheme,
  TwinUiStyle,
  useTwinStore,
} from "./store/useTwinStore";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Alerta compacta estilo Modo UI
const ModoAlertBanner: React.FC<{
  tone: "green" | "amber" | "blue";
  title: string;
  subtitle: string;
}> = ({ tone, title, subtitle }) => {
  const styles = {
    green: {
      box: "bg-[#0F1F1C] border-[#1E3F35] text-[#D1FAE5]",
      icon: "text-[#10B981]",
      sub: "text-[#86EFAC]/80",
    },
    amber: {
      box: "bg-[#221A13] border-[#48321E] text-[#FEF3C7]",
      icon: "text-[#F59E0B]",
      sub: "text-[#FDE68A]/80",
    },
    blue: {
      box: "bg-[#111A2E] border-[#233863] text-[#DBEAFE]",
      icon: "text-[#3B82F6]",
      sub: "text-[#93C5FD]/85",
    },
  }[tone];

  return (
    <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${styles.box}`}>
      {tone === "amber" ? (
        <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${styles.icon}`} />
      ) : (
        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${styles.icon}`} />
      )}
      <div className="text-[11px] leading-snug">
        <div className="font-semibold">{title}</div>
        <div className={`mt-0.5 ${styles.sub}`}>{subtitle}</div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const activeView = useTwinStore((s) => s.activeView);
  const setActiveView = useTwinStore((s) => s.setActiveView);
  const uiStyle = useTwinStore((s) => s.uiStyle);
  const setUiStyle = useTwinStore((s) => s.setUiStyle);
  const colorTheme = useTwinStore((s) => s.colorTheme);
  const setColorTheme = useTwinStore((s) => s.setColorTheme);
  const design = useTwinStore((s) => s.design);
  const water = useTwinStore((s) => s.water);
  const targets = useTwinStore((s) => s.targets);
  const result = useTwinStore((s) => s.result);
  const selectedPresetId = useTwinStore((s) => s.selectedPresetId);
  const selectedHour = useTwinStore((s) => s.selectedHour);
  const isPlayingTimeline = useTwinStore((s) => s.isPlayingTimeline);
  const isBackendOnline = useTwinStore((s) => s.isBackendOnline);
  const iotSensorReading = useTwinStore((s) => s.iotSensorReading);
  const kalmanGain = useTwinStore((s) => s.kalmanGain);

  const [isTwinMenuOpen, setIsTwinMenuOpen] = useState(false);
  const twinMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (twinMenuRef.current && !twinMenuRef.current.contains(ev.target as Node)) {
        setIsTwinMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateDesign = useTwinStore((s) => s.updateDesign);
  const applyCenotePreset = useTwinStore((s) => s.applyCenotePreset);
  const setSelectedHour = useTwinStore((s) => s.setSelectedHour);
  const setIsPlayingTimeline = useTwinStore((s) => s.setIsPlayingTimeline);
  const autoSizeMacrophytes = useTwinStore((s) => s.autoSizeMacrophytes);
  const updateIotReading = useTwinStore((s) => s.updateIotReading);
  const setKalmanGain = useTwinStore((s) => s.setKalmanGain);
  const assimilateIotWithKalman = useTwinStore((s) => s.assimilateIotWithKalman);
  const refreshSimulation = useTwinStore((s) => s.refreshSimulation);
  const getCurrentTimePoint = useTwinStore((s) => s.getCurrentTimePoint);

  useEffect(() => {
    void refreshSimulation();
  }, [refreshSimulation]);

  // Animación del reproductor de la línea de tiempo (0 -> 72 horas)
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const interval = setInterval(() => {
      const cur = useTwinStore.getState().selectedHour;
      const maxH = useTwinStore.getState().targets.horizon_hours;
      if (cur >= maxH) {
        setSelectedHour(0);
      } else {
        setSelectedHour(Math.min(maxH, cur + 1));
      }
    }, 180);
    return () => clearInterval(interval);
  }, [isPlayingTimeline, setSelectedHour]);

  const curPoint = getCurrentTimePoint();
  const activeRegion = REGION_PROFILES[design.region_id] || REGION_PROFILES.yucatan_karst;
  const activeSpecies = SPECIES_PROFILES[design.species_id] || SPECIES_PROFILES.anodontites_trapesialis;
  const tMetaEcoli = result.current_percentages.estimated_hours_to_ecoli_target;
  const speedupPct = result.current_percentages.bivalve_speedup_pct;

  const navItems: Array<{ id: ActiveTabView; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Estanque 3D", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "water", label: "Calidad del Agua", icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: "symbiosis", label: "Almejas y Plantas", icon: <Sprout className="w-3.5 h-3.5" /> },
    { id: "reproduction", label: "Reproducción", icon: <Fish className="w-3.5 h-3.5" /> },
    { id: "sensors", label: "Sensores y Equipos", icon: <Radio className="w-3.5 h-3.5" /> },
  ];

  const timelinePct = Math.min(100, Math.max(0, (selectedHour / Math.max(1, targets.horizon_hours)) * 100));

  const styleOptions: Array<{
    id: TwinUiStyle;
    title: string;
    subtitle: string;
    badge: string;
  }> = [
    {
      id: "plant_viewer",
      title: "Plant Viewer · Esquema CAD",
      subtitle: "Árbol de objetos + retícula P&ID 2D/3D + tabla técnica",
      badge: "Estilo 1",
    },
    {
      id: "spectra_hud",
      title: "Spectra · HUD 3D & Timeline",
      subtitle: "Escenario 3D central + barras tick + regla de tiempo inferior",
      badge: "Estilo 2",
    },
    {
      id: "spectra_analytics",
      title: "Spectra · Analítica & Matriz",
      subtitle: "6 KPIs ejecutivos + arco de salud + tabla de flujo por zonas",
      badge: "Estilo 3",
    },
    {
      id: "nacar_capsule",
      title: "Modo Cápsula · Nácar",
      subtitle: "Panel de controles + visor 3D + tarjetas simbióticas",
      badge: "Estilo 4",
    },
  ];

  const colorOptions: Array<{
    id: TwinColorTheme;
    name: string;
    desc: string;
    swatchTop: string;
    swatchMid: string;
    swatchBot: string;
    bg: string;
    glow1: string;
    glow2: string;
    header: string;
    cardTop: string;
    cardBot: string;
    subcard: string;
    well: string;
    border: string;
    accentText: string;
    accentLight: string;
    accentRgb: string;
  }> = [
    {
      id: "blue_purple",
      name: "Azul-Morado Suave",
      desc: "Degradado de bajo contraste",
      swatchTop: "#4F70F2",
      swatchMid: "#5859DE",
      swatchBot: "#6245C8",
      bg: "#0B0E16",
      glow1: "rgba(79, 112, 242, 0.16)",
      glow2: "rgba(98, 69, 200, 0.14)",
      header: "rgba(14, 18, 29, 0.95)",
      cardTop: "#151A28",
      cardBot: "#111522",
      subcard: "#101420",
      well: "#0C0F19",
      border: "#252E45",
      accentText: "#818CF8",
      accentLight: "#A5B4FC",
      accentRgb: "88, 89, 222",
    },
    {
      id: "copper_gold",
      name: "Obsidiana & Cobre Dorado",
      desc: "Estilo Spectra cálido",
      swatchTop: "#D98A3C",
      swatchMid: "#C4732B",
      swatchBot: "#A6591E",
      bg: "#090807",
      glow1: "rgba(217, 138, 60, 0.16)",
      glow2: "rgba(166, 89, 30, 0.12)",
      header: "rgba(15, 13, 12, 0.96)",
      cardTop: "#1A1613",
      cardBot: "#120F0D",
      subcard: "#14110E",
      well: "#0B0908",
      border: "#332920",
      accentText: "#E7B06B",
      accentLight: "#F3D7A4",
      accentRgb: "217, 138, 60",
    },
    {
      id: "cad_slate",
      name: "Pizarra Técnica CAD",
      desc: "Estilo Plant Viewer acero",
      swatchTop: "#3B82F6",
      swatchMid: "#2C6DE8",
      swatchBot: "#1D4ED8",
      bg: "#0A1018",
      glow1: "rgba(59, 130, 246, 0.16)",
      glow2: "rgba(29, 78, 216, 0.12)",
      header: "rgba(13, 20, 30, 0.96)",
      cardTop: "#15202E",
      cardBot: "#101925",
      subcard: "#0E1621",
      well: "#090F17",
      border: "#23354B",
      accentText: "#60A5FA",
      accentLight: "#93C5FD",
      accentRgb: "59, 130, 246",
    },
    {
      id: "cenote_emerald",
      name: "Turquesa Cenote",
      desc: "Agua kárstica profunda",
      swatchTop: "#14B8A6",
      swatchMid: "#0D9488",
      swatchBot: "#0F766E",
      bg: "#061114",
      glow1: "rgba(20, 184, 166, 0.17)",
      glow2: "rgba(15, 118, 110, 0.13)",
      header: "rgba(9, 22, 26, 0.96)",
      cardTop: "#10242A",
      cardBot: "#0B1A1F",
      subcard: "#0C1D22",
      well: "#071215",
      border: "#1E3F49",
      accentText: "#2DD4BF",
      accentLight: "#99F6E4",
      accentRgb: "20, 184, 166",
    },
  ];

  const activeStyleMeta = styleOptions.find((s) => s.id === uiStyle) || styleOptions[0];
  const activeColorMeta = colorOptions.find((c) => c.id === colorTheme) || colorOptions[0];

  // Inyección directa de variables CSS en <html> y en el contenedor raíz para cambio de color instantáneo
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", activeColorMeta.id);
    root.style.setProperty("--dt-bg", activeColorMeta.bg);
    root.style.setProperty("--dt-bg-glow-1", activeColorMeta.glow1);
    root.style.setProperty("--dt-bg-glow-2", activeColorMeta.glow2);
    root.style.setProperty("--dt-header", activeColorMeta.header);
    root.style.setProperty("--dt-card-top", activeColorMeta.cardTop);
    root.style.setProperty("--dt-card-bot", activeColorMeta.cardBot);
    root.style.setProperty("--dt-subcard", activeColorMeta.subcard);
    root.style.setProperty("--dt-well", activeColorMeta.well);
    root.style.setProperty("--dt-border", activeColorMeta.border);
    root.style.setProperty("--dt-accent-top", activeColorMeta.swatchTop);
    root.style.setProperty("--dt-accent-mid", activeColorMeta.swatchMid);
    root.style.setProperty("--dt-accent-bot", activeColorMeta.swatchBot);
    root.style.setProperty("--dt-accent-text", activeColorMeta.accentText);
    root.style.setProperty("--dt-accent-light", activeColorMeta.accentLight);
    root.style.setProperty("--dt-accent-rgb", activeColorMeta.accentRgb);
  }, [activeColorMeta]);

  const inlineThemeVars = {
    "--dt-bg": activeColorMeta.bg,
    "--dt-bg-glow-1": activeColorMeta.glow1,
    "--dt-bg-glow-2": activeColorMeta.glow2,
    "--dt-header": activeColorMeta.header,
    "--dt-card-top": activeColorMeta.cardTop,
    "--dt-card-bot": activeColorMeta.cardBot,
    "--dt-subcard": activeColorMeta.subcard,
    "--dt-well": activeColorMeta.well,
    "--dt-border": activeColorMeta.border,
    "--dt-accent-top": activeColorMeta.swatchTop,
    "--dt-accent-mid": activeColorMeta.swatchMid,
    "--dt-accent-bot": activeColorMeta.swatchBot,
    "--dt-accent-text": activeColorMeta.accentText,
    "--dt-accent-light": activeColorMeta.accentLight,
    "--dt-accent-rgb": activeColorMeta.accentRgb,
    backgroundColor: activeColorMeta.bg,
    backgroundImage: `radial-gradient(ellipse 65% 45% at 15% 0%, ${activeColorMeta.glow1}, transparent 70%), radial-gradient(ellipse 55% 40% at 88% 12%, ${activeColorMeta.glow2}, transparent 70%)`,
  } as React.CSSProperties;

  return (
    <div
      data-theme={colorTheme}
      className={`min-h-screen lg:h-screen lg:overflow-hidden flex flex-col text-[#F3F6FC] theme-${colorTheme}`}
      style={inlineThemeVars}
    >
      {/* BARRA SUPERIOR UNIFICADA (Marca + Desplegable de Estilo/Color del Gemelo Digital + Pestañas + Ámbito) */}
      <header
        className="shrink-0 backdrop-blur-md border-b px-3.5 py-2 relative z-40"
        style={{ backgroundColor: "var(--dt-header)", borderColor: "var(--dt-border)" }}
      >
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Izquierda: Volver + Desplegable del Gemelo Digital + Pestañas */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="../../desarrollo-nacar-pag.html#gemelo"
              className="px-3.5 py-1.5 rounded-full modo-btn-dark text-xs flex items-center gap-1.5"
              title="Volver a la página principal de Proyecto Nácar"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Volver</span>
            </a>

            {/* DESPLEGABLE DEL GEMELO DIGITAL (Estilos, Colores y Futuro Ecosistema Personalizable) */}
            <div className="relative" ref={twinMenuRef}>
              <button
                type="button"
                onClick={() => setIsTwinMenuOpen(!isTwinMenuOpen)}
                className="px-3.5 py-1.5 rounded-full modo-btn-primary text-xs flex items-center gap-2"
                title="Cambiar estilo visual, paleta de colores y opciones del Gemelo Digital"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="font-bold tracking-tight">NÁCAR · Gemelo Digital</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/25 text-white/90 font-medium hidden xl:inline">
                  {activeStyleMeta.badge}: {activeStyleMeta.title.split("·")[0].trim()}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isTwinMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isTwinMenuOpen && (
                <div className="absolute left-0 mt-2 w-[380px] sm:w-[430px] rounded-2xl modo-card p-3.5 shadow-2xl z-50 space-y-3.5 border border-white/15">
                  {/* 1. Selector de los 4 Estilos de Interfaz */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        1. Estilo Visual de la Interfaz
                      </span>
                      <span className="text-[10px] text-[#8B95A7]">4 diseños disponibles</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {styleOptions.map((st) => {
                        const isSelected = uiStyle === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              setUiStyle(st.id, true);
                              setActiveView("overview");
                            }}
                            className={`p-2.5 rounded-xl text-left border transition flex items-center justify-between gap-2 ${
                              isSelected
                                ? "bg-white/10 border-white/30 text-white"
                                : "bg-black/25 border-white/5 text-[#94A3B8] hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <div>
                              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                                  style={{
                                    background: isSelected
                                      ? "linear-gradient(180deg, var(--dt-accent-top), var(--dt-accent-bot))"
                                      : "rgba(255,255,255,0.08)",
                                  }}
                                >
                                  {st.badge}
                                </span>
                                <span>{st.title}</span>
                              </div>
                              <p className="text-[11px] text-[#8B95A7] mt-0.5">{st.subtitle}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle2
                                className="w-4 h-4 shrink-0"
                                style={{ color: "var(--dt-accent-light)" }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Selector de Paleta de Colores (combinable con cualquier estilo) */}
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        2. Paleta de Colores de Botones e Interfaz
                      </span>
                      <span className="text-[10px] text-[#8B95A7]">Bajo contraste sin aro</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {colorOptions.map((col) => {
                        const isSelected = colorTheme === col.id;
                        return (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => setColorTheme(col.id)}
                            className={`p-2 rounded-xl text-left border transition flex items-center gap-2 ${
                              isSelected
                                ? "bg-white/10 border-white/30 text-white"
                                : "bg-black/25 border-white/5 text-[#94A3B8] hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span
                              className="w-6 h-6 rounded-full shrink-0"
                              style={{
                                background: `linear-gradient(180deg, ${col.swatchTop} 0%, ${col.swatchBot} 100%)`,
                              }}
                            />
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-white truncate">
                                {col.name}
                              </div>
                              <div className="text-[10px] text-[#8B95A7] truncate">{col.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Apartado reservado para después: True Ecosistema Personalizable */}
                  <div className="p-2.5 rounded-xl bg-black/35 border border-dashed border-white/15 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                        <Lock className="w-3 h-3" style={{ color: "var(--dt-accent-light)" }} />
                        <span>Mi Ecosistema Real Personalizable</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#CBD5E1]">
                        Próxima etapa
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8B95A7] leading-snug">
                      Acceso personal mediante vinculación de <strong className="text-white">sensores IoT en vivo</strong> y herramienta de{" "}
                      <strong className="text-white">mapeado 3D del cuerpo de agua</strong> (batimetría y contorno real).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navegación Horizontal Integrada en cápsulas */}
            <nav className="flex items-center gap-1.5 p-1.5 rounded-full bg-black/35 border border-white/10">
              {navItems.map((item) => {
                const active = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveView(item.id)}
                    className={`px-3.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
                      active
                        ? "modo-btn-primary"
                        : "text-[#8B95A7] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Derecha: Selectores de Ámbito (País/Agua, Sitio, Almeja, Mes) + Estado del Agua */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1 modo-input px-2 py-1" title="País y tipo de agua">
              <Globe2 className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
              <select
                value={design.region_id}
                onChange={(e) => updateDesign({ region_id: e.target.value })}
                className="bg-transparent text-[11px] font-medium text-white focus:outline-none cursor-pointer"
              >
                {Object.values(REGION_PROFILES).map((r) => (
                  <option key={r.region_id} value={r.region_id} className="bg-[#131722] text-white">
                    {r.colloquial_country} ({r.region_id === "yucatan_karst" ? "Piedra Caliza" : "Agua Dulce"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 modo-input px-2 py-1" title="Sitio o cenote">
              <MapPin className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
              <select
                value={selectedPresetId}
                onChange={(e) => applyCenotePreset(e.target.value)}
                className="bg-transparent text-[11px] font-medium text-white focus:outline-none cursor-pointer"
              >
                {CENOTE_PRESETS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#131722] text-white">
                    {c.name}
                  </option>
                ))}
                {selectedPresetId === "custom" && (
                  <option value="custom" className="bg-[#131722] text-white">
                    Estanque Personalizado
                  </option>
                )}
              </select>
            </div>

            <div className="flex items-center gap-1 modo-input px-2 py-1" title="Especie de almeja nativa">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <select
                value={design.species_id}
                onChange={(e) => updateDesign({ species_id: e.target.value })}
                className="bg-transparent text-[11px] font-medium text-white focus:outline-none cursor-pointer"
              >
                {Object.values(SPECIES_PROFILES).map((sp) => (
                  <option key={sp.species_id} value={sp.species_id} className="bg-[#131722] text-white">
                    {sp.colloquial_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 modo-input px-2 py-1" title="Mes del año">
              <Clock className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
              <select
                value={design.month_of_year}
                onChange={(e) => updateDesign({ month_of_year: Number(e.target.value) })}
                className="bg-transparent text-[11px] font-medium text-white focus:outline-none cursor-pointer"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1} className="bg-[#131722] text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 ${
                curPoint.water_health_pct >= 75
                  ? "bg-[#0F241F] border-[#1F4E3F] text-[#34D399]"
                  : curPoint.water_health_pct >= 45
                  ? "bg-[#261E12] border-[#523D1E] text-[#FBBF24]"
                  : "bg-[#281519] border-[#58252E] text-[#F87171]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  curPoint.water_health_pct >= 75
                    ? "bg-[#10B981]"
                    : curPoint.water_health_pct >= 45
                    ? "bg-[#F59E0B]"
                    : "bg-[#EF4444]"
                }`}
              />
              <span>
                {selectedHour}h: {curPoint.water_health_pct.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* LIENZO PRINCIPAL EN 100VH (Renderiza el Estilo seleccionado o las sub-vistas de detalle) */}
      {activeView === "overview" && uiStyle === "plant_viewer" ? (
        <div className="max-w-[1920px] w-full mx-auto flex-1 min-h-0 px-3.5 py-3 flex flex-col">
          <PlantViewerCadLayout />
        </div>
      ) : activeView === "overview" && uiStyle === "spectra_hud" ? (
        <div className="max-w-[1920px] w-full mx-auto flex-1 min-h-0 px-3.5 py-3 flex flex-col">
          <SpectraHud3DLayout />
        </div>
      ) : activeView === "overview" && uiStyle === "spectra_analytics" ? (
        <div className="max-w-[1920px] w-full mx-auto flex-1 min-h-0 px-3.5 py-3 flex flex-col">
          <SpectraAnalyticsMatrixLayout />
        </div>
      ) : (
      <div className="max-w-[1920px] w-full mx-auto flex-1 min-h-0 px-3.5 py-3 grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* COLUMNA IZQUIERDA (3 COLUMNAS): Configuración con thumb flotante interno */}
        <div className="lg:col-span-3 h-full min-h-0 flex flex-col">
          <LeftControlPanel />
        </div>

        {/* ÁREA PRINCIPAL DERECHA (9 COLUMNAS) */}
        <main className="lg:col-span-9 h-full min-h-0 flex flex-col">
          {/* =================================================================
              VISTA 1: ESTANQUE 3D + ANALÍTICA ACOPLADA (100% EN PANTALLA)
             ================================================================= */}
          {activeView === "overview" && (
            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-3.5">
              {/* Centro (7 cols): Visor 3D elástico + Línea de tiempo + 3 KPIs inferiores */}
              <div className="xl:col-span-7 h-full min-h-0 flex flex-col gap-3">
                <section className="modo-card p-3.5 flex-1 min-h-0 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-sm font-semibold text-white">Vista 3D del Estanque y Canastas</h1>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#162238] border border-[#263C66] text-[#60A5FA]">
                          {activeSpecies.region_badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8B95A7]">
                        {activeRegion.colloquial_name} · {activeSpecies.colloquial_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#7D879B] block">Agua filtrada por hora</span>
                      <span className="text-sm font-bold text-[#60A5FA]">
                        {curPoint.q_biv_total_L_h.toFixed(0)} L/h
                      </span>
                    </div>
                  </div>

                  {/* VISOR 3D (Se estira automáticamente para ocupar el espacio disponible) */}
                  <Pond3DViewport />

                  {/* REPRODUCTOR DE LÍNEA DE TIEMPO COMPACTO */}
                  <div className="p-2.5 rounded-xl bg-[#10141E] border border-[#1E2536] space-y-2 shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                          className="px-3.5 py-1 rounded-full modo-btn-primary text-xs flex items-center gap-1.5"
                        >
                          {isPlayingTimeline ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{isPlayingTimeline ? "Pausar" : "Avance"}</span>
                        </button>
                        <span className="text-xs font-semibold text-white">
                          Hora: <span className="text-[#818CF8]">{selectedHour} h</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedHour(0)}
                          className={`px-3 py-0.5 rounded-full text-[11px] ${
                            selectedHour === 0 ? "modo-btn-primary" : "modo-btn-dark"
                          }`}
                        >
                          Inicio (0h)
                        </button>
                        {tMetaEcoli !== null && (
                          <button
                            type="button"
                            onClick={() => setSelectedHour(Math.min(targets.horizon_hours, Math.round(tMetaEcoli)))}
                            className={`px-3 py-0.5 rounded-full text-[11px] ${
                              Math.abs(selectedHour - Math.round(tMetaEcoli)) <= 1
                                ? "modo-btn-primary"
                                : "modo-btn-dark"
                            }`}
                          >
                            Agua limpia ({tMetaEcoli.toFixed(0)}h)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedHour(targets.horizon_hours)}
                          className={`px-3 py-0.5 rounded-full text-[11px] ${
                            selectedHour === targets.horizon_hours ? "modo-btn-primary" : "modo-btn-dark"
                          }`}
                        >
                          Final ({targets.horizon_hours}h)
                        </button>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={targets.horizon_hours}
                      step={1}
                      value={selectedHour}
                      onChange={(e) => {
                        setIsPlayingTimeline(false);
                        setSelectedHour(Number(e.target.value));
                      }}
                      className="modo-slider block"
                      style={{
                        background: `linear-gradient(90deg, #4F70F2 0%, #6245C8 ${timelinePct}%, #20283A ${timelinePct}%, #20283A 100%)`,
                      }}
                    />

                    {/* Lecturas instantáneas en 4 cápsulas */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <div className="modo-well py-1 px-2 flex items-center justify-between">
                        <span className="text-[10px] text-[#8B95A7]">Bacterias</span>
                        <strong className="text-xs text-white">{curPoint.ecoli_ufc_100mL.toFixed(0)}</strong>
                      </div>
                      <div className="modo-well py-1 px-2 flex items-center justify-between">
                        <span className="text-[10px] text-[#8B95A7]">Turbidez</span>
                        <strong className="text-xs text-white">{curPoint.tss_mg_L.toFixed(1)}</strong>
                      </div>
                      <div className="modo-well py-1 px-2 flex items-center justify-between">
                        <span className="text-[10px] text-[#8B95A7]">Amonio</span>
                        <strong className="text-xs text-white">{curPoint.ammonia_n_mg_L.toFixed(2)}</strong>
                      </div>
                      <div className="modo-well py-1 px-2 flex items-center justify-between">
                        <span className="text-[10px] text-[#8B95A7]">Oxígeno</span>
                        <strong className="text-xs text-white">{curPoint.oxygen_mg_L.toFixed(1)}</strong>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3 Tarjetas Inferiores de Impacto (Compactadas para encajar en 100vh) */}
                <div className="grid grid-cols-3 gap-3 shrink-0">
                  <div className="modo-card p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] text-[#8B95A7]">Tiempo de limpieza</span>
                      {speedupPct !== null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#162238] border border-[#263C66] text-[#60A5FA] font-medium">
                          +{speedupPct.toFixed(0)}% rápido
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-bold text-white my-0.5">
                      {tMetaEcoli !== null ? `${tMetaEcoli.toFixed(1)} horas` : `> ${targets.horizon_hours} h`}
                    </div>
                    <p className="text-[10px] text-[#7D879B]">
                      Sin almejas: {result.current_percentages.estimated_hours_to_ecoli_without_bivalves?.toFixed(0) ?? 96} h
                    </p>
                  </div>

                  <div className="modo-card p-3 flex flex-col justify-between border-[#294073] bg-gradient-to-b from-[#162138] to-[#121828]">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] text-[#93C5FD]">Claridad del agua</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2563EB] text-white font-semibold">
                        En meta
                      </span>
                    </div>
                    <div className="text-xl font-bold text-white my-0.5">
                      {result.final_percentages.clarity_pct.toFixed(0)}% limpia
                    </div>
                    <p className="text-[10px] text-[#94A3B8]">
                      Filtrada {(result.final_percentages.water_recycled_fraction_pct / 100).toFixed(1)} veces
                    </p>
                  </div>

                  <div className="modo-card p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] text-[#8B95A7]">Estado canastas</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#112622] border border-[#1E463D] text-[#34D399] font-medium">
                        {result.final_percentages.permeability_remaining_pct.toFixed(0)}% libres
                      </span>
                    </div>
                    <div className="text-xl font-bold text-white my-0.5">
                      {result.final_percentages.estimated_days_to_tray_maintenance.toFixed(0)} días
                    </div>
                    <p className="text-[10px] text-[#7D879B]">Para próxima limpieza de mallas</p>
                  </div>
                </div>
              </div>

              {/* Columna Derecha (5 cols): Gráfica + Equilibrio + Reproducción con drag thumb si la ventana es pequeña */}
              <NacarScrollContainer className="xl:col-span-5 h-full min-h-0">
                <div className="space-y-3">
                  {/* Tarjeta 1: Evolución de Limpieza */}
                  <section className="modo-card p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-semibold text-white">
                          Evolución de Limpieza ({targets.horizon_hours} horas)
                        </h3>
                        <p className="text-[11px] text-[#8B95A7]">
                          Caída de bacterias y turbidez vs. subida de calidad general
                        </p>
                      </div>
                    </div>
                    <WaterEvolutionChart height={175} />
                  </section>

                  {/* Tarjeta 2: Equilibrio entre Almejas y Plantas */}
                  <section className="modo-card p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-semibold text-white">Equilibrio entre Almejas y Plantas</h3>
                        <p className="text-[11px] text-[#8B95A7]">
                          Las plantas absorben los nutrientes que liberan las almejas
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border shrink-0 ${
                          result.design_balance.balance_status === "SUPERAVIT_OPTIMO"
                            ? "bg-[#0F241F] border-[#1F4E3F] text-[#34D399]"
                            : result.design_balance.balance_status === "EQUILIBRIO_AJUSTADO"
                            ? "bg-[#261E12] border-[#523D1E] text-[#FBBF24]"
                            : "bg-[#281519] border-[#58252E] text-[#F87171]"
                        }`}
                      >
                        {result.design_balance.balance_status === "SUPERAVIT_OPTIMO"
                          ? "Equilibrio Seguro"
                          : result.design_balance.balance_status === "EQUILIBRIO_AJUSTADO"
                          ? "En el Límite"
                          : "Faltan Plantas"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#10141E] border border-[#1E2536] space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8B95A7]">
                          Plantas instaladas: <strong className="text-white">{design.macrophyte_area_m2} m²</strong> (
                          {result.design_balance.installed_root_biomass_kg.toFixed(1)} kg raíz)
                        </span>
                        <span className="text-[#60A5FA] font-medium">
                          Mínimo: {result.design_balance.critical_total_macrophyte_area_m2.toFixed(1)} m²
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#1C2334] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (result.final_percentages.symbiotic_balance_pct / 130) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-[#10141E] border border-[#1E2536] space-y-0.5">
                        <span className="text-[10px] text-[#8B95A7] block">Limpieza de Amonio</span>
                        <div className="flex justify-between">
                          <span>Bacterias raíces</span>
                          <strong className="text-[#60A5FA]">
                            {result.final_percentages.nutrient_sink_shares_pct.ammonia.bacteria_cwm1_pct}%
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Plantas</span>
                          <strong className="text-[#34D399]">
                            {result.final_percentages.nutrient_sink_shares_pct.ammonia.macrophytes_pct}%
                          </strong>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#10141E] border border-[#1E2536] space-y-0.5">
                        <span className="text-[10px] text-[#8B95A7] block">Limpieza de Fósforo</span>
                        <div className="flex justify-between">
                          <span>Piedra caliza</span>
                          <strong className="text-[#60A5FA]">
                            {result.final_percentages.nutrient_sink_shares_pct.phosphorus.karst_calcite_pct}%
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Plantas</span>
                          <strong className="text-[#34D399]">
                            {result.final_percentages.nutrient_sink_shares_pct.phosphorus.macrophytes_pct}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    <ModoAlertBanner
                      tone={
                        result.design_balance.balance_status === "DEFICIT_AMONIO"
                          ? "amber"
                          : result.design_balance.balance_status === "EQUILIBRIO_AJUSTADO"
                          ? "blue"
                          : "green"
                      }
                      title={
                        result.design_balance.balance_status === "DEFICIT_AMONIO"
                          ? "Se recomienda agregar más plantas"
                          : "Simbiosis almeja-planta equilibrada"
                      }
                      subtitle={result.design_balance.recommendation}
                    />
                  </section>

                  {/* Tarjeta 3: Reproducción y Equipos */}
                  <section className="modo-card p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-semibold text-white">Reproducción y Equipos de Apoyo</h3>
                        <p className="text-[11px] text-[#8B95A7]">
                          Viabilidad en {MONTHS[design.month_of_year - 1]} y potencia sugerida
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView("reproduction")}
                        className="px-3 py-1 rounded-full modo-btn-dark text-[11px]"
                      >
                        Ver detalle
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#10141E] border border-[#1E2536] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#CBD5E1] font-medium">Desove dentro de la canasta</span>
                        <span className="text-xs font-bold text-[#60A5FA]">
                          {result.reproduction_at_target_or_final.spawning_feasibility_pct.toFixed(0)}% (
                          {result.reproduction_at_target_or_final.feasibility_category === "ALTA"
                            ? "Alta"
                            : result.reproduction_at_target_or_final.feasibility_category === "MODERADA"
                            ? "Moderada"
                            : "Baja"}
                          )
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#1C2334] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]"
                          style={{ width: `${result.reproduction_at_target_or_final.spawning_feasibility_pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[#8B95A7] flex items-center gap-1">
                        <Fish className="w-3 h-3 text-[#3B82F6] shrink-0" />
                        <span>
                          Las crías nuevas requieren <strong className="text-white">peces nativos</strong> en el estanque.
                        </span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-xl bg-[#10141E] border border-[#1E2536] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span className="text-[10px] text-[#8B95A7]">Oxígeno</span>
                        </div>
                        <strong className="text-[11px] text-white">
                          {result.controller_slot.pwm_aerator_pct.toFixed(0)}%
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#10141E] border border-[#1E2536] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span className="text-[10px] text-[#8B95A7]">Flujo</span>
                        </div>
                        <strong className="text-[11px] text-white">
                          {result.controller_slot.pwm_recirculation_pump_pct.toFixed(0)}%
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#10141E] border border-[#1E2536] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Thermometer className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span className="text-[10px] text-[#8B95A7]">Clima</span>
                        </div>
                        <strong className="text-[11px] text-white">
                          {result.controller_slot.pwm_thermal_cooling_pct.toFixed(0)}%
                        </strong>
                      </div>
                    </div>
                  </section>
                </div>
              </NacarScrollContainer>
            </div>
          )}

          {/* =================================================================
              VISTA 2: CALIDAD DEL AGUA Y COMPARATIVA DE CENOTES
             ================================================================= */}
          {activeView === "water" && (
            <NacarScrollContainer className="flex-1 min-h-0">
              <div className="space-y-3.5">
                <section className="modo-card p-4 space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Sitios y Cenotes de Referencia ({activeRegion.colloquial_country})
                    </h2>
                    <p className="text-xs text-[#8B95A7]">
                      Selecciona un cenote medido en Yucatán o cambia arriba entre agua con piedra caliza y agua dulce normal
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                    {CENOTE_PRESETS.map((c) => {
                      const active = selectedPresetId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => applyCenotePreset(c.id)}
                          className={`p-3 rounded-xl text-left border transition flex flex-col justify-between gap-1.5 ${
                            active
                              ? "dt-badge"
                              : "dt-subcard hover:border-white/25"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold text-white">{c.name}</div>
                            <div className="text-[11px] dt-accent-light">{c.conditionLabel}</div>
                          </div>
                          <p className="text-[11px] text-[#8B95A7] line-clamp-2">{c.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                  <section className="lg:col-span-7 modo-card p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-white">
                      Curva Completa de Limpieza ({targets.horizon_hours} horas)
                    </h3>
                    <WaterEvolutionChart height={300} />
                  </section>

                  <section className="lg:col-span-5 modo-card p-4 space-y-2.5">
                    <h3 className="text-sm font-semibold text-white">Resumen Antes y Después</h3>
                    <div className="space-y-2 text-xs">
                      {[
                        {
                          label: "Bacterias en el agua",
                          before: `${result.time_series[0]?.ecoli_ufc_100mL.toFixed(0)} / 100 mL`,
                          after: `${result.time_series[result.time_series.length - 1]?.ecoli_ufc_100mL.toFixed(0)} / 100 mL`,
                          badge: `${result.final_percentages.bacteria_removal_pct.toFixed(0)}% limpio`,
                        },
                        {
                          label: "Turbidez (suciedad suspendida)",
                          before: `${result.time_series[0]?.tss_mg_L.toFixed(1)} mg/L`,
                          after: `${result.time_series[result.time_series.length - 1]?.tss_mg_L.toFixed(2)} mg/L`,
                          badge: `${result.final_percentages.clarity_pct.toFixed(0)}% claro`,
                        },
                        {
                          label: "Amonio disuelto",
                          before: `${result.time_series[0]?.ammonia_n_mg_L.toFixed(2)} mg/L`,
                          after: `${result.time_series[result.time_series.length - 1]?.ammonia_n_mg_L.toFixed(2)} mg/L`,
                          badge: "Absorbido por plantas",
                        },
                        {
                          label: "Fósforo en el agua",
                          before: `${result.time_series[0]?.phosphate_p_mg_L.toFixed(2)} mg/L`,
                          after: `${result.time_series[result.time_series.length - 1]?.phosphate_p_mg_L.toFixed(2)} mg/L`,
                          badge:
                            design.region_id === "yucatan_karst" ? "Atrapado por calcio" : "Absorbido por plantas",
                        },
                        {
                          label: "Oxígeno para la vida acuática",
                          before: `${result.time_series[0]?.oxygen_mg_L.toFixed(1)} mg/L`,
                          after: `${result.time_series[result.time_series.length - 1]?.oxygen_mg_L.toFixed(1)} mg/L`,
                          badge: `${result.final_percentages.oxygen_saturation_pct.toFixed(0)}% saturación`,
                        },
                      ].map((row, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl dt-subcard flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-medium text-white">{row.label}</div>
                            <div className="text-[11px] text-[#8B95A7]">
                              Inicio: <span className="text-[#CBD5E1]">{row.before}</span> → Final:{" "}
                              <span className="dt-accent-light font-semibold">{row.after}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full dt-badge text-[11px] font-medium shrink-0">
                            {row.badge}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </NacarScrollContainer>
          )}

          {/* =================================================================
              VISTA 3: SIMBIOSIS ALMEJAS Y PLANTAS
             ================================================================= */}
          {activeView === "symbiosis" && (
            <NacarScrollContainer className="flex-1 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                <section className="lg:col-span-6 modo-card p-4 space-y-3.5">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      ¿Cuántas plantas necesitan tus {result.geometry.total_bivalves_n} almejas?
                    </h2>
                    <p className="text-xs text-[#8B95A7] mt-0.5">
                      Al filtrar el agua, las almejas sueltan nutrientes naturales que sirven de abono para las plantas
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="modo-well p-3.5">
                      <span className="text-xs text-[#8B95A7] block">Plantas que tienes hoy</span>
                      <div className="text-2xl font-bold text-white mt-0.5">{design.macrophyte_area_m2} m²</div>
                      <span className="text-[11px] text-[#7D879B]">
                        {result.design_balance.installed_root_biomass_kg.toFixed(2)} kg de raíces sumergidas
                      </span>
                    </div>
                    <div className="modo-well p-3.5">
                      <span className="text-xs dt-accent-light block">Mínimo necesario</span>
                      <div className="text-2xl font-bold dt-accent-text mt-0.5">
                        {result.design_balance.critical_total_macrophyte_area_m2.toFixed(1)} m²
                      </div>
                      <span className="text-[11px] text-[#8B95A7]">
                        {result.design_balance.critical_area_per_module_m2.toFixed(1)} m² por cada canasta
                      </span>
                    </div>
                  </div>

                  <ModoAlertBanner
                    tone={result.design_balance.balance_status === "DEFICIT_AMONIO" ? "amber" : "green"}
                    title={
                      result.design_balance.balance_status === "DEFICIT_AMONIO"
                        ? "Falta área de plantas acuáticas"
                        : "Cantidad de plantas suficiente y equilibrada"
                    }
                    subtitle={result.design_balance.recommendation}
                  />

                  <button
                    type="button"
                    onClick={autoSizeMacrophytes}
                    className="w-full py-2.5 px-5 rounded-full modo-btn-primary text-xs flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ajustar plantas automáticamente al nivel ideal</span>
                  </button>
                </section>

                <section className="lg:col-span-6 modo-card p-4 space-y-3.5">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Adaptación por País y Tipo de Agua</h2>
                    <p className="text-xs text-[#8B95A7] mt-0.5">
                      Prueba cómo cambia el trabajo del ecosistema si estás en Yucatán o en otra región del mundo
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(REGION_PROFILES).map((reg) => {
                      const active = design.region_id === reg.region_id;
                      return (
                        <button
                          key={reg.region_id}
                          type="button"
                          onClick={() => updateDesign({ region_id: reg.region_id })}
                          className={`p-3.5 rounded-xl text-left border transition space-y-1 ${
                            active
                              ? "dt-badge"
                              : "dt-subcard hover:border-white/25"
                          }`}
                        >
                          <div className="text-xs font-semibold text-white">{reg.colloquial_country}</div>
                          <div className="text-xs dt-accent-light font-medium">{reg.colloquial_name}</div>
                          <p className="text-[11px] text-[#8B95A7]">{reg.subtitle}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-3.5 rounded-xl dt-subcard space-y-1.5 text-xs">
                    <div className="font-semibold text-white">
                      ¿Qué ocurre con el fósforo en {activeRegion.colloquial_country}?
                    </div>
                    <p className="text-[#8B95A7] leading-relaxed">
                      {design.region_id === "yucatan_karst"
                        ? `Como el agua de Yucatán tiene mucha piedra caliza disuelta (${water.calcium_mg_L ?? 210} mg/L de calcio), el mineral atrapa el ${result.final_percentages.nutrient_sink_shares_pct.phosphorus.karst_calcite_pct}% del fósforo y lo hunde al fondo, dejando a las plantas enfocarse en limpiar el amonio.`
                        : "En ríos o lagos de agua dulce normal sin piedra caliza, el calcio ya no atrapa el fósforo; automáticamente las plantas acuáticas y las bacterias benéficas toman el 100% de esa tarea."}
                    </p>
                  </div>
                </section>
              </div>
            </NacarScrollContainer>
          )}

          {/* =================================================================
              VISTA 4: REPRODUCCIÓN DE LAS ALMEJAS
             ================================================================= */}
          {activeView === "reproduction" && (
            <NacarScrollContainer className="flex-1 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                <section className="lg:col-span-6 modo-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        Condiciones para Reproducción ({activeSpecies.colloquial_name})
                      </h2>
                      <p className="text-xs text-[#8B95A7]">
                        Comparación entre el agua inicial y el agua ya limpia en {MONTHS[design.month_of_year - 1]}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold dt-accent-text">
                        {result.reproduction_at_target_or_final.spawning_feasibility_pct.toFixed(0)}%
                      </span>
                      <span className="block text-[10px] text-[#8B95A7]">Con agua limpia</span>
                    </div>
                  </div>

                  <ReproductionFactorsRadar height={240} />

                  <ModoAlertBanner
                    tone="blue"
                    title="Recomendación práctica"
                    subtitle={result.reproduction_at_target_or_final.recommended_action}
                  />
                </section>

                <section className="lg:col-span-6 modo-card p-4 space-y-3.5">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Las 2 Etapas del Ciclo de Vida en el Estanque
                    </h2>
                    <p className="text-xs text-[#8B95A7]">
                      Qué ocurre dentro de la canasta y qué se necesita para tener nuevas crías jóvenes
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl dt-subcard space-y-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full dt-badge font-medium">
                        Etapa 1 · Dentro de la canasta
                      </span>
                      <h4 className="text-xs font-semibold text-white pt-1">Desove y Fecundación</h4>
                      <div className="text-lg font-bold text-[#34D399]">
                        {result.reproduction_at_target_or_final.spawning_feasibility_pct.toFixed(0)}% viable
                      </div>
                      <p className="text-[11px] text-[#8B95A7]">
                        Las almejas adultas fertilizan e incuban sus larvas ({activeSpecies.larval_type}) a distancia de{" "}
                        {result.geometry.clam_spacing_cm.toFixed(1)} cm.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl dt-subcard space-y-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#261E12] text-[#FBBF24] font-medium">
                        Etapa 2 · En el estanque
                      </span>
                      <h4 className="text-xs font-semibold text-white pt-1">Nuevas Almejas Jóvenes</h4>
                      <div className="text-xs font-bold text-[#FBBF24]">Requiere Peces Nativos</div>
                      <p className="text-[11px] text-[#8B95A7]">
                        {result.reproduction_at_target_or_final.recruitment_disclaimer}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl dt-subcard space-y-1.5 text-xs">
                    <div className="font-semibold text-white">Puntos fuertes actuales:</div>
                    <ul className="space-y-1 text-[#94A3B8]">
                      {result.reproduction_at_target_or_final.facilitating_factors.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>
            </NacarScrollContainer>
          )}

          {/* =================================================================
              VISTA 5: SENSORES EN VIVO, EQUIPOS Y RESPALDO DE DATOS
             ================================================================= */}
          {activeView === "sensors" && (
            <NacarScrollContainer className="flex-1 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                <section className="lg:col-span-6 modo-card p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Lectura de Sensores en el Agua</h2>
                      <p className="text-xs text-[#8B95A7]">
                        Simula la llegada de una lectura nueva de sonda para actualizar el pronóstico
                      </p>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full dt-badge font-medium">
                      {isBackendOnline ? "Python API Activa" : "Motor Local Activo"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[#8B95A7] mb-1">Temperatura medida (°C)</label>
                      <input
                        type="number"
                        step={0.2}
                        value={iotSensorReading.temp_c}
                        onChange={(e) => updateIotReading({ temp_c: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 modo-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8B95A7] mb-1">Oxígeno medido (mg/L)</label>
                      <input
                        type="number"
                        step={0.2}
                        value={iotSensorReading.dissolved_oxygen_mg_L}
                        onChange={(e) => updateIotReading({ dissolved_oxygen_mg_L: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 modo-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8B95A7] mb-1">Turbidez medida (mg/L)</label>
                      <input
                        type="number"
                        step={0.5}
                        value={iotSensorReading.tss_mg_L ?? 14}
                        onChange={(e) => updateIotReading({ tss_mg_L: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 modo-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8B95A7] mb-1">Amonio medido (mg/L)</label>
                      <input
                        type="number"
                        step={0.05}
                        value={iotSensorReading.ammonia_n_mg_L}
                        onChange={(e) => updateIotReading({ ammonia_n_mg_L: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 modo-input"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl dt-subcard space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8B95A7]">Peso dado a la lectura del sensor</span>
                      <span className="text-white font-semibold">{Math.round(kalmanGain * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={kalmanGain}
                      onChange={(e) => setKalmanGain(Number(e.target.value))}
                      className="modo-slider block"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={assimilateIotWithKalman}
                    className="w-full py-2.5 px-5 rounded-full modo-btn-primary text-xs flex items-center justify-center gap-2"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Actualizar estanque con esta lectura del sensor</span>
                  </button>
                </section>

                <section className="lg:col-span-6 space-y-3.5">
                  <div className="modo-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Potencia Sugerida para Equipos</h3>
                        <p className="text-xs text-[#8B95A7]">Ajuste automático sugerido para cuidar a las almejas</p>
                      </div>
                      <Cpu className="w-4 h-4 dt-accent-text" />
                    </div>

                    <div className="space-y-2 text-xs">
                      {[
                        { label: "Oxigenador de agua", val: result.controller_slot.pwm_aerator_pct },
                        { label: "Bomba de circulación suave", val: result.controller_slot.pwm_recirculation_pump_pct },
                        { label: "Sombra / control de calor", val: result.controller_slot.pwm_thermal_cooling_pct },
                        { label: "Alimento natural (microalgas)", val: result.controller_slot.pwm_microalgae_doser_pct },
                      ].map((eq, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#CBD5E1]">{eq.label}</span>
                            <strong className="dt-accent-light">{eq.val.toFixed(0)}%</strong>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                            <div
                              className="h-full rounded-full dt-progress-fill"
                              style={{ width: `${eq.val}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="modo-card p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 dt-accent-text" />
                      <h3 className="text-sm font-semibold text-white">Respaldo de los Datos y Factores Clave</h3>
                    </div>
                    <p className="text-xs text-[#8B95A7] leading-relaxed">{result.governance.evidence_summary}</p>

                    {result.sensitivity_ranking.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-xs font-medium text-[#CBD5E1]">
                          ¿Qué influye más en la velocidad de limpieza?
                        </div>
                        {result.sensitivity_ranking.slice(0, 4).map((s, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg dt-subcard flex items-center justify-between text-xs"
                          >
                            <span className="text-[#CBD5E1]">{s.label}</span>
                            <span className="dt-accent-light font-medium">
                              Impacto: {Math.abs(s.delta_t_meta_pct).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </NacarScrollContainer>
          )}
        </main>
      </div>
      )}
    </div>
  );
};

export default App;
