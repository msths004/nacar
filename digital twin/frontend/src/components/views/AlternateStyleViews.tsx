import React, { useState } from "react";
import {
  Activity,
  Box,
  ChevronRight,
  Clock,
  Cpu,
  Droplets,
  Eye,
  FastForward,
  FolderTree,
  Gauge,
  Grid,
  Layers,
  Maximize2,
  Pause,
  Play,
  Radio,
  Rewind,
  Search,
  Sliders,
  Sparkles,
  Sprout,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";
import { Pond3DViewport } from "../canvas3d/Pond3DViewport";
import { WaterEvolutionChart } from "../analytics/TwinCharts";
import { NacarScrollContainer } from "../common/NacarScrollContainer";
import { CENOTE_PRESETS, REGION_PROFILES, SPECIES_PROFILES } from "../../engine/nacarEngine";
import { TWIN_PALETTES, useTwinStore } from "../../store/useTwinStore";

// ============================================================================
// Auxiliar: Barras verticales tipo ecualizador / tick-bar (Imágenes 2 y 3)
// ============================================================================
const SpectraTickBar: React.FC<{
  pct: number;
  ticks?: number;
  heightClass?: string;
}> = ({ pct, ticks = 28, heightClass = "h-3" }) => {
  const colorTheme = useTwinStore((s) => s.colorTheme);
  const pal = TWIN_PALETTES[colorTheme] || TWIN_PALETTES.blue_purple;
  const filledCount = Math.round((Math.max(0, Math.min(100, pct)) / 100) * ticks);
  return (
    <div className={`flex items-center gap-[2px] w-full ${heightClass}`}>
      {Array.from({ length: ticks }).map((_, idx) => {
        const active = idx < filledCount;
        return (
          <span
            key={idx}
            className="flex-1 h-full rounded-[1px] transition-colors duration-150"
            style={{
              backgroundColor: active ? pal.top : "rgba(255,255,255,0.08)",
              opacity: active ? 0.55 + (idx / ticks) * 0.45 : 1,
            }}
          />
        );
      })}
    </div>
  );
};

// ============================================================================
// Auxiliar: Arco Semicircular "Health Rate" (Imágenes 2 y 3 de Spectra)
// ============================================================================
const SpectraSemiGauge: React.FC<{
  valuePct: number;
  title: string;
  subtitleLeftLabel: string;
  subtitleLeftVal: string;
  subtitleRightLabel: string;
  subtitleRightVal: string;
  scoreFormat?: "percent" | "five";
}> = ({
  valuePct,
  title,
  subtitleLeftLabel,
  subtitleLeftVal,
  subtitleRightLabel,
  subtitleRightVal,
  scoreFormat = "percent",
}) => {
  const colorTheme = useTwinStore((s) => s.colorTheme);
  const pal = TWIN_PALETTES[colorTheme] || TWIN_PALETTES.blue_purple;
  const clamped = Math.max(0, Math.min(100, valuePct));
  const radius = 58;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  const displayScore = scoreFormat === "five" ? ((clamped / 100) * 5).toFixed(1) : `${clamped.toFixed(0)}`;
  const gradId = `spectraArcGrad_${colorTheme}_${scoreFormat}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[156px] h-[88px] flex items-end justify-center overflow-hidden">
        <svg viewBox="0 0 140 80" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={pal.bot} />
              <stop offset="55%" stopColor={pal.top} />
              <stop offset="100%" stopColor={pal.light} />
            </linearGradient>
          </defs>
          <path
            d="M 12 72 A 58 58 0 0 1 128 72"
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 12 72 A 58 58 0 0 1 128 72"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute bottom-1 text-center">
          <div className="text-2xl font-light tracking-tight text-white leading-none">{displayScore}</div>
          <div className="text-[10px] text-[#8B95A7] mt-0.5">{title}</div>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-white/5 text-[11px]">
        <div>
          <span className="text-[#8B95A7] block text-[10px]">{subtitleLeftLabel}</span>
          <span className="font-semibold" style={{ color: pal.light }}>
            | {subtitleLeftVal}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[#8B95A7] block text-[10px]">{subtitleRightLabel}</span>
          <span className="font-semibold text-emerald-400">| {subtitleRightVal}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ESTILO 1 (Imagen 1): PLANT VIEWER · ESQUEMA TÉCNICO CAD / SCADA
// ============================================================================
export const PlantViewerCadLayout: React.FC = () => {
  const colorTheme = useTwinStore((s) => s.colorTheme);
  const pal = TWIN_PALETTES[colorTheme] || TWIN_PALETTES.blue_purple;
  const design = useTwinStore((s) => s.design);
  const water = useTwinStore((s) => s.water);
  const targets = useTwinStore((s) => s.targets);
  const result = useTwinStore((s) => s.result);
  const selectedHour = useTwinStore((s) => s.selectedHour);
  const setSelectedHour = useTwinStore((s) => s.setSelectedHour);
  const isPlayingTimeline = useTwinStore((s) => s.isPlayingTimeline);
  const setIsPlayingTimeline = useTwinStore((s) => s.setIsPlayingTimeline);
  const inspectSingle = useTwinStore((s) => s.inspectSingleBasket);
  const setInspectSingle = useTwinStore((s) => s.setInspectSingleBasket);
  const updateDesign = useTwinStore((s) => s.updateDesign);
  const updateWater = useTwinStore((s) => s.updateWater);
  const autoSizeMacrophytes = useTwinStore((s) => s.autoSizeMacrophytes);
  const getCurrentTimePoint = useTwinStore((s) => s.getCurrentTimePoint);

  const [cadMode, setCadMode] = useState<"3d" | "2d">("2d");
  const [rightTab, setRightTab] = useState<"params" | "events" | "docs">("params");
  const [selectedNode, setSelectedNode] = useState<string>("estacion_biofiltro");
  const [searchQuery, setSearchQuery] = useState("");

  const curPoint = getCurrentTimePoint();
  const activeRegion = REGION_PROFILES[design.region_id] || REGION_PROFILES.yucatan_karst;
  const activeSpecies = SPECIES_PROFILES[design.species_id] || SPECIES_PROFILES.anodontites_trapesialis;
  const tMeta = result.current_percentages.estimated_hours_to_ecoli_target;

  const treeNodes = [
    { id: "estacion_biofiltro", label: "Estación Biofiltro Principal", status: "ok", indent: 0 },
    ...Array.from({ length: Math.min(4, Math.max(1, design.num_modules)) }).map((_, i) => ({
      id: `canasta_${i + 1}`,
      label: `Canasta M-0${i + 1} (${design.trays_per_module} pisos)`,
      status: result.final_percentages.permeability_remaining_pct > 75 ? "ok" : "warn",
      indent: 1,
    })),
    {
      id: "zona_macr",
      label: `Zona Plantas (${design.macrophyte_area_m2} m²)`,
      status: result.design_balance.balance_status === "DEFICIT_AMONIO" ? "warn" : "ok",
      indent: 0,
    },
    { id: "lecho_karst", label: "Lecho Mineral / Piedra Caliza", status: "ok", indent: 0 },
    { id: "bomba_oxigeno", label: "Aireador y Recirculación", status: "ok", indent: 0 },
  ].filter((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5">
      {/* COLUMNA IZQUIERDA (Imagen 1): Árbol Jerárquico de Objetos + Controles Técnicos */}
      <aside className="lg:col-span-3 h-full min-h-0 modo-card p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4" style={{ color: "var(--dt-accent-text)" }} />
            <span className="text-xs font-semibold text-white">Objetos del Sistema</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#94A3B8]">
            {design.num_modules} mód.
          </span>
        </div>

        {/* Buscador de objetos estilo Plant Viewer */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar canasta, zona o sensor..."
            className="w-full pl-8 pr-2.5 py-1 text-xs modo-input"
          />
        </div>

        <NacarScrollContainer className="flex-1 min-h-0">
          <div className="space-y-2.5">
            {/* Árbol de nodos con indicador luminoso */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-[#64748B] px-1">
                {activeRegion.colloquial_country} · {activeRegion.colloquial_name}
              </div>
              {treeNodes.map((node) => {
                const active = selectedNode === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      setSelectedNode(node.id);
                      if (node.id.startsWith("canasta_")) {
                        setInspectSingle(true);
                      } else if (node.id === "estacion_biofiltro") {
                        setInspectSingle(false);
                      }
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-left text-xs flex items-center justify-between transition ${
                      active
                        ? "bg-white/10 text-white border border-white/15"
                        : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                    }`}
                    style={{ paddingLeft: `${10 + node.indent * 14}px` }}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />
                      {node.label}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        node.status === "ok" ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Ajustes rápidos de ingeniería en el panel izquierdo */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-[#64748B] px-1">
                Parámetros de Operación
              </div>

              <div className="p-2.5 rounded-lg modo-well space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Volumen del estanque</span>
                  <strong className="text-white">{design.volume_liters.toLocaleString("es-MX")} L</strong>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={60000}
                  step={1000}
                  value={design.volume_liters}
                  onChange={(e) => updateDesign({ volume_liters: Number(e.target.value) })}
                  className="modo-slider block"
                />
              </div>

              <div className="p-2.5 rounded-lg modo-well space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Canastas y pisos</span>
                  <strong className="text-white">
                    {design.num_modules} × {design.trays_per_module} pisos ({result.geometry.total_bivalves_n} almejas)
                  </strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={design.num_modules}
                  onChange={(e) => updateDesign({ num_modules: Number(e.target.value) })}
                  className="modo-slider block"
                />
              </div>

              <div className="p-2.5 rounded-lg modo-well space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Plantas acuáticas</span>
                  <strong className="text-white">{design.macrophyte_area_m2} m²</strong>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={25}
                  step={0.5}
                  value={design.macrophyte_area_m2}
                  onChange={(e) =>
                    updateDesign({ macrophyte_area_m2: Number(e.target.value), macrophyte_root_biomass_override_kg: null })
                  }
                  className="modo-slider block"
                />
                <button
                  type="button"
                  onClick={autoSizeMacrophytes}
                  className="w-full py-1.5 px-3 modo-btn-primary text-[11px] flex items-center justify-center gap-1.5 mt-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Balancear plantas ({result.design_balance.critical_total_macrophyte_area_m2.toFixed(1)} m²)</span>
                </button>
              </div>

              <div className="p-2.5 rounded-lg modo-well space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Bacterias iniciales</span>
                  <strong className="text-white">{water.pathogen_ecoli_ufc_100mL} /100mL</strong>
                </div>
                <input
                  type="range"
                  min={200}
                  max={5000}
                  step={100}
                  value={water.pathogen_ecoli_ufc_100mL}
                  onChange={(e) => updateWater({ pathogen_ecoli_ufc_100mL: Number(e.target.value) })}
                  className="modo-slider block"
                />
              </div>
            </div>
          </div>
        </NacarScrollContainer>
      </aside>

      {/* COLUMNA CENTRAL (Imagen 1): Lienzo con Retícula Blueprint CAD + Barra Flotante 2D/3D */}
      <section className="lg:col-span-6 h-full min-h-0 modo-card p-3 flex flex-col gap-2">
        {/* Ruta jerárquica superior (Breadcrumb estilo Plant Viewer) */}
        <div className="flex items-center justify-between text-xs text-[#94A3B8] border-b border-white/5 pb-2 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <span>Proyecto Nácar</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            <span>{activeRegion.colloquial_country}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            <strong className="text-white">Estación de Biofiltración</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
              className="px-3 py-1 modo-btn-primary text-[11px] flex items-center gap-1"
            >
              {isPlayingTimeline ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlayingTimeline ? "Pausar" : "Simular"} ({selectedHour}h)</span>
            </button>
          </div>
        </div>

        {/* Lienzo central CAD (Alterna entre Diagrama P&ID 2D idéntico a Imagen 1 y Visor 3D) */}
        <div className="relative flex-1 min-h-[240px] rounded-xl overflow-hidden border border-white/10 cad-blueprint-grid flex flex-col">
          {/* Barra flotante superior de herramientas CAD (como en Imagen 1) */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1 p-1 rounded-lg bg-[#141A24]/95 border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setCadMode("2d")}
              className={`px-2.5 py-1 text-[11px] font-semibold transition ${
                cadMode === "2d" ? "modo-btn-primary" : "text-[#94A3B8] hover:text-white"
              }`}
            >
              2D Esquema P&amp;ID
            </button>
            <button
              type="button"
              onClick={() => setCadMode("3d")}
              className={`px-2.5 py-1 text-[11px] font-semibold transition ${
                cadMode === "3d" ? "modo-btn-primary" : "text-[#94A3B8] hover:text-white"
              }`}
            >
              3D Volumétrico
            </button>
            <span className="h-4 w-[1px] bg-white/10 mx-1" />
            <button
              type="button"
              onClick={() => setInspectSingle(!inspectSingle)}
              className="px-2.5 py-1 text-[11px] text-[#CBD5E1] hover:text-white flex items-center gap-1"
            >
              <Layers className="w-3 h-3" style={{ color: "var(--dt-accent-text)" }} />
              <span>{inspectSingle ? "1 Canasta" : `${design.num_modules} Canastas`}</span>
            </button>
          </div>

          {cadMode === "3d" ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <Pond3DViewport />
            </div>
          ) : (
            /* Diagrama técnico esquemático P&ID 2D inspirado directamente en Imagen 1 */
            <div className="flex-1 min-h-0 flex items-center justify-center p-4">
              <svg viewBox="0 0 760 420" className="w-full h-full max-h-[420px]">
                {/* Líneas de tubería / flujo hidráulico entre unidades */}
                <path
                  d="M 135 160 L 135 95 L 540 95 L 540 175"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="1.6"
                />
                <path
                  d="M 135 280 L 135 345 L 540 345 L 540 275"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="1.6"
                />
                <path
                  d="M 275 95 L 275 135 M 405 95 L 405 135 M 275 345 L 275 305 M 405 345 L 405 305"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="1.5"
                />

                {/* Flechas de dirección de flujo */}
                <polygon points="210,91 222,95 210,99" fill={pal.top} />
                <polygon points="470,91 482,95 470,99" fill={pal.top} />
                <polygon points="345,341 333,345 345,349" fill={pal.top} />

                {/* Tanque Izquierdo P-101 (Entrada / Columna de Agua) */}
                <g transform="translate(80, 145)">
                  <rect
                    x="0"
                    y="0"
                    width="110"
                    height="145"
                    rx="26"
                    fill={pal.well}
                    stroke="#64748B"
                    strokeWidth="1.6"
                  />
                  {/* Nivel de agua limpia adentro del tanque */}
                  <rect
                    x="4"
                    y={141 - Math.round((curPoint.water_health_pct / 100) * 115)}
                    width="102"
                    height={Math.round((curPoint.water_health_pct / 100) * 115)}
                    rx="20"
                    fill={pal.top}
                    fillOpacity="0.28"
                  />
                  <text x="55" y="45" textAnchor="middle" fill="#94A3B8" fontSize="11" fontFamily="monospace">
                    E-101
                  </text>
                  <text x="55" y="82" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="600">
                    {curPoint.water_health_pct.toFixed(0)}%
                  </text>
                  <text x="55" y="102" textAnchor="middle" fill="#64748B" fontSize="10">
                    {(design.volume_liters / 1000).toFixed(1)} m³
                  </text>
                </g>

                {/* 4 Módulos de Canastas M-01 a M-04 (como Насос 1..4 en Imagen 1) */}
                {[
                  { id: "Canasta 1", x: 220, y: 125, active: design.num_modules >= 1 },
                  { id: "Canasta 2", x: 355, y: 125, active: design.num_modules >= 2 },
                  { id: "Canasta 3", x: 220, y: 235, active: design.num_modules >= 3 },
                  { id: "Canasta 4", x: 355, y: 235, active: design.num_modules >= 4 },
                ].map((m, idx) => (
                  <g key={idx} transform={`translate(${m.x}, ${m.y})`}>
                    <rect
                      x="0"
                      y="0"
                      width="110"
                      height="76"
                      rx="8"
                      fill="#131A26"
                      stroke={m.active ? "#475569" : "#1E293B"}
                      strokeWidth="1.5"
                      strokeDasharray={m.active ? "none" : "4 3"}
                    />
                    <text x="55" y="24" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">
                      {m.id}
                    </text>
                    <text x="55" y="42" textAnchor="middle" fill="#94A3B8" fontSize="10">
                      {m.active ? `${design.trays_per_module * design.clams_per_tray} almejas` : "Inactiva"}
                    </text>
                    <circle
                      cx="55"
                      cy="60"
                      r="4.5"
                      fill={m.active ? "#10B981" : "#EF4444"}
                    />
                  </g>
                ))}

                {/* Unidad Derecha P-102 (Zona Simbiótica de Plantas + Lecho Calizo) */}
                <g transform="translate(500, 155)">
                  <rect
                    x="0"
                    y="0"
                    width="165"
                    height="125"
                    rx="6"
                    fill="#131A26"
                    stroke="#64748B"
                    strokeWidth="1.6"
                  />
                  <text x="16" y="26" fill="#94A3B8" fontSize="11" fontFamily="monospace">
                    RIZOSFERA P-102
                  </text>
                  <text x="16" y="50" fill="#FFFFFF" fontSize="15" fontWeight="600">
                    {curPoint.q_biv_total_L_h.toFixed(0)} L/h
                  </text>
                  <text x="16" y="68" fill="#64748B" fontSize="10">
                    Plantas: {design.macrophyte_area_m2} m² (mín {result.design_balance.critical_total_macrophyte_area_m2.toFixed(1)} m²)
                  </text>
                  {/* Mini onda en tiempo real */}
                  <path
                    d="M 16 96 Q 36 86, 56 95 T 96 93 T 136 96"
                    fill="none"
                    stroke={pal.top}
                    strokeWidth="2"
                  />
                </g>

                {/* Etiquetas de válvulas técnicas */}
                <text x="172" y="84" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                  V-101
                </text>
                <text x="445" y="84" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                  V-102
                </text>
                <text x="172" y="362" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                  V-105
                </text>
              </svg>
            </div>
          )}

          {/* Barra inferior de coordenadas CAD y deslizador de hora (como en Imagen 1) */}
          <div className="px-3 py-1.5 bg-[#0D121A]/95 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
            <div className="font-mono flex items-center gap-3">
              <span>X: {design.wetland_area_m2.toFixed(1)} m²</span>
              <span>Y: {result.geometry.water_depth_m.toFixed(2)} m</span>
              <span>Z: {design.tray_diameter_cm} cm</span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-[240px]">
              <input
                type="range"
                min={0}
                max={targets.horizon_hours}
                step={1}
                value={selectedHour}
                onChange={(e) => setSelectedHour(Number(e.target.value))}
                className="modo-slider block"
              />
            </div>
            <div className="font-mono text-[#CBD5E1]">
              Hora simulada: {selectedHour}:00:00 / {targets.horizon_hours}h
            </div>
          </div>
        </div>
      </section>

      {/* COLUMNA DERECHA (Imagen 1): Pestañas Subrayadas + Tabla de Parámetros + Gráfica + Eventos */}
      <aside className="lg:col-span-3 h-full min-h-0 flex flex-col gap-2.5">
        {/* Tarjeta Superior: Parámetros Tabulares con pestañas subrayadas */}
        <section className="modo-card p-3.5 flex-1 min-h-0 flex flex-col gap-2.5">
          <div className="shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Estación de Biofiltración</h2>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                En operación
              </span>
            </div>

            {/* Pestañas subrayadas idénticas a Параметры | События | Документы de Imagen 1 */}
            <div className="grid grid-cols-3 border-b border-white/10 mt-2 text-xs">
              {[
                { id: "params", label: "Parámetros" },
                { id: "events", label: "Eventos" },
                { id: "docs", label: "Especie" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRightTab(t.id as "params" | "events" | "docs")}
                  className={`py-1.5 text-center font-medium border-b-2 transition ${
                    rightTab === t.id
                      ? "text-white"
                      : "border-transparent text-[#8B95A7] hover:text-white"
                  }`}
                  style={{
                    borderColor: rightTab === t.id ? "var(--dt-accent-top)" : "transparent",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <NacarScrollContainer className="flex-1 min-h-0">
            {rightTab === "params" && (
              <div className="divide-y divide-white/5 text-xs">
                {[
                  { label: "Bacterias en entrada", val: `${water.pathogen_ecoli_ufc_100mL.toFixed(0)} /100mL` },
                  { label: "Bacterias actuales", val: `${curPoint.ecoli_ufc_100mL.toFixed(0)} /100mL` },
                  { label: "Caudal filtrado total", val: `${curPoint.q_biv_total_L_h.toFixed(1)} L/h` },
                  { label: "Temperatura del agua", val: `${water.temp_c.toFixed(1)} °C` },
                  { label: "Turbidez suspendida", val: `${curPoint.tss_mg_L.toFixed(2)} mg/L` },
                  { label: "Amonio disuelto", val: `${curPoint.ammonia_n_mg_L.toFixed(2)} mg/L` },
                  { label: "Oxígeno disuelto", val: `${curPoint.oxygen_mg_L.toFixed(2)} mg/L` },
                  {
                    label: "Tiempo estimado meta",
                    val: tMeta !== null ? `${tMeta.toFixed(1)} h` : `> ${targets.horizon_hours} h`,
                  },
                ].map((row, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between">
                    <span className="text-[#8B95A7]">{row.label}</span>
                    <strong className="text-white font-semibold">{row.val}</strong>
                  </div>
                ))}
              </div>
            )}

            {rightTab === "events" && (
              <div className="space-y-2 text-xs pt-1">
                {[
                  {
                    time: "00:00",
                    dot: "bg-emerald-400",
                    text: `Inicio con ${result.geometry.total_bivalves_n} almejas activas`,
                  },
                  {
                    time: `${Math.round((tMeta ?? 36) * 0.5)}:00`,
                    dot: "bg-amber-400",
                    text: `Claridad supera el 65% (${result.final_percentages.clarity_pct.toFixed(0)}% final)`,
                  },
                  {
                    time: `${Math.round(tMeta ?? 38)}:00`,
                    dot: "bg-emerald-400",
                    text: "Agua segura alcanzada (meta de bacterias cumplida)",
                  },
                  {
                    time: `${targets.horizon_hours}:00`,
                    dot: "bg-blue-400",
                    text: `Mallas libres al ${result.final_percentages.permeability_remaining_pct.toFixed(0)}%`,
                  },
                ].map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 py-1 border-b border-white/5">
                    <span className="font-mono text-[11px] text-[#64748B]">{ev.time}</span>
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${ev.dot}`} />
                    <span className="text-[#CBD5E1]">{ev.text}</span>
                  </div>
                ))}
              </div>
            )}

            {rightTab === "docs" && (
              <div className="space-y-2 text-xs text-[#94A3B8] pt-1">
                <div className="p-2.5 rounded-lg modo-well">
                  <div className="text-white font-semibold">{activeSpecies.colloquial_name}</div>
                  <div className="text-[11px] mt-0.5">{activeSpecies.region_badge}</div>
                  <div className="text-[11px] mt-1">
                    Viabilidad desove:{" "}
                    <strong className="text-white">
                      {result.reproduction_at_target_or_final.spawning_feasibility_pct.toFixed(0)}%
                    </strong>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed">{result.governance.evidence_summary}</p>
              </div>
            )}
          </NacarScrollContainer>
        </section>

        {/* Tarjeta Intermedia: Gráfica en vivo (Графики en Imagen 1) */}
        <section className="modo-card p-3 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white">Gráfica de Limpieza</span>
            <span className="text-[10px] text-[#8B95A7]">0h – {targets.horizon_hours}h</span>
          </div>
          <WaterEvolutionChart height={135} />
        </section>
      </aside>
    </div>
  );
};

// ============================================================================
// ESTILO 2 (Imagen 2): SPECTRA · HUD 3D CENTRAL & LÍNEA DE TIEMPO INFERIOR
// ============================================================================
export const SpectraHud3DLayout: React.FC = () => {
  const colorTheme = useTwinStore((s) => s.colorTheme);
  const pal = TWIN_PALETTES[colorTheme] || TWIN_PALETTES.blue_purple;
  const design = useTwinStore((s) => s.design);
  const water = useTwinStore((s) => s.water);
  const targets = useTwinStore((s) => s.targets);
  const result = useTwinStore((s) => s.result);
  const selectedHour = useTwinStore((s) => s.selectedHour);
  const setSelectedHour = useTwinStore((s) => s.setSelectedHour);
  const isPlayingTimeline = useTwinStore((s) => s.isPlayingTimeline);
  const setIsPlayingTimeline = useTwinStore((s) => s.setIsPlayingTimeline);
  const updateDesign = useTwinStore((s) => s.updateDesign);
  const updateWater = useTwinStore((s) => s.updateWater);
  const autoSizeMacrophytes = useTwinStore((s) => s.autoSizeMacrophytes);
  const getCurrentTimePoint = useTwinStore((s) => s.getCurrentTimePoint);

  const curPoint = getCurrentTimePoint();
  const activeRegion = REGION_PROFILES[design.region_id] || REGION_PROFILES.yucatan_karst;
  const activeSpecies = SPECIES_PROFILES[design.species_id] || SPECIES_PROFILES.anodontites_trapesialis;
  const tMeta = result.current_percentages.estimated_hours_to_ecoli_target;

  // 28 barras para el histograma superior izquierdo (Inicio -> Meta)
  const sparkBars = result.time_series.filter((_, idx) => idx % 3 === 0).slice(0, 24);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5">
      {/* ÁREA SUPERIOR (3 COLUMNAS HUD ESTILO SPECTRA STADIUM - IMAGEN 2) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        {/* COLUMNA IZQUIERDA HUD (3 cols): Histograma + 3 Anillos + Sliders de Barras Tick */}
        <aside className="lg:col-span-3 h-full min-h-0 spectra-hud-panel rounded-xl p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Sector Biofiltro</span>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "var(--dt-accent-top)" }}
              />
            </div>
            <span className="text-[11px] font-mono text-[#94A3B8]">
              Módulos: {design.num_modules}
            </span>
          </div>

          {/* Mini Histograma Inicio -> Final (como Start 1125 -> End 2471 en Imagen 2) */}
          <div className="p-2.5 rounded-lg bg-black/35 border border-white/5 shrink-0">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div>
                <span className="text-[10px] text-[#8B95A7] block">Inicial (0h)</span>
                <strong className="text-sm font-light text-white">
                  {water.pathogen_ecoli_ufc_100mL}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#8B95A7] block">Actual ({selectedHour}h)</span>
                <strong
                  className="text-sm font-semibold"
                  style={{ color: "var(--dt-accent-light)" }}
                >
                  {curPoint.ecoli_ufc_100mL.toFixed(0)} UFC
                </strong>
              </div>
            </div>
            <div className="h-9 flex items-end gap-[2px]">
              {sparkBars.map((pt, i) => {
                const hPct = Math.max(12, Math.min(100, pt.water_health_pct));
                const passed = pt.time_h <= selectedHour;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t-[1px] transition-all"
                    style={{
                      height: `${hPct}%`,
                      backgroundColor: passed
                        ? "var(--dt-accent-top)"
                        : "rgba(255,255,255,0.12)",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Lista de controles con barras de ticks estilo ecualizador Spectra (Imagen 2) */}
          <NacarScrollContainer className="flex-1 min-h-0">
            <div className="space-y-2.5">
              {[
                {
                  label: "Volumen Estanque",
                  valText: `${(design.volume_liters / 1000).toFixed(0)}k L`,
                  pct: ((design.volume_liters - 2000) / 58000) * 100,
                  min: 2000,
                  max: 60000,
                  step: 1000,
                  value: design.volume_liters,
                  onChange: (v: number) => updateDesign({ volume_liters: v }),
                },
                {
                  label: "Canastas Activas",
                  valText: `${design.num_modules}`,
                  pct: (design.num_modules / 12) * 100,
                  min: 1,
                  max: 12,
                  step: 1,
                  value: design.num_modules,
                  onChange: (v: number) => updateDesign({ num_modules: v }),
                },
                {
                  label: "Pisos por Canasta",
                  valText: `${design.trays_per_module}`,
                  pct: ((design.trays_per_module - 3) / 5) * 100,
                  min: 3,
                  max: 8,
                  step: 1,
                  value: design.trays_per_module,
                  onChange: (v: number) => updateDesign({ trays_per_module: v }),
                },
                {
                  label: "Almejas por Piso",
                  valText: `${design.clams_per_tray}`,
                  pct: ((design.clams_per_tray - 5) / 35) * 100,
                  min: 5,
                  max: 40,
                  step: 1,
                  value: design.clams_per_tray,
                  onChange: (v: number) => updateDesign({ clams_per_tray: v }),
                },
                {
                  label: "Área de Plantas",
                  valText: `${design.macrophyte_area_m2} m²`,
                  pct: (design.macrophyte_area_m2 / 25) * 100,
                  min: 0.5,
                  max: 25,
                  step: 0.5,
                  value: design.macrophyte_area_m2,
                  onChange: (v: number) =>
                    updateDesign({ macrophyte_area_m2: v, macrophyte_root_biomass_override_kg: null }),
                },
                {
                  label: "Temperatura Agua",
                  valText: `${water.temp_c.toFixed(1)} °C`,
                  pct: ((water.temp_c - 18) / 16) * 100,
                  min: 18,
                  max: 34,
                  step: 0.5,
                  value: water.temp_c,
                  onChange: (v: number) => updateWater({ temp_c: v }),
                },
              ].map((ctrl, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-black/30 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#CBD5E1]">{ctrl.label}</span>
                    <strong style={{ color: "var(--dt-accent-light)" }}>{ctrl.valText}</strong>
                  </div>
                  <SpectraTickBar pct={ctrl.pct} ticks={26} heightClass="h-2" />
                  <input
                    type="range"
                    min={ctrl.min}
                    max={ctrl.max}
                    step={ctrl.step}
                    value={ctrl.value}
                    onChange={(e) => ctrl.onChange(Number(e.target.value))}
                    className="modo-slider block opacity-80"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={autoSizeMacrophytes}
                className="w-full py-2 px-3 modo-btn-primary text-xs flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nivelar plantas automáticamente</span>
              </button>
            </div>
          </NacarScrollContainer>
        </aside>

        {/* ESCENARIO CENTRAL 3D (6 cols - Imagen 2: AT&T Stadium 3D Showcase) */}
        <section className="lg:col-span-6 h-full min-h-0 spectra-hud-panel rounded-xl p-3 flex flex-col gap-2 relative">
          {/* Encabezado HUD flotante */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2 shrink-0">
            <div>
              <h1 className="text-base font-light tracking-wide text-white">
                {activeRegion.colloquial_name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#CBD5E1] font-mono">
                  {result.geometry.total_bivalves_n} almejas ×
                </span>
                <span className="text-[11px] text-[#8B95A7]">{activeSpecies.colloquial_name}</span>
              </div>
            </div>

            {/* Indicadores superiores derechos estilo Spectra (Total / Filtrado / Nivel 1-5) */}
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-[10px] text-[#8B95A7] block">Volumen Total</span>
                <strong className="text-white font-semibold">
                  {design.volume_liters.toLocaleString("es-MX")} L
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[#8B95A7] block">Filtración</span>
                <strong className="text-white font-semibold">
                  {curPoint.q_biv_total_L_h.toFixed(0)} L/h
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[#8B95A7] block">Nivel Limpieza</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const active = Math.ceil(curPoint.water_health_pct / 20) >= lvl;
                    return (
                      <span
                        key={lvl}
                        className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center"
                        style={{
                          backgroundColor: active
                            ? "var(--dt-accent-top)"
                            : "rgba(255,255,255,0.08)",
                          color: active ? "#fff" : "#64748B",
                        }}
                      >
                        {lvl}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Visor 3D Central de Gran Formato */}
          <Pond3DViewport />
        </section>

        {/* COLUMNA DERECHA HUD (3 cols - Imagen 2: Network Usage + Health Rate Gauge + Mini-Mapa 2D) */}
        <aside className="lg:col-span-3 h-full min-h-0 spectra-hud-panel rounded-xl p-3 flex flex-col justify-between gap-2.5">
          {/* 1. Uso / Balance de Nutrientes (como Network Usage en Imagen 2) */}
          <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1.5">
            <div className="text-xs font-medium text-white">Capacidad Simbiótica</div>
            <div className="text-xs text-[#94A3B8]">
              <strong className="text-white text-sm">{design.macrophyte_area_m2} m²</strong> plantas instaladas
            </div>
            <div className="w-full h-2.5 rounded-sm bg-white/10 overflow-hidden flex">
              <div
                className="h-full"
                style={{
                  width: `${result.final_percentages.nutrient_sink_shares_pct.ammonia.bacteria_cwm1_pct}%`,
                  backgroundColor: "var(--dt-accent-top)",
                }}
              />
              <div
                className="h-full opacity-60"
                style={{
                  width: `${result.final_percentages.nutrient_sink_shares_pct.ammonia.macrophytes_pct}%`,
                  backgroundColor: "var(--dt-accent-light)",
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#94A3B8]">
              <span>
                | Bacterias raíces:{" "}
                <strong className="text-white">
                  {result.final_percentages.nutrient_sink_shares_pct.ammonia.bacteria_cwm1_pct}%
                </strong>
              </span>
              <span>
                | Plantas:{" "}
                <strong className="text-white">
                  {result.final_percentages.nutrient_sink_shares_pct.ammonia.macrophytes_pct}%
                </strong>
              </span>
            </div>
          </div>

          {/* 2. Arco Semicircular Health Rate (idéntico al 91 Health Rate de Imagen 2) */}
          <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
            <div className="text-xs font-medium text-white mb-1">Índice de Salud del Agua</div>
            <SpectraSemiGauge
              valuePct={curPoint.water_health_pct}
              title="Calidad General"
              subtitleLeftLabel="Claridad agua"
              subtitleLeftVal={`${result.final_percentages.clarity_pct.toFixed(0)}%`}
              subtitleRightLabel="Bacterias limpias"
              subtitleRightVal={`${result.final_percentages.bacteria_removal_pct.toFixed(0)}%`}
            />
          </div>

          {/* 3. Desglose por Vía de Limpieza (Assets by Type en Imagen 2) */}
          <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1.5 text-[11px]">
            <div className="text-xs font-medium text-white">Aporte por Componente</div>
            {[
              { name: "Filtración Almejas", pct: `${result.final_percentages.bacteria_removal_pct.toFixed(0)}%` },
              { name: "Claridad Turbidez", pct: `${result.final_percentages.clarity_pct.toFixed(0)}%` },
              { name: "Viabilidad Desove", pct: `${result.reproduction_at_target_or_final.spawning_feasibility_pct.toFixed(0)}%` },
              { name: "Mallas Libres", pct: `${result.final_percentages.permeability_remaining_pct.toFixed(0)}%` },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[#94A3B8] flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--dt-accent-top)" }}
                  />
                  {row.name}
                </span>
                <strong className="text-white font-mono">{row.pct}</strong>
              </div>
            ))}
          </div>

          {/* 4. Mini-Mapa Superior 2D del Estanque (como el radar del estadio abajo a la derecha en Imagen 2) */}
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-medium text-white">Mapa Superior 2D</div>
              <div className="text-[10px] text-[#8B95A7]">
                {design.wetland_area_m2} m² · {design.num_modules} canastas
              </div>
              <div className="text-[10px] mt-1" style={{ color: "var(--dt-accent-light)" }}>
                Meta: {tMeta !== null ? `${tMeta.toFixed(1)} h` : `> ${targets.horizon_hours} h`}
              </div>
            </div>
            <div className="w-20 h-14 rounded border border-white/15 bg-black/60 relative flex items-center justify-center">
              <div className="w-14 h-9 rounded-sm border border-dashed border-white/20 flex items-center justify-around">
                {Array.from({ length: Math.min(4, Math.max(1, design.num_modules)) }).map((_, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--dt-accent-top)" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* DOCK INFERIOR DE LÍNEA DE TIEMPO CON REGLA GRADUADA (Imagen 2 inferior) */}
      <footer className="shrink-0 spectra-hud-panel rounded-xl px-4 py-2 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
              className="w-7 h-7 rounded-full modo-btn-primary flex items-center justify-center"
              title={isPlayingTimeline ? "Pausar" : "Reproducir"}
            >
              {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setSelectedHour(Math.max(0, selectedHour - 1))}
              className="px-2 py-1 modo-btn-dark text-[11px]"
            >
              <Rewind className="w-3 h-3" />
            </button>
            <span className="px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-[#CBD5E1]">
              Paso: 1 hora
            </span>
            <button
              type="button"
              onClick={() => setSelectedHour(Math.min(targets.horizon_hours, selectedHour + 1))}
              className="px-2 py-1 modo-btn-dark text-[11px]"
            >
              <FastForward className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#8B95A7]">
              Bacterias: <strong className="text-white">{curPoint.ecoli_ufc_100mL.toFixed(0)} UFC</strong>
            </span>
            <span className="text-[#8B95A7]">
              Turbidez: <strong className="text-white">{curPoint.tss_mg_L.toFixed(1)} mg/L</strong>
            </span>
            <span className="font-mono text-base font-light tracking-wider" style={{ color: "var(--dt-accent-light)" }}>
              {String(selectedHour).padStart(2, "0")}:00:00{" "}
              <span className="text-[11px] text-[#8B95A7]">1.0x</span>
            </span>
          </div>
        </div>

        {/* Regla graduada interactiva de extremo a extremo */}
        <div className="relative pt-1">
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
          />
          <div className="flex justify-between text-[10px] font-mono text-[#64748B] pt-1">
            {[0, 12, 24, 36, 48, 60, 72].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setSelectedHour(Math.min(targets.horizon_hours, h))}
                className={`hover:text-white transition ${
                  Math.abs(selectedHour - h) <= 2 ? "text-white font-bold" : ""
                }`}
              >
                |{String(h).padStart(2, "0")}:00
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============================================================================
// ESTILO 3 (Imagen 3): SPECTRA · ANALÍTICA EJECUTIVA & MATRIZ DE ZONAS
// ============================================================================
export const SpectraAnalyticsMatrixLayout: React.FC = () => {
  const colorTheme = useTwinStore((s) => s.colorTheme);
  const pal = TWIN_PALETTES[colorTheme] || TWIN_PALETTES.blue_purple;
  const design = useTwinStore((s) => s.design);
  const water = useTwinStore((s) => s.water);
  const targets = useTwinStore((s) => s.targets);
  const result = useTwinStore((s) => s.result);
  const selectedHour = useTwinStore((s) => s.selectedHour);
  const setSelectedHour = useTwinStore((s) => s.setSelectedHour);
  const updateDesign = useTwinStore((s) => s.updateDesign);
  const autoSizeMacrophytes = useTwinStore((s) => s.autoSizeMacrophytes);
  const getCurrentTimePoint = useTwinStore((s) => s.getCurrentTimePoint);

  const curPoint = getCurrentTimePoint();
  const activeRegion = REGION_PROFILES[design.region_id] || REGION_PROFILES.yucatan_karst;
  const activeSpecies = SPECIES_PROFILES[design.species_id] || SPECIES_PROFILES.anodontites_trapesialis;
  const tMeta = result.current_percentages.estimated_hours_to_ecoli_target;

  // 6 KPIs ejecutivos estilo Imagen 3 (Availability, Accessibility, Retainability, Throughput, Traffic, Utilization)
  const kpiCards = [
    {
      title: "Remoción Bacterias (%)",
      val: `${result.final_percentages.bacteria_removal_pct.toFixed(0)}%`,
      delta: `+${(result.current_percentages.bivalve_speedup_pct ?? 48).toFixed(0)}%`,
      pct: result.final_percentages.bacteria_removal_pct,
    },
    {
      title: "Claridad del Agua (%)",
      val: `${result.final_percentages.clarity_pct.toFixed(0)}%`,
      delta: "Meta 90%",
      pct: result.final_percentages.clarity_pct,
    },
    {
      title: "Equilibrio Simbiótico (%)",
      val: `${Math.min(100, result.final_percentages.symbiotic_balance_pct).toFixed(0)}%`,
      delta: `${design.macrophyte_area_m2} m²`,
      pct: Math.min(100, result.final_percentages.symbiotic_balance_pct),
    },
    {
      title: "Caudal Filtrado (L/h)",
      val: `${curPoint.q_biv_total_L_h.toFixed(0)}`,
      delta: `${result.geometry.total_bivalves_n} alm.`,
      pct: Math.min(100, (curPoint.q_biv_total_L_h / 900) * 100),
    },
    {
      title: "Volumen Reciclado",
      val: `${(result.final_percentages.water_recycled_fraction_pct / 100).toFixed(1)}x`,
      delta: `${(design.volume_liters / 1000).toFixed(0)} m³`,
      pct: Math.min(100, result.final_percentages.water_recycled_fraction_pct / 3),
    },
    {
      title: "Viabilidad Desove (%)",
      val: `${result.reproduction_at_target_or_final.spawning_feasibility_pct.toFixed(0)}%`,
      delta: activeSpecies.larval_type,
      pct: result.reproduction_at_target_or_final.spawning_feasibility_pct,
    },
  ];

  // Filas de la tabla inferior derecha (Gate B / Traffic & Guests flow de Imagen 3)
  const zoneRows = [
    {
      device: "Canasta Biofiltro M-01",
      capacity: `${design.trays_per_module * design.clams_per_tray} almejas`,
      subCap: `${design.trays_per_module} pisos activos`,
      utilization: `${result.geometry.spatial_efficiency_pct.toFixed(0)}%`,
      traffic: "Flujo Óptimo",
      timeText: tMeta !== null ? `${tMeta.toFixed(0)} h para meta` : `${targets.horizon_hours} h ciclo`,
    },
    {
      device: "Zona de Raíces (Plantas)",
      capacity: `${design.macrophyte_area_m2} m²`,
      subCap: `${result.design_balance.installed_root_biomass_kg.toFixed(1)} kg raíz`,
      utilization: `${result.final_percentages.nutrient_sink_shares_pct.ammonia.macrophytes_pct}%`,
      traffic: result.design_balance.balance_status === "DEFICIT_AMONIO" ? "Faltan Plantas" : "Equilibrado",
      timeText: `Mín. ${result.design_balance.critical_total_macrophyte_area_m2.toFixed(1)} m²`,
    },
    {
      device: "Bacterias Benéficas Raíz",
      capacity: `${water.nitrifier_biomass_mg_L} mg/L`,
      subCap: "Rizosfera oxigenada",
      utilization: `${result.final_percentages.nutrient_sink_shares_pct.ammonia.bacteria_cwm1_pct}%`,
      traffic: "Alta Absorción",
      timeText: `Amonio ${curPoint.ammonia_n_mg_L.toFixed(2)} mg/L`,
    },
    {
      device: "Lecho Mineral / Caliza",
      capacity: `${water.calcium_mg_L ?? 210} mg/L Ca`,
      subCap: activeRegion.colloquial_country,
      utilization: `${result.final_percentages.nutrient_sink_shares_pct.phosphorus.karst_calcite_pct}%`,
      traffic: design.region_id === "yucatan_karst" ? "Captura Fósforo" : "Agua Dulce",
      timeText: `Fósforo ${curPoint.phosphate_p_mg_L.toFixed(2)} mg/L`,
    },
    {
      device: "Mallas de las Bandejas",
      capacity: `${design.tray_diameter_cm} cm diám.`,
      subCap: "Permeabilidad libre",
      utilization: `${result.final_percentages.permeability_remaining_pct.toFixed(0)}%`,
      traffic: "Baja Obstrucción",
      timeText: `Limpieza en ${result.final_percentages.estimated_days_to_tray_maintenance.toFixed(0)} días`,
    },
  ];

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
      {/* MITAD IZQUIERDA (5 cols): Matriz 2x3 de KPIs con Barras Tick + Visor 3D Inferior */}
      <div className="lg:col-span-5 h-full min-h-0 flex flex-col gap-3">
        {/* Encabezado estilo "← AT&T Stadium / Gate B" de Imagen 3 */}
        <div className="spectra-hud-panel rounded-xl px-3.5 py-2 flex items-center justify-between shrink-0">
          <div className="text-sm font-light tracking-wide text-white">
            <span className="text-[#8B95A7]">Estanque /</span> Diagnóstico por Zona
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={autoSizeMacrophytes}
              className="px-3 py-1 modo-btn-primary text-[11px]"
            >
              Nivelar Plantas
            </button>
          </div>
        </div>

        {/* Matriz 2x3 de Tarjetas Ejecutivas (Imagen 3 arriba a la izquierda) */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          {kpiCards.map((k, idx) => (
            <div key={idx} className="spectra-hud-panel rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-light text-white tracking-tight">{k.val}</span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--dt-accent-light)" }}
                >
                  |{k.delta}
                </span>
              </div>
              <SpectraTickBar pct={k.pct} ticks={16} heightClass="h-2.5" />
              <div className="text-[10px] text-[#94A3B8] truncate">{k.title}</div>
            </div>
          ))}
        </div>

        {/* Visor 3D en la esquina inferior izquierda (como "Last Reception" 3D en Imagen 3) */}
        <div className="spectra-hud-panel rounded-xl p-3 flex-1 min-h-0 flex flex-col gap-2">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-xs font-medium text-white">
              Recepción y Filtración 3D ({design.num_modules} canastas)
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-[#8B95A7]">Canastas:</span>
              {[1, 2, 4, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => updateDesign({ num_modules: n })}
                  className={`w-5 h-5 rounded-full text-[10px] font-semibold ${
                    design.num_modules === n ? "modo-btn-primary" : "modo-btn-dark"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Pond3DViewport />
        </div>
      </div>

      {/* MITAD DERECHA (7 cols): Health Rate + Distribución por Zonas + Tabla de Flujo (Imagen 3 derecha) */}
      <div className="lg:col-span-7 h-full min-h-0 flex flex-col gap-3">
        {/* Fila Superior Derecha: Health Rate 4.7/5 + Distribución de Partículas por Zona */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
          <div className="md:col-span-6 spectra-hud-panel rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white">Índice de Salud del Ecosistema</h3>
              <p className="text-[11px] text-[#8B95A7] mt-0.5">
                Resumen de signos vitales del agua a la hora {selectedHour}h de {targets.horizon_hours}h
              </p>
            </div>
            <div className="my-1">
              <SpectraSemiGauge
                valuePct={curPoint.water_health_pct}
                title="Puntaje Ecosistema (0-5)"
                subtitleLeftLabel="Oxígeno Sat."
                subtitleLeftVal={`${result.final_percentages.oxygen_saturation_pct.toFixed(0)}%`}
                subtitleRightLabel="Agua Segura"
                subtitleRightVal={`${result.final_percentages.bacteria_removal_pct.toFixed(0)}%`}
                scoreFormat="five"
              />
            </div>
          </div>

          {/* Matriz de puntos de retención por etapa (Entry Gates Distribution en Imagen 3) */}
          <div className="md:col-span-6 spectra-hud-panel rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white">Retención por Etapa del Estanque</h3>
              <p className="text-[11px] text-[#8B95A7] mt-0.5">
                Captura acumulada de partículas desde la entrada hasta el agua limpia
              </p>
            </div>

            {/* Gráfico de densidad de puntos estilo Imagen 3 */}
            <div className="grid grid-cols-12 gap-1 items-end h-24 pt-2 px-1">
              {[92, 85, 78, 70, 62, 54, 46, 38, 30, 22, 16, 10].map((density, colIdx) => {
                const dots = Math.max(2, Math.round(density / 12));
                return (
                  <div key={colIdx} className="flex flex-col gap-1 justify-end h-full">
                    {Array.from({ length: dots }).map((_, dIdx) => (
                      <span
                        key={dIdx}
                        className="w-1.5 h-1.5 rounded-full mx-auto"
                        style={{
                          backgroundColor:
                            dIdx % 2 === 0 ? "var(--dt-accent-top)" : "var(--dt-accent-light)",
                          opacity: 0.45 + (dIdx / dots) * 0.55,
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-4 gap-1 pt-2 border-t border-white/5 text-[10px]">
              <div>
                <span className="text-[#8B95A7] block">Entrada</span>
                <strong className="text-white">| 12%</strong>
              </div>
              <div>
                <span className="text-[#8B95A7] block">Canastas</span>
                <strong className="text-white">| 54%</strong>
              </div>
              <div>
                <span className="text-[#8B95A7] block">Raíces</span>
                <strong className="text-white">| 82%</strong>
              </div>
              <div>
                <span className="text-[#8B95A7] block">Salida</span>
                <strong style={{ color: "var(--dt-accent-light)" }}>
                  | {result.final_percentages.clarity_pct.toFixed(0)}%
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Fila Inferior Derecha: Tabla estructurada de Zonas, Canastas y Sensores (Imagen 3 abajo) */}
        <section className="spectra-hud-panel rounded-xl p-3.5 flex-1 min-h-0 flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
            <div>
              <h3 className="text-xs font-semibold text-white">
                Flujo y Rendimiento por Zona del Gemelo Digital
              </h3>
              <span className="text-[11px] text-[#8B95A7]">
                Hora seleccionada: {selectedHour}h · Desliza para inspeccionar el estado
              </span>
            </div>
            <div className="flex items-center gap-2 w-44">
              <input
                type="range"
                min={0}
                max={targets.horizon_hours}
                step={1}
                value={selectedHour}
                onChange={(e) => setSelectedHour(Number(e.target.value))}
                className="modo-slider block"
              />
              <span className="text-xs font-mono text-white shrink-0">{selectedHour}h</span>
            </div>
          </div>

          <NacarScrollContainer className="flex-1 min-h-0">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[#8B95A7] border-b border-white/10">
                  <th className="py-1.5 font-medium">Zona / Unidad</th>
                  <th className="py-1.5 font-medium">Capacidad</th>
                  <th className="py-1.5 font-medium">Aporte / Uso</th>
                  <th className="py-1.5 font-medium">Estado</th>
                  <th className="py-1.5 font-medium text-right">Indicador Clave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {zoneRows.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] transition">
                    <td className="py-2 pr-2 font-medium" style={{ color: "var(--dt-accent-light)" }}>
                      {r.device}
                    </td>
                    <td className="py-2 pr-2">
                      <div className="text-white font-semibold">{r.capacity}</div>
                      <div className="text-[10px] text-[#8B95A7]">{r.subCap}</div>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="text-white font-semibold">{r.utilization}</div>
                      <div className="text-[10px] text-[#8B95A7]">Eficiencia activa</div>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="text-white">{r.traffic}</div>
                      <div className="text-[10px] text-[#8B95A7]">Monitoreo continuo</div>
                    </td>
                    <td className="py-2 text-right font-mono text-[11px] text-white">
                      <span
                        className="inline-block w-1 h-3.5 rounded-full mr-1.5 align-middle"
                        style={{ backgroundColor: "var(--dt-accent-top)" }}
                      />
                      {r.timeText}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </NacarScrollContainer>
        </section>
      </div>
    </div>
  );
};
