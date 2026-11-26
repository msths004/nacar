"""Paquete del Motor Offline y API del Gemelo Digital NÁCAR."""

import sys
from pathlib import Path

_METHODS_DIR = str(Path(__file__).resolve().parent)
if _METHODS_DIR not in sys.path:
    sys.path.insert(0, _METHODS_DIR)

from engine import (  # noqa: E402
    NacarDigitalTwinEngine,
    SoftSensorKarstMapper,
    list_available_profiles,
    load_region_profile,
    load_species_profile,
)
from models import (  # noqa: E402
    DigitalTwinSimulationResult,
    IoTAssimilationRequest,
    SimulateRequest,
    SimulationTargetsInput,
    VisualDesignInput,
    WaterInitialAndIoTInput,
)

__all__ = [
    "NacarDigitalTwinEngine",
    "SoftSensorKarstMapper",
    "list_available_profiles",
    "load_region_profile",
    "load_species_profile",
    "VisualDesignInput",
    "WaterInitialAndIoTInput",
    "SimulationTargetsInput",
    "SimulateRequest",
    "IoTAssimilationRequest",
    "DigitalTwinSimulationResult",
]
