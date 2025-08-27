"""
Electric Arc Furnace Simulation Pipeline

This module defines the pipeline for EAF simulation using the itwinai framework.
It orchestrates the simulation engine, data logging, and visualization components.
"""

from typing import Dict, Any, List
import yaml
import json
from pathlib import Path

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from itwinai.pipeline import Pipeline
from itwinai.components import BaseComponent

from .components import (
    EAFSimulationEngine,
    EAFDataLogger,
    EAFVisualizationComponent,
    EAFParameters
)


class EAFSimulationPipeline(Pipeline):
    """
    Complete pipeline for Electric Arc Furnace simulation
    
    This pipeline orchestrates:
    1. EAF simulation engine
    2. Data logging and storage
    3. Visualization data generation
    4. Real-time monitoring
    """
    
    def __init__(
        self,
        furnace_capacity: float = 150.0,
        simulation_duration: float = 3600.0,
        time_step: float = 1.0,
        name: str = "EAF_Simulation_Pipeline"
    ):
        # Initialize components
        simulation_engine = EAFSimulationEngine(
            furnace_capacity=furnace_capacity,
            simulation_duration=simulation_duration,
            time_step=time_step
        )
        
        data_logger = EAFDataLogger(log_interval=time_step)
        visualization = EAFVisualizationComponent()
        
        # Define pipeline steps
        steps = {
            'simulation': simulation_engine,
            'logging': data_logger,
            'visualization': visualization
        }
        
        super().__init__(steps=steps, name=name)
    
    def execute(self) -> Dict[str, Any]:
        """Execute the complete EAF simulation pipeline"""
        # Execute simulation
        simulation_results = self.steps['simulation'].execute()
        
        # Log data
        logging_results = self.steps['logging'].execute(simulation_results['simulation_data'])
        
        # Generate visualization data
        viz_results = self.steps['visualization'].execute(simulation_results)
        
        # Combine results
        pipeline_results = {
            'simulation': simulation_results,
            'logging': logging_results,
            'visualization': viz_results,
            'pipeline_metadata': {
                'name': self.name,
                'steps_executed': list(self.steps.keys()),
                'total_execution_time': simulation_results.get('execution_time', 0)
            }
        }
        
        return pipeline_results


class EAFControlPipeline(Pipeline):
    """
    Pipeline for real-time EAF control and monitoring
    
    This pipeline handles:
    1. Real-time parameter updates
    2. Continuous monitoring
    3. Control system responses
    4. Safety monitoring
    """
    
    def __init__(self, name: str = "EAF_Control_Pipeline"):
        # For real-time control, we'll use a different approach
        # This is a placeholder for the control system
        steps = {}
        super().__init__(steps=steps, name=name)
    
    def update_parameters(self, params: EAFParameters) -> Dict[str, Any]:
        """Update operating parameters in real-time"""
        # This would interface with the running simulation
        return {"status": "parameters_updated", "params": params}


def create_eaf_pipeline_from_config(config_path: str) -> EAFSimulationPipeline:
    """Create EAF pipeline from configuration file"""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    # Extract parameters from config
    furnace_capacity = config.get('furnace_capacity', 150.0)
    simulation_duration = config.get('simulation_duration', 3600.0)
    time_step = config.get('time_step', 1.0)
    
    # Create and return pipeline
    return EAFSimulationPipeline(
        furnace_capacity=furnace_capacity,
        simulation_duration=simulation_duration,
        time_step=time_step
    )


def save_pipeline_results(results: Dict[str, Any], output_dir: str):
    """Save pipeline results to files"""
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Save simulation data as CSV
    if 'simulation' in results and 'simulation_data' in results['simulation']:
        df = results['simulation']['simulation_data']
        df.to_csv(output_path / 'simulation_data.csv', index=False)
    
    # Save visualization data as JSON
    if 'visualization' in results:
        with open(output_path / 'visualization_data.json', 'w') as f:
            json.dump(results['visualization'], f, indent=2)
    
    # Save complete results summary
    summary = {
        'pipeline_metadata': results.get('pipeline_metadata', {}),
        'final_state': results.get('simulation', {}).get('final_state', {}),
        'summary_stats': results.get('visualization', {}).get('summary_stats', {})
    }
    
    with open(output_path / 'results_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)


# Example configuration file structure
EXAMPLE_CONFIG = {
    'furnace_capacity': 150.0,  # tons
    'simulation_duration': 3600.0,  # seconds
    'time_step': 1.0,  # seconds
    'operating_parameters': {
        'arc_voltage': 400.0,  # Volts
        'arc_current': 50.0,  # Amperes
        'power_factor': 0.8,
        'electrode_position': 2.0,  # meters
        'oxygen_flow_rate': 0.5,  # m³/s
        'carbon_injection_rate': 0.1,  # kg/s
        'lime_addition_rate': 0.05,  # kg/s
        'dolomite_addition_rate': 0.03  # kg/s
    },
    'materials': {
        'initial_scrap': 100.0,  # tons
        'initial_dri': 50.0,  # tons
        'lime_reserve': 10.0,  # tons
        'dolomite_reserve': 5.0  # tons
    },
    'monitoring': {
        'log_interval': 1.0,  # seconds
        'save_interval': 60.0,  # seconds
        'alert_thresholds': {
            'max_temperature': 2000.0,  # Kelvin
            'min_temperature': 298.0,  # Kelvin
            'max_power': 100000.0,  # Watts
            'min_carbon': 0.01  # mass fraction
        }
    }
}


def create_example_config(output_path: str = "eaf_config.yaml"):
    """Create an example configuration file"""
    with open(output_path, 'w') as f:
        yaml.dump(EXAMPLE_CONFIG, f, default_flow_style=False, indent=2)
    
    print(f"Example configuration saved to {output_path}")


if __name__ == "__main__":
    # Example usage
    create_example_config()
    
    # Create and run pipeline
    pipeline = EAFSimulationPipeline()
    results = pipeline.execute()
    
    # Save results
    save_pipeline_results(results, "eaf_results")
    
    print("EAF simulation completed successfully!")
    print(f"Results saved to eaf_results/ directory")
