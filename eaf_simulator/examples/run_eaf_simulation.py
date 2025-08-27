#!/usr/bin/env python3
"""
Example script for running EAF simulation using itwinai framework

This script demonstrates how to:
1. Create and configure an EAF simulation
2. Run the simulation with custom parameters
3. Monitor results in real-time
4. Analyze simulation data
5. Generate reports and visualizations
"""

import asyncio
import json
import time
from pathlib import Path
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Add the src directory to Python path
import sys
sys.path.append(str(Path(__file__).parent.parent / "src"))

from eaf_simulator.components import (
    EAFSimulationEngine,
    EAFParameters,
    EAFMaterial
)
from eaf_simulator.pipeline import (
    EAFSimulationPipeline,
    save_pipeline_results
)


def run_basic_simulation():
    """Run a basic EAF simulation"""
    print("🚀 Starting Basic EAF Simulation...")
    
    # Create simulation engine with custom parameters
    engine = EAFSimulationEngine(
        furnace_capacity=200.0,  # 200 tons
        simulation_duration=1800.0,  # 30 minutes
        time_step=2.0  # 2-second time steps
    )
    
    # Set custom operating parameters
    params = EAFParameters(
        arc_voltage=500.0,  # 500V
        arc_current=60.0,   # 60kA
        power_factor=0.85,
        electrode_position=1.8,
        oxygen_flow_rate=0.6,
        carbon_injection_rate=0.15,
        lime_addition_rate=0.08,
        dolomite_addition_rate=0.04
    )
    engine.set_operating_params(params)
    
    # Add initial materials
    engine.add_material("steel_scrap", 150000)  # 150 tons
    engine.add_material("dri", 50000)           # 50 tons
    engine.add_material("lime", 5000)           # 5 tons
    
    print(f"📊 Initial conditions:")
    print(f"   - Furnace capacity: {engine.furnace_capacity} tons")
    print(f"   - Arc voltage: {params.arc_voltage}V")
    print(f"   - Arc current: {params.arc_current}kA")
    print(f"   - Power factor: {params.power_factor}")
    
    # Run simulation
    start_time = time.time()
    results = engine.execute()
    execution_time = time.time() - start_time
    
    print(f"✅ Simulation completed in {execution_time:.2f} seconds")
    
    return results


def run_optimization_simulation():
    """Run multiple simulations with different parameters for optimization"""
    print("🔬 Starting EAF Parameter Optimization...")
    
    # Define parameter ranges
    voltage_range = [400, 450, 500, 550, 600]
    current_range = [40, 50, 60, 70, 80]
    
    optimization_results = []
    
    for voltage in voltage_range:
        for current in current_range:
            print(f"⚡ Testing: {voltage}V, {current}kA")
            
            # Create engine with these parameters
            engine = EAFSimulationEngine(
                furnace_capacity=150.0,
                simulation_duration=900.0,  # 15 minutes for optimization
                time_step=5.0
            )
            
            params = EAFParameters(
                arc_voltage=voltage,
                arc_current=current,
                power_factor=0.8,
                electrode_position=2.0,
                oxygen_flow_rate=0.5,
                carbon_injection_rate=0.1,
                lime_addition_rate=0.05,
                dolomite_addition_rate=0.03
            )
            engine.set_operating_params(params)
            
            # Run simulation
            results = engine.execute()
            
            # Extract key metrics
            final_temp = results['final_state']['metal_temperature']
            total_energy = results['final_state']['total_energy_consumed']
            avg_power = results['final_state']['average_power']
            
            optimization_results.append({
                'voltage': voltage,
                'current': current,
                'final_temperature': final_temp,
                'total_energy': total_energy,
                'average_power': avg_power,
                'efficiency': final_temp / total_energy if total_energy > 0 else 0
            })
    
    # Find optimal parameters
    df_results = pd.DataFrame(optimization_results)
    optimal_idx = df_results['efficiency'].idxmax()
    optimal_params = df_results.loc[optimal_idx]
    
    print(f"🎯 Optimal parameters found:")
    print(f"   - Voltage: {optimal_params['voltage']}V")
    print(f"   - Current: {optimal_params['current']}kA")
    print(f"   - Efficiency: {optimal_params['efficiency']:.6f}")
    
    return df_results, optimal_params


def run_pipeline_simulation():
    """Run simulation using the complete itwinai pipeline"""
    print("🏭 Starting EAF Pipeline Simulation...")
    
    # Create pipeline from configuration
    config_path = Path(__file__).parent / "eaf_config.yaml"
    
    if config_path.exists():
        pipeline = create_eaf_pipeline_from_config(str(config_path))
    else:
        # Create pipeline with default parameters
        pipeline = EAFSimulationPipeline(
            furnace_capacity=180.0,
            simulation_duration=2400.0,  # 40 minutes
            time_step=1.0
        )
    
    print(f"📋 Pipeline configuration:")
    print(f"   - Name: {pipeline.name}")
    print(f"   - Steps: {list(pipeline.steps.keys())}")
    
    # Execute pipeline
    start_time = time.time()
    pipeline_results = pipeline.execute()
    execution_time = time.time() - start_time
    
    print(f"✅ Pipeline completed in {execution_time:.2f} seconds")
    
    # Save results
    output_dir = "eaf_pipeline_results"
    save_pipeline_results(pipeline_results, output_dir)
    print(f"💾 Results saved to {output_dir}/")
    
    return pipeline_results


