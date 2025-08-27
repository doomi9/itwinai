"""
Electric Arc Furnace Simulator

A comprehensive, real-time visual simulator for Electric Arc Furnace operations
built with itwinai framework and modern web technologies.
"""

__version__ = "1.0.0"
__author__ = "EAF Simulator Team"
__description__ = "AI and ML workflows module for scientific digital twins with EAF simulation"

from .components import (
    EAFSimulationEngine,
    EAFDataLogger,
    EAFVisualizationComponent,
    EAFZone,
    EAFMaterial,
    EAFParameters
)

from .pipeline import (
    EAFSimulationPipeline,
    EAFControlPipeline,
    create_eaf_pipeline_from_config,
    save_pipeline_results
)

__all__ = [
    "EAFSimulationEngine",
    "EAFDataLogger", 
    "EAFVisualizationComponent",
    "EAFZone",
    "EAFMaterial",
    "EAFParameters",
    "EAFSimulationPipeline",
    "EAFControlPipeline",
    "create_eaf_pipeline_from_config",
    "save_pipeline_results"
]
