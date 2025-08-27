"""
Electric Arc Furnace Simulation Components

This module provides the core components for EAF simulation using the itwinai framework.
It includes physics-based modeling of heat transfer, mass transfer, and chemical reactions.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import logging

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from itwinai.components import BaseComponent, monitor_exec
from itwinai.loggers import Logger, LogMixin


@dataclass
class EAFZone:
    """Represents a zone within the Electric Arc Furnace"""
    name: str
    temperature: float  # Kelvin
    mass: float  # kg
    volume: float  # m³
    density: float  # kg/m³
    specific_heat: float  # J/kg·K
    thermal_conductivity: float  # W/m·K
    emissivity: float  # dimensionless
    materials: Dict[str, float] = field(default_factory=dict)  # material: mass_fraction


@dataclass
class EAFMaterial:
    """Represents a material in the EAF"""
    name: str
    composition: Dict[str, float]  # element: mass_fraction
    melting_point: float  # Kelvin
    boiling_point: float  # Kelvin
    specific_heat_solid: float  # J/kg·K
    specific_heat_liquid: float  # J/kg·K
    latent_heat_fusion: float  # J/kg
    density_solid: float  # kg/m³
    density_liquid: float  # kg/m³


@dataclass
class EAFParameters:
    """Operating parameters for the EAF"""
    arc_voltage: float  # Volts
    arc_current: float  # Amperes
    power_factor: float  # dimensionless
    electrode_position: float  # meters from top
    oxygen_flow_rate: float  # m³/s
    carbon_injection_rate: float  # kg/s
    lime_addition_rate: float  # kg/s
    dolomite_addition_rate: float  # kg/s


class EAFSimulationEngine(BaseComponent, LogMixin):
    """
    Core simulation engine for Electric Arc Furnace operations
    
    This component handles the physics-based modeling of:
    - Heat transfer (radiative, convective, conductive)
    - Mass transfer and chemical reactions
    - Thermal dynamics and phase changes
    - Electrical arc behavior
    """
    
    def __init__(
        self,
        furnace_capacity: float = 150.0,  # tons
        initial_temperature: float = 298.15,  # Kelvin (25°C)
        time_step: float = 1.0,  # seconds
        simulation_duration: float = 3600.0,  # seconds (1 hour)
        name: str = "EAF_Simulation_Engine"
    ):
        super().__init__(name=name)
        self.logger = Logger()
        
        # Simulation parameters
        self.furnace_capacity = furnace_capacity
        self.initial_temperature = initial_temperature
        self.time_step = time_step
        self.simulation_duration = simulation_duration
        self.current_time = 0.0
        
        # Initialize furnace zones
        self.zones = self._initialize_zones()
        
        # Initialize materials database
        self.materials = self._initialize_materials()
        
        # Operating parameters
        self.operating_params = EAFParameters(
            arc_voltage=400.0,
            arc_current=50.0,
            power_factor=0.8,
            electrode_position=2.0,
            oxygen_flow_rate=0.5,
            carbon_injection_rate=0.1,
            lime_addition_rate=0.05,
            dolomite_addition_rate=0.03
        )
        
        # Simulation state
        self.simulation_data = []
        self.is_running = False
        
        # Log initial state
        self.log("info", f"EAF Simulation Engine initialized with capacity: {furnace_capacity} tons")
    
    def _initialize_zones(self) -> Dict[str, EAFZone]:
        """Initialize the different zones of the EAF"""
        zones = {}
        
        # Arc zone (electrode tip to bath surface)
        zones['arc'] = EAFZone(
            name="Arc Zone",
            temperature=5000.0,  # Very high temperature in arc
            mass=0.0,  # Arc has negligible mass
            volume=0.1,
            density=1.0,
            specific_heat=1000.0,
            thermal_conductivity=50.0,
            emissivity=0.9
        )
        
        # Liquid metal zone (molten steel)
        zones['liquid_metal'] = EAFZone(
            name="Liquid Metal",
            temperature=self.initial_temperature,
            mass=self.furnace_capacity * 1000.0,  # Convert tons to kg
            volume=200.0,
            density=7000.0,
            specific_heat=800.0,
            thermal_conductivity=30.0,
            emissivity=0.3,
            materials={'Fe': 0.95, 'C': 0.04, 'Si': 0.01}
        )
        
        # Slag zone (floating on metal)
        zones['slag'] = EAFZone(
            name="Slag Layer",
            temperature=self.initial_temperature,
            mass=50.0,
            volume=10.0,
            density=3000.0,
            specific_heat=1200.0,
            thermal_conductivity=2.0,
            emissivity=0.8,
            materials={'CaO': 0.4, 'SiO2': 0.3, 'FeO': 0.2, 'MgO': 0.1}
        )
        
        # Refractory lining
        zones['refractory'] = EAFZone(
            name="Refractory Lining",
            temperature=self.initial_temperature,
            mass=1000.0,
            volume=50.0,
            density=2500.0,
            specific_heat=1000.0,
            thermal_conductivity=2.0,
            emissivity=0.7
        )
        
        return zones
    
    def _initialize_materials(self) -> Dict[str, EAFMaterial]:
        """Initialize the materials database"""
        materials = {}
        
        # Steel scrap
        materials['steel_scrap'] = EAFMaterial(
            name="Steel Scrap",
            composition={'Fe': 0.98, 'C': 0.02},
            melting_point=1811.0,
            boiling_point=3134.0,
            specific_heat_solid=460.0,
            specific_heat_liquid=800.0,
            latent_heat_fusion=13800.0,
            density_solid=7850.0,
            density_liquid=7000.0
        )
        
        # Direct Reduced Iron (DRI)
        materials['dri'] = EAFMaterial(
            name="DRI",
            composition={'Fe': 0.92, 'C': 0.05, 'O': 0.03},
            melting_point=1811.0,
            boiling_point=3134.0,
            specific_heat_solid=460.0,
            specific_heat_liquid=800.0,
            latent_heat_fusion=13800.0,
            density_solid=5000.0,
            density_liquid=7000.0
        )
        
        # Lime (CaO)
        materials['lime'] = EAFMaterial(
            name="Lime",
            composition={'Ca': 0.71, 'O': 0.29},
            melting_point=2886.0,
            boiling_point=4123.0,
            specific_heat_solid=920.0,
            specific_heat_liquid=920.0,
            latent_heat_fusion=0.0,
            density_solid=3340.0,
            density_liquid=3340.0
        )
        
        # Dolomite (CaMg(CO3)2)
        materials['dolomite'] = EAFMaterial(
            name="Dolomite",
            composition={'Ca': 0.22, 'Mg': 0.13, 'C': 0.13, 'O': 0.52},
            melting_point=2573.0,
            boiling_point=3000.0,
            specific_heat_solid=920.0,
            specific_heat_liquid=920.0,
            latent_heat_fusion=0.0,
            density_solid=2840.0,
            density_liquid=2840.0
        )
        
        return materials
    
    @monitor_exec
    def execute(self) -> Dict[str, Any]:
        """Execute the EAF simulation"""
        self.log("info", "Starting EAF simulation")
        self.is_running = True
        
        # Main simulation loop
        while self.current_time < self.simulation_duration and self.is_running:
            # Update simulation state
            self._update_simulation_step()
            
            # Record data
            self._record_simulation_data()
            
            # Advance time
            self.current_time += self.time_step
            
            # Log progress
            if int(self.current_time) % 60 == 0:  # Every minute
                self.log("info", f"Simulation time: {self.current_time:.0f}s")
        
        self.log("info", "EAF simulation completed")
        return self._get_simulation_results()
    
    def _update_simulation_step(self):
        """Update simulation state for one time step"""
        # Calculate heat generation from electric arc
        arc_power = self._calculate_arc_power()
        
        # Update temperatures in all zones
        self._update_temperatures(arc_power)
        
        # Update chemical reactions
        self._update_chemical_reactions()
        
        # Update material properties and phase changes
        self._update_material_properties()
        
        # Update mass balances
        self._update_mass_balances()
    
    def _calculate_arc_power(self) -> float:
        """Calculate power generated by the electric arc"""
        apparent_power = self.operating_params.arc_voltage * self.operating_params.arc_current
        real_power = apparent_power * self.operating_params.power_factor
        
        # Arc efficiency (typically 85-95%)
        arc_efficiency = 0.9
        effective_power = real_power * arc_efficiency
        
        return effective_power
    
    def _calculate_energy_balance(self) -> Dict[str, float]:
        """Calculate comprehensive energy balance for the EAF"""
        # Energy inputs
        electrical_energy = self._calculate_arc_power() * self.time_step * 0.001  # kWh
        
        # Chemical energy from reactions (based on research paper)
        chemical_energy = 0.0
        
        # Carbon oxidation: C + 1/2 O2 → CO (exothermic)
        if 'C' in self.zones['liquid_metal'].materials:
            carbon_mass = self.zones['liquid_metal'].materials['C'] * self.zones['liquid_metal'].mass
            carbon_oxidation_energy = carbon_mass * 9200.0  # kJ/kg C oxidized
            chemical_energy += carbon_oxidation_energy * 0.001  # Convert to kWh
        
        # Silicon oxidation: Si + O2 → SiO2 (exothermic)
        if 'Si' in self.zones['liquid_metal'].materials:
            silicon_mass = self.zones['liquid_metal'].materials['Si'] * self.zones['liquid_metal'].mass
            silicon_oxidation_energy = silicon_mass * 31000.0  # kJ/kg Si oxidized
            chemical_energy += silicon_oxidation_energy * 0.001  # Convert to kWh
        
        # Energy outputs
        # Sensible heat to liquid metal
        metal_heat_capacity = self.zones['liquid_metal'].specific_heat
        metal_mass = self.zones['liquid_metal'].mass
        temperature_rise = self.zones['liquid_metal'].temperature - 298.15  # K
        sensible_heat_metal = metal_heat_capacity * metal_mass * temperature_rise * 0.001  # kWh
        
        # Sensible heat to slag
        slag_heat_capacity = self.zones['slag'].specific_heat
        slag_mass = self.zones['slag'].mass
        slag_temperature_rise = self.zones['slag'].temperature - 298.15  # K
        sensible_heat_slag = slag_heat_capacity * slag_mass * slag_temperature_rise * 0.001  # kWh
        
        # Heat loss to refractory and cooling
        refractory_heat_loss = self.zones['refractory'].thermal_conductivity * 0.1  # Simplified calculation
        cooling_loss = 50.0  # kW (typical for EAF cooling systems)
        total_heat_loss = (refractory_heat_loss + cooling_loss) * self.time_step * 0.001  # kWh
        
        # Off-gas energy (simplified)
        off_gas_energy = 0.1 * (electrical_energy + chemical_energy)  # 10% of input energy
        
        # Energy balance
        total_input = electrical_energy + chemical_energy
        total_output = sensible_heat_metal + sensible_heat_slag + total_heat_loss + off_gas_energy
        energy_efficiency = (sensible_heat_metal / total_input) * 100 if total_input > 0 else 0
        
        return {
            "electrical_energy": electrical_energy,
            "chemical_energy": chemical_energy,
            "total_input": total_input,
            "sensible_heat_metal": sensible_heat_metal,
            "sensible_heat_slag": sensible_heat_slag,
            "heat_loss": total_heat_loss,
            "off_gas_energy": off_gas_energy,
            "total_output": total_output,
            "energy_efficiency": energy_efficiency
        }
    
    def _calculate_mass_balance(self) -> Dict[str, float]:
        """Calculate mass balance for the EAF process"""
        # Input materials
        total_input_mass = sum(zone.mass for zone in self.zones.values())
        
        # Material consumption during process
        # Carbon consumption (oxidation)
        carbon_consumption = 0.0
        if 'C' in self.zones['liquid_metal'].materials:
            carbon_consumption = self.zones['liquid_metal'].materials['C'] * self.zones['liquid_metal'].mass * 0.1  # 10% oxidation rate
        
        # Silicon consumption (oxidation)
        silicon_consumption = 0.0
        if 'Si' in self.zones['liquid_metal'].materials:
            silicon_consumption = self.zones['liquid_metal'].materials['Si'] * self.zones['liquid_metal'].mass * 0.8  # 80% oxidation rate
        
        # Slag formation
        slag_formation = carbon_consumption * 0.5 + silicon_consumption * 0.3  # Simplified
        
        # Off-gas formation
        off_gas_formation = carbon_consumption * 0.5 + silicon_consumption * 0.7
        
        # Mass balance
        total_output_mass = total_input_mass - carbon_consumption - silicon_consumption + slag_formation
        mass_balance_error = abs(total_input_mass - total_output_mass)
        
        return {
            "total_input_mass": total_input_mass,
            "carbon_consumption": carbon_consumption,
            "silicon_consumption": silicon_consumption,
            "slag_formation": slag_formation,
            "off_gas_formation": off_gas_formation,
            "total_output_mass": total_output_mass,
            "mass_balance_error": mass_balance_error
        }
    
    def _update_temperatures(self, arc_power: float):
        """Update temperatures in all zones based on heat transfer"""
        # Heat transfer from arc to liquid metal
        arc_to_metal_heat = arc_power * 0.7  # 70% of arc power goes to metal
        
        # Update liquid metal temperature
        metal_zone = self.zones['liquid_metal']
        heat_capacity = metal_zone.mass * metal_zone.specific_heat
        temperature_change = (arc_to_metal_heat * self.time_step) / heat_capacity
        metal_zone.temperature += temperature_change
        
        # Heat transfer to slag
        metal_to_slag_heat = arc_power * 0.2  # 20% to slag
        slag_zone = self.zones['slag']
        slag_heat_capacity = slag_zone.mass * slag_zone.specific_heat
        slag_temperature_change = (metal_to_slag_heat * self.time_step) / slag_heat_capacity
        slag_zone.temperature += slag_temperature_change
        
        # Heat transfer to refractory (10% of arc power)
        refractory_heat = arc_power * 0.1
        refractory_zone = self.zones['refractory']
        refractory_heat_capacity = refractory_zone.mass * refractory_zone.specific_heat
        refractory_temperature_change = (refractory_heat * self.time_step) / refractory_heat_capacity
        refractory_zone.temperature += refractory_temperature_change
    
    def _update_chemical_reactions(self):
        """Update chemical reactions in the furnace"""
        metal_zone = self.zones['liquid_metal']
        slag_zone = self.zones['slag']
        
        # Carbon oxidation (C + O2 -> CO2)
        if metal_zone.temperature > 1200.0:  # Above 1200°C
            carbon_oxidation_rate = 0.001 * self.time_step  # kg/s
            if 'C' in metal_zone.materials and metal_zone.materials['C'] > 0:
                metal_zone.materials['C'] = max(0, metal_zone.materials['C'] - carbon_oxidation_rate)
        
        # Silicon oxidation (Si + O2 -> SiO2)
        if metal_zone.temperature > 1400.0:  # Above 1400°C
            silicon_oxidation_rate = 0.0005 * self.time_step  # kg/s
            if 'Si' in metal_zone.materials and metal_zone.materials['Si'] > 0:
                metal_zone.materials['Si'] = max(0, metal_zone.materials['Si'] - silicon_oxidation_rate)
                # Add SiO2 to slag
                if 'SiO2' not in slag_zone.materials:
                    slag_zone.materials['SiO2'] = 0
                slag_zone.materials['SiO2'] += silicon_oxidation_rate
    
    def _update_material_properties(self):
        """Update material properties based on temperature and phase changes"""
        metal_zone = self.zones['liquid_metal']
        
        # Check for melting of scrap steel
        if metal_zone.temperature > 1811.0:  # Melting point of iron
            # Update density from solid to liquid
            metal_zone.density = 7000.0  # Liquid steel density
            metal_zone.specific_heat = 800.0  # Liquid steel specific heat
    
    def _update_mass_balances(self):
        """Update mass balances for all zones"""
        # Material additions (simplified)
        if self.operating_params.lime_addition_rate > 0:
            slag_zone = self.zones['slag']
            lime_addition = self.operating_params.lime_addition_rate * self.time_step
            slag_zone.mass += lime_addition
            if 'CaO' not in slag_zone.materials:
                slag_zone.materials['CaO'] = 0
            slag_zone.materials['CaO'] += lime_addition
        
        # Carbon injection
        if self.operating_params.carbon_injection_rate > 0:
            metal_zone = self.zones['liquid_metal']
            carbon_addition = self.operating_params.carbon_injection_rate * self.time_step
            metal_zone.mass += carbon_addition
            if 'C' not in metal_zone.materials:
                metal_zone.materials['C'] = 0
            metal_zone.materials['C'] += carbon_addition
    
    def _record_simulation_data(self):
        """Record current simulation state"""
        data_point = {
            'timestamp': self.current_time,
            'arc_power': self._calculate_arc_power(),
            'metal_temperature': self.zones['liquid_metal'].temperature,
            'slag_temperature': self.zones['slag'].temperature,
            'refractory_temperature': self.zones['refractory'].temperature,
            'metal_mass': self.zones['liquid_metal'].mass,
            'slag_mass': self.zones['slag'].mass,
            'carbon_content': self.zones['liquid_metal'].materials.get('C', 0),
            'silicon_content': self.zones['liquid_metal'].materials.get('Si', 0)
        }
        self.simulation_data.append(data_point)
    
    def _get_simulation_results(self) -> Dict[str, Any]:
        """Get final simulation results"""
        df = pd.DataFrame(self.simulation_data)
        
        return {
            'simulation_data': df,
            'final_state': {
                'metal_temperature': self.zones['liquid_metal'].temperature,
                'slag_temperature': self.zones['slag'].temperature,
                'metal_composition': self.zones['liquid_metal'].materials,
                'slag_composition': self.zones['slag'].materials,
                'total_energy_consumed': df['arc_power'].sum() * self.time_step,
                'average_power': df['arc_power'].mean()
            },
            'zones': {name: {
                'temperature': zone.temperature,
                'mass': zone.mass,
                'materials': zone.materials
            } for name, zone in self.zones.items()}
        }
    
    def set_operating_parameters(self, params: EAFParameters):
        """Update operating parameters during simulation"""
        self.operating_params = params
        self.log("info", "Operating parameters updated")
    
    def add_material(self, material_name: str, amount: float, zone: str = 'liquid_metal'):
        """Add material to a specific zone"""
        if zone in self.zones and material_name in self.materials:
            self.zones[zone].mass += amount
            if material_name not in self.zones[zone].materials:
                self.zones[zone].materials[material_name] = 0
            self.zones[zone].materials[material_name] += amount
            self.log("info", f"Added {amount} kg of {material_name} to {zone}")
    
    def stop_simulation(self):
        """Stop the simulation"""
        self.is_running = False
        self.log("info", "Simulation stopped by user")


class EAFDataLogger(BaseComponent, LogMixin):
    """Component for logging EAF simulation data"""
    
    def __init__(self, log_interval: float = 1.0, name: str = "EAF_Data_Logger"):
        super().__init__(name=name)
        self.logger = Logger()
        self.log_interval = log_interval
        self.logged_data = []
    
    @monitor_exec
    def execute(self, simulation_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Log simulation data with timestamps"""
        self.log("info", f"Logging {len(simulation_data)} data points")
        
        for data_point in simulation_data:
            logged_point = {
                'timestamp': datetime.now().isoformat(),
                'simulation_time': data_point['timestamp'],
                **data_point
            }
            self.logged_data.append(logged_point)
        
        return {
            'logged_points': len(self.logged_data),
            'data': self.logged_data
        }


