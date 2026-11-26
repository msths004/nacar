"""
Suite de verificación automática para el Backend del Gemelo Digital NÁCAR (`digital twin/methods`).

Verifica:
1. Carga de perfiles YAML (`yucatan_karst` y `anodontites_trapesialis`) + niveles de evidencia.
2. Conservación física, casos límite (n=0 bivalvos, agua blanda SI_c <= 0 con R_calcita_P == 0) y cotas [0, 100].
3. Consistencia del escenario de Yucatán (d_almejas ~ 10.64 cm, eta_mod ~ 0.9536, reducción de E. coli).
4. Funcionamiento completo de los endpoints de FastAPI vía TestClient.
"""

from fastapi.testclient import TestClient

from api import app
from blocks import block4_karst_geochemistry
from engine import NacarDigitalTwinEngine, load_region_profile, load_species_profile
from models import (
    IoTAssimilationRequest,
    SimulationTargetsInput,
    VisualDesignInput,
    WaterInitialAndIoTInput,
)


def test_profile_loading_and_governance() -> None:
    reg = load_region_profile("yucatan_karst")
    sp = load_species_profile("anodontites_trapesialis")
    assert reg["region_id"] == "yucatan_karst"
    assert sp["species_id"] == "anodontites_trapesialis"
    assert "a_CR" in sp["parameters"] and "L_p_maturity_mm" in sp["parameters"]
    assert any(lvl in ("B", "C", "D") for lvl in sp["evidence_map"].values())
    print("[PASS] Carga de perfiles YAML y niveles de evidencia A/B/C/D.")


def test_yucatan_reference_scenario_and_bounds() -> None:
    engine = NacarDigitalTwinEngine()
    res = engine.run_simulation(VisualDesignInput(), WaterInitialAndIoTInput(), SimulationTargetsInput())

    # Verificar geometría de linterna (Ec. 1.1 y 1.2)
    assert res.geometry.total_bivalves_n == 240
    assert 10.60 <= res.geometry.clam_spacing_cm <= 10.70, f"d_almejas inesperado: {res.geometry.clam_spacing_cm}"
    assert 0.94 <= res.geometry.eta_module <= 0.97, f"eta_mod inesperado: {res.geometry.eta_module}"

    # Verificar positividad física en toda la serie temporal
    for pt in res.time_series:
        assert pt.ecoli_ufc_100mL >= 0.0
        assert pt.tss_mg_L >= 0.0
        assert pt.ammonia_n_mg_L >= 0.0
        assert pt.phosphate_p_mg_L >= 0.0
        assert 0.0 <= pt.water_health_pct <= 100.0
        assert 0.0 <= pt.reproductive_feasibility_pct <= 100.0
        assert 0.0 < pt.permeability_K_ratio <= 1.0

    # Debe abatir E. coli desde 2400 por debajo de 200 dentro del horizonte de 72 h
    assert res.time_series[-1].ecoli_ufc_100mL < 200.0
    assert res.current_percentages.estimated_hours_to_ecoli_target is not None
    assert res.current_percentages.estimated_hours_to_ecoli_target < 72.0
    print("[PASS] Escenario de referencia Yucatán, cotas físicas [0, 100%] y positividad.")


