import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useTwinStore } from "../../store/useTwinStore";

// 1. Gráfica de Evolución de Limpieza (0 a 72h)
export const WaterEvolutionChart: React.FC<{ height?: number }> = ({ height = 225 }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const result = useTwinStore((s) => s.result);
  const selectedHour = useTwinStore((s) => s.selectedHour);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    instanceRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, []);

  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart) return;

    const ts = result.time_series;
    const hours = ts.map((p) => `${p.time_h}h`);
    const healthSeries = ts.map((p) => p.water_health_pct);
    const ecoliPctLeft = ts.map((p) => {
      const init = Math.max(1, ts[0]?.ecoli_ufc_100mL || 2400);
      return Math.round((p.ecoli_ufc_100mL / init) * 100);
    });
    const tssPctLeft = ts.map((p) => {
      const init = Math.max(1, ts[0]?.tss_mg_L || 18);
      return Math.round((p.tss_mg_L / init) * 100);
    });

    const tMeta = result.current_percentages.estimated_hours_to_ecoli_target;

    chart.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#141925",
        borderColor: "#2B354D",
        textStyle: { color: "#F3F6FC", fontSize: 12 },
      },
      legend: {
        top: 0,
        right: 4,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: "#94A3B8", fontSize: 11 },
      },
      grid: { top: 32, left: 36, right: 14, bottom: 24 },
      xAxis: {
        type: "category",
        data: hours,
        boundaryGap: false,
        axisLine: { lineStyle: { color: "#232B3E" } },
        axisLabel: { color: "#7D879B", fontSize: 10, interval: Math.max(1, Math.floor(ts.length / 6)) },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: { color: "#7D879B", fontSize: 10, formatter: "{value}%" },
        splitLine: { lineStyle: { color: "#1B2232", type: "dashed" } },
      },
      series: [
        {
          name: "Calidad General",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: healthSeries,
          lineStyle: { width: 2.5, color: "#3B82F6" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(59, 130, 246, 0.32)" },
              { offset: 1, color: "rgba(59, 130, 246, 0.0)" },
            ]),
          },
          markLine:
            tMeta !== null && tMeta <= (ts[ts.length - 1]?.time_h || 72)
              ? {
                  symbol: "none",
                  label: {
                    formatter: `Agua limpia (${tMeta.toFixed(0)}h)`,
                    color: "#93C5FD",
                    fontSize: 10,
                  },
                  lineStyle: { color: "#60A5FA", type: "dashed", width: 1.5 },
                  data: [{ xAxis: `${Math.round(tMeta)}h` }],
                }
              : undefined,
        },
        {
          name: "Bacterias restantes",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: ecoliPctLeft,
          lineStyle: { width: 2, color: "#F59E0B" },
        },
        {
          name: "Turbidez restante",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: tssPctLeft,
          lineStyle: { width: 2, color: "#10B981" },
        },
      ],
    });
  }, [result, selectedHour]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
};

// 2. Radar de 6 Factores de Reproducción en Lenguaje Cotidiano
export const ReproductionFactorsRadar: React.FC<{ height?: number }> = ({ height = 220 }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);
  const result = useTwinStore((s) => s.result);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    instanceRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, []);

  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart) return;
    const fInit = result.reproduction_initial.factors_pct;
    const fFinal = result.reproduction_at_target_or_final.factors_pct;

    chart.setOption({
      backgroundColor: "transparent",
      tooltip: {
        backgroundColor: "#141925",
        borderColor: "#2B354D",
        textStyle: { color: "#F3F6FC", fontSize: 12 },
      },
      radar: {
        radius: "64%",
        splitNumber: 4,
        axisName: { color: "#94A3B8", fontSize: 10 },
        splitLine: { lineStyle: { color: "#232B3E" } },
        splitArea: { areaStyle: { color: ["rgba(19,23,34,0.4)", "rgba(24,30,44,0.4)"] } },
        axisLine: { lineStyle: { color: "#232B3E" } },
        indicator: [
          { name: "Tamaño adulto", max: 100 },
          { name: "Mes del año", max: 100 },
          { name: "Temperatura", max: 100 },
          { name: "Energía almeja", max: 100 },
          { name: "Agua limpia", max: 100 },
          { name: "Cercanía canasta", max: 100 },
        ],
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: [
                fFinal.size_maturity,
                fFinal.season_synchrony,
                fFinal.thermal_window,
                fFinal.deb_gonad_energy,
                fFinal.marsupial_water_safety,
                fFinal.tray_fertilization_proximity,
              ],
              name: "Con agua ya limpia",
              lineStyle: { color: "#3B82F6", width: 2 },
              areaStyle: { color: "rgba(59, 130, 246, 0.28)" },
              itemStyle: { color: "#60A5FA" },
            },
            {
              value: [
                fInit.size_maturity,
                fInit.season_synchrony,
                fInit.thermal_window,
                fInit.deb_gonad_energy,
                fInit.marsupial_water_safety,
                fInit.tray_fertilization_proximity,
              ],
              name: "Al inicio (Hora 0)",
              lineStyle: { color: "#F59E0B", width: 1.5, type: "dashed" },
              areaStyle: { color: "rgba(245, 158, 11, 0.1)" },
              itemStyle: { color: "#F59E0B" },
            },
          ],
        },
      ],
    });
  }, [result]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
};