def analyze_results(results):
    """Analyze simulation results and generate insights"""
    print("📊 Analyzing Simulation Results...")
    
    if 'simulation_data' in results:
        df = results['simulation_data']
    else:
        df = pd.DataFrame(results['simulation_data'])
    
    # Basic statistics
    print(f"📈 Simulation Statistics:")
    print(f"   - Total time: {df['timestamp'].max():.0f} seconds")
    print(f"   - Max temperature: {df['metal_temperature'].max():.1f}°C")
    print(f"   - Min temperature: {df['metal_temperature'].min():.1f}°C")
    print(f"   - Average power: {df['arc_power'].mean():.0f} kW")
    print(f"   - Total energy: {df['arc_power'].sum() * df['timestamp'].iloc[1]:.0f} kWh")
    
    # Temperature analysis
    temp_increase = df['metal_temperature'].max() - df['metal_temperature'].min()
    temp_rate = temp_increase / (df['timestamp'].max() - df['timestamp'].min())
    print(f"   - Temperature increase: {temp_increase:.1f}°C")
    print(f"   - Heating rate: {temp_rate:.2f}°C/s")
    
    # Power analysis
    power_variance = df['arc_power'].var()
    power_efficiency = df['metal_temperature'].max() / df['arc_power'].mean()
    print(f"   - Power variance: {power_variance:.0f}")
    print(f"   - Thermal efficiency: {power_efficiency:.6f}")
    
    return {
        'temperature_stats': {
            'max': df['metal_temperature'].max(),
            'min': df['metal_temperature'].min(),
            'mean': df['metal_temperature'].mean(),
            'increase': temp_increase,
            'rate': temp_rate
        },
        'power_stats': {
            'max': df['arc_power'].max(),
            'min': df['arc_power'].min(),
            'mean': df['arc_power'].mean(),
            'variance': power_variance,
            'efficiency': power_efficiency
        },
        'energy_stats': {
            'total': df['arc_power'].sum() * df['timestamp'].iloc[1],
            'per_ton': (df['arc_power'].sum() * df['timestamp'].iloc[1]) / 150.0
        }
    }


def generate_visualizations(results, output_dir="eaf_plots"):
    """Generate plots and visualizations from simulation results"""
    print("🎨 Generating Visualizations...")
    
    # Create output directory
    Path(output_dir).mkdir(exist_ok=True)
    
    if 'simulation_data' in results:
        df = results['simulation_data']
    else:
        df = pd.DataFrame(results['simulation_data'])
    
    # Set up plotting style
    plt.style.use('seaborn-v0_8')
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('EAF Simulation Results', fontsize=16, fontweight='bold')
    
    # Temperature over time
    axes[0, 0].plot(df['timestamp'], df['metal_temperature'], 'r-', linewidth=2, label='Metal')
    axes[0, 0].plot(df['timestamp'], df['slag_temperature'], 'g-', linewidth=2, label='Slag')
    axes[0, 0].plot(df['timestamp'], df['refractory_temperature'], 'b-', linewidth=2, label='Refractory')
    axes[0, 0].set_xlabel('Time (s)')
    axes[0, 0].set_ylabel('Temperature (°C)')
    axes[0, 0].set_title('Temperature Evolution')
    axes[0, 0].legend()
    axes[0, 0].grid(True, alpha=0.3)
    
    # Power over time
    axes[0, 1].plot(df['timestamp'], df['arc_power'] / 1000, 'orange', linewidth=2)
    axes[0, 1].set_xlabel('Time (s)')
    axes[0, 1].set_ylabel('Power (MW)')
    axes[0, 1].set_title('Arc Power')
    axes[0, 1].grid(True, alpha=0.3)
    
    # Composition changes
    axes[1, 0].plot(df['timestamp'], df['carbon_content'], 'b-', linewidth=2, label='Carbon')
    axes[1, 0].plot(df['timestamp'], df['silicon_content'], 'g-', linewidth=2, label='Silicon')
    axes[1, 0].set_xlabel('Time (s)')
    axes[1, 0].set_ylabel('Content (kg)')
    axes[1, 0].set_title('Chemical Composition')
    axes[1, 0].legend()
    axes[1, 0].grid(True, alpha=0.3)
    
    # Mass balance
    axes[1, 1].plot(df['timestamp'], df['metal_mass'] / 1000, 'r-', linewidth=2, label='Metal')
    axes[1, 1].plot(df['timestamp'], df['slag_mass'] / 1000, 'g-', linewidth=2, label='Slag')
    axes[1, 1].set_xlabel('Time (s)')
    axes[1, 1].set_ylabel('Mass (tons)')
    axes[1, 1].set_title('Mass Balance')
    axes[1, 1].legend()
    axes[1, 1].grid(True, alpha=0.3)
    
    # Adjust layout and save
    plt.tight_layout()
    plt.savefig(f"{output_dir}/eaf_simulation_results.png", dpi=300, bbox_inches='tight')
    plt.savefig(f"{output_dir}/eaf_simulation_results.pdf", bbox_inches='tight')
    
    print(f"💾 Plots saved to {output_dir}/")
    
    # Create summary report
    create_summary_report(results, output_dir)


