import React from "react";
import { Droplets, Layers, RotateCcw, Sparkles, Target } from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { NacarScrollContainer } from "../common/NacarScrollContainer";

interface CompactModoControlProps {
  title: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  footerLeft?: string;
  footerRight?: string;
}

// Control compacto de alta densidad con caja hundida azul (#3B82F6) estilo Modo UI
const CompactModoControl: React.FC<CompactModoControlProps> = ({
  title,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  footerLeft,
  footerRight,
}) => {
  const pct = Math.max(0, Math.min(100, ((value - min) / Math.max(1e-6, max - min)) * 100));
  const dec = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  const inc = () => onChange(Math.min(max, Number((value + step).toFixed(2))));

  return (
    <div className="p-2.5 rounded-xl bg-[#10141F] border border-[#1E2638] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#F3F6FC] truncate">{title}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={dec}
            className="w-6 h-6 rounded-full modo-btn-dark flex items-center justify-center text-xs font-bold"
            aria-label={`Disminuir ${title}`}
          >
            −
          </button>
          <div className="modo-well px-2.5 py-0.5 min-w-[82px] text-center flex items-baseline justify-center gap-1">
            <span className="text-sm font-bold text-[#7C8CF8]">
              {Number.isInteger(step) ? value.toLocaleString("es-MX") : value.toFixed(1)}
            </span>
            <span className="text-[10px] text-[#8B95A7]">{unit}</span>
          </div>
          <button
            type="button"
            onClick={inc}
            className="w-6 h-6 rounded-full modo-btn-dark flex items-center justify-center text-xs font-bold"
            aria-label={`Aumentar ${title}`}
          >
            +
          </button>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="modo-slider block"
        style={{
          background: `linear-gradient(90deg, #4F70F2 0%, #6245C8 ${pct}%, #1F2738 ${pct}%, #1F2738 100%)`,
        }}
      />

      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between text-[11px] text-[#7D879B] pt-0.5">
          <span>{footerLeft}</span>
          <span className="text-[#93C5FD] font-medium">{footerRight}</span>
        </div>
      )}
    </div>
  );
};

