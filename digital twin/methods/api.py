"""
API RESTful en FastAPI para el Backend del Gemelo Digital NÁCAR (Capa 5).

Ejecutar localmente desde `digital twin/methods`:
    uvicorn api:app --reload --port 8000
"""

from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from blocks import (
    block1_module_geometry,
    block2_bivalve_ecophysiology,
    block5_critical_macrophyte_biomass,
    block8_reproductive_feasibility,
)
from engine import (
    NacarDigitalTwinEngine,
    SoftSensorKarstMapper,
    list_available_profiles,
    load_region_profile,
    load_species_profile,
)
from models import (
    IoTAssimilationRequest,
    ReproductiveFeasibilityReport,
    SimulateRequest,
    SymbioticBiomassDesignReport,
)

app = FastAPI(
    title="Proyecto NÁCAR — Gemelo Digital Backend API",
    version="0.1.0-tentative",
    description=(
        "Motor predictivo offline y asimilador de sensores IoT para sistemas híbridos de "
        "biofiltración modular con bivalvos nativos (A. trapesialis), macrófitas y biofilm CWM1."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = NacarDigitalTwinEngine()


def _resolve_profiles(region_id: str, species_id: str):
    try:
        region = load_region_profile(region_id)
        species = load_species_profile(species_id)
        return region, species
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "nacar-digital-twin-backend",
        "phase": "Fase 1 (Yucatán + A. trapesialis, arquitectura escalable con cartuchos YAML)",
        "controller_mode": "DRY_RUN_RECOMMENDATION",
    }


@app.get("/profiles")
def get_profiles() -> Dict[str, Any]:
    """Lista las regiones y especies disponibles en `profiles/`."""
    return list_available_profiles()


@app.post("/simulate")
def simulate(req: SimulateRequest, include_sensitivity: bool = False):
    """Ejecuta los 9 bloques matemáticos y devuelve series + porcentajes 0-100% + reproducción."""
    _resolve_profiles(req.design.region_id, req.design.species_id)
    return engine.run_simulation(req.design, req.water, req.targets, include_sensitivity=include_sensitivity)


@app.post("/design-biomass", response_model=SymbioticBiomassDesignReport)
def design_biomass(req: SimulateRequest) -> SymbioticBiomassDesignReport:
    """Calculadora rápida de biomasa crítica de macrófitas m* por módulo y global."""
    region, species = _resolve_profiles(req.design.region_id, req.design.species_id)
    resolved = SoftSensorKarstMapper.resolve_water_inputs(req.water, region)
    geom = block1_module_geometry(req.design, species["parameters"])
    biv_clean = block2_bivalve_ecophysiology(
        temp_c=resolved["temp_c"],
        tss_mg_L=min(resolved["tss"], max(req.targets.target_tss_mg_L, 4.0)),
        oxygen_mg_L=resolved["oxygen"],
        f_org=resolved["f_org"],
        geom=geom,
        sp_params=species["parameters"],
        basal_food_pom_mg_L=resolved["basal_food_pom"],
    )
    return block5_critical_macrophyte_biomass(
        design=req.design,
        geom=geom,
        biv_at_clean_tss=biv_clean,
        temp_c=resolved["temp_c"],
        par_light=resolved["par_light"],
        s_o=resolved["oxygen"],
        x_a=resolved["nitrifier_x_a"],
        target_nh4_mg_L=req.targets.target_ammonia_n_mg_L,
        inflow_nh4_mg_L=resolved["inflow"]["nh4"],
        mac_params=region["macrophytes"],
        cwm1_params=region["cwm1_bacteria"],
    )


@app.post("/reproduction-check", response_model=ReproductiveFeasibilityReport)
def reproduction_check(req: SimulateRequest) -> ReproductiveFeasibilityReport:
    """Evalúa factibilidad de reproducción (%) por especie, época y estado del agua."""
    region, species = _resolve_profiles(req.design.region_id, req.design.species_id)
    resolved = SoftSensorKarstMapper.resolve_water_inputs(req.water, region)
    geom = block1_module_geometry(req.design, species["parameters"])
    biv = block2_bivalve_ecophysiology(
        temp_c=resolved["temp_c"],
        tss_mg_L=resolved["tss"],
        oxygen_mg_L=resolved["oxygen"],
        f_org=resolved["f_org"],
        geom=geom,
        sp_params=species["parameters"],
        basal_food_pom_mg_L=resolved["basal_food_pom"],
    )
    return block8_reproductive_feasibility(
        species_id=species["species_id"],
        species_meta=species,
        sp_params=species["parameters"],
        geom=geom,
        biv_rates=biv,
        design=req.design,
        temp_c=resolved["temp_c"],
        oxygen_mg_L=resolved["oxygen"],
        ammonia_n_mg_L=resolved["nh4"],
        latitude_deg=region.get("latitude_deg", 20.97),
    )


@app.post("/iot-assimilation")
def iot_assimilation(req: IoTAssimilationRequest):
    """Asimila lecturas IoT en tiempo real mediante ganancia de Kalman y proyecta el cuerpo de agua."""
    _resolve_profiles(req.design.region_id, req.design.species_id)
    return engine.assimilate_iot_reading(req)