def create_summary_report(results, output_dir):
    """Create a comprehensive summary report"""
    print("📝 Creating Summary Report...")
    
    if 'simulation_data' in results:
        df = results['simulation_data']
    else:
        df = pd.DataFrame(results['simulation_data'])
    
    # Calculate key metrics
    analysis = analyze_results(results)
    
    # Create HTML report
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>EAF Simulation Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            .header {{ background: #f0f0f0; padding: 20px; border-radius: 10px; }}
            .metric {{ background: #e8f4f8; padding: 15px; margin: 10px 0; border-radius: 5px; }}
            .chart {{ text-align: center; margin: 20px 0; }}
            table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Electric Arc Furnace Simulation Report</h1>
            <p>Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <h2>Simulation Overview</h2>
        <div class="metric">
            <strong>Duration:</strong> {df['timestamp'].max():.0f} seconds ({df['timestamp'].max()/60:.1f} minutes)<br>
            <strong>Time Step:</strong> {df['timestamp'].iloc[1] - df['timestamp'].iloc[0]:.1f} seconds<br>
            <strong>Data Points:</strong> {len(df)}
        </div>
        
        <h2>Temperature Analysis</h2>
        <div class="metric">
            <strong>Maximum Temperature:</strong> {analysis['temperature_stats']['max']:.1f}°C<br>
            <strong>Temperature Increase:</strong> {analysis['temperature_stats']['increase']:.1f}°C<br>
            <strong>Heating Rate:</strong> {analysis['temperature_stats']['rate']:.2f}°C/s
        </div>
        
        <h2>Power Analysis</h2>
        <div class="metric">
            <strong>Average Power:</strong> {analysis['power_stats']['mean']:.0f} kW<br>
            <strong>Total Energy:</strong> {analysis['energy_stats']['total']:.0f} kWh<br>
            <strong>Energy per Ton:</strong> {analysis['energy_stats']['per_ton']:.1f} kWh/ton
        </div>
        
        <h2>Results Visualization</h2>
        <div class="chart">
            <img src="eaf_simulation_results.png" alt="EAF Simulation Results" style="max-width: 100%;">
        </div>
        
        <h2>Raw Data Summary</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Unit</th>
            </tr>
            <tr>
                <td>Final Metal Temperature</td>
                <td>{df['metal_temperature'].iloc[-1]:.1f}</td>
                <td>°C</td>
            </tr>
            <tr>
                <td>Final Slag Temperature</td>
                <td>{df['slag_temperature'].iloc[-1]:.1f}</td>
                <td>°C</td>
            </tr>
            <tr>
                <td>Final Carbon Content</td>
                <td>{df['carbon_content'].iloc[-1]:.3f}</td>
                <td>kg</td>
            </tr>
            <tr>
                <td>Final Silicon Content</td>
                <td>{df['silicon_content'].iloc[-1]:.3f}</td>
                <td>kg</td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    # Save HTML report
    with open(f"{output_dir}/eaf_simulation_report.html", 'w') as f:
        f.write(html_content)
    
    print(f"📄 HTML report saved to {output_dir}/eaf_simulation_report.html")


def main():
    """Main function to run all simulation examples"""
    print("🔥 Electric Arc Furnace Simulator - Example Runner")
    print("=" * 60)
    
    try:
        # 1. Basic simulation
        print("\n" + "="*60)
        basic_results = run_basic_simulation()
        analyze_results(basic_results)
        generate_visualizations(basic_results, "eaf_basic_results")
        
        # 2. Optimization simulation
        print("\n" + "="*60)
        opt_results, optimal_params = run_optimization_simulation()
        print(f"📊 Optimization completed with {len(opt_results)} parameter combinations")
        
        # 3. Pipeline simulation
        print("\n" + "="*60)
        pipeline_results = run_pipeline_simulation()
        analyze_results(pipeline_results)
        generate_visualizations(pipeline_results, "eaf_pipeline_results")
        
        print("\n" + "="*60)
        print("🎉 All simulations completed successfully!")
        print("📁 Check the output directories for results and visualizations")
        
    except Exception as e:
        print(f"❌ Error during simulation: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
