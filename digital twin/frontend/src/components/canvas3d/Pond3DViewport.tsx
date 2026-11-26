import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useTwinStore } from "../../store/useTwinStore";

// Geometría procedural de una almeja bivalva cerrada con volumen realista
function createClamValveGeo(scale = 0.085): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(scale, 16, 12);
  geo.scale(1.35, 0.48, 1.05);
  return geo;
}

const sharedClamGeo = createClamValveGeo(0.075);

interface LanternBasketProps {
  position: [number, number, number];
  trays: number;
  clamsPerTray: number;
  trayDiameterCm: number;
  verticalSpacingCm: number;
  waterTopY: number;
  waterBotY: number;
  clarity01: number;
  highlight?: boolean;
}

const LanternBasket: React.FC<LanternBasketProps> = ({
  position,
  trays,
  clamsPerTray,
  trayDiameterCm,
  verticalSpacingCm,
  waterTopY,
  waterBotY,
  clarity01,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const flowRef = useRef<THREE.Group>(null);

  const radius = THREE.MathUtils.clamp((trayDiameterCm / 50) * 0.42, 0.26, 0.56);
  const availHeight = Math.max(0.8, waterTopY - waterBotY - 0.36);
  const stepY = Math.min((verticalSpacingCm / 18) * 0.23, availHeight / Math.max(1, trays));
  const totalHeight = Math.max(0.35, (trays - 1) * stepY + 0.16);
  const topTrayY = waterTopY - 0.28;
  const centerBasketY = topTrayY - ((trays - 1) * stepY) / 2;

  const clamOffsets = useMemo(() => {
    const count = Math.min(36, Math.max(0, clamsPerTray));
    const pts: Array<{ x: number; z: number; rot: number }> = [];
    if (count === 0) return pts;
    for (let i = 0; i < count; i++) {
      const ring = i < 6 ? 0.38 : i < 16 ? 0.68 : 0.86;
      const angle = (i * 2.39996) % (Math.PI * 2); // distribución áurea uniforme
      const r = radius * ring;
      pts.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        rot: angle + 0.6,
      });
    }
    return pts;
  }, [clamsPerTray, radius]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.3 + position[0]) * 0.012;
      groupRef.current.rotation.y = Math.sin(t * 0.45 + position[2]) * 0.04;
    }
    if (flowRef.current) {
      flowRef.current.rotation.y = t * 0.45;
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Boya / amarre superior en la superficie */}
      <mesh position={[0, waterTopY + 0.03, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Cuerdas de suspensión */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}-${sz}`}
            position={[sx * radius * 0.68, (waterTopY + topTrayY) / 2, sz * radius * 0.68]}
          >
            <cylinderGeometry args={[0.009, 0.009, Math.max(0.1, waterTopY - topTrayY + 0.06), 6]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.7} />
          </mesh>
        ))
      )}

      <group ref={groupRef}>
        {/* Malla cilíndrica exterior tipo linterna */}
        <mesh position={[0, centerBasketY, 0]}>
          <cylinderGeometry args={[radius * 1.02, radius * 1.02, totalHeight, 24, Math.max(2, trays), true]} />
          <meshStandardMaterial
            color="#475569"
            wireframe
            transparent
            opacity={0.32}
            roughness={0.6}
          />
        </mesh>

        {/* 4 tirantes verticales de la canasta */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, idx) => (
          <mesh
            key={idx}
            position={[Math.cos(ang) * radius, centerBasketY, Math.sin(ang) * radius]}
          >
            <cylinderGeometry args={[0.012, 0.012, totalHeight + 0.05, 8]} />
            <meshStandardMaterial color="#64748b" roughness={0.6} />
          </mesh>
        ))}

        {/* Bandejas circulares apiladas y almejas por piso */}
        {Array.from({ length: trays }).map((_, tIdx) => {
          const y = topTrayY - tIdx * stepY;
          return (
            <group key={tIdx} position={[0, y, 0]}>
              {/* Aro perimetral de la bandeja */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[radius, 0.016, 10, 32]} />
                <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.4} />
              </mesh>
              {/* Disco de malla polimérica */}
              <mesh>
                <cylinderGeometry args={[radius * 0.98, radius * 0.98, 0.012, 24]} />
                <meshStandardMaterial
                  color="#1e293b"
                  transparent
                  opacity={0.78}
                  roughness={0.7}
                />
              </mesh>
              {/* Almejas distribuidas en el piso */}
              {clamOffsets.map((c, cIdx) => (
                <mesh
                  key={cIdx}
                  geometry={sharedClamGeo}
                  position={[c.x, 0.024, c.z]}
                  rotation={[0.08, c.rot, 0]}
                >
                  <meshPhysicalMaterial
                    color="#e2e8f0"
                    emissive="#94a3b8"
                    emissiveIntensity={0.08 + clarity01 * 0.08}
                    roughness={0.28}
                    metalness={0.08}
                    clearcoat={0.7}
                  />
                </mesh>
              ))}
            </group>
          );
        })}

        {/* Aros sutiles de flujo de agua filtrada alrededor de la canasta */}
        <group ref={flowRef} position={[0, centerBasketY, 0]}>
          {[0.3, -0.25].map((yOff, i) => (
            <mesh key={i} position={[0, yOff, 0]} rotation={[Math.PI / 2, 0.08 * (i === 0 ? 1 : -1), 0]}>
              <torusGeometry args={[radius * 1.24, 0.007, 8, 40, Math.PI * 1.45]} />
              <meshBasicMaterial
                color="#60a5fa"
                transparent
                opacity={0.18 + clarity01 * 0.22}
              />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
};

const PondSceneContent: React.FC = () => {
  const design = useTwinStore((s) => s.design);
  const inspectSingle = useTwinStore((s) => s.inspectSingleBasket);
  const getCurrentTimePoint = useTwinStore((s) => s.getCurrentTimePoint);
  const water = useTwinStore((s) => s.water);

  const curPoint = getCurrentTimePoint();
  const initTss = Math.max(4, water.tss_mg_L ?? 18);
  const clarity01 = THREE.MathUtils.clamp(1 - (curPoint.tss_mg_L - 1.5) / Math.max(4, initTss), 0.05, 1.0);

  const waterSurfaceRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const W_SIZE = 4.2;
  const WATER_TOP = 0.92;
  const WATER_BOT = -0.68;
  const WATER_H = WATER_TOP - WATER_BOT;

  // Color natural del agua: pasa de verde-pardo turbio a azul-turquesa cristalino de cenote
  const waterColor = useMemo(() => {
    const murky = new THREE.Color("#3b4d3e");
    const mid = new THREE.Color("#17687a");
    const crystal = new THREE.Color("#2299b8");
    const c = new THREE.Color();
    if (clarity01 < 0.5) {
      c.lerpColors(murky, mid, clarity01 * 2);
    } else {
      c.lerpColors(mid, crystal, (clarity01 - 0.5) * 2);
    }
    return c;
  }, [clarity01]);

  // Posiciones de las canastas instaladas
  const basketPositions = useMemo<[number, number, number][]>(() => {
    if (inspectSingle) return [[0, 0, 0]];
    const count = Math.min(12, Math.max(0, design.num_modules));
    if (count === 0) return [];
    if (count === 1) return [[0, 0, 0]];
    if (count === 2) return [[-0.82, 0, 0.12], [0.82, 0, -0.12]];
    if (count === 3) return [[-0.95, 0, 0.45], [0.95, 0, 0.45], [0, 0, -0.75]];
    const arr: [number, number, number][] = [];
    const r = count <= 6 ? 1.05 : 1.28;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      arr.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
    }
    return arr;
  }, [design.num_modules, inspectSingle]);

  // Plantas acuáticas flotantes proporcionales al área plantada A_mac
  const plantClusters = useMemo(() => {
    const ratio = THREE.MathUtils.clamp(design.macrophyte_area_m2 / Math.max(1, design.wetland_area_m2), 0, 1);
    const totalClusters = Math.round(ratio * 14);
    const corners: Array<[number, number]> = [
      [-1.55, -1.45],
      [1.52, -1.42],
      [-1.5, 1.42],
      [1.48, 1.45],
      [-1.62, 0.0],
      [1.62, 0.05],
      [0.0, -1.58],
      [0.05, 1.56],
      [-1.12, -1.48],
      [1.15, -1.46],
      [-1.15, 1.46],
      [1.12, 1.48],
      [-1.55, -0.75],
      [1.55, 0.75],
    ];
    return corners.slice(0, totalClusters);
  }, [design.macrophyte_area_m2, design.wetland_area_m2]);

  // Partículas en suspensión y precipitación mineral de calcio-fósforo
  const particlePositions = useMemo(() => {
    const n = 160;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * (W_SIZE * 0.88);
      arr[i * 3 + 1] = WATER_BOT + 0.08 + Math.random() * (WATER_H - 0.16);
      arr[i * 3 + 2] = (Math.random() - 0.5) * (W_SIZE * 0.88);
    }
    return arr;
  }, [W_SIZE, WATER_BOT, WATER_H]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (waterSurfaceRef.current) {
      waterSurfaceRef.current.position.y = WATER_TOP + Math.sin(t * 1.6) * 0.012;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.04;
    }
  });

  const isKarstRegion = design.region_id === "yucatan_karst";

  return (
    <group position={[0, -0.08, 0]}>
      {/* Iluminación suave y natural de estudio */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 11, 7]} intensity={1.75} color="#f8fafc" />
      <directionalLight position={[-7, 5, -6]} intensity={0.75} color="#93c5fd" />
      <pointLight position={[0, 1.5, 0]} intensity={0.55} color="#38bdf8" distance={8} />

      {/* 1. ESTRATO INFERIOR: Lecho de Piedra Caliza Kárstica (o sedimento de río) */}
      <group position={[0, WATER_BOT - 0.34, 0]}>
        <RoundedBox args={[W_SIZE + 0.08, 0.68, W_SIZE + 0.08]} radius={0.06} smoothness={4}>
          <meshStandardMaterial
            color={isKarstRegion ? "#cfc6b4" : "#645a4f"}
            roughness={0.88}
            metalness={0.04}
          />
        </RoundedBox>
        {/* Sub-estrato de roca caliza estratificada */}
        <RoundedBox
          position={[0, -0.16, 0]}
          args={[W_SIZE + 0.1, 0.24, W_SIZE + 0.1]}
          radius={0.04}
          smoothness={3}
        >
          <meshStandardMaterial
            color={isKarstRegion ? "#b5aa96" : "#4b433b"}
            roughness={0.92}
          />
        </RoundedBox>
      </group>

      {/* 2. ESTRATO INTERMEDIO: Canastas suspendidas tipo linterna con almejas */}
      {basketPositions.map((pos, idx) => (
        <LanternBasket
          key={idx}
          position={pos}
          trays={design.trays_per_module}
          clamsPerTray={design.clams_per_tray}
          trayDiameterCm={design.tray_diameter_cm}
          verticalSpacingCm={design.tray_vertical_spacing_cm}
          waterTopY={WATER_TOP}
          waterBotY={WATER_BOT}
          clarity01={clarity01}
        />
      ))}

      {/* 3. ESTRATO SUPERIOR: Plantas acuáticas flotantes con raíces sumergidas y bacterias benéficas */}
      {!inspectSingle &&
        plantClusters.map(([px, pz], idx) => (
          <group key={idx} position={[px, WATER_TOP, pz]}>
            {/* Hojas flotantes */}
            {[0, 1, 2].map((leaf) => {
              const ang = idx * 1.1 + leaf * 2.1;
              return (
                <mesh
                  key={leaf}
                  position={[Math.cos(ang) * 0.14, 0.02 + leaf * 0.008, Math.sin(ang) * 0.14]}
                  rotation={[0.08, ang, 0.05]}
                >
                  <cylinderGeometry args={[0.22, 0.2, 0.016, 16]} />
                  <meshStandardMaterial color="#2f9e66" roughness={0.45} />
                </mesh>
              );
            })}
            {/* Tallos emergentes */}
            <mesh position={[0, 0.18, 0]} rotation={[0.05, 0, -0.06]}>
              <cylinderGeometry args={[0.015, 0.024, 0.34, 8]} />
              <meshStandardMaterial color="#3bb273" roughness={0.5} />
            </mesh>
            {/* Raíces sumergidas (rizosfera) */}
            {[-0.07, 0, 0.07].map((rx, rIdx) => (
              <mesh key={rIdx} position={[rx, -0.26, (rIdx - 1) * 0.06]}>
                <cylinderGeometry args={[0.014, 0.004, 0.5, 6]} />
                <meshStandardMaterial color="#1f6343" transparent opacity={0.82} roughness={0.7} />
              </mesh>
            ))}
            {/* Nodos sutiles de bacterias benéficas en las raíces */}
            <mesh position={[0.04, -0.24, -0.03]}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} />
            </mesh>
          </group>
        ))}

      {/* Partículas suspendidas en el agua (disminuyen conforme el agua se limpia) */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePositions.length / 3}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.042}
          color={clarity01 > 0.6 ? "#bae6fd" : "#a89f7d"}
          transparent
          opacity={0.22 + (1 - clarity01) * 0.55}
          depthWrite={false}
        />
      </points>

      {/* BLOQUE VOLUMÉTRICO DE AGUA (Paredes translúcidas y superficie) */}
      <mesh position={[0, (WATER_TOP + WATER_BOT) / 2, 0]}>
        <boxGeometry args={[W_SIZE, WATER_H, W_SIZE]} />
        <meshPhysicalMaterial
          color={waterColor}
          transparent
          opacity={0.52 + (1 - clarity01) * 0.28}
          roughness={0.14}
          metalness={0.02}
          transmission={0.35 + clarity01 * 0.35}
          clearcoat={0.8}
          depthWrite={false}
        />
      </mesh>

      {/* Superficie superior del agua con borde de menisco sutil */}
      <mesh ref={waterSurfaceRef} position={[0, WATER_TOP, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W_SIZE, W_SIZE]} />
        <meshPhysicalMaterial
          color={waterColor}
          transparent
          opacity={0.42}
          roughness={0.1}
          clearcoat={1}
          depthWrite={false}
        />
      </mesh>

      {/* Marco arquitectónico del corte de agua */}
      <lineSegments position={[0, (WATER_TOP + WATER_BOT) / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(W_SIZE + 0.01, WATER_H + 0.01, W_SIZE + 0.01)]} />
        <lineBasicMaterial color="#60a5fa" transparent opacity={0.22} />
      </lineSegments>
    </group>
  );
};

export const Pond3DViewport: React.FC = () => {
  const inspectSingle = useTwinStore((s) => s.inspectSingleBasket);
  const setInspectSingle = useTwinStore((s) => s.setInspectSingleBasket);
  const design = useTwinStore((s) => s.design);
  const result = useTwinStore((s) => s.result);
  const colorTheme = useTwinStore((s) => s.colorTheme);

  return (
    <div className="relative w-full flex-1 min-h-[240px] rounded-xl overflow-hidden bg-gradient-to-b from-[#0E131F] via-[#0B0F18] to-[#090C13] border border-[#1E2536]">
      {/* Etiquetas flotantes superiores dentro del visor 3D */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-[#131824]/90 border border-[#252E42] px-2.5 py-1 rounded-lg text-[11px] text-[#D5DDF0] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
          <span>
            {design.num_modules} {design.num_modules === 1 ? "canasta" : "canastas"} ·{" "}
            {design.trays_per_module} pisos ·{" "}
            <strong className="text-white">{result.geometry.total_bivalves_n} almejas</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setInspectSingle(false)}
            className={`px-3.5 py-1 rounded-full text-[11px] font-medium transition ${!inspectSingle ? "modo-btn-primary" : "modo-btn-dark"
              }`}
          >
            Estanque Completo
          </button>
          <button
            type="button"
            onClick={() => setInspectSingle(true)}
            className={`px-3.5 py-1 rounded-full text-[11px] font-medium transition ${inspectSingle ? "modo-btn-primary" : "modo-btn-dark"
              }`}
          >
            Ver 1 Canasta
          </button>
        </div>
      </div>

      {/* Nota inferior discreta de interacción */}
      <div className="absolute bottom-2 left-2.5 z-10 pointer-events-none text-[10px] text-[#7D879B] bg-[#0E121B]/80 px-2 py-0.5 rounded border border-[#1D2434]">
        Arrastra 360° · Rueda zoom · Fondo:{" "}
        <span className="text-[#CBD5E1]">
          {design.region_id === "yucatan_karst" ? "Piedra caliza (Yucatán)" : "Sedimento agua dulce"}
        </span>
      </div>

      <Canvas
        camera={{ position: inspectSingle ? [2.9, 1.4, 3.1] : [4.6, 2.8, 4.9], fov: 36 }}
        dpr={[1, 2]}
      >
        <PondSceneContent />
        <OrbitControls
          enablePan={false}
          minDistance={2.2}
          maxDistance={9.5}
          maxPolarAngle={Math.PI * 0.48}
          minPolarAngle={0.2}
        />
      </Canvas>
    </div>
  );
};