class EAFVisualizationComponent(BaseComponent, LogMixin):
    """Component for generating visualization data"""
    
    def __init__(self, name: str = "EAF_Visualization"):
        super().__init__(name=name)
        self.logger = Logger()
    
    @monitor_exec
    def execute(self, simulation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate visualization data for the frontend"""
        self.log("info", "Generating visualization data")
        
        df = simulation_results['simulation_data']
        
        # Generate time series data for charts
        time_series = {
            'temperatures': {
                'x': df['timestamp'].tolist(),
                'y': {
                    'Metal': df['metal_temperature'].tolist(),
                    'Slag': df['slag_temperature'].tolist(),
                    'Refractory': df['refractory_temperature'].tolist()
                }
            },
            'power': {
                'x': df['timestamp'].tolist(),
                'y': df['arc_power'].tolist()
            },
            'composition': {
                'x': df['timestamp'].tolist(),
                'y': {
                    'Carbon': df['carbon_content'].tolist(),
                    'Silicon': df['silicon_content'].tolist()
                }
            }
        }
        
        # Generate 3D visualization data
        zone_data = {
            'arc': {
                'position': [0, 0, 5],
                'temperature': simulation_results['zones']['arc']['temperature'],
                'color': [1.0, 0.0, 0.0]  # Red for hot
            },
            'liquid_metal': {
                'position': [0, 0, 0],
                'temperature': simulation_results['zones']['liquid_metal']['temperature'],
                'color': [0.8, 0.4, 0.0]  # Orange for molten metal
            },
            'slag': {
                'position': [0, 0, 1],
                'temperature': simulation_results['zones']['slag']['temperature'],
                'color': [0.6, 0.6, 0.6]  # Gray for slag
            }
        }
        
        return {
            'time_series': time_series,
            'zone_data': zone_data,
            'summary_stats': {
                'max_temperature': df['metal_temperature'].max(),
                'min_temperature': df['metal_temperature'].min(),
                'total_energy': df['arc_power'].sum() * simulation_results['simulation_data']['timestamp'].iloc[1],
                'average_power': df['arc_power'].mean()
            }
        }