def test_limit_cases_and_global_scalability() -> None:
    engine = NacarDigitalTwinEngine()

    # Caso límite 1: 0 almejas -> Q_biv == 0, la limpieza de E. coli debe ser más lenta que con 240 almejas
    res_with = engine.run_simulation(VisualDesignInput(), WaterInitialAndIoTInput(), SimulationTargetsInput())
    design_zero = VisualDesignInput(num_modules=0, clams_per_tray=0)
    res_zero = engine.run_simulation(design_zero, WaterInitialAndIoTInput(), SimulationTargetsInput())
    assert res_zero.geometry.total_bivalves_n == 0
    assert res_zero.time_series[0].q_biv_total_L_h == 0.0
    assert res_zero.time_series[-1].ecoli_ufc_100mL > res_with.time_series[-1].ecoli_ufc_100mL
    assert res_zero.reproduction_initial.spawning_feasibility_pct == 0.0

    # Caso límite 2: Escalabilidad global a aguas blandas (Ca=15 mg/L, HCO3=35 mg/L, pH=6.6 -> SI_c <= 0 => R_calcita_P == 0)
    reg_tpl = load_region_profile("_template_region")
    karst_soft = block4_karst_geochemistry(
        volume_L=12000.0,
        temp_c=22.0,
        ph=6.6,
        ca_mg_L=15.0,
        hco3_mg_L=35.0,
        s_po4_mg_L=0.65,
        karst_params=reg_tpl["karst_calcita"],
    )
    assert karst_soft["SI_c"] <= 0.0
    assert karst_soft["R_calcita_P_mg_h"] == 0.0

    # Conmutación completa a plantilla global en el simulador
    res_soft = engine.run_simulation(
        VisualDesignInput(region_id="_template_region", species_id="anodontites_tortolis"),
        WaterInitialAndIoTInput(temp_c=22.0, ph=6.6, calcium_mg_L=15.0, bicarbonate_mg_L=35.0),
        SimulationTargetsInput(),
    )
    assert res_soft.final_percentages.nutrient_sink_shares_pct["phosphorus"]["karst_calcite_pct"] == 0.0
    assert res_soft.reproduction_initial.species_id == "anodontites_tortolis"
    print("[PASS] Casos límite (n=0, agua blanda SI_c <= 0 -> R_calcita=0) y cambio de especie.")


def test_fastapi_endpoints() -> None:
    client = TestClient(app)

    r_health = client.get("/health")
    assert r_health.status_code == 200 and r_health.json()["status"] == "ok"

    r_prof = client.get("/profiles")
    assert r_prof.status_code == 200
    data_p = r_prof.json()
    assert any(r["region_id"] == "yucatan_karst" for r in data_p["regions"])
    assert any(s["species_id"] == "anodontites_trapesialis" for s in data_p["species"])

    payload = {"design": VisualDesignInput().model_dump(), "water": WaterInitialAndIoTInput().model_dump(), "targets": SimulationTargetsInput().model_dump()}

    r_sim = client.post("/simulate", json=payload)
    assert r_sim.status_code == 200
    assert "current_percentages" in r_sim.json() and "reproduction_initial" in r_sim.json()

    r_bio = client.post("/design-biomass", json=payload)
    assert r_bio.status_code == 200 and r_bio.json()["critical_total_root_biomass_kg"] >= 0.0

    r_rep = client.post("/reproduction-check", json=payload)
    assert r_rep.status_code == 200 and 0.0 <= r_rep.json()["spawning_feasibility_pct"] <= 100.0

    iot_payload = IoTAssimilationRequest(
        design=VisualDesignInput(),
        predicted_state=WaterInitialAndIoTInput(pathogen_ecoli_ufc_100mL=1800.0, turbidity_ntu=None, tss_mg_L=14.0),
        sensor_reading=WaterInitialAndIoTInput(pathogen_ecoli_ufc_100mL=1200.0, tss_mg_L=None, turbidity_ntu=8.0),
        targets=SimulationTargetsInput(horizon_hours=24.0),
        kalman_gain=0.65,
    ).model_dump()
    r_iot = client.post("/iot-assimilation", json=iot_payload)
    assert r_iot.status_code == 200
    assert r_iot.json()["current_percentages"]["health_semaphore"] in ("VERDE", "AMARILLO", "ROJO")
    print("[PASS] Endpoints FastAPI (/health, /profiles, /simulate, /design-biomass, /reproduction-check, /iot-assimilation).")


if __name__ == "__main__":
    test_profile_loading_and_governance()
    test_yucatan_reference_scenario_and_bounds()
    test_limit_cases_and_global_scalability()
    test_fastapi_endpoints()
    print("\nALL TESTS PASSED (OK)")