export const LeftControlPanel: React.FC = () => {
  const controlTab = useTwinStore((s) => s.controlTab);
  const setControlTab = useTwinStore((s) => s.setControlTab);
  const design = useTwinStore((s) => s.design);
  const water = useTwinStore((s) => s.water);
  const targets = useTwinStore((s) => s.targets);
  const result = useTwinStore((s) => s.result);
  const useNtuMode = useTwinStore((s) => s.useNtuMode);
  const setUseNtuMode = useTwinStore((s) => s.setUseNtuMode);

  const updateDesign = useTwinStore((s) => s.updateDesign);
  const updateWater = useTwinStore((s) => s.updateWater);
  const updateTargets = useTwinStore((s) => s.updateTargets);
  const autoSizeMacrophytes = useTwinStore((s) => s.autoSizeMacrophytes);
  const applyCenotePreset = useTwinStore((s) => s.applyCenotePreset);

  return (
    <aside className="modo-card p-3.5 flex flex-col h-full min-h-0 gap-2.5">
      {/* Encabezado compacto */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-white leading-tight">Configuración del Estanque</h2>
          <p className="text-[11px] text-[#8B95A7]">Medidas visibles y estado del agua</p>
        </div>
        <button
          type="button"
          onClick={() => applyCenotePreset("referencia_yucatan")}
          title="Restaurar valores del escenario piloto"
          className="w-7 h-7 rounded-full modo-btn-dark text-xs flex items-center justify-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Pestañas segmentadas en cápsula con estilo azul-morado suave */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-full bg-[#0D1018] border border-[#1E2434] shrink-0">
        <button
          type="button"
          onClick={() => setControlTab("space")}
          className={`py-1.5 px-2.5 rounded-full text-[11px] font-medium flex items-center justify-center gap-1 transition ${controlTab === "space"
            ? "modo-btn-primary"
            : "text-[#8B95A7] hover:text-white hover:bg-[#161C2A]"
            }`}
        >
          <Layers className="w-3 h-3" />
          <span>Espacio</span>
        </button>
        <button
          type="button"
          onClick={() => setControlTab("water")}
          className={`py-1.5 px-2.5 rounded-full text-[11px] font-medium flex items-center justify-center gap-1 transition ${controlTab === "water"
            ? "modo-btn-primary"
            : "text-[#8B95A7] hover:text-white hover:bg-[#161C2A]"
            }`}
        >
          <Droplets className="w-3 h-3" />
          <span>Agua Inicial</span>
        </button>
        <button
          type="button"
          onClick={() => setControlTab("targets")}
          className={`py-1.5 px-2.5 rounded-full text-[11px] font-medium flex items-center justify-center gap-1 transition ${controlTab === "targets"
            ? "modo-btn-primary"
            : "text-[#8B95A7] hover:text-white hover:bg-[#161C2A]"
            }`}
        >
          <Target className="w-3 h-3" />
          <span>Metas</span>
        </button>
      </div>

      {/* Contenedor con drag thumb integrado por si la pantalla es baja */}
      <NacarScrollContainer className="flex-1 min-h-0">
        {controlTab === "space" && (
          <div className="space-y-2.5">
            <CompactModoControl
              title="Tamaño del estanque"
              value={design.volume_liters}
              unit="L"
              min={2000}
              max={60000}
              step={1000}
              onChange={(v) => updateDesign({ volume_liters: v })}
              footerLeft={`Superficie: ${design.wetland_area_m2} m²`}
              footerRight={`Profundidad: ${result.geometry.water_depth_m.toFixed(2)} m`}
            />

            <CompactModoControl
              title="Canastas instaladas"
              value={design.num_modules}
              unit={design.num_modules === 1 ? "canasta" : "canastas"}
              min={0}
              max={12}
              step={1}
              onChange={(v) => updateDesign({ num_modules: v })}
              footerLeft={`Flujo libre: ${result.geometry.spatial_efficiency_pct.toFixed(1)}%`}
              footerRight={`Total: ${result.geometry.total_bivalves_n} almejas`}
            />

            {/* Tarjeta compacta de Pisos, Almejas por piso y Medidas de bandeja */}
            <div className="p-2.5 rounded-xl bg-[#10141F] border border-[#1E2638] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Pisos por canasta</span>
                <div className="flex items-center gap-1.5">
                  {[3, 4, 5, 6, 7, 8].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateDesign({ trays_per_module: p })}
                      className={`w-6 h-6 rounded-full text-[11px] font-semibold transition ${design.trays_per_module === p
                        ? "modo-btn-primary"
                        : "modo-btn-dark"
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1.5 border-t border-[#1B2232]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#8B95A7]">Almejas en cada piso</span>
                  <span className="font-semibold text-[#60A5FA]">{design.clams_per_tray} por piso</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={1}
                  value={design.clams_per_tray}
                  onChange={(e) => updateDesign({ clams_per_tray: Number(e.target.value) })}
                  className="modo-slider block"
                />
              </div>

              <div className="pt-1.5 border-t border-[#1B2232] grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#7D879B] mb-0.5">Bandeja (cm)</label>
                  <input
                    type="number"
                    min={30}
                    max={90}
                    step={5}
                    value={design.tray_diameter_cm}
                    onChange={(e) => updateDesign({ tray_diameter_cm: Math.max(25, Number(e.target.value)) })}
                    className="w-full px-2 py-1 text-xs modo-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#7D879B] mb-0.5">Talla almeja (mm)</label>
                  <input
                    type="number"
                    min={30}
                    max={110}
                    step={5}
                    value={design.shell_length_mm}
                    onChange={(e) => updateDesign({ shell_length_mm: Math.max(25, Number(e.target.value)) })}
                    className="w-full px-2 py-1 text-xs modo-input"
                  />
                </div>
              </div>
            </div>

            <CompactModoControl
              title="Plantas acuáticas"
              value={design.macrophyte_area_m2}
              unit="m²"
              min={0.5}
              max={25.0}
              step={0.5}
              onChange={(v) => updateDesign({ macrophyte_area_m2: v, macrophyte_root_biomass_override_kg: null })}
              footerLeft={`Por canasta: ${result.design_balance.critical_area_per_module_m2.toFixed(1)} m²`}
              footerRight={`Mínimo: ${result.design_balance.critical_total_macrophyte_area_m2.toFixed(1)} m²`}
            />

            <button
              type="button"
              onClick={autoSizeMacrophytes}
              className="w-full py-2.5 px-4 rounded-full modo-btn-primary text-xs flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Ajustar plantas automáticamente ({(result.design_balance.critical_total_macrophyte_area_m2 * 1.12).toFixed(1)} m²)
              </span>
            </button>
          </div>
        )}

        {controlTab === "water" && (
          <div className="space-y-2.5">
            <CompactModoControl
              title="Temperatura del agua"
              value={water.temp_c}
              unit="°C"
              min={18.0}
              max={34.0}
              step={0.5}
              onChange={(v) => updateWater({ temp_c: v })}
              footerLeft="Óptimo: 25.5 – 28.0 °C"
              footerRight={`pH: ${water.ph.toFixed(2)}`}
            />

            <CompactModoControl
              title="Bacterias al empezar"
              value={water.pathogen_ecoli_ufc_100mL}
              unit="/100mL"
              min={200}
              max={5000}
              step={100}
              onChange={(v) => updateWater({ pathogen_ecoli_ufc_100mL: v })}
              footerLeft="Contaminación inicial"
              footerRight={`Meta: ${targets.target_ecoli_ufc_100mL}`}
            />

            <div className="p-2.5 rounded-xl bg-[#10141F] border border-[#1E2638] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Turbidez del agua</span>
                <button
                  type="button"
                  onClick={() => setUseNtuMode(!useNtuMode)}
                  className="text-[10px] px-2.5 py-0.5 rounded-full modo-btn-dark text-[#A5B4FC]"
                >
                  {useNtuMode ? "Sensor NTU" : "mg/L"}
                </button>
              </div>
              {!useNtuMode ? (
                <>
                  <div className="flex justify-between text-[11px] text-[#8B95A7]">
                    <span>Sólidos suspendidos</span>
                    <span className="text-white font-semibold">{(water.tss_mg_L ?? 18).toFixed(1)} mg/L</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={45}
                    step={0.5}
                    value={water.tss_mg_L ?? 18}
                    onChange={(e) => updateWater({ tss_mg_L: Number(e.target.value), turbidity_ntu: null })}
                    className="modo-slider block"
                  />
                </>
              ) : (
                <>
                  <div className="flex justify-between text-[11px] text-[#8B95A7]">
                    <span>Lectura de sonda</span>
                    <span className="text-white font-semibold">{(water.turbidity_ntu ?? 12.4).toFixed(1)} NTU</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={32}
                    step={0.5}
                    value={water.turbidity_ntu ?? 12.4}
                    onChange={(e) => updateWater({ turbidity_ntu: Number(e.target.value), tss_mg_L: null })}
                    className="modo-slider block"
                  />
                </>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-[#10141F] border border-[#1E2638] grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#8B95A7] mb-0.5">Oxígeno (mg/L)</label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  step={0.2}
                  value={water.dissolved_oxygen_mg_L}
                  onChange={(e) => updateWater({ dissolved_oxygen_mg_L: Number(e.target.value) })}
                  className="w-full px-2 py-1 text-xs modo-input"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8B95A7] mb-0.5">pH del agua</label>
                <input
                  type="number"
                  min={6.2}
                  max={8.6}
                  step={0.05}
                  value={water.ph}
                  onChange={(e) => updateWater({ ph: Number(e.target.value) })}
                  className="w-full px-2 py-1 text-xs modo-input"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8B95A7] mb-0.5">Amonio (mg/L)</label>
                <input
                  type="number"
                  min={0.05}
                  max={6}
                  step={0.05}
                  value={water.ammonia_n_mg_L}
                  onChange={(e) => updateWater({ ammonia_n_mg_L: Number(e.target.value) })}
                  className="w-full px-2 py-1 text-xs modo-input"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8B95A7] mb-0.5">Fósforo (mg/L)</label>
                <input
                  type="number"
                  min={0.02}
                  max={3}
                  step={0.05}
                  value={water.phosphate_p_mg_L}
                  onChange={(e) => updateWater({ phosphate_p_mg_L: Number(e.target.value) })}
                  className="w-full px-2 py-1 text-xs modo-input"
                />
              </div>
            </div>
          </div>
        )}

        {controlTab === "targets" && (
          <div className="space-y-2.5">
            <CompactModoControl
              title="Duración simulada"
              value={targets.horizon_hours}
              unit="h"
              min={24}
              max={168}
              step={12}
              onChange={(v) => updateTargets({ horizon_hours: v })}
              footerLeft="Tiempo proyectado"
              footerRight={`${(targets.horizon_hours / 24).toFixed(1)} días`}
            />

            <CompactModoControl
              title="Meta de bacterias"
              value={targets.target_ecoli_ufc_100mL}
              unit="/100mL"
              min={50}
              max={500}
              step={25}
              onChange={(v) => updateTargets({ target_ecoli_ufc_100mL: v })}
              footerLeft="Umbral de agua segura"
            />

            <CompactModoControl
              title="Meta de claridad"
              value={targets.target_tss_mg_L}
              unit="mg/L"
              min={1.0}
              max={10.0}
              step={0.5}
              onChange={(v) => updateTargets({ target_tss_mg_L: v })}
              footerLeft="Turbidez máxima final"
            />
          </div>
        )}
      </NacarScrollContainer>
    </aside>
  );
};
